(function () {
  "use strict";

  // ---------- language ----------
  var zh = {};
  document.querySelectorAll("[data-i18n]").forEach(function (el) { zh[el.dataset.i18n] = el.innerHTML; });
  var lang = "zh";
  try { lang = localStorage.getItem("prism-lang") || lang; } catch (e) {}

  function t(key) { return lang === "en" ? (window.PRISM_EN[key] || zh[key] || "") : (zh[key] || ""); }
  function applyLang() {
    document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(el.dataset.i18n); if (v) el.innerHTML = v;
    });
    var b = document.getElementById("lang"); if (b) b.textContent = lang === "en" ? "中文" : "EN";
    fsSync();
    if (window.PRISM_onLang) window.PRISM_onLang();
    if (typeof updateFilm === "function") updateFilm();
  }
  var langBtn = document.getElementById("lang");
  if (langBtn) langBtn.addEventListener("click", function () {
    lang = lang === "en" ? "zh" : "en";
    try { localStorage.setItem("prism-lang", lang); } catch (e) {}
    applyLang();
  });

  // ---------- full screen (top bar, next to the language switch) ----------
  // hidden where the page cannot go full screen (e.g. iPhone Safari); Esc or the browser's own exit updates it too
  zh["fs.enter"] = "全螢幕"; zh["fs.exit"] = "離開全螢幕";
  var fsBtn = document.getElementById("fs"), root = document.documentElement;
  var fsCan = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !!(root.requestFullscreen || root.webkitRequestFullscreen);
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function fsSync() {
    if (!fsBtn) return;
    var on = !!fsEl(), label = t(on ? "fs.exit" : "fs.enter");
    fsBtn.classList.toggle("on", on);
    fsBtn.setAttribute("aria-label", label); fsBtn.title = label;
  }
  if (fsBtn && fsCan) {
    fsBtn.hidden = false;
    fsBtn.addEventListener("click", function () {
      var r;
      if (fsEl()) r = (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else r = (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
      if (r && r.catch) r.catch(function () {}); // refused (e.g. not allowed in this frame): the icon simply stays
    });
    ["fullscreenchange", "webkitfullscreenchange"].forEach(function (ev) { document.addEventListener(ev, fsSync); });
  }

  // ---------- cinematic scroll ----------
  var film = document.getElementById("film");
  var updateFilm;
  var goToChapter = function () {};
  if (film) {
    // Stations of the camera. Stations 0-3 are the opening (manifest "intro", played by makeStory: skyline -> down
    // into the blocks -> the empty site -> the logo drawn on it). They play by themselves once the page has loaded
    // (autoplay below) and take no scroll length: the top of the page is station 3, AEC PRISM over the drawn logo.
    // Without the one-take they are photographs (2.5D, photo + depth map, below).
    // Station 4 is the positioning line (the services' first frame), 5 the overview and 6-9 the four service lines
    // (dev, design, build, ops: manifest "services", or the story's own frames split in five when it is missing);
    // 10-15 are the sections after the film, over the day sequence (manifest "day").
    // Without the realistic frames the three.js model takes over.
    // k04's setting-out is painted in the logo's blue (stem band, triangle, triangle hole).
    // On the dive from k03 (station 2) to k04 the logo is drawn in one line along `path` (the bands' centre lines:
    // up the stem, over the roof, down the right side, then round the triangle). `site` is the fenced lot's corners
    // in each photo (NW, NE, SE, SW), so the same lines also land on k03's ground.
    // The four photos are Blender stills of the same city as the intro (render/opening_stills.py); every point below is
    // the scene's world geometry projected into the 1920x1080 frame, not traced: the lot is 84 m square
    // (corners NW, NE, SE, SW) and the logo is the same setting-out A's intro draws.
    var PHOTO = [{ f: "k00" }, { f: "k01" }, { f: "k03", site: [[759, 236], [1273, 340], [1175, 865], [633, 748]] }, { f: "k04", holes: 1, logo: [
      [[758, 789], [758, 422], [947, 303], [1137, 422], [1137, 579], [1074, 579], [1074, 457], [947, 377], [820, 456], [820, 789]],
      [[867, 429], [1162, 613], [867, 780]],
      [[929, 541], [1041, 611], [929, 674]]
    ], path: [[789, 789], [789, 439], [947, 340], [1106, 439], [1106, 579], [1101, 612], [898, 727], [898, 485], [1101, 612]],
      site: [[658, 275], [1238, 275], [1238, 856], [658, 856]] }]; // k04: straight above the lot, the intro's frame 90
    // station 2 has no word of its own: AEC PRISM holds from there to station 3 while the logo is drawn
    var S_LOGO = 3, S_DIVE = 2, S_POS = 4, logoIn = 0, drawV = 0;
    // flat pictures for browsers without WebGL, one per film station
    var FALLBACK = ["k00", "k01", "k03", "k04", "kn1", "k06", "kn2", "kn3", "k08", "k09"];
    var NS = 10; // stations that belong to the film itself (0-9)
    var FIRST = S_LOGO; // the first station with scroll length: 0-2 only play in the autoplayed opening
    var STEP = 1.35; // viewport heights per scene
    // SEG: the scroll length of each stretch between stations (in scenes); TAIL: film left after station 9, so the way
    // from the last service frame into VISION (station 10, the first section's middle) can be lengthened. With the
    // realistic frames both follow how far the camera travels (pace(), once the manifest is in)
    var SEG = [], CUM = [0], TAIL = 0;
    var fws = [].slice.call(document.querySelectorAll(".fw")), fly = document.getElementById("fly"), fwYAt = "";
    function setPace(seg, tail) {
      SEG = seg; TAIL = tail || 0; CUM = [0];
      SEG.forEach(function (v, g) { CUM.push(CUM[g] + v); });
      film.style.height = ((CUM[NS - 1] + TAIL) * 100 * STEP * 1.09 + 100) + "vh";
    }
    var SEG0 = []; for (var g = 0; g < NS - 1; g++) SEG0.push(g < FIRST ? 0 : 1);
    setPace(SEG0, 0);
    var stationAt = function (s) { return CUM[Math.max(0, Math.min(NS - 1, s))] / (CUM[NS - 1] + TAIL); };
    var layersBox = document.getElementById("layers");
    // the old story's step ids (manifest.steps), only used when manifest.services is missing
    var STEP_IDS = ["pos", "land", "env", "site", "auto", "cost", "property", "facility"]; // stations 4..11
    var hint = document.getElementById("hint");
    // the hint's arrow is a drawn line now (.hint-line): its text drops the "↓" the shared key keeps for team.html
    var hintT = hint && hint.querySelector("[data-i18n]");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mx = 0, my = 0, smx = 0, smy = 0;
    // the sun slider and the wind switch are gone: the player's sun frames (manifest.sun) and the model keep noon and wind on
    var S_SUN = 6, sunT = 12, windOn = true;

    // flat fallback layers (used when WebGL is unavailable)
    var layers = FALLBACK.map(function (f) {
      var l = document.createElement("div"); l.className = "layer"; layersBox.appendChild(l);
      var img = new Image(), url = "assets/frames/" + f + ".jpg";
      img.onload = function () { l.style.backgroundImage = "url(" + url + ")"; };
      img.src = url;
      return l;
    });

    // 2.5D renderer (photo + depth map). With the daytime one-take (manifest "intro", see makeStory) the opening
    // plays those frames instead and the photos are only started when the one-take cannot play: no "intro" in the
    // manifest, its frames fail, no WebGL, or ?intro=0.
    var glc = document.getElementById("gl"), glOn = false, photoTried = false;
    function startPhoto() {
      if (photoTried) return; photoTried = true;
      if (glc && window.PrismGL && !reduce) PrismGL.init(glc, PHOTO, function () { glOn = true; document.body.classList.add("gl-on"); });
    }
    function webglOK() {
      try {
        var c = document.createElement("canvas"), g = c.getContext("webgl"); if (!g) return false;
        var x = g.getExtension("WEBGL_lose_context"); if (x) x.loseContext();
        return true;
      } catch (e) { return false; }
    }
    function introLive() { return storyOn && story.intro && !story.introFailed; }
    // 3D model world: only started when the realistic sequence is missing
    // It also takes over after the film when the realistic sequence has no day for the sections (manifest "day").
    var mc = document.getElementById("gl3"), modelOn = false, modelTried = false, storyM = null;
    function startModel() {
      if (modelTried) return; modelTried = true;
      if (mc && window.PrismModel && !reduce) {
        // the sections' views follow the realistic day sequence's cameras when the manifest has them
        if (storyM && storyM.day && PrismModel.useDayCamera) PrismModel.useDayCamera(storyM.day);
        modelOn = PrismModel.init(mc, document.getElementById("mlabels")) === true;
        if (modelOn) document.body.classList.add("model-on");
      }
    }

    // ---------- realistic image sequences (the opening, the services, the day behind the sections) ----------
    // assets/story/manifest.json: { w, h, count, pattern: "…f%04d.jpg", camera: { frames }, focus: [x, y] (optional
    //   crop centre, 0..1), intro: the opening one-take, services: the overview and the four service lines, day: the
    //   sections' day }. Only ever one whole frame is on screen: the one nearest to where the page is, never two
    // blended, so a moving page shows no double image and a resting page is always sharp. Frames load nearest-first;
    // until a frame arrives the nearest loaded frame of the same sequence shows.
    var story = null, storyOn = false, storyA = 0;
    var PRE = 0.6; // the opening's frames before "hello" play over stations -0.6..0 (the first word coming in)
    function ssr(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
    // how dark the sky is at an hour (0 full day … 1 night); hours past 24 are the next day
    function darkAt(h) {
      if (typeof h !== "number") return 0;
      h = ((h % 24) + 24) % 24;
      return h < 4.5 || h > 20 ? 1 : h < 7.5 ? 1 - ssr(4.5, 7.5, h) : h > 16.5 ? ssr(16.5, 20, h) : 0;
    }
    // a sequence's cameras ({ up, shift, frames: [{ p, t, fov, shift }] }) -> one projector per frame: a world point to
    // image fractions (0..1 across, 0..1 down), null behind the camera (or clamped in front of it with `near`).
    // As the three.js reconstruction of the story cameras: lookAt t, vertical fov, shift added to the projection.
    function camProj(cam, count, iw, ih) {
      var fr = cam && cam.frames;
      if (!Array.isArray(fr) || fr.length !== (count | 0)) return null;
      var up = cam.up || [0, 1, 0], asp = iw / ih, dsh = cam.shift || [0, 0];
      var sub = function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }, dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
      var crs = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
      var nrm = function (a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
      var out = fr.map(function (c) {
        if (!c || !c.p || !c.t || typeof c.fov !== "number") return null;
        var f = nrm(sub(c.t, c.p)), r = nrm(crs(f, up)), u = crs(r, f), k = 1 / Math.tan(c.fov * Math.PI / 360), sh = c.shift || dsh;
        return function (X, near) {
          var d = sub(X, c.p), z = dot(d, f);
          if (!(z > 0.01)) { if (!near) return null; z = 0.01; }
          return [(k / asp * dot(d, r) / z - 2 * sh[0] + 1) / 2, (1 - (k * dot(d, u) / z - 2 * sh[1] * asp)) / 2];
        };
      });
      return out.some(function (f) { return !f; }) ? null : out;
    }
    // the opening one-take (stations 0-3): manifest.intro =
    //   { count, pattern: "…i%04d.jpg", beats: { hello, we, top, name }, camera: { frames }, logo: { world, draw } }
    // where the logo's middle lands on each frame, for the cover crop (a phone held upright keeps the logo on screen)
    function introCams(I, iw, ih) {
      var P = camProj(I.camera, I.count, iw, ih), world = I.logo && I.logo.world;
      if (!P || !world || !world.length) return null;
      return P.map(function (pr) {
        var b = [1e9, 1e9, -1e9, -1e9];
        world.forEach(function (pl) { pl.forEach(function (X) { var q = pr(X, true); b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); });
        return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
      });
    }
    var LINE_IDS = ["overview", "dev", "design", "build", "ops"];
    function makeStory(m, withIntro) {
      var n = Math.max(1, m.count | 0), focus = m.focus || [0.5, 0.5], IW = m.w || 1600, IH = m.h || 900;
      var path = function (pat, i) { return pat.replace(/%0(\d)d/, function (_, w) { var s = String(i); while (s.length < +w) s = "0" + s; return s; }); };
      var list = function (pat, c) { var a = []; for (var i = 0; i < c; i++) a.push({ src: path(pat, i), st: 0, img: null }); return a; };
      var clampTo = function (c) { return function (v) { return Math.round(Math.max(0, Math.min(c - 1, v))); }; };
      var main = list(m.pattern, n);
      // the services (stations 4-9): manifest.services = { count, pattern: "…s%04d.jpg", lines: [{ id, start, end,
      // steps }], camera: { frames } }; its first frame is the story's first (s0000 = f0000) and its last the day's
      // first (= d0000), so those are shared and load once. Without it the story's own frames, split evenly in five.
      var SV = m.services;
      var svOk = !!(SV && typeof SV.pattern === "string" && SV.count > 1 && Array.isArray(SV.lines) &&
        LINE_IDS.every(function (id) { return SV.lines.some(function (L) { return L && L.id === id && typeof L.start === "number" && typeof L.end === "number"; }); }));
      var seq = svOk ? list(SV.pattern, SV.count | 0) : main, sn = seq.length, cl = clampTo(sn);
      if (svOk) seq[0] = main[0];
      seq.forEach(function (f) { f.isSeq = true; });
      var lines = LINE_IDS.map(function (id, k) {
        var L = svOk ? SV.lines.filter(function (x) { return x && x.id === id; })[0] : null;
        var a = L ? cl(L.start) : cl(k * (sn - 1) / 5), b = L ? cl(L.end) : cl((k + 1) * (sn - 1) / 5);
        var st = L ? (Array.isArray(L.steps) ? L.steps.map(cl) : []) : id === "overview" ? [] : [1, 2, 3, 4, 5].map(function (j) { return cl(a + (b - a) * j / 5); });
        return { id: id, a: a, b: b, steps: st };
      });
      var seqCam = camProj(svOk ? SV.camera : m.camera, sn, svOk && SV.w ? SV.w : IW, svOk && SV.h ? SV.h : IH);
      // the station frames of the services, loaded right after the opening's
      var sKeys = [0]; lines.forEach(function (L) { [L.a, L.b].forEach(function (v) { if (sKeys.indexOf(v) < 0) sKeys.push(v); }); });

      // the opening one-take: its last frame is the story's first (the same picture), so that one is shared
      var iL = null, iMap = null, iKeys = null, iCen = null, iCam = null, iArc = null, introAt = 0, nearIntro = true;
      if (withIntro) {
        var I = m.intro, ic = I.count | 0, bt = I.beats || {}, lgo = I.logo || {};
        iL = list(I.pattern, ic); iL[ic - 1] = main[0];
        iL.forEach(function (f, i) { f.isIntro = true; if (f !== main[0]) f.ii = i; });
        var at = function (v, d) { return clampTo(ic)(typeof v === "number" ? v : d); };
        var drawn = Array.isArray(lgo.draw) ? lgo.draw : null;
        var hello = at(bt.hello, 0), we = at(bt.we, ic * 0.43), name = at(bt.name, drawn ? drawn[1] : ic * 0.86);
        // stations 0, 1, 2, 3, 4: hello, we, the empty site just before the pen starts (beats.top: the first frame
        // looking straight down on the lot, so AEC PRISM never sits over a tilted view), the logo just drawn, the
        // story's first frame
        var site = at(typeof bt.top === "number" ? bt.top : drawn ? drawn[0] - 2 : null, (we + name) / 2);
        iMap = [hello, we, Math.max(we, Math.min(name, site)), name, ic - 1];
        // loaded first: the opening frame, then every station's frame
        iKeys = [0, hello, we, iMap[2], name].filter(function (v, k, a) { return a.indexOf(v) === k; });
        iCen = introCams(I, IW, IH); iCam = camProj(I.camera, ic, IW, IH); iArc = arcCum(I.camera, ic);
      }
      // the day of the building behind the sections (stations 10-15): { count, pattern, stops: { vision … contact }, hours }
      var dayL = null, dayKeys = null, dayH = null, dayCam = null, dayArc = null, climbTop = 0, DAY_IDS = ["vision", "results", "impact", "whynow", "team", "contact"];
      if (m.day && typeof m.day.pattern === "string" && m.day.count > 1) {
        var dn = m.day.count | 0;
        dayL = list(m.day.pattern, dn);
        dayKeys = DAY_IDS.map(function (id, k) {
          var v = m.day.stops && m.day.stops[id];
          return clampTo(dn)(typeof v === "number" ? v : k * (dn - 1) / (DAY_IDS.length - 1));
        });
        dayH = Array.isArray(m.day.hours) && m.day.hours.length === dn ? m.day.hours : null;
        dayCam = camProj(m.day.camera, dn, IW, IH); dayArc = arcCum(m.day.camera, dn);
        // the climb (manifest.day.climb = { top }): from WHY NOW the camera goes straight up to its top frame, where the
        // page itself goes on leaving (earth.js: the land round the city, the island, the earth). The day's later frames
        // are behind the earth and are not played or loaded.
        climbTop = m.day.climb && +m.day.climb.top || 0;
        if (climbTop > dayKeys[3] && climbTop < dn) dayKeys[4] = dayKeys[5] = climbTop; else climbTop = 0;
        if (svOk) seq[sn - 1] = dayL[0];
      }
      // the way from the last service frame into VISION (stations 9-10), filled in: manifest.day.lead = { count,
      // pattern: "…l%04d.jpg", at: [each frame's place among the day's frames], hours, camera: { frames } }. The
      // services overview stands in front of this stretch, so the page spends a long scroll on it and the day's own
      // 13 frames would each stay up for a long while and then jump. The lead's first frame is the day's first and its
      // last the day's VISION frame (the same pictures), so those are shared and load once. Without it (or when one of
      // its frames fails, or with ?lead=0) the stretch plays the day's own frames as before.
      var leadL = null, leadCam = null, leadArc = null, leadPos = null, leadH = null, ln = 0, leadX = 0, leadT = 0, daySkip = [];
      var LD = dayL && svOk ? m.day.lead : null;
      if (LD && typeof LD.pattern === "string" && LD.count > 2 && Array.isArray(LD.at) && LD.at.length === (LD.count | 0) &&
          LD.at[0] === 0 && LD.at[LD.count - 1] === dayKeys[0] && !/[?&]lead=0\b/.test(location.search)) {
        ln = LD.count | 0; leadArc = arcCum(LD.camera, ln);
        if (leadArc && leadArc[ln - 1] > 1e-6) {
          leadL = list(LD.pattern, ln); leadL[0] = dayL[0]; leadL[ln - 1] = dayL[dayKeys[0]];
          leadL.forEach(function (f, i) { if (i > 0 && i < ln - 1) f.isLead = true; });
          leadL.dense = true; // closely spaced, as the services' frames: loaded a little further ahead (nearest())
          leadCam = camProj(LD.camera, ln, IW, IH); leadPos = LD.at;
          leadH = Array.isArray(LD.hours) && LD.hours.length === ln ? LD.hours : null;
          // the day's own frames between its first and VISION are not shown while the lead plays: not loaded either
          for (var dj = 1; dj < dayKeys[0]; dj++) { dayL[dj].st = 3; daySkip.push(dayL[dj]); }
        }
      }
      // frames still to load (a shared frame counts once)
      var left = 0;
      [iL, seq, dayL, leadL].forEach(function (l) { if (l) l.forEach(function (f) { if (!f.c && f.st === 0) { f.c = 1; left++; } }); });
      // Shared endpoints belong to more than one sequence; pin the image object once for every owner.
      sKeys.forEach(function(i) { seq[i].pinned = true; });
      if (iL) iKeys.forEach(function(i) { iL[i].pinned = true; });
      if (dayL) dayKeys.forEach(function(i) { dayL[i].pinned = true; });
      var cv = document.createElement("canvas"), cx = cv.getContext("2d");
      cv.className = "gl story"; cv.id = "story"; cv.dataset.frameCount = sn;
      var box = document.querySelector(".bgfx"), after = document.getElementById("gl3");
      box.insertBefore(cv, after ? after.nextSibling : box.firstChild);
      var busy = 0, want = 0, dayAt = 0, nearDay = false, nearServices = false, dirty = true, lastKey = "", trimAt = 0, self;
      var shown = null; // the frame on screen: { L, k, cams, ox, oy, w, h } (canvas pixels)
      var view = { kx: 1, ky: 1, x: 0, y: 0 }; // canvas pixels -> viewport CSS pixels

      function nearest(l, at, st) {
        var best = -1, bd = 1e9;
        for (var i = 0; i < l.length; i++) if (l[i].st === st) { var d = Math.abs(i - at); if (st === 0 && d > (l === seq || l.dense ? 22 : 16)) continue; if (d < bd) { bd = d; best = i; } }
        return best;
      }
      // while the opening plays by itself: the next frames ahead of it first
      function ahead(l, at) {
        for (var i = Math.max(0, Math.floor(at)); i < Math.min(l.length, Math.floor(at) + 17); i++) if (l[i].st === 0) return i;
        return nearest(l, at, 0);
      }
      function load(l, i) {
        var f = l[i], img = new Image(); f.st = 1; busy++; left--;
        img.decoding = "async";
        img.onload = function () {
          var done = function () {
            f.st = 2; f.img = img; busy--; dirty = true; if (f.isSeq) self.ready = true; if (f.isIntro) self.introReady = true;
            if (f.isLead && self.leadFailed) { f.st = 3; f.img = null; } // arrived after the lead was given up: not kept
            pump();
          };
          if (img.decode) img.decode().then(done, done); else done();
        };
        img.onerror = function () {
          f.st = 3; busy--;
          if (f === main[0]) self.failed = true;
          if (dayL && f === dayL[dayKeys[0]]) self.dayFailed = true;
          // a missing station frame of the one-take: the opening goes back to the photographs
          if (iL && iKeys.indexOf(f.ii) >= 0 && !self.introFailed) {
            self.introFailed = true;
            iL.forEach(function (g) { if (g.st === 0 && !g.isSeq) { g.st = 3; left--; } });
          }
          // a missing frame of the lead into VISION: the stretch goes back to the day's own frames (now loaded after
          // all), and the lead's frames are let go
          if (f.isLead && !self.leadFailed) {
            self.leadFailed = true;
            leadL.forEach(function (g) { if (!g.isLead || g.st === 1) return; if (g.st === 0) left--; g.st = 3; g.img = null; });
            daySkip.forEach(function (g) { if (g.st === 3) { g.st = 0; left++; } });
            dirty = true;
          }
          pump();
        };
        img.src = f.src;
      }
      // the day's section frames first, then the one nearest to where the page is
      function dayNext() {
        if (self.dayFailed) return -1;
        for (var j = 0; j < dayKeys.length; j++) if (dayL[dayKeys[j]].st === 0) return dayKeys[j];
        return nearest(dayL, dayAt, 0);
      }
      // While the page is in the opening, the one-take's station frames come first, then its frames nearest to the
      // page (ahead of it while it plays by itself); then the services' station frames, then whatever is nearest to
      // where the page is; from the last service line on, the day behind the sections comes before the rest, and
      // before the day the lead into VISION (self.lead: its frames nearest to the page) while the page is near it.
      function pump() {
        while (busy < 6 && left > 0) {
          var l = seq, k = -1, j, iOk = iL && !self.introFailed, ld = self.lead;
          if (iOk) {
            for (j = 0; j < iKeys.length && k < 0; j++) if (iL[iKeys[j]].st === 0) k = iKeys[j];
            if (k < 0 && nearIntro) k = auto ? ahead(iL, introAt) : nearest(iL, introAt, 0);
            if (k >= 0) l = iL;
          }
          if (k < 0) { l = seq; for (j = 0; j < sKeys.length && k < 0; j++) if (seq[sKeys[j]].st === 0) k = sKeys[j]; }
          if (k < 0 && ld && ld.near && !self.leadFailed) { l = ld.L; k = nearest(l, ld.at, 0); }
          if (k < 0 && dayL && nearDay) { l = dayL; k = dayNext(); }
          if (k < 0 && nearServices) { l = seq; k = nearest(seq, want, 0); }
          if (k < 0 && dayL && nearDay) { l = dayL; k = dayNext(); }
          if (k < 0 && iOk && nearIntro) { l = iL; k = nearest(iL, introAt, 0); }
          if (k < 0) return;
          load(l, k);
        }
      }
      // Keep only the active neighbourhood decoded, plus the shared chapter endpoints.
      function trimCache(l, at, radius, keys) {
        if (!l) return;
        l.forEach(function (f, i) {
          if (f.st === 2 && !f.pinned && Math.abs(i - at) > radius && keys.indexOf(i) < 0) {
            f.img = null; f.st = 0; left++;
          }
        });
      }
      // Between two of the day's frames taken from high above, nearly straight down (the climb after WHY NOW, which the
      // page gives a long stretch of scroll): the ground of the one frame lies on the ground of the next by a turn, a
      // scale and a shift. So the picture can stand anywhere between the two (both drawn, each moved to that place)
      // instead of stepping from frame to frame. null where that does not hold (a low or level camera, a cut).
      var glides = {};
      function glide(k) {
        if (k in glides) return glides[k];
        var g = null, fr = m.day.camera && m.day.camera.frames, A = fr && fr[k], B = fr && fr[k + 1], pa = dayCam && dayCam[k], pb = dayCam && dayCam[k + 1];
        if (A && B && pa && pb) {
          var steep = function (c) { var x = c.t[0] - c.p[0], y = c.t[1] - c.p[1], z = c.t[2] - c.p[2]; return -y / (Math.hypot(x, y, z) || 1); };
          var a0 = pa([0, 0, 0]), a1 = pa([160, 0, 0]), b0 = pb([0, 0, 0]), b1 = pb([160, 0, 0]);
          if (steep(A) > 0.9 && steep(B) > 0.9 && a0 && a1 && b0 && b1) {
            var ax = (a1[0] - a0[0]) * IW, ay = (a1[1] - a0[1]) * IH, bx = (b1[0] - b0[0]) * IW, by = (b1[1] - b0[1]) * IH;
            var sc = Math.hypot(bx, by) / (Math.hypot(ax, ay) || 1), ro = Math.atan2(by, bx) - Math.atan2(ay, ax);
            ro = ((ro + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
            if (sc > 0.8 && sc < 1.25 && Math.abs(ro) < 0.09) g = { a: [a0[0] * IW, a0[1] * IH], b: [b0[0] * IW, b0[1] * IH], ls: Math.log(sc), ro: ro };
          }
        }
        return (glides[k] = g);
      }
      // the frame nearest to position fi; failing that, the nearest frame of the list that has loaded (-1: none yet)
      function pick(l, fi) {
        var a = Math.max(0, Math.min(l.length - 1, Math.round(fi)));
        var ready = l[a].st === 2 ? a : nearest(l, fi, 2);
        return l === seq && ready >= 0 && Math.abs(ready - fi) > 28 ? -1 : ready;
      }
      // the one-take's cover crop (as `focus`: 0..1 of the overflow) follows the logo's middle on the frame, so a phone
      // held upright keeps the site and the logo on screen; from the finished logo to the last frame it eases to the
      // story's own crop, so station 4 does not jump
      function iFit(fi) {
        var fx = focus[0], fy = focus[1], c = iCen && iCen[fi];
        if (c) {
          var W = cv.width, H = cv.height, s = Math.max(W / IW, H / IH), w = IW * s, h = IH * s;
          if (w - W > 0.5) fx = clamp01((W / 2 - c[0] * w) / (W - w));
          if (h - H > 0.5) fy = clamp01((H / 2 - c[1] * h) / (H - h));
          var e = ssr(iMap[3], iMap[4], fi);
          fx += (focus[0] - fx) * e; fy += (focus[1] - fy) * e;
        }
        return [fx, fy];
      }
      // the services' cover crop: on a screen narrower than the frames (a phone held upright) it follows the site's
      // middle across, so the building stays on screen; it eases in over the overview from the story's own crop, so
      // station 4 does not jump
      var SITE_MID = [0, 22, 0];
      function sFit(fi, bh) {
        var fx = focus[0], fy = focus[1], pr = svOk && seqCam ? seqCam[fi] : null;
        var c = pr ? pr(SITE_MID, true) : null;
        if (c) {
          var W = cv.width, s = Math.max(W / IW, (bh || cv.height) / IH), w = IW * s;
          if (w - W > 0.5) fx += (clamp01((W / 2 - c[0] * w) / (W - w)) - fx) * ssr(0, Math.max(1, lines[0].b), fi);
        }
        return [fx, fy];
      }
      // the lead's cover crop: on a screen narrower than the frames the services end on their own crop (the site's
      // middle, sFit) and the day uses the story's; the lead starts on the one (its first frame is the services' last)
      // and moves evenly to the other, so neither end jumps
      function lFit(fi) {
        var a = sFit(sn - 1), e = clamp01(fi / (ln - 1));
        return [a[0] + (focus[0] - a[0]) * e, a[1] + (focus[1] - a[1]) * e];
      }
      // Services move throughout the entire scroll interval, including the final deliverable.
      var SV_IN = 0, SV_END = 1;
      function svFrac(lt) { return clamp01((lt - SV_IN) / (SV_END - SV_IN)); }
      // Within a stretch the frames follow the camera's path, not their numbers: an equal bit of scroll moves the camera
      // an equal distance (frames where it barely moves go by quickly, a long flight is spread out), with a light ease
      // in and out (never a stop). C: the camera's distance travelled up to each frame (manifest camera.frames[].p).
      // the ease: the speed starts at EASE_V0 of full, comes up smoothly (smoothstep) over the first EASE_R of the way,
      // runs even, and goes down the same way at the end, so the middle is barely faster than an even run
      var EASE_R = 0.15, EASE_V0 = 0.5, EASE_A = 1 - EASE_R * (1 - EASE_V0);
      function easeHead(x) { var u = x / EASE_R; return EASE_V0 * x + (1 - EASE_V0) * EASE_R * (u * u * u - u * u * u * u / 2); }
      function ease(x) {
        x = clamp01(x);
        var e = x < EASE_R ? easeHead(x) : x > 1 - EASE_R ? EASE_A - easeHead(1 - x) : easeHead(EASE_R) + (x - EASE_R);
        return e / EASE_A;
      }
      // from rest to rest: the speed comes up from nothing over the first r of the way (smoothstep), runs even through the
      // middle, and comes down to nothing over the last r
      function easeStop(x, r) {
        x = clamp01(x);
        var hd = function (y) { var u = y / r; return r * (u * u * u - u * u * u * u / 2); }, A = 1 - r;
        return (x < r ? hd(x) : x > 1 - r ? A - hd(1 - x) : hd(r) + (x - r)) / A;
      }
      function arcCum(cam, count) {
        var fr = cam && cam.frames;
        if (!Array.isArray(fr) || fr.length !== count) return null;
        var C = [0];
        for (var i = 1; i < fr.length; i++) {
          var a = fr[i - 1] && fr[i - 1].p, b = fr[i] && fr[i].p;
          if (!a || !b) return null;
          C.push(C[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
        }
        return C;
      }
      // the frame (fractional) at x (0..1) of the way from frame a to frame b along the camera's path
      function arcAt(C, a, b, x) {
        if (!C || !(C[b] - C[a] > 1e-6)) return a + (b - a) * x;
        var t = C[a] + (C[b] - C[a]) * clamp01(x), lo = a, hi = b;
        while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (C[mid] <= t) lo = mid; else hi = mid; }
        var sg = C[hi] - C[lo];
        return lo + (sg > 1e-9 ? (t - C[lo]) / sg : 0);
      }
      var svC = svOk ? arcCum(SV.camera, sn) : null;
      // Allocate a readable scroll interval to every application, including those whose camera moves only slightly.
      // The remaining 10% follows camera distance. Monotone Hermite interpolation keeps velocity continuous and positive.
      var serviceTiming = lines.map(function (L) {
        if (!L.steps || L.steps.length !== 5) return null;
        var frames = [L.a].concat(L.steps), total = svC && svC[L.b] - svC[L.a];
        var y = frames.map(function (f) { return total > 1e-6 ? (svC[f] - svC[L.a]) / total : (f - L.a) / Math.max(1, L.b - L.a); });
        var x = [0], h = [], d = [], slopes = [];
        for (var j = 0; j < 5; j++) { h[j] = 0.18 + 0.1 * (y[j + 1] - y[j]); x.push(x[j] + h[j]); d[j] = (y[j + 1] - y[j]) / h[j]; }
        x[5] = 1; slopes[0] = d[0]; slopes[5] = d[4];
        for (var j = 1; j < 5; j++) {
          var w1 = 2 * h[j] + h[j - 1], w2 = h[j] + 2 * h[j - 1];
          slopes[j] = d[j - 1] > 0 && d[j] > 0 ? (w1 + w2) / (w1 / d[j - 1] + w2 / d[j]) : 0;
        }
        return { x: x, y: y, h: h, slopes: slopes };
      });
      function lineFrame(k, lt) {
        var L = lines[k], T = serviceTiming[k], x = svFrac(lt);
        if (!T) return arcAt(svC, L.a, L.b, x);
        var j = 0; while (j < 4 && x > T.x[j + 1]) j++;
        var t = clamp01((x - T.x[j]) / T.h[j]), t2 = t * t, t3 = t2 * t;
        var y = (2*t3-3*t2+1)*T.y[j] + (t3-2*t2+t)*T.h[j]*T.slopes[j]
          + (-2*t3+3*t2)*T.y[j+1] + (t3-t2)*T.h[j]*T.slopes[j+1];
        return arcAt(svC, L.a, L.b, y);
      }
      function stepLt(k, j) {
        var T = serviceTiming[k], x = T ? T.x[Math.max(0, Math.min(5, j - 1))] : clamp01((j - 1) / 5);
        return SV_IN + (SV_END - SV_IN) * x;
      }
      function lineStep(k, lt) {
        var j = 1;
        while (j < 5 && lt >= stepLt(k, j + 1)) j++;
        var a = stepLt(k, j), b = stepLt(k, j + 1);
        return { j: j, q: clamp01((lt - a) / Math.max(1e-6, b - a)), f: lineFrame(k, lt) };
      }
      // the inverse: where in its stretch (lt) line k shows frame fr
      function lineLt(k, fr) {
        var L = lines[k], lo = SV_IN, hi = SV_END;
        if (fr <= L.a) return lo;
        if (fr >= L.b) return hi;
        for (var i = 0; i < 40; i++) { var mid = (lo + hi) / 2; if (lineFrame(k, mid) < fr) lo = mid; else hi = mid; }
        return (lo + hi) / 2;
      }
      // the station that shows the opening's frame fi (the inverse of update's map for p <= 3)
      function introP(fi) {
        if (fi <= iMap[0]) return -PRE * (1 - fi / Math.max(1e-6, iMap[0]));
        for (var s = 0; s < 3; s++) {
          var d = iMap[s + 1] - iMap[s];
          if (fi <= iMap[s + 1] || s === 2) return s + (d > 0 ? clamp01((fi - iMap[s]) / d) : 1);
        }
        return S_LOGO;
      }
      function seqAt(p) {
        var q = Math.max(S_POS, Math.min(NS - 1, p)), k = Math.min(4, Math.floor(q - S_POS));
        return lineFrame(k, q - S_POS - k);
      }
      self = {
        ready: false, failed: false, day: !!dayL, dayFailed: false, m: m, fi: 0, sw: 0, di: -1, dark: 0,
        climb: climbTop ? { from: dayKeys[3], top: climbTop, src: dayL[climbTop].src, map: null } : null,
        intro: !!iL, introFailed: false, introReady: false, ifi: -1, services: svOk, lines: lines,
        // the lead into VISION: its list, where the page is in it and whether the page is near it (for pump)
        lead: leadL ? { L: leadL, at: 0, near: false } : null, leadFailed: false,
        // the old sun frames are no longer played; the flag only keeps the old sun arc hidden
        sun: !!(m.sun && m.sun.pattern && m.sun.count > 1),
        seq: "", frame: -1, // the sequence on screen ("i" intro, "s" services, "f" the story's own frames, "l" the lead into VISION, "d" day) and its frame
        svc: { line: null, step: 0, t: 0 },
        // every station frame of the opening has arrived (or failed)
        cacheInfo: function () {
          var loaded = function(l) { return l ? l.filter(function(f) { return f.st === 2; }).length : 0; };
          return { services: loaded(seq), intro: loaded(iL), day: loaded(dayL), lead: loaded(leadL), busy: busy };
        },
        introKeysReady: function () { return !iL || self.introFailed || iKeys.every(function (k) { return iL[k].st >= 2; }); },
        // a world point -> where it is on screen now ([x, y] viewport CSS pixels, with the cover crop and the lens
        // shift), from the camera of the frame on screen; null when there is none or the point is behind it
        project: function (X) {
          var s = shown;
          if (!s || !s.cams || !Array.isArray(X) || X.length < 3) return null;
          var q = s.cams[s.k](X);
          return q ? [view.x + (s.ox + q[0] * s.w) * view.kx, view.y + (s.oy + q[1] * s.h) * view.ky] : null;
        },
        // The ground under the day's frame on screen, seen from above (the climb): where the middle of the site is
        // (x, y: viewport CSS px), how many CSS px a kilometre of ground is there (ppk), which way the ground's x axis
        // points on screen (rot, radians) and where the whole frame lies (frame). at: a day frame (it may stand
        // between two) as it would be drawn in this window, instead of what is on screen. null when not known.
        ground: function (at) {
          if (!dayCam || !cv.width || !cv.height) return null;
          var W = cv.width, H = cv.height, s = Math.max(W / IW, H / IH), w = IW * s, h = IH * s, ox = (W - w) * focus[0], oy = (H - h) * focus[1], k, t = 0;
          if (typeof at === "number") { k = Math.floor(at); t = at - k; }
          else { if (!shown || shown.L !== dayL) return null; if (shown.gl) { k = shown.gl[0]; t = shown.gl[1]; } else k = shown.k; }
          k = Math.max(0, Math.min(dayL.length - 1, k));
          var pr = dayCam[k], a = pr && pr([0, 0, 0]), b = pr && pr([160, 0, 0]); if (!a || !b) return null;
          var gx = a[0] * IW, gy = a[1] * IH, len = Math.hypot((b[0] - a[0]) * IW, (b[1] - a[1]) * IH), ang = Math.atan2((b[1] - a[1]) * IH, (b[0] - a[0]) * IW), g = t > 0 ? glide(k) : null;
          if (g) { gx = g.a[0] + (g.b[0] - g.a[0]) * t; gy = g.a[1] + (g.b[1] - g.a[1]) * t; len *= Math.exp(g.ls * t); ang += g.ro * t; }
          return { x: view.x + (ox + gx * s) * view.kx, y: view.y + (oy + gy * s) * view.ky, ppk: len * s * view.kx / 0.16, rot: ang,
            frame: { x: view.x + ox * view.kx, y: view.y + oy * view.ky, w: w * view.kx, h: h * view.ky } };
        },
        // where the frame on screen is drawn, in viewport CSS pixels (for overlays that follow the picture), or null
        frameRect: function () {
          var s = shown;
          return s ? { x: view.x + s.ox * view.kx, y: view.y + s.oy * view.ky, w: s.w * view.kx, h: s.h * view.ky } : null;
        },
        // p: film station (the opening plays over -0.6..3)
        update: function (p) {
          // stations 0..4 -> the one-take, piecewise linear between the stations' frames; before station 0 its first
          // frames play up to the hello frame
          var ifi = -1;
          if (iL && !self.introFailed) {
            if (p < 0) ifi = iMap[0] * clamp01(1 + p / PRE);
            else {
              var iq = Math.min(4, p), is = Math.min(3, Math.floor(iq));
              // from the brand to the positioning line (scrolled, 3 -> 4) along the camera's path; the autoplayed part as it was
              ifi = is === 3 ? arcAt(iArc, iMap[3], iMap[4], ease(iq - 3)) : iMap[is] + (iMap[is + 1] - iMap[is]) * (iq - is);
            }
            introAt = ifi; nearIntro = p < 3.6;
          }
          self.ifi = ifi;
          var fi = seqAt(p);
          // stations 10..15 -> the day's section frames, linear in between. The services' last frame is the day's
          // first, so the day takes over at station 9; without the services the story's last frame cuts to the day's
          // first half-way to the first section
          var di = 0, dayOn = false;
          if (dayL && !self.dayFailed) {
            var dq = Math.max(10, Math.min(15, p)), dk = Math.min(4, Math.floor(dq - 10));
            di = dayKeys[dk] + (dayKeys[dk + 1] - dayKeys[dk]) * (dq - 10 - dk);
            // the climb: how far up its frames the camera is, as the page's way out to the earth says (climb.map, set by
            // earth-site.js: one even pull from the site to the whole earth); by itself, up over the first part of the way
            if (climbTop && dk === 3) {
              var cm = self.climb.map ? +self.climb.map(dq - 13) : (dq - 13.04) / 0.26;
              di = dayKeys[3] + (climbTop - dayKeys[3]) * Math.max(0, Math.min(1, cm === cm ? cm : 0));
            }
            // 9 -> 10: from the last service frame (= the day's first) on into VISION, along the camera's path
            if (svOk && p < 10) di = arcAt(dayArc, 0, dayKeys[0], ease(p - (NS - 1)));
            dayOn = p >= (svOk ? NS - 1 : NS - 0.5);
          }
          // 9 -> 10 with the lead: its frames along the camera's path, evenly over the scroll from station 9 to station
          // 10 (scrollShare; no easing: the stretch is long and the camera moves little, so an even drift reads best).
          // The film's place p is not even in scroll here: the services overview's mark gives its long stay only a fifth
          // of the station, and p, which follows the scroll with a delay counted in stations, closes that delay all at
          // once where the pace changes at the mark (the camera would surge there while the page is moving). So the
          // camera also follows the scroll itself (leadX, the same 65 ms follow, counted in scroll) and takes the one
          // further back of the two: from p it keeps starting exactly on the services' last frame and ending on
          // VISION's, from the scroll an even pace across the mark.
          var li = -1, leadOn = false, lead = self.lead;
          if (lead && !self.leadFailed) {
            var lq = scrollShare(progress()), lnow = performance.now(), ldt = Math.min(0.1, (lnow - leadT) / 1000);
            leadX = leadT && !reduce ? leadX + (lq - leadX) * (1 - Math.exp(-ldt / 0.065)) : lq; leadT = lnow;
            if (Math.abs(lq - leadX) < 1e-5) leadX = lq;
            li = p <= NS - 1 ? 0 : p >= NS ? ln - 1 : arcAt(leadArc, 0, ln - 1, Math.min(leadX, scrollShare(p)));
            leadOn = dayOn && p < NS;
            // (the day's place meanwhile: where the lead's frame stands among the day's frames)
            if (p < NS) { var lj = Math.min(ln - 2, Math.floor(li)); di = leadPos[lj] + (leadPos[lj + 1] - leadPos[lj]) * (li - lj); }
            lead.at = li; lead.near = p > 8.6 && p < NS + 0.5;
          }
          want = fi; dayAt = di; nearDay = p > 8.4; nearServices = p > 3.4 && p < 9.2;
          var clock = performance.now();
          if (clock - trimAt > 150) {
            trimAt = clock;
            trimCache(seq, fi, nearServices ? 28 : -1, sKeys);
            trimCache(iL, ifi, nearIntro ? 22 : -1, iKeys || []);
            trimCache(dayL, di, nearDay ? 22 : -1, dayKeys || []);
            if (lead && !self.leadFailed) trimCache(leadL, li, lead.near ? 28 : -1, []);
            cv.dataset.cachedFrames = JSON.stringify(self.cacheInfo());
          }
          self.fi = fi; self.di = dayOn ? di : -1;
          // how dark the day behind the sections is (0 day … 1 night), for the veil
          self.dark = dayOn && dayH ? darkAt(leadOn && leadH ? leadH[Math.round(li)] : dayH[Math.round(di)]) : 0;
          if (left > 0) pump();
          var dpr = Math.min(window.devicePixelRatio || 1, 1.5, IW / Math.max(1, cv.clientWidth)), W = Math.round(cv.clientWidth * dpr) || 1, H = Math.round(cv.clientHeight * dpr) || 1;
          if (cv.width !== W || cv.height !== H) {
            cv.width = W; cv.height = H; dirty = true;
            var r = cv.getBoundingClientRect();
            view = { kx: r.width / W, ky: r.height / H, x: r.left, y: r.top };
          }
          // the sequence for where the page is; while none of its frames has loaded, the services' (the story's first frame)
          var L = seq, at = fi, cams = seqCam, tag = svOk ? "s" : "f";
          if (ifi >= 0 && p < S_POS) { L = iL; at = ifi; cams = iCam; tag = "i"; }
          else if (leadOn) { L = leadL; at = li; cams = leadCam; tag = "l"; }
          else if (dayOn) { L = dayL; at = di; cams = dayCam; tag = "d"; }
          var k = pick(L, at);
          if (k < 0 && L !== seq) { L = seq; cams = seqCam; tag = svOk ? "s" : "f"; k = pick(seq, fi); }
          if (k >= 0) {
            // a phone held upright: through the service lines the frame fills the top of the screen only (the building in
            // the upper part, the AI workspace on paper below it); it eases in over the overview and out at the day
            var band = L === seq && svOk && W / H < 0.8 ? ssr(S_POS + 0.3, S_POS + 0.9, p) * (1 - ssr(NS - 1.15, NS - 1, p)) : 0;
            var BH = H * (1 - 0.46 * band); // services.js keeps its workspace below this (0.54 of the screen)
            var fc = L === iL ? iFit(k) : L === leadL ? lFit(k) : L === seq && svOk ? sFit(k, BH) : focus, key = tag + k + "|" + fc[0].toFixed(4) + "," + fc[1].toFixed(4) + "|" + band.toFixed(3);
            var gl = null, g0 = Math.floor(at), gt = at - g0;
            if (L === dayL && !reduce && !band && gt > 0.01 && gt < 0.99 && g0 + 1 < dayL.length && dayL[g0].st === 2 && dayL[g0 + 1].st === 2) gl = glide(g0);
            if (gl) key += "~" + g0 + "+" + gt.toFixed(3);
            if (dirty || key !== lastKey) {
              var img = L[k].img, iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(W / iw, BH / ih), w = iw * s, h = ih * s;
              var ox = (W - w) * fc[0], oy = band > 0 ? (BH - h) * fc[1] : (H - h) * fc[1];
              cx.globalAlpha = 1; cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high";
              if (band > 0) {
                cx.fillStyle = "#f6f4ee"; cx.fillRect(0, 0, W, H);
                cx.drawImage(img, ox, oy, w, h);
                var gy = BH - Math.min(BH * 0.22, 140 * dpr), gr = cx.createLinearGradient(0, gy, 0, BH);
                gr.addColorStop(0, "rgba(246,244,238,0)"); gr.addColorStop(1, "rgba(246,244,238,1)");
                cx.fillStyle = gr; cx.fillRect(0, gy, W, BH - gy + 1);
              } else if (gl) {
                // each frame moved to the place between the two: the wider one underneath, whole; the other over it, as
                // much as it still counts
                var gmx = gl.a[0] + (gl.b[0] - gl.a[0]) * gt, gmy = gl.a[1] + (gl.b[1] - gl.a[1]) * gt;
                var put = function (im, e, from, alpha) {
                  var mm = Math.exp(gl.ls * e), co = mm * Math.cos(gl.ro * e), si = mm * Math.sin(gl.ro * e);
                  cx.setTransform(s * co, s * si, -s * si, s * co, ox + s * (gmx - (co * from[0] - si * from[1])), oy + s * (gmy - (si * from[0] + co * from[1])));
                  cx.globalAlpha = alpha; cx.drawImage(im, 0, 0, iw, ih);
                };
                if (gl.ls <= 0) { put(dayL[g0 + 1].img, gt - 1, gl.b, 1); put(dayL[g0].img, gt, gl.a, 1 - gt); }
                else { put(dayL[g0].img, gt, gl.a, 1); put(dayL[g0 + 1].img, gt - 1, gl.b, gt); }
                cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1;
              } else cx.drawImage(img, ox, oy, w, h);
              shown = { L: L, k: k, cams: cams, ox: ox, oy: oy, w: w, h: h, gl: gl ? [g0, gt] : null };
              self.seq = tag; self.frame = k; dirty = false; lastKey = key;
              cv.dataset.sequence = tag; cv.dataset.frame = k;
            }
          }
          // the services' line, step and progress (window.PRISM_STORY.svc): line k from SV_IN past station 4+k to
          // SV_IN past 5+k (so a finished line stays up into the next stretch, and a whole station is a finished line);
          // t = 0..1 over that, step = how many of its steps the frame on screen has fully shown
          var sv = self.svc;
          if (p > S_POS + SV_IN + 1e-4 && p < NS - 1 + SV_IN + 1e-4) {
            var lk = Math.max(0, Math.min(4, Math.ceil(p - S_POS - SV_IN - 1e-4) - 1)), LL = lines[lk], lt = Math.min(1, p - S_POS - lk);
            var sf = lineFrame(lk, lt);
            if (lt < 1 && shown && shown.L === seq && shown.k >= Math.min(LL.a, LL.b) && shown.k <= Math.max(LL.a, LL.b)) sf = shown.k;
            sv.line = LL.id; sv.t = clamp01((lt - SV_IN) / (1 - SV_IN)); sv.step = LL.steps.filter(function (v) { return v <= sf + 0.001; }).length;
          } else { sv.line = null; sv.step = 0; sv.t = 0; }
          // with the one-take the frames are on screen from the start (its last frame is the story's first);
          // after the photographs the story's frames take over from them at station 3.5
          storyA = iL && !self.introFailed ? 1 : self.ready && p >= S_LOGO + 0.5 ? 1 : 0;
          var vis = storyA > 0.5;
          if (vis !== cv._vis) { cv._vis = vis; cv.style.visibility = vis ? "visible" : "hidden"; }
        },
        // after the film, when the three.js model plays the day instead: the frames make way for it
        fade: function (a) { var o = a > 0.999 ? "" : a.toFixed(3); if (o !== cv._op) { cv._op = o; cv.style.opacity = o; } },
        remove: function () { cv.remove(); },
        // the services' timing for the workspace (services.js): the frame of line k at lt, the lt of a frame, the holds
        lineFrame: lineFrame, lineLt: lineLt, lineStep: lineStep, stepLt: stepLt, svIn: SV_IN, svEnd: SV_END,
        // the lowest point of the drawn logo on screen at the end of the opening (beats.name), viewport CSS px, or null
        logoBottom: function () {
          var lg = m.intro && m.intro.logo && m.intro.logo.world;
          if (!iL || self.introFailed || !iCam || !Array.isArray(lg)) return null;
          var k = iMap[3], pr = iCam[k], Wc = cv.width, Hc = cv.height;
          if (!pr || Wc < 2 || Hc < 2) return null;
          var fc = iFit(k), s = Math.max(Wc / IW, Hc / IH), h = IH * s, oy = (Hc - h) * fc[1], y = -1e9;
          lg.forEach(function (pl) { pl.forEach(function (X) { var q = pr(X, true); if (q) y = Math.max(y, oy + q[1] * h); }); });
          return y > -1e8 ? view.y + y * view.ky : null;
        },
        // the opening played by itself, x 0..1 of its time -> { p, f }: the camera from the first frame down to the empty
        // site (beats.top) at an even speed along its path, easing in as it sets off and out as it comes to rest
        // (smoothstep); then, the camera still, the logo drawn on the ground up to beats.name, slowing at the end.
        // p is the station that shows frame f (the inverse of update's opening map), so the words follow it too.
        introAuto: function (x) {
          if (!iL || self.introFailed) return null;
          var SPLIT = 0.82, f;
          x = clamp01(x);
          if (x < SPLIT) f = arcAt(iArc, 0, iMap[2], easeStop(x / SPLIT, 0.22));
          else { var v = (x - SPLIT) / (1 - SPLIT); f = iMap[2] + (iMap[3] - iMap[2]) * (v * (2 - v)); }
          return { p: introP(f), f: f };
        },
        // the sequence and fractional frame for the scrolled stations 3-10 (as update() picks them; for checking the pacing)
        at: function (p) {
          if (iL && !self.introFailed && p < S_POS) return { s: "i", f: arcAt(iArc, iMap[3], iMap[4], ease(Math.max(0, p - 3))) };
          if (leadL && !self.leadFailed && p >= NS - 1 && p < NS) return { s: "l", f: arcAt(leadArc, 0, ln - 1, scrollShare(p)) };
          if (dayL && !self.dayFailed && svOk && p >= NS - 1) return { s: "d", f: p < 10 ? arcAt(dayArc, 0, dayKeys[0], ease(p - (NS - 1))) : dayKeys[0] };
          return { s: "s", f: seqAt(p) };
        },
        // how far the camera travels in each stretch from station 3 to 10 and the share of the stretch that moves
        // (the rest holds): [3-4 the dive to the positioning line, 4-5 overview, 5-9 the four lines, 9-10 into VISION]
        pace: function () {
          var len = function (C, a, b) { return C ? C[b] - C[a] : NaN; }, out = [];
          out.push({ L: iL && !self.introFailed ? len(iArc, iMap[3], iMap[4]) : NaN, play: 1 });
          lines.forEach(function (L) { out.push({ L: len(svC, L.a, L.b), play: SV_END - SV_IN }); });
          out.push({ L: dayL && svOk ? len(dayArc, 0, dayKeys[0]) : NaN, play: 1 });
          return out;
        }
      };
      pump();
      return self;
    }
    if (window.fetch && !/[?&]story=0\b/.test(location.search)) {
      fetch("assets/story/manifest.json", { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error("no manifest"); return r.json(); })
        .then(function (m) {
          return fetch("assets/story/motion.json", { cache: "no-cache" }).then(function(r) {
            if (!r.ok) throw new Error("no dense service frames");
            return r.json();
          }).then(function(sv) {
            if (sv.count > 0 && sv.sourceFrameMap && sv.camera.frames.length === sv.count) m.services = sv;
            return m;
          }).catch(function() { return m; });
        })
        .then(function (m) {
          if (!m || !(m.count > 0) || typeof m.pattern !== "string") throw new Error("bad manifest");
          var I = m.intro, withIntro = !!(I && typeof I.pattern === "string" && I.count > 1) && !/[?&]intro=0\b/.test(location.search) && webglOK();
          storyM = m; story = makeStory(m, withIntro); storyOn = true;
          pace(true);
          document.body.classList.add("story-on"); document.body.classList.toggle("story-sun", story.sun);
          if (!story.intro) startPhoto();
          // no day for the sections: the model plays it after the film (started once the frames have had their head start)
          if (!story.day) setTimeout(startModel, 2500);
        })
        .catch(function () { story = null; storyOn = false; startPhoto(); startModel(); });
      // a manifest that takes too long: the photographs start meanwhile (the one-take still covers them once it plays)
      setTimeout(function () { if (!storyOn) startPhoto(); }, 4000);
    } else { startPhoto(); startModel(); }
    var floorTip = document.getElementById("floorTip");
    var veil = document.getElementById("veil"), veilF, veilL, veilS, veilN, toneV = 0, darkV = 0, veilSecs = [];
    if (veil) {
      veilF = veil.querySelector(".vf"); veilL = veil.querySelector(".vl"); veilS = veil.querySelector(".vs");
      veilN = document.createElement("i"); veilN.className = "vn"; veil.appendChild(veilN);
      veilSecs = [].slice.call(document.querySelectorAll("main > section")).filter(function (s) { return s !== film; });
    }

    function sceneTop(s) {
      var total = film.offsetHeight - innerHeight;
      return film.getBoundingClientRect().top + window.scrollY + stationAt(s) * total;
    }
    goToChapter = function (s) {
      window.scrollTo({ top: sceneTop(s), behavior: reduce ? "auto" : "smooth" });
    };
    // ---------- pacing: scroll length by how far the camera travels ----------
    // Stations 3-10 (the dive to the positioning line, the overview, the four lines, on into VISION): each stretch gets
    // scroll in proportion to camera travel, so a bit of scroll moves the camera about as far everywhere; each stays within LO..HI times its old
    // length. When the longest flight (development: the dive from the overview down to the street) cannot keep within
    // twice the average that way, it alone may go to HI_LONG.
    var PACE_LO = 0.7, PACE_HI = 2.2, PACE_HI_LONG = 3.6, LINE_SLOW = 1, SERVICE_MIN_VH = 5.75, paceInfo = null;
    function paceFit(L, play, base, lo, hi) {
      var sumL = 0, best = null;
      L.forEach(function (v) { sumL += v; });
      for (var j = 0; j <= 800; j++) {
        var k = Math.pow(10, -6 + j * 7 / 800), u = [], su = 0, mx = 0;
        L.forEach(function (v, i) { var x = Math.max(lo[i] * base[i], Math.min(hi[i] * base[i], k * v / play[i])); u.push(x); su += x; mx = Math.max(mx, v / (play[i] * x)); });
        var r = mx / (sumL / su);
        // the fittest k; between equals, the one closest to the old total length
        if (!best || r < best.r - 1e-6 || (Math.abs(r - best.r) <= 1e-6 && Math.abs(su - best.base) < Math.abs(best.su - best.base))) best = { r: r, u: u, su: su, base: base.reduce(function (a, b) { return a + b; }, 0) };
      }
      return best;
    }
    function pace(first) {
      if (!storyOn || !story || !story.pace) return;
      var P = story.pace();
      if (P.some(function (e) { return !(e.L >= 0); })) {
        var fallbackSeg = SEG0.map(function(v,g) { return g >= S_POS + 1 ? SERVICE_MIN_VH / (STEP * 1.09) : v; });
        setPace(fallbackSeg, 0); buildAnchors(); return;
      }
      var unit = STEP * 1.09 * innerHeight, sec = document.querySelector('main > section[data-s="' + NS + '"]');
      // 9 -> 10 runs from the film's end to the middle of the first section: (screen + section) / 2 without a tail
      var base = P.map(function () { return 1; });
      base[base.length - 1] = ((innerHeight + (sec ? sec.offsetHeight : innerHeight)) / 2) / unit;
      var L = P.map(function (e) { return e.L; }), play = P.map(function (e) { return e.play; });
      // (the way into VISION can only be lengthened: its old length is the layout's)
      var lo = L.map(function (v, i) { return i === L.length - 1 ? 1 : PACE_LO; });
      var hi = L.map(function () { return PACE_HI; }), fit = paceFit(L, play, base, lo, hi), r22 = fit.r;
      if (fit.r > 2) {
        var top = 0; L.forEach(function (v, i) { if (v / play[i] > L[top] / play[top]) top = i; });
        hi[top] = PACE_HI_LONG;
        var f2 = paceFit(L, play, base, lo, hi);
        if (f2.r < fit.r) fit = f2;
      }
      var seg = SEG0.slice();
      // the four service lines (stations 5-9) slowed down as one: LINE_SLOW times their share, so the camera and workspace move
      // continuously, with 5.75 screens per service line (over one screen minimum per application).
      for (var g = FIRST; g < NS - 1; g++) {
        seg[g] = fit.u[g - FIRST];
        if (g >= S_POS + 1) seg[g] = Math.max(seg[g] * LINE_SLOW, SERVICE_MIN_VH / (STEP * 1.09));
      }
      var y0 = window.scrollY, p0 = first ? null : progress();
      setPace(seg, Math.max(0, fit.u[fit.u.length - 1] - base[base.length - 1]));
      paceInfo = { L: L, play: play, base: base, u: fit.u, seg: seg.slice(FIRST, NS - 1), lineSlow: LINE_SLOW, minimumServiceVH: SERVICE_MIN_VH, ratio: fit.r, ratioWithin22: r22, tail: TAIL };
      buildAnchors();
      // the page keeps its place: a link to a section, or where it was before a resize
      if (first && location.hash.length > 1) { var t = document.getElementById(location.hash.slice(1)); if (t && window.scrollY > 2) t.scrollIntoView({ behavior: "instant" }); }
      else if (p0 !== null && y0 > 2 && p0 <= NS - 1) window.scrollTo({ top: filmY(p0), behavior: "instant" });
    }
    // a film position (station, fractions allowed) -> the page's scroll position
    function filmY(p) {
      var s = Math.max(FIRST, Math.min(NS - 1, p)), a = Math.min(NS - 2, Math.floor(s));
      return sceneTop(a) + (sceneTop(a + 1) - sceneTop(a)) * (s - a);
    }
    // the film position where a service line shows step `step` (1..5; 0 its first frame), on the player's timing
    // (line k from station 4+k: holds SV_IN, plays its frames up to SV_END); "overview" is k 0
    function lineAt(id, step) {
      var k = LINE_IDS.indexOf(id); if (k < 0) return -1;
      var L = storyOn && story.lines ? story.lines[k] : null, a, b, st;
      if (L) { a = L.a; b = L.b; st = L.steps; } else { a = 0; b = 1; st = []; }
      var lt = storyOn && story.lineLt ? function (fr) { return story.lineLt(k, fr); } : function (fr) { return 0.04 + 0.71 * (b > a ? (fr - a) / (b - a) : 1); };
      var s0 = lt(a), s1 = lt(b);
      // a whole line (or the overview) in view: near the end, still inside this line
      if (step >= 5 || (!st.length && step >= 1)) return S_POS + k + s1 - 0.02;
      if (!(step >= 1)) return S_POS + k + s0;
      // a step: near its end, with its workspace readable while the camera continues
      if (storyOn && story.stepLt) { var e0 = story.stepLt(k, step), e1 = story.stepLt(k, step + 1); return S_POS + k + e1 - 0.2 * (e1 - e0); }
      var x0 = step === 1 ? s0 : lt(st[step - 2]), x1 = lt(st[step - 1]);
      return S_POS + k + (x0 + x1) / 2;
    }

    // station navigation: links can still jump to a film station
    [].forEach.call(document.querySelectorAll("[data-goto]"), function (b) {
      b.addEventListener("click", function () { goToChapter(+b.dataset.goto); });
    });
    // the services section is gone; #services now lands on the first step of the film
    var servicesMark = null;
    if (!document.getElementById("services")) {
      servicesMark = document.createElement("div"); servicesMark.id = "services"; servicesMark.className = "st-mark";
      servicesMark.setAttribute("aria-hidden", "true"); film.appendChild(servicesMark);
    }

    // AI view around the pointer (mouse only); it fades out when the pointer rests
    var finePointer = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
    var lx = 0.5, ly = 0.5, tlx = 0.5, tly = 0.5, la = 0, lastMove = -1e9;
    if (!reduce) window.addEventListener("pointermove", function (e) {
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
      tlx = e.clientX / innerWidth; tly = e.clientY / innerHeight; lastMove = performance.now();
    }, { passive: true });
    document.addEventListener("pointerleave", function () { lastMove = -1e9; });

    var smooth = -1, target = 0, raf = 0, lastFollow = 0;
    // ---------- the opening plays by itself ----------
    // Once the page has loaded, the one-take plays on its own in one unbroken camera move (about 9 s): from its first
    // frame down onto the site at an even camera speed (the camera's path, manifest intro.camera.frames), easing only as
    // it sets off and as it comes to rest over the lot; then, the camera still, the logo is drawn on the ground
    // (beats.top -> beats.name). "你好", "我們是" and AEC PRISM come and go on their beats meanwhile. It ends on station
    // 3, the top of the page. While it plays, the page does not move: wheel, touch and keys are held (not skipped).
    // Not replayed when the page comes back to the top; with reduced motion, a link to a section or a page opened
    // further down, the page starts on station 3 (or wherever it is).
    var AUTO_T = 9; // seconds (the intro's own split is in makeStory: introAuto)
    var auto = !reduce && window.scrollY < 2 && location.hash.length < 2 ? 1 : 0; // 1 waiting for the frames, 2 playing, 0 done
    var autoT0 = 0, autoP = -PRE, autoLoad = performance.now();
    function autoEnd() {
      if (!auto) return;
      auto = 0; autoP = S_LOGO;
      document.body.classList.remove("auto-play");
    }
    if (auto) {
      document.body.classList.add("auto-play");
      // held while it plays: nothing scrolls and nothing skips
      var hold = function (e) { if (auto && e.cancelable) e.preventDefault(); };
      window.addEventListener("wheel", hold, { passive: false });
      window.addEventListener("touchmove", hold, { passive: false });
      window.addEventListener("keydown", function (e) {
        if (auto && /^( |Spacebar|PageDown|PageUp|ArrowDown|ArrowUp|End|Home)$/.test(e.key) && !e.target.closest("input,textarea,select")) e.preventDefault();
      });
      // anything else that moves the page meanwhile (the scroll bar, the browser putting the page back) goes back up
      window.addEventListener("scroll", function () { if (auto && window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" }); }, { passive: true });
    }
    // starts once the opening's station frames are in (or the photographs are up); never waits more than 3 s
    function autoTick(now) {
      if (auto === 1) {
        var ok = (storyOn && story.intro && !story.introFailed && story.introKeysReady()) || (glOn && !introLive()) || now - autoLoad > 3000;
        if (!ok) { autoP = -PRE; return; }
        auto = 2; autoT0 = now;
      }
      if (auto === 2) {
        var t = (now - autoT0) / 1000, x = clamp01(t / AUTO_T);
        // the one-take along its camera path; the photographs (no one-take) through their stations, eased at both ends
        var ia = introLive() && story.introAuto ? story.introAuto(x) : null;
        autoP = ia ? ia.p : -PRE + (S_LOGO + PRE) * x * x * (3 - 2 * x);
        if (x >= 1) autoEnd();
      }
    }
    document.body.classList.add("is-loading");
    setTimeout(function () { document.body.classList.remove("is-loading"); }, 60);
    // scroll position -> camera station: film scenes are spread over the film,
    // each later section holds its own station while its middle crosses the middle of the screen
    var anchors = [];
    function buildAnchors() {
      anchors = [];
      var ft = film.getBoundingClientRect().top + window.scrollY, total = film.offsetHeight - innerHeight;
      for (var s = FIRST; s < NS; s++) anchors.push([ft + stationAt(s) * total, s]);
      if (servicesMark) servicesMark.style.top = (stationAt(5) * total).toFixed(0) + "px";
      [].forEach.call(document.querySelectorAll("section[data-s]"), function (sec) {
        var r = sec.getBoundingClientRect(), y = r.top + window.scrollY + r.height / 2 - innerHeight / 2;
        var last = anchors[anchors.length - 1][0];
        anchors.push([Math.max(y, last + 1), +sec.dataset.s]);
      });
    }
    function progress(at) {
      var y = typeof at === "number" ? at : window.scrollY;
      if (!anchors.length) buildAnchors();
      if (y <= anchors[0][0]) return anchors[0][1];
      for (var k = 1; k < anchors.length; k++) {
        if (y <= anchors[k][0]) {
          var a = anchors[k - 1], b = anchors[k];
          return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]);
        }
      }
      return anchors[anchors.length - 1][1];
    }
    // Between the film's last station and the first section the page can pass marks with stations of their own (the
    // services overview's, in index.html), so the film's place there is not even in scroll. For the lead into VISION:
    // how far a film place p between the two stands along the scroll from the one to the other (0..1), so the camera
    // can move evenly over the whole way. A mark that repeats the last station (a hold) is where the way starts.
    function scrollShare(p) {
      if (!anchors.length) buildAnchors();
      var i0 = NS - 1 - FIRST, k;
      while (i0 < anchors.length - 1 && anchors[i0 + 1][1] <= NS - 1) i0++;
      for (k = i0 + 1; k < anchors.length - 1 && anchors[k][1] < NS; k++) {}
      if (k >= anchors.length || !(anchors[k][0] > anchors[i0][0])) return clamp01(p - (NS - 1));
      for (var j = i0 + 1; j <= k; j++) {
        var a = anchors[j - 1], b = anchors[j];
        if (p <= b[1]) return clamp01((a[0] + (b[0] - a[0]) * clamp01((p - a[1]) / (b[1] - a[1])) - anchors[i0][0]) / (anchors[k][0] - anchors[i0][0]));
      }
      return 1;
    }
    // when scrolling stops halfway between the brand and the positioning line (3-4), settle on the nearer one; the
    // service lines (4.6-9) can rest on any of their steps (the AI workspace reads at every step)
    var settleT = 0;
    if (!reduce) window.addEventListener("scroll", function () {
      clearTimeout(settleT);
      settleT = setTimeout(function () {
        var p = progress(), f = p - Math.floor(p);
        if (window.PRISM_NO_SETTLE || auto || p <= FIRST || p >= S_POS || f < 0.2 || f > 0.8) return;
        window.scrollTo({ top: sceneTop(Math.round(p)), behavior: "smooth" });
      }, 240);
    }, { passive: true });
    // (re-paced only when the width changes: a phone's bars coming and going must not move the page)
    var paceW = innerWidth;
    window.addEventListener("resize", function () { if (innerWidth !== paceW) { paceW = innerWidth; pace(false); } buildAnchors(); });
    window.addEventListener("load", buildAnchors);
    setTimeout(buildAnchors, 1500);
    function clamp01(x) { return Math.max(0, Math.min(1, x)); }
    function ss01(x) { x = clamp01((x - 0.05) / 0.9); return x * x * (3 - 2 * x); }
    updateFilm = function () {
      var p = auto ? autoP : smooth;
      var tt = performance.now() / 1000;
      smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
      // the realistic sequence: a missing first frame sends the page back to the model
      if (storyOn && story.failed) {
        story.remove(); story = null; storyOn = false; storyA = 0;
        document.body.classList.remove("story-on", "story-sun"); startPhoto(); startModel();
      }
      // the daytime one-take plays the opening; when it cannot, the photographs take over as before
      if (storyOn && story.intro && story.introFailed) startPhoto();
      var iLive = introLive();
      // the one-take's first frame is on screen: the page behind the opening is ready
      if (iLive && story.introReady && !reduce && !document.body.classList.contains("gl-on")) document.body.classList.add("gl-on");
      if (storyOn) story.update(p);
      // after the film without a realistic day (or when its frames fail): the model takes over from the film's last
      // frame, which it matches (same camera), and plays the day behind the sections (a cut, never the two at once)
      var modelAfter = storyOn && (!story.day || story.dayFailed);
      if (modelAfter && !modelTried && (story.dayFailed || p > 7)) startModel();
      var afterA = modelAfter && modelOn && p > NS - 0.5 ? 1 : 0;
      if (storyOn) story.fade(1 - afterA);
      // the photo holds until the first realistic frame has fully opened out over it
      var photoVis = glOn && !iLive && (storyOn ? storyA < 0.999 : (!modelOn || p < 4));
      if (glc) glc.style.visibility = photoVis ? "visible" : "hidden";
      if (photoVis) {
        lx += (tlx - lx) * 0.12; ly += (tly - ly) * 0.12;
        var want = finePointer && performance.now() - lastMove < 1800 ? 1 : 0;
        la += (want - la) * (want ? 0.08 : 0.04);
        // the logo is drawn on the ground in one line as the camera dives from the empty site (2) to the setting-out (3),
        // finishing a little before the camera arrives; it fades with the photo after 3. The pointer brightens it.
        logoIn += ((p > S_DIVE - 0.3 && p < S_LOGO + 0.25 ? 1 : 0) - logoIn) * 0.05;
        var drawTo = clamp01((p - S_DIVE - 0.1) / 0.78);
        drawV += (drawTo - drawV) * (reduce ? 1 : 0.07);
        if (Math.abs(drawTo - drawV) < 0.0005) drawV = drawTo;
        PrismGL.render(Math.max(0, Math.min(p, 3)), smx, smy, tt, { intro: 1, lens: [lx, ly, la * clamp01((3.4 - p) * 2)], logo: ss01(logoIn), logoHot: 0,
          draw: drawV < 0.999 ? drawV * 0.45 + ssr(0, 1, drawV) * 0.55 : 1.02 }); // the pen eases in and out but never stops
      }
      var modelVis = modelOn && p > 2.95 && (!storyOn || afterA > 0.001);
      mc && (mc.style.visibility = modelVis ? "visible" : "hidden");
      var lightTone = false, bgDark = storyOn ? story.dark : 0;
      if (modelVis) {
        PrismModel.pointer(finePointer ? tlx : -9, tly);
        var res = PrismModel.render(p, smx, smy, tt, { sunT: sunT, windOn: windOn, windAngle: 0 });
        lightTone = res.light > 0.5 && p > 3.6 && p < NS - 0.5;
        bgDark = storyOn ? bgDark * (1 - afterA) + res.night * afterA : res.night;
        var hv = PrismModel.hovered;
        if (floorTip) {
          floorTip.style.opacity = hv >= 0 ? 1 : 0;
          if (hv >= 0) { floorTip.textContent = "L" + ("0" + (hv + 1)).slice(-2); floorTip.style.transform = "translate(" + (tlx * innerWidth + 16) + "px," + (tly * innerHeight - 30) + "px)"; }
        }
      }
      if (lightTone !== document.body.classList.contains("tone-light")) document.body.classList.toggle("tone-light", lightTone);
      // what the services' UI and the data layer line up with (window.PRISM_STORY, refreshed every animation frame):
      //   p: the station on screen (the smoothed scroll, or the opening while it plays by itself: -0.6..3)
      //   svc: { line: "overview" | "dev" | "design" | "build" | "ops" | null, step: 0..5, t: 0..1 } (story.update)
      //   project([x, y, z]): where a world point is on screen now, [x, y] in viewport CSS pixels, or null
      //   seq / frame: the sequence on screen ("i", "s", "f", "d") and its frame; frame (old meaning) the story frame
      var ds = window.PRISM_STORY || (window.PRISM_STORY = {});
      ds.p = p; ds.story = storyOn && story.ready; ds.sunW = 0;
      ds.svc = storyOn ? story.svc : { line: null, step: 0, t: 0 };
      if (!ds.project) ds.project = function (X) { return storyOn && story ? story.project(X) : null; };
      //   climb: the way up from WHY NOW ({ from, top: its day frames, src: the top frame's picture, map: set by the
      //   earth's page code }) or null; di: the day frame on screen (-1: none); dark: 0 day .. 1 night there;
      //   ground(at): the ground under the day's frame, seen from above (story.ground)
      ds.climb = storyOn && story.climb || null; ds.di = storyOn ? story.di : -1; ds.dark = storyOn ? story.dark : 0;
      if (!ds.ground) ds.ground = function (at) { return storyOn && story && story.ground ? story.ground(at) : null; };
      //   frameRect(): where the frame on screen is drawn ({ x, y, w, h } viewport CSS px) or null
      //   lineAt(id, step) / filmY(p): the film position of a service line's step, and the scroll position of a film position
      //   scrollToLine(id, step, smooth): scrolls there (the left-hand guide)
      //   lineFrame(k, lt) / lineLt(k, frame) / svIn / svEnd: the services' timing within a stretch (services.js)
      //   pace: how the scroll is shared out from station 3 to 10 (L camera travel, u scenes per stretch, ratio)
      if (storyOn && story.lineFrame && !ds.lineFrame) { ds.lineFrame = story.lineFrame; ds.lineLt = story.lineLt; ds.lineStep = story.lineStep; ds.stepLt = story.stepLt; ds.svIn = story.svIn; ds.svEnd = story.svEnd; }
      ds.pace = paceInfo;
      ds.cacheInfo = storyOn && story.cacheInfo ? story.cacheInfo : null;
      //   stationAtY(y) / at(p): the film station at a scroll position, and the sequence and (fractional) frame shown there
      if (!ds.stationAtY) ds.stationAtY = progress;
      ds.at = storyOn && story.at ? story.at : null;
      if (!ds.frameRect) {
        ds.frameRect = function () { return storyOn && story ? story.frameRect() : null; };
        ds.lineAt = lineAt; ds.filmY = filmY;
        ds.scrollToLine = function (id, step, smooth) {
          var q = lineAt(id, step); if (q < 0) return;
          window.scrollTo({ top: filmY(q), behavior: smooth === false || reduce ? "instant" : "smooth" });
        };
      }
      ds.seq = storyOn ? story.seq : ""; ds.seqFrame = storyOn ? story.frame : -1;
      ds.frame = storyOn && !story.services && story.seq === "f" ? story.frame : -1;
      ds.manifest = storyOn ? story.m : null; ds.model = modelVis; ds.windOn = windOn; ds.lang = lang;
      ds.autoplay = !!auto; // the opening is playing by itself
      ds.introFrame = iLive && p < 4 ? story.ifi : -1; // the one-take's frame position in the opening (-1: not playing)
      // the brand in the top bar shows from the positioning line on (one AEC PRISM on screen at a time)
      var brandOff = !!auto || p < S_LOGO + 0.5;
      if (brandOff !== document.body.classList.contains("brand-off")) document.body.classList.toggle("brand-off", brandOff);
      // veil: the film's shade while the film fills the screen, then each section's darkness, weighted by how much of the screen it covers
      if (veil && (glOn || modelOn || storyOn)) {
        if (!document.body.classList.contains("veil-on")) document.body.classList.add("veil-on");
        var vh = innerHeight, wF = clamp01(film.getBoundingClientRect().bottom / vh), dim = 0, secCover = 0;
        veilSecs.forEach(function (sec) {
          var r = sec.getBoundingClientRect(), cover = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top)) / vh;
          if (cover > 0) { dim += cover * (+sec.dataset.dim || 0.9); secCover += cover; }
        });
        toneV += ((lightTone ? 1 : 0) - toneV) * 0.08;
        // "你好" stands in the sky with no wash behind it: the film's veil comes in with "我們是"
        var hiK = ssr(0.45, 0.95, p);
        veilF.style.opacity = (wF * (1 - toneV) * hiK).toFixed(3);
        veilL.style.opacity = (wF * toneV * hiK).toFixed(3);
        // behind the day sections the full-screen wash thins out (more so towards night) so the day shows through;
        // a full-viewport reading wash stays behind all text, outside the text containers and their masks
        darkV += (bgDark - darkV) * 0.1;
        var dayK = ssr(NS - 0.7, NS - 0.1, p);
        veilS.style.opacity = (Math.min(1, dim) * (1 - dayK * (0.5 + 0.3 * darkV))).toFixed(3);
        // the reading wash keeps to the text side (story.css .vn) and thins as the evening comes, so the night shows
        // (on a phone the words run the full width, over the night itself: the wash stays nearly whole there)
        // (none where no section is on screen: the climb's own stretch of scroll after WHY NOW has no words to read)
        var halo = (dayK * (0.9 - (innerWidth <= 760 ? 0.06 : 0.34) * darkV) * ssr(0.12, 0.55, secCover)).toFixed(2);
        if (halo !== veilN._o) { veilN._o = halo; veilN.style.opacity = halo; }
      }
      if (!glOn && !modelOn) {
        layers.forEach(function (l, i) {
          var d = p - i, ad = Math.abs(d);
          // with the realistic sequence behind, the flat pictures stop at the site and open onto it
          if (ad > 1.05 || (storyOn && i > 3) || iLive) { l.style.opacity = 0; return; }
          var a = d >= 0 ? 1 : Math.min(1, Math.max(0, (0.62 - ad) / 0.5));
          if (storyOn && i === 3) a *= 1 - storyA;
          l.style.opacity = a;
          var s = d >= 0 ? 1 + 0.65 * d : 1 + 0.10 * (-d);
          l.style.transform = "translate(" + (Math.sin(tt * 0.35 + i) * 0.5).toFixed(2) + "%," + (-d * 4).toFixed(2) + "%) scale(" + s.toFixed(4) + ")";
        });
      }
      postTick(p);
      // the opening words: one at a time, in one place (story.css), each fading in where it stands while rising about
      // 12 px (ease-out), then fading out before the next one comes. Greetings zoom at centre. While the one-take plays they keep
      // to its frames (beats: hello 8, we 52, the logo drawn by 107), from the brand on to the scroll (p)
      var wf = iLive && p < S_LOGO && story.ifi >= 0 ? story.ifi : -1;
      // the words' line: 78% down, lower if need be so that the AEC PRISM group stands clear under the drawn logo
      if (fly && (fwYAt !== innerWidth + "x" + innerHeight + lang) && iLive && story.logoBottom) {
        var lb = story.logoBottom(), nm = fly.querySelector(".fw-name");
        if (lb !== null && nm && nm.firstElementChild) {
          fwYAt = innerWidth + "x" + innerHeight + lang;
          var g0 = nm.firstElementChild.getBoundingClientRect().top, g1 = nm.lastElementChild.getBoundingClientRect().bottom, gh = g1 - g0;
          var yLine = Math.min(innerHeight - gh / 2 - 24, Math.max(innerHeight * 0.78, lb + 18 + gh / 2));
          fly.style.setProperty("--fw-y", yLine.toFixed(0) + "px");
        }
      }
      fws.forEach(function (w) {
        // AEC PRISM and the positioning line fade in where they stand, rising: [frames of the one-take: in from, in by,
        // out from, out by], [the same in stations without it]. At the opening's pace (9 s): 你好 about 0.3-2.7 s, 我們是
        // 3.1-5.0 s, AEC PRISM from 6.6 s, each gone before the next comes
        var W0 = w.classList.contains("fw-hello") ? [[1, 6, 19, 24], [-0.5, -0.25, 0.3, 0.5]]
          : w.classList.contains("fw-name") ? [[86, 93, 1e9, 1e9], [2.2, 2.6, 1e9, 1e9]]
          : w.classList.contains("fw-pos") ? [null, [3.56, 3.78, 4.12, 4.24]]
          : [[29, 35, 64, 69], [0.7, 0.9, 1.3, 1.5]];
        var a, rise = 0;
        // 你好 / 我們是: in the middle of the screen, coming in from far away (small, faint), growing slowly towards the
        // camera, resting a moment just in front of it, then passing it (fading out, never blurred). Depth d: -0.5 far,
        // 0 at the camera, +0.5 past it; ZW: [far, at the camera, still there, past it] in the one-take's frames
        var zoomW = w.classList.contains("fw-hello") ? [1, 10, 16, 24] : w.classList.contains("fw-name") || w.classList.contains("fw-pos") ? null : [29, 44, 56, 68];
        if (zoomW) {
          var dd, held = 0;
          if (wf >= 0) {
            dd = wf < zoomW[1] ? -0.5 * (1 - clamp01((wf - zoomW[0]) / (zoomW[1] - zoomW[0]))) - (wf < zoomW[0] ? 0.1 : 0)
              : wf <= zoomW[2] ? 0 : 0.5 * clamp01((wf - zoomW[2]) / (zoomW[3] - zoomW[2])) + (wf > zoomW[3] ? 0.1 : 0);
            held = clamp01((wf - zoomW[1]) / (zoomW[2] - zoomW[1]));
          } else dd = p - (w.classList.contains("fw-hello") ? 0 : 1); // the photographs: by station, as before
          var za = dd > 0 ? 1 - ss01(clamp01((dd - 0.15) / 0.35) * 0.9 + 0.05) : ss01(clamp01((dd + 0.5) / 0.38) * 0.9 + 0.05);
          if (dd > 0.6 || dd < -0.55 || za < 0.005) { if (w.style.visibility !== "hidden") w.style.visibility = "hidden"; w.classList.remove("in"); return; }
          var zs = 1 / (1 - dd * (dd > 0 ? 1 : 1.6)) * (1 + 0.05 * held);
          w.style.visibility = "visible";
          w.style.opacity = za.toFixed(3);
          w.style.transform = Math.abs(zs - 1) < 0.0005 ? "none" : "scale(" + zs.toFixed(4) + ")";
          w.classList.toggle("in", za > 0.6 && Math.abs(dd) < 0.3);
          return;
        }
        if (wf >= 0 && W0[0]) { var F = W0[0], ri = clamp01((wf - F[0]) / (F[1] - F[0])), ro = 1 - clamp01((wf - F[2]) / (F[3] - F[2])); a = Math.min(ri, ro); rise = ri < 1 ? ri : 1; }
        else { var Q = W0[1], ri2 = clamp01((p - Q[0]) / (Q[1] - Q[0])), ro2 = 1 - clamp01((p - Q[2]) / (Q[3] - Q[2])); a = Math.min(ri2, ro2); rise = ri2; }
        // AEC PRISM leaves as the page starts down to the positioning line
        if (w.classList.contains("fw-name") && p >= S_LOGO) a = Math.min(a, 1 - clamp01((p - 3.06) / 0.18));
        a = a * a * (3 - 2 * a);
        var ty = (1 - (1 - Math.pow(1 - rise, 3))) * 12;
        if (a < 0.005) { if (w.style.visibility !== "hidden") w.style.visibility = "hidden"; w.classList.remove("in"); return; }
        w.style.visibility = "visible";
        w.style.opacity = a.toFixed(3);
        w.style.transform = ty > 0.05 ? "translate3d(0," + ty.toFixed(2) + "px,0)" : "none";
        w.classList.toggle("in", a > 0.6);
      });
      // "向下捲動" only once the opening has played and the page rests on the brand (station 3); its line runs while it shows
      var hintOn = !auto && p > S_LOGO - 0.1 && p < S_LOGO + 0.4;
      hint.style.opacity = hintOn ? 1 : 0;
      if (hintOn !== hint.classList.contains("on")) hint.classList.toggle("on", hintOn);
      if (hintT && hintT.textContent.indexOf("↓") >= 0) hintT.textContent = hintT.textContent.replace(/\s*↓\s*/g, "");
    };
    // ---------- the sections after the film: one at a time ----------
    // Each section (vision … contact, stations 10-15) is at least a screen tall with its content in the middle
    // (story.css); its content is up only while the film is near its station: in (fading, rising) from 0.32 before it
    // (or the section's data-in: TEAM waits for the earth, which has a long way to come),
    // out from 0.2 after it, so between two sections there is a stretch with only the day playing, and nothing of the
    // first one shows before 9.68 (after the last service frame and most of the way into VISION). A section taller
    // than the screen stays up longer, by how much more of it there is to read. Near the top bar, content fades out
    // under it (a mask on the content, not over the picture).
    var posts = [].slice.call(document.querySelectorAll("main > section[data-s]")).map(function (sec) {
      return { sec: sec, s: +sec.dataset.s, lead: +sec.dataset.in || 0.32, kids: [].filter.call(sec.children, function (c) { return !c.classList.contains("imm-bg"); }), a: -1, mk: "" };
    });
    var tbEl = document.querySelector(".topbar"), tbB = 64, tbT = -1e9;
    function postTick(p) {
      var vh = innerHeight, now = performance.now();
      if (now - tbT > 1000) { tbT = now; var tr = tbEl ? tbEl.getBoundingClientRect() : null; tbB = tr && tr.height ? tr.bottom : 64; }
      var fadeTop = Math.max(0, tbB - 30), fadeBot = fadeTop + 110;
      posts.forEach(function (P, i) {
        var r = P.sec.getBoundingClientRect();
        if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) {
          if (P.a !== 0) { P.a = 0; P.kids.forEach(function (k) { k.style.opacity = "0"; k.style.visibility = "hidden"; }); }
          return;
        }
        // how many pixels of scroll one station is here, and how much taller than the middle of the screen the content is
        var span = vh, ch = 0;
        for (var j = 1; j < anchors.length; j++) if (anchors[j][1] === P.s) {
          var nb = anchors[j + 1] ? anchors[j + 1][0] - anchors[j][0] : anchors[j][0] - anchors[j - 1][0];
          span = Math.max(1, (nb + (anchors[j][0] - anchors[j - 1][0])) / 2); break;
        }
        P.kids.forEach(function (k) { ch = Math.max(ch, k.offsetHeight); });
        var ext = Math.max(0, (ch - 0.62 * vh) / (2 * span)), last = i === posts.length - 1;
        var ri = clamp01((p - (P.s - P.lead - ext)) / 0.12), ro = last ? 1 : 1 - clamp01((p - (P.s + 0.2 + ext)) / 0.12);
        var a = Math.min(ri, ro); a = a * a * (3 - 2 * a);
        var ty = (1 - (1 - Math.pow(1 - ri, 3))) * 14 - (1 - ro) * 8;
        if (Math.abs(a - P.a) > 0.002 || a === 0 || a === 1) {
          P.a = a;
          P.kids.forEach(function (k) {
            k.style.opacity = a >= 1 ? "" : a.toFixed(3);
            k.style.visibility = a <= 0 ? "hidden" : "";
            k.style.transform = Math.abs(ty) > 0.05 ? "translate3d(0," + ty.toFixed(2) + "px,0)" : "";
          });
        }
        // under the top bar: the content fades out over about 110 px instead of running beneath the menu
        P.kids.forEach(function (k) {
          var kr = k.getBoundingClientRect(), m = "";
          if (a > 0 && kr.top < fadeBot && kr.bottom > fadeTop) {
            var s0 = Math.round(fadeTop - kr.top), s1 = Math.round(fadeBot - kr.top);
            m = "linear-gradient(transparent " + s0 + "px,#000 " + s1 + "px)";
          }
          if (k._mk !== m) { k._mk = m; k.style.webkitMaskImage = m; k.style.maskImage = m; }
        });
      });
    }
    function loop() {
      autoTick(performance.now());
      target = progress();
      // the first frame starts where the page is (no run up from the top)
      if (smooth < 0) smooth = target;
      var nowFollow = performance.now(), dtFollow = lastFollow ? Math.min(0.1, (nowFollow - lastFollow) / 1000) : 1 / 60;
      lastFollow = nowFollow;
      smooth += (target - smooth) * (reduce ? 1 : 1 - Math.exp(-dtFollow / 0.065));
      if (Math.abs(target - smooth) < 0.0005) smooth = target;
      updateFilm();
      raf = requestAnimationFrame(loop);
    }
    loop();
  }

  // ---------- immersive sections: the backdrop drifts slower than the page ----------
  var imms = [].slice.call(document.querySelectorAll(".imm"));
  if (imms.length && !document.body.classList.contains("gl-on") && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    var pending = false;
    var drift = function () {
      pending = false;
      imms.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        var bg = s.querySelector(".imm-bg");
        bg.style.transform = "translate3d(0," + ((r.top + r.height / 2 - innerHeight / 2) * -0.14).toFixed(1) + "px,0) scale(1.18)";
      });
    };
    window.addEventListener("scroll", function () { if (!pending) { pending = true; requestAnimationFrame(drift); } }, { passive: true });
    window.addEventListener("resize", drift);
    drift();
  }

  // ---------- platform carousel ----------
  var track = document.getElementById("track");
  if (track) {
    var slides = [].slice.call(track.querySelectorAll(".slide")), chips = [].slice.call(document.querySelectorAll(".chip"));
    var cur = 0;
    function showSlide(i, scroll) {
      cur = Math.max(0, Math.min(slides.length - 1, i));
      slides.forEach(function (sl, k) { sl.classList.toggle("on", k === cur); });
      chips.forEach(function (c, k) { c.classList.toggle("on", k === cur); });
      if (scroll) track.scrollTo({ left: slides[cur].offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: "smooth" });
      var ch = chips[cur]; if (ch && ch.parentNode) ch.parentNode.scrollTo({ left: ch.offsetLeft - 40, behavior: "smooth" });
    }
    chips.forEach(function (c, k) { c.addEventListener("click", function () { showSlide(k, true); restart(); }); });

    // autoplay: one screenshot every few seconds while the carousel is on screen;
    // hovering holds it, a click or swipe starts the count again
    var SLIDE_MS = 5000, chipRow = chips.length ? chips[0].parentNode : null, carousel = document.getElementById("carousel");
    var onScreen = false, hold = false, left = SLIDE_MS, last = 0, autoReduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (chipRow) chipRow.style.setProperty("--slide-ms", SLIDE_MS + "ms");
    var restart = function () {
      left = SLIDE_MS;
      if (!chipRow) return;
      chipRow.classList.remove("playing"); void chipRow.offsetWidth; // restart the chip's fill animation
      if (onScreen && !autoReduce) chipRow.classList.add("playing");
    };
    var tick = function (now) {
      requestAnimationFrame(tick);
      var dt = last ? Math.min(100, now - last) : 0; last = now;
      var run = onScreen && !hold && !document.hidden && !autoReduce;
      if (chipRow) chipRow.classList.toggle("paused", !run);
      if (!run) return;
      left -= dt;
      if (left <= 0) { showSlide((cur + 1) % slides.length, true); restart(); }
    };
    if (!autoReduce) {
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
        var was = onScreen; onScreen = es[0].isIntersecting;
        if (onScreen && !was) restart();
      }, { threshold: 0.35 }).observe(carousel);
      carousel.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hold = true; });
      carousel.addEventListener("pointerleave", function () { hold = false; });
      ["pointerdown", "wheel", "touchstart"].forEach(function (ev) { track.addEventListener(ev, restart, { passive: true }); });
      requestAnimationFrame(tick);
    }
    var st;
    track.addEventListener("scroll", function () {
      clearTimeout(st);
      st = setTimeout(function () {
        var x = track.scrollLeft + parseFloat(getComputedStyle(track).paddingLeft), best = 0, bd = 1e9;
        slides.forEach(function (sl, k) { var d = Math.abs(sl.offsetLeft - x); if (d < bd) { bd = d; best = k; } });
        if (best !== cur) showSlide(best, false);
      }, 80);
    }, { passive: true });
  }

  // ---------- scroll reveal ----------
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    [].forEach.call(document.querySelectorAll(".mega,.imm-p,.steps3 article,.prin li,.names li,.people .person,.prow,.statement"), function (el) { el.classList.add("rv"); io.observe(el); });
  }

  // ---------- booking form ----------
  // No form service: sending opens the visitor's own mail program with the message written out to the team's inbox.
  // (To post to a form service instead, set BOOKING_ENDPOINT to one that forwards to the same address.)
  var BOOKING_TO = "hello@aecprism.com", BOOKING_ENDPOINT = "";
  var form = document.getElementById("bookingForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var en = lang === "en";
    var st = document.getElementById("formStatus"), d = Object.fromEntries(new FormData(form).entries());
    if (d.website) return; // honeypot
    var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || "");
    if (!d.name || !okMail) { st.textContent = en ? window.PRISM_EN["f.bad"] : "請填寫姓名與正確的 Email。"; st.className = "status bad"; return; }
    delete d.website;
    var sel = form.querySelector("select[name=type]"), topic = sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].textContent.trim() : (d.type || "");
    if (BOOKING_ENDPOINT) {
      d.submittedAt = new Date().toISOString(); d.lang = lang; d.to = BOOKING_TO;
      fetch(BOOKING_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
        .then(function (r) { if (!r.ok) throw 0; st.textContent = en ? window.PRISM_EN["f.ok"] : "謝謝你，我們已收到預約。"; st.className = "status ok"; form.reset(); })
        .catch(function () { st.textContent = en ? "Could not send. Please try again." : "送出失敗，請再試一次。"; st.className = "status bad"; });
      return;
    }
    var subject = (en ? "AEC PRISM enquiry: " : "AEC PRISM 洽詢：") + topic + " / " + d.name;
    var body = (en
      ? ["Name: " + d.name, "Company: " + (d.company || ""), "Email: " + d.email, "Topic: " + topic, "", d.message || ""]
      : ["姓名：" + d.name, "公司：" + (d.company || ""), "Email：" + d.email, "主題：" + topic, "", d.message || ""]).join("\r\n");
    location.href = "mailto:" + BOOKING_TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    st.textContent = en ? "Your mail program is opening with the message filled in. Send it there and it reaches us; or write to " + BOOKING_TO + "."
                        : "已開啟你的郵件程式並填好內容，在那裡按下寄出就會送到我們；也可以直接寫信到 " + BOOKING_TO + "。";
    st.className = "status ok";
  });

  applyLang();
})();
