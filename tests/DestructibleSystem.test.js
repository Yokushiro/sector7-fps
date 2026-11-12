const test = require('node:test');
const assert = require('node:assert/strict');
const DestructibleSystem = require('../src/combat/DestructibleSystem');

test('destructible props take multiple hits and break once', () => {
  const collisionBox = {};
  const boxes = [collisionBox];
  const levelBoxes = [collisionBox];
  const broken = [];
  const system = new DestructibleSystem({ collisionCollections: [boxes, levelBoxes], onBreak: (object, point) => broken.push({ object, point }) });
  const object = { visible: true, userData: { collisionBox, destructible: { health: 2, destroyed: false } } };
  const point = { x: 1, y: 2, z: 3 };
  assert.deepEqual(system.hit(object, point), { damaged: true, destroyed: false, remaining: 1 });
  assert.equal(object.visible, true);
  assert.deepEqual(system.hit(object, point), { damaged: true, destroyed: true, remaining: 0 });
  assert.equal(object.visible, false);
  assert.deepEqual(boxes, []);
  assert.deepEqual(levelBoxes, []);
  assert.equal(broken.length, 1);
  assert.equal(broken[0].point, point);
  assert.deepEqual(system.hit(object, point), { damaged: false, destroyed: false });
  assert.equal(broken.length, 1);
});

test('ordinary world geometry is unaffected by destructible damage', () => {
  const system = new DestructibleSystem();
  const wall = { visible: true, userData: {} };
  assert.deepEqual(system.hit(wall, null), { damaged: false, destroyed: false });
  assert.equal(wall.visible, true);
});


test('destroyed props are removed from every active collision collection', () => {
  const collisionBox = { id: 'cabinet' };
  const worldBoxes = [collisionBox];
  const levelBoxes = [collisionBox];
  const system = new DestructibleSystem({ collisionCollections: [worldBoxes, levelBoxes] });
  const cabinet = { visible: true, userData: { collisionBox, destructible: { health: 1, destroyed: false } } };
  assert.equal(system.hit(cabinet, null).destroyed, true);
  assert.equal(worldBoxes.includes(collisionBox), false);
  assert.equal(levelBoxes.includes(collisionBox), false);
});
