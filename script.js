/*
  ■ script.js ガイド

  【定数】
    TICKET_URL           … チケットリンク先。変更するとページ内の全 .js-ticket-link に反映。
    SHARE_TEXT            … Xシェア時の投稿テキスト。
    CHECKLIST_NAV_DELAY_MS … チェックリストCTAのチェックアニメーション後の遷移遅延（現在380ms）。
    ANOMALY_FADE_MS      … anomalyのfadingクラス除去までの時間（現在500ms）。

  【主な機能と実行順】
    1. チケットリンク自動置換（.js-ticket-link の href を TICKET_URL に）
    2. チェックリストCTAアニメーション（.cta-button--checklist クリック → チェック → 遷移）
    3. Xシェアリンク生成（.js-x-share の href を SHARE_TEXT から生成）
    4. href="#" リンクの preventDefault
    5. ヘッダー表示制御（スクロール18px以上 → page-has-scrolled / is-scrolled）
    6. 固定CTA表示（[data-intro-cta] を通過したら show-fixed-cta）
    7. ハンバーガーメニュー開閉（Escキーでも閉じる）
    8. スクロールReveal（.reveal → .is-visible、一度だけ、unobserve）
    9. KVチェックリスト（3つ全チェック → フリッカー → 目の動画再生5.3秒 → 戻しフリッカー → 3つ目だけ外す）
       モバイル時は kv-mobile-cat-1/2.mp4 からランダム選択
   10. Anomalyスポットライト（後述）

  【Anomaly スポットライトシステム】

    ＜通常のanomaly＞
      [data-anomaly] を付けた要素が自動で監視対象になる。
      ただし [data-anomaly-sequence] の子要素は除外される。

      仕組み：
      - IntersectionObserver + scroll/resize イベントで syncAnomalySpotlight() を呼ぶ
      - getVisibleAnomalyTargets() で検知バンド内（bandTop〜bandBottom）の要素を取得
      - 複数ある場合は画面中央（x,y）に最も近い要素が優先（Math.hypotで距離計算）
      - activateAnomaly() で is-anomaly-active を付与、前のは deactivateAnomaly() でフェード
      - フェードタイマーは WeakMap で要素ごとに管理。再アクティブ時にキャンセルしてちらつき防止

    ＜シーケンスanomaly＞
      親要素に data-anomaly-sequence を付けると、その中の [data-anomaly] は
      時間差で順番に光る連続演出になる。
      - 親が画面に入ると advanceSequence() が開始（1.4秒間隔）
      - 前の要素は is-anomaly-fading に、次の要素が is-anomaly-active に
      - 親が画面外に出ると clearSequence() で全リセット

    ＜検知範囲の調整＞
      getVisibleAnomalyTargets() 内：
        bandTop  = viewportHeight * 0.3  ← 検知バンドの上端（画面の30%位置）
        bandBottom = viewportHeight * 0.7 ← 検知バンドの下端（画面の70%位置）
      anomalyObserver: rootMargin "-30% 0px -30% 0px", threshold [0, 0.25, 0.5, 0.75, 1]
      sequenceObserver: threshold 0.45

    ＜速度の調整＞
      光る速度   → styles.css .anomaly-text の transition（現在0.2s）
      消える速度 → styles.css .anomaly-text.is-anomaly-fading の transition（現在0.5s）
      フェードクラス除去 → ANOMALY_FADE_MS 定数（現在500ms、CSSと合わせる）
      シーケンス間隔     → advanceSequence 内 setTimeout（現在1400ms）
*/

const TICKET_URL = "https://l-tike.com/twilight.co.jp/cleaning/";
const SHARE_TEXT = `╋━━━━━━━━━━━━━━━━━━━━━━━╋
　どこか奇妙な職業体験　（ @yugure_cleaning ）
╋━━━━━━━━━━━━━━━━━━━━━━━╋

#奇妙な職業体験`;

document.querySelectorAll(".js-ticket-link").forEach((link) => {
  link.href = TICKET_URL;
});

const CHECKLIST_NAV_DELAY_MS = 380;

document.querySelectorAll(".cta-button--checklist").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (link.classList.contains("is-checking")) {
      return;
    }

    const checkBox = link.querySelector(".cta-checklist-box");
    const destination = link.href || TICKET_URL;

    link.classList.add("is-checking");
    checkBox?.classList.add("is-checked");

    const navDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : CHECKLIST_NAV_DELAY_MS;

    window.setTimeout(() => {
      window.location.assign(destination);
    }, navDelay);
  });
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
// One element glows at a time. Fades out when it leaves the spotlight band.
const anomalyTargets = [...document.querySelectorAll("[data-anomaly]")].filter(
  (target) => !target.closest("[data-anomaly-sequence]"),
);
let currentAnomaly = null;
const ANOMALY_FADE_MS = 500;
const anomalyFadeTimers = new WeakMap();

