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
        projectile.m.position.addScaledVector(projectile.v, dt);
        projectile.l -= dt;
        const position = projectile.m.position;
        const distance = position.distanceTo(playerPosition);
        let remove = projectile.l <= 0
          || Math.abs(position.x) > bounds.halfSize
          || Math.abs(position.z) > bounds.halfSize
          || position.y < 0;

        if (!remove) {
          for (const box of boxes) {
            if (position.y < this.verticalCollisionLimit
              && position.x > box.x0 && position.x < box.x1
              && position.z > box.z0 && position.z < box.z1) {
              remove = true;
              break;
            }
          }
        }

        if (!remove && distance < this.playerHitDistance) {
          onPlayerHit(projectile.damage || 8, projectile);
          hits++;
          remove = true;
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
