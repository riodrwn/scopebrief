// Browser UI fixture only. Never included in extension builds.
globalThis.browser={
 tabs:{query:async()=>[{id:1}]},
 storage:{local:{get:async()=>({records:JSON.parse(sessionStorage.getItem('fixture-records')||'{}')}),set:async({records})=>sessionStorage.setItem('fixture-records',JSON.stringify(records))}},
 scripting:{executeScript:async()=>[{result:{url:'https://hackerone.com/fixture-program',title:'Fixture program',captured_at:new Date().toISOString(),method:'fixture',text_length:89,sections:[{heading:'Rules of Engagement',text:'Traffic must not exceed 3 requests per second.'},{heading:'Out of Scope Vulnerabilities',text:'Denial of service is excluded.'}],links:[]}}]}
};
