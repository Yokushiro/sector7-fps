// Basic behavior checks for enemy movement and archetype tuning.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/ai/DroneAI.js', 'utf8');
const context = { window: {}, THREE: {} };
vm.runInNewContext(source, context);
const DroneAI = context.window.S7DroneAI;

function makeEnemy(type, speed, preferredDistance) {
  return {
    type,
    g: {
      position: { x: 10, y: 1.3, z: 0 },
      lookAt() {}
    },
    t: 0,
    cd: 10,
    moveSpeed: speed,
    preferredDistance,
    eye: { color: { setRGB() {} } },
    m: { emissive: { setRGB() {} } }
  };
}

// Enemy archetypes expose distinct combat roles and readable stat profiles.
test('all enemy archetypes and the Warden boss have distinct combat profiles', () => {
  const profiles = DroneAI.PROFILES;
  assert.deepEqual(Object.keys(profiles).sort(), ['assault', 'heavy', 'scout', 'sniper', 'warden']);
  assert.ok(profiles.assault.moveSpeed > profiles.scout.moveSpeed);
  assert.ok(profiles.heavy.hp > profiles.scout.hp);
  assert.ok(profiles.sniper.preferredDistance > profiles.heavy.preferredDistance);
  assert.ok(profiles.sniper.damage > profiles.scout.damage);
  assert.ok(profiles.warden.hp > profiles.heavy.hp * 2);
  assert.ok(profiles.warden.damage > profiles.heavy.damage);
});

test('enemy archetypes expose distinct movement signatures', () => {
  const p = DroneAI.PROFILES;
  assert.ok(p.scout.strafeFrequency > p.heavy.strafeFrequency);
  assert.ok(p.assault.approachMultiplier > p.sniper.approachMultiplier);
  assert.ok(p.sniper.retreatMultiplier > p.assault.retreatMultiplier);
  assert.ok(p.heavy.strafeAmplitude < p.scout.strafeAmplitude);
});

test('drone AI moves enemies toward the player', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 2.6, 5.5);
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2
  );
  assert.ok(enemy.g.position.x < 10);
});

test('scout drones advance faster than heavy drones', () => {
  const ai = new DroneAI();
  const scout = makeEnemy('scout', 2.65, 5.5);
  const heavy = makeEnemy('heavy', 1.65, 7);
  const update = enemy => ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2
  );
  update(scout);
  update(heavy);
  assert.ok(10 - scout.g.position.x > 10 - heavy.g.position.x);
});


test('drones can fire over low cover that does not cross the shot height', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 0, 5.5);
  enemy.cd = 0;
  const previousThree = context.THREE;
  context.THREE = makeAttackThree();
  const projectiles = [];
  ai.update(
    [enemy], { pos: { x: 0, y: 1.7, z: 0 } }, 0.1, () => {}, { add() {} },
    projectiles, () => {}, min => min,
    [{ x0: 4, x1: 6, y0: 0, y1: 0.8, z0: -1, z1: 1 }]
  );
  context.THREE = previousThree;
  assert.equal(projectiles.length, 1, 'a waist-high obstacle below the firing line should not block a shot');
});

test('drones still respect full-height cover', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 0, 5.5);
  enemy.cd = 0;
  const previousThree = context.THREE;
  context.THREE = makeAttackThree();
  const projectiles = [];
  ai.update(
    [enemy], { pos: { x: 0, y: 1.7, z: 0 } }, 0.1, () => {}, { add() {} },
    projectiles, () => {}, min => min,
    [{ x0: 4, x1: 6, y0: 0, y1: 2.5, z0: -1, z1: 1 }]
  );
  context.THREE = previousThree;
  assert.equal(projectiles.length, 0, 'a full-height wall should still block enemy fire');
});

test('drones do not fire through solid level geometry', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 0, 5.5);
  enemy.cd = 0;
  const projectiles = [];
  const three = {
    Mesh: class { constructor() { this.position = { copy() {} }; this.scale = { set() {} }; } },
    SphereGeometry: class {},
    MeshBasicMaterial: class {},
    Color: class {}
  };
  const previousThree = context.THREE;
  context.THREE = three;
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    projectiles,
    () => {},
    (min, max) => min,
    [{ x0: 4, x1: 6, z0: -1, z1: 1 }]
  );
  context.THREE = previousThree;
  assert.equal(projectiles.length, 0);
});

test('hovering drones ignore cover that is fully below their flight body', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 2, 5.5);
  enemy.g.position.x = 2.8;
  enemy.strafeFrequency = 0;
  const startZ = enemy.g.position.z;
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2,
    [{ x0: 3, x1: 4, y0: 0, y1: 0.6, z0: -1, z1: 1 }]
  );
  assert.equal(enemy.g.position.z, startZ,
    'low cover below the drone body should not create artificial lateral repulsion');
});

