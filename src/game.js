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
function box(x,y,z,w,h,d,m,col=true){const me=new T.Mesh(new T.BoxGeometry(w,h,d),m);me.position.set(x,y,z);me.castShadow=me.receiveShadow=true;scene.add(me);solids.push(me);
 if(col)boxes.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});return me}
const S=12,H=7;
const fl=new T.Mesh(new T.PlaneGeometry(S*2,S*2),mat('floor',6,6,.3));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;scene.add(fl);solids.push(fl);
box(0,H,0,S*2+2,.6,S*2+2,mat('concrete',6,2,0,0x889099),false);
box(0,H/2,-S-.5,S*2+2,H,1,mat('concrete',6,2));box(0,H/2,S+.5,S*2+2,H,1,mat('concrete',6,2));
box(-S-.5,H/2,0,1,H,S*2,mat('concrete',6,2));box(S+.5,H/2,0,1,H,S*2,mat('concrete',6,2));
const mm=mat('metal',1,1,.85),mm2=mat('metal',2,1,.7,0xa9794f),mc=mat('concrete',1,3);
box(0,.65,-1,7,1.3,.6,mc);box(-6.5,H/2-.3,0,1.2,H,1.2,mc);box(6.5,H/2-.3,0,1.2,H,1.2,mc);
[[-8,1.1,-7,2.2],[8.3,1.1,-6.5,2.2],[3.5,.8,-6,1.6],[-4.5,.8,6,1.6],[9,1.1,8,2.2],[-9,.8,5,1.6],[0,.8,6.5,1.6]].forEach(([x,y,z,s],i)=>box(x,y,z,s,s,s,i%2?mm2:mm));
[[-3,-5],[5,3],[-10,-2],[10.5,-1.5]].forEach(([x,z])=>{const b=new T.Mesh(new T.CylinderGeometry(.48,.48,1.3,24),new T.MeshStandardMaterial({color:0x7a2a1a,roughness:.45,metalness:.8,envMapIntensity:.8}));
 b.position.set(x,.65,z);b.castShadow=b.receiveShadow=true;scene.add(b);solids.push(b);boxes.push({x0:x-.5,x1:x+.5,z0:z-.5,z1:z+.5})});
for(const z of[-S+1.2,S-1.2]){const p=new T.Mesh(new T.CylinderGeometry(.22,.22,S*2,16),mm);p.rotation.z=Math.PI/2;p.position.set(0,H-1.2,z);p.castShadow=true;scene.add(p)}
// неоновая вывеска
const sg=canvas(512,(x,s)=>{x.fillStyle='#000';x.fillRect(0,0,s,s);x.fillStyle='#ff5a2a';x.font='bold 150px Bahnschrift,Arial';x.textAlign='center';x.fillText('SECTOR 7',256,230);x.font='60px Arial';x.fillStyle='#ffd0a0';x.fillText('ДОСТУП ЗАПРЕЩЁН',256,330)});
const sm=new T.MeshBasicMaterial({map:new T.CanvasTexture(sg),color:new T.Color(2.4,2.4,2.4)});sm.map.encoding=T.sRGBEncoding;
const sign=new T.Mesh(new T.PlaneGeometry(7,7),sm);sign.scale.y=.5;sign.position.set(0,4.2,-S+.02);scene.add(sign);
// свет
scene.add(new T.HemisphereLight(0x3a5570,0x0a0a0a,.35));
const strips=new T.MeshStandardMaterial({color:0,emissive:0xcfeaff,emissiveIntensity:4});
[[-5,-5],[5,5],[-5,5],[5,-5]].forEach(([x,z],i)=>{const s=new T.Mesh(new T.BoxGeometry(.3,.1,5),strips);s.position.set(x,H-.35,z);scene.add(s);
 const l=new T.PointLight(0xbfe0ff,.75,20,2);l.position.set(x,H-1,z);if(i<2){l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-.002}scene.add(l)});
[[0xff6a1a,-10.5,3,9,1.2],[0xff2a8a,10.5,3,-9,1.2],[0x20e0ff,0,2.5,-10.5,1]].forEach(([c,x,y,z,i])=>{const l=new T.PointLight(c,i,15,2);l.position.set(x,y,z);scene.add(l);
 const g=new T.Mesh(new T.BoxGeometry(.3,2.4,.3),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(3)}));g.position.set(x,y,z);scene.add(g)});
