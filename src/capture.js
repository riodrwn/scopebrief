(() => {
 if(location.hostname==='hackerone.com') return globalThis.ScopeBriefHackerOne.capture();
 if(location.hostname==='bugcrowd.com'||location.hostname.endsWith('.bugcrowd.com')) return globalThis.ScopeBriefBugcrowd.capture();
 if(location.hostname==='yeswehack.com') return globalThis.ScopeBriefYesWeHack.capture();
 throw Error('Open a HackerOne, Bugcrowd, or YesWeHack program page.');
})();
