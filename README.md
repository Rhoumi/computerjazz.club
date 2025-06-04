## Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start development server**:
   ```bash
   pnpm run serve
   ```

3. **Build for production**:
   ```bash
   pnpm run build
   ```

The site will be available at `http://localhost:8080`.

## Adding New Albums

1. Create a new markdown file in `src/albums/` (e.g., `new-album.md`)
2. Add the album metadata and track listing:

```markdown
---
layout: layouts/album.njk
title: "Your Album Title"
artist: "Artist Name"
releaseDate: "2025-06-04"
genre: "Genre"
cover: "/assets/images/album-cover.jpg"
tracks:
  - title: "Track 1"
    duration: "3:45"
    file: "/assets/audio/album-folder/track1.mp3"
  - title: "Track 2"
    duration: "4:12"
    file: "/assets/audio/album-folder/track2.mp3"
description: |
  Album description in markdown format.
---

## About This Album

Additional content about the album goes here.
```

3. Add your audio files to `src/assets/audio/album-folder/`
4. Add the album cover to `src/assets/images/`

## File Structure

```
src/
├── _data/              # Global data files
├── _includes/          # Template partials and layouts
│   ├── layouts/        # Page layouts
│   └── partials/       # Reusable components
├── albums/             # Album pages and data
├── assets/             # Static assets
│   ├── audio/          # Audio files organized by album
│   ├── images/         # Album covers and images
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript files
└── index.njk           # Homepage
```

## Audio File Organization

Organize your audio files in the following structure:

```
src/assets/audio/
├── album-name-1/
│   ├── 01-track-name.mp3
│   ├── 02-track-name.mp3
│   └── ...
├── album-name-2/
│   ├── 01-track-name.mp3
│   └── ...
```

## Supported Audio Formats

- MP3 (recommended for web)
- OGG Vorbis
- WAV (for high quality)

## Customization

### Styling
Edit `src/assets/css/style.css` to customize the appearance.

### JavaScript
Edit `src/assets/js/player.js` to modify audio player behavior.

### Site Data
Edit `src/_data/site.json` to update site-wide information.

## Deployment

The built site will be in the `_site/` directory after running `pnpm run build`. You can deploy this to any static hosting service like:

- Netlify
- Vercel
- GitHub Pages
- Surge.sh

## License

ISC License - see LICENSE file for details.
