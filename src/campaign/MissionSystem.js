(function(root){
  'use strict';

  const MISSIONS = [
    {
      id: 'bunker-01',
      order: 1,
      title: 'ПРОБУЖДЕНИЕ',
      location: 'Заброшенный бункер',
      description: 'Уничтожь 10 охранных дронов в заброшенном бункере.',
      levelId: 'bunker-01',
      objectives: [
        { id: 'eliminate-drones', type: 'eliminate', target: 10, label: 'Уничтожить охранных дронов' }
      ],
      spawn: {
        interval: 3.5,
        maxActive: 5,
        enemySequence: ['scout', 'assault', 'heavy', 'scout', 'sniper', 'assault', 'scout', 'heavy', 'sniper', 'scout']
      }
    },
    {
      id: 'lab-02',
      order: 2,
      title: 'КРАСНЫЙ ПРОТОКОЛ',
      location: 'Исследовательский комплекс',
      description: 'Проникни в исследовательский комплекс и уничтожь 14 боевых дронов.',
      levelId: 'lab-02',
      objectives: [
        { id: 'eliminate-lab-drones', type: 'eliminate', target: 14, label: 'Уничтожить боевых дронов' }
      ],
      spawn: {
        interval: 2.9,
        maxActive: 6,
        enemySequence: ['assault', 'scout', 'sniper', 'heavy', 'assault', 'sniper', 'scout', 'heavy', 'assault', 'sniper', 'heavy', 'scout', 'assault', 'heavy']
      }
    }
  ];

  class S7MissionSystem {
    constructor(missions) {
      const source = Array.isArray(missions) ? missions : MISSIONS;
      this.missions = source.map(mission => ({
        ...mission,
        objectives: mission.objectives.map(objective => ({ ...objective })),
        spawn: {
          ...mission.spawn,
          enemySequence: [...mission.spawn.enemySequence]
        }
      }));
      this.byId = new Map(this.missions.map(mission => [mission.id, mission]));
    }

    getMission(id) {
      const mission = this.byId.get(id);
      return mission ? this.copyMission(mission) : null;
    }

    getFirstMission() {
      return this.missions.length ? this.getMission(this.missions[0].id) : null;
    }

    getUnlockedMissions(campaignSave) {
      const unlocked = Math.max(1, Number(campaignSave?.unlockedMission) || 1);
      return this.missions
        .filter(mission => mission.order <= unlocked)
        .map(mission => this.copyMission(mission));
    }

    getMissionForCampaign(campaignSave, requestedId) {
      const unlocked = this.getUnlockedMissions(campaignSave);
      if (!unlocked.length) return null;
      const requested = unlocked.find(mission => mission.id === requestedId);
      if (requested) return requested;
      const completed = new Set(Array.isArray(campaignSave?.completedMissions) ? campaignSave.completedMissions : []);
      return unlocked.find(mission => !completed.has(mission.id)) || unlocked[0];
    }

    getObjective(missionId, objectiveId) {
      const mission = this.byId.get(missionId);
      if (!mission) return null;
      const objective = mission.objectives.find(item => item.id === objectiveId);
      return objective ? { ...objective } : null;
    }

    isObjectiveComplete(missionId, objectiveId, progress) {
      const objective = this.getObjective(missionId, objectiveId);
      if (!objective) return false;
      return Math.max(0, Number(progress) || 0) >= objective.target;
    }

    copyMission(mission) {
      return {
        ...mission,
        objectives: mission.objectives.map(objective => ({ ...objective })),
        spawn: {
          ...mission.spawn,
          enemySequence: [...mission.spawn.enemySequence]
        }
      };
    }
  }

  S7MissionSystem.MISSIONS = MISSIONS.map(mission => ({
    ...mission,
    objectives: mission.objectives.map(objective => ({ ...objective })),
    spawn: { ...mission.spawn, enemySequence: [...mission.spawn.enemySequence] }
  }));
  root.S7MissionSystem = S7MissionSystem;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7MissionSystem;
})(typeof window !== 'undefined' ? window : globalThis);
