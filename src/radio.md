---
layout: layouts/base.njk
permalink: "/radio/"
title: "Radio"
---

<div class="radio-page">

<h1 class="radio-title">RADIO</h1>

<div class="radio-player-box">
  <div class="radio-player-header">
    <span id="radio-status-dot" class="radio-dot radio-dot--off"></span>
    <span id="radio-status-label">OFF AIR</span>
    <span class="radio-freq">FM 88.8 / INTERNET</span>
  </div>

  <div class="radio-now-playing">
    <div class="radio-label">NOW PLAYING</div>
    <div id="radio-track" class="radio-track-title">---</div>
    <div id="radio-artist" class="radio-track-artist"></div>
  </div>

  <div class="radio-controls">
    <button id="radio-play-btn" class="radio-btn" onclick="cjcRadioToggle()">▶ LISTEN</button>
    <a href="https://radio.computerjazz.club" target="_blank" rel="noopener" class="radio-btn radio-btn--outline">↗ SCHEDULE</a>
  </div>

  <div id="radio-vu" class="radio-vu" aria-hidden="true">
    <span class="radio-vu-bar">░░░░░░░░░░░░░░░░░░░░</span>
  </div>
</div>

</div>

<audio id="cjc-radio-audio" preload="none"></audio>

<script>
(function () {
  const STREAM_URL = "https://radio.computerjazz.club/stream/main";
  const STATUS_URL = "https://radio.computerjazz.club/stream/status-json.xsl";
  const POLL_INTERVAL = 15000;

  const audio  = document.getElementById("cjc-radio-audio");
  const btn    = document.getElementById("radio-play-btn");
  const dot    = document.getElementById("radio-status-dot");
  const label  = document.getElementById("radio-status-label");
  const track  = document.getElementById("radio-track");
  const artist = document.getElementById("radio-artist");
  const vu     = document.querySelector(".radio-vu-bar");

  let playing = false;
  let pollTimer = null;
  let vuTimer = null;

  const VU_CHARS = ["░", "▒", "▓", "█"];

  function setOnAir(on) {
    dot.className   = "radio-dot " + (on ? "radio-dot--on" : "radio-dot--off");
    label.textContent = on ? "ON AIR" : "OFF AIR";
  }

  function randomVu() {
    const len = 20;
    let bar = "";
    const level = playing ? Math.random() * 0.7 + 0.3 : 0;
    for (let i = 0; i < len; i++) {
      const pos = i / len;
      if (pos < level) {
        bar += VU_CHARS[Math.floor(Math.random() * VU_CHARS.length)];
      } else {
        bar += "░";
      }
    }
    vu.textContent = bar;
  }

  function startVu() {
    vuTimer = setInterval(randomVu, 120);
  }

  function stopVu() {
    clearInterval(vuTimer);
    vu.textContent = "░░░░░░░░░░░░░░░░░░░░";
  }

  async function fetchNowPlaying() {
    try {
      const res = await fetch(STATUS_URL, { mode: "cors" });
      const data = await res.json();
      const sources = data?.icestats?.source;
      const src = Array.isArray(sources) ? sources[0] : sources;
      if (src?.title) {
        const parts = src.title.split(" - ");
        if (parts.length >= 2) {
          artist.textContent = parts[0];
          track.textContent  = parts.slice(1).join(" - ");
        } else {
          track.textContent  = src.title;
          artist.textContent = "";
        }
      }
    } catch (_) {
      // stream not yet live, keep current display
    }
  }

  window.cjcRadioToggle = function () {
    if (!playing) {
      audio.src = STREAM_URL + "?t=" + Date.now();
      audio.play().then(() => {
        playing = true;
        btn.textContent = "■ STOP";
        setOnAir(true);
        startVu();
        fetchNowPlaying();
        pollTimer = setInterval(fetchNowPlaying, POLL_INTERVAL);
      }).catch(() => {
        track.textContent = "stream unavailable";
      });
    } else {
      audio.pause();
      audio.src = "";
      playing = false;
      btn.textContent = "▶ LISTEN";
      setOnAir(false);
      stopVu();
      clearInterval(pollTimer);
    }
  };

  audio.addEventListener("error", () => {
    playing = false;
    btn.textContent = "▶ LISTEN";
    setOnAir(false);
    stopVu();
    clearInterval(pollTimer);
    track.textContent = "stream unavailable";
  });
})();
</script>
