import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
async function ck(path, needles){
  await p.goto('http://localhost:3000'+path,{waitUntil:'load',timeout:30000});
  await p.waitForTimeout(2000);
  const bg = await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  const dock = await p.locator('.app-dock').count();
  const txt = (await p.innerText('body')).replace(/\s+/g,' ');
  console.log('\n'+path+'  body-bg='+bg+'  dock='+dock);
  for(const n of needles) console.log('   '+(txt.toLowerCase().includes(n.toLowerCase())?'OK  ':'MISS')+n);
}
await ck('/hermes',['Live','parsed directly','Total Requests','Avg Latency']);
await ck('/agents',['Agent Staff Console','Drag to rotate']);
await ck('/dashboard',['Ultra AI']);
await b.close();
