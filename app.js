// Mobile menu.
(function () {
  var btn = document.querySelector(".menu-btn");
  var menu = document.getElementById("menu");
  if (!btn || !menu) return;
  btn.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  menu.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  });
})();

// Iron Lock ladder — mirrors LockStreakManager.TIERS, startFeeRupees and breakFeeRupees.
(function () {
  var ladder = document.getElementById("ladder");
  if (!ladder) return;
  var TIERS = [1, 3, 7, 15, 30, 90, 180, 365, 730, 1825];
  var NAMES = { 1: "1 day", 3: "3 days", 7: "1 week", 15: "15 days", 30: "1 month", 90: "3 months", 180: "6 months", 365: "1 year", 730: "2 years", 1825: "5 years" };

  function breakFee(d) {
    if (d <= 1) return 10;
    if (d <= 3) return 20;
    if (d <= 7) return 30;
    if (d <= 15) return 40;
    if (d <= 30) return 50;
    return 100;
  }
  function rupees(n) { return "₹" + n.toLocaleString("en-IN"); }

  var maxLog = Math.log(1825 + 1);
  var buttons = [];

  TIERS.forEach(function (d, i) {
    var li = document.createElement("li");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "rung";
    b.setAttribute("aria-pressed", "false");
    var w = Math.max(6, Math.round((Math.log(d + 1) / maxLog) * 100));
    b.innerHTML = '<span>' + NAMES[d] + '</span><span class="len" aria-hidden="true"><i style="width:' + w + '%"></i></span><span class="fee">' + rupees(d) + '</span>';
    b.addEventListener("click", function () { select(i); });
    li.appendChild(b);
    ladder.appendChild(li);
    buttons.push(b);
  });

  function select(i) {
    var d = TIERS[i];
    buttons.forEach(function (b, j) { b.setAttribute("aria-pressed", j === i ? "true" : "false"); });
    document.getElementById("b-tier").textContent = NAMES[d];
    document.getElementById("b-start").textContent = rupees(d);
    document.getElementById("b-break").textContent = rupees(breakFee(d));
    document.getElementById("b-note").textContent = i === 0
      ? "Everyone starts here. Finish it to unlock 3 days."
      : "Unlocks after you finish the " + NAMES[TIERS[i - 1]] + " lock.";
  }
  select(2);
})();

// Live countdown on the phone mockup.
(function () {
  var el = document.getElementById("count");
  if (!el) return;
  var end = Date.now() + ((6 * 24 + 14) * 60 + 22) * 60000 + 8000;
  var parts = { d: 86400, h: 3600, m: 60, s: 1 };
  var mod = { d: 1e9, h: 24, m: 60, s: 60 };
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tick() {
    var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
    el.querySelectorAll("[data-u]").forEach(function (node) {
      var u = node.getAttribute("data-u");
      node.firstChild.nodeValue = pad(Math.floor(left / parts[u]) % mod[u]);
    });
  }
  tick();
  setInterval(tick, 1000);
})();

// Scroll reveal for big titles and cards.
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  els.forEach(function (el) { io.observe(el); });
})();

