(function(){
  class S7DroneAI {
    update(enemies, player, dt, collide, scene, projectiles, sound, randomRange, obstacles = []) {
      const hasLineOfSight = (from, to) => {
        const dx = to.x - from.x, dz = to.z - from.z;
        for (const box of obstacles) {
          let tMin = 0, tMax = 1;
          for (const [origin, delta, min, max] of [
            [from.x, dx, box.x0, box.x1],
            [from.z, dz, box.z0, box.z1]
          ]) {
            if (Math.abs(delta) < 1e-8) {
              if (origin < min || origin > max) { tMin = 2; break; }
            } else {
              let t1 = (min - origin) / delta, t2 = (max - origin) / delta;
              if (t1 > t2) [t1, t2] = [t2, t1];
              tMin = Math.max(tMin, t1);
              tMax = Math.min(tMax, t2);
            }
          }
          if (tMin <= tMax && tMin > 0.04 && tMin < 0.96) return false;
        }
        return true;
      };
      for (const enemy of enemies) {
        const group = enemy.g;
        enemy.t += dt;
        const dx = player.pos.x - group.position.x;
        const dz = player.pos.z - group.position.z;
        const distance = Math.hypot(dx, dz) || 1;
        const preferredDistance = enemy.preferredDistance || 6;
        const visible = hasLineOfSight(group.position, player.pos);
        const strafeSign = enemy.strafeSign || 1;
        let moveX, moveZ;

        if (!visible) {
          // When cover blocks the shot, move toward a point offset around its edge.
          const flankOffset = enemy.flankOffset || 3.8;
          const flankX = player.pos.x - (dz / distance) * flankOffset * strafeSign;
          const flankZ = player.pos.z + (dx / distance) * flankOffset * strafeSign;
          const flankDx = flankX - group.position.x;
          const flankDz = flankZ - group.position.z;
          const flankDistance = Math.hypot(flankDx, flankDz) || 1;
          const speed = enemy.moveSpeed || 2.4;
          moveX = flankDx / flankDistance * speed;
          moveZ = flankDz / flankDistance * speed;
        } else {
          const strafing = distance < preferredDistance + 2 ? 1 : 0;
          const lateral = strafeSign * strafing * Math.sin(enemy.t * 0.7) * 2.2;
          const forward = distance > preferredDistance ? (enemy.moveSpeed || 2.4) : -0.6;
          moveX = dx / distance * forward - (dz / distance) * lateral;
          moveZ = dz / distance * forward + (dx / distance) * lateral;
        }

        // Repel from nearby cover. If a drone is already inside an AABB,
        // choose its nearest face so it can recover instead of remaining stuck.
        for (const box of obstacles) {
          const inside = group.position.x >= box.x0 && group.position.x <= box.x1
            && group.position.z >= box.z0 && group.position.z <= box.z1;
          let awayX = group.position.x - Math.max(box.x0, Math.min(box.x1, group.position.x));
          let awayZ = group.position.z - Math.max(box.z0, Math.min(box.z1, group.position.z));
          let awayDistance = Math.hypot(awayX, awayZ);
          if (inside) {
            const faces = [
              { distance: group.position.x - box.x0, x: -1, z: 0 },
              { distance: box.x1 - group.position.x, x: 1, z: 0 },
              { distance: group.position.z - box.z0, x: 0, z: -1 },
              { distance: box.z1 - group.position.z, x: 0, z: 1 }
            ].sort((a, b) => a.distance - b.distance);
            awayX = faces[0].x;
            awayZ = faces[0].z;
            awayDistance = 0;
          }
          if ((inside || awayDistance < 1.35) && (awayDistance > 0.001 || inside)) {
            const strength = inside ? 5 : (1.35 - awayDistance) * 3.2;
            const normalizer = inside ? 1 : awayDistance;
            moveX += awayX / normalizer * strength;
            moveZ += awayZ / normalizer * strength;
          }
        }

        group.position.x += moveX * dt;
        group.position.z += moveZ * dt;
        group.position.y = 1.3 + Math.sin(enemy.t * 2) * 0.12;
        collide(group.position, 0.5);
        group.lookAt(player.pos.x, group.position.y, player.pos.z);

        if (enemy.flash > 0) {
          enemy.flash -= dt;
          if (enemy.flash <= 0) enemy.m.emissive.setRGB(0, 0, 0);
        }

        enemy.cd -= dt;
        const eyeColor = enemy.eyeColor || 0xff3928;
        const eyePulse = enemy.cd < 0.4 ? 1.8 : 1;
        enemy.eye.color.setRGB(
          ((eyeColor >> 16) & 255) / 255 * eyePulse,
          ((eyeColor >> 8) & 255) / 255 * eyePulse,
          (eyeColor & 255) / 255 * eyePulse
        );
        if (enemy.cd <= 0 && distance < 20 && hasLineOfSight(group.position, player.pos)) {
          enemy.cd = randomRange(enemy.attackMin || 1.4, enemy.attackMax || 2.4);
          const projectile = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 10, 8),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 2.2, 0.4) })
          );
          projectile.position.copy(group.position);
          const velocity = new THREE.Vector3(
            player.pos.x + randomRange(-(enemy.spread || 0.5), enemy.spread || 0.5),
            1.2 + randomRange(-0.3, 0.3),
            player.pos.z + randomRange(-0.5, 0.5)
          ).sub(group.position).normalize().multiplyScalar(enemy.projectileSpeed || 13);
          scene.add(projectile);
          projectiles.push({ m: projectile, v: velocity, l: 3, damage: enemy.damage || 8 });
          sound(500, 0.12, 'square', 0.08);
        }
      }
    }
  }


  S7DroneAI.PROFILES = Object.freeze({
    scout: Object.freeze({
      hp: 60, moveSpeed: 2.65, preferredDistance: 5.5,
      projectileSpeed: 14, damage: 6, spread: 0.42,
      attackMin: 1.2, attackMax: 1.9,
      bodyColor: 0x2b3037, eyeColor: 0xff3928, ringColor: 0x35bfff
    }),
    assault: Object.freeze({
      hp: 72, moveSpeed: 3.35, preferredDistance: 3.8,
      projectileSpeed: 13, damage: 8, spread: 0.34,
      attackMin: 0.95, attackMax: 1.45,
      bodyColor: 0x49332d, eyeColor: 0xff5a18, ringColor: 0xff6a28
    }),
    heavy: Object.freeze({
      hp: 120, moveSpeed: 1.5, preferredDistance: 6.8,
      projectileSpeed: 10, damage: 14, spread: 0.2,
      attackMin: 1.9, attackMax: 2.7,
      bodyColor: 0x3b424b, eyeColor: 0xff3322, ringColor: 0xffa23a
    }),
    sniper: Object.freeze({
      hp: 75, moveSpeed: 1.25, preferredDistance: 10,
      projectileSpeed: 19, damage: 16, spread: 0.07,
      attackMin: 2.2, attackMax: 3.1,
      bodyColor: 0x292c48, eyeColor: 0x9a6bff, ringColor: 0x9675ff
    })
  });

  window.S7DroneAI = S7DroneAI;
})();
