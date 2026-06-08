# Bandcamp → Internet Archive archiving scripts

Two Python scripts to archive Bandcamp releases to the [Internet Archive](https://archive.org)
and automatically generate the Markdown files used by the computerjazz.club Eleventy site.

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Internet Archive credentials](#internet-archive-credentials)
- [archive\_album.py — single album](#archive_albumpy--single-album)
- [archive\_label.py — full label](#archive_labelpy--full-label)
- [Generated files](#generated-files)
- [Integrating into the site](#integrating-into-the-site)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.10+ | `python --version` |
| ffmpeg | any recent | needed by yt-dlp for MP3 conversion |
| pip | — | comes with Python |

Install ffmpeg on Ubuntu/Debian:

```sh
sudo apt install ffmpeg
```

On macOS with Homebrew:

```sh
brew install ffmpeg
```

---

## Setup

```sh
cd Scripts
pip install -r requirements.txt
```

This installs:
- **yt-dlp** — downloads audio and metadata from Bandcamp
- **internetarchive** — uploads files to archive.org via its S3-like API

---

## Internet Archive credentials

Create a free account at [archive.org](https://archive.org) then get your S3 keys at:
**https://archive.org/account/s3.php**

Export them before running any script:

```sh
export IA_ACCESS_KEY="your-access-key"
export IA_SECRET_KEY="your-secret-key"
```

Or add them to your shell profile (`~/.bashrc`, `~/.zshrc`) to avoid re-typing every session.

> **Note:** You can always test without uploading using `--dry-run`.

---

## archive\_album.py — single album

Downloads one Bandcamp album, uploads it to the Internet Archive, and generates
one `src/audio/*.md` file.

### Usage

```sh
python archive_album.py <BANDCAMP_ALBUM_URL> \
    --label-slug <SLUG> \
    --label-name "<DISPLAY NAME>"
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `url` | yes | Full Bandcamp album URL |
| `--label-slug` | yes | Short slug used in the IA identifier, e.g. `odlt` |
| `--label-name` | yes | Display name written into the markdown, e.g. `"Ordinateur dans la tête"` |
| `--ia-prefix` | no | Prefix for the IA identifier (default: `computerjazz`) |
| `--ia-id` | no | Override the auto-generated IA identifier entirely |
| `--output-dir` | no | Download directory (default: `./output`) |
| `--dry-run` | no | Download files but skip the IA upload |

### Example

```sh
python archive_album.py https://ordinateurdanslatete.bandcamp.com/album/brotteaux-nation \
    --label-slug odlt \
    --label-name "Ordinateur dans la tête"
```

**Output:**

```
output/
├── computerjazz-odlt-bubobubobubobubo/   ← downloaded files
│   ├── 01-rmf-suraigu.mp3
│   ├── 02-a-reculons.mp3
│   ├── cover.jpg
│   └── *.info.json
└── brotteaux-nation.md                   ← ready for src/audio/
```

---

## archive\_label.py — full label

Iterates over every release on a Bandcamp label page, archives them all to IA,
and additionally generates a `src/labels/*.md` file and a summary report.

### Usage

```sh
python archive_label.py <BANDCAMP_LABEL_URL> \
    --label-slug <SLUG> \
    --label-name "<DISPLAY NAME>" \
    [--location "<CITY, COUNTRY>"] \
    [--bio "<BIO TEXT>"]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `url` | yes | Bandcamp label URL (the homepage, not an individual release) |
| `--label-slug` | yes | Short slug, e.g. `odlt` |
| `--label-name` | yes | Display name, e.g. `"Ordinateur dans la tête"` |
| `--location` | no | City / country for the label markdown |
| `--bio` | no | Label bio text (wrap in quotes; use `\n` for line breaks) |
| `--ia-prefix` | no | Prefix for all IA identifiers (default: `computerjazz`) |
| `--output-dir` | no | Root download directory (default: `./output`) |
| `--dry-run` | no | Download all files but skip IA uploads |
| `--skip-existing` | no | Skip a release if its folder already contains MP3 files |

### Example

```sh
python archive_label.py https://ordinateurdanslatete.bandcamp.com \
    --label-slug odlt \
    --label-name "Ordinateur dans la tête" \
    --location "Lyon, France" \
    --bio "Independent label dedicated to experimental music and live coding."
```

**Output:**

```
output/
├── computerjazz-odlt-ralt144mi/
│   ├── 01-algorave-10th-birthday.mp3
│   ├── cover.jpg
│   └── *.info.json
├── computerjazz-odlt-bubobubobubobubo/
│   ├── 01-rmf-suraigu.mp3
│   └── ...
├── ordinateur-dans-la-tete.md          ← ready for src/labels/
├── brotteaux-nation.md                 ← ready for src/audio/
├── ordinateur-dans-la-tete.md          ← ready for src/audio/
└── odlt-archive-report.md              ← summary with all links
```

---

## Generated files

### Audio markdown (`src/audio/*.md`)

Matches the existing site format exactly:

```yaml
---
layout: layouts/audio.njk
permalink: "/audio/brotteaux-nation/"
title: "Brotteaux-Nation"
artists: ["bubobubobubobubo"]
labels: ["Ordinateur dans la tête"]
releaseDate: "2022-10-24"
genre: ["live coding", "computer music", "techno", "experimental"]
cover: "https://archive.org/download/computerjazz-odlt-bubo/cover.jpg"
ia_identifier: "computerjazz-odlt-bubobubobubobubo"
tracks:
  - title: "RMF SURAIGU"
    file: "https://archive.org/download/computerjazz-odlt-bubobubobubobubo/01-rmf-suraigu.mp3"
  ...
description: |
  Short description...
---

## About This Album
...
### Credits
...
```

> **Cover field:** the script sets it to the IA download URL.
> Once you copy the artwork to `src/assets/images/`, replace it with a local path:
> ```yaml
> cover: "/assets/images/ODLT/computerjazz-odlt-bubobubobubobubo.jpg"
> ```

### Label markdown (`src/labels/*.md`)

```yaml
---
layout: layouts/label.njk
permalink: "/labels/odlt/"
name: "Ordinateur dans la tête"
location: "Lyon, France"
genres: ["live coding", "experimental", "computer music"]
website: "https://ordinateurdanslatete.bandcamp.com"
social:
  bandcamp: "https://ordinateurdanslatete.bandcamp.com"
  contact: ""
bio: |
  Independent label dedicated to experimental music and live coding.
---
```

### Archive report (`output/<slug>-archive-report.md`)

A Markdown table with every release, its IA identifier, archive URL, Bandcamp URL,
and path to the generated markdown file. Useful for cross-referencing assets.

---

## Integrating into the site

After running a script:

1. **Copy audio markdowns** into `src/audio/`:
   ```sh
   cp output/*.md ../src/audio/
   ```

2. **Copy the label markdown** into `src/labels/`:
   ```sh
   cp output/odlt.md ../src/labels/ordinateur-dans-la-tete.md
   ```

3. **Copy cover art** into `src/assets/images/`:
   ```sh
   mkdir -p ../src/assets/images/ODLT
   cp output/computerjazz-odlt-*/cover.jpg ../src/assets/images/ODLT/
   # Rename each file to match the ia_identifier, e.g.:
   # mv ODLT/cover.jpg ODLT/computerjazz-odlt-ralt144mi.jpg
   ```

4. **Update `cover:` fields** in each audio markdown to use the local path:
   ```yaml
   cover: "/assets/images/ODLT/computerjazz-odlt-ralt144mi.jpg"
   ```

5. **Build and preview**:
   ```sh
   cd .. && pnpm run build
   ```

---

## Troubleshooting

### `yt-dlp` fails on the label page

Bandcamp sometimes rate-limits scraping. Try adding `--sleep-interval 3` to the
yt-dlp call in `utils.py` (`download_album` function), or run with `--skip-existing`
after an interrupted run.

### IA upload returns 403

Your `IA_ACCESS_KEY` / `IA_SECRET_KEY` are wrong or expired. Regenerate them at
https://archive.org/account/s3.php.

### IA upload returns 503 / timeout

The Internet Archive has occasional outages. Re-run with `--skip-existing` — it
will resume from where it stopped.

### Filename encoding issues on track titles

If track filenames contain non-ASCII characters that break the IA URL, rename the
downloaded MP3 files manually and update the `file:` paths in the generated markdown.

### Cover not found

yt-dlp sometimes saves the thumbnail as `.webp`. The `normalise_cover()` helper in
`utils.py` handles `.jpg`, `.jpeg`, `.png`, and `.webp` — if the file still isn't
found, check the download directory and rename it to `cover.jpg` manually.
