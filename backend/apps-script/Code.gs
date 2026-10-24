/* LOCAL CANDIDATE. No production endpoint or credentials are included here.
 * Only the owner notification contains user text. The visitor gets a fixed receipt.
 * MailApp acceptance is not inbox-delivery evidence; that requires a real inbox check.
 */
const ANNA = Object.freeze({
  owner: 'keke19870699@gmail.com',
  hosts: ['anna-ai-studios.pages.dev', 'kewangfx.github.io'],
  action: 'anna_contact',
  services: ['AI-DISCOVERY', 'AI-FILM', 'WORKFLOW-AUTOMATION', 'MULTIMODAL-QA',
    'AGENT-INTEGRATION', 'BRAND-LAB', 'AI-RECEPTIONIST', 'REVIEW-AUTOMATION',
    'REVENUE-WEBSITE', 'OTHER'],
  timelines: ['NOT-SPECIFIED', 'NOW', '0-4-WEEKS', '1-3-MONTHS', 'EXPLORING'],
  day: 86400000,
  retain: 7 * 86400000,
  leadsPerDay: 20,
  leadsPerHour: 5,
  leadsPerEmailPerDay: 2,
  verificationsPerDay: 200,
  verificationsPerMinute: 10,
  reserveRecipients: 2
});

function doGet() { return page_({code: 'post_required'}, 'EN'); }

// Run manually in the owner editor after reviewing Google OAuth scopes.
// This consumes no mail recipients and never returns the Turnstile secret.
function deploymentPreflight() {
  const p = PropertiesService.getScriptProperties();
  const result = {
    remainingDailyRecipients: MailApp.getRemainingDailyQuota(),
    enabled: p.getProperty('ANNA_ENABLED') === 'true',
    hasTurnstileSecret: Boolean(p.getProperty('TURNSTILE_SECRET')),
    requiredRecipientsPerLead: 2, reserveRecipients: ANNA.reserveRecipients,
    leadsPerRolling24Hours: ANNA.leadsPerDay,
    productionHostnames: ANNA.hosts.slice()
  };
  console.log(JSON.stringify(result));
  return result;
}

