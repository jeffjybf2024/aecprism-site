// Group D: the IMPACT chart. Bars and dials draw, with their figures counting, every time the section comes up.
(function () {
  "use strict";
  var row = document.getElementById("metrics");
  if (!row) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // the HTML and more.css already hold the finished chart, so without motion or an observer there is nothing to do
  if (reduce || !("IntersectionObserver" in window) || !("MutationObserver" in window)) return;

  // one item after another; the marks arrive first, the value starts while the last of them settle
  var STAGGER = 130, T_IN = 650, T_HOLD = 520, T_RUN = 1600;
  var items = [].map.call(row.querySelectorAll(".mx-i"), function (el, i) {
    var n = el.querySelector(".mx-n"), to = n.dataset.to;
    return { el: el, n: n, to: +to, dec: (to.split(".")[1] || "").length, at: i * STAGGER, txt: null };
  });
  function c01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  // a: the marks arrive (0..1), k: the value (0..1). more.css draws both; the figure follows k so it lands with the bar
  function set(it, a, k) {
    it.el.style.setProperty("--a", a.toFixed(4));
    it.el.style.setProperty("--k", k.toFixed(4));
    var s = (it.to * k).toFixed(it.dec);
    if (s !== it.txt) { it.txt = s; it.n.textContent = s; }
  }

  var state = 0, raf = 0, t0 = 0; // 0 waiting at zero, 1 drawing, 2 drawn
  function frame(now) {
    var busy = false;
    items.forEach(function (it) {
      // the first frame's timestamp can be a little before t0: c01 keeps that at zero
      var u = now - t0 - it.at, a = 1 - Math.pow(1 - c01(u / T_IN), 3), k = c01((u - T_HOLD) / T_RUN);
      k = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      set(it, a, k);
      if (k < 1) busy = true;
    });
    if (busy) raf = requestAnimationFrame(frame);
    else { raf = 0; state = 2; row.classList.add("is-live"); }
  }
  function play() { state = 1; t0 = performance.now(); raf = requestAnimationFrame(frame); }
  function reset() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; state = 0; row.classList.remove("is-live");
    items.forEach(function (it) { set(it, 0, 0); });
  }

  // main.js fades each section's content in and out by the film's station (inline opacity and visibility on the
  // section's children), so being in the viewport is not enough: draw once the content is really showing, and go
  // back to zero only when it is fully away, so nothing unwinds in front of the reader
  var sec = row.closest("section"), kid = row;
  while (sec && kid.parentNode && kid.parentNode !== sec) kid = kid.parentNode;
  function showing() {
    if (kid.style.visibility === "hidden") return 0;
    var o = kid.style.opacity;
    return o === "" ? 1 : +o;
  }
  var near = false, away = true;
  function check() {
    var o = showing();
    if (state === 0) { if (near && o > 0.3) play(); }
    else if (away || o === 0) reset();
  }
  reset();
  new IntersectionObserver(function (es) {
    var e = es[es.length - 1];
    near = e.isIntersecting && e.intersectionRatio >= 0.3; away = !e.isIntersecting;
    check();
  }, { threshold: [0, 0.3] }).observe(row);
  if (kid !== row) new MutationObserver(check).observe(kid, { attributes: true, attributeFilter: ["style"] });
})();