// Navbar shadow once the page scrolls.
(function () {
  var nav = document.querySelector(".nav");
  if (!nav) return;
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 4); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// Night sky: twinkling stars with mouse parallax, constellation lines near the cursor,
// and a shooting star every few seconds. Draws once (static) for reduced motion.
(function () {
  var canvas = document.querySelector(".stars");
  if (!canvas) return;
  var sky = canvas.parentElement;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, stars = [], shoot = null, nextShoot = 0;
  var mouse = { x: -9999, y: -9999, px: 0, py: 0 }, ease = { x: 0, y: 0 };
  var running = true;
  var COLORS = ["255,255,255", "255,255,255", "255,255,255", "255,215,0", "46,230,116"];

  function resize() {
    var r = sky.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round((W * H) / 2600);
    stars = [];
    for (var i = 0; i < n; i++) {
      var z = Math.random();
      stars.push({ x: Math.random() * W, y: Math.random() * H, z: z, r: 0.3 + z * 1.4,
        c: COLORS[(Math.random() * COLORS.length) | 0], a: 0.35 + Math.random() * 0.65,
        p: Math.random() * Math.PI * 2, s: 0.6 + Math.random() * 2 });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ease.x += (mouse.px - ease.x) * 0.05;
    ease.y += (mouse.py - ease.y) * 0.05;
    var near = [];
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var x = s.x + ease.x * s.z * 26, y = s.y + ease.y * s.z * 26;
      var tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t / 1000 * s.s + s.p);
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = "rgb(" + s.c + ")";
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.2832); ctx.fill();
      if (s.r > 1.2) {
        ctx.globalAlpha = s.a * tw * 0.25;
        ctx.beginPath(); ctx.arc(x, y, s.r * 3, 0, 6.2832); ctx.fill();
      }
      var dx = x - mouse.x, dy = y - mouse.y;
      if (dx * dx + dy * dy < 150 * 150 && s.z > 0.4) near.push([x, y]);
    }
    // constellation lines around the cursor
    ctx.lineWidth = 0.8;
    for (var a = 0; a < near.length; a++) {
      for (var b = a + 1; b < near.length; b++) {
        var ddx = near[a][0] - near[b][0], ddy = near[a][1] - near[b][1];
        var d2 = ddx * ddx + ddy * ddy;
        if (d2 < 90 * 90) {
          ctx.globalAlpha = 0.35 * (1 - Math.sqrt(d2) / 90);
          ctx.strokeStyle = "rgb(46,230,116)";
          ctx.beginPath(); ctx.moveTo(near[a][0], near[a][1]); ctx.lineTo(near[b][0], near[b][1]); ctx.stroke();
        }
      }
    }
    // shooting star
    if (!reduce) {
      if (!shoot && t > nextShoot) {
        shoot = { x: Math.random() * W * 0.7 + W * 0.1, y: Math.random() * H * 0.35, vx: 9 + Math.random() * 5, vy: 3.5 + Math.random() * 2, life: 0 };
      }
      if (shoot) {
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life++;
        var tail = 16;
        var g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * tail, shoot.y - shoot.vy * tail);
        g.addColorStop(0, "rgba(255,251,230,1)"); g.addColorStop(0.3, "rgba(255,215,0,.6)"); g.addColorStop(1, "rgba(46,230,116,0)");
        ctx.globalAlpha = Math.max(0, 1 - shoot.life / 70);
        ctx.strokeStyle = g; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * tail, shoot.y - shoot.vy * tail); ctx.stroke();
        if (shoot.life > 70 || shoot.x > W + 200 || shoot.y > H + 200) { shoot = null; nextShoot = t + 2500 + Math.random() * 4000; }
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    if (running) draw(t);
    if (!reduce) requestAnimationFrame(loop);
  }

  sky.addEventListener("pointermove", function (e) {
    var r = sky.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    mouse.px = (mouse.x / W - 0.5) * 2; mouse.py = (mouse.y / H - 0.5) * 2;
    sky.style.setProperty("--mx", mouse.x + "px");
    sky.style.setProperty("--my", mouse.y + "px");
    var tilt = document.getElementById("tilt");
    if (tilt) {
      var img = tilt.firstElementChild;
      img.style.setProperty("--ry", (mouse.px * 10).toFixed(2) + "deg");
      img.style.setProperty("--rx", (-mouse.py * 8).toFixed(2) + "deg");
    }
  });
  sky.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; mouse.px = mouse.py = 0; });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { running = en[0].isIntersecting; }).observe(sky);
  }
  window.addEventListener("resize", resize);
  resize();
  if (reduce) draw(0); else requestAnimationFrame(loop);
})();

// Footer wordmark lights up where the cursor is.
(function () {
  var mark = document.querySelector(".foot-mark");
  if (!mark) return;
  mark.parentElement.addEventListener("pointermove", function (e) {
    var r = mark.getBoundingClientRect();
    mark.style.setProperty("--fx", (e.clientX - r.left) + "px");
    mark.style.setProperty("--fy", (e.clientY - r.top) + "px");
  });
})();

