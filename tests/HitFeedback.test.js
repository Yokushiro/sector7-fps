const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
}

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('src/combat/HitFeedback.js', 'utf8'), context);
const HitFeedback = context.window.S7HitFeedback;

function marker() { return { classList: new FakeClassList() }; }

test('hit feedback distinguishes body hits, headshots and kills', () => {
  const feedback = new HitFeedback();
  const element = marker();
  feedback.trigger(element, { headshot: true, killed: false });
  assert.equal(element.classList.contains('visible'), true);
  assert.equal(element.classList.contains('headshot'), true);
  assert.equal(element.classList.contains('kill'), false);
  feedback.trigger(element, { headshot: false, killed: true });
  assert.equal(element.classList.contains('headshot'), false);
  assert.equal(element.classList.contains('kill'), true);
});

test('repeated hits refresh the marker lifetime without stale classes', () => {
  const feedback = new HitFeedback(.2);
  const element = marker();
  feedback.trigger(element, { headshot: true });
  feedback.update(.15, element);
  feedback.trigger(element, { killed: true });
  feedback.update(.15, element);
  assert.equal(element.classList.contains('visible'), true);
  feedback.update(.05, element);
  assert.equal(element.classList.contains('visible'), false);
  assert.equal(element.classList.contains('kill'), false);
});

test('hit feedback validates inputs and can be cleared immediately', () => {
  assert.throws(() => new HitFeedback(0), RangeError);
  const feedback = new HitFeedback();
  const element = marker();
  assert.throws(() => feedback.trigger(null), TypeError);
  assert.throws(() => feedback.update(-1, element), RangeError);
  feedback.trigger(element, { headshot: true, killed: true });
  feedback.clear(element);
  assert.equal(feedback.remaining, 0);
  assert.equal(element.classList.contains('visible'), false);
});
