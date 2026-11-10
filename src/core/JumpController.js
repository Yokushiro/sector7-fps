(function(root){
  'use strict';

  class S7JumpController {
    constructor(groundY, jumpSpeed = 6.6, gravity = 19) {
      this.groundY = Number.isFinite(groundY) ? groundY : 1.7;
      this.jumpSpeed = jumpSpeed;
      this.gravity = gravity;
    }

    jump(player) {
      if (!player || !player.grounded) return false;
      player.velocityY = this.jumpSpeed;
      player.grounded = false;
      return true;
    }

    update(player, deltaTime) {
      if (!player || player.grounded) return false;
      const dt = Math.max(0, Math.min(.05, Number(deltaTime) || 0));
      player.velocityY -= this.gravity * dt;
      player.pos.y += player.velocityY * dt;
      if (player.pos.y <= this.groundY) {
        player.pos.y = this.groundY;
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
