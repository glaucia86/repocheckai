function initHamburgerMenu() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav-links');
  if (!hamburger || !nav) return;
  
  function closeMenu() {
    nav.classList.remove('is-open');
    hamburger.classList.remove('is-active');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  
  hamburger.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('is-open');
    hamburger.classList.toggle('is-active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900 && nav.classList.contains('is-open')) {
        closeMenu();
      }
    });
  });
  
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900 && nav.classList.contains('is-open')) {
      if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
        closeMenu();
      }
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      hamburger.focus();
    }
  });
}
const REPO = "glaucia86/repocheckai";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function track(eventName, detail = {}) {
  if (window.plausible) {
    window.plausible(eventName, { props: detail });
  }
}

async function loadStars() {
  const elements = document.querySelectorAll("[data-stars]");
  if (!elements.length) return;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return;
    const data = await res.json();
    const stars = Number(data.stargazers_count || 0);
    for (const el of elements) {
      el.textContent = `${stars.toLocaleString()} stars`;
    }
  } catch {
    // Best-effort metric, silent failure is fine.
  }
}

async function loadNpmVersion() {
  const elements = document.querySelectorAll("[data-npm-version]");
  if (!elements.length) return;

  const setText = (text) => {
    for (const el of elements) {
      el.textContent = text;
    }
  };

  const fallbackEl = elements[0];
  const fallbackVersion = fallbackEl?.getAttribute("data-npm-fallback");
  const fallbackText = fallbackVersion ? `npm v${fallbackVersion}` : "npm package: repocheckai";

  try {
    const res = await fetch("https://registry.npmjs.org/repocheckai/latest");
    if (!res.ok) {
      setText(fallbackText);
      return;
    }

    const data = await res.json();
    const version = String(data.version || "").trim();
    if (!version) {
      setText(fallbackText);
      return;
    }
    setText(`npm v${version}`);
  } catch {
    setText(fallbackText);
  }
}

async function loadCiStatus() {
  const elements = document.querySelectorAll("[data-ci-status]");
  if (!elements.length) return;

  const setText = (text) => {
    for (const el of elements) {
      el.textContent = text;
    }
  };

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/ci.yml/runs?per_page=1`);
    if (!res.ok) {
      setText("CI: workflow");
      return;
    }
    const data = await res.json();
    const run = Array.isArray(data.workflow_runs) ? data.workflow_runs[0] : null;
    const status = String(run?.conclusion || run?.status || "").toLowerCase();
    if (status === "success") {
      setText("CI: passing");
      return;
    }
    if (status === "failure") {
      setText("CI: failing");
      return;
    }
    setText("CI: in progress");
  } catch {
    setText("CI: workflow");
  }
}

function initCopyButtons() {
  for (const button of document.querySelectorAll("[data-copy]")) {
    button.addEventListener("click", async () => {
      const target = button.getAttribute("data-copy");
      if (!target) return;
      const source = document.querySelector(target);
      if (!source) return;

      const text = source.textContent || "";
      try {
        await navigator.clipboard.writeText(text.trim());
        const old = button.textContent;
        button.textContent = "Copied";
        track("install_copy", { target });
        setTimeout(() => {
          button.textContent = old;
        }, 1200);
      } catch {
        button.textContent = "Copy failed";
      }
    });
  }
}

function initTracking() {
  for (const element of document.querySelectorAll("[data-track]")) {
    element.addEventListener("click", () => {
      const name = element.getAttribute("data-track");
      if (!name) return;
      track(name, { path: window.location.pathname });
    });
  }
}

function setActiveNav() {
  const path = window.location.pathname.split("/").filter(Boolean).pop() || "index.html";
  for (const link of document.querySelectorAll(".nav-links a")) {
    const href = link.getAttribute("href");
    if (!href) continue;
    if (href.startsWith("#")) continue;
    const normalized = href === "./" || href === "/" ? "index.html" : href.replace("./", "");
    if (normalized === path) {
      link.classList.add("active");
    }
  }
}

function initFooterYear() {
  const yearNodes = document.querySelectorAll("[data-year]");
  if (!yearNodes.length) return;
  const year = String(new Date().getFullYear());
  for (const node of yearNodes) {
    node.textContent = year;
  }
}

function initSkipLink() {
  const main = document.querySelector("main");
  if (!main) return;
  if (!main.id) {
    main.id = "main-content";
  }
  if (document.querySelector(".skip-link")) return;

  const skip = document.createElement("a");
  skip.className = "skip-link";
  skip.href = `#${main.id}`;
  skip.textContent = "Skip to content";
  skip.style.transform = "translateY(-180%)";
  document.body.prepend(skip);
  
  // Force reflow to ensure the initial transform is applied
  void skip.offsetWidth;
}

