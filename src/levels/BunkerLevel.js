(function(root){
  'use strict';

  const BunkerLevel = {
    id: 'bunker-01',
    build(context) {
      const { THREE: T, scene, mat, box, canvas, randomRange: R, solids, boxes } = context;
      const S=12,H=7;
const fl=new T.Mesh(new T.PlaneGeometry(S*2,S*2),mat('floor',6,6,.3,0x77796d));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;scene.add(fl);solids.push(fl);
box(0,H,0,S*2+2,.6,S*2+2,mat('concrete',6,2,0,0x77776d),false);
box(-7.15,H/2,-S-.5,10.9,H,1,mat('concrete',6,2,0,0x77776d));box(7.15,H/2,-S-.5,10.9,H,1,mat('concrete',6,2));box(0,H-.5,-S-.5,4.2,1,1,mat('metal',2,1,.85),false);
box(-7.15,H/2,S+.5,10.9,H,1,mat('concrete',6,2));box(7.15,H/2,S+.5,10.9,H,1,mat('concrete',6,2));box(0,H-.5,S+.5,4.2,1,1,mat('metal',2,1,.85),false);
// Entry passage: the player begins here and walks into the bunker through the southern bulkhead.
const entryFloor=new T.Mesh(new T.PlaneGeometry(5.2,14),mat('floor',2,5,.3));entryFloor.rotation.x=-Math.PI/2;entryFloor.position.set(0,.015,19);entryFloor.receiveShadow=true;scene.add(entryFloor);solids.push(entryFloor);
box(-2.8,3,19,.45,6,14,mat('concrete',2,4,0,0x77776d));box(2.8,3,19,.45,6,14,mat('concrete',2,4));box(0,H-.35,19,5.9,.5,14,mat('metal',2,5,.8),false);box(0,3,26.5,5.6,6,.45,mat('metal',2,2,.9));
const entryLamp=new T.PointLight(0x4c9dff,.85,16,2);entryLamp.position.set(0,4.8,19);scene.add(entryLamp);
// Passageway to the lower laboratory wing: the doorway is part of the playable space, not a teleport.
const corridorFloor=new T.Mesh(new T.PlaneGeometry(5.2,14),mat('floor',2,5,.3));corridorFloor.rotation.x=-Math.PI/2;corridorFloor.position.set(0,.015,-19);corridorFloor.receiveShadow=true;scene.add(corridorFloor);solids.push(corridorFloor);
box(-2.8,3,-19,.45,6,14,mat('concrete',2,4));box(2.8,3,-19,.45,6,14,mat('concrete',2,4));box(0,H-.35,-19,5.9,.5,14,mat('metal',2,5,.8),false);
const corridorLight=new T.Mesh(new T.BoxGeometry(.25,.12,8),new T.MeshBasicMaterial({color:0xffa34d}));corridorLight.position.set(0,6.1,-18);scene.add(corridorLight);const corridorLamp=new T.PointLight(0xff7b32,1.1,18,2);corridorLamp.position.set(0,4.8,-18);scene.add(corridorLamp);
// A clearly readable elevator portal: twin armored leaves, a heavy lintel and cyan status rails.
const elevatorSteel=mat('metal',1,1,.9,0x657783);
const elevatorDoors=[
  box(-1.4,3,-26,2.8,5.7,.32,mat('metal',1,1,.88,0x3d4b54)),
  box(1.4,3,-26,2.8,5.7,.32,mat('metal',1,1,.88,0x3d4b54))
];
elevatorDoors[0].userData.openX=-4.15;elevatorDoors[1].userData.openX=4.15;
box(-2.95,3,-26,.28,6.1,.62,elevatorSteel,false);box(2.95,3,-26,.28,6.1,.62,elevatorSteel,false);
box(0,6.12,-26,6.15,.32,.62,elevatorSteel,false);
for(const x of[-2.72,2.72]){
 const rail=new T.Mesh(new T.BoxGeometry(.055,4.9,.035),new T.MeshBasicMaterial({color:0x4bd7ff}));
 rail.position.set(x,3,-25.66);scene.add(rail);
}
const elevatorHeader=new T.Mesh(new T.BoxGeometry(1.1,.24,.045),new T.MeshBasicMaterial({color:0x50dfff}));
elevatorHeader.position.set(0,6.34,-25.65);scene.add(elevatorHeader);
let exitOpen=false;
box(-S-.5,H/2,0,1,H,S*2,mat('concrete',6,2));box(S+.5,H/2,0,1,H,S*2,mat('concrete',6,2));
const mm=mat('metal',1,1,.85),mm2=mat('metal',2,1,.7,0xa9794f),mc=mat('concrete',1,3);
function barrel(x,z){
  const red=new T.MeshStandardMaterial({color:0x9f241b,roughness:.38,metalness:.68});
  const steel=new T.MeshStandardMaterial({color:0x737b80,roughness:.32,metalness:.9});
  const body=new T.Mesh(new T.CylinderGeometry(.48,.48,1.3,32,1,false),red);
  body.position.set(x,.68,z);body.castShadow=body.receiveShadow=true;
  for(const y of[-.43,.43]){
    const rim=new T.Mesh(new T.TorusGeometry(.48,.035,8,32),steel);
    rim.rotation.x=Math.PI/2;rim.position.y=y;rim.castShadow=true;body.add(rim);
  }
  for(const y of[-.65,.65]){
    const cap=new T.Mesh(new T.CylinderGeometry(.455,.455,.045,32),steel);
    cap.position.y=y;cap.castShadow=true;body.add(cap);
  }
  const bung=new T.Mesh(new T.CylinderGeometry(.065,.065,.025,16),red);
  bung.position.set(.19,.681,-.12);body.add(bung);
  const label=canvas(256,(ctx,s)=>{
    ctx.fillStyle='#e7d8bd';ctx.fillRect(0,0,s,s);
    ctx.fillStyle='#9f241b';ctx.fillRect(0,0,s,30);ctx.fillRect(0,s-30,s,30);
    ctx.fillStyle='#272727';ctx.font='bold 34px Arial';ctx.textAlign='center';
    ctx.fillText('DANGER',s/2,82);ctx.font='bold 25px Arial';ctx.fillText('FLAMMABLE',s/2,118);
    ctx.fillStyle='#d18a21';ctx.beginPath();ctx.moveTo(s/2,132);ctx.lineTo(s/2-36,196);ctx.lineTo(s/2+36,196);ctx.closePath();ctx.fill();
    ctx.fillStyle='#171717';ctx.font='bold 45px Arial';ctx.fillText('!',s/2,184);
  });
  const labelMap=new T.CanvasTexture(label);labelMap.encoding=T.sRGBEncoding;
  const decal=new T.Mesh(new T.PlaneGeometry(.34,.48),new T.MeshBasicMaterial({map:labelMap,side:T.DoubleSide}));
  decal.position.set(0,0,.482);body.add(decal);
  scene.add(body);solids.push(body);
  const collisionBox={x0:x-.5,x1:x+.5,z0:z-.5,z1:z+.5,y0:.03,y1:1.33,topY:1.33};
  boxes.push(collisionBox);
  body.userData.collisionBox=collisionBox;
  body.userData.destructible={health:2,destroyed:false};
  body.userData.explosive={radius:7,damage:105};
  return body;
}
box(0,.65,-1,7,1.3,.6,mc);box(-6.5,H/2-.3,0,1.2,H,1.2,mc);box(6.5,H/2-.3,0,1.2,H,1.2,mc);
[[-8,1.1,-7,2.2],[8.3,1.1,-6.5,2.2],[3.5,.8,-6,1.6],[-4.5,.8,6,1.6],[9,1.1,8,2.2],[-9,.8,5,1.6],[0,.8,6.5,1.6]].forEach(([x,y,z,s],i)=>box(x,y,z,s,s,s,i%2?mm2:mm));
[[-3,-5],[5,3],[-10,-2],[10.5,-1.5]].forEach(([x,z])=>barrel(x,z));
for(const z of[-S+1.2,S-1.2]){const p=new T.Mesh(new T.CylinderGeometry(.22,.22,S*2,16),mm);p.rotation.z=Math.PI/2;p.position.set(0,H-1.2,z);p.castShadow=true;scene.add(p)}
// неоновая вывеска
const sg=canvas(512,(x,s)=>{x.fillStyle='#000';x.fillRect(0,0,s,s);x.fillStyle='#ff5a2a';x.font='bold 150px Bahnschrift,Arial';x.textAlign='center';x.fillText('SECTOR 7',256,230);x.font='60px Arial';x.fillStyle='#ffd0a0';x.fillText('ДОСТУП ЗАПРЕЩЁН',256,330)});
const sm=new T.MeshBasicMaterial({map:new T.CanvasTexture(sg),color:new T.Color(2.4,2.4,2.4)});sm.map.encoding=T.sRGBEncoding;
const sign=new T.Mesh(new T.PlaneGeometry(7,7),sm);sign.scale.y=.5;sign.rotation.y=Math.PI/2;sign.position.set(-S-.02,4.2,0);scene.add(sign);
// Архивный терминал с необязательной записью инженера.
const terminalBase=new T.Mesh(new T.BoxGeometry(1.1,1.7,.8),mm);terminalBase.position.set(-7,.85,8);terminalBase.castShadow=true;scene.add(terminalBase);
const terminalScreen=new T.Mesh(new T.PlaneGeometry(.82,.68),new T.MeshBasicMaterial({color:0x35dfff,emissive:0x126080,emissiveIntensity:1.8}));terminalScreen.position.set(-7,1.35,8.41);scene.add(terminalScreen);
const terminalLamp=new T.PointLight(0x25cfff,.8,5,2);terminalLamp.position.set(-7,1.8,8.7);scene.add(terminalLamp);
const terminalSweep=new T.Mesh(new T.PlaneGeometry(.72,.035),new T.MeshBasicMaterial({color:0xb8f5ff,transparent:true,opacity:.72}));terminalSweep.position.set(-7,1.35,8.425);scene.add(terminalSweep);
const terminalBeacon=new T.Mesh(new T.SphereGeometry(.07,12,8),new T.MeshBasicMaterial({color:0x35dfff}));terminalBeacon.position.set(-6.48,1.63,8.43);scene.add(terminalBeacon);
// свет
scene.add(new T.HemisphereLight(0x3a5570,0x0a0a0a,.35));
const strips=new T.MeshStandardMaterial({color:0,emissive:0xcfeaff,emissiveIntensity:4});
const bunkerLights=[];
[[-5,-5],[5,5],[-5,5],[5,-5]].forEach(([x,z],i)=>{const s=new T.Mesh(new T.BoxGeometry(.3,.1,5),strips);s.position.set(x,H-.35,z);scene.add(s);
 const l=new T.PointLight(0xbfe0ff,.75,20,2);l.position.set(x,H-1,z);if(i<2){l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-.002}scene.add(l);bunkerLights.push(l)});
[[0xff6a1a,-10.5,3,9,1.2],[0xff2a8a,10.5,3,-9,1.2],[0x20e0ff,0,2.5,-10.5,1]].forEach(([c,x,y,z,i])=>{const l=new T.PointLight(c,i,15,2);l.position.set(x,y,z);scene.add(l);
 const g=new T.Mesh(new T.BoxGeometry(.3,2.4,.3),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(3)}));g.position.set(x,y,z);scene.add(g)});
// пыль
{const n=500,p=new Float32Array(n*3);for(let i=0;i<n;i++){p[i*3]=R(-S,S);p[i*3+1]=R(.2,H-1);p[i*3+2]=R(-S,S)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));var dust=new T.Points(g,new T.PointsMaterial({size:.035,color:0xaac8e0,transparent:true,opacity:.45,depthWrite:false}));scene.add(dust)}
      // A lived-in watch station: desks, lockers, field crates and wall-mounted utility cabinets.
      const furnitureMetal = mat('metal', 1, 1, .72, 0x41494b);
      const wornSurface = mat('concrete', 1, 1, .08, 0x625d4e);
      for (const [x, z] of [[-10, 13], [10, 13]]) {
        box(x, .78, z, 3.2, .16, 1.25, wornSurface);
        box(x - 1.35, .38, z, .16, .76, 1.05, furnitureMetal, false);
        box(x + 1.35, .38, z, .16, .76, 1.05, furnitureMetal, false);
        box(x, 1.35, z - .42, 2.5, .95, .12, furnitureMetal, false);
        box(x, 1.02, z - .34, 1.75, .035, .025, new T.MeshBasicMaterial({ color: 0x9bb8bd }), false);
      }
      // Lockers and a low supply rack sit against the perimeter, leaving the combat lane clear.
      for (let i = 0; i < 4; i++) {
        const locker = box(12.1, 1.15, -10.5 + i * 1.45, .82, 2.3, .9, furnitureMetal);
        const vent = new T.Mesh(new T.BoxGeometry(.34, .035, .025), new T.MeshBasicMaterial({ color: 0x161d20 }));
        vent.position.set(12.1, 1.72, -10.02 + i * 1.45); scene.add(vent);
      }
      for (let i = 0; i < 3; i++) {
        box(-12.2, .55 + i * .72, -8.5, 2.1, .12, 1.1, furnitureMetal, false);
        for (const x of [-13.1, -11.3]) box(x, .35 + i * .72, -8.5, .12, .52, .12, furnitureMetal, false);
      }
      // A damaged field generator adds a readable silhouette and a small pool of warning light.
      const fieldGenerator = box(-12, .85, 3.5, 1.8, 1.7, 1.25, furnitureMetal);
      fieldGenerator.userData.destructible = { health: 4, destroyed: false };
      const generatorVent = new T.Mesh(new T.BoxGeometry(.9, .58, .025), new T.MeshBasicMaterial({ color: 0x182126 }));
      generatorVent.position.set(-12, .95, 4.14); scene.add(generatorVent);
      const generatorLamp = new T.PointLight(0xff8a35, .55, 4, 2);
      generatorLamp.position.set(-12, 1.8, 4.7); scene.add(generatorLamp);
      fieldGenerator.userData.breakLight = generatorLamp;

      // Heavy cross-bracing and hazard markings make this sector read as a military bunker.
      const bunkerRibMat = mat('metal', 1, 2, .92, 0x4b514e);
      const hazardMat = new T.MeshBasicMaterial({ color: 0xd28a32 });
      for (const z of [-9, 0, 9]) {
        const rib = new T.Mesh(new T.BoxGeometry(23.2, .34, .42), bunkerRibMat);
        rib.position.set(0, 6.45, z); rib.castShadow = true; scene.add(rib);
        for (const x of [-10.8, 10.8]) {
          const brace = new T.Mesh(new T.BoxGeometry(.34, 6.2, .42), bunkerRibMat);
          brace.position.set(x, 3.25, z); brace.castShadow = true; scene.add(brace);
        }
      }
      for (const x of [-2.2, 2.2]) {
        const stripe = new T.Mesh(new T.BoxGeometry(.16, .018, 2.4), hazardMat);
        stripe.position.set(x, .035, 11.2); scene.add(stripe);
      }

      return {
        name: 'Заброшенный бункер',
        bounds: { halfSize: 27, height: H },
        exitZone: { x0: -2.1, x1: 2.1, z0: -27.6, z1: -26.2 },
        playerSpawn: { x: 0, y: 1.7, z: 22, yaw: 0 },
        enemySpawnPoints: [[-10,-10],[10,-10],[-10,10],[10,10],[0,-10.5]],
        openExit() { exitOpen = true; elevatorDoors.forEach(door=>context.removeCollisionBox(door.userData.collisionBox)); },
        update(dt, time) {
          bunkerLights.forEach((light, index) => { light.intensity = .68 + Math.sin(time * 2.1 + index * 1.4) * .08; });
          terminalSweep.position.y = 1.12 + ((time * .42) % 1) * .46;
          terminalSweep.material.opacity = .38 + Math.sin(time * 5) * .18;
          terminalBeacon.material.color.setHex(Math.sin(time * 3.5) > -.35 ? 0x35dfff : 0x174c67);
          terminalLamp.intensity = .62 + Math.sin(time * 4.2) * .16;
          if(exitOpen)elevatorDoors.forEach(door=>{door.position.x+=(door.userData.openX-door.position.x)*Math.min(1,dt*3.2)});
        },
        interactables: [{
          id: 'bunker-log',
          label: 'ПРОСМОТРЕТЬ АРХИВНУЮ ЗАПИСЬ',
          x: -7,
          z: 8,
          dialogue: [
            { speaker: 'АРХИВ / 07', text: 'Личный журнал инженера Ильи. Запись за 14 октября. Проект автономного ядра вышел за пределы расчётных параметров.' },
            { speaker: 'ИЛЬЯ', text: 'Я просил остановить испытания. Руководство решило, что система сможет сама определить угрозы. Теперь она считает угрозой каждого человека.' }
          ]
        }],
        dust
      };
    }
  };

  root.S7BunkerLevel = BunkerLevel;
  if (typeof module !== 'undefined' && module.exports) module.exports = BunkerLevel;
})(typeof window !== 'undefined' ? window : globalThis);
