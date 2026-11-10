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
  setFromCamera() {}
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
