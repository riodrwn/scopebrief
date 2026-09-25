(() => {
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const selected=getSelection()?.toString().trim();
 let root=['main','[role="main"]','article'].map(s=>document.querySelector(s)).find(e=>e&&visible(e))||document.body;
 const pagination=root.innerText.match(/\b\d+\s*[-–]\s*\d+\s+of\s+[\d,]+\b/)?.[0]||null;
 let adapter='generic',assets=[];
 if(location.hostname==='hackerone.com'){
  const table=[...root.querySelectorAll('table')].find(t=>/Asset name/.test(t.textContent)&&/Coverage/.test(t.textContent));
  if(table){
   root=table;adapter='hackerone_assets';
   const rows=[...table.querySelectorAll('tr')];
   const headers=[...rows[0].querySelectorAll('th,td')].map(c=>c.textContent.trim());
   assets=rows.slice(1).map(row=>{const cells=[...row.querySelectorAll('td')].map(c=>c.textContent.trim().replace(/\s+/g,' '));return Object.fromEntries(headers.map((h,i)=>[h,cells[i]??null]));}).filter(r=>r['Asset name']);
  }else{
   const policy=[...root.querySelectorAll('.interactive-markdown.markdownable')].filter(visible).sort((a,b)=>b.textContent.length-a.textContent.length)[0];
   if(policy){root=policy;adapter='hackerone_guidelines';}
  }
 }
 const clean=root.cloneNode(true), originals=[...root.querySelectorAll('*')], cleanNodes=[...clean.querySelectorAll('*')];
 originals.forEach((e,i)=>{if(!visible(e))cleanNodes[i]?.remove();});
 clean.querySelectorAll('script,style,noscript,nav,header,footer,button,input,textarea,select,[role="navigation"],[hidden],[aria-hidden="true"]').forEach(e=>e.remove());
 const sections=[];let heading=adapter==='hackerone_assets'?'Asset scope':'Program guidelines',lines=[];
 const flush=()=>{const text=lines.join('\n').replace(/\n{3,}/g,'\n\n').trim();if(text)sections.push({heading,text});lines=[];};
 const walk=node=>{
  if(node.nodeType===3){if(node.textContent.trim())lines.push(node.textContent.trim());return;}
  if(node.nodeType!==1)return;
  const tag=node.tagName,text=node.textContent.trim();
  const boldHeading=['P','DIV'].includes(tag)&&node.children.length===1&&['STRONG','B'].includes(node.firstElementChild.tagName)&&text.length<110;
  if(/^H[1-6]$/.test(tag)||boldHeading){flush();heading=text;return;}
  if(tag==='TABLE'){
   const assetTable=/asset|target/i.test(node.querySelector('tr')?.textContent||'');
   const previousHeading=heading;
   if(assetTable){flush();heading='Asset scope';}
   for(const row of node.querySelectorAll('tr'))lines.push([...row.querySelectorAll('th,td')].map(c=>c.textContent.trim().replace(/\s+/g,' ')).join(' | '));
   if(assetTable){flush();heading=previousHeading;}return;
  }
  if(tag==='LI'){lines.push('- '+text.replace(/\s+/g,' '));return;}
  if(tag==='P'){lines.push(text,'');return;}
  for(const child of node.childNodes)walk(child);
 };
 if(selected){heading='Selected source text';lines=[selected];}else walk(clean);
 flush();
 const links=[...root.querySelectorAll('a[href]')].filter(visible).map(a=>({label:a.textContent.trim(),url:a.href})).filter(l=>/^https?:/.test(l.url));
 return {url:location.href,title:document.title,captured_at:new Date().toISOString(),adapter,pagination,assets:selected?[]:assets,method:selected?'selection':'rendered_document',sections,links:[...new Map(links.map(l=>[l.url,l])).values()],text_length:sections.reduce((n,s)=>n+s.text.length,0)};
})();
