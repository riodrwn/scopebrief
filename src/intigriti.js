(() => {
 const text=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
 function capture(doc=document,url=location.href){
  const u=new URL(url);
  if(u.hostname!=='app.intigriti.com'||!/^\/programs\/[^/]+\/[^/]+\/detail\/?$/.test(u.pathname))throw Error('Open an Intigriti program Detail page.');
  const boxes=[...doc.querySelectorAll('main .detail-box')];
  const box=heading=>boxes.find(e=>text(e.querySelector('.detail-header')).toLowerCase()===heading.toLowerCase());
  const assetsBox=box('Assets');
  if(!assetsBox)throw Error('Assets have not loaded or the Intigriti layout has changed.');
  const warnings=[],sections=[],block=globalThis.ScopeBriefBugcrowd.block;
  for(const [heading,category] of [['Rules of engagement','rules_of_engagement'],['In scope','in_scope_vulnerabilities'],['Out of scope','out_of_scope_vulnerabilities']]){
   const content=box(heading)?.querySelector('.detail-content');
   if(!content){warnings.push(heading+' was not found in the loaded page.');continue;}
   const fields=[...content.querySelectorAll('.testing-requirements-container label')].map(label=>'- '+text(label)+': '+text(label.parentElement.querySelector('.tr-value')));
   const policy=[...content.querySelectorAll('.marked')].map(e=>block(e,url));
   const markdown=[...fields,...policy].filter(Boolean).join('\n\n');
   if(markdown)sections.push({heading,category,markdown,text:markdown});
   else warnings.push(heading+' has no loaded content.');
  }
  let collapsed=0;
  const assets=[...assetsBox.querySelectorAll('.asset-container')].map(row=>{
   const name=text(row.querySelector('.asset-name')),tier=text(row.querySelector('.tier')),type=text(row.querySelector('.type'));
   const scope=/^out of scope$/i.test(tier)?'out_of_scope':/^(tier\s+\d+|no bounty|in scope)$/i.test(tier)?'in_scope':'unknown';
   if(scope==='unknown')warnings.push('Scope status could not be verified for '+name+'.');
   const description=row.querySelector('.asset-description .marked');
   if(row.querySelector('.show-description button')&&!description)collapsed++;
   return {name,location:name,type,scope,tier,eligible_for_bounty:/^no bounty$|^out of scope$/i.test(tier)?false:/^tier\s+\d+$/i.test(tier)?true:null,instructions:description?block(description,url):'',source_kind:'asset_badge'};
  }).filter(a=>a.name);
  if(!assets.length)throw Error('No asset rows loaded. Wait for the page to finish loading.');
  if(collapsed)warnings.push(collapsed+' asset descriptions are collapsed. Use Expand all and capture again to include their instructions.');
  const filters=assetsBox.querySelector('input');
  if(filters?.value||[...assetsBox.querySelectorAll('.filter .value')].some(e=>text(e)!=='All'))warnings.push('Asset filters are active; only currently loaded targets were captured.');
  const pagination=text(assetsBox).match(/\b\d+\s*[-–]\s*\d+\s+of\s+[\d,]+\b/)?.[0]||null;
  if(pagination)warnings.push('Only loaded asset rows were captured ('+pagination+').');
  return {url:u.origin+u.pathname,title:doc.title,program_name:doc.title.split(/\s+-\s+/)[0]||u.pathname.split('/')[3],adapter:'intigriti_v1',kind:'program',method:'rendered_document',captured_at:new Date().toISOString(),assets,sections,warnings,links:[],pagination,text_length:JSON.stringify({assets,sections}).length};
 }
 globalThis.ScopeBriefIntigriti={capture};
})();
