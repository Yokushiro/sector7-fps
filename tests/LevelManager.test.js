const test = require('node:test');
const assert = require('node:assert/strict');
const LevelManager = require('../src/levels/LevelManager');

class Group {
  constructor() { this.children = []; this.parent = null; }
  add(child) { this.children.push(child); child.parent = this; }
  removeFromParent() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter(child => child !== this);
    this.parent = null;
  }
  traverse(callback) {
    callback(this);
    for (const child of this.children) {
      if (typeof child.traverse === 'function') child.traverse(callback);
      else callback(child);
    }
  }
}

const fakeThree = { Group };

test('level manager registers and loads a level into an isolated scene group', () => {
  const scene = new Group();
  const solids = [];
  const boxes = [];
  const manager = new LevelManager({ THREE: fakeThree, scene, solids, boxes });
  manager.register({
    id: 'test-room',
    build(context) {
      assert.equal(context.solids, solids);
      assert.equal(context.boxes, boxes);
      const object = { geometry: { disposed: false, dispose() { this.disposed = true; } } };
      context.scene.add(object);
      context.solids.push(object);
      context.box(1, 2, 3, 4, 5, 6, {}, false);
      return { name: 'Test room' };
    }
  });
  const level = manager.load('test-room', {
    box(...args) { assert.equal(args.at(-1), scene.children[0]); }
  });
  assert.equal(level.id, 'test-room');
  assert.equal(level.name, 'Test room');
  assert.equal(scene.children.length, 1);
  assert.equal(solids.length, 1);
  assert.equal(boxes.length, 0);
});

test('loading another level unloads the previous level and clears collision data', () => {
  const scene = new Group();
  const solids = [];
  const boxes = [];
  const manager = new LevelManager({ THREE: fakeThree, scene, solids, boxes });
  let disposed = false;
  manager.register({
    id: 'first',
    build(context) {
      context.scene.add({ geometry: { dispose() { disposed = true; } } });
      context.solids.push({});
      context.boxes.push({});
    }
  });
  manager.register({ id: 'second', build() { return { name: 'Second' }; } });
  manager.load('first', { box() {} });
  manager.load('second', { box() {} });
  assert.equal(disposed, true);
  assert.equal(scene.children.length, 1);
  assert.equal(solids.length, 0);
  assert.equal(boxes.length, 0);
  assert.equal(manager.getCurrent().id, 'second');
});

test('unknown levels and duplicate registrations are rejected', () => {
  const manager = new LevelManager({ THREE: fakeThree, scene: new Group(), solids: [], boxes: [] });
  manager.register({ id: 'known', build() {} });
  assert.throws(() => manager.load('missing', { box() {} }), /Unknown level/);
  assert.throws(() => manager.register({ id: 'known', build() {} }), /already registered/);
});

test('failed level builds roll back the scene and collision collections', () => {
  const scene = new Group();
  const solids = [];
  const boxes = [];
  const manager = new LevelManager({ THREE: fakeThree, scene, solids, boxes });
  manager.register({
    id: 'broken',
    build(context) {
      context.scene.add({ geometry: { dispose() {} } });
      context.solids.push({});
      context.boxes.push({});
      throw new Error('build failed');
    }
  });
  assert.throws(() => manager.load('broken', { box() {} }), /build failed/);
  assert.equal(scene.children.length, 0);
  assert.equal(solids.length, 0);
  assert.equal(boxes.length, 0);
  assert.equal(manager.getCurrent(), null);
});


test('streaming disposes unique materials and textures but preserves shared PBR cache resources', () => {
  const scene = new Group();
  const manager = new LevelManager({ THREE: fakeThree, scene, solids: [], boxes: [] });
  const geometry = { disposed: false, dispose() { this.disposed = true; } };
  const texture = { isTexture: true, disposed: false, dispose() { this.disposed = true; } };
  const uniqueMaterial = { userData: {}, map: texture, disposed: false, dispose() { this.disposed = true; } };
  const sharedMaterial = { userData: { sector7Shared: true }, disposed: false, dispose() { this.disposed = true; } };
  manager.register({
    id: 'resource-room',
    build(context) {
      context.scene.add({ geometry, material: [uniqueMaterial, sharedMaterial] });
    }
  });
  manager.register({ id: 'next-room', build() {} });
  manager.load('resource-room', { box() {} });
  manager.load('next-room', { box() {} });
  assert.equal(geometry.disposed, true);
  assert.equal(texture.disposed, true);
  assert.equal(uniqueMaterial.disposed, true);
  assert.equal(sharedMaterial.disposed, false);
});
