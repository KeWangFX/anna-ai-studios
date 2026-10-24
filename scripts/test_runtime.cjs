const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
// VM fixtures verify lifecycle changes without a browser download or external enquiry.
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const shader = fs.readFileSync(path.join(__dirname, '..', 'shader-background.js'), 'utf8');
const extract = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }
  dispatchEvent(event) { for (const callback of this.listeners.get(event.type) || []) callback(event); }
  emit(type, detail = {}) { this.dispatchEvent({ type, ...detail }); }
}
class Node extends Events {
  constructor() {
    super(); this.attrs = new Map(); this.dataset = {}; this.textContent = '';
    const values = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => values.add(name)),
      remove: (...names) => names.forEach(name => values.delete(name)),
      contains: name => values.has(name),
      toggle: (name, enabled = !values.has(name)) => enabled ? values.add(name) : values.delete(name),
    };
    this.style = { setProperty() {} };
  }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  removeAttribute(name) { this.attrs.delete(name); if (name === 'src') delete this.src; }
  toggleAttribute(name, enabled) { if (enabled) this.attrs.set(name, ''); else this.attrs.delete(name); }
  hasAttribute(name) { return this.attrs.has(name); }
}
class Canvas extends Node {}
function environment({ mobile = false, reduced = false, saveData = false, observer = true } = {}) {
  const window = new Events(), document = new Events(), connection = new Events();
  connection.saveData = saveData;
  const queries = new Map();
  const query = (text) => {
    if (!queries.has(text)) {
      const item = new Events();
      item.matches = text.includes('reduced-motion') ? reduced : text === '(max-width: 780px)' ? mobile : true;
      item.set = (matches) => { item.matches = matches; item.emit('change'); };
      queries.set(text, item);
    }
    return queries.get(text);
  };
  const frames = new Map(), decoded = new Map(), idle = [], observers = [];
  let nextFrame = 1, top = 0, requests = 0, loads = 0;
  const journey = new Node(), video = new Node(), intro = new Node(), progress = new Node(), label = new Node(), time = new Node();
  const panels = [0.14, 0.34, 0.57, 0.79].map(start => { const panel = new Node(); panel.dataset.start = start; return panel; });
  const steps = panels.map(() => new Node());
  const sources = ['mobile.mp4', 'desktop.webm', 'desktop.mp4'].map((src, index) => {
    const item = new Node(); item.dataset.src = src; item.media = index === 0 ? '(max-width: 780px)' : ''; return item;
  });
  Object.defineProperty(journey, 'offsetHeight', { get: () => journey.classList.contains('is-static') ? 1000 : 3000 });
  journey.getBoundingClientRect = () => ({ top, bottom: top + journey.offsetHeight });
  video.querySelectorAll = () => sources;
  video.pause = () => {};
  video.load = () => { loads += 1; if (sources.some(item => item.src)) requests += 1; };
  video.readyState = 2; video.duration = 8; video.seeking = false;
  video.requestVideoFrameCallback = callback => { const id = nextFrame++; decoded.set(id, callback); return id; };
  video.cancelVideoFrameCallback = id => decoded.delete(id);
  const selectors = new Map([
    ['[data-journey]', journey], ['[data-journey-video]', video], ['[data-journey-intro]', intro],
    ['[data-journey-progress]', progress], ['[data-journey-label]', label], ['[data-journey-time]', time],
  ]);
  document.hidden = false; document.documentElement = { lang: 'en' };
  document.querySelector = selector => selectors.get(selector) || null;
  document.querySelectorAll = selector => selector === '[data-journey-panel]' ? panels : selector === '[data-journey-step]' ? steps : [];
  Object.assign(window, {
    innerHeight: 1000, matchMedia: query,
    requestAnimationFrame: callback => { const id = nextFrame++; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
    requestIdleCallback: callback => idle.push(callback),
    setTimeout: callback => idle.push(callback),
    location: { reload() { throw new Error('Unexpected reload'); } },
  });
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
    emit(target, isIntersecting) { this.callback([{ target, isIntersecting }]); }
  }
  if (observer) window.IntersectionObserver = Observer;
  const context = vm.createContext({ window, document, navigator: { connection }, IntersectionObserver: Observer,
    HTMLCanvasElement: Canvas, CustomEvent: class { constructor(type, detail) { this.type = type; Object.assign(this, detail); } },
    performance: { now: () => 100 }, console });
  vm.runInContext('const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value)); const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");', context);
  return { window, document, connection, queries, query, frames, decoded, idle, observers, context, selectors,
    journey, video, intro, panels, progress, sources,
    get requests() { return requests; }, get loads() { return loads; }, set top(value) { top = value; },
    run(code) { vm.runInContext(code, context); },
    flush() { const pending = [...frames]; frames.clear(); pending.forEach(([, callback]) => callback(116)); },
  };
}
const journeyCode = extract('initJourney', 'createLeadId');
const startJourney = env => env.run(`${journeyCode}\ninitJourney();`);
const assertStatic = env => {
  assert.equal(env.journey.classList.contains('is-static'), true);
  assert.equal(env.intro.getAttribute('aria-hidden'), 'false');
  assert.equal(env.intro.hasAttribute('inert'), false);
  assert.equal(env.progress.getAttribute('aria-valuenow'), '0');
  env.panels.forEach(panel => { assert.equal(panel.getAttribute('aria-hidden'), 'true'); assert.equal(panel.hasAttribute('inert'), true); });
  assert.equal(env.frames.size, 0); assert.equal(env.decoded.size, 0);
  assert.equal(env.sources.some(item => item.src), false);
};
for (const options of [{ mobile: true }, { reduced: true }, { saveData: true }]) {
  const env = environment(options); startJourney(env); assertStatic(env); assert.equal(env.loads, 0); assert.equal(env.requests, 0);
}
const env = environment(); startJourney(env);
assert.equal(env.requests, 1); assert.equal(env.sources[0].src, undefined);
assert.equal(env.frames.size, 1); assert.equal(env.observers.length, 1);
env.video.emit('loadedmetadata'); env.video.emit('loadeddata');
assert.equal(env.decoded.size, 1);
env.top = -1000; env.window.emit('scroll'); env.flush();
assert.equal(env.progress.getAttribute('aria-valuenow'), '50');
assert.equal(env.panels[1].getAttribute('aria-hidden'), 'false');
assert.equal(env.panels[1].hasAttribute('inert'), false);
assert.equal(env.intro.hasAttribute('inert'), true);

