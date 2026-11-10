(function(root){
  'use strict';

  const PROFILES = {
    bunker: { base: 43, overtone: 57, cutoff: 135, hum: .035, noise: .009 },
    lab: { base: 56, overtone: 83, cutoff: 210, hum: .027, noise: .006 },
    reactor: { base: 31, overtone: 47, cutoff: 105, hum: .046, noise: .012 }
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

    startAmbience(profileName, fadeSeconds = 0) {
      const context = this.context;
      if (!context) return false;
      const fade = Math.max(0, Number(fadeSeconds) || 0);
      if (this.master && fade > 0) {
        const previous = { master: this.master, sources: this.sources, nodes: this.nodes };
        const now = context.currentTime;
        try {
          previous.master.gain.cancelScheduledValues(now);
          previous.master.gain.setValueAtTime(previous.master.gain.value, now);
          previous.master.gain.linearRampToValueAtTime(0, now + fade);
        } catch (error) {}
        setTimeout(() => this.releaseAmbience(previous), fade * 1000 + 100);
        this.master = null;
        this.sources = [];
        this.nodes = [];
      } else {
        this.stopAmbience();
      }
      const profile = PROFILES[profileName] || PROFILES.bunker;
      const master = context.createGain();
      master.gain.value = fade > 0 ? 0 : 1;
      if (fade > 0) {
        master.gain.setValueAtTime(0, context.currentTime);
        master.gain.linearRampToValueAtTime(1, context.currentTime + fade);
      }
      master.connect(context.destination);

      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = profile.cutoff;
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

    releaseAmbience(graph) {
      for (const source of graph.sources || []) {
        try { source.stop(); } catch (error) {}
      }
      for (const node of graph.nodes || []) {
        try { if (typeof node.disconnect === 'function') node.disconnect(); } catch (error) {}
      }
    }

    stopAmbience() {
      this.releaseAmbience({ sources: this.sources, nodes: this.nodes });
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
    startMusic() {
      const context = this.context;
      if (!context) return false;
      this.stopMusic();
      const master = context.createGain();
      master.gain.value = .24;
      master.connect(context.destination);
      this.musicMaster = master;
      this.musicNodes = [];
      this.musicSources = [];
      this.musicStep = 0;
      this.nextMusicTime = context.currentTime + .05;

      const tempo = 148;
      const stepDuration = 60 / tempo / 2;
      const riff = [0, 0, 7, 0, 10, 0, 7, 3, 0, 0, 7, 0, 12, 10, 7, 3];
      const bass = [0, 0, 0, 0, -5, -5, -5, -5, -3, -3, -3, -3, -7, -7, -2, -2];
      const rootMidi = 40; // E2: низкий, тяжёлый металлический строй
      const frequency = midi => 440 * Math.pow(2, (midi - 69) / 12);
      const remember = node => { this.musicNodes.push(node); return node; };
      const releaseVoice = (source, nodes) => {
        source.onended = () => {
          for (const node of nodes) {
            try { node.disconnect(); } catch (error) {}
            const index = this.musicNodes.indexOf(node);
            if (index !== -1) this.musicNodes.splice(index, 1);
          }
          const sourceIndex = this.musicSources.indexOf(source);
          if (sourceIndex !== -1) this.musicSources.splice(sourceIndex, 1);
        };
      };

      const envelope = (gain, time, peak, duration) => {
        const param = gain.gain;
        param.cancelScheduledValues(time);
        param.setValueAtTime(.0001, time);
        param.linearRampToValueAtTime(peak, time + .008);
        param.exponentialRampToValueAtTime(.0001, time + duration);
      };

      const tone = (midi, time, duration, volume, type, filterFrequency, detune = 0) => {
        const oscillator = remember(context.createOscillator());
        const filter = remember(context.createBiquadFilter());
        const gain = remember(context.createGain());
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency(midi), time);
        oscillator.detune.value = detune;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFrequency, time);
        gain.gain.value = .0001;
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        envelope(gain, time, volume, duration);
        oscillator.start(time);
        oscillator.stop(time + duration + .025);
        this.musicSources.push(oscillator);
        releaseVoice(oscillator, [oscillator, filter, gain]);
      };

      const kick = time => {
        const oscillator = remember(context.createOscillator());
        const gain = remember(context.createGain());
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(105, time);
        oscillator.frequency.exponentialRampToValueAtTime(38, time + .13);
        gain.gain.setValueAtTime(.0001, time);
        gain.gain.linearRampToValueAtTime(.72, time + .004);
        gain.gain.exponentialRampToValueAtTime(.0001, time + .16);
        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(time);
        oscillator.stop(time + .18);
        this.musicSources.push(oscillator);
        releaseVoice(oscillator, [oscillator, gain]);
      };

      const snare = time => {
        const oscillator = remember(context.createOscillator());
        const gain = remember(context.createGain());
        const filter = remember(context.createBiquadFilter());
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(185, time);
        oscillator.frequency.exponentialRampToValueAtTime(85, time + .09);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(650, time);
        gain.gain.setValueAtTime(.0001, time);
        gain.gain.linearRampToValueAtTime(.22, time + .003);
        gain.gain.exponentialRampToValueAtTime(.0001, time + .11);
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        oscillator.start(time);
        oscillator.stop(time + .13);
        this.musicSources.push(oscillator);
        releaseVoice(oscillator, [oscillator, filter, gain]);
      };

      const scheduleStep = (step, time) => {
        const note = riff[step];
        if (note !== null && note !== undefined) {
          const midi = rootMidi + note;
          tone(midi, time, stepDuration * .88, .12, 'sawtooth', 1650, -7);
          tone(midi + 12, time, stepDuration * .72, .055, 'square', 1150, 7);
        }
        tone(rootMidi - 12 + bass[step], time, stepDuration * .82, .14, 'sawtooth', 260);
        if (step % 4 === 0) kick(time);
        if (step % 8 === 4) snare(time);
      };

      const tick = () => {
        if (!this.musicMaster || !this.context) return;
        const horizon = context.currentTime + .12;
        while (this.nextMusicTime < horizon) {
          scheduleStep(this.musicStep, this.nextMusicTime);
          this.nextMusicTime += stepDuration;
          this.musicStep = (this.musicStep + 1) % riff.length;
        }
      };
      tick();
      this.musicTimer = setInterval(tick, 25);
      return true;
    }

    stopMusic() {
      if (this.musicTimer) clearInterval(this.musicTimer);
      this.musicTimer = null;
      for (const source of this.musicSources || []) {
        try { source.stop(); } catch (error) {}
      }
      for (const node of this.musicNodes || []) {
        try { if (typeof node.disconnect === 'function') node.disconnect(); } catch (error) {}
      }
      if (this.musicMaster) {
        try { this.musicMaster.disconnect(); } catch (error) {}
      }
      this.musicSources = [];
      this.musicNodes = [];
      this.musicMaster = null;
    }

    setMusicVolume(value) {
      if (!this.musicMaster) return false;
      this.musicMaster.gain.value = Math.max(0, Math.min(1, Number(value) || 0));
      return true;
    }
  }

  S7AudioManager.PROFILES = Object.keys(PROFILES);
  root.S7AudioManager = S7AudioManager;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7AudioManager;
})(typeof window !== 'undefined' ? window : globalThis);
