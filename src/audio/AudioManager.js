(function(root){
  'use strict';

  const PROFILES = {
    bunker: { base: 43, overtone: 57, cutoff: 135, hum: .035, noise: .009 },
    lab: { base: 56, overtone: 83, cutoff: 210, hum: .027, noise: .006 }
  };

  class S7AudioManager {
    constructor(createContext) {
      this.createContext = createContext || (() => {
        const AudioContextClass = root.AudioContext || root.webkitAudioContext;
        return AudioContextClass ? new AudioContextClass() : null;
      });
      this.context = null;
      this.nodes = [];
      this.sources = [];
      this.master = null;
    }

    unlock() {
      if (!this.context) this.context = this.createContext();
      if (!this.context) return null;
      if (this.context.state === 'suspended' && typeof this.context.resume === 'function') {
        const resumed = this.context.resume();
        if (resumed && typeof resumed.catch === 'function') resumed.catch(() => {});
      }
      return this.context;
    }

    startAmbience(profileName) {
      const context = this.context;
      if (!context) return false;
      this.stopAmbience();
      const profile = PROFILES[profileName] || PROFILES.bunker;
      const master = context.createGain();
      master.gain.value = 1;
      master.connect(context.destination);

      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = profile.cutoff;
      lowpass.connect(master);

      const fundamental = context.createOscillator();
      fundamental.type = 'sine';
      fundamental.frequency.value = profile.base;
      fundamental.connect(lowpass);
      fundamental.start();

      const overtone = context.createOscillator();
      overtone.type = 'triangle';
      overtone.frequency.value = profile.overtone;
      const overtoneGain = context.createGain();
      overtoneGain.gain.value = .28;
      overtone.connect(overtoneGain);
      overtoneGain.connect(lowpass);
      overtone.start();

      const noiseBuffer = context.createBuffer(1, Math.max(1, context.sampleRate * 2), context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
      const noise = context.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      const noiseFilter = context.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 420;
      const noiseGain = context.createGain();
      noiseGain.gain.value = profile.noise;
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start();

      const humGain = context.createGain();
      humGain.gain.value = profile.hum;
      lowpass.connect(humGain);
      humGain.connect(master);

      this.master = master;
      this.sources = [fundamental, overtone, noise];
      this.nodes = [master, lowpass, fundamental, overtone, overtoneGain, noise, noiseFilter, noiseGain, humGain];
      return true;
    }

    stopAmbience() {
      for (const source of this.sources) {
        try { source.stop(); } catch (error) {}
      }
      for (const node of this.nodes) {
        try { if (typeof node.disconnect === 'function') node.disconnect(); } catch (error) {}
      }
      this.sources = [];
      this.nodes = [];
      this.master = null;
    }

    setVolume(value) {
      if (!this.master) return false;
      const volume = Math.max(0, Math.min(1, Number(value) || 0));
      this.master.gain.value = volume;
      return true;
    }
  }

  S7AudioManager.PROFILES = Object.keys(PROFILES);
  root.S7AudioManager = S7AudioManager;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7AudioManager;
})(typeof window !== 'undefined' ? window : globalThis);
