/* ============================================================
   VANTÉ — interactions (vanilla JS, no dependencies)
   ============================================================ */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------
     Nav: scrolled state + mobile menu
     ---------------------------------------------------------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  const onScrollNav = () => {
    if (window.scrollY > 40) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  };
  onScrollNav();

  const closeMenu = () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  // Close mobile menu when a link is tapped
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", closeMenu)
  );

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ----------------------------------------------------------
     Scroll progress bar (rAF-throttled)
     ---------------------------------------------------------- */
  const progress = document.getElementById("scrollProgress");
  let ticking = false;

  const updateScroll = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    progress.style.width = pct + "%";
    onScrollNav();
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  /* ----------------------------------------------------------
     Reveal on scroll (IntersectionObserver)
     ---------------------------------------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Stagger items that animate in together
            const delay = Math.min(i * 80, 320);
            entry.target.style.transitionDelay = delay + "ms";
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ----------------------------------------------------------
     Animated number counters
     ---------------------------------------------------------- */
  const counters = document.querySelectorAll("[data-count]");

  const runCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (prefersReducedMotion) {
      el.textContent = String(target);
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = String(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach((c) => (c.textContent = c.dataset.count));
  }

  /* ----------------------------------------------------------
     Subtle hero parallax (desktop, motion allowed)
     ---------------------------------------------------------- */
  const heroVideo = document.getElementById("heroVideo");
  if (heroVideo && !prefersReducedMotion && window.matchMedia("(min-width: 760px)").matches) {
    let raf = false;
    window.addEventListener(
      "scroll",
      () => {
        if (raf) return;
        raf = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight) {
            heroVideo.style.transform = `translateY(${y * 0.18}px) scale(1.05)`;
          }
          raf = false;
        });
      },
      { passive: true }
    );
  }

  /* ----------------------------------------------------------
     Card 3D tilt on pointer (desktop only)
     ---------------------------------------------------------- */
  if (!prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const strength = 8;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ----------------------------------------------------------
     Reserve form (front-end only demo)
     ---------------------------------------------------------- */
  const form = document.getElementById("reserveForm");
  const note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type=email]");
      const value = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!valid) {
        note.textContent = "Please enter a valid email address.";
        note.style.color = "#e08585";
        input.focus();
        return;
      }
      note.textContent = "Thank you — your invitation request has been received.";
      note.style.color = "var(--accent-2)";
      form.reset();
    });
  }

  /* ----------------------------------------------------------
     Footer year safety (in case markup changes)
     ---------------------------------------------------------- */
})();
