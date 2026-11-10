(function(){
  class S7DroneAI {
    update(enemies, player, dt, collide, scene, projectiles, sound, randomRange) {
      for (const enemy of enemies) {
        const group = enemy.g;
        enemy.t += dt;
        const dx = player.pos.x - group.position.x;
        const dz = player.pos.z - group.position.z;
        const distance = Math.hypot(dx, dz) || 1;
        const preferredDistance = enemy.preferredDistance || 6;
        const strafing = distance < preferredDistance + 2 ? 1 : 0;
        const moveX = dx / distance * (distance > preferredDistance ? (enemy.moveSpeed || 2.4) : -0.6)
          + (-dz / distance) * strafing * Math.sin(enemy.t * 0.7) * 2.2;
        const moveZ = dz / distance * (distance > preferredDistance ? (enemy.moveSpeed || 2.4) : -0.6)
          + (dx / distance) * strafing * Math.sin(enemy.t * 0.7) * 2.2;

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
        enemy.eye.color.setRGB(3 + Math.sin(enemy.t * 8), 0.2 + (enemy.cd < 0.4 ? 2 : 0), 0.1);
        if (enemy.cd <= 0 && distance < 20) {
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
