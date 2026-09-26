import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import '../src/bugcrowd.js';
import '../src/intigriti.js';
import {assemble,identity,markdown,mergeCaptures} from '../src/core.js';
const url='https://app.intigriti.com/programs/company/program/detail';
const box=(heading,content)=>'<div class="detail-box"><div class="detail-header">'+heading+'</div><div class="detail-content">'+content+'</div></div>';
const row=(name,tier,extra='')=>'<div class="asset-container"><div class="asset-name">'+name+'</div><div class="type">URL</div><div class="tier">'+tier+'</div>'+extra+'</div>';
const fixture=()=>parseHTML('<title>Example - Intigriti</title><main>'+box('Assets',row('*.example.test','No bounty')+row('admin.example.test','Out of scope')+row('unknown.test','Unrecognized'))+box('Rules of engagement','<div class="testing-requirements-container"><div><label>Automated tooling</label><div class="tr-value">max. 5 requests /sec</div></div></div><div class="marked"><p>No DoS</p></div>')+box('In scope','<div class="marked"><p>Use own accounts.</p></div>')+box('Out of scope','<div class="marked"><ul><li>Social engineering</li></ul></div>')+box('FAQ','<p>Omit this FAQ</p>')+'</main>').document;
const capture=globalThis.ScopeBriefIntigriti.capture;
test('Intigriti keeps no bounty in scope and explicit exclusions out of scope',()=>{
 const c=capture(fixture(),url);
 assert.deepEqual(c.assets.map(a=>a.scope),['in_scope','out_of_scope','unknown']);
 assert.equal(c.assets[0].eligible_for_bounty,false);
 const data=assemble(identity(url),[c]),out=markdown(data);
 assert.match(out,/max. 5 requests \/sec/);assert.match(out,/No bounty/);assert.doesNotMatch(out,/Omit this FAQ/);
 assert.equal(data.program.key,'company/program');
 assert.equal(mergeCaptures([{adapter:'generic'}],c).length,1);
});
test('Intigriti warns for collapsed descriptions and active filters',()=>{
 const doc=fixture(),assets=doc.querySelector('.detail-content');
 assets.insertAdjacentHTML('afterbegin','<input value="admin"><div class="show-description"></div>');
 doc.querySelector('.asset-container').insertAdjacentHTML('beforeend','<div class="show-description"><button>Expand</button></div>');
 const c=capture(doc,url);assert.ok(c.warnings.some(w=>w.includes('collapsed')));assert.ok(c.warnings.some(w=>w.includes('filters')));
});
test('Intigriti rejects unloaded and unrelated pages',()=>{
 assert.throws(()=>capture(parseHTML('<main>Loading</main>').document,url),/not loaded/);
 assert.throws(()=>capture(fixture(),url.replace('/detail','/updates')),/Detail page/);
 assert.throws(()=>capture(fixture(),url.replace('app.intigriti.com','evil.test')),/Detail page/);
});
