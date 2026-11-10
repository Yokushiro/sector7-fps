const T=THREE,R=(a,b)=>a+Math.random()*(b-a),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.info.autoReset=false;
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0x04060a);scene.fog=new T.FogExp2(0x070c12,.034);
const cam=new T.PerspectiveCamera(75,1,.05,80);cam.rotation.order='YXZ';scene.add(cam);

/* ---------- процедурные PBR-текстуры ---------- */
function canvas(s,paint){const c=document.createElement('canvas');c.width=c.height=s;paint(c.getContext('2d'),s);return c}
function speck(x,s,n){for(let i=0;i<n;i++){const v=R(20,230)|0;x.fillStyle=`rgba(${v},${v},${v},${R(.04,.3)})`;x.fillRect(R(0,s),R(0,s),R(1,4),R(1,4))}}
function stain(x,s,n,col,r0=20,r1=90){for(let i=0;i<n;i++){const px=R(0,s),py=R(0,s),r=R(r0,r1),g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}}
const cv={
 concrete:canvas(512,(x,s)=>{x.fillStyle='#6d6e6b';x.fillRect(0,0,s,s);speck(x,s,16000);stain(x,s,14,'rgba(20,22,22,.5)');stain(x,s,5,'rgba(70,45,25,.35)',10,40);
  x.strokeStyle='rgba(15,15,15,.7)';x.lineWidth=3;for(let i=0;i<=s;i+=256){x.beginPath();x.moveTo(i,0);x.lineTo(i,s);x.moveTo(0,i);x.lineTo(s,i);x.stroke()}}),
 metal:canvas(512,(x,s)=>{x.fillStyle='#4a525a';x.fillRect(0,0,s,s);speck(x,s,12000);stain(x,s,10,'rgba(130,70,30,.45)',10,50);
  x.strokeStyle='rgba(10,12,14,.85)';x.lineWidth=4;x.strokeRect(2,2,s-4,s-4);x.beginPath();x.moveTo(0,s/2);x.lineTo(s,s/2);x.stroke();
  x.fillStyle='rgba(200,210,220,.5)';for(let i=0;i<s;i+=32){for(const j of[14,s-14,s/2-14,s/2+14]){x.beginPath();x.arc(i+16,j,3,0,7);x.fill()}}}),
 floor:canvas(512,(x,s)=>{x.fillStyle='#34373a';x.fillRect(0,0,s,s);speck(x,s,14000);stain(x,s,12,'rgba(0,0,0,.45)',30,110);stain(x,s,3,'rgba(90,100,110,.25)',40,100);
  x.strokeStyle='rgba(5,5,6,.9)';x.lineWidth=5;x.strokeRect(0,0,s,s);x.beginPath();x.moveTo(s/2,0);x.lineTo(s/2,s);x.moveTo(0,s/2);x.lineTo(s,s/2);x.stroke()}),
};
const cache={};
function mat(k,rx,ry,m=0,tint=0xffffff){const key=k+rx+'_'+ry+m+tint;if(cache[key])return cache[key];
 const t=new T.CanvasTexture(cv[k]);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=8;t.encoding=T.sRGBEncoding;
 return cache[key]=new T.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:2.2,roughnessMap:t,roughness:1,metalness:m,color:tint,envMapIntensity:.6})}

/* ---------- окружение (IBL) ---------- */
{const es=new T.Scene(),g=canvas(256,(x,s)=>{const gr=x.createLinearGradient(0,0,0,s);gr.addColorStop(0,'#2a3b4d');gr.addColorStop(.5,'#10161d');gr.addColorStop(1,'#050607');x.fillStyle=gr;x.fillRect(0,0,s,s)});
 es.add(new T.Mesh(new T.SphereGeometry(10,32,16),new T.MeshBasicMaterial({map:new T.CanvasTexture(g),side:T.BackSide})));
 [[0,8,0,8,.3,3,'#bfe6ff'],[-9,3,0,.3,3,6,'#ff7a2a'],[9,3,2,.3,3,6,'#ff2a8a']].forEach(([x,y,z,w,h,d,c])=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(6)}));m.position.set(x,y,z);es.add(m)});
 const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(es).texture}