function initBackToTop() {
  if (document.querySelector(".back-to-top")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.textContent = "Top";
  document.body.appendChild(button);

  const updateVisibility = () => {
    button.classList.toggle("is-visible", window.scrollY > 540);
  };

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
}

function initPageEntrance() {
  if (prefersReducedMotion) return;
  document.body.classList.add("has-intro-motion");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.body.classList.add("is-ready");
    });
  });
}

function initGlobalThemeFallback() {
  const hasStoryStages = Boolean(document.querySelector(".story-stage[data-chapter][id]"));
  const hasAboutStages = Boolean(document.querySelector(".about-stage[data-about-theme]"));
  if (hasStoryStages || hasAboutStages) return;

  const path = (window.location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();
  const pageThemeMap = {
    "docs.html": "03",
    "install.html": "04",
    "web-ui.html": "06",
    "trust.html": "07",
    "use-cases.html": "08",
    "roadmap.html": "09",
    "contribute.html": "10",
    "changelog.html": "11",
  };

  document.body.setAttribute("data-story-theme", pageThemeMap[path] || "05");
}

function initTerminalTicker() {
  const el = document.querySelector("#terminal-status");
  if (!el) return;

  const lines = [
    "Scanning repository structure...",
    "Evaluating docs, DX, CI/CD, tests, governance, security...",
    "Prioritizing findings into P0/P1/P2...",
    "Diagnosis complete. Remediation plan ready.",
  ];

  let index = 0;
  setInterval(() => {
    index = (index + 1) % lines.length;
    el.textContent = lines[index];
  }, 1800);
}

function initTopbarState() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  const onScroll = () => {
    if (window.scrollY > 8) {
      topbar.classList.add("is-scrolled");
      return;
    }
    topbar.classList.remove("is-scrolled");
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initReadingProgress() {
  if (prefersReducedMotion) return;

  const bar = document.createElement("div");
  bar.className = "reading-progress";
  document.body.appendChild(bar);

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable <= 0 ? 0 : Math.min(window.scrollY / scrollable, 1);
    bar.style.setProperty("--progress", String(ratio));
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function initScrollReveal() {
  const candidates = document.querySelectorAll(".section .card, .hero .hero-card, .section h2, .section .section-intro");
  if (!candidates.length) return;

  for (const element of candidates) {
    element.classList.add("scroll-reveal");
  }

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    for (const element of candidates) {
      element.classList.add("is-visible");
    }
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  for (const element of candidates) {
    observer.observe(element);
  }
}

function initFloatingOrbs() {
  if (prefersReducedMotion) return;

  const layer = document.createElement("div");
  layer.className = "dynamic-orbs";
  document.body.appendChild(layer);

  const orbs = [
    { size: 320, x: "6%", y: "18%", hue: "13, 148, 136", speed: "16s" },
    { size: 370, x: "76%", y: "6%", hue: "11, 95, 255", speed: "22s" },
    { size: 330, x: "70%", y: "74%", hue: "234, 88, 12", speed: "19s" },
    { size: 245, x: "20%", y: "72%", hue: "34, 197, 94", speed: "20s" },
    { size: 220, x: "46%", y: "10%", hue: "14, 165, 233", speed: "24s" },
  ];

  for (const orbData of orbs) {
    const orb = document.createElement("span");
    orb.className = "dynamic-orb";
    orb.style.setProperty("--orb-size", `${orbData.size}px`);
    orb.style.setProperty("--orb-left", orbData.x);
    orb.style.setProperty("--orb-top", orbData.y);
    orb.style.setProperty("--orb-hue", orbData.hue);
    orb.style.setProperty("--orb-speed", orbData.speed);
    layer.appendChild(orb);
  }
}

function initHeroParallax() {
  if (prefersReducedMotion) return;

  const hero = document.querySelector(".hero");
  const card = document.querySelector(".hero-card");
  if (!hero || !card) return;

  const onMove = (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateX = y * -3.2;
    const rotateY = x * 4;
    card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
  };

  const onLeave = () => {
    card.style.transform = "";
  };

  hero.addEventListener("mousemove", onMove);
  hero.addEventListener("mouseleave", onLeave);
}

function initHeroSpotlight() {
  if (prefersReducedMotion) return;

  const hero = document.querySelector(".hero");
  if (!hero) return;

  hero.classList.add("hero-spotlight");

  const onMove = (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    hero.style.setProperty("--spot-x", `${x.toFixed(2)}%`);
    hero.style.setProperty("--spot-y", `${y.toFixed(2)}%`);
  };

  hero.addEventListener("mousemove", onMove);
}

function initHeroConstellation() {
  if (prefersReducedMotion) return;

  const hero = document.querySelector(".hero");
  if (!hero) return;

  const canvas = document.createElement("canvas");
  canvas.className = "hero-constellation";
  hero.appendChild(canvas);

  const context = canvas.getContext("2d");
  if (!context) return;

  const points = [];
  const density = 22;
  let width = 0;
  let height = 0;
  let rafId = 0;
  let mouseX = 0;
  let mouseY = 0;

  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    width = Math.max(320, Math.floor(bounds.width));
    height = Math.max(240, Math.floor(bounds.height));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  };

  const seed = () => {
    points.length = 0;
    for (let i = 0; i < density; i += 1) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 1.6 + 0.6,
      });
    }
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);

    for (const point of points) {
      point.x += point.vx;
      point.y += point.vy;

      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;

      context.beginPath();
      context.fillStyle = "rgba(13, 148, 136, 0.55)";
      context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      context.fill();
    }

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 120) continue;

        context.beginPath();
        context.strokeStyle = `rgba(11, 95, 255, ${0.16 - distance / 900})`;
        context.lineWidth = 0.8;
        context.moveTo(points[i].x, points[i].y);
        context.lineTo(points[j].x, points[j].y);
        context.stroke();
      }
    }

    for (const point of points) {
      const dx = mouseX - point.x;
      const dy = mouseY - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 130) continue;

      context.beginPath();
      context.strokeStyle = `rgba(234, 88, 12, ${0.25 - distance / 650})`;
      context.lineWidth = 1;
      context.moveTo(point.x, point.y);
      context.lineTo(mouseX, mouseY);
      context.stroke();
    }

    rafId = window.requestAnimationFrame(draw);
  };

  const onMouseMove = (event) => {
    const rect = hero.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  };

  resize();
  seed();
  draw();

  window.addEventListener("resize", () => {
    resize();
    seed();
  });
  hero.addEventListener("mousemove", onMouseMove);
  hero.addEventListener("mouseleave", () => {
    mouseX = width * 0.5;
    mouseY = height * 0.5;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(rafId);
      return;
    }
    draw();
  });
}

