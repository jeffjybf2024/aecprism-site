// The logo intro that used to open the home page (drawn, filled, flown through) is gone: the opening now plays the
// daytime one-take by itself (main.js, autoplay) and AEC PRISM first shows with the logo drawn on the site.
// Kept as an empty script so pages that still load it keep working; it only clears what the old intro left behind.
(function () {
  "use strict";
  var box = document.getElementById("intro");
  if (box && box.parentNode) box.parentNode.removeChild(box);
  document.documentElement.classList.remove("intro-lock");
  window.PRISM_INTRO_PENDING = false;
})();
