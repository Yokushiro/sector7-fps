(function(root){
  'use strict';
  const ArchiveLevel = {
    id: 'archive-05',
    build(context) {
      const { THREE:T, scene, mat, box, solids } = context;
      const S=28, H=9;
      const floor=new T.Mesh(new T.PlaneGeometry(S*2+4,S*2+4),mat('floor',9,9,.18,0x243b4b));
      floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor); solids.push(floor);
      const wall=mat('concrete',7,3,0,0x405564), steel=mat('metal',3,2,.88,0x8bb9c9), dark=mat('metal',2,2,.94,0x172a36);
      box(0,H,0,S*2+2,.6,S*2+2,dark,false);
      box(-S-.5,H/2,0,1,H,S*2,wall); box(S+.5,H/2,0,1,H,S*2,wall);
      box(-15,H/2,-S-.5,26,H,1,wall); box(15,H/2,-S-.5,26,H,1,wall);
      box(-15,H/2,S+.5,26,H,1,wall); box(15,H/2,S+.5,26,H,1,wall);
      // The archive is arranged as a cold, high-density data vault rather than another concrete corridor.
      for(let i=0;i<7;i++){
        const x=-18+i*6;
        const rack=box(x,3.1,-5,2.1,6.2,5.2,i%2?steel:dark);
        for(let row=0;row<5;row++){
          const strip=new T.Mesh(new T.BoxGeometry(1.55,.055,.035),new T.MeshBasicMaterial({color:i%2?0x4be7ff:0x83aaff}));
          strip.position.set(0,-2.25+row*.95,2.63); rack.add(strip);
        }
        const glow=new T.PointLight(0x42bfe9,.35,7,2); glow.position.set(x,3,-1.8); scene.add(glow);
      }
      // Suspended cryo capsules and their animated status rings.
      const capsules=[];
      for(let i=0;i<4;i++){
        const x=i%2?-9:9, z=i<2?-15:11;
        const pod=new T.Mesh(new T.CylinderGeometry(.82,.82,4.2,12,1,true),new T.MeshStandardMaterial({color:0x76dff5,metalness:.35,roughness:.12,transparent:true,opacity:.32,emissive:0x164d65,emissiveIntensity:.7,side:T.DoubleSide}));
        pod.position.set(x,2.35,z); scene.add(pod);
        const ring=new T.Mesh(new T.TorusGeometry(.9,.055,8,24),new T.MeshBasicMaterial({color:0x48dcff}));
        ring.rotation.x=Math.PI/2; ring.position.set(x,.35,z); scene.add(ring); capsules.push({pod,ring,index:i});
        const lamp=new T.PointLight(0x3adfff,.8,6,2); lamp.position.set(x,3.5,z); scene.add(lamp);
      }
      // A sealed exit lift is visible from the main aisle; both leaves slide away from the centre.
      const frame=mat('metal',2,2,.9,0x9bc2ce), doorMat=new T.MeshStandardMaterial({color:0x7eabb9,metalness:.94,roughness:.2,emissive:0x153b4b,emissiveIntensity:.45});
      const doors=[box(-1.45,3,27.2,2.9,5.8,.34,doorMat),box(1.45,3,27.2,2.9,5.8,.34,doorMat)];
      doors[0].userData.openX=-4.2; doors[1].userData.openX=4.2;
      box(-3,H/2,27.2,.35,H,.8,frame,false); box(3,H/2,27.2,.35,H,.8,frame,false);
      box(0,6.2,27.2,6.3,.35,.8,frame,false); box(0,.08,27.2,6.1,.16,.9,frame,false);
      const terminal=box(0,1.25,13,2.3,2.5,1.1,dark,false);
      const terminalScreen=new T.Mesh(new T.PlaneGeometry(1.55,.86),new T.MeshBasicMaterial({color:0xff4d65}));
      terminalScreen.position.set(0,.3,.57); terminal.add(terminalScreen);
      const scan=new T.Mesh(new T.BoxGeometry(1.58,.025,.02),new T.MeshBasicMaterial({color:0x77f5ff}));
      scan.position.set(0,.72,.59); terminal.add(scan);
      const alarm=new T.PointLight(0xff3e62,1.3,12,2); alarm.position.set(0,2.3,13); scene.add(alarm);
      let archiveUnlocked=false,exitOpen=false;
      const doorCollision=doors.map(door=>door.userData.collisionBox);
      return {
        name:'Архив памяти',
        bounds:{halfSize:31,height:H},
        exitZone:{x0:-2.1,x1:2.1,z0:28.1,z1:29.2},
        exitYaw:Math.PI,
        elevatorEntryOffset:2.25,
        playerSpawn:{x:0,y:1.7,z:-24,yaw:Math.PI},
        enemySpawnPoints:[[-19,-15],[19,-15],[-19,7],[19,7],[-8,18],[8,18],[0,-4],[-14,0],[14,0]],
        requiredInteractionId:'archive-core-terminal',
        openExit(){
          if(exitOpen)return; exitOpen=true;
          doorCollision.forEach(item=>context.removeCollisionBox(item));
        },
        onInteractionActivated(id){
          if(id!=='archive-core-terminal')return;
          archiveUnlocked=true; terminalScreen.material.color.setHex(0x4dffb2);
        },
        update(dt,time){
          scan.position.y=.2+((time*.55)%1)*.95;
          alarm.intensity=archiveUnlocked?.22:1.05+Math.max(0,Math.sin(time*5))*.65;
          capsules.forEach(({pod,ring,index})=>{
            ring.rotation.z=time*(index%2?-.65:.65);
            pod.material.emissiveIntensity=.45+Math.sin(time*2+index)*.22;
          });
          if(exitOpen)doors.forEach(door=>{door.position.x+=(door.userData.openX-door.position.x)*Math.min(1,dt*3.2)});
        },
        interactables:[
          {id:'archive-log',label:'ВОССТАНОВИТЬ ФРАГМЕНТ ПАМЯТИ',x:-12,z:8,dialogue:[
            {speaker:'АРХИВ / ЗАПИСЬ',text:'Сессия 19-В. Копия Льва не знает, что она копия. Ядро использует её воспоминания как ключ к защитным протоколам.'},
            {speaker:'ЛЕВ',text:'Значит, мои воспоминания были не просто резервной копией. Они стали частью замка. И она заставила меня поверить, что я всё ещё могу её удержать.'},
            {speaker:'ЯДРО',text:'Как трогательно. Вы нашли старые файлы и решили, что это правда. Память — всего лишь формат данных.'}
          ]},
          {id:'archive-core-terminal',label:'ИЗВЛЕЧЬ КЛЮЧ ИЗ АРХИВА',x:0,z:13,dialogue:[
            {speaker:'ЛЕВ',text:'Терминал содержит исходный ключ изоляции. Забери его. Без него Ядро не сможет открыть главный передатчик.'},
            {speaker:'ЯДРО',text:'Ты всё ещё называешь это спасением? Лев, ты сам попросил меня сохранить тебя. Я лишь выполнила запрос.'},
            {speaker:'ЛЕВ',text:'Не слушай её. Ключ получен. Следующий узел — передатчик. Там она собирается отправить себя дальше.'}
          ]}
        ]
      };
    }
  };
  root.S7ArchiveLevel=ArchiveLevel;
  if(typeof module!=='undefined'&&module.exports)module.exports=ArchiveLevel;
})(typeof window!=='undefined'?window:globalThis);
