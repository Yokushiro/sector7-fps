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
        const startX = position.x, startY = position.y, startZ = position.z;
        position.addScaledVector(projectile.v, dt);
        projectile.l -= dt;
        const endX = position.x, endY = position.y, endZ = position.z;
        const dx = endX - startX, dy = endY - startY, dz = endZ - startZ;
        let remove = false;

        // Sweep the full movement segment so fast bolts cannot tunnel through thin walls or props.
        for (const box of boxes) {
          if (this.segmentIntersectsBox(startX, startY, startZ, dx, dy, dz, box)) {
            remove = true;
            break;
          }
        }

        if (!remove) {
          const lengthSquared = dx * dx + dy * dy + dz * dz;
          const projection = lengthSquared > 1e-8
            ? Math.max(0, Math.min(1, ((playerPosition.x - startX) * dx
              + (playerPosition.y - startY) * dy + (playerPosition.z - startZ) * dz) / lengthSquared))
            : 0;
          const closestX = startX + dx * projection;
          const closestY = startY + dy * projection;
          const closestZ = startZ + dz * projection;
          const distance = Math.hypot(closestX - playerPosition.x, closestY - playerPosition.y, closestZ - playerPosition.z);
          if (distance < this.playerHitDistance) {
            onPlayerHit(projectile.damage || 8, projectile);
            hits++;
            remove = true;
          }
        }

        if (!remove && (projectile.l <= 0
          || Math.abs(endX) > bounds.halfSize
          || Math.abs(endZ) > bounds.halfSize
          || endY < 0)) remove = true;

        if (remove) {
          this.dispose(projectile);
          projectiles.splice(i, 1);
        }
      }
      return hits;
    }

    segmentIntersectsBox(startX, startY, startZ, dx, dy, dz, box) {
      let entry = 0, exit = 1;
      let origin = startX, delta = dx, min = box.x0, max = box.x1;
      if (Math.abs(delta) < 1e-8) {
        if (origin < min || origin > max) return false;
      } else {
        let near = (min - origin) / delta, far = (max - origin) / delta;
        if (near > far) { const swap = near; near = far; far = swap; }
        entry = Math.max(entry, near);
        exit = Math.min(exit, far);
        if (entry > exit) return false;
      }

      origin = startY; delta = dy;
      min = Number.isFinite(box.y0) ? box.y0 : 0;
      max = Number.isFinite(box.y1) ? box.y1 : this.verticalCollisionLimit;
      if (Math.abs(delta) < 1e-8) {
        if (origin < min || origin > max) return false;
      } else {
        let near = (min - origin) / delta, far = (max - origin) / delta;
        if (near > far) { const swap = near; near = far; far = swap; }
        entry = Math.max(entry, near);
        exit = Math.min(exit, far);
        if (entry > exit) return false;
      }

      origin = startZ; delta = dz; min = box.z0; max = box.z1;
      if (Math.abs(delta) < 1e-8) {
        if (origin < min || origin > max) return false;
      } else {
        let near = (min - origin) / delta, far = (max - origin) / delta;
        if (near > far) { const swap = near; near = far; far = swap; }
        entry = Math.max(entry, near);
        exit = Math.min(exit, far);
        if (entry > exit) return false;
      }
      return true;
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
