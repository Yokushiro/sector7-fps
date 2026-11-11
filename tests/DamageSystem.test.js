const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('src/combat/DamageSystem.js', 'utf8'), context);
const DamageSystem = context.window.S7DamageSystem;

test('body and head hits preserve the established weapon damage values', () => {
  const damage = new DamageSystem();
  const enemy = { hp: 100 };
  const bodyHit = damage.applyEnemyDamage(enemy, false);
  assert.equal(bodyHit.damage, 22);
  assert.equal(bodyHit.remaining, 78);
  assert.equal(bodyHit.killed, false);
  const headHit = damage.applyEnemyDamage(enemy, true);
  assert.equal(headHit.damage, 45);
  assert.equal(headHit.remaining, 33);
  assert.equal(headHit.headshot, true);
});

test('enemy health never drops below zero and lethal damage is reported once', () => {
  const damage = new DamageSystem();
  const enemy = { hp: 10 };
  const result = damage.applyEnemyDamage(enemy, true);
  assert.equal(result.damage, 10);
  assert.equal(result.remaining, 0);
  assert.equal(result.killed, true);
  assert.equal(damage.applyEnemyDamage(enemy, true).damage, 0);
});

test('player damage clamps health and reports a lethal hit', () => {
  const damage = new DamageSystem();
  const player = { hp: 35 };
  const result = damage.applyPlayerDamage(player, 12);
  assert.equal(result.remaining, 23);
  assert.equal(result.killed, false);
  const lethal = damage.applyPlayerDamage(player, 50);
  assert.equal(lethal.damage, 23);
  assert.equal(lethal.remaining, 0);
  assert.equal(lethal.killed, true);
});

test('damage system rejects invalid entities and negative damage', () => {
  const damage = new DamageSystem();
  assert.throws(() => damage.applyEnemyDamage({}), /numeric hp/);
  assert.throws(() => damage.applyPlayerDamage({ hp: 100 }, -1), /non-negative/);
  assert.throws(() => damage.applyPlayerDamage({ hp: 100 }, NaN), /non-negative/);
});
