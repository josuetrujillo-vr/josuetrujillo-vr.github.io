const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '../docs');
const out = path.resolve(process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(), 'portfolio-browser-check'));
const base = process.env.BASE_URL || 'http://portfolio.test/';
const results = [], errors = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const temp = path.resolve(process.env.QA_TEMP_DIR || path.join(out, 'runtime'));
  await fs.mkdir(temp, { recursive: true });
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launchPersistentContext(path.join(temp, 'profile'), {
    executablePath: process.env.BROWSER_EXECUTABLE, headless: true,
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    env: Object.fromEntries(Object.entries({ SystemRoot: process.env.SystemRoot, HOME: process.env.HOME,
      PATH: process.env.PATH, TEMP: temp, TMP: temp }).filter(([, value]) => value !== undefined)),
  });
  try {
  async function setup(options = {}) {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    if (!process.env.BASE_URL || options.blockImage || options.slowScene) await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (options.blockImage && url.pathname.endsWith('/portrait.webp')) return route.abort();
      if (process.env.BASE_URL && !(options.slowScene && url.pathname.endsWith('/scene-renderer.mjs'))) return route.continue();
      if (!process.env.BASE_URL && url.hostname !== 'portfolio.test') return route.abort();
      const file = path.join(root, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      const types = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript', '.webp': 'image/webp' };
      try {
        let body = process.env.BASE_URL ? Buffer.from(await (await route.fetch()).body()) : await fs.readFile(file);
        // Delay the real renderer's completion to put preference changes inside its async preparation.
        if (options.slowScene && url.pathname.endsWith('/scene-renderer.mjs')) body = Buffer.from(body.toString().replace('export async function createScene(canvas, portrait) {', 'export async function createScene(canvas, portrait) { window.qaPreparationStarted = (window.qaPreparationStarted || 0) + 1; await new Promise(resolve => setTimeout(resolve, window.qaPreparationStarted === 1 ? 900 : 0));'));
        await route.fulfill({ status: 200, body, contentType: types[path.extname(file)] || 'application/octet-stream' });
      } catch { await route.fulfill({ status: 404, body: 'Not found' }); }
    });
    await page.addInitScript(() => {
      const request = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
      window.qa = { callbacks: 0, pending: new Set(), events: [] };
      window.requestAnimationFrame = fn => { const id = request(now => { qa.pending.delete(id); qa.callbacks++; fn(now); }); qa.pending.add(id); return id; };
      window.cancelAnimationFrame = id => { qa.pending.delete(id); cancel(id); };
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, fn, options) { if (['wheel', 'touchmove', 'scroll'].includes(type)) qa.events.push({ type, passive: options?.passive }); return add.call(this, type, fn, options); };
      if (location.search.includes('no-context')) HTMLCanvasElement.prototype.getContext = () => null;
    });
    return page;
  }
  async function check(name, fn) {
    try { await fn(); results.push({ name, passed: true }); console.log('PASS', name); }
    catch (error) { results.push({ name, passed: false, error: error.message }); console.log('FAIL', name, error.message); }
  }
  const active = page => page.locator('html.scene-ready').waitFor({ timeout: 5000 });
  const accessiblePortrait = async page => assert.equal(await page.getByRole('img', {
    name: 'Retrato de Josue Trujillo construido con filamentos blancos sobre fondo negro', exact: true,
  }).count(), 1, 'the meaningful portrait must remain in the accessibility tree');
  const stopped = async page => { await delay(150); const before = await page.evaluate(() => qa.callbacks); await delay(180); assert.equal(await page.evaluate(() => qa.callbacks), before); assert.equal(await page.evaluate(() => qa.pending.size), 0); };
  const yFor = (page, stage) => page.locator(`[data-scene-slot="${stage}"]`).evaluate(e => Math.max(0, e.getBoundingClientRect().top + scrollY + e.clientHeight / 2 - innerHeight / 2));
  const scroll = (page, top) => page.evaluate(top => scrollTo({ top, behavior: 'instant' }), top).then(() => delay(80));
  const canvasData = page => page.locator('.scene-canvas').evaluate(c => c.toDataURL());
  const page = await setup();
  await page.goto(base);
  if (process.argv.includes('--portrait-accessibility')) {
    await check('animated portrait retains its meaningful accessible image', async () => {
      await active(page);
      await accessiblePortrait(page);
    });
    await check('reduced motion restores the meaningful accessible portrait', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('html.scene-ready').waitFor({ state: 'detached' });
      await accessiblePortrait(page);
    });
    await check('no uncaught page errors', async () => assert.deepEqual(errors, []));
    await fs.writeFile(path.join(out, 'portrait-accessibility-results.json'), JSON.stringify({ base, results, errors }, null, 2));
    if (results.some(r => !r.passed)) process.exitCode = 1;
    return;
  }
  await check('successful scene exposes accessible pause after first render', async () => {
    await active(page);
    await accessiblePortrait(page);
    assert.equal(await page.getByRole('button', { name: 'Pausar movimiento' }).getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('.scene-canvas').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('.scene-canvas').getAttribute('tabindex'), null);
    assert.equal(await page.locator('[data-scene-active]').count(), 1);
    assert(await page.locator('.motion-toggle').evaluate(button => {
      const a = button.getBoundingClientRect();
      return Array.from(document.querySelectorAll('.hero-foot a, .site-header nav, .wordmark')).every(node => {
        const b = node.getBoundingClientRect();
        return a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
      });
    }), 'pause must not cover native navigation');
  });
  if (!results[0].passed) { await fs.writeFile(path.join(out, 'task4-browser-results.json'), JSON.stringify({ results, errors }, null, 2)); process.exitCode = 1; return; }
  await page.screenshot({ path: path.join(out, 'task4-entry-desktop.png') });
  await check('pause stops idle frames but native scroll still morphs reversibly across every chapter', async () => {
    await page.getByRole('button', { name: 'Pausar movimiento' }).click();
    assert.equal(await page.getByRole('button', { name: 'Reanudar movimiento' }).getAttribute('aria-pressed'), 'true');
    await stopped(page);
    const stages = ['portrait', 'branches', 'web', 'systems', 'vr', 'trajectory', 'signature'];
    const ys = [0]; for (const stage of stages.slice(1)) ys.push(await yFor(page, stage));
    for (let i = 0; i < stages.length - 1; i++) {
      const middle = (ys[i] + ys[i + 1]) / 2;
      await scroll(page, middle);
      assert.deepEqual(await page.locator('[data-scene-active]').evaluateAll(nodes => nodes.map(e => e.dataset.sceneSlot)), [stages[i], stages[i + 1]]);
      const forward = await canvasData(page);
      await scroll(page, ys[i + 1]); await scroll(page, middle);
      assert.equal(await canvasData(page), forward, `reverse ${stages[i]}`);
      if (i === 0 || i === 2) await page.screenshot({ path: path.join(out, `task4-${i === 0 ? 'portrait' : 'web-systems'}-midpoint-desktop.png`) });
    }
    assert.equal(await page.locator('[data-scene-slot="web"] .scene-fallback').evaluate(e => getComputedStyle(e).visibility), 'visible');
    await scroll(page, 0);
    assert.equal(await page.locator('[data-scene-slot="portrait"]').getAttribute('data-scene-active'), '');
  });
  await check('direct contact hash and reload at project keep restored native position', async () => {
    await page.goto('about:blank'); await page.goto(base + '#contact'); await active(page); await delay(1200);
    assert(await page.evaluate(() => scrollY > 500));
    assert(await page.locator('[data-scene-slot="signature"]').getAttribute('data-scene-active') !== null);
    await scroll(page, await yFor(page, 'systems')); const y = await page.evaluate(() => scrollY);
    await page.reload(); await active(page); await delay(100);
    assert(Math.abs((await page.evaluate(() => scrollY)) - y) < 2);
    assert(await page.locator('[data-scene-slot="systems"]').getAttribute('data-scene-active') !== null);
  });
  await check('bottom of document reaches the assembled signature', async () => {
    await scroll(page, await page.evaluate(() => document.documentElement.scrollHeight));
    assert.deepEqual(await page.locator('[data-scene-active]').evaluateAll(nodes => nodes.map(e => e.dataset.sceneSlot)), ['signature']);
  });
  await check('resize at a morph remeasures geometry with no horizontal overflow', async () => {
    await page.getByRole('button', { name: 'Pausar movimiento' }).click();
    await page.setViewportSize({ width: 390, height: 844 }); await delay(150);
    await scroll(page, 0); await page.screenshot({ path: path.join(out, 'task4-entry-mobile.png') });
    const y = await yFor(page, 'branches'); await scroll(page, y / 2);
    const first = await canvasData(page);
    await page.screenshot({ path: path.join(out, 'task4-portrait-midpoint-mobile.png') });
    await page.setViewportSize({ width: 844, height: 390 }); await delay(100);
    await page.setViewportSize({ width: 390, height: 844 }); await delay(100); await scroll(page, y / 2);
    assert.equal(await canvasData(page), first);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('.scene-canvas').evaluate(c => c.width), 390);
    await page.setViewportSize({ width: 1440, height: 900 }); await delay(100);
  });
  await check('keyboard skip link, pause and contact retain ordinary focus/navigation', async () => {
    await page.goto(base); await active(page); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
    await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
    await page.getByRole('button', { name: 'Pausar movimiento' }).focus(); await page.keyboard.press('Space');
    assert.equal(await page.getByRole('button', { name: 'Reanudar movimiento' }).getAttribute('aria-pressed'), 'true');
    await page.locator('nav a[href="#contact"]').focus(); await page.keyboard.press('Enter'); await delay(900);
    assert.equal(await page.evaluate(() => location.hash), '#contact');
    assert((await page.locator('[data-contact="email"]').getAttribute('href')) === 'mailto:st3144@utr.edu.mx', 'email retains existing address');
    assert.deepEqual(await page.evaluate(() => qa.events), [{ type: 'scroll', passive: true }]);
  });
  await check('reduced motion live restores every fallback and cancels animation', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); await delay(150);
    assert.equal(await page.locator('html.scene-ready').count(), 0);
    assert.equal(await page.locator('[data-scene-active]').count(), 0);
    assert.equal(await page.getByRole('button', { name: /movimiento/ }).count(), 0);
    await accessiblePortrait(page);
    await stopped(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await active(page);
  });
  await check('hidden tab cancels ambient frames and resume makes a single loop', async () => {
    if (await page.locator('.motion-toggle').getAttribute('aria-pressed') === 'true') await page.getByRole('button', { name: 'Reanudar movimiento' }).click();
    await scroll(page, await yFor(page, 'web'));
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await stopped(page);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await delay(150); assert.equal(await page.evaluate(() => qa.pending.size), 1);
    await page.getByRole('button', { name: 'Pausar movimiento' }).click();
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await stopped(page);
  });
  await check('content-only stretch stops idle RAF and scroll reawakens scene', async () => {
    await page.getByRole('button', { name: 'Reanudar movimiento' }).click();
    await scroll(page, await page.locator('#education').evaluate(e => e.getBoundingClientRect().top + scrollY));
    assert(await page.locator('[data-scene-active]').evaluateAll(nodes => nodes.every(e => { const r=e.getBoundingClientRect(); return r.bottom <= 0 || r.top >= innerHeight; })));
    await stopped(page);
    await scroll(page, await yFor(page, 'web')); assert.equal(await page.evaluate(() => qa.pending.size), 1);
  });
  await check('context loss restores static page and repeated teardown is harmless', async () => {
    await page.locator('.scene-canvas').evaluate(c => c.dispatchEvent(new Event('contextlost')));
    await stopped(page); assert.equal(await page.locator('html.scene-ready').count(), 0);
    assert.equal(await page.locator('[data-scene-active]').count(), 0);
    await page.evaluate(() => { dispatchEvent(new Event('pagehide')); dispatchEvent(new Event('pagehide')); });
    assert.equal(await page.locator('#contact h2').isVisible(), true);
  });
  await check('image and context failures keep complete static content', async () => {
    for (const options of [{ blockImage: true }, {}]) {
      const failed = await setup(options); await failed.goto(base + (options.blockImage ? '' : '?no-context')); await delay(500);
      assert.equal(await failed.locator('html.scene-ready').count(), 0); assert.equal(await failed.locator('[data-scene-active]').count(), 0);
      assert.equal(await failed.locator('#project-web h3').isVisible(), true); assert.equal(await failed.locator('#contact h2').isVisible(), true);
      assert(await failed.locator('.portrait').getAttribute('alt')); await failed.close();
    }
  });
  await check('reduced preference during renderer preparation cannot reactivate stale scene', async () => {
    const race = await setup({ slowScene: true }); await race.goto(base); await race.waitForFunction(() => window.qaPreparationStarted === 1);
    await race.emulateMedia({ reducedMotion: 'reduce' }); await delay(900);
    assert.equal(await race.locator('html.scene-ready').count(), 0); assert.equal(await race.locator('[data-scene-active]').count(), 0); await stopped(race);
    await race.emulateMedia({ reducedMotion: 'no-preference' }); await active(race); assert.equal(await race.evaluate(() => qa.pending.size), 1); await race.close();
  });
  await check('rapid preference round trip cannot let old preparation blank a newer paused scene', async () => {
    const race = await setup({ slowScene: true }); await race.goto(base); await race.waitForFunction(() => window.qaPreparationStarted === 1);
    await race.emulateMedia({ reducedMotion: 'reduce' }); await delay(50);
    await race.emulateMedia({ reducedMotion: 'no-preference' }); await active(race);
    await race.getByRole('button', { name: 'Pausar movimiento' }).click(); await delay(1100);
    assert.equal(await race.locator('.scene-canvas').isVisible(), true);
    assert.equal(await race.locator('[data-scene-active]').count(), 1); await stopped(race); await race.close();
  });
  await check('JavaScript disabled preserves projects, contacts and static portrait', async () => {
    const context = await browser.browser().newContext({ javaScriptEnabled: false }); const staticPage = await context.newPage();
    if (!process.env.BASE_URL) await staticPage.route('**/*', async route => { const url=new URL(route.request().url()); if(url.hostname!=='portfolio.test')return route.abort(); const file=path.join(root,url.pathname==='/'?'index.html':url.pathname); try{await route.fulfill({body:await fs.readFile(file),contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'image/webp'});}catch{await route.abort();} });
    await staticPage.goto(base); assert.equal(await staticPage.locator('#contact h2').isVisible(), true); assert.equal(await staticPage.locator('.portrait').isVisible(), true); assert.equal(await staticPage.locator('button:visible').count(), 0); await context.close();
  });
  await check('no uncaught page errors', async () => assert.deepEqual(errors, []));
  await fs.writeFile(path.join(out, 'task4-browser-results.json'), JSON.stringify({ base, results, errors }, null, 2));
  if (results.some(r => !r.passed)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
