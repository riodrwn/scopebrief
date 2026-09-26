import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
const icons=Object.fromEntries([16,32,48,128].map(size=>[size,`icon-${size}.png`]));
const base={manifest_version:3,icons,name:'ScopeBrief',version:'1.0.0',description:'Readable HackerOne, Bugcrowd, YesWeHack and Intigriti scope briefs.',permissions:['activeTab','scripting','storage'],action:{default_icon:icons,default_popup:'popup.html',default_title:'ScopeBrief'}};
for(const browser of ['chrome','firefox']){
 await mkdir(`dist/${browser}`,{recursive:true});
 const manifest=structuredClone(base);
 if(browser==='firefox') manifest.browser_specific_settings={gecko:{id:'scopebrief@local.example',strict_min_version:'140.0',data_collection_permissions:{required:['none']}}};
 for(const file of ['logo.svg','icon-16.png','icon-32.png','icon-48.png','icon-128.png','popup.html','popup.css','popup.js','core.js','capture.js','bugcrowd.js','brief.js','preview.js','hackerone.js','hackerone-brief.js','yeswehack.js','yeswehack-brief.js','intigriti.js','intigriti-brief.js']) await copyFile(`src/${file}`,`dist/${browser}/${file}`);
 await writeFile(`dist/${browser}/manifest.json`,JSON.stringify(manifest,null,2));
}