// The conversion copy must stay reachable even when the decorative circuit reaches its final phase.
const focused = environment(); focused.journey.setAttribute('data-persistent-intro', ''); startJourney(focused);
for (const top of [-500, -1000, -2000]) {
  focused.top = top; focused.window.emit('scroll'); focused.flush();
  assert.equal(focused.intro.getAttribute('aria-hidden'), 'false');
  assert.equal(focused.intro.hasAttribute('inert'), false);
  focused.panels.forEach(panel => {
    assert.equal(panel.getAttribute('aria-hidden'), 'true');
    assert.equal(panel.hasAttribute('inert'), true);
  });
}
focused.query('(max-width: 780px)').set(true); assertStatic(focused);
env.query('(max-width: 780px)').set(true); assertStatic(env);
assert.equal(env.requests, 1);
env.video.emit('loadedmetadata'); env.video.emit('loadeddata'); assertStatic(env);
env.top = 0;
for (let index = 0; index < 8; index += 1) {
  env.query('(max-width: 780px)').set(false);
  assert.equal(env.journey.classList.contains('is-static'), false);
  assert.equal(env.frames.size, 1);
  env.query('(max-width: 780px)').set(true); assertStatic(env);
}
assert.equal(env.observers.length, 1);
for (const name of ['loadedmetadata', 'loadeddata', 'error']) assert.equal(env.video.listeners.get(name).size, 1);
env.query('(max-width: 780px)').set(false);
env.query('(prefers-reduced-motion: reduce)').set(true); assertStatic(env);
const beforeStaticRequests = env.requests;
env.connection.saveData = true; env.connection.emit('change');
env.query('(prefers-reduced-motion: reduce)').set(false); assertStatic(env);
assert.equal(env.requests, beforeStaticRequests);
env.connection.saveData = false; env.connection.emit('change');
env.document.hidden = true; env.document.emit('visibilitychange'); assert.equal(env.frames.size, 0);
env.document.hidden = false; env.document.emit('visibilitychange'); assert.equal(env.frames.size, 1);
env.window.emit('pagehide', { persisted: true }); assert.equal(env.frames.size, 0); assert.equal(env.observers[0].targets.size, 0);
env.window.emit('pageshow', { persisted: true }); assert.equal(env.frames.size, 2); assert.equal(env.observers[0].targets.size, 1);
env.query('(max-width: 780px)').set(true); assertStatic(env);

