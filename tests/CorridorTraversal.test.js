const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('all campaign locations provide traversable corridor exits', () => {
  for (const levelPath of ['src/levels/BunkerLevel.js', 'src/levels/LabLevel.js', 'src/levels/ReactorLevel.js']) {
    const source = read(levelPath);
    assert.match(source, /corridorFloor/);
    assert.match(source, /exitZone:\s*\{/);
    assert.match(source, /bounds:\s*\{\s*halfSize:\s*(27|29|33)/);
    assert.match(source, /interactables:\s*\[/);
    assert.match(source, /update\(dt, time\)/);
    assert.match(source, /openExit\(\)/);
  }
});

test('combat completion opens the route instead of ending the mission immediately', () => {
  const source = read('src/game.js');
  assert.match(source, /missionCleared=true/);
  assert.match(source, /ИЩИ ВЫХОД В КОРИДОРЕ/);
  assert.match(source, /missionCleared&&exit&&P\.pos\.x>=exit\.x0/);
  assert.match(source, /if\(!combatCleared&&spawned<GOAL/);
});


test('corridor lintels remain visual-only so they do not block player movement', () => {
  const bunker = read('src/levels/BunkerLevel.js');
  const lab = read('src/levels/LabLevel.js');
  const reactor = read('src/levels/ReactorLevel.js');
  assert.match(bunker, /box\(0,H-\.5,-S-\.5,4\.2,1,1,mat\('metal',2,1,\.85\),false\)/);
  assert.match(lab, /box\(0, H - \.5, -S - \.5, 4\.2, 1, 1, steel, false\)/);
  assert.match(reactor, /box\(0, H - \.5, -S - \.5, 4\.2, 1, 1, steel, false\)/);
});


test('reactor finale requires a console interaction after combat before the exit unlocks', () => {
  const reactor = read('src/levels/ReactorLevel.js');
  const game = read('src/game.js');
  assert.match(reactor, /requiredInteractionId: 'reactor-shutdown'/);
  assert.match(reactor, /id: 'reactor-shutdown'/);
  assert.match(game, /nearby\.id===activeLevel\.requiredInteractionId&&!combatCleared/);
  assert.match(game, /if\(item\.id===activeLevel\.requiredInteractionId\)\{missionCleared=true/);
  assert.match(game, /if\(!combatCleared&&spawned<GOAL/);
  assert.match(game, /activeLevel\.openExit\?\.\(\)/);
});


test('campaign advances to the next location in-place after the corridor exit', () => {
  const game = read('src/game.js');
  assert.match(game, /function loadMission\(nextMission,transition=\{\}\)/);
  assert.match(game, /if\(w&&nextMission\)\{transitionToMission\(nextMission\);return\}/);
  assert.match(game, /activeLevel=levelManager\.load\(currentMission\.levelId/);
  assert.match(game, /location\.hash=currentMission\.id/);
});


test('streamed mission transitions reset combat state and avoid a page reload', () => {
  const game = read('src/game.js');
  const start = game.indexOf('function loadMission(nextMission,transition={})');
  const stop = game.indexOf('function useNearbyInteraction()', start);
  assert.ok(start >= 0 && stop > start);
  const transition = game.slice(start, stop);
  assert.match(transition, /kills=0;spawned=0;spawnT=0/);
  assert.match(transition, /P\.hp=carried\.hp/);
  assert.match(transition, /weapon\.onAmmoChange\(weapon\.ammo\)/);
  assert.match(transition, /audioManager\.startAmbience\(currentMission\.audioProfile,carried\?1\.25:0\)/);
  assert.match(transition, /missionCleared=false;combatCleared=false/);
  const normalTransition = transition.split('}catch(error)')[0];
  assert.doesNotMatch(normalTransition, /location\.reload/);
});


test('reactor shutdown starts a visible 90-second evacuation countdown', () => {
  const game = read('src/game.js');
  const html = read('index.html');
  assert.match(game, /evacuationRemaining=90/);
  assert.match(game, /evacuationRemaining=Math\.max\(0,evacuationRemaining-dt\)/);
  assert.match(game, /if\(evacuationRemaining<=0\)end\(false\)/);
  assert.match(game, /ЭВАКУАЦИЯ · 01:30/);
  assert.match(html, /id="evacTimer"/);
});


test('each sector starts at the far end of its incoming corridor', () => {
  const bunker = read('src/levels/BunkerLevel.js');
  const lab = read('src/levels/LabLevel.js');
  const reactor = read('src/levels/ReactorLevel.js');
  assert.match(bunker, /entryFloor/);
  assert.match(bunker, /exitZone: \{ x0: -2\.1, x1: 2\.1, z0: -27\.6, z1: -26\.2 \}/);
  assert.match(bunker, /playerSpawn:\s*\{\s*x:\s*0,\s*y:\s*1\.7,\s*z:\s*22,\s*yaw:\s*0\s*\}/);
  assert.match(lab, /playerSpawn:\s*\{\s*x:\s*0,\s*y:\s*1\.7,\s*z:\s*-26,\s*yaw:\s*Math\.PI\s*\}/);
  assert.match(reactor, /playerSpawn:\s*\{\s*x:\s*0,\s*y:\s*1\.7,\s*z:\s*28,\s*yaw:\s*0\s*\}/);
  const game = read('src/game.js');
  assert.match(game, /P\.yaw=activeLevel\.playerSpawn\.yaw\|\|0/);
});


test('evacuation doors block the corridor until opened, then release collision', () => {
  const game = read('src/game.js');
  assert.match(game, /me\.userData\.collisionBox=collisionBox/);
  for (const levelPath of ['src/levels/BunkerLevel.js', 'src/levels/LabLevel.js', 'src/levels/ReactorLevel.js']) {
    const source = read(levelPath);
    assert.match(source, /const exitDoor\s*=\s*box\([^;]+\);/);
    assert.match(source, /context\.removeCollisionBox\(exitDoor\.userData\.collisionBox\)/);
  }
});


test('laboratory route enters from the bunker side and exits through the opposite corridor', () => {
  const lab = read('src/levels/LabLevel.js');
  assert.match(lab, /corridorFloor\.position\.set\(0, \.015, -21\)/);
  assert.match(lab, /exitCorridorFloor\.position\.set\(0, \.015, 21\)/);
  assert.match(lab, /const exitDoor = box\(0, 3, 28,/);
  assert.match(lab, /exitZone: \{ x0: -2\.1, x1: 2\.1, z0: 28\.2, z1: 29\.5 \}/);
  assert.doesNotMatch(lab, /const exitDoor = box\(0, 3, -28,/);
});

test('reactor entry continues from the laboratory exit while the evacuation corridor remains on the far side', () => {
  const reactor = read('src/levels/ReactorLevel.js');
  assert.match(reactor, /entryFloor\.position\.set\(0, \.015, 25\)/);
  assert.match(reactor, /corridorFloor\.position\.set\(0, \.015, -25\)/);
  assert.match(reactor, /playerSpawn: \{ x: 0, y: 1\.7, z: 28, yaw: 0 \}/);
  assert.match(reactor, /exitZone: \{ x0: -2\.1, x1: 2\.1, z0: -33\.8, z1: -32\.7 \}/);
  assert.match(reactor, /evacuationFloor\.position\.set\(0, \.015, -36\.5\)/);
});

test('the next sector is prebuilt invisibly and its collision is isolated until activation', () => {
  const manager = read('src/levels/LevelManager.js');
  const game = read('src/game.js');
  assert.match(manager, /prepare\(id, context\)/);
  assert.match(manager, /rootGroup\.visible = false/);
  assert.match(manager, /this\.prepared\.set\(id, level\)/);
  assert.match(manager, /this\.solids\.push\(\.\.\.level\.solids\)/);
  assert.match(manager, /rootGroup\.userData\.s7Solids = solids/);
  assert.match(game, /target!==scene\?target\.userData/);
  assert.match(game, /local\?\.s7Solids\|\|solids/);
  assert.match(game, /function preloadNextMission\(\)/);
  assert.match(game, /levelManager\.prepare\(nextDefinition\.levelId/);
  assert.match(game, /setTimeout\(preloadNextMission,750\)/);
});

test('sector handoff preserves player resources and uses a short fade instead of a loading screen', () => {
  const game = read('src/game.js');
  assert.match(game, /function transitionToMission\(nextMission\)/);
  assert.match(game, /setTimeout\(\(\)=>\{\s*loadMission\(nextMission,\{preservePlayer:true,player\}\)/);
  assert.match(game, /dialogueSystem\.startRadio\(currentMission\.introDialogue\)/);
  assert.match(game, /outroPlaying=true;state='transition'/);
  assert.match(game, /dialogueSystem\.startRadio\(currentMission\.outroDialogue/);
  assert.match(game, /outroShown=true;outroPlaying=false;state='play';end\(true\)/);
  assert.match(game, /dialogueSystem\.update\(dt\)/);
  assert.match(game, /P\.hp=carried\.hp/);
  assert.match(game, /if\(!carried\)\{/);
  const html = read('index.html');
  assert.match(html, /id="transitionFade"/);
  assert.match(html, /#dialogue\.radio/);
});
