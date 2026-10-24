'use strict';
// Provider doubles verify actual request/response boundaries without consuming quota or sending mail.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const tests = [];
const test = (name, run) => tests.push([name, run]);
const endpoint = 'https://anna-ai-studios.pages.dev/api/contact';
const google = 'https://script.google.com/macros/s/AKfycbzD1PsWi_LSHxLFE56HPKtgLsvTXl9J0sc2LbU4eIsGEg-Ref2vjStymq-iqptIJUJQ/exec?transport=relay-v1';
const input = (overrides = {}) => ({lead_id: 'ANNA-20261024120000-A001', name: '王测试',
  company: '中文公司', email: 'test@example.com', language: 'ZH', service_code: 'OTHER',
  timeline: 'EXPLORING', message: '这是中文正文，保留中文标点、换行与表情。\r\n第二行：测试 🌊',
  privacy_consent: 'Agreed', source_page: 'https://anna-ai-studios.pages.dev/zh/',
  _honey: '', 'cf-turnstile-response': 'local-token-fixture', ...overrides});
const encode = (value = input()) => new URLSearchParams(value).toString();
const request = (body = encode(), headers = {}, url = endpoint) => new Request(url, {
  method: 'POST', body, headers: {'Content-Type': 'application/x-www-form-urlencoded',
    Origin: 'https://anna-ai-studios.pages.dev', ...headers}, ...(body instanceof ReadableStream ? {duplex: 'half'} : {})
});
const accepted = (overrides = {}) => ({protocol: 'anna-contact-relay-v1', code: 'accepted',
  id: input().lead_id, language: 'ZH', owner: 'accepted', receipt: 'accepted', ...overrides});
const json = (value = accepted()) => new Response(JSON.stringify(value), {headers: {'Content-Type': 'application/json; charset=UTF-8'}});
const redirect = url => new Response(null, {status: 302, headers: {Location: url}});
let handleContact; let worker;