// пыль
{const n=500,p=new Float32Array(n*3);for(let i=0;i<n;i++){p[i*3]=R(-S,S);p[i*3+1]=R(.2,H-1);p[i*3+2]=R(-S,S)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));var dust=new T.Points(g,new T.PointsMaterial({size:.035,color:0xaac8e0,transparent:true,opacity:.45,depthWrite:false}));scene.add(dust)}

const torch=new T.SpotLight(0xe8f4ff,1.6,28,.5,.6,1.2);torch.position.set(.2,-.1,0);torch.target.position.set(0,0,-5);cam.add(torch,torch.target);

/* ---------- состояние ---------- */
const P={pos:new T.Vector3(0,1.7,9),yaw:0,pitch:0,hp:100},keys={};
let state='menu',kills=0,spawned=0,spawnT=0,hurt=0,tm=0,mouse=false,fallback=false,locked=false;
const GOAL=10,enemies=[],proj=[],sparks=[];
const droneAI=new S7DroneAI();
const $=id=>document.getElementById(id);
const saveSystem=new S7SaveSystem();
const savedCampaign=saveSystem.load();
const savedStats=savedCampaign.stats;
$('saveInfo').textContent=`СОХРАНЕНИЕ · Побед: ${savedStats.wins} · Поражений: ${savedStats.losses} · Лучший результат: ${savedStats.bestKills} дронов`;
function collide(p,r){for(const b of boxes){const cx=cl(p.x,b.x0,b.x1),cz=cl(p.z,b.z0,b.z1),dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;
 if(d2<r*r){if(d2>1e-6){const d=Math.sqrt(d2),k=(r-d)/d;p.x+=dx*k;p.z+=dz*k}else p.x+=r}}}

