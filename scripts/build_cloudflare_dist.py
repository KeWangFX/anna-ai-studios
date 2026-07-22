from __future__ import annotations

import os
import shutil
import stat
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "cloudflare-release"

ROOT_FILES = (
    "index.html",
    "404.html",
    "styles.css",
    "script.js",
    "shader-background.js",
    "favicon.svg",
    "_headers",
    "robots.txt",
    "sitemap.xml",
)

PUBLIC_TREES = (
    (ROOT / "zh", DIST / "zh"),
    # Only curated web derivatives are public; production source folders stay outside the release.
    (ROOT / "assets" / "cases", DIST / "assets" / "cases"),
)

PUBLIC_FILES = (
    *(
        (
            ROOT / "assets" / "brand" / name,
            DIST / "assets" / "brand" / name,
        )
        for name in (
            "circuit-poster.svg",
            "circuit-poster.webp",
            "circuit-poster.avif",
            "circuit-hero-1080.webm",
            "circuit-hero-1080.mp4",
            "circuit-hero-720.mp4",
        )
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


def copy_tree(source: Path, target: Path) -> None:
    if not source.is_dir():
        raise FileNotFoundError(f"Required public directory is missing: {source}")
    shutil.copytree(source, target)


def main() -> None:
    reset_dist()

    for name in ROOT_FILES:
        copy_file(ROOT / name, DIST / name)

    for source, target in PUBLIC_TREES:
        copy_tree(source, target)

    for source, target in PUBLIC_FILES:
        copy_file(source, target)

    public_files = [path for path in DIST.rglob("*") if path.is_file()]
    print(f"Anna AI Studios build prepared at: {DIST}")
    print(f"Public files: {len(public_files)}")


if __name__ == "__main__":
    main()
