(function(){
  class S7PerformanceMonitor {
    constructor() {
      this.visible = false;
      this.frames = 0;
      this.windowStart = 0;
      this.panel = document.createElement('div');
      this.panel.id = 's7-performance-monitor';
      Object.assign(this.panel.style, {
        position: 'fixed',
        top: '12px',
        right: '12px',
        zIndex: '10000',
        display: 'none',
        padding: '10px 12px',
        minWidth: '190px',
        color: '#b9f4ff',
        background: 'rgba(2, 9, 15, .86)',
        border: '1px solid rgba(90, 210, 255, .45)',
        boxShadow: '0 0 18px rgba(0, 170, 220, .12)',
        font: '12px/1.55 Consolas, monospace',
        letterSpacing: '.03em',
        pointerEvents: 'none',
        whiteSpace: 'pre'
      });
      this.panel.textContent = 'SECTOR 7 PERFORMANCE\nОжидание данных…';
      document.body.appendChild(this.panel);
    }

    toggle() {
      this.visible = !this.visible;
      this.panel.style.display = this.visible ? 'block' : 'none';
    }

    update(renderer, now) {
      this.frames++;
      if (!this.windowStart) this.windowStart = now;
      const elapsed = now - this.windowStart;
      if (elapsed < 250) return;

      const fps = this.frames * 1000 / elapsed;
      const frameMs = elapsed / this.frames;
      const info = renderer.info;
      this.panel.textContent = [
        'SECTOR 7  |  PERFORMANCE',
        'FPS:       ' + fps.toFixed(0),
        'FRAME:     ' + frameMs.toFixed(2) + ' ms',
        'DRAW CALLS:' + String(info.render.calls).padStart(5),
        'TRIANGLES: ' + info.render.triangles.toLocaleString('ru-RU'),
        'GEOMETRIES:' + String(info.memory.geometries).padStart(4),
        'TEXTURES:  ' + String(info.memory.textures).padStart(4),
        '',
        'F3 — скрыть / показать'
      ].join('\n');
      // renderer.info is configured with autoReset=false so the overlay can
      // report a complete frame window across the post-processing passes.
      // Reset only after sampling to avoid lifetime-cumulative draw-call counts.
      if (typeof info.reset === 'function') info.reset();
      this.frames = 0;
      this.windowStart = now;
    }
  }

  window.S7PerformanceMonitor = S7PerformanceMonitor;
})();
