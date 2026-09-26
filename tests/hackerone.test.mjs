import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import '../src/bugcrowd.js';
import '../src/hackerone.js';
import {identity,assemble,markdown,mergeCaptures} from '../src/core.js';
const {capture,csvAssets,parseCSV}=globalThis.ScopeBriefHackerOne;
const base='https://hackerone.com/example';
const csv='identifier,asset_type,instruction,eligible_for_bounty,eligible_for_submission,max_severity\r\n*.example.test,WILDCARD,"Only own accounts, no DoS.\nUse ""RESEARCH"" header.",false,true,high\r\nadmin.example.test,URL,,false,false,none\r\n';
function scopeDoc(link='../teams/example/assets/download_csv.csv'){
 return parseHTML(`<html><head><title>Example | HackerOne</title></head><body><main><a href="${link}">Download CSV</a><p>1-1 of 2</p><table><tr><th>Asset name</th><th>Type</th><th>Coverage</th><th>Max. severity</th><th>Bounty</th></tr><tr><td>*.example.test</td><td>Wildcard</td><td>In scope</td><td>High</td><td>Ineligible</td></tr></table></main></body></html>`).document;
}
const policyDoc=()=>parseHTML('<html><head><title>Example | HackerOne</title></head><body><main><nav>Ignore navigation</nav><div class="interactive-markdown markdownable"><h2>Rules of Engagement</h2><p>At most <strong>3 requests per second</strong>.</p><h2>Out-of-Scope Vulnerabilities</h2><ul><li>DoS</li></ul></div></main></body></html>').document;
const response=async()=>({ok:true,text:async()=>csv});
test('CSV preserves multiline quoted instructions and separates bounty from scope',()=>{
 const assets=csvAssets('\uFEFF'+csv);
 assert.equal(assets.length,2);assert.equal(assets[0].scope,'in_scope');assert.equal(assets[0].eligible_for_bounty,false);
 assert.equal(assets[1].scope,'out_of_scope');assert.match(assets[0].instructions,/\nUse "RESEARCH"/);
 assert.throws(()=>parseCSV('<html>Log in</html>'),/schema/);
 assert.throws(()=>parseCSV(csv+'"unfinished'),/quotation/);
});
test('official CSV captures all rows despite one visible table row',async()=>{
 const result=await capture(scopeDoc(),base+'/policy_scopes',response);
 assert.equal(result.assets.length,2);assert.equal(result.scope_coverage.mode,'csv_snapshot');
 assert.equal(result.warnings.length,0);assert.equal(result.method,'official_csv');
});
test('failed CSV returns explicit partial result without losing bounty distinction',async()=>{
 const doc=scopeDoc();const bounty=doc.querySelector('tr:last-child td:last-child');bounty.innerHTML='<svg><desc>Created with Sketch.</desc></svg>Ineligible';
 const result=await capture(doc,base+'/policy_scopes',async()=>{throw Error('Login required');});
 assert.equal(result.scope_coverage.mode,'partial');assert.equal(result.assets.length,1);
 assert.equal(result.assets[0].eligible_for_bounty,false);assert.equal(result.assets[0].scope,'in_scope');
 assert.match(result.warnings[0],/Hanya baris tabel/);
});
test('CSV request cannot target another program or host',async()=>{
 for(const link of ['https://evil.test/file.csv','https://hackerone.com/teams/other/assets/download_csv.csv']){
  let called=false;const result=await capture(scopeDoc(link),base+'/policy_scopes',async()=>{called=true;return response();});
  assert.equal(called,false);assert.equal(result.scope_coverage.mode,'partial');
 }
});
test('guidelines and scope merge; removed targets do not survive refresh',async()=>{
 const policy=await capture(policyDoc(),base,response), scope=await capture(scopeDoc(),base+'/policy_scopes',response);
 const both=mergeCaptures(mergeCaptures([],scope),policy);
 assert.equal(both.length,2);
 const updated={...scope,assets:[scope.assets[0]]};
 const latest=mergeCaptures([...both,{adapter:'hackerone_assets',kind:'asset_scope',assets:[{name:'stale'}]}],updated);
 assert.equal(latest.length,2);assert.equal(assemble(identity(base),latest).assets.length,1);
 const brief=markdown(assemble(identity(base),both));
 assert.match(brief,/3 requests per second/);assert.match(brief,/Bounty:\*\* Ineligible/);
 assert.ok(brief.indexOf('admin.example.test')>brief.indexOf('## Out-of-Scope Assets'));
 assert.match(brief,/Asset-specific instructions/);assert.ok(!brief.includes('Ignore navigation'));
});
test('unloaded page fails and unknown booleans never grant scope',async()=>{
 await assert.rejects(capture(parseHTML('<main>Loading</main>').document,base),/belum dimuat/);
 assert.equal(csvAssets(csv.replace('false,true','false,unknown'))[0].scope,'unknown');
});
test('one guidelines capture fetches scope automatically and exports both',async()=>{
 let requested;
 const policy=await capture(policyDoc(),base,async(url,options)=>{requested=url;assert.equal(options.credentials,'same-origin');return response();});
 assert.equal(requested,'https://hackerone.com/teams/example/assets/download_csv.csv');
 const records=mergeCaptures([],policy);
 assert.equal(records.length,2);
 const data=assemble(identity(base),records);
 assert.equal(data.assets.length,2);
 assert.match(markdown(data),/3 requests per second/);
 assert.doesNotMatch(markdown(data),/Scope aset belum diambil/);
});
test('automatic CSV failure preserves policy but removes stale scope with warning',async()=>{
 const old=await capture(scopeDoc(),base+'/policy_scopes',response);
 const policy=await capture(policyDoc(),base,async()=>({ok:false,status:403}));
 const records=mergeCaptures([old],policy);
 const data=assemble(identity(base),records);
 assert.equal(data.assets.length,0);
 assert.ok(data.sections.length);
 assert.match(markdown(data),/Scope otomatis gagal/);
 assert.equal(records[1].scope_coverage.mode,'unavailable');
});
