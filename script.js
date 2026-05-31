const TICKET_URL = "https://l-tike.com/twilight.co.jp/cleaning/";
const SHARE_TEXT = `╋━━━━━━━━━━━━━━━━━━━━━━━╋
　どこか奇妙な職業体験　（ @yugure_cleaning ）
╋━━━━━━━━━━━━━━━━━━━━━━━╋

#奇妙な職業体験`;

document.querySelectorAll(".js-ticket-link").forEach((link) => {
  link.href = TICKET_URL;
});

document.querySelectorAll(".js-x-share").forEach((link) => {
  link.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}`;
});

document.querySelectorAll('a[href="#"]').forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const globalNav = document.querySelector(".global-nav");

function updateHeader() {
  const hasScrolled = window.scrollY > 18;
  document.body.classList.toggle("page-has-scrolled", hasScrolled);
  header?.classList.toggle("is-scrolled", hasScrolled);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const introCta = document.querySelector("[data-intro-cta]");

function updateFixedCta() {
  if (!introCta) {
    return;
  }

  const passedIntroCta = introCta.getBoundingClientRect().bottom < 0;
  document.body.classList.toggle("show-fixed-cta", passedIntroCta);
}

if (introCta) {
  if ("IntersectionObserver" in window) {
    const fixedCtaObserver = new IntersectionObserver(
      ([entry]) => {
        const passedIntroCta = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        document.body.classList.toggle("show-fixed-cta", passedIntroCta);
      },
      { threshold: 0 },
    );

    fixedCtaObserver.observe(introCta);
  }

  window.addEventListener("scroll", updateFixedCta, { passive: true });
  updateFixedCta();
}

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  globalNav?.classList.toggle("is-open", !isOpen);
});

globalNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    globalNav.classList.remove("is-open");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    menuToggle?.setAttribute("aria-expanded", "false");
    globalNav?.classList.remove("is-open");
  }
});

const revealTargets = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

const kvChecklist = document.querySelector("[data-kv-checklist]");
const kvButtons = kvChecklist?.querySelectorAll(".kv-check") ?? [];
const heroArt = document.querySelector(".hero-art");
const heroVideo = document.querySelector("[data-hero-video]");
const heroMobileVideo = document.querySelector("[data-hero-video-mobile]");
const mobileHeroVideos = ["assets/kv-mobile-cat-1.mp4", "assets/kv-mobile-cat-2.mp4"];
const kvCheckedItems = new Set();
let heroVideoPlaying = false;
let heroVideoReturning = false;
let heroVideoTimer = null;

function isMobileHero() {
  return window.matchMedia("(max-width: 759px)").matches;
}

function getActiveHeroVideo() {
  return isMobileHero() ? heroMobileVideo : heroVideo;
}

function setRandomMobileHeroVideo() {
  if (!heroMobileVideo) return;

  const nextVideo = mobileHeroVideos[Math.floor(Math.random() * mobileHeroVideos.length)];
  if (!heroMobileVideo.src.endsWith(nextVideo)) {
    heroMobileVideo.src = nextVideo;
    heroMobileVideo.load();
  }
}

function renderKvChecklist() {
  kvButtons.forEach((button) => {
    const itemId = button.dataset.kvItem;
    const isChecked = kvCheckedItems.has(itemId);
    button.classList.toggle("is-checked", isChecked);
    button.setAttribute("aria-pressed", String(isChecked));
  });
}

function finishHeroVideo() {
  if (!heroVideoPlaying || heroVideoReturning) return;

  heroVideoReturning = true;

  if (heroVideoTimer) {
    window.clearTimeout(heroVideoTimer);
    heroVideoTimer = null;
  }

  heroArt?.classList.add("is-return-flicker");

  window.setTimeout(() => {
    heroVideoPlaying = false;
    heroVideoReturning = false;
    heroArt?.classList.remove("is-video-swapped", "is-return-flicker");

    [heroVideo, heroMobileVideo].forEach((video) => {
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    });

    const thirdButton = kvChecklist?.querySelector('[data-kv-item="2"]');
    kvCheckedItems.delete("2");
    renderKvChecklist();

    thirdButton?.classList.add("is-unchecked-attention");
    window.setTimeout(() => {
      thirdButton?.classList.remove("is-unchecked-attention");
    }, 1100);
  }, 950);
}

function triggerHeroVideo() {
  if (heroVideoPlaying) return;

  heroVideoPlaying = true;
  heroVideoReturning = false;
  heroArt?.classList.add("is-flicker-before");

  window.setTimeout(() => {
    heroArt?.classList.remove("is-flicker-before");
    heroArt?.classList.add("is-video-swapped");

    if (isMobileHero()) {
      setRandomMobileHeroVideo();
    }

    const activeHeroVideo = getActiveHeroVideo();
    if (activeHeroVideo) {
      activeHeroVideo.currentTime = 0;
      activeHeroVideo.play().catch(() => undefined);
    }

    heroVideoTimer = window.setTimeout(finishHeroVideo, 5300);
  }, 950);
}

function handleKvChecklistClick(event) {
  const button = event.currentTarget;
  const itemId = button.dataset.kvItem;
  if (!itemId || heroVideoPlaying || heroVideoReturning) return;

  if (kvCheckedItems.has(itemId)) {
    kvCheckedItems.delete(itemId);
  } else {
    kvCheckedItems.add(itemId);
  }

  renderKvChecklist();

  const initialItemsDone = ["0", "1", "2"].every((item) => kvCheckedItems.has(item));
  if (initialItemsDone) {
    triggerHeroVideo();
  }
}

kvButtons.forEach((button) => {
  button.addEventListener("click", handleKvChecklistClick);
});

[heroVideo, heroMobileVideo].forEach((video) => {
  video?.addEventListener("ended", finishHeroVideo);
});
renderKvChecklist();

// ── Anomaly Spotlight System ──
// One element glows at a time. When the next enters, the previous fades out.
const anomalyTargets = document.querySelectorAll("[data-anomaly]");
let currentAnomaly = null;

if ("IntersectionObserver" in window && anomalyTargets.length > 0) {
  const anomalyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const target = entry.target;
        if (target === currentAnomaly) return;

        // Fade out previous
        if (currentAnomaly) {
          currentAnomaly.classList.remove("is-anomaly-active");
          currentAnomaly.classList.add("is-anomaly-fading");
        }

        // Activate new
        target.classList.remove("is-anomaly-fading");
        target.classList.add("is-anomaly-active");
        currentAnomaly = target;
      });
    },
    { rootMargin: "-30% 0px -30% 0px", threshold: 0.5 },
  );

  anomalyTargets.forEach((target) => anomalyObserver.observe(target));
}
