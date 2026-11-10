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
