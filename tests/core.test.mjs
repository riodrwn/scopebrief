import test from 'node:test';
import assert from 'node:assert/strict';
import {identity,classify,assemble,markdown} from '../src/core.js';
test('program identity joins scope and guidelines; resists lookalike host',()=>{
 assert.equal(identity('https://hackerone.com/nba-public?type=team').id,identity('https://hackerone.com/nba-public/policy_scopes').id);
 assert.notEqual(identity('https://hackerone.com/nba-public').id,identity('https://hackerone.com/other').id);
 assert.equal(identity('https://hackerone.com.evil.test/nba').platform,'generic');
 assert.equal(identity('https://app.intigriti.com/programs/company/program/detail').key,'company/program');
 assert.equal(identity('https://bugcrowd.com/engagements/example').key,'example');
 assert.equal(identity('https://yeswehack.com/programs/example').key,'example');
});
test('vulnerability exclusions are distinct from asset targets',()=>{
 assert.equal(classify('Out of Scope Vulnerabilities'),'out_of_scope_vulnerabilities');
 assert.equal(classify('In-Scope Vulnerabilities'),'in_scope_vulnerabilities');
 assert.equal(classify('Rules of Engagement'),'rules_of_engagement');
});
test('export preserves limits, provenance and unknown completeness',()=>{
 const data=assemble(identity('https://hackerone.com/nba-public'),[{url:'https://hackerone.com/nba-public',captured_at:'2026-09-25',kind:'guidelines',sections:[{heading:'Rules of Engagement',text:'Traffic must not exceed 3 requests per second.'}],links:[]}]);
 assert.equal(data.completeness.status,'unverified');assert.ok(data.completeness.missing_categories.includes('asset_scope'));
 assert.match(markdown(data),/3 requests per second/);assert.equal(data.sections[0].source_url,'https://hackerone.com/nba-public');
});
