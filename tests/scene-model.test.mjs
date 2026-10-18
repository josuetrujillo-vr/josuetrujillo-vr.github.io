import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPortraitModel, makeTargets, sceneFrame, projectPoint } from '../docs/assets/scene-model.mjs';

const stages = ['portrait', 'branches', 'web', 'systems', 'vr', 'trajectory', 'signature'];
const image = (width, height, pixels) => ({ width, height, data: new Uint8ClampedArray(pixels) });
const portrait = image(3, 3, [
  0, 0, 0, 255, 180, 180, 180, 255, 0, 0, 0, 255,
  90, 90, 90, 255, 255, 255, 255, 255, 90, 90, 90, 255,
  100, 100, 100, 255, 120, 120, 120, 255, 100, 100, 100, 255,
]);

test('portrait_is_deterministic', () => {
  const model = buildPortraitModel(portrait, 120, 17);
  assert.deepEqual(model, buildPortraitModel(portrait, 120, 17));
  assert.notDeepEqual(model.positions, buildPortraitModel(portrait, 120, 18).positions);
  assert.ok(model.positions instanceof Float32Array);
  assert.ok(model.edges instanceof Uint32Array);
  assert.ok(model.release instanceof Float32Array);
  assert.equal(model.positions.length, 360);
  assert.equal(model.release.length, 120);
  for (let i = 0; i < model.positions.length; i += 3) {
    assert.ok(Math.abs(model.positions[i]) <= 1);
    assert.ok(Math.abs(model.positions[i + 1]) <= 1);
    assert.ok(Math.abs(model.positions[i + 2]) < 0.15);
  }
});

test('empty_pixels_return_empty_model', () => {
  for (const source of [image(1, 1, [0, 0, 0, 255]), image(1, 1, [255, 255, 255, 0])]) {
    assert.deepEqual(buildPortraitModel(source, 50, 17), {
      positions: new Float32Array(), edges: new Uint32Array(), release: new Float32Array(),
    });
  }
});

test('sparse_pixels_resample_safely', () => {
  const model = buildPortraitModel(image(2, 1, [255, 255, 255, 0, 200, 200, 200, 255]), 3600, 17);
  assert.equal(model.positions.length, 10800);
  assert.equal(model.release.length, 3600);
  for (let i = 0; i < 3600; i++) {
    assert.equal(model.positions[i * 3], 1, 'transparent pixel is never sampled');
    assert.equal(model.positions[i * 3 + 1], 0, 'one-pixel dimension is centered');
  }
  assert.ok(Array.from(model.positions).every(Number.isFinite));
  assert.ok(Array.from(model.edges).every(index => index < 3600));
});

test('portrait_edges_are_local_and_limited_to_two_per_point', () => {
  const model = buildPortraitModel(portrait, 120, 17);
  const degree = new Uint8Array(120);
  assert.ok(model.edges.length > 0);
  assert.equal(model.edges.length % 2, 0);
  const pairs = new Set();
  for (let i = 0; i < model.edges.length; i += 2) {
    const a = model.edges[i], b = model.edges[i + 1];
    assert.notEqual(a, b);
    assert.ok(a < 120 && b < 120);
    assert.ok(++degree[a] <= 2 && ++degree[b] <= 2);
    const key = [Math.min(a, b), Math.max(a, b)].join(':');
    assert.ok(!pairs.has(key));
    pairs.add(key);
    assert.ok(Math.hypot(model.positions[a * 3] - model.positions[b * 3],
      model.positions[a * 3 + 1] - model.positions[b * 3 + 1]) <= 0.2);
  }
});

test('portrait_releases_shoulders_and_periphery_before_face_center', () => {
  const model = buildPortraitModel(portrait, 120, 17);
  const central = [], peripheral = [];
  for (let i = 0; i < 120; i++) {
    const x = model.positions[i * 3], y = model.positions[i * 3 + 1];
    assert.ok(model.release[i] >= 0 && model.release[i] <= 1);
    if (x === 0 && y === 0) central.push(model.release[i]);
    if (Math.abs(x) === 1 || y === 1) peripheral.push(model.release[i]);
  }
  assert.ok(central.length && peripheral.length);
  assert.ok(Math.min(...central) > Math.max(...peripheral));
});

test('targets_preserve_point_identity', () => {
  for (const stage of stages) {
    const targets = makeTargets(stage, 3600, 17);
    assert.ok(targets instanceof Float32Array);
    assert.equal(targets.length, 10800);
    assert.ok(Array.from(targets).every(Number.isFinite));
    assert.deepEqual(targets, makeTargets(stage, 3600, 17));
    for (let i = 0; i < targets.length; i += 3) {
      assert.ok(Math.abs(targets[i]) <= 1 && Math.abs(targets[i + 1]) <= 1);
    }
    assert.equal(makeTargets(stage, 0, 17).length, 0);
  }
});

test('targets_describe_distinct_spatial_compositions', () => {
  const shapes = stages.map(stage => makeTargets(stage, 3600, 17));
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) assert.notDeepEqual(shapes[i], shapes[j]);
  }
  const vr = shapes[4];
  const depths = Array.from(vr).filter((_, i) => i % 3 === 2);
  assert.ok(Math.min(...depths) < -0.3 && Math.max(...depths) > 0.3, 'VR occupies a volume');
  const trajectory = shapes[5];
  assert.ok(trajectory[0] < -0.6 && trajectory[trajectory.length - 3] > 0.6, 'timeline advances left to right');
});