function doPost(e) {
  let language = 'EN';
  let lock;
  try {
    const input = parse_(e);
    language = input.language;
    lock = LockService.getScriptLock();
    if (!lock.tryLock(1000)) return page_({code: 'busy'}, language);
    const properties = PropertiesService.getScriptProperties();
    if (properties.getProperty('ANNA_ENABLED') !== 'true') fail_('unavailable');
    const secret = properties.getProperty('TURNSTILE_SECRET');
    if (!secret || secret.length < 20) fail_('unavailable');
    const now = Date.now();
    const fingerprint = hash_(JSON.stringify([
      input.name, input.company, input.email, input.message, input.language,
      input.service_code, input.timeline, input.source_page, input.privacy_consent
    ]));
    const key = 'lead:' + input.lead_id;
    const old = read_(properties, key, null);
    // An identical retry only reports the stored result: it never resends mail.
    if (old) {
      if (old.fingerprint !== fingerprint) fail_('lead_conflict');
      return page_(result_(old), language);
    }
    validateLeadAge_(input.lead_id, now);
    prune_(properties, now);
    const tokenHash = hash_(input.token);
    if (properties.getProperty('token:' + tokenHash)) fail_('verification_failed');
    // Bound external verification work even when an attacker invents lead IDs.
    const attempts = read_(properties, 'verification_attempts', [])
      .filter(time => now - time < ANNA.day);
    if (attempts.length >= ANNA.verificationsPerDay ||
        attempts.filter(time => now - time < 60000).length >= ANNA.verificationsPerMinute) {
      fail_('temporarily_limited');
    }
    attempts.push(now);
    properties.setProperty('verification_attempts', JSON.stringify(attempts));
    verify_(secret, input, now);
    properties.setProperty('token:' + tokenHash, String(now));

    const emailHash = hash_(input.email.toLowerCase());
    const ledger = read_(properties, 'lead_reservations', [])
      .filter(entry => now - entry.at < ANNA.day);
    if (ledger.length >= ANNA.leadsPerDay ||
        ledger.filter(entry => now - entry.at < 3600000).length >= ANNA.leadsPerHour ||
        ledger.filter(entry => entry.email === emailHash).length >= ANNA.leadsPerEmailPerDay) {
      fail_('temporarily_limited');
    }
    requireQuota_(2);
    // Reservations are charged before sending and never refunded after an error.
    // This conservatively bounds uncertain sends, crashes and repeated requests.
    ledger.push({at: now, email: emailHash});
    properties.setProperty('lead_reservations', JSON.stringify(ledger));
    const record = {
      id: input.lead_id, at: now, fingerprint: fingerprint,
      owner: 'not_attempted', receipt: 'not_attempted'
    };
    save_(properties, key, record);
    const ownerMessage = {
      to: ANNA.owner,
      replyTo: input.email,
      name: 'Anna AI Studios',
      subject: '[ANNA-LEAD][' + input.language + '][' + input.service_code + '] ' + input.lead_id,
      body: ownerBody_(input, now)
    };
    // Persist uncertainty before each irreversible call. A crash cannot trigger a resend.
    record.owner = 'uncertain';
    save_(properties, key, record);
    try { MailApp.sendEmail(ownerMessage); }
    catch (_) { return page_(result_(record), language); }
    record.owner = 'accepted';
    save_(properties, key, record);
    try { requireQuota_(1); }
    catch (_) { return page_(result_(record), language); }
    record.receipt = 'uncertain';
    save_(properties, key, record);
    try {
      MailApp.sendEmail({
        to: input.email,
        replyTo: ANNA.owner,
        name: 'Anna AI Studios',
        subject: '[ANNA-RECEIPT] ' + input.lead_id,
        body: receiptBody_(input.language, input.lead_id)
      });
    } catch (_) { return page_(result_(record), language); }
    record.receipt = 'accepted';
    save_(properties, key, record);
    return page_(result_(record), language);
  } catch (error) {
    // Never expose provider responses, tokens, email addresses or stack traces publicly.
    const known = error && error.annaCode;
    return page_({code: known || 'temporarily_unavailable'}, language);
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function parse_(e) {
  if (!e || !e.postData || !/^application\/x-www-form-urlencoded(?:;|$)/i.test(e.postData.type) ||
      e.queryString || e.contentLength < 0 || e.contentLength > 65536) fail_('invalid_request');
  const allowed = ['lead_id', 'name', 'company', 'email', 'language', 'service_code',
    'timeline', 'message', 'privacy_consent', 'source_page', '_honey', 'cf-turnstile-response'];
  const p = e.parameters || {};
  if (Object.keys(p).some(key => allowed.indexOf(key) < 0 || !Array.isArray(p[key]) ||
      p[key].length !== 1 || typeof p[key][0] !== 'string')) fail_('invalid_request');
  const field = (key, min, max, multiline) => {
    const value = p[key] ? p[key][0] : '';
    const forbidden = multiline ? /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/ : /[\x00-\x1F\x7F]/;
    // Validate without transliteration, Unicode normalization or HTML conversion.
    if (value.trim().length < min || value.length > max || forbidden.test(value)) fail_('invalid_request');
    return value;
  };
  if (field('_honey', 0, 200, false)) fail_('invalid_request');
  const input = {
    lead_id: field('lead_id', 20, 64, false),
    name: field('name', 2, 100, false),
    company: field('company', 0, 160, false),
    email: field('email', 3, 254, false).trim(),
    language: field('language', 2, 2, false),
    service_code: field('service_code', 1, 40, false),
    timeline: field('timeline', 1, 40, false),
    message: field('message', 20, 6000, true),
    privacy_consent: field('privacy_consent', 2, 8, false),
      source_page: field('source_page', 1, 1000, false),
    token: field('cf-turnstile-response', 1, 2048, false)
  };
  if (!/^ANNA-\d{14}-[A-F0-9]{4,32}$/.test(input.lead_id) ||
      !/^(EN|ZH)$/.test(input.language) || ANNA.services.indexOf(input.service_code) < 0 ||
      ANNA.timelines.indexOf(input.timeline) < 0 || input.privacy_consent !== 'Agreed') fail_('invalid_request');
  // One ASCII mailbox only: no commas, display names, CRLF, CC/BCC or SMTP parameters.
  const email = input.email;
  if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(email) ||
      email.split('@')[0].length > 64 || /(^\.|\.\.|\.@)/.test(email)) fail_('invalid_request');
  const sources = ['https://anna-ai-studios.pages.dev/', 'https://anna-ai-studios.pages.dev/zh/',
    'https://kewangfx.github.io/anna-ai-studios/', 'https://kewangfx.github.io/anna-ai-studios/zh/'];
  // Browser location.href may include campaign query/hash. They never enter emails or redirects.
  input.source_page = input.source_page.split(/[?#]/)[0];
  if (sources.indexOf(input.source_page) < 0) fail_('invalid_request');
  return input;
}

function validateLeadAge_(id, now) {
  const stamp = id.split('-')[1];
  const iso = stamp.slice(0,4) + '-' + stamp.slice(4,6) + '-' + stamp.slice(6,8) + 'T' +
    stamp.slice(8,10) + ':' + stamp.slice(10,12) + ':' + stamp.slice(12,14) + 'Z';
  const at = Date.parse(iso);
  if (!Number.isFinite(at) || new Date(at).toISOString().slice(0,19) !== iso.slice(0,19) ||
      now - at > 15 * 60000 || at - now > 60000) fail_('expired_lead');
}

function verify_(secret, input, now) {
  let reply;
  try {
    const response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', contentType: 'application/x-www-form-urlencoded',
      payload: {secret: secret, response: input.token},
      followRedirects: false, muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) fail_('verification_failed');
    reply = JSON.parse(response.getContentText('UTF-8'));
  } catch (_) { fail_('verification_failed'); }
  const at = Date.parse(reply.challenge_ts);
  // Hostname is authoritative only in Cloudflare's signed verification response.
  if (reply.success !== true || ANNA.hosts.indexOf(reply.hostname) < 0 ||
      reply.action !== ANNA.action || reply.cdata !== input.lead_id || !Number.isFinite(at) ||
      now - at > 300000 || at - now > 60000) fail_('verification_failed');
  const claimedHost = input.source_page.split('/')[2];
  if (reply.hostname !== claimedHost) fail_('verification_failed');
}

function ownerBody_(input, now) {
  return [
    'Anna AI Studios consultation', 'Lead ID: ' + input.lead_id,
    'Accepted at UTC: ' + new Date(now).toISOString(), 'Language: ' + input.language,
    'Name: ' + input.name, 'Company: ' + input.company, 'Email: ' + input.email,
    'Service: ' + input.service_code, 'Timeline: ' + input.timeline,
    'Source: ' + input.source_page, 'Privacy consent: accepted', '',
    '--- Original message ---', input.message, '--- End of original message ---'
  ].join('\n');
}

function receiptBody_(language, id) {
  // Fixed copy avoids turning the receipt path into an attacker-controlled mail relay.
  return language === 'ZH' ?
    '感谢联系 Anna AI Studios。\n咨询编号：' + id +
    '\n你的咨询已提交处理。我们通常会在两个工作日内回复。\n如未收到人工回复，请联系 keke19870699@gmail.com 并提供咨询编号。\n如你未提交咨询，请忽略此自动邮件。' :
    'Thank you for contacting Anna AI Studios.\nReference: ' + id +
    '\nYour enquiry has been submitted for processing. We usually reply within two business days.' +
    '\nIf you do not hear from us, email keke19870699@gmail.com with this reference.' +
    '\nIf you did not submit an enquiry, please ignore this automated email.';
}

function requireQuota_(recipients) {
  const available = MailApp.getRemainingDailyQuota();
  if (!Number.isInteger(available) || available < recipients + ANNA.reserveRecipients) fail_('temporarily_limited');
}
function read_(p, key, fallback) { const value = p.getProperty(key); return value ? JSON.parse(value) : fallback; }
function save_(p, key, value) { p.setProperty(key, JSON.stringify(value)); }
function hash_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8)
    .map(byte => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('');
}
function prune_(p, now) {
  const all = p.getProperties();
  Object.keys(all).forEach(key => {
    if (key.indexOf('token:') === 0 && now - Number(all[key]) > 600000) p.deleteProperty(key);
    if (key.indexOf('lead:') === 0 && now - JSON.parse(all[key]).at > ANNA.retain) p.deleteProperty(key);
  });
}
function fail_(code) { const error = new Error(code); error.annaCode = code; throw error; }
function result_(record) {
  return {code: record.owner === 'accepted' && record.receipt === 'accepted' ? 'accepted' : 'needs_review',
    id: record.id, owner: record.owner, receipt: record.receipt};
}
function escape_(value) { return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function page_(result, language) {
  // Structured operator trace contains statuses and a lead reference, not user text.
  console.log(JSON.stringify({event: 'anna_submission', code: result.code,
    lead: result.id || null, owner: result.owner || null, receipt: result.receipt || null}));
  const zh = language === 'ZH';
  const accepted = result.code === 'accepted';
  const title = accepted ? (zh ? '咨询已提交处理' : 'Enquiry submitted for processing') :
    (zh ? '暂时无法确认完整提交' : 'Submission could not be fully confirmed');
  const message = accepted ?
    (zh ? '邮件服务已接受咨询通知和自动回执。请检查收件箱及垃圾邮件；这并不代表最终送达已确认。' :
      'The mail service accepted the notification and receipt. Check your inbox and spam folder; final delivery is not yet confirmed.') :
    (zh ? '请勿立即重复提交。如需协助，请直接发邮件并提供下方编号。' :
      'Please do not immediately resubmit. Contact us directly with the reference below for help.');
  const url = zh ? 'https://anna-ai-studios.pages.dev/zh/#contact' : 'https://anna-ai-studios.pages.dev/#contact';
  const details = result.id ? (zh ? '咨询编号：' : 'Reference: ') + result.id : '';
  // Native form navigation works without CORS or an opaque no-cors success assumption.
  return HtmlService.createHtmlOutput('<!doctype html><html lang="' + (zh ? 'zh-CN' : 'en') +
    '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Anna AI Studios</title><style>body{margin:0;background:#060807;color:#f2efe6;font:16px/1.6 system-ui,sans-serif}' +
    'main{max-width:640px;margin:10vh auto;padding:24px;overflow-wrap:anywhere}a{color:#69f5d4}</style></head><body><main>' +
    '<p>ANNA AI STUDIOS</p><h1>' + escape_(title) + '</h1><p>' + escape_(message) + '</p>' +
    '<p>' + escape_(details) + '</p><p><a href="mailto:keke19870699@gmail.com">keke19870699@gmail.com</a></p>' +
    '<p><a target="_top" href="' + url + '">' + (zh ? '返回网站' : 'Return to website') + '</a></p>' +
    '</main></body></html>');
}
