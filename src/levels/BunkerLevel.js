(function(root){
  'use strict';

  const BunkerLevel = {
    id: 'bunker-01',
    build(context) {
      const { THREE: T, scene, mat, box, canvas, randomRange: R } = context;
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
      return {
        name: 'Заброшенный бункер',
        bounds: { halfSize: S, height: H },
        playerSpawn: { x: 0, y: 1.7, z: 9 },
        enemySpawnPoints: [[-10,-10],[10,-10],[-10,10],[10,10],[0,-10.5]]
      };
    }
  };

  root.S7BunkerLevel = BunkerLevel;
  if (typeof module !== 'undefined' && module.exports) module.exports = BunkerLevel;
})(typeof window !== 'undefined' ? window : globalThis);
