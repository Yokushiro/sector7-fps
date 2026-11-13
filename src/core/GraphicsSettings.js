(function(){
  class S7GraphicsSettings {
    constructor(renderer, composer, bloom, onResize) {
      this.renderer = renderer;
      this.composer = composer;
      this.bloom = bloom;
      this.onResize = onResize;
      this.presets = {
        low:    { pixelRatio: 1,    shadows: false, bloom: false, bloomStrength: 0.35 },
        medium: { pixelRatio: 1.5,  shadows: true,  bloom: true,  bloomStrength: 0.5 },
        high:   { pixelRatio: 2,    shadows: true,  bloom: true,  bloomStrength: 0.75 }
      };
      this.settings = this.load() || { preset: 'high', ...this.presets.high };
      this.buildUI();
      this.apply();
    }

    load() {
      try {
        const value = JSON.parse(localStorage.getItem('s7-graphics-settings'));
        if (!value || !['low','medium','high','custom'].includes(value.preset)) return null;
        return value;
      } catch (_) { return null; }
    }

    save() {
      try { localStorage.setItem('s7-graphics-settings', JSON.stringify(this.settings)); } catch (_) {}
    }

    buildUI() {
      const style = document.createElement('style');
      style.textContent = `
        #s7-graphics-open{position:fixed;right:18px;top:18px;z-index:10001;padding:10px 14px;border:1px solid #65cce988;border-radius:4px;background:#07131ddd;color:#c9f4ff;font:600 13px Bahnschrift,Segoe UI,sans-serif;letter-spacing:.06em;cursor:pointer}
        #s7-graphics-panel{position:fixed;z-index:10002;left:50%;top:50%;transform:translate(-50%,-50%);width:min(390px,calc(100vw - 36px));box-sizing:border-box;padding:22px;background:rgba(3,10,16,.97);border:1px solid #65cce988;box-shadow:0 12px 60px #000c;color:#d8f4ff;font:14px Bahnschrift,Segoe UI,sans-serif;display:none}
        #s7-graphics-panel h2{margin:0 0 18px;color:#ffb26a;font-size:22px;letter-spacing:.12em}
        #s7-graphics-panel .s7-row{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:14px 0}
        #s7-graphics-panel label{opacity:.9}
        #s7-graphics-panel select{width:150px;padding:8px;background:#101e29;color:#d8f4ff;border:1px solid #52798a;border-radius:3px}
        #s7-graphics-panel input{accent-color:#55c9ed}
        #s7-graphics-panel .s7-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}
        #s7-graphics-panel button{padding:9px 15px;background:#132a37;color:#d8f4ff;border:1px solid #65cce988;border-radius:3px;cursor:pointer}
        #s7-graphics-panel .s7-note{font-size:11px;line-height:1.5;opacity:.6;margin-top:12px}
      `;
      document.head.appendChild(style);

      this.openButton = document.createElement('button');
      this.openButton.id = 's7-graphics-open';
      this.openButton.textContent = '⚙ ГРАФИКА · F2';
      this.openButton.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
      document.body.appendChild(this.openButton);

      this.panel = document.createElement('section');
      this.panel.id = 's7-graphics-panel';
      this.panel.innerHTML = `
        <h2>ГРАФИКА</h2>
        <div class="s7-row"><label for="s7-quality">Качество</label><select id="s7-quality"><option value="low">Низкое</option><option value="medium">Среднее</option><option value="high">Высокое</option><option value="custom" disabled>Вручную</option></select></div>
        <div class="s7-row"><label for="s7-resolution">Масштаб рендеринга</label><select id="s7-resolution"><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option><option value="1.75">175%</option><option value="2">200%</option></select></div>
        <div class="s7-row"><label for="s7-shadows">Динамические тени</label><input id="s7-shadows" type="checkbox"></div>
        <div class="s7-row"><label for="s7-bloom">Свечение (Bloom)</label><input id="s7-bloom" type="checkbox"></div>
        <div class="s7-note">Повышение масштаба рендеринга улучшает чёткость, но увеличивает нагрузку на видеокарту. Фактический масштаб не превысит системный pixel ratio.</div>
        <div class="s7-actions"><button id="s7-defaults">По умолчанию</button><button id="s7-close">Закрыть</button></div>
      `;
      this.panel.addEventListener('click', e => e.stopPropagation());
      document.body.appendChild(this.panel);

      this.quality = this.panel.querySelector('#s7-quality');
      this.resolution = this.panel.querySelector('#s7-resolution');
      this.shadows = this.panel.querySelector('#s7-shadows');
      this.bloomToggle = this.panel.querySelector('#s7-bloom');
      this.quality.addEventListener('change', () => {
        const preset = this.quality.value;
        if (preset !== 'custom') this.settings = { preset, ...this.presets[preset] };
        this.sync(); this.apply();
      });
      this.resolution.addEventListener('change', () => this.change('pixelRatio', Number(this.resolution.value)));
      this.shadows.addEventListener('change', () => this.change('shadows', this.shadows.checked));
      this.bloomToggle.addEventListener('change', () => this.change('bloom', this.bloomToggle.checked));
      this.panel.querySelector('#s7-defaults').addEventListener('click', () => {
        this.settings = { preset: 'high', ...this.presets.high }; this.sync(); this.apply();
      });
      this.panel.querySelector('#s7-close').addEventListener('click', () => this.toggle(false));
      this.sync();
      document.addEventListener('keydown', e => {
        if (e.code === 'F2') { e.preventDefault(); this.toggle(); }
        if (e.code === 'Escape' && this.panel.style.display === 'block') this.toggle(false);
      });
    }

    change(key, value) {
      this.settings[key] = value;
      this.settings.preset = 'custom';
      this.sync();
      this.apply();
    }

    sync() {
      this.quality.value = this.settings.preset;
      this.resolution.value = String(this.settings.pixelRatio);
      this.shadows.checked = !!this.settings.shadows;
      this.bloomToggle.checked = !!this.settings.bloom;
    }

    apply() {
      const ratio = Math.min(window.devicePixelRatio || 1, this.settings.pixelRatio || 1);
      this.renderer.setPixelRatio(ratio);
      this.composer.setPixelRatio(ratio);
      this.renderer.shadowMap.enabled = !!this.settings.shadows;
      this.bloom.enabled = !!this.settings.bloom;
      this.bloom.strength = this.settings.bloomStrength || 0.5;
      this.onResize();
      this.save();
    }

    toggle(force) {
      const show = typeof force === 'boolean' ? force : this.panel.style.display !== 'block';
      this.panel.style.display = show ? 'block' : 'none';
    }
  }
  window.S7GraphicsSettings = S7GraphicsSettings;
})();
