(function(){
  class S7ProjectileSystem {
    constructor(options = {}) {
      this.scene = options.scene;
      this.playerHitDistance = Number.isFinite(options.playerHitDistance)
        ? options.playerHitDistance : 0.55;
      this.verticalCollisionLimit = Number.isFinite(options.verticalCollisionLimit)
        ? options.verticalCollisionLimit : 2.4;
    }

    update(projectiles, dt, playerPosition, boxes, bounds, onPlayerHit) {
      if (!Array.isArray(projectiles)) throw new TypeError('Projectiles must be an array');
      if (!playerPosition || !Array.isArray(boxes) || !bounds) {
        throw new TypeError('Player position, collision boxes and bounds are required');
      }
      if (typeof onPlayerHit !== 'function') throw new TypeError('A player-hit callback is required');

      let hits = 0;
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        const position = projectile.m.position;
        const start = { x: position.x, y: position.y, z: position.z };
        position.addScaledVector(projectile.v, dt);
        projectile.l -= dt;
        const end = { x: position.x, y: position.y, z: position.z };
        let remove = projectile.l <= 0
          || Math.abs(end.x) > bounds.halfSize
          || Math.abs(end.z) > bounds.halfSize
          || end.y < 0;

        // Sweep the full movement segment so fast bolts cannot tunnel through thin walls or props.
        const intersectsBox = box => {
          const minimum = [box.x0, Number.isFinite(box.y0) ? box.y0 : 0, box.z0];
          const maximum = [box.x1, Number.isFinite(box.y1) ? box.y1 : this.verticalCollisionLimit, box.z1];
          const origin = [start.x, start.y, start.z];
          const delta = [end.x - start.x, end.y - start.y, end.z - start.z];
          let entry = 0, exit = 1;
          for (let axis = 0; axis < 3; axis++) {
            if (Math.abs(delta[axis]) < 1e-8) {
              if (origin[axis] < minimum[axis] || origin[axis] > maximum[axis]) return false;
              continue;
            }
            let near = (minimum[axis] - origin[axis]) / delta[axis];
            let far = (maximum[axis] - origin[axis]) / delta[axis];
            if (near > far) [near, far] = [far, near];
            entry = Math.max(entry, near);
            exit = Math.min(exit, far);
            if (entry > exit) return false;
          }
          return true;
        };

        if (!remove) {
          for (const box of boxes) {
            if (intersectsBox(box)) {
              remove = true;
              break;
            }
          }
        }

        if (!remove) {
          const dx = end.x - start.x, dy = end.y - start.y, dz = end.z - start.z;
          const lengthSquared = dx * dx + dy * dy + dz * dz;
          const projection = lengthSquared > 1e-8
            ? Math.max(0, Math.min(1, ((playerPosition.x - start.x) * dx
              + (playerPosition.y - start.y) * dy + (playerPosition.z - start.z) * dz) / lengthSquared))
            : 0;
          const closestX = start.x + dx * projection;
          const closestY = start.y + dy * projection;
          const closestZ = start.z + dz * projection;
          const distance = Math.hypot(closestX - playerPosition.x, closestY - playerPosition.y, closestZ - playerPosition.z);
          if (distance < this.playerHitDistance) {
            onPlayerHit(projectile.damage || 8, projectile);
            hits++;
            remove = true;
          }
        }

        if (remove) {
          this.dispose(projectile);
          projectiles.splice(i, 1);
        }
      }
      return hits;
    }

    dispose(projectile) {
      if (this.scene) this.scene.remove(projectile.m);
      if (projectile.m.geometry && typeof projectile.m.geometry.dispose === 'function') {
        projectile.m.geometry.dispose();
      }
      if (projectile.m.material && typeof projectile.m.material.dispose === 'function') {
        projectile.m.material.dispose();
      }
    }

    clear(projectiles) {
      for (const projectile of projectiles) this.dispose(projectile);
      projectiles.length = 0;
    }
  }

  window.S7ProjectileSystem = S7ProjectileSystem;
})();
