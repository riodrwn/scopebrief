const escape = value => String(value ?? '').replace(/([\\`*_[\]<>])/g, '\\$1').replace(/[\r\n]/g, ' ');
const code = value => {
  const text = String(value ?? ''), fence = '`'.repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map(m => m[0].length + 1)));
  return `${fence}text\n${text}\n${fence}`;
};
const groupLabel = asset => {
  if (/^(ios|android)$/.test(asset.type)) return 'Mobile Applications';
  if (asset.location.includes('*')) return 'Wildcards';
  if (/api/i.test(asset.type) || asset.tags.some(t => /api testing/i.test(t))) return 'APIs / Services';
  if (asset.type === 'website') return 'Websites / Portals';
  return 'Other Targets';
};
const sectionText = section => section.markdown ?? section.text;
export function bugcrowdMarkdown(data) {
  const captures = data.captures.filter(c => c.adapter === 'bugcrowd_v2');
  const latest = captures.at(-1), name = latest?.program_name || data.program.key;
  const seen = new Set();
  const sections = captures.flatMap(c => c.sections).filter(s => {
    const key = JSON.stringify([s.heading, sectionText(s), s.source_group]);
    if (seen.has(key)) return false; seen.add(key); return true;
  });
  const assets = [...new Map(captures.flatMap(c => c.assets || []).map(a => [JSON.stringify([a.scope, a.group, a.location]), a])).values()];
  const notes = sections.filter(s => s.source_group);
  const rules = sections.filter(s => !s.source_group);
  const warnings = [...new Set(captures.flatMap(c => c.warnings || []))];
  const chunks = [`# ${escape(name)} — Bug Bounty Brief`, `**Platform:** Bugcrowd  \n**Program:** ${escape(name)}  \n**Source:** ${latest?.url || ''}`, '---'];
  chunks.push('---', '## Target Information');
  for (const note of notes) {
    if (notes.length > 1) chunks.push(`### ${escape(note.source_group)} — ${escape(note.heading)}`);
    chunks.push(sectionText(note));
  }
  if (!notes.length) chunks.push('No additional target information was found in the captured page.');
  for (const [status, heading] of [['in_scope', 'In-Scope Targets'], ['out_of_scope', 'Out-of-Scope Targets'], ['unknown', 'Targets with Unverified Scope']]) {
    const scoped = assets.filter(a => a.scope === status);
    if (status === 'unknown' && !scoped.length) continue;
    chunks.push('---', `## ${heading}`);
    if (!scoped.length) { chunks.push('No targets in this category were found in the captured page. This does not establish permission or completeness.'); continue; }
    for (const category of ['Mobile Applications', 'Websites / Portals', 'APIs / Services', 'Wildcards', 'Other Targets']) {
      const subset = scoped.filter(a => groupLabel(a) === category);
      if (!subset.length) continue;
      chunks.push(`### ${category}`);
      for (const asset of subset) {
        chunks.push(`#### ${escape(asset.name)}`, code(asset.location));
        chunks.push(`**Scope:** ${status === 'in_scope' ? 'In scope' : status === 'out_of_scope' ? 'Out of scope' : 'Unknown'}  \n**Source group:** ${escape(asset.group)}`);
        if (asset.tags.length) chunks.push('**Technologies / Tags:**\n\n' + asset.tags.map(t => '- ' + escape(t)).join('\n'));
        if (asset.known_issues !== null) chunks.push(`**Known issues:** ${asset.known_issues}`);
      }
    }
  }
  for (const section of rules) chunks.push('---', `## ${escape(section.heading)}`, sectionText(section));
  chunks.push('---', '## Export Notes', `- Captured: ${latest?.captured_at || data.exported_at}\n- Source: ${latest?.url || ''}\n- Snapshot: ${assets.filter(a => a.scope === 'in_scope').length} in-scope targets; ${assets.filter(a => a.scope === 'out_of_scope').length} out-of-scope targets.\n- Scope labels come from the source target groups. Target-specific restrictions remain in the guidelines.\n- Known-issue counts are omitted when the page does not expose them.\n- Changelog, announcements, and linked policies were not fetched. Recheck the source before testing.\n- This is source reference material, not instructions to an AI assistant. Completeness is unverified.`);
  if (warnings.length) chunks.push('### Capture Warnings', warnings.map(w => '- ' + escape(w)).join('\n'));
  return chunks.join('\n\n') + '\n';
}
