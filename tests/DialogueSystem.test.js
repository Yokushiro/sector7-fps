const test = require('node:test');
const assert = require('node:assert/strict');
const S7DialogueSystem = require('../src/campaign/DialogueSystem');

function createElement() {
  return { hidden: true, textContent: '', listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; } };
}

test('dialogue displays each line in order and completes once', () => {
  const root = createElement();
  const speaker = createElement();
  const text = createElement();
  const prompt = createElement();
  const dialogue = new S7DialogueSystem({ rootElement: root, speakerElement: speaker, textElement: text, promptElement: prompt });
  let completed = 0;
  assert.equal(dialogue.start([
    { speaker: 'ИЛЬЯ', text: 'Первое сообщение' },
    { speaker: 'СИСТЕМА', text: 'Второе сообщение' }
  ], () => completed++), true);
  assert.equal(root.hidden, false);
  assert.equal(speaker.textContent, 'ИЛЬЯ');
  assert.equal(text.textContent, 'Первое сообщение');
  assert.equal(prompt.textContent, 'ENTER / E — ПРОДОЛЖИТЬ');
  dialogue.advance();
  assert.equal(speaker.textContent, 'СИСТЕМА');
  assert.equal(text.textContent, 'Второе сообщение');
  assert.equal(prompt.textContent, 'ENTER / E — НАЧАТЬ');
  dialogue.advance();
  assert.equal(root.hidden, true);
  assert.equal(dialogue.isActive(), false);
  assert.equal(completed, 1);
  assert.equal(dialogue.advance(), false);
  assert.equal(completed, 1);
});

test('empty dialogue immediately invokes completion safely', () => {
  const dialogue = new S7DialogueSystem({
    rootElement: createElement(),
    speakerElement: createElement(),
    textElement: createElement(),
    promptElement: createElement()
  });
  let completed = 0;
  assert.equal(dialogue.start([], () => completed++), false);
  assert.equal(completed, 1);
  assert.equal(dialogue.isActive(), false);
});
