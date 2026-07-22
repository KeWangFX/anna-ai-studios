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

function init() {
  document.documentElement.classList.add("has-js");
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
  initHeader();
  initReveal();
  initDeliveryProgress();
  initJourney();
  initContactForms();
  initLeadReference();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
