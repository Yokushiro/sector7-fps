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


test('connector floors meet edge-to-edge without coplanar overlap', () => {
  const reactor = read('src/levels/ReactorLevel.js');
  const surface = read('src/levels/SurfaceLevel.js');
  assert.match(reactor, /corridorFloor\.position\.set\(0, \.015, -25\.25\)/);
  assert.match(reactor, /new T\.PlaneGeometry\(5\.2, 14\.5\)/);
  assert.match(reactor, /new T\.PlaneGeometry\(5\.2, 14\.5\)/);
  assert.match(reactor, /evacuationFloor\.position\.set\(0, \.015, -36\.75\)/);
  assert.match(reactor, /new T\.PlaneGeometry\(5\.2, 8\.5\)/);
  assert.match(surface, /new T\.PlaneGeometry\(46, 73\), floorMat/);
  assert.match(surface, /floor\.position\.set\(0, 0, 6\.5\)/);
  assert.match(surface, /sideFloor\.position\.set\(x, 0, -36\.5\)/);
  assert.match(surface, /landingPad\.position\.set\(0, \.06, 45\)/);
  assert.match(surface, /extractionMark\.position\.set\(0, \.04, 35\.5\)/);
});

test('all enclosed campaign chambers have a roof while the surface yard stays open', () => {
  const bunker = read('src/levels/BunkerLevel.js');
  const lab = read('src/levels/LabLevel.js');
  const reactor = read('src/levels/ReactorLevel.js');
  const surface = read('src/levels/SurfaceLevel.js');
  assert.match(bunker, /box\(0,H,0,S\*2\+2,\.6,S\*2\+2/);
  assert.match(lab, /box\(0, H, 0, S \* 2 \+ 2, \.6, S \* 2 \+ 2/);
  assert.match(reactor, /box\(0, H, 0, S \* 2 \+ 2, \.6, S \* 2 \+ 2/);
  assert.doesNotMatch(surface, /box\(0,\s*H,\s*0,/);
  assert.match(surface, /box\(0, 6\.25, -39, 6\.2, \.5, 18, dark, false\)/);
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
  assert.match(transition, /audioManager\.startAmbience\(currentMission\.audioProfile,\(carried\|\|transition\.elevator\)\?1\.25:0\)/);
  assert.match(transition, /missionCleared=false;combatCleared=false/);
  const normalTransition = transition.split('}catch(error)')[0];
  assert.doesNotMatch(normalTransition, /location\.reload/);
});


test('reactor shutdown visibly powers down the core and the black-box recorder reveals the truth about Ilya', () => {
  const reactor = read('src/levels/ReactorLevel.js');
  assert.match(reactor, /let reactorShutdown = false/);
  assert.match(reactor, /reactorShutdown = true/);
  assert.match(reactor, /coreMaterial\.opacity = Math\.max\(0, coreMaterial\.opacity - dt \* \.22\)/);
  assert.match(reactor, /coreLight\.intensity = Math\.max\(\.08, coreLight\.intensity - dt \* 2\.2\)/);
  assert.match(reactor, /id: 'reactor-archive'/);
  assert.match(reactor, /ПРОСЛУШАТЬ ЧЁРНЫЙ ЯЩИК/);
  assert.match(reactor, /Я не пытался спасти себя/);
});

test('reactor shutdown starts a visible 90-second evacuation countdown', () => {
  const reactor = read('src/levels/ReactorLevel.js');
  const game = read('src/game.js');
  const html = read('index.html');
  assert.match(reactor, /evacuationSeconds: 90/);
  assert.match(game, /const evacuationSeconds=Number\(activeLevel\.evacuationSeconds\)\|\|0/);
  assert.match(game, /evacuationRemaining=evacuationSeconds/);
  assert.match(game, /evacuationRemaining=Math\.max\(0,evacuationRemaining-dt\)/);
  assert.match(game, /if\(evacuationRemaining<=0\)end\(false\)/);
  assert.match(game, /activeLevel\.evacuationMessage\|\|/);
  assert.match(game, /String\(Math\.floor\(seconds\/60\)\)\.padStart\(2,'0'\)/);
  assert.match(html, /id="evacTimer"/);
});


test('each sector starts at the far end of its incoming corridor', () => {
  const bunker = read('src/levels/BunkerLevel.js');
  const lab = read('src/levels/LabLevel.js');
  const reactor = read('src/levels/ReactorLevel.js');
  assert.match(bunker, /entryFloor/);
  assert.match(bunker, /exitZone: \{ x0: -2\.1, x1: 2\.1, z0: -25\.6, z1: -24\.3 \}/);
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
    assert.match(source, /const elevatorDoors\s*=\s*\[/);
    assert.match(source, /elevatorDoors\.forEach\(door\s*=>\s*context\.removeCollisionBox\(door\.userData\.collisionBox\)\)/);
    assert.match(source, /userData\.openX\s*=\s*-?4\./);
    assert.match(source, /door\.position\.x\s*\+=/);
  }
});


test('laboratory combat must be followed by the security console before the reactor route opens', () => {
  const lab = read('src/levels/LabLevel.js');
  const mission = read('src/campaign/MissionSystem.js');
  const game = read('src/game.js');
  assert.match(lab, /requiredInteractionId: 'lab-security-console'/);
  assert.match(lab, /id: 'lab-security-console'/);
  assert.match(lab, /ОТКЛЮЧИТЬ ВНЕШНИЙ КОНТУР/);
  assert.match(mission, /отключи внешний контур защиты на центральной панели/i);
  assert.match(game, /nearby\.id===activeLevel\.requiredInteractionId&&!combatCleared/);
  assert.match(game, /ВНЕШНИЙ КОНТУР ОТКЛЮЧЁН · ШЛЮЗ В РЕАКТОР ОТКРЫТ/);
});

test('laboratory route enters from the bunker side and exits through the opposite corridor', () => {
  const lab = read('src/levels/LabLevel.js');
  assert.match(lab, /corridorFloor\.position\.set\(0, \.015, -21\)/);
  assert.match(lab, /exitCorridorFloor\.position\.set\(0, \.015, 21\)/);
  assert.match(lab, /const elevatorDoors = \[/);
  assert.match(lab, /box\(-1\.4, 3, 28, 2\.8, 5\.7, \.32/);
  assert.match(lab, /exitZone: \{ x0: -2\.1, x1: 2\.1, z0: 26\.3, z1: 27\.7 \}/);
  assert.doesNotMatch(lab, /const exitDoor = box\(0, 3, -28,/);
});

test('reactor entry continues from the laboratory exit while the evacuation corridor remains on the far side', () => {
  const reactor = read('src/levels/ReactorLevel.js');
  assert.match(reactor, /entryFloor\.position\.set\(0, \.015, 25\)/);
  assert.match(reactor, /corridorFloor\.position\.set\(0, \.015, -25\.25\)/);
  assert.match(reactor, /playerSpawn: \{ x: 0, y: 1\.7, z: 28, yaw: 0 \}/);
  assert.match(reactor, /exitZone: \{ x0: -2\.1, x1: 2\.1, z0: -31\.8, z1: -30\.6 \}/);
  assert.match(reactor, /evacuationFloor\.position\.set\(0, \.015, -36\.75\)/);
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

test('sector handoff uses a diegetic elevator and preserves player resources', () => {
  const game = read('src/game.js');
  const elevator = read('src/campaign/ElevatorTransition.js');
  assert.match(game, /function transitionToMission\(nextMission\)/);
  assert.match(game, /elevatorTransition\.begin\(/);
  assert.match(game, /loadMission\(elevatorNextMission,\{elevator:true,preserveVitals:elevatorVitals\}\)/);
  assert.match(game, /dialogueSystem\.startRadio\(currentMission\.introDialogue,\(\)=>elevatorTransition\.setRadioComplete\(\)\)/);
  assert.match(game, /outroPlaying=true;state='transition'/);
  assert.match(game, /dialogueSystem\.startRadio\(currentMission\.outroDialogue/);
  assert.match(game, /outroShown=true;outroPlaying=false;state='play';end\(true\)/);
  assert.match(game, /dialogueSystem\.update\(dt\)/);
  assert.match(game, /elevatorTransition\.update\(dt\)/);
  assert.match(game, /onComplete:\(\)=>\{/);
  assert.match(game, /elevatorTransition\.constrainPlayer\(P\.pos\)/);
  assert.match(game, /state='play';mouse=false/);
  assert.match(game, /P\.hp=carried\.hp/);
  assert.match(game, /P\.hp=transition\.preserveVitals\?/);
  assert.match(elevator, /const status=this\.travelTime<2\.1\?'ПОДЪЁМ':'СНИЖЕНИЕ'/);
  assert.match(elevator, /this\.drawDisplay\(floor,status\)/);
  assert.match(elevator, /displayKey!==this\.lastDisplayKey/);
  assert.match(elevator, /this\.player\.pos\.y\+=dy/);
  assert.match(elevator, /doorPassable/);
  assert.match(elevator, /this\.setDoorOpen\(1-t\)/);
  assert.match(elevator, /this\.setDoorOpen\(t\)/);
  const html = read('index.html');
  assert.match(html, /src\/campaign\/ElevatorTransition\.js/);
  assert.match(html, /#dialogue\.radio/);
});

test('surface finale continues from the reactor tunnel into an outdoor extraction yard', () => {
  const surface = read('src/levels/SurfaceLevel.js');
  const game = read('src/game.js');
  const html = read('index.html');
  const missions = read('src/campaign/MissionSystem.js');
  assert.match(surface, /id: 'surface-04'/);
  assert.match(surface, /tunnelFloor\.position\.set\(0, \.012, -39\)/);
  assert.match(surface, /playerSpawn: \{ x: 0, y: 1\.7, z: -34, yaw: Math\.PI \}/);
  assert.match(surface, /id: 'surface-uplink'/);
  assert.match(surface, /evacuationSeconds: 120/);
  assert.match(surface, /evacuationMessage: 'МАЯК АКТИВЕН · ДОБЕРИСЬ ДО ПОСАДОЧНОЙ ПЛОЩАДКИ'/);
  assert.match(surface, /context\.removeCollisionBox\(exitGate\.userData\.collisionBox\)/);
  assert.match(surface, /exitGate\.position\.y \+=/);
  assert.match(surface, /exitZone: \{ x0: -3\.2, x1: 3\.2, z0: 42, z1: 46 \}/);
  assert.match(game, /levelManager\.register\(S7SurfaceLevel\)/);
  assert.match(html, /src\/levels\/SurfaceLevel\.js/);
  assert.match(missions, /id: 'surface-04'[\s\S]*order: 4[\s\S]*target: 9/);
});

test('surface finale culminates in the Warden boss with a dedicated health HUD', () => {
  const ai = read('src/ai/DroneAI.js');
  const game = read('src/game.js');
  const factory = read('src/ai/EnemyFactory.js');
  const html = read('index.html');
  const mission = read('src/campaign/MissionSystem.js');
  assert.match(ai, /warden: Object\.freeze\(/);
  assert.match(ai, /hp: 280, moveSpeed: 1\.65/);
  assert.match(game, /type==='warden'\) bodyGeometry=new T\.IcosahedronGeometry/);
  assert.match(factory, /maxHp: profile\.hp/);
  assert.match(game, /S7EnemyFactory\.createCombatant\(type,profile,R\)/);
  assert.match(game, /enemies\.find\(enemy=>enemy\.type==='warden'\)/);
  assert.match(game, /bossHealth/);
  assert.match(html, /id="bossHud"/);
  assert.match(html, /id="bossHealth"/);
  assert.match(mission, /target: 9/);
  assert.match(mission, /'warden'\]/);
});
test('surface finale requires clearing the pursuit and activating the uplink before extraction', () => {
  const surface = read('src/levels/SurfaceLevel.js');
  const game = read('src/game.js');
  assert.match(surface, /requiredInteractionId: 'surface-uplink'/);
  assert.match(surface, /label: 'АКТИВИРОВАТЬ ЭВАКУАЦИОННЫЙ МАЯК'/);
  assert.match(surface, /id: 'surface-recorder'/);
  assert.match(surface, /if \(exitOpen\) exitGate\.position\.y/);
  assert.match(game, /nearby\.id===activeLevel\.requiredInteractionId&&!combatCleared/);
  assert.match(game, /if\(evacuationRemaining<=0\)end\(false\)/);
});


test('reactor evacuation alarm is declared and pulses without crashing the level update', () => {
  const reactor = read('src/levels/ReactorLevel.js');
  assert.ok(reactor.includes('const alarm = new T.PointLight(0xff3028, .25, 16, 2)'));
  assert.ok(reactor.includes('alarm.intensity = .25 + Math.max(0, Math.sin(time * 8)) * 1.35'));
  assert.ok(reactor.indexOf('const alarm =') < reactor.indexOf('alarm.intensity ='));
});


test('the three interior sectors show paired elevator doors before the exit is unlocked', () => {
  for (const levelPath of ['src/levels/BunkerLevel.js', 'src/levels/LabLevel.js', 'src/levels/ReactorLevel.js']) {
    const source = read(levelPath);
    assert.match(source, /const elevatorDoors\s*=\s*\[/);
    assert.match(source, /userData\.openX\s*=\s*-?4\./);
    assert.match(source, /userData\.openX\s*=\s*4\./);
    assert.match(source, /elevatorDoors\.forEach\(door\s*=>\s*context\.removeCollisionBox\(door\.userData\.collisionBox\)\)/);
    assert.match(source, /door\.position\.x\s*\+=/);
  }
});

test('elevator cabin keeps the floor display centered on the front wall and preserves facing on arrival', () => {
  const elevator = read('src/campaign/ElevatorTransition.js');
  assert.match(elevator, /group\.rotation\.y=yaw/);
  assert.match(elevator, /panel\.position\.set\(0,1\.98,-2\.22\)/);
  assert.match(elevator, /screen\.position\.set\(0,2\.18,-2\.145\)/);
  assert.match(elevator, /this\.player\.pos\.copy\(inside\)/);
  assert.match(elevator, /addBox\(1\.9,2\.86,\.12,-\.95,1\.62,2\.22,doorMaterial\)/);
  assert.match(elevator, /this\.player\.yaw=destinationYaw\+yawOffset/);
  assert.match(elevator, /capturePlayerYawOffset\(\)/);
  assert.match(elevator, /addBox\(3\.8,3\.35,\.14,0,1\.62,-2\.33,metal\)/);
});


test('elevator trigger volumes are on the approach side of the visible doors', () => {
  const bunker = read('src/levels/BunkerLevel.js');
  const lab = read('src/levels/LabLevel.js');
  const reactor = read('src/levels/ReactorLevel.js');
  assert.match(bunker, /exitZone: \{ x0: -2\.1, x1: 2\.1, z0: -25\.6, z1: -24\.3 \}/);
  assert.match(lab, /exitZone: \{ x0: -2\.1, x1: 2\.1, z0: 26\.3, z1: 27\.7 \}/);
  assert.match(reactor, /exitZone: \{ x0: -2\.1, x1: 2\.1, z0: -31\.8, z1: -30\.6 \}/);
  assert.match(bunker, /exitYaw: 0/);
  assert.match(lab, /exitYaw: Math\.PI/);
  assert.match(reactor, /exitYaw: 0/);
  const game = read('src/game.js');
  assert.match(game, /yaw:Number\.isFinite\(activeLevel\.exitYaw\)\?activeLevel\.exitYaw:P\.yaw/);
});
