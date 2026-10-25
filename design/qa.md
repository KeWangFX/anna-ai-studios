# Anna AI Studios — mainland China and WeChat release QA

Date: 24 October 2026, Europe/London. Scope: mainland-network reachability, WeChat-oriented contact alternatives, bilingual consultation transport, free-service limits and preservation of the existing visual style. FrameFetch is excluded.

## Current verdict

**Partially verified; the new relay's real-mail delivery and a physical WeChat client are not closed.** The deployed relay snapshot `7e378e5` removes the visitor's direct Google connection and adds local WeChat/email copying. Published content, negative submission handling and sampled mainland HTTP reachability have evidence. The current marked real-mail attempt has not completed Turnstile and has not submitted an enquiry. No new inbox-delivery success is claimed.

This document records the deployed relay snapshot, not a final commit for the entire task. Additional verification-script diagnostics are being implemented separately and are not yet deployed at this checkpoint; they are not included in the passing production claims below.

## Deployed architecture and safe failure

- Both language forms submit to `https://anna-ai-studios.pages.dev/api/contact`. The Cloudflare relay calls the existing owner-controlled Apps Script backend on the server and renders the result on the studio domain; the browser does not open a Google result iframe.
- Apps Script version 3 uses the strictly validated `transport=relay-v1` query selector and the `anna-contact-relay-v1` response protocol. The earlier path-based selector was abandoned. The existing twelve business fields, Turnstile server verification, idempotency ledger and send limits remain enforced.
- The relay has one fixed upstream, limits input/result size, follows only the allowlisted Google result redirect as GET, forwards no visitor cookies or credentials, and never automatically replays a mail POST. Partial sends, transport errors and unexpected responses remain unconfirmed.
- Both language consent and privacy notices disclose Cloudflare forwarding and Google delivery. The relay does not intentionally store or log enquiry bodies. Public result responses are `no-store` and do not embed the enquiry text.
- GitHub Pages uses a static-only build. It excludes Worker/routing files, while the Cloudflare build includes the narrowly routed Worker. Backend source may exist in the source repository; secrets must not. The mirror shares the same Cloudflare form endpoint, so it is not an independent submission backend.

Evidence: `deployed-backend-protocol.json` records an actual version 3 JSON `invalid_request` response to an incomplete payload, with no mail attempted. `production-relay-check.json` records production GET 405, incomplete POST 400, and invalid-Turnstile POST 503. None displays an accepted heading or a Google frame. These are safe rejection/transport checks, not evidence of a successful valid consultation.

## Mainland HTTP sampling

The six mainland probes cover Guangzhou, Shanghai, Wuxi, Nanning, Nanjing and Guilin, with two points each labelled China Telecom, China Unicom and China Mobile. Two London probes are controls. Geography, ASN and access-network labels are supplied by Globalping; some probes share volunteer tags. These are sampled HTTP measurements, not a long-term availability rate or physical WeChat-device test.

| Target / stage | Mainland result | UK control | Meaning |
| --- | --- | --- | --- |
| Deployed Chinese primary site | 5/6 HTTP 200 | 2/2 HTTP 200 | New-version HTML returned; one Shanghai Unicom TLS timeout |
| Deployed Chinese GitHub mirror | 4/6 HTTP 200 | 2/2 HTTP 200 | New-version HTML returned; Guangzhou Telecom TLS and Nanning Unicom TCP timeouts |
| Deployed `/api/contact` GET | 5/6 expected HTTP 405 | 2/2 expected HTTP 405 | Bilingual endpoint is reachable and rejects GET; Nanning Unicom first-byte timeout |
| Earlier direct Google endpoint GET | 0/6; TCP timeouts | 2/2 HTTP 200 | The old visitor-to-Google dependency failed at every sampled mainland point |
| Earlier actual Turnstile JavaScript | 6/6 HTTP 200 | 2/2 HTTP 200 | Script resource reachable; no conclusion about a completed challenge or token |

Post-deployment measurements began around 11:51:50 London time. Expected 405 pages include both languages, the WeChat ID and contact return links. **405 is not consultation acceptance or mail delivery.** Comparing different paths/methods/times does not establish a strict performance-improvement percentage. Main-site, mirror and Turnstile accessibility can still vary between networks.

Source: `post-deploy-network-results.md`, `post-deploy-network-results.json`, `network-results.md` and `network-summary-final.json`, with the original Globalping request/result files retained. An early incorrectly constructed Turnstile path returned 404 and is explicitly excluded from availability conclusions; the corrected redirect and actual script were checked separately.

## Static, mobile and functional evidence

