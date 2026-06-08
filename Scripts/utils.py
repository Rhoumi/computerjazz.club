"""Shared helpers for Bandcamp → Internet Archive archiving scripts."""

import json
import os
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path


# ---------------------------------------------------------------------------
# String helpers
# ---------------------------------------------------------------------------

def slugify(text: str) -> str:
    """Convert any string to a URL-safe ASCII slug."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", text).strip("-")


def format_release_date(raw: str | None) -> str:
    """Normalise yt-dlp date strings (YYYYMMDD or YYYY) to YYYY-MM-DD."""
    if not raw:
        return ""
    if len(raw) == 8 and raw.isdigit():
        return f"{raw[:4]}-{raw[4:6]}-{raw[6:]}"
    return raw


# ---------------------------------------------------------------------------
# yt-dlp wrappers
# ---------------------------------------------------------------------------

def extract_info(url: str) -> dict:
    """Fetch metadata from a Bandcamp URL without downloading files."""
    try:
        import yt_dlp
    except ImportError:
        sys.exit("yt-dlp is not installed — run: pip install -r requirements.txt")

    opts = {"quiet": True, "no_warnings": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)


def list_label_releases(label_url: str) -> list[dict]:
    """Return a flat list of {url, title} dicts for every release on a label page."""
    try:
        import yt_dlp
    except ImportError:
        sys.exit("yt-dlp is not installed — run: pip install -r requirements.txt")

    opts = {"quiet": True, "no_warnings": True, "extract_flat": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(label_url, download=False)

    entries = info.get("entries") or []
    return [{"url": e["url"], "title": e.get("title", "")} for e in entries if e.get("url")]


def download_album(url: str, output_dir: Path) -> tuple[dict, list[Path]]:
    """
    Download an album's audio (MP3) and thumbnail to output_dir.
    Returns (yt-dlp info dict, sorted list of downloaded .mp3 paths).
    """
    try:
        import yt_dlp
    except ImportError:
        sys.exit("yt-dlp is not installed — run: pip install -r requirements.txt")

    output_dir.mkdir(parents=True, exist_ok=True)

    opts = {
        "format": "bestaudio/best",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "0",  # VBR best
            },
            {"key": "FFmpegMetadata"},
        ],
        "writeinfojson": True,
        "writethumbnail": True,
        "restrictfilenames": True,
        "outtmpl": str(output_dir / "%(playlist_index)02d-%(title)s.%(ext)s"),
        "quiet": False,
    }

    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)

    # Normalise filenames: underscores → dashes (matches existing site convention)
    for f in list(output_dir.glob("*.mp3")):
        clean = f.with_name(f.name.replace("_", "-"))
        if clean != f:
            f.rename(clean)

    return info, sorted(output_dir.glob("*.mp3"))


def normalise_cover(album_dir: Path) -> Path | None:
    """Find the downloaded thumbnail and rename it to cover.jpg. Returns the path."""
    for pattern in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
        for f in album_dir.glob(pattern):
            if f.stem == "cover":
                return f
            target = album_dir / "cover.jpg"
            f.rename(target)
            return target
    return None


# ---------------------------------------------------------------------------
# Internet Archive upload
# ---------------------------------------------------------------------------

def build_ia_identifier(prefix: str, label_slug: str, suffix: str) -> str:
    return f"{prefix}-{label_slug}-{suffix}"


def upload_to_ia(
    identifier: str,
    files: list[Path],
    metadata: dict,
    dry_run: bool = False,
) -> str:
    """Upload files to Internet Archive. Returns the item URL."""
    ia_url = f"https://archive.org/details/{identifier}"

    if dry_run:
        print(f"[DRY RUN] Would upload {len(files)} file(s) → {ia_url}")
        return ia_url

    try:
        import internetarchive as ia
    except ImportError:
        sys.exit("internetarchive is not installed — run: pip install -r requirements.txt")

    access_key = os.environ.get("IA_ACCESS_KEY")
    secret_key = os.environ.get("IA_SECRET_KEY")

    if not access_key or not secret_key:
        sys.exit(
            "Missing IA credentials.\n"
            "Set IA_ACCESS_KEY and IA_SECRET_KEY environment variables.\n"
            "Get them at: https://archive.org/account/s3.php"
        )

    print(f"Uploading to Internet Archive: {identifier} ({len(files)} file(s))")
    responses = ia.upload(
        identifier,
        files=[str(f) for f in files],
        metadata=metadata,
        access_key=access_key,
        secret_key=secret_key,
        verbose=True,
        retries=3,
    )

    for r in responses:
        if r.status_code not in (200, 201):
            print(f"  Warning: HTTP {r.status_code} — {r.url}", file=sys.stderr)

    return ia_url


# ---------------------------------------------------------------------------
# Markdown generators (output matches computerjazz.club Eleventy format)
# ---------------------------------------------------------------------------

def generate_audio_md(
    info: dict,
    ia_identifier: str,
    mp3_files: list[Path],
    label_name: str,
    output_path: Path,
) -> None:
    """Write a src/audio/*.md file ready to drop into the computerjazz.club site."""
    entries = info.get("entries") or [info]

    title = info.get("album") or info.get("title", "Unknown Album")
    artist = info.get("uploader") or info.get("artist", "Unknown Artist")
    date = format_release_date(info.get("release_date") or info.get("upload_date", ""))
    tags = info.get("tags", [])
    description = (info.get("description") or "").strip()

    cover_url = f"https://archive.org/download/{ia_identifier}/cover.jpg"

    tracks_lines = []
    for i, entry in enumerate(entries):
        track_title = entry.get("track") or entry.get("title", f"Track {i + 1}")
        # Use the actual downloaded filename when available
        fname = mp3_files[i].name if i < len(mp3_files) else f"{i + 1:02d}-{slugify(track_title)}.mp3"
        tracks_lines.append(f'  - title: "{track_title}"')
        tracks_lines.append(f'    file: "https://archive.org/download/{ia_identifier}/{fname}"')

    genres_yaml = json.dumps(tags[:8])
    desc_frontmatter = (description[:300].replace("\n", " ") + ("..." if len(description) > 300 else ""))

    content = f"""---
layout: layouts/audio.njk
permalink: "/audio/{slugify(title)}/"
title: "{title}"
artists: ["{artist}"]
labels: ["{label_name}"]
releaseDate: "{date}"
genre: {genres_yaml}
cover: "{cover_url}"
ia_identifier: "{ia_identifier}"
tracks:
{chr(10).join(tracks_lines)}
description: |
  {desc_frontmatter}
---

## About This Album

{description}

### Credits

- **Composed & Produced**: {artist}

---
<!-- COVER: once you copy the artwork locally, replace the cover field with:
     cover: "/assets/images/LABEL_SLUG/{ia_identifier}.jpg"
     SOURCE: {info.get("webpage_url", "")}
     ARCHIVED: https://archive.org/details/{ia_identifier} -->
"""

    output_path.write_text(content, encoding="utf-8")
    print(f"  Generated audio md: {output_path}")


def generate_label_md(
    name: str,
    slug: str,
    bandcamp_url: str,
    location: str,
    genres: list[str],
    bio: str,
    output_path: Path,
) -> None:
    """Write a src/labels/*.md file ready to drop into the computerjazz.club site."""
    genres_yaml = json.dumps(genres)
    bio_indented = bio.strip().replace("\n", "\n  ")

    content = f"""---
layout: layouts/label.njk
permalink: "/labels/{slug}/"
name: "{name}"
location: "{location}"
genres: {genres_yaml}
website: "{bandcamp_url}"
social:
  bandcamp: "{bandcamp_url}"
  contact: ""
bio: |
  {bio_indented}
---
"""

    output_path.write_text(content, encoding="utf-8")
    print(f"  Generated label md: {output_path}")


def generate_archive_report(
    label_name: str,
    label_url: str,
    results: list[dict],
    output_path: Path,
) -> None:
    """Write a human-readable Markdown report of the archiving run."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    successful = [r for r in results if "error" not in r]
    failed = [r for r in results if "error" in r]

    lines = [
        f"# Archive Report — {label_name}",
        f"",
        f"| | |",
        f"|---|---|",
        f"| **Source** | {label_url} |",
        f"| **Generated** | {now} |",
        f"| **Total** | {len(results)} |",
        f"| **Successful** | {len(successful)} |",
        f"| **Failed** | {len(failed)} |",
        f"",
        f"---",
        f"",
        f"## Releases",
        f"",
    ]

    for r in results:
        if "error" in r:
            lines.append(f"### ❌ {r.get('title', 'Unknown')}")
            lines.append(f"")
            lines.append(f"**Error:** {r['error']}")
        else:
            lines.append(f"### ✅ {r['title']}")
            lines.append(f"")
            lines.append(f"| | |")
            lines.append(f"|---|---|")
            lines.append(f"| **Artist** | {r['artist']} |")
            lines.append(f"| **Bandcamp** | {r['bandcamp_url']} |")
            lines.append(f"| **Internet Archive** | [{r['ia_id']}]({r['ia_url']}) |")
            lines.append(f"| **Audio markdown** | `{r['audio_md']}` |")
        lines.append(f"")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"  Report: {output_path}")
