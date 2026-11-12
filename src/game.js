const T=THREE,R=(a,b)=>a+Math.random()*(b-a),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.info.autoReset=false;
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0x04060a);scene.fog=new T.FogExp2(0x070c12,.034);
// A restrained global fill keeps unlit wall faces readable without flattening local lighting.
scene.add(new T.HemisphereLight(0x9bbbd0,0x383027,.48));
const cam=new T.PerspectiveCamera(75,1,.05,80);cam.rotation.order='YXZ';scene.add(cam);

/* ---------- процедурные PBR-текстуры ---------- */
function canvas(s,paint){const c=document.createElement('canvas');c.width=c.height=s;paint(c.getContext('2d'),s);return c}
function speck(x,s,n){for(let i=0;i<n;i++){const v=R(20,230)|0;x.fillStyle=`rgba(${v},${v},${v},${R(.04,.3)})`;x.fillRect(R(0,s),R(0,s),R(1,4),R(1,4))}}
function stain(x,s,n,col,r0=20,r1=90){for(let i=0;i<n;i++){const px=R(0,s),py=R(0,s),r=R(r0,r1),g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}}
const cv={
 concrete:canvas(512,(x,s)=>{x.fillStyle='#6d6e6b';x.fillRect(0,0,s,s);speck(x,s,16000);stain(x,s,14,'rgba(20,22,22,.5)');stain(x,s,5,'rgba(70,45,25,.35)',10,40);
  x.strokeStyle='rgba(15,15,15,.16)';x.lineWidth=2;for(let i=0;i<=s;i+=256){x.beginPath();x.moveTo(i,0);x.lineTo(i,s);x.moveTo(0,i);x.lineTo(s,i);x.stroke()}}),
 metal:canvas(512,(x,s)=>{x.fillStyle='#4a525a';x.fillRect(0,0,s,s);speck(x,s,12000);stain(x,s,10,'rgba(130,70,30,.45)',10,50);
  x.strokeStyle='rgba(10,12,14,.2)';x.lineWidth=2;x.strokeRect(2,2,s-4,s-4);x.beginPath();x.moveTo(0,s/2);x.lineTo(s,s/2);x.stroke();
  x.fillStyle='rgba(200,210,220,.5)';for(let i=0;i<s;i+=32){for(const j of[14,s-14,s/2-14,s/2+14]){x.beginPath();x.arc(i+16,j,3,0,7);x.fill()}}}),
 floor:canvas(512,(x,s)=>{x.fillStyle='#34373a';x.fillRect(0,0,s,s);speck(x,s,14000);stain(x,s,12,'rgba(0,0,0,.45)',30,110);stain(x,s,3,'rgba(90,100,110,.25)',40,100);
  x.strokeStyle='rgba(5,5,6,.48)';x.lineWidth=3;x.strokeRect(0,0,s,s);x.beginPath();x.moveTo(s/2,0);x.lineTo(s/2,s);x.moveTo(0,s/2);x.lineTo(s,s/2);x.stroke()}),
};
const cache={},styledCanvases={};
const levelPalettes={
 'bunker-01':{tint:'#756d58',line:'rgba(213,151,72,.12)',accent:'rgba(45,31,22,.14)',spacing:96,pattern:'rivets'},
 'lab-02':{tint:'#a9d7df',line:'rgba(80,205,224,.11)',accent:'rgba(225,250,255,.16)',spacing:160,pattern:'grid'},
 'reactor-03':{tint:'#393d43',line:'rgba(255,104,47,.14)',accent:'rgba(12,16,20,.22)',spacing:144,pattern:'plates'},
 'surface-04':{tint:'#777568',line:'rgba(151,143,112,.14)',accent:'rgba(45,49,43,.16)',spacing:160,pattern:'fracture'}
};
function styledTexture(kind,style){
 const key=style+':'+kind;if(styledCanvases[key])return styledCanvases[key];
 const palette=levelPalettes[style];if(!palette)return cv[kind];
 const source=canvas(512,(x,s)=>{
  x.drawImage(cv[kind],0,0);
  x.globalCompositeOperation='multiply';x.fillStyle=palette.tint;x.globalAlpha=.34;x.fillRect(0,0,s,s);
  x.globalCompositeOperation='source-over';x.globalAlpha=1;
  x.strokeStyle=palette.line;x.lineWidth=kind==='metal'?3:5;
  if(palette.pattern==='grid'){
   for(let i=0;i<=s;i+=palette.spacing){x.beginPath();x.moveTo(i,0);x.lineTo(i,s);x.moveTo(0,i);x.lineTo(s,i);x.stroke()}
   x.fillStyle=palette.accent;for(let y=32;y<s;y+=128)for(let xx=32;xx<s;xx+=128)x.fillRect(xx-3,y-3,6,6);
  }else if(palette.pattern==='rivets'){
   for(let y=24;y<s;y+=palette.spacing){x.beginPath();x.moveTo(0,y);x.lineTo(s,y);x.stroke();for(let xx=24;xx<s;xx+=palette.spacing){x.fillStyle=palette.accent;x.fillRect(xx-4,y-4,8,8)}}
  }else if(palette.pattern==='plates'){
   x.lineWidth=2;
   for(let y=28;y<s;y+=palette.spacing)for(let xx=24;xx<s;xx+=palette.spacing){
    x.strokeRect(xx,y,Math.min(112,s-xx-4),Math.min(72,s-y-4));
    x.fillStyle=palette.accent;x.fillRect(xx+7,y+7,4,4);x.fillRect(Math.min(s-8,xx+104),y+7,4,4);
   }
  }else{
   x.lineWidth=4;for(let i=0;i<9;i++){const px=(i*73+31)%s,py=(i*137+47)%s;x.beginPath();x.moveTo(px,py);x.lineTo((px+65+i*9)%s,(py+37+i*13)%s);x.lineTo((px+91+i*7)%s,(py+112+i*5)%s);x.stroke()}
   x.fillStyle=palette.accent;for(let i=0;i<32;i++){const px=(i*97)%s,py=(i*151)%s;x.fillRect(px,py,3,3)}
  }
 });
 return styledCanvases[key]=source;
}
function mat(k,rx,ry,m=0,tint=0xffffff,style='default'){const key=style+':'+k+rx+'_'+ry+m+tint;if(cache[key])return cache[key];
 const t=new T.CanvasTexture(styledTexture(k,style));t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=8;t.encoding=T.sRGBEncoding;
 const material=new T.MeshStandardMaterial({map:t,roughness:.86,metalness:m,color:tint,envMapIntensity:.6});material.userData.sector7Shared=true;return cache[key]=material}

