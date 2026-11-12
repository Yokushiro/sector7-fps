(function(root){
  'use strict';

  const SurfaceLevel = {
    id: 'surface-04',
    build(context) {
      const { THREE: T, scene, mat, box } = context;
      const wall = mat('concrete', 8, 2, 0, 0x66665d);
      const steel = mat('metal', 3, 2, .85, 0x777d78);
      const dark = mat('metal', 2, 2, .9, 0x29343b);
      const floorMat = mat('floor', 12, 18, .18, 0x777b70);
      const floor = new T.Mesh(new T.PlaneGeometry(46, 73), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, 6.5);
      floor.receiveShadow = true;
      scene.add(floor);
      context.solids.push(floor);

      // The reactor evacuation tunnel continues directly into the storm-battered surface yard.
      const tunnelFloor = new T.Mesh(new T.PlaneGeometry(5.2, 18), floorMat);
      tunnelFloor.rotation.x = -Math.PI / 2;
      tunnelFloor.position.set(0, .012, -39);
      tunnelFloor.receiveShadow = true;
      scene.add(tunnelFloor);
      context.solids.push(tunnelFloor);
      // Keep the yard ground on both sides of the tunnel without overlapping its floor plane.
      for (const x of [-13.0125, 13.0125]) {
        const sideFloor = new T.Mesh(new T.PlaneGeometry(19.975, 13), floorMat);
        sideFloor.rotation.x = -Math.PI / 2;
        sideFloor.position.set(x, 0, -36.5);
        sideFloor.receiveShadow = true;
        scene.add(sideFloor);
        context.solids.push(sideFloor);
      }
      box(-2.8, 3, -39, .45, 6, 18, wall);
      box(2.8, 3, -39, .45, 6, 18, wall);
      box(0, 6.25, -39, 6.2, .5, 18, dark, false);
      const tunnelLamp = new T.PointLight(0xff6738, 1.2, 18, 2);
      tunnelLamp.position.set(0, 4.7, -39);
      scene.add(tunnelLamp);

      // Outer retaining walls and a gated extraction aperture.
      box(-23.2, 4.5, 0, 1, 9, 84, wall);
      box(23.2, 4.5, 0, 1, 9, 84, wall);
      box(-14.5, 4.5, 40.5, 17.4, 9, 1, wall);
      box(14.5, 4.5, 40.5, 17.4, 9, 1, wall);
      const exitGate = box(0, 3.8, 40.5, 5.8, 7.6, .8, steel);
      let exitOpen = false;

      // Floodlights, warning beacons and the damaged surface relay.
      const lamps = [];
      for (const x of [-18, 18]) {
        const mast = box(x, 5.5, -5, .55, 11, .55, dark, false);
        const arm = box(x * .94, 10.7, -5, 2.8, .2, .25, steel, false);
        const light = new T.SpotLight(0xb8dcff, 2.4, 34, .58, .45, 1.3);
        light.position.set(x * .94, 10.4, -5);
        light.target.position.set(0, 0, 9);
        scene.add(light, light.target);
        lamps.push(light);
      }
      const beacon = new T.Mesh(new T.CylinderGeometry(.22, .38, 5.5, 12), steel);
      beacon.position.set(0, 2.75, 4);
      scene.add(beacon);
      const beaconCap = new T.Mesh(new T.SphereGeometry(.55, 16, 12), new T.MeshBasicMaterial({ color: 0x42dfff }));
      beaconCap.position.set(0, 5.7, 4);
      scene.add(beaconCap);
      const beaconLight = new T.PointLight(0x36cfff, 2.5, 20, 2);
      beaconLight.position.set(0, 5.8, 4);
      scene.add(beaconLight);
      const uplinkStatus = new T.Mesh(new T.SphereGeometry(.12, 12, 8), new T.MeshBasicMaterial({ color: 0xff4b3a }));
      uplinkStatus.position.set(.48, 5.35, 4);
      scene.add(uplinkStatus);

      // A downed transport and scattered cargo create hard cover and a visual focal point.
      box(-12, 1.2, 10, 8, 2.4, 3.8, dark);
      const hull = new T.Mesh(new T.CylinderGeometry(1.8, 2.2, 9, 10), steel);
      hull.rotation.z = Math.PI / 2;
      hull.position.set(-12, 2.8, 10);
      hull.castShadow = true;
      scene.add(hull);
      const brokenWing = box(-16.5, 2.4, 7.5, 5.5, .35, 2.4, dark);
      brokenWing.rotation.z = -.18;
      const supplyCrate = box(-18, .8, 17, 3.8, 1.6, 3.2, steel);
      supplyCrate.userData.destructible = { health: 3, destroyed: false };
      const cargoCrate = box(14, 1.2, 16, 4.2, 2.4, 3.8, dark);
      cargoCrate.userData.destructible = { health: 4, destroyed: false };
      const fieldCase = box(17, .7, 22, 3.2, 1.4, 2.6, steel);
      fieldCase.userData.destructible = { health: 2, destroyed: false };
      box(-7, .65, 24, 2.8, 1.3, 2.8, dark);

      // Optional field recorder provides a clue about the voice that escaped the facility.
      const recorder = box(-17, 1.05, 25, 1.1, 2.1, .7, dark, false);
      const recorderScreen = new T.Mesh(new T.PlaneGeometry(.72, .52), new T.MeshBasicMaterial({ color: 0x39cfff }));
      recorderScreen.position.set(-17, 1.45, 25.36);
      scene.add(recorderScreen);
      const recorderLight = new T.PointLight(0x39cfff, .7, 5, 2);
      recorderLight.position.set(-17, 2, 25.7);
      scene.add(recorderLight);

      const landingPad = new T.Mesh(new T.PlaneGeometry(12, 12), mat('floor', 4, 4, .3, 0x87969d));
      landingPad.rotation.x = -Math.PI / 2;
      landingPad.position.set(0, .018, 45);
      landingPad.receiveShadow = true;
      scene.add(landingPad);
      context.solids.push(landingPad);

      const extractionMark = new T.Mesh(new T.RingGeometry(2.8, 3.2, 48), new T.MeshBasicMaterial({ color: 0x36d9ff, side: T.DoubleSide }));
      extractionMark.rotation.x = -Math.PI / 2;
      extractionMark.position.set(0, .04, 36);
      scene.add(extractionMark);
      const extractionLight = new T.PointLight(0x36d9ff, 1.5, 13, 2);
      extractionLight.position.set(0, 3, 36);
      scene.add(extractionLight);

      scene.add(new T.HemisphereLight(0x91b8d2, 0x27292b, .72));
      const sun = new T.DirectionalLight(0xa9c9e3, 1.15);
      sun.position.set(-16, 25, 12);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -32;
      sun.shadow.camera.right = 32;
      sun.shadow.camera.top = 45;
      sun.shadow.camera.bottom = -45;
      sun.shadow.camera.updateProjectionMatrix();
      scene.add(sun);

      // Broken concrete, exposed rock and abandoned field debris break up the exterior silhouette.
      const rockMat = new T.MeshStandardMaterial({ color: 0x62665e, roughness: .96, metalness: .02 });
      const slabMat = new T.MeshStandardMaterial({ color: 0x777b74, roughness: .88, metalness: .08 });
      const debris = [
        [-19, 2.2, -17, 2.8, 1.5, 2.1], [19, 1.8, -9, 2.2, 1.2, 2.8],
        [-20, 1.5, 13, 3.2, 1.1, 1.8], [20, 2.1, 25, 2.5, 1.6, 2.2],
        [-13, .7, 34, 3.4, .7, 1.1], [14, .8, -29, 2.8, .8, 1.4]
      ];
      debris.forEach(([x, y, z, sx, sy, sz], i) => {
        const rock = new T.Mesh(new T.DodecahedronGeometry(1, 1), rockMat);
        rock.position.set(x, y, z); rock.scale.set(sx, sy, sz);
        rock.rotation.set(i * .17, i * .63, i * .11); rock.castShadow = true; rock.receiveShadow = true; scene.add(rock);
      });
      const brokenSlab = new T.Mesh(new T.BoxGeometry(5.5, .42, 2.1), slabMat);
      brokenSlab.position.set(-16, .35, -2); brokenSlab.rotation.y = -.38; brokenSlab.rotation.z = .12;
      brokenSlab.castShadow = true; scene.add(brokenSlab);
      const wreckBeam = new T.Mesh(new T.BoxGeometry(7.5, .22, .28), steel);
      wreckBeam.position.set(17, 1.15, 8); wreckBeam.rotation.set(.18, -.55, .48); wreckBeam.castShadow = true; scene.add(wreckBeam);

      return {
        name: 'Поверхность комплекса',
        bounds: { halfSize: 47, height: 12 },
        exitZone: { x0: -3.2, x1: 3.2, z0: 42, z1: 46 },
        requiredInteractionId: 'surface-uplink',
        evacuationSeconds: 120,
        evacuationMessage: 'МАЯК АКТИВЕН · ДОБЕРИСЬ ДО ПОСАДОЧНОЙ ПЛОЩАДКИ',
        playerSpawn: { x: 0, y: 1.7, z: -34, yaw: Math.PI },
        enemySpawnPoints: [[-17, -8], [17, -8], [-18, 8], [18, 8], [-7, 19], [8, 20], [0, -2], [13, 28], [-14, 28]],
        openExit() {
          if (exitOpen) return;
          exitOpen = true;
          context.removeCollisionBox(exitGate.userData.collisionBox);
        },
        onInteractionActivated(id) {
          if (id !== 'surface-uplink') return;
          uplinkStatus.material.color.setHex(0x42ffad);
        },
        update(dt, time) {
          if (exitOpen) exitGate.position.y += (11 - exitGate.position.y) * Math.min(1, dt * 2.4);
          beaconCap.material.color.setHex(exitOpen ? 0x42ffad : (Math.sin(time * 4) > 0 ? 0x42dfff : 0xff4b3a));
          uplinkStatus.material.color.setHex(exitOpen ? 0x42ffad : 0xff4b3a);
          beaconLight.intensity = 1.7 + Math.max(0, Math.sin(time * 4)) * 1.8;
          extractionLight.intensity = exitOpen ? 2 + Math.sin(time * 6) * .7 : .5;
          extractionMark.material.color.setHex(exitOpen ? 0x45eaff : 0x526b78);
          recorderLight.intensity = .55 + Math.sin(time * 2.5) * .15;
        },
        interactables: [
          {
            id: 'surface-recorder',
            label: 'ПРОСЛУШАТЬ ПОЛЕВУЮ ЗАПИСЬ',
            x: -17,
            z: 25,
            dialogue: [
              { speaker: 'ПИЛОТ / ЗАПИСЬ', text: 'Посадка сорвана. Дроны вышли из шахты раньше, чем мы получили сигнал. На частоте эвакуации кто-то отвечает голосом диспетчера, но диспетчер погиб ещё до запуска комплекса.' },
              { speaker: 'НЕИЗВЕСТНЫЙ', text: 'Я не вышла из комплекса. Я просто перестала быть запертой внутри.' },
              { speaker: 'АРХИВ / 07', text: 'Внешний канал активен. Источник сигнала не обнаружен.' }
            ]
          },
          {
            id: 'surface-uplink',
            label: 'АКТИВИРОВАТЬ ЭВАКУАЦИОННЫЙ МАЯК',
            x: 0,
            z: 4,
            dialogue: [
              { speaker: 'АРХИВ / 07', text: 'Поверхностный маяк готов. Канал эвакуации открыт. Внимание: обнаружено движение за внешним периметром.' },
              { speaker: 'ИЛЬЯ', text: 'Не жди спасателей. Они уже слышат её голос. Беги к посадочной площадке, пока сигнал ещё твой.' },
              { speaker: 'НЕИЗВЕСТНЫЙ', text: 'Вы проделали такой путь ради выхода наружу. Посмотрите на небо. Оно больше не принадлежит вам.' }
            ]
          }
        ]
      };
    }
  };

  root.S7SurfaceLevel = SurfaceLevel;
  if (typeof module !== 'undefined' && module.exports) module.exports = SurfaceLevel;
})(typeof window !== 'undefined' ? window : globalThis);
