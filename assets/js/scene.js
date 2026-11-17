/* Real-time 3D film: one continuous camera move driven by scroll.
   p = chapter position 0..5 (0 city, 1 site, 2 PRISM lands, 3 massing, 4 sun, 5 wind). */
(function () {
  "use strict";
  var film = document.getElementById("film");
  if (!film || !window.THREE) return;
  var T = THREE;
  var stage = film.querySelector(".stage");

  var canvas = document.createElement("canvas");
  canvas.id = "gl";
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: "high-performance" }); }
  catch (e) { return; }
  if (!renderer.getContext()) return;
  stage.insertBefore(canvas, stage.firstChild);
  document.body.classList.add("webgl");

  var small = Math.min(innerWidth, innerHeight) < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(42, 1, 2, 6500);
  function resize() {
    var w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 58 : 42; // portrait phones need a wider lens
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rand = rng(20261105);
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function sat(x) { return clamp(x, 0, 1); }
  function smooth(x) { x = sat(x); return x * x * (3 - 2 * x); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  var C = function (h) { return new T.Color(h); };

  /* ---------------- lights / sky ---------------- */
  var hemi = new T.HemisphereLight(0xbfd4ff, 0x54493d, 0.7);
  scene.add(hemi);
  var sun = new T.DirectionalLight(0xffc48a, 2);
  sun.castShadow = true;
  var SM = small ? 2048 : 4096, SR = 300;
  sun.shadow.mapSize.set(SM, SM);
  sun.shadow.camera.left = -SR; sun.shadow.camera.right = SR; sun.shadow.camera.top = SR; sun.shadow.camera.bottom = -SR;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 1600;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun); scene.add(sun.target);

  var skyU = { top: { value: C(0x26325c) }, bottom: { value: C(0xf7a25a) }, sunDir: { value: new T.Vector3(0, 0.1, 1) } };
  var sky = new T.Mesh(new T.SphereGeometry(5000, 24, 16), new T.ShaderMaterial({
    uniforms: skyU, side: T.BackSide, depthWrite: false, fog: false,
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 bottom; uniform vec3 sunDir; varying vec3 vD;" +
      "void main(){ float t = smoothstep(-0.02,0.65,vD.y); vec3 c = mix(bottom,top,t);" +
      " float g = pow(max(dot(normalize(vD),normalize(sunDir)),0.0),48.0); c += vec3(1.0,0.72,0.42)*g*0.55;" +
      " gl_FragColor = vec4(c,1.0); }"
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);
  scene.fog = new T.FogExp2(0xf7a25a, 0.00046);

  /* ---------------- city ---------------- */
  var P = 150, BLOCK = 130, N = 14;
  var nightU = { value: 1 };

  function windowMaterial() {
    var m = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.05 });
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uNight = nightU;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP; varying vec3 vWN;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvec4 wp4 = vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nwp4 = instanceMatrix * wp4;\n#endif\nwp4 = modelMatrix * wp4; vWP = wp4.xyz; vWN = normal;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP; varying vec3 vWN; uniform float uNight;\nfloat hh(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }")
        .replace("#include <color_fragment>", "#include <color_fragment>\n" +
          "float side = 1.0 - abs(vWN.y);\n" +
          "vec2 uv = vec2((vWP.x + vWP.z)/3.4, vWP.y/3.6);\n" +
          "vec2 fc = fract(uv); vec2 cl = floor(uv);\n" +
          "float winM = step(0.18,fc.x)*step(fc.x,0.82)*step(0.24,fc.y)*step(fc.y,0.76)*side*step(3.2,vWP.y);\n" +
          "float winL = step(0.52, hh(cl + floor(vWP.xz*0.04)));\n" +
          "diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.09,0.13,0.19), winM*0.82);")
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0,0.72,0.38)*winM*winL*uNight*1.7;");
    };
    return m;
  }

  var parcels = [];
  var palette = [C(0xcfc8bc), C(0xbdb7ad), C(0xd8d2c4), C(0xa9a49c), C(0xc9bfae), C(0xb7b3aa), C(0x8f9aa6)];
  for (var i = -N; i <= N; i++) {
    for (var j = -N; j <= N; j++) {
      if (i === 0 && j === 0) continue;
      for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) {
        var cx = i * P + (a - 0.5) * (BLOCK / 2), cz = j * P + (b - 0.5) * (BLOCK / 2);
        var w = 36 + rand() * 20, d = 36 + rand() * 20;
        var dist = Math.hypot(cx, cz);
        var cap = dist < 250 ? 26 : 26 + (dist - 250) * 0.12;
        var h = 10 + Math.pow(rand(), 2.1) * 70;
        var dx = cx + 700, dz = cz + 700;
        h += 140 * Math.exp(-(dx * dx + dz * dz) / (2 * 380 * 380)) * (0.5 + rand());
        h = Math.min(h, cap + rand() * 10);
        parcels.push({ x: cx + (rand() - 0.5) * 6, z: cz + (rand() - 0.5) * 6, w: w, d: d, h: Math.max(9, h), c: palette[(rand() * palette.length) | 0] });
      }
    }
  }
  var boxGeo = new T.BoxGeometry(1, 1, 1); boxGeo.translate(0, 0.5, 0);
  var city = new T.InstancedMesh(boxGeo, windowMaterial(), parcels.length);
  var mtx = new T.Matrix4(), q = new T.Quaternion(), pos = new T.Vector3(), scl = new T.Vector3();
  parcels.forEach(function (p, k) {
    mtx.compose(pos.set(p.x, 0, p.z), q, scl.set(p.w, p.h, p.d));
    city.setMatrixAt(k, mtx); city.setColorAt(k, p.c);
  });
  city.castShadow = true; city.receiveShadow = true; city.frustumCulled = false;
  scene.add(city);

  // ground with street grid
  var gc = document.createElement("canvas"); gc.width = gc.height = 512;
  var g = gc.getContext("2d"), pxm = 512 / P, st = ((P - BLOCK) / 2) * pxm;
  g.fillStyle = "#2a2c32"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#74726c"; g.fillRect(st, st, 512 - 2 * st, 512 - 2 * st);
  g.fillStyle = "#d9d5c8";
  for (var s = 0; s < 512; s += 26) { g.fillRect(0, s, 2, 13); g.fillRect(510, s, 2, 13); g.fillRect(s, 0, 13, 2); g.fillRect(s, 510, 13, 2); }
  var gt = new T.CanvasTexture(gc); gt.wrapS = gt.wrapT = T.RepeatWrapping; gt.repeat.set(6500 / P, 6500 / P);
  gt.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); gt.encoding = T.sRGBEncoding;
  gt.offset.set(0.5, 0.5); // street centred on tile edge, block (0,0) centred on origin
  var ground = new T.Mesh(new T.PlaneGeometry(6500, 6500), new T.MeshStandardMaterial({ map: gt, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // the lot
  var soilMat = new T.MeshStandardMaterial({ color: 0x80664a, roughness: 1 });
  var lot = new T.Mesh(new T.PlaneGeometry(136, 136), soilMat);
  lot.rotation.x = -Math.PI / 2; lot.position.y = 0.08; lot.receiveShadow = true; scene.add(lot);
  var fenceMat = new T.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.7 });
  [[0, -68, 136, 1], [0, 68, 136, 1], [-68, 0, 1, 136], [68, 0, 1, 136]].forEach(function (f) {
    var m = new T.Mesh(boxGeo, fenceMat); m.scale.set(f[2], 3, f[3]); m.position.set(f[0], 0, f[1]); m.castShadow = true; scene.add(m);
  });
  var markMat = new T.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0, depthWrite: false, fog: false });
  var mark = new T.Group();
  [[0, -70, 144, 2.2], [0, 70, 144, 2.2], [-70, 0, 2.2, 144], [70, 0, 2.2, 144]].forEach(function (f) {
    var m = new T.Mesh(new T.BoxGeometry(f[2], 0.4, f[3]), markMat); m.position.set(f[0], 0.4, f[1]); mark.add(m);
  });
  scene.add(mark);

  /* ---------------- the PRISM building (logo plan) ---------------- */
  function hexPath(R, Cls) {
    var s = new Cls();
    for (var k = 0; k < 6; k++) { var an = Math.PI / 2 + k * Math.PI / 3, x = R * Math.cos(an), y = R * Math.sin(an); if (k) s.lineTo(x, y); else s.moveTo(x, y); }
    s.closePath(); return s;
  }
  function triPath(pts, Cls) { var s = new Cls(); s.moveTo(pts[0][0], pts[0][1]); s.lineTo(pts[1][0], pts[1][1]); s.lineTo(pts[2][0], pts[2][1]); s.closePath(); return s; }
  function plateShapes() {
    var hex = hexPath(50, T.Shape); hex.holes.push(hexPath(39, T.Path));
    var A = [[-16, -22], [-16, 22], [31, 0]], cen = [-0.33, 0], k = 0.55;
    var inner = A.map(function (v) { return [cen[0] + (v[0] - cen[0]) * k, cen[1] + (v[1] - cen[1]) * k]; });
    var tri = triPath(A, T.Shape); tri.holes.push(triPath(inner, T.Path));
    return [hex, tri];
  }
  var shapes = plateShapes();
  function plate(h) { var gm = new T.ExtrudeGeometry(shapes, { depth: h, bevelEnabled: false }); gm.rotateX(-Math.PI / 2); return gm; }
  var FLOORS = 10, FH = 4.2;
  var concrete = C(0xb9b4aa), glass = C(0x5f86a8);
  var glassMat = new T.MeshStandardMaterial({ color: concrete, roughness: 0.8, metalness: 0.05, emissive: 0x000000 });
  var slabMat = new T.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.7 });
  var gGeo = plate(3.3), sGeo = plate(0.9);
  var tower = new T.Group(), floors = [];
  for (var f = 0; f < FLOORS; f++) {
    var fg = new T.Group(); fg.position.y = f * FH;
    var gm = new T.Mesh(gGeo, glassMat); gm.castShadow = gm.receiveShadow = true;
    var sm = new T.Mesh(sGeo, slabMat); sm.position.y = 3.3; sm.castShadow = sm.receiveShadow = true;
    fg.add(gm); fg.add(sm); fg.visible = false; tower.add(fg); floors.push(fg);
  }
  var roofMat = new T.MeshStandardMaterial({ color: 0x5f8f48, roughness: 1 });
  var roof = new T.Mesh(plate(0.6), roofMat); roof.position.y = FLOORS * FH; roof.castShadow = true; roof.visible = false; tower.add(roof);
  scene.add(tower);

  // tower crane
  var craneMat = new T.MeshStandardMaterial({ color: 0xe0a020, roughness: 0.6 });
  var crane = new T.Group(); crane.position.set(62, 0, -56);
  var mast = new T.Mesh(boxGeo, craneMat); mast.scale.set(2.2, 74, 2.2); mast.castShadow = true; crane.add(mast);
  var jib = new T.Group(); jib.position.y = 74;
  var arm = new T.Mesh(boxGeo, craneMat); arm.scale.set(72, 1.8, 2); arm.position.set(18, 0, 0); arm.castShadow = true; jib.add(arm);
  var cw = new T.Mesh(boxGeo, new T.MeshStandardMaterial({ color: 0x777b80 })); cw.scale.set(8, 6, 6); cw.position.set(-26, -1, 0); jib.add(cw);
  var cab = new T.Mesh(boxGeo, craneMat); cab.scale.set(4, 4, 4); cab.position.set(-4, 1, 3); jib.add(cab);
  var hook = new T.Mesh(boxGeo, new T.MeshStandardMaterial({ color: 0x333333 })); hook.scale.set(0.3, 22, 0.3); hook.position.set(40, -11, 0); jib.add(hook);
  var beacon = new T.Mesh(new T.SphereGeometry(1.2, 8, 8), new T.MeshBasicMaterial({ color: 0xff3b30, fog: false })); beacon.position.set(0, 4, 0); jib.add(beacon);
  crane.add(jib); crane.visible = false; scene.add(crane);

  // trees around the finished building
  var TN = 96, trees = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), new T.MeshStandardMaterial({ color: 0x55843d, roughness: 1 }), TN);
  var treePos = [];
  for (var tq = 0; tq < TN; tq++) {
    var onEdge = tq < 64, ang = rand() * Math.PI * 2, rr, tx, tz;
    if (onEdge) { var sd = (tq % 4), tt0 = (rand() - 0.5) * 128; tx = sd < 2 ? tt0 : (sd === 2 ? -62 : 62); tz = sd < 2 ? (sd === 0 ? -62 : 62) : tt0; }
    else { rr = 46 + rand() * 18; tx = Math.cos(ang) * rr; tz = Math.sin(ang) * rr; }
    treePos.push([tx, tz, 2.6 + rand() * 2.2]);
  }
  trees.castShadow = true; trees.frustumCulled = false; scene.add(trees);
  var lastLand = -1;
  function setTrees(l) {
    if (Math.abs(l - lastLand) < 0.002) return; lastLand = l;
    treePos.forEach(function (t, k) { var s2 = t[2] * l; mtx.compose(pos.set(t[0], t[2] * l * 1.1, t[1]), q, scl.set(s2, s2 * 1.15, s2)); trees.setMatrixAt(k, mtx); });
    trees.instanceMatrix.needsUpdate = true; trees.visible = l > 0.01;
  }
  setTrees(0);

  /* ---------------- traffic lights ---------------- */
  var CARS = 700, carPos = new Float32Array(CARS * 3), carCol = new Float32Array(CARS * 3), carMeta = [];
  for (var c = 0; c < CARS; c++) {
    var axis = rand() < 0.5 ? 0 : 1, lane = ((rand() * 21) | 0) - 10, dir = rand() < 0.5 ? 1 : -1;
    carMeta.push({ axis: axis, line: lane * P + P / 2 + dir * 3.2, off: (rand() - 0.5) * 2400, v: dir * (8 + rand() * 12) });
    var red = dir < 0; carCol[c * 3] = red ? 1 : 1; carCol[c * 3 + 1] = red ? 0.15 : 0.86; carCol[c * 3 + 2] = red ? 0.1 : 0.6;
  }
  var carGeo = new T.BufferGeometry();
  carGeo.setAttribute("position", new T.BufferAttribute(carPos, 3)); carGeo.setAttribute("color", new T.BufferAttribute(carCol, 3));
  var carMat = new T.PointsMaterial({ size: 3.2, vertexColors: true, transparent: true, opacity: 1, blending: T.AdditiveBlending, depthWrite: false, fog: false });
  var cars = new T.Points(carGeo, carMat); cars.frustumCulled = false; scene.add(cars);

  /* ---------------- sun path + sun disc ---------------- */
  function glowTex() { var cc = document.createElement("canvas"); cc.width = cc.height = 128; var x = cc.getContext("2d"), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,250,230,1)"); gr.addColorStop(0.25, "rgba(255,214,140,0.8)"); gr.addColorStop(1, "rgba(255,180,90,0)"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(cc); }
  var sunSprite = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), blending: T.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
  sunSprite.scale.set(46, 46, 1); scene.add(sunSprite);
  var AZ0 = 95, AZ1 = 265, ARC_R = 200;
  function sweep(u) { var az = lerp(AZ0, AZ1, u) * Math.PI / 180, el = (6 + Math.sin(Math.PI * u) * 52) * Math.PI / 180; return new T.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)); }
  var arcPts = []; for (var u = 0; u <= 1.0001; u += 1 / 60) arcPts.push(sweep(u).multiplyScalar(ARC_R));
  var arcMat = new T.LineBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0, fog: false, depthWrite: false });
  var arc = new T.Line(new T.BufferGeometry().setFromPoints(arcPts), arcMat); scene.add(arc);

  /* ---------------- wind ---------------- */
  var WN = 1500, wp = new Float32Array(WN * 3), wv = new Float32Array(WN), wseg = new Float32Array(WN * 6), wcol = new Float32Array(WN * 6);
  for (var w2 = 0; w2 < WN; w2++) {
    wp[w2 * 3] = (rand() - 0.5) * 520; wp[w2 * 3 + 1] = 2 + rand() * 115; wp[w2 * 3 + 2] = (rand() - 0.5) * 360; wv[w2] = 22 + rand() * 16;
    wcol[w2 * 6] = 0.8; wcol[w2 * 6 + 1] = 0.93; wcol[w2 * 6 + 2] = 1; wcol[w2 * 6 + 3] = 0; wcol[w2 * 6 + 4] = 0; wcol[w2 * 6 + 5] = 0;
  }
  var wGeo = new T.BufferGeometry();
  wGeo.setAttribute("position", new T.BufferAttribute(wseg, 3)); wGeo.setAttribute("color", new T.BufferAttribute(wcol, 3));
  var wMat = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false });
  var wind = new T.LineSegments(wGeo, wMat); wind.frustumCulled = false; scene.add(wind);
  var vy = new Float32Array(WN), vz = new Float32Array(WN);

  /* ---------------- camera path ---------------- */
  var K = [
    [[-900, 380, 1000], [60, 40, 0]], [[-640, 290, 700], [20, 30, 0]], [[-340, 190, 370], [0, 15, 0]],
    [[-120, 250, 130], [0, 5, 0]], [[0, 320, 40], [0, 0, 0]], [[-90, 170, 200], [0, 12, 0]],
    [[-160, 105, 175], [0, 22, 0]], [[-60, 92, 235], [0, 28, 0]], [[150, 80, 190], [0, 30, 0]],
    [[240, 65, 60], [0, 35, 0]], [[-20, 42, -205], [0, 25, 0]]
  ];
  var posCurve = new T.CatmullRomCurve3(K.map(function (k) { return new T.Vector3(k[0][0], k[0][1], k[0][2]); }), false, "centripetal");
  var tgtCurve = new T.CatmullRomCurve3(K.map(function (k) { return new T.Vector3(k[1][0], k[1][1], k[1][2]); }), false, "centripetal");

  var lblSun = document.getElementById("sunLabel");
  var cTop = new T.Color(), cBot = new T.Color(), tmp = new T.Color(), lastShown = "";
  var sunDir = new T.Vector3(), cp = new T.Vector3(), ct = new T.Vector3();

  function sunState(p) {
    var az, el, show = 0, time = null;
    if (p < 3.7) { var k = sat(p / 3.5); az = lerp(262, 238, k); el = lerp(5.5, 16, k); }
    else if (p < 4.65) { var u2 = (p - 3.7) / 0.95; var s2 = sweep(sat(u2)); sunDir.copy(s2); time = 6 + 12 * sat(u2); show = 1; return { dir: s2.clone(), show: show, time: time, u: sat(u2) }; }
    else { var kk = smooth((p - 4.65) / 0.35); var sa = sweep(1); var azA = AZ1, elA = 6; az = lerp(azA, 215, kk); el = lerp(elA, 42, kk); }
    var r = Math.PI / 180;
    return { dir: new T.Vector3(Math.cos(el * r) * Math.sin(az * r), Math.sin(el * r), Math.cos(el * r) * Math.cos(az * r)), show: 0, time: null, u: 0 };
  }

  var lastRender = 0;
  function update(p, tt) {
    p = clamp(p, 0, 5);
    // camera
    var t = p / 5; posCurve.getPoint(t, cp); tgtCurve.getPoint(t, ct);
    cp.x += Math.sin(tt * 0.31) * 1.6; cp.y += Math.cos(tt * 0.27) * 0.9;
    camera.position.copy(cp); camera.lookAt(ct);
    sky.position.copy(cp);

    // sun / sky
    var S = sunState(p), el = Math.asin(S.dir.y) * 180 / Math.PI, kd = sat((el - 5) / 36);
    sunDir.copy(S.dir);
    sun.position.copy(S.dir).multiplyScalar(700); sun.target.position.set(0, 0, 0);
    sun.intensity = lerp(1.5, 3.1, smooth(kd * 1.4));
    sun.color.copy(C(0xff9f55)).lerp(C(0xfff1dc), smooth(kd * 1.6));
    cTop.copy(C(0x233057)).lerp(C(0x4f8fd0), kd); cBot.copy(C(0xf79a52)).lerp(C(0xcfe4f2), Math.pow(kd, 0.7));
    skyU.top.value.copy(cTop); skyU.bottom.value.copy(cBot); skyU.sunDir.value.copy(S.dir);
    scene.fog.color.copy(cBot); scene.fog.density = lerp(0.00052, 0.00034, kd);
    hemi.color.copy(cTop).lerp(C(0xffffff), 0.35); hemi.groundColor.copy(C(0x54493d));
    hemi.intensity = lerp(0.55, 0.95, kd);
    nightU.value = 1 - smooth((p - 2.6) / 1.2);
    carMat.opacity = 0.25 + 0.75 * nightU.value;

    // sun path + disc
    var sa = smooth((p - 3.55) / 0.3) * (1 - smooth((p - 4.7) / 0.3));
    arcMat.opacity = 0.75 * sa;
    sunSprite.position.copy(S.dir).multiplyScalar(ARC_R); sunSprite.material.opacity = sa; sunSprite.visible = sa > 0.01;
    arc.visible = sa > 0.01;
    if (lblSun) {
      var txt = "";
      if (S.show && sa > 0.1) { var hh = Math.floor(S.time), mm = Math.floor((S.time - hh) * 60); txt = "☀ " + (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm; }
      if (txt !== lastShown) { lblSun.textContent = txt; lastShown = txt; }
      lblSun.style.opacity = txt ? 1 : 0;
    }

    // lot marker
    markMat.opacity = smooth((p - 0.7) / 0.5) * (1 - smooth((p - 2.2) / 0.4)) * (0.55 + 0.45 * Math.sin(tt * 3));

    // construction
    var gwt = 10 * sat((p - 2.4) / 1.1), fac = smooth((p - 3.35) / 0.65), land = smooth((p - 4.0) / 0.6);
    for (var i2 = 0; i2 < FLOORS; i2++) { var gk = sat(gwt - i2); floors[i2].visible = gk > 0.002; floors[i2].scale.y = Math.max(gk, 0.001); }
    glassMat.color.copy(concrete).lerp(glass, fac); glassMat.roughness = lerp(0.85, 0.2, fac); glassMat.metalness = lerp(0.05, 0.55, fac);
    glassMat.emissive.setRGB(1, 0.7, 0.4).multiplyScalar(0.18 * nightU.value * fac);
    roof.visible = land > 0.01; roof.scale.y = Math.max(land, 0.01);
    var showCrane = gwt > 0.2 && fac < 0.92; crane.visible = showCrane;
    if (showCrane) { jib.rotation.y = tt * 0.16 + 0.8; crane.scale.y = 1 - smooth((fac - 0.6) / 0.32) * 0.9; }
    soilMat.color.copy(C(0x80664a)).lerp(C(0x8c9387), land);
    setTrees(land);

    // traffic
    var dt = Math.min(0.05, tt - lastRender || 0.016); lastRender = tt;
    for (var c2 = 0; c2 < CARS; c2++) {
      var m = carMeta[c2]; m.off += m.v * dt; if (m.off > 1300) m.off -= 2600; else if (m.off < -1300) m.off += 2600;
      if (m.axis) { carPos[c2 * 3] = m.line; carPos[c2 * 3 + 2] = m.off; } else { carPos[c2 * 3] = m.off; carPos[c2 * 3 + 2] = m.line; }
      carPos[c2 * 3 + 1] = 1.2;
    }
    carGeo.attributes.position.needsUpdate = true;

    // wind
    var wa = smooth((p - 4.5) / 0.4);
    wMat.opacity = 0.85 * wa; wind.visible = wa > 0.01;
    if (wind.visible) {
      for (var w3 = 0; w3 < WN; w3++) {
        var x = wp[w3 * 3], y = wp[w3 * 3 + 1], z = wp[w3 * 3 + 2], vx = wv[w3], ax = 0, az2 = 0, ay = 0;
        var dd = Math.hypot(x, z);
        if (dd < 66 && y < 50) { var pu = (66 - dd) / 66; ax = (x / (dd + 0.1)) * pu * 46; az2 = (z / (dd + 0.1)) * pu * 46; ay = pu * 14; }
        vz[w3] += (az2 - vz[w3]) * 0.12; vy[w3] += (ay - vy[w3]) * 0.12;
        var ux = vx + ax * 0.6, uz = vz[w3], uy = vy[w3] + Math.sin(tt * 0.8 + w3) * 0.8;
        x += ux * dt; y = clamp(y + uy * dt, 1.5, 125); z += uz * dt;
        if (x > 260) { x = -260; z = (rand() - 0.5) * 360; y = 2 + rand() * 115; vz[w3] = 0; vy[w3] = 0; }
        if (Math.abs(z) > 200) z *= -0.98;
        wp[w3 * 3] = x; wp[w3 * 3 + 1] = y; wp[w3 * 3 + 2] = z;
        var len = 7 + Math.hypot(ux, uz) * 0.12, n = Math.hypot(ux, uy, uz) || 1;
        wseg[w3 * 6] = x; wseg[w3 * 6 + 1] = y; wseg[w3 * 6 + 2] = z;
        wseg[w3 * 6 + 3] = x - ux / n * len; wseg[w3 * 6 + 4] = y - uy / n * len; wseg[w3 * 6 + 5] = z - uz / n * len;
      }
      wGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  window.PRISM_SCENE = { update: update };
  update(0, 0);
})();
