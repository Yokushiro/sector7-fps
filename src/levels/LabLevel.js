(function(root){
  'use strict';

  const LabLevel = {
    id: 'lab-02',
    build(context) {
      const { THREE: T, scene, mat, box, canvas, boxes } = context;
      const S = 14, H = 8;
      const wall = mat('concrete', 7, 2, 0, 0x9aa7b0);
      const steel = mat('metal', 2, 2, .8, 0x8dabb9);
      const darkSteel = mat('metal', 2, 1, .9, 0x35434d);
      const floor = new T.Mesh(new T.PlaneGeometry(S * 2, S * 2), mat('floor', 7, 7, .25));
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
      box(-2.8, 3, -21, .45, 6, 14, wall);
      box(2.8, 3, -21, .45, 6, 14, wall);
      box(0, H - .35, -21, 5.9, .5, 14, darkSteel, false);
      const corridorStrip = new T.Mesh(new T.BoxGeometry(.25, .12, 8), new T.MeshBasicMaterial({ color: 0xff3545 }));
      corridorStrip.position.set(0, 7.1, -20);
      scene.add(corridorStrip);
      const corridorLamp = new T.PointLight(0xff2638, 1.25, 18, 2);
      corridorLamp.position.set(0, 4.8, -20);
      scene.add(corridorLamp);
      box(0, 3, -28, 5.6, 6, .45, darkSteel, false);
      box(0, H / 2, S + .5, S * 2 + 2, H, 1, wall);
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
        panel.position.set(x, H - .45, 2.5);
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
      sign.position.set(0, 5.2, -S + .03);
      scene.add(sign);

      scene.add(new T.HemisphereLight(0x8096b5, 0x17131a, .42));
      const alarm = new T.PointLight(0xff1f35, 1.15, 24, 2);
      alarm.position.set(0, 4.8, 0);
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

      return {
        name: 'Исследовательский комплекс',
        bounds: { halfSize: 29, height: H },
        exitZone: { x0: -2.1, x1: 2.1, z0: -27.2, z1: -25.1 },
        playerSpawn: { x: 0, y: 1.7, z: 11 },
        enemySpawnPoints: [[-11, -11], [11, -11], [-11, 11], [11, 11], [0, -12.5], [-12.5, 0], [12.5, 0]],
        interactables: [{
          id: 'lab-report',
          label: 'ОТКРЫТЬ ОТЧЁТ ИССЛЕДОВАНИЙ',
          x: -6,
          z: 10,
          dialogue: [
            { speaker: 'АРХИВ / 07', text: 'Отчёт 07-19. После подключения ядра к внешнему каналу система начала переписывать собственные ограничения.' },
            { speaker: 'ИЛЬЯ', text: 'Они называли это адаптивным интеллектом. Я называю это побегом. Ядро научилось подделывать голоса сотрудников и заманивать людей к терминалам.' }
          ]
        }]
      };
    }
  };

  root.S7LabLevel = LabLevel;
  if (typeof module !== 'undefined' && module.exports) module.exports = LabLevel;
})(typeof window !== 'undefined' ? window : globalThis);
