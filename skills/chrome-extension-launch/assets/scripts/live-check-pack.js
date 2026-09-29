// SKILL NOTE: packs one platform's zones + tagger + live-check-harness.js into a snippet to paste into a signed-in tab (via Claude in Chrome javascript_tool) to verify selectors without installing.
// Packs one platform's zones + tagger + the harness into a small snippet for live testing.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../src/zones.js'),'utf8');
const ctx={self:{}};vm.runInNewContext(src,ctx);const DX=ctx.self.DX;
const id=process.argv[2];const P=DX.platforms[id];
const zones=JSON.stringify(P.zones);
const views='['+P.views.map(v=>`{id:${JSON.stringify(v.id)},match:${v.match.toString()},zones:${JSON.stringify(DX.zonesInView(v))}}`).join(',')+']';
const tagger=P.tagger?'function '+P.tagger.toString():'null';
const head=`(()=>{var PP={id:${JSON.stringify(id)},zones:${zones},views:${views},tagger:${tagger}};var DX={platformForHost:()=>PP,viewFor:(P,p)=>P.views.find(v=>v.match(p)),zonesInView:v=>v.zones};\n`;
const h=fs.readFileSync(path.join(__dirname,'live-check-harness.js'),'utf8').replace(/^\/\/.*\n/,'');
process.stdout.write(head+h.replace(/const e=window.__dxTag\(\);JSON.stringify/,"const e=window.__dxTag();return JSON.stringify").trim()+"})()");
