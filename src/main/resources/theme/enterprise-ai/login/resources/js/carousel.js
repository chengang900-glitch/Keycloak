(() => {
  "use strict";

  const AUTOPLAY_MS = 5000;
  const SWIPE_THRESHOLD_PX = 40;

  const initialize = () => {
    const carousel = document.querySelector("[data-xz-carousel]");
    if (!carousel) return;

    const slides = Array.from(carousel.querySelectorAll("[data-xz-slide]"));
    const dots = Array.from(carousel.querySelectorAll("[data-xz-dot]"));
    const toggle = carousel.querySelector("[data-xz-toggle]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopAutoplay = window.matchMedia("(min-width: 640px)");
    const pausedBy = new Set();
    const available = slides.map(() => true);
    let activeIndex = 0;
    let timer = 0;
    let manualPause = false;
    let touchStartX = null;

    const availableIndexes = () =>
      available.flatMap((isAvailable, index) => (isAvailable ? [index] : []));

    const autoplayAllowed = () =>
      !manualPause &&
      pausedBy.size === 0 &&
      !reducedMotion.matches &&
      desktopAutoplay.matches &&
      availableIndexes().length > 1;

    const stopTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = 0;
    };

    const updateToggle = () => {
      if (!toggle) return;
      const autoplayAvailable = !reducedMotion.matches && desktopAutoplay.matches;
      toggle.disabled = !autoplayAvailable;
      toggle.setAttribute("aria-pressed", String(manualPause));
      toggle.setAttribute("aria-label", manualPause ? "播放轮播" : "暂停轮播");
    };

    const render = () => {
      slides.forEach((slide, index) => {
        const current = index === activeIndex && available[index];
        slide.classList.toggle("is-active", current);
        slide.setAttribute("aria-hidden", String(!current));
        slide.hidden = !available[index];
      });
      dots.forEach((dot, index) => {
        dot.setAttribute("aria-current", String(index === activeIndex));
        dot.hidden = !available[index];
      });
      updateToggle();
    };

    const nextAvailable = (direction) => {
      for (let offset = 1; offset <= slides.length; offset += 1) {
        const candidate =
          (activeIndex + direction * offset + slides.length) % slides.length;
        if (available[candidate]) return candidate;
      }
      return activeIndex;
    };

    const schedule = () => {
      stopTimer();
      if (!autoplayAllowed()) return;
      timer = window.setTimeout(() => {
        activeIndex = nextAvailable(1);
        render();
        schedule();
      }, AUTOPLAY_MS);
    };

    const show = (index) => {
      if (!available[index]) return;
      activeIndex = index;
      render();
      schedule();
    };

    const pauseFor = (reason) => {
      pausedBy.add(reason);
      stopTimer();
    };

    const resumeFrom = (reason) => {
      pausedBy.delete(reason);
      schedule();
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => show(index));
    });

    toggle?.addEventListener("click", () => {
      manualPause = !manualPause;
      render();
      schedule();
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      show(nextAvailable(event.key === "ArrowRight" ? 1 : -1));
    });

    carousel.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0]?.clientX ?? null;
      },
      { passive: true },
    );
    carousel.addEventListener(
      "touchend",
      (event) => {
        if (touchStartX === null) return;
        const endX = event.changedTouches[0]?.clientX ?? touchStartX;
        const delta = endX - touchStartX;
        touchStartX = null;
        if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
          show(nextAvailable(delta < 0 ? 1 : -1));
        }
      },
      { passive: true },
    );

    slides.forEach((slide, index) => {
      const image = slide.querySelector("img");
      image?.addEventListener("error", () => {
        available[index] = false;
        if (index === activeIndex) activeIndex = nextAvailable(1);
        render();
        schedule();
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pauseFor("hidden");
      else resumeFrom("hidden");
    });
    reducedMotion.addEventListener("change", () => {
      updateToggle();
      schedule();
    });
    desktopAutoplay.addEventListener("change", () => {
      updateToggle();
      schedule();
    });

    render();
    schedule();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
