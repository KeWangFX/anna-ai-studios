const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function initHeader() {
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-site-nav]");
  if (!header || !menuButton || !nav) return;

  const setHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    header.classList.remove("is-open");
  };

  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    header.classList.toggle("is-open", open);
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      menuButton.focus();
    }
  });

  window.addEventListener("scroll", setHeaderState, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1120) closeMenu();
  });
  setHeaderState();
}

function initReveal() {
  const elements = [...document.querySelectorAll(".reveal")];
  if (!elements.length) return;

  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  // One observer avoids per-card scroll handlers and keeps the main thread free for video seeking.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.12 }
  );

  elements.forEach((element) => observer.observe(element));
}

function initDeliveryProgress() {
  const track = document.querySelector(".delivery-track");
  if (!track || reducedMotionQuery.matches) return;

  let frameRequested = false;
  const update = () => {
    frameRequested = false;
    const rect = track.getBoundingClientRect();
    const distance = window.innerHeight + rect.height;
    const progress = clamp((window.innerHeight - rect.top) / distance);
    track.style.setProperty("--delivery-progress", progress.toFixed(4));
  };

  const requestUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  requestUpdate();
}

function initJourney() {
  const journey = document.querySelector("[data-journey]");
  const video = document.querySelector("[data-journey-video]");
  const intro = document.querySelector("[data-journey-intro]");
  const panels = [...document.querySelectorAll("[data-journey-panel]")];
  const steps = [...document.querySelectorAll("[data-journey-step]")];
  const progressElement = document.querySelector("[data-journey-progress]");
  const labelElement = document.querySelector("[data-journey-label]");
  const timeElement = document.querySelector("[data-journey-time]");
  if (!journey || !video || !progressElement) return;

  const isChinese = document.documentElement.lang.toLowerCase().startsWith("zh");
  const labels = isChinese
    ? ["晶体管 / 发现", "铜互连 / 构建", "硅层 / 部署", "晶圆 / 扩展"]
    : ["Transistor / Discover", "Interconnect / Build", "Silicon / Deploy", "Wafer / Scale"];
  const thresholds = panels.map((panel) => Number(panel.dataset.start || 0));

  let duration = 8;
  let targetTime = 0;
  let renderedTime = -1;
  let currentProgress = 0;
  let activePanel = -1;
  let scrollFrameRequested = false;
  let mediaFrame = 0;
  let sectionVisible = true;

  const setActivePanel = (nextIndex) => {
    if (nextIndex === activePanel) return;
    activePanel = nextIndex;
    panels.forEach((panel, index) => panel.classList.toggle("is-active", index === nextIndex));
    steps.forEach((step, index) => step.classList.toggle("is-active", index <= nextIndex));
    if (labelElement) labelElement.textContent = nextIndex >= 0 ? labels[nextIndex] : isChinese ? "进入系统" : "System entry";
  };

  const findPanel = (progress) => {
    let index = -1;
    thresholds.forEach((threshold, candidate) => {
      if (progress >= threshold) index = candidate;
    });
    return index;
  };

  const updateScrollState = () => {
    scrollFrameRequested = false;
    const rect = journey.getBoundingClientRect();
    const scrollSpan = Math.max(1, journey.offsetHeight - window.innerHeight);
    currentProgress = clamp(-rect.top / scrollSpan);
    targetTime = currentProgress * duration;

    journey.style.setProperty("--journey-progress", currentProgress.toFixed(4));
    journey.classList.toggle("has-progress", currentProgress > 0.025);
    progressElement.setAttribute("aria-valuenow", String(Math.round(currentProgress * 100)));
    if (timeElement) timeElement.textContent = `${targetTime.toFixed(1).padStart(4, "0")} / 08.0`;
    setActivePanel(findPanel(currentProgress));

    window.dispatchEvent(
      new CustomEvent("anna:journey-progress", { detail: { progress: currentProgress } })
    );
  };

  const requestScrollUpdate = () => {
    if (scrollFrameRequested) return;
    scrollFrameRequested = true;
    window.requestAnimationFrame(updateScrollState);
  };

  const renderMedia = () => {
    if (!reducedMotionQuery.matches && sectionVisible && video.readyState >= 2) {
      // Seek only when the delta is visually meaningful; this prevents decode queues building up on fast scroll.
      if (!video.seeking && Math.abs(targetTime - renderedTime) > 0.035) {
        const safeTime = Math.min(Math.max(0, targetTime), Math.max(0, duration - 0.02));
        try {
          video.currentTime = safeTime;
          renderedTime = safeTime;
        } catch {
          journey.classList.add("is-video-unavailable");
        }
      }
    }
    mediaFrame = window.requestAnimationFrame(renderMedia);
  };

  video.addEventListener("loadedmetadata", () => {
    duration = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(8, video.duration) : 8;
    video.pause();
    updateScrollState();
  });

  const showFirstDecodedFrame = () => {
    journey.classList.add("is-video-ready");
  };

  video.addEventListener("loadeddata", () => {
    if ("requestVideoFrameCallback" in video) {
      video.requestVideoFrameCallback(showFirstDecodedFrame);
    } else {
      showFirstDecodedFrame();
    }
  });

  video.addEventListener("error", () => {
    journey.classList.remove("is-video-ready");
    journey.classList.add("is-video-unavailable");
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionVisible = entry.isIntersecting;
        if (sectionVisible && video.preload !== "auto") {
          video.preload = "auto";
          video.load();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(journey);
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  document.addEventListener("visibilitychange", () => {
    sectionVisible = !document.hidden && journey.getBoundingClientRect().bottom > 0 && journey.getBoundingClientRect().top < window.innerHeight;
  });

  reducedMotionQuery.addEventListener?.("change", () => window.location.reload());
  window.addEventListener(
    "pagehide",
    () => {
      window.cancelAnimationFrame(mediaFrame);
    },
    { once: true }
  );

  if (reducedMotionQuery.matches) {
    if (intro) intro.style.opacity = "1";
    panels.forEach((panel) => panel.classList.remove("is-active"));
    return;
  }

  updateScrollState();
  mediaFrame = window.requestAnimationFrame(renderMedia);
}

function init() {
  document.documentElement.classList.add("has-js");
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
  initHeader();
  initReveal();
  initDeliveryProgress();
  initJourney();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
