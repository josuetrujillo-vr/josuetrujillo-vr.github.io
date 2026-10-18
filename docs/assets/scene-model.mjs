const STAGES = ['portrait', 'branches', 'web', 'systems', 'vr', 'trajectory', 'signature'];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function validateCount(count) {
  if (!Number.isSafeInteger(count) || count < 0 || count > 0xffffffff) {
    throw new RangeError('Point count must be a nonnegative integer.');
  }
}

function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const emptyModel = () => ({
  positions: new Float32Array(), edges: new Uint32Array(), release: new Float32Array(),
});

// Build local edges once. Active buckets and a bounded candidate scan avoid an all-pairs search.
function localEdges(positions) {
  const count = positions.length / 3, buckets = new Map(), keys = [];
  const cell = 0.13, degree = new Uint8Array(count), edges = [];
  for (let i = 0; i < count; i++) {
    const key = `${Math.floor(positions[i * 3] / cell)},${Math.floor(positions[i * 3 + 1] / cell)}`;
    keys.push(key);
    if (!buckets.has(key)) buckets.set(key, new Set());
    buckets.get(key).add(i);
  }
  for (let i = 0; i < count; i++) {
    buckets.get(keys[i]).delete(i);
    if (degree[i] === 2) continue;
    const x = positions[i * 3], y = positions[i * 3 + 1];
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell), candidates = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const nearby = buckets.get(`${cx + dx},${cy + dy}`);
      if (!nearby) continue;
      let examined = 0;
      for (const j of nearby) {
        const distance = (x - positions[j * 3]) ** 2 + (y - positions[j * 3 + 1]) ** 2;
        if (distance <= 0.18 ** 2) candidates.push({ j, distance });
        if (++examined === 16) break;
      }
    }
    candidates.sort((a, b) => a.distance - b.distance || a.j - b.j);
    for (const { j } of candidates) {
      if (degree[j] === 2) continue;
      edges.push(i, j);
      degree[i]++;
      if (++degree[j] === 2) buckets.get(keys[j]).delete(j);
      if (degree[i] === 2) break;
    }
  }
  return new Uint32Array(edges);
}

/** Sample only nonblack, nontransparent source pixels; coordinates use image Y (downward). */
export function buildPortraitModel(source, count = 3600, seed = 17) {
  validateCount(count);
  const width = source?.width, height = source?.height;
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0
    || !Number.isSafeInteger(width * height * 4)) {
    throw new RangeError('Image dimensions must be positive integers.');
  }
  const data = source.data;
  if (!(data instanceof Uint8ClampedArray)) throw new TypeError('Image data must be RGBA Uint8ClampedArray.');
  if (data.length < width * height * 4) throw new RangeError('RGBA data is shorter than its dimensions.');
  if (!count) return emptyModel();
  const pixels = [];
  for (let pixel = 0; pixel < width * height; pixel++) {
    const offset = pixel * 4;
    if (data[offset + 3] > 0 && data[offset] + data[offset + 1] + data[offset + 2] > 0) pixels.push(pixel);
  }
  if (!pixels.length) return emptyModel();
  const random = randomGenerator(seed), positions = new Float32Array(count * 3), release = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // Stratification preserves the whole silhouette when downsampling and safely repeats sparse sources.
    const pixel = pixels[Math.floor((i + random()) * pixels.length / count)];
    const x = width === 1 ? 0 : (pixel % width) / (width - 1) * 2 - 1;
    const y = height === 1 ? 0 : Math.floor(pixel / width) / (height - 1) * 2 - 1;
    const offset = pixel * 4;
    const light = (data[offset] + data[offset + 1] + data[offset + 2]) / 765;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = (light - 0.5) * 0.08 + (random() - 0.5) * 0.012;
    const faceCenter = Math.exp(-3.5 * (x * x + (y + 0.18) ** 2));
    release[i] = clamp(0.12 + 0.8 * faceCenter - 0.15 * Math.max(0, y), 0.02, 0.95);
  }
  return { positions, edges: localEdges(positions), release };
}

function rectangle(x, y, width, height, z = 0) {
  return [[x, y, z], [x + width, y, z], [x + width, y + height, z], [x, y + height, z], [x, y, z]];
}