function initGlobalConstellation() {
  if (prefersReducedMotion) return;
  if (document.querySelector(".hero")) return;
  if (document.querySelector(".global-constellation")) return;

  const canvas = document.createElement("canvas");
  canvas.className = "global-constellation";
  document.body.appendChild(canvas);

  const context = canvas.getContext("2d");
  if (!context) return;

  const points = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  let pointerActive = false;

  const resize = () => {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const seed = () => {
    const count = Math.max(24, Math.min(52, Math.floor((width * height) / 36000)));
    points.length = 0;
    for (let i = 0; i < count; i += 1) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        size: Math.random() * 1.8 + 0.6,
      });
    }
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    mouseX += (targetMouseX - mouseX) * 0.12;
    mouseY += (targetMouseY - mouseY) * 0.12;

    for (const point of points) {
      point.x += point.vx;
      point.y += point.vy;

      if (point.x < -20 || point.x > width + 20) point.vx *= -1;
      if (point.y < -20 || point.y > height + 20) point.vy *= -1;

      context.beginPath();
      context.fillStyle = "rgba(15, 23, 42, 0.74)";
      context.shadowColor = "rgba(11, 95, 255, 0.45)";
      context.shadowBlur = 10;
      context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 210) continue;

        context.beginPath();
        context.strokeStyle = `rgba(11, 95, 255, ${0.58 - distance / 650})`;
        context.lineWidth = 1.15;
        context.moveTo(points[i].x, points[i].y);
        context.lineTo(points[j].x, points[j].y);
        context.stroke();

        if (distance < 120) {
          context.beginPath();
          context.strokeStyle = `rgba(234, 88, 12, ${0.32 - distance / 500})`;
          context.lineWidth = 0.8;
          context.moveTo(points[i].x, points[i].y);
          context.lineTo(points[j].x, points[j].y);
          context.stroke();
        }
      }
    }

    if (pointerActive) {
      for (const point of points) {
        const dx = mouseX - point.x;
        const dy = mouseY - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 180) continue;

        context.beginPath();
        context.strokeStyle = `rgba(234, 88, 12, ${0.34 - distance / 650})`;
        context.lineWidth = 1;
        context.moveTo(point.x, point.y);
        context.lineTo(mouseX, mouseY);
        context.stroke();
      }
    }

    rafId = window.requestAnimationFrame(draw);
  };

  const onPointerMove = (event) => {
    const x = event.clientX;
    const y = event.clientY;
    pointerActive = true;
    targetMouseX = Math.max(0, Math.min(width, x));
    targetMouseY = Math.max(0, Math.min(height, y));
  };

  const onPointerLeave = () => {
    pointerActive = false;
  };

  resize();
  seed();
  draw();

  window.addEventListener("resize", () => {
    resize();
    seed();
  });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(rafId);
      return;
    }
    draw();
  });
}

