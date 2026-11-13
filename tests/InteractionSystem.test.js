const test = require('node:test');
const assert = require('node:assert/strict');
const InteractionSystem = require('../src/campaign/InteractionSystem');

test('nearest unused interaction is selected within range', () => {
  const system = new InteractionSystem([
    { id: 'far', x: 4, z: 0, label: 'Дальний терминал', dialogue: [] },
    { id: 'near', x: 1, z: 0, label: 'Ближний терминал', dialogue: [{ speaker: 'АРХИВ', text: 'Запись' }] }
  ]);
  assert.equal(system.findNearby({ x: 0, z: 0 }, 2).id, 'near');
  assert.equal(system.findNearby({ x: 0, z: 0 }, .5), null);
});

test('activated interaction is one-time and returns a defensive dialogue copy', () => {
  const definition = { id: 'log', x: 0, z: 0, dialogue: [{ speaker: 'ИЛЬЯ', text: 'Оригинал' }] };
  const system = new InteractionSystem([definition]);
  definition.dialogue[0].text = 'Внешнее изменение';
  const item = system.activate('log');
  assert.equal(item.dialogue[0].text, 'Оригинал');
  item.dialogue[0].text = 'Изменено';
  assert.equal(system.isUsed('log'), true);
  assert.equal(system.activate('log'), null);
  assert.equal(system.findNearby({ x: 0, z: 0 }), null);
});

test('invalid and duplicate interaction definitions are rejected', () => {
  assert.throws(() => new InteractionSystem([{ id: 'bad', x: NaN, z: 0 }]), /finite x\/z/);
  assert.throws(() => new InteractionSystem([
    { id: 'same', x: 0, z: 0 },
    { id: 'same', x: 1, z: 1 }
  ]), /Duplicate interactable/);
});
