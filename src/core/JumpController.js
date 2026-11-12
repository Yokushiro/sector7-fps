(function(root){
  'use strict';

  class S7JumpController {
    constructor(groundY, jumpSpeed = 6.6, gravity = 19) {
      this.groundY = Number.isFinite(groundY) ? groundY : 1.7;
      this.jumpSpeed = jumpSpeed;
      this.gravity = gravity;
      this.playerRadius = .4;
    }

    jump(player) {
      if (!player || !player.grounded) return false;
      player.velocityY = this.jumpSpeed;
      player.grounded = false;
      return true;
    }

    isSupported(player, platforms = []) {
      const platform = player && player.groundedPlatform;
      if (!platform) return true;
      if (!Array.isArray(platforms) || !platforms.includes(platform)) return false;
      return player.pos.x + this.playerRadius > platform.x0
        && player.pos.x - this.playerRadius < platform.x1
        && player.pos.z + this.playerRadius > platform.z0
        && player.pos.z - this.playerRadius < platform.z1;
    }

    update(player, deltaTime, platforms = []) {
      if (!player || player.grounded) return false;
      const dt = Math.max(0, Math.min(.05, Number(deltaTime) || 0));
      const previousY = player.pos.y;
      player.velocityY -= this.gravity * dt;
      player.pos.y += player.velocityY * dt;
      if (player.velocityY <= 0) {
        const previousFeet = previousY - this.groundY;
        const currentFeet = player.pos.y - this.groundY;
        for (const platform of platforms) {
          if (!Number.isFinite(platform.topY) || platform.topY <= 0) continue;
          const overlapsX = player.pos.x + this.playerRadius > platform.x0
            && player.pos.x - this.playerRadius < platform.x1;
          const overlapsZ = player.pos.z + this.playerRadius > platform.z0
            && player.pos.z - this.playerRadius < platform.z1;
          if (!overlapsX || !overlapsZ) continue;
          if (previousFeet >= platform.topY - .06 && currentFeet <= platform.topY) {
            player.groundedHeight = this.groundY + platform.topY;
            player.pos.y = player.groundedHeight;
            player.groundedPlatform = platform;
            player.velocityY = 0;
            player.grounded = true;
            return true;
          }
        }
      }
      if (player.pos.y <= this.groundY) {
        player.pos.y = this.groundY;
        player.groundedHeight = this.groundY;
        player.groundedPlatform = null;
        player.velocityY = 0;
        player.grounded = true;
        return true;
      }
      return false;
    }
  }

  root.S7JumpController = S7JumpController;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7JumpController;
})(typeof window !== 'undefined' ? window : globalThis);
