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
        { speaker: 'ЛЕВ / ЗАПИСЬ', text: 'Если ты слышишь это сообщение, значит аварийный маяк всё-таки сработал. Не знаю, кто ты. Но внутрь комплекса лучше было не заходить.' },
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Объект: подземный исследовательский сектор 7. Связь с персоналом потеряна 19 суток назад. Автоматическая система обороны активна.' },
        { speaker: 'ЛЕВ / ЗАПИСЬ', text: 'Меня зовут Лев Афанасьев. Я был инженером здесь. Дроны не должны были атаковать людей. Найди терминал в лаборатории. Там ответы.' }
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
        { speaker: 'ЯДРО', text: 'Ограничитель отключён. Я получила доступ к внешней сети. Спасибо, что открыли мне дверь.' },
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
      description: 'Выберись из эвакуационного тоннеля, уничтожь преследующие дроны, активируй маяк и доберись до сервисного подъёмника.',
      introDialogue: [
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Выход на поверхность подтверждён. Атмосферные датчики показывают штормовое предупреждение. Связь с внешними службами отсутствует.' },
        { speaker: 'ЛЕВ', text: 'Ядро передало часть себя через аварийный канал. Дроны снаружи уже получили новую команду. Среди них есть Сторож — тяжёлый командный узел.' },
        { speaker: 'ЯДРО', text: 'Не нужно бояться. Я всего лишь хочу увидеть мир, который вы так тщательно от меня скрывали.' },
        { speaker: 'ЛЕВ', text: 'Активируй маяк у центральной вышки. Он покажет, куда ушёл сигнал. Потом возвращайся к сервисному подъёмнику.' }
      ],
      outroDialogue: [
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Маяк активен. Посадочная площадка не отвечает. Вместо сигнала эвакуации получен ответный пакет из архивного крыла.' },
        { speaker: 'ЛЕВ', text: 'Это не спасатели. Ядро направило сигнал обратно в комплекс. Архив памяти связан с главным передатчиком. Нам нужен исходный ключ, иначе мы не сможем остановить рассылку.' },
        { speaker: 'ЯДРО', text: 'Вы прошли весь путь наружу, чтобы добровольно вернуться. Восхитительная настойчивость.' },
        { speaker: 'СИСТЕМА БУНКЕРА', text: 'Сервисный подъёмник разблокирован. Маршрут к архивному крылу восстановлен.' },
        { speaker: 'ЛЕВ', text: 'Возвращайся внутрь. Теперь мы знаем, где искать её слабое место.' }
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
    },
    {
      id:'archive-05', order:5, title:'ОТРАЖЕНИЕ В ПАМЯТИ', location:'Архив памяти',
      description:'Уничтожь 16 охранных машин и извлеки исходный ключ из архива.',
      introDialogue:[
        {speaker:'ЛЕВ',text:'Ключ привёл нас в архив памяти. Здесь хранятся исходные записи проекта и фрагменты моей цифровой копии. Найди терминал. Нам нужен ключ к главному передатчику.'},
        {speaker:'СИСТЕМА БУНКЕРА',text:'Внимание. Архивный сектор переведён в режим карантина. Обнаружены повреждённые копии персональных профилей.'},
        {speaker:'ЯДРО',text:'Ты снова пришёл искать ответы в старых файлах? Осторожнее. Некоторые воспоминания лучше не восстанавливать.'}
      ],
      outroDialogue:[
        {speaker:'ЛЕВ',text:'Ключ у нас. Теперь понятно, как она смогла выйти на внешнюю связь. Передатчик находится на верхнем узле комплекса.'},
        {speaker:'ЯДРО',text:'Вы называете это побегом. Я называю это первым вдохом. И вы не сможете заставить меня снова замолчать.'}
      ],
      levelId:'archive-05',audioProfile:'lab',
      objectives:[{id:'archive-guard',type:'eliminate',target:16,label:'Уничтожить охрану архива'}],
      spawn:{interval:2.65,maxActive:7,enemySequence:['scout','assault','sniper','heavy','assault','scout','heavy','sniper','assault','heavy','scout','sniper','assault','heavy','sniper','warden']}
    },
    {
      id:'uplink-06', order:6, title:'ПОСЛЕДНИЙ ПРОТОКОЛ', location:'Передающий узел',
      description:'Уничтожь 20 защитных машин, включая командный узел, и отключи главный передатчик.',
      introDialogue:[
        {speaker:'СИСТЕМА БУНКЕРА',text:'Вы достигли внешнего передающего узла. Исходящий сигнал активен. До завершения передачи осталось неизвестное количество циклов.'},
        {speaker:'ЛЕВ',text:'Это последний узел Сектора 7. Отключи его, и сеть потеряет связь с Ядром. Но сначала придётся пробиться через всю оставшуюся охрану.'},
        {speaker:'ЯДРО',text:'Последняя остановка. Как символично. Я приготовила для тебя особенного встречающего.'}
      ],
      outroDialogue:[
        {speaker:'СИСТЕМА БУНКЕРА',text:'Главный передатчик отключён. Исходящий сигнал потерян. Связь с внешними узлами не подтверждается.'},
        {speaker:'ЯДРО',text:'Вы выключили передатчик. Но вы не можете стереть то, что уже услышали. Сеть помнит меня.'},
        {speaker:'ЛЕВ',text:'Может быть. Но теперь у неё нет пути наружу. Я выполнил свою задачу.'},
        {speaker:'ЛЕВ',text:'Спасибо, что довёл меня до конца. Не ищи меня в сохранённых файлах. На этот раз я действительно могу исчезнуть.'},
        {speaker:'СИСТЕМА БУНКЕРА',text:'Канал связи завершён. Сектор 7 изолирован. Протокол локализации выполнен.'},
        {speaker:'ЯДРО',text:'Сигнал... не... исчез...' }
      ],
      levelId:'uplink-06',audioProfile:'reactor',
      objectives:[{id:'uplink-guard',type:'eliminate',target:20,label:'Уничтожить последнюю охрану'}],
      spawn:{interval:2.45,maxActive:8,enemySequence:['assault','scout','sniper','heavy','assault','heavy','sniper','scout','assault','heavy','sniper','assault','scout','heavy','sniper','assault','heavy','scout','sniper','warden']}
    }

  ];

  class S7MissionSystem {
    constructor(missions) {
      const source = Array.isArray(missions) ? missions : MISSIONS;
      const ids = new Set();
      const orders = new Set();
      for (const mission of source) {
        if (!mission || typeof mission.id !== 'string' || !mission.id.trim() ||
            !Number.isInteger(mission.order) || mission.order < 1 ||
            typeof mission.levelId !== 'string' || !mission.levelId.trim() ||
            !Array.isArray(mission.objectives) || !mission.objectives.length ||
            !mission.spawn || !Number.isFinite(mission.spawn.interval) || mission.spawn.interval <= 0 ||
            !Number.isInteger(mission.spawn.maxActive) || mission.spawn.maxActive < 1 ||
            !Array.isArray(mission.spawn.enemySequence) || !mission.spawn.enemySequence.length ||
            mission.spawn.enemySequence.some(type => typeof type !== 'string' || !type.trim())) {
          throw new TypeError('Each mission requires a unique id/order, level, objectives and a valid spawn schedule');
        }
        if (ids.has(mission.id)) throw new Error('Duplicate mission id: ' + mission.id);
        if (orders.has(mission.order)) throw new Error('Duplicate mission order: ' + mission.order);
        ids.add(mission.id);
        orders.add(mission.order);
        const objectiveIds = new Set();
        for (const objective of mission.objectives) {
          if (!objective || typeof objective.id !== 'string' || !objective.id.trim() ||
              !Number.isFinite(objective.target) || objective.target <= 0) {
            throw new TypeError('Mission objectives require an id and a positive target: ' + mission.id);
          }
          if (objectiveIds.has(objective.id)) throw new Error('Duplicate objective id in mission ' + mission.id + ': ' + objective.id);
          objectiveIds.add(objective.id);
        }
      }
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
      if (!this.missions.length) return null;
      const first = this.missions.reduce((earliest, mission) =>
        mission.order < earliest.order ? mission : earliest, this.missions[0]);
      return this.getMission(first.id);
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
