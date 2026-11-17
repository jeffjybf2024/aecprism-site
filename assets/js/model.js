// The 3D model world behind the page, from station 4 onward (three.js r128), used when the
// realistic image sequence (assets/story) is not available.
// A white architectural model of the city with the AEC PRISM building (a hexagon with a
// triangular courtyard, after the logo). The camera moves between stations as the page scrolls;
// each station sets a mood (daylight, dusk, night) and switches its own layers on or off.
// The service steps' data (envelope, wind, progress, checks, cost, leases, equipment) is drawn over it
// by datalayer.js, from PrismModel.camera and PrismModel.geo.
(function () {
  "use strict";
  if (!window.THREE) return;
  var T = THREE;

  function C(hex) { return new T.Color(hex).convertSRGBToLinear(); }
  function ss(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // small seeded random so the city is the same on every visit
  var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  // ---------- moods ----------
  var MOOD = {
    day:   { top: "#dfe3e7", hor: "#f2efea", fog: 0.0010, hour: 14.5, sun: 3.2, hemi: 0.75,  night: 0,   light: 1 },
    morn:  { top: "#d2dbe4", hor: "#f3e8d9", fog: 0.0010, hour: 9.5,  sun: 3.0, hemi: 0.72, night: 0,   light: 1 },
    gold:  { top: "#28324f", hor: "#efa964", fog: 0.0016, hour: 17.3, sun: 2.1, hemi: 0.5,  night: 0.35, light: 0 },
    dusk:  { top: "#1b2540", hor: "#d98a55", fog: 0.0018, hour: 17.7, sun: 1.5, hemi: 0.42, night: 0.6, light: 0 },
    blue:  { top: "#0c1838", hor: "#475c8c", fog: 0.0019, hour: 18.5, sun: 0.5, hemi: 0.34, night: 0.85, light: 0 },
    night: { top: "#03071a", hor: "#14203c", fog: 0.0021, hour: 20,   sun: 0.25, hemi: 0.22, night: 1,   light: 0 },
    // the day after the film (stations 12-17); hours past 24 are the next morning
    dawn:  { top: "#aebdd3", hor: "#f3d3b4", fog: 0.0013, hour: 6.5,  sun: 1.7, hemi: 0.58, night: 0.12, light: 1 },
    am:    { top: "#cdd8e3", hor: "#f2ece2", fog: 0.0010, hour: 10,   sun: 3.0, hemi: 0.74, night: 0,   light: 1 },
    noon:  { top: "#d6dfe8", hor: "#f4f2ec", fog: 0.0009, hour: 13,   sun: 3.4, hemi: 0.8,  night: 0,   light: 1 },
    golden:{ top: "#7686a8", hor: "#f0ab66", fog: 0.0015, hour: 17.5, sun: 2.3, hemi: 0.5,  night: 0.18, light: 0 },
    predawn:{ top: "#0d1a42", hor: "#3b5088", fog: 0.0019, hour: 28.5, sun: 0.3, hemi: 0.3, night: 0.8, light: 0 },
    dawn2: { top: "#93a6c6", hor: "#efc4a2", fog: 0.0015, hour: 30,   sun: 1.2, hemi: 0.5,  night: 0.3, light: 1 }
  };
  // the time of day through the sections: each section holds its hour at its centre; between team (night) and
  // contact (the next dawn) the sky goes through deep blue before it brightens
  var DAYMOOD = [[11, "morn"], [12, "dawn"], [13, "am"], [14, "noon"], [15, "golden"], [15.55, "dusk"], [16, "night"], [16.4, "night"], [16.75, "predawn"], [17, "dawn2"]];

  // ---------- stations (one per chapter of the film, then one per section) ----------
  // cam / at: camera position and target; flags switch the layers
  var TOP = { cam: [0, 265, 1], at: [0, 0, 0], mood: "gold" };
  // from the positioning line on, the camera is the realistic sequence's (assets/story/manifest.json, three.js axes):
  // level, 177 m out and 115 m up, aimed at the point above the site centre, turning 15 degrees a step, with
  // Blender's lens shift; so the model is framed exactly like the frames it stands in for
  var SEQ = { w: 1600, h: 900, fov: 35.1154, shift: [0.12, -0.517263] }, AT = [0, 115, 0];
  function orbit(k) { var a = (-78 + 15 * k) * Math.PI / 180; return [177 * Math.cos(a), 115, -177 * Math.sin(a)]; }
  var ST = [
    TOP, TOP, TOP, TOP,
    { cam: orbit(0), at: AT, mood: "day", seq: 1, lines: 1 },                         // 4 positioning
    { cam: orbit(1), at: AT, mood: "day", seq: 1, lines: 1 },                         // 5 land assessment: setting-out
    { cam: orbit(2), at: AT, mood: "day", seq: 1, lines: 0.6, sunpath: 1, sunCtl: 1, mass: 1 }, // 6 environment: white massing in the sun
    { cam: orbit(3), at: AT, mood: "day", seq: 1, lines: 0.3, crane: 1 },             // 7 smart site: floors rise, crane
    { cam: orbit(4), at: AT, mood: "morn", seq: 1, crane: 1 },                        // 8 automated workflows
    { cam: orbit(5), at: AT, mood: "day", seq: 1, crane: 1 },                         // 9 cost
    { cam: orbit(6), at: AT, mood: "day", seq: 1 },                                   // 10 property
    { cam: orbit(7), at: AT, mood: "morn", seq: 1 },                                  // 11 facility
    // the sections after the film: one day of the building (the camera path and the hours are DAY and DAYMOOD)
    { mood: "dawn", seq: 1 },   // 12 vision
    { mood: "am", seq: 1 },     // 13 results
    { mood: "noon", seq: 1 },   // 14 impact
    { mood: "golden", seq: 1 }, // 15 why now
    { mood: "night", seq: 1 },  // 16 team
    { mood: "dawn2", seq: 1 }   // 17 contact
  ];
  var FLAGS = ["lines", "crane", "sunpath", "sunCtl", "mass", "seq"];

  // ---------- after the film: a day of the building, one view per section ----------
  // From the last service step (station 11, the sequence's camera) the camera keeps turning the same way as through
  // the film and goes once round the building: 12 vision 06:30, high three-quarter view; 13 results 10:00, higher,
  // looking down onto the site; 14 impact 13:00, middle height; 15 why now 17:30, low, looking up the tower;
  // 16 team 20:00, drawn back over the lit city; 17 contact 06:00 the next day, back near the vision view.
  // Distance to the building stays within 15% of 200 m. The path is a spline through the views (it starts from rest at
  // station 11 and never stops between sections), so neither the turn nor the height ever jerks.
  // A key: target x, y, z, distance, azimuth, polar angle (rad), vertical lens (deg), lens shift x, y
  var D2R = Math.PI / 180;
  function dayView(th, el, r, aty, sx, sy) { return [0, aty, 0, r, th * D2R, (90 - el) * D2R, SEQ.fov, sx, sy]; }
  var DAY0 = (function () { var s = sph(orbit(7), AT); return [AT[0], AT[1], AT[2], s.r, s.th, s.ph, SEQ.fov, SEQ.shift[0], SEQ.shift[1]]; })();
  var DAYDEF = [
    DAY0,                                // 11 facility (azimuth -27)
    dayView(-60, 31, 205, 20, 0, 0),     // 12 vision
    dayView(-110, 42, 214, 14, 0, 0),    // 13 results
    dayView(-155, 21, 198, 22, 0, 0),    // 14 impact
    dayView(-226, -4, 178, 40, 0, 0),    // 15 why now (camera ~28 m up, above the low blocks round the site)
    dayView(-306, 18, 228, 26, 0, 0),    // 16 team
    dayView(-390, 30, 205, 20, 0, 0)     // 17 contact: 30 degrees short of a full turn back to the vision view
  ];
  var DAY = DAYDEF, DAYM = null;
  function dayTangents(K) {
    return K.map(function (v, k) {
      if (k === 0 || k === K.length - 1) return v.map(function () { return 0; });
      return v.map(function (_, j) { return (K[k + 1][j] - K[k - 1][j]) / 2; });
    });
  }
  DAYM = dayTangents(DAY);
  function dayAt(p) {
    var q = clamp(p - 11, 0, DAY.length - 1), i = Math.min(DAY.length - 2, Math.floor(q)), t = q - i, t2 = t * t, t3 = t2 * t;
    var h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2, A = DAY[i], B = DAY[i + 1], mA = DAYM[i], mB = DAYM[i + 1];
    return A.map(function (a, j) { return h00 * a + h10 * mA[j] + h01 * B[j] + h11 * mB[j]; });
  }
  // the realistic day sequence's own cameras (manifest "day"), so the model frames each section like its frame
  function useDayCamera(day) {
    try {
      var fr = day && day.camera && day.camera.frames, st = day.stops, ids = ["vision", "results", "impact", "whynow", "team", "contact"];
      if (!fr || !st) return false;
      var K = [DAY0], prev = DAY0[4];
      for (var k = 0; k < ids.length; k++) {
        var f = fr[Math.max(0, Math.min(fr.length - 1, st[ids[k]] | 0))]; if (!f || !f.p || !f.t) return false;
        var s = sph(f.p, f.t), th = s.th, sh = f.shift || day.camera.shift || [0, 0];
        while (th - prev > Math.PI) th -= 2 * Math.PI; while (th - prev < -Math.PI) th += 2 * Math.PI;
        K.push([f.t[0], f.t[1], f.t[2], s.r, th, s.ph, f.fov || SEQ.fov, sh[0], sh[1]]); prev = th;
      }
      DAY = K; DAYM = dayTangents(K); return true;
    } catch (e) { DAY = DAYDEF; DAYM = dayTangents(DAY); return false; }
  }

  var FLOORS = 12, FH = 3.8, PLOT = 86, PITCH = 112;
  // floors standing at each step, as in the realistic sequence: none at environmental analysis,
  // a few at the smart site, then the rest through automation and cost
  var BUILT = [[6, 0], [7, 3.2], [8, 9], [9, 11.8], [10, FLOORS]];
  function builtAt(p) {
    if (p <= BUILT[0][0]) return 0;
    for (var i = 1; i < BUILT.length; i++) if (p < BUILT[i][0]) return lerp(BUILT[i - 1][1], BUILT[i][1], (p - BUILT[i - 1][0]) / (BUILT[i][0] - BUILT[i - 1][0]));
    return FLOORS;
  }
  // the camera at station p: position on a sphere round the target (so moves arc instead of cutting through
  // buildings), and the view window at near = 1: the overview's plain 32 degree lens blending into the sequence's
  // frame, cover-cropped to the screen like the frames. Narrow screens (the card at the bottom) aim the frame at the
  // building instead, so it stands in the upper half at a size that fits.
  var vtmp = null;
  function place(cam, p, mx, my, time, w, h) {
    var n = ST.length, i = Math.max(0, Math.min(n - 2, Math.floor(p))), f = clamp(p - i, 0, 1), A = ST[i], B = ST[i + 1];
    var e = ease(i, f), at, r, th, ph, fov = SEQ.fov, shx = SEQ.shift[0], shy = SEQ.shift[1], k;
    // the slow sway when the page rests (a touch wider over the sections, where the background has the screen)
    var sway = Math.sin(time * 0.05) * (p > 11 ? 0.06 : 0.04);
    if (p >= 11) {
      var d = dayAt(p);
      at = [d[0], d[1], d[2]]; r = d[3]; th = d[4]; ph = d[5]; fov = d[6]; shx = d[7]; shy = d[8]; k = 1;
    } else {
      at = [lerp(A.at[0], B.at[0], e), lerp(A.at[1], B.at[1], e), lerp(A.at[2], B.at[2], e)];
      var sa = sph(A.cam, A.at), sb = sph(B.cam, B.at), dth = sb.th - sa.th;
      if (dth > Math.PI) dth -= Math.PI * 2; if (dth < -Math.PI) dth += Math.PI * 2;
      r = lerp(sa.r, sb.r, e); th = sa.th + dth * e; ph = lerp(sa.ph, sb.ph, e);
      k = lerp(A.seq || 0, B.seq || 0, e);
    }
    th += -mx * 0.35 + sway; ph = clamp(ph + my * 0.08, 0.02, 2.2);
    cam.position.set(at[0] + r * Math.sin(ph) * Math.cos(th), at[1] + r * Math.cos(ph), at[2] + r * Math.sin(ph) * Math.sin(th));
    cam.up.set(0, 1, 0); cam.lookAt(at[0], at[1], at[2]); cam.updateMatrixWorld();
    var asp = w / h, t0 = Math.tan(16 * Math.PI / 180);
    var win = [-asp * t0, asp * t0, t0, -t0];
    if (k > 0) {
      var top = Math.tan(fov * Math.PI / 360), h0 = 2 * top, w0 = h0 * SEQ.w / SEQ.h, sq;
      if (w <= 820) {
        if (!vtmp) vtmp = new T.Vector3();
        var v = vtmp.set(0, 22, 0).applyMatrix4(cam.matrixWorldInverse), bx = v.x / -v.z, by = v.y / -v.z, ww = 0.5 * Math.max(1, 0.62 / asp), hh = ww / asp;
        sq = [bx - ww / 2, bx + ww / 2, by + hh * 0.36, by - hh * 0.64];
      } else {
        var L = -w0 / 2 + shx * w0, Tp = top + shy * w0, s =Math.max(w / SEQ.w, h / SEQ.h), dw = SEQ.w * s, dh = SEQ.h * s, ox = (w - dw) / 2, oy = (h - dh) / 2;
        sq = [L - ox / dw * w0, L + (w - ox) / dw * w0, Tp + oy / dh * h0, Tp - (h - oy) / dh * h0];
      }
      win = win.map(function (q, j) { return lerp(q, sq[j], k); });
    }
    cam.projectionMatrix.makePerspective(win[0], win[1], win[2], win[3], 1, 4000);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }
  // a pause at each film station; after the film one steady turn (the first section starts from rest);
  // the hand-over from the photo turns down from above over the second part of its scroll
  function ease(i, f) { return i === 3 ? ss(0.35, 1, f) : i === 11 ? f * f * (2 - f) : i > 11 ? f : ss(0.12, 0.88, f); }
  function sph(pos, at) {
    var dx = pos[0] - at[0], dy = pos[1] - at[1], dz = pos[2] - at[2], r = Math.hypot(dx, dy, dz);
    return { r: r, th: Math.atan2(dz, dx), ph: Math.acos(Math.min(1, Math.max(-1, dy / r))) };
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  // the page's stations -> the model's own (ST above): the page has 0-3 opening, 4 positioning, 5 overview and
  // 6-9 the four service lines (dev, design, build, ops), 10-15 the sections; the model keeps its seven steps
  // (5-11), so the page's 4..9 are spread over its 4..11 and the sections are its 12-17
  function pageToModel(p) { return p <= 4 ? p : p <= 9 ? 4 + (p - 4) * 7 / 5 : p + 2; }

  // ---------- the plan is the AEC PRISM mark ----------
  // traced from assets/img/logo-mark.png (pixels), centred and scaled to metres:
  // an open hexagonal band whose left side runs down as a stem, and a triangular ring inside it
  var SC = 0.1, BAND = 9;
  function px(x, y) { return [(x - 270) * SC, (y - 352) * SC]; }
  var STEM = [px(40, 676), px(40, 170), px(268, 26), px(498, 170), px(498, 372)];
  var TRI = [px(198, 236), px(492, 420), px(198, 586)];
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function nrm(v) { var l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; }
  // a band of width w along an open polyline, with mitred corners -> closed polygon
  function band(pts, w) {
    var L = [], Rt = [], n = pts.length;
    for (var i = 0; i < n; i++) {
      var d0 = i > 0 ? nrm(sub(pts[i], pts[i - 1])) : null, d1 = i < n - 1 ? nrm(sub(pts[i + 1], pts[i])) : null;
      var d = d0 && d1 ? nrm([d0[0] + d1[0], d0[1] + d1[1]]) : (d0 || d1), nx = -d[1], nz = d[0];
      var m = d0 && d1 ? 1 / Math.max(0.3, nx * -d0[1] + nz * d0[0]) : 1;
      L.push([pts[i][0] + nx * w / 2 * m, pts[i][1] + nz * w / 2 * m]); Rt.push([pts[i][0] - nx * w / 2 * m, pts[i][1] - nz * w / 2 * m]);
    }
    return L.concat(Rt.reverse());
  }
  // a triangle moved in (d > 0) or out (d < 0) by d, about its incentre
  function inset(t, d) {
    var a = Math.hypot(t[1][0] - t[2][0], t[1][1] - t[2][1]), b = Math.hypot(t[0][0] - t[2][0], t[0][1] - t[2][1]), c = Math.hypot(t[0][0] - t[1][0], t[0][1] - t[1][1]);
    var P = a + b + c, I = [(a * t[0][0] + b * t[1][0] + c * t[2][0]) / P, (a * t[0][1] + b * t[1][1] + c * t[2][1]) / P];
    var area = Math.abs((t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[2][0] - t[0][0]) * (t[1][1] - t[0][1])) / 2, r = area / (P / 2), f = (r - d) / r;
    return t.map(function (p) { return [I[0] + (p[0] - I[0]) * f, I[1] + (p[1] - I[1]) * f]; });
  }
  var POLY = { stem: band(STEM, BAND), triO: inset(TRI, -BAND / 2), triI: inset(TRI, BAND / 2) };
  var TRI_C = inset(TRI, 0).reduce(function (s, p) { return [s[0] + p[0] / 3, s[1] + p[1] / 3]; }, [0, 0]);
  function toShape(poly) { var sh = new T.Shape(); poly.forEach(function (p, i) { if (i) sh.lineTo(p[0], -p[1]); else sh.moveTo(p[0], -p[1]); }); sh.closePath(); return sh; }
  function plan() {
    var a = toShape(POLY.stem), b = toShape(POLY.triO), h = new T.Path();
    POLY.triI.forEach(function (p, i) { if (i) h.lineTo(p[0], -p[1]); else h.moveTo(p[0], -p[1]); }); h.closePath(); b.holes.push(h);
    return [a, b];
  }
  function outlines() { return [POLY.stem, POLY.triO, POLY.triI]; }
  function extrude(shape, depth) {
    var g = new T.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 1 });
    g.rotateX(-Math.PI / 2); return g;
  }
  // flat ribbons following closed polylines, for lines drawn on the ground or around a floor
  function ribbon(polys, w, y) {
    var pos = [], idx = [];
    if (typeof polys[0][0] === "number") polys = [polys];
    polys.forEach(function (pts) { var n = pts.length; for (var i = 0; i < n; i++) {
      var a = pts[i], b = pts[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = -dz / L * w / 2, nz = dx / L * w / 2, v = pos.length / 3;
      pos.push(a[0] + nx, y, a[1] + nz, a[0] - nx, y, a[1] - nz, b[0] + nx, y, b[1] + nz, b[0] - nx, y, b[1] - nz);
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    } });
    var g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  var PLOT_IN = PLOT / 2 - 3, ENV_IN = (PLOT - 14) / 2, CRANE = [-36, 68, -24];
  window.PrismModel = {
    ok: false,
    // the model's building and site in the same form as the realistic sequence's manifest (three.js axes, metres)
    geo: {
      building: { floors: FLOORS, floor_h: FH, base_y: 0, roof_y: FLOORS * FH + 0.5, outline: outlines(), holes: [2] },
      anchors: {
        site_boundary: [[-PLOT_IN, -PLOT_IN], [PLOT_IN, -PLOT_IN], [PLOT_IN, PLOT_IN], [-PLOT_IN, PLOT_IN]],
        setback: [[-ENV_IN, -ENV_IN], [ENV_IN, -ENV_IN], [ENV_IN, ENV_IN], [-ENV_IN, ENV_IN]],
        envelope: { h: 50, h_north: 50, slope_from_z: -ENV_IN },
        crane: CRANE,
        core: STEM.map(function (q) { return [q[0], 0, q[1]]; })
      }
    },
    builtAt: builtAt,
    // read-only, for checks: where the camera stands at station p (no pointer, no drift)
    cameraAt: function (p, w, h) { var c = new T.PerspectiveCamera(); place(c, pageToModel(p), 0, 0, 0, w || innerWidth, h || innerHeight); return { position: c.position.toArray(), quaternion: c.quaternion.toArray(), projection: c.projectionMatrix.toArray() }; },
    // stations 12-17 from the realistic day sequence's cameras (manifest.day), when it is there
    useDayCamera: useDayCamera,
    init: function (canvas) {
      var renderer;
      try {
        renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch (e) { return false; }
      renderer.setClearColor(0x000000, 0);
      renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;

      var scene = new T.Scene();
      scene.fog = new T.FogExp2(0xefece6, 0.0011);
      var camera = new T.PerspectiveCamera(32, 1, 1, 4000);
      this.camera = camera;

      // everything materialises from the site outward during the hand-over from the photo
      var REV = { value: 0 }, EDGE = { value: C("#f0a64a") }, EMIT = C("#ffb469");
      function reveal(mat) {
        mat.onBeforeCompile = function (sh) {
          sh.uniforms.uReveal = REV; sh.uniforms.uEdge = EDGE;
          sh.vertexShader = "varying vec3 vWr;\n" + sh.vertexShader.replace("#include <project_vertex>",
            "#include <project_vertex>\nvec4 wr0 = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwr0 = instanceMatrix * wr0;\n#endif\nvWr = (modelMatrix * wr0).xyz;");
          sh.fragmentShader = "uniform float uReveal;uniform vec3 uEdge;varying vec3 vWr;\n" + sh.fragmentShader.replace("#include <dithering_fragment>",
            "#include <dithering_fragment>\nfloat rr = length(vWr.xz);\nif (rr > uReveal) discard;\ngl_FragColor.rgb += uEdge * (1.0 - smoothstep(0.0, 7.0, uReveal - rr)) * step(uReveal, 1500.0) * 1.6;");
        };
        return mat;
      }

      // ---------- light ----------
      var hemi = new T.HemisphereLight(0xffffff, 0xd8d2c6, 0.9); scene.add(hemi);
      var sun = new T.DirectionalLight(0xfff1dc, 2.6);
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      var sc = sun.shadow.camera; sc.left = -230; sc.right = 230; sc.top = 230; sc.bottom = -230; sc.near = 10; sc.far = 900;
      sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
      scene.add(sun); scene.add(sun.target);

      // ---------- sky dome ----------
      var skyU = { top: { value: C("#d9dee3") }, hor: { value: C("#efece6") }, alpha: { value: 0 } };
      var sky = new T.Mesh(new T.SphereGeometry(2500, 32, 16), new T.ShaderMaterial({
        uniforms: skyU, side: T.BackSide, depthWrite: false, transparent: true, fog: false,
        vertexShader: "varying float vy;void main(){vy=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader: "uniform vec3 top,hor;uniform float alpha;varying float vy;void main(){vec3 c=mix(hor,top,smoothstep(-0.02,0.45,vy));gl_FragColor=vec4(pow(c,vec3(1.0/2.2)),alpha);}"
      }));
      sky.renderOrder = -1; scene.add(sky);

      // ---------- ground, blocks, roads ----------
      var ground = new T.Mesh(new T.PlaneGeometry(6000, 6000), reveal(new T.MeshStandardMaterial({ color: C("#d6d2ca"), roughness: 1 })));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

      var N = 5, blocks = [], parks = {};
      for (var bx = -N; bx <= N; bx++) for (var bz = -N; bz <= N; bz++) blocks.push([bx, bz]);
      [[1, -1], [-2, 1], [2, 2], [-1, -3], [3, -2], [-3, -1]].forEach(function (p) { parks[p[0] + "," + p[1]] = 1; });

      var curbGeo = new T.BoxGeometry(1, 1, 1); curbGeo.translate(0, 0.5, 0);
      var curbs = new T.InstancedMesh(curbGeo, reveal(new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })), blocks.length);
      var bldGeo = new T.BoxGeometry(1, 1, 1); bldGeo.translate(0, 0.5, 0);
      var bldCount = 0, bldMax = blocks.length * 6;
      var blds = new T.InstancedMesh(bldGeo, reveal(new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 })), bldMax);
      blds.castShadow = true; blds.receiveShadow = true; curbs.receiveShadow = true;
      var treeGeo = new T.IcosahedronGeometry(1, 1);
      var treeMax = 2600, treeCount = 0;
      var trees = new T.InstancedMesh(treeGeo, reveal(new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true })), treeMax);
      trees.castShadow = true; trees.receiveShadow = true;
      var M = new T.Object3D(), col = new T.Color();

      function tree(x, z, s) {
        if (treeCount >= treeMax) return;
        M.position.set(x, s * 1.6, z); M.scale.set(s, s * 1.15, s); M.rotation.set(0, rnd() * 3, 0); M.updateMatrix();
        trees.setMatrixAt(treeCount, M.matrix);
        trees.setColorAt(treeCount, col.copy(C("#8fb069")).lerp(C("#5f8c4a"), rnd()));
        treeCount++;
      }

      blocks.forEach(function (b, i) {
        var cx = b[0] * PITCH, cz = b[1] * PITCH, center = !b[0] && !b[1], park = parks[b[0] + "," + b[1]];
        M.position.set(cx, 0, cz); M.scale.set(PLOT, 0.35, PLOT); M.rotation.set(0, 0, 0); M.updateMatrix();
        curbs.setMatrixAt(i, M.matrix);
        curbs.setColorAt(i, center ? C("#d9c7a2") : park ? C("#b9cf98") : C("#f1efe9"));
        // street trees along every block edge
        for (var e = -PLOT / 2 + 4; e <= PLOT / 2 - 4; e += 10) {
          tree(cx + e, cz - PLOT / 2 + 2.5, 1.5 + rnd() * 0.8); tree(cx + e, cz + PLOT / 2 - 2.5, 1.5 + rnd() * 0.8);
          tree(cx - PLOT / 2 + 2.5, cz + e, 1.5 + rnd() * 0.8); tree(cx + PLOT / 2 - 2.5, cz + e, 1.5 + rnd() * 0.8);
        }
        if (center) return;
        if (park) { for (var k = 0; k < 70; k++) tree(cx + (rnd() - 0.5) * 64, cz + (rnd() - 0.5) * 64, 1.8 + rnd() * 1.8); return; }
        var dist = Math.hypot(b[0], b[1]), lots = rnd() < 0.5 ? 2 : 3;
        for (var lx = 0; lx < lots; lx++) for (var lz = 0; lz < 2; lz++) {
          if (bldCount >= bldMax) break;
          var w = (PLOT - 14) / lots, d = (PLOT - 14) / 2;
          var px = cx - (PLOT - 14) / 2 + w * (lx + 0.5), pz = cz - (PLOT - 14) / 2 + d * (lz + 0.5);
          // keep the blocks around the site low so the camera can see in; towers only further out
          var tall = dist >= 3.5 && rnd() < 0.18;
          var hgt = tall ? 45 + rnd() * 55 : (dist < 2.5 ? 8 + rnd() * 16 : 10 + rnd() * 24);
          M.position.set(px, 0.35, pz); M.scale.set(w * (0.62 + rnd() * 0.3), hgt, d * (0.62 + rnd() * 0.3)); M.updateMatrix();
          blds.setMatrixAt(bldCount, M.matrix);
          blds.setColorAt(bldCount, col.copy(C("#f4f2ee")).lerp(C("#ddd8cf"), rnd()));
          bldCount++;
        }
      });
      blds.count = bldCount; trees.count = treeCount;
      scene.add(curbs, blds, trees);

      // street lights (visible at dusk and night)
      var lp = [];
      for (var gx = -N; gx <= N + 1; gx++) for (var t = -N * PITCH - 50; t <= N * PITCH + 50; t += 18) {
        var rx = gx * PITCH - PITCH / 2; lp.push(rx - 9, 5, t, rx + 9, 5, t + 9, t, 5, rx - 9, t + 9, 5, rx + 9);
      }
      var lgGeo = new T.BufferGeometry(); lgGeo.setAttribute("position", new T.Float32BufferAttribute(lp, 3));
      var lgMat = new T.PointsMaterial({ color: 0xffc27a, size: 2.6, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
      var lights = new T.Points(lgGeo, lgMat); scene.add(lights);
      // lit windows on the city's buildings at night (own random numbers, so the city itself stays the same)
      var wseed = 11, wp = [], m4 = new T.Matrix4(), wpos = new T.Vector3(), wq = new T.Quaternion(), wsc = new T.Vector3();
      function wr() { wseed = (wseed * 16807) % 2147483647; return (wseed - 1) / 2147483646; }
      for (var wi = 0; wi < bldCount; wi++) {
        blds.getMatrixAt(wi, m4); m4.decompose(wpos, wq, wsc);
        var wn = Math.max(2, Math.min(60, Math.round(wsc.y * (wsc.x + wsc.z) / 90)));
        for (var wj = 0; wj < wn; wj++) {
          var face = Math.floor(wr() * 4), u = wr() - 0.5, wy = wpos.y + 2 + Math.floor(wr() * Math.max(1, (wsc.y - 3) / 3.4)) * 3.4;
          if (face < 2) wp.push(wpos.x + u * wsc.x, wy, wpos.z + (face ? 1 : -1) * (wsc.z / 2 + 0.25));
          else wp.push(wpos.x + (face === 3 ? 1 : -1) * (wsc.x / 2 + 0.25), wy, wpos.z + u * wsc.z);
        }
      }
      var wgGeo = new T.BufferGeometry(); wgGeo.setAttribute("position", new T.Float32BufferAttribute(wp, 3));
      var wgMat = new T.PointsMaterial({ color: 0xffd7a0, size: 3.2, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
      var cityWin = new T.Points(wgGeo, wgMat); scene.add(cityWin);

      // ---------- the building ----------
      var shape = plan();
      var slabGeo = extrude(shape, 0.5), glassGeo = extrude(shape, FH - 0.5);
      var slabMat = reveal(new T.MeshStandardMaterial({ color: C("#f6f4ef"), roughness: 0.7 }));
      var floors = [], floorBox = new T.Group(); scene.add(floorBox);
      var ol = outlines();
      for (var f = 0; f < FLOORS; f++) {
        var g = new T.Group();
        var slab = new T.Mesh(slabGeo, slabMat); slab.castShadow = slab.receiveShadow = true; slab.scale.set(1.012, 1, 1.012);
        var gm = reveal(new T.MeshStandardMaterial({ color: C("#b9cddc"), roughness: 0.1, metalness: 0.25, transparent: true, opacity: 0.9, emissive: EMIT.clone(), emissiveIntensity: 0 }));
        var glass = new T.Mesh(glassGeo, gm); glass.position.y = 0.5; glass.castShadow = true; glass.receiveShadow = true; glass.userData.floor = f;
        // mullions on the outer and courtyard faces
        var mp = [];
        ol.forEach(function (poly) {
          for (var i = 0; i < poly.length; i++) {
            var a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / 2.4));
            for (var k = 0; k < n; k++) { var u = k / n, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u; mp.push(x, 0.5, z, x, FH, z); }
          }
        });
        var mg = new T.BufferGeometry(); mg.setAttribute("position", new T.Float32BufferAttribute(mp, 3));
        var mull = new T.LineSegments(mg, reveal(new T.LineBasicMaterial({ color: C("#55626f"), transparent: true, opacity: 0.55 })));
        g.add(slab, glass, mull);
        g.position.y = f * FH; g.userData = { glass: glass, gm: gm };
        floorBox.add(g); floors.push(g);
      }
      var roof = new T.Mesh(extrude(plan(), 0.9), reveal(new T.MeshStandardMaterial({ color: C("#a9c48a"), roughness: 1 })));
      roof.position.y = FLOORS * FH + 0.5; roof.castShadow = roof.receiveShadow = true; floorBox.add(roof);
      var roofTop = new T.Mesh(slabGeo, slabMat); roofTop.position.y = FLOORS * FH; floorBox.add(roofTop);
      // a few trees on the roof garden
      var roofTrees = new T.Group();
      [STEM[0], STEM[1], STEM[2], STEM[3], [STEM[0][0], (STEM[0][1] + STEM[1][1]) / 2], TRI[0], TRI[1]].forEach(function (p) {
        var m = new T.Mesh(treeGeo, reveal(new T.MeshStandardMaterial({ color: C("#7fa75b"), roughness: 0.9, flatShading: true })));
        m.position.set(p[0], FLOORS * FH + 3, p[1]); m.scale.set(1.6, 1.9, 1.6); m.castShadow = true; roofTrees.add(m);
      });
      floorBox.add(roofTrees);
      // environmental analysis: the full white massing stands in the sun before construction starts
      var massMat = reveal(new T.MeshStandardMaterial({ color: C("#fbfaf7"), roughness: 0.85, transparent: true, opacity: 1 }));
      var mass = new T.Mesh(extrude(plan(), FLOORS * FH), massMat); mass.castShadow = mass.receiveShadow = true; scene.add(mass);

      // level line marking the floor being built
      var ring = new T.Mesh(ribbon(ol, 0.5, 0), new T.MeshBasicMaterial({ color: C("#f0a64a"), transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false }));
      scene.add(ring);

      // ---------- setting-out lines ----------
      var amber = new T.MeshBasicMaterial({ color: C("#f0a64a"), transparent: true, opacity: 1, side: T.DoubleSide, depthWrite: false });
      reveal(amber);
      var setout = new T.Group();
      setout.add(new T.Mesh(ribbon(ol, 0.6, 0.42), amber));
      var plotPts = [[-PLOT / 2 + 3, -PLOT / 2 + 3], [PLOT / 2 - 3, -PLOT / 2 + 3], [PLOT / 2 - 3, PLOT / 2 - 3], [-PLOT / 2 + 3, PLOT / 2 - 3]];
      setout.add(new T.Mesh(ribbon(plotPts, 0.4, 0.42), reveal(new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false }))));
      scene.add(setout);

      // ---------- tower crane ----------
      var craneMat = reveal(new T.MeshStandardMaterial({ color: C("#e3a23e"), roughness: 0.6 }));
      var crane = new T.Group();
      function cbox(w, h, d, x, y, z) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), craneMat); m.position.set(x, y, z); m.castShadow = true; crane.add(m); }
      cbox(1.8, 68, 1.8, 0, 34, 0); cbox(56, 1.4, 1.4, 14, 68, 0); cbox(3.2, 3, 3, 0, 66, 0); cbox(4, 4, 3, -10, 66.5, 0);
      crane.position.set(CRANE[0], 0, CRANE[2]); scene.add(crane);

      // ---------- sun path ----------
      var sunPts = [];
      for (var hh = 6; hh <= 18.001; hh += 0.25) sunPts.push(sunDir(hh).multiplyScalar(150));
      var sunLine = new T.Line(new T.BufferGeometry().setFromPoints(sunPts), new T.LineDashedMaterial({ color: C("#f0a64a"), dashSize: 4, gapSize: 3, transparent: true, opacity: 0 }));
      sunLine.computeLineDistances(); scene.add(sunLine);
      var sunBall = new T.Mesh(new T.SphereGeometry(5, 24, 12), new T.MeshBasicMaterial({ color: C("#ffd68c"), transparent: true, opacity: 0 }));
      scene.add(sunBall);

      function sunDir(h) {
        var az = Math.PI * (h - 6) / 12, el = Math.max(0.05, Math.sin(az)) * (72 * Math.PI / 180);
        return new T.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el) * 0.75).normalize();
      }
      function moodAt(name) { return MOOD[name]; }
      // after the film: the hour of the day at station p (DAYMOOD), smoothed between its keys
      function dayMood(p) {
        for (var k = 1; k < DAYMOOD.length; k++) if (p <= DAYMOOD[k][0] || k === DAYMOOD.length - 1) {
          var a = DAYMOOD[k - 1], b = DAYMOOD[k];
          return mixMood(MOOD[a[1]], MOOD[b[1]], ss(0, 1, (p - a[0]) / (b[0] - a[0])));
        }
      }
      function mixMood(a, b, t) {
        var o = {}; ["fog", "hour", "sun", "hemi", "night", "light"].forEach(function (k) { o[k] = lerp(a[k], b[k], t); });
        o.top = C(a.top).lerp(C(b.top), t); o.hor = C(a.hor).lerp(C(b.hor), t); return o;
      }
      // pointer: hovered floor
      var ray = new T.Raycaster(), ptr = new T.Vector2(-9, -9), hovered = -1, glassList = floors.map(function (g) { return g.userData.glass; });
      this.pointer = function (x, y) { ptr.set(x * 2 - 1, -(y * 2 - 1)); };

      var size = function () {
        var w = canvas.clientWidth, h = canvas.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 1.5) * q;
        if (canvas._w !== w || canvas._h !== h || canvas._d !== dpr) { renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); canvas._w = w; canvas._h = h; canvas._d = dpr; }
      };
      // adaptive resolution, as for the photo renderer
      var q = 1, lastT = 0, acc = 0, cnt = 0;
      function adapt() {
        var now = performance.now();
        if (lastT) { var dt = now - lastT; if (dt < 500) { acc += dt; cnt++; } }
        lastT = now;
        if (cnt >= 15) { var avg = acc / cnt; acc = 0; cnt = 0; if (avg > 34 && q > 0.45) q = Math.max(0.45, q * 0.8); else if (avg < 15 && q < 1) q = Math.min(1, q * 1.1); }
      }

      // p: station position, mx/my: pointer -0.5..0.5, x: { sunT }
      this.render = function (p, mx, my, time, x) {
        p = pageToModel(p);
        adapt(); size();
        x = x || {};
        var n = ST.length, i = Math.max(0, Math.min(n - 2, Math.floor(p))), f = p - i, A = ST[i], B = ST[i + 1];
        var e = ease(i, f);
        var fl = {}; FLAGS.forEach(function (k) { fl[k] = lerp(A[k] || 0, B[k] || 0, e); });
        var md = p > 11 ? dayMood(p) : mixMood(moodAt(A.mood), moodAt(B.mood), e);

        // hand-over from the photo: the model grows from the site outward
        var rv = p < 3 ? 0 : p >= 4 ? 1 : ss(0.12, 0.62, f);
        REV.value = rv >= 1 ? 1e5 : rv * 520;
        skyU.alpha.value = p >= 4 ? 1 : ss(0.5, 0.75, p - 3);

        place(camera, p, mx, my, time, canvas.clientWidth || 1, canvas.clientHeight || 1);

        // mood
        skyU.top.value.copy(md.top); skyU.hor.value.copy(md.hor);
        scene.fog.color.copy(md.hor); scene.fog.density = md.fog;
        var hour = fl.sunCtl > 0.01 && x.sunT ? lerp(md.hour, x.sunT, fl.sunCtl) : md.hour;
        // night: the light stays at the last (or next) sun position and fades out towards midnight, where it swaps sides
        var hd = ((hour % 24) + 24) % 24, sd = sunDir(Math.max(6, Math.min(18, hd)));
        var nightK = hd > 18.2 ? 0.25 * clamp(1 - (hd - 18.2) / 4, 0, 1) : hd < 5.8 ? 0.25 * clamp(1 - (5.8 - hd) / 4, 0, 1) : 1;
        sun.position.copy(sd).multiplyScalar(300); sun.target.position.set(0, 0, 0);
        var low = 1 - ss(0.0, 0.35, sd.y);
        sun.color.setRGB(1, lerp(0.95, 0.72, low), lerp(0.88, 0.5, low));
        sun.intensity = md.sun * nightK;
        hemi.intensity = md.hemi; hemi.color.copy(md.top).lerp(new T.Color(1, 1, 1), 0.55); hemi.groundColor.copy(md.hor).multiplyScalar(0.8);
        lgMat.opacity = md.night * 0.9; wgMat.opacity = md.night * 0.85;

        // building: the floors rise from the smart site on; before that the white massing stands for it
        var built = builtAt(p);
        this.built = built; this.mass = fl.mass;
        floors.forEach(function (g, k) {
          var vis = Math.min(1, Math.max(0, built - k));
          g.visible = vis > 0.001;
          g.scale.y = Math.max(0.001, vis);
          g.userData.gm.emissiveIntensity = md.night * 0.85 + (k === hovered ? 0.6 : 0);
        });
        var done = built >= FLOORS - 0.01;
        roof.visible = roofTop.visible = roofTrees.visible = done;
        ring.material.opacity = built > 0 && !done ? 0.95 : 0;
        ring.position.y = Math.floor(built) * FH + (built % 1) * FH;

        setout.visible = fl.lines > 0.01 || p < 4.2; amber.opacity = Math.max(fl.lines, p < 4.2 ? 1 : 0);
        mass.visible = fl.mass > 0.01; massMat.opacity = fl.mass; mass.castShadow = fl.mass > 0.5;
        // the crane stands while the floors go up (smart site to cost)
        crane.visible = fl.crane > 0.01; crane.scale.setScalar(Math.max(0.001, fl.crane));
        sunLine.material.opacity = fl.sunpath; sunBall.material.opacity = fl.sunpath;
        sunBall.position.copy(sd).multiplyScalar(150);

        // hovered floor (only once the building stands, and only during the film: never behind the text sections after it)
        hovered = -1;
        if (done && p < 11.5 && ptr.x > -2) {
          ray.setFromCamera(ptr, camera);
          var hit = ray.intersectObjects(glassList, false)[0];
          if (hit) hovered = hit.object.userData.floor;
        }
        this.hovered = hovered;

        renderer.render(scene, camera);
        return { light: md.light, night: md.night };
      };

      this.ok = true;
      return true;
    }
  };
})();
