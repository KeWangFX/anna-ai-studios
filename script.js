const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function initHeader() {
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-site-nav]");
  if (!header || !menuButton || !nav) return;

  const menuQuery = window.matchMedia("(max-width: 1120px)");
  const menuLabel = menuButton.querySelector(".sr-only");
  const pageRegions = [document.querySelector("main"), document.querySelector("footer")]
    .filter((region) => region instanceof HTMLElement);
  const isChinese = document.documentElement.lang.toLowerCase().startsWith("zh");
  const menuCopy = isChinese
    ? { open: "打开导航", close: "关闭导航" }
    : { open: "Open navigation", close: "Close navigation" };

  const setHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  const setMenuState = (open) => {
    const expanded = Boolean(open && menuQuery.matches);
    menuButton.setAttribute("aria-expanded", String(expanded));
    nav.classList.toggle("is-open", expanded);
    header.classList.toggle("is-open", expanded);
    document.body.classList.toggle("is-menu-open", expanded);
    pageRegions.forEach((region) => region.toggleAttribute("inert", expanded));
    nav.toggleAttribute("inert", menuQuery.matches && !expanded);
    if (menuQuery.matches && !expanded) {
      nav.setAttribute("aria-hidden", "true");
    } else {
      nav.removeAttribute("aria-hidden");
    }
    if (menuLabel) menuLabel.textContent = expanded ? menuCopy.close : menuCopy.open;
  };

  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    setMenuState(open);
  });

  nav.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    if (!(link instanceof HTMLAnchorElement)) return;

    const shouldMoveFocus = event.detail === 0 && link.hash;
    const focusTarget = shouldMoveFocus ? document.querySelector(link.hash) : null;
    setMenuState(false);

    if (focusTarget instanceof HTMLElement) {
      window.requestAnimationFrame(() => {
        const heading = focusTarget.matches("section")
          ? focusTarget.querySelector("h2, h3")
          : focusTarget;
        if (!(heading instanceof HTMLElement)) return;
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenuState(false);
      menuButton.focus();
    }
  });

  window.addEventListener("scroll", setHeaderState, { passive: true });
  window.addEventListener("resize", () => {
    if (!menuQuery.matches) setMenuState(false);
  });
  menuQuery.addEventListener?.("change", () => setMenuState(false));
  setMenuState(false);
  setHeaderState();
}

function initSectionNavigation() {
  const links = [...document.querySelectorAll('.site-nav a[href^="#"]:not(.mobile-project-link)')];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter((section) => section instanceof HTMLElement);
  if (!links.length || !sections.length || !("IntersectionObserver" in window)) return;

  const setCurrent = (id) => {
    links.forEach((link) => {
      if (link.getAttribute("href") === `#${id}`) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target.id) setCurrent(visible[0].target.id);
    },
    { rootMargin: "-24% 0px -64%", threshold: [0, 0.1, 0.35] }
  );

  sections.forEach((section) => observer.observe(section));
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

function initDeferredSignalJourney() {
  const section = document.querySelector("[data-signal-journey]");
  if (!section || reducedMotionQuery.matches || !("IntersectionObserver" in window)) return;

  const desktopSignalQuery = window.matchMedia("(min-width: 781px) and (min-height: 681px)");
  if (!desktopSignalQuery.matches) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      initSignalJourney();
    },
    { rootMargin: "500px 0px" }
  );

  observer.observe(section);
}