test('GET and HEAD disclose no success and invoke no mail backend', async () => {
  let calls = 0;
  for (const method of ['GET', 'HEAD']) {
    const reply = await handleContact(new Request(endpoint, {method}), () => { calls++; });
    assert.equal(reply.status, 405); assert.equal(reply.headers.get('Allow'), 'POST');
    const text = await reply.text();
    if (method === 'HEAD') assert.equal(text, '');
    else { assert.ok(text.includes('访问此页不会发送邮件')); assert.ok(text.includes('kewangfx')); }
  }
  assert.equal(calls, 0);
});
test('Chinese URL-encoded bytes and single fixed upstream survive unchanged', async () => {
  const original = encode(); const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  let calls = 0;
  const reply = await handleContact(request(original, {Cookie: 'private-cookie', Authorization: 'private-credential'}), async (url, options) => {
    calls++; assert.equal(url, google); assert.equal(options.method, 'POST');
    assert.equal(hash(options.body), hash(original)); assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.Cookie, undefined); assert.equal(options.headers.Authorization, undefined);
    assert.equal(new URLSearchParams(new TextDecoder().decode(options.body)).get('message'), input().message);
    return json();
  });
  assert.equal(calls, 1); assert.equal(reply.status, 200);
  const html = await reply.text(); assert.ok(html.includes('咨询已提交处理'));
  assert.ok(html.includes('这并不代表最终送达已确认')); assert.ok(!html.includes(input().message));
  assert.equal(reply.headers.get('Cache-Control'), 'no-store, max-age=0');
});
test('one allowlisted Google result redirect becomes GET without repeating POST', async () => {
  const calls = []; const target = 'https://script.googleusercontent.com/macros/echo?user_content_key=fixture';
  const reply = await handleContact(request(), async (url, options) => {
    calls.push([url, options]); return calls.length === 1 ? redirect(target) : json();
  });
  assert.equal(reply.status, 200); assert.equal(calls.length, 2);
  assert.equal(calls[0][1].method, 'POST'); assert.equal(calls[1][0], target);
  assert.equal(calls[1][1].method, 'GET'); assert.equal(calls[1][1].body, undefined);
});
for (const [label, target] of [
  ['other host', 'https://evil.example/macros/echo'],
  ['suffix spoof', 'https://script.googleusercontent.com.evil.example/macros/echo'],
  ['credentials', 'https://user:password@script.googleusercontent.com/macros/echo'],
  ['insecure scheme', 'http://script.googleusercontent.com/macros/echo'],
  ['other port', 'https://script.googleusercontent.com:8443/macros/echo'],
  ['other Google path', 'https://script.googleusercontent.com/anything'],
  ['script redirect', 'https://script.google.com/macros/s/another/exec']
]) test('rejects redirect ' + label + ' before requesting it', async () => {
  let calls = 0;
  const reply = await handleContact(request(), async () => { calls++; return redirect(target); });
  assert.equal(calls, 1); assert.equal(reply.status, 502);
});
test('second redirect and POST-preserving redirect never replay the submission', async () => {
  for (const redirectCode of [302, 307, 308]) {
    let calls = 0;
    const reply = await handleContact(request(), async () => {
      calls++; return new Response(null, {status: redirectCode, headers: {Location: 'https://script.googleusercontent.com/macros/echo?fixture=1'}});
    });
    assert.equal(reply.status, 502); assert.equal(calls, redirectCode === 302 ? 2 : 1);
  }
});
for (const [label, body] of [
  ['unknown recipient field', encode() + '&to=attacker%40example.com'],
  ['duplicate field', encode() + '&email=second%40example.com'],
  ['absent consent', encode(input({privacy_consent: ''}))],
  ['honeypot', encode(input({_honey: 'bot'}))],
  ['source spoof', encode(input({source_page: 'https://evil.example/'}))],
  ['malformed percent encoding', encode() + '%GG']
]) test('rejects ' + label + ' without calling upstream', async () => {
  let calls = 0; const reply = await handleContact(request(body), () => { calls++; });
  assert.equal(reply.status, 400); assert.equal(calls, 0);
});
test('mirror native form and absent embedded-browser Origin are accepted', async () => {
  for (const origin of ['https://kewangfx.github.io', undefined]) {
    const req = request(encode(input({source_page: 'https://kewangfx.github.io/anna-ai-studios/zh/'})), {Origin: origin || ''});
    if (origin === undefined) req.headers.delete('Origin');
    const reply = await handleContact(req, async () => json()); assert.equal(reply.status, 200);
    assert.ok((await reply.text()).includes('href="https://kewangfx.github.io/anna-ai-studios/zh/#contact"'));
  }
});
test('foreign and source-mismatched Origin cannot reach backend', async () => {
  for (const origin of ['https://evil.example', 'https://kewangfx.github.io', 'null']) {
    let calls = 0; const reply = await handleContact(request(encode(), {Origin: origin}), () => { calls++; });
    assert.equal(reply.status, 400); assert.equal(calls, 0);
  }
});
test('64 KiB guard checks stream bytes even with a false small Content-Length', async () => {
  for (const declared of ['65537', '1']) {
    let calls = 0;
    const stream = new ReadableStream({start(controller) {
      controller.enqueue(new Uint8Array(32768)); controller.enqueue(new Uint8Array(32769)); controller.close();
    }});
    const reply = await handleContact(request(stream, {'Content-Length': declared}), () => { calls++; });
    assert.equal(reply.status, 413); assert.equal(calls, 0);
  }
});
test('JSON/multipart bodies and query-selected destinations are refused', async () => {
  let calls = 0;
  for (const type of ['application/json', 'multipart/form-data; boundary=x']) {
    const reply = await handleContact(request(encode(), {'Content-Type': type}), () => { calls++; });
    assert.equal(reply.status, 400);
  }
  const query = await handleContact(request(encode(), {}, endpoint + '?url=https://evil.example'), () => { calls++; });
  assert.equal(query.status, 400); assert.equal(calls, 0);
});
test('partial sends and false success never display the accepted heading', async () => {
  for (const status of [accepted({receipt: 'uncertain'}), accepted({code: 'needs_review', receipt: 'uncertain'}),
    accepted({id: 'ANNA-20261024120000-FFFF'}), accepted({language: 'EN'}), accepted({protocol: 'unknown'})]) {
    const reply = await handleContact(request(), async () => json(status));
    assert.notEqual(reply.status, 200); const html = await reply.text();
    assert.ok(html.includes('暂时无法确认完整提交')); assert.ok(html.includes(input().lead_id));
    assert.ok(!html.includes('<h1>咨询已提交处理</h1>')); assert.ok(html.includes('kewangfx'));
  }
});
test('known backend error is non-success without leaking upstream fields', async () => {
  const reply = await handleContact(request(), async () => json(accepted({code: 'temporarily_limited', id: null, owner: null, receipt: null})));
  assert.equal(reply.status, 503); assert.ok((await reply.text()).includes('请勿立即重复提交'));
});
test('Google HTML, malformed or oversized JSON and provider errors stay unconfirmed', async () => {
  for (const response of [new Response('<iframe src="https://script.google.com">', {headers: {'Content-Type': 'text/html'}}),
    new Response('{broken', {headers: {'Content-Type': 'application/json'}}),
    new Response(' '.repeat(8193), {headers: {'Content-Type': 'application/json'}}),
    new Response('secret-provider-detail', {status: 500})]) {
    let calls = 0; const reply = await handleContact(request(), async () => { calls++; return response; });
    assert.equal(reply.status, 502); assert.equal(calls, 1);
    const html = await reply.text(); assert.ok(!html.includes('secret-provider-detail')); assert.ok(!html.includes('<iframe'));
  }
});
test('network rejection retains the reference and does not automatically retry', async () => {
  let calls = 0;
  const reply = await handleContact(request(), async () => { calls++; throw Error('provider secret'); });
  assert.equal(reply.status, 502); assert.equal(calls, 1);
  const html = await reply.text(); assert.ok(html.includes(input().lead_id)); assert.ok(!html.includes('provider secret'));
});
test('English results and the static asset fallback keep the expected contract', async () => {
  const reply = await handleContact(request(encode(input({language: 'EN', source_page: 'https://anna-ai-studios.pages.dev/'}))),
    async () => json(accepted({language: 'EN'})));
  const html = await reply.text(); assert.ok(html.includes('Enquiry submitted for processing'));
  assert.ok(html.includes('final delivery is not yet confirmed')); assert.ok(html.includes('WeChat ID:'));
  const asset = new Response('static'); let assets = 0;
  const result = await worker.fetch(new Request('https://anna-ai-studios.pages.dev/style.css'), {ASSETS: {fetch(req) {
    assets++; assert.equal(new URL(req.url).pathname, '/style.css'); return asset;
  }}});
  assert.equal(result, asset); assert.equal(assets, 1);
});

(async () => {
  const source = fs.readFileSync(__dirname + '/_worker.js', 'utf8');
  const module = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  handleContact = module.handleContact; worker = module.default;
  for (const [name, run] of tests) { await run(); process.stdout.write('PASS ' + name + '\n'); }
  process.stdout.write('PASS ' + tests.length + ' relay checks; no real network, mail or deployment.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
