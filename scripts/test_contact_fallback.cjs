'use strict';
// Exercise deliberate copy actions offline: no clipboard, network, email or storage is touched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const code = source.slice(source.indexOf('function initContactFallbacks()'), source.indexOf('function initContactForms()'));

class Node {
  constructor() { this.listeners = new Map(); this.dataset = {}; this.value = ''; this.textContent = ''; }
  addEventListener(name, fn) { this.listeners.set(name, fn); }
  async emit(name, event = {}) { return this.listeners.get(name)?.(event); }
  focus() { this.focused = true; }
  select() { this.selected = true; }
  setSelectionRange(start, end) { this.range = [start, end]; }
}
function fixture({language = 'ZH', clipboard = 'success', empty = false} = {}) {
  const form = new Node(), section = new Node(), status = new Node(), manual = new Node(), output = new Node();
  form.dataset.language = language;
  manual.hidden = true;
  const writes = [], pending = [];
  const navigator = clipboard === 'missing' ? {} : {clipboard: {writeText(text) {
    writes.push(text);
    if (clipboard === 'reject') return Promise.reject(new Error('Permission denied'));
    if (clipboard === 'pending') return new Promise(resolve => pending.push(resolve));
    return Promise.resolve();
  }}};
  const input = empty ? {name: '', company: '', email: '', service_code: '', timeline: '', message: ''} : {
    name: '王可', company: '安娜影像工作室', email: 'qa@example.com', service_code: 'AI-FILM',
    timeline: 'EXPLORING', message: '【测试草稿】繁體與简体。\r\n第二行：🎬 <script>literal text</script>',
  };
  const controls = Object.fromEntries(Object.entries(input).map(([key, value]) => {
    const node = new Node(); node.value = value; node.tagName = 'INPUT';
    if (key === 'service_code' || key === 'timeline') {
      node.tagName = 'SELECT'; node.selectedIndex = 0;
      node.options = [{textContent: key === 'service_code' ? (language === 'ZH' ? 'AI 影视与视觉生产' : 'AI filmmaking & visual production')
        : (language === 'ZH' ? '探索阶段' : 'Exploratory')}];
    }
    return [key, node];
  }));
  // Trap accidental bulk form serialization: private/hidden fields are not part of a copied brief.
  form.elements = {lead_id: {value: 'SECRET_REFERENCE'}, 'cf-turnstile-response': {value: 'SECRET_TOKEN'},
    _honey: {value: 'SECRET_HONEY'}, language: {value: 'SECRET_LANGUAGE'}};
  form.querySelector = selector => {
    if (selector === '[data-contact-fallback]') return section;
    const match = selector.match(/^\[data-form-field\] \[name="([^"]+)"\]$/);
    assert.ok(match, 'Only an explicitly allowed visible form field may be read');
    return controls[match[1]];
  };
  form.checkValidity = form.reportValidity = form.requestSubmit = form.submit = () => {
    throw new Error('Copy must not validate or submit the form');
  };
  const buttons = ['brief', 'wechat'].map(kind => { const node = new Node(); node.dataset.contactCopy = kind; node.disabled = true; return node; });
  const nodes = new Map([['[data-copy-status]', status], ['[data-copy-manual]', manual], ['[data-copy-text]', output]]);
  section.querySelector = selector => nodes.get(selector);
  section.querySelectorAll = selector => { assert.equal(selector, '[data-contact-copy]'); return buttons; };
  const document = {querySelectorAll(selector) { assert.equal(selector, '[data-contact-form]'); return [form]; }};
  const forbidden = () => { throw new Error('Copy must remain local and user initiated'); };
  const context = vm.createContext({document, navigator, fetch: forbidden, XMLHttpRequest: forbidden,
    localStorage: {setItem: forbidden}, sessionStorage: {setItem: forbidden}});
  vm.runInContext(code + '\ninitContactFallbacks();', context);
  return {form, controls, input, status, manual, output, writes, pending, buttons};
}

