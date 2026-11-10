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
  assert.match(game, /function loadMission\(nextMission\)/);
  assert.match(game, /if\(w&&nextMission\)\{loadMission\(nextMission\);return\}/);
  assert.match(game, /activeLevel=levelManager\.load\(currentMission\.levelId/);
  assert.match(game, /location\.hash=currentMission\.id/);
});


test('streamed mission transitions reset combat state and avoid a page reload', () => {
  const game = read('src/game.js');
  const start = game.indexOf('function loadMission(nextMission)');
  const stop = game.indexOf('function useNearbyInteraction()', start);
  assert.ok(start >= 0 && stop > start);
  const transition = game.slice(start, stop);
  assert.match(transition, /kills=0;spawned=0;spawnT=0/);
  assert.match(transition, /P\.hp=100/);
  assert.match(transition, /weapon\.ammo=weapon\.magazineSize/);
  assert.match(transition, /missionCleared=false;combatCleared=false/);
  assert.doesNotMatch(transition, /location\.reload/);
});
