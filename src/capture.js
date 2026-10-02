(async () => {
 try {
 if(location.hostname==='app.intigriti.com') return await globalThis.ScopeBriefIntigriti.capture();
 if(location.hostname==='hackerone.com') return await globalThis.ScopeBriefHackerOne.capture();
 if(location.hostname==='bugcrowd.com'||location.hostname.endsWith('.bugcrowd.com')) return await globalThis.ScopeBriefBugcrowd.capture();
 if(location.hostname==='yeswehack.com') return await globalThis.ScopeBriefYesWeHack.capture();
 throw Error('Open a HackerOne, Bugcrowd, YesWeHack, or Intigriti program page.');
 } catch(error) {
  return {capture_error:error instanceof Error?error.message:String(error)};
 }
})();