/* ---------- уровень ---------- */
const solids=[],boxes=[];
function box(x,y,z,w,h,d,m,col=true,target=scene){const me=new T.Mesh(new T.BoxGeometry(w,h,d),m);me.position.set(x,y,z);me.castShadow=me.receiveShadow=true;target.add(me);solids.push(me);
 if(col)boxes.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});return me}
const saveSystem=new S7SaveSystem();
const missionSystem=new S7MissionSystem();
const savedCampaign=saveSystem.load();
const requestedMissionId=location.hash.slice(1);
const currentMission=missionSystem.getMissionForCampaign(savedCampaign.campaign,requestedMissionId);
if(!currentMission)throw new Error('No unlocked campaign missions are available');
const missionObjective=currentMission.objectives.find(objective=>objective.type==='eliminate');
if(!missionObjective)throw new Error('The active mission has no supported elimination objective');
const GOAL=missionObjective.target;

const levelManager=new S7LevelManager({THREE:T,scene,solids,boxes});
levelManager.register(S7BunkerLevel);
levelManager.register(S7LabLevel);
levelManager.register(S7ReactorLevel);
const activeLevel=levelManager.load(currentMission.levelId,{mat,canvas,randomRange:R,box});
const LEVEL_BOUNDS=activeLevel.bounds;
const dust=activeLevel.dust || {rotation:{y:0},position:{y:0}};


const torch=new T.SpotLight(0xe8f4ff,1.6,28,.5,.6,1.2);torch.position.set(.2,-.1,0);torch.target.position.set(0,0,-5);cam.add(torch,torch.target);

