const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const code = source.slice(source.indexOf('function initContactForms()'), source.indexOf('function initLeadReference()'));

class Node {
  constructor() {
    this.listeners = new Map(); this.attrs = new Map(); this.dataset = {}; this.value = ''; this.textContent = '';
    const classes = new Set();
    this.classList = {toggle(name, on) {on ? classes.add(name) : classes.delete(name);}, contains(name) {return classes.has(name);}};
  }
  addEventListener(name, fn) {if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push(fn);}
  emit(name, detail = {}) {for (const fn of this.listeners.get(name) || []) fn({type: name, ...detail});}
  setAttribute(name, value) {this.attrs.set(name, String(value));}
  getAttribute(name) {return this.attrs.get(name) ?? null;}
  removeAttribute(name) {this.attrs.delete(name);}
  closest() {return null;}
  focus() {this.focused = true;}
}
function fixture({language = 'ZH', placeholder = false, host = 'anna-ai-studios.pages.dev', missingApi = false,
  missingRequestSubmit = false, renderHook, executeHook, visibilityState = 'visible', consoleThrows = false} = {}) {
  const form = new Node(), window = new Node(), status = new Node(), button = new Node(), label = new Node();
  label.textContent = language === 'ZH' ? '发送项目需求' : 'Send project brief';
  button.disabled = true;
  form.action = placeholder ? 'https://unconfigured.example/DEPLOYMENT_REQUIRED' : 'https://anna-ai-studios.pages.dev/api/contact';
  form.dataset = {language, turnstileSitekey: '0x4AAAAAAFjk66LpNyMVEQBr'};
  const original = {name: '王可', company: '安娜影像工作室', email: 'annaqa+local@example.com', service_code: 'AI-FILM',
    timeline: 'EXPLORING', message: '【仅本地测试】繁體與简体保持原文。\r\n第二行包括表情 🎬。', privacy_consent: 'Agreed'};
  const controls = Object.fromEntries(Object.entries(original).map(([key, value]) => {
    const control = new Node(); control.value = value;
    control.validity = {valid: true, valueMissing: false, typeMismatch: false, tooShort: false};
    return [key, control];
  }));
  const token = new Node(), lead = new Node(), origin = new Node(), honey = new Node(), widget = new Node();
  const nodes = new Map([['[data-form-status]', status], ['[data-submit-button]', button], ['[data-submit-label]', label],
    ['[name="cf-turnstile-response"]', token], ['[data-lead-id-field]', lead], ['[data-source-field]', origin],
    ['input[name="_honey"]', honey], ['[data-turnstile-container]', widget]]);
  form.querySelector = selector => nodes.get(selector) || null;
  form.querySelectorAll = () => Object.values(controls);
  const prefix = host === 'kewangfx.github.io' ? '/anna-ai-studios/' : '/';
  window.location = {href: `https://${host}${prefix}${language === 'ZH' ? 'zh/' : ''}?service=AI-FILM#contact`};
  const renders = [], executions = [], removals = [], nativePosts = [], createdScripts = [], diagnostics = [];
  const api = {
    render(container, options) {
      assert.equal(container, widget); renders.push(options); renderHook?.(options); return 'widget-' + renders.length;
    },
    execute(id) {executions.push(id); executeHook?.(renders.at(-1));}, remove(id) {removals.push(id);},
  };
  if (!missingApi) window.turnstile = api;
  const timers = new Map(), scheduledTimers = [];
  let clock = 0, nextTimer = 0;
  window.setTimeout = (callback, delay) => {
    const timer = {id: ++nextTimer, callback, delay, at: clock + delay};
    timers.set(timer.id, timer); scheduledTimers.push(timer); return timer.id;
  };
  window.clearTimeout = id => timers.delete(id);
  const advance = duration => {
    const target = clock + duration;
    for (;;) {
      const next = [...timers.values()].filter(timer => timer.at <= target).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      clock = next.at; timers.delete(next.id); next.callback();
    }
    clock = target;
  };
  const document = {visibilityState, querySelectorAll: () => [form], createElement() {return {removals: 0, remove() {this.removals++;}};},
    head: {append(script) {createdScripts.push(script);}}};
  let reference = 0;
  // Drive diagnostic timing from the same fake clock as the actual watchdog callbacks.
  class ClockDate extends Date {static now() {return clock;}}
  const context = vm.createContext({window, document, URL, Date: ClockDate, Promise,
    console: {warn(prefix, detail) {
      if (consoleThrows) throw new Error('Console unavailable');
      diagnostics.push({prefix, detail: JSON.parse(JSON.stringify(detail))});
    }},
    createLeadId() {reference++; return 'ANNA-20261024010000-' + reference.toString(16).padStart(4, '0').toUpperCase();}});
  const send = () => {
    let prevented = false;
    form.emit('submit', {preventDefault() {prevented = true;}});
    if (!prevented) nativePosts.push({lead_id: lead.value, source_page: origin.value, token: token.value,
      ...Object.fromEntries(Object.entries(controls).map(([key, node]) => [key, node.value]))});
    return prevented;
  };
  if (!missingRequestSubmit) form.requestSubmit = send;
  // Native submit-button activation still dispatches submit when requestSubmit is absent.
  button.click = () => { if (!button.disabled) return send(); };
  vm.runInContext(code + '\ninitContactForms();', context);
  return {form, window, document, api, status, button, label, controls, original, token, lead, origin, honey,
    renders, executions, removals, nativePosts, createdScripts, diagnostics, timers, scheduledTimers, advance, send};
}
const flush = async () => {await Promise.resolve(); await Promise.resolve(); await Promise.resolve();};
(async () => {
  // These are offline mocks: there are no network calls, real tokens, or email submissions.
  for (const language of ['EN', 'ZH']) for (const host of ['anna-ai-studios.pages.dev', 'kewangfx.github.io'])
    for (const missingRequestSubmit of [false, true]) {
    const f = fixture({language, host, missingRequestSubmit});
    assert.equal(f.button.disabled, false);
    assert.equal(f.send(), true); assert.ok(f.lead.value); assert.equal(f.nativePosts.length, 0);
    const idBeforeExecution = f.lead.value;
    await flush();
    assert.equal(f.renders.length, 1); assert.equal(f.executions.length, 1);
    assert.equal(f.renders[0].cData, idBeforeExecution); assert.equal(f.renders[0].action, 'anna_contact');
    assert.equal(f.renders[0]['response-field'], false);
    assert.equal(f.renders[0].language, language === 'ZH' ? 'zh-cn' : 'en');
    f.send(); await flush(); assert.equal(f.renders.length, 1, 'Repeated clicks must not create multiple challenges');
    f.renders[0].callback('LOCAL_TEST_TOKEN');
    assert.equal(f.timers.size, 0, 'Successful verification must cancel the local watchdog');
    assert.equal(f.nativePosts.length, 1); assert.equal(f.nativePosts[0].lead_id, idBeforeExecution);
    for (const [key, value] of Object.entries(f.original)) assert.equal(f.nativePosts[0][key], value);
    assert.equal(f.nativePosts[0].source_page.includes('?'), false); assert.equal(f.nativePosts[0].source_page.includes('#'), false);
    assert.equal(new URL(f.nativePosts[0].source_page).host, host);
    assert.equal(f.button.disabled, true);
    f.renders[0].callback('REPEATED_TOKEN'); assert.equal(f.nativePosts.length, 1);
    f.send(); assert.equal(f.nativePosts.length, 1, 'A second submit must not reuse a spent token');
    f.window.emit('pagehide'); f.window.emit('pageshow');
    assert.equal(f.token.value, ''); assert.equal(f.lead.value, ''); assert.equal(f.button.disabled, false);
  }
  // Autofill/native validity can change during verification without firing an input event.
  // The legacy click path must revalidate instead of bypassing the guarded submit listener.
  const legacyInvalid = fixture({missingRequestSubmit: true});
  legacyInvalid.send(); await flush();
  legacyInvalid.controls.email.validity = {valid: false, typeMismatch: true};
  legacyInvalid.renders[0].callback('LOCAL_TEST_TOKEN');
  assert.equal(legacyInvalid.nativePosts.length, 0);
  assert.equal(legacyInvalid.controls.email.focused, true);
  assert.equal(legacyInvalid.token.value, '');
  assert.equal(legacyInvalid.button.disabled, false);
  for (const callbackName of ['expired-callback', 'timeout-callback', 'error-callback']) {
    const f = fixture(); f.send(); await flush(); const old = f.renders[0], lead = f.lead.value;
    old[callbackName](); assert.equal(f.token.value, ''); assert.equal(f.lead.value, ''); assert.equal(f.button.disabled, false);
    assert.equal(f.timers.size, 0, 'Provider terminal callbacks must cancel the local watchdog');
    old.callback('STALE_TOKEN'); assert.equal(f.nativePosts.length, 0);
    f.send(); await flush(); assert.notEqual(f.lead.value, lead); assert.equal(f.renders.length, 2);
  }
  const changed = fixture(); changed.send(); await flush(); const stale = changed.renders[0];
  changed.controls.message.value += '补充内容'; changed.controls.message.emit('input');
  stale.callback('STALE_AFTER_EDIT'); assert.equal(changed.nativePosts.length, 0); assert.equal(changed.lead.value, '');
  assert.equal(changed.timers.size, 0);

  // Drive actual form handlers with a deterministic clock, without waiting or contacting Cloudflare.
  for (const language of ['EN', 'ZH']) {
    const hung = fixture({language}); hung.send(); await flush();
    hung.advance(59999); assert.equal(hung.button.disabled, true);
    hung.advance(1); assert.equal(hung.button.disabled, false); assert.equal(hung.lead.value, '');
    assert.equal(hung.token.value, ''); assert.equal(hung.nativePosts.length, 0);
    assert.equal(hung.renders.length, 1, 'A timeout must not automatically retry verification');
    assert.ok(hung.status.textContent.includes(language === 'ZH' ? '重新发送' : 'send again'));
    hung.renders[0].callback('LATE_TOKEN_AFTER_TIMEOUT'); assert.equal(hung.nativePosts.length, 0);
  }
  const interactive = fixture(); interactive.send(); await flush();
  const challenge = interactive.renders[0], originalWatchdog = interactive.scheduledTimers[0];
  interactive.advance(59000); challenge['before-interactive-callback']();
  assert.equal(interactive.timers.size, 0); interactive.advance(120000);
  originalWatchdog.callback();
  assert.equal(interactive.button.disabled, true, 'Manual challenge time must not expire the form');
  assert.ok(interactive.lead.value); assert.equal(interactive.nativePosts.length, 0);
  challenge['after-interactive-callback']();
  originalWatchdog.callback();
  assert.equal(interactive.button.disabled, true, 'A cancelled timer cannot cancel a resumed automatic phase');
  interactive.advance(59999); assert.equal(interactive.button.disabled, true);
  interactive.advance(1); assert.equal(interactive.button.disabled, false);

  for (const cancel of [f => f.form.emit('reset'), f => f.controls.message.emit('input'),
    f => {f.window.emit('pagehide'); f.window.emit('pageshow');}]) {
    const f = fixture(); f.send(); await flush();
    const oldTimer = f.scheduledTimers[0], oldChallenge = f.renders[0];
    cancel(f); assert.equal(f.timers.size, 0); assert.equal(f.button.disabled, false);
    f.send(); await flush(); const newLead = f.lead.value;
    oldTimer.callback(); oldChallenge['before-interactive-callback'](); oldChallenge['after-interactive-callback']();
    assert.equal(f.lead.value, newLead); assert.equal(f.button.disabled, true); assert.equal(f.timers.size, 1);
    f.renders[1].callback('CURRENT_TOKEN'); assert.equal(f.nativePosts.length, 1); assert.equal(f.timers.size, 0);
  }
  const invalid = fixture(); invalid.controls.email.validity = {valid: false, typeMismatch: true};
  invalid.send(); await flush(); assert.equal(invalid.renders.length, 0); assert.equal(invalid.controls.email.focused, true);
  const trap = fixture(); trap.honey.value = 'bot'; trap.send(); await flush(); assert.equal(trap.renders.length, 0);
  for (const options of [{placeholder: true}, {host: 'unapproved.example.com'}]) {
    const f = fixture(options); assert.equal(f.button.disabled, true); f.send(); await flush();
    assert.equal(f.nativePosts.length, 0); assert.equal(f.renders.length, 0); assert.equal(f.createdScripts.length, 0);
  }
  const unavailable = fixture({missingApi: true}); unavailable.send(); await flush();
  assert.equal(unavailable.createdScripts[0].src, 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
  unavailable.createdScripts[0].onerror(); await flush();
  assert.equal(unavailable.button.disabled, false); assert.equal(unavailable.nativePosts.length, 0);

  // Provider failure data is untrusted. Only a six-digit primitive code may enter local logs.
  const privateError = 'token=SECRET_TOKEN email=private@example.com lead=ANNA-20261024010000-0001 中文正文';
  for (const [providerCode, expectedCode] of [['110200', '110200'], [110200, '110200'],
    ['110200 '], ['110200\n'], ['12345'], ['1234567'], [privateError], [null], [undefined],
    [{toString() {throw new Error('Do not coerce provider objects');}}]]) {
    const f = fixture({visibilityState: 'hidden'}); f.send(); await flush(); f.advance(25);
    const callback = f.renders[0]['error-callback'];
    assert.equal(callback(providerCode), true);
    assert.deepEqual(f.diagnostics, [{prefix: '[Anna contact verification]', detail: {
      event: 'provider-error', elapsedMs: 25, visible: false, ...(expectedCode ? {code: expectedCode} : {}),
    }}]);
    callback(privateError); f.renders[0].callback(privateError);
    assert.equal(f.diagnostics.length, 1, 'Stale callbacks must not log or submit again');
    assert.equal(f.nativePosts.length, 0); assert.equal(f.button.disabled, false);
  }
  const bounded = fixture(); bounded.send(); await flush();
  bounded.renders[0]['before-interactive-callback'](); bounded.advance(900001);
  bounded.renders[0]['error-callback']('110200');
  assert.deepEqual(bounded.diagnostics.at(-1).detail,
    {event: 'provider-error', elapsedMs: 900000, visible: true, code: '110200'});

  // Both terminal script events and late events must settle a load exactly once, then allow
  // an intentional new attempt. An old script must never invalidate or diagnose the new load.
  for (const failure of ['load-error', 'load-timeout', 'load-api-unavailable']) {
    const f = fixture({missingApi: true}); f.send(); await flush();
    const script = f.createdScripts[0], loadTimer = f.scheduledTimers[0];
    if (failure === 'load-error') script.onerror(new Error(privateError));
    else if (failure === 'load-timeout') f.advance(18000);
    else script.onload();
    await flush();
    assert.deepEqual(f.diagnostics.map(item => item.detail.event), [failure]);
    assert.equal(script.removals, 1); assert.equal(f.timers.size, 0); assert.equal(f.button.disabled, false);
    f.send(); await flush(); const currentLead = f.lead.value;
    script.onerror(); script.onload(); loadTimer.callback(); await flush();
    assert.equal(f.createdScripts.length, 2); assert.equal(f.lead.value, currentLead);
    assert.equal(f.diagnostics.length, 1); assert.equal(f.button.disabled, true);
    f.window.turnstile = f.api;
    f.createdScripts[1].onload(); await flush();
    assert.equal(f.renders.length, 1); assert.equal(f.executions.length, 1);
    f.renders[0].callback('LOCAL_RECOVERY_TOKEN');
    assert.equal(f.nativePosts.length, 1, 'A later valid deliberate submission must still work');
    assert.deepEqual(f.diagnostics.map(item => item.detail.event), [failure, 'verified']);
  }

  // Synchronous render callbacks run before the returned ID can be assigned. A terminal
  // callback must remove that ID afterwards, without executing it or retaining stale tokens.
  for (const callbackName of ['error-callback', 'timeout-callback', 'expired-callback', 'unsupported-callback']) {
    const f = fixture({renderHook: options => options[callbackName]('110200')});
    f.send(); await flush();
    assert.deepEqual(f.removals, ['widget-1']); assert.equal(f.executions.length, 0);
    assert.equal(f.nativePosts.length, 0); assert.equal(f.timers.size, 0);
    assert.equal(f.button.disabled, false); assert.equal(f.lead.value, ''); assert.equal(f.token.value, '');
    f.renders[0].callback('STALE_SYNC_RENDER_TOKEN'); assert.equal(f.nativePosts.length, 0);
    assert.equal(f.diagnostics.length, 1);
  }
  const synchronousSuccess = fixture({renderHook: options => options.callback('LOCAL_SYNC_TOKEN')});
  synchronousSuccess.send(); await flush();
  assert.equal(synchronousSuccess.nativePosts.length, 1); assert.equal(synchronousSuccess.executions.length, 0);
  assert.deepEqual(synchronousSuccess.removals, ['widget-1']); assert.equal(synchronousSuccess.timers.size, 0);
  assert.deepEqual(synchronousSuccess.diagnostics.map(item => item.detail.event), ['verified']);
  const synchronousInvalidToken = fixture({renderHook: options => options.callback({secret: privateError})});
  synchronousInvalidToken.send(); await flush();
  assert.equal(synchronousInvalidToken.nativePosts.length, 0); assert.equal(synchronousInvalidToken.executions.length, 0);
  assert.deepEqual(synchronousInvalidToken.removals, ['widget-1']);
  assert.deepEqual(synchronousInvalidToken.diagnostics.map(item => item.detail.event), ['provider-invalid-token']);

  for (const stage of ['render', 'execute']) {
    const f = fixture({[stage + 'Hook']: () => {throw new Error(privateError);}});
    f.send(); await flush();
    assert.deepEqual(f.diagnostics, [{prefix: '[Anna contact verification]',
      detail: {event: stage + '-exception', elapsedMs: 0, visible: true}}]);
    assert.equal(f.nativePosts.length, 0); assert.equal(f.button.disabled, false); assert.equal(f.timers.size, 0);
    if (stage === 'execute') assert.deepEqual(f.removals, ['widget-1']);
  }
  const endedBeforeThrow = fixture({executeHook: options => {
    options['error-callback']('110200'); throw new Error(privateError);
  }});
  endedBeforeThrow.send(); await flush();
  assert.deepEqual(endedBeforeThrow.diagnostics.map(item => item.detail.event), ['provider-error']);
  assert.deepEqual(endedBeforeThrow.removals, ['widget-1']); assert.equal(endedBeforeThrow.nativePosts.length, 0);
  const sentBeforeThrow = fixture({executeHook: options => {
    options.callback('LOCAL_SYNC_EXECUTE_TOKEN'); throw new Error(privateError);
  }});
  sentBeforeThrow.send(); await flush();
  assert.equal(sentBeforeThrow.nativePosts.length, 1); assert.equal(sentBeforeThrow.button.disabled, true);
  assert.deepEqual(sentBeforeThrow.diagnostics.map(item => item.detail.event), ['verified']);
  const noConsole = fixture({consoleThrows: true}); noConsole.send(); await flush();
  noConsole.renders[0].callback('LOCAL_NO_CONSOLE_TOKEN'); assert.equal(noConsole.nativePosts.length, 1);

  const allowed = ['lead_id', 'name', 'company', 'email', 'language', 'service_code', 'timeline', 'message',
    'privacy_consent', 'source_page', '_honey', 'cf-turnstile-response'].sort();
  for (const relative of ['index.html', 'zh/index.html']) {
    const html = fs.readFileSync(path.join(root, relative), 'utf8');
    const form = html.match(/<form\b[\s\S]*?<\/form>/)[0];
    const fields = [...form.matchAll(/<(?:input|select|textarea)\b[^>]*\bname="([^"]+)"/g)].map(match => match[1]).sort();
    assert.deepEqual(fields, allowed); assert.match(form, /enctype="application\/x-www-form-urlencoded"/);
    assert.match(form, /name="privacy_consent"[^>]*value="Agreed"/); assert.match(form, /data-submit-button disabled/);
    assert.match(html, /http-equiv="Content-Security-Policy"/); assert.doesNotMatch(form, /FormSubmit|formsubmit\.co|data-next-field/);
    assert.match(form, /action="https:\/\/anna-ai-studios\.pages\.dev\/api\/contact"/);
  }
  assert.doesNotMatch(code, /fetch\(|XMLHttpRequest|no-cors/);
  console.log('PASS: offline native POST gating, legacy requestSubmit fallback and revalidation, CJK field preservation, cData reference binding, duplicate-click guard, stale/expired/error token reset, edited-field invalidation, BFCache, unavailable provider, 60-second silent-stall recovery, manual-challenge pause/resume, stale-timer isolation, private-data-free diagnostic boundaries, one-shot load failures and deliberate recovery, synchronous render/execute terminal callback isolation, exact backend field contract, placeholder and source-host blocking.');
})().catch(error => {console.error(error); process.exitCode = 1;});
