const test = require('node:test');
const assert = require('node:assert/strict');
const SaveSystem = require('../src/core/SaveSystem');

function memoryStorage(initial) {
  const values = new Map(initial ? [['sector7.campaign.save', initial]] : []);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); }
  };
}

test('save system starts with a clean versioned campaign', () => {
  const save = new SaveSystem(memoryStorage());
  const data = save.load();
  assert.equal(data.version, SaveSystem.VERSION);
  assert.equal(data.campaign.unlockedMission, 1);
  assert.equal(data.stats.runs, 0);
});

test('mission results persist campaign progress and statistics', () => {
  const storage = memoryStorage();
  const save = new SaveSystem(storage);
  save.load();
  save.recordMissionResult({ missionId: 'bunker-01', won: true, kills: 10 });
  const loaded = new SaveSystem(storage).load();
  assert.equal(loaded.stats.runs, 1);
  assert.equal(loaded.stats.wins, 1);
  assert.equal(loaded.stats.totalKills, 10);
  assert.equal(loaded.stats.bestKills, 10);
  assert.equal(loaded.campaign.unlockedMission, 2);
  assert.deepEqual(loaded.campaign.completedMissions, ['bunker-01']);
});

test('failed runs are recorded without unlocking the next mission', () => {
  const save = new SaveSystem(memoryStorage());
  save.load();
  const data = save.recordMissionResult({ missionId: 'bunker-01', won: false, kills: 4 });
  assert.equal(data.stats.losses, 1);
  assert.equal(data.stats.totalKills, 4);
  assert.equal(data.campaign.unlockedMission, 1);
});

test('corrupted and incompatible saves recover to safe defaults', () => {
  for (const raw of ['{not-json', JSON.stringify({ version: 999, stats: { wins: 50 } })]) {
    const save = new SaveSystem(memoryStorage(raw));
    const data = save.load();
    assert.equal(save.loadStatus, 'recovered');
    assert.equal(data.stats.wins, 0);
    assert.equal(data.campaign.unlockedMission, 1);
  }
});

test('storage failures do not crash the game', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const save = new SaveSystem(storage);
  assert.doesNotThrow(() => save.load());
  assert.equal(save.loadStatus, 'unavailable');
  assert.equal(save.save(), false);
});


test('later mission victories unlock the following campaign slot', () => {
  const save = new SaveSystem(memoryStorage());
  save.load();
  save.recordMissionResult({ missionId: 'bunker-01', won: true, kills: 10, nextMissionOrder: 2 });
  const data = save.recordMissionResult({ missionId: 'lab-02', won: true, kills: 14, nextMissionOrder: 3 });
  assert.equal(data.campaign.unlockedMission, 3);
  assert.deepEqual(data.campaign.completedMissions, ['bunker-01', 'lab-02']);
});

test('reactor completion unlocks the final surface extraction mission', () => {
  const save = new SaveSystem(memoryStorage());
  save.load();
  save.recordMissionResult({ missionId: 'bunker-01', won: true, kills: 10, nextMissionOrder: 2 });
  save.recordMissionResult({ missionId: 'lab-02', won: true, kills: 14, nextMissionOrder: 3 });
  const data = save.recordMissionResult({ missionId: 'reactor-03', won: true, kills: 18, nextMissionOrder: 4 });
  assert.equal(data.campaign.unlockedMission, 4);
  assert.deepEqual(data.campaign.completedMissions, ['bunker-01', 'lab-02', 'reactor-03']);
});


test('active mission is persisted and restored for the load menu', () => {
  const storage = memoryStorage();
  const first = new SaveSystem(storage);
  first.load();
  assert.equal(first.setCurrentMission('lab-02'), true);
  const restored = new SaveSystem(storage).load();
  assert.equal(restored.campaign.currentMission, 'lab-02');
});
