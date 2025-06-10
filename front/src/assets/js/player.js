document.addEventListener("DOMContentLoaded", function () {
  const audioElements = document.querySelectorAll("audio");
  let currentlyPlaying = null;

  // Pause other audio when one starts playing
  audioElements.forEach((audio) => {
    audio.addEventListener("play", function () {
      // Pause all other audio elements
      audioElements.forEach((otherAudio) => {
        if (otherAudio !== audio && !otherAudio.paused) {
          otherAudio.pause();
        }
      });
      currentlyPlaying = audio;
    });

    audio.addEventListener("pause", function () {
      if (currentlyPlaying === audio) {
        currentlyPlaying = null;
      }
    });

    audio.addEventListener("ended", function () {
      if (currentlyPlaying === audio) {
        currentlyPlaying = null;
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    if (currentlyPlaying) {
      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (currentlyPlaying.paused) {
            currentlyPlaying.play();
          } else {
            currentlyPlaying.pause();
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          currentlyPlaying.currentTime = Math.max(
            0,
            currentlyPlaying.currentTime - 10,
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          currentlyPlaying.currentTime = Math.min(
            currentlyPlaying.duration,
            currentlyPlaying.currentTime + 10,
          );
          break;
      }
    }
  });

  // Add visual feedback for playing tracks
  audioElements.forEach((audio) => {
    const track = audio.closest(".track");

    audio.addEventListener("play", function () {
      track.classList.add("playing");
    });

    audio.addEventListener("pause", function () {
      track.classList.remove("playing");
    });

    audio.addEventListener("ended", function () {
      track.classList.remove("playing");
    });
  });

  // Add CSS for playing state
  const style = document.createElement("style");
  style.textContent = `
        .track.playing {
            background-color: rgba(52, 152, 219, 0.1);
            border-left: 4px solid var(--secondary-color);
        }

        .track.playing .track-title {
            color: var(--secondary-color);
            font-weight: 600;
        }
    `;
  document.head.appendChild(style);

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
});
