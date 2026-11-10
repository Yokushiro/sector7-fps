(function(root){
  'use strict';

  class S7InteractionSystem {
    constructor(interactables) {
      const source = Array.isArray(interactables) ? interactables : [];
      this.items = new Map();
      this.used = new Set();
      for (const item of source) {
        if (!item || typeof item.id !== 'string' || !Number.isFinite(item.x) || !Number.isFinite(item.z)) {
          throw new TypeError('Each interactable requires an id and finite x/z coordinates');
        }
        if (this.items.has(item.id)) throw new Error('Duplicate interactable id: ' + item.id);
        this.items.set(item.id, {
          ...item,
          dialogue: Array.isArray(item.dialogue) ? item.dialogue.map(line => ({ ...line })) : []
        });
      }
    }

    findNearby(position, maxDistance = 2.8) {
      if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.z)) return null;
      const limit = Math.max(0, Number(maxDistance) || 0);
      let nearest = null;
      let nearestDistance = limit;
      for (const item of this.items.values()) {
        if (this.used.has(item.id)) continue;
        const distance = Math.hypot(position.x - item.x, position.z - item.z);
        if (distance <= nearestDistance) {
          nearest = item;
          nearestDistance = distance;
        }
      }
      return nearest ? { id: nearest.id, label: nearest.label || 'ИЗУЧИТЬ ЗАПИСЬ', distance: nearestDistance } : null;
    }

    activate(id) {
      const item = this.items.get(id);
      if (!item || this.used.has(id)) return null;
      this.used.add(id);
      return { ...item, dialogue: item.dialogue.map(line => ({ ...line })) };
    }

    isUsed(id) {
      return this.used.has(id);
    }
  }

  root.S7InteractionSystem = S7InteractionSystem;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7InteractionSystem;
})(typeof window !== 'undefined' ? window : globalThis);