test('drones steer away from nearby obstacles', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 2, 5.5);
  enemy.g.position.x = 2.8;
  enemy.g.position.z = 0;
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2,
    [{ x0: 3, x1: 4, z0: -1, z1: 1 }]
  );
  assert.ok(enemy.g.position.x < 2.8);
  assert.ok(Math.abs(enemy.g.position.z) > 0);
});


test('drones flank around cover when their line of sight is blocked', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 2, 5.5);
  enemy.strafeSign = 1;
  const startZ = enemy.g.position.z;
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2,
    [{ x0: 4, x1: 6, z0: -1, z1: 1 }]
  );
  assert.notEqual(enemy.g.position.z, startZ);
});

test('drones can recover when spawned inside obstacle bounds', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 2, 5.5);
  enemy.g.position.x = 3.5;
  enemy.g.position.z = 0;
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2,
    [{ x0: 3, x1: 4, z0: -1, z1: 1 }]
  );
  assert.ok(enemy.g.position.x < 3.5);
});


test('drone eye lights retain their archetype colors', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('sniper', 1.25, 10);
  let color;
  enemy.eyeColor = 0x9a6bff;
  enemy.eye.color.setRGB = (red, green, blue) => { color = [red, green, blue]; };
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2
  );
  assert.ok(color[0] > 0.5 && color[0] < 0.7);
  assert.ok(color[1] > 0.3 && color[1] < 0.5);
  assert.ok(color[2] > 0.9);
});

test('Warden boss maintains a distinct heavy-pressure combat profile', () => {
  const profile = DroneAI.PROFILES.warden;
  assert.equal(profile.hp, 280);
  assert.equal(profile.moveSpeed, 1.65);
  assert.equal(profile.eyeColor, 0xff4fcb);
  assert.ok(profile.attackMin < profile.attackMax);
});

test('Warden enters a faster and more aggressive second phase at half health', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('warden', 1.65, 7.2);
  enemy.hp = 140;
  enemy.maxHp = 280;
  enemy.phase = 1;
  enemy.damage = 18;
  enemy.projectileSpeed = 15;
  enemy.spread = .14;
  enemy.attackMin = 1.25;
  enemy.attackMax = 1.8;
  enemy.eyeColor = 0xff4fcb;
  enemy.cd = 10;
  let phaseSound = 0;
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => { phaseSound++; },
    (min, max) => (min + max) / 2
  );
  assert.equal(enemy.phase, 2);
  assert.ok(enemy.moveSpeed > 1.65);
  assert.ok(enemy.damage > 18);
  assert.ok(enemy.projectileSpeed > 15);
  assert.equal(enemy.eyeColor, 0xff8de5);
  assert.equal(phaseSound, 1);
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => { phaseSound++; },
    (min, max) => (min + max) / 2
  );
  assert.equal(phaseSound, 1, 'phase transition must only trigger once');
});


test('nonlethal hits stagger drones and temporarily suppress their attacks', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 2.65, 5.5);
  enemy.hitStunRemaining = 0.2;
  enemy.cd = 0;
  const projectiles = [];
  const three = {
    Mesh: class { constructor() { this.position = { copy() {} }; this.scale = { set() {} }; } },
    SphereGeometry: class {},
    MeshBasicMaterial: class {},
    Color: class {}
  };
  const previousThree = context.THREE;
  context.THREE = three;
  const startX = enemy.g.position.x;
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    projectiles,
    () => {},
    (min, max) => min
  );
  context.THREE = previousThree;
  assert.ok(enemy.g.position.x < startX, 'staggered drone should still drift toward its target');
  assert.ok(startX - enemy.g.position.x < 0.1, 'stagger should heavily reduce movement');
  assert.equal(enemy.hitStunRemaining, 0.1);
  assert.equal(projectiles.length, 0, 'staggered drone must not fire');
});



test('hit reaction velocity knocks drones away and decays smoothly', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 0, 5.5);
  enemy.hitReactionVelocity = { x: 4, z: 0 };
  const startX = enemy.g.position.x;
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2
  );
  assert.ok(enemy.g.position.x > startX, 'impact impulse should push the drone away from the player');
  assert.ok(enemy.hitReactionVelocity.x > 0 && enemy.hitReactionVelocity.x < 4,
    'impact velocity should decay instead of persisting');
});

test('sniper drones retreat when the player breaches their preferred range', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('sniper', 1.25, 10);
  enemy.g.position.x = 3;
  enemy.t = -0.1;
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2
  );
  assert.ok(enemy.g.position.x > 3, 'sniper should create distance instead of pushing into close range');
});

