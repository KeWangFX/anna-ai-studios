# Anna AI Studios

Bilingual production AI systems website for a London-based independent delivery studio.

## Site architecture

- `/` — English site
- `/zh/` — Simplified Chinese site
- `/systems/production-ai/` and `/zh/systems/production-ai/` — production AI delivery
- `/systems/growth-automation/` and `/zh/systems/growth-automation/` — front-line growth systems
- `/products/` and `/zh/products/` — DateLens and FrameFetch product directory
- `/privacy/` and `/zh/privacy/` — enquiry-data privacy notice
- `styles.css` — shared visual system and responsive layout
- `script.js` — desktop hero scrubbing, stable anchor navigation and form behavior
- `shader-background.js` — Three.js copper-trace and photon overlay
- `assets/brand/` — public brand artwork, responsive Anna AI Studios logo variants, social card and hero media
- `assets/cases/` — approved, web-compressed Anna Lab case-study frames
- `assets/products/` — versioned, web-compressed DateLens and FrameFetch promotional artwork
- `assets/contact/` — the cropped public WeChat QR code only; source phone screenshots stay private

The public pages remain static, without behavioural analytics or advertising cookies. After Cloudflare Turnstile verification, both contact forms post natively to `https://anna-ai-studios.pages.dev/api/contact`. A narrowly routed Cloudflare Pages Worker relays the original request to Google Apps Script and renders the result on the studio domain. Visitors do not need to open Google domains to submit or see the result. WeChat and email remain available as manual contact options. The mail backend keeps a limited delivery and abuse-prevention ledger in Script Properties, separate from the public website.

## Contact delivery

English and Chinese forms share one searchable subject convention:

```text
[ANNA-LEAD][EN|ZH][SERVICE-CODE] ANNA-YYYYMMDDhhmmss-XXXX
```

The subject uses ASCII routing metadata and the Lead ID for correlation. The original name, company/team and project brief remain unchanged in the submitted email fields, including Chinese text. Every delivery also contains a sortable Lead ID (`ANNA-YYYYMMDDhhmmss-XXXX`), UTC submission time, language and source page. Required fields are name, work email, service code, project brief and consent; company/team is optional. Native form validation, a hidden honeypot and Cloudflare Turnstile verification reduce junk without adding client-side tracking.

Review CTAs request an assessment rather than confirm an appointment. The studio replies within two working days and arranges a 30-minute call after both sides agree the next step. Native validation stays enabled until the custom form handler has initialized successfully.

The owner has authorised the send-mail and external-request scopes. Apps Script Web App version 3 supports a structured response at `/exec?transport=relay-v1`, using protocol `anna-contact-relay-v1`; the existing mail validation, quota limits and idempotency ledger remain shared with the earlier direct-POST route. The query selector is strictly validated as single-value transport metadata and removed before the unchanged twelve-field business payload is parsed. Backend source, manifest and offline tests remain in `backend/apps-script/`; relay source and tests are in `deploy/cloudflare/`. These source files may be present in the GitHub repository, but backend files are excluded from public static builds and secrets must never enter the repository.

The relay has one fixed upstream, forwards no visitor cookies or credentials, limits request/response sizes and accepts only the allowlisted Google result redirect. It never automatically repeats a mail POST. It displays acceptance only when both notification and receipt have an accepted backend status. A timeout, partial send or unexpected response remains unconfirmed and directs the visitor to manual contact. The relay does not intentionally store or log enquiry bodies.

Earlier direct-POST production validation on 24 October 2026 received four Chinese/English notifications and localized receipts in the owner-controlled Gmail inbox, with original text preserved. That historical evidence does not establish delivery through the new relay or from mainland China. The version 3 relay still requires its own production protocol and real-mail acceptance evidence before being marked verified. MailApp acceptance alone does not establish inbox delivery. Search Gmail with `subject:"[ANNA-LEAD]"` for enquiries and `subject:"[ANNA-RECEIPT]"` for receipts.

Keep Turnstile server verification enabled and never place confidential production material in the public enquiry form. Token cData must match the Lead ID; edited details or expired verification require a fresh verification. API loading has an 18-second limit. Automatic verification stalls recover after 60 seconds, with the timer paused during a visible manual challenge.

