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
      this.mode = 'interactive';
      this.remaining = 0;
    }

    start(lines, onComplete) {
      return this.begin(lines, onComplete, false);
    }

    startRadio(lines, onComplete) {
      return this.begin(lines, onComplete, true);
    }

    begin(lines, onComplete, radio) {
      if (!Array.isArray(lines) || lines.length === 0) {
        if (typeof onComplete === 'function') onComplete();
        return false;
      }
      this.lines = lines.map(line => ({
        speaker: String(line.speaker || 'СИСТЕМА'),
        text: String(line.text || '')
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
    }

    advance() {
      if (!this.active) return false;
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
      return Math.max(2.8, Math.min(7, 1.7 + String(line?.text || '').length * .035));
    }

    update(deltaTime) {
      if (!this.active || this.mode !== 'radio') return false;
      this.remaining = Math.max(0, this.remaining - Math.max(0, Number(deltaTime) || 0));
      if (this.remaining <= 0) this.advance();
      return true;
    }

    finish() {
      if (!this.active) return false;
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

  root.S7DialogueSystem = S7DialogueSystem;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7DialogueSystem;
})(typeof window !== 'undefined' ? window : globalThis);