const pendingDecode = environment(); startJourney(pendingDecode);
pendingDecode.video.emit('loadedmetadata'); pendingDecode.video.emit('loadeddata');
assert.equal(pendingDecode.decoded.size, 1);
assert.equal(pendingDecode.journey.classList.contains('is-video-ready'), false);
pendingDecode.window.emit('pagehide', { persisted: true });
assert.equal(pendingDecode.decoded.size, 0);
pendingDecode.window.emit('pageshow', { persisted: true });
assert.equal(pendingDecode.journey.classList.contains('is-video-ready'), true);
assert.equal(pendingDecode.requests, 1);
assert.equal(pendingDecode.video.listeners.get('loadeddata').size, 1);
pendingDecode.query('(max-width: 780px)').set(true); assertStatic(pendingDecode);
const noDecodedData = environment(); noDecodedData.video.readyState = 1; startJourney(noDecodedData);
noDecodedData.window.emit('pagehide', { persisted: true }); noDecodedData.window.emit('pageshow', { persisted: true });
assert.equal(noDecodedData.journey.classList.contains('is-video-ready'), false);
noDecodedData.video.readyState = 2; noDecodedData.video.emit('loadeddata');
const firstFrame = noDecodedData.decoded.values().next().value;
assert.equal(typeof firstFrame, 'function'); firstFrame();
assert.equal(noDecodedData.journey.classList.contains('is-video-ready'), true);

const fallback = environment({ observer: false }); fallback.top = -5000; startJourney(fallback);
assert.equal(fallback.requests, 0); fallback.top = 0; fallback.window.emit('scroll'); fallback.flush(); assert.equal(fallback.requests, 1);

// Ignore cache-version changes while still requiring the real optional-import branch to be exercised.
const optionalSource = extract('initOptionalShader', 'init');
const optionalCode = optionalSource.replace(/import\("\.\/shader-background\.js(?:\?[^"\n]*)?"\)/, 'recordImport()');
assert.notEqual(optionalCode, optionalSource, 'The shader import must be intercepted by the lifecycle fixture');
const noCanvas = environment(); let imports = 0;
noCanvas.context.recordImport = () => { imports += 1; return Promise.resolve(); };
noCanvas.run(`${optionalCode}\ninitOptionalShader();`); assert.equal(noCanvas.idle.length, 0); assert.equal(imports, 0);
const optional = environment(); optional.selectors.set('[data-circuit-canvas]', new Canvas());
optional.context.recordImport = () => { imports += 1; return Promise.resolve(); };
optional.run(`${optionalCode}\ninitOptionalShader();`); assert.equal(optional.idle.length, 1);
optional.query('(prefers-reduced-motion: reduce)').set(true); optional.idle.shift()(); assert.equal(imports, 0);
optional.query('(prefers-reduced-motion: reduce)').set(false); optional.idle.shift()(); assert.equal(imports, 1);

