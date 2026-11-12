const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scripts = [
  'src/game.js',
  'src/campaign/MissionSystem.js',
  'src/campaign/DialogueSystem.js',
  'src/campaign/ElevatorTransition.js',
  'src/campaign/InteractionSystem.js',
  'src/core/SaveSystem.js',
  'src/levels/LevelManager.js',
  'src/levels/BunkerLevel.js',
  'src/levels/LabLevel.js',
  'src/levels/ReactorLevel.js',
  'src/audio/AudioManager.js',
  'src/ai/EnemyFactory.js',
  'src/ai/DroneAI.js',
  'src/combat/DamageSystem.js',
  'src/combat/ProjectileSystem.js',
  'src/combat/WeaponSystem.js',
  'src/combat/HitFeedback.js',
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
  for (const script of ['src/campaign/DialogueSystem.js', 'src/campaign/ElevatorTransition.js', 'src/campaign/InteractionSystem.js', 'src/levels/ReactorLevel.js', 'src/combat/DamageSystem.js', 'src/combat/ProjectileSystem.js', 'src/combat/HitFeedback.js', 'src/ai/EnemyFactory.js']) {
    assert.ok(source.indexOf(script) >= 0, script + ' must be loaded');
    assert.ok(source.indexOf(script) < source.indexOf('src/game.js'), script + ' must load before game.js');
  }
  assert.doesNotMatch(source, /\\\\n<div id="dialogue"/);
  assert.doesNotMatch(source, /\\\\n#evacTimer/);
});


test('the pause menu resumes the active mission without replaying its briefing', () => {
  const filename = path.join(__dirname, '..', 'src/game.js');
  const source = fs.readFileSync(filename, 'utf8');
  assert.match(source, /pauseMenu=false/);
  assert.match(source, /\$\('s7-resume'\)\.addEventListener\('click'/);
  assert.match(source, /pauseMenu=false;state='play';\$\('ov'\)\.style\.display='none'/);
  assert.doesNotMatch(source, /\$\('s7-resume'\)[\s\S]{0,260}dialogueSystem\.start\(/);
});

test('main menu exposes new game, load, settings and exit actions', () => {
  const filename = path.join(__dirname, '..', 'index.html');
  const source = fs.readFileSync(filename, 'utf8');
  for (const id of ['s7-new', 's7-load', 's7-settings', 's7-exit', 's7-resume', 's7-load-list']) {
    assert.match(source, new RegExp('id="' + id + '"'));
  }
});


test('every static DOM element referenced by the game exists in the HTML', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const game = fs.readFileSync(path.join(__dirname, '..', 'src/game.js'), 'utf8');
  const ids = new Set([...html.matchAll(/\\bid=["']([^"']+)["']/g)].map(match => match[1]));
  const references = [...game.matchAll(/\\$\\(['"]([^'"]+)['"]\\)/g)].map(match => match[1]);
  const missing = [...new Set(references.filter(id => !ids.has(id)))];
  assert.deepEqual(missing, [], 'all literal $(id) references must resolve to HTML elements');
});
