/* Puts the earth at night (earth.js) on the pages.
   Homepage: a layer over the film (#earthHost in .bgfx). After WHY NOW the page gives a stretch of scroll of its own
   (.asc-gap) to one movement: the view leaves the site, straight up, evenly, and does not stop until the whole earth
   is in it. The film's camera does the first part (to 6 km, into the night); from its top frame on the earth layer
   goes on with the same picture: the land round the city, the island, the globe. Cloud stands in separate puffs at
   every height on the way and is passed, never closed. The globe then shows the three places and their lines at TEAM,
   and at CONTACT moves to the middle with the logo at its centre; it does not fade out. Everything follows where
   WHY NOW, TEAM and CONTACT stand on the screen.
   About page: the same globe inside #globeFrame, with the places and lines. */
(function () {
  "use strict";
  var E = window.PRISM_EARTH; if (!E) return;
  function lin(a, b, v) { v = (v - a) / (b - a); return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ssr(a, b, v) { v = (v - a) / (b - a); v = v < 0 ? 0 : v > 1 ? 1 : v; return v * v * (3 - 2 * v); }

  var frame = document.getElementById("globeFrame");
  if (frame) {   // About page: drawn once the frame is near the screen
    var mounted = false, go = function () {
      if (mounted) return; mounted = true;
      var e = E.mount(frame, { base: "assets/earth/" }); if (!e) return;
      frame.classList.add("gframe--earth"); e.set({ show: 1, team: 1, logo: 0, cx: 0.5, cy: 0.5, r: 0.4 }); e.jump();
    };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en, io) { if (en.some(function (x) { return x.isIntersecting; })) { io.disconnect(); go(); } }, { rootMargin: "600px" }).observe(frame); else go();
    return;
  }

  var host = document.getElementById("earthHost"), team = document.getElementById("team"), contact = document.getElementById("contact");
  var why = document.getElementById("why-now"), still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var words = contact && contact.querySelector(".two > div");   // CONTACT's words, standing over the globe's left side
  if (!host || !team || !contact) return;
  var earth = null, tried = false, lastA = -1, dark = false, bg = document.createElement("div");
  bg.className = "earth-bg"; host.appendChild(bg);   // the night's ground: it also darkens the page where the globe cannot be drawn

  // The way out, from WHY NOW in the middle of the screen (q 0) to TEAM there (q 1): how much of it is done at q. It
  // starts from rest (while WHY NOW's words leave), goes at one pace by scale (each stretch of scroll widens the view
  // by the same share, whether the film, the ground or the globe is drawing it) and comes to rest before TEAM's
  // words are in.
  var Q0 = 0.03, QA = 0.14, Q3 = 0.95, QB = 0.2;
  function ramp(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * x - x * x * x * x / 2; }   // the way made while speeding up evenly (smoothstep) from rest
  function way(q) {
    if (q <= Q0) return 0; if (q >= Q3) return 1;
    var all = Q3 - Q0 - QA / 2 - QB / 2, z;
    if (q < Q0 + QA) z = QA * ramp((q - Q0) / QA);
    else if (q < Q3 - QB) z = q - Q0 - QA / 2;
    else { var x = (q - (Q3 - QB)) / QB; z = Q3 - QB - Q0 - QA / 2 + QB * (x - ramp(x)); }
    return z / all;
  }
  var zs = 0, zAt = 0, share = 0;   // the way done, following the scroll with a short delay; the film's share of it (0..1 up its frames)
  function climbMap() { return share; }

  function tick(now) {
    requestAnimationFrame(tick);
    var vh = innerHeight, rt = team.getBoundingClientRect(), rc = contact.getBoundingClientRect();
    if (rt.top > vh * 5) { if (lastA !== 0) { lastA = 0; bg.style.opacity = "0"; host.style.visibility = "hidden"; if (earth) { earth.film(null); earth.now({ show: 0, gz: 0 }); earth.set({ on: 0, cloud: 0, veil: 0 }); } } return; }
    var phone = innerWidth <= 820;
    // u: 0 with TEAM in the middle of the screen, 1 with CONTACT there (on a phone CONTACT is taller than the screen: its top counts)
    var ct = rt.top + Math.min(rt.height, vh) / 2, cc = rc.top + Math.min(rc.height, vh) / 2, span = Math.max(1, cc - ct), u = (vh / 2 - ct) / span;
    // q: 0 with WHY NOW in the middle of the screen, 1 with TEAM there
    var rw = why ? why.getBoundingClientRect() : null, yT = rt.top + rt.height / 2, yW = rw ? rw.top + rw.height / 2 : yT - vh;
    var q = (vh / 2 - yW) / Math.max(1, yT - yW);
    if (!tried && q > -0.9) { tried = true; earth = E.mount(host, { base: "assets/earth/", close: true }); }
    if (host.style.visibility !== "visible") host.style.visibility = "visible";
    var k = ssr(0.3, 0.86, u), over = phone ? ssr(0.04, 0.42, -rc.top / vh) : 0;   // on a phone CONTACT's words and form pass over the globe
    var cxF = phone ? 0.5 : 0.7 - 0.2 * k, cyF = phone ? 0.2 + 0.07 * k : 0.5, rF = phone ? 0.17 + 0.06 * k : 0.37 + 0.07 * k;   // where the globe stands at TEAM and CONTACT

    // the film's climb and its top frame, as the film would draw them in this window
    var st = window.PRISM_STORY, cl = st && st.climb, top = cl && st.ground ? st.ground(cl.top) : null, base = top ? st.ground(cl.from) : null;
    var full = !still && !!earth && !!top && !!base && top.ppk > 0 && base.ppk > top.ppk;
    var a, inEarth = false, es = earth ? earth.state() : null;
    if (full) {
      // the whole way in e-folds of scale: the film's climb, the ground out to the globe's nearest, the globe out to TEAM
      var zf = Math.log(base.ppk / top.ppk), zg = Math.max(0.1, Math.log(es.kmNear * top.ppk / vh)), ze = Math.log(es.nearR * vh / Math.min((phone ? 0.17 : 0.37) * vh, 0.6 * innerWidth));
      var zt = way(q) * (zf + zg + ze), dt = (now - zAt) / 1000; zAt = now;
      zs = !(dt < 0.25) ? zt : zs + (zt - zs) * (1 - Math.exp(-dt * 9)); if (Math.abs(zt - zs) < 1e-4) zs = zt;
      share = Math.min(1, zs / zf); cl.map = climbMap;
      earth.ground({ src: cl.src, site: top, frame: top.frame, ppk: top.ppk, rot: top.rot });
      inEarth = zs >= zf && es.ground;   // the film is on its top frame and the ground is ready to go on from it
      var wg = lin(zf, zf + zg, zs), we = lin(zf + zg, zf + zg + ze, zs), sx0 = top.x / innerWidth, sy0 = top.y / vh;
      // the site starts where the film has it (on a phone the film is cut to its middle, so the site is off to one side)
      // and drifts to the middle of the view on the way over the land; the globe moves to its place at TEAM on the last of the way
      var mid = ssr(0.05, 0.75, wg), cen = ssr(0.3, 0.97, we);
      sx0 += (0.5 - sx0) * mid; sy0 += (0.5 - sy0) * mid;
      earth.film(inEarth ? null : st.ground());   // (the ground is drawn only from the film's top frame on: before that the film is the picture)
      earth.now({ show: inEarth ? 1 : 0, gz: inEarth ? 1 - wg : 0, near: 1 - we, cx: sx0 + (cxF - sx0) * cen, cy: sy0 + (cyF - sy0) * cen });
      // the cloud's light follows the film's: sunlit at first, the last light half-way up, the moon's by the top frame
      earth.now({ tone: inEarth ? 1 : 0.5 * lin(0, 0.55, share) + 0.5 * ssr(0.55, 1, share) });
      earth.set({ on: q > 0 ? 1 : 0, veil: 0, cloud: 1 - ssr(0.3, 0.8, we) });
      a = inEarth ? 1 : 0;
    } else {
      // the plain way (reduced motion, or no film to leave from): a soft cloud comes over the view and goes, and behind it
      // the night and the earth, far off, have taken the film's place
      if (cl && cl.map) cl.map = null;
      a = earth ? ssr(0.3, 0.42, q) : ssr(0.3, 0.72, q);
      if (earth) {
        earth.film(null);
        earth.now({ gz: 0, near: 0, cx: cxF, cy: cyF });
        earth.set({ show: a, on: q > 0.1 ? 1 : 0, cloud: 0, tone: 1, veil: ssr(0.16, 0.3, q) * (1 - ssr(0.44, 0.6, q)) });
      }
    }
    if (a !== lastA) {
      lastA = a; bg.style.opacity = a.toFixed(3);
      var d = a > 0.5; if (d !== dark) { dark = d; document.body.classList.toggle("earth-dark", d); }
    }
    if (!earth) return;
    // beside the globe (not a phone): the side of the globe under CONTACT's words lies in shadow, up to where they end
    var gx = (0.7 - 0.2 * k) * innerWidth, sx = -0.4;
    if (words && !phone && es.rPx) sx = Math.max(-1, Math.min(-0.2, (words.getBoundingClientRect().right - gx) / es.rPx));
    earth.set({
      team: ssr(0.93, 1.03, q) * (1 - ssr(0.22, 0.56, u)),
      logo: ssr(0.52, 0.9, u) * (1 - over), dim: over, shade: phone ? 0 : ssr(0.42, 0.9, u), sx: sx, r: rF
    });
  }
  requestAnimationFrame(tick);
})();
