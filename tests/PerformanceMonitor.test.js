const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('performance monitor resets renderer counters after each sampling window', () => {
  const source = fs.readFileSync('src/core/PerformanceMonitor.js', 'utf8');
  const panel = { style: {}, textContent: '' };
  const context = {
    window: {},
    document: {
      createElement() { return panel; },
      body: { appendChild() {} }
    }
  };
  vm.runInNewContext(source, context);
  const monitor = new context.window.S7PerformanceMonitor();
  let resets = 0;
  const renderer = {
    info: {
      render: { calls: 42, triangles: 12000 },
      memory: { geometries: 80, textures: 24 },
      reset() { resets++; }
    }
  };

  monitor.update(renderer, 1000);
  monitor.update(renderer, 1300);

  assert.equal(resets, 1);
  assert.match(panel.textContent, /DRAW CALLS:\s*42/);
  assert.match(panel.textContent, /TRIANGLES:\s*12,000/);
});