(async () => {
  for (const language of ['ZH', 'EN']) {
    const f = fixture({language});
    assert.equal(f.writes.length, 0, 'Initialization must not copy or transmit visitor content');
    assert.equal(f.buttons.every(button => !button.disabled), true);
    await f.buttons[0].emit('click');
    assert.equal(f.writes.length, 1);
    assert.equal(f.manual.hidden, false);
    assert.equal(f.output.value, f.writes[0]);
    for (const field of ['name', 'company', 'email', 'message']) assert.ok(f.writes[0].includes(f.input[field]));
    assert.ok(f.writes[0].includes(language === 'ZH' ? 'AI 影视与视觉生产' : 'AI filmmaking & visual production'));
    assert.ok(f.writes[0].includes(language === 'ZH' ? '探索阶段' : 'Exploratory'));
    assert.doesNotMatch(f.writes[0], /SECRET_|cf-turnstile|lead_id|privacy_consent/);
    assert.ok(f.status.textContent.includes(language === 'ZH' ? '尚未发送' : 'not sent'));
    assert.equal(f.output.focused, undefined, 'Successful clipboard copy should keep button focus');
    await f.buttons[1].emit('click');
    assert.equal(f.writes[1], 'kewangfx');
    assert.equal(f.output.rows, 2);
    assert.ok(f.status.textContent.includes(language === 'ZH' ? '尚未发送' : 'has not been sent'));

    const blank = fixture({language, empty: true});
    await blank.buttons[0].emit('click');
    assert.ok(blank.output.value.includes(language === 'ZH' ? '未填写' : 'Not filled in'));
    assert.ok(blank.output.value.includes(language === 'ZH' ? '项目说明' : 'Project brief'));

    for (const clipboard of ['reject', 'missing']) {
      const denied = fixture({language, clipboard});
      await denied.buttons[0].emit('click');
      assert.equal(denied.manual.hidden, false);
      assert.equal(denied.output.focused, true); assert.equal(denied.output.selected, true);
      assert.deepEqual(denied.output.range, [0, denied.output.value.length]);
      assert.ok(denied.status.textContent.includes(language === 'ZH' ? '尚未确认复制' : 'Copy is not confirmed'));
      assert.equal(denied.output.value.includes(denied.input.message), true);
    }
  }
  // A stalled clipboard promise cannot hide manual contact or overwrite newer copy/edit status.
  const delayed = fixture({clipboard: 'pending'});
  const first = delayed.buttons[0].emit('click');
  assert.equal(delayed.manual.hidden, false);
  const second = delayed.buttons[1].emit('click');
  delayed.pending[1](); await second;
  const latestStatus = delayed.status.textContent;
  delayed.pending[0](); await first;
  assert.equal(delayed.status.textContent, latestStatus);
  assert.equal(delayed.output.value, 'kewangfx');

  for (const event of ['input', 'change', 'reset']) {
    const edited = fixture({clipboard: 'pending'});
    const copying = edited.buttons[0].emit('click');
    await edited.form.emit(event, {target: edited.controls.message});
    assert.equal(edited.manual.hidden, true); assert.equal(edited.output.value, '');
    edited.pending[0](); await copying;
    assert.ok(edited.status.textContent.includes('内容已修改'));
  }
  // Assert the actual shipped HTML keeps the fallback accessible without changing backend fields.
  for (const relative of ['index.html', 'zh/index.html']) {
    const html = fs.readFileSync(path.join(root, relative), 'utf8');
    const fallback = html.match(/<section\b[^>]*data-contact-fallback[\s\S]*?<\/section>/)?.[0];
    assert.ok(fallback);
    assert.doesNotMatch(fallback.match(/^<section[^>]*>/)[0], /\bhidden\b/);
    const buttons = [...fallback.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
    assert.equal(buttons.length, 2); buttons.forEach(button => assert.match(button, /type="button"/));
    assert.match(fallback, /role="status" aria-live="polite" aria-atomic="true" data-copy-status/);
    const textarea = fallback.match(/<textarea\b[^>]*data-copy-text[^>]*>/)[0];
    assert.match(textarea, /\breadonly\b/); assert.doesNotMatch(textarea, /\bname=/);
    const qrLink = [...html.matchAll(/<a\b[^>]*href="[^"]*wechat-kewangfx-qr\.png"[^>]*>/g)];
    assert.equal(qrLink.length, 1); assert.doesNotMatch(qrLink[0][0], /target=/);
  }
  console.log('PASS: bilingual deliberate copy, original CJK/emoji/newlines, visible-field allowlist, localized option labels, incomplete briefs, no form validation/submission/storage, clipboard rejected/missing/stalled recovery, stale async protection, edit/reset invalidation, accessible manual fallback and same-tab QR.');
})().catch(error => {console.error(error); process.exitCode = 1;});
