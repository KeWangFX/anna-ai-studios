# Anna AI Studios — mainland China and WeChat release QA

Checkpoint: 25 October 2026, Europe/London. The 24 October mainland measurements below are historical samples and have not been repeated on 25 October. Scope: mainland-network reachability, WeChat-oriented contact alternatives, bilingual consultation transport, free-service limits and preservation of the existing visual style. FrameFetch is excluded.

## Current verdict

**Partially verified; the new relay's real-mail delivery and mobile WeChat usability are not closed.** Relay snapshot `7e378e5` removed the visitor's direct Google connection and added local WeChat/email copying. The subsequent production snapshot `b70e531defc715e8146091cc4ce32ddc95aa9151` adds local verification diagnostics and stale-callback guards. Published content, negative submission handling and sampled mainland HTTP reachability have evidence. Today's Chinese primary-site and English mirror tests have reached visible Cloudflare manual checkboxes, but those challenges have not been completed and no consultation POST has occurred. No new inbox-delivery success is claimed.

The current deployed checkpoint is [Cloudflare release 880c3829](https://880c3829.anna-ai-studios.pages.dev), with the same source successfully published by [GitHub Pages run 40183725039](https://github.com/KeWangFX/anna-ai-studios/actions/runs/40183725039). It is not a final acceptance verdict for the entire task. The two legacy thank-you pages still reference CSS version `20261023e` in this deployed snapshot; this source now corrects both to `20261024d`. The subsequent deployment and four-route verification are recorded in the saved 25 October acceptance-status report.

## 25 October continuation checks

- PASS: `npm run validate` and `git diff --check` completed after the diagnostic/guard changes. Coverage includes responsive runtime, nine 404 routes and CSP hashes, form lifecycle and diagnostic privacy boundaries, actual HTML/backend field contracts, 46 backend checks, bilingual local copying, 26 relay checks and validation of all 13 built HTML documents.
- PASS: 32 production page/resource GETs across the primary host and GitHub mirror returned HTTP 200 and matched the saved `b70e531` source after text line-ending normalization. All 12 HTML documents that load the shared script, on each host, reference `script.js?v=20261024e`. The raw CSS files also match saved source. The four deployed thank-you-page responses (two routes on two hosts) retain the older CSS query noted above; the evidence records that version discrepancy rather than treating it as missing CSS content.
- PASS: verification diagnostics and callback guards are deployed. Diagnostic output is confined to the local browser console: allowlisted event names, bounded elapsed time, page visibility and a strictly six-digit provider error code where supplied. It contains no consultation fields, token, reference, URL or exception text and introduces no remote collection or persistent storage. Script failures settle once; late events and synchronous terminal callbacks cannot restart or execute a stale attempt. CAPTCHA verification and deliberate retry remain enforced.
- CONFIRMED: the current Cloudflare account UI again shows Workers **Free**, $0, with its shared daily allowance. This is a plan check, not a claim about the unused request balance.
- PENDING: the two tests marked `ANNA-CHINA-RELAY-20261025` are at visible manual verification checkboxes. The browser operation rule requires action-time confirmation before completing them; they have not been solved or bypassed. The saved screenshots establish the current challenge state, not submission or email delivery.
- BLOCKED AT NETWORK CHECK: the logged-in Windows WeChat client opened the owner's existing Anna URL in its actual built-in browser, then displayed a DNS error for `weixin110.qq.com`. A reload left the same `DNS_PROBE_POSSIBLE` page. This is a real desktop-WeChat attempt, not a phone test; it does not establish that Anna is blocked by WeChat or that Anna's page/form successfully loaded in that browser.

Evidence in the 25 October directory: `published-content-check.json`, `workers-free-plan.txt`, `current-chinese-captcha.png`, `current-english-captcha.png`, `wechat-desktop-dns-error.png` and `wechat-desktop-dns-error.txt`.

## Deployed architecture and safe failure

- Both language forms submit to `https://anna-ai-studios.pages.dev/api/contact`. The Cloudflare relay calls the existing owner-controlled Apps Script backend on the server and renders the result on the studio domain; the browser does not open a Google result iframe.
- Apps Script version 3 uses the strictly validated `transport=relay-v1` query selector and the `anna-contact-relay-v1` response protocol. The earlier path-based selector was abandoned. The existing twelve business fields, Turnstile server verification, idempotency ledger and send limits remain enforced.
- The relay has one fixed upstream, limits input/result size, follows only the allowlisted Google result redirect as GET, forwards no visitor cookies or credentials, and never automatically replays a mail POST. Partial sends, transport errors and unexpected responses remain unconfirmed.
- Both language consent and privacy notices disclose Cloudflare forwarding and Google delivery. The relay does not intentionally store or log enquiry bodies. Public result responses are `no-store` and do not embed the enquiry text.
- GitHub Pages uses a static-only build. It excludes Worker/routing files, while the Cloudflare build includes the narrowly routed Worker. Backend source may exist in the source repository; secrets must not. The mirror shares the same Cloudflare form endpoint, so it is not an independent submission backend.

Evidence: `deployed-backend-protocol.json` records an actual version 3 JSON `invalid_request` response to an incomplete payload, with no mail attempted. `production-relay-check.json` records production GET 405, incomplete POST 400, and invalid-Turnstile POST 503. None displays an accepted heading or a Google frame. These are safe rejection/transport checks, not evidence of a successful valid consultation.

## 24 October mainland HTTP sampling — historical record

The six mainland probes cover Guangzhou, Shanghai, Wuxi, Nanning, Nanjing and Guilin, with two points each labelled China Telecom, China Unicom and China Mobile. Two London probes are controls. Geography, ASN and access-network labels are supplied by Globalping; some probes share volunteer tags. These are sampled HTTP measurements, not a long-term availability rate or physical WeChat-device test.

| Target / stage | Mainland result | UK control | Meaning |
| --- | --- | --- | --- |
| Deployed Chinese primary site | 5/6 HTTP 200 | 2/2 HTTP 200 | New-version HTML returned; one Shanghai Unicom TLS timeout |
| Deployed Chinese GitHub mirror | 4/6 HTTP 200 | 2/2 HTTP 200 | New-version HTML returned; Guangzhou Telecom TLS and Nanning Unicom TCP timeouts |
| Deployed `/api/contact` GET | 5/6 expected HTTP 405 | 2/2 expected HTTP 405 | Bilingual endpoint is reachable and rejects GET; Nanning Unicom first-byte timeout |
| Earlier direct Google endpoint GET | 0/6; TCP timeouts | 2/2 HTTP 200 | The old visitor-to-Google dependency failed at every sampled mainland point |
| Earlier actual Turnstile JavaScript | 6/6 HTTP 200 | 2/2 HTTP 200 | Script resource reachable; no conclusion about a completed challenge or token |

Post-deployment measurements began on 24 October around 11:51:50 London time (BST), against relay snapshot `7e378e5`. They are not fresh network measurements of the 25 October diagnostic release. Expected 405 pages include both languages, the WeChat ID and contact return links. **405 is not consultation acceptance or mail delivery.** Comparing different paths/methods/times does not establish a strict performance-improvement percentage. Main-site, mirror and Turnstile accessibility can still vary between networks.

Source: `post-deploy-network-results.md`, `post-deploy-network-results.json`, `network-results.md` and `network-summary-final.json`, with the original Globalping request/result files retained. An early incorrectly constructed Turnstile path returned 404 and is explicitly excluded from availability conclusions; the corrected redirect and actual script were checked separately.

## 24 October static, mobile and functional evidence

- Published content checks match the saved source snapshot and expected CSP. Browser forms use the studio relay endpoint; external Google form/frame origins are no longer required in page CSP.
- Local browser evidence covers the new Chinese fallback at a 375px viewport and English fallback at 320px. Available content widths were 360px and 305px respectively, with equal scroll widths: no horizontal overflow in those checked states. Both copy buttons have a 44px minimum height.
- The Chinese copied draft preserves Chinese characters, traditional/simplified text, emoji and line breaks. The English empty-form draft remains usable, with visible labels and unfilled placeholders. Copy does not trigger native validation, Turnstile, POST or email.
- Only the allowlisted visible name, company, email, project type, timing and brief are copied; option labels are localized. Hidden tokens, lead references and honeypot values are excluded. Clipboard rejection/unavailability exposes selectable readonly text, and the status explicitly says the enquiry has not been sent. Delayed clipboard results cannot overwrite a newer operation; edits clear obsolete previews.
- WeChat instructions conditionally explain same-phone QR recognition, searching `kewangfx`, and using the top-right menu to open a page in the browser when needed. They do not detect an IP/UA and forcibly disable a working form. The full-size QR opens in the same tab.
- Integrated offline validation reported a pass for the original relay snapshot: responsive runtime, 404/CSP, form delivery, actual HTML/backend contracts, backend validation/idempotency, local copying, Worker request/result boundaries and public builds. The separate 25 October validation above covers the subsequent diagnostic/guard changes.

Evidence: `published-content-check.json`, `local-mobile-zh.json` / `.png`, `local-mobile-en.json` / `.png`, `fallback-implementation.md`, `cloudflare-bundle-manifest.json`, `static-bundle-manifest.json`, `preview-relay-check.json` and `production-relay-check.json`.

## Free plan and limit controls

- The saved account screenshot shows Workers **Free**, $0, as the current plan. Its daily request allowance is shared across the account; this is not an unused balance guarantee. Only the contact route invokes the Worker; static pages/assets remain outside that invocation route.
- The saved production settings screenshot confirms **Fail closed**. A Worker limit/error must not bypass the relay's validation. No paid upgrade, subscription, paid fallback or automatic capacity purchase is part of this change.
- The consumer Google mail allowance is 100 recipients per day, checked against the live quota before sends. The application is stricter: at most 20 consultations per rolling 24 hours, 5 per hour and 2 per submitting address per rolling day. Each consultation requires two recipients and preserves a two-recipient reserve.
- Verification attempts are also bounded to 200 per rolling day and 10 per minute. Invalid attempts can consume shared budgets, so these limits are not a DDoS-resistance or continuous-availability guarantee. Quota exhaustion may interrupt the form; the local manual contact alternatives remain available on a reachable page.
- Manual WeChat/email copying uses no additional service, network call or paid integration. Users choose whether to send through their own app. It does not guarantee that a particular third-party app or network is available.

Evidence: `workers-free-plan.png`, `cloudflare-fail-closed.png`, the maintained backend limits, and the pricing/quota links in both READMEs. No current remaining balance is inferred from the old mail test or from a provider's headline allowance.

## Current real-mail and WeChat boundary

The previous production attempt was marked `ANNA-CHINA-RELAY-20261024`. Its verification did not finish before a consultation POST, and the earlier Gmail search for that marker returned zero messages. This is **not a demonstrated mail-loss incident**: there was no completed consultation in that attempt to match against an owner notification or receipt. The 24 October `live-verification-fallback.png` is not an inbox-delivery receipt.

The current tests are marked `ANNA-CHINA-RELAY-20261025`: Chinese on the primary host and English on the GitHub mirror. Both have reached visible Cloudflare manual challenges and are awaiting the required action-time confirmation. Neither has submitted an enquiry at this checkpoint; no email result is inferred from the visible challenge or from the previous day's mailbox search.

The new relay still needs valid completed challenges and matching owner-notification plus automatic-receipt evidence in both languages before real-mail closure. Prior direct-route messages cannot be reused as proof for the changed transport. Mainland probes do not exercise the WeChat application. The Windows WeChat attempt is blocked at the `weixin110.qq.com` DNS page before Anna's page or form can be validated; its error does not establish the cause beyond that observed failure. No successful WeChat page/form result or physical iOS/Android WeChat coverage is claimed here.

## Previous final-site audit — historical record

The earlier 24 October audit covered responsive English/Chinese pages at mobile and desktop widths, navigation/menu behaviour, required-field and email validation, service preselection, bilingual routes/content and a broad public-link/fragment audit. It repaired Chinese 404 recovery and typography, set the supported Chinese Turnstile language, and added bounded recovery for silent verification stalls while allowing time for manual challenges. Those historical findings remain useful regression coverage; they are not represented as newly repeated mainland or device tests.

Earlier direct-POST mail tests read four Chinese/English owner notifications and localized receipts in the owner-controlled Gmail inbox, with original name/company/body comparisons passing. **The current release changes the submission transport and backend response format**, so those earlier messages only establish the previous route's delivery to that tested mailbox. The earlier report's readiness verdict, build counts and release details belong to its own snapshot in `outputs/anna-ai-studios-final-site-acceptance-2026-10-24/` and are not carried forward as current completion claims.

The existing copper/dark visual system is retained. This task adds contact fallback styling and transport safeguards; it does not modify FrameFetch. No assertion that the stylesheet or backend is unchanged applies to the current release.

## Evidence location and remaining closure

Historical evidence directory: `C:\Users\kewang\Documents\Codex\2026-10-23\da-k\outputs\anna-ai-studios-mainland-wechat-2026-10-24`.

Continuation evidence directory: `C:\Users\kewang\Documents\Codex\2026-10-23\da-k\outputs\anna-ai-studios-mainland-wechat-2026-10-25`.

Remaining: complete the two currently pending challenges after action-time confirmation, then verify each language's owner notification and automatic receipt; validate Anna's page/form in a working real WeChat environment and record mobile-device coverage when available. Until then, report the deployed network/fallback improvements and these exact limitations rather than “full mainland/WeChat acceptance passed.”

Production URLs: [Chinese](https://anna-ai-studios.pages.dev/zh/) · [English](https://anna-ai-studios.pages.dev/) · [GitHub mirror](https://kewangfx.github.io/anna-ai-studios/).
