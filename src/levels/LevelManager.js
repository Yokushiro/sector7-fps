(function(root){
  'use strict';

  class S7LevelManager {
    constructor({ THREE, scene, solids, boxes }) {
      if (!THREE || !scene || !Array.isArray(solids) || !Array.isArray(boxes)) {
        throw new TypeError('LevelManager requires THREE, scene, solids and boxes');
      }
      this.THREE = THREE;
      this.scene = scene;
      this.solids = solids;
      this.boxes = boxes;
      this.definitions = new Map();
      this.current = null;
    }

    register(definition) {
      if (!definition || typeof definition.id !== 'string' || !definition.id ||
          typeof definition.build !== 'function') {
        throw new TypeError('A level definition requires an id and build(context)');
      }
      if (this.definitions.has(definition.id)) {
        throw new Error('Level is already registered: ' + definition.id);
      }
      this.definitions.set(definition.id, definition);
      return this;
    }

    disposeGroup(rootGroup) {
      const geometries = new Set();
      const materials = new Set();
      const textures = new Set();
      rootGroup.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (!object.material) return;
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of objectMaterials) {
          if (!material || material.userData?.sector7Shared) continue;
          materials.add(material);
          for (const value of Object.values(material)) {
            if (value && value.isTexture) textures.add(value);
          }
        }
      });
      geometries.forEach(geometry => {
        try { geometry.dispose(); } catch (error) {}
      });
      textures.forEach(texture => {
        try { texture.dispose(); } catch (error) {}
      });
      materials.forEach(material => {
        try { material.dispose(); } catch (error) {}
      });
      rootGroup.removeFromParent();
    }

    load(id, context) {
      const definition = this.definitions.get(id);
      if (!definition) throw new Error('Unknown level: ' + id);
      if (!context || typeof context.box !== 'function') {
        throw new TypeError('Level context must provide a box factory');
      }
      this.unload();
      const rootGroup = new this.THREE.Group();
      this.scene.add(rootGroup);
      const buildContext = {
        ...context,
        THREE: this.THREE,
        scene: rootGroup,
        solids: this.solids,
        boxes: this.boxes,
        box: (...args) => typeof args[7] === 'boolean'
          ? context.box(...args, rootGroup)
          : context.box(...args, true, rootGroup)
      };
      try {
        const metadata = definition.build(buildContext) || {};
        this.current = { ...metadata, id, root: rootGroup };
        return this.current;
      } catch (error) {
        this.disposeGroup(rootGroup);
        this.solids.length = 0;
        this.boxes.length = 0;
        throw error;
      }
    }

    unload() {
      if (this.current?.root) this.disposeGroup(this.current.root);
      this.current = null;
      this.solids.length = 0;
      this.boxes.length = 0;
    }

    getCurrent() {
      return this.current;
    }

    hasLevel(id) {
      return this.definitions.has(id);
    }
  }

  root.S7LevelManager = S7LevelManager;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7LevelManager;
})(typeof window !== 'undefined' ? window : globalThis);
