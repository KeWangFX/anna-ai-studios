'use strict';
// Exercise actual shipped HTML against the maintained backend parser without network or email.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const backend = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'backend/apps-script/Code.gs'), 'utf8'), backend);
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
for (const relative of ['index.html', 'zh/index.html']) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  const form = html.match(/<form\b[\s\S]*?<\/form>/)[0];
  assert.ok(form.indexOf('data-turnstile-container') > form.indexOf('name="privacy_consent"'));
  assert.ok(form.indexOf('data-turnstile-container') < form.indexOf('class="contact-form__footer"'),
    'Interactive verification must remain next to the submit control on narrow screens');
  const fields = [...form.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(match => attrs(match[0])).filter(field => field.name);
  const original = {name: '王测试', company: '中文公司 • QA', email: 'local-test@example.com',
    message: '这是一条中文咨询对照信息，包含中文标点、繁體與简体。\r\n第二行表情 🎬 保持原文。'};
  const payload = Object.fromEntries(fields.map(field => [field.name, field.value || '']));
  Object.assign(payload, original, {lead_id: 'ANNA-20261024120000-A001', service_code: 'OTHER', timeline: 'EXPLORING',
    source_page: 'https://anna-ai-studios.pages.dev/' + (relative.startsWith('zh/') ? 'zh/' : ''),
    'cf-turnstile-response': 'LOCAL_CONTRACT_TOKEN_NOT_REAL'});
  // Keep consent/language from real HTML, so front/backend enum drift cannot be hidden by mocks.
  const event = {postData: {type: 'application/x-www-form-urlencoded'}, contentLength: 3000,
    parameters: Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, [value]]))};
  let parsed;
  try { parsed = backend.parse_(event); }
  catch (error) { throw new Error(relative + ': actual backend rejected frontend fields: ' + error.annaCode); }
  for (const [name, value] of Object.entries(original)) assert.equal(parsed[name], value);
  assert.equal(parsed.privacy_consent, payload.privacy_consent);
  assert.equal(parsed.language, relative.startsWith('zh/') ? 'ZH' : 'EN');
  // HTML option values and consent are part of the API contract, not just translated labels.
  for (const fieldName of ['service_code', 'timeline']) {
    const select = form.match(new RegExp('<select\\b[^>]*name="' + fieldName + '"[\\s\\S]*?</select>'))[0];
    for (const option of select.matchAll(/<option\b[^>]*value="([^"]+)"/g)) {
      const changed = {...event, parameters: {...event.parameters, [fieldName]: [option[1]]}};
      assert.equal(backend.parse_(changed)[fieldName], option[1]);
    }
  }
  assert.throws(() => backend.parse_({...event, parameters: {...event.parameters, privacy_consent: ['accepted']}}),
    error => error.annaCode === 'invalid_request', 'A changed consent enum must fail the real backend contract');
  console.log('PASS actual backend parser accepts ' + relative + ' and preserves CJK content');
}