function initMagneticButtons() {
  if (prefersReducedMotion) return;

  const interactiveButtons = document.querySelectorAll(".btn");
  for (const button of interactiveButtons) {
    button.classList.add("magnetic");

    const onMove = (event) => {
      const rect = button.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left - rect.width / 2) / rect.width;
      const offsetY = (event.clientY - rect.top - rect.height / 2) / rect.height;
      button.style.setProperty("--mx", `${(offsetX * 9).toFixed(2)}px`);
      button.style.setProperty("--my", `${(offsetY * 8).toFixed(2)}px`);
    };

    const onLeave = () => {
      button.style.setProperty("--mx", "0px");
      button.style.setProperty("--my", "0px");
    };

    button.addEventListener("mousemove", onMove);
    button.addEventListener("mouseleave", onLeave);
  }
}

function initHeroCycler() {
  const heading = document.querySelector(".hero h1");
  if (!heading) return;

  const words = ["faster", "smarter", "safer", "with confidence"];
  const container = document.createElement("p");
  container.className = "hero-cycler";
  container.innerHTML = 'Diagnose <span class="hero-cycler-word">faster</span> and ship with less guesswork.';
  heading.insertAdjacentElement("afterend", container);

  if (prefersReducedMotion) return;

  const wordEl = container.querySelector(".hero-cycler-word");
  if (!wordEl) return;

  let index = 0;
  window.setInterval(() => {
    index = (index + 1) % words.length;
    wordEl.classList.remove("is-animated");
    wordEl.textContent = words[index];
    void wordEl.offsetWidth;
    wordEl.classList.add("is-animated");
  }, 2200);
}

