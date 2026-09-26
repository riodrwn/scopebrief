import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import '../src/bugcrowd.js';
import '../src/yeswehack.js';
import {assemble,identity,markdown,mergeCaptures} from '../src/core.js';
const url='https://yeswehack.com/programs/example';
const fixture=()=>parseHTML('<main><h1>Example</h1><h2>Description</h2><p>Omit this</p><table id="program-scopes-table"><thead><tr><th>Scope</th><th>Type</th><th>Asset value</th><th></th></tr></thead><tbody><tr><td>*.example.test</td><td>Web application</td><td>High</td><td>Expand row</td></tr><tr><td colspan="4">Reward 1000</td></tr></tbody></table><div><h3>Out of scopes</h3><span><ul><li>No DoS</li></ul></span></div><div><h3>Qualifying vulnerabilities</h3><span><ul><li>Demonstrate impact</li></ul></span></div><div><h3>Non-qualifying vulnerabilities</h3><span><ul><li>No impact</li></ul></span></div></main>').document;
const capture=globalThis.ScopeBriefYesWeHack.capture;
test('YesWeHack separates scopes and both vulnerability lists without rewards',()=>{
 const c=capture(fixture(),url),data=assemble(identity(url),[c]),out=markdown(data);
 assert.equal(c.assets.length,1);assert.equal(c.sections.length,3);assert.equal(c.warnings.length,0);
 assert.equal(data.sections[1].category,'in_scope_vulnerabilities');
 assert.equal(data.sections[2].category,'out_of_scope_vulnerabilities');
 assert.match(out,/## Vulnerability types/);assert.match(out,/- No DoS/);
 assert.doesNotMatch(out,/Reward 1000|Omit this|Expand row/);
 assert.equal(mergeCaptures([{adapter:'generic'}],c).length,1);
});
test('YesWeHack missing exclusions are reported rather than inferred',()=>{
 const doc=fixture();doc.querySelector('h3').parentElement.remove();
 const c=capture(doc,url);assert.equal(c.sections.length,2);assert.match(c.warnings[0],/Out of scopes/);
});
test('YesWeHack rejects unloaded pages and unrelated paths',()=>{
 assert.throws(()=>capture(parseHTML('<main>Loading</main>').document,url),/not loaded/);
 assert.throws(()=>capture(fixture(),'https://yeswehack.com/programs/example/create-report'),/program page/);
 assert.throws(()=>capture(fixture(),'https://yeswehack.com.evil.test/programs/example'),/program page/);
});
