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
  'bunker-01': { path: 'src/levels/BunkerLevel.js', symbol: 'S7BunkerLevel' },
  'lab-02': { path: 'src/levels/LabLevel.js', symbol: 'S7LabLevel' },
  'reactor-03': { path: 'src/levels/ReactorLevel.js', symbol: 'S7ReactorLevel' },
  'surface-04': { path: 'src/levels/SurfaceLevel.js', symbol: 'S7SurfaceLevel' }
};

test('every campaign mission maps to a registered, loadable level script', () => {
  const missions = new MissionSystem();
  const game = read('src/game.js');
  const html = read('index.html');
  const definitions = missions.getUnlockedMissions({ unlockedMission: 4 });

  assert.equal(definitions.length, 4);
  assert.deepEqual(definitions.map(mission => mission.order), [1, 2, 3, 4]);

  for (const mission of definitions) {
    const level = levelFiles[mission.levelId];
    assert.ok(level, 'missing level mapping for ' + mission.id);
    const source = read(level.path);
    assert.ok(source.includes("id: '" + mission.levelId + "'"), 'level id must match ' + mission.levelId);
    assert.ok(game.includes('register(' + level.symbol + ')'), 'game must register ' + level.symbol);
    assert.ok(html.includes('<script src="' + level.path + '"></script>'), 'HTML must load ' + level.path);
    assert.ok(source.includes('playerSpawn:'), 'level must define a player spawn');
    assert.ok(source.includes('enemySpawnPoints:'), 'level must define enemy spawn points');
    assert.ok(source.includes('bounds:'), 'level must define playable bounds');
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

  for (const fragment of [
    'if(w&&nextMission){transitionToMission(nextMission);return}',
    'elevatorVitals={hp:P.hp}',
    'elevatorTransition.begin(',
    'loadMission(elevatorNextMission,{elevator:true,preserveVitals:elevatorVitals})',
    'elevatorTransition.setDestination(P.pos,P.yaw',
    'dialogueSystem.startRadio(currentMission.introDialogue,()=>elevatorTransition.setRadioComplete())',
    'onComplete:exitPosition=>',
    'if(exitPosition)P.pos.copy(exitPosition)'
  ]) assert.ok(game.includes(fragment), 'game transition must include: ' + fragment);

  assert.ok(elevator.includes("phase === 'travel'"));
  assert.ok(elevator.includes('this.radioComplete'));
});
