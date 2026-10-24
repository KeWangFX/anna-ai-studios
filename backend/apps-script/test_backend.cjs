'use strict';
// Local deterministic service doubles: no browser, network, credentials or email.
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/Code.gs', 'utf8');
let passed = 0;
const initialTime = Date.parse('2026-10-24T12:00:00Z');

function setup(options = {}) {
  let time = initialTime;
  let quota = options.quota ?? 100;
  const state = new Map([['ANNA_ENABLED', 'true'], ['TURNSTILE_SECRET', 'LOCAL_TEST_SECRET_NOT_VALID']]);
  const messages = [];
  const logs = [];
  let fetches = 0;
  let challenge = {};
  const FixedDate = class extends Date {
    constructor(...args) { super(...(args.length ? args : [time])); }
    static now() { return time; }
  };
  const context = vm.createContext({
    Date: FixedDate,
    console: {log: text => logs.push(JSON.parse(text))},
    LockService: {getScriptLock: () => ({tryLock: () => !options.busy, hasLock: () => true, releaseLock() {}})},
    PropertiesService: {getScriptProperties: () => ({
      getProperty: key => state.get(key) ?? null,
      setProperty: (key, value) => { state.set(key, value); },
      deleteProperty: key => state.delete(key),
      getProperties: () => Object.fromEntries(state)
    })},
    Utilities: {DigestAlgorithm: {SHA_256: 'sha256'}, Charset: {UTF_8: 'utf8'},
      computeDigest: (_, value) => [...crypto.createHash('sha256').update(value, 'utf8').digest()]},
    UrlFetchApp: {fetch: (url, request) => {
      fetches++;
      assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
      assert.equal(request.followRedirects, false);
      if (options.networkError) throw Error('SIMULATED_PROVIDER_FAILURE');
      return {getResponseCode: () => options.httpStatus ?? 200,
        getContentText: () => JSON.stringify(challenge)};
    }},
    MailApp: {
      getRemainingDailyQuota: () => quota,
      sendEmail: message => {
        messages.push(message);
        quota--;
        if (messages.length === options.throwOnMail) throw Error('SIMULATED_AMBIGUOUS_SEND');
      }
    },
    HtmlService: {createHtmlOutput: html => ({html})},
    ContentService: {MimeType: {JSON: 'application/json'}, createTextOutput: text => ({
      text, setMimeType(type) { assert.equal(type, 'application/json'); return this; }
    })}
  });
  vm.runInContext(source, context, {filename: 'Code.gs'});
  const data = (overrides = {}) => ({
    lead_id: 'ANNA-' + new Date(time).toISOString().replace(/[^0-9]/g, '').slice(0, 14) + '-A001',
    name: '王测试', company: '中文公司 • ANNA QA', email: 'test@example.com', language: 'ZH',
    service_code: 'OTHER', timeline: 'EXPLORING', privacy_consent: 'Agreed',
    message: '这是中文咨询正文，保留中文标点、换行与表情。\n第二行内容：测试 🌊 FX，原文不能被转换。',
    source_page: 'https://anna-ai-studios.pages.dev/zh/', '_honey': '',
    'cf-turnstile-response': 'local-token-one', ...overrides
  });
  return {context, state, messages, data, lastEvent: () => logs.at(-1),
    advance(ms) { time += ms; },
    fetchCount: () => fetches,
    remainingQuota: () => quota,
    submit(p = data(), challengeOverride = {}, eventOverride = {}) {
      challenge = {success: true, hostname: 'anna-ai-studios.pages.dev', action: 'anna_contact',
        cdata: p.lead_id, challenge_ts: new Date(time).toISOString(), ...challengeOverride};
      const event = {postData: {type: 'application/x-www-form-urlencoded'}, contentLength: 3000,
        parameters: Object.fromEntries(Object.entries(p).map(([key, value]) => [key, [value]])), ...eventOverride};
      const response = context.doPost(event);
      return response.html ?? response.text;
    }
  };
}
function test(name, fn) { fn(); passed++; process.stdout.write('PASS ' + name + '\n'); }
function noSend(b, html, code) { assert.equal(b.messages.length, 0); assert.equal(b.lastEvent().code, code); assert.ok(!html.includes(code)); }
function relayEvent(data, query = 'transport=relay-v1') {
  const contents = new URLSearchParams(data).toString();
  const parameters = {};
  // Model Google's documented combined query/body parameter arrays, not a custom relay shortcut.
  for (const [key, value] of [...new URLSearchParams(query), ...new URLSearchParams(contents)]) {
    (parameters[key] ||= []).push(value);
  }
  const length = Buffer.byteLength(contents, 'utf8');
  return {queryString: query || null, pathInfo: '', contentLength: length,
    postData: {type: 'application/x-www-form-urlencoded', contents, length}, parameters,
    parameter: Object.fromEntries(Object.entries(parameters).map(([key, values]) => [key, values[0]]))};
}

