const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scripts = [
  'src/game.js',
  'src/campaign/MissionSystem.js',
  'src/core/SaveSystem.js',
  'src/levels/LevelManager.js',
  'src/levels/BunkerLevel.js',
  'src/levels/LabLevel.js',
  'src/ai/DroneAI.js',
  'src/combat/WeaponSystem.js',
  'src/core/GraphicsSettings.js',
  'src/core/PerformanceMonitor.js'
];

test('all browser game scripts are valid classic JavaScript', () => {
  for (const relativePath of scripts) {
    const filename = path.join(__dirname, '..', relativePath);
    const source = fs.readFileSync(filename, 'utf8');
    assert.doesNotThrow(
      () => new vm.Script(source, { filename }),
      relativePath + ' must parse without syntax errors'
    );
  }
});
