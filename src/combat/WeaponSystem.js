(function(){
  class S7WeaponSystem {
    constructor(options) {
      this.THREE = options.THREE;
      this.camera = options.camera;
      this.sound = options.sound;
      this.onAmmoChange = options.onAmmoChange || function(){};
      this.magazineSize = 30;
      this.ammo = this.magazineSize;
      this.reloadDuration = 1.5;
      this.reloadRemaining = 0;
      this.reloadSoundPlayed = false;
      this.cooldown = 0;
      this.recoil = 0;
      this.pitchKick = 0;
      this.baseSpread = 0.004;
      this.aimBloom = 0;
      this.maxAimBloom = 0.018;
      this.raycaster = new this.THREE.Raycaster();

      const T = this.THREE;
      this.group = new T.Group();
      const metal = new T.MeshStandardMaterial({color:0x1a1d22,roughness:.3,metalness:.95,envMapIntensity:1.2});
      const trim = new T.MeshStandardMaterial({color:0x3a3f46,roughness:.5,metalness:.8});
      const addPart = (geometry, material, x, y, z, rx=0) => {
        const mesh = new T.Mesh(geometry, material);
        mesh.position.set(x,y,z);
        mesh.rotation.x = rx;
        this.group.add(mesh);
        return mesh;
      };
      addPart(new T.BoxGeometry(.075,.1,.46),metal,0,0,0);
      addPart(new T.BoxGeometry(.06,.03,.34),trim,0,.065,-.02);
      addPart(new T.CylinderGeometry(.016,.016,.34,12),trim,0,.01,-.38,Math.PI/2);
      addPart(new T.CylinderGeometry(.024,.02,.07,12),metal,0,.01,-.56,Math.PI/2);
      addPart(new T.BoxGeometry(.05,.16,.07),metal,0,-.12,.08,.25);
      addPart(new T.BoxGeometry(.055,.17,.09),trim,0,-.13,-.1,-.1);
      addPart(new T.BoxGeometry(.02,.012,.02),new T.MeshBasicMaterial({color:new T.Color(0,3,3)}),0,.088,-.14);

      this.flash = new T.Mesh(
        new T.PlaneGeometry(.35,.35),
        new T.MeshBasicMaterial({color:new T.Color(6,3,1),transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide})
      );
      this.flash.position.set(0,.01,-.66);
      this.group.add(this.flash);
      this.flashLight = new T.PointLight(0xffa050,0,9,2);
      this.flashLight.position.set(0,.05,-.7);
      this.group.add(this.flashLight);
      this.group.position.set(.27,-.25,-.55);
      this.camera.add(this.group);
      this.group.traverse(object=>{if(object.isMesh&&object!==this.flash)object.castShadow=false});
    }

    fire(solids,enemies,spark,onEnemyHit,onWorldHit,randomRange) {
      if(this.reloadRemaining>0||this.cooldown>0)return false;
      if(this.ammo<=0){this.reload();return false;}
      this.ammo--;
      this.cooldown=.1;
      this.recoil=.07;
      this.pitchKick=Math.min(.12,this.pitchKick+.012);
      this.aimBloom=Math.min(this.maxAimBloom,this.aimBloom+.0028);
      this.flash.material.opacity=1;
      this.flash.rotation.z=randomRange(0,6);
      this.flashLight.intensity=3;
      this.sound(2600,.2,0,.3,true);
      this.sound(140,.14,'sine',.5);

      const spread=this.baseSpread+this.aimBloom;
      this.raycaster.setFromCamera({x:randomRange(-spread,spread),y:randomRange(-spread,spread)},this.camera);
      const targets=solids.concat(enemies.map(enemy=>enemy.g));
      const intersections=this.raycaster.intersectObjects(targets,true);
      if(intersections.length){
        const hit=intersections[0];
        const enemy=hit.object.userData.e;
        if(enemy)onEnemyHit(enemy,hit);
        else onWorldHit(hit);
      }
      this.onAmmoChange(this.ammo);
      return true;
    }

    reload() {
      if(this.reloadRemaining>0||this.ammo===this.magazineSize)return false;
      this.reloadRemaining=this.reloadDuration;
      this.reloadSoundPlayed=false;
      this.sound(300,.15,'square',.1);
      return true;
    }

    update(dt,time,moving) {
      this.cooldown=Math.max(0,this.cooldown-dt);
      this.recoil*=Math.pow(.85,dt*60);
      this.aimBloom*=Math.pow(.08,dt);
      this.pitchKick*=Math.pow(.8,dt*60);
      if(this.reloadRemaining>0){
        const previous=this.reloadRemaining;
        this.reloadRemaining=Math.max(0,this.reloadRemaining-dt);
        if(!this.reloadSoundPlayed&&previous>.75&&this.reloadRemaining<=.75){
          this.reloadSoundPlayed=true;
          this.sound(200,.12,'square',.12);
        }
        const progress=1-this.reloadRemaining/this.reloadDuration;
        this.group.rotation.x=-Math.sin(progress*Math.PI)*.8;
        if(this.reloadRemaining===0){
          this.ammo=this.magazineSize;
          this.onAmmoChange(this.ammo);
          this.group.rotation.x=0;
        }
      } else {
        this.group.rotation.x=this.recoil*1.5;
      }
      this.group.position.set(
        .27+Math.sin(time*4.5)*.004*moving,
        -.25+Math.sin(time*9)*.006*moving,
        -.55+this.recoil
      );
      this.flash.material.opacity*=.6;
      this.flashLight.intensity*=.55;
    }
  }

  window.S7WeaponSystem=S7WeaponSystem;
})();
