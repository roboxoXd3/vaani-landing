import "./style.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BACKEND_URL = "https://vaani-backend-production-8d5f.up.railway.app";
const RELEASES_BASE = "https://github.com/roboxoXd3/vaani-releases/releases/latest/download";
const DOWNLOAD_URLS: Record<"mac" | "windows", string> = {
  mac: `${RELEASES_BASE}/Vaani.dmg`,
  windows: `${RELEASES_BASE}/Vaani-Setup.exe`,
};

// ---------- OS-aware download buttons ----------

function detectOS(): "mac" | "windows" | "other" {
  const platform = navigator.userAgent || "";
  if (/Mac/i.test(platform)) return "mac";
  if (/Win/i.test(platform)) return "windows";
  return "other";
}

function setupDownloadButtons() {
  const os = detectOS();
  const primary = document.getElementById("dl-primary") as HTMLButtonElement | null;
  const primaryLabel = document.getElementById("dl-primary-label");
  const secondary = document.getElementById("dl-secondary") as HTMLButtonElement | null;
  const secondaryLabel = document.getElementById("dl-secondary-label");
  if (!primary || !primaryLabel || !secondary || !secondaryLabel) return;

  const isWindows = os === "windows";
  primary.dataset.platform = isWindows ? "windows" : "mac";
  primaryLabel.textContent = isWindows ? "Download for Windows" : "Download for Mac";
  secondary.dataset.platform = isWindows ? "mac" : "windows";
  secondaryLabel.textContent = isWindows ? "Download for Mac" : "Download for Windows";
}

// ---------- Download modal (captures email before releasing the link) ----------

function setupDownloadModal() {
  const overlay = document.getElementById("modal-overlay");
  const closeBtn = document.getElementById("modal-close");
  const form = document.getElementById("modal-form") as HTMLFormElement | null;
  const emailInput = document.getElementById("modal-email") as HTMLInputElement | null;
  const submitBtn = document.getElementById("modal-submit") as HTMLButtonElement | null;
  const platformLabel = document.getElementById("modal-platform-label");
  const errorEl = document.getElementById("modal-error");
  if (!overlay || !closeBtn || !form || !emailInput || !submitBtn || !platformLabel || !errorEl) return;

  let selectedPlatform: "mac" | "windows" = "mac";

  function openModal(platform: "mac" | "windows") {
    selectedPlatform = platform;
    platformLabel!.textContent = platform === "mac" ? "Download for Mac" : "Download for Windows";
    errorEl!.hidden = true;
    overlay!.hidden = false;
    emailInput!.focus();
  }

  function closeModal() {
    overlay!.hidden = true;
  }

  document.querySelectorAll<HTMLElement>("[data-platform]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const platform = btn.dataset.platform === "windows" ? "windows" : "mac";
      openModal(platform);
    });
  });

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay!.hidden) closeModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl!.hidden = true;
    submitBtn!.disabled = true;
    submitBtn!.textContent = "Starting download…";
    try {
      const res = await fetch(`${BACKEND_URL}/downloads/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput!.value.trim(), platform: selectedPlatform }),
      });
      if (!res.ok) throw new Error("Something went wrong. Please try again.");
      window.location.href = DOWNLOAD_URLS[selectedPlatform];
      closeModal();
      form.reset();
    } catch (err) {
      errorEl!.textContent = err instanceof Error ? err.message : "Something went wrong.";
      errorEl!.hidden = false;
    } finally {
      submitBtn!.disabled = false;
      submitBtn!.textContent = "Continue to download";
    }
  });
}

// ---------- Scroll reveals ----------

function setupReveals() {
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  items.forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      delay: (i % 6) * 0.05,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });
  });
}

// ---------- Stat counters + bars ----------

function setupStatCounters() {
  const section = document.querySelector(".stat-compare");
  if (!section) return;

  ScrollTrigger.create({
    trigger: section,
    start: "top 80%",
    once: true,
    onEnter: () => {
      document.querySelectorAll<HTMLElement>(".counter").forEach((el) => {
        const target = Number(el.dataset.target || "0");
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = String(Math.round(obj.val));
          },
        });
      });
      document.querySelectorAll<HTMLElement>(".stat-bar-fill").forEach((el) => {
        el.style.width = (el.dataset.width || "0") + "%";
      });
    },
  });
}

// ---------- Ambient background canvas ----------

function setupBackgroundCanvas() {
  const canvas = document.getElementById("bg-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const colors = ["#f2a65a", "#e0399b", "#2a2f8c", "#38b6ff"];
  let blobs: { x: number; y: number; r: number; dx: number; dy: number; color: string }[] = [];

  function resize() {
    canvas!.width = window.innerWidth;
    canvas!.height = window.innerHeight;
    blobs = colors.map((color, i) => ({
      x: (canvas!.width / (colors.length + 1)) * (i + 1),
      y: canvas!.height * (0.2 + 0.15 * (i % 2)),
      r: Math.min(canvas!.width, canvas!.height) * 0.28,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      color,
    }));
  }

  function tick() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";
    for (const b of blobs) {
      b.x += b.dx;
      b.y += b.dy;
      if (b.x < -b.r || b.x > canvas.width + b.r) b.dx *= -1;
      if (b.y < -b.r || b.y > canvas.height + b.r) b.dy *= -1;

      const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      gradient.addColorStop(0, b.color + "33");
      gradient.addColorStop(1, b.color + "00");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  resize();
  tick();
}

// ---------- Typewriter demos (hero app-window + chat mockup) ----------

function typeLoop(el: HTMLElement, text: string, opts: { speed?: number; pause?: number } = {}) {
  const speed = opts.speed ?? 42;
  const pause = opts.pause ?? 2000;
  let i = 0;
  let deleting = false;

  function step() {
    if (!deleting) {
      i++;
      el.textContent = text.slice(0, i);
      if (i >= text.length) {
        deleting = true;
        setTimeout(step, pause);
        return;
      }
    } else {
      i--;
      el.textContent = text.slice(0, i);
      if (i <= 0) {
        deleting = false;
        setTimeout(step, 600);
        return;
      }
    }
    setTimeout(step, deleting ? speed / 2.5 : speed);
  }
  step();
}

function setupTypewriters() {
  const heroEl = document.getElementById("hero-typewriter");
  if (heroEl) {
    typeLoop(heroEl, "Q3 revenue is up 18%, and the team is finally ahead of schedule.");
  }

  const chatEl = document.getElementById("chat-typewriter");
  const chatMockup = document.querySelector(".chat-mockup");
  if (chatEl && chatMockup) {
    ScrollTrigger.create({
      trigger: chatMockup,
      start: "top 80%",
      once: true,
      onEnter: () =>
        typeLoop(chatEl as HTMLElement, "Pushed the fix, tests are green — ready for review whenever you are.", {
          pause: 2600,
        }),
    });
  }
}

function setupFooterYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

setupDownloadButtons();
setupDownloadModal();
setupReveals();
setupStatCounters();
setupBackgroundCanvas();
setupTypewriters();
setupFooterYear();
