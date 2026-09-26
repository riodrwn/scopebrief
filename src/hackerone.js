/* HackerOne adapter: explicit capture only; CSV requests stay on the current program. */
(() => {
  const text = value => String(value ?? '').replace(/\u00a0/g, ' ').trim();
  function parseCSV(source) {
    source = source.replace(/^\uFEFF/, '');
    const rows = []; let row = [], value = '', quoted = false;
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (ch === '"') {
        if (quoted && source[i + 1] === '"') { value += '"'; i++; }
        else if (quoted || value === '') quoted = !quoted;
        else throw Error('Invalid CSV quoting.');
      } else if (ch === ',' && !quoted) { row.push(value); value = ''; }
      else if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && source[i + 1] === '\n') i++;
        row.push(value); if (row.some(c => c !== '')) rows.push(row); row = []; value = '';
      } else value += ch;
    }
    if (quoted) throw Error('Incomplete CSV quotation.');
    row.push(value); if (row.some(c => c !== '')) rows.push(row);
    const headers = rows.shift()?.map(c => text(c).toLowerCase());
    if (!['identifier', 'asset_type', 'eligible_for_submission', 'eligible_for_bounty'].every(h => headers?.includes(h))) throw Error('HackerOne CSV schema not recognized.');
    return rows.map(r => {
      if (r.length !== headers.length) throw Error('Incomplete CSV row.');
      return Object.fromEntries(headers.map((h, i) => [h, r[i]]));
    });
  }
  const bool = value => text(value).toLowerCase() === 'true' ? true : text(value).toLowerCase() === 'false' ? false : null;
  async function fetchAssets(csvURL, request) {
    const response = await request(csvURL,{credentials:'same-origin',redirect:'error',signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw Error(`CSV HTTP ${response.status}.`);
    const source = await response.text();
    if (source.length > 10_000_000) throw Error('CSV melebihi batas ukuran.');
    const assets = csvAssets(source);
    if (!assets.length) throw Error('CSV tidak berisi aset.');
    return assets;
  }
  function csvAssets(source) {
    return parseCSV(source).map(r => ({
      name: r.identifier, location: r.identifier, type: r.asset_type,
      scope: bool(r.eligible_for_submission) === true ? 'in_scope' : bool(r.eligible_for_submission) === false ? 'out_of_scope' : 'unknown',
      eligible_for_submission: bool(r.eligible_for_submission), eligible_for_bounty: bool(r.eligible_for_bounty),
      instructions: r.instruction || '', max_severity: r.max_severity || null,
      requirements: {availability:r.availability_requirement || null, confidentiality:r.confidentiality_requirement || null, integrity:r.integrity_requirement || null},
      system_tags: r.system_tags || '', updated_at: r.updated_at || null,
      source_kind: 'official_csv'
    }));
  }
  function tableAssets(table) {
    const headers = [...table.querySelectorAll('th')].map(c => text(c.textContent).toLowerCase());
    return [...table.querySelectorAll('tr')].filter(r => r.querySelector('td')).map(r => {
      const cells = [...r.querySelectorAll('td')].map(c => {const clone=c.cloneNode(true);clone.querySelectorAll('svg,[aria-hidden="true"],script,style').forEach(e=>e.remove());return text(clone.textContent);});
      const data = Object.fromEntries(headers.map((h, i) => [h, cells[i] || '']));
      const coverage = data.coverage.toLowerCase(), bounty = data.bounty.toLowerCase();
      return {name:data['asset name'],location:data['asset name'],type:data.type,scope:coverage === 'in scope' ? 'in_scope' : coverage === 'out of scope' ? 'out_of_scope' : 'unknown',eligible_for_submission:coverage === 'in scope' ? true : coverage === 'out of scope' ? false : null,eligible_for_bounty:bounty === 'eligible' ? true : bounty === 'ineligible' ? false : null,instructions:'',max_severity:data['max. severity'] || null,source_kind:'visible_table'};
    }).filter(a => a.name);
  }
  async function capture(doc = document, url = location.href, request = fetch) {
    const u = new URL(url), parts = u.pathname.split('/').filter(Boolean), handle = parts[0];
    if (u.hostname !== 'hackerone.com' || !handle || (parts.length > 1 && parts[1] !== 'policy_scopes')) throw Error('Buka Program guidelines atau Scope program HackerOne.');
    const base = {url:u.origin + u.pathname,program_name:text(doc.title).split(/\s+\|\s+/)[0].replace(/\s*[—-]\s*HackerOne.*$/i,'') || handle,title:doc.title,captured_at:new Date().toISOString(),adapter:'hackerone_v3',method:'rendered_document',warnings:[],sections:[],assets:[],links:[]};
    const main = doc.querySelector('main') || doc;
    if (parts[1] !== 'policy_scopes') {
      const policy = [...main.querySelectorAll('.interactive-markdown.markdownable')].filter(e => !e.closest('[hidden],[aria-hidden="true"]')).sort((a,b) => b.textContent.length-a.textContent.length)[0];
      if (!policy || !text(policy.textContent)) throw Error('Guidelines belum dimuat atau struktur halaman berubah.');
      base.kind = 'guidelines';
      const copy=policy.cloneNode(true);
      for(const list of [...copy.children].filter(e=>e.tagName==='UL')){
        const items=[...list.querySelectorAll('li')];
        if(items.length&&items.every(li=>{const a=li.querySelector('a');return a?.getAttribute('href')?.startsWith('#')&&text(li.textContent)===text(a.textContent);}))list.remove();
      }
      base.sections = globalThis.ScopeBriefBugcrowd.sectionsFrom(copy, url, 'Program Guidelines');
      const exclusions=doc.getElementById('scope_exclusions');
      if(exclusions){
        const clone=exclusions.cloneNode(true);clone.querySelectorAll('h2,svg,[hidden],[aria-hidden="true"]').forEach(e=>e.remove());
        const markdown=globalThis.ScopeBriefBugcrowd.block(clone,url);
        if(markdown)base.sections.push({heading:'Scope Exclusions',markdown,text:markdown});
      }
      base.links = [...policy.querySelectorAll('a[href]')].flatMap(a => {try {const link = new URL(a.getAttribute('href'),url);return /^https?:$/.test(link.protocol)?[{label:text(a.textContent),url:link.href}]:[];}catch{return [];}});
      base.text_length = base.sections.reduce((n,s) => n+s.text.length,0);
      const csvURL = `${u.origin}/teams/${encodeURIComponent(handle)}/assets/download_csv.csv`;
      const scope = {...base,kind:'asset_scope',url:`${u.origin}/${handle}/policy_scopes`,sections:[],links:[],warnings:[],assets:[],method:'official_csv',csv_source:csvURL,scope_coverage:{mode:'unavailable',expected_count:null,captured_count:0}};
      try {
        scope.assets = await fetchAssets(csvURL,request);
        scope.scope_coverage = {mode:'csv_snapshot',expected_count:null,captured_count:scope.assets.length};
      } catch(error) {
        scope.warnings.push(`Scope otomatis gagal (${error.message}). Coba Ambil program lagi atau buka Scope untuk mengambil baris yang terlihat.`);
      }
      scope.text_length = JSON.stringify(scope.assets).length;
      base.related_captures = [scope];
      return base;
    }
    base.kind = 'asset_scope';
    const table = [...main.querySelectorAll('table')].find(t => /Asset name/.test(t.textContent) && /Coverage/.test(t.textContent));
    if (!table) throw Error('Tabel Scope belum dimuat atau struktur halaman berubah.');
    const range = (main.innerText || main.textContent).match(/\b(\d+)\s*[-–]\s*(\d+)\s+of\s+([\d,]+)/);
    base.pagination = range?.[0] || null;
    const expected = range ? Number(range[3].replace(/,/g,'')) : null;
    base.scope_coverage = {mode:'partial',expected_count:expected,captured_count:0};
    const link = [...main.querySelectorAll('a[href]')].find(a => text(a.textContent) === 'Download CSV');
    try {
      if (!link) throw Error('Link CSV resmi tidak ditemukan.');
      const csvURL = new URL(link.getAttribute('href'), url);
      if (csvURL.origin !== u.origin || csvURL.pathname !== `/teams/${handle}/assets/download_csv.csv` || csvURL.search) throw Error('Link CSV tidak cocok dengan program ini.');
      base.assets = await fetchAssets(csvURL.href,request);
      base.method = 'official_csv'; base.csv_source = csvURL.href;
      base.scope_coverage.mode = 'csv_snapshot';
      if (expected !== null && base.assets.length !== expected) base.warnings.push('Jumlah CSV berbeda dari total tabel. Periksa filter dan pembaruan scope.');
    } catch (error) {
      base.assets = tableAssets(table);
      base.warnings.push(`CSV tidak tersedia (${error.message}). Hanya baris tabel yang sedang dimuat diambil; instruksi detail aset mungkin belum tercakup.`);
    }
    if (!base.assets.length) throw Error('Tidak ada aset scope yang berhasil dibaca.');
    base.scope_coverage.captured_count = base.assets.length;
    base.text_length = JSON.stringify(base.assets).length;
    return base;
  }
  globalThis.ScopeBriefHackerOne = {capture, parseCSV, csvAssets, tableAssets};
})();