/* ---------- окружение (IBL) ---------- */
{const es=new T.Scene(),g=canvas(256,(x,s)=>{const gr=x.createLinearGradient(0,0,0,s);gr.addColorStop(0,'#2a3b4d');gr.addColorStop(.5,'#10161d');gr.addColorStop(1,'#050607');x.fillStyle=gr;x.fillRect(0,0,s,s)});
 es.add(new T.Mesh(new T.SphereGeometry(10,32,16),new T.MeshBasicMaterial({map:new T.CanvasTexture(g),side:T.BackSide})));
 [[0,8,0,8,.3,3,'#bfe6ff'],[-9,3,0,.3,3,6,'#ff7a2a'],[9,3,2,.3,3,6,'#ff2a8a']].forEach(([x,y,z,w,h,d,c])=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(6)}));m.position.set(x,y,z);es.add(m)});
 const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(es).texture}

/* ---------- уровень ---------- */
const solids=[],boxes=[];
function box(x,y,z,w,h,d,m,col=true,target=scene){const me=new T.Mesh(new T.BoxGeometry(w,h,d),m);me.position.set(x,y,z);me.castShadow=me.receiveShadow=true;target.add(me);const local=target!==scene?target.userData:null;(local?.s7Solids||solids).push(me);
 if(col){const collisionBox={x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,y0:y-h/2,y1:y+h/2,topY:y+h/2};(local?.s7Boxes||boxes).push(collisionBox);me.userData.collisionBox=collisionBox}return me}
const saveSystem=new S7SaveSystem();
const missionSystem=new S7MissionSystem();
let savedCampaign=saveSystem.load();
const requestedMissionId=savedCampaign.campaign.currentMission||location.hash.slice(1);
let currentMission=missionSystem.getMissionForCampaign(savedCampaign.campaign,requestedMissionId);
if(!currentMission)throw new Error('No unlocked campaign missions are available');
let missionObjective=currentMission.objectives.find(objective=>objective.type==='eliminate');
if(!missionObjective)throw new Error('The active mission has no supported elimination objective');
let GOAL=missionObjective.target;

const levelManager=new S7LevelManager({THREE:T,scene,solids,boxes});
levelManager.register(S7BunkerLevel);
levelManager.register(S7LabLevel);
levelManager.register(S7ReactorLevel);
levelManager.register(S7SurfaceLevel);
let activeLevel=levelManager.load(currentMission.levelId,{mat,canvas,randomRange:R,box});
let LEVEL_BOUNDS=activeLevel.bounds;
let dust=activeLevel.dust || {rotation:{y:0},position:{y:0}};

function preloadNextMission(){
 const nextDefinition=S7MissionSystem.MISSIONS.find(mission=>mission.order>currentMission.order);
 if(!nextDefinition||levelManager.getPrepared(nextDefinition.levelId))return false;
 try{
  levelManager.prepare(nextDefinition.levelId,{mat,canvas,randomRange:R,box});
  return true;
 }catch(error){
  console.warn('Next sector preload failed; it will be built during transition',error);
  return false;
 }
}
preloadNextMission();

const torch=new T.SpotLight(0xe8f4ff,1.6,28,.5,.6,1.2);torch.position.set(.2,-.1,0);torch.target.position.set(0,0,-5);cam.add(torch,torch.target);

/* ---------- состояние ---------- */
let GROUND_Y=activeLevel.playerSpawn.y;
const P={pos:new T.Vector3(activeLevel.playerSpawn.x,GROUND_Y,activeLevel.playerSpawn.z),yaw:activeLevel.playerSpawn.yaw||0,pitch:0,hp:100,velocityY:0,grounded:true};
const jumpController=new S7JumpController(GROUND_Y);
let state='menu',kills=0,spawned=0,spawnT=0,hurt=0,tm=0,mouse=false,fallback=false,locked=false,pauseMenu=false,missionCleared=false,combatCleared=false,outroShown=false,outroPlaying=false,introShown=false,evacuationRemaining=0;
const keys=Object.create(null); // shared keyboard state for input handlers and the game loop
const enemies=[],proj=[],sparks=[],explosions=[];
const droneAI=new S7DroneAI();
const $=id=>document.getElementById(id);
const dialogueSystem=new S7DialogueSystem({rootElement:$('dialogue'),speakerElement:$('dialogueSpeaker'),textElement:$('dialogueText'),promptElement:$('dialoguePrompt')});
const elevatorTransition=new S7ElevatorTransition({
 THREE:T,scene,camera:cam,
 onSound:type=>{
  if(type==='door-open')snd(185,.24,'triangle',.07);
  else if(type==='door-close')snd(125,.32,'square',.055);
  else if(type==='motor-start')snd(48,.8,'sawtooth',.045);
  else if(type==='floor-beep')snd(880,.055,'sine',.035);
  else if(type==='arrival')snd(220,.35,'triangle',.06);
 },
 onTravel:()=>{
  try{
   const playerYawOffset=elevatorTransition.capturePlayerYawOffset();
   if(!loadMission(elevatorNextMission,{elevator:true,preserveVitals:elevatorVitals})){
    elevatorTransition.dispose();
    return;
   }
   elevatorTransition.setDestination(P.pos,P.yaw,String(currentMission.order).padStart(2,'0'),playerYawOffset);
   dialogueSystem.startRadio(currentMission.introDialogue,()=>elevatorTransition.setRadioComplete());
  }catch(error){
   console.error('Elevator destination load failed',error);
   elevatorTransition.dispose();
   state='over';
   $('ov').style.display='flex';
   $('ov').innerHTML='<div><h1>ОШИБКА ЗАГРУЗКИ СЕКТОРА</h1><p>Не удалось подготовить следующую локацию.</p><p>Перезапусти миссию, чтобы восстановить кампанию.</p></div>';
  }
 },
 onComplete:()=>{
  state='play';
  cam.position.copy(P.pos);
  cam.rotation.set(P.pitch+weapon.pitchKick,P.yaw,0);
 }
});
let elevatorNextMission=null;
let elevatorVitals=null;
let interactionSystem=new S7InteractionSystem(activeLevel.interactables||[]);
$('dialogue').addEventListener('click',()=>dialogueSystem.advance());
const savedStats=savedCampaign.stats;
$('saveInfo').textContent=`СОХРАНЕНИЕ · Побед: ${savedStats.wins} · Поражений: ${savedStats.losses} · Лучший результат: ${savedStats.bestKills} дронов`;
$('missionTitle').textContent=`${currentMission.title} · ${currentMission.location}`;
$('missionDescription').textContent=currentMission.description;
$('kl').textContent=`Дроны: 0 / ${GOAL}`;
function collide(p,r){for(const b of boxes){const playerBottom=p.y-GROUND_Y;if(Number.isFinite(b.y1)&&playerBottom>=b.y1-.08)continue;const cx=cl(p.x,b.x0,b.x1),cz=cl(p.z,b.z0,b.z1),dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;
 if(d2<r*r){if(d2>1e-6){const d=Math.sqrt(d2),k=(r-d)/d;p.x+=dx*k;p.z+=dz*k}else p.x+=r}}}

