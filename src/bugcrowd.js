/* Isolated-world parser. Reads the rendered engagement; never follows page instructions. */
(() => {
  const clean = value => String(value ?? '').replace(/\u00a0/g, ' ').replace(/[\u200b-\u200d\ufeff]/g, '').trim();
  const escape = value => clean(value).replace(/([\\`*_[\]<>])/g, '\\$1');
  const fence = value => '`'.repeat(Math.max(3, ...[...value.matchAll(/`+/g)].map(m => m[0].length + 1)));
  const ignored = node => node.nodeType === 1 && (node.matches('script,style,svg,button,input,textarea,select,[hidden],[aria-hidden="true"]') || node.style?.display === 'none');
  function inline(node, base) {
    if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ').replace(/([\\`*_[\]<>])/g, '\\$1');
    if (node.nodeType !== 1 || ignored(node)) return '';
    const inner = [...node.childNodes].map(child => inline(child, base)).join('');
    if (node.tagName === 'BR') return '  \n';
    if (node.tagName === 'CODE') {
      const text = node.textContent, mark = '`'.repeat(Math.max(1, ...[...text.matchAll(/`+/g)].map(m => m[0].length + 1)));
      return `${mark} ${text} ${mark}`;
    }
    if (node.tagName === 'STRONG' || node.tagName === 'B') return `**${inner.trim()}**`;
    if (node.tagName === 'EM' || node.tagName === 'I') return `*${inner.trim()}*`;
    if (node.tagName === 'A') {
      try {
        const url = new URL(node.getAttribute('href'), base);
        if (['http:', 'https:'].includes(url.protocol)) return `[${inner.trim() || escape(url.href)}](<${url.href.replace(/>/g, '%3E').replace(/</g, '%3C')}>)`;
      } catch {}
    }
    return inner;
  }
  function list(node, base) {
    const lines = []; let loose = '', count = Number(node.getAttribute('start')) || 1;
    const flush = () => { if (loose.trim()) lines.push(`- ${loose.trim()}`); loose = ''; };
    for (const child of node.childNodes) {
      if (child.nodeType === 1 && child.tagName === 'LI') {
        flush();
        const prefix = node.tagName === 'OL' ? `${count++}. ` : '- ';
        const text = [...child.childNodes].map(c => c.nodeType === 1 && /^(UL|OL|P)$/.test(c.tagName) ? '\n\n' + block(c, base) : inline(c, base)).join('').trim();
        if (text) lines.push(prefix + text.split('\n').join('\n' + ' '.repeat(prefix.length)));
      } else if (child.nodeType === 1 && /^(UL|OL|P)$/.test(child.tagName)) {
        flush(); lines.push(block(child, base));
      } else loose += inline(child, base);
    }
    flush(); return lines.join('\n');
  }
  function block(node, base) {
    if (ignored(node)) return '';
    if (node.nodeType === 3) return inline(node, base).trim();
    if (node.nodeType !== 1) return '';
    if (/^H[1-6]$/.test(node.tagName)) return `${'#'.repeat(Math.min(6, Number(node.tagName[1]) + 1))} ${inline(node, base).trim()}`;
    if (/^(UL|OL)$/.test(node.tagName)) return list(node, base);
    if (node.tagName === 'PRE') { const text = node.textContent.trim(), mark = fence(text); return `${mark}text\n${text}\n${mark}`; }
    if (node.tagName === 'HR') return '';
    if (node.tagName === 'TABLE') {
      const rows = [...node.querySelectorAll('tr')].map(row => [...row.querySelectorAll('th,td')].map(c => inline(c, base).trim().replace(/\|/g, '\\|').replace(/\n/g, '<br>')));
      if (!rows.length) return '';
      const width = Math.max(...rows.map(r => r.length));
      const render = row => '| ' + Array.from({length: width}, (_, i) => row[i] || '').join(' | ') + ' |';
      return [render(rows[0]), render(Array(width).fill('---')), ...rows.slice(1).map(render)].join('\n');
    }
    if (node.tagName === 'BLOCKQUOTE') return [...node.childNodes].map(c => block(c, base)).filter(Boolean).join('\n\n').split('\n').map(l => '> ' + l).join('\n');
    if (/^(P|SPAN|A|CODE|STRONG|EM)$/.test(node.tagName)) return inline(node, base).trim();
    return [...node.childNodes].map(c => block(c, base)).filter(Boolean).join('\n\n');
  }
  function sectionsFrom(root, base, fallback, sourceGroup = null) {
    const sections = []; let heading = fallback, nodes = [], originalHeading = '', hasHeading = false;
    const flush = () => {
      let markdown = nodes.map(node => block(node, base)).filter(Boolean).join('\n\n');
      if (!markdown && hasHeading && !originalHeading) markdown = escape(heading);
      if (originalHeading) markdown = `**${escape(originalHeading)}**${markdown ? '\n\n' + markdown : ''}`;
      if (markdown) sections.push({heading, markdown, text: markdown, source_group: sourceGroup});
      nodes = [];
    };
    for (const node of root.childNodes) {
      if (node.nodeType === 1 && /^H[1-6]$/.test(node.tagName)) {
        flush(); heading = clean(node.textContent); originalHeading = ''; hasHeading = true;
        if (heading.length > 100 || /accurately follow.*credit card/i.test(heading)) {
          originalHeading = heading;
          heading = /test bookings/i.test(heading) ? 'Test Booking Rules' : /credit card/i.test(heading) ? 'Booking Caution' : 'Additional Requirements';
        }
      } else nodes.push(node);
    }
    flush(); return sections;
  }
  function capture(doc = document, url = location.href) {
    const u = new URL(url);
    if (!(u.hostname === 'bugcrowd.com' || u.hostname.endsWith('.bugcrowd.com'))) throw Error('Buka halaman program Bugcrowd.');
    if (!/^\/engagements\/[^/]+\/?$/.test(u.pathname)) throw Error('Buka tab Details pada program Bugcrowd, lalu ambil ulang.');
    const panel = doc.querySelector('[role="tabpanel"]') || doc.querySelector('main');
    const groups = [...(panel?.querySelectorAll('.cc-target-grp') || [])];
    if (!groups.length) throw Error('Tabel target belum siap atau struktur Bugcrowd berubah. Tunggu tab Details selesai dimuat.');
    const warnings = [], assets = [], sections = [], groupInfo = [];
    for (const [index, group] of groups.entries()) {
      const name = clean(group.querySelector('.bc-panel__title')?.textContent) || `Target group ${index + 1}`;
      const badge = clean(group.querySelector('.cc-scope-pill')?.textContent).toLowerCase();
      const scope = badge === 'in scope' ? 'in_scope' : badge === 'out of scope' ? 'out_of_scope' : 'unknown';
      if (scope === 'unknown') warnings.push(`Scope label could not be verified for ${name}.`);
      const notes = [...group.querySelectorAll('.bc-markdown')].flatMap(e => sectionsFrom(e, url, 'Target Information', name));
      sections.push(...notes);
      const rows = [...group.querySelectorAll('table tbody tr')];
      if (!rows.length) warnings.push(`No target rows loaded for ${name}.`);
      for (const row of rows) {
        const cell = row.querySelector('[data-label="Name / Location"]');
        const endpoint = cell?.querySelector('.cc-rewards-link-table__endpoint');
        if (!endpoint) { warnings.push(`Unrecognized target row in ${name}.`); continue; }
        const targetName = clean(endpoint.textContent);
        const targetLocation = clean(cell.querySelector('.cc-rewards-link-table__target-uri')?.textContent) || endpoint.querySelector('a')?.getAttribute('href') || targetName;
        const tagCell = row.querySelector('[data-label="Tags"]');
        const tags = [...(tagCell?.querySelectorAll('li') || [])].flatMap(li => {
          const overflow = li.querySelector('[data-tooltip-content]')?.getAttribute('data-tooltip-content');
          return overflow ? overflow.split(',').map(clean) : [clean(li.textContent)];
        }).filter(t => t && !/^\+\d+$/.test(t));
        const issueText = clean(row.querySelector('[data-label="Known issues"]')?.textContent);
        const type = cell.querySelector('[data-tooltip-id="categoryTooltip"]')?.getAttribute('data-tooltip-content') || 'unknown';
        assets.push({name: targetName, location: targetLocation, type, scope, group: name, tags: [...new Set(tags)], known_issues: /^\d+$/.test(issueText) ? Number(issueText) : null});
      }
      groupInfo.push({name, scope, target_count: assets.filter(a => a.group === name).length});
    }
    const changes = doc.getElementById('whats_new');
    for (const root of panel.querySelectorAll('.bc-markdown')) {
      if (root.closest('.cc-target-grp') || root.closest('.rp-dashboard__activity-feed--content')) continue;
      if (changes && (changes.compareDocumentPosition(root) & 4)) continue;
      sections.push(...sectionsFrom(root, url, root.id === 'description' ? 'Program Overview' : 'Scope Rule'));
    }
    const things = doc.getElementById('things_to_know')?.parentElement;
    for (const card of things?.querySelectorAll('.bc-panel') || []) {
      const heading = clean(card.querySelector('.bc-panel__title')?.textContent);
      const content = card.querySelector('.bc-panel__main');
      if (!heading || !content) continue;
      const markdown = [...content.childNodes].map(c => inline(c, url)).join('').trim();
      sections.push({heading: /nondisclosure/i.test(heading) ? 'Disclosure' : heading, markdown, text: markdown, source_group: null});
    }
    if (!things) warnings.push('Disclosure / Things to know was not found.');
    if (!sections.some(s => /guidelines|rules|access/i.test(s.heading))) warnings.push('Program guidelines were not found.');
    const pagination = clean(panel.textContent).match(/\b\d+\s*[-–]\s*\d+\s+(?:of|out of)\s+[\d,]+\b/)?.[0] || null;
    if (pagination) warnings.push(`Only the currently loaded target page was captured (${pagination}).`);
    const links = [...panel.querySelectorAll('.bc-markdown a[href], #things_to_know ~ * a[href]')].map(a => ({label: clean(a.textContent), url: new URL(a.getAttribute('href'), url).href})).filter(l => /^https?:/.test(l.url));
    const programName = clean(doc.querySelector('main h2')?.textContent) || u.pathname.split('/')[2];
    return {url: u.origin + u.pathname, title: doc.title, program_name: programName, captured_at: new Date().toISOString(), adapter: 'bugcrowd_v2', kind: 'program', method: 'rendered_document', sections, assets, scope_groups: groupInfo, pagination, warnings, links: [...new Map(links.map(l => [l.url, l])).values()], text_length: sections.reduce((n, s) => n + s.markdown.length, 0), source_updated_at: panel.querySelector('time')?.getAttribute('datetime') || null};
  }
  globalThis.ScopeBriefBugcrowd = {capture, block, sectionsFrom};
})();