// Back to top.
(function () {
  var b = document.querySelector(".to-top");
  if (!b) return;
  b.addEventListener("click", function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); });
})();

// Bright hero: a dot field with a slow travelling wave; dots near the cursor
// swell and turn green-to-gold. Static single frame for reduced motion.
(function () {
  var canvas = document.querySelector(".dots");
  if (!canvas) return;
  var box = canvas.parentElement;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, GAP = 26, running = true;
  var m = { x: -9999, y: -9999 }, e = { x: -9999, y: -9999 };

  function resize() {
    var r = box.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    if (m.x < -1000) { e.x = m.x; e.y = m.y; } else { e.x += (m.x - e.x) * 0.15; e.y += (m.y - e.y) * 0.15; }
    var R = 170, time = t / 1000;
    for (var y = GAP / 2; y < H; y += GAP) {
      for (var x = GAP / 2; x < W; x += GAP) {
        var wave = Math.sin(x * 0.012 + y * 0.008 - time * 1.4) * 0.5 + 0.5; // 0..1
        var dx = x - e.x, dy = y - e.y, d = Math.sqrt(dx * dx + dy * dy);
        var near = d < R ? 1 - d / R : 0;
        var r = 1 + wave * 0.9 + near * 3.2;
        var a = (dark ? 0.16 : 0.13) + wave * 0.12 + near * 0.7;
        var ox = near ? (dx / (d || 1)) * near * 8 : 0, oy = near ? (dy / (d || 1)) * near * 8 : 0;
        if (near > 0) {
          // green near the centre, gold at the edge of the cursor's reach
          var g = Math.round(162 + (215 - 162) * (1 - near)), rr = Math.round(19 + (255 - 19) * (1 - near)), b = Math.round(75 * near);
          ctx.fillStyle = "rgba(" + rr + "," + g + "," + b + "," + a + ")";
        } else {
          ctx.fillStyle = dark ? "rgba(200,230,210," + a + ")" : "rgba(15,40,25," + a + ")";
        }
        ctx.beginPath(); ctx.arc(x + ox, y + oy, r, 0, 6.2832); ctx.fill();
      }
    }
  }

  function loop(t) { if (running) draw(t); requestAnimationFrame(loop); }

  box.addEventListener("pointermove", function (ev) {
    var r = box.getBoundingClientRect();
    m.x = ev.clientX - r.left; m.y = ev.clientY - r.top;
    if (e.x < -1000) { e.x = m.x; e.y = m.y; }
  });
  box.addEventListener("pointerleave", function () { m.x = m.y = -9999; });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { running = en[0].isIntersecting; }).observe(box);
  window.addEventListener("resize", resize);
  resize();
  if (reduce) draw(0); else requestAnimationFrame(loop);
})();

// Footer: motivational quotes that fade from one to the next every 5 seconds.
(function () {
  var box = document.querySelector("[data-quotes]");
  if (!box) return;
  var QUOTES = [
    ["You have power over your mind, not outside events. Realize this, and you will find strength.", "Marcus Aurelius"],
    ["Self-control is strength. Right thought is mastery. Calmness is power.", "James Allen"],
    ["Small disciplines repeated with consistency every day lead to great achievements.", "John C. Maxwell"],
    ["The pain of discipline weighs ounces; the pain of regret weighs tons.", "Jim Rohn"],
    ["The successful warrior is the average man, with laser-like focus.", "Bruce Lee"],
    ["We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Will Durant"]
  ];
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var text = box.querySelector(".q-text"), by = box.querySelector(".q-by");
  var i = 0, timer;
  function next() {
    i = (i + 1) % QUOTES.length;
    box.classList.add("out");
    setTimeout(function () { text.textContent = QUOTES[i][0]; by.textContent = QUOTES[i][1]; box.classList.remove("out"); }, 400);
    timer = setTimeout(next, 5000);
  }
  timer = setTimeout(next, 5000);
  box.addEventListener("mouseenter", function () { clearTimeout(timer); });
  box.addEventListener("mouseleave", function () { clearTimeout(timer); timer = setTimeout(next, 2500); });
})();

