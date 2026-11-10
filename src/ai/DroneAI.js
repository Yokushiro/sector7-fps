(function(){
  class S7DroneAI {
    update(enemies, player, dt, collide, scene, projectiles, sound, randomRange) {
      for (const enemy of enemies) {
        const group = enemy.g;
        enemy.t += dt;
        const dx = player.pos.x - group.position.x;
        const dz = player.pos.z - group.position.z;
        const distance = Math.hypot(dx, dz) || 1;
        const strafing = distance < 8 ? 1 : 0;
        const moveX = dx / distance * (distance > 6 ? 2.4 : -0.6)
          + (-dz / distance) * strafing * Math.sin(enemy.t * 0.7) * 2.2;
        const moveZ = dz / distance * (distance > 6 ? 2.4 : -0.6)
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
          enemy.cd = randomRange(1.4, 2.4);
          const projectile = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 10, 8),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 2.2, 0.4) })
          );
          projectile.position.copy(group.position);
          const velocity = new THREE.Vector3(
            player.pos.x + randomRange(-0.5, 0.5),
            1.2 + randomRange(-0.3, 0.3),
            player.pos.z + randomRange(-0.5, 0.5)
          ).sub(group.position).normalize().multiplyScalar(13);
          scene.add(projectile);
          projectiles.push({ m: projectile, v: velocity, l: 3 });
          sound(500, 0.12, 'square', 0.08);
        }
      }
    }
  }

  window.S7DroneAI = S7DroneAI;
})();