function deactivateAnomaly(target) {
  const existingTimer = anomalyFadeTimers.get(target);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  target.classList.remove("is-anomaly-active");
  target.classList.add("is-anomaly-fading");

  const timer = window.setTimeout(() => {
    target.classList.remove("is-anomaly-fading");
    anomalyFadeTimers.delete(target);
  }, ANOMALY_FADE_MS);
  anomalyFadeTimers.set(target, timer);
}

function activateAnomaly(target) {
  if (currentAnomaly === target) {
    return;
  }

  if (currentAnomaly) {
    deactivateAnomaly(currentAnomaly);
  }

  // Cancel pending fade if this element was fading
  const existingTimer = anomalyFadeTimers.get(target);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
    anomalyFadeTimers.delete(target);
  }

  target.classList.remove("is-anomaly-fading");
  target.classList.add("is-anomaly-active");
  currentAnomaly = target;
}

function getAnomalyCenter(target) {
  const rect = target.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getVisibleAnomalyTargets() {
  const viewportHeight = window.innerHeight;
  // anomalyObserver の rootMargin (-30%/-30%) と同じく、画面中央付近だけを対象にする
  const bandTop = viewportHeight * 0.3;
  const bandBottom = viewportHeight * 0.7;

  return anomalyTargets.filter((target) => {
    const { y } = getAnomalyCenter(target);
    const rect = target.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < viewportHeight && y >= bandTop && y <= bandBottom;
  });
}

function syncAnomalySpotlight() {
  const visibleTargets = getVisibleAnomalyTargets();

  if (visibleTargets.length === 0) {
    if (currentAnomaly) {
      deactivateAnomaly(currentAnomaly);
      currentAnomaly = null;
    }
    return;
  }

  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;

  const nextTarget = visibleTargets.reduce((closest, target) => {
    const center = getAnomalyCenter(target);
    const closestCenter = getAnomalyCenter(closest);
    const distance = Math.hypot(center.x - viewportCenterX, center.y - viewportCenterY);
    const closestDistance = Math.hypot(
      closestCenter.x - viewportCenterX,
      closestCenter.y - viewportCenterY,
    );
    return distance < closestDistance ? target : closest;
  });

  activateAnomaly(nextTarget);
}

if ("IntersectionObserver" in window && anomalyTargets.length > 0) {
  const anomalyObserver = new IntersectionObserver(() => {
    syncAnomalySpotlight();
  }, { rootMargin: "-30% 0px -30% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });

  anomalyTargets.forEach((target) => anomalyObserver.observe(target));
  window.addEventListener("scroll", syncAnomalySpotlight, { passive: true });
  window.addEventListener("resize", syncAnomalySpotlight);
  syncAnomalySpotlight();
}

const anomalySequenceRoot = document.querySelector("[data-anomaly-sequence]");

if (anomalySequenceRoot && "IntersectionObserver" in window) {
  const anomalySequenceSteps = [...anomalySequenceRoot.querySelectorAll("[data-anomaly]")];
  let sequenceTimer = null;
  let sequenceStep = 0;

  const clearSequence = () => {
    if (sequenceTimer) {
      window.clearTimeout(sequenceTimer);
      sequenceTimer = null;
    }
    anomalySequenceSteps.forEach((step) => {
      step.classList.remove("is-anomaly-active", "is-anomaly-fading");
    });
    sequenceStep = 0;
  };

  const advanceSequence = () => {
    if (sequenceStep > 0) {
      const previous = anomalySequenceSteps[sequenceStep - 1];
      previous.classList.remove("is-anomaly-active");
      previous.classList.add("is-anomaly-fading");
    }

    if (sequenceStep >= anomalySequenceSteps.length) {
      sequenceTimer = null;
      return;
    }

    const current = anomalySequenceSteps[sequenceStep];
    current.classList.remove("is-anomaly-fading");
    current.classList.add("is-anomaly-active");
    sequenceStep += 1;
    sequenceTimer = window.setTimeout(advanceSequence, 1400);
  };

  const sequenceObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        clearSequence();
        advanceSequence();
        return;
      }
      clearSequence();
    },
    { threshold: 0.45 },
  );

  sequenceObserver.observe(anomalySequenceRoot);
}
