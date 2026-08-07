import { chromium } from 'playwright';
const OUT='/tmp/claude-0/-home-user-callofbooty/da4cd082-1751-5b84-8ed0-dab633d44b6c/scratchpad';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage']});
const p = await b.newPage({ viewport:{width:1400,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:5173/',{waitUntil:'load',timeout:60000});
await p.waitForFunction(()=>!!window.__game,null,{timeout:90000});
await p.waitForTimeout(2500);
console.log('errors:', errs.length?errs[0]:'none');
await p.evaluate(()=>{for(const el of document.body.children) if(el.tagName!=='CANVAS') el.style.display='none';});
// The render camera only syncs from the controller once the game loop is
// running, and in the menu it sits parked near downtown — which is why pinning
// the controller moved nothing. Drive playerCam.camera directly instead.
await p.evaluate(()=>{window.__pin=null;const g=window.__game;const s=()=>{if(window.__pin){const[x,y,z,pi,ya]=window.__pin;
  const c=g.playerCam.camera;
  c.position.set(x,y,z);
  c.rotation.set(pi,ya,0,'YXZ');
  c.updateMatrixWorld(true);
  g.controller.pos.set(x,y,z);g.controller.prevPos.set(x,y,z);g.controller.vel.set(0,0,0);
  g.playerCam.pitch=pi;g.playerCam.yaw=ya;}requestAnimationFrame(s);};requestAnimationFrame(s);});
for (const [n,x,y,z,pi,ya] of JSON.parse(process.env.SHOTS)) {
  await p.evaluate(v=>{window.__pin=v;},[x,y,z,pi,ya]);
  await p.waitForTimeout(2200);
  await p.screenshot({timeout:180000,path:`${OUT}/${n}.png`});
  console.log('shot',n);
}
await b.close();
