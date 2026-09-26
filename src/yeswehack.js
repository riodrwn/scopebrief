(() => {
 const text=e=>(e?.textContent||'').replace(/\u00a0/g,' ').trim();
 function capture(doc=document,url=location.href){
  const u=new URL(url);
  if(u.hostname!=='yeswehack.com'||!/^\/programs\/[^/]+\/?$/.test(u.pathname))throw Error('Open a YesWeHack program page.');
  const main=doc.querySelector('main');
  const table=main?.querySelector('#program-scopes-table');
  if(!table)throw Error('Scopes have not loaded or the YesWeHack layout has changed.');
  const headers=[...table.querySelectorAll('thead th')].map(e=>text(e).toLowerCase());
  const scopeIndex=headers.indexOf('scope'),typeIndex=headers.indexOf('type');
  if(scopeIndex<0||typeIndex<0)throw Error('Scope table columns were not recognized.');
  const assets=[...table.querySelectorAll('tbody tr')].flatMap(row=>{
   const cells=[...row.children].filter(e=>e.tagName==='TD');
   if(cells.length<headers.length||cells.some(e=>Number(e.getAttribute('colspan'))>1))return [];
   const location=text(cells[scopeIndex]);
   return location?[{name:location,location,type:text(cells[typeIndex]),scope:'in_scope',source_kind:'visible_table'}]:[];
  });
  if(!assets.length)throw Error('No scope rows loaded. Wait for the page to finish loading.');
  const warnings=[],sections=[];
  for(const [heading,category] of [['Out of scopes','out_of_scope_restrictions'],['Qualifying vulnerabilities','in_scope_vulnerabilities'],['Non-qualifying vulnerabilities','out_of_scope_vulnerabilities']]){
   const h=[...main.querySelectorAll('h3')].find(e=>text(e).toLowerCase()===heading.toLowerCase());
   if(!h){warnings.push(heading+' was not found in the loaded page.');continue;}
   const nodes=[];for(let e=h.nextElementSibling;e&&!/^H[1-6]$/.test(e.tagName);e=e.nextElementSibling)nodes.push(e);
   const markdown=nodes.flatMap(e=>e.tagName==='SPAN'?[...e.childNodes]:[e]).map(e=>globalThis.ScopeBriefBugcrowd.block(e,url)).filter(Boolean).join('\n\n');
   if(markdown)sections.push({heading,category,markdown,text:markdown});
   else warnings.push(heading+' has no loaded content.');
  }
  const pagination=text(main).match(/\b\d+\s*[-–]\s*\d+\s+(?:of|out of)\s+[\d,]+\b/)?.[0]||null;
  if(pagination)warnings.push('Only loaded scope rows were captured ('+pagination+').');
  return {url:u.origin+u.pathname,title:doc.title,program_name:text(main.querySelector('h1'))||u.pathname.split('/')[2],adapter:'yeswehack_v1',kind:'program',method:'rendered_document',captured_at:new Date().toISOString(),assets,sections,warnings,links:[],pagination,text_length:JSON.stringify({assets,sections}).length};
 }
 globalThis.ScopeBriefYesWeHack={capture};
})();
