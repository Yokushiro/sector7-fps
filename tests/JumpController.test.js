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


test('jump can land on a low crate or platform instead of falling through to the floor', () => {
  const jump = new JumpController(1.7);
  const actor = { ...player(), pos: { x: 0, y: 1.7, z: 0 } };
  const platform = { x0: -.8, x1: .8, z0: -.8, z1: .8, topY: .65 };
  assert.equal(jump.jump(actor), true);
  let landed = false;
  for (let i = 0; i < 80 && !landed; i++) landed = jump.update(actor, .025, [platform]);
  assert.equal(landed, true);
  assert.ok(Math.abs(actor.pos.y - 2.35) < 1e-9);
  assert.equal(actor.grounded, true);
  assert.equal(actor.velocityY, 0);
});

test('jump ignores platforms outside the player footprint and lands on the floor', () => {
  const jump = new JumpController(1.7);
  const actor = { ...player(), pos: { x: 0, y: 1.7, z: 0 } };
  const platform = { x0: 3, x1: 4, z0: 3, z1: 4, topY: .65 };
  jump.jump(actor);
  for (let i = 0; i < 100; i++) jump.update(actor, .05, [platform]);
  assert.equal(actor.pos.y, 1.7);
  assert.equal(actor.grounded, true);
});
