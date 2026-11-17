// The About page (team.html). One earth at night behind the whole page: as the page scrolls it moves and turns to
// each part's place (Taiwan for who we are, each member's home, the logo at the end). Dotty, the team's AI
// teammate, is drawn here as a figure of light points. The 30-year film opens in a lightbox.
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ss(a, b, v) { v = clamp((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); }

  // ---------- the film, in full with sound ----------
  var lb = document.getElementById("lightbox"), lbv = document.getElementById("lbVideo"), w = document.getElementById("watch");
  if (w && lb && lbv) {
    var openLb = function () { lb.hidden = false; document.body.classList.add("lb-open"); lbv.currentTime = 0; lbv.play().catch(function () {}); };
    var closeLb = function () { lbv.pause(); lb.hidden = true; document.body.classList.remove("lb-open"); };
    w.addEventListener("click", openLb);
    document.getElementById("lbClose").addEventListener("click", closeLb);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLb(); });
  }

  // ---------- the words come in as they reach the screen ----------
  var rv = [].slice.call(document.querySelectorAll("[data-rv]"));
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el, i) { el.style.transitionDelay = (i % 6) * 0.07 + "s"; io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  // ---------- the earth behind the page ----------
  var E = window.PRISM_EARTH, host = document.getElementById("abEarth");
  var TW = { lat: 23.8, lon: 121.0 }, BF = { lat: 12.3, lon: -1.6 }, NZ = { lat: -41.2, lon: 174.6 };
  // where the globe stands for each part (a wide screen): centre, radius (view heights), darker, the team's lines, the logo, faces
  var WIDE = {
    open: { cx: 0.73, cy: 0.52, r: 0.44, dim: 0, team: 0, logo: 0, aim: TW },
    bg:   { cx: 0.82, cy: 0.5, r: 0.36, dim: 0.3, team: 0, logo: 0, aim: TW },
    m1:   { cx: 0.85, cy: 0.5, r: 0.3, dim: 0.15, team: 1, logo: 0, aim: TW },
    m2:   { cx: 0.85, cy: 0.5, r: 0.3, dim: 0.15, team: 1, logo: 0, aim: BF },
    m3:   { cx: 0.85, cy: 0.5, r: 0.3, dim: 0.15, team: 1, logo: 0, aim: NZ },
    m4:   { cx: 0.85, cy: 0.5, r: 0.3, dim: 0.25, team: 1, logo: 0, aim: TW },
    end:  { cx: 0.7, cy: 0.5, r: 0.4, dim: 0, team: 0, logo: 1, aim: null }
  };
  var secs = [].slice.call(document.querySelectorAll("section[data-g]"));
  var earth = E && host ? E.mount(host, { base: "assets/earth/" }) : null;
  if (earth) {
    var lastAim = undefined, keys = ["cx", "cy", "r", "dim", "team", "logo"];
    var tick = function () {
      requestAnimationFrame(tick);
      var phone = innerWidth <= 820, mid = innerHeight / 2, at = [];
      secs.forEach(function (s) { var r = s.getBoundingClientRect(); at.push(r.top + r.height / 2 - mid); });
      // the two parts the middle of the screen is between, and how far
      var k = 0; while (k < at.length - 1 && at[k + 1] <= 0) k++;
      var a = WIDE[secs[k].dataset.g], b = WIDE[secs[Math.min(k + 1, secs.length - 1)].dataset.g];
      var t = k + 1 < at.length && at[k] < 0 ? ss(0, 1, -at[k] / Math.max(1, at[k + 1] - at[k])) : 0;
      var o = { show: 1, on: 1 };
      keys.forEach(function (key) { o[key] = a[key] + (b[key] - a[key]) * t; });
      if (phone) { o.cx = 0.5; o.cy = 0.2; o.r = 0.17; o.dim = Math.max(o.dim, 0.2); }
      earth.set(o);
      var aim = (t < 0.5 ? a : b).aim;
      if (aim !== lastAim) { lastAim = aim; earth.aim(aim); }
    };
    earth.set({ show: 1, on: 1 }); earth.jump();
    requestAnimationFrame(tick);
  }

  // ---------- Dotty: a figure of light points ----------
  var cv = document.getElementById("dotty");
  if (cv && cv.getContext) {
    var cx = cv.getContext("2d"), W = cv.width, H = cv.height, dots = [];
    var L = [-0.42, -0.5, 0.76], ln = Math.hypot(L[0], L[1], L[2]); L = [L[0] / ln, L[1] / ln, L[2] / ln];
    var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    // the figure: head, hair, neck, shoulders; each point's light from its surface's direction
    function shape(x, y) {
      var hx = (x - 400) / 112, hy = (y - 330) / 140, hd = hx * hx + hy * hy;
      if (hd <= 1) { var nz = Math.sqrt(1 - hd); return { n: [hx, hy * 0.9, nz], k: 1 }; }
      var gx = (x - 400) / 132, gy = (y - 305) / 156, gd = gx * gx + gy * gy;                      // hair: a cap, then down the back
      if ((gd <= 1 && y < 360) || (Math.abs(x - 400) < 150 && Math.abs(x - 400) > 92 && y > 280 && y < 500 - Math.abs(x - 400) * 0.25))
        return { n: [gx, -0.4, 0.6], k: 0.55 };
      if (Math.abs(x - 400) < 50 && y > 450 && y < 580) return { n: [(x - 400) / 60, 0.1, 0.9], k: 0.8 };   // neck
      if (y > 540) {
        var u = clamp((y - 540) / 150, 0, 1), half = 64 + 196 * (u * u * (3 - 2 * u)) + Math.max(0, y - 700) * 0.12;   // shoulders sloping down from the neck, the body widening a little below
        if (Math.abs(x - 400) < half) { var tx = (x - 400) / half; return { n: [tx, -0.25 + 0.2 * (1 - u), Math.sqrt(Math.max(0, 1 - tx * tx))], k: 0.9 }; }
      }
      return null;
    }
    for (var y = 120; y < H; y += 8.5) for (var x = 40; x < W - 40; x += 8.5) {
      var px = x + (rnd() - 0.5) * 6, py = y + (rnd() - 0.5) * 6, s = shape(px, py);
      if (!s) continue;
      var n = s.n, nl = Math.hypot(n[0], n[1], n[2]) || 1, d = Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / nl);
      var rim = Math.pow(clamp(1 - n[2] / nl, 0, 1), 2.2) * (n[0] > 0 ? 1 : 0.35);
      dots.push({ x: px, y: py, b: s.k * (0.18 + 0.82 * d), rim: rim, ph: rnd() * 6.283 });
    }
    var draw = function (time) {
      cx.clearRect(0, 0, W, H);
      var band = ((time * 0.11) % 1.4) * H - 0.2 * H;
      for (var i = 0; i < dots.length; i++) {
        var p = dots[i], tw = reduce ? 1 : 0.86 + 0.14 * Math.sin(time * 1.4 + p.ph);
        var scan = reduce ? 0 : 0.45 * Math.exp(-Math.pow((p.y - band) / 46, 2));
        var b = clamp(p.b * tw + scan * 0.6, 0, 1.2), r = 0.7 + 2.4 * Math.min(1, b + p.rim * 0.5);
        var m = clamp(p.rim * 1.3 + scan * 0.5, 0, 1);
        cx.fillStyle = "rgba(" + Math.round(190 + 50 * m) + "," + Math.round(214 - 48 * m) + "," + Math.round(255 - 181 * m) + "," + clamp(0.18 + 0.8 * b + p.rim * 0.4, 0, 1).toFixed(3) + ")";
        cx.beginPath(); cx.arc(p.x, p.y, r, 0, 6.283); cx.fill();
      }
    };
    var visible = false, t0 = performance.now(), last = 0;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: "200px" }).observe(cv);
    else visible = true;
    draw(0);
    if (!reduce) (function loop(now) {
      requestAnimationFrame(loop);
      if (!visible || now - last < 33) return; last = now;
      draw((now - t0) / 1000);
    })(t0);
  }
})();
