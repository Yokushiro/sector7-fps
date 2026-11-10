const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('bunker and laboratory both provide traversable corridor exits', () => {
  for (const levelPath of ['src/levels/BunkerLevel.js', 'src/levels/LabLevel.js', 'src/levels/ReactorLevel.js']) {
    const source = read(levelPath);
    assert.match(source, /corridorFloor/);
    assert.match(source, /exitZone:\s*\{/);
    assert.match(source, /bounds:\s*\{\s*halfSize:\s*(27|29|33)/);
    assert.match(source, /interactables:\s*\[/);
    assert.match(source, /update\(dt, time\)/);
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
});
