// Lightweight unit tests for the browser-side weapon module.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class FakeGroup {
  constructor() {
    this.children = [];
    this.position = { set() {} };
    this.rotation = { x: 0, z: 0 };
  }
  add(child) { this.children.push(child); }
  traverse(callback) { this.children.forEach(callback); }
}
class FakeMesh {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.position = { set() {} };
    this.rotation = { x: 0, z: 0 };
    this.castShadow = false;
    this.isMesh = true;
  }
}
class FakeMaterial {
  constructor(options = {}) { Object.assign(this, options); }
}
class FakeRaycaster {
  setFromCamera(coords) { this.coords = coords; }
  intersectObjects() { return []; }
}
class FakePointLight {
  constructor(color, intensity) { this.intensity = intensity; this.position = { set() {} }; }
}
const THREE = {
  Group: FakeGroup,
  Mesh: FakeMesh,
  MeshStandardMaterial: FakeMaterial,
  MeshBasicMaterial: FakeMaterial,
  BoxGeometry: class {},
  CylinderGeometry: class {},
  PlaneGeometry: class {},
  PointLight: FakePointLight,
  Raycaster: FakeRaycaster,
  Color: class { constructor(value) { this.value = value; } },
  AdditiveBlending: 1,
  DoubleSide: 2
};

const source = fs.readFileSync('src/combat/WeaponSystem.js', 'utf8');
const context = { window: {}, THREE };
vm.runInNewContext(source, context);
const WeaponSystem = context.window.S7WeaponSystem;

function createWeapon() {
  const sounds = [];
  const ammoUpdates = [];
  const weapon = new WeaponSystem({
    THREE,
    camera: { add() {} },
    sound: (...args) => sounds.push(args),
    onAmmoChange: value => ammoUpdates.push(value)
  });
  return { weapon, sounds, ammoUpdates };
}

test('weapon fires, consumes ammunition and respects its firing cooldown', () => {
  const { weapon, ammoUpdates } = createWeapon();
  const fired = weapon.fire([], [], () => {}, () => {}, () => {}, (a, b) => (a + b) / 2);
  assert.equal(fired, true);
  assert.equal(weapon.ammo, 29);
  assert.deepEqual(ammoUpdates, [29]);
  assert.equal(weapon.fire([], [], () => {}, () => {}, () => {}, (a, b) => (a + b) / 2), false);
});

test('weapon reloads an incomplete magazine and restores 30 rounds', () => {
  const { weapon, sounds, ammoUpdates } = createWeapon();
  weapon.fire([], [], () => {}, () => {}, () => {}, (a, b) => (a + b) / 2);
  assert.equal(weapon.reload(), true);
  assert.equal(weapon.reload(), false);
  weapon.update(1.5, 1.5, 0);
  assert.equal(weapon.ammo, 30);
  assert.equal(weapon.reloadRemaining, 0);
  assert.deepEqual(ammoUpdates, [29, 30]);
  assert.equal(sounds.length >= 3, true);
});

test('weapon does not start a reload when the magazine is full', () => {
  const { weapon } = createWeapon();
  assert.equal(weapon.reload(), false);
  assert.equal(weapon.ammo, 30);
});

test('shot bloom grows during rapid fire and recovers while not firing', () => {
  const { weapon } = createWeapon();
  const ranges = [];
  const random = (min, max) => {
    if (min < 0) ranges.push(Math.max(Math.abs(min), Math.abs(max)));
    return (min + max) / 2;
  };
  weapon.fire([], [], () => {}, () => {}, () => {}, random);
  const firstSpread = ranges[ranges.length - 1];
  weapon.update(0.1, 0.1, 0);
  weapon.fire([], [], () => {}, () => {}, () => {}, random);
  const secondSpread = ranges[ranges.length - 1];
  assert.ok(secondSpread > firstSpread, 'rapid shots should widen the spread');
  weapon.update(1, 1.1, 0);
  assert.ok(weapon.aimBloom < 0.0006, 'spread should recover after a pause');
});

test('camera recoil recovery is time-based rather than frame-count based', () => {
  const a = createWeapon().weapon;
  const b = createWeapon().weapon;
  const random = (min, max) => (min + max) / 2;
  for (const weapon of [a, b]) weapon.fire([], [], () => {}, () => {}, () => {}, random);
  a.update(0.5, 0.5, 0);
  for (let i = 0; i < 30; i++) b.update(1 / 60, (i + 1) / 60, 0);
  assert.ok(Math.abs(a.pitchKick - b.pitchKick) < 1e-10);
  assert.ok(a.pitchKick < 0.002);
});