The consumer Google Apps Script allowance is currently 100 email recipients per day. The backend applies lower rolling limits: 20 enquiries per 24 hours, 5 per hour, 2 per submitting address per 24 hours, and two recipients reserved before sending. Each accepted enquiry needs two mail recipients. It checks the live remaining quota and stops without a paid fallback when insufficient. Verification work is also bounded to 200 attempts per 24 hours and 10 per minute; invalid attempts can consume this shared budget, so this is not a DDoS-resistance guarantee. Recheck the [official Google quotas](https://developers.google.com/apps-script/guides/services/quotas) and live account allowance before delivery tests or limit changes.

Cloudflare Pages Functions share the Workers Free allowance of 100,000 requests per day across the account, resetting at midnight UTC. Only `/api/contact` invokes this Worker; static asset requests bypass it. Keep the account on the free plan, check shared remaining usage before a rollout and do not enable a paid upgrade or paid fallback. The quota is a provider limit, not a promise of available capacity. See [Cloudflare Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/), checked on 24 October 2026.

Removing the visitor's Google connection does not establish reliable mainland-China or WeChat WebView access: the website origin and Turnstile must still be reachable. Real mainland/device evidence must be reported separately from desktop simulations and fault-injection tests. The GitHub mirror shares the Cloudflare contact endpoint and is not an independent form backend or a guaranteed mainland route.

Direct contact fallbacks are published alongside the form:

- Email: `keke19870699@gmail.com`
- WhatsApp: display `+44 7516 141043`, E.164/`wa.me` value `+447516141043`
- WeChat: `kewangfx`, with `assets/contact/wechat-kewangfx-qr.png`

The bilingual manual alternative offers **Copy brief** and **Copy WeChat ID** without calling the mail or verification services. Copying is explicit, local and does not send an enquiry or persist the draft. Only visible contact fields are included; incomplete drafts are allowed, and unsupported or rejected clipboard access exposes selectable text. Visitors review and send the text themselves through WeChat or their usual mail app. QR guidance covers same-phone recognition when offered and searching the ID otherwise; no WeChat SDK or paid integration is required.

Do not replace the WhatsApp link with the UK local form (`+44 075...`); the leading zero must be removed after the country code.

## Homepage performance

The desktop hero keeps one bounded scroll-mapped circuit sequence. Mobile renders one static viewport with the narrative chapters, video and WebGL layer disabled. Full service and product detail is routed to dedicated pages so the homepage remains focused on positioning, delivery evidence and enquiry.

Breakpoint, reduced-motion and data-saver changes reconfigure the existing hero without reloading the document or resetting enquiry fields. Hidden/static scenes stop their animation work. Pages without a circuit canvas do not import Three.js. Content stays readable if JavaScript or its reveal observer fails.

The focused homepage keeps its offer, service-path links and assessment CTA visible during desktop circuit scrubbing. Its desktop scroll section is 150vh instead of the earlier 240vh; mobile remains a naturally sized static hero. The four delivery stages remain available in the dedicated delivery section.

## Anna Lab cases

- `The Nameless God` — Codex + Seedance 2.5 feature-film production control.
- `Fireworks` — Codex + Seedance 2.5 animated-short workflow with provenance and anti-degradation gates.
- `Tangxi Wonton Club` — AI-assisted bilingual identity and campaign delivery.

Only approved web derivatives belong in `assets/cases/`. Keep production source directories private, strip unnecessary metadata, and leave packaging or product claims behind manual approval.

Each homepage case keeps a readable mobile summary and a native `details` disclosure containing the full description and an existing public evidence image. The disclosure remains usable without JavaScript.

## Products

- `DateLens` — a public product preview for privacy-conscious media evidence. The card links to the live preview and clearly states when real-time analysis is paused.
- `FrameFetch` — a live tool for inspecting authorised public video links, choosing available output quality and using browser or desktop-companion delivery.

Both product-directory pages use exact external URLs, truthful status labels, clear legal boundaries and versioned promotional WebP assets. Update the status copy and asset version whenever a product's availability, pricing or capabilities change.

FrameFetch's external Render instance may need to wake after inactivity. Its product card explains that wait before the user leaves, offers a same-site static interface preview, and labels screenshot prices and allowances as subject to the tool's current terms. Do not add background requests, polling, iframes or keepalive jobs to wake it.

## Pilot scope

Both bilingual service paths expose client preparation, proposed deliverables, acceptance checks, operational ownership and separately itemised third-party costs. The growth cards compare inputs, delivery, acceptance and human responsibility. Specific timelines, pricing, supported providers and support arrangements are agreed in writing after assessment; the site does not invent fixed packages or service-level commitments.

## Client growth services

- `AI receptionist` — inbound call handling, intent capture, appointment booking and explicit human handoff.
- `Review workflow automation` — review requests, response drafting and approval-gated publication.
- `Revenue-ready websites` — accessible, conversion-focused web delivery with an explicit measurement plan.

These offers live on separate bilingual landing pages and use stable service codes in the contact form: `AI-RECEPTIONIST`, `REVIEW-AUTOMATION` and `REVENUE-WEBSITE`. Each service CTA preselects its code, while production AI project types remain first in the form.

## Local preview

```powershell
cd C:\Users\kewang\Documents\job
npm run preview
```

Open `http://localhost:4174/` and `http://localhost:4174/zh/`.

## Hero media workflow

The production prompt lives at `assets/brand/circuit-hero-prompt.txt`.

Header, mobile mark, footer and social sharing use separate exports from the Anna AI Studios brand system:

- `anna-ai-studios-header-desktop-primary-dark-320x80-v1.webp`
- `anna-ai-studios-header-mobile-primary-dark-72x72-v1.webp`
- `anna-ai-studios-footer-primary-dark-288x72-v1.webp`
- `anna-ai-studios-open-graph-primary-dark-1200x630-v1.webp`

Increase the version suffix when artwork changes. Public media uses a one-day browser cache with stale revalidation because the circuit and case-study filenames are not content hashed.

Expected public files:

- `assets/brand/circuit-hero-1080.webm`
- `assets/brand/circuit-hero-1080.mp4`
- `assets/brand/circuit-hero-720.mp4`
- `assets/brand/circuit-poster.webp`

The checked-in video is a lightweight eight-second motion fallback generated from the approved circuit poster. Replace it in place after the Sora master is approved. If video is unavailable, the page falls back again to the poster plus the WebGL circuit layer. Reduced-motion users receive a static, normally scrolling page.

Example encoding commands after a master video is approved:

```powershell
ffmpeg -i circuit-master.mp4 -an -c:v libvpx-vp9 -crf 34 -b:v 0 -g 12 -pix_fmt yuv420p assets/brand/circuit-hero-1080.webm
ffmpeg -i circuit-master.mp4 -an -c:v libx264 -crf 25 -preset slow -movflags +faststart -g 12 -pix_fmt yuv420p assets/brand/circuit-hero-1080.mp4
ffmpeg -i circuit-master.mp4 -an -vf scale=-2:720 -c:v libx264 -crf 27 -preset slow -movflags +faststart -g 12 -pix_fmt yuv420p assets/brand/circuit-hero-720.mp4
```

Short GOPs are intentional: scroll scrubbing needs nearby keyframes more than maximum compression efficiency. Video sources are attached only when motion is allowed and data-saver mode is off. Three.js is loaded after first paint on desktop only; mobile, reduced-motion and data-saver paths keep the poster and avoid the WebGL transfer.

## Cloudflare build and deploy

```powershell
npm run validate
npm run cf:build
npm run cf:deploy
```

Deployment target: `anna-ai-studios` (`https://anna-ai-studios.pages.dev`). The build script starts from a clean `cloudflare-release/` directory and copies only the company site, brand/contact assets, curated product and case artwork, local Three.js runtime and the approved core-team portrait. The Cloudflare build also includes `_worker.js` and an `_routes.json` restricted to `/api/contact`. Google backend source, tests, secrets, legacy portfolio, source screenshots and family media are excluded from published static files.

Release the compatible Apps Script version first and verify its structured relay response before switching the public form. Then deploy Cloudflare and verify the endpoint before publishing the mirror. Do not mark protocol or inbox delivery as verified merely because deployment or offline tests pass.

## GitHub Pages mirror

The standalone source repository is `KeWangFX/anna-ai-studios`. Pushes to `main` run `.github/workflows/deploy-pages.yml`, run the same tests and build with `python scripts/build_cloudflare_dist.py --static-only`. Only the public static whitelist is uploaded; Worker code and routing files are omitted. Cloudflare remains canonical. Mirror forms submit to the same Cloudflare endpoint and valid result links return to the original mirror language page. Manual WeChat/email options remain usable when that endpoint is unavailable.

## Release checks

- Keep contact labels, response steps, hints, errors and privacy guidance at least 13 px; consent text uses 14 px and form controls use 16 px in both languages.
- Keep the displayed `REVIEW-AUTOMATION` name aligned with the growth service page; service codes remain stable for enquiry routing.
- Verify English and Chinese routes, metadata and `hreflang` links.
- Test 375, 768, 1024 and 1440 px layouts.
- Include a 320 px window with classic scrollbars; compare content width against `document.documentElement.clientWidth`, which excludes scrollbar space.
- Return from enquiry verification and confirm the button is usable, pending status is cleared, and actual field errors are preserved.
- Test with reduced motion, data-saver mode and WebGL disabled; reduced motion must not request video or Three.js.
- Verify the WeChat QR is always visible, loads at desktop and mobile widths, and check the WhatsApp URL uses `447516141043`.
- Check bilingual brief/WeChat copying with a working, rejected and unavailable clipboard; copied text must remain clearly unsent and exclude hidden fields.
- Verify the deployed relay protocol, non-success handling and real notification/receipt evidence separately; retain explicit mainland and real-WeChat coverage limits.
- Confirm the release directory contains no legacy portfolio data or media.
- Keep HTML/CSS/JS revalidated and version public media whenever its content changes.
