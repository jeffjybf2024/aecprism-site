// 2.5D renderer for the whole page background.
// Each station is a photo plus a depth map; the camera dollies and drifts through it,
// so near things move more than far things and nothing is redrawn (no morphing).
// Between different photos a depth scan sweeps the next scene in from near to far.
(function () {
  "use strict";

  var VS = "attribute vec2 a;varying vec2 v;void main(){v=a*0.5+0.5;v.y=1.0-v.y;gl_Position=vec4(a,0.0,1.0);}";
  var FS = [
    "precision highp float;",
    "varying vec2 v;",
    "uniform sampler2D iA,dA,iB,dB,mk;",
    "uniform vec3 cA,cB,logo;",
    "uniform mat3 hA,hB;",
    "uniform vec2 cover,texel;",
    "uniform float mixv,scan,time,shade,warm,aspect,dip,drawv;",
    "const vec2 MS=vec2(960.0,540.0);",
    "const vec3 ACC=vec3(0.94,0.65,0.29);",
    "vec2 cl(vec2 p){return clamp(p,vec2(0.002),vec2(0.998));}",
    "vec3 sc(sampler2D im,sampler2D dp,vec2 uv,vec3 cam,out float d,out vec2 p){",
    "  d=0.5;p=uv;",
    "  for(int i=0;i<3;i++){",
    "    d=texture2D(dp,cl(p)).r;",
    "    float s=(1.0+cam.z*(0.35+d))*1.07;",
    "    p=vec2(0.5)+(uv-vec2(0.5))/s+cam.xy*(d-0.45);",
    "  }",
    "  return texture2D(im,cl(p)).rgb;",
    "}",
    "float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}",
    // the setting-out painted in the logo's blue, keeping the ground texture and the white dashes.
    // H maps this photo onto the logo photo (the site seen from just before is painted too);
    // the mask's g+b hold where along the pen's path each point lies, so drawv draws it in one line
    "vec3 paint(vec3 c,vec2 p,float amt,mat3 H){",
    "  if(amt<0.001)return c;",
    "  vec3 hq=H*vec3(p,1.0);vec2 q=hq.xy/hq.z;",
    "  if(q.x<0.0||q.y<0.0||q.x>1.0||q.y>1.0)return c;",
    "  vec2 o2=texture2D(mk,(floor(q*MS)+0.5)/MS).gb;float o=o2.x+o2.y/255.0;",
    "  float r=texture2D(mk,q).r*amt,ahead=o-drawv;",
    "  float m=r*(1.0-smoothstep(-0.012,0.0,ahead)),l=dot(c,vec3(0.299,0.587,0.114));",
    // the ground's own light only shades the blue a little, so the paint stays the logo's deep blue on the pale lot
    "  vec3 blue=mix(vec3(0.02,0.16,0.49),vec3(0.11,0.33,0.79),logo.z)*(0.85+0.45*l);",
    // fresh paint is lit for a moment; the pen's head is a short bright bar across the band
    "  float live=step(0.002,drawv)*step(drawv,0.998);",
    "  float fresh=exp(max(0.0,-ahead)*-24.0)*live,tip=r*exp(-pow(ahead/0.007,2.0))*live;",
    "  return mix(c,blue+fresh*vec3(0.10,0.20,0.36),m*0.92)+tip*vec3(0.55,0.78,1.0)*0.85;",
    "}",
    "void main(){",
    "  vec2 uv=(v-vec2(0.5))*cover+vec2(0.5);",
    "  float da,db;vec2 pa,pb;",
    "  vec3 a=paint(sc(iA,dA,uv,cA,da,pa),pa,logo.x,hA);",
    "  vec3 c=a;float glow=0.0;",
    "  if(mixv>0.001){",
    "    vec3 b=paint(sc(iB,dB,uv,cB,db,pb),pb,logo.y,hB);",
    "    if(scan>1.5){",
    // same camera, later moment: the new state is built up from the ground, a level line marks the front
    "      float yb=1.0-v.y,thr=-0.08+mixv*1.16;",
    "      c=mix(a,b,1.0-smoothstep(thr-0.035,thr+0.035,yb));",
    "      glow=exp(-pow((yb-thr)/0.004,2.0))*0.5*step(0.005,mixv)*step(mixv,0.995);",
    "    }else if(scan>0.5){",
    // different place: near things arrive first; a ragged amber front with a soft halo marks the sweep
    "      float n=sin(uv.x*38.0+time*0.8)*sin(uv.y*29.0-time*0.6)*0.015,thr=1.15-mixv*1.3,dd=db+n-thr;",
    "      c=mix(a,b,smoothstep(-0.015,0.015,dd));",
    // the line is as thin on a flat wall as on a steep edge: its width follows the local depth slope
    "      vec2 eb=texel*2.0;",
    "      float gb=length(vec2(texture2D(dB,cl(pb+vec2(eb.x,0.0))).r-texture2D(dB,cl(pb-vec2(eb.x,0.0))).r,texture2D(dB,cl(pb+vec2(0.0,eb.y))).r-texture2D(dB,cl(pb-vec2(0.0,eb.y))).r));",
    "      float lw=clamp(gb*1.2,0.0015,0.02);",
    "      glow=(exp(-pow(dd/lw,2.0))*0.9+0.12*exp(-pow(dd/(lw*6.0),2.0)))*step(0.005,mixv)*step(mixv,0.995);",
    "    }else{c=mix(a,b,mixv);}",
    "  }",
    "  float l=dot(c,vec3(0.299,0.587,0.114));",
    "  c=mix(vec3(l),c,1.08);",
    "  c+=(1.0-l)*vec3(-0.015,0.008,0.035)*0.8;",
    "  c+=l*l*vec3(0.03,0.012,-0.02);",
    "  c=(c-0.5)*1.08+0.5;",
    "  c=mix(c,c*vec3(1.0,0.78,0.5),warm);",
    "  c*=1.0-shade;",
    "  c*=1.0-dip*0.3;",
    "  c+=glow*ACC*1.4;",
    "  vec2 q2=v-0.5;q2.x*=aspect;",
    "  c*=1.0-smoothstep(0.35,0.95,length(q2))*0.55;",
    "  c+=(h(v*vec2(1920.0,1080.0)+fract(time))-0.5)*0.035;",
    "  gl_FragColor=vec4(c,1.0);",
    "}"
  ].join("\n");

  function sh(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function ss(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function uv(pt) { return [pt[0] / 1920, pt[1] / 1080]; }
  // 3x3 homography taking four points s onto four points d, as a column-major mat3
  function homog(s, d) {
    var A = [], i, j, k;
    for (k = 0; k < 4; k++) {
      var x = s[k][0], y = s[k][1], X = d[k][0], Y = d[k][1];
      A.push([x, y, 1, 0, 0, 0, -x * X, -y * X, X]);
      A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y, Y]);
    }
    for (i = 0; i < 8; i++) {
      var piv = i; for (j = i + 1; j < 8; j++) if (Math.abs(A[j][i]) > Math.abs(A[piv][i])) piv = j;
      var tmp = A[i]; A[i] = A[piv]; A[piv] = tmp;
      for (j = 0; j < 8; j++) if (j !== i) { var f = A[j][i] / A[i][i]; for (k = i; k < 9; k++) A[j][k] -= f * A[i][k]; }
    }
    var h = []; for (i = 0; i < 8; i++) h.push(A[i][8] / A[i][i]); h.push(1);
    return [h[0], h[3], h[6], h[1], h[4], h[7], h[2], h[5], h[8]];
  }
  // the pen's path (photo pixels) written into the mask's g+b: for every point near the logo, how far along the
  // path its nearest point is (0..0.98), so the shader can draw the logo in one continuous line
  function pathOrder(g, path, polys) {
    var seg = [], L = 0, k, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (k = 1; k < path.length; k++) {
      var a = path[k - 1], b = path[k], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      seg.push({ ax: a[0], ay: a[1], dx: b[0] - a[0], dy: b[1] - a[1], len: len, at: L }); L += len;
    }
    polys.forEach(function (p) { p.forEach(function (pt) { x0 = Math.min(x0, pt[0]); y0 = Math.min(y0, pt[1]); x1 = Math.max(x1, pt[0]); y1 = Math.max(y1, pt[1]); }); });
    var i0 = Math.max(0, Math.floor((x0 - 24) / 2)), i1 = Math.min(959, Math.ceil((x1 + 24) / 2));
    var j0 = Math.max(0, Math.floor((y0 - 24) / 2)), j1 = Math.min(539, Math.ceil((y1 + 24) / 2));
    var im = g.getImageData(0, 0, 960, 540), d = im.data;
    for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
      var px = i * 2 + 1, py = j * 2 + 1, best = 1e18, at = 0;
      for (k = 0; k < seg.length; k++) {
        var s = seg[k], t = ((px - s.ax) * s.dx + (py - s.ay) * s.dy) / (s.len * s.len);
        t = Math.max(0, Math.min(1, t));
        var ex = s.ax + s.dx * t - px, ey = s.ay + s.dy * t - py, dd = ex * ex + ey * ey;
        if (dd < best - 1e-6) { best = dd; at = s.at + s.len * t; }
      }
      var v = at / L * 0.98 * 255, hi = Math.floor(v), q = (j * 960 + i) * 4;
      d[q + 1] = hi; d[q + 2] = Math.round((v - hi) * 255);
    }
    g.putImageData(im, 0, 0);
  }

  window.PrismGL = {
    ok: false,
    // scenes: [{ f: frame name, z: dolly, x/y: pan, same: next scene shares this camera, logo/holes: painted logo polygons }]
    init: function (canvas, scenes, onReady) {
      var names = [], sc = scenes.map(function (o) { var k = names.indexOf(o.f); if (k < 0) { k = names.length; names.push(o.f); } return { n: k, z: (o.z || 0) + 0.12, x: o.x || 0, y: o.y || 0, same: o.same ? 1 : 0 }; });
      var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
      if (!gl) return false;
      try {
        var pr = gl.createProgram();
        gl.attachShader(pr, sh(gl, gl.VERTEX_SHADER, VS));
        gl.attachShader(pr, sh(gl, gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      } catch (e) { if (window.console) console.warn(e); return false; }
      gl.useProgram(pr);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var U = {}; ["iA", "dA", "iB", "dB", "mk", "cA", "cB", "logo", "hA", "hB", "cover", "texel", "mixv", "scan", "time", "shade", "warm", "aspect", "dip", "drawv"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
      gl.uniform1i(U.iA, 0); gl.uniform1i(U.dA, 1); gl.uniform1i(U.iB, 2); gl.uniform1i(U.dB, 3); gl.uniform1i(U.mk, 4);

      // logo mask: the scene with a `logo` (polygons in 1920x1080 photo pixels; later ones are cut out)
      // gets a mask texture for the blue paint, and a small depth copy so the pointer can be tested against it
      var logoScene = -1, maskData = null, depData = null, MW = 480, MH = 270;
      scenes.forEach(function (o, k) { if (o.logo && logoScene < 0) logoScene = k; });
      // which photos carry the paint: the logo's own (as it is), and any photo whose `site` corners can be matched to
      // the logo photo's `site` corners (a homography, so the same ground gets the same lines from a slightly other camera)
      var ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];
      sc.forEach(function (s, k) {
        var o = scenes[k], L = logoScene >= 0 ? scenes[logoScene] : null;
        s.H = null;
        if (!L) return;
        if (k === logoScene) s.H = ID;
        else if (o.site && L.site && o.f !== L.f) s.H = homog(o.site.map(uv), L.site.map(uv));
      });
      var mkTex = gl.createTexture();
      (function () {
        var cv = document.createElement("canvas"); cv.width = 960; cv.height = 540;
        var g = cv.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, 960, 540);
        if (logoScene >= 0) {
          var o = scenes[logoScene];
          g.scale(0.5, 0.5); g.filter = "blur(0.8px)";
          o.logo.forEach(function (poly, k) {
            g.globalCompositeOperation = k < o.logo.length - (o.holes || 0) ? "source-over" : "destination-out";
            g.fillStyle = "#fff"; g.beginPath();
            poly.forEach(function (pt, i) { if (i) g.lineTo(pt[0], pt[1]); else g.moveTo(pt[0], pt[1]); });
            g.closePath(); g.fill();
          });
          g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "destination-over"; g.filter = "none"; g.fillStyle = "#000"; g.fillRect(0, 0, 960, 540);
          if (o.path && o.path.length > 1) pathOrder(g, o.path, o.logo);
          var sm = document.createElement("canvas"); sm.width = MW; sm.height = MH; var sg = sm.getContext("2d");
          sg.drawImage(cv, 0, 0, MW, MH); maskData = sg.getImageData(0, 0, MW, MH).data;
          var di = new Image();
          di.onload = function () { sg.clearRect(0, 0, MW, MH); sg.drawImage(di, 0, 0, MW, MH); depData = sg.getImageData(0, 0, MW, MH).data; };
          di.src = "assets/depth/" + o.f + ".jpg";
        }
        gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, mkTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cv);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      })();
      var coverX = 1, coverY = 1, logoCam = null;
      // pointer (0..1 of the viewport) over the painted logo? same mapping as the shader's sc()
      this.logoHit = function (x, y) {
        if (!logoCam || !maskData || !depData) return false;
        var ux = (x - 0.5) * coverX + 0.5, uy = (y - 0.5) * coverY + 0.5, px = ux, py = uy, d = 0.5;
        var at = function (data, u, v) { var i = Math.min(MW - 1, Math.max(0, Math.round(u * MW))), j = Math.min(MH - 1, Math.max(0, Math.round(v * MH))); return data[(j * MW + i) * 4] / 255; };
        for (var it = 0; it < 3; it++) {
          d = at(depData, px, py);
          var s = (1 + logoCam[2] * (0.35 + d)) * 1.07;
          px = 0.5 + (ux - 0.5) / s + logoCam[0] * (d - 0.45); py = 0.5 + (uy - 0.5) / s + logoCam[1] * (d - 0.45);
        }
        return at(maskData, px, py) > 0.5;
      };
      gl.uniform2f(U.texel, 1 / 1024, 1 / 576);

      var N = sc.length, T = names.length, tex = [], loaded = 0, self = this;
      function mk(url, cb) {
        var t = gl.createTexture(), im = new Image();
        im.onload = function () {
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          cb();
        };
        im.onerror = cb; // a missing file shows black instead of stopping the whole renderer
        im.src = url;
        return t;
      }
      names.forEach(function (n, i) {
        tex[i] = { img: mk("assets/frames/" + n + ".jpg", done), dep: mk("assets/depth/" + n + ".jpg", done) };
      });
      function done() { loaded++; if (loaded === T * 2) { self.ok = true; if (onReady) onReady(); } }

      // adaptive resolution: weak GPUs render fewer pixels so the scroll stays smooth
      var q = 1, lastT = 0, acc = 0, cnt = 0;
      function adapt() {
        var now = performance.now();
        if (lastT) { var dt = now - lastT; if (dt < 500) { acc += dt; cnt++; } }
        lastT = now;
        if (cnt >= 12) {
          var avg = acc / cnt; acc = 0; cnt = 0;
          if (avg > 36 && q > 0.3) q = Math.max(0.3, q * 0.75);
          else if (avg < 14 && q < 1) q = Math.min(1, q * 1.15);
        }
      }
      function size() {
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5) * q;
        var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
        var cap = Math.sqrt(1100000 / (w * h)); if (cap < 1) { w = Math.round(w * cap); h = Math.round(h * cap); }
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
        var ca = w / h, ia = 16 / 9;
        coverX = ca > ia ? 1 : ca / ia; coverY = ca > ia ? ia / ca : 1;
        gl.uniform2f(U.cover, coverX, coverY);
        gl.uniform1f(U.aspect, ca);
      }

      // p: station position 0..N-1, mx/my: pointer -0.5..0.5, extra: {shade, warm, intro, logo, logoHot} (an old `lens` is ignored)
      this.render = function (p, mx, my, time, extra) {
        if (!this.ok) return;
        adapt();
        size();
        extra = extra || {};
        var i = Math.max(0, Math.min(N - 2, Math.floor(p))), f = p - i, b = Math.min(N - 1, i + 1);
        var A = sc[i], B = sc[b], intro = extra.intro || 1, t, scan = 0, dp = 0, za, zb, xa, xb, ya, yb;
        if (A.n === B.n) {
          // same picture: a pure camera move through the depth map (nothing to ghost)
          var e = ss(0.1, 0.9, f);
          za = zb = A.z + (B.z - A.z) * e; xa = xb = A.x + (B.x - A.x) * e; ya = yb = A.y + (B.y - A.y) * e; t = 0;
        } else if (A.same) {
          // same camera, different moment (the building grows): build the new state up from the ground
          var push = 0.05 * Math.min(1, f / 0.35);
          scan = 2;
          t = ss(0.25, 0.8, f);
          za = A.z + push; zb = B.z + push; xa = A.x; ya = A.y; xb = B.x; yb = B.y;
        } else {
          // different place: dolly forward while the next scene sweeps in by depth
          scan = 1;
          t = ss(0.3, 0.75, f);
          za = A.z + 0.35 * ss(0.2, 0.75, f);
          zb = B.z - 0.12 * (1 - ss(0.3, 0.95, f)); // the next scene also moves forward as it arrives
          dp = Math.sin(Math.PI * t);
          xa = A.x; ya = A.y; xb = B.x; yb = B.y;
        }
        if (i === 0) za += (intro - 1) * 1.2;
        var ax = xa + Math.sin(time * 0.21 + i) * 0.007 - mx * 0.03, ay = ya + Math.cos(time * 0.17 + i) * 0.005 - my * 0.02 + f * 0.012;
        var bx = xb + Math.sin(time * 0.21 + b) * 0.007 - mx * 0.03, by = yb + Math.cos(time * 0.17 + b) * 0.005 - my * 0.02;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[A.n].img);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[A.n].dep);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tex[B.n].img);
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, tex[B.n].dep);
        gl.uniform3f(U.cA, ax, ay, za);
        gl.uniform3f(U.cB, bx, by, zb);
        // logo paint: x for scene A, y for scene B, z = hover glow; draw = how much of the pen's path is drawn
        var lg = extra.logo || 0, lA = A.H ? lg : 0, lB = B.H ? lg : 0;
        logoCam = b === logoScene && t > 0.5 ? [bx, by, zb] : i === logoScene ? [ax, ay, za] : null;
        gl.uniform3f(U.logo, lA, lB, extra.logoHot || 0);
        gl.uniformMatrix3fv(U.hA, false, A.H || ID);
        gl.uniformMatrix3fv(U.hB, false, B.H || ID);
        gl.uniform1f(U.drawv, typeof extra.draw === "number" ? extra.draw : 1.02);
        gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, mkTex);
        gl.uniform1f(U.mixv, t);
        gl.uniform1f(U.scan, scan);
        gl.uniform1f(U.dip, dp);
        gl.uniform1f(U.time, time);
        gl.uniform1f(U.shade, extra.shade || 0);
        gl.uniform1f(U.warm, extra.warm || 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
      return true;
    }
  };
})();
