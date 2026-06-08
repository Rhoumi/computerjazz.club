#!/usr/bin/env python3
"""
Archive a single Bandcamp album to the Internet Archive.

Downloads audio (MP3) and artwork, uploads everything to IA, then writes
a ready-to-use src/audio/*.md file for the computerjazz.club Eleventy site.

Usage:
    python archive_album.py <bandcamp_album_url> \\
        --label-slug odlt \\
        --label-name "Ordinateur dans la tête"

See README.md for full documentation.
"""

import argparse
import sys
from pathlib import Path

# Allow running from any directory
sys.path.insert(0, str(Path(__file__).parent))

from utils import (
    build_ia_identifier,
    download_album,
    extract_info,
    format_release_date,
    generate_audio_md,
    normalise_cover,
    slugify,
    upload_to_ia,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Archive a Bandcamp album to the Internet Archive.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("url", help="Bandcamp album URL")
    parser.add_argument(
        "--ia-prefix",
        default="computerjazz",
        metavar="PREFIX",
        help="Prefix for the IA identifier (default: computerjazz)",
    )
    parser.add_argument(
        "--label-slug",
        required=True,
        metavar="SLUG",
        help="Short label identifier used in the IA id, e.g. 'odlt'",
    )
    parser.add_argument(
        "--label-name",
        required=True,
        metavar="NAME",
        help='Label display name, e.g. "Ordinateur dans la tête"',
    )
    parser.add_argument(
        "--ia-id",
        metavar="IDENTIFIER",
        help="Override the auto-generated IA identifier",
    )
    parser.add_argument(
        "--output-dir",
        default="./output",
        metavar="DIR",
        help="Directory for downloaded files and generated markdown (default: ./output)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Download files but skip the Internet Archive upload",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)

    # --- Fetch metadata first (fast, no download) ---
    print(f"Fetching metadata from {args.url} …")
    info = extract_info(args.url)

    album_title = info.get("album") or info.get("title", "unknown")
    artist = info.get("uploader") or info.get("artist", "unknown")

    ia_identifier = args.ia_id or build_ia_identifier(
        args.ia_prefix,
        args.label_slug,
        slugify(artist),
    )

    print(f"Album  : {album_title}")
    print(f"Artist : {artist}")
    print(f"IA id  : {ia_identifier}")
    print()

    # --- Download ---
    album_dir = output_dir / ia_identifier
    print(f"Downloading to {album_dir} …")
    info, mp3_files = download_album(args.url, album_dir)

    cover = normalise_cover(album_dir)
    print(f"Cover  : {cover or 'not found'}")
    print()

    # --- Upload to Internet Archive ---
    upload_files: list[Path] = list(mp3_files)
    if cover:
        upload_files.append(cover)
    upload_files += list(album_dir.glob("*.json"))  # include info JSON as metadata

    ia_metadata = {
        "mediatype": "audio",
        "title": album_title,
        "creator": artist,
        "subject": info.get("tags", []),
        "description": info.get("description", ""),
        "date": format_release_date(info.get("release_date") or info.get("upload_date", "")),
        "source": info.get("webpage_url", args.url),
        "licenseurl": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    }

    ia_url = upload_to_ia(ia_identifier, upload_files, ia_metadata, dry_run=args.dry_run)

    # --- Generate markdown ---
    md_path = output_dir / f"{slugify(album_title)}.md"
    generate_audio_md(info, ia_identifier, mp3_files, args.label_name, md_path)

    # --- Summary ---
    print()
    print("=" * 60)
    print(f"Done!")
    print(f"  Internet Archive : {ia_url}")
    print(f"  Markdown file    : {md_path}")
    print()
    print("Next steps:")
    print(f"  1. Copy {md_path}")
    print(f"     → src/audio/{slugify(album_title)}.md")
    print(f"  2. Copy cover art ({cover})")
    print(f"     → src/assets/images/LABEL_SLUG/{ia_identifier}.jpg")
    print(f"  3. Update the 'cover:' field in the markdown with the local path")


if __name__ == "__main__":
    main()
