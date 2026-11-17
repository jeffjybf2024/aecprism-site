/* The real earth at night (NASA Black Marble), with the team's three places joined by lines of light, and the logo
   mark standing at the centre of the globe. It draws into a host element that covers the view; the page tells it
   what to show:

     var e = PRISM_EARTH.mount(host, { base: "assets/earth/" });
     e.set({ show: 1, team: 1, logo: 0, cx: 0.68, cy: 0.5, r: 0.36 });

   show  0..1  the whole picture            team  0..1  the lines, the points and their names
   logo  0..1  the logo at the centre       cx, cy      the globe's centre, as fractions of the view
   r           the globe's radius, as a fraction of the view's height
   dim   0..1  the globe darker (while words pass over it)
   shade 0..1  the globe's left side in shadow, as a sphere is (words stand over it there); sx: where the shadow
               ends, across the globe (-1 its left edge, 0 its middle)
   near  0..1  the globe seen from close by (1: the north of Taiwan fills the view; needs opts.close for the finer
               maps) on the way out to where r puts it; the radius goes evenly by scale, and the view stays over the
               site's place while it is close
   gz    0..1  nearer still than the globe can be drawn: the ground itself (1: the film's top frame fills the view,
               0: the globe at its nearest), evenly by scale. Needs ground({...}) and near 1; see GROUND_FS
   on    0/1   keep drawing the globe although it is not shown yet (so it is ready)
   cloud 0..1  how much cloud there is on the way up and out (see CLOUD_FS), tone 0..1 its light (sunlit white ->
               the last light -> the moon's); veil 0..1: one soft cloud over the whole view (the plain way from the
               film to the earth, where the way out from close by is not shown)
   Every value eases to what was set; now({...}) sets values at once (what follows the scroll exactly).
   ground({ src, site: {x, y}, frame: {x, y, w, h}, ppk, rot }): the film's top frame and how it stands on screen (CSS
   px; ppk: px to a kilometre of ground; rot: which way the ground's x axis points). film({ x, y, ppk, rot } | null):
   the ground under the film's frame on screen while the film still plays (the cloud lies over it).
   Needs three.js (assets/vendor/three.min.js) and logo-shape.js. */
