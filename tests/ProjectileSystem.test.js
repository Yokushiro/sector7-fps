const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('src/combat/ProjectileSystem.js','utf8'),context);
const System=context.window.S7ProjectileSystem;
function shot(x,y,z,vx=0,vy=0,vz=0,life=3,damage=8){
 const disposed={geometry:0,material:0,removed:0};
 return {m:{position:{x,y,z,addScaledVector(v,dt){this.x+=v.x*dt;this.y+=v.y*dt;this.z+=v.z*dt},distanceTo(p){return Math.hypot(this.x-p.x,this.y-p.y,this.z-p.z)}},geometry:{dispose(){disposed.geometry++}},material:{dispose(){disposed.material++}}},v:{x:vx,y:vy,z:vz},l:life,damage,disposed};
}
test('projectiles move, damage the player and dispose resources',()=>{
 const removed=[],system=new System({scene:{remove:m=>removed.push(m)}}),p=shot(0,1,1,0,0,-10,3,12),items=[p],hits=[];
 assert.equal(system.update(items,.1,{x:0,y:1,z:0},[],{halfSize:40},d=>hits.push(d)),1);
 assert.deepEqual(hits,[12]);assert.equal(items.length,0);assert.equal(p.disposed.geometry,1);assert.equal(p.disposed.material,1);assert.equal(removed.length,1);
});
test('solid geometry and expired lifetime remove projectiles without damage',()=>{
 const system=new System(),blocked=shot(0,1,0),expired=shot(8,1,8,0,0,0,.05),items=[blocked,expired];
 system.update(items,.1,{x:30,y:1,z:30},[{x0:-1,x1:1,z0:-1,z1:1}],{halfSize:40},()=>assert.fail('blocked shot damaged player'));
 assert.equal(items.length,0);assert.equal(blocked.disposed.geometry,1);assert.equal(expired.disposed.material,1);
});
test('out-of-bounds projectiles are removed and clear disposes remaining shots',()=>{
 const system=new System(),outside=shot(39,1,0,20),remaining=shot(0,5,0),items=[outside,remaining];
 system.update(items,.1,{x:-20,y:1,z:-20},[],{halfSize:40},()=>{});
 assert.equal(items.length,1);assert.equal(outside.disposed.geometry,1);system.clear(items);assert.equal(items.length,0);assert.equal(remaining.disposed.geometry,1);
});
test('projectile system validates inputs',()=>{
 const system=new System();
 assert.throws(()=>system.update(null,.1,{},[],{halfSize:10},()=>{}),/array/);
 assert.throws(()=>system.update([],.1,{},[],{halfSize:10}),/callback/);
});
