// Only /api/contact invokes this module in production; static routes remain free assets.
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzD1PsWi_LSHxLFE56HPKtgLsvTXl9J0sc2LbU4eIsGEg-Ref2vjStymq-iqptIJUJQ/exec?transport=relay-v1';
const PROTOCOL = 'anna-contact-relay-v1';
const BODY_LIMIT = 65536;
const RESULT_LIMIT = 8192;
const UPSTREAM_TIMEOUT_MS = 45000;
const FIELDS = ['lead_id', 'name', 'company', 'email', 'language', 'service_code',
  'timeline', 'message', 'privacy_consent', 'source_page', '_honey', 'cf-turnstile-response'];
const SOURCES = ['https://anna-ai-studios.pages.dev/', 'https://anna-ai-studios.pages.dev/zh/',
  'https://kewangfx.github.io/anna-ai-studios/', 'https://kewangfx.github.io/anna-ai-studios/zh/'];
const FAILURE_CODES = new Set(['invalid_request', 'busy', 'unavailable', 'lead_conflict',
  'expired_lead', 'verification_failed', 'temporarily_limited', 'temporarily_unavailable']);
const LEAD_ID = /^ANNA-\d{14}-[A-F0-9]{4,32}$/;

function fault(code) { const error = new Error(code); error.relayCode = code; throw error; }

async function boundedBody(stream, maximum, exceededCode = 'too_large') {
  if (!stream) return new Uint8Array(0);
  const reader = stream.getReader(); const chunks = []; let length = 0;
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      length += value.byteLength;
      // Enforce the actual stream length: Content-Length can be absent or dishonest.
      if (length > maximum) { await reader.cancel(); fault(exceededCode); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length); let at = 0;
  for (const chunk of chunks) { result.set(chunk, at); at += chunk.byteLength; }
  return result;
}

function inspectForm(bytes, origin) {
  let text;
  try { text = new TextDecoder('utf-8', {fatal: true}).decode(bytes); }
  catch (_) { fault('invalid_request'); }
  if (/%(?![A-Fa-f0-9]{2})/.test(text)) fault('invalid_request');
  const data = new URLSearchParams(text);
  const keys = [...data.keys()];
  if (keys.length !== FIELDS.length || keys.some(key => !FIELDS.includes(key)) ||
      FIELDS.some(key => data.getAll(key).length !== 1)) fault('invalid_request');
  const language = data.get('language'); const id = data.get('lead_id');
  const source = data.get('source_page').split(/[?#]/)[0];
  if (!/^(EN|ZH)$/.test(language) || !LEAD_ID.test(id) || !SOURCES.includes(source) ||
      data.get('privacy_consent') !== 'Agreed' || data.get('_honey') ||
      !data.get('cf-turnstile-response') || data.get('cf-turnstile-response').length > 2048) fault('invalid_request');
  // Origin is optional in older embedded browsers. Turnstile still authoritatively binds
  // hostname, action and lead ID at the backend; a present Origin must match that source.
  if (origin && origin !== new URL(source).origin) fault('invalid_origin');
  return {language, id, source};
}

function inspectResult(value, input) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      value.protocol !== PROTOCOL || !/^(EN|ZH)$/.test(value.language)) fault('invalid_upstream');
  if (value.code === 'accepted' || value.code === 'needs_review') {
    if (value.id !== input.id || value.language !== input.language ||
        !['accepted', 'uncertain', 'not_attempted'].includes(value.owner) ||
        !['accepted', 'uncertain', 'not_attempted'].includes(value.receipt)) fault('invalid_upstream');
    const bothAccepted = value.owner === 'accepted' && value.receipt === 'accepted';
    if ((value.code === 'accepted') !== bothAccepted) fault('invalid_upstream');
    return value.code;
  }
  if (!FAILURE_CODES.has(value.code) || value.id !== null || value.owner !== null ||
      value.receipt !== null) fault('invalid_upstream');
  return value.code;
}

async function upstream(bytes, input, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    // Construct fresh headers rather than forwarding visitor cookies or credentials.
    let reply = await fetchImpl(ENDPOINT, {method: 'POST', body: bytes,
      headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'Accept': 'application/json'},
      redirect: 'manual', signal: controller.signal});
    if (reply.status === 302 || reply.status === 303) {
      const location = reply.headers.get('Location'); let next;
      try { next = new URL(location || '', ENDPOINT); } catch (_) { fault('invalid_upstream'); }
      if (next.protocol !== 'https:' || next.hostname !== 'script.googleusercontent.com' ||
          next.port || next.username || next.password || next.hash || next.pathname !== '/macros/echo') {
        if (reply.body) await reply.body.cancel();
        fault('invalid_upstream');
      }
      if (reply.body) await reply.body.cancel();
      // Google ContentService redirects only the result. Never replay the mail POST.
      reply = await fetchImpl(next.href, {method: 'GET', headers: {'Accept': 'application/json'},
        redirect: 'manual', signal: controller.signal});
    }
    if (reply.status !== 200 || !/^application\/json(?:;|$)/i.test(reply.headers.get('Content-Type') || '')) {
      if (reply.body) await reply.body.cancel();
      fault('invalid_upstream');
    }
    const resultBytes = await boundedBody(reply.body, RESULT_LIMIT, 'invalid_upstream');
    let result;
    try { result = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(resultBytes)); }
    catch (_) { fault('invalid_upstream'); }
    return inspectResult(result, input);
  } finally { clearTimeout(timer); }
}

