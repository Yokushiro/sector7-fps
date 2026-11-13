const test=require('node:test');
const assert=require('node:assert/strict');
const ElevatorTransition=require('../src/campaign/ElevatorTransition');

class Vector3{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
}
class Group{
  constructor(){this.children=[];this.position=new Vector3();this.rotation={y:0};}
  add(child){this.children.push(child);child.parent=this;}
  remove(child){const i=this.children.indexOf(child);if(i>=0)this.children.splice(i,1);child.parent=null;}
  traverse(fn){fn(this);for(const child of this.children)child.traverse?child.traverse(fn):fn(child);}
  localToWorld(v){
    const c=Math.cos(this.rotation.y),s=Math.sin(this.rotation.y);
    const x=v.x*c+v.z*s,z=-v.x*s+v.z*c;
    v.x=x+this.position.x;v.y+=this.position.y;v.z=z+this.position.z;return v;
  }
}
class Mesh{
  constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=new Vector3();this.rotation={y:0};this.userData={};}
}
class Geometry{dispose(){this.disposed=true;}}
class Material{constructor(options){Object.assign(this,options);}dispose(){this.disposed=true;}}
class Light{constructor(){this.position=new Vector3();}}
class Texture{constructor(canvas){this.canvas=canvas;}dispose(){this.disposed=true;}}
function fakeThree(){return{Group,Mesh,Vector3,BoxGeometry:Geometry,PlaneGeometry:Geometry,MeshStandardMaterial:Material,MeshBasicMaterial:Material,PointLight:Light,CanvasTexture:Texture,SRGBColorSpace:'srgb'};}
function fakeDocument(){return{createElement(){const context={fillRect(){},strokeRect(){},fillText(){}};return{width:0,height:0,getContext:()=>context};}};}

test('elevator remains walkable during travel and opens into the next sector',()=>{
  const previousDocument=global.document;global.document=fakeDocument();
  try{
    const scene=new Group();
    const camera={position:new Vector3(),rotation:{set(x,y,z){this.x=x;this.y=y;this.z=z;}}};
    const player={pos:new Vector3(0,1.7,0),yaw:1.1,pitch:.12};
    let travelCalls=0,completeCalls=0,exitPosition=null,elevator;
    const sounds=[];
    elevator=new ElevatorTransition({
      THREE:fakeThree(),scene,camera,
      onSound(type){sounds.push(type);},
      onTravel(){travelCalls++;const offset=elevator.capturePlayerYawOffset();player.yaw=0;elevator.setDestination({x:12,y:1.7,z:-8},Math.PI,'02',offset,2.25);},
      onComplete(position){completeCalls++;exitPosition=position;}
    });
    elevator.begin({position:{x:0,y:1.7,z:0},yaw:0,destinationLabel:'02',player});
    assert.equal(elevator.phase,'closing');
    assert.equal(player.yaw,0,'the player faces the cabin display on entry');
    assert.equal(player.pitch,.12,'entry alignment preserves the player pitch');
    assert.equal(elevator.group.rotation.y,0);
    const startThreshold=elevator.group.localToWorld(new Vector3(0,1.7,-2.22));
    assert.ok(Math.abs(startThreshold.z+1)<1e-9,'the cabin threshold aligns with the corridor door ahead of the player');
    assert.ok(player.pos.z>startThreshold.z,'the player starts inside the cabin behind the threshold');
    assert.equal(elevator.panel.position.x,0);
    assert.equal(elevator.panel.position.z,-2.22);
    assert.equal(elevator.doors[0].position.z,-2.22,'exit doors are directly ahead of the player');
    assert.equal(elevator.doors[0].material.color,0xa9bbc2,'exit doors use bright steel rather than dark wall-like panels');
    assert.equal(player.yaw,0);
    player.yaw=.35; // The player looks around while the doors close.
    assert.ok(player.pos.z<0,'player is placed just inside the cabin threshold');
    assert.equal(camera.rotation.y,undefined,'the elevator must not force the camera yaw');

    for(let i=0;i<10;i++)elevator.update(.1);
    assert.equal(elevator.phase,'travel');
    assert.equal(travelCalls,1);
    assert.ok(Math.abs(player.yaw-(Math.PI+.35))<1e-9,'the cabin rotates without snapping the camera to a new view');
    const destinationThreshold=elevator.group.localToWorld(new Vector3(0,1.7,-2.22));
    assert.ok(Math.abs(destinationThreshold.z+10.25)<1e-9,'the arrival doors align with the next sector entry bulkhead');
    assert.ok(player.pos.y>8,'player rides with the cabin instead of being detached from it');
    assert.ok(Math.abs((player.pos.y-1.7)-elevator.group.position.y)<1e-9,'the elevator floor remains directly under the player during travel');
    const beforeWalk=player.pos.x;
    player.pos.x+=.5;
    elevator.constrainPlayer(player.pos);
    assert.ok(player.pos.x!==beforeWalk,'the player can move freely inside the cabin');

    for(let i=0;i<42;i++)elevator.update(.1);
    assert.equal(elevator.phase,'travel','the cabin waits for the radio dialogue before opening');
    assert.ok(player.pos.y<10,'the player descends with the moving cabin');
    assert.equal(sounds.filter(type=>type==='floor-beep').length,3,'floor beeps occur only when the displayed floor or direction changes');
    elevator.setRadioComplete();
    elevator.update(.1);
    assert.equal(elevator.phase,'opening');
    for(let i=0;i<10;i++)elevator.update(.1);
    assert.equal(elevator.phase,'open');
    assert.equal(elevator.doorOpen,1);

    const outside=elevator.group.localToWorld(new Vector3(0,1.7,-3.4));
    player.pos.copy(outside);
    elevator.constrainPlayer(player.pos);
    assert.equal(elevator.phase,'complete');
    assert.equal(completeCalls,1);
    assert.equal(exitPosition,player.pos);
    assert.equal(elevator.panel,null);
    assert.equal(scene.children.length,0);
    assert.equal(elevator.group,null);
    elevator.begin({position:{x:4,y:1.7,z:5},yaw:Math.PI,destinationLabel:'03',player});
    assert.equal(elevator.phase,'closing','the controller supports later campaign transitions');
    assert.equal(scene.children.length,1);
    elevator.dispose();
  }finally{if(previousDocument===undefined)delete global.document;else global.document=previousDocument;}
});

test('elevator validates dependencies and prevents overlapping starts',()=>{
  assert.throws(()=>new ElevatorTransition({}),/requires THREE, scene and camera/);
  const previousDocument=global.document;global.document=fakeDocument();
  try{
    const elevator=new ElevatorTransition({THREE:fakeThree(),scene:new Group(),camera:{position:new Vector3(),rotation:{set(){}}}});
    elevator.begin({position:{x:0,y:1.7,z:0}});
    assert.throws(()=>elevator.begin({position:{x:0,y:1.7,z:0}}),/already active/);
    elevator.dispose();
  }finally{if(previousDocument===undefined)delete global.document;else global.document=previousDocument;}
});
