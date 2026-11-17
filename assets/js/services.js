// The services (stations 5-9) over the rendered storyboard: an overview, then four service lines as an AI workspace.
// The scene keeps the left of the screen and follows the scroll (the player, main.js). On the right (x 56%-96%; on
// phones below the picture) each line (index.html .svl) has a column that plays by itself once the line is on screen:
// the line's name and decision question, your team's request typed into a dark bubble, then the AI's panel under it:
// the AI team members the request takes start one by one (spinning, then ticked, with what each did), the answer
// streams out under them (assets/js/services-data.js: a conclusion, findings, a small table, a recommendation), then
// the documents you receive as cards (each opens the line's pop-up: the storyboard, or assets/video/svc-<line>.mp4).
// The panel keeps one height and scrolls inside (it follows the stream until the visitor moves it); after a pause the
// next of the line's three requests plays, or at the small switch in the bubble.
// The scene reacts on a canvas over the left, by the play and not by the scroll: a pale scan band over the building
// (or the lots) while the members work, a faint grid and a few data points on it, a leader from the member at work to
// the object it is about, corner brackets once the conclusion is out, a thin sweep from top to bottom when the line
// changes. What the scan lies over (the lots, the site, the building) is what the camera shows, so that is the
// scroll's. The overview's title is set like the positioning line (dark, soft paper halo) beside or above the building
// (with manifest.services.mask it may stand behind the building instead: MASKED_TITLE).
//
// Reads, never writes, window.PRISM_STORY (the player, main.js):
//   .p                 the smoothed film station (line k: from station 4+k, frames from SV_IN to SV_END)
//   .project([x,y,z])  -> [x, y] viewport px, or null       .frameRect() -> the frame on screen { x, y, w, h }
//   .seq / .seqFrame   the sequence and frame on screen     .manifest the story manifest (services, building, anchors)
//   .lineFrame(k, lt) / .lineLt(k, frame) / .svIn / .svEnd (the frames along the camera's path)
(function () {
  "use strict";
  var root = document.getElementById("svc");
  if (!root) return;

  var LINES = ["dev", "design", "build", "ops"], ALL = ["overview", "dev", "design", "build", "ops"];
  // the player's stretches (main.js makeStory): a line plays continuously from SV_IN to SV_END; the
  // player gives its own values and the frame at each point (along the camera's path) once its manifest is in
  var SV_IN = 0, SV_END = 1;
  function svIn() { var v = story().svIn; return typeof v === "number" ? v : SV_IN; }
  function svEnd() { var v = story().svEnd; return typeof v === "number" ? v : SV_END; }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phoneQ = window.matchMedia ? matchMedia("(max-width: 760px)") : { matches: false };
  var fineQ = window.matchMedia ? matchMedia("(hover: hover) and (pointer: fine)") : { matches: false };
  // per line: the object each AI team member's work is about (an id of manifest.services.anchors; "rank1": the
  // first-ranked lot), the storyboard frames the documents' pictures are cut from
  var CFG = {
    dev: { mem: ["rank1", "site", null, "massing", null], shots: [62, 93, 99],
      // the lots' ranks for each of the three requests (all three are on screen while they are ranked, R2's frames 57-70)
      rank: [["lot-a", "lot-b", "lot-c"], ["lot-b", "lot-c", "lot-a"], ["lot-c", "lot-a", "lot-b"]] },
    design: { mem: ["height", "sun", "clash", null, null], shots: [117, 123, 129, 135] },
    build: { mem: ["deviation", "progress", "billing", null, null], shots: [147, 153, 158] },
    ops: { mem: [null, "equipment-b", "equipment-a", "priority"], shots: [178, 183, 188] }
  };
  var SCORES = [82, 76, 69], LOT = 43; // the lots' scores by rank; half the side of a lot (m)
  // the play's pace (ms): the pause after the request is typed, a member starting after the one before and how long
  // it works, the pause before the answer, a character of the answer (Chinese says more in each), the pauses between
  // its units and its blocks, the documents coming up
  var TYPE_GAP = 420, MEM_GAP = 430, MEM_RUN = 1150, ANS_GAP = 460, CHAR_ZH = 21, CHAR_EN = 9, UNIT_GAP = 170, BLOCK_GAP = 300, DOC_MS = 900;
  // a finished answer stays up this long before the next request plays (longer for a request the visitor chose at the
  // switch); a touch or a wheel on the panel puts the next request off by TOUCH_HOLD_MS
  // (and the panel moving back up within INPUT_MS of an input on it is the visitor's doing)
  var HOLD_MS = 9000, HOLD_PICKED_MS = 16000, TOUCH_HOLD_MS = 6000, INPUT_MS = 1200;
  var ACC = "240,166,74"; // --acc
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function ss(a, b, x) { x = clamp01((x - a) / (b - a)); return x * x * (3 - 2 * x); }
  function easeOut(x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); }
  function story() { return window.PRISM_STORY || {}; }
  // (the page's own mark: main.js sets it before it calls PRISM_onLang, a frame ahead of PRISM_STORY.lang)
  function isEn() { return document.documentElement.lang === "en"; }
  function man() { return story().manifest || fetched; }
  function svcM() { var m = man(); return m && m.services && Array.isArray(m.services.lines) ? m.services : null; }
  function tx(k) { var el = root.querySelector('.svc-tx [data-k="' + k + '"]'); return el ? el.textContent : ""; }
  function framePath(pat, i) { return pat.replace(/%0(\d)d/, function (_, d) { var s = String(i); while (s.length < +d) s = "0" + s; return s; }); }
  function f1(v) { return v.toFixed(1); }

  // ---------- the lines' timing (manifest.services.lines; steps may be counted from the line's first frame) ----------
  var defCache = {};
  function lineDef(id) {
    var sv = svcM(), key = id + (sv ? "s" : "");
    if (defCache[key]) return defCache[key];
    var L = null, d;
    if (sv) sv.lines.forEach(function (l) { if (l && l.id === id) L = l; });
    if (L && typeof L.start === "number" && typeof L.end === "number") {
      var a = L.start, b = L.end, st = Array.isArray(L.steps) && L.steps.length >= 5 ? L.steps.slice(0, 5).map(Number) : null;
      if (st && !st.every(function (v) { return v >= a && v <= b; })) st = st.map(function (v) { return v + a; });
      if (!st) st = [1, 2, 3, 4, 5].map(function (j) { return a + (b - a) * j / 5; });
      d = { a: a, b: b, st: st };
    } else d = { a: 0, b: 1, st: [0.2, 0.4, 0.6, 0.8, 1] };
    if (sv) defCache[key] = d;
    return d;
  }
  // where a line is at film position p: lt (0..1 over its stretch), the frame, the step on screen (cur 1..5), and how far
  // the AI's steps 2-4 have gone (u 0..1)
  function stateOf(id, p) {
    // the step on screen and how far through its share of the continuous scroll (q). u: how far the film's steps 2-4
    // have got. These say what the camera shows (which lots, the site, the massing); the workspace plays on its own
    // clock and does not read them
    var k = ALL.indexOf(id), lt = p - 4 - k, D = lineDef(id), s = story(), j, q, fr;
    if (typeof s.lineStep === "function") {
      var st = s.lineStep(k, lt);
      j = lt < svIn() ? 1 : st.j; q = lt < svIn() ? 0 : st.q; fr = st.f;
    } else {
      var x = clamp01((lt - svIn()) / (svEnd() - svIn()));
      fr = D.a + (D.b - D.a) * x; j = Math.min(5, 1 + Math.floor(x * 5)); q = clamp01(x * 5 - (j - 1));
    }
    var u = j < 2 ? 0 : j > 4 ? 1 : ((j - 2) + q) / 3;
    return { lt: lt, fr: fr, cur: j, q: q, u: u };
  }
  function lineOfFrame(fi) {
    for (var k = 0; k < ALL.length; k++) { var D = lineDef(ALL[k]); if (fi >= D.a && fi <= D.b) return ALL[k]; }
    return null;
  }

  // ---------- the workspace of each line: a conversation that plays by itself ----------
  // A line's play is a clock (A.t, ms) that runs while the line is on screen. On it: the request is typed into the
  // bubble, the members the request takes start one after another and finish, the answer streams out unit by unit (a
  // unit: a paragraph, a finding, a table row), the documents come up; after a pause the next request plays. What is on
  // screen is a function of A.t alone (applyPlay), so a pause is the clock standing still, and a language switch is the
  // same play put together again.
  var DATA = window.PRISM_SVC || {};
  var arts = {};
  [].forEach.call(root.querySelectorAll(".svl"), function (a) {
    var id = a.dataset.line, svw = a.querySelector(".svw");
    var A = {
      id: id, el: a, svw: svw, blocks: [].slice.call(svw.children),
      ask: a.querySelector(".svw-ask"), typed: a.querySelector(".svw-typed"), asks: [].slice.call(a.querySelectorAll(".svw-asks > span")),
      swap: a.querySelector(".svw-swap"), swapN: a.querySelector(".svw-swap small"),
      ai: a.querySelector(".svw-ai"), call: a.querySelector(".svw-call"), st: a.querySelector(".svw-st"), body: a.querySelector(".svw-body"),
      mem: [].map.call(a.querySelectorAll(".svw-mem li"), function (li, i) { return { li: li, em: li.querySelector("em"), note: li.querySelector("small"), key: CFG[id].mem[i], s: "", t0: 0, t1: 0 }; }),
      ans: a.querySelector(".svw-ans"), out: a.querySelector(".svw-out"), cards: [].slice.call(a.querySelectorAll(".svw-card")),
      dot: document.createElement("i"), dotAt: null,
      opt: 0, T: null, t: 0, q: "", team: [], nodes: [], ni: 0, typeShown: -1, ph: "", outOn: null,
      hold: 0, holdDur: HOLD_MS, heldUntil: 0, swapAt: 0, user: false, setTop: 0, inputAt: -1e9, ft: -1, fb: -1,
      vis: false, on: false, prepped: false, autoK: 0, autoS: ""
    };
    A.dot.className = "sva-dot"; A.dot.setAttribute("aria-hidden", "true");
    A.cards.forEach(function (c, i) { c.style.setProperty("--i", i); c.addEventListener("click", function () { openLine(id, c); }); });
    // "⇄ another request": the next of the three requests (1/3 -> 2/3 -> 3/3 -> 1/3); the one asked for stays up longer
    if (A.swap) A.swap.addEventListener("click", function () { nextAsk(A, true); });
    // the panel scrolls inside. A visitor who moves it back up keeps it (no following until the next request): that is
    // the panel standing higher than the script left it, just after a wheel, a finger, a key or a drag on it (a line
    // re-wrapping can also lower it a little; that is nobody's wish). A touch or a wheel on it also puts off the next
    // request for a while
    A.body.addEventListener("scroll", function () { if (A.body.scrollTop < A.setTop - 2 && performance.now() - A.inputAt < INPUT_MS) A.user = true; }, { passive: true });
    ["touchstart", "touchmove", "wheel", "keydown", "pointerdown"].forEach(function (ev) { A.body.addEventListener(ev, function () { A.inputAt = performance.now(); }, { passive: true }); });
    A.body.addEventListener("pointermove", function (e) { if (e.buttons) A.inputAt = performance.now(); }, { passive: true });
    ["touchstart", "touchmove", "wheel"].forEach(function (ev) { A.body.addEventListener(ev, function () { A.heldUntil = performance.now() + TOUCH_HOLD_MS; }, { passive: true }); });
    arts[id] = A;
  });

  // the answer to a request, as the page's markup: every unit that streams out on its own carries data-u, the lists
  // and tables that hold units data-c (both stay out of the layout until the stream reaches them)
  function answerHTML(L, R) {
    var cell = function (tag) { return function (s) { return "<" + tag + ">" + s + "</" + tag + ">"; }; };
    return '<p class="sva-sum" data-u data-g="' + BLOCK_GAP + '">' + L.sum + "</p>" +
      '<p class="sva-k mono" data-u data-g="120">' + tx("pts") + '</p><ol class="sva-pts" data-c>' + L.pts.map(function (s) { return "<li data-u>" + s + "</li>"; }).join("") + "</ol>" +
      '<p class="sva-k mono" data-u data-g="120">' + L.tk + '</p><table class="sva-t" data-c><thead><tr data-u data-g="100">' + L.th.map(cell("th")).join("") + "</tr></thead><tbody>" +
      L.tr.map(function (r, i) { return "<tr data-u" + (i === R.hi ? ' class="hi"' : "") + ">" + r.map(cell("td")).join("") + "</tr>"; }).join("") + "</tbody></table>" +
      '<div class="sva-rec" data-u><b class="mono">' + tx("rec") + "</b><p>" + L.rec + "</p></div>";
  }
  function charMs(txt) { return /[㐀-鿿]/.test(txt) ? 60 : 26; } // typing, ms a character (Chinese says more in each)
  // the request on screen (A.opt) put together in the page's language, and when each part of it happens (A.T, ms):
  //   type   the request is typed out      team  the members begin (each m.t0 .. m.t1)
  //   ans    the answer begins             sum   its conclusion is out (the scene's brackets come round)
  //   docs   the documents come up         done  the play is over (the pause before the next request begins)
  function build(A) {
    var en = isEn(), R = (DATA[A.id] || [])[A.opt] || null, L = R ? (en ? R.en : R.zh) : null;
    var q = A.asks[A.opt] ? A.asks[A.opt].textContent : "", per = charMs(q), T = { per: per, type: q.length * per };
    A.q = q; A.typeShown = -1; A.ask.setAttribute("aria-label", q);
    A.body.setAttribute("aria-label", tx("reply")); A.body.setAttribute("role", "region");
    // the members this request takes, in the order they start; the others stay out
    var order = R ? R.team : A.mem.map(function (m, i) { return i; }), t = T.type + TYPE_GAP;
    T.team = t; A.team = [];
    A.mem.forEach(function (m, i) {
      var k = order.indexOf(i);
      m.s = ""; m.li.hidden = k < 0; m.li.classList.remove("in", "run", "done"); m.em.textContent = "";
      m.note.textContent = k >= 0 && L ? L.notes[k] || "" : "";
      if (k >= 0) A.team[k] = m;
    });
    A.team.forEach(function (m, k) { m.t0 = T.team + 200 + k * MEM_GAP; m.t1 = m.t0 + MEM_RUN + (k % 2) * 220; t = Math.max(t, m.t1); });
    A.call.textContent = tx("call").replace("{n}", A.team.length);
    // the answer: each unit's text is taken out and put back a few characters at a time
    A.ans.innerHTML = L ? answerHTML(L, R) : ""; A.ans.classList.remove("in");
    A.nodes = []; A.ni = 0; A.dotAt = null;
    t += ANS_GAP; T.ans = t; T.sum = t;
    var cp = en ? CHAR_EN : CHAR_ZH, units = [].slice.call(A.ans.querySelectorAll("[data-u]"));
    units.forEach(function (u, i) {
      var w = document.createTreeWalker(u, NodeFilter.SHOW_TEXT, null), nd, first = true;
      while ((nd = w.nextNode())) {
        var full = nd.nodeValue; if (!full) continue;
        A.nodes.push({ node: nd, full: full, t0: t, per: cp, c: 0, unit: first ? u : null });
        nd.nodeValue = ""; first = false; t += full.length * cp;
      }
      if (i === 0) T.sum = t;
      var nx = units[i + 1], g = u.getAttribute("data-g");
      t += g ? +g : nx && nx.parentNode !== u.parentNode ? BLOCK_GAP : UNIT_GAP;
    });
    T.docs = t; T.done = t + DOC_MS;
    A.cards.forEach(function (c, i) { c.classList.toggle("hl", !!R && R.docs.indexOf(i) >= 0); });
    A.ph = ""; A.outOn = null; A.T = T;
  }
  // everything in the workspace at A.t
  function applyPlay(A) {
    var T = A.T, t = A.t; if (!T) return;
    var n = Math.min(A.q.length, Math.floor(t / T.per));
    if (n !== A.typeShown) { A.typeShown = n; A.typed.textContent = A.q.slice(0, n); }
    A.ask.classList.toggle("idle", t > T.type + 500); // the caret goes once the request has been out a moment
    A.team.forEach(function (m) {
      var s = t >= m.t1 ? "done" : t >= m.t0 ? "run" : "";
      if (s === m.s) return;
      m.s = s; m.li.classList.toggle("in", !!s); m.li.classList.toggle("run", s === "run"); m.li.classList.toggle("done", s === "done");
      m.em.textContent = s ? tx(s) : "";
    });
    var ph = t >= T.done ? "done" : t >= T.ans ? "write" : t >= T.team ? "run" : "idle";
    if (ph !== A.ph) { A.ph = ph; A.st.textContent = tx(ph); ["idle", "run", "write", "done"].forEach(function (c) { A.ai.classList.toggle(c, c === ph); }); }
    A.ans.classList.toggle("in", t >= T.ans);
    // the stream: whole nodes behind the head, the node at the head a few characters further each frame, a small
    // pulsing dot after it
    while (A.ni < A.nodes.length) {
      var N = A.nodes[A.ni];
      if (t < N.t0) break;
      if (N.unit) { N.unit.classList.add("in"); var box = N.unit.closest("[data-c]"); if (box) box.classList.add("in"); N.unit = null; }
      var c = Math.floor((t - N.t0) / N.per) + 1;
      if (c >= N.full.length) { N.node.nodeValue = N.full; A.ni++; continue; }
      if (c !== N.c) { N.c = c; N.node.nodeValue = N.full.slice(0, c); }
      if (A.dotAt !== N) { A.dotAt = N; N.node.parentNode.insertBefore(A.dot, N.node.nextSibling); }
      break;
    }
    if (A.ni >= A.nodes.length && A.dot.parentNode) A.dot.parentNode.removeChild(A.dot);
    var out = t >= T.docs;
    if (out !== A.outOn) { A.outOn = out; A.out.classList.toggle("on", out); }
  }
  // from the top (with reduced motion: the whole request and answer at once, and no moving on by itself)
  function startPlay(A) {
    build(A);
    A.t = reduce ? A.T.done : 0; A.hold = 0; A.user = false; A.setTop = 0; A.body.scrollTop = 0;
    applyPlay(A);
  }
  function stopPlay(A) { A.T = null; A.swapAt = 0; A.body.classList.remove("sw"); }
  // the next of the line's requests: what is up fades for a moment, then the new request types
  function nextAsk(A, picked) {
    A.opt = (A.opt + 1) % Math.max(1, A.asks.length);
    if (A.swapN) A.swapN.textContent = (A.opt + 1) + "／" + A.asks.length;
    A.holdDur = picked ? HOLD_PICKED_MS : HOLD_MS; A.hold = 0; rankKey = "";
    if (reduce || !A.T) { if (A.T) startPlay(A); return; }
    A.swapAt = performance.now() + 220; A.body.classList.add("sw");
  }
  // the language switched: the texts were put back from the dictionaries (main.js), so each play is put together again
  // in the new language (a finished one stays finished, one under way starts over)
  var prevLang = window.PRISM_onLang;
  window.PRISM_onLang = function () {
    if (prevLang) prevLang();
    Object.keys(arts).forEach(function (id) {
      var A = arts[id]; if (!A.T) return;
      var done = A.t >= A.T.done;
      build(A); A.t = done ? A.T.done : 0; applyPlay(A);
      // (the new text has another length: where the panel stands now is not the visitor's doing)
      if (!done) { A.body.scrollTop = 0; A.user = false; }
      A.setTop = A.body.scrollTop;
    });
    rankKey = ""; ovKey = "";
  };

  // the next request waits while the visitor is with this one: the pointer on the column, the keyboard inside it, a
  // finger or a wheel on the panel a moment ago. (The play itself stops only while the tab is hidden or the pop-up is
  // open: an answer frozen half-way under the pointer would read as broken.)
  var fvOK = true;
  try { document.body.matches(":focus-visible"); } catch (e) { fvOK = false; }
  function heldNow(A, now) {
    if (now < A.heldUntil) return true;
    if (fvOK && A.el.querySelector(":focus-visible")) return true;
    if (!ptrOn || !fineQ.matches) return false;
    var r = A.svw.getBoundingClientRect();
    return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
  }
  // one frame of a line's play: the clock, the pause after it, the switch's lower edge filling as the next request
  // comes nearer (--auto), the panel following the stream
  function playTick(A, dt, now) {
    if (A.swapAt) { if (now < A.swapAt) return; A.swapAt = 0; startPlay(A); A.body.classList.remove("sw"); }
    var T = A.T; if (!T) return;
    if (!document.hidden && (!svx || svx.hidden)) {
      if (A.t < T.done) { A.t = Math.min(T.done, A.t + dt); applyPlay(A); }
      else if (!reduce && A.asks.length > 1 && !heldNow(A, now)) { A.hold += dt; if (A.hold >= A.holdDur) nextAsk(A, false); }
    }
    // (the edge runs back to its start quickly, not at once)
    var k = A.t >= T.done ? Math.min(1, A.hold / A.holdDur) : 0;
    A.autoK = k < A.autoK ? (A.autoK - k < 0.004 ? k : A.autoK + (k - A.autoK) * 0.2) : k;
    var s = A.autoK.toFixed(3);
    if (s !== A.autoS) { A.autoS = s; if (A.swap) A.swap.style.setProperty("--auto", s); }
    // the panel keeps to the newest line while the answer grows, until the visitor moves it back up; its content fades
    // at whichever edge has more beyond it (--ft, --fb)
    var b = A.body, max = b.scrollHeight - b.clientHeight, cur = b.scrollTop;
    if (cur < A.setTop - 2 && now - A.inputAt < INPUT_MS) A.user = true;
    if (!A.user && !reduce && max - cur > 0.5) { b.scrollTop = cur + Math.max(1, (max - cur) * 0.16); cur = b.scrollTop; }
    A.setTop = cur;
    var ft = Math.round(Math.max(0, Math.min(18, cur))), fb = Math.round(Math.max(0, Math.min(26, max - cur)));
    if (ft !== A.ft) { A.ft = ft; b.style.setProperty("--ft", ft + "px"); }
    if (fb !== A.fb) { A.fb = fb; b.style.setProperty("--fb", fb + "px"); }
  }
  // the member at work whose object is in the scene (the leader goes from its row to that object), while the AI works
  function linkOf(A) {
    var T = A.T, hit = null;
    if (!T || A.t < T.team || A.t >= T.sum) return null;
    A.team.forEach(function (m) { if (m.key && A.t >= m.t0) hit = m; });
    return hit;
  }

  // ---------- the cards' pictures: a close-up of the scene, cut from the storyboard frame of that step ----------
  function camProj(fi) {
    var sv = svcM(), m = man(), cam = sv && sv.camera, c = cam && Array.isArray(cam.frames) ? cam.frames[fi] : null;
    if (!c || !c.p || !c.t || typeof c.fov !== "number") return null;
    var up = cam.up || [0, 1, 0], asp = (sv.w || m.w || 1600) / (sv.h || m.h || 900), sh = c.shift || cam.shift || [0, 0];
    var sub = function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }, dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
    var crs = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    var nrm = function (a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    var f = nrm(sub(c.t, c.p)), r = nrm(crs(f, up)), u = crs(r, f), k = 1 / Math.tan(c.fov * Math.PI / 360);
    return function (X) {
      var d = sub(X, c.p), z = dot(d, f);
      if (!(z > 0.01)) return null;
      return [(k / asp * dot(d, r) / z - 2 * sh[0] + 1) / 2, (1 - (k * dot(d, u) / z - 2 * sh[1] * asp)) / 2];
    };
  }
  function prepCards(A) {
    var sv = svcM();
    if (A.prepped || !sv || typeof sv.pattern !== "string") return;
    A.prepped = true;
    A.cards.forEach(function (c, i) {
      var fi = CFG[A.id].shots[i], cv = c.querySelector("canvas");
      if (sv.sourceFrameMap && sv.sourceFrameMap[fi] !== undefined) fi = sv.sourceFrameMap[fi];
      if (typeof fi !== "number" || !cv) return;
      var img = new Image();
      img.onload = function () {
        var iw = img.naturalWidth, ih = img.naturalHeight, pr = camProj(fi), x0 = 1, y0 = 1, x1 = 0, y1 = 0, n = 0;
        if (pr) subjectWorld(A.id, stateAtFrame(A.id, fi)).pts.forEach(function (X) {
          var q = pr(X); if (!q) return;
          n++; x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]);
        });
        // the subject with a margin, widened to 4:3, never smaller than a third of the frame
        var cxp = n ? (x0 + x1) / 2 * iw : iw / 2, cyp = n ? (y0 + y1) / 2 * ih : ih / 2;
        var w = n ? Math.max((x1 - x0) * iw * 1.35, (y1 - y0) * ih * 1.35 * 4 / 3) : iw * 0.6;
        w = Math.max(iw / 3, Math.min(iw, w)); var h = w * 3 / 4;
        if (h > ih) { h = ih; w = h * 4 / 3; }
        var sx = Math.max(0, Math.min(iw - w, cxp - w / 2)), sy = Math.max(0, Math.min(ih - h, cyp - h / 2));
        cv.width = 400; cv.height = 300;
        var g = cv.getContext("2d"); g.imageSmoothingQuality = "high";
        g.drawImage(img, sx, sy, w, h, 0, 0, 400, 300);
      };
      img.src = framePath(sv.pattern, fi);
    });
  }
  function stateAtFrame(id, fi) {
    var D = lineDef(id), done = D.st.filter(function (v) { return v <= fi + 0.001; }).length, cur = Math.min(5, done + 1);
    return { fr: fi, cur: cur, u: cur < 2 ? 0 : clamp01((fi - D.st[0]) / Math.max(1e-6, D.st[3] - D.st[0])) };
  }

  // ---------- the subject in the world: the building (or the lots and the site), its faces, grid and data points ----------
  var bld = null;
  function building() {
    if (bld) return bld;
    var m = man(), B = m && m.building;
    if (!B || !Array.isArray(B.outline)) return null;
    var holes = B.holes || [], polys = B.outline.filter(function (pl, j) { return holes.indexOf(j) < 0 && Array.isArray(pl) && pl.length > 2; });
    var inside = function (pl, x, z) {
      var c = false;
      for (var i = 0, j = pl.length - 1; i < pl.length; j = i++) {
        var a = pl[i], b = pl[j];
        if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
      }
      return c;
    };
    var faces = [];
    polys.forEach(function (pl, pi) {
      var area = 0;
      pl.forEach(function (v, i) { var w = pl[(i + 1) % pl.length]; area += v[0] * w[1] - w[0] * v[1]; });
      pl.forEach(function (v, i) {
        var w = pl[(i + 1) % pl.length], dx = w[0] - v[0], dz = w[1] - v[1], len = Math.hypot(dx, dz);
        if (len < 0.5) return;
        var nx = (area > 0 ? dz : -dz) / len, nz = (area > 0 ? -dx : dx) / len, mx = (v[0] + w[0]) / 2, mz = (v[1] + w[1]) / 2;
        // a wall inside the other block of the union is no facade
        if (polys.some(function (q, qi) { return qi !== pi && inside(q, mx + nx * 0.6, mz + nz * 0.6); })) return;
        faces.push({ a: v, b: w, n: [nx, nz], m: [mx, mz], len: len });
      });
    });
    var y0 = +B.base_y || 0, y1 = +B.parapet_y || +B.roof_y || 45, fh = +B.floor_h || 3.8, lv = [];
    for (var y = y0; y < y1 - 0.5; y += fh) lv.push(y);
    lv.push(y1);
    var pts = [];
    polys.forEach(function (pl) { pl.forEach(function (c) { pts.push([c[0], y0, c[1]]); pts.push([c[0], y1, c[1]]); }); });
    bld = { faces: faces, y0: y0, y1: y1, lv: lv, pts: pts };
    return bld;
  }
  function anchor(line, id) {
    var sv = svcM(), list = sv && sv.anchors && Array.isArray(sv.anchors[line]) ? sv.anchors[line] : [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id && Array.isArray(list[i].world)) return list[i].world;
    return null;
  }
  function lotCenter(id) {
    var w = anchor("dev", id);
    if (w) return w;
    return { "lot-a": [-112, 0.5, -112], "lot-b": [0, 0.5, 0], "lot-c": [224, 0.5, 0], site: [0, 0.5, 0] }[id];
  }
  // world geometry of what the AI is working on at state S: hull points, grid segments, data points (camera: the world
  // position of the camera on screen, to keep to the facades facing it)
  function subjectWorld(id, S, cam) {
    var out = { pts: [], grid: [], dots: [], polys: null };
    if (id === "dev") {
      // the three lots while they are being screened, then the chosen site (and, with the massing, its height)
      var lots = S.cur <= 2 || (S.cur === 3 && S.u < 0.36) ? ["lot-a", "lot-b", "lot-c"] : ["site"];
      out.polys = [];
      lots.forEach(function (lid, li) {
        var c = lotCenter(lid), y = 0.5, pl = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (s) { return [c[0] + s[0] * LOT, y, c[2] + s[1] * LOT]; });
        out.polys.push(pl); pl.forEach(function (X) { out.pts.push(X); });
        for (var g = -LOT; g <= LOT + 0.1; g += LOT / 5) {
          out.grid.push([[c[0] + g, y, c[2] - LOT], [c[0] + g, y, c[2] + LOT]]);
          out.grid.push([[c[0] - LOT, y, c[2] + g], [c[0] + LOT, y, c[2] + g]]);
        }
        [[0, 0], [-0.55, -0.4], [0.5, -0.5], [0.45, 0.5], [-0.4, 0.55]].slice(0, lots.length > 1 ? 3 : 5).forEach(function (s, j) {
          out.dots.push([c[0] + s[0] * LOT, y, c[2] + s[1] * LOT]);
        });
      });
      if (lots.length === 1 && S.cur >= 4) {
        var c = lotCenter("site"), top = (anchor("dev", "result") || [0, 45.6, 0])[1];
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) { out.pts.push([c[0] + s[0] * LOT * 0.7, top, c[2] + s[1] * LOT * 0.7]); });
        out.polys = null; // the site and the massing on it: one hull
      }
      return out;
    }
    var B = building();
    if (!B) return out;
    out.pts = B.pts;
    var vis = B.faces.filter(function (f) { return !cam || (cam[0] - f.m[0]) * f.n[0] + (cam[2] - f.m[1]) * f.n[1] > 0; });
    vis.forEach(function (f, j) {
      var nv = Math.max(1, Math.round(f.len / 6));
      for (var i = 0; i <= nv; i++) {
        var t = i / nv, x = f.a[0] + (f.b[0] - f.a[0]) * t, z = f.a[1] + (f.b[1] - f.a[1]) * t;
        out.grid.push([[x, B.y0, z], [x, B.y1, z]]);
      }
      B.lv.forEach(function (y) { out.grid.push([[f.a[0], y, f.a[1]], [f.b[0], y, f.b[1]]]); });
      // two data points per facade, at floors spread over its height
      [0.3, 0.7].forEach(function (t, q) {
        var lv = B.lv[Math.min(B.lv.length - 2, 2 + ((j * 5 + q * 4) % Math.max(1, B.lv.length - 3)))];
        out.dots.push([f.a[0] + (f.b[0] - f.a[0]) * t + f.n[0] * 0.3, lv + 1.6, f.a[1] + (f.b[1] - f.a[1]) * t + f.n[1] * 0.3]);
      });
    });
    out.dots = out.dots.slice(0, 10);
    return out;
  }

  // ---------- the scene's reaction (a canvas over the left of the screen) ----------
  var fxc = root.querySelector(".svc-fx"), fx = fxc ? fxc.getContext("2d") : null, dpr = 1;
  var aiA = 0, boxA = 0, sweepT0 = -1, lastLine = null, fxDirty = true;
  var px = -1, py = -1, ptrOn = false; // the mouse (the scan's bright spot leans to it; on the column it holds the next request)
  if (!reduce) window.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || !fineQ.matches) return;
    px = e.clientX; py = e.clientY; ptrOn = true;
  }, { passive: true });
  document.addEventListener("pointerleave", function () { ptrOn = false; });

  function hull(P) {
    if (P.length < 3) return P.slice();
    var a = P.slice().sort(function (u, v) { return u[0] - v[0] || u[1] - v[1]; });
    var cr = function (o, u, v) { return (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]); };
    var lo = [], up = [];
    a.forEach(function (p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
    a.slice().reverse().forEach(function (p) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); });
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function poly(g, P) { g.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); }
  // the crosshair on an object: a ring, four ticks, a pin (as the HUD marks were)
  function mark(g, x, y, col, a, pulse) {
    g.save(); g.globalAlpha = a; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1;
    g.shadowColor = "rgba(13,27,61,.7)"; g.shadowBlur = 2;
    if (pulse > 0) { g.globalAlpha = a * (1 - pulse) * 0.6; g.beginPath(); g.arc(x, y, 5 + pulse * 13, 0, 7); g.stroke(); g.globalAlpha = a; }
    g.beginPath(); g.arc(x, y, 5.5, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(x - 11, y); g.lineTo(x - 7.5, y); g.moveTo(x + 7.5, y); g.lineTo(x + 11, y); g.moveTo(x, y - 11); g.lineTo(x, y - 7.5); g.moveTo(x, y + 7.5); g.lineTo(x, y + 11); g.stroke();
    g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill();
    g.restore();
  }

  function drawFx(now, id, S, A, W, H, b, colX, topY) {
    if (!fx) return;
    var d = Math.min(window.devicePixelRatio || 1, 1.5), cw = Math.round(W * d), ch = Math.round(H * d);
    if (fxc.width !== cw || fxc.height !== ch) { fxc.width = cw; fxc.height = ch; }
    dpr = d;
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, cw, ch); fx.setTransform(d, 0, 0, d, 0, 0);
    var tt = now / 1000, phone = phoneQ.matches;
    // the sweep when the line changes: a thin pale band from the top of the screen to the bottom (0.5 s)
    if (sweepT0 > 0) {
      var st = (now - sweepT0) / 520;
      if (st >= 1) sweepT0 = -1;
      else {
        var sy = -30 + (H + 60) * easeOut(st), sa = 1 - st * st * st;
        var gr = fx.createLinearGradient(0, sy - 80, 0, sy + 2);
        gr.addColorStop(0, "rgba(190,222,255,0)"); gr.addColorStop(1, "rgba(190,222,255," + (0.32 * sa).toFixed(3) + ")");
        fx.fillStyle = gr; fx.fillRect(0, sy - 80, W, 82);
        fx.fillStyle = "rgba(255,255,255," + (0.9 * sa).toFixed(3) + ")"; fx.fillRect(0, sy, W, 1);
      }
    }
    if (!id || id === "overview" || !A) return;
    var s = story(), proj = typeof s.project === "function" ? s.project : null;
    if (!proj) return;
    var P = function (X) { var q = proj(X); return q && isFinite(q[0]) && isFinite(q[1]) ? [q[0] - b.left, q[1] - b.top] : null; };
    // the camera of the frame on screen, to keep the grid and the points to the facades facing it
    var sv = svcM(), cam = null;
    if (sv && s.seq === "s" && sv.camera && Array.isArray(sv.camera.frames)) { var cf = sv.camera.frames[s.seqFrame]; cam = cf && cf.p; }
    var G = subjectWorld(id, S, cam);
    var hp = G.pts.map(P).filter(Boolean);
    if (hp.length < 3) return;
    var regions = G.polys ? G.polys.map(function (pl) { var q = pl.map(P); return q.every(Boolean) ? q : null; }).filter(Boolean) : [hull(hp)];
    var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    hp.forEach(function (q) { bx0 = Math.min(bx0, q[0]); by0 = Math.min(by0, q[1]); bx1 = Math.max(bx1, q[0]); by1 = Math.max(by1, q[1]); });
    // only over the scene: left of the workspace (on phones, above it)
    fx.save(); fx.beginPath();
    if (phone) fx.rect(0, 0, W, Math.max(0, topY - 6)); else fx.rect(0, 0, Math.max(0, colX - 20), H);
    fx.clip();
    // the AI at work (the play: from the first member starting until the conclusion is out): grid, scan band, data
    // points; they ease in and out
    var T = A.T, pt = T ? A.t : -1, live = !!T && A.on && S.lt < 0.98;
    var aiOn = live && pt >= T.team && pt < T.sum;
    aiA += ((aiOn ? 1 : 0) - aiA) * (reduce ? 1 : 0.07);
    if (aiA > 0.01) {
      fx.save(); fx.beginPath(); regions.forEach(function (R) { poly(fx, R); }); fx.clip();
      // the faint grid
      fx.strokeStyle = "rgba(110,165,235," + (0.34 * aiA).toFixed(3) + ")"; fx.lineWidth = 0.75; fx.beginPath();
      G.grid.forEach(function (sg) { var a = P(sg[0]), c = P(sg[1]); if (a && c) { fx.moveTo(a[0], a[1]); fx.lineTo(c[0], c[1]); } });
      fx.stroke();
      // the scan band, up and down over the subject; its bright spot leans towards the pointer
      if (!reduce) {
        var span = by1 - by0, yc = by0 + span * (0.5 - 0.5 * Math.cos(tt * 2 * Math.PI / 3.6)), hb = Math.max(16, span * 0.11);
        var g2 = fx.createLinearGradient(0, yc - hb, 0, yc + hb), al = aiA;
        g2.addColorStop(0, "rgba(170,210,255,0)"); g2.addColorStop(0.5, "rgba(170,210,255," + (0.3 * al).toFixed(3) + ")"); g2.addColorStop(1, "rgba(170,210,255,0)");
        fx.fillStyle = g2; fx.fillRect(bx0, yc - hb, bx1 - bx0, hb * 2);
        fx.fillStyle = "rgba(235,246,255," + (0.85 * al).toFixed(3) + ")"; fx.fillRect(bx0, yc - 0.5, bx1 - bx0, 1);
        var hx = (bx0 + bx1) / 2;
        if (ptrOn) hx += (Math.max(bx0, Math.min(bx1, px - b.left)) - hx) * 0.45;
        var rg = fx.createRadialGradient(hx, yc, 0, hx, yc, Math.max(60, (bx1 - bx0) * 0.22));
        rg.addColorStop(0, "rgba(255,255,255," + (0.55 * al).toFixed(3) + ")"); rg.addColorStop(1, "rgba(255,255,255,0)");
        fx.fillStyle = rg; fx.fillRect(hx - 200, yc - hb, 400, hb * 2);
      }
      fx.restore();
      // the data points: a white dot with a faint ring, coming up one by one, breathing lightly
      G.dots.forEach(function (X, i) {
        var q = P(X); if (!q) return;
        var a = aiA * (T ? ss(i * 150, i * 150 + 500, pt - T.team) : 0);
        if (a < 0.02) return;
        var br = reduce ? 1 : 0.78 + 0.22 * Math.sin(tt * 1.7 + i * 1.3);
        fx.save(); fx.shadowColor = "rgba(13,27,61,.55)"; fx.shadowBlur = 2;
        fx.strokeStyle = "rgba(255,255,255," + (0.55 * a * br).toFixed(3) + ")"; fx.lineWidth = 1;
        fx.beginPath(); fx.arc(q[0], q[1], 6.5, 0, 7); fx.stroke();
        fx.fillStyle = "rgba(255,255,255," + (0.95 * a).toFixed(3) + ")"; fx.beginPath(); fx.arc(q[0], q[1], 2.2, 0, 7); fx.fill();
        fx.restore();
      });
    }
    // the conclusion is out: the scan stops, corner brackets come round the subject and stay while the answer is up
    var boxOn = live && pt >= T.sum;
    boxA += ((boxOn ? 1 : 0) - boxA) * (reduce ? 1 : 0.1);
    if (boxA > 0.01) {
      var pd = phone ? 10 : 18, x0 = Math.max(8, bx0 - pd), y0 = Math.max(topY - (phone ? 400 : 0), by0 - pd), x1 = bx1 + pd, y1 = by1 + pd;
      if (!phone) x1 = Math.min(colX - 26, x1); else y1 = Math.min(topY - 12, y1);
      if (x1 - x0 > 30 && y1 - y0 > 30) {
        var L = Math.max(12, Math.min(phone ? 22 : 34, 0.2 * Math.min(x1 - x0, y1 - y0))), k = reduce || !T ? 1 : easeOut(clamp01((pt - T.sum) / 700)); // drawn out as the brackets come
        fx.save(); fx.globalAlpha = boxA; fx.strokeStyle = "rgb(" + ACC + ")"; fx.lineWidth = 1.5; fx.shadowColor = "rgba(13,27,61,.55)"; fx.shadowBlur = 2;
        fx.beginPath();
        var l = L * k;
        fx.moveTo(x0, y0 + l); fx.lineTo(x0, y0); fx.lineTo(x0 + l, y0);
        fx.moveTo(x1 - l, y0); fx.lineTo(x1, y0); fx.lineTo(x1, y0 + l);
        fx.moveTo(x1, y1 - l); fx.lineTo(x1, y1); fx.lineTo(x1 - l, y1);
        fx.moveTo(x0 + l, y1); fx.lineTo(x0, y1); fx.lineTo(x0, y1 - l);
        fx.stroke(); fx.restore();
      }
    }
    // the lots' crosshairs while they are being ranked (their captions are the .svs-tag pills)
    if (id === "dev") rankMarks.forEach(function (r) { mark(fx, r.x, r.y, r.top ? "rgb(" + ACC + ")" : "#fff", r.a, reduce ? 0 : (tt * 0.36 + r.i * 0.3) % 1); });
    fx.restore();
    // the leader from the member at work to its object, drawn out from the panel's edge at that member's row, ending
    // in a crosshair (only while the object is in the picture and the row is in the panel's view)
    var M = linkOf(A);
    if (M && aiA > 0.05) {
      var key = M.key, wpt = key === "rank1" ? lotCenter(CFG.dev.rank[A.opt][0]) : anchor(id, key), q = wpt ? P(wpt) : null;
      var ok = q && q[0] > 12 && q[1] > 12 && q[1] < H - 12 && (phone ? q[1] < topY - 10 : q[0] < colX - 30);
      if (ok) {
        var r = M.li.getBoundingClientRect(), pr = A.ai.getBoundingClientRect(), vr = A.body.getBoundingClientRect(), sx, sy, ex, ey;
        if (phone) {
          sx = Math.max(pr.left - b.left + 16, Math.min(pr.right - b.left - 16, q[0])); sy = pr.top - b.top - 2;
          ex = sx; ey = q[1] + Math.abs(sx - q[0]);
        } else {
          sx = pr.left - b.left - 2; sy = r.top - b.top + Math.min(r.height / 2, 15);
          ey = sy; ex = q[0] + Math.abs(sy - q[1]); if (ex > sx - 24) ex = sx - 24;
        }
        if (r.height > 0 && r.top >= vr.top - 4 && r.bottom <= vr.bottom + 4) {
          var len = Math.hypot(sx - ex, sy - ey) + Math.hypot(ex - q[0], ey - q[1]), kk = reduce ? 1 : easeOut(clamp01((pt - M.t0) / 600)); // drawn out as the member starts
          fx.save(); fx.globalAlpha = Math.min(1, aiA * 1.2); fx.lineWidth = 1; fx.strokeStyle = "rgb(" + ACC + ")";
          fx.shadowColor = "rgba(13,27,61,.6)"; fx.shadowBlur = 2;
          fx.setLineDash([len * kk, len + 2]);
          fx.beginPath(); fx.moveTo(sx, sy); fx.lineTo(ex, ey); fx.lineTo(q[0], q[1]); fx.stroke();
          fx.setLineDash([]); fx.fillStyle = "rgb(" + ACC + ")"; fx.beginPath(); fx.arc(sx, sy, 2, 0, 7); fx.fill();
          fx.restore();
          if (kk > 0.85) mark(fx, q[0], q[1], "rgb(" + ACC + ")", Math.min(1, aiA * 1.2), reduce ? 0 : (tt * 0.4) % 1);
        }
      }
    }
  }

  // ---------- development: the three lots' ranks (they change with the request) ----------
  var tagBox = root.querySelector(".svs-tags"), rankTags = [], rankMarks = [], rankKey = "";
  if (tagBox) for (var ri = 0; ri < 3; ri++) { var tg = document.createElement("p"); tg.className = "svs-tag"; tagBox.appendChild(tg); rankTags.push(tg); }
  function rankTick(S, W, H, b, colX, topY, show) {
    rankMarks = [];
    // up once the site search has finished (the play), while the camera still shows the lots (the scroll)
    var A = arts.dev, on = show && A && A.T && A.team[0] && A.t >= A.team[0].t1 && S.cur <= 3 && !(S.cur === 3 && S.u >= 0.36);
    var order = A ? CFG.dev.rank[A.opt] : [], key = (A ? A.opt : 0) + tx("rank");
    if (key !== rankKey) {
      rankKey = key;
      order.forEach(function (lid, r) {
        var t = rankTags[r]; if (!t) return;
        t.innerHTML = "<b>0" + (r + 1) + "</b>" + tx("rank").replace("{r}", r + 1).replace("{s}", SCORES[r]);
        t.classList.toggle("top", r === 0);
      });
    }
    var s = story(), proj = typeof s.project === "function" ? s.project : null, phone = phoneQ.matches;
    rankTags.forEach(function (t, r) {
      var q = on && proj ? proj(lotCenter(order[r])) : null, vis = false;
      if (q) {
        var x = q[0] - b.left, y = q[1] - b.top;
        vis = x > 10 && y > topY * (phone ? 0 : 1) + 10 && (phone ? y < topY - 10 : x < colX - 40) && y < H - 10;
        if (phone) vis = vis && y > 80;
        if (vis) {
          rankMarks.push({ x: x, y: y, top: r === 0, a: 1, i: r });
          var w = t.offsetWidth, h = t.offsetHeight, tx0 = x + 16, ty0 = y - h - 12;
          if (tx0 + w > (phone ? W - 8 : colX - 30)) tx0 = x - 16 - w;
          tx0 = Math.max(8, tx0); ty0 = Math.max(phone ? 76 : topY, ty0);
          t.style.transform = "translate3d(" + f1(tx0) + "px," + f1(ty0) + "px,0)";
        }
      }
      if (vis !== t.classList.contains("on")) t.classList.toggle("on", vis);
    });
  }

  // ---------- the overview: the big title behind the building ----------
  var ov = root.querySelector(".svo"), ovFg = root.querySelector(".svo-fg"), fg = ovFg ? ovFg.getContext("2d") : null;
  // the title behind the building (drawn back over it with manifest.services.mask), or only in the sky above it. Tried
  // both with R2's frames: the overview's building is a pale see-through glass block, so dark type cut by it reads as
  // broken words; the sky it is (?svotitle=behind shows the other for comparison)
  var MASKED_TITLE = /[?&]svotitle=behind\b/.test(location.search);
  var ovKey = "", fgKey = "", masks = {}, mFrames = {};
  function maskFor(fi) {
    var sv = svcM(), mk = sv && sv.mask;
    if (!mk || typeof mk.pattern !== "string") return null;
    var from = typeof mk.from === "number" ? mk.from : 0, to = typeof mk.to === "number" ? mk.to : from;
    if (!(fi >= from && fi <= to)) return null;
    var M = masks[fi];
    if (!M) {
      M = masks[fi] = { st: 1 };
      var img = new Image();
      img.onload = function () {
        // the mask's alpha marks the building; a mask without alpha (white building on black) gives its brightness
        var c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        var g = c.getContext("2d"); g.drawImage(img, 0, 0);
        try {
          var d = g.getImageData(0, 0, c.width, c.height), px = d.data, opaque = true, i;
          for (i = 3; i < px.length; i += 4 * 97) if (px[i] < 250) { opaque = false; break; }
          if (opaque) { for (i = 0; i < px.length; i += 4) { px[i + 3] = Math.round(px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11); px[i] = px[i + 1] = px[i + 2] = 255; } g.putImageData(d, 0, 0); }
          // the building's highest point (0..1 down the frame), where the title has to stay clear of it
          M.top = -1;
          for (var r = 0; r < c.height && M.top < 0; r += 2) for (var q = 3 + r * c.width * 4; q < (r + 1) * c.width * 4; q += 8) if (px[q] > 128) { M.top = r / c.height; break; }
          // and its left and right edges (0..1 across)
          var xl = c.width, xr = -1;
          for (var r2 = 0; r2 < c.height; r2 += 4) for (var cx2 = 0; cx2 < c.width; cx2 += 2) if (px[(r2 * c.width + cx2) * 4 + 3] > 128) { if (cx2 < xl) xl = cx2; if (cx2 > xr) xr = cx2; }
          M.left = xr >= 0 ? xl / c.width : -1; M.right = xr >= 0 ? xr / c.width : -1;
        } catch (e) {}
        M.cv = c; M.st = 2; ovKey = ""; fgKey = "";
      };
      img.onerror = function () { M.st = 3; };
      img.src = framePath(mk.pattern, fi);
    }
    return M.st === 2 ? M : null;
  }
  function frameImg(fi) {
    var sv = svcM();
    if (!sv || typeof sv.pattern !== "string") return null;
    var F = mFrames[fi];
    if (!F) { F = mFrames[fi] = new Image(); F.onload = function () { fgKey = ""; }; F.src = framePath(sv.pattern, fi); }
    return F.complete && F.naturalWidth ? F : null;
  }
  function overviewTick(p, W, H, b, topY) {
    if (!ov) return;
    // one big line at a time: in once the positioning line has gone (main.js: out by 4.24), whole for most of the
    // overview's stretch, out by 4.92, before the development line's workspace comes up (from 4.94)
    var oa = ss(4.3, 4.42, p) * (1 - ss(4.8, 4.92, p)), on = oa > 0.005;
    if (on !== ov.classList.contains("on")) { ov.classList.toggle("on", on); ov.setAttribute("aria-hidden", on ? "false" : "true"); }
    if (ov._a !== oa) {
      ov._a = oa;
      ov.style.opacity = oa >= 1 ? "" : oa.toFixed(3);
      ov.style.transform = "translate3d(0," + ((1 - ss(4.3, 4.42, p)) * 12).toFixed(2) + "px,0)";
    }
    var s = story(), fi = s.seq === "s" ? s.seqFrame : -1, M = MASKED_TITLE && fi >= 0 && p < 5.3 ? maskFor(fi) : null, F = M ? frameImg(fi) : null;
    var R = M && F && typeof s.frameRect === "function" ? s.frameRect() : null, masked = !!R;
    // the building drawn back over the title, cut out by its mask
    if (fg) {
      var fgOn = masked && p < 5.2;
      if (fgOn) {
        var d = Math.min(window.devicePixelRatio || 1, 1.5), cw = Math.round(W * d), ch = Math.round(H * d);
        if (ovFg.width !== cw || ovFg.height !== ch) { ovFg.width = cw; ovFg.height = ch; fgKey = ""; }
        var k = fi + "|" + [R.x, R.y, R.w, R.h].map(f1).join(",");
        if (k !== fgKey) {
          fgKey = k;
          fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, cw, ch); fg.setTransform(d, 0, 0, d, 0, 0);
          fg.globalCompositeOperation = "source-over"; fg.drawImage(F, R.x - b.left, R.y - b.top, R.w, R.h);
          fg.globalCompositeOperation = "destination-in"; fg.drawImage(M.cv, R.x - b.left, R.y - b.top, R.w, R.h);
          fg.globalCompositeOperation = "source-over";
        }
      }
      if (fgOn !== ovFg.classList.contains("on")) ovFg.classList.toggle("on", fgOn);
    }
    // the title's place: behind the building (with the mask), otherwise in the free sky above it. In the sky it keeps
    // one place through the overview: clear of the building's highest point over the frames it is up on (their masks,
    // loaded as the page comes near)
    var mk = svcM() && svcM().mask, nM = 0, mFrom = 0, mTo = -1;
    if (mk && !masked && p > 3.5 && p < 5.3) {
      mFrom = Math.max(mk.from | 0, Math.floor(typeof s.lineFrame === "function" ? s.lineFrame(0, 0.42) : mk.from | 0)); mTo = mk.to | 0;
      for (var mf = mFrom; mf <= mTo; mf++) if (maskFor(mf)) nM++;
    }
    if (!on && ovKey) return;
    var R0 = typeof s.frameRect === "function" ? s.frameRect() : null; // (on phones the picture settles into the top part)
    var key = (masked ? "m" + fi : "s" + nM) + "|" + W + "x" + H + "|" + document.documentElement.lang + "|" + (R0 ? Math.round(R0.h / 12) : 0);
    if (key === ovKey) return;
    ovKey = key;
    // set like the positioning line: a dark serif with a soft paper halo, the subtitle under it
    var phone = phoneQ.matches, gx = phone ? 16 : Math.max(120, W * 0.085), w = W - 2 * gx;
    ov.classList.toggle("masked", masked);
    ov.classList.remove("side");
    var place = function (y, fs, x, ww) {
      ov.style.left = f1(x === undefined ? gx : x) + "px"; ov.style.top = f1(y) + "px"; ov.style.width = f1(ww === undefined ? w : ww) + "px";
      ov.style.setProperty("--svo-fs", fs ? fs + "px" : "");
    };
    // wide screens: beside the building (left of it, the wider side if the left is too narrow), vertically centred,
    // flush left; never over the building (its masks over the frames the title is up on, else its projection)
    if (!phone && !masked) {
      var Rs = R0, bl = 1e9, br = -1e9;
      if (Rs && nM) for (var k3 = mFrom; k3 <= mTo; k3++) { var M3 = masks[k3]; if (M3 && M3.st === 2 && M3.left >= 0) { bl = Math.min(bl, Rs.x - b.left + M3.left * Rs.w); br = Math.max(br, Rs.x - b.left + M3.right * Rs.w); } }
      if (!(bl < 1e8)) {
        var pj = typeof s.project === "function" ? s.project : null, Bb = building();
        if (pj && Bb) Bb.pts.forEach(function (X) { var q = pj(X); if (q) { bl = Math.min(bl, q[0] - b.left); br = Math.max(br, q[0] - b.left); } });
      }
      if (bl < 1e8) {
        var lx0 = W * 0.07, lx1 = Math.min(W * 0.4, bl - 36), rx0 = br + 36, rx1 = W * 0.93;
        var useL = lx1 - lx0 >= 300 || lx1 - lx0 >= rx1 - rx0, sx = useL ? lx0 : rx0, sw = useL ? lx1 - lx0 : rx1 - rx0;
        if (sw >= 240) {
          ov.classList.add("side");
          // (six characters a line at least, so the eleven of the second line break into two even halves)
          var fsS = Math.round(Math.max(34, Math.min(Math.min(118, W * 0.064), sw / 6.4)));
          for (var t3 = 0; t3 < 4; t3++) {
            place(0, fsS, sx, sw);
            var hS = ov.offsetHeight;
            if (hS <= H * 0.7 || fsS <= 34) break;
            fsS = Math.round(fsS * 0.88);
          }
          place(Math.max(topY, (H - ov.offsetHeight) / 2), fsS, sx, sw);
          return;
        }
      }
    }
    // the building's top on screen: its mask's highest point on this frame, else its outline's projection
    var y0b = 1e9, Rk = typeof s.frameRect === "function" ? s.frameRect() : null;
    if (Rk && nM) { for (var k2 = mFrom; k2 <= mTo; k2++) if (masks[k2] && masks[k2].st === 2 && masks[k2].top >= 0) y0b = Math.min(y0b, Rk.y - b.top + masks[k2].top * Rk.h); }
    else if (Rk && masked && masks[fi] && masks[fi].top >= 0) y0b = Rk.y - b.top + masks[fi].top * Rk.h;
    if (!(y0b < 1e8)) {
      var proj = typeof s.project === "function" ? s.project : null, B = building();
      if (proj && B) B.pts.forEach(function (X) { var q = proj(X); if (q) y0b = Math.min(y0b, q[1] - b.top); });
    }
    // (on phones the second line, eleven characters, keeps to one line)
    var base = phone ? Math.round(Math.min(40, (W - 32) / 11.4)) : Math.min(118, Math.max(40, W * 0.064));
    // a phone held upright: the picture keeps the top of the screen, the title goes on the paper under it
    if (phone && !masked && R0 && R0.h < H * 0.8) { place(Math.max(topY, R0.y - b.top + R0.h - 36), base); return; }
    if (!(y0b < 1e8)) { place(Math.max(topY, H * 0.2), base); return; }
    if (masked) {
      // behind the building: the subtitle first, then the title, its last line partly behind the building's top
      place(topY, base);
      var hT = ov.querySelector(".svo-h").offsetHeight, hA = ov.offsetHeight;
      place(Math.max(topY, y0b - hA + hT * 0.32), base);
      return;
    }
    // in the free sky above the building: full size, else a size or two down; nothing fits: at the top
    var fsList = [base, Math.round(base * 0.84), Math.round(base * 0.7), Math.round(base * 0.58)];
    for (var i = 0; i < fsList.length; i++) {
      place(topY, fsList[i]);
      var h = ov.offsetHeight, room = y0b - 28 - topY;
      if (h <= room) { place(topY + (room - h) * 0.45, fsList[i]); return; }
    }
    place(topY, fsList[fsList.length - 1]);
  }

  // ---------- the film's wash makes way for the workspace's ----------
  var veil = document.getElementById("veil"), vsv = null;
  if (veil) { vsv = document.createElement("i"); vsv.className = "vsv"; veil.appendChild(vsv); }
  var topbar = document.querySelector(".topbar"), tbH = 64, tbAt = -1e9;

  // ---------- each frame ----------
  var rootOn = false, lastNow = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var s = story(), p = typeof s.p === "number" ? s.p : -1;
    // the time since the last frame: the play keeps real time on a slow machine too (a few frames a second), while a
    // tab coming back counts as one long frame
    var dt = Math.min(300, now - lastNow);
    lastNow = now;
    var on = p > 4.1 && p < 9.14;
    if (on !== rootOn) { rootOn = on; root.classList.toggle("on", on); }
    // the film's wash goes from the overview on (the building drawn back over the title is the raw frame, so nothing may
    // lie over the picture); the workspace's own soft wash on the right comes with the lines
    var ws = p > 4.95 && p < 9.08, ovw = p > 4.42 && p < 9.08;
    if (ws !== document.body.classList.contains("svc-ws")) document.body.classList.toggle("svc-ws", ws);
    if (ovw !== document.body.classList.contains("svc-ov")) document.body.classList.toggle("svc-ov", ovw);
    if (!on && !rootOn && fx && fxc.width && fxDirty === false) return;
    var b = root.getBoundingClientRect(), W = b.width, H = b.height, phone = phoneQ.matches;
    if (now - tbAt > 1000) { tbAt = now; var tr = topbar ? topbar.getBoundingClientRect() : null; tbH = tr && tr.height ? tr.bottom : 64; }
    // the workspace's band: under the top bar on wide screens; below the picture on phones (main.js draws the frame in the
    // top 54% of the screen through the service lines)
    var topY = phone ? H * 0.54 - 22 : tbH + 30, botY = H - (phone ? 14 : 34), colX = phone ? 0 : W * 0.56;

    // the line on screen (the overview or one of the four)
    var k = on ? Math.max(0, Math.min(4, Math.floor(p - 4 + 1e-6))) : -1, cur = k >= 0 ? ALL[k] : "";

    overviewTick(p, W, H, b, phone ? 84 : tbH + 24);

    // the sweep when the picture moves on to another line
    var fl = s.seq === "s" ? lineOfFrame(s.seqFrame) : null;
    if (fl && lastLine && fl !== lastLine && !reduce && on) sweepT0 = now;
    if (fl) lastLine = fl;

    var active = null, AS = null;
    LINES.forEach(function (id) {
      var A = arts[id]; if (!A) return;
      // the column is up over the line's own stretch (one line's column at a time), and plays from the top each time
      // it comes up
      var S = stateOf(id, p), vis = on && S.lt > 0.01 && S.lt < 1;
      if (vis !== A.vis) {
        A.vis = vis; A.el.classList.toggle("vis", vis);
        if (vis) { prepCards(A); startPlay(A); } else stopPlay(A);
      }
      var act = on && S.lt >= 0.06 && S.lt <= 0.97;
      if (act !== A.on) {
        A.on = act; A.el.classList.toggle("on", act); A.el.setAttribute("aria-hidden", act ? "false" : "true");
        [].forEach.call(A.el.querySelectorAll("button"), function (bt) { bt.tabIndex = act ? 0 : -1; });
        A.body.tabIndex = act ? 0 : -1; // the panel scrolls, so the keyboard can reach it
      }
      if (cur === id) { active = A; AS = S; }
      if (!vis) return;
      playTick(A, dt, now);
      // the column keeps one place and one height: from under the top bar (on phones, from under the picture) to the
      // bottom of the screen. It rises a little as the line comes in and lifts as it goes; its blocks fade with that
      var y1 = topY + (phone ? 8 : 22), hC = Math.round(Math.max(240, botY - y1));
      if (hC !== A.hC) { A.hC = hC; A.svw.style.setProperty("--svw-h", hC + "px"); }
      var fin = ss(0.02, 0.1, S.lt), fout = ss(0.9, 0.99, S.lt);
      A.svw.style.transform = "translate3d(0," + f1(y1 + (1 - fin) * (phone ? 36 : 54) - fout * 30) + "px,0)";
      var al = Math.round(fin * (1 - fout) * 100) / 100;
      if (al !== A.al) {
        A.al = al;
        A.blocks.forEach(function (el) { el.style.opacity = al >= 1 ? "" : String(al); el.style.visibility = al <= 0 ? "hidden" : ""; });
      }
    });

    rankTick(AS || { cur: 0, u: 0 }, W, H, b, colX, topY, !!active && active.id === "dev");
    drawFx(now, cur, AS, active, W, H, b, colX, topY);
    fxDirty = on || sweepT0 > 0;
  }
  requestAnimationFrame(frame);

  // ---------- the pop-up ----------
  var svx = document.getElementById("svx");
  if (!svx) return;
  document.body.appendChild(svx); // out of <main>'s stacking context, so it covers the top bar too
  var xBox = svx.querySelector(".svx-box"), xPanels = [].slice.call(svx.querySelectorAll(".svx-p"));
  var cv = svx.querySelector(".svx-cv"), cx = cv.getContext("2d"), vid = svx.querySelector(".svx-v"), still = svx.querySelector(".svx-img");
  var replay = svx.querySelector(".svx-re"), cta = svx.querySelector(".svx-cta");
  var xLine = null, xFrom = null, xSteps = [], mode = "", fetched = null, fetching = null, raf = 0;

  // the manifest, when the player has not loaded it (no story on this page load)
  function manifest(cb) {
    var m = story().manifest || fetched;
    if (m || !window.fetch) { cb(m || null); return; }
    if (!fetching) fetching = fetch("assets/story/manifest.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (j) { fetched = j; return j; });
    fetching.then(cb);
  }

  function markStep(k) {
    xSteps.forEach(function (b, j) { var on = j === k; b.classList.toggle("cur", on); if (on) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
  }

  // storyboard frames on a loop: { list, start, end, steps (absolute frame numbers), pos, hold }
  var F = null;
  function startFrames(sv, L) {
    var start = Math.max(0, L.start | 0), end = Math.max(start, L.end | 0), n = end - start + 1, pat = sv.pattern || "assets/story/s%04d.jpg";
    var st = Array.isArray(L.steps) && L.steps.length >= 5 ? L.steps.slice(0, 5).map(Number) : null;
    // steps may be counted from the line's own first frame
    if (st && !st.every(function (v) { return v >= start && v <= end; }) && st.every(function (v) { return v >= 0 && v < n; })) st = st.map(function (v) { return v + start; });
    if (!st || !st.every(function (v) { return v >= start && v <= end; })) st = [0, 1, 2, 3, 4].map(function (k) { return start + Math.round(k * n / 5); });
    var list = [];
    for (var i = start; i <= end; i++) list.push({ src: framePath(pat, i), img: null, st: 0 });
    F = { list: list, start: start, end: end, steps: st, pos: start, hold: 0, busy: 0, last: 0, fps: Math.max(6, Math.min(24, n / 12)) };
    mode = "frames"; cv.hidden = false; vid.hidden = true; still.hidden = true; replay.hidden = false;
    pumpFrames(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tickFrames);
  }
  function pumpFrames() {
    if (!F) return;
    var f0 = F;
    while (F.busy < 6) {
      var best = -1, bd = 1e9, at = Math.floor(F.pos) - F.start;
      for (var i = 0; i < F.list.length; i++) if (F.list[i].st === 0) {
        var d = i - at; d = d < 0 ? d + F.list.length : d; // ahead of the play head first, wrapping round
        if (d > 18 && d < F.list.length - 6 && F.steps.indexOf(i + F.start) < 0) continue;
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return;
      (function (fr) {
        var img = new Image(); fr.st = 1; F.busy++;
        img.onload = function () { if (F !== f0) return; fr.st = 2; fr.img = img; F.busy--; pumpFrames(); };
        img.onerror = function () { if (F !== f0) return; fr.st = 3; F.busy--; pumpFrames(); };
        img.src = fr.src;
      })(F.list[best]);
    }
  }
  function fitCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(cv.clientWidth * dpr) || 1, h = Math.round(cv.clientHeight * dpr) || 1;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; return true; }
    return false;
  }
  function cover(img) {
    var W = cv.width, H = cv.height, s = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    cx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }
  function stepAt(fi) {
    var k = 0;
    for (var j = 0; j < 5; j++) if (fi >= F.steps[j]) k = j;
    return k;
  }
  var drawn = -1;
  function tickFrames(now) {
    if (!F || mode !== "frames") return;
    raf = requestAnimationFrame(tickFrames);
    var dt = F.last ? Math.min(0.1, (now - F.last) / 1000) : 0; F.last = now;
    var i = Math.floor(F.pos) - F.start, next = F.list[Math.min(F.list.length - 1, i + 1)];
    // play on while the next frame is there (or has failed); at the end, hold a moment and start over
    if (F.hold > 0) { F.hold -= dt; if (F.hold <= 0) { F.pos = F.start; pumpFrames(); } }
    else if (!reduce && next && next.st >= 2) {
      F.pos += dt * F.fps;
      if (F.pos >= F.end) { F.pos = F.end; F.hold = 1.4; }
    }
    i = Math.floor(F.pos) - F.start;
    if (!F.trimAt || now - F.trimAt > 200) {
      F.trimAt = now;
      F.list.forEach(function(g,j) {
        var d = (j - i + F.list.length) % F.list.length;
        if (g.st === 2 && d > 22 && d < F.list.length - 8 && F.steps.indexOf(j + F.start) < 0) { g.img = null; g.st = 0; }
      });
      pumpFrames();
    }
    var resized = fitCanvas(), fr = F.list[i];
    if (!fr || fr.st !== 2) {
      // the nearest frame that has arrived
      var bd = 1e9; fr = null;
      F.list.forEach(function (g, j) { if (g.st === 2 && Math.abs(j - i) < bd) { bd = Math.abs(j - i); fr = g; } });
    }
    if (fr && (fr !== drawn || resized)) { drawn = fr; cover(fr.img); }
    markStep(stepAt(F.pos));
  }
  function startStill(line, m) {
    mode = "still"; F = null; cv.hidden = true; vid.hidden = true; replay.hidden = true;
    // a frame of the realistic sequence at that stage of the building, or a photograph without one
    var frac = { dev: 0, design: 0.3, build: 0.62, ops: 1 }[line], src;
    if (m && typeof m.pattern === "string" && m.count > 0) src = framePath(m.pattern, Math.round(frac * (m.count - 1)));
    else src = "assets/frames/" + { dev: "k04", design: "bg-model", build: "bg-site", ops: "bg-facade" }[line] + ".jpg";
    still.src = src; still.hidden = false;
    markStep(-1);
  }
  // the client's film for this line, when the file is there (muted, inline); the steps follow its five equal parts.
  // Asked once per page load (a missing file shows as one 404 in the network log).
  var probes = {};
  function tryVideo(line) {
    if (!window.fetch) return;
    var url = "assets/video/svc-" + line + ".mp4";
    if (!probes[line]) probes[line] = fetch(url, { method: "HEAD", cache: "no-cache" }).then(function (r) { return r.ok; }, function () { return false; });
    probes[line].then(function (ok) {
      if (!ok || xLine !== line || svx.hidden) return;
      vid.onerror = function () { if (mode === "video" && xLine === line) startLine(line, true); };
      vid.oncanplay = function () {
        if (xLine !== line) return;
        mode = "video"; F = null; cancelAnimationFrame(raf);
        vid.hidden = false; cv.hidden = true; still.hidden = true; replay.hidden = false;
      };
      vid.src = url; vid.muted = true; vid.playsInline = true; vid.load();
      var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
    }).catch(function () {});
  }
  vid.addEventListener("timeupdate", function () {
    if (mode === "video" && vid.duration > 0) markStep(Math.min(4, Math.floor(vid.currentTime / vid.duration * 5)));
  });
  function startLine(line, noVideo) {
    stopMedia();
    manifest(function (m) {
      if (xLine !== line || svx.hidden) return;
      var sv = m && m.services && Array.isArray(m.services.lines) ? m.services : null, L = null;
      if (sv) sv.lines.forEach(function (l) { if (l && l.id === line) L = l; });
      if (L && typeof L.start === "number" && typeof L.end === "number") startFrames(sv, L);
      else startStill(line, m);
      if (!noVideo) tryVideo(line);
    });
  }
  function stopMedia() {
    cancelAnimationFrame(raf); F = null; mode = ""; drawn = -1;
    vid.onerror = vid.oncanplay = null;
    if (vid.getAttribute("src")) { vid.pause(); vid.removeAttribute("src"); vid.load(); }
    vid.hidden = true;
  }
  function goStep(k) {
    if (mode === "frames" && F) { F.pos = F.steps[k]; F.hold = 0; pumpFrames(); }
    else if (mode === "video" && vid.duration > 0) { vid.currentTime = k * vid.duration / 5 + 0.01; var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); }
    markStep(k);
  }

  function openLine(line, from) {
    var hit = null;
    xPanels.forEach(function (pn) { var on = pn.dataset.line === line; pn.hidden = !on; if (on) hit = pn; });
    if (!hit) return;
    var h = hit.querySelector(".svx-h"); h.id = "svxh-" + line; xBox.setAttribute("aria-labelledby", h.id);
    xSteps = [].slice.call(hit.querySelectorAll(".svx-steps button"));
    xLine = line; xFrom = from || document.activeElement;
    svx.hidden = false; document.documentElement.classList.add("svx-open");
    void svx.offsetWidth; svx.classList.add("on");
    xBox.scrollTop = 0; xBox.focus({ preventScroll: true });
    startLine(line);
  }
  function closeLine(keepFocus) {
    if (svx.hidden) return;
    stopMedia(); xLine = null;
    svx.classList.remove("on"); document.documentElement.classList.remove("svx-open");
    setTimeout(function () { if (!svx.classList.contains("on")) svx.hidden = true; }, reduce ? 0 : 320);
    if (!keepFocus && xFrom && xFrom.focus) xFrom.focus({ preventScroll: true });
  }
  // "talk to us about this service line": a note in the booking form before the page scrolls to it
  function prefill(line) {
    var form = document.getElementById("bookingForm"); if (!form) return;
    var type = form.querySelector('select[name="type"]');
    if (type && type.querySelector('option[value="other"]')) type.value = "other";
    var msg = form.querySelector('textarea[name="message"]'), pn = svx.querySelector('.svx-p[data-line="' + line + '"]');
    if (msg && !msg.value && pn) msg.value = (isEn() ? "I'd like to talk about: " : "想聊聊：") + pn.querySelector(".svx-tag span").textContent + " " + pn.querySelector(".svx-h").textContent;
  }

  svx.addEventListener("click", function (e) {
    var b = e.target.closest(".svx-steps button");
    if (b) { goStep(+b.dataset.k); return; }
    if (e.target.closest(".svx-re")) {
      if (mode === "video") { vid.currentTime = 0; var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); markStep(0); }
      else if (F) { F.pos = F.start; F.hold = 0; pumpFrames(); }
      return;
    }
    if (cta && e.target.closest(".svx-cta")) { prefill(xLine); closeLine(true); return; }
    if (e.target.closest("[data-close]")) closeLine();
  });
  document.addEventListener("keydown", function (e) {
    if (svx.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeLine(); return; }
    if (e.key !== "Tab") return;
    // keep the focus inside the pop-up
    var f = [].filter.call(xBox.querySelectorAll("button,a[href]"), function (el) { return !el.hidden && !el.closest("[hidden]"); });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === xBox)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener("visibilitychange", function () { if (mode === "video") { if (document.hidden) vid.pause(); else { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } } });
})();