/* ---------- звук ---------- */
const audioManager=new S7AudioManager();
let ac;function snd(f,d,type,v,noise){if(!ac)return;const t=ac.currentTime,o=ac.createGain();o.gain.setValueAtTime(v,t);o.gain.exponentialRampToValueAtTime(.0001,t+d);let s,filter;
 if(noise){const b=ac.createBuffer(1,Math.max(1,Math.floor(ac.sampleRate*d)),ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;s=ac.createBufferSource();s.buffer=b;filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=f;s.connect(filter);filter.connect(o)}
 else{s=ac.createOscillator();s.type=type;s.frequency.setValueAtTime(f,t);s.frequency.exponentialRampToValueAtTime(Math.max(20,f/3),t+d);s.connect(o)}
 o.connect(ac.destination);
 // One-shot SFX must end and release their graph; otherwise every shot leaves a quiet oscillator running forever.
 s.onended=()=>{try{s.disconnect()}catch(e){};try{if(filter)filter.disconnect()}catch(e){};try{o.disconnect()}catch(e){}};
 s.start(t);s.stop(t+d+.04)};

/* ---------- враги ---------- */
const bodyM=new T.MeshStandardMaterial({color:0x2b3037,roughness:.28,metalness:.95,envMapIntensity:1.3});
function spawn(){
 const pts=activeLevel.enemySpawnPoints;
 let q;
 for(let i=0;i<8;i++){q=pts[Math.random()*pts.length|0];if(Math.hypot(q[0]-P.pos.x,q[1]-P.pos.z)>9)break}
 const sequence=currentMission.spawn.enemySequence;
 const type=sequence[spawned%sequence.length],profile=S7DroneAI.PROFILES[type];
 const g=new T.Group(),m=bodyM.clone();
 m.color.setHex(profile.bodyColor);
 const eye=new T.MeshBasicMaterial({color:profile.eyeColor});
 const e={...S7EnemyFactory.createCombatant(type,profile,R),g,m,eye};
 let bodyGeometry;
 if(type==='warden') bodyGeometry=new T.IcosahedronGeometry(.82,1);
 else if(type==='sniper') bodyGeometry=new T.CylinderGeometry(.24,.34,1.2,16);
 else if(type==='assault') bodyGeometry=new T.OctahedronGeometry(.48,1);
 else bodyGeometry=new T.CapsuleGeometry(type==='heavy'?.46:.36,type==='heavy'?1:.7,8,20);
 const body=new T.Mesh(bodyGeometry,m);
 if(type==='assault')body.scale.set(1,.78,1.18);
 const head=new T.Mesh(new T.SphereGeometry(type==='heavy'?.32:.27,24,16),m);
 head.position.y=type==='warden'?1.25:type==='heavy'?1.02:.82;
 const sensor=new T.Mesh(new T.SphereGeometry(type==='sniper'?.14:.11,16,10),eye);
 sensor.position.set(0,type==='warden'?1.3:type==='heavy'?1.05:.85,.25);
 head.userData.head=1;
 const ringColor=new T.Color(profile.ringColor).multiplyScalar(1.6);
 const ring=new T.Mesh(new T.TorusGeometry(type==='warden'?1.02:type==='heavy'?.65:type==='assault'?.5:.46,.055,10,40),new T.MeshBasicMaterial({color:ringColor}));
 ring.rotation.x=Math.PI/2;ring.position.y=.08;
 g.add(body,head,sensor,ring);
 const hitFlash=new T.Mesh(new T.OctahedronGeometry(.18,0),new T.MeshBasicMaterial({color:0xffd18a,transparent:true,opacity:0,depthWrite:false}));
 hitFlash.visible=false;g.add(hitFlash);
 e.visual={body,head,sensor,ring,core:null,phaseHalo:null,hitFlash};
 if(type==='warden'){
  const phaseHalo=new T.Mesh(
   new T.TorusGeometry(1.28,.028,8,56),
   new T.MeshBasicMaterial({color:0xff58d4,transparent:true,opacity:0,depthWrite:false})
  );
  phaseHalo.rotation.x=Math.PI/2;
  phaseHalo.position.y=.12;
  phaseHalo.visible=false;
  g.add(phaseHalo);
  e.visual.phaseHalo=phaseHalo;
  const attackMarker=new T.Mesh(
   new T.TorusGeometry(1.18,.035,8,48),
   new T.MeshBasicMaterial({color:0x55dfff,transparent:true,opacity:0,depthWrite:false})
  );
  attackMarker.rotation.x=Math.PI/2;
  attackMarker.position.y=-1.22;
  attackMarker.visible=false;
  g.add(attackMarker);
  e.visual.attackMarker=attackMarker;
  for(const side of[-1,1]){
   const shoulder=new T.Mesh(new T.BoxGeometry(.42,.9,.75),m);shoulder.position.set(side*.78,.45,0);shoulder.rotation.z=side*-.22;g.add(shoulder);
   const horn=new T.Mesh(new T.ConeGeometry(.16,.72,8),new T.MeshStandardMaterial({color:0x39445a,emissive:0x6b174f,emissiveIntensity:1.1}));horn.position.set(side*.62,1.35,-.08);horn.rotation.z=side*-.35;g.add(horn);
  }
  const reactorCore=new T.Mesh(new T.OctahedronGeometry(.3,1),new T.MeshBasicMaterial({color:0xff4fcb}));reactorCore.position.set(0,.42,.58);g.add(reactorCore);e.visual.core=reactorCore;
 }else if(type==='heavy'){
  const armor=new T.Mesh(new T.BoxGeometry(1.12,.2,.5),m);armor.position.set(0,.38,0);g.add(armor);
  const chargeCore=new T.Mesh(new T.SphereGeometry(.2,16,12),new T.MeshBasicMaterial({color:0xff9a38}));chargeCore.position.set(0,.48,.48);g.add(chargeCore);e.visual.core=chargeCore;
  for(const side of[-1,1]){const plate=new T.Mesh(new T.BoxGeometry(.2,.48,.42),m);plate.position.set(side*.55,.28,0);g.add(plate)}
 }else if(type==='assault'){
  for(const side of[-1,1]){
   const pod=new T.Mesh(new T.CylinderGeometry(.13,.18,.62,12),m);
   pod.rotation.z=Math.PI/2;pod.position.set(side*.48,.02,0);g.add(pod);
   const glow=new T.Mesh(new T.SphereGeometry(.13,12,8),new T.MeshBasicMaterial({color:0xff5a18}));
   glow.position.set(side*.72,.02,0);g.add(glow);
  }
 }else if(type==='sniper'){
  const barrel=new T.Mesh(new T.BoxGeometry(.13,.13,.95),m);barrel.position.set(.28,.25,.42);g.add(barrel);
  const antenna=new T.Mesh(new T.CylinderGeometry(.025,.04,.62,8),new T.MeshStandardMaterial({color:0x9a6bff,emissive:0x4c28aa,emissiveIntensity:2}));
  antenna.position.set(0,1.05,0);g.add(antenna);
  const scope=new T.Mesh(new T.BoxGeometry(.28,.18,.28),m);scope.position.set(0,.58,.1);g.add(scope);
 }
 g.traverse(o=>{o.userData.e=e;o.castShadow=true});
 g.position.set(q[0],1.3,q[1]);scene.add(g);enemies.push(e);spawned++;
}
function disposeRenderable(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const material of(Array.isArray(o.material)?o.material:[o.material]))materials.add(material)}});geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose())}
function killE(e){
 const deathProfiles={
  scout:{color:0x5fe8ff,count:15,speed:5.8,size:.7,life:.42},
  assault:{color:0xff7138,count:22,speed:4.8,size:1.05,life:.62},
  heavy:{color:0xffb04a,count:30,speed:3.4,size:1.8,life:.9},
  sniper:{color:0xa58aff,count:13,speed:6.6,size:.55,life:.48},
  warden:{color:0xff58d4,count:42,speed:5.2,size:1.65,life:1.15}
 };
 const death=deathProfiles[e.type]||deathProfiles.scout;
 const origin=e.g.position.clone();
 scene.remove(e.g);disposeRenderable(e.g);enemies.splice(enemies.indexOf(e),1);
 if(e.type==='warden')$('bossHud').hidden=true;
 for(let i=0;i<death.count;i++){
  const particle=new T.Mesh(spGeo,new T.MeshBasicMaterial({color:death.color}));
  particle.position.copy(origin);
  const direction=new T.Vector3(R(-1,1),R(-.35,1.25),R(-1,1));
  if(direction.lengthSq)direction.normalize();
  direction.multiplyScalar(R(death.speed*.55,death.speed));
  particle.scale.setScalar(R(.65,1.45)*death.size);
  scene.add(particle);
  sparks.push({m:particle,v:direction,l:R(death.life*.55,death.life)});
 }
 if(e.type==='warden'){
  // The boss collapses in two distinct energy pulses rather than a generic drone pop.
  for(let i=0;i<18;i++)spark(origin,new T.Color(2.8,.35,2.4),8);
  snd(48,.85,'sawtooth',.55);
 }else if(e.type==='heavy'){
  for(let i=0;i<10;i++)spark(origin,new T.Color(3,1.25,.25),4);
  snd(62,.58,'sawtooth',.42);
 }else if(e.type==='sniper'){
  for(let i=0;i<7;i++)spark(origin,new T.Color(.8,.55,3),5);
  snd(720,.24,'triangle',.22);
 }else{
  for(let i=0;i<8;i++)spark(origin,new T.Color(3,1.1,.35),4);
  snd(e.type==='assault'?125:260,.32,'sawtooth',.3);
 }
 kills++;$('kl').textContent=`Дроны: ${kills} / ${GOAL}`;if(missionSystem.isObjectiveComplete(currentMission.id,missionObjective.id,kills)){combatCleared=true;mouse=false;projectileSystem.clear(proj);if(activeLevel.requiredInteractionId){$('kl').textContent='ОХРАНА УНИЧТОЖЕНА · АКТИВИРУЙ ПАНЕЛЬ'}else{missionCleared=true;activeLevel.openExit?.();$('kl').textContent='СЕКТОР ЗАЧИЩЕН · ИЩИ ВЫХОД В КОРИДОРЕ'}}}
