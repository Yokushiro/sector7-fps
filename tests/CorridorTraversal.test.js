const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('bunker and laboratory both provide traversable corridor exits', () => {
  for (const levelPath of ['src/levels/BunkerLevel.js', 'src/levels/LabLevel.js']) {
    const source = read(levelPath);
    assert.match(source, /corridorFloor/);
    assert.match(source, /exitZone:\s*\{/);
    assert.match(source, /bounds:\s*\{\s*halfSize:\s*(27|29)/);
  }
});

test('combat completion opens the route instead of ending the mission immediately', () => {
  const source = read('src/game.js');
  assert.match(source, /missionCleared=true/);
  assert.match(source, /ИЩИ ВЫХОД В КОРИДОРЕ/);
  assert.match(source, /missionCleared&&exit&&P\.pos\.x>=exit\.x0/);
  assert.match(source, /if\(!missionCleared&&spawned<GOAL/);
});
