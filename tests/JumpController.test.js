const test = require('node:test');
const assert = require('node:assert/strict');
const JumpController = require('../src/core/JumpController');

function player(y = 1.7) {
  return { pos: { y }, velocityY: 0, grounded: true };
}

test('jump starts once and prevents a second jump while airborne', () => {
  const jump = new JumpController(1.7);
  const actor = player();
  assert.equal(jump.jump(actor), true);
  assert.equal(actor.grounded, false);
  assert.equal(actor.velocityY, 6.6);
  assert.equal(jump.jump(actor), false);
});

test('jump rises, falls under gravity and lands exactly on the floor', () => {
  const jump = new JumpController(1.7);
  const actor = player();
  jump.jump(actor);
  jump.update(actor, .05);
  assert.ok(actor.pos.y > 1.7);
  assert.ok(actor.velocityY < 6.6);

  for (let i = 0; i < 100; i++) jump.update(actor, .05);
  assert.equal(actor.pos.y, 1.7);
  assert.equal(actor.velocityY, 0);
  assert.equal(actor.grounded, true);
});

test('jump controller clamps large frame deltas and ignores grounded updates', () => {
  const jump = new JumpController(1.7);
  const actor = player();
  assert.equal(jump.update(actor, .5), false);
  jump.jump(actor);
  jump.update(actor, .5);
  assert.ok(actor.pos.y > 1.7);
});
