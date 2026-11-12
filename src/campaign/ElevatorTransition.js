(function(root){
  'use strict';

  class S7ElevatorTransition {
    constructor({ THREE, scene, camera, onTravel, onComplete, onSound }) {
      if (!THREE || !scene || !camera) throw new TypeError('ElevatorTransition requires THREE, scene and camera');
      this.THREE=THREE; this.scene=scene; this.camera=camera;
      this.onTravel=typeof onTravel==='function'?onTravel:()=>{};
      this.onComplete=typeof onComplete==='function'?onComplete:()=>{};
      this.onSound=typeof onSound==='function'?onSound:()=>{};
      this.group=null; this.displayCanvas=null; this.displayTexture=null;
      this.doors=[]; this.ceilingLight=null; this.player=null;
      this.phase='idle'; this.phaseTime=0; this.travelTime=0;
      this.destinationReady=false; this.radioComplete=false; this.destinationLabel='02';
      this.destinationY=0; this.travelStartY=0; this.doorOpen=1; this.disposed=false; this.lastDisplayKey=null;
      this.durations={closing:.9,travel:4.2,opening:.9};
      this.cabinHalfWidth=1.9; this.cabinHalfDepth=2.4;
    }

    isActive(){return this.phase!=='idle'&&this.phase!=='complete';}

    begin({position,yaw=0,destinationLabel='02',player=null}={}){
      if(this.isActive()||!position)throw new Error('Elevator transition is already active or has no start position');
      this.disposed=false; this.player=player; this.destinationLabel=String(destinationLabel);
      this.createCabin(position,yaw);
      this.phase='closing'; this.phaseTime=0; this.travelTime=0;
      this.radioComplete=false; this.destinationReady=false; this.doorOpen=1;
      // The trigger sits at the threshold. Place the player just inside without changing their view direction.
      if(this.player?.pos){
        const inside=this.group.localToWorld(new this.THREE.Vector3(0,1.7,.55));
        this.player.pos.copy(inside);
      }
      this.drawDisplay('01','ДВЕРИ ОТКРЫТЫ');
      this.setDoorOpen(1);
      this.onSound('door-close');
      return this;
    }

    createCabin(position,yaw){
      const T=this.THREE,group=new T.Group(); this.group=group;
      const forwardX=-Math.sin(yaw),forwardZ=-Math.cos(yaw);
      group.position.set(position.x+forwardX*2.4,position.y-1.7,position.z+forwardZ*2.4);
      group.rotation.y=yaw;
      const metal=new T.MeshStandardMaterial({color:0x35434c,metalness:.72,roughness:.42});
      const dark=new T.MeshStandardMaterial({color:0x101a21,metalness:.42,roughness:.56});
      const trim=new T.MeshStandardMaterial({color:0x718b98,metalness:.82,roughness:.27});
      const floorMat=new T.MeshStandardMaterial({color:0x202d34,metalness:.7,roughness:.48});
      const addBox=(w,h,d,x,y,z,material)=>{
        const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);
        mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
      };
      // A closed, continuous cabin shell: floor, ceiling, side walls and a solid front wall.
      addBox(3.8,.16,4.8,0,-.08,0,floorMat);
      addBox(3.8,.14,4.8,0,3.37,0,dark);
      addBox(.14,3.35,4.8,-1.83,1.62,0,metal);
      addBox(.14,3.35,4.8,1.83,1.62,0,metal);
      addBox(3.8,3.35,.14,0,1.62,-2.33,metal);
      // Door frame at the rear threshold. The two leaves meet without a central gap.
      addBox(.14,3.35,.18,-1.83,1.62,2.32,trim);
      addBox(.14,3.35,.18,1.83,1.62,2.32,trim);
      addBox(3.8,.16,.18,0,3.22,2.32,trim);
      addBox(3.8,.12,.18,0,.08,2.32,trim);
      const doorMaterial=new T.MeshStandardMaterial({color:0x465a65,metalness:.88,roughness:.3});
      this.doors=[
        addBox(1.9,2.86,.12,-.95,1.62,2.22,doorMaterial),
        addBox(1.9,2.86,.12,.95,1.62,2.22,doorMaterial)
      ];
      this.doors[0].userData.closedX=-.95;this.doors[1].userData.closedX=.95;
      this.doors[0].userData.openX=-1.86;this.doors[1].userData.openX=1.86;
      for(const x of[-1.55,1.55]){
        const strip=new T.Mesh(new T.BoxGeometry(.035,2.45,.025),new T.MeshBasicMaterial({color:0x4cc9ff}));
        strip.position.set(x,1.65,2.13);group.add(strip);
      }
      const ceilingLight=new T.PointLight(0x9edcff,1.15,8,2);
      ceilingLight.position.set(0,3.05,0);group.add(ceilingLight);this.ceilingLight=ceilingLight;
      const emergency=new T.PointLight(0xff4c36,.12,5,2);emergency.position.set(0,2.7,1.8);group.add(emergency);
      const panel=new T.Mesh(new T.BoxGeometry(1.12,1.28,.12),dark);
      panel.position.set(0,1.98,-2.22);group.add(panel);this.panel=panel;
      const panelFrame=new T.Mesh(new T.BoxGeometry(1.2,1.36,.035),trim);
      panelFrame.position.set(0,1.98,-2.29);group.add(panelFrame);
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
      const texture=new T.CanvasTexture(canvas);
      if(T.SRGBColorSpace&&'colorSpace'in texture)texture.colorSpace=T.SRGBColorSpace;
      else if(T.sRGBEncoding)texture.encoding=T.sRGBEncoding;
      const screen=new T.Mesh(new T.PlaneGeometry(.82,.46),new T.MeshBasicMaterial({map:texture,toneMapped:false}));
      screen.position.set(0,2.18,-2.145);group.add(screen);
      this.displayCanvas=canvas;this.displayTexture=texture;
      this.scene.add(group);
    }

    drawDisplay(floor,status){
      if(!this.displayCanvas||!this.displayTexture)return;
      const ctx=this.displayCanvas.getContext('2d');
      ctx.fillStyle='#06131b';ctx.fillRect(0,0,256,128);
      ctx.strokeStyle='#1c6a83';ctx.lineWidth=3;ctx.strokeRect(5,5,246,118);
      ctx.fillStyle='#5ddcff';ctx.font='bold 17px monospace';ctx.textAlign='center';
      ctx.fillText('SECTOR 7  /  LIFT',128,28);
      ctx.fillStyle='#e4fbff';ctx.font='bold 55px monospace';ctx.fillText(String(floor).slice(0,4),128,82);
      ctx.fillStyle='#ffad63';ctx.font='bold 15px monospace';ctx.fillText(status,128,108);
      this.displayTexture.needsUpdate=true;
    }

    setDestination(position,yaw,floorLabel){
      if(!this.group||!position)throw new Error('Elevator cabin has not started');
      const destinationYaw=Number(yaw)||0;
      const forwardX=-Math.sin(destinationYaw),forwardZ=-Math.cos(destinationYaw);
      // Rotate the cabin to the destination while preserving the player's facing relative to its interior.
      const playerYawOffset=this.player&&Number.isFinite(this.player.yaw)
        ?this.player.yaw-this.group.rotation.y:0;
      this.group.rotation.y=destinationYaw;
      this.destinationY=position.y-1.7;
      this.group.position.set(position.x+forwardX*2.4,this.destinationY+7.5,position.z+forwardZ*2.4);
      this.destinationLabel=String(floorLabel||this.destinationLabel);
      this.destinationReady=true;this.travelStartY=this.group.position.y;
      if(this.player?.pos){
        const inside=this.group.localToWorld(new this.THREE.Vector3(0,1.7,.55));
        this.player.pos.copy(inside);
        this.player.yaw=destinationYaw+playerYawOffset;
      }
      this.drawDisplay(this.destinationLabel,'КАБИНА В ДВИЖЕНИИ');
    }

    setRadioComplete(){this.radioComplete=true;}

    setDoorOpen(amount){
      this.doorOpen=Math.max(0,Math.min(1,amount));
      for(const door of this.doors){
        door.position.x=door.userData.closedX+
          (door.userData.openX-door.userData.closedX)*this.doorOpen;
      }
    }

    constrainPlayer(position){
      if(!this.isActive()||!this.group||!position)return false;
      const c=Math.cos(this.group.rotation.y),s=Math.sin(this.group.rotation.y);
      const dx=position.x-this.group.position.x,dz=position.z-this.group.position.z;
      let x=dx*c-dz*s,z=dx*s+dz*c;
      x=Math.max(-1.48,Math.min(1.48,x));
      const doorPassable=this.doorOpen>=.98&&(this.phase==='open'||this.phase==='opening');
      z=Math.max(-1.78,Math.min(doorPassable?3.8:1.92,z));
      position.x=this.group.position.x+x*c+z*s;
      position.z=this.group.position.z-x*s+z*c;
      position.y=this.group.position.y+1.7;
      if(doorPassable&&z>3.15){
        this.phase='complete';
        this.dispose();
        this.onComplete(position);
      }
      return true;
    }

    enterPhase(phase){
      this.phase=phase;this.phaseTime=0;
      if(phase==='travel'){
        this.travelTime=0;this.lastDisplayKey='B1|ПОДЪЁМ';this.drawDisplay('B1','ПОДЪЁМ');
        this.onSound('motor-start');this.onTravel();
      }else if(phase==='opening'){
        this.drawDisplay(this.destinationLabel,'ПРИБЫТИЕ');this.onSound('arrival');
      }else if(phase==='open'){
        this.drawDisplay(this.destinationLabel,'ДВЕРИ ОТКРЫТЫ');this.onSound('door-open');
      }
    }

    update(deltaTime){
      if(!this.isActive())return false;
      const dt=Math.max(0,Math.min(.1,Number(deltaTime)||0));
      this.phaseTime+=dt;
      if(this.phase==='closing'){
        const t=Math.min(1,this.phaseTime/this.durations.closing);
        this.setDoorOpen(1-t);
        if(t>=1)this.enterPhase('travel');
      }else if(this.phase==='travel'){
        this.travelTime+=dt;
        if(this.destinationReady){
          const t=Math.min(1,this.travelTime/this.durations.travel);
          const eased=t*t*(3-2*t);
          const nextY=this.travelStartY+(this.destinationY-this.travelStartY)*eased;
          const dy=nextY-this.group.position.y;
          this.group.position.y=nextY;
          if(this.player?.pos)this.player.pos.y+=dy;
          const floor=this.travelTime<1.4?'B1':this.travelTime<2.8?'B2':this.destinationLabel;
          const status=this.travelTime<2.1?'ПОДЪЁМ':'СНИЖЕНИЕ';
          const displayKey=floor+'|'+status;
          if(displayKey!==this.lastDisplayKey){
            this.lastDisplayKey=displayKey;
            this.drawDisplay(floor,status);
            this.onSound('floor-beep');
          }
          if(t>=1&&this.radioComplete)this.enterPhase('opening');
        }
        if(this.ceilingLight)this.ceilingLight.intensity=.95+Math.sin(this.travelTime*13)*.13;
      }else if(this.phase==='opening'){
        const t=Math.min(1,this.phaseTime/this.durations.opening);
        this.setDoorOpen(t);
        if(t>=1)this.enterPhase('open');
      }
      if(this.player?.pos&&this.isActive())this.constrainPlayer(this.player.pos);
      return true;
    }

    dispose(){
      if(this.disposed)return;
      this.phase='complete';
      this.disposed=true;
      if(this.group){
        const geometries=new Set(),materials=new Set();
        this.group.traverse(object=>{
          if(object.geometry)geometries.add(object.geometry);
          if(object.material)for(const material of(Array.isArray(object.material)?object.material:[object.material]))if(material)materials.add(material);
        });
        geometries.forEach(geometry=>geometry.dispose?.());
        materials.forEach(material=>material.dispose?.());
        this.scene.remove(this.group);
      }
      this.group=null;this.ceilingLight=null;
      this.displayTexture?.dispose?.();this.displayTexture=null;this.displayCanvas=null;
      this.panel=null;this.doors=[];this.player=null;
    }
  }

  root.S7ElevatorTransition=S7ElevatorTransition;
  if(typeof module!=='undefined'&&module.exports)module.exports=S7ElevatorTransition;
})(typeof window!=='undefined'?window:globalThis);
