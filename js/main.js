/* ============================================================
   VANTÉ Volt — interactions (vanilla JS, no dependencies)
   ============================================================ */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  const closeMenu = () => {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ----------------------------------------------------------
     Sticky model sub-nav — reveal after the hero scrolls past
     ---------------------------------------------------------- */
  const subnav = document.getElementById("subnav");
  const hero = document.getElementById("hero");

  if (subnav && hero) {
    if ("IntersectionObserver" in window) {
      const so = new IntersectionObserver(
        ([entry]) => {
          // Show sub-nav once the hero is mostly out of view
          subnav.classList.toggle("is-visible", !entry.isIntersecting);
        },
        { rootMargin: "-60% 0px 0px 0px" }
      );
      so.observe(hero);
    } else {
      window.addEventListener(
        "scroll",
        () => {
          subnav.classList.toggle("is-visible", window.scrollY > hero.offsetHeight * 0.5);
        },
        { passive: true }
      );
    }
    // Close mobile menu when a sub-nav link is used
    subnav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
  }

  /* ----------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
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
     Animated number counters (supports decimals)
     <span data-count="33" data-decimals="1"> -> 3.3
     ---------------------------------------------------------- */
  const counters = document.querySelectorAll("[data-count]");

  const formatVal = (raw, decimals) =>
    decimals > 0 ? (raw / Math.pow(10, decimals)).toFixed(decimals) : String(Math.round(raw));

  const runCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const decimals = parseInt(el.dataset.decimals || "0", 10);

    if (prefersReducedMotion) {
      el.textContent = formatVal(target, decimals);
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // easeOutExpo
      el.textContent = formatVal(eased * target, decimals);
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
    counters.forEach((c) => (c.textContent = formatVal(parseInt(c.dataset.count, 10), parseInt(c.dataset.decimals || "0", 10))));
  }

  /* ----------------------------------------------------------
     Reserve form (front-end demo)
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
        input.focus();
        return;
      }
      note.style.color = "#0b0b0d";
      note.textContent = "Thank you — we'll be in touch to start your configuration.";
      form.reset();
    });
  }
})();
