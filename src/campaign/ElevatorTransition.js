(function(root){
  'use strict';

  class S7ElevatorTransition {
    constructor({ THREE, scene, camera, onTravel, onComplete, onSound }) {
      if (!THREE || !scene || !camera) {
        throw new TypeError('ElevatorTransition requires THREE, scene and camera');
      }
      this.THREE = THREE;
      this.scene = scene;
      this.camera = camera;
      this.onTravel = typeof onTravel === 'function' ? onTravel : () => {};
      this.onComplete = typeof onComplete === 'function' ? onComplete : () => {};
      this.onSound = typeof onSound === 'function' ? onSound : () => {};
      this.group = null;
      this.display = null;
      this.displayTexture = null;
      this.displayCanvas = null;
      this.doors = [];
      this.ceilingLight = null;
      this.phase = 'idle';
      this.phaseTime = 0;
      this.travelTime = 0;
      this.radioComplete = false;
      this.destinationReady = false;
      this.destinationLabel = '01';
      this.disposed = false;
      this.doorOpen = 1;
      this.cameraLocalZ = -3;
      this.cameraYaw = 0;
      this.durations = { entering: 1.15, closing: .85, travel: 3.8, opening: .95, exiting: .85 };
    }

    begin({ position, yaw = 0, destinationLabel = '02' } = {}) {
      if (this.phase !== 'idle' || !position) throw new Error('Elevator transition is already active or has no start position');
      this.destinationLabel = String(destinationLabel);
      this.cameraYaw = yaw;
      this.createCabin(position, yaw);
      this.phase = 'entering';
      this.phaseTime = 0;
      this.travelTime = 0;
      this.radioComplete = false;
      this.destinationReady = false;
      this.doorOpen = 1;
      this.cameraLocalZ = -3;
      this.drawDisplay('01', 'ВХОД');
      this.updateCamera();
      this.onSound('door-open');
      return this;
    }

    createCabin(position, yaw) {
      const T = this.THREE;
      const group = new T.Group();
      this.group = group;
      const forwardX = -Math.sin(yaw), forwardZ = -Math.cos(yaw);
      group.position.set(position.x + forwardX * 3, position.y - 1.7, position.z + forwardZ * 3);
      group.rotation.y = yaw + Math.PI;
      const metal = new T.MeshStandardMaterial({ color: 0x25313b, metalness: .78, roughness: .34 });
      const dark = new T.MeshStandardMaterial({ color: 0x080f16, metalness: .35, roughness: .58 });
      const trim = new T.MeshStandardMaterial({ color: 0x5d7787, metalness: .85, roughness: .25 });
      const floorMat = new T.MeshStandardMaterial({ color: 0x17232b, metalness: .72, roughness: .48 });
      const addBox = (w, h, d, x, y, z, material) => {
        const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        return mesh;
      };
      addBox(3.8, .16, 4.8, 0, -.08, 0, floorMat);
      addBox(3.8, .12, 4.8, 0, 3.38, 0, dark);
      addBox(.14, 3.35, 4.8, -1.92, 1.62, 0, metal);
      addBox(.14, 3.35, 4.8, 1.92, 1.62, 0, metal);
      addBox(3.8, 3.35, .14, 0, 1.62, 2.38, metal);
      addBox(3.8, .08, .16, 0, 3.32, -2.32, trim);
      addBox(.12, 3.25, .18, -1.86, 1.62, -2.32, trim);
      addBox(.12, 3.25, .18, 1.86, 1.62, -2.32, trim);
      addBox(3.45, .035, .05, 0, .13, -2.22, trim);
      addBox(3.45, .035, .05, 0, 3.05, -2.22, trim);
      const doorMaterial = new T.MeshStandardMaterial({ color: 0x344650, metalness: .88, roughness: .28 });
      this.doors = [
        addBox(1.12, 2.86, .12, -1.22, 1.62, -2.25, doorMaterial),
        addBox(1.12, 2.86, .12, 1.22, 1.62, -2.25, doorMaterial)
      ];
      this.doors[0].userData.closedX = -.57;
      this.doors[1].userData.closedX = .57;
      this.doors[0].userData.openX = -1.22;
      this.doors[1].userData.openX = 1.22;
      for (const x of [-1.55, 1.55]) {
        const strip = new T.Mesh(new T.BoxGeometry(.035, 2.45, .025),
          new T.MeshBasicMaterial({ color: 0x4cc9ff }));
        strip.position.set(x, 1.65, -2.16);
        group.add(strip);
      }
      const ceilingLight = new T.PointLight(0x9edcff, 1.2, 8, 2);
      ceilingLight.position.set(0, 3.05, 0);
      group.add(ceilingLight);
      this.ceilingLight = ceilingLight;
      const emergency = new T.PointLight(0xff4c36, .12, 5, 2);
      emergency.position.set(0, 2.7, 1.8);
      group.add(emergency);
      const panel = new T.Mesh(new T.BoxGeometry(.52, .82, .09), dark);
      panel.position.set(1.78, 1.75, -.65);
      group.add(panel);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const texture = new T.CanvasTexture(canvas);
      if (T.SRGBColorSpace && 'colorSpace' in texture) texture.colorSpace = T.SRGBColorSpace;
      else if (T.sRGBEncoding) texture.encoding = T.sRGBEncoding;
      const screen = new T.Mesh(new T.PlaneGeometry(.42, .21),
        new T.MeshBasicMaterial({ map: texture, toneMapped: false }));
      screen.position.set(1.72, 2.12, -.71);
      screen.rotation.y = -Math.PI / 2;
      group.add(screen);
      this.displayCanvas = canvas;
      this.displayTexture = texture;
      this.drawDisplay('01', 'ВХОД');
      this.scene.add(group);
    }

    drawDisplay(floor, status) {
      if (!this.displayCanvas || !this.displayTexture) return;
      const ctx = this.displayCanvas.getContext('2d');
      ctx.fillStyle = '#06131b';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#1c6a83';
      ctx.lineWidth = 3;
      ctx.strokeRect(5, 5, 246, 118);
      ctx.fillStyle = '#5ddcff';
      ctx.font = 'bold 17px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SECTOR 7  /  LIFT', 128, 28);
      ctx.fillStyle = '#e4fbff';
      ctx.font = 'bold 55px monospace';
      ctx.fillText(String(floor).slice(0, 4), 128, 82);
      ctx.fillStyle = '#ffad63';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(status, 128, 108);
      this.displayTexture.needsUpdate = true;
    }

    setDestination(position, yaw, floorLabel) {
      if (!this.group || !position) throw new Error('Elevator cabin has not started');
      this.group.position.set(position.x, position.y - 1.7, position.z);
      this.group.rotation.y = Number(yaw) || 0;
      this.destinationLabel = String(floorLabel || this.destinationLabel);
      this.destinationReady = true;
      this.cameraYaw = Number(yaw) || 0;
      this.cameraLocalZ = .15;
      this.updateCamera();
      this.drawDisplay(this.destinationLabel, 'В ПУТИ');
    }

    setRadioComplete() {
      this.radioComplete = true;
    }

    updateCamera() {
      if (!this.group) return;
      const local = new this.THREE.Vector3(0, 1.7, this.cameraLocalZ);
      this.camera.position.copy(this.group.localToWorld(local));
      this.camera.rotation.set(0, this.cameraYaw, 0);
    }

    setDoorOpen(amount) {
      this.doorOpen = Math.max(0, Math.min(1, amount));
      for (const door of this.doors) {
        const direction = door.userData.closedX < 0 ? -1 : 1;
        door.position.x = door.userData.closedX +
          (door.userData.openX - door.userData.closedX) * this.doorOpen;
      }
    }

    enterPhase(phase) {
      this.phase = phase;
      this.phaseTime = 0;
      if (phase === 'closing') {
        this.drawDisplay('01', 'ДВЕРИ');
        this.onSound('door-close');
      } else if (phase === 'travel') {
        this.travelTime = 0;
        this.drawDisplay('01', 'ДВИЖЕНИЕ');
        this.onSound('motor-start');
        this.onTravel();
      } else if (phase === 'opening') {
        this.drawDisplay(this.destinationLabel, 'ПРИБЫТИЕ');
        this.onSound('arrival');
      } else if (phase === 'exiting') {
        this.onSound('door-open');
      }
    }

    update(deltaTime) {
      if (this.phase === 'idle' || this.phase === 'complete') return false;
      const dt = Math.max(0, Math.min(.1, Number(deltaTime) || 0));
      this.phaseTime += dt;
      if (this.phase === 'entering') {
        const t = Math.min(1, this.phaseTime / this.durations.entering);
        this.cameraLocalZ = -3 + t * 1.2;
        this.updateCamera();
        if (t >= 1) {
          this.cameraYaw = this.group.rotation.y;
          this.updateCamera();
          this.enterPhase('closing');
        }
      } else if (this.phase === 'closing') {
        const t = Math.min(1, this.phaseTime / this.durations.closing);
        this.setDoorOpen(1 - t);
        if (t >= 1) this.enterPhase('travel');
      } else if (this.phase === 'travel') {
        this.travelTime += dt;
        const flicker = Math.floor(this.travelTime * 3) % 2;
        if (Math.floor(this.travelTime * 2) !== Math.floor((this.travelTime - dt) * 2)) {
          const floor = this.travelTime < 1.1 ? 'B1' : this.travelTime < 2.2 ? 'B2' : this.destinationLabel;
          this.drawDisplay(floor, flicker ? 'ПОДЪЁМ' : 'В ПУТИ');
          if (flicker) this.onSound('floor-beep');
        }
        if (this.travelTime >= this.durations.travel && this.radioComplete && this.destinationReady) {
          this.enterPhase('opening');
        }
      } else if (this.phase === 'opening') {
        const t = Math.min(1, this.phaseTime / this.durations.opening);
        this.setDoorOpen(t);
        if (t >= 1) this.enterPhase('exiting');
      } else if (this.phase === 'exiting') {
        const t = Math.min(1, this.phaseTime / this.durations.exiting);
        this.cameraLocalZ = .15 - t * 2.15;
        this.updateCamera();
        if (t >= 1) {
          this.phase = 'complete';
          const exitPosition = this.group.localToWorld(new this.THREE.Vector3(0, 1.7, -2));
          this.dispose();
          this.onComplete(exitPosition);
        }
      }
      if (this.group && this.phase === 'travel') {
        const vibration = Math.sin(this.travelTime * 18) * .012;
        this.camera.position.y = this.group.position.y + 1.7 + vibration;
        if (this.ceilingLight) this.ceilingLight.intensity = .92 + Math.sin(this.travelTime * 13) * .16;
      }
      return true;
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      if (this.group) {
        const geometries = new Set();
        const materials = new Set();
        this.group.traverse(object => {
          if (object.geometry) geometries.add(object.geometry);
          if (object.material) {
            for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
              if (material) materials.add(material);
            }
          }
        });
        geometries.forEach(geometry => geometry.dispose?.());
        materials.forEach(material => material.dispose?.());
        this.scene.remove(this.group);
      }
      this.group = null;
      this.ceilingLight = null;
      this.displayTexture = null;
      this.displayCanvas = null;
      this.doors = [];
    }
  }

  root.S7ElevatorTransition = S7ElevatorTransition;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7ElevatorTransition;
})(typeof window !== 'undefined' ? window : globalThis);
