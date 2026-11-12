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


test('radio dialogue advances automatically without requiring player input', () => {
  const root = createElement();
  root.classList = { values: new Set(), toggle(name, enabled) { if (enabled) this.values.add(name); else this.values.delete(name); }, remove(name) { this.values.delete(name); } };
  const speaker = createElement();
  const text = createElement();
  const prompt = createElement();
  const dialogue = new S7DialogueSystem({ rootElement: root, speakerElement: speaker, textElement: text, promptElement: prompt });
  let completed = 0;
  dialogue.startRadio([
    { speaker: 'ИЛЬЯ', text: 'Продолжай движение. Впереди шлюз лаборатории.' },
    { speaker: 'АРХИВ / 07', text: 'Внимание. Следующий сектор переведён в режим изоляции.' }
  ], () => completed++);
  assert.equal(root.hidden, false);
  assert.equal(root.classList.values.has('radio'), true);
  assert.equal(dialogue.mode, 'radio');
  dialogue.update(10);
  assert.equal(speaker.textContent, 'АРХИВ / 07');
  assert.equal(completed, 0);
  dialogue.update(10);
  assert.equal(root.hidden, true);
  assert.equal(root.classList.values.has('radio'), false);
  assert.equal(completed, 1);
});


test('Russian character voice synthesis uses distinct profiles and stops on dialogue advance', () => {
  const originalSynthesis = global.speechSynthesis;
  const originalUtterance = global.SpeechSynthesisUtterance;
  const spoken = [];
  let cancellations = 0;
  const russianVoice = { name: 'Russian Voice', lang: 'ru-RU' };
  global.speechSynthesis = {
      speaking: false,
      getVoices: () => [russianVoice],
      speak: utterance => spoken.push(utterance),
      cancel: () => { cancellations++; }
    };
  global.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; }
    };
  try {
    const dialogue = new S7DialogueSystem({
      rootElement: createElement(),
      speakerElement: createElement(),
      textElement: createElement(),
      promptElement: createElement()
    });
    dialogue.start([
      { speaker: 'ИЛЬЯ', text: 'Проверь канал связи.' },
      { speaker: 'АРХИВ / 07', text: 'Канал связи нестабилен.' }
    ]);
    assert.equal(spoken.length, 1);
    assert.equal(spoken[0].voice, russianVoice);
    assert.equal(spoken[0].lang, 'ru-RU');
    assert.ok(spoken[0].pitch < 1);
    dialogue.advance();
    assert.equal(spoken.length, 2);
    assert.ok(spoken[1].pitch < spoken[0].pitch);
    assert.ok(cancellations >= 1, 'advancing must cancel the previous spoken line');
    dialogue.setVoiceEnabled(false);
    assert.equal(dialogue.voiceEnabled, false);
    dialogue.finish();
  } finally {
    global.speechSynthesis = originalSynthesis;
    global.SpeechSynthesisUtterance = originalUtterance;
  }
});

test('voice synthesis stays silent when no Russian system voice is installed', () => {
  const originalSynthesis = global.speechSynthesis;
  const originalUtterance = global.SpeechSynthesisUtterance;
  let spoken = 0;
  global.speechSynthesis = { getVoices: () => [{ name: 'English Voice', lang: 'en-US' }], speak: () => spoken++, cancel() {} };
  global.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  try {
    const dialogue = new S7DialogueSystem({
      rootElement: createElement(),
      speakerElement: createElement(),
      textElement: createElement(),
      promptElement: createElement()
    });
    dialogue.start([{ speaker: 'ИЛЬЯ', text: 'Русская реплика.' }]);
    assert.equal(spoken, 0);
    assert.equal(dialogue.textElement.textContent, 'Русская реплика.');
    dialogue.finish();
  } finally {
    global.speechSynthesis = originalSynthesis;
    global.SpeechSynthesisUtterance = originalUtterance;
  }
});


test('long radio lines are not cut off by the old twelve-second ceiling', () => {
  const dialogue = new S7DialogueSystem({
    rootElement: createElement(),
    speakerElement: createElement(),
    textElement: createElement(),
    promptElement: createElement()
  });
  const line = { speaker: 'ИЛЬЯ', text: 'Аварийный канал нестабилен. '.repeat(9) };
  assert.ok(dialogue.lineDuration(line) > 12);
  assert.ok(dialogue.lineDuration(line) <= 26);
});