function targetPaths(stage) {
  switch (stage) {
    case 'portrait': {
      // Generic neutral fallback only. The renderer uses Model.positions for the actual portrait.
      const outline = Array.from({ length: 65 }, (_, i) => {
        const angle = i / 64 * Math.PI * 2;
        return [Math.cos(angle) * 0.36, Math.sin(angle) * 0.52 - 0.2, 0];
      });
      return [outline, [[-0.22, 0.23], [-0.22, 0.48], [-0.72, 0.7], [-0.86, 0.9]],
        [[0.22, 0.23], [0.22, 0.48], [0.72, 0.7], [0.86, 0.9]]];
    }
    case 'branches':
      return [
        [[0, 0.8], [0, 0.35], [-0.52, -0.15], [-0.7, -0.75]],
        [[0, 0.35], [0, -0.25], [0, -0.85]],
        [[0, 0.35], [0.52, -0.15], [0.7, -0.75]],
        [[-0.52, -0.15], [-0.87, -0.4]], [[0, -0.25], [-0.22, -0.5]],
        [[0.52, -0.15], [0.87, -0.4]],
      ];
    case 'web':
      return [
        rectangle(-0.82, -0.64, 1.12, 0.86, -0.22), rectangle(-0.24, -0.18, 1.06, 0.86, 0.2),
        [[-0.82, -0.47, -0.22], [0.3, -0.47, -0.22]],
        [[-0.24, -0.01, 0.2], [0.82, -0.01, 0.2]],
        rectangle(-0.7, -0.34, 0.28, 0.39, -0.22),
        [[-0.3, -0.28, -0.22], [0.15, -0.28, -0.22]],
        [[-0.3, -0.08, -0.22], [0.05, -0.08, -0.22]],
        rectangle(-0.1, 0.14, 0.76, 0.18, 0.2), rectangle(-0.1, 0.43, 0.34, 0.12, 0.2),
      ];
    case 'systems':
      return [
        rectangle(-0.9, -0.22, 0.42, 0.44), rectangle(-0.21, -0.22, 0.42, 0.44),
        rectangle(0.48, -0.22, 0.42, 0.44), rectangle(-0.21, 0.57, 0.42, 0.25),
        [[-0.48, 0], [-0.21, 0]], [[-0.31, -0.08], [-0.21, 0], [-0.31, 0.08]],
        [[0.21, 0], [0.48, 0]], [[0.38, -0.08], [0.48, 0], [0.38, 0.08]],
        [[0, 0.22], [0, 0.57]], [[-0.08, 0.47], [0, 0.57], [0.08, 0.47]],
        [[0.69, -0.22], [0.69, -0.6], [-0.69, -0.6], [-0.69, -0.22]],
      ];
    case 'vr': {
      const paths = [rectangle(-0.62, -0.62, 1.24, 1.24, -0.46), rectangle(-0.62, -0.62, 1.24, 1.24, 0.46)];
      for (const x of [-0.62, 0.62]) for (const y of [-0.62, 0.62]) paths.push([[x, y, -0.46], [x, y, 0.46]]);
      paths.push([[-0.62, 0.62, 0], [0.62, 0.62, 0]], [[0, 0.62, -0.46], [0, 0.62, 0.46]],
        [[-0.23, -0.1, 0.15], [-0.23, 0.25, 0.15], [0.23, 0.25, 0.15], [0.23, -0.1, 0.15], [-0.23, -0.1, 0.15]]);
      return paths;
    }
    case 'trajectory':
      return [
        [[-0.88, 0.42], [-0.5, 0.42], [-0.12, 0.12], [0.3, 0.12], [0.65, -0.3]],
        [[-0.5, 0.42], [-0.5, 0.02]], [[-0.12, 0.12], [-0.12, -0.28]],
        [[0.3, 0.12], [0.3, -0.48]], [[0.65, -0.3], [0.65, -0.7]],
        [[0.65, -0.3], [0.88, -0.48]],
      ];
    case 'signature':
      return [
        [[-0.78, -0.65], [-0.18, -0.65], [-0.18, 0.4], [-0.38, 0.65], [-0.66, 0.65], [-0.78, 0.4]],
        [[0.08, -0.65], [0.82, -0.65]], [[0.45, -0.65], [0.45, 0.65]],
      ];
  }
}

/** Every target has the same index order/count so callers can morph typed arrays directly. */
export function makeTargets(stage, count = 3600, seed = 17) {
  validateCount(count);
  if (!STAGES.includes(stage)) throw new RangeError(`Unknown scene stage: ${stage}`);
  const positions = new Float32Array(count * 3), segments = [];
  let totalLength = 0;
  for (const path of targetPaths(stage)) for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1], (b[2] ?? 0) - (a[2] ?? 0));
    if (length) segments.push({ a, b, start: totalLength, end: totalLength += length });
  }
  const random = randomGenerator(seed);
  let segment = 0;
  for (let i = 0; i < count; i++) {
    const distance = (i + random()) / count * totalLength;
    while (segment < segments.length - 1 && distance > segments[segment].end) segment++;
    const { a, b, start, end } = segments[segment];
    const t = (distance - start) / (end - start);
    for (let axis = 0; axis < 3; axis++) {
      positions[i * 3 + axis] = (a[axis] ?? 0) + ((b[axis] ?? 0) - (a[axis] ?? 0)) * t
        + (random() - 0.5) * 0.008;
    }
  }
  return positions;
}

/** Pure scroll lookup: coincident milestones resolve to the last chapter already reached. */
export function sceneFrame(scrollY, milestones) {
  const still = stage => ({ from: stage, to: stage, mix: 0 });
  if (!milestones.length) return still('portrait');
  if (scrollY < milestones[0].y) return still(milestones[0].stage);
  let current = 0;
  while (current + 1 < milestones.length && scrollY >= milestones[current + 1].y) current++;
  if (current === 0 && scrollY === milestones[0].y) return still(milestones[0].stage);
  if (current === milestones.length - 1) return still(milestones[current].stage);
  const from = milestones[current], to = milestones[current + 1];
  return { from: from.stage, to: to.stage, mix: clamp((scrollY - from.y) / (to.y - from.y), 0, 1) };
}

/** Project into a slot-local rectangle; the renderer adds the slot's page origin. */
export function projectPoint(point, viewport, pointer = { x: 0, y: 0 }) {
  const yaw = clamp(pointer.x, -1, 1) * 0.035, pitch = clamp(pointer.y, -1, 1) * 0.035;
  const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
  const yawZ = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  const y = point.y * Math.cos(pitch) - yawZ * Math.sin(pitch);
  const z = point.y * Math.sin(pitch) + yawZ * Math.cos(pitch);
  const scale = 3 / (3 - clamp(z, -2, 2));
  const size = Math.min(viewport.width, viewport.height) * 0.42;
  return { x: viewport.width / 2 + x * size * scale, y: viewport.height / 2 + y * size * scale, scale };
}
