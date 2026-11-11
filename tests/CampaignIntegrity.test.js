const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const MissionSystem = require('../src/campaign/MissionSystem');

const root = path.join(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const aiContext = { window: {} };
vm.runInNewContext(read('src/ai/DroneAI.js'), aiContext);
const enemyProfiles = aiContext.window.S7DroneAI.PROFILES;

const levelFiles = {
  'bunker-01': 'src/levels/BunkerLevel.js',
  'lab-02': 'src/levels/LabLevel.js',
  'reactor-03': 'src/levels/ReactorLevel.js',
  'surface-04': 'src/levels/SurfaceLevel.js'
};

test('every campaign mission maps to a registered, loadable level script', () => {
  const missions = new MissionSystem();
  const game = read('src/game.js');
  const html = read('index.html');
  const definitions = missions.getUnlockedMissions({ unlockedMission: 4 });

  assert.equal(definitions.length, 4);
  assert.deepEqual(definitions.map(mission => mission.order), [1, 2, 3, 4]);

  for (const mission of definitions) {
    const levelPath = levelFiles[mission.levelId];
    assert.ok(levelPath, 'missing level mapping for ' + mission.id);
    const source = read(levelPath);
    assert.ok(source.includes("id: '" + mission.levelId + "'"), "level id must match " + mission.levelId);
    assert.match(game, new RegExp('register\\(S7' + mission.levelId.split('-')[0][0].toUpperCase() + mission.levelId.split('-')[0].slice(1) + 'Level\\)'));
    assert.ok(html.includes('<script src="' + levelPath + '"></script>'), 'level script must load before game.js');
    assert.match(source, /playerSpawn:\\s*\\{/);
    assert.match(source, /enemySpawnPoints:\\s*\\[/);
    assert.match(source, /bounds:\\s*\\{/);
  }
});

test('mission objectives, spawn schedules and enemy archetypes agree', () => {
  const missions = new MissionSystem();
  const definitions = missions.getUnlockedMissions({ unlockedMission: 4 });

  for (const mission of definitions) {
    const objective = mission.objectives.find(item => item.type === 'eliminate');
    assert.ok(objective, mission.id + ' must define an elimination objective');
    assert.equal(objective.target, mission.spawn.enemySequence.length, mission.id + ' spawn count must match its objective');
    assert.ok(mission.spawn.maxActive >= 1);
    assert.ok(mission.spawn.interval > 0);
    assert.ok(mission.spawn.enemySequence.every(type => Object.hasOwn(enemyProfiles, type)),
      mission.id + ' references an unknown enemy archetype');
    assert.ok(mission.introDialogue.length > 0);
    assert.ok(mission.outroDialogue.length > 0);
  }

  assert.equal(definitions.at(-1).spawn.enemySequence.at(-1), 'warden');
  assert.equal(enemyProfiles.warden.hp, 280);
});

test('campaign completion routes through the cinematic elevator and preserves player vitals', () => {
  const game = read('src/game.js');
  const elevator = read('src/campaign/ElevatorTransition.js');

  assert.match(game, /if\\(w&&nextMission\\)\\{transitionToMission\\(nextMission\\);return\\}/);
  assert.match(game, /elevatorVitals=\\{hp:P\\.hp\\}/);
  assert.match(game, /elevatorTransition\\.begin\\(/);
  assert.match(game, /loadMission\\(elevatorNextMission,\\{elevator:true,preserveVitals:elevatorVitals\\}\\)/);
  assert.match(game, /elevatorTransition\\.setDestination\\(P\\.pos,P\\.yaw/);
  assert.match(game, /dialogueSystem\\.startRadio\\(currentMission\\.introDialogue,\\(\\)=>elevatorTransition\\.setRadioComplete\\(\\)\\)/);
  assert.match(game, /onComplete:exitPosition=>/);
  assert.match(game, /if\\(exitPosition\\)P\\.pos\\.copy\\(exitPosition\\)/);
  assert.match(elevator, /this\\.phase\\s*=\\s*'travel'/);
  assert.match(elevator, /this\\.radioComplete/);
});
