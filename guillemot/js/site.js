/* Guillemot: the slideshow, the menu button, the bar that follows the hero, the plate that
   turns as you scroll, section entrances and the reservation request. No dependencies. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.documentElement.classList.add("js");

  /* ---------- Hero slideshow ---------- */
  var SLIDE_MS = 7000;
  var hero = $(".hero");
  var slides = $$(".hero__slide");
  var dots = $$(".hero .dot");
  var current = 0;
  var timer = 0;
  var heroVisible = true;
  hero.style.setProperty("--slide-ms", SLIDE_MS + "ms");

  function load(slide) {
    var img = $("img", slide);
    if (img && img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      img.removeAttribute("data-srcset");
      img.removeAttribute("data-src");
    }
  }

  function show(i, byHand) {
    i = (i + slides.length) % slides.length;
    load(slides[i]);
    load(slides[(i + 1) % slides.length]); // the next one is ready before it is needed
    slides.forEach(function (s, n) { s.classList.toggle("is-on", n === i); });
    dots.forEach(function (d, n) {
      d.classList.toggle("is-on", n === i);
      d.classList.remove("is-timed");
      if (n === i) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    });
    current = i;
    schedule(byHand);
  }

  function schedule() {
    clearTimeout(timer);
    var dot = dots[current];
    if (reduce.matches || !heroVisible || document.hidden) return;
    void dot.offsetWidth; // restart the progress line
    dot.classList.add("is-timed");
    timer = setTimeout(function () { show(current + 1); }, SLIDE_MS);
  }

  dots.forEach(function (d, n) {
    d.addEventListener("click", function () { show(n, true); });
  });
  document.addEventListener("visibilitychange", schedule);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) schedule(); else { clearTimeout(timer); dots[current].classList.remove("is-timed"); }
    }, { threshold: 0.2 }).observe(hero);
  }
  window.addEventListener("load", function () { load(slides[1]); });
  schedule();

  /* ---------- Menu button (phones and tablets) ---------- */
  var nav = $(".nav");
  var toggle = $(".nav__toggle");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  $$(".nav__links a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setMenu(false);
  });

  /* ---------- The bar that follows the hero, and the turning plate ---------- */
  var bar = $("#topbar");
  var barLinks = $$("a", bar);
  var plate = $(".plate");
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var h = hero.offsetHeight;
    var on = y > h - 80;
    if (bar.classList.contains("is-on") !== on) {
      bar.classList.toggle("is-on", on);
      bar.setAttribute("aria-hidden", String(!on));
      barLinks.forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    }
    if (!reduce.matches && plate) {
      var p = Math.max(0, Math.min(1, y / h));
      plate.style.setProperty("--turn", (p * 48).toFixed(2) + "deg");
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Entrances ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Reservation request ---------- */
  var form = $("#reserveForm");
  var done = $("#reserveDone");
  var date = $("#fDate");
  var time = $("#fTime");

  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  var today = new Date();
  var last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);
  date.min = iso(today);
  date.max = iso(last);

  // Dinner is seated from 6 to 9:30 in quarter hours; Sunday is lunch, from 12 to 2:30.
  function label(h, m) {
    var ap = h >= 12 ? "PM" : "AM";
    var hh = h % 12 || 12;
    return hh + ":" + String(m).padStart(2, "0") + " " + ap;
  }
  function fillTimes() {
    var picked = time.value;
    var d = date.value ? new Date(date.value + "T12:00:00") : null;
    var day = d ? d.getDay() : null;
    var from = 18, to = 21.5;
    if (day === 0) { from = 12; to = 14.5; }
    var closed = day === 1 || day === 2;
    time.innerHTML = "";
    var first = document.createElement("option");
    first.value = "";
    first.textContent = closed ? "Closed on Mondays and Tuesdays" : "Choose a time";
    time.appendChild(first);
    if (closed) return;
    for (var t = from; t <= to; t += 0.25) {
      var h = Math.floor(t), m = Math.round((t - h) * 60);
      var o = document.createElement("option");
      o.value = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
      o.textContent = label(h, m);
      time.appendChild(o);
    }
    if (picked && $('option[value="' + picked + '"]', time)) time.value = picked;
  }
  fillTimes();
  date.addEventListener("change", function () { fillTimes(); check(date); });

  var rules = {
    fDate: function (v) {
      if (!v) return "Choose a date.";
      if (v < date.min || v > date.max) return "Choose a date within the next thirty days.";
      var day = new Date(v + "T12:00:00").getDay();
      if (day === 1 || day === 2) return "We are closed on Mondays and Tuesdays.";
      return "";
    },
    fTime: function (v) { return v ? "" : "Choose a time."; },
    fName: function (v) { return v.trim().length >= 2 ? "" : "Tell us the name for the table."; },
    fEmail: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter an email address, like name@example.com."; }
  };
  function check(input) {
    var rule = rules[input.id];
    if (!rule) return true;
    var msg = rule(input.value);
    var err = $("#e" + input.id.slice(1));
    input.closest(".field").classList.toggle("is-invalid", !!msg);
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    if (err) err.textContent = msg;
    return !msg;
  }
  Object.keys(rules).forEach(function (id) {
    var input = $("#" + id);
    input.addEventListener("blur", function () { if (input.value) check(input); });
    input.addEventListener("input", function () { if (input.getAttribute("aria-invalid")) check(input); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(rules).forEach(function (id) {
      var input = $("#" + id);
      if (!check(input) && !firstBad) firstBad = input;
    });
    if (firstBad) { firstBad.focus(); return; }
    var d = new Date(date.value + "T12:00:00");
    var when = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    var guests = Number($("#fGuests").value);
    var first = $("#fName").value.trim().split(/\s+/)[0];
    $("#doneTitle").textContent = "Thank you, " + first + ".";
    $("#doneText").textContent = "A table for " + guests + (guests === 1 ? " guest" : " guests") + " on " + when +
      " at " + time.options[time.selectedIndex].textContent + ". As Guillemot is a design concept, nothing has been booked.";
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
  $("#reserveAgain").addEventListener("click", function () {
    done.hidden = true;
    form.hidden = false;
    form.reset();
    fillTimes();
    $("#fDate").focus();
  });

  var year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
