const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../src/core/GraphicsSettings.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const normalize = context.window.S7GraphicsSettings.normalizeSettings;

test('graphics settings reject malformed persisted values', () => {
  assert.equal(normalize(null), null);
  assert.equal(normalize([]), null);
  assert.equal(normalize('high'), null);
  assert.equal(normalize({ preset: 'ultra' }), null);
});

test('graphics settings fill missing values from the selected preset', () => {
  const settings = normalize({ preset: 'low' });
  assert.equal(settings.preset, 'low');
  assert.equal(settings.pixelRatio, 1);
  assert.equal(settings.shadows, false);
  assert.equal(settings.bloom, false);
  assert.equal(settings.bloomStrength, .35);
});

test('graphics settings clamp and snap rendering scale to supported values', () => {
  assert.equal(normalize({ preset: 'custom', pixelRatio: 1.6 }).pixelRatio, 1.5);
  assert.equal(normalize({ preset: 'custom', pixelRatio: 99 }).pixelRatio, 2);
  assert.equal(normalize({ preset: 'custom', pixelRatio: -4 }).pixelRatio, 1);
  assert.equal(normalize({ preset: 'custom', pixelRatio: 'invalid' }).pixelRatio, 1.5);
});

test('graphics settings clamp bloom strength and preserve valid custom toggles', () => {
  const settings = normalize({
    preset: 'custom',
    shadows: false,
    bloom: true,
    bloomStrength: 9
  });
  assert.equal(settings.shadows, false);
  assert.equal(settings.bloom, true);
  assert.equal(settings.bloomStrength, 1.5);
  assert.equal(normalize({ preset: 'custom', bloomStrength: -2 }).bloomStrength, 0);
});
