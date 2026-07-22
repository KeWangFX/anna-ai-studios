# Anna AI Studios

Bilingual forward-deployed AI engineering website for a London-based independent delivery studio.

## Site architecture

- `/` — English site
- `/zh/` — Simplified Chinese site
- `styles.css` — shared visual system and responsive layout
- `script.js` — hero scrubbing, the procedural signal journey, navigation and form behavior
- `shader-background.js` — Three.js copper-trace and photon overlay
- `assets/brand/` — public brand artwork, optimized Anna AI Studios logo, hero prompt and hero media
- `assets/cases/` — approved, web-compressed Anna Lab case-study frames
- `assets/contact/` — the cropped public WeChat QR code only; source phone screenshots stay private

The site remains static and has no analytics, cookies or database binding. Its contact form posts directly to FormSubmit, which forwards a structured email to `keke19870699@gmail.com`; the email fallback remains available if the form service is unreachable.

## Contact delivery

English and Chinese forms share one searchable subject convention:

```text
[ANNA-LEAD][SERVICE-CODE][EN|ZH][YYYYMMDD] Company / Name
```

Every delivery also contains a sortable Lead ID (`ANNA-YYYYMMDDhhmmss-XXXX`), UTC submission time, language and source page. Required fields are name, company/team, work email, service code, project brief and consent. Native form validation, a hidden honeypot and FormSubmit's default verification reduce junk without adding client-side tracking.

The production endpoint is activated and uses FormSubmit's random endpoint token instead of exposing the recipient address in the form action. Keep reCAPTCHA enabled, do not add `_captcha=false`, and never place confidential production material in the public enquiry form. Search Gmail with `subject:"[ANNA-LEAD]"` to isolate all website enquiries.

Direct contact fallbacks are published alongside the form:

- Email: `keke19870699@gmail.com`
- WhatsApp: display `+44 7516 141043`, E.164/`wa.me` value `+447516141043`
- WeChat: `kewangfx`, with `assets/contact/wechat-kewangfx-qr.png`

Do not replace the WhatsApp link with the UK local form (`+44 075...`); the leading zero must be removed after the country code.

## Scroll-mapped signal study

The delivery-to-lab interlude procedurally combines record-groove waveform geometry with wafer etching. Scroll progress maps to an eight-second Capture → Structure → Control → Decide sequence. It uses Canvas 2D with deterministic geometry, caps DPR at 1.5 and redraws only on scroll or resize. Mobile, short-viewport and reduced-motion layouts use one static frame and ordinary vertical content.

## Anna Lab cases

- `The Nameless God` — Codex + Seedance 2.5 feature-film production control.
- `Fireworks` — Codex + Seedance 2.5 animated-short workflow with provenance and anti-degradation gates.
- `Tangxi Wonton Club` — AI-assisted bilingual identity and campaign delivery.

Only approved web derivatives belong in `assets/cases/`. Keep production source directories private, strip unnecessary metadata, and leave packaging or product claims behind manual approval.

## Local preview

```powershell
cd D:\job\codex\keWang_website
npm run preview
```

Open `http://localhost:4174/` and `http://localhost:4174/zh/`.

## Hero media workflow

The production prompt lives at `assets/brand/circuit-hero-prompt.txt`.

The production lockup is `assets/brand/logo-anna-ai-studios-horizontal-full-color.webp`. It is a web-optimized crop of the approved source artwork; preserve its aspect ratio and built-in glow, and create a new filename whenever the artwork changes because brand assets ship with immutable caching.

Expected public files:

- `assets/brand/circuit-hero-1080.webm`
- `assets/brand/circuit-hero-1080.mp4`
- `assets/brand/circuit-hero-720.mp4`
- `assets/brand/circuit-poster.webp`
- `assets/brand/circuit-poster.avif`

The checked-in video is a lightweight eight-second motion fallback generated from the approved circuit poster. Replace it in place after the Sora master is approved. If video is unavailable, the page falls back again to the poster plus the WebGL circuit layer. Reduced-motion users receive a static, normally scrolling page.

Example encoding commands after a master video is approved:

```powershell
ffmpeg -i circuit-master.mp4 -an -c:v libvpx-vp9 -crf 34 -b:v 0 -g 12 -pix_fmt yuv420p assets/brand/circuit-hero-1080.webm
ffmpeg -i circuit-master.mp4 -an -c:v libx264 -crf 25 -preset slow -movflags +faststart -g 12 -pix_fmt yuv420p assets/brand/circuit-hero-1080.mp4
ffmpeg -i circuit-master.mp4 -an -vf scale=-2:720 -c:v libx264 -crf 27 -preset slow -movflags +faststart -g 12 -pix_fmt yuv420p assets/brand/circuit-hero-720.mp4
```

Short GOPs are intentional: scroll scrubbing needs nearby keyframes more than maximum compression efficiency.

## Cloudflare build and deploy

```powershell
npm run cf:build
npm run cf:deploy
```

Deployment target: `anna-ai-studios` (`https://anna-ai-studios.pages.dev`). The build script starts from a clean `cloudflare-release/` directory and copies only the company site, brand/contact assets, curated case frames, local Three.js runtime and the approved core-team portrait. Legacy portfolio, source screenshots and family media remain in the repository but are not published.

## GitHub Pages mirror

The standalone source repository is `KeWangFX/anna-ai-studios`. Pushes to `main` run `.github/workflows/deploy-pages.yml`, rebuild the same public whitelist and upload only `cloudflare-release/` to GitHub Pages. Cloudflare remains the canonical production URL; GitHub Pages is a deployment mirror.

## Release checks

- Verify English and Chinese routes, metadata and `hreflang` links.
- Test 375, 768, 1024 and 1440 px layouts.
- Test with reduced motion and WebGL disabled.
- Open the WeChat disclosure, verify the QR loads, and check the WhatsApp URL uses `447516141043`.
- Confirm the release directory contains no legacy portfolio data or media.
- Keep HTML/CSS/JS revalidated and fingerprinted media immutable.
