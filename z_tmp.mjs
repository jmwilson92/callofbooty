import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage']});
const p = await b.newPage({ viewport:{width:900,height:600} });
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:5173/',{waitUntil:'load',timeout:60000});
await p.waitForFunction(()=>!!window.__game,null,{timeout:90000});
await p.waitForTimeout(2500);
const box = JSON.parse(process.env.BOX);
const r = await p.evaluate((box)=>{
  const g=window.__game,c=g.controller;
  const idle={action:()=>false,actionPressed:()=>false,buttons:new Set()};
  const save=c.pos.clone(); let tested=0,sunk=0,worst=0,worstAt=null,landed=[];
  for(let ix=0;ix<36;ix++)for(let iz=0;iz<30;iz++){
    const x=box[0]+(box[2]*ix)/35, z=box[1]+(box[3]*iz)/29;
    const th=g.terrain.heightAt(x,z);
    tested++;
    c.pos.set(x, Math.max(th,2)+60, z);c.prevPos.copy(c.pos);c.vel.set(0,0,0);c.mantling=false;c.sliding=false;
    for(let t=0;t<300;t++)c.tick(1/60,idle,0);
    const gh=g.terrain.heightAt(c.pos.x,c.pos.z);
    // Standing above terrain means we landed on a structure (deck, pier, roof)
    if (c.pos.y > gh + 2.5) landed.push(+c.pos.y.toFixed(1));
    const below=gh-c.pos.y;
    if(below>worst){worst=below;worstAt=[Math.round(c.pos.x),Math.round(c.pos.z)];}
    if(below>1.5)sunk++;
  }
  c.pos.copy(save);c.prevPos.copy(save);
  landed.sort((a,b)=>b-a);
  return {tested,sunk,worst:+worst.toFixed(2),worstAt,onStructures:landed.length,highest:landed.slice(0,6)};
}, box);
console.log(JSON.stringify(r), '| errors:', errs.length?errs[0]:'none');
await b.close();
