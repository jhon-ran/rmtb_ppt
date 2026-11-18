/* ═══════════════════════════════════════════════════════════
   Riviera Maya Tech Builders · Presentación
   Secciones: 1) lienzo y escala  2) navegación  3) notas y
   cronómetro  4) meetups (lee MEETUPS de assets/meetups.js)
═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const deck = document.getElementById("deck");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const bar = document.getElementById("bar");
  const count = document.getElementById("count");
  const notes = document.getElementById("notes");
  const notesTitle = document.getElementById("notes-title");
  const notesBody = document.getElementById("notes-body");
  const timer = document.getElementById("timer");
  let current = 0;

  // Pantallas angostas: página que se desplaza (ver CSS, sección 7). Sin lienzo ni teclas.
  const mobileMQ = window.matchMedia("(max-width: 900px)");
  const isMobile = function () { return mobileMQ.matches; };

  /* 1) Lienzo 1280×720 escalado a la ventana ────────────── */
  function fit() {
    if (isMobile()) { deck.style.transform = ""; return; }
    const s = Math.min(innerWidth / 1280, innerHeight / 720);
    deck.style.transform = "scale(" + s + ")";
  }
  addEventListener("resize", fit);
  fit();

  /* 2) Navegación ───────────────────────────────────────── */
  function go(n) {
    current = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (s, i) {
      s.classList.toggle("active", i === current);
      s.classList.toggle("prev", i < current);
    });
    bar.style.width = ((current + 1) / slides.length * 100) + "%";
    count.textContent = (current + 1) + " / " + slides.length;
    const s = slides[current];
    notesTitle.textContent = "Notas · tiempo sugerido " + (s.dataset.time || "");
    notesBody.textContent = s.dataset.notes || "";
    history.replaceState(null, "", "#" + (current + 1));
  }

  let overview = false;
  function toggleOverview() {
    overview = !overview;
    document.body.classList.toggle("overview", overview);
  }

  addEventListener("keydown", function (e) {
    if (isMobile()) return;
    document.body.classList.remove("hint");
    const k = e.key;
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(k)) { e.preventDefault(); go(current + 1); startTimer(); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); go(current - 1); }
    else if (k === "Home") go(0);
    else if (k === "End") go(slides.length - 1);
    else if (k === "n" || k === "N") notes.classList.toggle("show");
    else if (k === "t" || k === "T") { timer.classList.toggle("show"); startTimer(); }
    else if (k === "r" || k === "R") resetTimer();
    else if (k === "f" || k === "F") {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }
  });

  addEventListener("click", function (e) {
    if (isMobile()) return;
    if (e.target.closest("#notes")) return;
    document.body.classList.remove("hint");
    go(e.clientX < innerWidth / 3 ? current - 1 : current + 1);
    startTimer();
  });

  let touchX = null;
  addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", function (e) {
    if (touchX === null || isMobile()) { touchX = null; return; }
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  setTimeout(function () { document.body.classList.remove("hint"); }, 6000);

  /* 3) Cronómetro (se pone rojo pasados 5:00) ───────────── */
  let t0 = null, tick = null;
  function startTimer() {
    if (t0) return;
    t0 = Date.now();
    tick = setInterval(function () {
      const s = Math.floor((Date.now() - t0) / 1000);
      timer.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
      timer.classList.toggle("over", s > 300);
    }, 500);
  }
  function resetTimer() {
    clearInterval(tick); t0 = null;
    timer.textContent = "0:00"; timer.classList.remove("over");
  }

  /* 4) Próximos meetups ─────────────────────────────────── */
  // Usa MEETUPS de assets/meetups.js: los eventos pasados salen solos.
  // Para ensayar otra fecha: presentacion.html?date=2026-11-20
  const ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  const ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const ICON_TICKET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 0 0-6V6H3z"/><path d="M13 6v12" stroke-dasharray="2 3"/></svg>';

  // Notas de hora que meetups.js trae en inglés
  const NOTAS = {
    "Hands-on workshop in Spanish": "Taller práctico en español",
    "Drop in anytime": "Llega cuando quieras",
    "Live music from 8:30 PM if you stay": "Música en vivo desde las 8:30 PM"
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderMeetups() {
    const host = document.getElementById("meetups");
    const fake = new URLSearchParams(location.search).get("date");
    const now = fake ? new Date(fake + "T12:00:00-05:00") : new Date();
    const list = (typeof MEETUPS !== "undefined" ? MEETUPS : [])
      .filter(function (e) { return new Date(e.end || e.start) > now; })
      .sort(function (a, b) { return new Date(a.start) - new Date(b.start); })
      .slice(0, 2);

    if (!list.length) {
      host.classList.add("one");
      host.innerHTML = '<div class="card ev ev-empty">Nuestro próximo meetup está en camino. Sigue la agenda en <b>luma.com/rivieramayatech</b> y entérate primero.</div>';
      return;
    }
    host.classList.toggle("one", list.length === 1);
    host.innerHTML = list.map(function (e) {
      const d = new Date(e.start);
      const day = d.toLocaleDateString("es-MX", { day: "numeric", timeZone: "America/Cancun" });
      const mon = d.toLocaleDateString("es-MX", { month: "short", timeZone: "America/Cancun" }).replace(".", "");
      const wd = d.toLocaleDateString("es-MX", { weekday: "long", timeZone: "America/Cancun" });
      const rsvp = e.rsvp ? e.rsvp.replace(/^https?:\/\//, "") : "";
      return '<article class="card ev">' +
        '<div class="ev-top">' +
          '<div class="ev-date"><b>' + esc(day) + '</b><span>' + esc(mon) + '</span></div>' +
          '<div><span class="badge">' + esc(e.chapter) + '</span><h3>' + esc(e.title) + '</h3></div>' +
        '</div>' +
        '<div class="ev-meta">' +
          '<div>' + ICON_CLOCK + '<span>' + esc(wd) + ' · ' + esc(e.time) + (e.timeNote ? ' · ' + esc(NOTAS[e.timeNote] || e.timeNote) : '') + '</span></div>' +
          '<div>' + ICON_PIN + '<span>' + esc(e.venue) + '</span></div>' +
          '<div>' + ICON_TICKET + '<span>' + esc(e.price === "Free" ? "Gratis" : e.price) + (e.priceNote ? ' · cupo limitado, con RSVP' : '') + '</span></div>' +
        '</div>' +
        '<div class="ev-foot"><span class="ev-rsvp">RSVP → ' + esc(rsvp) + '</span></div>' +
      '</article>';
    }).join("");
  }

  mobileMQ.addEventListener("change", function () { fit(); go(current); });

  renderMeetups();
  const hash = parseInt(location.hash.slice(1), 10);
  go(hash > 0 ? hash - 1 : 0);
})();
