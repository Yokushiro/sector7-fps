(function(){
  class S7HitFeedback {
    constructor(duration = .16) {
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new RangeError('Hit feedback duration must be positive');
      }
      this.duration = duration;
      this.remaining = 0;
    }

    trigger(element, result = {}) {
      if (!element || !element.classList) {
        throw new TypeError('A hit marker element is required');
      }
      element.classList.remove('headshot', 'kill', 'visible');
      if (result.headshot) element.classList.add('headshot');
      if (result.killed) element.classList.add('kill');
      element.classList.add('visible');
      this.remaining = this.duration;
    }

    update(dt, element) {
      if (!Number.isFinite(dt) || dt < 0) {
        throw new RangeError('Delta time must be a non-negative finite number');
      }
      if (this.remaining <= 0) return false;
      this.remaining = Math.max(0, this.remaining - dt);
      if (this.remaining <= 1e-6) {
        this.remaining = 0;
        if (element && element.classList) {
          element.classList.remove('visible', 'headshot', 'kill');
        }
        return true;
      }
      return false;
    }

    clear(element) {
      this.remaining = 0;
      if (element && element.classList) {
        element.classList.remove('visible', 'headshot', 'kill');
      }
    }
  }

  window.S7HitFeedback = S7HitFeedback;
})();