(function () {
  "use strict";
  var T = window.THREE;
  var PLACES = [
    { id: "tw", lat: 23.8, lon: 121.0, zh: "台灣", en: "Taiwan", home: 1 },
    { id: "nz", lat: -41.2, lon: 174.6, zh: "紐西蘭", en: "New Zealand" },
    { id: "bf", lat: 12.3, lon: -1.6, zh: "布吉納法索", en: "Burkina Faso" }
  ];
  var VIEW_A = { lat: 16, lon: 52 }, VIEW_B = { lat: -11, lon: 147 };   // the two ends of the slow swing: Africa in sight, then the Pacific
  // The site's place on the earth (the middle of the maps tw-s2-*.jpg). The globe from close by (state "near") is over
  // it, its radius NEAR_R view heights.
  var SITE = { lat: 25.04, lon: 121.55 }, VIEW_NEAR = SITE, NEAR_R = 26, NEAR_CLOCK = 12.5;
  var SWING = 30, SPIN = 2.4, CAM_D = 4.2, FOV = 26;
  var RAD = Math.PI / 180;
  // the middle of the globe is nearer the eye than its edge: the ground there is drawn PK times larger than the radius
  // says. KM_NEAR: kilometres from the top of the view to its bottom at the globe's nearest
  var PK = Math.sqrt(CAM_D * CAM_D - 1) / (CAM_D - 1), KM_NEAR = 6371 / (NEAR_R * PK);
  function ll(lat, lon, r) { var a = lat * RAD, o = lon * RAD; return new T.Vector3(r * Math.cos(a) * Math.cos(o), r * Math.sin(a), -r * Math.cos(a) * Math.sin(o)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sm(a, b, v) { v = clamp((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); }

  var VS = "varying vec2 vUv;varying vec3 vN;varying vec3 vP;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;gl_Position=projectionMatrix*mv;}";
  var EARTH_FS = [
    "uniform sampler2D night;uniform sampler2D day;uniform sampler2D pa;uniform sampler2D pt;uniform sampler2D pi;uniform float hasPa;uniform float hasPt;uniform float hasPi;uniform float close;uniform vec3 sun;uniform float hasDay;uniform float fade;uniform float shade;uniform float sx;",
    "varying vec2 vUv;varying vec3 vN;varying vec3 vP;",
    "void main(){",
    " vec3 N=normalize(vN),V=normalize(-vP);",
    " vec3 n=texture2D(night,vUv).rgb;",
    " vec2 ge=vec2((vUv.x-.5)*360.,(vUv.y-.5)*180.);",                                       // degrees east and north
    " vec2 ua=(ge-vec2(96.,0.))/50.,ut=(ge-vec2(115.,18.))/12.;",                           // the finer maps around Taiwan, soft at their edges
    " vec2 ea=smoothstep(0.,.07,ua)*(1.-smoothstep(.93,1.,ua)),et=smoothstep(0.,.07,ut)*(1.-smoothstep(.93,1.,ut));",
    " float cl=smoothstep(0.,.3,close);",                                                   // the finer maps only from close by: far off, the globe is one map
    " n=mix(n,texture2D(pa,ua).rgb,ea.x*ea.y*hasPa*cl);n=mix(n,texture2D(pt,ut).rgb,et.x*et.y*hasPt*cl);",
    " vec2 ui=(ge-vec2(118.5,21.))/5.,ei=smoothstep(0.,.07,ui)*(1.-smoothstep(.93,1.,ui));n=mix(n,texture2D(pi,ui).rgb,ei.x*ei.y*hasPi*cl);",
    " float lum=dot(n,vec3(.299,.587,.114));",
    " float warm=max(0.,n.r-n.b);",                                       // the lights are warm, the land is navy
    " vec3 col=n*vec3(.8,.9,1.16)*1.06+vec3(.003,.006,.016);",
    " float gain=1.-.82*smoothstep(0.,.55,close);",                                         // from close by the lights are as the map has them
    " col+=(vec3(1.,.76,.46)*pow(warm,.85)*2.6+n*smoothstep(.4,.95,lum)*.9)*gain;",
    " float d=dot(N,sun);",
    " float lit=smoothstep(-.05,.24,d);",
    " vec3 dc=mix(texture2D(day,vUv).rgb,vec3(.5,.7,1.),.3)*1.2;",
    " col=mix(col,dc,lit*hasDay);",
    " col+=vec3(1.,.5,.22)*smoothstep(-.22,-.02,d)*(1.-lit)*.09;",       // the last warm light before the day
    " float f=pow(1.-max(dot(N,V),0.),3.4);",
    " col+=vec3(.14,.34,.92)*f*(.28+.8*smoothstep(-.35,.35,d));",
    " col*=1.-.24*smoothstep(.7,1.,close);",                                                // from its nearest a little quieter, as the ground before it
    " col*=mix(1.,mix(.07,1.,smoothstep(sx-.12,sx+.55,N.x)),shade);",                    // the shadowed side, following the sphere
    " gl_FragColor=vec4(col*fade,1.);",
    "}"].join("\n");
  var AIR_FS = [
    "uniform vec3 sun;uniform float fade;uniform float edge;uniform float shade;uniform float sx;varying vec3 vN;varying vec3 vP;",
    "void main(){",
    " vec3 N=normalize(vN),V=normalize(-vP);",
    " float i=pow(clamp(-dot(N,V)/edge,0.,1.),4.4);",
    " float s=.26+1.05*smoothstep(-.3,.55,dot(N,sun));",
    " s*=mix(1.,mix(.05,1.,smoothstep(sx-.12,sx+.55,N.x*1.1)),shade);",
    " gl_FragColor=vec4(vec3(.24,.48,1.)*i*s*fade,1.);",
    "}"].join("\n");
  var ARC_FS = [
    "uniform float time;uniform float amt;uniform float ph;uniform float wide;uniform vec3 tint;",
    "varying vec2 vUv;varying vec3 vN;varying vec3 vP;",
    "void main(){",
    " float x=vUv.x;",
    " float dd=x-fract(time*.11+ph);if(dd>.5)dd-=1.;if(dd<-.5)dd+=1.;",
    " float comet=dd<0.?exp(dd*7.):exp(-dd*120.);",
    " float ends=smoothstep(0.,.02,x)*smoothstep(1.,.98,x);",
    " float grown=1.-smoothstep(amt*1.06-.06,amt*1.06,x);",
    " float body=mix(1.,pow(max(dot(normalize(vN),normalize(-vP)),0.),2.2),wide);",
    " float a=(mix(.42,.12,wide)+comet*mix(1.6,.8,wide))*ends*grown*body*amt;",
    " gl_FragColor=vec4(mix(tint,vec3(1.),comet*.75*(1.-wide))*a,1.);",
    "}"].join("\n");

  var NOISE = [
    "float hash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}",
    "const mat2 R=mat2(.8,-.6,.6,.8);",                                                     // each finer layer of the noise turned, so no grain runs along the screen
    "float fbl(vec2 p){float a=.57,s=0.;for(int i=0;i<3;i++){s+=a*noise(p);p=R*p*2.03+vec2(17.3,9.1);a*=.5;}return s;}"].join("\n");

  // The ground between the film's top frame and the globe (state gz), drawn over the globe: one picture that the view
  // leaves evenly. In the middle the film's top frame, as the film left it, growing smaller; round it the real land
  // (Sentinel-2 by day, four maps each some four times wider, under the last blue light), lit where NASA's night map
  // glows and the daylight map shows something built, in points that stay points at any distance. Towards the
  // globe's nearest it thins (amt) and the globe's own night map is underneath, at the same place and scale.
  // sp: the view in units of its height, y up; c: the site there; h: kilometres from top to bottom; fo, fs: the top
  // frame's corner and size as the film drew it, from the site; hT: the h at which it fills the view as the film had it
  var GROUND_FS = [
    "precision highp float;uniform sampler2D top;uniform sampler2D s11;uniform sampler2D s44;uniform sampler2D s111;uniform sampler2D s333;uniform sampler2D glw;",
    "uniform vec2 res;uniform vec2 c;uniform vec2 fo;uniform vec2 fs;uniform float h;uniform float hT;uniform float amt;uniform float pxk;varying vec2 vUv;",
    NOISE,
    "const vec2 SITE=vec2(" + SITE.lon.toFixed(4) + "," + SITE.lat.toFixed(4) + ");",
    "float inb(vec2 u){vec2 e=smoothstep(vec2(0.),vec2(.07),u)*smoothstep(vec2(0.),vec2(.07),1.-u);return e.x*e.y;}",
    "float spark(vec2 p,float cell){vec2 g=p/cell,i=floor(g),f=fract(g)-.5;float r=hash(i);vec2 o=vec2(hash(i+7.1),hash(i+3.3))-.5;return smoothstep(.2,0.,length(f-o*.7))*r*r*r*3.;}",
    "void main(){",
    " vec2 sp=(vUv-.5)*vec2(res.x/res.y,1.),d=sp-c,p=d*h;",                                   // p: km east and north of the site
    " float lh=log2(h),k=h/hT,zw=log2(k);",
    " float la=SITE.y+p.y/111.2;vec2 g=vec2(SITE.x+p.x/(111.32*cos(radians(la))),la);",        // degrees east and north
    " vec2 ub=(g-vec2(119.895,23.54))/vec2(3.31,3.),uc=(g-vec2(120.998,24.54))/vec2(1.104,1.),ua=(g-vec2(121.3292,24.84))/vec2(.4416,.4),uz=(g-vec2(121.4948,24.99))/vec2(.1104,.1);",
    " float mb=inb(ub);vec3 dm=texture2D(s333,ub).rgb;dm=mix(dm,texture2D(s111,uc).rgb,inb(uc));dm=mix(dm,texture2D(s44,ua).rgb,inb(ua));dm=mix(dm,texture2D(s11,uz).rgb,inb(uz));dm*=mb;",
    " float glow=smoothstep(.07,.5,dot(texture2D(glw,ub).rgb,vec3(.3,.5,.2)))*mb;",              // where the night map has light
    " float dl=dot(dm,vec3(.3,.5,.2)),green=dm.g-(dm.r+dm.b)*.5;",
    " float water=max(smoothstep(0.,.04,dm.b-max(dm.r,dm.g)),(1.-smoothstep(0.,.02,green))*(1.-smoothstep(.02,.15,glow)));",   // the sea, and what the map's makers left on it
    " float urban=smoothstep(.2,.36,dl)*(1.-smoothstep(.015,.07,green))*(1.-water);",          // pale and not green: built
    " vec3 col=mix(dm*vec3(.09,.15,.3)*1.25,vec3(.006,.012,.03),water);",
    " float lv=log2(pxk*6./.012),k0=floor(lv),kf=lv-k0;",                                      // points some six pixels apart, whatever the distance
    " float spk=mix(spark(p,.012*exp2(k0)),spark(p,.012*exp2(k0+1.)),kf)+spark(p+3.7,.012*exp2(k0+2.))*1.4;",
    " float U=glow*pow(urban,1.3)*(.45+1.1*smoothstep(.26,.5,dl));",
    " col+=vec3(1.,.72,.42)*(glow*.012+U*(.2+.55*smoothstep(3.6,6.6,lh))+U*spk*1.5);",
    // the film's top frame: whole while it fills the view, then its edge worn away, gone once it is small
    " vec2 wu=(d*k-fo)/fs,wc=wu-.5;",
    " float fw=.3+.4*smoothstep(0.,.9,zw),ws=smoothstep(0.,1.1,zw);",
    " float er=max(abs(wc.x),abs(wc.y))*2.+(fbl(p*1.6)-.5)*.6*fw;",
    " float el=length(wc)*2.+((fbl(p*.8)-.5)*.55+(fbl(p*3.1)-.5)*.2)*ws;",
    " float fa=(1.-smoothstep(1.-fw,1.001,er))*(1.-smoothstep(mix(2.2,.38,ws),mix(2.4,.98,ws),el))*(1.-smoothstep(.6,1.8,zw));",
    " col=mix(col,texture2D(top,wu).rgb*mix(1.,.78,ws),fa);",
    " gl_FragColor=vec4(col,amt);",
    "}"].join("\n");

  // The cloud on the way up and out, looking down. It stands in separate puffs at heights four times apart, and each
  // layer is anchored to the ground: the view (1.58 h up, as the film's camera) comes up through a layer, which is
  // first a wide thin veil sweeping outwards, then puffs falling away below, then small, then gone as the next comes.
  // So there is cloud at every distance, from the city to the whole earth, and it never closes: the ground stays in
  // sight, most of all round the site (open). Over the film (gm 0) the ground is where the film has it (c, h, rot);
  // from the film's top frame on (gm 1) it is the globe's (gc, gr, turned with it, ending at its edge so no cloud hangs
  // in space). Puffs: broad forms with billows on them, fine wisps eating at their edges, lit from one side, at night
  // warmed from below where the land is lit. Colour and alpha premultiplied: the cloud lies over the film behind the
  // canvas as well as over the globe. veil: one soft cloud over all of it instead.
  var CLOUD_FS = [
    "precision highp float;uniform sampler2D glw;uniform vec2 res;uniform vec2 c;uniform vec2 gc;uniform vec2 turn;uniform vec2 ro;",
    "uniform float h;uniform float gr;uniform float gm;uniform float amt;uniform float tone;uniform float veil;uniform float under;uniform float time;varying vec2 vUv;",
    NOISE,
    "float bil(vec2 p){float a=.53,s=0.;for(int i=0;i<4;i++){float t=2.*noise(p)-1.;s+=a*t*t*1.7;p=R*p*2.07+vec2(5.2,1.3);a*=.5;}return s;}",   // billows: round tops, soft between
    "float den(vec2 q){float b=fbl(q);return b*.74+bil(q*1.9+b*.7)*.6;}",
    "void main(){",
    " vec2 sp=(vUv-.5)*vec2(res.x/res.y,1.),d=sp-c,pk=d*h;float mask=1.;",                     // pk: km from the site
    " if(gm>.5){vec2 g=(sp-gc)/gr;float d2=dot(g,g);pk=g*(1.+.3*d2)*" + (6371 / PK).toFixed(1) + "+turn*6371.;mask=smoothstep(1.02,.88,sqrt(d2));}",   // on the globe: closer together towards its edge
    " vec2 pg=vec2(ro.x*pk.x-ro.y*pk.y,ro.y*pk.x+ro.x*pk.y);",                                 // as the ground lies (the film turns on the way up)
    " float t1=smoothstep(0.,.5,tone),t2=smoothstep(.5,1.,tone);",                             // day -> the last light -> the moon's
    " vec3 lit=mix(mix(vec3(1.,.98,.95),vec3(1.,.84,.70),t1),vec3(.3,.35,.49),t2);",
    " vec3 dark=mix(mix(vec3(.80,.81,.86),vec3(.64,.54,.56),t1),vec3(.05,.065,.12),t2);",
    " vec3 warm=vec3(0.);",
    " if(under>.01){float la=" + SITE.lat.toFixed(4) + "+pk.y/111.2;vec2 ub=(vec2(" + SITE.lon.toFixed(4) + "+pk.x/(111.32*cos(radians(la))),la)-vec2(119.895,23.54))/vec2(3.31,3.);",
    "  vec2 e=smoothstep(vec2(0.),vec2(.07),ub)*smoothstep(vec2(0.),vec2(.07),1.-ub);warm=vec3(1.,.72,.42)*smoothstep(.07,.5,dot(texture2D(glw,ub).rgb,vec3(.3,.5,.2)))*e.x*e.y*under*.2;}",
    " float alt=1.58*h,open=mix(.24,1.,smoothstep(.1,.55,length(d)));",
    " float thr=.62+(1.-amt)*.34,on=smoothstep(0.,.12,amt)*mask;",
    " vec3 col=vec3(0.);float A=0.;vec2 dr=vec2(time*.004,-time*.0015),ld=vec2(.83,.55)*.24;",
    " for(int j=0;j<6;j++){",
    "  float a=.95*pow(4.,float(j)),lu=log2(alt/a);if(lu<=0.||lu>4.9)continue;",
    "  vec2 q=pg*(1.-a/alt)/(a*1.5)+vec2(13.1,7.7)*float(j+1)+dr;",
    "  float soft=mix(.6,.3,smoothstep(0.,2.6,lu));",                                         // close by, a cloud has no edge
    "  float d0=den(q),wsp=fbl(q*5.3+d0*2.);",
    "  float x=max(0.,(d0+(wsp-.5)*.2-thr)/soft);",                                           // how deep in the puff
    "  float al=(1.-exp(-x*x*2.))*smoothstep(0.,.8,lu)*(1.-smoothstep(3.7,4.9,lu))*open*on*mix(.97,.92,t2);",
    "  float sh=clamp(.54+(d0-den(q+ld))*2.6+(wsp-.5)*.3,0.,1.);",                            // lit from one side
    "  vec3 cc=mix(dark,lit,sh)*(.84+.16*smoothstep(0.,1.6,x))+warm*(1.-sh*.6)*t2;",
    "  col=col*(1.-al)+cc*al;A=A*(1.-al)+al;",
    " }",
    " if(veil>.001){vec2 pf=sp*1.3+vec2(time*.01,0.);float fg=fbl(pf),fh=fbl(pf*2.6+4.);vec3 vc=mix(dark,lit,clamp(.5+(fg-.5)*.7+(fh-.5)*.4,0.,1.));col=mix(col,vc,veil);A=mix(A,1.,veil);}",
    " col+=(hash(gl_FragCoord.xy+time)-.5)*.008*A;",
    " gl_FragColor=vec4(col,A);",
    "}"].join("\n");

  function mount(host, opts) {
    opts = opts || {};
    if (!T || !host) return null;
    var base = opts.base || "assets/earth/";
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canvas = document.createElement("canvas"), over = document.createElement("div");
    canvas.className = "earth-gl"; over.className = "earth-ov"; host.appendChild(canvas); host.appendChild(over);
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" }); }
    catch (e) { host.classList.add("earth-none"); return null; }
    renderer.setClearColor(0x02040b, 1); renderer.autoClear = false;
    var ccanvas = document.createElement("canvas"), crend = null, cu = null, cscene = null, ccam = null, cW = 0;
    ccanvas.className = "earth-cloud"; ccanvas.style.visibility = "hidden"; host.appendChild(ccanvas);
    try {
      crend = new T.WebGLRenderer({ canvas: ccanvas, antialias: false, alpha: true, premultipliedAlpha: true });
      crend.setClearColor(0x000000, 0);
      cu = { glw: { value: null }, res: { value: new T.Vector2(1, 1) }, c: { value: new T.Vector2(0, 0) }, gc: { value: new T.Vector2(0, 0) }, turn: { value: new T.Vector2(0, 0) }, ro: { value: new T.Vector2(1, 0) },
        h: { value: 1 }, gr: { value: 1 }, gm: { value: 0 }, amt: { value: 0 }, tone: { value: 0 }, veil: { value: 0 }, under: { value: 0 }, time: { value: 0 } };
      cscene = new T.Scene(); ccam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      cscene.add(new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ uniforms: cu, fragmentShader: CLOUD_FS, depthTest: false, depthWrite: false, blending: T.NoBlending,
        vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}" })));
    } catch (e) { crend = null; }
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(FOV, 1, 0.1, 200);
    cam.position.set(0, 0, CAM_D);
    var BASE_R = (1 / Math.sqrt(CAM_D * CAM_D - 1)) / Math.tan(FOV * RAD / 2) / 2;   // the globe's radius over the view's height at zoom 1
    var sun = new T.Vector3(0.52, 0.3, -0.8).normalize();

    // stars
    (function () {
      var n = 1500, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var i = 0; i < n; i++) {
        var u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), b = Math.pow(rnd(), 3) * 0.75 + 0.1;
        pos[i * 3] = 90 * s * Math.cos(th); pos[i * 3 + 1] = 90 * u; pos[i * 3 + 2] = 90 * s * Math.sin(th);
        col[i * 3] = b * (0.8 + rnd() * 0.2); col[i * 3 + 1] = b * 0.9; col[i * 3 + 2] = b;
      }
      var g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("color", new T.BufferAttribute(col, 3));
      var stars = new T.Points(g, new T.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false }));
      stars.name = "stars"; scene.add(stars);
    })();
    var stars = scene.getObjectByName("stars");

    // the globe
    var tilt = new T.Group(), spin = new T.Group(); tilt.add(spin); scene.add(tilt);
    var blank = new T.DataTexture(new Uint8Array([2, 4, 12, 255]), 1, 1, T.RGBAFormat); blank.needsUpdate = true;
    if (cu) cu.glw.value = blank;
    var ush = { value: 0 }, usx = { value: -0.4 };
    var eu = { night: { value: blank }, day: { value: blank }, sun: { value: sun }, hasDay: { value: 0 }, fade: { value: 0 }, shade: ush, sx: usx, pa: { value: blank }, pt: { value: blank }, hasPa: { value: 0 }, hasPt: { value: 0 }, pi: { value: blank }, hasPi: { value: 0 }, close: { value: 0 } };
    var earth = new T.Mesh(new T.SphereGeometry(1, 128, 96), new T.ShaderMaterial({ uniforms: eu, vertexShader: VS, fragmentShader: EARTH_FS }));
    spin.add(earth);
    var AIR = 1.1, au = { sun: { value: sun }, fade: { value: 0 }, edge: { value: Math.sqrt(1 - 1 / (AIR * AIR)) }, shade: ush, sx: usx };
    var air = new T.Mesh(new T.SphereGeometry(AIR, 96, 64), new T.ShaderMaterial({ uniforms: au, vertexShader: VS, fragmentShader: AIR_FS, side: T.BackSide, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
    scene.add(air);

    var loaded = 0, big = false;
    function tex(name, done) {
      new T.TextureLoader().load(base + name, function (t) {
        t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.minFilter = T.LinearMipmapLinearFilter; t.wrapS = T.RepeatWrapping; done(t);
      });
    }
    tex("night-4k.jpg", function (t) { if (!big) eu.night.value = t; loaded = 1; });
    tex("day-2k.jpg", function (t) { eu.day.value = t; eu.hasDay.value = 1; });
    if (opts.close) {   // where the view starts from close by: East Asia, Taiwan and the island itself at 500 m (scripts/make-earth-patches.py)
      tex("night-asia.jpg", function (t) { t.wrapS = T.ClampToEdgeWrapping; eu.pa.value = t; eu.hasPa.value = 1; });
      tex("night-tw.jpg", function (t) { t.wrapS = T.ClampToEdgeWrapping; eu.pt.value = t; eu.hasPt.value = 1; });
      tex("night-tw2.jpg", function (t) { t.wrapS = T.ClampToEdgeWrapping; eu.pi.value = t; eu.hasPi.value = 1; });
    }
    // the ground between the film's top frame and the globe (GROUND_FS): its maps load once the page gives the top frame
    var gu = { top: { value: blank }, s11: { value: blank }, s44: { value: blank }, s111: { value: blank }, s333: { value: blank }, glw: { value: blank }, res: { value: new T.Vector2(1, 1) },
      c: { value: new T.Vector2(0, 0) }, fo: { value: new T.Vector2(0, 0) }, fs: { value: new T.Vector2(1, 1) }, h: { value: 1 }, hT: { value: 1 }, amt: { value: 0 }, pxk: { value: 1 } };
    var gscene = new T.Scene(), gcam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), G = null, gleft = -1, fg = null;
    gscene.add(new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ uniforms: gu, fragmentShader: GROUND_FS, depthTest: false, depthWrite: false, transparent: true,
      vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}" })));
    function gtex(url, key, also) {
      gleft++;
      new T.TextureLoader().load(url, function (t) {
        t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.minFilter = T.LinearMipmapLinearFilter; gu[key].value = t; if (also) also.value = t; gleft--;
      });
    }
    function ground(o) {
      if (!o || !o.src || !(o.ppk > 0) || !o.frame || !o.site) return;
      if (!G) { gleft = 0; gtex(base + "tw-s2-11.jpg", "s11"); gtex(base + "tw-s2-44.jpg", "s44"); gtex(base + "tw-s2-111.jpg", "s111"); gtex(base + "tw-s2-333.jpg", "s333"); gtex(base + "tw-glow.jpg", "glw", cu && cu.glw); }
      if (!G || G.src !== o.src) gtex(o.src, "top");
      G = { src: o.src, x: +o.site.x, y: +o.site.y, fx: +o.frame.x, fy: +o.frame.y, fw: +o.frame.w, fh: +o.frame.h, ppk: +o.ppk, rot: +o.rot || 0 };
    }
    function sharper(rPx) {   // the 8k map only where the screen can show it
      if (big || !loaded || rPx < 560 || renderer.capabilities.maxTextureSize < 8192 || (window.matchMedia && matchMedia("(pointer: coarse)").matches)) return;
      big = true; tex("night-8k.jpg", function (t) { var old = eu.night.value; eu.night.value = t; if (old !== blank) old.dispose(); });
    }

    // the lines from Taiwan, the points and their names
    var home = PLACES[0], arcs = [], marks = [], amber = new T.Vector3(1, 0.72, 0.38);
    PLACES.forEach(function (p, i) {
      var g = new T.Group(), n = ll(p.lat, p.lon, 1);
      g.position.copy(n).multiplyScalar(1.004); g.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n);
      var dot = new T.Mesh(new T.CircleGeometry(p.home ? 0.016 : 0.012, 32), new T.MeshBasicMaterial({ color: p.home ? 0xffffff : 0xffd9a0, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      var halo = new T.Mesh(new T.CircleGeometry(0.05, 32), new T.MeshBasicMaterial({ color: 0xf0a64a, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false }));
      var rings = [0, 1].map(function () { return new T.Mesh(new T.RingGeometry(0.03, 0.034, 64), new T.MeshBasicMaterial({ color: 0xffc27a, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); });
      g.add(halo); g.add(dot); rings.forEach(function (r) { g.add(r); }); spin.add(g);
      var lb = document.createElement("div"); lb.className = "earth-lb" + (p.home ? " home" : "");
      lb.innerHTML = '<i></i><b></b><span></span>'; over.appendChild(lb);
      marks.push({ p: p, g: g, n: n, dot: dot, halo: halo, rings: rings, lb: lb, ph: i * 0.37 });
      if (p.home) return;
      var a = ll(home.lat, home.lon, 1), ang = a.angleTo(n), lift = 0.1 + 0.2 * ang / Math.PI, pts = [];
      for (var k = 0; k <= 96; k++) {
        var t = k / 96, s = Math.sin(ang), v = a.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(n.clone().multiplyScalar(Math.sin(t * ang) / s));
        pts.push(v.multiplyScalar(1.004 + lift * Math.sin(Math.PI * t)));
      }
      var curve = new T.CatmullRomCurve3(pts);
      [0, 1].forEach(function (w) {
        var u = { time: { value: 0 }, amt: { value: 0 }, ph: { value: i * 0.43 }, wide: { value: w }, tint: { value: amber } };
        var m = new T.Mesh(new T.TubeGeometry(curve, 220, w ? 0.017 : 0.0045, w ? 10 : 6, false), new T.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: ARC_FS, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
        spin.add(m); arcs.push(u);
      });
    });
    function names() {
      var en = (document.documentElement.lang || "zh").slice(0, 2) === "en";
      marks.forEach(function (m) { m.lb.children[1].textContent = en ? m.p.en : m.p.zh; m.lb.children[2].textContent = en ? "" : m.p.en.toUpperCase(); });
    }
    names(); new MutationObserver(names).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

    // the logo, in a scene of its own so that it always stands in front of the globe's centre
    var lscene = new T.Scene(), logo = new T.Group(), lmat = [], glow = null; lscene.add(logo);
    (function () {
      var d = window.PRISM_LOGO_SHAPE; if (!d) return;
      var H = 0.6, k = H / d.h, ox = d.w / 2, oy = d.h / 2;
      function path(a, into) { for (var i = 0; i < a.length; i += 2) into[i ? "lineTo" : "moveTo"]((a[i] - ox) * k, (oy - a[i + 1]) * k); return into; }
      var shapes = d.shapes.map(function (s) { var sh = path(s.o, new T.Shape()); s.h.forEach(function (h) { sh.holes.push(path(h, new T.Path())); }); return sh; });
      var geo = new T.ExtrudeGeometry(shapes, { depth: 0.075, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.005, bevelSegments: 2, curveSegments: 4 });
      geo.center();
      lmat = [new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.02, transparent: true, opacity: 0, emissive: 0x20242e }),
              new T.MeshStandardMaterial({ color: 0xa9b7d6, roughness: 0.5, metalness: 0.05, transparent: true, opacity: 0, emissive: 0x10141c })];
      logo.add(new T.Mesh(geo, lmat));
      var c = document.createElement("canvas"); c.width = c.height = 256; var x = c.getContext("2d"), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, "rgba(150,185,255,.55)"); gr.addColorStop(0.45, "rgba(90,130,230,.16)"); gr.addColorStop(1, "rgba(60,100,220,0)");
      x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
      glow = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, depthTest: false }));
      glow.scale.set(1.9, 1.9, 1); glow.position.z = -0.4; lscene.add(glow);
      lscene.add(new T.HemisphereLight(0xffffff, 0x2c4a9a, 0.82));
      var k1 = new T.DirectionalLight(0xffffff, 0.7); k1.position.set(-1.4, 1.8, 2.6); lscene.add(k1);
      var k2 = new T.DirectionalLight(0xffc27a, 0.45); k2.position.set(2.2, -1.0, 1.4); lscene.add(k2);
    })();

    var tgt = { show: 0, team: 0, logo: 0, cx: 0.5, cy: 0.5, r: 0.36, dim: 0, shade: 0, sx: -0.4, near: 0, gz: 0, on: 0, cloud: 0, tone: 0, veil: 0 }, cur = {}, first = true, key0;
    for (key0 in tgt) cur[key0] = tgt[key0];
    var W = 0, H = 0, lon = (VIEW_A.lon + VIEW_B.lon) / 2, lat = 6, clock = 0, cclock = 0, lclock = 0, lon0 = false, last = 0, fadeIn = 0, raf = 0, v3 = new T.Vector3(), m3 = new T.Matrix3();
    function size() {
      var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      W = w; H = h; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(w, h, false); cam.aspect = w / h;
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      if (!W) size();
      var k = first ? 1 : 1 - Math.exp(-dt * 3.2), key;
      for (key in tgt) cur[key] += (tgt[key] - cur[key]) * (key === "show" || first ? Math.max(k, 1 - Math.exp(-dt * 6)) : k);
      first = false;
      // the ground (gz): from the film's top frame (hT km from top to bottom) out to the globe's nearest, evenly by scale;
      // the globe underneath keeps the same scale, so the one can thin into the other
      var gOn = !!G && gleft === 0 && cur.gz > 0.0005, hT = G ? Math.min(KM_NEAR * 0.5, H / G.ppk) : 1, hG = KM_NEAR * Math.pow(hT / KM_NEAR, clamp(cur.gz, 0, 1));
      var rPx = Math.min(cur.r * H, 0.6 * W), rNear = rPx * Math.pow(NEAR_R * H / Math.max(1, rPx), cur.near) * (gOn ? KM_NEAR / hG : 1);
      if (crend) {
        if ((cur.cloud > 0.004 || cur.veil > 0.004) && W && !document.hidden) {
          if (cW !== W + "x" + H) { cW = W + "x" + H; crend.setPixelRatio(0.5); crend.setSize(W, H, false); cu.res.value.set(W, H); }
          if (ccanvas.style.visibility === "hidden") ccanvas.style.visibility = "";
          if (!still) cclock += dt;
          var rotC = G ? G.rot : 0;
          cu.gc.value.set((cur.cx - 0.5) * W / H, 0.5 - cur.cy); cu.gr.value = Math.max(0.01, rNear / H);
          cu.turn.value.set((lon - SITE.lon) * RAD, (lat - SITE.lat) * RAD);
          if (fg) { cu.gm.value = 0; cu.c.value.set((fg.x - W / 2) / H, (H / 2 - fg.y) / H); cu.h.value = H / fg.ppk; rotC = fg.rot; }   // over the film
          else { cu.gm.value = 1; cu.c.value.copy(cu.gc.value); cu.h.value = 6371 * H / (rNear * PK); }
          cu.ro.value.set(Math.cos(rotC), Math.sin(rotC));
          cu.under.value = fg ? 0 : 1 - sm(0.3, 0.9, 1 - cur.near);   // the land's lights under the cloud, while the land is near
          cu.amt.value = cur.cloud; cu.tone.value = cur.tone; cu.veil.value = cur.veil; cu.time.value = cclock;
          crend.render(cscene, ccam);
        } else if (cur.cloud <= 0.004 && cur.veil <= 0.004 && ccanvas.style.visibility !== "hidden") ccanvas.style.visibility = "hidden";
      }
      if (cur.show < 0.004 && tgt.show === 0 && !tgt.on && !gOn) { if (canvas.style.visibility !== "hidden") { canvas.style.visibility = "hidden"; over.style.visibility = "hidden"; } return; }
      if (canvas.style.visibility === "hidden") { canvas.style.visibility = ""; over.style.visibility = ""; }
      if (document.hidden || !W) return;
      if (!still) clock += dt;
      if (cur.near > 0.02) clock = NEAR_CLOCK;   // seen from close by, the swing waits at its Pacific end, the nearer one
      if (loaded) fadeIn = Math.min(1, fadeIn + dt / 0.9);
      var L = cur.logo, s = still ? 0.42 : 0.5 - 0.5 * Math.cos(clock * Math.PI * 2 / SWING), e = s * s * (3 - 2 * s);
      var lonT = VIEW_A.lon + (VIEW_B.lon - VIEW_A.lon) * e, latT = VIEW_A.lat + (VIEW_B.lat - VIEW_A.lat) * e;
      // how much the view is still Taiwan's: all of it from close by, less as the view widens (so the island stays in sight)
      var z1 = rPx / (NEAR_R * H), nr = cur.near > 0.001 && z1 < 1 ? 1 - Math.pow(clamp((rPx / rNear - z1) / (1 - z1), 0, 1), 2) : 0;
      lonT += (VIEW_NEAR.lon - lonT) * nr; latT += (VIEW_NEAR.lat - latT) * nr;   // from close by: over Taiwan, where the climb began
      var dl = ((lonT - lon) % 360 + 540) % 360 - 180, pull = 1 - Math.exp(-dt * (1.6 + 7 * nr));
      lon += dl * pull * (1 - L) - (still ? 0 : SPIN * dt * L); lat += ((latT * (1 - L) + 12 * L) - lat) * pull;
      tilt.rotation.x = lat * RAD; spin.rotation.y = -Math.PI / 2 - lon * RAD; stars.rotation.y = -lon * RAD * 0.25;

      cam.zoom = rNear / (BASE_R * H); cam.setViewOffset(W, H, (0.5 - cur.cx) * W, (0.5 - cur.cy) * H, W, H); cam.updateProjectionMatrix();
      sharper(rPx * renderer.getPixelRatio());
      var vis = cur.show * fadeIn;
      ush.value = cur.shade; usx.value = cur.sx; eu.close.value = cur.near;
      eu.fade.value = fadeIn * (1 - 0.22 * L) * (1 - 0.62 * cur.dim); au.fade.value = fadeIn * (1 - 0.5 * cur.dim); canvas.style.opacity = gOn ? "1" : cur.show.toFixed(3);
      arcs.forEach(function (u) { u.time.value = still ? 5.2 : clock; u.amt.value = cur.team * vis; });
      spin.updateMatrixWorld(true); m3.getNormalMatrix(spin.matrixWorld);
      marks.forEach(function (m) {
        var on = cur.team * vis; m.g.visible = on > 0.01;
        m.dot.material.opacity = on; m.halo.material.opacity = 0.22 * on;
        m.rings.forEach(function (r, i) { var q = still ? 0.4 + i * 0.3 : (clock * 0.38 + m.ph + i * 0.5) % 1, sc = 0.5 + q * 2.6; r.scale.set(sc, sc, 1); r.material.opacity = (1 - q) * (1 - q) * 0.85 * on; });
        v3.copy(m.n).applyMatrix3(m3).normalize();
        var facing = sm(0.12, 0.34, v3.z * 0.97 + 0.03);
        v3.copy(m.n).multiplyScalar(1.01).applyMatrix4(spin.matrixWorld).project(cam);
        var a = on * facing;
        m.lb.style.opacity = a.toFixed(3);
        if (a > 0.01) { var flip = (v3.x * 0.5 + 0.5) * W > W - 150; if (flip !== m.flip) { m.flip = flip; m.lb.classList.toggle("flip", flip); } }
        if (a > 0.01) m.lb.style.transform = "translate(" + ((v3.x * 0.5 + 0.5) * W).toFixed(1) + "px," + ((-v3.y * 0.5 + 0.5) * H).toFixed(1) + "px)";
      });
      renderer.clear(); renderer.render(scene, cam);
      if (gOn) {
        gu.res.value.set(W, H); gu.c.value.set((cur.cx - 0.5) * W / H, 0.5 - cur.cy); gu.h.value = hG; gu.hT.value = hT; gu.pxk.value = hG / (H * renderer.getPixelRatio());
        gu.fo.value.set((G.fx - G.x) / H, (G.y - G.fy - G.fh) / H); gu.fs.value.set(G.fw / H, G.fh / H);
        gu.amt.value = sm(0, 0.13, cur.gz);   // thinning into the globe over the last of the way (from some 120 km)
        renderer.render(gscene, gcam);
      }
      if (!(L * vis > 0.004)) lon0 = false;
      if (lmat.length && L * vis > 0.004) {
        if (!lon0) { lon0 = true; lclock = -2.4; }   // it comes in just before it faces the visitor
        if (!still) lclock += dt;
        var ph = still ? 0.9 : lclock * Math.PI * 2 / 20, a2 = L * vis;
        logo.rotation.y = ph - 0.8 * Math.sin(ph);   // it lingers while it faces the visitor and turns its back quickly logo.rotation.x = still ? 0 : 0.05 * Math.sin(clock * 0.5);
        logo.scale.setScalar(0.86 + 0.14 * sm(0, 1, L)); logo.position.y = still ? 0 : 0.012 * Math.sin(clock * 0.8);
        lmat[0].opacity = lmat[1].opacity = a2; glow.material.opacity = a2 * 0.9;
        renderer.clearDepth(); renderer.render(lscene, cam);
      }
    }
    size(); window.addEventListener("resize", size);
    raf = requestAnimationFrame(frame);
    return {
      set: function (o) { for (var k in o) if (k in tgt) tgt[k] = +o[k]; },
      now: function (o) { for (var k in o) if (k in tgt) tgt[k] = cur[k] = +o[k]; },
      ground: ground,
      film: function (o) { fg = o && o.ppk > 0 ? { x: +o.x, y: +o.y, ppk: +o.ppk, rot: +o.rot || 0 } : null; },
      jump: function () { first = true; },
      state: function () { return { cur: cur, lon: lon, lat: lat, loaded: loaded, big: big, w: W, h: H, rPx: Math.min(cur.r * H, 0.6 * W), kmNear: KM_NEAR, nearR: NEAR_R, ground: !!G && gleft === 0 }; },
      destroy: function () { cancelAnimationFrame(raf); window.removeEventListener("resize", size); renderer.dispose(); if (crend) crend.dispose(); host.removeChild(canvas); host.removeChild(over); host.removeChild(ccanvas); }
    };
  }
  window.PRISM_EARTH = { mount: mount, places: PLACES };
})();
