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

The site remains static and has no analytics, cookies or database binding. Its contact form posts directly to FormSubmit, which forwards a structured email to `keke19870699@gmail.com`; the email fallback remains available if the form service is unreachable.

## Contact delivery

English and Chinese forms share one searchable subject convention:

```text
[ANNA-LEAD][SERVICE-CODE][EN|ZH][YYYYMMDD] Company / Name
```

Every delivery also contains a sortable Lead ID (`ANNA-YYYYMMDDhhmmss-XXXX`), UTC submission time, language and source page. Required fields are name, work email, service code, project brief and consent; company/team is optional. Native form validation, a hidden honeypot and FormSubmit's default verification reduce junk without adding client-side tracking.

The production endpoint is activated and uses FormSubmit's random endpoint token instead of exposing the recipient address in the form action. Keep reCAPTCHA enabled, do not add `_captcha=false`, and never place confidential production material in the public enquiry form. Search Gmail with `subject:"[ANNA-LEAD]"` to isolate all website enquiries.

Direct contact fallbacks are published alongside the form:

- Email: `keke19870699@gmail.com`
- WhatsApp: display `+44 7516 141043`, E.164/`wa.me` value `+447516141043`
- WeChat: `kewangfx`, with `assets/contact/wechat-kewangfx-qr.png`

Do not replace the WhatsApp link with the UK local form (`+44 075...`); the leading zero must be removed after the country code.

## Homepage performance

The desktop hero keeps one bounded scroll-mapped circuit sequence. Mobile renders one static viewport with the narrative chapters, video and WebGL layer disabled. Full service and product detail is routed to dedicated pages so the homepage remains focused on positioning, delivery evidence and enquiry.

## Anna Lab cases

- `The Nameless God` — Codex + Seedance 2.5 feature-film production control.
- `Fireworks` — Codex + Seedance 2.5 animated-short workflow with provenance and anti-degradation gates.
- `Tangxi Wonton Club` — AI-assisted bilingual identity and campaign delivery.

Only approved web derivatives belong in `assets/cases/`. Keep production source directories private, strip unnecessary metadata, and leave packaging or product claims behind manual approval.

## Products

- `DateLens` — a public product preview for privacy-conscious media evidence. The card links to the live preview and clearly states when real-time analysis is paused.
- `FrameFetch` — a live tool for inspecting authorised public video links, choosing available output quality and using browser or desktop-companion delivery.

Both product-directory pages use exact external URLs, truthful status labels, clear legal boundaries and versioned promotional WebP assets. Update the status copy and asset version whenever a product's availability, pricing or capabilities change.

## Client growth services

- `AI receptionist` — inbound call handling, intent capture, appointment booking and explicit human handoff.
- `Automated review management` — review requests, response drafting and approval-gated publication.
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

Deployment target: `anna-ai-studios` (`https://anna-ai-studios.pages.dev`). The build script starts from a clean `cloudflare-release/` directory and copies only the company site, brand/contact assets, curated product and case artwork, local Three.js runtime and the approved core-team portrait. Legacy portfolio, source screenshots and family media remain in the repository but are not published.

## GitHub Pages mirror

The standalone source repository is `KeWangFX/anna-ai-studios`. Pushes to `main` run `.github/workflows/deploy-pages.yml`, rebuild the same public whitelist and upload only `cloudflare-release/` to GitHub Pages. Cloudflare remains the canonical production URL; GitHub Pages is a deployment mirror.

## Release checks

- Verify English and Chinese routes, metadata and `hreflang` links.
- Test 375, 768, 1024 and 1440 px layouts.
- Test with reduced motion, data-saver mode and WebGL disabled; reduced motion must not request video or Three.js.
- Verify the WeChat QR is always visible, loads at desktop and mobile widths, and check the WhatsApp URL uses `447516141043`.
- Confirm the release directory contains no legacy portfolio data or media.
- Keep HTML/CSS/JS revalidated and version public media whenever its content changes.
