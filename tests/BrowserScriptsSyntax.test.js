const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scripts = [
  'src/game.js',
  'src/campaign/MissionSystem.js',
  'src/campaign/DialogueSystem.js',
  'src/campaign/InteractionSystem.js',
  'src/core/SaveSystem.js',
  'src/levels/LevelManager.js',
  'src/levels/BunkerLevel.js',
  'src/levels/LabLevel.js',
  'src/levels/ReactorLevel.js',
  'src/audio/AudioManager.js',
  'src/ai/DroneAI.js',
  'src/combat/DamageSystem.js',
  'src/combat/WeaponSystem.js',
  'src/core/JumpController.js',
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

test('game input state is declared before keyboard handlers use it', () => {
  const filename = path.join(__dirname, '..', 'src/game.js');
  const source = fs.readFileSync(filename, 'utf8');
  assert.match(source, /const keys\s*=\s*Object\.create\(null\)/);
});

test('one-shot game sound effects stop and disconnect their audio nodes', () => {
  const filename = path.join(__dirname, '..', 'src/game.js');
  const source = fs.readFileSync(filename, 'utf8');
  assert.match(source, /s\.stop\(t\s*\+\s*d\s*\+\s*\.04\)/);
  assert.match(source, /s\.onended\s*=\s*\(\)\s*=>/);
});


test('campaign UI systems load before the main game script', () => {
  const filename = path.join(__dirname, '..', 'index.html');
  const source = fs.readFileSync(filename, 'utf8');
  for (const script of ['src/campaign/DialogueSystem.js', 'src/campaign/InteractionSystem.js', 'src/levels/ReactorLevel.js', 'src/combat/DamageSystem.js']) {
    assert.ok(source.indexOf(script) >= 0, script + ' must be loaded');
    assert.ok(source.indexOf(script) < source.indexOf('src/game.js'), script + ' must load before game.js');
  }
  assert.doesNotMatch(source, /\\\\n<div id="dialogue"/);
  assert.doesNotMatch(source, /\\\\n#evacTimer/);
});


test('resuming a paused mission does not replay its opening briefing', () => {
  const filename = path.join(__dirname, '..', 'src/game.js');
  const source = fs.readFileSync(filename, 'utf8');
  assert.match(source, /introShown=false/);
  assert.match(source, /if\(!introShown\).*introShown=true;state='dialogue'/);
  assert.match(source, /else\{state='play';try\{dom\.requestPointerLock\(\)\}/);
});
