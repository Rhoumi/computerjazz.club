# Development Guide

## Getting Started

1. **Clone and setup**:
   ```bash
   git clone [repository-url]
   cd ComputerJazzClub
   pnpm install
   ```

2. **Development**:
   ```bash
   pnpm run serve
   ```
   Visit `http://localhost:8080` to see your site.

3. **Build for production**:
   ```bash
   pnpm run build
   ```

## Adding Audio Files

Since audio files are typically large and not suitable for git, follow these steps:

1. Create directories for your albums in `src/assets/audio/`:
   ```bash
   mkdir -p src/assets/audio/your-album-name
   ```

2. Add your audio files (MP3, OGG, or WAV):
   ```
   src/assets/audio/your-album-name/
   ├── 01-track-name.mp3
   ├── 02-track-name.mp3
   └── ...
   ```

3. Update the album markdown file with the correct file paths.

## Adding Album Covers

1. Add high-resolution images (recommended: 1000x1000px or larger) to `src/assets/images/`
2. Update the `cover` field in your album markdown files
3. Supported formats: JPG, PNG, WebP, SVG

## Customizing Styles

Edit `src/assets/css/style.css` to customize:
- Colors (CSS custom properties at the top)
- Layout and spacing
- Typography
- Responsive breakpoints

## Customizing Functionality

Edit `src/assets/js/player.js` to modify:
- Audio player behavior
- Keyboard shortcuts
- Visual feedback

## Album Data Structure

Each album is a markdown file in `src/albums/` with frontmatter:

```yaml
---
layout: layouts/album.njk
permalink: "/albums/album-slug/"
title: "Album Title"
artist: "Artist Name"
releaseDate: "YYYY-MM-DD"
genre: "Genre"
cover: "/assets/images/cover.jpg"
tracks:
  - title: "Track Name"
    duration: "MM:SS"
    file: "/assets/audio/album/track.mp3"
description: |
  Album description in markdown.
---

# Additional content

More information about the album can go here in markdown format.
```

## Deployment

The `_site/` directory contains the built site. Deploy to:

- **Netlify**: Connect to git repository, build command: `pnpm run build`, publish directory: `_site`
- **Vercel**: Same as Netlify
- **GitHub Pages**: Use GitHub Actions to build and deploy
- **Static hosting**: Upload `_site/` contents to any web server

## Tips

- Keep audio files organized in album subdirectories
- Use consistent naming conventions for files
- Test audio playback in different browsers
- Optimize images for web (WebP format recommended)
- Consider using a CDN for large audio files
