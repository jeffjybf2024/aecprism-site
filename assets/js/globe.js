/* Ported from the earlier AEC PRISM site. Team "glyph globe": vanilla-JS port of Originkit's Glyph Globe (AsciiGlobe) supplied by the
 * user, restyled for the soft theme, with Burkina Faso / Taiwan / New Zealand markers, arcs and
 * the AEC PRISM mark at Taiwan. Falls back to the static image when WebGL2 is unavailable. */
(function () {
  'use strict';
  var LAND_MASK = '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';
  var IMGS = {"bf": "assets/img/globe/bf.png", "tw": "assets/img/globe/tw.png", "nz": "assets/img/globe/nz.png", "mark": "assets/img/globe/mark.png"};
  var MASK_DEG = 0.25, MASK_W = 1440, MASK_H = 720, RAMP_DEG = 4, COL_RATIO = 0.5;
  var GLYPH_EM = 0.8, ADVANCE_EM = 0.6, ATLAS_GRID = 4, ATLAS_CELL = 64, ACCENT_CELL = 15;
  var FOV = 40, ROLL_DEG = -10, TICKS_AT_50 = 5, FOLLOW_RATE = 7.5;
  var CFG = { base: [225 / 255, 236 / 255, 255 / 255], accent: [240 / 255, 166 / 255, 74 / 255], rows: 64, dotSize: 92, speed: 60, step: 2,
    distance: 300, reach: 60, lift: 80, tilt: 2, offsetY: 0, ramp: ['P', 'P'], family: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace', weight: '500',
    spring: { k: 800, c: 60, m: 1 }, swing: [-150, -20] };
  var PLACES = [
    { key: 'bf', lat: 12.3, lon: -1.5, col: '#E9A23B' },
    { key: 'tw', lat: 23.7, lon: 121.0, col: '#3E86D6' },
    { key: 'nz', lat: -41.3, lon: 174.8, col: '#43A85A' },
  ];
  var ARCS = [[0, 1, '#E9A23B'], [1, 2, '#43A85A']];

  function decodeMask() {
    var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', idx = {};
    for (var i = 0; i < 64; i++) idx[B64[i]] = i;
    var bits = new Uint8Array(MASK_W * MASK_H), k = 0, cur = 0; i = 0;
    while (i < LAND_MASK.length) { var v = 0, sh = 0, c; do { c = idx[LAND_MASK[i++]]; v |= (c & 31) << sh; sh += 5; } while (c & 32); if (cur) bits.fill(1, k, k + v); k += v; cur ^= 1; }
    return bits;
  }
  var COAST = null;
  function coastDistance() {
    if (COAST) return COAST;
    var mask = decodeMask(), W = MASK_W, H = MASK_H, d = new Float32Array(W * H), hx = new Float32Array(H), dg = new Float32Array(H), x, y, i, m;
    for (i = 0; i < d.length; i++) d[i] = mask[i] ? RAMP_DEG : 0;
    for (y = 0; y < H; y++) { var lat = 90 - (y + 0.5) * MASK_DEG; hx[y] = MASK_DEG * Math.max(0.05, Math.cos(lat * Math.PI / 180)); dg[y] = Math.hypot(hx[y], MASK_DEG); }
    var v = MASK_DEG;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) { i = y * W + x; m = d[i]; if (m === 0) continue;
      if (x > 0) m = Math.min(m, d[i - 1] + hx[y]);
      if (y > 0) { m = Math.min(m, d[i - W] + v); if (x > 0) m = Math.min(m, d[i - W - 1] + dg[y]); if (x < W - 1) m = Math.min(m, d[i - W + 1] + dg[y]); }
      d[i] = m; }
    for (y = H - 1; y >= 0; y--) for (x = W - 1; x >= 0; x--) { i = y * W + x; m = d[i]; if (m === 0) continue;
      if (x < W - 1) m = Math.min(m, d[i + 1] + hx[y]);
      if (y < H - 1) { m = Math.min(m, d[i + W] + v); if (x < W - 1) m = Math.min(m, d[i + W + 1] + dg[y]); if (x > 0) m = Math.min(m, d[i + W - 1] + dg[y]); }
      d[i] = m; }
    return (COAST = d);
  }
  function hash2(i, j) { var n = Math.imul(i, 374761393) ^ Math.imul(j, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); n = n ^ (n >>> 16); return (n >>> 0) / 4294967296; }
  function buildGlobe(rows) {
    var dist = coastDistance(), latStep = 180 / rows, colStep = latStep * COL_RATIO, out = [];
    for (var r = 0; r < rows; r++) {
      var lat = -90 + (r + 0.5) * latStep, la = lat * Math.PI / 180, cl = Math.cos(la), sl = Math.sin(la);
      var count = Math.max(1, Math.round(360 * cl / colStep)), phase = r % 2 ? 0.5 : 0;
      var j = Math.min(MASK_H - 1, Math.max(0, Math.floor((90 - lat) / MASK_DEG)));
      for (var k = 0; k < count; k++) {
        var lon = -180 + (k + phase) * 360 / count, lo = lon * Math.PI / 180;
        var i = Math.min(MASK_W - 1, Math.max(0, Math.floor((lon + 180) / MASK_DEG))), dd = dist[j * MASK_W + i];
        out.push(cl * Math.sin(lo), sl, cl * Math.cos(lo), dd > 0 ? Math.min(1, dd / RAMP_DEG) : -1, hash2(r, k));
      }
    }
    return new Float32Array(out);
  }

  var VS = '#version 300 es\nprecision highp float;in vec2 aCorner;in vec3 aPos;in float aLand;in float aSeed;uniform mat3 uRot;uniform float uCamD;uniform float uTanY;uniform float uAspect;uniform float uOffY;uniform vec2 uRes;uniform vec2 uMouse;uniform float uReach;uniform float uHole;uniform float uCellPx;uniform float uRampN;uniform float uTime;out vec2 vUv;flat out float vCell;flat out float vKind;flat out float vAlpha;flat out float vDotR;flat out float vBox;\n' +
    'void main(){vec3 p=uRot*aPos;float depth=uCamD-p.z;float facing=(uCamD*p.z-1.0)/max(depth,1e-4);vUv=vec2(aCorner.x+0.5,0.5-aCorner.y);if(facing<=0.0){gl_Position=vec4(2.0,2.0,2.0,1.0);vCell=0.0;vKind=0.0;vAlpha=0.0;vDotR=0.0;vBox=1.0;return;}' +
    'vec2 ndc=vec2(p.x/(depth*uTanY*uAspect),p.y/(depth*uTanY)+uOffY);vec2 s=(ndc*0.5+0.5)*uRes;vec2 v=s-uMouse;float d=length(v);if(uHole>0.0&&d<uReach){float k=1.0-d/uReach;vec2 dir=d>1e-3?v/d:vec2(0.0,1.0);s=uMouse+dir*(d+uHole*k*k);}' +
    'float cell=uCellPx/depth*mix(0.6,1.0,facing);float fade=smoothstep(0.0,0.5,facing);float box=cell;vDotR=0.0;if(aLand<0.0){vKind=0.0;vCell=0.0;vAlpha=0.14*fade;vDotR=cell*0.075;box=2.0*max(vDotR,0.9)+3.0;}else{vKind=1.0;vCell=min(floor(aLand*uRampN),uRampN-1.0);vAlpha=mix(0.85,1.0,aLand)*fade;' +
    'if(aSeed<0.015&&aLand>0.35){float ph=fract(aSeed*977.0+uTime*0.12);if(ph<0.45){vKind=2.0;vCell=15.0;vAlpha=fade;}}}vBox=box;s+=aCorner*box;gl_Position=vec4(s/uRes*2.0-1.0,0.0,1.0);}';
  var FS = '#version 300 es\nprecision highp float;uniform sampler2D uAtlas;uniform vec3 uBase;uniform vec3 uAccent;in vec2 vUv;flat in float vCell;flat in float vKind;flat in float vAlpha;flat in float vDotR;flat in float vBox;out vec4 outColor;' +
    'void main(){float a;vec3 col=uBase;if(vKind<0.5){float d=length(vUv-0.5)*vBox;float r=max(vDotR,0.9);float area=min(1.0,(vDotR*vDotR)/(r*r));a=clamp(r+0.5-d,0.0,1.0)*area;}else{const float G=4.0;vec2 cell=vec2(mod(vCell,G),floor(vCell/G));a=texture(uAtlas,(cell+vUv)/G).a;if(vKind>1.5)col=uAccent;}a*=vAlpha;if(a<0.002)discard;outColor=vec4(col*a,a);}';

  var imgs = {};
  Object.keys(IMGS).forEach(function (k) { var im = new Image(); im.src = IMGS[k]; imgs[k] = im; });
  var running = null;

  function mount(frame) {
    var root = document.createElement('div'); root.className = 'gglobe';
    var canvas = document.createElement('canvas'), over = document.createElement('canvas');
    canvas.className = 'gglobe__gl'; over.className = 'gglobe__ov';
    root.appendChild(canvas); root.appendChild(over);
    var gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) return null;
    frame.classList.add('tglobe__frame--glyph'); frame.appendChild(root);
    var ctx = over.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; }
    var prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
    var U = function (n) { return gl.getUniformLocation(prog, n); };
    var u = { rot: U('uRot'), camD: U('uCamD'), tanY: U('uTanY'), aspect: U('uAspect'), offY: U('uOffY'), res: U('uRes'), mouse: U('uMouse'), reach: U('uReach'), hole: U('uHole'), cellPx: U('uCellPx'), rampN: U('uRampN'), time: U('uTime'), atlas: U('uAtlas'), base: U('uBase'), accent: U('uAccent') };
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var cb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
    var ac = gl.getAttribLocation(prog, 'aCorner'); gl.enableVertexAttribArray(ac); gl.vertexAttribPointer(ac, 2, gl.FLOAT, false, 0, 0);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    var data = buildGlobe(CFG.rows), count = data.length / 5; gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    [['aPos', 3, 0], ['aLand', 1, 12], ['aSeed', 1, 16]].forEach(function (a) { var l = gl.getAttribLocation(prog, a[0]); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, a[1], gl.FLOAT, false, 20, a[2]); gl.vertexAttribDivisor(l, 1); });
    var tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.uniform1i(u.atlas, 0);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    function drawAtlas() {
      var a = document.createElement('canvas'); a.width = a.height = ATLAS_GRID * ATLAS_CELL; var x = a.getContext('2d');
      var px = Math.round(ATLAS_CELL * GLYPH_EM), spec = 'normal ' + CFG.weight + ' ' + px + 'px ' + CFG.family;
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      // every glyph cell is the AEC PRISM mark, sized like a digit (cap height of the 0/1 it replaces)
      var mk = imgs.mark, ok = mk.complete && mk.naturalWidth;
      var mh = Math.round(px * 0.74), mw = ok ? Math.round(mh * mk.naturalWidth / mk.naturalHeight) : 0;
      var sil = document.createElement('canvas'); sil.width = Math.max(1, mw); sil.height = mh;
      if (ok) { var sx = sil.getContext('2d'); sx.drawImage(mk, 0, 0, mw, mh); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, mw, mh); }
      function put(ch, cell) {
        var cx = (cell % ATLAS_GRID) * ATLAS_CELL + ATLAS_CELL / 2, cy = Math.floor(cell / ATLAS_GRID) * ATLAS_CELL + ATLAS_CELL / 2;
        if (ok) x.drawImage(sil, Math.round(cx - mw / 2), Math.round(cy - mh / 2));
        else { x.font = spec; x.fillText(ch, cx, cy); }
      }
      CFG.ramp.slice(0, 15).forEach(put); put('@', ACCENT_CELL);
      gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, a); gl.generateMipmap(gl.TEXTURE_2D);
    }
    drawAtlas(); if (!imgs.mark.complete) imgs.mark.addEventListener('load', drawAtlas); if (document.fonts && document.fonts.load) document.fonts.load('500 51px "IBM Plex Mono"', '01@').then(drawAtlas).catch(function () {});

    var cssW = 1, cssH = 1, dpr = 1;
    function resize() { cssW = Math.max(1, root.clientWidth); cssH = Math.max(1, root.clientHeight); dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = over.width = Math.round(cssW * dpr); canvas.height = over.height = Math.round(cssH * dpr); }
    var ro = new ResizeObserver(resize); ro.observe(root); resize();
    var tx = 0, ty = 0, inside = false, mx = -1e4, my = -1e4, presence = 0;
    root.addEventListener('pointermove', function (e) { var r = root.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; inside = true; });
    root.addEventListener('pointerleave', function () { inside = false; });
    var vis = true, io = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }); io.observe(root);

    var spin = (window.__ggSpin != null ? window.__ggSpin : (CFG.swing[0] + CFG.swing[1]) / 2), target = spin, vel = 0, dir = 1, tick = 0, time = 0, prev = 0, raf = 0;
    var rot = new Float32Array(9), R = {};
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!document.body.contains(root)) { stop(); return; }
      var dt = prev === 0 ? 0 : Math.min(0.05, Math.max(0, (now - prev) / 1000)); prev = now;
      if (!vis) return;
      time += dt;
      if (!reduce) {
        tick += dt * (CFG.speed / 50) * TICKS_AT_50;
        if (tick >= 1) { tick = Math.min(tick - 1, 0.5); target += dir * CFG.step; if (target >= CFG.swing[1]) dir = -1; if (target <= CFG.swing[0]) dir = 1; }
        var n = 4, h = dt / n; for (var s = 0; s < n; s++) { var f = (-CFG.spring.k * (spin - target) - CFG.spring.c * vel) / CFG.spring.m; vel += f * h; spin += vel * h; }
      }
      var follow = 1 - Math.exp(-dt * FOLLOW_RATE);
      if (inside) { if (presence < 0.001) { mx = tx; my = ty; } else { mx += (tx - mx) * follow; my += (ty - my) * follow; } }
      presence += ((inside ? 1 : 0) - presence) * follow;

      var a = spin * Math.PI / 180, b = CFG.tilt * Math.PI / 180, c = ROLL_DEG * Math.PI / 180;
      var ca = Math.cos(a), sa = Math.sin(a), cbb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
      var y00 = ca, y02 = sa, y20 = -sa, y22 = ca;
      var m00 = y00, m01 = 0, m02 = y02, m10 = -sb * y20, m11 = cbb, m12 = -sb * y22, m20 = cbb * y20, m21 = sb, m22 = cbb * y22;
      R = { r00: cc * m00 - sc * m10, r01: cc * m01 - sc * m11, r02: cc * m02 - sc * m12, r10: sc * m00 + cc * m10, r11: sc * m01 + cc * m11, r12: sc * m02 + cc * m12, m20: m20, m21: m21, m22: m22 };
      rot[0] = R.r00; rot[1] = R.r10; rot[2] = m20; rot[3] = R.r01; rot[4] = R.r11; rot[5] = m21; rot[6] = R.r02; rot[7] = R.r12; rot[8] = m22;
      var W = canvas.width, H = canvas.height, camD = CFG.distance / 100, tanY = Math.tan(FOV / 2 * Math.PI / 180), focal = H / 2 / tanY;
      var globePx = focal * Math.tan(Math.asin(Math.min(0.999, 1 / camD))), reachPx = globePx * CFG.reach / 100;
      var colRad = (180 / CFG.rows) * COL_RATIO * Math.PI / 180, cellWorld = colRad / (GLYPH_EM * ADVANCE_EM);
      gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(prog); gl.bindVertexArray(vao);
      gl.uniformMatrix3fv(u.rot, false, rot); gl.uniform1f(u.camD, camD); gl.uniform1f(u.tanY, tanY); gl.uniform1f(u.aspect, W / H); gl.uniform1f(u.offY, -CFG.offsetY / 50);
      gl.uniform2f(u.res, W, H); gl.uniform2f(u.mouse, mx * dpr, H - my * dpr); gl.uniform1f(u.reach, Math.max(1, reachPx)); gl.uniform1f(u.hole, reachPx / 2 * CFG.lift * presence / 100);
      gl.uniform1f(u.cellPx, cellWorld * CFG.dotSize * focal / 100); gl.uniform1f(u.rampN, Math.min(15, CFG.ramp.length)); gl.uniform1f(u.time, time);
      gl.uniform3f(u.base, CFG.base[0], CFG.base[1], CFG.base[2]); gl.uniform3f(u.accent, CFG.accent[0], CFG.accent[1], CFG.accent[2]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      overlay(W, H, camD, tanY);
    }
    function vec(lat, lon, r) { var la = lat * Math.PI / 180, lo = lon * Math.PI / 180, cl = Math.cos(la); return [cl * Math.sin(lo) * r, Math.sin(la) * r, cl * Math.cos(lo) * r]; }
    function proj(P, W, H, camD, tanY) {
      var x = R.r00 * P[0] + R.r01 * P[1] + R.r02 * P[2], y = R.r10 * P[0] + R.r11 * P[1] + R.r12 * P[2], z = R.m20 * P[0] + R.m21 * P[1] + R.m22 * P[2];
      var depth = camD - z, sx = (x / (depth * tanY * (W / H)) * 0.5 + 0.5) * W, sy = H - ((y / (depth * tanY) - CFG.offsetY / 50) * 0.5 + 0.5) * H;
      return { x: sx, y: sy, z: z, depth: depth };
    }
    function slerp(A, B, t) { var d = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]))), s = Math.sin(d) || 1, k0 = Math.sin((1 - t) * d) / s, k1 = Math.sin(t * d) / s; return [A[0] * k0 + B[0] * k1, A[1] * k0 + B[1] * k1, A[2] * k0 + B[2] * k1]; }
    function overlay(W, H, camD, tanY) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var w = W / dpr, h = H / dpr, zc = 1 / camD;
      var pts = PLACES.map(function (p) { return vec(p.lat, p.lon, 1); });
      // arcs
      ARCS.forEach(function (ar) {
        var A = pts[ar[0]], B = pts[ar[1]], N = 80, prevP = null;
        ctx.lineCap = 'round';
        for (var i = 0; i <= N; i++) {
          var t = i / N, r = 1 + 0.16 * Math.sin(Math.PI * t), q = slerp(A, B, t); q = [q[0] * r, q[1] * r, q[2] * r];
          var P = proj(q, W, H, camD, tanY), visible = P.z > zc - 0.9 * (r - 1);
          var flow = (t * 6 - time * 1.2) % 1; if (flow < 0) flow += 1;
          if (prevP && visible && prevP.v) {
            ctx.strokeStyle = ar[2]; ctx.globalAlpha = 0.35 + 0.55 * Math.pow(1 - flow, 3);
            ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(prevP.x / dpr, prevP.y / dpr); ctx.lineTo(P.x / dpr, P.y / dpr); ctx.stroke();
          }
          prevP = { x: P.x, y: P.y, v: visible };
        }
        ctx.globalAlpha = 1;
      });
      // markers
      var cg = proj([0, 0, 0], W, H, camD, tanY);
      PLACES.forEach(function (p, i) {
        var P = proj(pts[i], W, H, camD, tanY), facing = (camD * P.z - 1) / P.depth;
        var al = Math.max(0, Math.min(1, facing / 0.25)); if (al <= 0) return;
        var x = P.x / dpr, y = P.y / dpr, dx = x - cg.x / dpr, dy = y - cg.y / dpr, L = Math.hypot(dx, dy) || 1;
        var fx = x + dx / L * 64, fy = y + dy / L * 44 - 18, fr = Math.max(16, Math.min(26, h * 0.042));
        ctx.globalAlpha = al;
        var g = ctx.createRadialGradient(x, y, 0, x, y, 14); g.addColorStop(0, p.col); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 7); ctx.fill(); ctx.strokeStyle = p.col; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = p.col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(fx, fy); ctx.stroke();
        // flag disc
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(fx, fy, fr + 3, 0, 7); ctx.fill(); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.arc(fx, fy, fr, 0, 7); ctx.clip(); if (imgs[p.key].complete) ctx.drawImage(imgs[p.key], fx - fr, fy - fr, fr * 2, fr * 2); ctx.restore();
        // rotating rings
        ctx.strokeStyle = p.col; ctx.lineWidth = 1.8; ctx.setLineDash([5, 5]); ctx.lineDashOffset = -time * 12;
        ctx.beginPath(); ctx.arc(fx, fy, fr + 8, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        var a0 = -time * 2.2; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(fx, fy, fr + 14, a0, a0 + 1.7); ctx.stroke();
        // AEC PRISM mark at Taiwan, appearing and disappearing
        if (p.key === 'tw' && imgs.mark.complete) {
          var c4 = (time % 4) / 4, k = c4 < 0.15 ? 0 : c4 < 0.35 ? (c4 - 0.15) / 0.2 : c4 < 0.65 ? 1 : c4 < 0.85 ? 1 - (c4 - 0.65) / 0.2 : 0;
          if (reduce) k = 1;
          if (k > 0) { var mh = 22 * (0.7 + 0.3 * k), mw = mh * imgs.mark.width / imgs.mark.height;
            ctx.globalAlpha = al * k * 0.9; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(x, y - 22, mh * 0.75, 0, 7); ctx.fill();
            ctx.drawImage(imgs.mark, x - mw / 2, y - 22 - mh / 2, mw, mh); }
        }
      });
      ctx.globalAlpha = 1;
    }
    function stop() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); running = null; }
    raf = requestAnimationFrame(loop);
    return { stop: stop, root: root };
  }
  function init() {
    var f = document.getElementById('globeFrame');
    if (!f || f.querySelector('.gglobe')) return;
    running = mount(f);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
