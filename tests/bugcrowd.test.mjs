import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import '../src/bugcrowd.js';
import {assemble, identity, markdown} from '../src/core.js';
import {renderPreview} from '../src/preview.js';
const {capture, block} = globalThis.ScopeBriefBugcrowd;
const url = 'https://bugcrowd.com/engagements/sample';
const row = (value, issue = '') => `<tr><td data-label="Name / Location"><span data-tooltip-id="categoryTooltip" data-tooltip-content="website"><code class="cc-rewards-link-table__endpoint">${value}</code></span></td><td data-label="Tags"><ul><li>React</li><li><span data-tooltip-content="Website Testing, HTTP">+2</span></li></ul></td>${issue}</tr>`;
const group = (scope, content) => `<div class="cc-target-grp"><h2 class="bc-panel__title">${scope} targets</h2><span class="cc-scope-pill">${scope}</span><table><tbody>${content}</tbody></table></div>`;
const fixture = () => parseHTML(`<!doctype html><html><head><title>Sample</title></head><body><main><h2>Sample</h2><div role="tabpanel">
${group('In scope',row('*.example.test'))}${group('Out of scope',row('*.sandbox.example.test', '<td data-label="Known issues">0</td>'))}
<div class="bc-markdown"><p>Only listed targets.</p><h2>Program Guidelines</h2><p>No public disclosure.</p><h2>Test Booking Rules</h2><ul><li>Use surname <code>TEST</code>.</li>Please only use <code>TESTPRODUCT1</code><li>Book 3 months in advance.</li><li>Cancel 2 months before the booking.</li></ul><h2>Credit card caution</h2><hr><h2>Access</h2><p>Use <a href="/help">researcher email</a>.</p><h2>Excluded Submission Types</h2><ul><li>DoS</li>Features requiring <strong>KYC</strong> are excluded.<li>Third-party breached passwords.</li></ul></div>
<h3 id="whats_new">What's new</h3><div class="bc-markdown">Old announcement should not become policy</div>
<section><h3 id="things_to_know">Things to know</h3><section class="bc-panel"><span class="bc-panel__title">Nondisclosure</span><div class="bc-panel__main">This engagement <strong>does not</strong> allow disclosure.</div></section></section>
</div></main></body></html>`).document;
test('explicit out-of-scope badge wins over parent wildcard',()=>{
 const result = capture(fixture(),url);
 assert.equal(result.assets.length,2);
 assert.equal(result.assets[1].scope,'out_of_scope');
 assert.equal(result.assets[0].location,'*.example.test');
 assert.equal(result.assets[0].known_issues,null);
 assert.equal(result.assets[1].known_issues,0);
 assert.deepEqual(result.assets[0].tags,['React','Website Testing','HTTP']);
});
test('scope unknown is never guessed from group name',()=>{
 const doc=fixture();doc.querySelector('.cc-scope-pill').textContent='Unrecognized';
 const result=capture(doc,url);assert.equal(result.assets[0].scope,'unknown');assert.match(result.warnings.join(),/could not be verified/);
});
test('instructions outside li, heading-only warnings, links, and nondisclosure survive',()=>{
 const result=capture(fixture(),url), text=markdown(assemble(identity(url),[result]));
 for(const phrase of ['TESTPRODUCT1','3 months','2 months','KYC','Credit card caution','**does not**','https://bugcrowd.com/help']) assert.ok(text.includes(phrase),phrase);
 assert.ok(!text.includes('Old announcement should not become policy'));
 assert.ok(!text.includes('Category:'));
 assert.ok(text.indexOf('*.sandbox.example.test')>text.indexOf('## Out-of-Scope Targets'));
 assert.match(text,/# Sample — Bug Bounty Brief/);
});
test('unloaded page and non-details views fail explicitly',()=>{
 assert.throws(()=>capture(parseHTML('<main>Loading</main>').document,url),/not ready/);
 assert.throws(()=>capture(fixture(),url+'/announcements'),/Details/);
});
test('Markdown retains nested lists and table delimiter rows',()=>{
 const {document}=parseHTML('<div><ol><li>First<ul><li>Nested</li></ul></li><li>Second</li></ol><table><tr><th>Target</th><th>Rule</th></tr><tr><td>example.test</td><td>a|b</td></tr></table></div>');
 const text=block(document.querySelector('div'),url);
 assert.match(text,/1\. First/);assert.match(text,/   - Nested/);assert.match(text,/\| --- \| --- \|/);assert.match(text,/a\\\|b/);
});
test('preview renders document and treats page HTML and unsafe links as text',()=>{
 const {document}=parseHTML('<article></article>'); globalThis.document=document;
 renderPreview(document.querySelector('article'),'# Brief\n\n**Scope:** In scope\n\n<script>alert(1)</script>\n\n[bad](<javascript:alert(1)>)\n\n[good](<https://example.test>)');
 assert.equal(document.querySelector('h1').textContent,'Brief');
 assert.equal(document.querySelectorAll('script').length,0);
 assert.equal(document.querySelectorAll('a').length,1);
 assert.equal(document.querySelector('a').getAttribute('href'),'https://example.test/');
 delete globalThis.document;
});
test('preview renders Markdown tables as table elements',()=>{
 const {document}=parseHTML('<article></article>');globalThis.document=document;
 renderPreview(document.querySelector('article'),'| Target | Notes |\n| --- | --- |\n| example.test | a\\|b |');
 assert.equal(document.querySelectorAll('th').length,2);assert.equal(document.querySelectorAll('td').length,2);
 assert.equal(document.querySelector('td:last-child').textContent,'a|b');delete globalThis.document;
});
