const slides = [
  {
    id: "img-9BA9",
    src: "./IMAGES/9BA9023CE6095B6D647045BC8FA18079.jpg",
    alt: "我的照片 1",
    caption: "一些值得反复翻看的瞬间",
    bg1: "rgba(255, 182, 193, .20)",
    bg2: "rgba(239, 220, 182, .20)",
  },
  {
    id: "img-67FA",
    src: "./IMAGES/67FA209F7B0BEF068893CE80357CF98C.jpg",
    alt: "我的照片 2",
    caption: "那一天，光刚刚好",
    bg1: "rgba(152, 221, 202, .20)",
    bg2: "rgba(255, 182, 193, .14)",
  },
  {
    id: "img-4970",
    src: "./IMAGES/4970B334B7046770F7A12BD89C1F2B7D.jpg",
    alt: "我的照片 3",
    caption: "在路上，心也在路上",
    bg1: "rgba(239, 220, 182, .22)",
    bg2: "rgba(152, 221, 202, .16)",
  },
  {
    id: "img-20220513",
    src: "./IMAGES/IMG_20220513_183351.jpg",
    alt: "2022-05-13 的一刻",
    caption: "2022.05.13 傍晚的记忆",
    bg1: "rgba(255, 182, 193, .16)",
    bg2: "rgba(46, 46, 46, .08)",
  },
  {
    id: "img-20220603",
    src: "./IMAGES/IMG_20220603_130437.jpg",
    alt: "2022-06-03 的一刻",
    caption: "2022.06.03 午后的日常",
    bg1: "rgba(239, 220, 182, .22)",
    bg2: "rgba(152, 221, 202, .16)",
  },
  {
    id: "img-20220605",
    src: "./IMAGES/IMG_20220605_181308.jpg",
    alt: "2022-06-05 的一刻",
    caption: "2022.06.05 傍晚的小情绪",
    bg1: "rgba(152, 221, 202, .20)",
    bg2: "rgba(255, 182, 193, .14)",
  },
];

const moods = [
  "今天想喝咖啡",
  "刚看完一本好书",
  "想去海边走走",
  "在整理照片小宇宙",
  "最近迷上薄荷绿",
];

const AUTOPLAY_MS = 4000;
const TRANSITION_MS = 520;

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isInteractive(el) {
  if (!el) return false;
  return Boolean(el.closest("a, button, input, textarea, select, [role='button']"));
}

function safeScrollToHash(hash) {
  const id = (hash || "").replace("#", "");
  const el = id ? document.getElementById(id) : null;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setupNav() {
  const toggle = qs(".nav-toggle");
  const nav = qs(".nav");
  if (!toggle || !nav) return;

  const logo = qs(".logo[data-action='reload']");
  if (logo) {
    logo.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(() => location.reload(), 120);
    });
  }

  const setOpen = (open) => {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => {
    const open = !document.body.classList.contains("menu-open");
    setOpen(open);
  });

  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("menu-open")) return;
    if (toggle.contains(e.target) || nav.contains(e.target)) return;
    setOpen(false);
  });

  qsa(".nav-link").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });
}

function setupMood() {
  const el = qs(".mood-text");
  if (!el) return;
  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % moods.length;
    el.textContent = moods[idx];
  }, 5200);
}

function loadLikes() {
  try {
    const raw = localStorage.getItem("likes:v1");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // ignore
  }
  return {};
}

function saveLikes(map) {
  try {
    localStorage.setItem("likes:v1", JSON.stringify(map));
  } catch {
    // ignore
  }
}

