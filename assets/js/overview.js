// The services overview: one circuit board between the services film and VISION (styles: assets/css/overview.css,
// content: assets/js/overview-data.js). AEC PRISM is the chip in the middle; the phases stand in the four quarters,
// each with its roles and, out from every role, its work as words on one trace (what has to be done -> what the AI
// does -> what comes out). Every part has its place once and for all: choosing a chip only flies the view to it.
// The words on the traces show when a role is chosen; before that the traces are lines of light.
// The board can be held with the left button and moved, at any zoom.
// The film behind is the page's own (main.js): this section is tall and its stage stays put; the film holds still for
// that time (the .ovw-hold mark in the page) and turns on towards VISION afterwards. The board fades in as its stage
// arrives and out before VISION.
(function () {
  "use strict";
  var sec = document.getElementById("overview"), DATA = window.OVERVIEW_DATA, EN = window.OVERVIEW_EN || {};
  if (!sec || !DATA) return;
  var pin = sec.querySelector(".ovw-pin"), scene = document.getElementById("ovwScene"), tiltEl = document.getElementById("ovwTilt"), world = document.getElementById("ovwWorld");
  var fx = document.getElementById("ovwFx"), g = fx.getContext("2d"), mini = document.getElementById("ovwMini"), mg = mini.getContext("2d");
  var crumb = document.getElementById("ovwCrumb"), hint = document.getElementById("ovwHint"), sheet = document.getElementById("ovwSheet"), legend = document.getElementById("ovwLegend");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, PH = false, DPR = 1, focus = null, en = false, vis = 0, shown = false, drag = null, dragged = false;
  var INK = "13,27,61", AMB = "240,166,74";
  // Each quarter has a colour of its own, from the site's palette and its near neighbours: amber for development (the
  // land), blue for design (the drawing), teal for building, violet for operations. Chips are tinted with it, traces
  // and rows are drawn in it; within a row the three stretches are the same colour at three strengths.
  var PCOL = ["214,150,54", "66,133,244", "38,160,148", "133,108,226"], STR = [0.4, 0.7, 1], STR_HOT = [0.62, 0.86, 1];
  function deep(c) { return "rgb(" + c.split(",").map(function (v) { return Math.round(+v * 0.5 + 8); }).join(",") + ")"; } // the colour, dark enough to read as words
  var FONT = '"PRISM Text", "Noto Sans TC", sans-serif', MONO = '"JetBrains Mono", ui-monospace, Consolas, monospace';
  function tr(s) { return en ? (EN[s] || s) : s; }

  // ---- the board: every part has its place once and for all (board units; the middle of AEC PRISM is 0,0) ----
  // The quarters go clockwise from the top left (develop, design, build, operate). Nothing is on a strict grid: each
  // phase stands a little differently, the roles step in and out down their column, and the rows of work are as long
  // as their words, so the board reads as something routed by hand, with room between its parts.
  var QUAD = [[-1, -1], [1, -1], [1, 1], [-1, 1]], PHASE = [[560, 370], [610, 330], [545, 395], [620, 345]];
  var STEP = [0, 170, 50, 215, 105], JIT = [0, -14, 16, -8, 10], PITCH = 300, ROW = 56, INDENT = [0, 30, 10, 40], FS = 16;
  var chips = [], links = [], rows = [], idx = 0;
  function chip(key, parent, depth, cls, x, y, w, h, html) {
    var el = document.createElement("button"); el.type = "button"; el.className = "ov-n " + cls;
    el.style.cssText = "left:" + (x - w / 2) + "px;top:" + (y - h / 2) + "px;width:" + w + "px;height:" + h + "px;--sd:" + (6 + (idx * 7 % 6) * 0.8) + "s;--fo:" + (-(idx * 1.37) % 9).toFixed(2) + "s";
    el.innerHTML = '<span class="ov-f"><span>' + html + "</span></span>"; idx++;
    world.appendChild(el);
    var n = { el: el, key: key, parent: parent, depth: depth, x: x, y: y, w: w, h: h, kids: [] };
    if (parent) parent.kids.push(n);
    el.addEventListener("click", function (e) { e.stopPropagation(); if (dragged) { dragged = false; return; } go(n === focus && n.parent ? n.parent : n); });
    chips.push(n);
    return n;
  }
  function sgn(v) { return v < 0 ? -1 : 1; }
  // a trace the way a board is routed: out along x, a 45-degree turn into a lane, along the lane, a 45-degree turn out
  function elbow(S, E, lane) {
    var sx = sgn(E[0] - S[0]), sy = sgn(E[1] - S[1]), dy = Math.abs(E[1] - S[1]);
    if (dy < 0.5) return [S, E];
    var d = Math.min(26, dy / 2);
    return [S, [lane - sx * d, S[1]], [lane, S[1] + sy * d], [lane, E[1] - sy * d], [lane + sx * d, E[1]], E];
  }
  function link(a, b, pts, o) { var l = { a: a, b: b, pts: pts, ph: (links.length * 0.37) % 1, sp: 0.1 + (links.length * 13 % 7) * 0.012, on: 0 }; for (var k in o) l[k] = o[k]; links.push(l); return l; }
  function bundle(a, b, n, gap, mk, o) { for (var w = 0; w < n; w++) { var q = { lw: o.lw, col: o.col }; if (w !== Math.floor(n / 2)) q.quiet = true; link(a, b, mk((w - (n - 1) / 2) * gap), q); } }

  var root = chip("AEC PRISM", null, 0, "root", 0, 0, 620, 620, '<img class="ov-mark" src="assets/img/logo-mark.png" alt=""><img class="ov-word" src="assets/img/logo-word.png" alt="AEC PRISM">');
  var EXT = { x: 0, y: 0 }; // how far the board reaches from the middle
  DATA.forEach(function (P, q) {
    var sx = QUAD[q][0], sy = QUAD[q][1], px = PHASE[q][0], py = PHASE[q][1];
    var p = chip(P.n, root, 1, "phase", sx * px, sy * py, 300, 300, '<span class="ov-lb"></span><small></small>');
    p.sx = sx; p.sy = sy; p.far = 0; p.wide = 0; p.count = P.roles.length; p.unit = "個角色"; p.col = PCOL[q]; p.el.style.setProperty("--c", p.col);
    // five traces from AEC PRISM, side by side all the way
    bundle(root, p, 5, 9, function (o) { return elbow([sx * 310, sy * (76 + o)], [sx * (px - 150), sy * (py + o)], sx * ((310 + px - 150) / 2 - o)); }, { lw: 1, col: PCOL[q] });
    var n = P.roles.length;
    P.roles.forEach(function (R, k) {
      var rx = 1040 + STEP[k], ry = 160 + PITCH * k + JIT[k];
      var r = chip(R[0], p, 2, "role", sx * rx, sy * ry, 280, 96, '<span class="ov-lb"></span><small></small>');
      r.sx = sx; r.sy = sy; r.rows = []; r.count = R[1].length; r.unit = "項工作"; r.col = PCOL[q]; r.el.style.setProperty("--c", r.col);
      // the bus from the phase: the wires keep side by side through both turns; the farthest role takes the nearest lane
      var s0 = py + (k - (n - 1) / 2) * 30, out = ry > s0 ? 1 : -1, lane = out > 0 ? px + 190 + (n - 1 - k) * 16 : px + 190 + n * 16 + k * 16;
      bundle(p, r, 3, 5, function (o) { return elbow([sx * (px + 150), sy * (s0 + out * o)], [sx * (rx - 140), sy * (ry + out * o)], sx * (lane - out * o)); }, { lw: 0.9, col: PCOL[q] });
      R[1].forEach(function (row, i) {
        var m = R[1].length, y = sy * ry + (i - (m - 1) / 2) * ROW, x0 = rx + 140 + 74 + INDENT[i % 4];
        var rw = { role: r, i: i, t: row, y: y, x0: x0, sx: sx, cuts: null };
        rows.push(rw); r.rows.push(rw);
        rw.link = link(r, rw, elbow([sx * (rx + 140), sy * ry + (i - (m - 1) / 2) * 13], [sx * x0, y], sx * (rx + 140 + 26 + (1.5 - Math.abs(i - (m - 1) / 2)) * 9)), { lw: 0.8, row: rw, col: PCOL[q] });
      });
      p.far = Math.max(p.far, ry + 150);
    });
  });
  // the names on the chips, in the page's language
  function label() {
    chips.forEach(function (n) {
      if (!n.depth) return;
      n.el.querySelector(".ov-lb").textContent = tr(n.key);
      n.el.querySelector("small").textContent = n.count + " " + tr(n.unit);
    });
  }
  // how long each row is: as long as its words (measured again when the type has loaded, and when the language changes)
  function measure() {
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = "400 " + FS + "px " + FONT;
    EXT.x = 0; EXT.y = 0;
    chips.forEach(function (n) { if (n.depth === 1) n.wide = 0; });
    rows.forEach(function (rw) {
      var x = rw.x0; rw.cuts = [x];
      rw.t.forEach(function (t) { x += 38 + g.measureText(tr(t)).width + 40; rw.cuts.push(x); });
      rw.end = x; rw.link.L = null;
      rw.link.pts = rw.link.pts.slice(0, rw.link.elb || (rw.link.elb = rw.link.pts.length)).concat([[rw.sx * x, rw.y]]);
      rw.role.parent.wide = Math.max(rw.role.parent.wide, x);
      EXT.x = Math.max(EXT.x, x); EXT.y = Math.max(EXT.y, Math.abs(rw.y) + 60);
    });
  }
  // the board's own dim traces, so it is not empty between the chips
  var deco = [];
  (function () {
    var s = 20261112, R = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (var i = 0; i < 34; i++) {
      var x0 = (R() - 0.5) * 5200, y0 = (R() - 0.5) * 3400, hz = R() > 0.5, a = 160 + R() * 520, b = 50 + R() * 140, s1 = R() > 0.5 ? 1 : -1, s2 = R() > 0.5 ? 1 : -1, e = 100 + R() * 380;
      deco.push({ pts: hz ? [[x0, y0], [x0 + s1 * a, y0], [x0 + s1 * (a + b), y0 + s2 * b], [x0 + s1 * (a + b + e), y0 + s2 * b]] : [[x0, y0], [x0, y0 + s1 * a], [x0 + s2 * b, y0 + s1 * (a + b)], [x0 + s2 * b, y0 + s1 * (a + b + e)]], ph: R(), sp: 0.04 + R() * 0.05, lit: i % 3 === 0 });
    }
  })();

  // ---- the view: where it looks and how close; it eases to wherever the chosen chip asks ----
  var cam = { x: 0, y: 0, z: 0.3 }, tgt = { x: 0, y: 0, z: 0.3 }, tilt = 8, tiltT = 8, ta = 0;
  function frameBox(x0, y0, x1, y1) {
    var top = PH ? 150 : 150, bot = PH ? 46 : 70, side = PH ? 14 : 70, bw = Math.abs(x1 - x0), bh = Math.abs(y1 - y0);
    var z = Math.min((W - side * 2) / bw, (H - top - bot) / bh);
    tgt.z = z; tgt.x = (x0 + x1) / 2; tgt.y = (y0 + y1) / 2 - (top - bot) / 2 / z;
  }
  // k times closer than the frame just set, looking at board point (x, y) (kept clear of the title and the bottom line)
  function closer(k, x, y) { tgt.z *= k; tgt.x = x; tgt.y = y - (150 - 70) / 2 / tgt.z; }
  function clampView() { var mx = EXT.x + 200, my = EXT.y + 200; tgt.x = Math.max(-mx, Math.min(mx, tgt.x)); tgt.y = Math.max(-my, Math.min(my, tgt.y)); }
  function aim() {
    var f = focus, d = f.depth;
    // The whole board would be too small to read, so the first view is closer than that: AEC PRISM, the phases and the
    // roles at a readable size, the far ends of the rows and the outer roles running off the screen (the board can be
    // dragged). A phase is framed the same way, a little closer than its whole quarter.
    if (d === 0) { if (PH) frameBox(-800, -560, 800, 560); else { frameBox(-EXT.x - 40, -EXT.y, EXT.x + 40, EXT.y); closer(1.6, 0, 0); } tiltT = PH ? 3 : 8; }
    else if (d === 1) { if (PH) frameBox(f.sx * 400, f.sy * 40, f.sx * 1420, f.sy * f.far); else { frameBox(f.sx * 360, f.sy * 30, f.sx * (f.wide + 40), f.sy * f.far); closer(1.3, f.sx * 1180, f.sy * (f.far * 0.5 + 40)); } tiltT = PH ? 2 : 5; }
    else if (PH) { tgt.z = 0.92; tgt.x = f.x; tgt.y = f.y + (H * 0.5 - 220) / tgt.z; tiltT = 0; }
    else { var e = 0; f.rows.forEach(function (r) { e = Math.max(e, r.end); }); frameBox(f.x - f.sx * 220, f.y - 210, f.sx * (e + 60), f.y + 190); tiltT = 0; }
  }

  function render() {
    aim();
    var path = [];
    for (var p = focus; p; p = p.parent) path.push(p);
    chips.forEach(function (n) { n.el.classList.toggle("cur", n === focus && n.depth > 0); });
    links.forEach(function (l) { l.path = (path.indexOf(l.b) >= 0 && path.indexOf(l.a) >= 0) || (!!l.row && l.row.role === focus); });
    scene.classList.toggle("top", focus.depth === 0);
    mini.classList.toggle("on", focus.depth > 0); legend.classList.toggle("on", focus.depth === 2);
    crumb.innerHTML = "";
    path.slice().reverse().forEach(function (n) {
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.textContent = tr(n.key); b.addEventListener("click", function () { go(n); });
      li.appendChild(b); crumb.appendChild(li);
    });
    hint.textContent = tr(PH ? (focus.depth === 0 ? "點任何一顆晶片，靠過去看。" : focus.depth === 1 ? "點一個角色看他的工作；點空白處退回全圖。" : "點空白處退回上一層。")
      : focus.depth === 0 ? "點晶片靠過去看；按住左鍵可以拖動畫面。" : focus.depth === 1 ? "點角色看他的工作；按住左鍵拖動，點空白處退回。" : "按住左鍵拖動；點空白處退回上一層。");
    // a phone: the role's work as a sheet from the bottom
    if (PH && focus.depth === 2) {
      sheet.querySelector("h3").textContent = tr(focus.key); sheet.querySelector("p").textContent = tr(focus.parent.key) + " · " + focus.count + " " + tr(focus.unit);
      sheet.querySelector("ol").innerHTML = "";
      focus.rows.forEach(function (r, i) {
        var li = document.createElement("li");
        r.t.forEach(function (t, c) { var s = document.createElement("span"), tag = document.createElement("i"); tag.textContent = c === 0 ? "0" + (i + 1) : c === 1 ? "AI" : "→"; s.appendChild(tag); s.appendChild(document.createTextNode(tr(t))); li.appendChild(s); });
        sheet.querySelector("ol").appendChild(li);
      });
      sheet.classList.add("on");
    } else sheet.classList.remove("on");
  }

  // ---- drawing (screen pixels) ----
  var V = { x: 0, y: 0, z: 0.3 }; // the view as drawn this frame (the camera, plus the drawing back as the board leaves)
  function sx_(x) { return (x - V.x) * V.z + W / 2; }
  function sy_(y) { return (y - V.y) * V.z + H / 2; }
  function poly(pts, r, n) {
    n = n || pts.length; r = r > 0 ? r : 0; g.beginPath(); g.moveTo(sx_(pts[0][0]), sy_(pts[0][1]));
    for (var i = 1; i < n - 1; i++) g.arcTo(sx_(pts[i][0]), sy_(pts[i][1]), sx_(pts[i + 1][0]), sy_(pts[i + 1][1]), r);
    g.lineTo(sx_(pts[n - 1][0]), sy_(pts[n - 1][1]));
  }
  function seen(pts, m) {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (var i = 0; i < pts.length; i++) { var x = sx_(pts[i][0]), y = sy_(pts[i][1]); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 > -m && x0 < W + m && y1 > -m && y0 < H + m;
  }
  function at(pts, L, d) {
    for (var i = 1; i < pts.length; i++) if (d <= L[i] || i === pts.length - 1) { var q = L[i] - L[i - 1] ? (d - L[i - 1]) / (L[i] - L[i - 1]) : 0; q = q < 0 ? 0 : q > 1 ? 1 : q; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * q, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * q]; }
    return pts[0];
  }
  // a band of light along a trace (lengths in board units): a tail that fades, a bright head
  function band(l, u, tail, rgb, a, wid, glow) {
    if (!l.L) { l.L = [0]; for (var j = 1; j < l.pts.length; j++) l.L.push(l.L[j - 1] + Math.hypot(l.pts[j][0] - l.pts[j - 1][0], l.pts[j][1] - l.pts[j - 1][1])); }
    var L = l.L, tot = L[L.length - 1], d1 = u * (tot + tail), d0 = d1 - tail, N = 6, prev = null;
    g.lineWidth = wid; g.lineCap = "round";
    for (var i = 0; i <= N; i++) {
      var d = d0 + tail * i / N;
      if (d < 0 || d > tot) { prev = null; continue; }
      var p = at(l.pts, L, d), x = sx_(p[0]), y = sy_(p[1]);
      if (prev) { g.strokeStyle = "rgba(" + rgb + "," + (a * Math.pow(i / N, 2)).toFixed(3) + ")"; g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(x, y); g.stroke(); }
      prev = [x, y];
    }
    if (d1 >= 0 && d1 <= tot) {
      var h = at(l.pts, L, d1);
      if (glow) { g.save(); g.shadowColor = "rgba(" + rgb + ",.95)"; g.shadowBlur = 12; }
      g.fillStyle = "rgba(" + rgb + "," + a.toFixed(3) + ")"; g.beginPath(); g.arc(sx_(h[0]), sy_(h[1]), wid * 1.1, 0, 6.2832); g.fill();
      if (glow) g.restore();
    }
  }
  function c01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function sm(x) { x = c01(x); return x * x * (3 - 2 * x); }

  function frame(t) {
    requestAnimationFrame(frame);
    // the board comes up as its stage arrives and is gone again in the last stretch of its stay, before VISION's words
    var r = sec.getBoundingClientRect(), vh = innerHeight, span = Math.max(1, sec.offsetHeight - vh);
    // Leaving is a move, not a cut: over the last 45% of the stay (most of a screen of scroll) the board draws back
    // and drifts up, its traces go dark first, and the chips fade after them.
    var out = sm((-r.top / span - 0.55) / 0.45);
    vis = sm((0.5 * vh - r.top) / (0.42 * vh)) * (1 - sm((out - 0.3) / 0.7));
    if (vis < 0.004) {
      if (shown) { shown = false; pin.style.visibility = "hidden"; if (focus !== root) go(root); cam.x = tgt.x; cam.y = tgt.y; cam.z = tgt.z * 0.9; ta = 0; }
      return;
    }
    if (!shown) { shown = true; pin.style.visibility = ""; }
    pin.style.opacity = vis >= 0.996 ? "" : vis.toFixed(3);

    var k = reduce ? 1 : 0.085;
    cam.x += (tgt.x - cam.x) * k; cam.y += (tgt.y - cam.y) * k; cam.z += (tgt.z - cam.z) * k; tilt += (tiltT - tilt) * 0.07;
    ta += ((focus.depth === 2 ? 1 : 0) - ta) * (reduce ? 1 : 0.09);
    // what is drawn: the view, drawn back and lifted a little as the board leaves
    V.z = cam.z * (1 - 0.16 * out); V.x = cam.x; V.y = cam.y + out * 150 / V.z;
    var z = V.z, la = 1 - sm(out * 1.5);
    fx.style.opacity = la >= 0.996 ? "" : la.toFixed(3);
    world.style.transform = "translate(" + (W / 2).toFixed(2) + "px," + (H / 2).toFixed(2) + "px) scale(" + z.toFixed(5) + ") translate(" + (-V.x).toFixed(2) + "px," + (-V.y).toFixed(2) + "px)";
    tiltEl.style.transform = "rotateX(" + (tilt + (reduce ? 0 : Math.sin(t * 0.0003) * 0.5)).toFixed(3) + "deg)";

    g.setTransform(DPR, 0, 0, DPR, 0, 0); g.clearRect(0, 0, W, H);
    g.lineJoin = "round"; g.lineCap = "round";
    g.lineWidth = Math.max(0.7, 1.4 * z); g.strokeStyle = "rgba(" + INK + ",.075)";
    deco.forEach(function (d) { if (!seen(d.pts, 20)) return; poly(d.pts, 14 * z); g.stroke(); if (d.lit && !reduce) band(d, ((t * 0.001 * d.sp + d.ph) % 1) * 1.5 - 0.1, 240, "63,125,255", 0.3, Math.max(1, 2.2 * z)); });

    // the traces between the chips, in their quarter's colour (full strength on the way to the chosen chip); light along them
    links.forEach(function (l) {
      l.on += ((l.path ? 1 : 0) - l.on) * 0.1;
      if (l.row || !seen(l.pts, 30)) return;
      var warm = l.on > 0.5;
      g.lineWidth = Math.max(0.75, (l.lw + (warm ? 0.5 : 0)) * 2 * z);
      g.strokeStyle = "rgba(" + l.col + (warm ? ",1)" : ",.55)");
      poly(l.pts, 12 * z); g.stroke();
      var e = l.pts[l.pts.length - 1]; g.fillStyle = "rgba(" + l.col + (warm ? ",1)" : ",.8)"); g.beginPath(); g.arc(sx_(e[0]), sy_(e[1]), Math.max(1.2, 3.4 * z), 0, 6.2832); g.fill();
      if (!reduce && !l.quiet) band(l, ((t * 0.001 * l.sp + l.ph) % 1) * 1.7 - 0.2, 150, l.col, warm ? 1 : 0.9, Math.max(1.3, (warm ? 3.4 : 2.8) * z), warm);
    });

    // the work of each role: one trace out of the chip, in its quarter's colour, its three stretches at three strengths (what has to be
    // done, what the AI does, what comes out), the words standing on it once a role is chosen. No plates: words and light.
    var mono = "500 " + (10.5 * z).toFixed(2) + "px " + MONO, text = "400 " + (FS * z).toFixed(2) + "px " + FONT;
    g.textBaseline = "alphabetic";
    rows.forEach(function (rw) {
      var l = rw.link, c = rw.cuts; if (!c) return;
      var xa = sx_(rw.sx * c[0]), xb = sx_(rw.sx * c[3]), y = sy_(rw.y);
      if (Math.max(xa, xb) < -60 || Math.min(xa, xb) > W + 60 || y < -40 || y > H + 40) return;
      var hot = rw.role === focus, lw = Math.max(0.8, (hot ? 2 : 1.5) * z), col = l.col, st = hot ? STR_HOT : STR, dk = deep(col);
      // from the chip to where the words begin
      g.lineWidth = lw; g.strokeStyle = "rgba(" + col + "," + st[0] + ")"; poly(l.pts, 12 * z, l.elb); g.stroke();
      for (var s = 0; s < 3; s++) {
        var x0 = sx_(rw.sx * c[s]), x1 = sx_(rw.sx * c[s + 1]);
        if (hot) { g.save(); g.shadowColor = "rgba(" + col + ",.9)"; g.shadowBlur = 10 * Math.min(1, z + 0.3); }
        g.lineWidth = lw * (1 + s * 0.25); g.strokeStyle = "rgba(" + col + "," + st[s] + ")"; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
        // the joint where one stretch hands over to the next
        g.fillStyle = "rgb(" + col + ")"; g.globalAlpha = st[s]; g.beginPath(); g.arc(x0, y, Math.max(1.3, (hot ? 4.6 : 3.6) * z), 0, 6.2832); g.fill(); g.globalAlpha = 1;
        if (hot) g.restore();
        if (ta > 0.01) {
          var right = rw.sx > 0, tag = s === 0 ? "0" + (rw.i + 1) : s === 1 ? "AI" : "→";
          // (a soft halo of paper round the words: they stand over the film)
          g.save(); g.shadowColor = "rgba(246,244,238,.95)"; g.shadowBlur = 7;
          g.globalAlpha = ta * (hot ? 1 : 0.8); g.textAlign = right ? "left" : "right";
          g.font = mono; g.fillStyle = dk; g.fillText(tag, x0 + (right ? 12 : -12) * z, y - 9 * z);
          g.font = text; g.fillStyle = s === 0 ? "rgb(" + INK + ")" : dk; g.fillText(tr(rw.t[s]), x0 + (right ? 38 : -38) * z, y - 8.5 * z);
          g.restore();
        }
      }
      // where the row ends: what you get
      g.fillStyle = "rgb(" + col + ")"; g.beginPath(); g.arc(xb, y, Math.max(1.5, (hot ? 5.4 : 4.2) * z), 0, 6.2832); g.fill();
      if (!reduce) {
        var u = ((t * 0.001 * l.sp * 1.5 + l.ph) % 1) * 1.6 - 0.15;
        band(l, u, 170, col, hot ? 1 : 0.85, Math.max(1.3, (hot ? 3.6 : 2.6) * z), hot);
        if (hot) band(l, (u + 0.45) % 1.6 - 0.15, 120, col, 0.9, Math.max(1.3, 3 * z), true);
      }
    });
    g.textAlign = "left";
    drawMini();
  }

  // ---- the small map ----
  function drawMini() {
    if (PH || !focus.depth) return;
    var mw = 372, mh = 236, bw = (EXT.x + 120) * 2, bh = (EXT.y + 80) * 2, s = Math.min(mw / bw, mh / bh), ox = mw / 2, oy = mh / 2;
    mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, mw, mh);
    mg.strokeStyle = "rgba(" + INK + ",.3)"; mg.lineWidth = 1; mg.beginPath();
    rows.forEach(function (r) { mg.moveTo(ox + r.sx * r.x0 * s, oy + r.y * s); mg.lineTo(ox + r.sx * r.end * s, oy + r.y * s); }); mg.stroke();
    chips.forEach(function (n) { mg.fillStyle = n.depth === 0 ? "#12265e" : "rgba(" + n.col + (n === focus || n === focus.parent ? ",1)" : ",.6)"); mg.fillRect(ox + (n.x - n.w / 2) * s, oy + (n.y - n.h / 2) * s, n.w * s, n.h * s); });
    var vw = W / cam.z, vh = H / cam.z;
    mg.strokeStyle = "#12265e"; mg.lineWidth = 3; mg.strokeRect(ox + (cam.x - vw / 2) * s, oy + (cam.y - vh / 2) * s, vw * s, vh * s);
    mini._s = s;
  }
  mini.addEventListener("click", function (e) {
    var r = mini.getBoundingClientRect(), s = (mini._s || 0.04) * r.width / 372, x = (e.clientX - r.left - r.width / 2) / s, y = (e.clientY - r.top - r.height / 2) / s;
    if (Math.abs(x) < 400 && Math.abs(y) < 330) return go(root);
    go(root.kids.filter(function (p) { return p.sx === sgn(x) && p.sy === sgn(y); })[0] || root);
  });

  function size() {
    W = pin.clientWidth || innerWidth; H = pin.clientHeight || innerHeight; PH = W < 760; DPR = Math.min(2, window.devicePixelRatio || 1);
    fx.width = Math.round(W * DPR); fx.height = Math.round(H * DPR);
  }
  function go(n) { focus = n; render(); }
  function relang() { en = document.documentElement.lang === "en"; label(); measure(); render(); }
  scene.addEventListener("click", function () { if (dragged) { dragged = false; return; } if (focus.parent) go(focus.parent); });
  // holding the left button (or a finger, sideways) moves the board, at any zoom; a press that does not move is a click
  scene.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: tgt.x, cy: tgt.y, on: false }; dragged = false;
  });
  addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) { if (Math.hypot(dx, dy) < 5) return; drag.on = true; dragged = true; scene.classList.add("drag"); }
    tgt.x = drag.cx - dx / cam.z; tgt.y = drag.cy - dy / cam.z; clampView();
    cam.x = tgt.x; cam.y = tgt.y; // the board stays under the pointer
  });
  function drop(e) { if (drag && e.pointerId === drag.id) { drag = null; scene.classList.remove("drag"); } }
  addEventListener("pointerup", drop); addEventListener("pointercancel", drop);
  document.getElementById("ovwSheetX").addEventListener("click", function () { if (focus.parent) go(focus.parent); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && shown && focus.parent) go(focus.parent); });
  addEventListener("resize", function () { size(); render(); });
  // the page's language (main.js sets it on <html>)
  if (window.MutationObserver) new MutationObserver(relang).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  // for testing: PRISM_OVERVIEW.go("開發") or .go("開發", "建築師") or .go()
  window.PRISM_OVERVIEW = { go: function (p, r) { var a = root.kids.filter(function (k) { return k.key === p; })[0]; var b = a && r ? a.kids.filter(function (k) { return k.key === r; })[0] : null; go(b || a || root); }, state: function () { return { depth: focus.depth, vis: +vis.toFixed(3), z: +cam.z.toFixed(3), words: +ta.toFixed(2) }; } };

  focus = root; pin.style.visibility = "hidden"; size(); relang();
  cam.x = tgt.x; cam.y = tgt.y; cam.z = tgt.z * 0.9;
  requestAnimationFrame(frame);
  // the rows are as long as their words: measure again once the type is in
  if (document.fonts && document.fonts.load) document.fonts.load(FS + 'px "PRISM Text"').then(function () { measure(); render(); });
})();
