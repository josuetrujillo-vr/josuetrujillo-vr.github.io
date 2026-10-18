import test from 'node:test';
import assert from 'node:assert/strict';
import { createScene } from '../docs/assets/scene-renderer.mjs';

const stages = ['portrait', 'branches', 'web', 'systems', 'vr', 'trajectory', 'signature'];
// Canvas/image boundaries are the only browser doubles; all geometry and lifecycle code is real.
function fixture({ readError = false, empty = false } = {}) {
  const draws = [], reads = [], sourceDraws = [], fills = [], attrs = new Map();
  let path = [];
  const elements = stages.map(stage => ({
    dataset: { sceneSlot: stage },
    setAttribute: name => attrs.set(`${stage}:${name}`, true),
    removeAttribute: name => attrs.delete(`${stage}:${name}`),
  }));
  const ctx = {
    clearRect() {}, setTransform() {}, save() {}, restore() {}, beginPath() { path = []; },
    rect(...rect) { path.push(rect); }, clip() {}, moveTo() {}, lineTo() {}, stroke() {},
    fill() { fills.push(path.slice()); }, arc() {},
    fillRect() {}, drawImage(...args) { draws.push(args); },
  };
  const source = {
    drawImage(...args) { sourceDraws.push(args); },
    getImageData(x, y, width, height) {
      reads.push({ width, height });
      if (readError) throw new Error('SecurityError');
      const data = new Uint8ClampedArray(width * height * 4);
      if (!empty) data.fill(255);
      return { width, height, data };
    },
  };
  const doc = {
    createElement: () => ({ getContext: () => source }),
    querySelectorAll: () => elements,
  };
  const classes = new Set();
  const canvas = { ownerDocument: doc, getContext: () => ctx, style: {}, hidden: false,
    classList: { add: name => classes.add(name) }, width: 0, height: 0 };
  const portrait = { naturalWidth: 1254, naturalHeight: 1254, ownerDocument: doc };
  const slots = Object.fromEntries(stages.map((stage, i) => [stage,
    { left: 700, top: 100 + i * 750, width: 500, height: 500 }]));
  const size = { slots, viewport: { width: 1440, height: 900 }, dpr: 3, compact: false };
  const render = (scene, frame = { from: 'portrait', to: 'portrait', mix: 0 }) =>
    scene.render({ frame, scrollY: 0, pointer: { x: 0, y: 0 }, ambientTime: 0 });
  return { canvas, portrait, ctx, draws, sourceDraws, reads, fills, attrs, size, render };
}

test('async_bitmap_extraction_waits_without_hiding_portrait_and_closes_source', async () => {
  const f = fixture(), calls = [];
  f.portrait.naturalHeight = 627;
  let resolveBitmap, closed = 0;
  const bitmap = { width: 256, height: 128, close() { closed++; } };
  f.canvas.ownerDocument.defaultView = { createImageBitmap(...args) {
    calls.push(args); return new Promise(resolve => { resolveBitmap = resolve; });
  } };
  const preparation = createScene(f.canvas, f.portrait);
  assert.equal(f.reads.length, 0);
  assert.equal(f.attrs.size, 0);
  assert.equal(f.portrait.hidden, undefined);
  assert.deepEqual(calls, [[f.portrait, { resizeWidth: 256, resizeHeight: 128 }]]);
  resolveBitmap(bitmap);
  const scene = await preparation;
  assert(scene);
  assert.deepEqual(f.sourceDraws, [[bitmap, 0, 0, 256, 128]]);
  assert.equal(closed, 1);
  scene.resize(f.size); f.render(scene);
  assert.equal(f.draws[0][0], f.portrait, 'visible portrait retains its original resolution');
  scene.dispose(); assert.equal(closed, 1);
});

test('bitmap_failure_preserves_fallback_and_read_failure_closes_bitmap', async () => {
  const rejected = fixture();
  rejected.canvas.ownerDocument.defaultView = { createImageBitmap: async () => { throw new Error('decode failed'); } };
  assert.equal(await createScene(rejected.canvas, rejected.portrait), null);
  assert.equal(rejected.reads.length, 0);
  assert.equal(rejected.attrs.size, 0);
  const unreadable = fixture({ readError: true });
  let closed = 0;
  unreadable.canvas.ownerDocument.defaultView = { createImageBitmap: async () => ({ close() { closed++; } }) };
  assert.equal(await createScene(unreadable.canvas, unreadable.portrait), null);
  assert.equal(closed, 1);
  assert.equal(unreadable.attrs.size, 0);
});

test('unavailable_context_preserves_fallback', async () => {
  const portrait = { naturalWidth: 1254, naturalHeight: 1254 };
  const canvas = { getContext: () => null };
  assert.equal(await createScene(canvas, portrait), null);
  assert.equal(portrait.hidden, undefined);
});

test('unloaded_portrait_preserves_fallback', async () => {
  const canvas = { getContext() { throw new Error('must not create buffers or contexts'); } };
  assert.equal(await createScene(canvas, { naturalWidth: 0, naturalHeight: 0 }), null);
});

