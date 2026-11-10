(function(root){
  'use strict';

  const ReactorLevel = {
    id: 'reactor-03',
    build(context) {
      const { THREE: T, scene, mat, box, canvas, solids, boxes } = context;
      const S = 18, H = 11;
      const concrete = mat('concrete', 8, 3, 0, 0x727c83);
      const steel = mat('metal', 3, 2, .9, 0x53616b);
      const dark = mat('metal', 2, 2, .95, 0x202a32);
      const floor = new T.Mesh(new T.PlaneGeometry(S * 2, S * 2), mat('floor', 9, 9, .35));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      solids.push(floor);

      // Main chamber walls; the north opening continues into the reactor access corridor.
      box(-10.15, H / 2, -S - .5, 15.9, H, 1, concrete);
      box(10.15, H / 2, -S - .5, 15.9, H, 1, concrete);
      box(0, H - .5, -S - .5, 4.2, 1, 1, steel, false);
      // South access opens into the laboratory connector; the corridor is continuous across the sector boundary.
      box(-10.15, H / 2, S + .5, 15.9, H, 1, concrete);
      box(10.15, H / 2, S + .5, 15.9, H, 1, concrete);
      box(0, H - .5, S + .5, 4.2, 1, 1, steel, false);
      const entryFloor = new T.Mesh(new T.PlaneGeometry(5.2, 14), mat('floor', 2, 5, .35));
      entryFloor.rotation.x = -Math.PI / 2;
      entryFloor.position.set(0, .015, 25);
      entryFloor.receiveShadow = true;
      scene.add(entryFloor);
      solids.push(entryFloor);
      box(-2.8, 3.5, 25, .45, 7, 14, concrete);
      box(2.8, 3.5, 25, .45, 7, 14, concrete);
      box(0, H - .35, 25, 5.9, .5, 14, dark, false);
      const entryLamp = new T.PointLight(0x38cfff, .9, 18, 2);
      entryLamp.position.set(0, 5, 25);
      scene.add(entryLamp);
      box(-S - .5, H / 2, 0, 1, H, S * 2, concrete);
      box(S + .5, H / 2, 0, 1, H, S * 2, concrete);

      // Heavy service corridor links the laboratory wing to the reactor hall.
      const corridorFloor = new T.Mesh(new T.PlaneGeometry(5.2, 14), mat('floor', 2, 5, .35));
      corridorFloor.rotation.x = -Math.PI / 2;
      corridorFloor.position.set(0, .015, -25);
      corridorFloor.receiveShadow = true;
      scene.add(corridorFloor);
      solids.push(corridorFloor);
      box(-2.8, 3.5, -25, .45, 7, 14, concrete);
      box(2.8, 3.5, -25, .45, 7, 14, concrete);
      box(0, H - .35, -25, 5.9, .5, 14, dark, false);
      const exitDoor = box(0, 3.5, -32.5, 5.8, 7, .5, steel);
      let exitOpen = false;
      // Short, illuminated evacuation vestibule beyond the final bulkhead gives the player a real place to emerge.
      const evacuationFloor = new T.Mesh(new T.PlaneGeometry(5.2, 8), mat('floor', 2, 3, .2));
      evacuationFloor.rotation.x = -Math.PI / 2;
      evacuationFloor.position.set(0, .015, -36.5);
      evacuationFloor.receiveShadow = true;
      scene.add(evacuationFloor);
      solids.push(evacuationFloor);
      box(-2.8, 3.5, -36.5, .45, 7, 8, concrete);
      box(2.8, 3.5, -36.5, .45, 7, 8, concrete);
      box(0, H - .35, -36.5, 5.9, .5, 8, dark, false);
      const evacuationLight = new T.PointLight(0x8cecff, 2.1, 20, 2);
      evacuationLight.position.set(0, 5.2, -37.5);
      scene.add(evacuationLight);

      // Reactor containment base and the luminous energy column.
      const base = new T.Mesh(new T.CylinderGeometry(5.2, 5.8, 1.15, 48), dark);
      base.position.set(0, .58, -1);
      base.castShadow = true;
      base.receiveShadow = true;
      scene.add(base);
      solids.push(base);
      boxes.push({ x0: -5.8, x1: 5.8, z0: -6.8, z1: 4.8 });
      const coreMaterial = new T.MeshStandardMaterial({
        color: 0x7bdfff,
        emissive: 0x087fc4,
        emissiveIntensity: 2.8,
        metalness: .55,
        roughness: .2,
        transparent: true,
        opacity: .82
      });
      const core = new T.Mesh(new T.CylinderGeometry(1.45, 1.8, 7.2, 32), coreMaterial);
      core.position.set(0, 4.65, -1);
      core.castShadow = true;
      scene.add(core);
      const coreLight = new T.PointLight(0x27bfff, 3.2, 25, 2);
      coreLight.position.set(0, 5, -1);
      scene.add(coreLight);

      const reactorRings = [];
      for (let i = 0; i < 4; i++) {
        const ring = new T.Mesh(
          new T.TorusGeometry(2.15 + i * .55, .09, 12, 64),
          new T.MeshStandardMaterial({
            color: i % 2 ? 0x8eecff : 0xff9b43,
            emissive: i % 2 ? 0x168acb : 0xa54210,
            emissiveIntensity: 2.2,
            metalness: .8,
            roughness: .25
          })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 2.2 + i * 1.45, -1);
        scene.add(ring);
        reactorRings.push(ring);
      }

      // Reinforced pylons, coolant conduits and warning beacons.
      for (const x of [-13, 13]) {
        for (const z of [-12, 10]) {
          box(x, 3.8, z, 1.4, 7.6, 1.4, steel);
          const beacon = new T.PointLight(0xff4b35, 1.1, 12, 2);
          beacon.position.set(x, 6.3, z);
          scene.add(beacon);
          const lamp = new T.Mesh(new T.SphereGeometry(.22, 12, 8), new T.MeshBasicMaterial({ color: 0xff4638 }));
          lamp.position.copy(beacon.position);
          scene.add(lamp);
        }
      }
      for (const z of [-10, -4, 4, 10]) {
        const pipe = new T.Mesh(new T.CylinderGeometry(.22, .22, 28, 12), steel);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(0, H - 1.2, z);
        pipe.castShadow = true;
        scene.add(pipe);
      }

      const signCanvas = canvas(512, (ctx, size) => {
        ctx.fillStyle = '#080e14';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ff5b38';
        ctx.font = 'bold 104px Bahnschrift,Arial';
        ctx.textAlign = 'center';
        ctx.fillText('REACTOR', size / 2, 190);
        ctx.fillStyle = '#bceeff';
        ctx.font = 'bold 52px Arial';
        ctx.fillText('CORE 03', size / 2, 280);
        ctx.fillStyle = '#ff5b38';
        ctx.fillRect(64, 330, size - 128, 9);
      });
      const sign = new T.Mesh(
        new T.PlaneGeometry(7, 3.2),
        new T.MeshBasicMaterial({ map: new T.CanvasTexture(signCanvas) })
      );
      sign.rotation.y = -Math.PI / 2;
      sign.position.set(S + .03, 7.1, 0);
      scene.add(sign);

      scene.add(new T.HemisphereLight(0x7696b2, 0x100d14, .38));
      const corridorLight = new T.PointLight(0xff8b42, 1.2, 17, 2);
      corridorLight.position.set(0, 5, -25);
      scene.add(corridorLight);

      // Emergency shutdown console with the final incident record.
      const terminal = new T.Mesh(new T.BoxGeometry(1.3, 2, .9), steel);
      terminal.position.set(8, 1, 12);
      terminal.castShadow = true;
      scene.add(terminal);
      const terminalScreen = new T.Mesh(new T.PlaneGeometry(.95, .78), new T.MeshBasicMaterial({ color: 0xffa34d }));
      terminalScreen.position.set(8, 1.58, 12.47);
      scene.add(terminalScreen);
      const terminalLight = new T.PointLight(0xff8a3b, 1, 7, 2);
      terminalLight.position.set(8, 2, 12.8);
      scene.add(terminalLight);

      return {
        name: 'Реакторное ядро',
        bounds: { halfSize: 33, height: H },
        exitZone: { x0: -2.1, x1: 2.1, z0: -33.8, z1: -32.7 },
        requiredInteractionId: 'reactor-shutdown',
        playerSpawn: { x: 0, y: 1.7, z: 28, yaw: Math.PI },
        enemySpawnPoints: [[-14, -14], [14, -14], [-14, 12], [14, 12], [0, -15], [-16, 0], [16, 0], [16, 16]],
        openExit() { exitOpen = true; const index = boxes.indexOf(exitDoor.userData.collisionBox); if (index >= 0) boxes.splice(index, 1); },
        update(dt, time) {
          if (exitOpen) exitDoor.position.y += (10 - exitDoor.position.y) * Math.min(1, dt * 2.2);
          reactorRings.forEach((ring, index) => {
            ring.rotation.y = Math.sin(time * .45 + index) * .12;
            ring.rotation.z += dt * (index % 2 ? -.18 : .24);
          });
          coreLight.intensity = 3.0 + Math.sin(time * 2.1) * .45;
          coreMaterial.emissiveIntensity = 2.8 + Math.sin(time * 1.7) * .35;
        },
        interactables: [{
          id: 'reactor-shutdown',
          label: 'АКТИВИРОВАТЬ АВАРИЙНОЕ ОТКЛЮЧЕНИЕ',
          x: 8,
          z: 12,
          dialogue: [
            { speaker: 'ИЛЬЯ', text: 'Защитный контур ослаблен. Подтверди аварийное отключение на этой панели. После этого немедленно уходи по эвакуационному коридору.' },
            { speaker: 'АРХИВ / 07', text: 'Команда принята. Реакторное ядро отключается. Все шлюзы эвакуационного маршрута разблокированы.' },
            { speaker: 'ИЛЬЯ', text: 'Теперь беги. Я расскажу правду, когда ты окажешься снаружи.' }
          ]
        }]
      };
    }
  };

  root.S7ReactorLevel = ReactorLevel;
  if (typeof module !== 'undefined' && module.exports) module.exports = ReactorLevel;
})(typeof window !== 'undefined' ? window : globalThis);
