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
  assert.equal(mission.introDialogue.length, 3);
  assert.equal(mission.introDialogue[0].speaker, 'ЛЕВ / ЗАПИСЬ');
  assert.equal(mission.outroDialogue.length, 2);
  assert.deepEqual(missions.getUnlockedMissions({ unlockedMission: 1 }).map(item => item.id), ['bunker-01']);
});

test('mission definitions are returned as defensive copies', () => {
  const missions = new MissionSystem();
  const mission = missions.getMission('bunker-01');
  mission.objectives[0].target = 999;
  mission.spawn.enemySequence.pop();
  mission.introDialogue[0].text = 'Изменённый текст';
  mission.outroDialogue[0].text = 'Изменённый финал';
  const original = missions.getMission('bunker-01');
  assert.equal(original.objectives[0].target, 10);
  assert.equal(original.spawn.enemySequence.length, 10);
  assert.notEqual(original.introDialogue[0].text, 'Изменённый текст');
  assert.notEqual(original.outroDialogue[0].text, 'Изменённый финал');
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
  assert.equal(missions.getMission('reactor-03').objectives[0].target, 18);
  assert.equal(missions.getMission('reactor-03').introDialogue.length, 3);
  assert.equal(missions.getMission('reactor-03').outroDialogue.length, 5);
  assert.deepEqual(missions.getUnlockedMissions({ unlockedMission: 1 }).map(item => item.id), ['bunker-01']);
  assert.deepEqual(missions.getUnlockedMissions({ unlockedMission: 2 }).map(item => item.id), ['bunker-01', 'lab-02']);
  assert.deepEqual(missions.getUnlockedMissions({ unlockedMission: 3 }).map(item => item.id), ['bunker-01', 'lab-02', 'reactor-03']);
});

test('campaign selection resumes at the first incomplete mission and ignores stale hashes', () => {
  const missions = new MissionSystem();
  const save = { unlockedMission: 4, completedMissions: ['bunker-01', 'lab-02'] };
  assert.equal(missions.getMissionForCampaign(save).id, 'reactor-03');
  assert.equal(missions.getMissionForCampaign(save, 'surface-04').id, 'reactor-03');
  assert.equal(missions.getMissionForCampaign(save, 'bunker-01').id, 'reactor-03');
  assert.equal(missions.getMissionForCampaign(save, 'reactor-03').id, 'reactor-03');
  assert.equal(missions.getMissionForCampaign({ unlockedMission: 1, completedMissions: ['bunker-01'] }, 'lab-02').id, 'bunker-01');
});

test('unlocked missions always follow campaign order even if definitions are supplied out of order', () => {
  const missions = new MissionSystem(MissionSystem.MISSIONS.slice().reverse());
  assert.deepEqual(
    missions.getUnlockedMissions({ unlockedMission: 4 }).map(mission => mission.id),
    ['bunker-01', 'lab-02', 'reactor-03', 'surface-04']
  );
});

test('surface finale completes the four-sector campaign and keeps the extraction objective gated', () => {
  const missions = new MissionSystem();
  const finale = missions.getMission('surface-04');
  assert.equal(finale.order, 4);
  assert.equal(finale.levelId, 'surface-04');
  assert.equal(finale.objectives[0].target, 9);
  assert.equal(finale.spawn.enemySequence.length, 9);
  assert.equal(finale.spawn.enemySequence.at(-1), 'warden');
  assert.equal(finale.introDialogue.length, 4);
  assert.equal(finale.outroDialogue.length, 5);
  assert.deepEqual(
    missions.getUnlockedMissions({ unlockedMission: 4 }).map(item => item.id),
    ['bunker-01', 'lab-02', 'reactor-03', 'surface-04']
  );
});


test('campaign dialogue identifies the engineer as Lev in every chapter', () => {
  const missions = new MissionSystem();
  const lines = missions.getUnlockedMissions({ unlockedMission: 4 })
    .flatMap(mission => [...mission.introDialogue, ...mission.outroDialogue]);
  assert.ok(lines.some(line => line.text.includes('Меня зовут Лев Афанасьев')));
  assert.ok(lines.some(line => line.speaker === 'СИСТЕМА БУНКЕРА'));
  assert.ok(lines.every(line => !line.text.includes('Лев Воронцов')));
  assert.ok(lines.filter(line => line.speaker.startsWith('ЛЕВ')).length >= 10);
  assert.ok(lines.every(line => !/Илья|Ильи|ИЛЬЯ/.test(line.speaker + ' ' + line.text)));
});
