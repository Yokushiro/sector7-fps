(function(root){
  'use strict';

  const VOICE_PROFILES = {
    'ЛЕВ': { pitch: .72, rate: .94 },
    'АРХИВ / 07': { pitch: .68, rate: .88 },
    'НЕИЗВЕСТНЫЙ': { pitch: 1.08, rate: .91 },
    'СИСТЕМА': { pitch: .72, rate: 1 }
  };

  class S7DialogueSystem {
    constructor({ rootElement, speakerElement, textElement, promptElement, voiceEnabled = true }) {
      if (!rootElement || !speakerElement || !textElement || !promptElement) {
        throw new TypeError('DialogueSystem requires its four UI elements');
      }
      this.rootElement = rootElement;
      this.speakerElement = speakerElement;
      this.textElement = textElement;
      this.promptElement = promptElement;
      this.lines = [];
      this.index = -1;
      this.onComplete = null;
      this.active = false;
      this.mode = 'interactive';
      this.remaining = 0;
      this.voiceEnabled = Boolean(voiceEnabled);
      this.voiceApi = root.speechSynthesis || null;
      this.utteranceFactory = typeof root.SpeechSynthesisUtterance === 'function'
        ? text => new root.SpeechSynthesisUtterance(text)
        : null;
      this.selectedVoice = null;
      this.maleRussianVoice = null;
      this.voicePending = false;
      this.voiceApi?.addEventListener?.('voiceschanged', () => this.refreshVoices());
      this.refreshVoices();
    }

    refreshVoices() {
      if (!this.voiceApi || typeof this.voiceApi.getVoices !== 'function') return [];
      const voices = this.voiceApi.getVoices() || [];
      const russianVoices = voices.filter(voice => /^ru([_-]|$)/i.test(voice.lang || ''));
      this.selectedVoice = russianVoices[0] || null;
      // Web Speech exposes no gender metadata. Prefer known male Russian voice names
      // (including common Windows voices) for Lev, then fall back to a lower pitch.
      const maleName = /(pavel|yuri|yuriy|dmitri|dmitry|ivan|alex|andrei|andrey|sergei|sergey|nikolai|nikolay|maxim|maksim|mikhail|michael|male|муж|павел|юрий|дмитрий|иван|александр|андрей|сергей|николай|максим|михаил)/i;
      this.maleRussianVoice = russianVoices.find(voice => maleName.test(voice.name || '')) || null;
      return voices;
    }

    setVoiceEnabled(enabled) {
      this.voiceEnabled = Boolean(enabled);
      if (!this.voiceEnabled) this.stopVoice();
      else if (this.active) this.speakCurrentLine();
      return this.voiceEnabled;
    }

    start(lines, onComplete) {
      return this.begin(lines, onComplete, false);
    }

    startRadio(lines, onComplete) {
      return this.begin(lines, onComplete, true);
    }

    begin(lines, onComplete, radio) {
      this.stopVoice();
      if (!Array.isArray(lines) || lines.length === 0) {
        if (typeof onComplete === 'function') onComplete();
        return false;
      }
      this.lines = lines.map(line => ({
        speaker: String(line.speaker || 'СИСТЕМА'),
        text: String(line.text || ''),
        voice: line.voice || null,
        pitch: Number.isFinite(line.pitch) ? line.pitch : null,
        rate: Number.isFinite(line.rate) ? line.rate : null
      }));
      this.index = 0;
      this.mode = radio ? 'radio' : 'interactive';
      this.remaining = radio ? this.lineDuration(this.lines[0]) : 0;
      if (this.rootElement.classList) this.rootElement.classList.toggle('radio', radio);
      this.onComplete = typeof onComplete === 'function' ? onComplete : null;
      this.active = true;
      this.rootElement.hidden = false;
      this.render();
      return true;
    }

    render() {
      const line = this.lines[this.index];
      if (!line) return;
      this.speakerElement.textContent = line.speaker;
      this.textElement.textContent = line.text;
      this.promptElement.textContent = this.mode === 'radio'
        ? 'ВХОДЯЩАЯ ПЕРЕДАЧА · АВТОПРОДОЛЖЕНИЕ'
        : this.index + 1 < this.lines.length ? 'ENTER / E — ПРОДОЛЖИТЬ' : 'ENTER / E — НАЧАТЬ';
      this.speakCurrentLine();
    }

    speakCurrentLine() {
      this.stopVoice();
      const line = this.lines[this.index];
      if (!this.voiceEnabled || !this.active || !line?.text || !this.voiceApi || !this.utteranceFactory) return false;
      if (!this.selectedVoice) this.refreshVoices();
      // Never read Russian dialogue with an unrelated English voice. Captions remain available.
      if (!this.selectedVoice) return false;
      try {
        const utterance = this.utteranceFactory(line.text);
        const profile = VOICE_PROFILES[line.speaker] || VOICE_PROFILES['СИСТЕМА'];
        const isLev = /^ЛЕВ(?:\\s|$|\\/)/i.test(line.speaker);
        const voice = isLev ? (this.maleRussianVoice || this.selectedVoice) : this.selectedVoice;
        utterance.lang = voice.lang || 'ru-RU';
        utterance.voice = voice;
        utterance.pitch = Math.max(.5, Math.min(2, line.pitch ?? profile.pitch));
        utterance.rate = Math.max(.65, Math.min(1.35, line.rate ?? profile.rate));
        utterance.volume = 1;
        this.voiceApi.speak(utterance);
        this.currentUtterance = utterance;
        return true;
      } catch (error) {
        this.currentUtterance = null;
        return false;
      }
    }

    stopVoice() {
      if (this.voiceApi && (this.currentUtterance || this.voiceApi.speaking)) {
        try { this.voiceApi.cancel(); } catch (error) {}
      }
      this.currentUtterance = null;
    }

    advance() {
      if (!this.active) return false;
      this.stopVoice();
      this.index += 1;
      if (this.index >= this.lines.length) {
        this.finish();
        return true;
      }
      this.render();
      if (this.mode === 'radio') this.remaining = this.lineDuration(this.lines[this.index]);
      return true;
    }

    lineDuration(line) {
      return Math.max(3.2, Math.min(26, 2 + String(line?.text || '').length / 13));
    }

    update(deltaTime) {
      if (!this.active || this.mode !== 'radio') return false;
      this.remaining = Math.max(0, this.remaining - Math.max(0, Number(deltaTime) || 0));
      if (this.remaining <= 0) this.advance();
      return true;
    }

    finish() {
      if (!this.active) return false;
      this.stopVoice();
      this.active = false;
      this.remaining = 0;
      this.mode = 'interactive';
      if (this.rootElement.classList) this.rootElement.classList.remove('radio');
      this.rootElement.hidden = true;
      this.lines = [];
      this.index = -1;
      const callback = this.onComplete;
      this.onComplete = null;
      if (callback) callback();
      return true;
    }

    isActive() {
      return this.active;
    }
  }

  S7DialogueSystem.VOICE_PROFILES = VOICE_PROFILES;
  root.S7DialogueSystem = S7DialogueSystem;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7DialogueSystem;
})(typeof window !== 'undefined' ? window : globalThis);