// Navbar: highlight the link of the section currently on screen (EviLock page).
(function () {
  var links = document.querySelectorAll(".nav-links a[data-spy]");
  if (!links.length || !("IntersectionObserver" in window)) return;
  var map = {};
  links.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s) map[s.id] = a; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.removeAttribute("aria-current"); });
      map[e.target.id].setAttribute("aria-current", "true");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
})();

// Count-up numbers in the stats strip when they come into view.
(function () {
  var els = document.querySelectorAll("[data-count]");
  if (!els.length || !("IntersectionObserver" in window)) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var el = e.target, end = +el.getAttribute("data-count");
      if (reduce || end === 0) { el.textContent = end; return; }
      var t0 = null;
      (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
    });
  }, { threshold: .5 });
  els.forEach(function (el) { io.observe(el); });
})();

// Live download / install counter.
// A click on any EviLock download link adds one download, but only the first time from this
// browser: a hidden flag in localStorage remembers it. Only a total goes to the server.
// The home page shows downloads and installs and refreshes every 15 seconds.
(function () {
  var API = "/api/downloads", FLAG = "evilock_dl_counted";
  if (location.protocol === "file:") return; // needs the live site (Vercel functions)

  function counted() { try { return localStorage.getItem(FLAG) === "1"; } catch (e) { return false; } }
  function markCounted() { try { localStorage.setItem(FLAG, "1"); } catch (e) {} }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href$="EviLock.apk"]');
    if (!a || counted()) return;
    markCounted();
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(API);
      else fetch(API, { method: "POST", keepalive: true });
    } catch (err) {}
    setTimeout(refresh, 1500);
  });

  var boxes = [].slice.call(document.querySelectorAll(".dl-counter")), shown = { downloads: 0, installs: 0 };
  function animate(kind, n) {
    var els = [].slice.call(document.querySelectorAll(kind === "downloads" ? ".js-dl" : ".js-in"));
    var from = shown[kind], t0 = null; shown[kind] = n;
    if (!els.length) return;
    if (from === n) { els.forEach(function (el) { el.textContent = n.toLocaleString("en-IN"); }); return; }
    (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 900), v = Math.round(from + (n - from) * (1 - Math.pow(1 - p, 3))).toLocaleString("en-IN"); els.forEach(function (el) { el.textContent = v; }); if (p < 1) requestAnimationFrame(step); })(performance.now());
    if (from && n > from) boxes.forEach(function (b) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); });
  }
  function refresh() {
    if (!boxes.length) return;
    fetch(API, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || typeof d.downloads !== "number") return;
      boxes.forEach(function (b) { b.hidden = false; });
      animate("downloads", d.downloads); animate("installs", d.installs);
    }).catch(function () {});
  }
  if (boxes.length) { refresh(); setInterval(function () { if (!document.hidden) refresh(); }, 15000); }
})();

// Home hero: rotating motivational quotes (bottom-left over the video).
(function () {
  var box = document.querySelector("[data-hero-quotes]");
  if (!box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var QUOTES = [
    ["Technology is a useful servant but a dangerous master.", "Christian Lous Lange"],
    ["Almost everything will work again if you unplug it for a few minutes, including you.", "Anne Lamott"],
    ["Lost time is never found again.", "Benjamin Franklin"],
    ["You will never find time for anything. If you want time, you must make it.", "Charles Buxton"],
    ["The key is not to prioritize what's on your schedule, but to schedule your priorities.", "Stephen Covey"],
    ["Where focus goes, energy flows.", "Tony Robbins"],
    ["Discipline is the bridge between goals and accomplishment.", "Jim Rohn"]
  ];
  var text = box.querySelector(".hq-text"), by = box.querySelector(".hq-by"), i = 0;
  setInterval(function () {
    if (document.hidden) return;
    i = (i + 1) % QUOTES.length;
    box.classList.add("out");
    setTimeout(function () { text.textContent = QUOTES[i][0]; by.textContent = QUOTES[i][1]; box.classList.remove("out"); }, 500);
  }, 6000);
})();