/* ---------- состояние ---------- */
const GROUND_Y=activeLevel.playerSpawn.y;
const P={pos:new T.Vector3(activeLevel.playerSpawn.x,GROUND_Y,activeLevel.playerSpawn.z),yaw:0,pitch:0,hp:100,velocityY:0,grounded:true};
const jumpController=new S7JumpController(GROUND_Y);
let state='menu',kills=0,spawned=0,spawnT=0,hurt=0,tm=0,mouse=false,fallback=false,locked=false,missionCleared=false,combatCleared=false,outroShown=false,introShown=false;
const keys=Object.create(null); // shared keyboard state for input handlers and the game loop
const enemies=[],proj=[],sparks=[];
const droneAI=new S7DroneAI();
const $=id=>document.getElementById(id);
const dialogueSystem=new S7DialogueSystem({rootElement:$('dialogue'),speakerElement:$('dialogueSpeaker'),textElement:$('dialogueText'),promptElement:$('dialoguePrompt')});
const interactionSystem=new S7InteractionSystem(activeLevel.interactables||[]);
$('dialogue').addEventListener('click',()=>dialogueSystem.advance());
const savedStats=savedCampaign.stats;
$('saveInfo').textContent=`СОХРАНЕНИЕ · Побед: ${savedStats.wins} · Поражений: ${savedStats.losses} · Лучший результат: ${savedStats.bestKills} дронов`;
$('missionTitle').textContent=`${currentMission.title} · ${currentMission.location}`;
$('missionDescription').textContent=currentMission.description;
$('kl').textContent=`Дроны: 0 / ${GOAL}`;
function collide(p,r){for(const b of boxes){const cx=cl(p.x,b.x0,b.x1),cz=cl(p.z,b.z0,b.z1),dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;
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
 const e={
  g,type,hp:profile.hp,m,t:R(0,9),cd:R(profile.attackMin,profile.attackMax),
  moveSpeed:profile.moveSpeed,preferredDistance:profile.preferredDistance,
  projectileSpeed:profile.projectileSpeed,damage:profile.damage,spread:profile.spread,
  attackMin:profile.attackMin,attackMax:profile.attackMax,
  strafeSign:R(0,1)<.5?-1:1,
  flankOffset:type==='sniper'?5.5:type==='heavy'?2.8:type==='assault'?3.2:4.2,
  eye,eyeColor:profile.eyeColor,flash:0
 };
 let bodyGeometry;
 if(type==='sniper') bodyGeometry=new T.CylinderGeometry(.24,.34,1.2,16);
 else if(type==='assault') bodyGeometry=new T.OctahedronGeometry(.48,1);
 else bodyGeometry=new T.CapsuleGeometry(type==='heavy'?.46:.36,type==='heavy'?1:.7,8,20);
 const body=new T.Mesh(bodyGeometry,m);
 if(type==='assault')body.scale.set(1,.78,1.18);
 const head=new T.Mesh(new T.SphereGeometry(type==='heavy'?.32:.27,24,16),m);
 head.position.y=type==='heavy'?1.02:.82;
 const sensor=new T.Mesh(new T.SphereGeometry(type==='sniper'?.14:.11,16,10),eye);
 sensor.position.set(0,type==='heavy'?1.05:.85,.25);
 head.userData.head=1;
 const ringColor=new T.Color(profile.ringColor).multiplyScalar(1.6);
 const ring=new T.Mesh(new T.TorusGeometry(type==='heavy'?.65:type==='assault'?.5:.46,.04,10,32),new T.MeshBasicMaterial({color:ringColor}));
 ring.rotation.x=Math.PI/2;ring.position.y=.08;
 g.add(body,head,sensor,ring);
 if(type==='heavy'){
  const armor=new T.Mesh(new T.BoxGeometry(1.12,.2,.5),m);armor.position.set(0,.38,0);g.add(armor);
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
function killE(e){scene.remove(e.g);disposeRenderable(e.g);enemies.splice(enemies.indexOf(e),1);for(let i=0;i<18;i++)spark(e.g.position,new T.Color(3,1.6,.5),6);snd(90,.4,'sawtooth',.4);kills++;$('kl').textContent=`Дроны: ${kills} / ${GOAL}`;if(missionSystem.isObjectiveComplete(currentMission.id,missionObjective.id,kills)){combatCleared=true;mouse=false;for(const shot of proj){scene.remove(shot.m);shot.m.geometry.dispose();shot.m.material.dispose()}proj.length=0;if(activeLevel.requiredInteractionId){$('kl').textContent='ОХРАНА УНИЧТОЖЕНА · АКТИВИРУЙ ПАНЕЛЬ'}else{missionCleared=true;activeLevel.openExit?.();$('kl').textContent='СЕКТОР ЗАЧИЩЕН · ИЩИ ВЫХОД В КОРИДОРЕ'}}}
const spGeo=new T.BoxGeometry(.03,.03,.03);
function spark(p,c,sp=4){const m=new T.Mesh(spGeo,new T.MeshBasicMaterial({color:c}));m.position.copy(p);scene.add(m);sparks.push({m,v:new T.Vector3(R(-1,1),R(0,1.4),R(-1,1)).multiplyScalar(sp),l:R(.3,.7)})}

/* ---------- боевая система ---------- */
const weapon=new S7WeaponSystem({
 THREE:T,
 camera:cam,
 sound:snd,
 onAmmoChange:value=>{$('ammo').textContent=value}
});
function hitEnemy(enemy,hit){
 enemy.hp-=hit.object.userData.head?45:22;
 enemy.m.emissive.setRGB(1,.6,.3);
 enemy.flash=.08;
 $('hit').style.opacity=1;
 setTimeout(()=>$('hit').style.opacity=0,90);
 snd(900,.06,'square',.15);
 for(let i=0;i<6;i++)spark(hit.point,new T.Color(3,1.5,.4));
 if(enemy.hp<=0)killE(enemy);
}
function hitWorld(hit){
 for(let i=0;i<5;i++)spark(hit.point,new T.Color(3,2,1),3);
}
function dmg(n){P.hp-=n;hurt=1;snd(70,.25,'sine',.6);$('hpf').style.width=Math.max(0,P.hp)+'%';if(P.hp<=0)end(false)}
function end(w){if(state==='over')return;if(w&&!outroShown&&currentMission.outroDialogue?.length){state='dialogue';audioManager.stopMusic();audioManager.stopAmbience();document.exitPointerLock&&document.exitPointerLock();dialogueSystem.start(currentMission.outroDialogue,()=>{outroShown=true;end(true)});return}state='over';audioManager.stopMusic();audioManager.stopAmbience();document.exitPointerLock&&document.exitPointerLock();
 const record=saveSystem.recordMissionResult({missionId:currentMission.id,won:w,kills,nextMissionOrder:currentMission.order+1});
 $('ov').style.display='flex';
 const nextMission=w?missionSystem.getUnlockedMissions(record.campaign).find(mission=>mission.order>currentMission.order):null;
 const resultTitle=!w?'ТЫ ПОГИБ':nextMission?'СЕКТОР ЗАЧИЩЕН':'КАМПАНИЯ ЗАВЕРШЕНА';
 $('ov').innerHTML=`<div><h1>${resultTitle}</h1><p>Уничтожено дронов: ${kills} / ${GOAL}</p><p>Всего побед: ${record.stats.wins} · Поражений: ${record.stats.losses}</p><p>Лучший результат: ${record.stats.bestKills} дронов</p>${nextMission?`<p>Следующая миссия: <b>${nextMission.title}</b></p><p><b>Нажми, чтобы продолжить кампанию</b></p>`:'<p><b>Нажми, чтобы сыграть снова</b></p>'}</div>`;
 $('ov').onclick=()=>{location.hash=nextMission?nextMission.id:'';location.reload()}}

/* ---------- управление ---------- */
const dom=renderer.domElement;
function useNearbyInteraction(){const nearby=interactionSystem.findNearby(P.pos);if(!nearby)return;if(nearby.id===activeLevel.requiredInteractionId&&!combatCleared){$('kl').textContent='СНАЧАЛА УНИЧТОЖЬ ОХРАНУ РЕАКТОРА';return}const item=interactionSystem.activate(nearby.id);if(!item)return;state='dialogue';mouse=false;$('interactHint').hidden=true;document.exitPointerLock&&document.exitPointerLock();dialogueSystem.start(item.dialogue,()=>{if(item.id===activeLevel.requiredInteractionId){missionCleared=true;activeLevel.openExit?.();$('kl').textContent='ЯДРО ОТКЛЮЧЕНО · ИЩИ ЭВАКУАЦИОННЫЙ КОРИДОР'}state='play';try{dom.requestPointerLock()}catch(e){fallback=true}})}
$('ov').onclick=()=>{if(state==='over'||state==='dialogue')return;$('ov').style.display='none';if(!introShown){if(!ac)ac=audioManager.unlock();if(ac){audioManager.startAmbience(currentMission.audioProfile);audioManager.startMusic()}introShown=true;state='dialogue';dialogueSystem.start(currentMission.introDialogue,()=>{state='play';try{dom.requestPointerLock()}catch(e){fallback=true}})}else{state='play';try{dom.requestPointerLock()}catch(e){fallback=true}}};
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===dom;if(!locked&&state==='play'&&!fallback){state='menu';$('msg').innerHTML='<b>Пауза — нажми, чтобы продолжить</b>';$('ov').style.display='flex'}});
document.addEventListener('pointerlockerror',()=>{fallback=true});
addEventListener('mousemove',e=>{if(state!=='play'||!(locked||fallback))return;P.yaw-=e.movementX*.0022;P.pitch=cl(P.pitch-e.movementY*.0022,-1.45,1.45)});
addEventListener('mousedown',e=>{if(e.button===0)mouse=true});addEventListener('mouseup',()=>mouse=false);
addEventListener('keydown',e=>{if(dialogueSystem.isActive()&&(e.code==='Enter'||e.code==='KeyE')){e.preventDefault();if(!e.repeat)dialogueSystem.advance();return}if(e.code==='KeyE'&&state==='play'){e.preventDefault();if(!e.repeat)useNearbyInteraction();return}keys[e.code]=1;if(e.code==='Space'){e.preventDefault();if(!e.repeat&&state==='play'&&jumpController.jump(P))snd(125,.14,'sawtooth',.12)}if(e.code==='KeyR')weapon.reload();if(e.code==='KeyF')torch.visible=!torch.visible;if(e.code==='F3')perfMonitor.toggle()});addEventListener('keyup',e=>keys[e.code]=0);
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

/* ---------- цикл ---------- */
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;tm+=dt;if(typeof activeLevel.update==='function')activeLevel.update(dt,tm);
 if(state==='play'){
  const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),r=(keys.KeyD?1:0)-(keys.KeyA?1:0),sp=keys.ShiftLeft?7:4.6,mv=f||r;
  if(mv){const l=Math.hypot(f,r),sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);P.pos.x+=(-sy*f+cy*r)/l*sp*dt;P.pos.z+=(-cy*f-sy*r)/l*sp*dt;collide(P.pos,.4)}
  const nearby=interactionSystem.findNearby(P.pos);$('interactHint').hidden=!nearby;if(nearby)$('interactHint').textContent=`E — ${nearby.label}`;
  if(jumpController.update(P,dt))snd(75,.09,'sine',.08);
  if(P.grounded)P.pos.y=GROUND_Y+(mv?Math.sin(tm*(keys.ShiftLeft?13:9))*.035:0);
  cam.position.copy(P.pos);cam.rotation.set(P.pitch+weapon.pitchKick,P.yaw,0);
  if(mouse&&!combatCleared)weapon.fire(solids,enemies,spark,hitEnemy,hitWorld,R);
  weapon.update(dt,tm,mv);
  spawnT-=dt;if(!combatCleared&&spawned<GOAL&&enemies.length<currentMission.spawn.maxActive&&spawnT<=0){spawn();spawnT=currentMission.spawn.interval}
  droneAI.update(enemies,P,dt,collide,scene,proj,snd,R,boxes);
  const exit=activeLevel.exitZone;if(missionCleared&&exit&&P.pos.x>=exit.x0&&P.pos.x<=exit.x1&&P.pos.z>=exit.z0&&P.pos.z<=exit.z1)end(true);
  for(let i=proj.length-1;i>=0;i--){const p=proj[i];p.m.position.addScaledVector(p.v,dt);p.l-=dt;const dd=p.m.position.distanceTo(P.pos);
   let hit=p.l<=0||Math.abs(p.m.position.x)>LEVEL_BOUNDS.halfSize||Math.abs(p.m.position.z)>LEVEL_BOUNDS.halfSize||p.m.position.y<0;
   if(!hit)for(const b of boxes)if(p.m.position.y<2.4&&p.m.position.x>b.x0&&p.m.position.x<b.x1&&p.m.position.z>b.z0&&p.m.position.z<b.z1){hit=true;break}
   if(dd<.55){dmg(p.damage||8);hit=true}if(hit){scene.remove(p.m);p.m.geometry.dispose();p.m.material.dispose();proj.splice(i,1)}}
 }
 for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.v.y-=9*dt;s.m.position.addScaledVector(s.v,dt);s.l-=dt;if(s.l<=0||s.m.position.y<.02){scene.remove(s.m);s.m.material.dispose();sparks.splice(i,1)}}
 hurt=Math.max(0,hurt-dt*1.6);dust.rotation.y+=dt*.01;dust.position.y=Math.sin(tm*.2)*.1;
 // мерцание неона
 fin.uniforms.time.value=tm%10;fin.uniforms.hurt.value=hurt;
 if(state!=='play'&&state!=='over'){cam.position.set(Math.sin(tm*.15)*4,2.4,9);cam.lookAt(0,1.8,-5)}
 comp.render();perfMonitor.update(renderer,now);renderer.info.reset()}
cam.position.copy(P.pos);requestAnimationFrame(loop);
