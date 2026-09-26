import {identity,assemble,markdown} from './core.js';
import {renderPreview} from './preview.js';
const api=globalThis.browser||globalThis.chrome,$=id=>document.getElementById(id);
let records={},current=null;
function show(message){$('status').textContent=message;}
function render(selected=$('program').value){
 $('program').replaceChildren();
 for(const [id,r] of Object.entries(records))$('program').add(new Option(`${r.program.platform} / ${r.program.key}`,id));
 if(records[selected])$('program').value=selected;
 const r=records[$('program').value];current=r?assemble(r.program,r.captures):null;
 $('preview').value=current?markdown(current):'';$('count').textContent=`${r?.captures.length||0} halaman`;
 renderPreview($('rendered'),current?markdown(current):'Brief program akan tampil di sini.');
 const assets=r?.captures.flatMap(c=>c.adapter==='bugcrowd_v2'?c.assets:[])||[];
 $('stats').textContent=assets.length?`${assets.filter(a=>a.scope==='in_scope').length} in · ${assets.filter(a=>a.scope==='out_of_scope').length} out`:'';
 for(const id of ['md','json','remove'])$(id).disabled=!current;
}
$('program').onchange=()=>render();
for(const id of ['read','raw']) $(id).onclick=()=>{const raw=id==='raw';$('preview').hidden=!raw;$('rendered').hidden=raw;$('read').setAttribute('aria-pressed',String(!raw));$('raw').setAttribute('aria-pressed',String(raw));};
$('capture').onclick=async()=>{
 $('capture').disabled=true;
 try{
  const [tab]=await api.tabs.query({active:true,currentWindow:true});if(!tab?.id)throw Error('Tidak ada tab aktif.');
  show('Membaca konten yang sudah dimuat…');
  const results=await api.scripting.executeScript({target:{tabId:tab.id},files:['bugcrowd.js','capture.js']});const capture=results[0]?.result;
  if(!capture?.text_length)throw Error('Tidak ada teks terbaca. Tunggu halaman selesai dimuat.');
  const program=identity(capture.url);capture.kind=capture.adapter==='bugcrowd_v2'?'program':capture.adapter==='hackerone_assets'?'asset_scope':$('kind').value;
  const u=new URL(capture.url);capture.key=u.origin+u.pathname+u.search+u.hash+'|'+capture.kind+'|'+(capture.pagination||'');
  const previous=records[program.id]||{program,captures:[]};
  const record={program,captures:[...previous.captures.filter(c=>c.key!==capture.key&&(capture.adapter!=='bugcrowd_v2'||c.adapter==='bugcrowd_v2')),capture]};
  const next={...records,[program.id]:record};await api.storage.local.set({records:next});records=next;render(program.id);
  show(capture.adapter==='bugcrowd_v2'?`Brief tersimpan: ${capture.assets.length} target, ${capture.sections.length} bagian.${capture.warnings.length?' '+capture.warnings.join(' '):' Periksa preview sebelum ekspor.'}`:`Tersimpan: ${capture.text_length.toLocaleString()} karakter. Periksa preview sebelum ekspor.`);
 }catch(e){show('Gagal: '+e.message);}finally{$('capture').disabled=false;}
};
function download(format){
 if(!current)return;
 const text=format==='json'?JSON.stringify(current,null,2):markdown(current);
 const url=URL.createObjectURL(new Blob([text],{type:format==='json'?'application/json':'text/markdown;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=current.program.key.replace(/[^a-z0-9_-]/gi,'-')+'.'+format;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
$('md').onclick=()=>download('md');$('json').onclick=()=>download('json');
$('remove').onclick=async()=>{try{const next={...records};delete next[$('program').value];await api.storage.local.set({records:next});records=next;render();show('Data program dihapus dari storage lokal.');}catch(e){show(e.message);}};
try{records=(await api.storage.local.get('records')).records||{};render();}catch(e){show('Storage tidak tersedia: '+e.message);}
