(function(root){
  'use strict';

  class S7DestructibleSystem {
    constructor(options = {}) {
      this.collisionCollections = Array.isArray(options.collisionCollections)
        ? options.collisionCollections.filter(Array.isArray)
        : [Array.isArray(options.collisionBoxes) ? options.collisionBoxes : []];
      this.onBreak = typeof options.onBreak === 'function' ? options.onBreak : function(){};
    }

    hit(object, point, damage = 1) {
      const state = object && object.userData && object.userData.destructible;
      if (!state || state.destroyed || object.visible === false) return { damaged: false, destroyed: false };
      const amount = Number.isFinite(damage) && damage > 0 ? damage : 1;
      state.health = Math.max(0, (Number.isFinite(state.health) ? state.health : 1) - amount);
      if (state.health > 0) return { damaged: true, destroyed: false, remaining: state.health };
      state.destroyed = true;
      object.visible = false;
      const collisionBox = object.userData.collisionBox;
      if (collisionBox) {
        // A level's local list and the active world's collision list contain the same box reference.
        // Remove it from every registered collection so destroyed props stop blocking movement and shots.
        for (const collection of this.collisionCollections) {
          let index;
          while ((index = collection.indexOf(collisionBox)) !== -1) collection.splice(index, 1);
        }
      }
      this.onBreak(object, point || null);
      return { damaged: true, destroyed: true, remaining: 0 };
    }
  }

  root.S7DestructibleSystem = S7DestructibleSystem;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7DestructibleSystem;
})(typeof window !== 'undefined' ? window : globalThis);