test('unreadable_or_empty_pixels_preserve_fallback', async () => {
  for (const options of [{ readError: true }, { empty: true }]) {
    const f = fixture(options);
    assert.equal(await createScene(f.canvas, f.portrait), null);
    assert.equal(f.attrs.size, 0);
  }
});

test('prepares_pixels_once_and_only_hides_fallback_after_successful_draw', async () => {
  const f = fixture();
  const scene = await createScene(f.canvas, f.portrait);
  assert.equal(f.attrs.size, 0);
  assert.equal(f.reads.length, 1);
  assert.deepEqual(f.reads[0], { width: 256, height: 256 });
  scene.resize(f.size);
  f.render(scene);
  f.render(scene, { from: 'portrait', to: 'branches', mix: 0.3 });
  scene.resize(f.size);
  assert.equal(f.attrs.size, 0);
  f.render(scene);
  assert.equal(f.reads.length, 1);
  assert.equal(f.attrs.has('portrait:data-scene-active'), true);
  assert.equal(f.canvas.hidden, false);
});

test('first_portrait_draw_preserves_exact_dom_size_and_document_origin', async () => {
  const f = fixture(), scene = await createScene(f.canvas, f.portrait);
  scene.resize(f.size);
  f.render(scene);
  assert.deepEqual(f.draws[0], [f.portrait, 700, 100, 500, 500]);
  assert.equal(f.draws.length, 1);
  assert.equal(f.canvas.width, 2160);
  assert.equal(f.canvas.height, 1350);
  scene.resize({ ...f.size, compact: true });
  assert.equal(f.canvas.width, 1440);
  assert.equal(f.canvas.height, 900);
});

test('portrait_bands_keep_face_in_place_until_45_percent_and_release_shoulders_first', async () => {
  const f = fixture(), scene = await createScene(f.canvas, f.portrait);
  scene.resize(f.size);
  f.render(scene, { from: 'portrait', to: 'branches', mix: 0.4 });
  const bands = f.draws.filter(args => args.length === 9);
  // Retained regions share one source draw: independently resampling adjacent crops
  // creates dark seams through the otherwise stationary face.
  const retained = f.draws.filter(args => args.length === 5);
  assert.deepEqual(retained, [[f.portrait, 700, 100, 500, 500]]);
  const releasedCenter = bands.filter(([, x, y, w, h]) => x + w / 2 > 1254 * 0.4
    && x + w / 2 < 1254 * 0.6 && y + h / 2 > 1254 * 0.35 && y + h / 2 < 1254 * 0.5);
  assert.equal(releasedCenter.length, 0);
  assert.ok(bands.some(([, sx, sy, , , dx, dy]) => sy > 1254 * 0.7
    && (Math.abs(dx - (700 + sx / 1254 * 500)) > 1 || Math.abs(dy - (100 + sy / 1254 * 500)) > 1)));
  assert.ok(bands.every(([, , , width, height]) => width > height * 6),
    'detached pieces remain thin filament strips, avoiding a brick-grid breakup');
});

test('lost_context_restores_static_fallback_even_when_drawing_does_not_throw', async () => {
  const f = fixture(), scene = await createScene(f.canvas, f.portrait);
  scene.resize(f.size);
  f.render(scene);
  f.ctx.isContextLost = () => true;
  f.render(scene);
  assert.equal(f.canvas.hidden, true);
  assert.equal(f.attrs.size, 0);
});

test('draw_failure_restores_fallback_and_dispose_is_idempotent', async () => {
  const f = fixture(), scene = await createScene(f.canvas, f.portrait);
  scene.resize(f.size);
  f.render(scene);
  f.ctx.drawImage = () => { throw new Error('context lost'); };
  assert.doesNotThrow(() => f.render(scene));
  assert.equal(f.attrs.size, 0);
  assert.equal(f.canvas.hidden, true);
  assert.doesNotThrow(() => { scene.dispose(); scene.dispose(); f.render(scene); });
});

test('midpoint_retains_visible_geometry_in_both_slots_and_compact_uses_1600_stable_points', async () => {
  const f = fixture(), scene = await createScene(f.canvas, f.portrait);
  f.size.slots.web = { left: 700, top: 100, width: 500, height: 500 };
  f.size.slots.systems = { left: 40, top: 100, width: 500, height: 500 };
  scene.resize(f.size);
  f.render(scene, { from: 'web', to: 'systems', mix: 0.5 });
  const full = f.fills.flat();
  assert.equal(full.length, 7200);
  assert.equal(full.filter(([x, y]) => x >= 700 && x <= 1200 && y >= 100 && y <= 600).length, 3600);
  assert.equal(full.filter(([x, y]) => x >= 40 && x <= 540 && y >= 100 && y <= 600).length, 3600);
  assert.equal(f.attrs.has('portrait:data-scene-active'), false);
  assert.equal(f.attrs.has('web:data-scene-active'), true);
  assert.equal(f.attrs.has('systems:data-scene-active'), true);
  f.fills.length = 0;
  scene.resize({ ...f.size, compact: true });
  f.render(scene, { from: 'web', to: 'systems', mix: 0.5 });
  const compact = f.fills.flat();
  assert.equal(compact.length, 3200);
  for (const rect of compact) assert.ok(full.some(fullRect => fullRect.every((value, i) => value === rect[i])));
});