function initSignalJourney() {
  const section = document.querySelector("[data-signal-journey]");
  const canvas = section?.querySelector("[data-signal-canvas]");
  const visual = section?.querySelector(".signal-journey__visual");
  const steps = section ? [...section.querySelectorAll("[data-signal-step]")] : [];
  const stateElement = section?.querySelector("[data-signal-state]");
  const timeElement = section?.querySelector("[data-signal-time]");
  if (!section || !(canvas instanceof HTMLCanvasElement) || !visual) return;

  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!context) return;

  const isChinese = document.documentElement.lang.toLowerCase().startsWith("zh");
  const stateLabels = isChinese ? ["捕捉", "编排", "控制", "决策"] : ["CAPTURE", "STRUCTURE", "CONTROL", "DECIDE"];
  const thresholds = [0, 0.24, 0.52, 0.74];
  const staticLayoutQuery = window.matchMedia("(max-width: 780px), (max-height: 680px)");

  let progress = 0;
  let activeStep = -1;
  let sectionVisible = true;
  let drawFrame = 0;
  let failed = false;

  const mix = (from, to, amount) => from + (to - from) * amount;
  const smoothstep = (start, end, value) => {
    const normalized = clamp((value - start) / Math.max(0.0001, end - start));
    return normalized * normalized * (3 - 2 * normalized);
  };

  const usesStaticLayout = () => reducedMotionQuery.matches || staticLayoutQuery.matches;

  const setActiveStep = (index) => {
    if (index === activeStep) return;
    activeStep = index;
    steps.forEach((step, candidate) => step.classList.toggle("is-active", candidate === index));
    if (stateElement) stateElement.textContent = stateLabels[index] || stateLabels[0];
  };

  const updateProgress = () => {
    if (usesStaticLayout()) {
      // The static composition shows the final human-review state without requiring motion.
      progress = 0.82;
    } else {
      const rect = section.getBoundingClientRect();
      const scrollSpan = Math.max(1, section.offsetHeight - window.innerHeight);
      progress = clamp(-rect.top / scrollSpan);
    }

    let nextStep = 0;
    thresholds.forEach((threshold, index) => {
      if (progress >= threshold) nextStep = index;
    });
    setActiveStep(nextStep);
    if (timeElement) timeElement.textContent = `${(progress * 8).toFixed(1).padStart(4, "0")} / 08.0`;
  };

  const sizeCanvas = () => {
    // A capped DPR keeps the procedural line work sharp without multiplying scroll-time fill cost.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, visual.clientWidth);
    const height = Math.max(1, visual.clientHeight);
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  };

  const drawReviewRoom = (width, height, amount) => {
    if (amount <= 0.001) return;
    const left = width * 0.08;
    const top = height * 0.1;
    const roomWidth = width * 0.82;
    const roomHeight = height * 0.78;
    const vanishingX = width * 0.46;
    const vanishingY = height * 0.48;

    context.save();
    context.globalAlpha = amount;
    context.strokeStyle = "rgba(242, 239, 230, 0.24)";
    context.lineWidth = 1;
    context.strokeRect(left, top, roomWidth, roomHeight);

    for (let column = 0; column <= 6; column += 1) {
      const x = left + (roomWidth * column) / 6;
      context.beginPath();
      context.moveTo(vanishingX, vanishingY);
      context.lineTo(x, top + roomHeight);
      context.stroke();
    }

    for (let row = 1; row <= 5; row += 1) {
      const eased = (row / 5) ** 1.7;
      const y = mix(vanishingY, top + roomHeight, eased);
      context.beginPath();
      context.moveTo(left, y);
      context.lineTo(left + roomWidth, y);
      context.stroke();
    }

    context.strokeStyle = "rgba(105, 245, 212, 0.58)";
    context.strokeRect(width * 0.35, height * 0.31, width * 0.22, height * 0.2);
    context.strokeStyle = "rgba(240, 167, 95, 0.52)";
    context.strokeRect(width * 0.62, height * 0.22, width * 0.16, height * 0.12);
    context.restore();
  };

  const drawGrooves = (width, height) => {
    const roomReveal = smoothstep(0.72, 0.98, progress);
    const outerRadius = mix(Math.max(width, height) * 0.96, Math.min(width, height) * 0.42, roomReveal);
    const centerX = mix(width * 0.43, width * 0.44, roomReveal);
    const centerY = mix(height * 0.58, height * 0.52, roomReveal);
    const discGradient = context.createRadialGradient(centerX, centerY, outerRadius * 0.06, centerX, centerY, outerRadius);
    discGradient.addColorStop(0, "#151a17");
    discGradient.addColorStop(0.55, "#0a0d0b");
    discGradient.addColorStop(1, "#030504");

    context.save();
    context.fillStyle = discGradient;
    context.beginPath();
    context.arc(centerX, centerY, outerRadius * 1.03, 0, Math.PI * 2);
    context.fill();

    // Deterministic waveform displacement preserves topology while the scroll position changes scale.
    const grooveCount = 22;
    const sampleCount = 112;
    for (let groove = 0; groove < grooveCount; groove += 1) {
      const radius = outerRadius * (0.29 + groove * 0.033);
      const amplitude = Math.max(0.7, outerRadius * (0.0018 + (groove % 4) * 0.00034));
      context.beginPath();
      for (let sample = 0; sample <= sampleCount; sample += 1) {
        const angle = (sample / sampleCount) * Math.PI * 2;
        const waveform =
          Math.sin(angle * 5 + groove * 0.63) * 0.5 +
          Math.sin(angle * 13 - groove * 0.28) * 0.3 +
          Math.sin(angle * 29 + groove * 0.11) * 0.2;
        const displacedRadius = radius + waveform * amplitude;
        const x = centerX + Math.cos(angle) * displacedRadius;
        const y = centerY + Math.sin(angle) * displacedRadius;
        if (sample === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      const intensity = 0.12 + ((groove + 1) % 5) * 0.025;
      context.strokeStyle = `rgba(240, 167, 95, ${intensity})`;
      context.lineWidth = groove % 5 === 0 ? 1.35 : 0.75;
      context.stroke();
    }

    const signalRadius = outerRadius * mix(0.58, 0.23, smoothstep(0.18, 0.68, progress));
    const signalAngle = -2.5 + progress * Math.PI * 2.35;
    const signalX = centerX + Math.cos(signalAngle) * signalRadius;
    const signalY = centerY + Math.sin(signalAngle) * signalRadius;

    context.strokeStyle = "rgba(105, 245, 212, 0.74)";
    context.lineWidth = 1.8;
    context.beginPath();
    context.arc(centerX, centerY, signalRadius, signalAngle - 0.38, signalAngle + 0.03);
    context.stroke();

    const glow = context.createRadialGradient(signalX, signalY, 0, signalX, signalY, 30);
    glow.addColorStop(0, "rgba(105, 245, 212, 1)");
    glow.addColorStop(0.2, "rgba(105, 245, 212, 0.72)");
    glow.addColorStop(1, "rgba(105, 245, 212, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(signalX, signalY, 30, 0, Math.PI * 2);
    context.fill();

    const gateAmount = smoothstep(0.48, 0.6, progress) * (1 - smoothstep(0.73, 0.84, progress));
    if (gateAmount > 0.001) {
      context.globalAlpha = gateAmount;
      context.strokeStyle = "rgba(242, 239, 230, 0.78)";
      context.lineWidth = 1;
      context.strokeRect(signalX - 46, signalY - 34, 92, 68);
      context.beginPath();
      context.moveTo(signalX - 62, signalY);
      context.lineTo(signalX + 62, signalY);
      context.moveTo(signalX, signalY - 50);
      context.lineTo(signalX, signalY + 50);
      context.stroke();
      context.globalAlpha = 1;
    }

    const needleLift = smoothstep(0.78, 1, progress);
    const armX = width * 0.92;
    const armY = height * 0.08;
    const tipX = mix(signalX, width * 0.72, needleLift);
    const tipY = mix(signalY, height * 0.19, needleLift);
    context.strokeStyle = "rgba(242, 239, 230, 0.78)";
    context.lineWidth = Math.max(2, Math.min(width, height) * 0.004);
    context.beginPath();
    context.moveTo(armX, armY);
    context.lineTo(tipX, tipY);
    context.stroke();
    context.fillStyle = "#f0a75f";
    context.beginPath();
    context.arc(tipX, tipY, 5, 0, Math.PI * 2);
    context.fill();

    if (roomReveal > 0.5) {
      context.fillStyle = "rgba(3, 5, 4, 0.86)";
      context.beginPath();
      context.arc(centerX, centerY, outerRadius * 0.115, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(242, 239, 230, 0.44)";
      context.lineWidth = 1;
      context.stroke();
    }
    context.restore();
  };

  const draw = () => {
    drawFrame = 0;
    if (failed || !sectionVisible || document.hidden) return;
    try {
      updateProgress();
      const { width, height } = sizeCanvas();
      context.fillStyle = "#050706";
      context.fillRect(0, 0, width, height);
      drawReviewRoom(width, height, smoothstep(0.72, 0.98, progress));
      drawGrooves(width, height);
      section.classList.add("has-canvas");
    } catch {
      failed = true;
      section.classList.remove("has-canvas");
    }
  };

  const requestDraw = () => {
    if (drawFrame || failed) return;
    drawFrame = window.requestAnimationFrame(draw);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionVisible = entry.isIntersecting;
        if (sectionVisible) requestDraw();
      },
      { rootMargin: "120px" }
    );
    observer.observe(section);
  }

  window.addEventListener("scroll", requestDraw, { passive: true });
  window.addEventListener("resize", requestDraw);
  staticLayoutQuery.addEventListener?.("change", requestDraw);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) requestDraw();
  });
  updateProgress();
  requestDraw();
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

  const videoSources = [...video.querySelectorAll("source[data-src]")];
  const saveData = Boolean(navigator.connection?.saveData);
  const allowMotionMedia = !reducedMotionQuery.matches && !saveData;
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
  let videoActivated = false;

  const setActivePanel = (nextIndex) => {
    if (nextIndex === activePanel) return;
    activePanel = nextIndex;
    panels.forEach((panel, index) => {
      const active = index === nextIndex;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", String(!active));
    });
    steps.forEach((step, index) => step.classList.toggle("is-active", index <= nextIndex));
    if (labelElement) labelElement.textContent = nextIndex >= 0 ? labels[nextIndex] : isChinese ? "进入系统" : "System entry";
  };

  const activateVideo = () => {
    if (!allowMotionMedia || videoActivated) return;
    videoActivated = true;
    videoSources.forEach((source) => {
      const sourceUrl = source.dataset.src;
      if (sourceUrl) source.src = sourceUrl;
    });
    video.preload = "auto";
    video.load();
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
    if (intro) {
      const introHidden = currentProgress > 0.025;
      intro.setAttribute("aria-hidden", String(introHidden));
      intro.toggleAttribute("inert", introHidden);
    }
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
    mediaFrame = 0;
    if (!allowMotionMedia || !sectionVisible) return;

    if (allowMotionMedia && sectionVisible && video.readyState >= 2) {
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

  const startMediaLoop = () => {
    if (!allowMotionMedia || !sectionVisible || mediaFrame) return;
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

  if (allowMotionMedia && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        sectionVisible = entry.isIntersecting;
        if (sectionVisible) {
          activateVideo();
          startMediaLoop();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(journey);
  } else if (allowMotionMedia) {
    activateVideo();
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  document.addEventListener("visibilitychange", () => {
    sectionVisible = !document.hidden && journey.getBoundingClientRect().bottom > 0 && journey.getBoundingClientRect().top < window.innerHeight;
    startMediaLoop();
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
    if (intro) {
      intro.style.opacity = "1";
      intro.setAttribute("aria-hidden", "false");
      intro.removeAttribute("inert");
    }
    panels.forEach((panel) => {
      panel.classList.remove("is-active");
      panel.setAttribute("aria-hidden", "true");
    });
    return;
  }

  updateScrollState();
  startMediaLoop();
}

function createLeadId(date) {
  const timestamp = date.toISOString().replace(/\D/g, "").slice(0, 14);
  const bytes = new Uint8Array(2);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    // The timestamp still keeps the reference sortable; this fallback only supports older browsers.
    bytes[0] = Math.floor(Math.random() * 256);
    bytes[1] = Math.floor(Math.random() * 256);
  }
  const suffix = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `ANNA-${timestamp}-${suffix}`;
}

function sanitizeSubjectPart(value, fallback, maxLength) {
  const normalized = String(value || "")
    .replace(/[\r\n<>\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return normalized || fallback;
}

function initServiceSelection() {
  const form = document.querySelector("[data-contact-form]");
  const serviceSelect = form?.querySelector('select[name="service_code"]');
  const links = [...document.querySelectorAll("[data-service-select]")];
  if (!(serviceSelect instanceof HTMLSelectElement) || !links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const serviceCode = link.dataset.serviceSelect || "";
      const optionExists = [...serviceSelect.options].some((option) => option.value === serviceCode);
      if (!optionExists) return;

      serviceSelect.value = serviceCode;
      serviceSelect.removeAttribute("aria-invalid");
      serviceSelect.closest("[data-form-field]")?.querySelector("[data-field-error]")?.replaceChildren();
      serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

function initContactForms() {
  const forms = [...document.querySelectorAll("[data-contact-form]")];
  if (!forms.length) return;

  const copy = {
    EN: {
      required: "This field is required.",
      email: "Enter a valid email address.",
      tooShort: "Add a little more detail before sending.",
      summary: "Check the highlighted fields, then send again.",
      pending: "Opening secure verification…",
    },
    ZH: {
      required: "此项为必填。",
      email: "请输入有效的邮箱地址。",
      tooShort: "请补充更多信息后再发送。",
      summary: "请检查标记的字段，然后重新发送。",
      pending: "正在打开安全验证…",
    },
  };

  forms.forEach((form) => {
    const language = form.dataset.language === "ZH" ? "ZH" : "EN";
    const messages = copy[language];
    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector("[data-submit-button]");
    const submitLabel = form.querySelector("[data-submit-label]");
    const defaultSubmitLabel = submitLabel?.textContent || "Submit";
    const controls = [...form.querySelectorAll("[data-form-field] input, [data-form-field] select, [data-form-field] textarea")];

    const errorFor = (control) => {
      if (control.validity.valueMissing) return messages.required;
      if (control.validity.typeMismatch) return messages.email;
      if (control.validity.tooShort) return messages.tooShort;
      return "";
    };

    const validateControl = (control) => {
      const wrapper = control.closest("[data-form-field]");
      const error = wrapper?.querySelector("[data-field-error]");
      const message = errorFor(control);
      if (message) {
        control.setAttribute("aria-invalid", "true");
      } else {
        control.removeAttribute("aria-invalid");
      }
      if (error) error.textContent = message;
      return !message;
    };

    controls.forEach((control) => {
      control.addEventListener("blur", () => validateControl(control));
      control.addEventListener("change", () => validateControl(control));
      control.addEventListener("input", () => {
        if (control.getAttribute("aria-invalid") === "true") validateControl(control);
      });
    });

    const resetSubmitState = () => {
      form.classList.remove("is-submitting");
      form.removeAttribute("aria-busy");
      if (submitButton) submitButton.disabled = false;
      if (submitLabel) submitLabel.textContent = defaultSubmitLabel;
    };

    form.addEventListener("submit", (event) => {
      let firstInvalid = null;
      controls.forEach((control) => {
        if (!validateControl(control) && !firstInvalid) firstInvalid = control;
      });
      if (firstInvalid) {
        event.preventDefault();
        if (status) {
          status.textContent = messages.summary;
          status.classList.add("is-error");
        }
        firstInvalid.focus();
        return;
      }

      const honeypot = form.querySelector('input[name="_honey"]');
      if (honeypot?.value) {
        // Silently stop scripted submissions without disclosing the trap.
        event.preventDefault();
        form.reset();
        return;
      }

      const now = new Date();
      const leadId = createLeadId(now);
      const service = sanitizeSubjectPart(form.elements.service_code?.value, "OTHER", 28);
      const company = sanitizeSubjectPart(form.elements.company?.value, "Independent", 36);
      const name = sanitizeSubjectPart(form.elements.name?.value, "Contact", 28);
      const date = now.toISOString().slice(0, 10).replace(/-/g, "");
      const subject = `[ANNA-LEAD][${service}][${language}][${date}] ${company} / ${name}`;

      form.querySelector("[data-subject-field]").value = subject;
      form.querySelector("[data-replyto-field]").value = form.elements.email.value;
      form.querySelector("[data-lead-id-field]").value = leadId;
      form.querySelector("[data-submitted-at-field]").value = now.toISOString();
      form.querySelector("[data-source-field]").value = window.location.href;

      const successUrl = new URL(form.dataset.successUrl, window.location.href);
      successUrl.searchParams.set("ref", leadId);
      form.querySelector("[data-next-field]").value = successUrl.href;

      if (status) {
        status.textContent = messages.pending;
        status.classList.remove("is-error");
      }
      form.classList.add("is-submitting");
      form.setAttribute("aria-busy", "true");
      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = messages.pending;
    });

    // Back-forward cache can restore a disabled submit button after returning from verification.
    window.addEventListener("pageshow", resetSubmitState);
  });
}

function initLeadReference() {
  const reference = document.querySelector("[data-lead-reference]");
  if (!reference) return;
  const leadId = new URLSearchParams(window.location.search).get("ref") || "";
  if (!/^ANNA-\d{14}-[A-F0-9]{4}$/.test(leadId)) {
    reference.closest(".lead-reference")?.setAttribute("hidden", "");
    return;
  }
  // textContent prevents a query-string value from ever becoming executable markup.
  reference.textContent = leadId;
}

function initOptionalShader() {
  const desktopQuery = window.matchMedia("(min-width: 781px) and (min-height: 681px)");
  const saveData = Boolean(navigator.connection?.saveData);
  let requested = false;

  const requestShader = () => {
    if (requested || reducedMotionQuery.matches || saveData || !desktopQuery.matches) return;
    requested = true;

    const load = () => {
      import("./shader-background.js?v=20260723c").catch(() => {
        document.querySelector("[data-journey]")?.classList.add("is-webgl-unavailable");
      });
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(load, { timeout: 1400 });
    } else {
      window.setTimeout(load, 120);
    }
  };

  requestShader();
  desktopQuery.addEventListener?.("change", requestShader);
}

function init() {
  document.documentElement.classList.add("has-js");
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
  initHeader();
  initSectionNavigation();
  initReveal();
  initDeliveryProgress();
  initDeferredSignalJourney();
  initJourney();
  initOptionalShader();
  initServiceSelection();
  initContactForms();
  initLeadReference();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
