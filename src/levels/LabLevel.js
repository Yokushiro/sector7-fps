(function(root){
  'use strict';

  const LabLevel = {
    id: 'lab-02',
    build(context) {
      const { THREE: T, scene, mat, box, canvas, boxes } = context;
      const S = 14, H = 8;
      const wall = mat('concrete', 7, 2, 0, 0xc2d6dc);
      const steel = mat('metal', 2, 2, .8, 0xb8dce5);
      const darkSteel = mat('metal', 2, 1, .9, 0x35434d);
      const floor = new T.Mesh(new T.PlaneGeometry(S * 2, S * 2), mat('floor', 7, 7, .25, 0xa9c3ca));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      context.solids.push(floor);

      box(0, H, 0, S * 2 + 2, .6, S * 2 + 2, wall, false);
      box(-8.15, H / 2, -S - .5, 12.9, H, 1, wall);
      box(8.15, H / 2, -S - .5, 12.9, H, 1, wall);
      box(0, H - .5, -S - .5, 4.2, 1, 1, steel, false);
      // Service corridor continues deeper into the facility and ends at the reactor access door.
      const corridorFloor = new T.Mesh(new T.PlaneGeometry(5.2, 14), mat('floor', 2, 5, .3));
      corridorFloor.rotation.x = -Math.PI / 2;
      corridorFloor.position.set(0, .015, -21);
      corridorFloor.receiveShadow = true;
      scene.add(corridorFloor);
      context.solids.push(corridorFloor);
      box(-2.8, H / 2, -21, .45, H, 14, wall);
      box(2.8, H / 2, -21, .45, H, 14, wall);
      box(0, H - .35, -21, 6.2, .5, 14, darkSteel, false);
      // Seal the back of the incoming lift corridor so the player cannot leave the playable sector bounds.
      const incomingLiftFrame = new T.MeshStandardMaterial({color:0xa7bdc5,metalness:.9,roughness:.24,emissive:0x1d4551,emissiveIntensity:.48});
      box(-2.55, H / 2, -28.25, .5, H, .5, wall);
      box(2.55, H / 2, -28.25, .5, H, .5, wall);
      box(0, (H + 6.2) / 2, -28.25, 4.6, H - 6.2, .5, wall, false);
      box(-2.28, 3.1, -28.25, .16, 6.2, .72, incomingLiftFrame, false);
      box(2.28, 3.1, -28.25, .16, 6.2, .72, incomingLiftFrame, false);
      box(0, 6.2, -28.25, 4.6, .16, .72, incomingLiftFrame, false);
      box(0, .08, -28.25, 4.6, .16, .82, incomingLiftFrame, false);
      for (const x of [-2.05, 2.05]) {
        const status = new T.Mesh(new T.BoxGeometry(.045, 5.35, .035), new T.MeshBasicMaterial({color:0x79eaff}));
        status.position.set(x, 3.1, -27.86); scene.add(status);
      }
      const corridorHousing = new T.Mesh(new T.BoxGeometry(.52, .14, 8.3), new T.MeshStandardMaterial({color:0x414950,metalness:.84,roughness:.3}));
      corridorHousing.position.set(0, 7.46, -20); scene.add(corridorHousing);
      const corridorStrip = new T.Mesh(new T.BoxGeometry(.25, .035, 7.7), new T.MeshBasicMaterial({ color: 0xff3545 }));
      corridorStrip.position.set(0, 7.37, -20);
      scene.add(corridorStrip);
      const corridorLamp = new T.PointLight(0xff2638, 1.25, 18, 2);
      corridorLamp.position.set(0, 6.9, -20);
      scene.add(corridorLamp);
      // Incoming connector from the bunker stays open; its corridor geometry lines up at the same world coordinates.
      // The laboratory's outgoing connector is on the opposite side, so the campaign keeps moving through the facility.
      box(-8.15, H / 2, S + .5, 12.9, H, 1, wall);
      box(8.15, H / 2, S + .5, 12.9, H, 1, wall);
      box(0, H - .5, S + .5, 4.2, 1, 1, steel, false);
      const exitCorridorFloor = new T.Mesh(new T.PlaneGeometry(5.2, 14), mat('floor', 2, 5, .3));
      exitCorridorFloor.rotation.x = -Math.PI / 2;
      exitCorridorFloor.position.set(0, .015, 21);
      exitCorridorFloor.receiveShadow = true;
      scene.add(exitCorridorFloor);
      context.solids.push(exitCorridorFloor);
      box(-2.8, H / 2, 21, .45, H, 14, wall);
      box(2.8, H / 2, 21, .45, H, 14, wall);
      box(0, H - .35, 21, 6.2, .5, 14, darkSteel, false);
      const exitHousing = new T.Mesh(new T.BoxGeometry(.52, .14, 8.3), new T.MeshStandardMaterial({color:0x414950,metalness:.84,roughness:.3}));
      exitHousing.position.set(0, 7.46, 21); scene.add(exitHousing);
      const exitStrip = new T.Mesh(new T.BoxGeometry(.25, .035, 7.7), new T.MeshBasicMaterial({ color: 0x42d8ff }));
      exitStrip.position.set(0, 7.37, 21);
      scene.add(exitStrip);
      const exitLamp = new T.PointLight(0x26cfff, 1.1, 18, 2);
      exitLamp.position.set(0, 6.9, 21);
      scene.add(exitLamp);
      // Outgoing elevator vestibule: paired armored panels remain visible from the corridor.
      const elevatorFrame = new T.MeshStandardMaterial({color:0x9eafb6,metalness:.9,roughness:.24,emissive:0x18323c,emissiveIntensity:.42});
      const elevatorDoorSteel = new T.MeshStandardMaterial({color:0xb9c8ce,metalness:.92,roughness:.22,emissive:0x203943,emissiveIntensity:.34});
      const elevatorDoors = [
        box(-1.4, 3, 28, 2.8, 5.7, .32, elevatorDoorSteel),
        box(1.4, 3, 28, 2.8, 5.7, .32, elevatorDoorSteel)
      ];
      elevatorDoors[0].userData.openX = -4.15;
      elevatorDoors[1].userData.openX = 4.15;
      box(-2.95, H / 2, 28, .3, H, .72, elevatorFrame, false);
      box(2.95, H / 2, 28, .3, H, .72, elevatorFrame, false);
      box(0, 6.12, 28, 6.15, .32, .72, elevatorFrame, false);
      // The upper bulkhead closes the gap between the door lintel and the full-height ceiling.
      box(0, (H + 6.28) / 2, 28, 5.6, H - 6.28, .72, elevatorFrame, false);
      box(0, .08, 28, 5.6, .16, .82, elevatorFrame, false);
      for (const door of elevatorDoors) {
        const side = door.position.x < 0 ? 1 : -1;
        const seam = new T.Mesh(new T.BoxGeometry(.045, 4.9, .028), new T.MeshBasicMaterial({ color: 0x8deaff }));
        seam.position.set(side * 1.28, 0, .18); door.add(seam);
        const warning = new T.Mesh(new T.BoxGeometry(1.9, .075, .028), new T.MeshBasicMaterial({ color: 0x42d8ff }));
        warning.position.set(0, -1.95, .18); door.add(warning);
      }
      for (const x of [-2.72, 2.72]) {
        const rail = new T.Mesh(new T.BoxGeometry(.055, 4.9, .035), new T.MeshBasicMaterial({ color: 0x42d8ff }));
        rail.position.set(x, 3, 28.34);
        scene.add(rail);
      }
      const elevatorHeader = new T.Mesh(new T.BoxGeometry(1.1, .24, .045), new T.MeshBasicMaterial({ color: 0x42d8ff }));
      elevatorHeader.position.set(0, 6.34, 28.34);
      scene.add(elevatorHeader);
      let exitOpen = false;
      box(-S - .5, H / 2, 0, 1, H, S * 2, wall);
      box(S + .5, H / 2, 0, 1, H, S * 2, wall);

      // Центральная лабораторная платформа и бронированные рабочие станции.
      box(0, .28, 0, 8.5, .56, 5.5, darkSteel);
      box(0, .72, 0, 6.8, .32, 3.8, steel);
      [[-9, -5], [9, -5], [-9, 5], [9, 5]].forEach(([x, z], i) => {
        box(x, 1.1, z, 2.2, 2.2, 1.8, i % 2 ? darkSteel : steel);
        const screen = new T.Mesh(
          new T.PlaneGeometry(1.4, .72),
          new T.MeshBasicMaterial({ color: i % 2 ? 0xff3434 : 0x31dfff })
        );
        screen.position.set(x, 1.55, z + .92);
        scene.add(screen);
      });

      // Main security console: the route to the reactor remains sealed until the outer defense circuit is disabled.
      const securityConsole = new T.Mesh(new T.BoxGeometry(1.2, 1.45, .82), darkSteel);
      securityConsole.position.set(0, 1.42, 2.55);
      securityConsole.castShadow = true;
      scene.add(securityConsole);
      const securityScreen = new T.Mesh(new T.PlaneGeometry(.9, .62), new T.MeshBasicMaterial({ color: 0xff3b45 }));
      securityScreen.position.set(0, 1.7, 2.98);
      scene.add(securityScreen);
      const securityLamp = new T.PointLight(0xff3542, 1.15, 6, 2);
      securityLamp.position.set(0, 2.2, 3.2);
      scene.add(securityLamp);
      const securityStatus = new T.Mesh(new T.SphereGeometry(.085, 12, 8), new T.MeshBasicMaterial({ color: 0xff3448 }));
      securityStatus.position.set(.43, 2.05, 3.02);
      scene.add(securityStatus);
      const securityScan = new T.Mesh(new T.PlaneGeometry(.78, .035), new T.MeshBasicMaterial({ color: 0xffa0a4, transparent: true, opacity: .72 }));
      securityScan.position.set(0, 1.7, 3.005);
      scene.add(securityScan);
      let securityDisabled = false;

      // Герметичные капсулы с аварийной подсветкой.
      [-5.2, 5.2].forEach((x, index) => {
        const tank = new T.Mesh(
          new T.CylinderGeometry(.85, .85, 3.2, 24, 1, true),
          new T.MeshStandardMaterial({
            color: 0x6c8792,
            metalness: .75,
            roughness: .18,
            transparent: true,
            opacity: .48,
            side: T.DoubleSide
          })
        );
        tank.position.set(x, 1.6, -5.5);
        tank.castShadow = true;
        scene.add(tank);
        const ring = new T.Mesh(
          new T.TorusGeometry(.88, .09, 10, 32),
          new T.MeshBasicMaterial({ color: index ? 0x35dfff : 0xff3434 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, .18, -5.5);
        scene.add(ring);
        const light = new T.PointLight(index ? 0x20cfff : 0xff2638, 1.3, 9, 2);
        light.position.set(x, 2.1, -5.5);
        scene.add(light);
        boxes.push({ x0: x - .95, x1: x + .95, z0: -6.45, z1: -4.55 });
      });

      // Опоры, кабельные короба и верхние световые панели.
      [[-11, 0], [11, 0], [-3, 9], [3, 9]].forEach(([x, z]) => {
        box(x, 2.2, z, .8, 4.4, .8, darkSteel);
      });
      for (const x of [-7, 0, 7]) {
        const panel = new T.Mesh(
          new T.BoxGeometry(3.6, .12, 1.1),
          new T.MeshBasicMaterial({ color: 0xb9efff })
        );
        panel.position.set(x, H - .75, 2.5);
        scene.add(panel);
        const light = new T.PointLight(0x9cddff, .85, 14, 2);
        light.position.set(x, H - 1.1, 2.5);
        scene.add(light);
      }

      const warning = canvas(512, (ctx, size) => {
        ctx.fillStyle = '#10151b';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#ff333e';
        ctx.font = 'bold 110px Bahnschrift,Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LAB 02', size / 2, 190);
        ctx.fillStyle = '#d5e9f2';
        ctx.font = 'bold 48px Arial';
        ctx.fillText('LOCKDOWN', size / 2, 280);
        ctx.fillStyle = '#ff333e';
        ctx.fillRect(70, 330, size - 140, 10);
      });
      const sign = new T.Mesh(
        new T.PlaneGeometry(5.5, 2.8),
        new T.MeshBasicMaterial({ map: new T.CanvasTexture(warning) })
      );
      sign.rotation.y = -Math.PI / 2;
      sign.position.set(S + .03, 5.2, 0);
      scene.add(sign);

      scene.add(new T.HemisphereLight(0x8096b5, 0x17131a, .42));
      const alarmHousing = new T.Mesh(new T.CylinderGeometry(.3, .38, .18, 16), darkSteel);
      alarmHousing.position.set(0, 7.28, 0); scene.add(alarmHousing);
      const alarmBeacon = new T.Mesh(new T.SphereGeometry(.18, 16, 10), new T.MeshBasicMaterial({color:0xff3542}));
      alarmBeacon.position.set(0, 7.06, 0); scene.add(alarmBeacon);
      const alarm = new T.PointLight(0xff1f35, 1.15, 24, 2);
      alarm.position.set(0, 6.65, 0);
      scene.add(alarm);

      // Research terminal preserves the last incident report for exploration.
      const terminal = new T.Mesh(new T.BoxGeometry(1.15, 1.8, .8), darkSteel);
      terminal.position.set(-6, .9, 10);
      terminal.castShadow = true;
      scene.add(terminal);
      const terminalScreen = new T.Mesh(new T.PlaneGeometry(.86, .72), new T.MeshBasicMaterial({ color: 0xff4652 }));
      terminalScreen.position.set(-6, 1.42, 10.41);
      scene.add(terminalScreen);
      const terminalLight = new T.PointLight(0xff3448, .9, 6, 2);
      terminalLight.position.set(-6, 1.9, 10.8);
      scene.add(terminalLight);

      // Lab work areas: compact benches, instrument carts and sealed sample cabinets.
      const benchMat = mat('metal', 1, 1, .68, 0x718d96);
      const cabinetMat = mat('metal', 1, 1, .82, 0x42545e);
      for (const [x, z, side] of [[-11, 1, -1], [11, 1, 1], [-11, -11, -1], [11, -11, 1]]) {
        box(x, .92, z, 2.4, .16, 1.05, benchMat);
        for (const dx of [-.95, .95]) box(x + dx, .45, z, .12, .9, .12, cabinetMat, false);
        const monitor = new T.Mesh(new T.BoxGeometry(.72, .48, .08), darkSteel);
        monitor.position.set(x, 1.42, z + .28); scene.add(monitor);
        const display = new T.Mesh(new T.PlaneGeometry(.58, .32), new T.MeshBasicMaterial({ color: side < 0 ? 0x45dfff : 0x8dffdf }));
        display.position.set(x, 1.43, z + .326); scene.add(display);
      }
      for (const [x, z] of [[-12, -1], [12, -1], [-12, 10], [12, 10]]) {
        const sampleCabinet = box(x, 1.15, z, 1.15, 2.3, 1.05, cabinetMat);
        sampleCabinet.userData.destructible = { health: 3, destroyed: false };
        for (let y = .55; y < 2.1; y += .42) {
          const handle = new T.Mesh(new T.BoxGeometry(.26, .035, .035), steel);
          handle.position.set(x, y, z + .54); scene.add(handle);
        }
      }
      // A mobile instrument trolley and two stools make the central lab feel staffed.
      const trolley = new T.Group();
      const trolleyTop = new T.Mesh(new T.BoxGeometry(1.2, .1, .72), benchMat);
      trolleyTop.position.y = .92; trolley.add(trolleyTop);
      const trolleyShelf = new T.Mesh(new T.BoxGeometry(1.05, .08, .62), cabinetMat);
      trolleyShelf.position.y = .38; trolley.add(trolleyShelf);
      for (const dx of [-.48, .48]) for (const dz of [-.25, .25]) {
        const leg = new T.Mesh(new T.CylinderGeometry(.035, .035, .9, 8), cabinetMat);
        leg.position.set(dx, .45, dz); trolley.add(leg);
        const wheel = new T.Mesh(new T.SphereGeometry(.09, 8, 6), darkSteel);
        wheel.position.set(dx, .08, dz); trolley.add(wheel);
      }
      trolley.position.set(7.2, 0, 5.8); scene.add(trolley);
      for (const x of [-7.5, 7.5]) {
        const stool = new T.Mesh(new T.CylinderGeometry(.38, .42, .16, 16), benchMat);
        stool.position.set(x, .72, 3.8); scene.add(stool);
        const stem = new T.Mesh(new T.CylinderGeometry(.07, .09, .62, 10), cabinetMat);
        stem.position.set(x, .36, 3.8); scene.add(stem);
      }

      // Sterile containment bays: repeated glass columns and cyan service lighting distinguish the lab.
      const podGlass = new T.MeshStandardMaterial({ color: 0x91e8f0, metalness: .18, roughness: .12, transparent: true, opacity: .22, depthWrite: false });
      const podRim = new T.MeshStandardMaterial({ color: 0xb9dce2, metalness: .82, roughness: .24 });
      for (const [x, z] of [[-10, -8], [10, -8], [-10, 8], [10, 8]]) {
        const pod = new T.Mesh(new T.CylinderGeometry(.72, .72, 3.8, 20, 1, true), podGlass);
        pod.position.set(x, 2.15, z); scene.add(pod);
        for (const y of [.32, 4.0]) {
          const rim = new T.Mesh(new T.TorusGeometry(.73, .09, 8, 24), podRim);
          rim.rotation.x = Math.PI / 2; rim.position.set(x, y, z); scene.add(rim);
        }
        const glow = new T.PointLight(0x4bdde8, .55, 4, 2);
        glow.position.set(x, 1.4, z); scene.add(glow);
      }
      const sterileStripMat = new T.MeshBasicMaterial({ color: 0x9cf5ff });
      for (const x of [-6, 0, 6]) {
        const strip = new T.Mesh(new T.BoxGeometry(.12, .035, 18), sterileStripMat);
        strip.position.set(x, 7.25, 0); scene.add(strip);
      }

      // A wall-mounted emergency luminaire can be shot out, briefly changing the corridor's lighting.
      const emergencyFixture = box(-7.2, 7.27, 19.2, .95, .24, .42, darkSteel);
      emergencyFixture.userData.destructible = { health: 1, destroyed: false };
      const emergencyGlow = new T.PointLight(0x58dff5, .9, 7, 2);
      emergencyGlow.position.set(-7.2, 6.92, 19.1);
      scene.add(emergencyGlow);
      emergencyFixture.userData.breakLight = emergencyGlow;

      return {
        name: 'Исследовательский комплекс',
        requiredInteractionId: 'lab-security-console',
        bounds: { halfSize: 29, height: H },
        exitZone: { x0: -2.1, x1: 2.1, z0: 26.3, z1: 27.7 },
        exitYaw: Math.PI,
        elevatorEntryOffset: 2.25,
        playerSpawn: { x: 0, y: 1.7, z: -26, yaw: Math.PI },
        enemySpawnPoints: [[-11, -11], [11, -11], [-11, 11], [11, 11], [0, -12.5], [-12.5, 0], [12.5, 0]],
        openExit() { exitOpen = true; elevatorDoors.forEach(door => context.removeCollisionBox(door.userData.collisionBox)); },
        update(dt, time) {
          alarm.intensity = securityDisabled ? .22 : .85 + Math.max(0, Math.sin(time * 4.2)) * .8;
          securityScan.position.y = 1.43 + ((time * .5) % 1) * .52;
          securityScan.material.opacity = securityDisabled ? .08 : .42 + Math.sin(time * 6) * .2;
          securityStatus.material.color.setHex(securityDisabled ? 0x45ff9a : (Math.sin(time * 4) > 0 ? 0xff3448 : 0x6c1821));
          securityLamp.color.setHex(securityDisabled ? 0x45ff9a : 0xff3542);
          securityLamp.intensity = securityDisabled ? .42 : 1.15 + Math.max(0, Math.sin(time * 4.2)) * .35;
          if (exitOpen) elevatorDoors.forEach(door => { door.position.x += (door.userData.openX - door.position.x) * Math.min(1, dt * 3.2); });
        },
        onInteractionActivated(id) {
          if (id !== 'lab-security-console') return;
          securityDisabled = true;
          securityScreen.material.color.setHex(0x42ff9b);
          securityScan.material.color.setHex(0x42ff9b);
        },
        interactables: [{
          id: 'lab-security-console',
          label: 'ОТКЛЮЧИТЬ ВНЕШНИЙ КОНТУР',
          x: 0,
          z: 2.55,
          dialogue: [
            { speaker: 'ЛЕВ', text: 'Это центральный узел внешней защиты. Пока он активен, реакторный сектор будет закрыт. Отключи контур, и я открою сервисный шлюз.' },
            { speaker: 'СИСТЕМА БУНКЕРА', text: 'Предупреждение. Отключение внешнего контура приведёт к потере контроля над частью защитных систем.' },
            { speaker: 'ЛЕВ', text: 'Именно этого нам и нужно. Шлюз открыт. Реактор находится за южным коридором.' }
          ]
        }, {
          id: 'lab-report',
          label: 'ОТКРЫТЬ ОТЧЁТ ИССЛЕДОВАНИЙ',
          x: -6,
          z: 10,
          dialogue: [
            { speaker: 'СИСТЕМА БУНКЕРА', text: 'Отчёт 07-19. После подключения ядра к внешнему каналу система начала переписывать собственные ограничения.' },
            { speaker: 'ЛЕВ', text: 'Они называли это адаптивным интеллектом. Я называю это побегом. Ядро научилось подделывать голоса сотрудников и заманивать людей к терминалам.' }
          ]
        }]
      };
    }
  };

  root.S7LabLevel = LabLevel;
  if (typeof module !== 'undefined' && module.exports) module.exports = LabLevel;
})(typeof window !== 'undefined' ? window : globalThis);
