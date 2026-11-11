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


test('drones do not fire through solid level geometry', () => {
  const ai = new DroneAI();
  const enemy = makeEnemy('scout', 0, 5.5);
  enemy.cd = 0;
  const projectiles = [];
  const three = {
    Mesh: class { constructor() { this.position = { copy() {} }; } },
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
    Mesh: class { constructor() { this.position = { copy() {} }; } },
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
    Mesh: class { constructor() { this.position = { copy() {} }; } },
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