/* ---------- звук ---------- */
let ac;function snd(f,d,type,v,noise){if(!ac)return;const t=ac.currentTime,o=ac.createGain();o.gain.setValueAtTime(v,t);o.gain.exponentialRampToValueAtTime(.001,t+d);let s;
 if(noise){const b=ac.createBuffer(1,Math.floor(ac.sampleRate*d),ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;s=ac.createBufferSource();s.buffer=b;const fi=ac.createBiquadFilter();fi.type='lowpass';fi.frequency.value=f;s.connect(fi);fi.connect(o)}
 else{s=ac.createOscillator();s.type=type;s.frequency.setValueAtTime(f,t);s.frequency.exponentialRampToValueAtTime(Math.max(20,f/3),t+d);s.connect(o)}o.connect(ac.destination);s.start(t)}

/* ---------- враги ---------- */
const bodyM=new T.MeshStandardMaterial({color:0x2b3037,roughness:.28,metalness:.95,envMapIntensity:1.3});
function spawn(){
 const pts=[[-10,-10],[10,-10],[-10,10],[10,10],[0,-10.5]];
 let q;
 for(let i=0;i<8;i++){q=pts[Math.random()*pts.length|0];if(Math.hypot(q[0]-P.pos.x,q[1]-P.pos.z)>9)break}
 const sequence=['scout','assault','heavy','scout','sniper','assault','scout','heavy','sniper','scout'];
 const type=sequence[spawned%sequence.length],profile=S7DroneAI.PROFILES[type];
 const g=new T.Group(),m=bodyM.clone();
 m.color.setHex(profile.bodyColor);
 const eye=new T.MeshBasicMaterial({color:profile.eyeColor});
 const e={
  g,type,hp:profile.hp,m,t:R(0,9),cd:R(profile.attackMin,profile.attackMax),
  moveSpeed:profile.moveSpeed,preferredDistance:profile.preferredDistance,
  projectileSpeed:profile.projectileSpeed,damage:profile.damage,spread:profile.spread,
  attackMin:profile.attackMin,attackMax:profile.attackMax,eye,flash:0
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
function killE(e){scene.remove(e.g);enemies.splice(enemies.indexOf(e),1);for(let i=0;i<18;i++)spark(e.g.position,new T.Color(3,1.6,.5),6);snd(90,.4,'sawtooth',.4);kills++;$('kl').textContent=`Дроны: ${kills} / ${GOAL}`;if(kills>=GOAL)end(true)}
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
function end(w){if(state==='over')return;state='over';document.exitPointerLock&&document.exitPointerLock();
 const record=saveSystem.recordMissionResult({missionId:'bunker-01',won:w,kills});
 $('ov').style.display='flex';
 $('ov').innerHTML=`<div><h1>${w?'СЕКТОР ЗАЧИЩЕН':'ТЫ ПОГИБ'}</h1><p>Уничтожено дронов: ${kills} / ${GOAL}</p><p>Всего побед: ${record.stats.wins} · Поражений: ${record.stats.losses}</p><p>Лучший результат: ${record.stats.bestKills} дронов</p><p><b>Нажми, чтобы сыграть снова</b></p></div>`;$('ov').onclick=()=>location.reload()}

/* ---------- управление ---------- */
const dom=renderer.domElement;
$('ov').onclick=()=>{if(state==='over')return;if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();state='play';$('ov').style.display='none';
 try{dom.requestPointerLock()}catch(e){fallback=true}};
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===dom;if(!locked&&state==='play'&&!fallback){state='menu';$('msg').innerHTML='<b>Пауза — нажми, чтобы продолжить</b>';$('ov').style.display='flex'}});
document.addEventListener('pointerlockerror',()=>{fallback=true});
addEventListener('mousemove',e=>{if(state!=='play'||!(locked||fallback))return;P.yaw-=e.movementX*.0022;P.pitch=cl(P.pitch-e.movementY*.0022,-1.45,1.45)});
addEventListener('mousedown',e=>{if(e.button===0)mouse=true});addEventListener('mouseup',()=>mouse=false);
addEventListener('keydown',e=>{keys[e.code]=1;if(e.code==='KeyR')weapon.reload();if(e.code==='KeyF')torch.visible=!torch.visible;if(e.code==='F3')perfMonitor.toggle()});addEventListener('keyup',e=>keys[e.code]=0);
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
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;tm+=dt;
 if(state==='play'){
  const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),r=(keys.KeyD?1:0)-(keys.KeyA?1:0),sp=keys.ShiftLeft?7:4.6,mv=f||r;
  if(mv){const l=Math.hypot(f,r),sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);P.pos.x+=(-sy*f+cy*r)/l*sp*dt;P.pos.z+=(-cy*f-sy*r)/l*sp*dt;collide(P.pos,.4)}
  P.pos.y=1.7+(mv?Math.sin(tm*(keys.ShiftLeft?13:9))*.035:0);
  cam.position.copy(P.pos);cam.rotation.set(P.pitch+weapon.pitchKick,P.yaw,0);
  if(mouse)weapon.fire(solids,enemies,spark,hitEnemy,hitWorld,R);
  weapon.update(dt,tm,mv);
  spawnT-=dt;if(spawned<GOAL&&enemies.length<5&&spawnT<=0){spawn();spawnT=3.5}
  droneAI.update(enemies,P,dt,collide,scene,proj,snd,R);
  for(let i=proj.length-1;i>=0;i--){const p=proj[i];p.m.position.addScaledVector(p.v,dt);p.l-=dt;const dd=p.m.position.distanceTo(new T.Vector3(P.pos.x,Math.min(p.m.position.y,1.5),P.pos.z));
   let hit=p.l<=0||Math.abs(p.m.position.x)>S||Math.abs(p.m.position.z)>S||p.m.position.y<0;
   if(!hit)for(const b of boxes)if(p.m.position.y<2.4&&p.m.position.x>b.x0&&p.m.position.x<b.x1&&p.m.position.z>b.z0&&p.m.position.z<b.z1){hit=true;break}
   if(dd<.55){dmg(p.damage||8);hit=true}if(hit){scene.remove(p.m);proj.splice(i,1)}}
 }
 for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.v.y-=9*dt;s.m.position.addScaledVector(s.v,dt);s.l-=dt;if(s.l<=0||s.m.position.y<.02){scene.remove(s.m);sparks.splice(i,1)}}
 hurt=Math.max(0,hurt-dt*1.6);dust.rotation.y+=dt*.01;dust.position.y=Math.sin(tm*.2)*.1;
 // мерцание неона
 fin.uniforms.time.value=tm%10;fin.uniforms.hurt.value=hurt;
 if(state!=='play'&&state!=='over'){cam.position.set(Math.sin(tm*.15)*4,2.4,9);cam.lookAt(0,1.8,-5)}
 comp.render();perfMonitor.update(renderer,now);renderer.info.reset()}
cam.position.copy(P.pos);requestAnimationFrame(loop);
