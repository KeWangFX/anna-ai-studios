# Anna AI Studios — final release QA

Date: 24 October 2026. Reference: the existing visual system, `design/audit.md`, and the user's constraints to retain the design, use free services and exclude FrameFetch.

## Visual and responsive checks

- PASS: 12 English/Chinese published pages inspected at 320, 375, 768 and 1920 pixel viewport widths. No horizontal overflow in page content or form controls; Windows scrollbar reduces available content width by 15 pixels.
- PASS: mobile menu opens/closes, Escape restores it, and Services settles immediately below the sticky header.
- PASS: existing palette, media, layout and stylesheet unchanged. Chinese 404 typography now uses a 40px mobile minimum and 1.12 leading to avoid crowded lines.

## Behaviour and content

- FIXED: Chinese missing routes previously displayed English and returned to the English homepage. Recovery now preserves language on both production hosts; no-JavaScript recovery has usable canonical homepage links.
- FIXED: a silent verification-provider stall after script loading could leave the form disabled. A 60-second automatic-stage timer restores retry, pauses during manual verification and discards stale callbacks. No automatic resubmission or verification bypass is introduced.
- FIXED: Chinese Turnstile uses the supported `zh-cn` code.
- PASS: required fields, invalid email, genuinely typed short name/message, localized error summary, first-invalid focus and service preselection.
- PASS: bilingual service scopes, privacy copy, language routes and field contract. Baseline public-link audit covered 26 host/page combinations, 109 unique URLs and 771 references without dead links or missing fragments; FrameFetch excluded.
- PASS: prior production EN/ZH owner notifications and localized receipts were read in the real Gmail inbox on the same date. Original name/company/body comparisons passed. Mail backend and submission transport are unchanged in this release; no additional real mail was sent during this final audit.

## Validation and release gate

`npm run validate` passed after integration: runtime checks; 9 404 routing cases with exact CSP-hash matching; contact-handler success, error, timeout, challenge pause/resume and stale-timer checks; real HTML-to-backend field contracts; 31 backend checks; public build; all 13 HTML documents. `git diff --check` passed. Public bundle: 41 files, 4,769,985 bytes; no backend source is published.

Verdict: READY for the authorized production release. Post-deployment URLs, commit and verification evidence are saved in the task's `outputs/anna-ai-studios-final-site-acceptance-2026-10-24/` acceptance report.

## Boundaries

Responsive browser testing is not physical iOS/Android or screen-reader certification. Mainland access to Google and delivery to unrelated mail providers remain unverified. Free quota limits and direct-contact alternatives remain documented. No new cloud resources, billing components, analytics or FrameFetch changes are included.
