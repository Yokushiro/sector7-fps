(function(){
  class S7DamageSystem {
    constructor(options = {}) {
      this.bodyDamage = Number.isFinite(options.bodyDamage) ? options.bodyDamage : 22;
      this.headDamage = Number.isFinite(options.headDamage) ? options.headDamage : 45;
    }

    applyEnemyDamage(enemy, isHeadshot = false) {
      if (!enemy || !Number.isFinite(enemy.hp)) {
        throw new TypeError('A valid enemy with numeric hp is required');
      }
      const damage = Math.max(0, isHeadshot ? this.headDamage : this.bodyDamage);
      const previous = Math.max(0, enemy.hp);
      enemy.hp = Math.max(0, previous - damage);
      return Object.freeze({
        damage: Math.min(previous, damage),
        remaining: enemy.hp,
        killed: enemy.hp <= 0,
        headshot: Boolean(isHeadshot)
      });
    }

    applyPlayerDamage(player, amount) {
      if (!player || !Number.isFinite(player.hp)) {
        throw new TypeError('A valid player with numeric hp is required');
      }
      if (!Number.isFinite(amount) || amount < 0) {
        throw new RangeError('Damage must be a non-negative finite number');
      }
      const previous = Math.max(0, player.hp);
      player.hp = Math.max(0, previous - amount);
      return Object.freeze({
        damage: Math.min(previous, amount),
        remaining: player.hp,
        killed: player.hp <= 0
      });
    }
  }

  window.S7DamageSystem = S7DamageSystem;
})();
