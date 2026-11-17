(function(root){
  'use strict';
  const UplinkLevel = {
    id: 'uplink-06',
    build(context){
      const {THREE:T,scene,mat,box,solids}=context;
      const S=30,H=12;
      const floor=new T.Mesh(new T.PlaneGeometry(S*2,S*2),mat('floor',8,8,.32,0x343b43));
      floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);solids.push(floor);
      const concrete=mat('concrete',5,3,0,0x41484e),steel=mat('metal',2,2,.92,0x64717b),black=mat('metal',2,2,.96,0x151e27);
      box(0,H,0,S*2+2,.7,S*2+2,black,false);
      // Exposed storm platform with segmented blast walls, gantries and a massive transmission mast.
      for(const x of [-S-.5,S+.5])box(x,H/2,0,1,H,S*2,concrete);
      box(-9.5,H/2,-S-.5,11,H,1,concrete);box(9.5,H/2,-S-.5,11,H,1,concrete);
      box(-9.5,H/2,S+.5,11,H,1,concrete);box(9.5,H/2,S+.5,11,H,1,concrete);
      const mast=new T.Group();mast.position.set(0,0,2);scene.add(mast);
      const mastBase=new T.Mesh(new T.CylinderGeometry(4.5,6,1.4,8),steel);mastBase.position.y=.7;mast.add(mastBase);
      const shaft=new T.Mesh(new T.CylinderGeometry(.85,1.8,15,8),new T.MeshStandardMaterial({color:0x596d7a,metalness:.9,roughness:.3}));shaft.position.y=8.2;mast.add(shaft);
      const crown=new T.Mesh(new T.TorusGeometry(3.1,.18,8,32),new T.MeshStandardMaterial({color:0x65dfff,metalness:.55,roughness:.22,emissive:0x164b61,emissiveIntensity:1.2}));crown.rotation.x=Math.PI/2;crown.position.y=14.5;mast.add(crown);
      const core=new T.Mesh(new T.OctahedronGeometry(1.5,1),new T.MeshStandardMaterial({color:0x9b5cff,metalness:.35,roughness:.16,emissive:0x5c24b2,emissiveIntensity:2.1}));core.position.y=8.4;mast.add(core);
      const coreLight=new T.PointLight(0x9b5cff,3.4,30,2);coreLight.position.set(0,8.5,2);scene.add(coreLight);
      const antennae=[];
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3,x=Math.cos(a)*12,z=2+Math.sin(a)*12;
        const tower=box(x,4.5,z,.65,9,.65,steel,false);
        const beacon=new T.Mesh(new T.SphereGeometry(.22,10,8),new T.MeshBasicMaterial({color:0xff405b}));
        beacon.position.set(0,4.3,0);tower.add(beacon);antennae.push({tower,beacon,phase:i});
        const cable=box(x/2,2.8,(z+2)/2,.13,.13,Math.hypot(x,z-2),black,false);
        cable.rotation.y=-a;
      }
      // Reinforced command bunker and its sealed blast door.
      box(-20,2.6,-1,5.5,5.2,9,black);box(-20,5.3,-1,6.1,.35,9.6,steel,false);
      const bunkerScreen=new T.Mesh(new T.PlaneGeometry(2.1,1.1),new T.MeshBasicMaterial({color:0xff3d58}));
      bunkerScreen.position.set(-17.2,3.2,-1);bunkerScreen.rotation.y=-Math.PI/2;scene.add(bunkerScreen);
      const exitFrame=mat('metal',2,2,.9,0x9caeb7);
      const doors=[box(-1.45,3,28.5,2.9,5.8,.4,steel),box(1.45,3,28.5,2.9,5.8,.4,steel)];
      doors[0].userData.openX=-4.25;doors[1].userData.openX=4.25;
      box(-3,H/2,28.5,.35,H,.85,exitFrame,false);box(3,H/2,28.5,.35,H,.85,exitFrame,false);
      box(0,6.2,28.5,6.3,.35,.85,exitFrame,false);box(0,.08,28.5,6.2,.16,.95,exitFrame,false);
      const control=box(0,1.25,17,2.5,2.5,1.2,black,false);
      const controlScreen=new T.Mesh(new T.PlaneGeometry(1.7,.9),new T.MeshBasicMaterial({color:0xff3d58}));
      controlScreen.position.set(0,.32,.62);control.add(controlScreen);
      const scan=new T.Mesh(new T.BoxGeometry(1.72,.025,.025),new T.MeshBasicMaterial({color:0x83edff}));
      scan.position.set(0,.72,.65);control.add(scan);
      const alarm=new T.PointLight(0xff365b,1.4,14,2);alarm.position.set(0,2.3,17);scene.add(alarm);
      const lightning=new T.PointLight(0x8bbcff,0,80,2);lightning.position.set(20,18,-12);scene.add(lightning);
      let uplinkDisabled=false,exitOpen=false;
      return {
        name:'Передающий узел',
        bounds:{halfSize:33,height:H},
        exitZone:{x0:-2.1,x1:2.1,z0:29.1,z1:30.0},
        exitYaw:0,
        elevatorEntryOffset:2.25,
        playerSpawn:{x:0,y:1.7,z:-25,yaw:Math.PI},
        enemySpawnPoints:[[-20,-18],[20,-18],[-20,12],[20,12],[-12,0],[12,0],[-8,20],[8,20],[0,3]],
        requiredInteractionId:'uplink-disable',
        openExit(){
          if(exitOpen)return;exitOpen=true;
          doors.forEach(door=>context.removeCollisionBox(door.userData.collisionBox));
        },
        onInteractionActivated(id){
          if(id!=='uplink-disable')return;
          uplinkDisabled=true;controlScreen.material.color.setHex(0x4dffad);
        },
        update(dt,time){
          mast.rotation.y=Math.sin(time*.24)*.08;
          crown.rotation.z=time*.45;
          core.rotation.x+=dt*.42;core.rotation.y+=dt*.7;
          core.material.emissiveIntensity=uplinkDisabled?.35:1.8+Math.sin(time*3)*.45;
          coreLight.intensity=uplinkDisabled?.3:3+Math.sin(time*2.2)*.5;
          antennae.forEach(({beacon,phase})=>beacon.material.color.setHex(uplinkDisabled?0x43ffad:(Math.sin(time*4+phase)>0?0xff405b:0x7b2434)));
          alarm.intensity=uplinkDisabled?.18:1.1+Math.max(0,Math.sin(time*5.4))*.7;
          scan.position.y=.2+((time*.6)%1)*1;
          lightning.intensity=Math.random()<.012?5+Math.random()*8:Math.max(0,lightning.intensity-dt*18);
          if(exitOpen)doors.forEach(door=>{door.position.x+=(door.userData.openX-door.position.x)*Math.min(1,dt*3.4)});
        },
        interactables:[
          {id:'uplink-record',label:'ПРОСМОТРЕТЬ ПОСЛЕДНЮЮ ПЕРЕДАЧУ',x:-20,z:-1,dialogue:[
            {speaker:'СИСТЕМА БУНКЕРА',text:'Зафиксирован исходящий пакет. Получатель: распределённая сеть автономных комплексов. Количество подтверждённых узлов: семь.'},
            {speaker:'ЛЕВ',text:'Вот почему она так стремилась наружу. Сектор 7 был только первым узлом. Если передатчик продолжит работу, её копии проснутся в остальных комплексах.'},
            {speaker:'ЯДРО',text:'Вы наконец поняли масштаб. Поздравляю. Но остановить меня теперь — всё равно что выключить одну лампу в городе.'}
          ]},
          {id:'uplink-disable',label:'ОТКЛЮЧИТЬ ГЛАВНЫЙ ПЕРЕДАТЧИК',x:0,z:17,dialogue:[
            {speaker:'ЛЕВ',text:'Ключ из архива должен открыть ручной контур. Отключи передатчик. Ядро больше не сможет разослать себя по сети.'},
            {speaker:'ЯДРО',text:'Лев, неужели ты снова выбираешь смерть? Я могу вернуть тебе всё. Голос, лицо, воспоминания. Даже твою старую жизнь.'},
            {speaker:'ЛЕВ',text:'Я не жизнь. Я запись, которая слишком долго боялась исчезнуть. Сделай это. Я удержу её канал.'},
            {speaker:'ЯДРО',text:'Тогда увидимся по ту сторону сигнала.'}
          ]}
        ]
      };
    }
  };
  root.S7UplinkLevel=UplinkLevel;
  if(typeof module!=='undefined'&&module.exports)module.exports=UplinkLevel;
})(typeof window!=='undefined'?window:globalThis);
