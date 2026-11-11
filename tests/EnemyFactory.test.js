const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('src/ai/EnemyFactory.js', 'utf8'), context);
const EnemyFactory = context.window.S7EnemyFactory;
const profile = {
  hp: 120, moveSpeed: 1.5, preferredDistance: 6.8,
  projectileSpeed: 10, damage: 14, spread: .2,
  attackMin: 1.9, attackMax: 2.7, eyeColor: 0xff3322
};

test('factory creates an isolated combatant with profile stats and randomized combat state', () => {
  const enemy = EnemyFactory.createCombatant('heavy', profile, (min, max) => min);
  assert.equal(enemy.type, 'heavy');
  assert.equal(enemy.hp, 120);
  assert.equal(enemy.maxHp, 120);
  assert.equal(enemy.moveSpeed, 1.5);
  assert.equal(enemy.damage, 14);
  assert.equal(enemy.strafeSign, -1);
  assert.equal(enemy.flankOffset, 2.8);
  assert.equal(enemy.phase, 1);
  assert.equal(enemy.cd, 1.9);
});

test('factory applies a safe scout fallback for unknown flank archetypes', () => {
  const enemy = EnemyFactory.createCombatant('unknown', profile, (min, max) => max);
  assert.equal(enemy.flankOffset, 4.2);
  assert.equal(enemy.strafeSign, 1);
  assert.equal(enemy.t, 9);
  assert.equal(enemy.cd, 2.7);
});

test('factory rejects incomplete profiles and missing random source', () => {
  assert.throws(() => EnemyFactory.createCombatant('scout', {}, () => 0), /valid enemy profile/);
  assert.throws(() => EnemyFactory.createCombatant('scout', profile), /random range function/);
});