function initKpiCounter() {
  if (prefersReducedMotion) return;

  const values = document.querySelectorAll(".kpi .v");
  if (!values.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target;
        const raw = element.textContent ? element.textContent.trim() : "";
        const numberPart = raw.match(/\d+/);
        if (!numberPart) {
          observer.unobserve(element);
          continue;
        }
        const max = Number(numberPart[0]);
        const suffix = raw.replace(numberPart[0], "");
        const start = performance.now();
        const duration = 1100;

        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const current = Math.floor(max * progress);
          element.textContent = `${current}${suffix}`;
          if (progress < 1) {
            window.requestAnimationFrame(animate);
            return;
          }
          element.textContent = raw;
        };

        window.requestAnimationFrame(animate);
        observer.unobserve(element);
      }
    },
    { threshold: 0.4 },
  );

  for (const value of values) {
    observer.observe(value);
  }
}

function initStoryChapters() {
  const chapters = Array.from(document.querySelectorAll(".story-stage[data-chapter][id]"));
  const railLinks = Array.from(document.querySelectorAll("[data-story-link]"));
  const hud = document.querySelector(".chapter-hud");
  const hudIndex = document.querySelector(".chapter-hud-index");
  const hudTitle = document.querySelector(".chapter-hud-title");
  if (!chapters.length || !railLinks.length || !hud || !hudIndex || !hudTitle) return;

  const map = new Map(railLinks.map((link) => [link.getAttribute("data-story-link"), link]));
  const rail = document.querySelector(".story-rail");

  const activate = (chapter) => {
    const id = chapter.id;
    const index = chapter.getAttribute("data-chapter") || "";
    const title = chapter.getAttribute("data-chapter-title") || "";

    for (const section of chapters) {
      section.classList.toggle("chapter-active", section === chapter);
    }

    for (const link of railLinks) {
      const isActive = link.getAttribute("data-story-link") === id;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    }

    hudIndex.textContent = index;
    hudTitle.textContent = title;
    hud.classList.add("is-visible");
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    activate(chapters[0]);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!visible.length) return;
      activate(visible[0].target);
    },
    { threshold: [0.25, 0.45, 0.7], rootMargin: "-12% 0px -35% 0px" },
  );

  for (const chapter of chapters) {
    observer.observe(chapter);
  }

  for (const link of map.values()) {
    link.addEventListener("click", () => {
      const id = link.getAttribute("data-story-link");
      if (!id) return;
      const target = chapters.find((chapter) => chapter.id === id);
      if (!target) return;
      activate(target);
      if (rail && rail.classList.contains("is-open")) {
        rail.classList.remove("is-open");
        rail.classList.add("is-collapsed");
        const toggle = rail.querySelector(".story-rail-toggle");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
        }
      }
    });
  }
}

function initStoryRailToggle() {
  const rail = document.querySelector(".story-rail");
  const toggle = document.querySelector(".story-rail-toggle");
  if (!rail || !toggle) return;

  toggle.addEventListener("click", () => {
    const isCollapsed = rail.classList.contains("is-collapsed");
    rail.classList.toggle("is-collapsed", !isCollapsed);
    rail.classList.toggle("is-open", isCollapsed);
    toggle.setAttribute("aria-expanded", isCollapsed ? "true" : "false");
  });
}