- Published content checks match the saved source snapshot and expected CSP. Browser forms use the studio relay endpoint; external Google form/frame origins are no longer required in page CSP.
- Local browser evidence covers the new Chinese fallback at a 375px viewport and English fallback at 320px. Available content widths were 360px and 305px respectively, with equal scroll widths: no horizontal overflow in those checked states. Both copy buttons have a 44px minimum height.
- The Chinese copied draft preserves Chinese characters, traditional/simplified text, emoji and line breaks. The English empty-form draft remains usable, with visible labels and unfilled placeholders. Copy does not trigger native validation, Turnstile, POST or email.
- Only the allowlisted visible name, company, email, project type, timing and brief are copied; option labels are localized. Hidden tokens, lead references and honeypot values are excluded. Clipboard rejection/unavailability exposes selectable readonly text, and the status explicitly says the enquiry has not been sent. Delayed clipboard results cannot overwrite a newer operation; edits clear obsolete previews.
- WeChat instructions conditionally explain same-phone QR recognition, searching `kewangfx`, and using the top-right menu to open a page in the browser when needed. They do not detect an IP/UA and forcibly disable a working form. The full-size QR opens in the same tab.
- Integrated offline validation reported a pass for the deployed relay snapshot: responsive runtime, 404/CSP, form delivery, actual HTML/backend contracts, backend validation/idempotency, local copying, Worker request/result boundaries and public builds. This statement does not include later in-progress diagnostic edits or invent a final test count.

Evidence: `published-content-check.json`, `local-mobile-zh.json` / `.png`, `local-mobile-en.json` / `.png`, `fallback-implementation.md`, `cloudflare-bundle-manifest.json`, `static-bundle-manifest.json`, `preview-relay-check.json` and `production-relay-check.json`.

## Free plan and limit controls

- The saved account screenshot shows Workers **Free**, $0, as the current plan. Its daily request allowance is shared across the account; this is not an unused balance guarantee. Only the contact route invokes the Worker; static pages/assets remain outside that invocation route.
- The saved production settings screenshot confirms **Fail closed**. A Worker limit/error must not bypass the relay's validation. No paid upgrade, subscription, paid fallback or automatic capacity purchase is part of this change.
- The consumer Google mail allowance is 100 recipients per day, checked against the live quota before sends. The application is stricter: at most 20 consultations per rolling 24 hours, 5 per hour and 2 per submitting address per rolling day. Each consultation requires two recipients and preserves a two-recipient reserve.
- Verification attempts are also bounded to 200 per rolling day and 10 per minute. Invalid attempts can consume shared budgets, so these limits are not a DDoS-resistance or continuous-availability guarantee. Quota exhaustion may interrupt the form; the local manual contact alternatives remain available on a reachable page.
- Manual WeChat/email copying uses no additional service, network call or paid integration. Users choose whether to send through their own app. It does not guarantee that a particular third-party app or network is available.

Evidence: `workers-free-plan.png`, `cloudflare-fail-closed.png`, the maintained backend limits, and the pricing/quota links in both READMEs. No current remaining balance is inferred from the old mail test or from a provider's headline allowance.

## Current real-mail and WeChat boundary

The current production test is marked `ANNA-CHINA-RELAY-20261024`. According to the active session's browser and mailbox check, Turnstile has blocked completion before a consultation POST. Gmail search for that marker returned zero messages. This is **not a demonstrated mail-loss incident**: there is no completed consultation in this attempt to match against an owner notification or receipt. The saved `live-verification-fallback.png` shows the live form/fallback state; it is not an inbox-delivery receipt.

The new relay still needs a valid completed challenge and matching owner-notification plus automatic-receipt evidence before real-mail closure. Prior same-day messages cannot be reused as proof for the changed transport. Mainland probes do not exercise the WeChat application, and desktop mobile/UA testing is not physical iOS/Android WeChat certification. No real-WeChat success is claimed here.

## Previous final-site audit — historical record

The earlier same-day audit covered responsive English/Chinese pages at mobile and desktop widths, navigation/menu behaviour, required-field and email validation, service preselection, bilingual routes/content and a broad public-link/fragment audit. It repaired Chinese 404 recovery and typography, set the supported Chinese Turnstile language, and added bounded recovery for silent verification stalls while allowing time for manual challenges. Those historical findings remain useful regression coverage; they are not represented as newly repeated mainland or device tests.

Earlier direct-POST mail tests read four Chinese/English owner notifications and localized receipts in the owner-controlled Gmail inbox, with original name/company/body comparisons passing. **The current release changes the submission transport and backend response format**, so those earlier messages only establish the previous route's delivery to that tested mailbox. The earlier report's readiness verdict, build counts and release details belong to its own snapshot in `outputs/anna-ai-studios-final-site-acceptance-2026-10-24/` and are not carried forward as current completion claims.

The existing copper/dark visual system is retained. This task adds contact fallback styling and transport safeguards; it does not modify FrameFetch. No assertion that the stylesheet or backend is unchanged applies to the current release.

## Evidence location and remaining closure

Evidence directory: `C:\Users\kewang\Documents\Codex\2026-10-23\da-k\outputs\anna-ai-studios-mainland-wechat-2026-10-24`.

Remaining: finish and separately validate any in-progress script diagnostics; complete a valid real-mail enquiry and verify both messages; record real WeChat-device coverage if available. Until then, report the deployed network/fallback improvements and these exact limitations rather than “full mainland/WeChat acceptance passed.”

Production URLs: [Chinese](https://anna-ai-studios.pages.dev/zh/) · [English](https://anna-ai-studios.pages.dev/) · [GitHub mirror](https://kewangfx.github.io/anna-ai-studios/).