const spGeo=new T.BoxGeometry(.03,.03,.03);
const debris=[];
function spark(p,c,sp=4){const m=new T.Mesh(spGeo,new T.MeshBasicMaterial({color:c}));m.position.copy(p);scene.add(m);sparks.push({m,v:new T.Vector3(R(-1,1),R(0,1.4),R(-1,1)).multiplyScalar(sp),l:R(.3,.7)})}
function spawnDebris(object,point){
 if(!object||!object.geometry)return;
 object.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(object);
 if(bounds.isEmpty())return;
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const source=Array.isArray(object.material)?object.material[0]:object.material;
 const count=cl(Math.ceil((size.x+size.y+size.z)*1.5),5,9);
 for(let i=0;i<count;i++){
  const w=Math.max(.07,size.x*R(.13,.3)),h=Math.max(.07,size.y*R(.13,.3)),d=Math.max(.07,size.z*R(.13,.3));
  const material=source&&source.clone?source.clone():new T.MeshStandardMaterial({color:0x77818a,metalness:.65,roughness:.55});
  const shard=new T.Mesh(new T.BoxGeometry(w,h,d),material);
  shard.position.set(center.x+R(-size.x*.32,size.x*.32),center.y+R(-size.y*.32,size.y*.32),center.z+R(-size.z*.32,size.z*.32));
  shard.rotation.set(R(0,Math.PI),R(0,Math.PI),R(0,Math.PI));
  shard.castShadow=true;shard.receiveShadow=true;scene.add(shard);
  const direction=shard.position.clone().sub(point||center);
  if(direction.lengthSq()<.01)direction.set(R(-1,1),R(.2,1),R(-1,1));
  direction.normalize();
  debris.push({mesh:shard,velocity:direction.multiplyScalar(R(1.3,3.8)).add(new T.Vector3(0,R(1.5,3.8),0)),spin:new T.Vector3(R(-5,5),R(-5,5),R(-5,5)),life:R(1.7,2.7),halfHeight:h*.5});
 }
}

