from __future__ import annotations

import os
import argparse
import json
import shutil
import stat
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "cloudflare-release"

ROOT_FILES = (
    "index.html",
    "thanks.html",
    "404.html",
    "styles.css",
    "script.js",
    "shader-background.js",
    "favicon-v1.svg",
    "_headers",
    "robots.txt",
    "sitemap.xml",
)

PUBLIC_FILES = (
    (ROOT / "zh" / "index.html", DIST / "zh" / "index.html"),
    (ROOT / "zh" / "thanks.html", DIST / "zh" / "thanks.html"),
    (ROOT / "products" / "index.html", DIST / "products" / "index.html"),
    (ROOT / "privacy" / "index.html", DIST / "privacy" / "index.html"),
    (
        ROOT / "systems" / "production-ai" / "index.html",
        DIST / "systems" / "production-ai" / "index.html",
    ),
    (
        ROOT / "systems" / "growth-automation" / "index.html",
        DIST / "systems" / "growth-automation" / "index.html",
    ),
    (ROOT / "zh" / "products" / "index.html", DIST / "zh" / "products" / "index.html"),
    (ROOT / "zh" / "privacy" / "index.html", DIST / "zh" / "privacy" / "index.html"),
    (
        ROOT / "zh" / "systems" / "production-ai" / "index.html",
        DIST / "zh" / "systems" / "production-ai" / "index.html",
    ),
    (
        ROOT / "zh" / "systems" / "growth-automation" / "index.html",
        DIST / "zh" / "systems" / "growth-automation" / "index.html",
    ),
    *(
        (
            ROOT / "assets" / "brand" / name,
            DIST / "assets" / "brand" / name,
        )
        for name in (
            "anna-ai-studios-header-desktop-primary-dark-320x80-v1.webp",
            "anna-ai-studios-header-mobile-primary-dark-72x72-v1.webp",
            "anna-ai-studios-footer-primary-dark-288x72-v1.webp",
            "anna-ai-studios-open-graph-primary-dark-1200x630-v1.webp",
            "anna-ai-studios-apple-touch-icon-180x180-v1.png",
            "circuit-poster.webp",
            "circuit-hero-1080.webm",
            "circuit-hero-1080.mp4",
            "circuit-hero-720.mp4",
        )
    ),
    *(
        (
            ROOT / "assets" / "cases" / name,
            DIST / "assets" / "cases" / name,
        )
        for name in (
            "nameless-god-character.webp",
            "nameless-god-storyboard.webp",
            "fireworks-keyframe.webp",
            "fireworks-lookdev.webp",
            "tangxi-brand-system.webp",
            "tangxi-campaign.webp",
        )
    ),
    *(
        (
            ROOT / "assets" / "products" / name,
            DIST / "assets" / "products" / name,
        )
        for name in (
            "datelens-product-v1.webp",
            "framefetch-product-v1.webp",
        )
    ),
    (
        ROOT / "assets" / "contact" / "wechat-kewangfx-qr.png",
        DIST / "assets" / "contact" / "wechat-kewangfx-qr.png",
    ),
    (
        ROOT / "assets" / "vendor" / "three.module.min.js",
        DIST / "assets" / "vendor" / "three.module.min.js",
    ),
    (
        ROOT / "assets" / "vendor" / "three.core.min.js",
        DIST / "assets" / "vendor" / "three.core.min.js",
    ),
    (
        ROOT / "assets" / "images" / "ke-wang-portrait.jpg",
        DIST / "assets" / "images" / "ke-wang-portrait.jpg",
    ),
)


def reset_dist() -> None:
    """Clean only the known build directory so stale portfolio media cannot leak."""
    resolved_root = ROOT.resolve()
    resolved_dist = DIST.resolve()
    if resolved_dist.parent != resolved_root or resolved_dist.name != "cloudflare-release":
        raise RuntimeError(f"Refusing to clean unexpected path: {resolved_dist}")
    if DIST.exists():
        def remove_readonly(function, path, _error) -> None:
            # Release media can inherit read-only attributes; clearing only that bit keeps cleanup scoped.
            os.chmod(path, stat.S_IWRITE)
            function(path)

        shutil.rmtree(DIST, onexc=remove_readonly)
    DIST.mkdir(parents=True)


def copy_file(source: Path, target: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(f"Required public file is missing: {source}")
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def validate_dist() -> list[Path]:
    """Fail closed if a future edit expands the public bundle beyond the approved site."""
    public_files = [path for path in DIST.rglob("*") if path.is_file()]
    allowed_suffixes = {".html", ".css", ".js", ".svg", ".webp", ".png", ".jpg", ".mp4", ".webm", ".txt", ".xml"}
    forbidden_terms = {"resume", "family", "showreel", "portfolio", "analytics", "rollingai"}

    unexpected_types = [path for path in public_files if path.suffix.lower() not in allowed_suffixes and path.name not in {"_headers", "_routes.json"}]
    forbidden_paths = [
        path for path in public_files
        if any(term in path.relative_to(DIST).as_posix().lower() for term in forbidden_terms)
    ]
    total_bytes = sum(path.stat().st_size for path in public_files)

    if unexpected_types:
        raise RuntimeError(f"Unexpected public file types: {unexpected_types}")
    if forbidden_paths:
        raise RuntimeError(f"Forbidden public paths: {forbidden_paths}")
    if total_bytes > 6 * 1024 * 1024:
        raise RuntimeError(f"Public bundle exceeds 6 MiB: {total_bytes} bytes")

    print(f"Public bundle size: {total_bytes} bytes")
    return public_files


def validate_contact_backend() -> None:
    """Do not publish an unconfigured candidate, even through the mirror workflow."""
    import re
    endpoints = []
    for relative in ("index.html", "zh/index.html"):
        text = (ROOT / relative).read_text(encoding="utf-8")
        match = re.search(r'<form\b[^>]*action="([^"]+)"[^>]*data-contact-form', text, re.S)
        endpoint = match.group(1) if match else ""
        if endpoint != "https://anna-ai-studios.pages.dev/api/contact":
            raise RuntimeError("CONTACT_BACKEND_NOT_CONFIGURED: expected fixed same-site contact relay")
        endpoints.append(endpoint)
    if len(set(endpoints)) != 1:
        raise RuntimeError("Contact form endpoints must match across languages")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--static-only", action="store_true", help="Exclude Cloudflare server code from GitHub Pages")
    args = parser.parse_args()
    validate_contact_backend()
    reset_dist()

    for name in ROOT_FILES:
        copy_file(ROOT / name, DIST / name)

    for source, target in PUBLIC_FILES:
        copy_file(source, target)

    if not args.static_only:
        copy_file(ROOT / "deploy" / "cloudflare" / "_worker.js", DIST / "_worker.js")
        # Only the inquiry path consumes the account's free Worker request quota.
        (DIST / "_routes.json").write_text(json.dumps({
            "version": 1, "include": ["/api/contact"], "exclude": []
        }, indent=2) + "\n", encoding="utf-8")

    public_files = validate_dist()
    print(f"Anna AI Studios build prepared at: {DIST}")
    print(f"Public files: {len(public_files)}")


if __name__ == "__main__":
    main()
