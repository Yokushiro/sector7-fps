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
      this.prepared = new Map();
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

    build(id, context) {
      const definition = this.definitions.get(id);
      if (!definition) throw new Error('Unknown level: ' + id);
      if (!context || typeof context.box !== 'function') {
        throw new TypeError('Level context must provide a box factory');
      }
      const rootGroup = new this.THREE.Group();
      rootGroup.visible = false;
      rootGroup.userData = rootGroup.userData || {};
      const solids = [];
      const boxes = [];
      rootGroup.userData.s7Solids = solids;
      rootGroup.userData.s7Boxes = boxes;
      this.scene.add(rootGroup);
      const buildContext = {
        ...context,
        mat: (...args) => context.mat(args[0], args[1], args[2], args[3] ?? 0, args[4] ?? 0xffffff, id),
        THREE: this.THREE,
        scene: rootGroup,
        solids,
        boxes,
        removeCollisionBox: collisionBox => {
          for (const collection of [boxes, this.boxes]) {
            const index = collection.indexOf(collisionBox);
            if (index !== -1) collection.splice(index, 1);
          }
        },
        box: (...args) => typeof args[7] === 'boolean'
          ? context.box(...args, rootGroup)
          : context.box(...args, true, rootGroup)
      };
      try {
        const metadata = definition.build(buildContext) || {};
        return { ...metadata, id, root: rootGroup, solids, boxes };
      } catch (error) {
        this.disposeGroup(rootGroup);
        throw error;
      }
    }

    activate(level) {
      level.root.visible = true;
      this.solids.push(...level.solids);
      this.boxes.push(...level.boxes);
      this.current = level;
      return level;
    }

    prepare(id, context) {
      if (this.current?.id === id) return this.current;
      if (this.prepared.has(id)) return this.prepared.get(id);
      const level = this.build(id, context);
      this.prepared.set(id, level);
      return level;
    }

    load(id, context) {
      if (!this.definitions.has(id)) throw new Error('Unknown level: ' + id);
      this.unload();
      let level = this.prepared.get(id);
      if (level) this.prepared.delete(id);
      else level = this.build(id, context);
      return this.activate(level);
    }

    discardPrepared(id) {
      const level = this.prepared.get(id);
      if (!level) return false;
      this.prepared.delete(id);
      this.disposeGroup(level.root);
      return true;
    }

    unload() {
      if (!this.current) return;
      for (const item of this.current.solids) {
        const index = this.solids.indexOf(item);
        if (index !== -1) this.solids.splice(index, 1);
      }
      for (const item of this.current.boxes) {
        const index = this.boxes.indexOf(item);
        if (index !== -1) this.boxes.splice(index, 1);
      }
      this.disposeGroup(this.current.root);
      this.current = null;
    }

    getCurrent() {
      return this.current;
    }

    getPrepared(id) {
      return this.prepared.get(id) || null;
    }

    hasLevel(id) {
      return this.definitions.has(id);
    }
  }

  root.S7LevelManager = S7LevelManager;
  if (typeof module !== 'undefined' && module.exports) module.exports = S7LevelManager;
})(typeof window !== 'undefined' ? window : globalThis);