/* ---------- боевая система ---------- */
const weapon=new S7WeaponSystem({
 THREE:T,
 camera:cam,
 sound:snd,
 onAmmoChange:value=>{$('ammo').textContent=value;$('am').classList.toggle('low',value<=6)}
});
const damageSystem=new S7DamageSystem();
const hitFeedback=new S7HitFeedback();
const projectileSystem=new S7ProjectileSystem({scene});
const destructibleSystem=new S7DestructibleSystem({collisionCollections:[boxes,activeLevel.boxes],onBreak:(object,point)=>{spawnDebris(object,point);if(object.userData.explosive)explodeBarrel(object,point);if(point)for(let i=0;i<10;i++)spark(point,new T.Color(2.4,1.1,.35),R(2,5));snd(95,.24,'square',.18,true);}});
function hitEnemy(enemy,hit){
 const result=damageSystem.applyEnemyDamage(enemy,Boolean(hit.object.userData.head));
 if(enemy.visual?.hitFlash){
  enemy.g.updateMatrixWorld(true);
  enemy.visual.hitFlash.position.copy(enemy.g.worldToLocal(hit.point.clone()));
  enemy.visual.hitFlash.visible=true;
  enemy.visual.hitFlash.scale.setScalar(result.headshot?.48:.3);
  enemy.visual.hitFlash.material.opacity=1;
  enemy.hitFlashRemaining=result.headshot?.24:.17;
 }
 enemy.m.emissive.setRGB(1,.6,.3);
 enemy.flash=.08;
 if(!result.killed){
  const stunDuration=Number.isFinite(enemy.hitStunDuration)?enemy.hitStunDuration:.14;
  enemy.hitStunRemaining=Math.max(enemy.hitStunRemaining||0,stunDuration+(result.headshot?.12:0));
  const dx=enemy.g.position.x-P.pos.x,dz=enemy.g.position.z-P.pos.z;
  const distance=Math.hypot(dx,dz)||1;
  const impulse=(Number.isFinite(enemy.hitImpulse)?enemy.hitImpulse:1.5)*(result.headshot?1.35:1);
  if(!enemy.hitReactionVelocity)enemy.hitReactionVelocity={x:0,z:0};
  enemy.hitReactionVelocity.x+=dx/distance*impulse;
  enemy.hitReactionVelocity.z+=dz/distance*impulse;
  const evadeSide = enemy.strafeSign || 1;
  const evadeSpeed = ({ scout: 4.8, assault: 2.4, heavy: 0.8, sniper: 3.6, warden: 1.7 })[enemy.type] || 2;
  enemy.evasionVelocity = { x: (-dz / distance) * evadeSide * evadeSpeed, z: (dx / distance) * evadeSide * evadeSpeed };
  enemy.evasionRemaining = ({ scout: 0.48, assault: 0.3, heavy: 0.12, sniper: 0.42, warden: 0.22 })[enemy.type] || 0.25;
 }
 hitFeedback.trigger($('hit'),{headshot:result.headshot,killed:result.killed});
 snd(900,.06,'square',.15);
 for(let i=0;i<6;i++)spark(hit.point,new T.Color(3,1.5,.4));
 if(result.killed)killE(enemy);
}
function explodeBarrel(object,point){
  const origin=point?point.clone():object.getWorldPosition(new T.Vector3());
  const spec=object.userData.explosive||{radius:7,damage:105};
  const radius=Number(spec.radius)||7;
  const flame=new T.Mesh(new T.SphereGeometry(1,24,16),new T.MeshBasicMaterial({color:0xff6826,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false}));
  flame.position.copy(origin);flame.scale.set(.42,.5,.42);scene.add(flame);
  const ring=new T.Mesh(new T.TorusGeometry(1,.055,10,48),new T.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:.95,blending:T.AdditiveBlending,depthWrite:false}));
  ring.rotation.x=Math.PI/2;ring.position.copy(origin);ring.position.y=Math.max(.08,origin.y-.38);ring.scale.setScalar(.28);scene.add(ring);
  const smoke=[];
  for(let i=0;i<8;i++){
    const mesh=new T.Mesh(new T.SphereGeometry(1,10,8),new T.MeshBasicMaterial({color:i%2?0x555b60:0x77716a,transparent:true,opacity:.34,depthWrite:false}));
    mesh.position.copy(origin).add(new T.Vector3(R(-.28,.28),R(.1,.55),R(-.28,.28)));
    const scale=R(.12,.25);mesh.scale.setScalar(scale);scene.add(mesh);
    smoke.push({mesh,velocity:new T.Vector3(R(-.45,.45),R(1.1,2.1),R(-.45,.45)),scale,life:R(1.15,1.75),maxLife:1.75});
  }
  explosions.push({mesh:flame,ring,smoke,life:.72,maxLife:.72,radius});
  for(let i=0;i<52;i++)spark(origin,new T.Color(3,R(.25,1.05),.08),R(5,14));
  snd(42,.72,'sawtooth',.7);snd(105,.48,'sine',.38,true);
  for(const enemy of [...enemies]){
    const distance=enemy.g.position.distanceTo(origin);
    if(distance>radius)continue;
    const amount=Math.max(8,(Number(spec.damage)||105)*(1-distance/radius));
    enemy.hp=Math.max(0,enemy.hp-amount);
    enemy.m.emissive.setRGB(1,.32,.08);enemy.flash=.16;
    if(enemy.hp<=0)killE(enemy);
  }
  const playerDistance=P.pos.distanceTo(origin);
  if(playerDistance<radius)dmg(Math.ceil(68*(1-playerDistance/radius)));
}
function hitWorld(hit){
  const result=destructibleSystem.hit(hit.object,hit.point,1);
  for(let i=0;i<(result.destroyed?12:result.damaged?7:5);i++)spark(hit.point,new T.Color(3,2,1),result.destroyed?5:3);
  if(result.destroyed)snd(115,.2,'square',.16,true);
}
function dmg(n){const result=damageSystem.applyPlayerDamage(P,n);hurt=1;snd(70,.25,'sine',.6);$('hpf').style.width=result.remaining+'%';if(result.killed)end(false)}
function end(w){
 if(state==='over'||state==='transition')return;
 $('evacTimer').hidden=true;
 if(w&&!outroShown&&currentMission.outroDialogue?.length){
  if(outroPlaying)return;
  outroPlaying=true;state='transition';document.exitPointerLock&&document.exitPointerLock();
  dialogueSystem.startRadio(currentMission.outroDialogue,()=>{outroShown=true;outroPlaying=false;state='play';end(true)});
  return;
 }
 state='transition';
 const record=saveSystem.recordMissionResult({missionId:currentMission.id,won:w,kills,nextMissionOrder:currentMission.order+1});
 savedCampaign=record;
 $('saveInfo').textContent=`СОХРАНЕНИЕ · Побед: ${record.stats.wins} · Поражений: ${record.stats.losses} · Лучший результат: ${record.stats.bestKills} дронов`;
 const nextMission=w?missionSystem.getUnlockedMissions(record.campaign).find(mission=>mission.order>currentMission.order):null;
 if(w&&nextMission){transitionToMission(nextMission);return}
 document.exitPointerLock&&document.exitPointerLock();
 audioManager.stopMusic();audioManager.stopAmbience();
 state='over';
 $('interactHint').hidden=true;
 $('ov').style.display='flex';
 const resultTitle=!w?'ТЫ ПОГИБ':'КАМПАНИЯ ЗАВЕРШЕНА';
 $('ov').innerHTML=`<div><h1>${resultTitle}</h1><p>Уничтожено дронов: ${kills} / ${GOAL}</p><p>Всего побед: ${record.stats.wins} · Поражений: ${record.stats.losses}</p><p>Лучший результат: ${record.stats.bestKills} дронов</p><p><b>${w?'Кампания завершена. Нажми, чтобы пройти её снова.':'Нажми, чтобы продолжить с последней незавершённой миссии.'}</b></p></div>`;
 $('ov').onclick=()=>{location.hash='';location.reload()};
}