test('drones reverse their strafe direction after firing to avoid static attack lanes', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 2.65, 5.5);
  enemy.cd = 0;
  enemy.strafeSign = 1;
  class Vector3 {
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    sub(other) { this.x -= other.x; this.y -= other.y; this.z -= other.z; return this; }
    normalize() { const n = Math.hypot(this.x, this.y, this.z) || 1; this.x /= n; this.y /= n; this.z /= n; return this; }
    multiplyScalar(n) { this.x *= n; this.y *= n; this.z *= n; return this; }
  }
  const three = {
    Mesh: class { constructor() { this.position = { copy() {} }; this.scale = { set() {} }; } },
    SphereGeometry: class {},
    MeshBasicMaterial: class {},
    Color: class {},
    Vector3
  };
  const previousThree = context.THREE;
  context.THREE = three;
  const projectiles = [];
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    projectiles,
    () => {},
    (min, max) => min
  );
  context.THREE = previousThree;
  assert.equal(projectiles.length, 1);
  assert.equal(enemy.strafeSign, -1);
});


function makeAttackThree() {
  class Vector3 {
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    sub(other) { this.x -= other.x; this.y -= other.y; this.z -= other.z; return this; }
    normalize() { const n = Math.hypot(this.x, this.y, this.z) || 1; this.x /= n; this.y /= n; this.z /= n; return this; }
    multiplyScalar(n) { this.x *= n; this.y *= n; this.z *= n; return this; }
  }
  return {
    Vector3,
    Mesh: class { constructor() { this.position = { copy(other) { Object.assign(this, other); } }; this.scale = { set() {} }; } },
    SphereGeometry: class {},
    MeshBasicMaterial: class {},
    Color: class {}
  };
}

test('heavy drones telegraph a charged three-projectile volley', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('heavy', 0, 6.8);
  enemy.cd = 0;
  enemy.projectileSpeed = 10;
  enemy.damage = 14;
  const previousThree = context.THREE;
  context.THREE = makeAttackThree();
  const projectiles = [];
  const args = [ [enemy], { pos: { x: 0, y: 1.7, z: 0 } }, 0.2, () => {}, { add() {} }, projectiles, () => {}, (min) => min ];
  ai.update(...args);
  assert.equal(projectiles.length, 0, 'heavy attack must have a readable charge window');
  assert.ok(enemy.attackWindupRemaining > 0);
  ai.update([enemy], args[1], 0.6, args[3], args[4], projectiles, args[6], args[7]);
  context.THREE = previousThree;
  assert.equal(projectiles.length, 3);
  assert.ok(projectiles[0].damage < enemy.damage);
  assert.ok(projectiles[1].v.x !== projectiles[2].v.x || projectiles[1].v.z !== projectiles[2].v.z);
});

test('sniper waits through a longer lock-on before firing one precise bolt', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('sniper', 0, 10);
  enemy.cd = 0;
  enemy.projectileSpeed = 19;
  enemy.damage = 16;
  const previousThree = context.THREE;
  context.THREE = makeAttackThree();
  const projectiles = [];
  const player = { pos: { x: 0, y: 1.7, z: 0 } };
  ai.update([enemy], player, 0.5, () => {}, { add() {} }, projectiles, () => {}, min => min);
  assert.equal(projectiles.length, 0);
  ai.update([enemy], player, 0.6, () => {}, { add() {} }, projectiles, () => {}, min => min);
  context.THREE = previousThree;
  assert.equal(projectiles.length, 1);
  assert.ok(projectiles[0].v.length === undefined, 'velocity remains a vector-like object');
  assert.ok(projectiles[0].damage > enemy.damage);
});

test('Warden phase two launches a wider five-shot fan', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('warden', 0, 7.2);
  Object.assign(enemy, {
    hp: 100, maxHp: 280, phase: 2, damage: 20,
    projectileSpeed: 15, spread: 0.14, attackMin: 1.25, attackMax: 1.8,
    eyeColor: 0xff8de5, cd: 0
  });
  const previousThree = context.THREE;
  context.THREE = makeAttackThree();
  const projectiles = [];
  ai.update([enemy], { pos: { x: 0, y: 1.7, z: 0 } }, 0.5, () => {}, { add() {} }, projectiles, () => {}, min => min);
  context.THREE = previousThree;
  assert.equal(projectiles.length, 5);
});


test('surviving drones break the firing lane with archetype evasive movement', () => {
  const ai = new DroneAI();
  const scout = makeEnemy('scout', 2.65, 5.5);
  scout.hitStunRemaining = 0;
  scout.evasionRemaining = 0.4;
  scout.evasionVelocity = { x: 5, z: 0 };
  const startX = scout.g.position.x;
  ai.update(
    [scout],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2
  );
  assert.ok(scout.g.position.x > startX, 'strong scout evade should break its forward firing lane');
  assert.ok(scout.evasionRemaining < 0.4, 'evasion window should count down');
});