const revealCode = extract('initReveal', 'initProductVault');
for (const failAt of [0, 1, 2]) {
  const reveal = environment(); const elements = [new Node(), new Node()];
  reveal.document.querySelectorAll = () => elements;
  if (failAt) {
    let calls = 0;
    reveal.context.IntersectionObserver = class {
      constructor() { if (failAt === 1) throw new Error('Observer unavailable'); }
      observe() { calls += 1; if (calls === 2) throw new Error('Registration failed'); }
      disconnect() {}
    };
  }
  reveal.run(`${revealCode}\ninitReveal();`);
  if (failAt) elements.forEach(element => { assert.equal(element.classList.contains('is-reveal-pending'), false); assert.equal(element.classList.contains('is-visible'), true); });
  else { elements.forEach(element => assert.equal(element.classList.contains('is-reveal-pending'), true)); reveal.observers[0].emit(elements[0], true); assert.equal(elements[0].classList.contains('is-reveal-pending'), false); }
}

const shaderEnv = environment();
const canvas = new Canvas(); canvas.closest = () => shaderEnv.journey;
canvas.getBoundingClientRect = () => ({ width: 1920, height: 1080 });
shaderEnv.selectors.set('[data-circuit-canvas]', canvas);
let renderers = 0, disposed = 0;
class Dummy { constructor() {} add() {} dispose() {} set() {} }
shaderEnv.context.THREE = {
  WebGLRenderer: class { constructor() { renderers += 1; } setPixelRatio() {} setSize() {} render() {} dispose() { disposed += 1; } },
  Scene: Dummy, OrthographicCamera: Dummy, PlaneGeometry: Dummy, Vector2: Dummy, ShaderMaterial: Dummy, Mesh: Dummy,
};
shaderEnv.run(shader.replace(/^import[^\n]+\n/, ''));
assert.equal(renderers, 1); assert.equal(shaderEnv.frames.size, 1);
shaderEnv.journey.classList.add('is-static'); shaderEnv.window.emit('anna:journey-mode'); assert.equal(shaderEnv.frames.size, 0);
shaderEnv.journey.classList.remove('is-static'); shaderEnv.window.emit('anna:journey-mode'); assert.equal(shaderEnv.frames.size, 1);
shaderEnv.query('(prefers-reduced-motion: reduce)').set(true); assert.equal(shaderEnv.frames.size, 0);
shaderEnv.query('(prefers-reduced-motion: reduce)').set(false); assert.equal(shaderEnv.frames.size, 1);
shaderEnv.observers[0].emit(shaderEnv.journey, false); assert.equal(shaderEnv.frames.size, 0);
shaderEnv.observers[0].emit(shaderEnv.journey, true); assert.equal(shaderEnv.frames.size, 1);
shaderEnv.document.hidden = true; shaderEnv.document.emit('visibilitychange'); assert.equal(shaderEnv.frames.size, 0);
shaderEnv.document.hidden = false; shaderEnv.document.emit('visibilitychange'); assert.equal(shaderEnv.frames.size, 1);
shaderEnv.window.emit('pagehide', { persisted: true }); assert.equal(shaderEnv.frames.size, 0); assert.equal(disposed, 0);
shaderEnv.window.emit('pageshow', { persisted: true }); assert.equal(shaderEnv.frames.size, 1); assert.equal(renderers, 1);
shaderEnv.window.emit('pagehide', { persisted: false }); assert.equal(shaderEnv.frames.size, 0); assert.equal(disposed, 1);
shaderEnv.window.emit('pageshow'); assert.equal(shaderEnv.frames.size, 0);
console.log('PASS: hero initial static modes, repeated breakpoint/reduced-motion/saveData transitions, scoped video sources, aria/inert, one observer/listener set, pending RAF cleanup, hidden/BFCache, no-observer fallback, optional shader guard/idle recheck, reveal failure fallback, shader stop/resume/renderer reuse.');
