import { createScene } from './scene-renderer.mjs';
import { sceneFrame } from './scene-model.mjs';

const canvas = document.querySelector('.scene-canvas');
const pause = document.querySelector('.motion-toggle');
const portrait = document.querySelector('.portrait');
const nodes = Array.from(document.querySelectorAll('[data-scene-slot]'));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const coarse = matchMedia('(pointer: coarse)');
const hover = matchMedia('(hover: hover) and (pointer: fine)');
let scene = null, generation = 0, pending = 0, suspended = false;
let preparation = Promise.resolve();
let paused = false, ambientTime = 0, previousTime = null, dirty = true;
let slots = {}, milestones = [];
let pointer = { x: 0, y: 0 };

function cancelFrame() {
  cancelAnimationFrame(pending);
  pending = 0;
  previousTime = null;
}

function release() {
  generation++;
  cancelFrame();
  scene?.dispose();
  scene = null;
  document.documentElement.classList.remove('scene-ready');
  pause.hidden = true;
}

function measure() {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  let previous = 0;
  milestones = nodes.map((node, index) => {
    const rect = node.getBoundingClientRect();
    const slot = { left: rect.left, top: rect.top + scrollY, width: rect.width, height: rect.height };
    slots[node.dataset.sceneSlot] = slot;
    const y = index === 0 ? 0 : Math.max(previous, Math.min(maxScroll, slot.top + slot.height / 2 - innerHeight / 2));
    previous = y;
    return { stage: node.dataset.sceneSlot, y };
  });
  scene.resize({ slots, viewport: { width: innerWidth, height: innerHeight },
    dpr: devicePixelRatio, compact: innerWidth <= 700 || coarse.matches });
  dirty = false;
}

function requestDraw() {
  if (scene && !pending && !document.hidden && !suspended) pending = requestAnimationFrame(draw);
}

function draw(now) {
  pending = 0;
  if (!scene || document.hidden || suspended) return;
  try {
    if (dirty) measure();
    const frame = sceneFrame(scrollY, milestones);
    const intersects = stage => {
      const slot = slots[stage];
      return slot.top + slot.height > scrollY && slot.top < scrollY + innerHeight
        && slot.left + slot.width > 0 && slot.left < innerWidth;
    };
    const moving = !paused && (intersects(frame.from) || intersects(frame.to));
    if (moving && previousTime !== null) ambientTime += now - previousTime;
    previousTime = moving ? now : null;
    scene.render({ frame, scrollY, pointer, ambientTime });
    // The renderer restores HTML and hides its canvas on any drawing/context failure.
    if (canvas.hidden) { release(); return; }
    document.documentElement.classList.add('scene-ready');
    pause.hidden = false;
    if (moving) requestDraw();
  } catch { release(); }
}

function initialize() {
  release();
  if (reduced.matches || suspended) return;
  const current = generation;
  // All renderers share one canvas: finish disposing an old preparation before starting another.
  preparation = preparation.then(async () => {
    if (current !== generation) return;
    try {
      await portrait.decode();
      if (current !== generation || reduced.matches || suspended) return;
      const prepared = await createScene(canvas, portrait);
      if (current !== generation || reduced.matches || suspended) { prepared?.dispose(); return; }
      if (!prepared) return;
      scene = prepared;
      dirty = true;
      requestDraw();
    } catch {
      if (current === generation) release();
    }
  });
}

function resize() {
  dirty = true;
  requestDraw();
}

pause.addEventListener('click', () => {
  paused = !paused;
  pause.setAttribute('aria-pressed', String(paused));
  pause.textContent = paused ? 'Reanudar movimiento' : 'Pausar movimiento';
  cancelFrame();
  requestDraw();
});
addEventListener('scroll', requestDraw, { passive: true });
addEventListener('resize', resize);
addEventListener('orientationchange', resize);
addEventListener('pointermove', event => {
  if (paused || !hover.matches || coarse.matches || event.pointerType === 'touch') return;
  pointer = { x: event.clientX / innerWidth * 2 - 1, y: event.clientY / innerHeight * 2 - 1 };
  requestDraw();
});
addEventListener('pointerout', event => {
  if (paused || event.relatedTarget) return;
  pointer = { x: 0, y: 0 };
  requestDraw();
});
coarse.addEventListener('change', () => { pointer = { x: 0, y: 0 }; resize(); });
hover.addEventListener('change', () => { pointer = { x: 0, y: 0 }; requestDraw(); });
reduced.addEventListener('change', initialize);
document.addEventListener('visibilitychange', () => {
  cancelFrame();
  if (!document.hidden) requestDraw();
});
canvas.addEventListener('contextlost', release);
addEventListener('pagehide', () => { suspended = true; release(); });
addEventListener('pageshow', event => {
  if (event.persisted) { suspended = false; initialize(); }
  else resize();
});
document.fonts?.ready.then(resize);
initialize();