test('signature_uses_JT_strokes_instead_of_filled_rectangles', () => {
  const points = makeTargets('signature', 3600, 17);
  const strokes = [
    [-0.78, -0.65, -0.18, -0.65], [-0.18, -0.65, -0.18, 0.4],
    [-0.18, 0.4, -0.38, 0.65], [-0.38, 0.65, -0.66, 0.65], [-0.66, 0.65, -0.78, 0.4],
    [0.08, -0.65, 0.82, -0.65], [0.45, -0.65, 0.45, 0.65],
  ];
  const distance = (x, y, [ax, ay, bx, by]) => {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
  };
  for (let i = 0; i < points.length; i += 3) {
    assert.ok(Math.min(...strokes.map(line => distance(points[i], points[i + 1], line))) < 0.035);
  }
  for (const line of strokes) {
    assert.ok(Array.from({ length: 3600 }, (_, i) => i).some(i =>
      Math.hypot(points[i * 3] - (line[0] + line[2]) / 2,
        points[i * 3 + 1] - (line[1] + line[3]) / 2) < 0.04));
  }
});

test('resize_preserves_source_positions', () => {
  const model = buildPortraitModel(portrait, 120, 17);
  const before = model.positions.slice();
  const point = { x: model.positions[0], y: model.positions[1], z: model.positions[2] };
  const desktop = projectPoint(point, { width: 1440, height: 900 }, { x: 0, y: 0 });
  const mobile = projectPoint(point, { width: 390, height: 844 }, { x: 0, y: 0 });
  assert.notDeepEqual(desktop, mobile);
  assert.deepEqual(model.positions, before);
  assert.deepEqual(projectPoint({ x: 0, y: 0, z: 0 }, { width: 400, height: 600 }, { x: 0, y: 0 }),
    { x: 200, y: 300, scale: 1 });
});

test('projection_clamps_pointer_tilt_and_fits_visual_slot', () => {
  const viewport = { width: 400, height: 300 };
  const point = { x: 0.8, y: -0.8, z: 0.1 };
  const bounded = projectPoint(point, viewport, { x: 1, y: -1 });
  assert.deepEqual(projectPoint(point, viewport, { x: 1000, y: -1000 }), bounded);
  const neutral = projectPoint(point, viewport, { x: 0, y: 0 });
  assert.ok(Math.hypot(bounded.x - neutral.x, bounded.y - neutral.y) < 5);
  for (const x of [-1, 1]) for (const y of [-1, 1]) {
    const projected = projectPoint({ x, y, z: 0.1 }, viewport, { x: 1, y: 1 });
    assert.ok(projected.x >= 0 && projected.x <= viewport.width);
    assert.ok(projected.y >= 0 && projected.y <= viewport.height);
  }
});

test('scroll_is_reversible', () => {
  const marks = [{ stage: 'portrait', y: 0 }, { stage: 'branches', y: 100 }];
  assert.deepEqual(sceneFrame(50, marks), { from: 'portrait', to: 'branches', mix: 0.5 });
  sceneFrame(90, marks);
  assert.deepEqual(sceneFrame(50, marks), { from: 'portrait', to: 'branches', mix: 0.5 });
  assert.deepEqual(sceneFrame(-10, marks), { from: 'portrait', to: 'portrait', mix: 0 });
  assert.deepEqual(sceneFrame(0, marks), { from: 'portrait', to: 'portrait', mix: 0 });
});

test('milestones_clamp_and_handle_zero_ranges', () => {
  const marks = [{ stage: 'portrait', y: 0 }, { stage: 'branches', y: 100 },
    { stage: 'web', y: 100 }, { stage: 'systems', y: 200 }];
  assert.deepEqual(sceneFrame(100, marks), { from: 'web', to: 'systems', mix: 0 });
  assert.deepEqual(sceneFrame(150, marks), { from: 'web', to: 'systems', mix: 0.5 });
  assert.deepEqual(sceneFrame(200, marks), { from: 'systems', to: 'systems', mix: 0 });
  assert.deepEqual(sceneFrame(999, marks), { from: 'systems', to: 'systems', mix: 0 });
  assert.deepEqual(sceneFrame(10, [{ stage: 'vr', y: 20 }]), { from: 'vr', to: 'vr', mix: 0 });
  assert.deepEqual(sceneFrame(50, []), { from: 'portrait', to: 'portrait', mix: 0 });
  assert.deepEqual(sceneFrame(10, [{ stage: 'portrait', y: 10 }, { stage: 'vr', y: 10 }]),
    { from: 'vr', to: 'vr', mix: 0 });
});

test('invalid_dimensions_and_counts_are_rejected_before_pixel_access', () => {
  for (const count of [-1, 1.5, NaN, Infinity]) {
    assert.throws(() => buildPortraitModel(portrait, count, 17), RangeError);
    assert.throws(() => makeTargets('web', count, 17), RangeError);
  }
  for (const width of [0, -1, 1.5, NaN]) {
    assert.throws(() => buildPortraitModel({ width, height: 1, get data() { throw Error('read pixels'); } }, 2, 17), RangeError);
  }
  assert.throws(() => buildPortraitModel(image(2, 2, [255, 255, 255, 255]), 2, 17), RangeError);
  assert.throws(() => makeTargets('unknown', 2, 17), RangeError);
  assert.equal(buildPortraitModel(portrait, 0, 17).positions.length, 0);
});