function escape(value) { return String(value).replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch])); }

function resultPage(code, language, id, status = 200, bilingual = false, source = null) {
  const zh = language === 'ZH'; const accepted = code === 'accepted';
  const title = bilingual ? '咨询入口 / Enquiry endpoint' : accepted ?
    (zh ? '咨询已提交处理' : 'Enquiry submitted for processing') :
    (zh ? '暂时无法确认完整提交' : 'Submission could not be fully confirmed');
  const message = bilingual ?
    '请从网站咨询表单提交。访问此页不会发送邮件。 / Submit from the website form. Opening this page does not send email.' : accepted ?
    (zh ? '邮件服务已接受咨询通知和自动回执。请检查收件箱及垃圾邮件；这并不代表最终送达已确认。' :
      'The mail service accepted the notification and receipt. Check your inbox and spam folder; final delivery is not yet confirmed.') :
    (zh ? '请勿立即重复提交，邮件可能已进入处理。可通过微信或邮箱联系我们，并提供下方编号。' :
      'Please do not immediately resubmit; processing may already have started. Contact us by WeChat or email with the reference below.');
  // Only an already allowlisted source may determine navigation; no user text enters a URL.
  const back = (SOURCES.includes(source) ? source : zh ? 'https://anna-ai-studios.pages.dev/zh/' : 'https://anna-ai-studios.pages.dev/') + '#contact';
  const reference = id && LEAD_ID.test(id) ? '<p>' + (zh ? '咨询编号：' : 'Reference: ') + escape(id) + '</p>' : '';
  const html = '<!doctype html><html lang="' + (zh ? 'zh-CN' : 'en') + '"><head>' +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow"><title>Anna AI Studios</title>' +
    '<style>body{margin:0;background:#060807;color:#f2efe6;font:16px/1.6 system-ui,sans-serif}' +
    'main{max-width:640px;margin:10vh auto;padding:24px;overflow-wrap:anywhere}a{color:#69f5d4}h1{font-size:clamp(1.5rem,6vw,2.2rem);line-height:1.25}' +
    '</style></head><body><main><p>ANNA AI STUDIOS</p><h1>' + escape(title) + '</h1><p>' + escape(message) + '</p>' + reference +
    '<p>' + (zh ? '微信号：' : 'WeChat ID: ') + '<strong>kewangfx</strong></p>' +
    '<p><a href="mailto:keke19870699@gmail.com">keke19870699@gmail.com</a></p>' +
    '<p><a href="' + back + '">' + (zh ? '返回网站联系入口' : 'Return to website contact options') + '</a></p>' +
    (bilingual ? '<p><a href="https://anna-ai-studios.pages.dev/zh/#contact">中文咨询</a> · <a href="https://anna-ai-studios.pages.dev/#contact">English enquiries</a></p>' : '') +
    '</main></body></html>';
  return new Response(html, {status, headers: {
    'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store, max-age=0',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
    ...(status === 405 ? {'Allow': 'POST'} : {})
  }});
}

export async function handleContact(request, fetchImpl = fetch) {
  const url = new URL(request.url);
  let input = {language: /\bzh\b/i.test(request.headers.get('Accept-Language') || '') ? 'ZH' : 'EN', id: null};
  if (url.pathname !== '/api/contact' || url.search) return resultPage('invalid_request', input.language, null, 400);
  if (request.method !== 'POST') {
    const response = resultPage('post_required', input.language, null, 405, true);
    return request.method === 'HEAD' ? new Response(null, response) : response;
  }
  try {
    if (!/^application\/x-www-form-urlencoded(?:\s*;\s*charset=utf-8)?\s*$/i.test(request.headers.get('Content-Type') || '')) fault('invalid_request');
    const declaredLength = request.headers.get('Content-Length');
    if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > BODY_LIMIT)) fault('too_large');
    const bytes = await boundedBody(request.body, BODY_LIMIT);
    input = inspectForm(bytes, request.headers.get('Origin'));
    const code = await upstream(bytes, input, fetchImpl);
    return resultPage(code, input.language, input.id, code === 'accepted' ? 200 : 503, false, input.source);
  } catch (error) {
    const code = error && error.relayCode;
    const status = code === 'too_large' ? 413 : ['invalid_request', 'invalid_origin'].includes(code) ? 400 : 502;
    // A transport failure cannot establish whether the backend already sent either mail.
    return resultPage('unconfirmed', input.language, input.id, status, false, input.source);
  }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === '/api/contact') return handleContact(request);
    return env.ASSETS.fetch(request);
  }
};
