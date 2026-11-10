const test = require('node:test');
const assert = require('node:assert/strict');
const MissionSystem = require('../src/campaign/MissionSystem');

test('campaign exposes the implemented bunker mission and its objective', () => {
  const missions = new MissionSystem();
  const mission = missions.getMission('bunker-01');
  assert.equal(mission.title, 'ПРОБУЖДЕНИЕ');
  assert.equal(mission.levelId, 'bunker-01');
  assert.equal(mission.objectives[0].target, 10);
  assert.equal(mission.spawn.maxActive, 5);
  assert.deepEqual(missions.getUnlockedMissions({ unlockedMission: 1 }).map(item => item.id), ['bunker-01']);
});

test('mission definitions are returned as defensive copies', () => {
  const missions = new MissionSystem();
  const mission = missions.getMission('bunker-01');
  mission.objectives[0].target = 999;
  mission.spawn.enemySequence.pop();
  const original = missions.getMission('bunker-01');
  assert.equal(original.objectives[0].target, 10);
  assert.equal(original.spawn.enemySequence.length, 10);
});

test('objective completion uses its configured target', () => {
  const missions = new MissionSystem();
  assert.equal(missions.isObjectiveComplete('bunker-01', 'eliminate-drones', 9), false);
  assert.equal(missions.isObjectiveComplete('bunker-01', 'eliminate-drones', 10), true);
  assert.equal(missions.isObjectiveComplete('missing', 'eliminate-drones', 100), false);
});

test('unknown missions and objectives fail safely', () => {
  const missions = new MissionSystem();
  assert.equal(missions.getMission('missing'), null);
  assert.equal(missions.getObjective('bunker-01', 'missing'), null);
  assert.equal(missions.isObjectiveComplete('bunker-01', 'missing', 10), false);
});


test('second mission unlocks only after campaign progress reaches its order', () => {
  const missions = new MissionSystem();
  assert.equal(missions.getMission('lab-02').objectives[0].target, 14);
  assert.deepEqual(missions.getUnlockedMissions({ unlockedMission: 1 }).map(item => item.id), ['bunker-01']);
  assert.deepEqual(missions.getUnlockedMissions({ unlockedMission: 2 }).map(item => item.id), ['bunker-01', 'lab-02']);
});

test('campaign selection prefers the first incomplete unlocked mission', () => {
  const missions = new MissionSystem();
  const save = { unlockedMission: 2, completedMissions: ['bunker-01'] };
  assert.equal(missions.getMissionForCampaign(save).id, 'lab-02');
  assert.equal(missions.getMissionForCampaign(save, 'bunker-01').id, 'bunker-01');
  assert.equal(missions.getMissionForCampaign({ unlockedMission: 1, completedMissions: ['bunker-01'] }).id, 'bunker-01');
});
