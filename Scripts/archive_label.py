#!/usr/bin/env python3
"""
Archive an entire Bandcamp label to the Internet Archive.

Discovers every release on the label page, downloads each one (audio + artwork),
uploads them all to IA, and generates:
  - one src/audio/*.md file per release
  - one src/labels/*.md file for the label
  - one archive-report.md summarising every item with links

Usage:
    python archive_label.py https://labelname.bandcamp.com \\
        --label-slug odlt \\
        --label-name "Ordinateur dans la tête" \\
        --location "Lyon, France"

See README.md for full documentation.
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from utils import (
    build_ia_identifier,
    download_album,
    extract_info,
    format_release_date,
    generate_archive_report,
    generate_audio_md,
    generate_label_md,
    list_label_releases,
    normalise_cover,
    slugify,
    upload_to_ia,
)


def archive_single_release(
    release_url: str,
    ia_prefix: str,
    label_slug: str,
    label_name: str,
    output_dir: Path,
    dry_run: bool,
    skip_existing: bool,
) -> dict:
    """
    Download, upload, and generate a markdown for one release.
    Returns a result dict (with 'error' key on failure).
    """
    info = extract_info(release_url)
    album_title = info.get("album") or info.get("title", "unknown")
    artist = info.get("uploader") or info.get("artist", "unknown")

    ia_identifier = build_ia_identifier(ia_prefix, label_slug, slugify(artist))
    album_dir = output_dir / ia_identifier

    if skip_existing and list(album_dir.glob("*.mp3")):
        print(f"  Skipping (already downloaded): {album_dir}")
        mp3_files = sorted(album_dir.glob("*.mp3"))
        md_path = output_dir / f"{slugify(album_title)}.md"
        if not md_path.exists():
            generate_audio_md(info, ia_identifier, mp3_files, label_name, md_path)
        return {
            "title": album_title,
            "artist": artist,
            "ia_id": ia_identifier,
            "ia_url": f"https://archive.org/details/{ia_identifier}",
            "audio_md": str(md_path),
            "bandcamp_url": release_url,
            "skipped": True,
        }

    info, mp3_files = download_album(release_url, album_dir)
    cover = normalise_cover(album_dir)

    upload_files: list[Path] = list(mp3_files)
    if cover:
        upload_files.append(cover)
    upload_files += list(album_dir.glob("*.json"))

    ia_metadata = {
        "mediatype": "audio",
        "title": album_title,
        "creator": artist,
        "subject": info.get("tags", []),
        "description": info.get("description", ""),
        "date": format_release_date(info.get("release_date") or info.get("upload_date", "")),
        "source": release_url,
        "licenseurl": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    }

    ia_url = upload_to_ia(ia_identifier, upload_files, ia_metadata, dry_run=dry_run)

    md_path = output_dir / f"{slugify(album_title)}.md"
    generate_audio_md(info, ia_identifier, mp3_files, label_name, md_path)

    return {
        "title": album_title,
        "artist": artist,
        "ia_id": ia_identifier,
        "ia_url": ia_url,
        "audio_md": str(md_path),
        "bandcamp_url": release_url,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Archive an entire Bandcamp label to the Internet Archive.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("url", help="Bandcamp label URL (e.g. https://labelname.bandcamp.com)")
    parser.add_argument(
        "--ia-prefix",
        default="computerjazz",
        metavar="PREFIX",
        help="Prefix for all IA identifiers (default: computerjazz)",
    )
    parser.add_argument(
        "--label-slug",
        required=True,
        metavar="SLUG",
        help="Short label identifier used in IA ids, e.g. 'odlt'",
    )
    parser.add_argument(
        "--label-name",
        required=True,
        metavar="NAME",
        help='Label display name, e.g. "Ordinateur dans la tête"',
    )
    parser.add_argument(
        "--location",
        default="",
        metavar="LOCATION",
        help='Label location, e.g. "Lyon, France"',
    )
    parser.add_argument(
        "--bio",
        default="",
        metavar="TEXT",
        help="Label bio / description (wraps the Bandcamp about text if provided)",
    )
    parser.add_argument(
        "--output-dir",
        default="./output",
        metavar="DIR",
        help="Root directory for downloads and generated files (default: ./output)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Download files but skip the Internet Archive upload",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip a release if its download directory already contains MP3 files",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # --- Discover releases ---
    print(f"Fetching release list from {args.url} …")
    releases = list_label_releases(args.url)
    if not releases:
        sys.exit("No releases found. Check that the URL is a Bandcamp label/artist page.")

    print(f"Found {len(releases)} release(s).\n")

    # --- Archive each release ---
    results: list[dict] = []
    all_genres: list[str] = []

    for i, release in enumerate(releases, 1):
        print(f"[{i}/{len(releases)}] {release['title']}")
        print(f"  URL: {release['url']}")
        try:
            result = archive_single_release(
                release_url=release["url"],
                ia_prefix=args.ia_prefix,
                label_slug=args.label_slug,
                label_name=args.label_name,
                output_dir=output_dir,
                dry_run=args.dry_run,
                skip_existing=args.skip_existing,
            )
            results.append(result)
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr)
            results.append({"title": release["title"], "error": str(exc)})
        print()

    # --- Generate label markdown ---
    label_md = output_dir / f"{args.label_slug}.md"
    generate_label_md(
        name=args.label_name,
        slug=args.label_slug,
        bandcamp_url=args.url,
        location=args.location,
        genres=list(dict.fromkeys(all_genres)),  # deduplicated, order-preserved
        bio=args.bio,
        output_path=label_md,
    )

    # --- Generate archive report ---
    report_path = output_dir / f"{args.label_slug}-archive-report.md"
    generate_archive_report(args.label_name, args.url, results, report_path)

    # --- Final summary ---
    successful = [r for r in results if "error" not in r]
    failed = [r for r in results if "error" in r]

    print("=" * 60)
    print(f"Label archive complete!")
    print(f"  Releases : {len(releases)}")
    print(f"  OK       : {len(successful)}")
    print(f"  Failed   : {len(failed)}")
    print()
    print("Generated files:")
    print(f"  Label markdown : {label_md}")
    print(f"  Report         : {report_path}")
    for r in successful:
        print(f"  Audio markdown : {r['audio_md']}")
    print()
    print("Next steps:")
    print(f"  1. Copy {args.label_slug}.md → src/labels/{args.label_slug}.md")
    print(f"  2. Copy each audio *.md     → src/audio/")
    print(f"  3. Copy cover art           → src/assets/images/LABEL_SLUG/")
    print(f"  4. Update 'cover:' fields in audio markdowns with local paths")
    print(f"  5. Review {report_path} for any failures")


if __name__ == "__main__":
    main()