function setupCarousel() {
  const shell = qs(".carousel-shell");
  const card = qs(".carousel-card");
  const imgCur = qs(".slide-img-current");
  const imgNext = qs(".slide-img-next");
  const caption = qs(".caption-text");
  const prevBtn = qs(".arrow-left");
  const nextBtn = qs(".arrow-right");
  const dotsWrap = qs(".dots");
  const likeBtn = qs(".like");
  const likeCount = qs(".like-count");

  if (!shell || !card || !imgCur || !imgNext || !caption || !prevBtn || !nextBtn || !dotsWrap) return;

  let index = 0;
  let timer = null;
  let paused = false;
  let transitioning = false;

  const likes = loadLikes();

  const setBg = (s) => {
    shell.style.setProperty("--bg1", s.bg1);
    shell.style.setProperty("--bg2", s.bg2);
  };

  const setLikeUI = () => {
    const slide = slides[index];
    const count = Number(likes[slide.id] || 0);
    if (likeCount) likeCount.textContent = String(count);
    if (likeBtn) likeBtn.setAttribute("aria-label", `点赞：${slide.caption}`);
  };

  const setDots = () => {
    qsa(".dot", dotsWrap).forEach((b, i) => {
      b.setAttribute("aria-selected", String(i === index));
      b.tabIndex = i === index ? 0 : -1;
    });
  };

  const renderDots = () => {
    dotsWrap.innerHTML = "";
    slides.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `跳转到：${s.caption}`);
      b.setAttribute("aria-selected", String(i === index));
      b.tabIndex = i === index ? 0 : -1;
      b.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(b);
    });
  };

  const applySlideToCurrent = (s) => {
    imgCur.src = s.src;
    imgCur.alt = s.alt;
    caption.textContent = s.caption;
    setBg(s);
    setLikeUI();
    setDots();
  };

  const goTo = (nextIndex, dir = 1) => {
    if (transitioning) return;
    const newIndex = clamp(nextIndex, 0, slides.length - 1);
    if (newIndex === index) return;

    transitioning = true;
    shell.classList.add("is-transitioning");

    const nextSlide = slides[newIndex];
    imgNext.src = nextSlide.src;
    imgNext.alt = nextSlide.alt;
    caption.textContent = nextSlide.caption;
    setBg(nextSlide);

    index = newIndex;
    setDots();
    setLikeUI();

    window.setTimeout(() => {
      imgCur.src = imgNext.src;
      imgCur.alt = imgNext.alt;
      shell.classList.remove("is-transitioning");
      transitioning = false;
    }, TRANSITION_MS + 30);
  };

  const next = () => goTo((index + 1) % slides.length, 1);
  const prev = () => goTo((index - 1 + slides.length) % slides.length, -1);

  const start = () => {
    stop();
    timer = window.setInterval(() => {
      if (!paused && !document.hidden) next();
    }, AUTOPLAY_MS);
  };
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  card.addEventListener("mouseenter", () => (paused = true));
  card.addEventListener("mouseleave", () => (paused = false));
  card.addEventListener("focusin", () => (paused = true));
  card.addEventListener("focusout", () => (paused = false));

  card.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (!paused) start();
  });

  if (likeBtn) {
    likeBtn.addEventListener("click", () => {
      const slide = slides[index];
      likes[slide.id] = Number(likes[slide.id] || 0) + 1;
      saveLikes(likes);
      setLikeUI();
      likeBtn.classList.remove("is-popping");
      // restart animation
      void likeBtn.offsetWidth;
      likeBtn.classList.add("is-popping");
    });
  }

  renderDots();
  applySlideToCurrent(slides[index]);
  start();
}

function setupSocialCopy() {
  const toast = qs(".toast");
  let toastTimer = null;

  const fallbackCopy = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  };

  const copyText = async (text) => {
    const t = text.trim();
    if (!t) return false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(t);
        return true;
      }
    } catch {
      // ignore and fallback
    }
    return fallbackCopy(t);
  };

  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 1400);
  };

  qsa("[data-copy]").forEach((el) => {
    el.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = el.getAttribute("data-copy") || el.textContent || "";
      const ok = await copyText(text);
      showToast(ok ? `已复制：${text.trim()}` : "复制失败（浏览器权限或环境限制）");
    });
  });
}