function initAboutEnhancements() {
  const timelineItems = Array.from(document.querySelectorAll(".about-timeline-item"));
  if (timelineItems.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      for (const item of timelineItems) item.classList.add("is-visible");
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const item = entry.target;
            const index = timelineItems.indexOf(item);
            window.setTimeout(() => {
              item.classList.add("is-visible");
            }, Math.max(index, 0) * 120);
            observer.unobserve(item);
          }
        },
        { threshold: 0.2 },
      );

      for (const item of timelineItems) observer.observe(item);
    }
  }

  if (prefersReducedMotion) return;

  const highlightTiles = document.querySelectorAll(".about-highlight-tile");
  for (const tile of highlightTiles) {
    tile.addEventListener("mousemove", (event) => {
      const rect = tile.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      tile.style.setProperty("--hx", `${x.toFixed(2)}%`);
      tile.style.setProperty("--hy", `${y.toFixed(2)}%`);
    });
    tile.addEventListener("mouseleave", () => {
      tile.style.setProperty("--hx", "20%");
      tile.style.setProperty("--hy", "0%");
    });
  }
}

function initAboutCinematic() {
  const stages = Array.from(document.querySelectorAll(".about-stage[data-about-theme]"));
  if (!stages.length) return;

  const activate = (stage) => {
    const theme = stage.getAttribute("data-about-theme");
    if (!theme) return;
    document.body.setAttribute("data-about-theme", theme);
  };

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    activate(stages[0]);
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        activate(visible[0].target);
      },
      { threshold: [0.3, 0.55, 0.8], rootMargin: "-10% 0px -35% 0px" },
    );

    for (const stage of stages) observer.observe(stage);
  }

  const wordEl = document.querySelector(".about-cycler-word");
  if (!wordEl) return;

  const words = ["clarity", "evidence", "confidence", "velocity"];
  if (prefersReducedMotion) {
    wordEl.textContent = words[0];
    return;
  }

  let index = 0;
  window.setInterval(() => {
    index = (index + 1) % words.length;
    wordEl.classList.remove("is-animated");
    wordEl.textContent = words[index];
    void wordEl.offsetWidth;
    wordEl.classList.add("is-animated");
  }, 2100);
}

function initAboutRoleSwitcher() {
  const buttons = Array.from(document.querySelectorAll(".about-role-btn[data-role-variant]"));
  if (!buttons.length) return;

  const roleSlots = document.querySelectorAll("[data-about-role]");
  const microcopy = document.querySelector("[data-about-role-microcopy]");

  const variants = {
    engineer: {
      role: "AI Software Engineer",
      microcopy: "AI Software Engineer. Builder. Educator.",
    },
    developer: {
      role: "AI Developer",
      microcopy: "AI Developer. Builder. Educator.",
    },
  };

  const applyVariant = (variant) => {
    const content = variants[variant];
    if (!content) return;

    for (const slot of roleSlots) {
      slot.textContent = content.role;
    }

    if (microcopy) {
      microcopy.textContent = content.microcopy;
    }

    for (const button of buttons) {
      button.classList.toggle("is-active", button.getAttribute("data-role-variant") === variant);
      button.setAttribute("aria-pressed", button.classList.contains("is-active") ? "true" : "false");
    }
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const variant = button.getAttribute("data-role-variant");
      if (!variant) return;
      applyVariant(variant);
    });
  }

  applyVariant("engineer");
}


loadStars();
loadNpmVersion();
loadCiStatus();
initCopyButtons();
initTracking();
initGlobalThemeFallback();
setActiveNav();
initFooterYear();
initSkipLink();
initBackToTop();
initPageEntrance();
initTerminalTicker();
initTopbarState();
initReadingProgress();
initScrollReveal();
initGlobalConstellation();
initFloatingOrbs();
initHeroParallax();
initHeroSpotlight();
initHeroConstellation();
initMagneticButtons();
initHeroCycler();
initKpiCounter();
initStoryRailToggle();
initStoryChapters();
initAboutEnhancements();
initAboutCinematic();
initAboutRoleSwitcher();
initHamburgerMenu();