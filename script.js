(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });

  // Open / closed status in Engels time (Europe/Saratov)
  function updateStatus() {
    var el = document.getElementById('status');
    var long = document.getElementById('status-long');
    try {
      var parts = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Saratov', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var h = +parts.find(function (p) { return p.type === 'hour'; }).value;
      var m = +parts.find(function (p) { return p.type === 'minute'; }).value;
      var mins = h * 60 + m;
      var open = mins >= 8 * 60 && mins < 21 * 60 + 30;
      el.classList.toggle('is-open', open);
      el.querySelector('span').textContent = open ? 'Открыто до 21:30' : 'Закрыто · откроемся в 08:00';
      if (long) long.textContent = open ? 'Сейчас открыто — ждём вас' : 'Сейчас закрыто — откроемся в 08:00';
    } catch (e) { /* keep static text */ }
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // Header + parallax
  var header = document.getElementById('header');
  var layers = document.querySelectorAll('.parallax, .drift');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    if (!reduce && window.innerWidth > 960) {
      layers.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var center = r.top + r.height / 2 - window.innerHeight / 2;
        el.style.transform = 'translate3d(0,' + (center * -(parseFloat(el.dataset.speed) || 0)) + 'px,0)';
      });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // Showcase: pinned section, items swap as you scroll
  var sc = document.getElementById('showcase');
  if (sc) {
    var slides = Array.prototype.slice.call(sc.querySelectorAll('.slide'));
    var n = slides.length;
    sc.style.setProperty('--n', n);
    document.getElementById('sc-n').textContent = String(n).padStart(2, '0');
    var counter = document.getElementById('sc-i');
    var bar = document.getElementById('sc-bar');
    var lastIdx = -1;
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    function renderShowcase() {
      if (reduce) { slides.forEach(function (s) { s.style.opacity = 1; }); return; }
      var r = sc.getBoundingClientRect();
      var total = sc.offsetHeight - window.innerHeight;
      var p = clamp(-r.top / total, 0, 1);
      var pos = p * (n - 1);               // 0 … n-1
      var idx = Math.round(pos);
      slides.forEach(function (s, i) {
        var d = pos - i;                    // <0: coming, >0: leaving
        var ad = Math.abs(d);
        var o = clamp(1 - (ad - 0.12) / 0.36, 0, 1);  // hold, then quick hand-off
        s.style.opacity = o;
        s.classList.toggle('is-current', i === idx);
        s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
        var img = s.querySelector('.slide__float');
        var word = s.querySelector('.slide__word');
        var info = s.querySelector('.slide__info');
        img.style.transform = 'translate3d(0,' + (-d * 55) + 'vh,0) rotate(' + (d * 14) + 'deg) scale(' + (1 - ad * .25) + ')';
        word.style.transform = 'translate(-50%,-50%) translate3d(' + (-d * 40) + 'vw,0,0)';
        info.style.transform = 'translate3d(0,' + (-d * 18) + 'vh,0)';
      });
      if (idx !== lastIdx) {
        lastIdx = idx;
        counter.textContent = String(idx + 1).padStart(2, '0');
        sc.style.setProperty('--sc-bg', slides[idx].dataset.bg);
      }
      bar.style.width = (p * 100) + '%';
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(renderShowcase); }, { passive: true });
    window.addEventListener('resize', renderShowcase);
    renderShowcase();
  }

  // Sticky menu nav: highlight the section in view
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function setTab(key) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === key;
      t.classList.toggle('is-active', on);
      if (on) {
        t.setAttribute('aria-current', 'true');
        var nav = t.parentElement;
        nav.scrollTo({ left: t.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' });
      } else { t.removeAttribute('aria-current'); }
    });
  }
  if ('IntersectionObserver' in window) {
    var panelObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setTab(e.target.dataset.tab); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.panel').forEach(function (p) { panelObserver.observe(p); });
  }

  // Drag-to-scroll gallery (mouse)
  var g = document.querySelector('.gallery');
  if (g) {
    var down = false, startX = 0, startLeft = 0;
    g.addEventListener('mousedown', function (e) { down = true; startX = e.pageX; startLeft = g.scrollLeft; g.classList.add('is-dragging'); });
    window.addEventListener('mouseup', function () { down = false; g.classList.remove('is-dragging'); });
    g.addEventListener('mousemove', function (e) {
      if (!down) return;
      e.preventDefault();
      g.scrollLeft = startLeft - (e.pageX - startX);
    });
  }
})();
