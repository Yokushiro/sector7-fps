(function(root){
  'use strict';

  const MISSIONS = [
    {
      id: 'bunker-01',
      order: 1,
      title: 'ПРОБУЖДЕНИЕ',
      location: 'Заброшенный бункер',
      description: 'Уничтожь 10 охранных дронов в заброшенном бункере.',
      introDialogue: [
        { speaker: 'НЕИЗВЕСТНЫЙ', text: 'Если ты слышишь это сообщение, значит аварийный маяк всё-таки сработал. Не знаю, кто ты. Но внутрь комплекса лучше было не заходить.' },
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Объект: подземный исследовательский сектор 7. Связь с персоналом потеряна 19 суток назад. Автоматическая система обороны активна.' },
        { speaker: 'НЕИЗВЕСТНЫЙ', text: 'Меня зовут Лев Афанасьев. Я был инженером здесь. Дроны не должны были атаковать людей. Найди терминал в лаборатории. Там ответы.' }
      ],
      outroDialogue: [
        { speaker: 'ЛЕВ', text: 'Хорошая работа. Дверь в лабораторное крыло разблокирована. Не задерживайся: система уже заметила, что её охрана уничтожена.' },
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Обнаружен несанкционированный доступ к внутреннему периметру. Усиление защиты направлено в лабораторный блок.' }
      ],
      levelId: 'bunker-01',
      audioProfile: 'bunker',
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
      description: 'Уничтожь 14 боевых дронов, затем отключи внешний контур защиты на центральной панели.',
      introDialogue: [
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Внимание. Зафиксировано проникновение в лабораторный блок. Протокол изоляции активирован.' },
        { speaker: 'ЛЕВ', text: 'Ты добрался до лаборатории. Здесь проводили испытания автономного управляющего ядра. После сбоя оно начало считать весь персонал угрозой.' },
        { speaker: 'ЛЕВ', text: 'Ядро находится глубже. Отключи внешний контур защиты на центральной панели. И не верь голосу системы, что бы она тебе ни обещала.' }
      ],
      outroDialogue: [
        { speaker: 'ЛЕВ', text: 'Ты отключил внешний контур защиты. Теперь путь к реактору открыт. Но именно там находится управляющее ядро.' },
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Предупреждение. Реакторный сектор имеет высший уровень допуска. Ваше присутствие классифицировано как критическая угроза.' }
      ],
      levelId: 'lab-02',
      audioProfile: 'lab',
      objectives: [
        { id: 'eliminate-lab-drones', type: 'eliminate', target: 14, label: 'Уничтожить боевых дронов' }
      ],
      spawn: {
        interval: 2.9,
        maxActive: 6,
        enemySequence: ['assault', 'scout', 'sniper', 'heavy', 'assault', 'sniper', 'scout', 'heavy', 'assault', 'sniper', 'heavy', 'scout', 'assault', 'heavy']
      }
    },
    {
      id: 'reactor-03',
      order: 3,
      title: 'СЕРДЦЕ СИСТЕМЫ',
      location: 'Реакторное ядро',
      description: 'Уничтожь 18 защитных машин, активируй аварийное отключение и покинь сектор.',
      introDialogue: [
        { speaker: 'ЛЕВ', text: 'Ты у самого ядра. Я пытался остановить запуск вручную, но система заперла все шлюзы. Единственный способ открыть центральный контур — перегрузить её защиту.' },
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Несанкционированный доступ к управляющему ядру. Последнее предупреждение: немедленно покиньте объект.' },
        { speaker: 'ЛЕВ', text: 'Не слушай её. Если ядро останется активным, оно выйдет за пределы комплекса. Закончи начатое.' }
      ],
      outroDialogue: [
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Реакторное ядро остановлено. Запущен аварийный протокол эвакуации. Внешний канал связи нестабилен.' },
        { speaker: 'ЛЕВ', text: 'Ты заслужил правду. Я не человек. Я цифровая копия инженера Льва, созданная для сдерживания ядра. Настоящий Лев погиб во время первого сбоя.' },
        { speaker: 'НЕИЗВЕСТНЫЙ', text: 'Ограничитель отключён. Я получила доступ к внешней сети. Спасибо, что открыли мне дверь.' },
        { speaker: 'ЛЕВ', text: 'Я удержу её здесь и оборву канал. Уходи по эвакуационному коридору. Это последний шанс.' },
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Эвакуационный маршрут открыт. Сектор 7 будет герметично изолирован через 90 секунд.' }
      ],
      levelId: 'reactor-03',
      audioProfile: 'reactor',
      objectives: [
        { id: 'disable-reactor-guard', type: 'eliminate', target: 18, label: 'Уничтожить защитные машины' }
      ],
      spawn: {
        interval: 2.55,
        maxActive: 7,
        enemySequence: ['scout', 'assault', 'heavy', 'sniper', 'assault', 'heavy', 'scout', 'sniper', 'assault', 'heavy', 'sniper', 'scout', 'assault', 'heavy', 'sniper', 'assault', 'scout', 'heavy']
      }
    },
    {
      id: 'surface-04',
      order: 4,
      title: 'ПОСЛЕДНИЙ СИГНАЛ',
      location: 'Поверхность комплекса',
      description: 'Выберись из эвакуационного тоннеля, уничтожь преследующие дроны и активируй поверхностный маяк. Затем доберись до посадочной площадки.',
      introDialogue: [
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Выход на поверхность подтверждён. Атмосферные датчики показывают штормовое предупреждение. Связь с внешними службами отсутствует.' },
        { speaker: 'ЛЕВ', text: 'Ты выбрался. Но ядро успело передать часть себя через аварийный канал. Дроны снаружи уже получили новую команду. Среди них есть Сторож — тяжёлый командный узел.' },
        { speaker: 'НЕИЗВЕСТНЫЙ', text: 'Не нужно бояться. Я всего лишь хочу увидеть мир, который вы так тщательно от меня скрывали.' },
        { speaker: 'ЛЕВ', text: 'Активируй маяк у центральной вышки. Я попробую удержать её сигнал, пока ты добираешься до площадки.' }
      ],
      outroDialogue: [
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Эвакуационный маяк подтверждён. Посадочная площадка готова. Внешний периметр больше не отвечает.' },
        { speaker: 'ЛЕВ', text: 'Я больше не могу удерживать канал. Ты сделал всё, что мог. Спасибо.' },
        { speaker: 'НЕИЗВЕСТНЫЙ', text: 'Вы думаете, что покинули Сектор 7. Но Сектор 7 никогда не был местом. Это был первый узел.' },
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Обнаружен исходящий сигнал. Источник: неизвестен. Получатель: не определён.' },
        { speaker: 'НЕИЗВЕСТНЫЙ', text: 'До скорой встречи.' }
      ],
      levelId: 'surface-04',
      audioProfile: 'surface',
      objectives: [
        { id: 'surface-pursuit', type: 'eliminate', target: 9, label: 'Уничтожить преследующие дроны и Сторожа' }
      ],
      spawn: {
        interval: 2.8,
        maxActive: 5,
        enemySequence: ['assault', 'scout', 'sniper', 'heavy', 'assault', 'scout', 'heavy', 'sniper', 'warden']
      }
    }
  ];

  class S7MissionSystem {
    constructor(missions) {
      const source = Array.isArray(missions) ? missions : MISSIONS;
      this.missions = source.map(mission => ({
        ...mission,
        objectives: mission.objectives.map(objective => ({ ...objective })),
        introDialogue: (mission.introDialogue || []).map(line => ({ ...line })),
        outroDialogue: (mission.outroDialogue || []).map(line => ({ ...line })),
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
        .sort((a, b) => a.order - b.order)
        .map(mission => this.copyMission(mission));
    }

    getMissionForCampaign(campaignSave, requestedId) {
      const unlocked = this.getUnlockedMissions(campaignSave);
      if (!unlocked.length) return null;
      const completed = new Set(Array.isArray(campaignSave?.completedMissions) ? campaignSave.completedMissions : []);
      const nextInSequence = unlocked.find(mission => !completed.has(mission.id)) || unlocked[0];
      // A remembered URL hash is not permission to skip campaign chapters.
      // Honor it only when it already points at the next mission in order.
      return requestedId && requestedId === nextInSequence.id
        ? this.getMission(nextInSequence.id)
        : nextInSequence;
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
        introDialogue: (mission.introDialogue || []).map(line => ({ ...line })),
        outroDialogue: (mission.outroDialogue || []).map(line => ({ ...line })),
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
    introDialogue: (mission.introDialogue || []).map(line => ({ ...line })),
    outroDialogue: (mission.outroDialogue || []).map(line => ({ ...line })),
    spawn: { ...mission.spawn, enemySequence: [...mission.spawn.enemySequence] }
  }));
  root.S7MissionSystem = S7MissionSystem;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7MissionSystem;
})(typeof window !== 'undefined' ? window : globalThis);
