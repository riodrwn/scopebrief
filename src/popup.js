import {identity,assemble,markdown,mergeCaptures} from './core.js';
import {renderPreview} from './preview.js';
const api=globalThis.browser||globalThis.chrome,$=id=>document.getElementById(id);
let records={},current=null;
function show(message){$('status').textContent=message;}
function render(selected=$('program').value){
 $('program').replaceChildren();
 for(const [id,r] of Object.entries(records))$('program').add(new Option(`${r.program.platform} / ${r.program.key}`,id));
 if(records[selected])$('program').value=selected;
 const r=records[$('program').value];current=r?assemble(r.program,r.captures):null;
 $('preview').value=current?markdown(current):'';$('count').textContent=`${r?.captures.length||0} captures`;
 renderPreview($('rendered'),current?markdown(current):'Your program brief will appear here.');
 const assets=r?.captures.flatMap(c=>['bugcrowd_v2','hackerone_v3','yeswehack_v1'].includes(c.adapter)?c.assets:[])||[];
 $('stats').textContent=assets.length?`${assets.filter(a=>a.scope==='in_scope').length} in · ${assets.filter(a=>a.scope==='out_of_scope').length} out`:'';
 for(const id of ['md','json','remove'])$(id).disabled=!current;
}
$('program').onchange=()=>render();
for(const id of ['read','raw']) $(id).onclick=()=>{const raw=id==='raw';$('preview').hidden=!raw;$('rendered').hidden=raw;$('read').setAttribute('aria-pressed',String(!raw));$('raw').setAttribute('aria-pressed',String(raw));};
$('capture').onclick=async()=>{
 $('capture').disabled=true;
 try{
  const [tab]=await api.tabs.query({active:true,currentWindow:true});if(!tab?.id)throw Error('No active tab.');
  show('Fetching program guidelines and scope…');
  const results=await api.scripting.executeScript({target:{tabId:tab.id},files:['bugcrowd.js','hackerone.js','yeswehack.js','capture.js']});const capture=results[0]?.result;
  if(!capture?.text_length)throw Error('No readable content. Wait for the page to finish loading.');
  const program=identity(capture.url);capture.kind=capture.adapter==='hackerone_v3'?capture.kind:['bugcrowd_v2','yeswehack_v1'].includes(capture.adapter)?'program':capture.adapter==='hackerone_assets'?'asset_scope':$('kind').value;
  const u=new URL(capture.url);capture.key=u.origin+u.pathname+u.search+u.hash+'|'+capture.kind+'|'+(capture.pagination||'');
  const previous=records[program.id]||{program,captures:[]};
  const record={program,captures:mergeCaptures(previous.captures,capture)};
  const next={...records,[program.id]:record};await api.storage.local.set({records:next});records=next;render(program.id);
  show(['bugcrowd_v2','hackerone_v3','yeswehack_v1'].includes(capture.adapter)?`Saved: ${record.captures.reduce((n,c)=>n+(c.assets?.length||0),0)} assets, ${record.captures.reduce((n,c)=>n+(c.sections?.length||0),0)} sections.${record.captures.some(c=>c.warnings?.length)?' '+record.captures.flatMap(c=>c.warnings||[]).join(' '):' Review the preview before exporting.'}`:`Saved: ${capture.text_length.toLocaleString()} characters. Review the preview before exporting.`);
 }catch(e){show('Failed: '+e.message);}finally{$('capture').disabled=false;}
};
function download(format){
 if(!current)return;
 const text=format==='json'?JSON.stringify(current,null,2):markdown(current);
 const url=URL.createObjectURL(new Blob([text],{type:format==='json'?'application/json':'text/markdown;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=current.program.key.replace(/[^a-z0-9_-]/gi,'-')+'.'+format;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
$('md').onclick=()=>download('md');$('json').onclick=()=>download('json');
$('remove').onclick=async()=>{try{const next={...records};delete next[$('program').value];await api.storage.local.set({records:next});records=next;render();show('Program data removed from local storage.');}catch(e){show(e.message);}};
try{records=(await api.storage.local.get('records')).records||{};render();}catch(e){show('Storage unavailable: '+e.message);}