test('Warden phase transition visibly recolors and surges its reactor and ring', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('warden', 1.65, 7.2);
  let ringColor = 0, coreColor = 0, ringScale = 0, coreScale = 0;
  let haloVisible = false, haloOpacity = 0, haloScale = 0;
  enemy.hp = 140;
  enemy.maxHp = 280;
  enemy.phase = 1;
  enemy.damage = 18;
  enemy.projectileSpeed = 15;
  enemy.spread = .14;
  enemy.attackMin = 1.25;
  enemy.attackMax = 1.8;
  enemy.visual = {
    ring: {
      rotation: { z: 0 },
      scale: { setScalar(value) { ringScale = value; } },
      material: { color: { setHex(value) { ringColor = value; } } }
    },
    core: {
      rotation: { y: 0 },
      scale: { setScalar(value) { coreScale = value; } },
      material: { color: { setHex(value) { coreColor = value; } } }
    },
    phaseHalo: {
      visible: false,
      rotation: { z: 0 },
      scale: { setScalar(value) { haloScale = value; } },
      material: { opacity: 0 }
    }
  };
  Object.defineProperty(enemy.visual.phaseHalo, 'visible', {
    get() { return haloVisible; },
    set(value) { haloVisible = value; }
  });
  Object.defineProperty(enemy.visual.phaseHalo.material, 'opacity', {
    get() { return haloOpacity; },
    set(value) { haloOpacity = value; }
  });
  ai.update(
    [enemy],
    { pos: { x: 0, y: 1.7, z: 0 } },
    0.1,
    () => {},
    { add() {} },
    [],
    () => {},
    (min, max) => (min + max) / 2
  );
  assert.equal(ringColor, 0xff58d4);
  assert.equal(coreColor, 0xff58d4);
  assert.ok(ringScale > 1);
  assert.ok(coreScale > 1);
  assert.ok(enemy.phaseTransitionRemaining > 0);
  assert.equal(haloVisible, true);
  assert.ok(haloOpacity > 0);
  assert.ok(haloScale > 0.35);
});


test('Warden marks the targeted ground lane during its charged volley and clears on launch', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('warden', 0, 7.2);
  Object.assign(enemy, {
    cd: 0, phase: 1, damage: 18, projectileSpeed: 15,
    attackMin: 1.25, attackMax: 1.8
  });
  const marker = {
    visible: false,
    position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
    scale: { value: 1, setScalar(value) { this.value = value; } },
    rotation: { z: 0 },
    material: { opacity: 0, color: { value: 0, setHex(value) { this.value = value; } } }
  };
  enemy.visual = { attackMarker: marker };
  const previousThree = context.THREE;
  context.THREE = makeAttackThree();
  const projectiles = [];
  const player = { pos: { x: 0, y: 1.7, z: 0 } };
  ai.update([enemy], player, 0.1, () => {}, { add() {} }, projectiles, () => {}, min => min);
  assert.equal(marker.visible, true);
  assert.ok(marker.position.z < 0, 'warning ring should appear along the line toward the player');
  assert.ok(marker.material.opacity > 0);
  assert.equal(marker.material.color.value, 0x55dfff);
  ai.update([enemy], player, 0.6, () => {}, { add() {} }, projectiles, () => {}, min => min);
  context.THREE = previousThree;
  assert.equal(projectiles.length, 2);
  assert.equal(marker.visible, false, 'warning ring should disappear as the volley launches');
  assert.equal(marker.material.opacity, 0);
});


test('localized impact flash expands and fades after a hit', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 0, 5.5);
  const flash = {
    visible: true,
    scale: { value: 0, setScalar(value) { this.value = value; } },
    material: { opacity: 1 }
  };
  enemy.visual = { hitFlash: flash };
  enemy.hitFlashRemaining = 0.2;
  ai.update([enemy], { pos: { x: 0, y: 1.7, z: 0 } }, 0.1,
    () => {}, { add() {} }, [], () => {}, (min, max) => min);
  assert.equal(flash.visible, true);
  assert.ok(flash.material.opacity > 0 && flash.material.opacity < 1);
  assert.ok(flash.scale.value > 0.3, 'impact shard should expand as it fades');
  ai.update([enemy], { pos: { x: 0, y: 1.7, z: 0 } }, 0.2,
    () => {}, { add() {} }, [], () => {}, (min, max) => min);
  assert.equal(flash.visible, false);
  assert.equal(flash.material.opacity, 0);
});
