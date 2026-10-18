import { buildPortraitModel, makeTargets, projectPoint } from './scene-model.mjs';

const STAGES = ['portrait', 'branches', 'web', 'systems', 'vr', 'trajectory', 'signature'];
const COUNT = 3600;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const validRect = rect => rect && [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
  && rect.width > 0 && rect.height > 0;

/** Canvas2D is optional. The original HTML remains the recovery path at every boundary. */
export async function createScene(canvas, portrait) {
  // Check these before allocating buffers, including the extraction canvas.
  if (!portrait?.naturalWidth || !portrait?.naturalHeight) return null;
  let ctx;
  try { ctx = canvas?.getContext('2d', { alpha: true }); } catch { return null; }
  if (!ctx) return null;

  let model, targets, bands, subsets;
  const doc = canvas.ownerDocument;
  try {
    const source = doc.createElement('canvas');
    const scale = Math.min(1, 256 / Math.max(portrait.naturalWidth, portrait.naturalHeight));
    source.width = Math.max(1, Math.round(portrait.naturalWidth * scale));
    source.height = Math.max(1, Math.round(portrait.naturalHeight * scale));
    let bitmap, pixels;
    try {
      // Decode/resample asynchronously: drawing the full WebP into a tiny canvas
      // can otherwise force a long synchronous pixel decode despite img.decode().
      if (doc.defaultView?.createImageBitmap) {
        bitmap = await doc.defaultView.createImageBitmap(portrait,
          { resizeWidth: source.width, resizeHeight: source.height });
        // A resolved bitmap promise can resume in the same browser task as its
        // native decode; separate that work from pixel readback as well.
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      const reader = source.getContext('2d', { willReadFrequently: true });
      if (!reader) return null;
      reader.drawImage(bitmap || portrait, 0, 0, source.width, source.height);
      pixels = reader.getImageData(0, 0, source.width, source.height);
    } finally { bitmap?.close(); }
    // Extraction and neighborhood preparation are separate browser tasks; the HTML
    // stays visible while either finishes, without a worker or dependency.
    await new Promise(resolve => setTimeout(resolve, 0));
    model = buildPortraitModel(pixels, COUNT);
    if (!model.positions.length) return null;
    await new Promise(resolve => setTimeout(resolve, 0));
    targets = Object.fromEntries(STAGES.map(stage => [stage,
      stage === 'portrait' ? model.positions : makeTargets(stage, COUNT)]));
    subsets = [COUNT, 1600].map(count => {
      const indices = Uint32Array.from({ length: count }, (_, i) => Math.floor(i * COUNT / count));
      const selected = new Uint8Array(COUNT);
      for (const i of indices) selected[i] = 1;
      const edges = { portrait: model.edges };
      // Targets are sampled along ordered paths: adjacent indices make local filaments.
      for (const stage of STAGES.slice(1)) {
        const positions = targets[stage], pairs = [];
        for (let n = 1; n < indices.length; n++) {
          const a = indices[n - 1], b = indices[n];
          if (Math.hypot(positions[a * 3] - positions[b * 3], positions[a * 3 + 1] - positions[b * 3 + 1],
            positions[a * 3 + 2] - positions[b * 3 + 2]) < 0.075) pairs.push(a, b);
        }
        edges[stage] = new Uint32Array(pairs);
      }
      return { indices, selected, edges };
    });
    bands = [];
    // Thin irregular strips follow the source filaments rather than forming photo tiles.
    const noise = i => { const value = Math.sin(i * 12.9898 + 17) * 43758.5453; return value - Math.floor(value); };
    for (let top = 0, row = 0; top < 1; row++) {
      const height = Math.min(1 - top, 0.008 + noise(row * 3) * 0.014);
      const cuts = [0, 0.2 + noise(row * 3 + 1) * 0.1, 0.7 + noise(row * 3 + 2) * 0.1, 1];
      for (let column = 0; column < 3; column++) {
        const x = cuts[column] + (cuts[column + 1] - cuts[column]) / 2;
        const nx = x * 2 - 1, ny = (top + height / 2) * 2 - 1;
        const face = column === 1 && ny > -0.65 && ny < 0.28;
        const center = Math.exp(-3.5 * (nx * nx + (ny + 0.18) ** 2));
        bands.push({ x: cuts[column], y: top, w: cuts[column + 1] - cuts[column], h: height,
          start: face ? 0.45 : Math.max(0.02, 0.06 + center * 0.4 - Math.max(0, ny) * 0.12) });
      }
      top += height;
    }
  } catch { return null; }

  // Cache nodes once. A successful frame activates only its own slots, never the whole page.
  const nodes = new Map(Array.from(doc.querySelectorAll('[data-scene-slot]'), node => [node.dataset.sceneSlot, node]));
  const screenX = new Float32Array(COUNT), screenY = new Float32Array(COUNT);
  const tailX = new Float32Array(COUNT), tailY = new Float32Array(COUNT);
  let layout = null, subset = subsets[0], disposed = false, drawn = false, ratio = 1;
  canvas.classList.add('scene-canvas');
  canvas.hidden = true;

  function restoreFallback() {
    for (const node of nodes.values()) node.removeAttribute('data-scene-active');
    canvas.hidden = true;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    restoreFallback();
    try { ctx.clearRect(0, 0, canvas.width, canvas.height); } catch { /* A lost context is already hidden. */ }
    layout = null;
    model = targets = bands = subsets = null;
  }
  function resize({ slots, viewport, dpr = 1, compact = false }) {
    if (disposed) return;
    try {
      if (!viewport || !Number.isFinite(viewport.width) || !Number.isFinite(viewport.height)
        || viewport.width <= 0 || viewport.height <= 0) throw new RangeError('Invalid viewport');
      layout = { slots, viewport };
      subset = subsets[compact ? 1 : 0];
      ratio = Math.min(compact ? 1 : 1.5, Math.max(1, Number.isFinite(dpr) ? dpr : 1));
      canvas.width = Math.round(viewport.width * ratio);
      canvas.height = Math.round(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Changing backing dimensions clears the canvas; fallback remains until the next good draw.
      restoreFallback();
    } catch { dispose(); }
  }
  function imageBounds(slot, scrollY) {
    const factor = Math.min(slot.width / portrait.naturalWidth, slot.height / portrait.naturalHeight);
    const width = portrait.naturalWidth * factor, height = portrait.naturalHeight * factor;
    return { left: slot.left + (slot.width - width) / 2, top: slot.top - scrollY + (slot.height - height) / 2, width, height };
  }
  function drawPortrait(slot, mix, scrollY) {
    const bounds = imageBounds(slot, scrollY);
    ctx.globalAlpha = 1;
    if (mix === 0) {
      ctx.drawImage(portrait, bounds.left, bounds.top, bounds.width, bounds.height);
      return;
    }
    // Draw retained regions from one unbroken source, avoiding resampling seams
    // through the protected face where independent fractional crops would meet.
    ctx.save();
    ctx.beginPath();
    for (const band of bands) if (mix <= band.start) {
      ctx.rect(bounds.left + band.x * bounds.width, bounds.top + band.y * bounds.height,
        band.w * bounds.width, band.h * bounds.height);
    }
    ctx.clip();
    ctx.drawImage(portrait, bounds.left, bounds.top, bounds.width, bounds.height);
    ctx.restore();
    for (const band of bands) {
      const release = ease((mix - band.start) / (0.94 - band.start));
      if (release === 0 || release >= 1) continue;
      const dx = (band.x + band.w / 2 - 0.5) * bounds.width * release * 0.22;
      const dy = (band.y + band.h / 2 - 0.35) * bounds.height * release * 0.08;
      ctx.globalAlpha = 1 - release;
      ctx.drawImage(portrait, band.x * portrait.naturalWidth, band.y * portrait.naturalHeight,
        band.w * portrait.naturalWidth, band.h * portrait.naturalHeight,
        bounds.left + band.x * bounds.width + dx, bounds.top + band.y * bounds.height + dy,
        band.w * bounds.width, band.h * bounds.height * (1 - release * 0.3));
    }
    ctx.globalAlpha = 1;
  }
  function point(stage, i, slot, pointer, time, scrollY) {
    const data = targets[stage], offset = i * 3;
    const x = data[offset], y = data[offset + 1], z = data[offset + 2];
    if (stage === 'portrait') {
      // Exact image coordinate mapping: generic projection's .42 factor would shrink the face.
      const bounds = imageBounds(slot, scrollY);
      const tiltX = Math.max(-1, Math.min(1, pointer.x)) * 0.035;
      const tiltY = Math.max(-1, Math.min(1, pointer.y)) * 0.035;
      return { x: bounds.left + (x + 1) * bounds.width / 2 + z * tiltX * bounds.width,
        y: bounds.top + (y + 1) * bounds.height / 2 - z * tiltY * bounds.height };
    }
    const projected = projectPoint({ x, y, z: z + Math.sin(time * 0.0003 + i * 0.017) * 0.012 }, slot, pointer);
    return { x: slot.left + projected.x, y: slot.top - scrollY + projected.y };
  }
  function drawFilaments(from, to, mix, slot, scrollY, pointer, time, opacity) {
    if (opacity <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(slot.left, slot.top - scrollY, slot.width, slot.height);
    ctx.clip();
    for (const i of subset.indices) {
      const a = point(from, i, slot, pointer, time, scrollY), b = point(to, i, slot, pointer, time, scrollY);
      const t = from === 'portrait' && to !== from
        ? ease((mix - Math.max(0.02, model.release[i] * 0.56)) / (1 - Math.max(0.02, model.release[i] * 0.56)))
        : ease(mix);
      screenX[i] = lerp(a.x, b.x, t);
      screenY[i] = lerp(a.y, b.y, t);
      tailX[i] = lerp(a.x, b.x, Math.max(0, t - 0.08));
      tailY[i] = lerp(a.y, b.y, Math.max(0, t - 0.08));
    }
    const maxLink = Math.min(slot.width, slot.height) * 0.075;
    const edgeLayers = from === to ? [[from, 1]] : [[from, 1 - mix], [to, mix]];
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = '#f2eee7';
    for (const [stage, weight] of edgeLayers) {
      if (weight < 0.02) continue;
      ctx.globalAlpha = opacity * weight * (stage === 'portrait' ? 0.13 : 0.35);
      ctx.beginPath();
      const edges = subset.edges[stage];
      for (let k = 0; k < edges.length; k += 2) {
        const a = edges[k], b = edges[k + 1];
        if (!subset.selected[a] || !subset.selected[b]
          || Math.hypot(screenX[a] - screenX[b], screenY[a] - screenY[b]) > maxLink) continue;
        ctx.moveTo(screenX[a], screenY[a]);
        ctx.lineTo(screenX[b], screenY[b]);
      }
      ctx.stroke();
    }
    if (from === 'portrait' && from !== to && mix > 0) {
      ctx.globalAlpha = opacity * 0.65;
      ctx.beginPath();
      for (const i of subset.indices) {
        const length = Math.hypot(screenX[i] - tailX[i], screenY[i] - tailY[i]);
        if (i % 3 || length < 0.5 || length > maxLink) continue;
        ctx.moveTo(tailX[i], tailY[i]);
        ctx.lineTo(screenX[i], screenY[i]);
      }
      ctx.stroke();
    }
    // Two fixed batches: no per-point style/color changes or dynamic neighbor searches.
    for (let group = 0; group < 2; group++) {
      ctx.fillStyle = group ? '#ff8759' : '#f2eee7';
      ctx.globalAlpha = opacity * (group ? 0.65 : 0.4);
      ctx.beginPath();
      for (const i of subset.indices) {
        if ((i % 29 === 0 ? 1 : 0) !== group) continue;
        ctx.rect(screenX[i], screenY[i], group ? 1.1 : 0.65, group ? 1.1 : 0.65);
      }
      ctx.fill();
    }
    ctx.restore();
  }
  function render({ frame, scrollY = 0, pointer = { x: 0, y: 0 }, ambientTime = 0 }) {
    if (disposed || !layout) return;
    if (ctx.isContextLost?.()) { dispose(); return; }
    let saved = false;
    try {
      const { from, to } = frame, mix = from === to ? 0 : clamp(frame.mix);
      if (!STAGES.includes(from) || !STAGES.includes(to) || !Number.isFinite(mix)) throw new RangeError('Invalid scene frame');
      const a = layout.slots[from], b = layout.slots[to];
      if (!validRect(a) || !validRect(b)) throw new RangeError('Missing scene slots');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, layout.viewport.width, layout.viewport.height);
      ctx.save(); saved = true;
      ctx.beginPath();
      ctx.rect(a.left, a.top - scrollY, a.width, a.height);
      if (from !== to) ctx.rect(b.left, b.top - scrollY, b.width, b.height);
      ctx.clip();
      if (from === 'portrait' && mix < 0.94) drawPortrait(a, mix, scrollY);
      // Morph in each measured slot and crossfade locations, so midpoint never vanishes
      // into a gap or draws through copy when the next visual changes columns.
      if (from !== 'portrait' || mix > 0 || drawn) {
        const portraitOpacity = from === 'portrait' ? (mix ? Math.min(1, mix * 2.4) : 0.045) : 1;
        drawFilaments(from, to, mix, a, scrollY, pointer, ambientTime,
          portraitOpacity * (from === to ? 1 : 1 - ease(mix)));
        if (from !== to) drawFilaments(from, to, mix, b, scrollY, pointer, ambientTime, ease(mix));
      }
      ctx.restore(); saved = false;
      for (const [stage, node] of nodes) {
        if (stage === from || stage === to) node.setAttribute('data-scene-active', '');
        else node.removeAttribute('data-scene-active');
      }
      canvas.hidden = false;
      drawn = true;
    } catch {
      if (saved) { try { ctx.restore(); } catch { /* Lost context. */ } }
      dispose();
    }
  }
  return { resize, render, dispose };
}
