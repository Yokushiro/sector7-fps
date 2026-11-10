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
test('all four enemy archetypes have distinct combat profiles', () => {
  const profiles = DroneAI.PROFILES;
  assert.deepEqual(Object.keys(profiles).sort(), ['assault', 'heavy', 'scout', 'sniper']);
  assert.ok(profiles.assault.moveSpeed > profiles.scout.moveSpeed);
  assert.ok(profiles.heavy.hp > profiles.scout.hp);
  assert.ok(profiles.sniper.preferredDistance > profiles.heavy.preferredDistance);
  assert.ok(profiles.sniper.damage > profiles.scout.damage);
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
