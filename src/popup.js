import {identity,assemble,markdown,mergeCaptures} from './core.js';
import {renderPreview} from './preview.js';
const api=globalThis.browser||globalThis.chrome,$=id=>document.getElementById(id);
let records={},current=null,view='read';
function show(message){$('status').textContent=message;}
function render(selected=$('program').value){
 $('program').replaceChildren();
 for(const [id,r] of Object.entries(records))$('program').add(new Option(`${r.program.platform} / ${r.program.key}`,id));
 if(records[selected])$('program').value=selected;
 const r=records[$('program').value];current=r?assemble(r.program,r.captures):null;
 $('preview').value=current?(view==='jsonView'?JSON.stringify(current,null,2):markdown(current)):'';$('count').textContent=`${r?.captures.length||0} captures`;
 renderPreview($('rendered'),current?markdown(current):'Your program brief will appear here.');
 const assets=r?.captures.flatMap(c=>['bugcrowd_v2','hackerone_v3','yeswehack_v1'].includes(c.adapter)?c.assets:[])||[];
 $('stats').textContent=assets.length?`${assets.filter(a=>a.scope==='in_scope').length} in · ${assets.filter(a=>a.scope==='out_of_scope').length} out`:'';
 for(const id of ['md','json','remove'])$(id).disabled=!current;
}
$('program').onchange=()=>render();
function setView(next){
 view=next;
 const raw=view!=='read';
 $('preview').hidden=!raw;$('rendered').hidden=raw;
 $('preview').value=current?(view==='jsonView'?JSON.stringify(current,null,2):markdown(current)):'';
 $('preview').setAttribute('aria-label',view==='jsonView'?'JSON source':'Markdown source');
 for(const id of ['read','raw','jsonView'])$(id).setAttribute('aria-pressed',String(view===id));
}
for(const id of ['read','raw','jsonView'])$(id).onclick=()=>setView(id);
$('capture').onclick=async()=>{
 $('capture').disabled=true;
 try{
  const [tab]=await api.tabs.query({active:true,currentWindow:true});if(!tab?.id)throw Error('No active tab.');
  show('Fetching program guidelines and scope…');
  const results=await api.scripting.executeScript({target:{tabId:tab.id},files:['bugcrowd.js','hackerone.js','yeswehack.js','capture.js']});const capture=results[0]?.result;
  if(!capture?.text_length)throw Error('No readable content. Wait for the page to finish loading.');
  const program=identity(capture.url);
  const u=new URL(capture.url);capture.key=u.origin+u.pathname+u.search+u.hash+'|'+capture.kind+'|'+(capture.pagination||'');
  const previous=records[program.id]||{program,captures:[]};
  const record={program,captures:mergeCaptures(previous.captures,capture)};
  const next={...records,[program.id]:record};await api.storage.local.set({records:next});records=next;render(program.id);
  show(['bugcrowd_v2','hackerone_v3','yeswehack_v1'].includes(capture.adapter)?`Saved: ${record.captures.reduce((n,c)=>n+(c.assets?.length||0),0)} assets, ${record.captures.reduce((n,c)=>n+(c.sections?.length||0),0)} sections.${record.captures.some(c=>c.warnings?.length)?' '+record.captures.flatMap(c=>c.warnings||[]).join(' '):' Review the preview before exporting.'}`:`Saved: ${capture.text_length.toLocaleString()} characters. Review the preview before exporting.`);
 }catch(e){show('Failed: '+e.message);}finally{$('capture').disabled=false;}
};
async function copy(format){
 if(!current)return;
 const text=format==='json'?JSON.stringify(current,null,2):markdown(current);
 try{
  await navigator.clipboard.writeText(text);
  show((format==='json'?'JSON':'Markdown')+' copied to clipboard.');
 }catch{
  setView(format==='json'?'jsonView':'raw');
  $('preview').focus();$('preview').select();
  show('Clipboard access failed. The text is selected; press Ctrl+C to copy.');
 }
}
$('md').onclick=()=>copy('md');$('json').onclick=()=>copy('json');
$('remove').onclick=async()=>{try{const next={...records};delete next[$('program').value];await api.storage.local.set({records:next});records=next;render();show('Program data removed from local storage.');}catch(e){show(e.message);}};
try{records=(await api.storage.local.get('records')).records||{};render();}catch(e){show('Storage unavailable: '+e.message);}
