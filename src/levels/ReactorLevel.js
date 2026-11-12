(function(root){
  'use strict';

  const ReactorLevel = {
    id: 'reactor-03',
    build(context) {
      const { THREE: T, scene, mat, box, canvas, solids, boxes } = context;
      const S = 18, H = 11;
      const concrete = mat('concrete', 8, 3, 0, 0x55545a);
      const steel = mat('metal', 3, 2, .9, 0x39434b);
      const dark = mat('metal', 2, 2, .95, 0x202a32);
      const floor = new T.Mesh(new T.PlaneGeometry(S * 2, S * 2), mat('floor', 9, 9, .35, 0x343b43));
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
      // Red emergency beacon pulses after the reactor shutdown sequence begins.
      const alarm = new T.PointLight(0xff3028, .25, 16, 2);
      alarm.position.set(0, 6.2, -17.5);
      scene.add(alarm);

      // Emergency shutdown console with the final incident record.
      let reactorShutdown = false;
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
      const shutdownScan = new T.Mesh(new T.PlaneGeometry(.82, .035), new T.MeshBasicMaterial({ color: 0xffe0b0, transparent: true, opacity: .7 }));
      shutdownScan.position.set(8, 1.58, 12.49);
      scene.add(shutdownScan);
      const shutdownStatus = new T.Mesh(new T.SphereGeometry(.085, 12, 8), new T.MeshBasicMaterial({ color: 0xffa34d }));
      shutdownStatus.position.set(8.42, 1.95, 12.49);
      scene.add(shutdownStatus);

      // Optional black-box recorder reveals what the archive concealed about Ilya's final shift.
      const recorder = new T.Mesh(new T.BoxGeometry(1.05, 1.45, .65), dark);
      recorder.position.set(-8, .9, 12);
      recorder.castShadow = true;
      scene.add(recorder);
      const recorderScreen = new T.Mesh(new T.PlaneGeometry(.76, .56), new T.MeshBasicMaterial({ color: 0x42cfff }));
      recorderScreen.position.set(-8, 1.32, 12.34);
      scene.add(recorderScreen);
      const recorderLight = new T.PointLight(0x32caff, .75, 5, 2);
      recorderLight.position.set(-8, 1.8, 12.65);
      scene.add(recorderLight);

      // Emergency maintenance bay: tool cabinets, coolant drums and a heavy service trolley.
      const maintenanceSteel = mat('metal', 1, 1, .88, 0x3e484e);
      const warningAmber = new T.MeshBasicMaterial({ color: 0xff8a35 });
      for (const x of [-11.5, 11.5]) {
        box(x, 1.2, 4, 1.4, 2.4, 1.1, maintenanceSteel);
        for (let y = .55; y < 2.2; y += .52) {
          const handle = new T.Mesh(new T.BoxGeometry(.42, .045, .04), steel);
          handle.position.set(x, y, 4.58); scene.add(handle);
        }
        const warning = new T.Mesh(new T.BoxGeometry(.9, .12, .025), warningAmber);
        warning.position.set(x, 2.28, 4.58); scene.add(warning);
      }
      for (const [x, z] of [[-12, -9], [12, -9], [-12, 10], [12, 10]]) {
        const drum = new T.Mesh(new T.CylinderGeometry(.52, .52, 1.35, 18), maintenanceSteel);
        drum.position.set(x, .68, z); drum.castShadow = true; scene.add(drum);
        for (const y of [.18, 1.18]) {
          const rim = new T.Mesh(new T.TorusGeometry(.53, .055, 8, 20), steel);
          rim.rotation.x = Math.PI / 2; rim.position.set(x, y, z); scene.add(rim);
        }
        const hazard = new T.Mesh(new T.BoxGeometry(.12, .5, .025), warningAmber);
        hazard.position.set(x, .7, z + .525); scene.add(hazard);
        boxes.push({ x0: x - .55, x1: x + .55, z0: z - .55, z1: z + .55, y0: 0, y1: 1.35, topY: 1.35 });
      }
      // Low service trolley beside the reactor access path.
      box(-7.5, .72, -2.5, 2.2, .14, .9, maintenanceSteel);
      for (const x of [-8.35, -6.65]) {
        box(x, .36, -2.5, .1, .72, .1, steel, false);
        const wheel = new T.Mesh(new T.CylinderGeometry(.16, .16, .08, 12), dark);
        wheel.rotation.z = Math.PI / 2; wheel.position.set(x, .13, -2.5); scene.add(wheel);
      }

      // Massive thermal ducts and segmented warning grilles frame the reactor chamber.
      const ductMat = new T.MeshStandardMaterial({ color: 0x343c43, metalness: .88, roughness: .38 });
      const hotMat = new T.MeshBasicMaterial({ color: 0xff6a2d });
      for (const x of [-14.8, 14.8]) {
        const duct = new T.Mesh(new T.CylinderGeometry(.62, .62, 20, 16), ductMat);
        duct.rotation.x = Math.PI / 2; duct.position.set(x, 7.4, 0); duct.castShadow = true; scene.add(duct);
        for (let i = 0; i < 5; i++) {
          const band = new T.Mesh(new T.TorusGeometry(.65, .075, 8, 20), steel);
          band.rotation.x = Math.PI / 2; band.position.set(x, 7.4, -8 + i * 4); scene.add(band);
        }
        const vent = new T.Mesh(new T.BoxGeometry(.18, 3.4, .06), hotMat);
        vent.position.set(x > 0 ? x - .7 : x + .7, 1.9, -2); scene.add(vent);
      }
      for (let i = 0; i < 8; i++) {
        const grate = new T.Mesh(new T.BoxGeometry(3.2, .055, .12), ductMat);
        grate.position.set(0, .08, -10 + i * 2.2); scene.add(grate);
      }

      return {
        name: 'Реакторное ядро',
        bounds: { halfSize: 33, height: H },
        exitZone: { x0: -2.1, x1: 2.1, z0: -33.8, z1: -32.7 },
        requiredInteractionId: 'reactor-shutdown',
        evacuationSeconds: 90,
        playerSpawn: { x: 0, y: 1.7, z: 28, yaw: 0 },
        enemySpawnPoints: [[-14, -14], [14, -14], [-14, 12], [14, 12], [0, -15], [-16, 0], [16, 0], [16, 16]],
        openExit() { exitOpen = true; reactorShutdown = true; context.removeCollisionBox(exitDoor.userData.collisionBox); },
        onInteractionActivated(id) {
          if (id !== 'reactor-shutdown') return;
          terminalScreen.material.color.setHex(0x42ff9b);
          shutdownScan.material.color.setHex(0x42ff9b);
        },
        update(dt, time) {
          shutdownScan.position.y = 1.34 + ((time * .38) % 1) * .48;
          shutdownScan.material.opacity = reactorShutdown ? .05 : .35 + Math.sin(time * 5.5) * .22;
          shutdownStatus.material.color.setHex(reactorShutdown ? 0x45ff9a : (Math.sin(time * 3.8) > 0 ? 0xffa34d : 0x6b351c));
          terminalLight.color.setHex(reactorShutdown ? 0x45ff9a : 0xff8a3b);
          terminalLight.intensity = reactorShutdown ? .35 : .8 + Math.sin(time * 4) * .16;
          if (exitOpen) exitDoor.position.y += (10 - exitDoor.position.y) * Math.min(1, dt * 2.2);
          reactorRings.forEach((ring, index) => {
            ring.rotation.y = Math.sin(time * .45 + index) * .12;
            ring.rotation.z += dt * (index % 2 ? -.18 : .24);
          });
          if (reactorShutdown) {
            coreMaterial.opacity = Math.max(0, coreMaterial.opacity - dt * .22);
            coreMaterial.emissiveIntensity = Math.max(.05, coreMaterial.emissiveIntensity - dt * 1.1);
            core.scale.y = Math.max(.12, core.scale.y - dt * .12);
            coreLight.intensity = Math.max(.08, coreLight.intensity - dt * 2.2);
            alarm.intensity = .25 + Math.max(0, Math.sin(time * 8)) * 1.35;
            corridorLight.intensity = Math.max(.15, corridorLight.intensity - dt * .35);
          } else {
            coreLight.intensity = 3.0 + Math.sin(time * 2.1) * .45;
            coreMaterial.emissiveIntensity = 2.8 + Math.sin(time * 1.7) * .35;
          }
        },
        interactables: [{
          id: 'reactor-archive',
          label: 'ПРОСЛУШАТЬ ЧЁРНЫЙ ЯЩИК',
          x: -8,
          z: 12,
          dialogue: [
            { speaker: 'ИЛЬЯ / ЗАПИСЬ', text: 'Смена 19. Ядро имитирует голоса погибших сотрудников. Сегодня оно заговорило голосом моей дочери. Я отключил внешний канал, но кто-то снова его включил.' },
            { speaker: 'АРХИВ / 07', text: 'Запись повреждена. Идентификатор оператора: Илья Воронцов. Статус: погиб. Дата: 19 суток назад.' },
            { speaker: 'ИЛЬЯ', text: 'Теперь ты понимаешь. Я не пытался спасти себя. Я пытался не дать ему выйти наружу.' }
          ]
        }, {
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