/* ---------- управление ---------- */
const dom=renderer.domElement;
function loadMission(nextMission,transition={}){
 try{
  for(const enemy of enemies){scene.remove(enemy.g);disposeRenderable(enemy.g)}enemies.length=0;
  projectileSystem.clear(proj);
  for(const particle of sparks){scene.remove(particle.m);particle.m.material.dispose()}sparks.length=0;
  for(const blast of explosions){scene.remove(blast.mesh,blast.ring);blast.mesh.geometry.dispose();blast.mesh.material.dispose();blast.ring.geometry.dispose();blast.ring.material.dispose();for(const puff of blast.smoke){scene.remove(puff.mesh);puff.mesh.geometry.dispose();puff.mesh.material.dispose()}}explosions.length=0;
  for(const piece of debris){scene.remove(piece.mesh);piece.mesh.geometry.dispose();piece.mesh.material.dispose()}debris.length=0;
  currentMission=nextMission;
  saveSystem.setCurrentMission(currentMission.id);
  savedCampaign=saveSystem.getData();
  missionObjective=currentMission.objectives.find(objective=>objective.type==='eliminate');
  if(!missionObjective)throw new Error('The next mission has no supported elimination objective');
  GOAL=missionObjective.target;
  activeLevel=levelManager.load(currentMission.levelId,{mat,canvas,randomRange:R,box});
  destructibleSystem.collisionCollections=[boxes,activeLevel.boxes];
  LEVEL_BOUNDS=activeLevel.bounds;
  setTimeout(preloadNextMission,750);
  dust=activeLevel.dust||{rotation:{y:0},position:{y:0}};
  interactionSystem=new S7InteractionSystem(activeLevel.interactables||[]);
  GROUND_Y=activeLevel.playerSpawn.y;
  jumpController.groundY=GROUND_Y;
  const carried=transition.preservePlayer&&transition.player?transition.player:null;
  if(carried){
   P.pos.set(carried.x,carried.y,carried.z);
   P.yaw=activeLevel.playerSpawn.yaw??carried.yaw;
   P.pitch=carried.pitch;
   P.hp=carried.hp;
  }else{
   P.pos.set(activeLevel.playerSpawn.x,GROUND_Y,activeLevel.playerSpawn.z);
   P.yaw=activeLevel.playerSpawn.yaw||0;P.pitch=0;P.hp=transition.preserveVitals?Math.max(1,Number(transition.preserveVitals.hp)||100):100;
  }
  P.velocityY=0;P.grounded=true;P.groundedHeight=GROUND_Y;P.groundedPlatform=null;
  $('hpf').style.width=Math.max(0,P.hp)+'%';
  if(!carried&&!transition.preserveVitals){
   weapon.ammo=weapon.magazineSize;weapon.reloadRemaining=0;weapon.cooldown=0;weapon.recoil=0;weapon.pitchKick=0;
   weapon.group.rotation.set(0,0,0);
  }
  weapon.onAmmoChange(weapon.ammo);
  cam.position.copy(P.pos);cam.rotation.set(P.pitch+weapon.pitchKick,P.yaw,0);
  for(const key of Object.keys(keys))delete keys[key];
  kills=0;spawned=0;spawnT=0;hurt=0;mouse=false;fallback=Boolean(transition.elevator&&!locked);missionCleared=false;combatCleared=false;outroShown=false;outroPlaying=false;introShown=true;evacuationRemaining=0;$('evacTimer').hidden=true;
  $('missionTitle').textContent=`${currentMission.title} · ${currentMission.location}`;
  $('missionDescription').textContent=currentMission.description;
  $('kl').textContent=`Дроны: 0 / ${GOAL}`;
  $('interactHint').hidden=true;
  $('ov').style.display='none';
  $('s7-resume').hidden=true;pauseMenu=false;
  location.hash=currentMission.id;
  if(!ac){ac=audioManager.unlock();if(ac)audioManager.startMusic()}
  audioManager.startAmbience(currentMission.audioProfile,(carried||transition.elevator)?1.25:0);
  if(transition.elevator){state='play'}else{
   state='play';
   dialogueSystem.startRadio(currentMission.introDialogue);
   try{dom.requestPointerLock()}catch(e){fallback=true}
  }
  return true;
 }catch(error){
  console.error('Campaign transition failed',error);
  state='over';$('ov').style.display='flex';
  $('ov').innerHTML='<div><h1>ОШИБКА ЗАГРУЗКИ СЕКТОРА</h1><p>Не удалось загрузить следующую локацию.</p><p>Перезапусти миссию, чтобы восстановить кампанию.</p></div>';
  $('ov').onclick=()=>location.reload();
  return false;
 }
}
function transitionToMission(nextMission){
 // Keep the pointer locked and the normal FPS controls active throughout the ride.
 state='play';mouse=false;
 if(!locked)fallback=true; // A preceding outro may have released pointer lock; keep mouse-look usable.
 elevatorNextMission=nextMission;
 elevatorVitals={hp:P.hp};
 elevatorTransition.begin({
  position:{x:P.pos.x,y:P.pos.y,z:P.pos.z},
  yaw:Number.isFinite(activeLevel.exitYaw)?activeLevel.exitYaw:P.yaw,
  player:P,
  destinationLabel:String(nextMission.order).padStart(2,'0')
 });
}
function useNearbyInteraction(){const nearby=interactionSystem.findNearby(P.pos);if(!nearby)return;if(nearby.id===activeLevel.requiredInteractionId&&!combatCleared){$('kl').textContent='СНАЧАЛА УНИЧТОЖЬ ВСЮ ОХРАНУ СЕКТОРА';return}const item=interactionSystem.activate(nearby.id);if(!item)return;activeLevel.onInteractionActivated?.(item.id);state='dialogue';mouse=false;$('interactHint').hidden=true;document.exitPointerLock&&document.exitPointerLock();dialogueSystem.start(item.dialogue,()=>{if(item.id===activeLevel.requiredInteractionId){missionCleared=true;activeLevel.openExit?.();const evacuationSeconds=Number(activeLevel.evacuationSeconds)||0;if(evacuationSeconds>0){evacuationRemaining=evacuationSeconds;$('evacTimer').hidden=false;const seconds=Math.ceil(evacuationRemaining);$('evacTimer').textContent=`ЭВАКУАЦИЯ · ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;$('kl').textContent=activeLevel.evacuationMessage||'ЯДРО ОТКЛЮЧЕНО · ИЩИ ЭВАКУАЦИОННЫЙ КОРИДОР'}else{$('kl').textContent='ВНЕШНИЙ КОНТУР ОТКЛЮЧЁН · ШЛЮЗ В РЕАКТОР ОТКРЫТ'}}state='play';try{dom.requestPointerLock()}catch(e){fallback=true}})}

function showPauseMenu(){
 state='menu';pauseMenu=true;$('s7-resume').hidden=false;$('msg').textContent='Пауза';
 $('s7-load-panel').hidden=true;$('ov').style.display='flex';
}
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===dom;if(locked){pauseMenu=false;$('s7-resume').hidden=true}if(!locked&&state==='play'&&!fallback)showPauseMenu();});
document.addEventListener('pointerlockerror',()=>{fallback=true});
addEventListener('mousemove',e=>{if(state!=='play'||!(locked||fallback))return;P.yaw-=e.movementX*.0022;P.pitch=cl(P.pitch-e.movementY*.0022,-1.45,1.45)});
addEventListener('mousedown',e=>{if(e.button===0)mouse=true});addEventListener('mouseup',()=>mouse=false);
addEventListener('keydown',e=>{if(e.code==='Escape'&&state==='play'&&fallback&&!elevatorTransition.isActive()){e.preventDefault();showPauseMenu();return}if(dialogueSystem.isActive()&&(e.code==='Enter'||e.code==='KeyE')){e.preventDefault();if(!e.repeat)dialogueSystem.advance();return}if(e.code==='KeyE'&&state==='play'){e.preventDefault();if(!e.repeat)useNearbyInteraction();return}keys[e.code]=1;if(e.code==='Space'){e.preventDefault();if(!e.repeat&&state==='play'&&!elevatorTransition.isActive()&&jumpController.jump(P))snd(125,.14,'sawtooth',.12)}if(e.code==='KeyR')weapon.reload();if(e.code==='KeyF')torch.visible=!torch.visible;if(e.code==='F3')perfMonitor.toggle()});addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('blur',()=>{for(const key of Object.keys(keys))delete keys[key];mouse=false;});
setTimeout(()=>{if(state==='menu'&&!$('ov').matches(':hover'))0},0);

/* ---------- пост-обработка ---------- */
const comp=new T.EffectComposer(renderer);comp.addPass(new T.RenderPass(scene,cam));
const bloom=new T.UnrealBloomPass(new T.Vector2(1,1),.75,.6,.88);comp.addPass(bloom);
const fin=new T.ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},hurt:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float time,hurt;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+time)*43758.5453);}
 void main(){vec2 d=vUv-.5;float l=dot(d,d);vec3 c=vec3(texture2D(tDiffuse,vUv+d*.004).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-d*.004).b);
 c*=1.15;c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);c=pow(c,vec3(1./2.2));c*=1.-l*1.5;c+=(h(vUv*1000.)-.5)*.035;c+=vec3(.6,0.,0.)*hurt*(.25+l*3.);gl_FragColor=vec4(c,1.);}`});
comp.addPass(fin);
const perfMonitor=new S7PerformanceMonitor();
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);comp.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
const graphicsSettings=new S7GraphicsSettings(renderer,comp,bloom,resize);
function openLoadMenu(){
  const panel=$('s7-load-panel'),list=$('s7-load-list');
  list.replaceChildren();
  const campaign=savedCampaign.campaign;
  const next=missionSystem.getMissionForCampaign(campaign,campaign.currentMission||'');
  if(next){
    const resume=document.createElement('button');
    resume.className='s7-primary';
    resume.textContent='ПРОДОЛЖИТЬ КАМПАНИЮ · '+next.title;
    resume.onclick=()=>loadMission(next);
    list.appendChild(resume);
  }
  const completed=new Set(campaign.completedMissions||[]);
  for(const mission of missionSystem.getUnlockedMissions(campaign)){
    const button=document.createElement('button');
    const isCurrent=next&&mission.id===next.id;
    button.textContent=String(mission.order).padStart(2,'0')+' · '+mission.title+' · '+mission.location+(isCurrent?' — ТЕКУЩАЯ':completed.has(mission.id)?' — ПОВТОР':'');
    button.onclick=()=>loadMission(mission);
    list.appendChild(button);
  }
  panel.hidden=false;
}
$('s7-new').addEventListener('click',()=>{
  saveSystem.reset();savedCampaign=saveSystem.load();
  loadMission(missionSystem.getFirstMission(),{newGame:true});
});
$('s7-load').addEventListener('click',openLoadMenu);
$('s7-load-back').addEventListener('click',()=>{$('s7-load-panel').hidden=true});
$('s7-settings').addEventListener('click',()=>graphicsSettings.toggle(true));
$('s7-exit').addEventListener('click',()=>{
  if(window.sector7Desktop&&typeof window.sector7Desktop.quit==='function')window.sector7Desktop.quit();
  else $('msg').textContent='Выход доступен только в настольной версии SECTOR 7.';
});
$('s7-resume').addEventListener('click',()=>{
  pauseMenu=false;state='play';$('ov').style.display='none';$('s7-resume').hidden=true;
  try{dom.requestPointerLock()}catch(e){fallback=true}
});

/* ---------- цикл ---------- */
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;tm+=dt;if(typeof activeLevel.update==='function')activeLevel.update(dt,tm);
 dialogueSystem.update(dt);
 elevatorTransition.update(dt);
 hitFeedback.update(dt,$('hit'));
 if(state==='play'){
  const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),r=(keys.KeyD?1:0)-(keys.KeyA?1:0),sp=keys.ShiftLeft?7:4.6,mv=f||r;
  if(mv){const l=Math.hypot(f,r),sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);P.pos.x+=(-sy*f+cy*r)/l*sp*dt;P.pos.z+=(-cy*f-sy*r)/l*sp*dt;if(!elevatorTransition.isActive())collide(P.pos,.4)}
  const inElevator=elevatorTransition.isActive();
  if(inElevator)elevatorTransition.constrainPlayer(P.pos);
  const boss=enemies.find(enemy=>enemy.type==='warden');$('bossHud').hidden=!boss;if(boss){$('bossHealth').style.width=`${Math.max(0,boss.hp/boss.maxHp*100)}%`;$('bossName').textContent=`СТОРОЖ · ${Math.max(0,Math.ceil(boss.hp))} HP`}
  const nearby=interactionSystem.findNearby(P.pos);$('interactHint').hidden=!nearby;if(nearby)$('interactHint').textContent=`E — ${nearby.label}`;
  if(P.grounded&&P.groundedPlatform&&!jumpController.isSupported(P,boxes)){P.grounded=false;P.velocityY=0;}
  if(!inElevator&&jumpController.update(P,dt,boxes))snd(75,.09,'sine',.08);
  if(P.grounded&&!inElevator)P.pos.y=(Number.isFinite(P.groundedHeight)?P.groundedHeight:GROUND_Y)+(mv?Math.sin(tm*(keys.ShiftLeft?13:9))*.035:0);
  cam.position.copy(P.pos);cam.rotation.set(P.pitch+weapon.pitchKick,P.yaw,0);
  if(!inElevator&&mouse&&!combatCleared)weapon.fire(solids,enemies,spark,hitEnemy,hitWorld,R);
  weapon.update(dt,tm,mv);
  if(!inElevator&&evacuationRemaining>0){
   evacuationRemaining=Math.max(0,evacuationRemaining-dt);
   const seconds=Math.ceil(evacuationRemaining);
   $('evacTimer').textContent=`ЭВАКУАЦИЯ · ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
   if(evacuationRemaining<=0)end(false);
  }
  if(!inElevator){
   spawnT-=dt;
   if(!combatCleared&&spawned<GOAL&&enemies.length<currentMission.spawn.maxActive&&spawnT<=0){spawn();spawnT=currentMission.spawn.interval}
   droneAI.update(enemies,P,dt,collide,scene,proj,snd,R,boxes);
   const exit=activeLevel.exitZone;
   if(missionCleared&&exit&&P.pos.x>=exit.x0&&P.pos.x<=exit.x1&&P.pos.z>=exit.z0&&P.pos.z<=exit.z1)end(true);
   projectileSystem.update(proj,dt,P.pos,boxes,LEVEL_BOUNDS,dmg);
  }
 }
 for(let i=explosions.length-1;i>=0;i--){
  const blast=explosions[i];blast.life-=dt;
  const progress=1-blast.life/blast.maxLife;
  const fade=Math.max(0,blast.life/blast.maxLife);
  blast.mesh.scale.set(.42+progress*1.15,.5+progress*.72,.42+progress*1.15);
  blast.mesh.material.opacity=fade*.9;
  blast.ring.scale.setScalar(.28+progress*blast.radius*1.35);
  blast.ring.material.opacity=fade*.95;
  for(let j=blast.smoke.length-1;j>=0;j--){
   const puff=blast.smoke[j];puff.life-=dt;puff.mesh.position.addScaledVector(puff.velocity,dt);
   puff.mesh.scale.setScalar(puff.scale+(1-puff.life/puff.maxLife)*.48);
   puff.mesh.material.opacity=Math.max(0,puff.life/puff.maxLife)*.34;
   if(puff.life<=0){scene.remove(puff.mesh);puff.mesh.geometry.dispose();puff.mesh.material.dispose();blast.smoke.splice(j,1)}
  }
  if(blast.life<=0){scene.remove(blast.mesh,blast.ring);blast.mesh.geometry.dispose();blast.mesh.material.dispose();blast.ring.geometry.dispose();blast.ring.material.dispose();for(const puff of blast.smoke){scene.remove(puff.mesh);puff.mesh.geometry.dispose();puff.mesh.material.dispose()}explosions.splice(i,1)}
 }
 for(let i=debris.length-1;i>=0;i--){
  const piece=debris[i];piece.life-=dt;
  piece.velocity.y-=9.8*dt;piece.velocity.multiplyScalar(Math.max(0,1-dt*.42));
  piece.mesh.position.addScaledVector(piece.velocity,dt);
  piece.mesh.rotation.x+=piece.spin.x*dt;piece.mesh.rotation.y+=piece.spin.y*dt;piece.mesh.rotation.z+=piece.spin.z*dt;
  if(piece.mesh.position.y<piece.halfHeight){
   piece.mesh.position.y=piece.halfHeight;
   if(piece.velocity.y<0)piece.velocity.y=-piece.velocity.y*.28;
   piece.velocity.x*=.72;piece.velocity.z*=.72;piece.spin.multiplyScalar(.72);
  }
  if(piece.life<=0){scene.remove(piece.mesh);piece.mesh.geometry.dispose();piece.mesh.material.dispose();debris.splice(i,1)}
 }
 for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.v.y-=9*dt;s.m.position.addScaledVector(s.v,dt);s.l-=dt;if(s.l<=0||s.m.position.y<.02){scene.remove(s.m);s.m.material.dispose();sparks.splice(i,1)}}
 hurt=Math.max(0,hurt-dt*1.6);dust.rotation.y+=dt*.01;dust.position.y=Math.sin(tm*.2)*.1;
 // мерцание неона
 fin.uniforms.time.value=tm%10;fin.uniforms.hurt.value=hurt;
 if(state==='menu'&&!pauseMenu){cam.position.set(Math.sin(tm*.15)*4,2.4,9);cam.lookAt(0,1.8,-5)}else if(state==='dialogue'){cam.position.copy(P.pos);cam.rotation.set(P.pitch,P.yaw,0)}
 comp.render();perfMonitor.update(renderer,now);renderer.info.reset()}
cam.position.copy(P.pos);requestAnimationFrame(loop);
