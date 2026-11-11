const test = require('node:test');
const assert = require('node:assert/strict');
const ElevatorTransition = require('../src/campaign/ElevatorTransition');

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(other) { this.x = other.x; this.y = other.y; this.z = other.z; return this; }
}
class Group {
  constructor() {
    this.children = [];
    this.position = new Vector3();
    this.rotation = { y: 0 };
  }
  add(child) { this.children.push(child); child.parent = this; }
  traverse(callback) { callback(this); for (const child of this.children) child.traverse ? child.traverse(callback) : callback(child); }
  localToWorld(vector) {
    const c = Math.cos(this.rotation.y), s = Math.sin(this.rotation.y);
    const x = vector.x * c + vector.z * s;
    const z = -vector.x * s + vector.z * c;
    vector.x = x + this.position.x;
    vector.y += this.position.y;
    vector.z = z + this.position.z;
    return vector;
  }
}
class Mesh {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.position = new Vector3();
    this.rotation = { y: 0 };
    this.userData = {};
  }
}
class Geometry { dispose() { this.disposed = true; } }
class Material { constructor(options) { Object.assign(this, options); } dispose() { this.disposed = true; } }
class Light { constructor() { this.position = new Vector3(); } }
class Texture { constructor(canvas) { this.canvas = canvas; } dispose() { this.disposed = true; } }

function fakeThree() {
  return {
    Group,
    Mesh,
    Vector3,
    BoxGeometry: Geometry,
    PlaneGeometry: Geometry,
    MeshStandardMaterial: Material,
    MeshBasicMaterial: Material,
    PointLight: Light,
    CanvasTexture: Texture,
    SRGBColorSpace: 'srgb'
  };
}
function fakeDocument() {
  return {
    createElement() {
      const context = {
        fillRect() {}, strokeRect() {}, fillText() {}
      };
      return { width: 0, height: 0, getContext: () => context };
    }
  };
}

test('elevator closes, travels, waits for radio, opens and cleans up', () => {
  const previousDocument = global.document;
  global.document = fakeDocument();
  try {
    const scene = new Group();
    const camera = { position: new Vector3(), rotation: { set(x, y, z) { this.x = x; this.y = y; this.z = z; } } };
    let travelCalls = 0;
    let completeCalls = 0;
    let elevator;
    elevator = new ElevatorTransition({
      THREE: fakeThree(),
      scene,
      camera,
      onTravel() {
        travelCalls++;
        elevator.setDestination({ x: 12, y: 1.7, z: -8 }, Math.PI, '02');
        elevator.setRadioComplete();
      },
      onComplete() { completeCalls++; }
    });

    elevator.begin({ position: { x: 0, y: 1.7, z: 0 }, yaw: 0, destinationLabel: '02' });
    assert.equal(elevator.phase, 'entering');
    for (let i = 0; i < 12; i++) elevator.update(.1);
    assert.equal(elevator.phase, 'closing');
    for (let i = 0; i < 9; i++) elevator.update(.1);
    assert.equal(elevator.phase, 'travel');
    assert.equal(travelCalls, 1);
    assert.equal(camera.position.x, 12);
    assert.equal(camera.position.z, -8);

    for (let i = 0; i < 38; i++) elevator.update(.1);
    assert.equal(elevator.phase, 'opening');
    for (let i = 0; i < 10; i++) elevator.update(.1);
    assert.equal(elevator.phase, 'exiting');
    for (let i = 0; i < 9; i++) elevator.update(.1);

    assert.equal(elevator.phase, 'complete');
    assert.equal(completeCalls, 1);
    assert.equal(scene.children.length, 0);
    assert.equal(elevator.group, null);
  } finally {
    if (previousDocument === undefined) delete global.document;
    else global.document = previousDocument;
  }
});

test('elevator validates its dependencies and prevents overlapping starts', () => {
  assert.throws(() => new ElevatorTransition({}), /requires THREE, scene and camera/);
  const previousDocument = global.document;
  global.document = fakeDocument();
  try {
    const elevator = new ElevatorTransition({
      THREE: fakeThree(),
      scene: new Group(),
      camera: { position: new Vector3(), rotation: { set() {} } }
    });
    elevator.begin({ position: { x: 0, y: 1.7, z: 0 } });
    assert.throws(() => elevator.begin({ position: { x: 0, y: 1.7, z: 0 } }), /already active/);
    elevator.dispose();
  } finally {
    if (previousDocument === undefined) delete global.document;
    else global.document = previousDocument;
  }
});
