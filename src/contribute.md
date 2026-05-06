---
layout: layouts/base.njk
permalink: "/contribute/"
title: "Contribute"
description: "How to add your music to computerjazz.club"
---

# How to contribute

Want to be featured on the Computer Jazz Club?
Send your files with the right structure and I'll add you.

Contact: **ordinateurdanslatete@protonmail.com**

---

## File structure

<div class="cjc-box">
<div class="cjc-box__label">file tree</div>
<pre>src/
├── labels/
│   └── label-name.md
├── artists/
│   └── artist-name.md
├── audio/
│   └── album-name.md
└── assets/
    ├── audio/
    │   └── LABEL_NAME/
    │       └── ALBUM_NAME/
    │           ├── 01-track-title.mp3
    │           ├── 02-track-title.mp3
    │           └── ...
    └── images/
        ├── labels/
        │   └── label-name.jpg
        ├── artists/
        │   └── artist-name.jpg
        └── LABEL_NAME/
            └── ALBUM_NAME/
                └── cover.jpg</pre>
</div>

---

## Naming conventions

<div class="cjc-box">
<div class="cjc-box__label">conventions</div>
<ul class="cjc-box__list">
<li>Folder and file names: <strong>lowercase</strong>, words separated by <code>-</code> (hyphens)</li>
<li>Exception for asset folders: use <strong>UPPERCASE</strong> short name (ex: <code>ODLT</code> for Ordinateur dans la tête)</li>
<li>Audio files: numbered with 2 digits — <code>01-track-title.mp3</code>, <code>02-other-track.mp3</code></li>
<li>Images: <code>.jpg</code> or <code>.png</code>, minimum 500×500px for covers</li>
</ul>
</div>

---

## 1. Label — `src/labels/label-name.md`

<div class="cjc-box">
<div class="cjc-box__label">yaml</div>
<pre><span class="sh-delim">---</span>
<span class="sh-key">layout</span>: <span class="sh-val">layouts/label.njk</span>
<span class="sh-key">permalink</span>: <span class="sh-string">"/labels/label-name/"</span>
<span class="sh-key">name</span>: <span class="sh-string">"Label Name"</span>
<span class="sh-key">location</span>: <span class="sh-string">"City, Country"</span>
<span class="sh-key">genres</span>: [<span class="sh-string">"genre1"</span>, <span class="sh-string">"genre2"</span>]
<span class="sh-key">website</span>: <span class="sh-url">"https://yoursite.com"</span>
<span class="sh-key">social</span>:
  <span class="sh-key">bandcamp</span>: <span class="sh-url">"https://yourlabel.bandcamp.com"</span>
  <span class="sh-key">contact</span>: <span class="sh-url">"mailto:contact@yourlabel.com"</span>
<span class="sh-key">bio</span>: <span class="sh-pipe">|</span>
  <span class="sh-text">Label description in a few sentences.</span>
<span class="sh-delim">---</span></pre>
</div>

---

## 2. Artist — `src/artists/artist-name.md`

<div class="cjc-box">
<div class="cjc-box__label">yaml</div>
<pre><span class="sh-delim">---</span>
<span class="sh-key">layout</span>: <span class="sh-val">layouts/artist.njk</span>
<span class="sh-key">permalink</span>: <span class="sh-string">"/artists/artist-name/"</span>
<span class="sh-key">name</span>: <span class="sh-string">"Artist Name"</span>
<span class="sh-key">location</span>: <span class="sh-string">"City, Country"</span>
<span class="sh-key">genres</span>: [<span class="sh-string">"genre1"</span>, <span class="sh-string">"genre2"</span>]
<span class="sh-key">image</span>: <span class="sh-string">"/assets/images/artists/artist-name.jpg"</span>
<span class="sh-key">website</span>: <span class="sh-url">"https://yoursite.com"</span>
<span class="sh-key">social</span>:
  <span class="sh-key">bandcamp</span>: <span class="sh-url">"https://yourartist.bandcamp.com"</span>
  <span class="sh-key">contact</span>: <span class="sh-url">"mailto:contact@yourartist.com"</span>
<span class="sh-key">tags</span>: [<span class="sh-string">"artists"</span>]
<span class="sh-key">bio</span>: <span class="sh-pipe">|</span>
  <span class="sh-text">Artist description in a few sentences.</span>
<span class="sh-delim">---</span></pre>
</div>
<div class="cjc-box">
<div class="cjc-box__label">markdown body (optional)</div>
<pre>## About

Additional free text here (optional).</pre>
</div>

---

## 3. Album / Release — `src/audio/album-name.md`

<div class="cjc-box">
<div class="cjc-box__label">yaml</div>
<pre><span class="sh-delim">---</span>
<span class="sh-key">layout</span>: <span class="sh-val">layouts/audio.njk</span>
<span class="sh-key">permalink</span>: <span class="sh-string">"/audio/album-name/"</span>
<span class="sh-key">title</span>: <span class="sh-string">"Album Title"</span>
<span class="sh-key">artists</span>: [<span class="sh-string">"Artist Name"</span>]
<span class="sh-key">labels</span>: [<span class="sh-string">"Label Name"</span>]
<span class="sh-key">releaseDate</span>: <span class="sh-string">"YYYY-MM-DD"</span>
<span class="sh-key">genre</span>:
  <span class="sh-dash">-</span> <span class="sh-string">"genre1"</span>
  <span class="sh-dash">-</span> <span class="sh-string">"genre2"</span>
<span class="sh-key">cover</span>: <span class="sh-string">"/assets/images/LABEL_NAME/ALBUM_NAME/cover.jpg"</span>
<span class="sh-key">tracks</span>:
  <span class="sh-dash">-</span> <span class="sh-key">title</span>: <span class="sh-string">"Track Title 1"</span>
    <span class="sh-key">file</span>: <span class="sh-string">"/assets/audio/LABEL_NAME/ALBUM_NAME/01-track-title.mp3"</span>
  <span class="sh-dash">-</span> <span class="sh-key">title</span>: <span class="sh-string">"Track Title 2"</span>
    <span class="sh-key">file</span>: <span class="sh-string">"/assets/audio/LABEL_NAME/ALBUM_NAME/02-track-title.mp3"</span>
<span class="sh-key">description</span>: <span class="sh-pipe">|</span>
  <span class="sh-text">Album description in a few sentences.</span>
<span class="sh-delim">---</span></pre>
</div>
<div class="cjc-box">
<div class="cjc-box__label">markdown body (optional)</div>
<pre>## About This Album

Free text here (optional).

### Credits

- **Composed &amp; Produced**: First Last</pre>
</div>

---

## What to send

A zip archive containing:

<div class="cjc-box">
<div class="cjc-box__label">zip archive</div>
<pre>LabelName_AlbumName_cjc.zip
├── labels/
│   └── label-name.md
├── artists/
│   └── artist-name.md
├── audio/
│   └── album-name.md
└── assets/
    ├── audio/
    │   └── LABEL_NAME/
    │       └── ALBUM_NAME/
    │           ├── 01-track.mp3
    │           └── ...
    └── images/
        ├── artists/
        │   └── artist-name.jpg
        └── LABEL_NAME/
            └── ALBUM_NAME/
                └── cover.jpg</pre>
</div>

Or open a **pull request** on the Git repo:
[github.com/rhoumi/computerjazz.club](https://github.com/rhoumi/computerjazz.club)

---

<div class="cjc-box">
<div class="cjc-box__label">...</div>
<pre>  [CONTRIBUTE]
  > send files
  >> get added
  >>> computer jazz</pre>
</div>
