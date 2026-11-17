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
  'surface-04': { path: 'src/levels/SurfaceLevel.js', symbol: 'S7SurfaceLevel' },
  'archive-05': { path: 'src/levels/ArchiveLevel.js', symbol: 'S7ArchiveLevel' },
  'uplink-06': { path: 'src/levels/UplinkLevel.js', symbol: 'S7UplinkLevel' }
};

test('every campaign mission maps to a registered, loadable level script', () => {
  const missions = new MissionSystem();
  const game = read('src/game.js');
  const html = read('index.html');
  const definitions = missions.getUnlockedMissions({ unlockedMission: 6 });

  assert.equal(definitions.length, 6);
  assert.deepEqual(definitions.map(mission => mission.order), [1, 2, 3, 4, 5, 6]);

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
  const definitions = missions.getUnlockedMissions({ unlockedMission: 6 });

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
    'onComplete:()=>',
    'state=\'play\';mouse=false',
    'fallback=Boolean(transition.elevator&&!locked)',
    'elevatorTransition.constrainPlayer(P.pos)'
  ]) assert.ok(game.includes(fragment), 'game transition must include: ' + fragment);

  assert.ok(elevator.includes("this.phase==='travel'"));
  assert.ok(elevator.includes('this.radioComplete'));
  assert.ok(elevator.includes('this.player.pos.y+=dy'));
  assert.ok(elevator.includes('doorPassable'), 'the cabin must allow the player to leave after the doors open');
});


test('elevator travel keeps player movement but pauses combat, enemy spawning and mission countdowns', () => {
  const game = read('src/game.js');
  const start = game.indexOf('function loop(now)');
  const stop = game.indexOf('comp.render()', start);
  assert.ok(start >= 0 && stop > start);
  const loop = game.slice(start, stop);
  assert.match(loop, /const inElevator=elevatorTransition\.isActive\(\)/);
  assert.match(loop, /if\(!inElevator&&mouse&&!combatCleared\)weapon\.fire/);
  assert.match(loop, /if\(!inElevator&&evacuationRemaining>0\)/);
  assert.match(loop, /if\(!inElevator\)\{\s*spawnT-=dt/);
  assert.match(loop, /droneAI\.update\(enemies,P,dt/);
  assert.match(loop, /projectileSystem\.update\(proj,dt/);
  assert.match(loop, /P\.pos\.x\+=/);
});


test('fallback mouse-look mode can pause safely and clears stuck input on window blur', () => {
  const game = read('src/game.js');
  assert.match(game, /e\.code==='Escape'&&state==='play'&&fallback/);
  assert.match(game, /addEventListener\('blur',\(\)=>\{for\(const key of Object\.keys\(keys\)\)delete keys\[key\];mouse=false;if\(state==='play'&&fallback\)showPauseMenu\(\);\}\)/);
});


test('archive and uplink sectors have gated consoles, visible exit doors and unique visual systems', () => {
  const archive = read('src/levels/ArchiveLevel.js');
  const uplink = read('src/levels/UplinkLevel.js');
  for (const [source, interaction] of [[archive, 'archive-core-terminal'], [uplink, 'uplink-disable']]) {
    assert.ok(source.includes("requiredInteractionId:'" + interaction + "'"));
    assert.ok(source.includes("id:'" + interaction + "'"));
    assert.ok(source.includes('exitZone:'));
    assert.ok(source.includes('openExit()'));
    assert.ok(source.includes('elevatorDoors') || source.includes('const doors='));
    assert.ok(source.includes('playerSpawn:'));
    assert.ok(source.includes('enemySpawnPoints:'));
  }
  assert.ok(archive.includes('cryogenic') || archive.includes('capsules'));
  assert.ok(archive.includes('Архив памяти'));
  assert.ok(uplink.includes('Передающий узел'));
  assert.ok(uplink.includes('lightning'));
});


test('new sectors keep decorative lighting emissive and point-light counts bounded', () => {
  const archive = read('src/levels/ArchiveLevel.js');
  const uplink = read('src/levels/UplinkLevel.js');
  const countPointLights = source => (source.match(/new T\\.PointLight\\(/g) || []).length;

  assert.equal(countPointLights(archive), 1, 'archive should use only its interaction alarm as a point light');
  assert.equal(countPointLights(uplink), 3, 'uplink should retain only the mast, console and storm flash lights');
  assert.ok(archive.includes('new T.MeshBasicMaterial({color:i%2?0x4be7ff:0x83aaff})'),
    'archive rack indicators should remain emissive without individual lights');
  assert.ok(archive.includes('emissiveIntensity:.7'), 'cryo pods should retain their self-illumination');
  assert.ok(uplink.includes('lightning.intensity=Math.random()<.012'),
    'uplink should retain its intermittent lightning flash');
});