test('Chinese original is preserved; one owner + fixed Chinese receipt', () => {
  const b = setup(); const p = b.data(); const html = b.submit(p);
  assert.equal(b.messages.length, 2);
  assert.equal(b.messages[0].to, 'keke19870699@gmail.com');
  assert.equal(b.messages[0].replyTo, p.email);
  assert.ok(b.messages[0].body.includes(p.name));
  assert.ok(b.messages[0].body.includes(p.company));
  assert.ok(b.messages[0].body.includes(p.message));
  assert.ok(b.messages[1].body.includes('感谢联系'));
  assert.ok(!b.messages[1].body.includes(p.message));
  assert.match(b.messages[0].subject, /^[\x20-\x7e]+$/);
  assert.equal(b.lastEvent().owner, 'accepted'); assert.equal(b.lastEvent().receipt, 'accepted');
  assert.ok(html.includes('这并不代表最终送达已确认'));
});
test('English fixed receipt and mirror host work', () => {
  const b = setup(); b.submit(b.data({language: 'EN', source_page: 'https://kewangfx.github.io/anna-ai-studios/'}), {hostname: 'kewangfx.github.io'});
  assert.equal(b.messages.length, 2); assert.ok(b.messages[1].body.startsWith('Thank you'));
});
test('identical retry is idempotent and never re-verifies or resends', () => {
  const b = setup(); const p = b.data(); b.submit(p); b.submit(p);
  assert.equal(b.messages.length, 2); assert.equal(b.fetchCount(), 1);
});
test('same lead with different content cannot overwrite status', () => {
  const b = setup(); b.submit(); const html = b.submit(b.data({name: '不同姓名'}));
  assert.equal(b.messages.length, 2); assert.equal(b.lastEvent().code, 'lead_conflict');
});
test('token replay with a different lead cannot send again', () => {
  const b = setup(); b.submit(); const html = b.submit(b.data({lead_id: b.data().lead_id.replace('A001', 'A002')}));
  assert.equal(b.messages.length, 2); assert.equal(b.lastEvent().code, 'verification_failed');
});
for (const [label, payload] of [
  ['header injection', {email: 'one@example.com\r\nBcc: second@example.com'}],
  ['recipient list', {email: 'one@example.com,two@example.com'}],
  ['arbitrary recipient field', {to: 'other@example.com'}],
  ['long message', {message: 'x'.repeat(6001)}],
  ['honeypot', {_honey: 'bot'}],
  ['missing consent', {privacy_consent: ''}],
  ['source spoof', {source_page: 'https://anna-ai-studios.pages.dev.evil.test/zh/'}]
]) test(label + ' rejected before verification', () => {
  const b = setup(); noSend(b, b.submit(b.data(payload)), 'invalid_request'); assert.equal(b.fetchCount(), 0);
});
for (const [label, override] of [
  ['failed challenge', {success: false}], ['hostname subdomain spoof', {hostname: 'evil.anna-ai-studios.pages.dev'}],
  ['wrong action', {action: 'login'}], ['wrong binding', {cdata: 'ANNA-OTHER'}],
  ['expired challenge', {challenge_ts: '2026-10-24T11:54:59Z'}]
]) test(label + ' sends nothing', () => { const b = setup(); noSend(b, b.submit(b.data(), override), 'verification_failed'); });
test('duplicate parameters rejected', () => {
  const b = setup(); noSend(b, b.submit(b.data(), {}, {parameters: {email: ['a@example.com', 'b@example.com']}}), 'invalid_request');
});
test('JSON and oversized body rejected', () => {
  const b = setup(); noSend(b, b.submit(b.data(), {}, {postData: {type: 'application/json'}}), 'invalid_request');
  noSend(b, b.submit(b.data(), {}, {contentLength: 65537}), 'invalid_request');
});
test('expired new lead rejected', () => { const b = setup(); const p = b.data(); b.advance(900001); noSend(b, b.submit(p), 'expired_lead'); });
test('disabled kill switch sends nothing', () => { const b = setup(); b.state.set('ANNA_ENABLED', 'false'); noSend(b, b.submit(), 'unavailable'); });
test('minimum quota preserves two recipient slots', () => {
  const b = setup({quota: 3}); noSend(b, b.submit(), 'temporarily_limited');
  const good = setup({quota: 4}); good.submit(); assert.equal(good.remainingQuota(), 2);
});
test('owner ambiguous failure stops receipt and never retries', () => {
  const b = setup({throwOnMail: 1}); const html = b.submit(); b.submit();
  assert.equal(b.messages.length, 1); assert.equal(b.lastEvent().owner, 'uncertain'); assert.equal(b.lastEvent().receipt, 'not_attempted');
});
test('receipt ambiguous failure retains separate states and never retries', () => {
  const b = setup({throwOnMail: 2}); const html = b.submit(); b.submit();
  assert.equal(b.messages.length, 2); assert.equal(b.lastEvent().owner, 'accepted'); assert.equal(b.lastEvent().receipt, 'uncertain');
});
test('per-email limit is enforced after two reservations', () => {
  const b = setup();
  for (let i = 0; i < 3; i++) {
    const p = b.data({lead_id: b.data().lead_id.replace('A001', 'A00' + i), 'cf-turnstile-response': 'token-' + i});
    b.submit(p); if (i === 2) assert.equal(b.lastEvent().code, 'temporarily_limited');
  }
  assert.equal(b.messages.length, 4);
});
test('twenty leads is a hard rolling 24-hour ceiling', () => {
  const b = setup();
  for (let i = 0; i < 21; i++) {
    const html = b.submit(b.data({email: 'person' + i + '@example.com', 'cf-turnstile-response': 'token-' + i}));
    if (i === 20) assert.equal(b.lastEvent().code, 'temporarily_limited');
    b.advance(30 * 60000);
  }
  assert.equal(b.messages.length, 40);
});
test('failed challenge verification attempts have a hard rate cap', () => {
  const b = setup();
  for (let i = 0; i < 11; i++) b.submit(b.data(), {success: false});
  assert.equal(b.fetchCount(), 10); assert.equal(b.messages.length, 0);
});
test('network failure is closed and hides provider details', () => {
  const b = setup({networkError: true}); const html = b.submit(); noSend(b, html, 'verification_failed');
  assert.ok(!html.includes('SIMULATED_PROVIDER_FAILURE'));
});
test('saved lead state contains no raw personal content or token', () => {
  const b = setup(); const p = b.data(); b.submit(p);
  const record = b.state.get('lead:' + p.lead_id);
  for (const privateValue of [p.name, p.company, p.email, p.message, p['cf-turnstile-response']]) assert.ok(!record.includes(privateValue));
});
test('source query/hash are canonicalized without altering original message', () => {
  const b = setup(); b.submit(b.data({source_page: 'https://anna-ai-studios.pages.dev/zh/?source=campaign#contact'}));
  assert.equal(b.messages.length, 2); assert.ok(!b.messages[0].body.includes('campaign#contact'));
});
test('editor preflight reports safe quota metadata without sending', () => {
  const b = setup({quota: 17}); const result = b.context.deploymentPreflight();
  assert.equal(result.remainingDailyRecipients, 17); assert.equal(result.hasTurnstileSecret, true);
  assert.equal(b.messages.length, 0); assert.equal(b.fetchCount(), 0);
  assert.ok(!JSON.stringify(result).includes('LOCAL_TEST_SECRET'));
});
test('relay JSON preserves Chinese mail and exposes only fixed protocol statuses', () => {
  const b = setup(); const p = b.data();
  const text = b.submit(p, {}, relayEvent(p)); const result = JSON.parse(text);
  assert.deepEqual(result, {protocol: 'anna-contact-relay-v1', code: 'accepted', id: p.lead_id,
    language: 'ZH', owner: 'accepted', receipt: 'accepted'});
  assert.equal(b.messages.length, 2); assert.ok(b.messages[0].body.includes(p.message));
  for (const value of [p.name, p.company, p.email, p.message, p['cf-turnstile-response']]) assert.ok(!text.includes(value));
});
test('relay and legacy HTML share the same idempotency record', () => {
  const b = setup(); const p = b.data(); const html = b.submit(p);
  const result = JSON.parse(b.submit(p, {}, relayEvent(p)));
  assert.ok(html.includes('这并不代表最终送达已确认')); assert.equal(result.code, 'accepted');
  assert.equal(b.messages.length, 2); assert.equal(b.fetchCount(), 1);
});
test('relay cannot label a partial receipt as accepted or retry it', () => {
  const b = setup({throwOnMail: 2}); const p = b.data();
  const first = JSON.parse(b.submit(p, {}, relayEvent(p)));
  const retry = JSON.parse(b.submit(p, {}, relayEvent(p)));
  assert.equal(first.code, 'needs_review'); assert.equal(first.owner, 'accepted');
  assert.equal(first.receipt, 'uncertain'); assert.deepEqual(retry, first);
  assert.equal(b.messages.length, 2); assert.equal(b.fetchCount(), 1);
});
test('relay rejects malformed fields with structured non-success and no email', () => {
  const b = setup(); const p = b.data({privacy_consent: 'No'});
  const result = JSON.parse(b.submit(p, {}, relayEvent(p)));
  assert.equal(result.code, 'invalid_request'); assert.equal(result.id, null);
  assert.equal(result.owner, null); assert.equal(result.receipt, null);
  assert.equal(b.messages.length, 0); assert.equal(b.fetchCount(), 0);
});
test('unrecognised backend transport paths cannot send mail', () => {
  for (const pathInfo of ['unknown', 'relay-v1']) {
    const b = setup(); noSend(b, b.submit(b.data(), {}, {pathInfo}), 'invalid_request');
    assert.equal(b.fetchCount(), 0);
  }
});
test('transport query is stripped without changing the 12 business fields or original event', () => {
  const b = setup(); const p = b.data(); const event = relayEvent(p);
  const stripped = b.context.businessEvent_(event);
  assert.equal(Object.keys(stripped.parameters).length, 12); assert.equal(stripped.queryString, null);
  assert.equal(stripped.parameters.transport, undefined); assert.deepEqual(event.parameters.transport, ['relay-v1']);
  const parsed = b.context.parse_(stripped); assert.equal(parsed.message, p.message);
  assert.equal(parsed.name, p.name); assert.equal(stripped.postData.contents, new URLSearchParams(p).toString());
});
for (const query of ['transport=other', 'transport=relay-v1&x=1', 'transport=relay-v1&transport=relay-v1',
  'transport=relay%2Dv1', 'x=1', 'transport=relay-v1&']) test('rejects non-canonical transport query ' + query, () => {
  const b = setup(); const p = b.data(); b.submit(p, {}, relayEvent(p, query));
  assert.equal(b.lastEvent().code, 'invalid_request'); assert.equal(b.messages.length, 0); assert.equal(b.fetchCount(), 0);
});
test('a transport flag in the body cannot impersonate or duplicate the query selector', () => {
  for (const query of ['', 'transport=relay-v1']) {
    const b = setup(); const p = b.data({transport: 'relay-v1'}); b.submit(p, {}, relayEvent(p, query));
    assert.equal(b.lastEvent().code, 'invalid_request'); assert.equal(b.messages.length, 0); assert.equal(b.fetchCount(), 0);
  }
});
test('canonical query still rejects missing, scalar or mismatched merged metadata', () => {
  for (const flag of [undefined, 'relay-v1', ['other'], ['relay-v1', 'other']]) {
    const b = setup(); const p = b.data(); const event = relayEvent(p);
    if (flag === undefined) delete event.parameters.transport; else event.parameters.transport = flag;
    assert.equal(b.context.isRelay_(event), false);
    noSend(b, b.submit(p, {}, event), 'invalid_request'); assert.equal(b.fetchCount(), 0);
  }
});
test('valid transport query does not permit an unknown backend path', () => {
  const b = setup(); const p = b.data(); const event = relayEvent(p); event.pathInfo = 'relay-v1';
  const result = JSON.parse(b.submit(p, {}, event)); assert.equal(result.code, 'invalid_request');
  assert.equal(b.messages.length, 0); assert.equal(b.fetchCount(), 0);
});
process.stdout.write('PASS ' + passed + ' local checks; no real email or deployment performed.\n');
