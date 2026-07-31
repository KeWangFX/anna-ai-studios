from __future__ import annotations

import argparse
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree


SKIPPED_SCHEMES = {"data", "http", "https", "mailto", "sms", "tel"}
METADATA_EXEMPT = {"404.html", "thanks.html", "zh/thanks.html"}


class SiteDocument(HTMLParser):
    """Collect only the attributes needed for deterministic static-site checks."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[tuple[str, str]] = []
        self.canonicals: list[str] = []
        self.languages: set[str] = set()

    def handle_starttag(self, tag: str, attributes: list[tuple[str, str | None]]) -> None:
        attrs = {name: value or "" for name, value in attributes}
        if element_id := attrs.get("id"):
            self.ids.append(element_id)

        for attribute in ("href", "src", "action"):
            if value := attrs.get(attribute):
                self.references.append((attribute, value))

        if srcset := attrs.get("srcset"):
            # Width descriptors are irrelevant to existence; validate every source candidate.
            for candidate in srcset.split(","):
                if value := candidate.strip().split(" ", 1)[0]:
                    self.references.append(("srcset", value))

        if tag == "link" and attrs.get("rel") == "canonical" and attrs.get("href"):
            self.canonicals.append(attrs["href"])
        if tag == "link" and attrs.get("rel") == "alternate" and attrs.get("hreflang"):
            self.languages.add(attrs["hreflang"])


def resolve_reference(root: Path, document: Path, raw_value: str) -> tuple[Path, str] | None:
    parsed = urlsplit(raw_value.strip())
    if parsed.scheme.lower() in SKIPPED_SCHEMES or parsed.netloc:
        return None
    if not parsed.path:
        return document, unquote(parsed.fragment)

    clean_path = unquote(parsed.path)
    candidate = root / clean_path.lstrip("/") if clean_path.startswith("/") else document.parent / clean_path
    candidate = candidate.resolve()

    # Never allow a relative URL to escape the built release directory.
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return candidate, unquote(parsed.fragment)

    if clean_path.endswith("/") or candidate.is_dir():
        candidate /= "index.html"
    return candidate, unquote(parsed.fragment)


def parse_document(path: Path) -> SiteDocument:
    parser = SiteDocument()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    documents = sorted(root.rglob("*.html"))
    parsed_documents = {path.resolve(): parse_document(path) for path in documents}

    for document in documents:
        relative = document.relative_to(root).as_posix()
        parsed = parsed_documents[document.resolve()]

        duplicates = sorted({element_id for element_id in parsed.ids if parsed.ids.count(element_id) > 1})
        if duplicates:
            errors.append(f"{relative}: duplicate IDs: {', '.join(duplicates)}")

        if relative not in METADATA_EXEMPT:
            if len(parsed.canonicals) != 1:
                errors.append(f"{relative}: expected exactly one canonical URL")
            required_languages = {"en", "zh-Hans", "x-default"}
            if not required_languages.issubset(parsed.languages):
                missing = ", ".join(sorted(required_languages - parsed.languages))
                errors.append(f"{relative}: missing hreflang entries: {missing}")

        for attribute, raw_value in parsed.references:
            resolved = resolve_reference(root, document, raw_value)
            if resolved is None:
                continue
            target, fragment = resolved
            if not target.is_file():
                errors.append(f"{relative}: broken {attribute} reference {raw_value!r}")
                continue
            if fragment and target.suffix.lower() == ".html":
                target_document = parsed_documents.get(target.resolve())
                if target_document is None:
                    target_document = parse_document(target)
                if fragment not in target_document.ids:
                    errors.append(f"{relative}: missing fragment #{fragment} in {target.relative_to(root)}")

    sitemap = root / "sitemap.xml"
    try:
        ElementTree.parse(sitemap)
    except (ElementTree.ParseError, OSError) as error:
        errors.append(f"sitemap.xml: {error}")

    print(f"Validated {len(documents)} HTML documents in {root}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Anna AI Studios release links and metadata.")
    parser.add_argument("root", nargs="?", default="cloudflare-release", type=Path)
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        print(f"Release directory does not exist: {root}", file=sys.stderr)
        return 2

    errors = validate(root)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("Static-site validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
