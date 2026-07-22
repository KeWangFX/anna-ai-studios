# Anna AI Studios

Bilingual forward-deployed AI engineering website for a London-based independent delivery studio.

## Site architecture

- `/` — English site
- `/zh/` — Simplified Chinese site
- `styles.css` — shared visual system and responsive layout
- `script.js` — scroll-to-video mapping, navigation and reveal behavior
- `shader-background.js` — Three.js copper-trace and photon overlay
- `assets/brand/` — public brand artwork, hero prompt and optimized hero media
- `assets/cases/` — approved, web-compressed Anna Lab case-study frames

The site is intentionally static. It has no analytics, cookies, contact form or database binding. The primary conversion path is email.

## Anna Lab cases

- `The Nameless God` — Codex + Seedance 2.5 feature-film production control.
- `Fireworks` — Codex + Seedance 2.5 animated-short workflow with provenance and anti-degradation gates.
- `Tangxi Wonton Club` — AI-assisted bilingual identity and campaign delivery.

Only approved web derivatives belong in `assets/cases/`. Keep production source directories private, strip unnecessary metadata, and leave packaging or product claims behind manual approval.

## Local preview

```powershell
git clone https://github.com/KeWangFX/anna-ai-studios.git
cd anna-ai-studios
npm run preview
```

Open `http://localhost:4174/` and `http://localhost:4174/zh/`.

## Hero media workflow

The production prompt lives at `assets/brand/circuit-hero-prompt.txt`.

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

Deployment target: `anna-ai-studios` (`https://anna-ai-studios.pages.dev`). The build script starts from a clean `cloudflare-release/` directory and copies only the company site, brand assets, curated case frames, local Three.js runtime and the approved founder portrait. Legacy portfolio, family media and private production sources are not included in this repository.

## GitHub Pages mirror

The standalone source repository is `KeWangFX/anna-ai-studios`. Pushes to `main` run `.github/workflows/deploy-pages.yml`, rebuild the same public whitelist and upload only `cloudflare-release/` to GitHub Pages. Cloudflare remains the canonical production URL; GitHub Pages is a deployment mirror.

## Release checks

- Verify English and Chinese routes, metadata and `hreflang` links.
- Test 375, 768, 1024 and 1440 px layouts.
- Test with reduced motion and WebGL disabled.
- Confirm the release directory contains no legacy portfolio data or media.
- Keep HTML/CSS/JS revalidated and fingerprinted media immutable.
