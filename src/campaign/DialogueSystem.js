(function(root){
  'use strict';

  class S7DialogueSystem {
    constructor({ rootElement, speakerElement, textElement, promptElement }) {
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
    }

    start(lines, onComplete) {
      if (!Array.isArray(lines) || lines.length === 0) {
        if (typeof onComplete === 'function') onComplete();
        return false;
      }
      this.lines = lines.map(line => ({
        speaker: String(line.speaker || 'СИСТЕМА'),
        text: String(line.text || '')
      }));
      this.index = 0;
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
      this.promptElement.textContent = this.index + 1 < this.lines.length
        ? 'ENTER / E — ПРОДОЛЖИТЬ'
        : 'ENTER / E — НАЧАТЬ';
    }

    advance() {
      if (!this.active) return false;
      this.index += 1;
      if (this.index >= this.lines.length) {
        this.finish();
        return true;
      }
      this.render();
      return true;
    }

    finish() {
      if (!this.active) return false;
      this.active = false;
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

  root.S7DialogueSystem = S7DialogueSystem;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7DialogueSystem;
})(typeof window !== 'undefined' ? window : globalThis);
