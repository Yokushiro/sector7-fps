(function(){
  const FLANK_OFFSETS = Object.freeze({
    warden: 2.2, sniper: 5.5, heavy: 2.8, assault: 3.2, scout: 4.2
  });

  class S7EnemyFactory {
    static createCombatant(type, profile, randomRange) {
      if (!profile || !Number.isFinite(profile.hp) || !Number.isFinite(profile.moveSpeed)) {
        throw new TypeError('A valid enemy profile is required');
      }
      if (typeof randomRange !== 'function') {
        throw new TypeError('A random range function is required');
      }
      return {
        type,
        hp: profile.hp,
        maxHp: profile.hp,
        moveSpeed: profile.moveSpeed,
        preferredDistance: profile.preferredDistance,
        projectileSpeed: profile.projectileSpeed,
        damage: profile.damage,
        spread: profile.spread,
        attackMin: profile.attackMin,
        attackMax: profile.attackMax,
        strafeSign: randomRange(0, 1) < .5 ? -1 : 1,
        flankOffset: FLANK_OFFSETS[type] || FLANK_OFFSETS.scout,
        t: randomRange(0, 9),
        cd: randomRange(profile.attackMin, profile.attackMax),
        phase: 1,
        eyeColor: profile.eyeColor,
        flash: 0
      };
    }
  }

  window.S7EnemyFactory = S7EnemyFactory;
})();
