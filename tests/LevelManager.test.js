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
  let builtSolids;
  let builtBoxes;
  manager.register({
    id: 'test-room',
    build(context) {
      builtSolids = context.solids;
      builtBoxes = context.boxes;
      assert.notEqual(context.solids, solids);
      assert.notEqual(context.boxes, boxes);
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
  assert.equal(builtSolids.length, 1);
  assert.equal(builtBoxes.length, 0);
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


test('prepared sectors stay hidden and activate without rebuilding or exposing collision early', () => {
  const scene = new Group();
  const solids = [];
  const boxes = [];
  const manager = new LevelManager({ THREE: fakeThree, scene, solids, boxes });
  let builds = 0;
  const preparedSolid = {};
  const preparedBox = { x0: 0, x1: 1, z0: 0, z1: 1 };
  manager.register({
    id: 'preloaded',
    build(context) {
      builds++;
      context.scene.add({ geometry: { dispose() {} } });
      context.solids.push(preparedSolid);
      context.boxes.push(preparedBox);
      return { name: 'Preloaded sector' };
    }
  });
  const prepared = manager.prepare('preloaded', { box() {} });
  assert.equal(prepared.root.visible, false);
  assert.equal(scene.children.length, 1);
  assert.equal(solids.length, 0);
  assert.equal(boxes.length, 0);
  assert.equal(manager.getCurrent(), null);
  const active = manager.load('preloaded', { box() {} });
  assert.equal(active, prepared);
  assert.equal(active.root.visible, true);
  assert.equal(builds, 1);
  assert.deepEqual(solids, [preparedSolid]);
  assert.deepEqual(boxes, [preparedBox]);
  assert.equal(manager.getPrepared('preloaded'), null);
});

test('preparing the next sector does not unload the currently active sector', () => {
  const scene = new Group();
  const solids = [];
  const boxes = [];
  const manager = new LevelManager({ THREE: fakeThree, scene, solids, boxes });
  manager.register({ id: 'active', build(context) { context.solids.push({ active: true }); } });
  manager.register({ id: 'next', build(context) { context.solids.push({ prepared: true }); } });
  manager.load('active', { box() {} });
  const active = manager.getCurrent();
  const activeSolid = solids[0];
  manager.prepare('next', { box() {} });
  assert.equal(manager.getCurrent(), active);
  assert.equal(solids.length, 1);
  assert.equal(solids[0], activeSolid);
  assert.equal(scene.children.length, 2);
  assert.equal(manager.getPrepared('next').root.visible, false);
});


test('opening a preloaded level door removes collision from both local and active arrays', () => {
  const scene = new Group();
  const solids = [];
  const boxes = [];
  const manager = new LevelManager({ THREE: fakeThree, scene, solids, boxes });
  const doorCollision = { x0: -1, x1: 1, z0: -2, z1: -1 };
  manager.register({
    id: 'door-room',
    build(context) {
      context.boxes.push(doorCollision);
      return { openExit() { context.removeCollisionBox(doorCollision); } };
    }
  });
  manager.prepare('door-room', { box() {} });
  const level = manager.load('door-room', { box() {} });
  assert.deepEqual(boxes, [doorCollision]);
  level.openExit();
  assert.deepEqual(level.boxes, []);
  assert.deepEqual(boxes, []);
});


test('level material factory receives the active mission style', () => {
  const scene = new Group();
  const manager = new LevelManager({ THREE: fakeThree, scene, solids: [], boxes: [] });
  const calls = [];
  manager.register({
    id: 'reactor-03',
    build(context) {
      context.mat('floor', 4, 4, .2, 0xffffff);
      context.mat('concrete', 6, 2);
      context.mat('metal', 1, 1, .9);
      return { name: 'Reactor' };
    }
  });
  manager.load('reactor-03', {
    mat(...args) { calls.push(args); return {}; },
    box() {}
  });
  assert.deepEqual(calls, [
    ['floor', 4, 4, .2, 0xffffff, 'reactor-03'],
    ['concrete', 6, 2, 0, 0xffffff, 'reactor-03'],
    ['metal', 1, 1, .9, 0xffffff, 'reactor-03']
  ]);
});


test('discardPreparedExcept releases stale hidden sectors but keeps the requested destination', () => {
  const scene = new Group();
  const manager = new LevelManager({ THREE: fakeThree, scene, solids: [], boxes: [] });
  const disposed = { keep: false, stale: false };
  for (const id of ['keep', 'stale']) {
    manager.register({
      id,
      build(context) {
        context.scene.add({ geometry: { dispose() { disposed[id] = true; } } });
      }
    });
    manager.prepare(id, { box() {} });
  }
  assert.equal(scene.children.length, 2);
  assert.equal(manager.discardPreparedExcept('keep'), 1);
  assert.equal(manager.getPrepared('keep') !== null, true);
  assert.equal(manager.getPrepared('stale'), null);
  assert.equal(disposed.keep, false);
  assert.equal(disposed.stale, true);
  assert.equal(scene.children.length, 1);
});