function setupParallax() {
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      document.documentElement.style.setProperty("--scrollY", `${window.scrollY}px`);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupCustomCursor() {
  const canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canHover) return;

  const dot = qs(".cursor-dot");
  const ring = qs(".cursor-ring");
  if (!dot || !ring) return;

  document.body.classList.add("has-custom-cursor");

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let tx = x;
  let ty = y;

  const move = (e) => {
    tx = e.clientX;
    ty = e.clientY;
  };
  window.addEventListener("mousemove", move, { passive: true });

  const tick = () => {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
    ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const setHovering = (on) => document.body.classList.toggle("is-hovering", on);

  document.addEventListener("mouseover", (e) => setHovering(isInteractive(e.target)), { passive: true });
  document.addEventListener(
    "focusin",
    (e) => setHovering(isInteractive(e.target)),
    { passive: true }
  );
  document.addEventListener("mouseout", () => setHovering(false), { passive: true });
  document.addEventListener("focusout", () => setHovering(false), { passive: true });
}

function setupEasterEgg() {
  const banner = qs(".easter");
  if (!banner) return;

  let clicks = [];
  let confettiLock = false;

  const showBanner = () => {
    banner.hidden = false;
    banner.classList.add("is-on");
    window.setTimeout(() => banner.classList.remove("is-on"), 1500);
    window.setTimeout(() => (banner.hidden = true), 1850);
  };

  const spawnConfetti = (x, y) => {
    if (confettiLock) return;
    confettiLock = true;

    const colors = ["#FFB6C1", "#98DDCA", "#F0DCA5", "#FFD3A8", "#C7B299"];
    const count = 60;

    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "confetti";
      const size = 6 + Math.random() * 7;
      const dx = (Math.random() - 0.5) * 240;
      const dy = -120 - Math.random() * 220;
      const rot = (Math.random() - 0.5) * 420;
      const dur = 850 + Math.random() * 650;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.width = `${size}px`;
      p.style.height = `${size * (0.65 + Math.random() * 0.9)}px`;
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--dx", `${dx}px`);
      p.style.setProperty("--dy", `${dy}px`);
      p.style.setProperty("--rot", `${rot}deg`);
      p.style.animationDuration = `${dur}ms`;
      document.body.appendChild(p);
      window.setTimeout(() => p.remove(), dur + 60);
    }

    showBanner();
    window.setTimeout(() => (confettiLock = false), 900);
  };

  document.addEventListener("click", (e) => {
    if (isInteractive(e.target)) return;
    const now = performance.now();
    clicks = clicks.filter((t) => now - t < 1200);
    clicks.push(now);
    if (clicks.length >= 3) {
      clicks = [];
      spawnConfetti(e.clientX, e.clientY);
    }
  });
}

function setupAnchorSmoothScroll() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const hash = a.getAttribute("href");
    if (!hash || hash === "#") return;
    e.preventDefault();
    safeScrollToHash(hash);
    history.replaceState(null, "", hash);
  });

  if (location.hash) {
    window.setTimeout(() => safeScrollToHash(location.hash), 80);
  }
}

function injectConfettiCSS() {
  const style = document.createElement("style");
  style.textContent = `
    .confetti{
      position: fixed;
      z-index: 60;
      border-radius: 2px;
      transform: translate(-50%, -50%);
      box-shadow: 0 14px 26px rgba(39, 33, 29, .12);
      animation-name: confettiFly;
      animation-timing-function: cubic-bezier(.12,.8,.22,1);
      animation-fill-mode: both;
      will-change: transform, opacity;
    }
    @keyframes confettiFly{
      0%{ opacity: 0; transform: translate(-50%, -50%) translate3d(0,0,0) rotate(0deg); }
      10%{ opacity: 1; }
      100%{ opacity: 0; transform: translate(-50%, -50%) translate3d(var(--dx), var(--dy), 0) rotate(var(--rot)); }
    }
  `;
  document.head.appendChild(style);
}

function ready() {
  document.body.classList.add("is-ready");
}

setupNav();
setupAnchorSmoothScroll();
setupMood();
setupCarousel();
setupSocialCopy();
setupParallax();
setupCustomCursor();
injectConfettiCSS();
setupEasterEgg();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ready, { once: true });
} else {
  ready();
}

