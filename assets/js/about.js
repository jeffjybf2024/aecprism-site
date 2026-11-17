// About page: the 30-year film plays behind the opening headline (and in full in a lightbox),
// the sections below sit on the same live 2.5D background as the home page,
// and the three portraits lean toward the pointer.
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---------- film: background loop, full version with sound on demand ----------
  var bgv = document.getElementById("journey"), lb = document.getElementById("lightbox"), lbv = document.getElementById("lbVideo");
  if (bgv && reduce) { bgv.removeAttribute("autoplay"); bgv.pause(); }
  var openLb = function () { lb.hidden = false; document.body.classList.add("lb-open"); if (bgv) bgv.pause(); lbv.currentTime = 0; lbv.play().catch(function () {}); };
  var closeLb = function () { lbv.pause(); lb.hidden = true; document.body.classList.remove("lb-open"); if (bgv && !reduce) bgv.play().catch(function () {}); };
  var w = document.getElementById("watch");
  if (w && lb) {
    w.addEventListener("click", openLb);
    document.getElementById("lbClose").addEventListener("click", closeLb);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) closeLb(); });
  }

  // ---------- live background: one camera station per section ----------
  var secs = [].slice.call(document.querySelectorAll("section[data-s]"));
  var glc = document.getElementById("gl");
  var mx = 0, my = 0, smx = 0, smy = 0, tlx = 0.5, tly = 0.5, lx = 0.5, ly = 0.5, la = 0, lastMove = -1e9;
  window.addEventListener("pointermove", function (e) {
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
    tlx = e.clientX / innerWidth; tly = e.clientY / innerHeight; lastMove = performance.now();
  }, { passive: true });
  if (glc && window.PrismGL && !reduce && secs.length) {
    var frames = secs.map(function (s) { var m = /url\(["']?([^"')]+)/.exec(s.querySelector(".imm-bg").style.backgroundImage); return { f: m[1].replace(/^.*\//, "").replace(/\.jpg$/, "") }; });
    var anchors = [];
    var build = function () {
      anchors = secs.map(function (s) { var r = s.getBoundingClientRect(); return [r.top + scrollY + r.height / 2 - innerHeight / 2, +s.dataset.s]; });
    };
    var station = function () {
      var y = scrollY;
      if (!anchors.length) build();
      if (y <= anchors[0][0]) return 0;
      for (var k = 1; k < anchors.length; k++) if (y <= anchors[k][0]) return anchors[k - 1][1] + (y - anchors[k - 1][0]) / (anchors[k][0] - anchors[k - 1][0]);
      return anchors[anchors.length - 1][1];
    };
    window.addEventListener("resize", build); window.addEventListener("load", build); setTimeout(build, 1200);
    var smooth = 0, glOn = false;
    PrismGL.init(glc, frames, function () { glOn = true; document.body.classList.add("gl-on"); });
    (function loop() {
      requestAnimationFrame(loop);
      if (!glOn) return;
      var tgt = station(); smooth += (tgt - smooth) * 0.1;
      smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
      lx += (tlx - lx) * 0.12; ly += (tly - ly) * 0.12;
      la += ((fine && performance.now() - lastMove < 1800 ? 1 : 0) - la) * 0.06;
      PrismGL.render(smooth, smx, smy, performance.now() / 1000, { lens: [lx, ly, la * 0.85] });
    })();
  }

  // ---------- portraits lean toward the pointer, the glow follows ----------
  if (fine && !reduce) {
    [].forEach.call(document.querySelectorAll(".mate"), function (m) {
      var fig = m.querySelector(".fig");
      m.addEventListener("pointermove", function (e) {
        var r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        fig.style.transform = "perspective(900px) rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 6).toFixed(2) + "deg) translateY(-10px)";
        fig.style.setProperty("--gx", (50 + x * 40).toFixed(1) + "%"); fig.style.setProperty("--gy", (60 + y * 30).toFixed(1) + "%");
      });
      m.addEventListener("pointerleave", function () { fig.style.transform = ""; fig.style.removeProperty("--gx"); fig.style.removeProperty("--gy"); });
    });
  }
})();
