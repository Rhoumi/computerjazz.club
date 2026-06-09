(function () {
  'use strict';

  // ===== CONSTANTS =====
  let CELLS = 40;
  let charWidth = null;

  function measureCharWidth(el) {
    const probe = document.createElement('span');
    probe.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;font-family:' +
      getComputedStyle(el).fontFamily + ';font-size:' + getComputedStyle(el).fontSize;
    probe.textContent = '-'.repeat(20);
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width / 20;
    document.body.removeChild(probe);
    return w || 8.5;
  }

  function updateCells() {
    if (!charWidth) charWidth = measureCharWidth(fpProgressBar);
    const bw = fpProgressArea.getBoundingClientRect().width;
    if (bw > 0 && charWidth > 0) {
      CELLS = Math.max(10, Math.floor(bw / charWidth));
    }
  }

  function animChar(gt, cellIndex) {
    const x = ((gt - cellIndex) % 4 + 4) % 4;
    if (x === 0) return '.';
    if (x === 2) return "'";
    return '\u00b7';
  }

  // ===== STATE =====
  let playlist = [];
  let currentIndex = 0;
  let globalTime = 0;
  let mouseInProgress = false;
  let loopMode = false;   // 'none' | track loop
  let shuffleMode = false;

  setInterval(() => globalTime++, 100);

  const VOL_CELLS = 10;

  // ===== DOM REFS =====
  const fpAudio        = document.getElementById('fp-audio');
  const fpPlayer       = document.getElementById('footer-player');
  const fpCoverImg     = document.getElementById('fp-cover-img');
  const fpTrackTitle   = document.getElementById('fp-track-title');
  const fpAlbumTitle   = document.getElementById('fp-album-title');
  const fpPlayBtn      = document.getElementById('fp-play');
  const fpPrevBtn      = document.getElementById('fp-prev');
  const fpNextBtn      = document.getElementById('fp-next');
  const fpProgressBar  = document.getElementById('fp-progress-bar');
  const fpProgressArea = document.getElementById('fp-progress-area');
  const fpTimeEl       = document.getElementById('fp-time');
  const fpVolBar       = document.getElementById('fp-vol-bar');
  const fpLoopBtn      = document.getElementById('fp-loop');
  const fpShuffleBtn   = document.getElementById('fp-shuffle');

  // ===== UTILITIES =====
  function formatTime(s) {
    if (!s || isNaN(s)) return '--:--';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function buildBar() {
    if (!fpAudio.duration || isNaN(fpAudio.duration)) return '-'.repeat(CELLS);
    const filled = Math.floor((fpAudio.currentTime / fpAudio.duration) * CELLS);
    let bar = '';
    for (let i = 0; i < CELLS; i++) {
      if (i < filled) {
        bar += animChar(globalTime, i);
      } else if (i === filled) {
        bar += '|';
      } else {
        bar += '-';
      }
    }
    return bar;
  }

  // ===== RESPONSIVE CELLS =====
  requestAnimationFrame(() => {
    updateCells();
    if (window.ResizeObserver) {
      new ResizeObserver(updateCells).observe(fpProgressArea);
    }
  });

  // ===== PROGRESS UPDATE LOOP =====
  setInterval(() => {
    if (fpAudio.paused && fpAudio.currentTime === 0) return;
    if (!mouseInProgress) {
      fpProgressBar.textContent = buildBar();
    }
    fpTimeEl.textContent = formatTime(fpAudio.currentTime) + ' / ' + formatTime(fpAudio.duration);
    if (typeof window.onFooterPlayerTimeUpdate === 'function') {
      window.onFooterPlayerTimeUpdate(fpAudio.currentTime, fpAudio.duration, currentIndex);
    }
  }, 100);

  // ===== PROGRESS BAR INTERACTION =====
  fpProgressArea.addEventListener('mouseenter', () => mouseInProgress = true);
  fpProgressArea.addEventListener('mouseleave', () => mouseInProgress = false);

  fpProgressArea.addEventListener('mousedown', function (e) {
    if (!fpAudio.duration) return;
    const rect = fpProgressBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    fpAudio.currentTime = ratio * fpAudio.duration;
    fpProgressBar.textContent = buildBar();
  });

  // ===== PLAYBACK =====
  function playTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[index];
    fpAudio.src = track.file;
    fpTrackTitle.textContent = track.title;
    fpAlbumTitle.textContent = track.album || '';
    if (track.cover) {
      fpCoverImg.src = track.cover;
      fpCoverImg.style.display = '';
    } else {
      fpCoverImg.style.display = 'none';
    }
    fpAudio.play();
    highlightCurrentTrack();
  }

  fpPlayBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    fpAudio.paused ? fpAudio.play() : fpAudio.pause();
  });

  fpPrevBtn.addEventListener('click', () => {
    if (fpAudio.currentTime > 3) {
      fpAudio.currentTime = 0;
    } else if (currentIndex > 0) {
      playTrack(currentIndex - 1);
    } else {
      fpAudio.currentTime = 0;
    }
  });

  fpNextBtn.addEventListener('click', () => {
    if (shuffleMode) {
      playTrack(randomIndex());
    } else if (currentIndex < playlist.length - 1) {
      playTrack(currentIndex + 1);
    } else if (loopMode) {
      playTrack(0);
    }
  });

  fpAudio.addEventListener('play', () => {
    fpPlayBtn.textContent = 'll';
    fpPlayer.classList.add('active');
    document.body.classList.add('player-active');
  });

  fpAudio.addEventListener('pause', () => {
    fpPlayBtn.textContent = '▶';
  });

  fpAudio.addEventListener('ended', () => {
    if (shuffleMode) {
      playTrack(randomIndex());
    } else if (currentIndex < playlist.length - 1) {
      playTrack(currentIndex + 1);
    } else if (loopMode) {
      playTrack(0);
    } else {
      fpPlayBtn.textContent = '▶';
    }
  });

  // ===== SHUFFLE / LOOP =====
  function randomIndex() {
    if (playlist.length <= 1) return 0;
    let next;
    do { next = Math.floor(Math.random() * playlist.length); } while (next === currentIndex);
    return next;
  }

  fpLoopBtn.addEventListener('click', () => {
    loopMode = !loopMode;
    fpLoopBtn.classList.toggle('active', loopMode);
    fpLoopBtn.textContent = loopMode ? '[↺]' : '↺';
  });

  fpShuffleBtn.addEventListener('click', () => {
    shuffleMode = !shuffleMode;
    fpShuffleBtn.classList.toggle('active', shuffleMode);
    fpShuffleBtn.textContent = shuffleMode ? '[~?]' : '~?';
  });

  // ===== VOLUME =====
  function buildVolBar() {
    const filled = Math.round(fpAudio.volume * VOL_CELLS);
    return '/'.repeat(filled) + '.'.repeat(VOL_CELLS - filled);
  }

  function updateVolBar() {
    if (fpVolBar) fpVolBar.textContent = buildVolBar();
  }

  updateVolBar();
  fpAudio.addEventListener('volumechange', updateVolBar);

  if (fpVolBar) {
    fpVolBar.style.cursor = 'pointer';
    fpVolBar.addEventListener('mousedown', function (e) {
      const rect = this.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      fpAudio.volume = ratio;
    });
    // Scroll wheel on volume bar
    fpVolBar.addEventListener('wheel', function (e) {
      e.preventDefault();
      fpAudio.volume = Math.max(0, Math.min(1, fpAudio.volume - e.deltaY * 0.001));
    }, { passive: false });
  }

  // ===== KEYBOARD SHORTCUTS =====
  document.addEventListener('keydown', function (e) {
    if (playlist.length === 0) return;
    // Don't steal keys when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        fpAudio.paused ? fpAudio.play() : fpAudio.pause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        fpAudio.currentTime = Math.max(0, fpAudio.currentTime - 10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        fpAudio.currentTime = Math.min(fpAudio.duration || 0, fpAudio.currentTime + 10);
        break;
    }
  });

  // ===== HIGHLIGHT TRACK ON PAGE =====
  function highlightCurrentTrack() {
    const currentFile = playlist[currentIndex] ? playlist[currentIndex].file : null;
    document.querySelectorAll('.track[data-file]').forEach(el => {
      el.classList.toggle('playing', currentFile != null && el.dataset.file === currentFile);
    });
    if (typeof window.onFooterPlayerTrackChange === 'function') {
      window.onFooterPlayerTrackChange(currentIndex, playlist[currentIndex]);
    }
  }

  // ===== PUBLIC API =====
  window.FooterPlayer = {
    play: function (trackList, startIndex) {
      playlist = trackList.slice();
      playTrack(startIndex || 0);
    },
    audio: fpAudio,
    getCurrentIndex: () => currentIndex,
    getPlaylist: () => playlist,
  };

  // ===== SPA NAVIGATION =====
  function isNavigableLink(href) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      const path = url.pathname;
      if (path.startsWith('/assets/')) return false;
      const lastSegment = path.split('/').pop();
      if (lastSegment.includes('.') && !lastSegment.endsWith('.html')) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  async function navigate(url) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) { window.location.href = url; return; }
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const newMain = doc.querySelector('.main-content');
      const curMain = document.querySelector('.main-content');
      if (newMain && curMain) {
        curMain.innerHTML = newMain.innerHTML;
        executePageScripts(curMain);
      }

      document.title = doc.title;
      history.pushState({ url }, '', url);
      window.scrollTo(0, 0);
      updateNavActive(url);
      highlightCurrentTrack();
    } catch (err) {
      window.location.href = url;
    }
  }

  function executePageScripts(container) {
    container.querySelectorAll('script').forEach(old => {
      const s = document.createElement('script');
      Array.from(old.attributes).forEach(a => s.setAttribute(a.name, a.value));
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  function updateNavActive(url) {
    try {
      const target = new URL(url, window.location.href).pathname;
      document.querySelectorAll('.nav-links a').forEach(a => {
        const aPath = new URL(a.href).pathname;
        a.classList.toggle('active', aPath === target);
      });
    } catch (e) {}
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!isNavigableLink(href)) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;
    e.preventDefault();
    navigate(href);
  });

  window.addEventListener('popstate', () => {
    navigate(window.location.href);
  });

  // Set initial nav active state
  updateNavActive(window.location.href);

})();
