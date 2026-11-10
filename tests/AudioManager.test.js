const test = require('node:test');
const assert = require('node:assert/strict');
const AudioManager = require('../src/audio/AudioManager');

function fakeAudioContext() {
  const sources = [];
  const nodes = [];
  const makeNode = () => {
    const node = {
      gain: { value: 0 },
      frequency: { value: 0 },
      connect() {},
      disconnect() { this.disconnected = true; },
      start() { this.started = true; },
      stop() { this.stopped = true; }
    };
    nodes.push(node);
    return node;
  };
  return {
    state: 'running',
    sampleRate: 100,
    destination: {},
    sources,
    nodes,
    createGain: makeNode,
    createBiquadFilter: makeNode,
    createOscillator() { const node = makeNode(); sources.push(node); return node; },
    createBuffer() { return { getChannelData() { return new Float32Array(200); } }; },
    createBufferSource() { const node = makeNode(); sources.push(node); return node; }
  };
}

test('audio manager starts and stops a procedural mission ambience', () => {
  const context = fakeAudioContext();
  const audio = new AudioManager(() => context);
  assert.equal(audio.unlock(), context);
  assert.equal(audio.startAmbience('lab'), true);
  assert.equal(context.sources.length, 3);
  assert.equal(context.sources.every(source => source.started), true);
  assert.equal(audio.setVolume(.4), true);
  assert.equal(audio.master.gain.value, .4);
  audio.stopAmbience();
  assert.equal(context.sources.every(source => source.stopped), true);
  assert.equal(audio.master, null);
});

test('audio manager safely handles unavailable audio and unknown profiles', () => {
  const unavailable = new AudioManager(() => null);
  assert.equal(unavailable.unlock(), null);
  assert.equal(unavailable.startAmbience('bunker'), false);

  const context = fakeAudioContext();
  const audio = new AudioManager(() => context);
  audio.unlock();
  assert.equal(audio.startAmbience('not-a-profile'), true);
  assert.equal(context.sources[0].frequency.value, 43);
});

test('restarting ambience replaces the previous soundscape', () => {
  const context = fakeAudioContext();
  const audio = new AudioManager(() => context);
  audio.unlock();
  audio.startAmbience('bunker');
  const firstSources = [...audio.sources];
  audio.startAmbience('lab');
  assert.equal(firstSources.every(source => source.stopped), true);
  assert.equal(audio.sources.length, 3);
});
