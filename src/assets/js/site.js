/* WOLFLAG site: mobile nav + FAQ accordion */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    if (q) {
      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        // close others for a tidy accordion
        document.querySelectorAll('.faq-item.open').forEach(function (o) { o.classList.remove('open'); });
        if (!isOpen) item.classList.add('open');
      });
    }
  });

  // image graceful fallback
  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () {
      if (!img.dataset.fb) {
        img.dataset.fb = '1';
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#e8e8ea"/><text x="50%" y="50%" fill="#9aa0a6" font-family="Arial" font-size="18" text-anchor="middle">Coming soon</text></svg>');
      }
    });
  });

  // product detail gallery: click thumbnail to swap main image
  document.querySelectorAll('.pd-gallery').forEach(function (g) {
    var main = g.querySelector('.pd-main img');
    g.querySelectorAll('.pd-thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        main.src = t.getAttribute('data-src');
        g.querySelectorAll('.pd-thumb.on').forEach(function (o) { o.classList.remove('on'); });
        t.classList.add('on');
      });
    });
  });

  // blog article sidebar: All Posts 分页（20 条/页）
  (function () {
    var box = document.getElementById('all-posts');
    var pager = document.getElementById('all-pager');
    var dataEl = document.getElementById('blog-index');
    if (!box || !pager || !dataEl) return;
    var posts = JSON.parse(dataEl.textContent);
    var PER = 20;
    var cur = 1;
    var pages = Math.max(1, Math.ceil(posts.length / PER));

    function esc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function item(p) {
      return '<div class="recent-item">' +
        '<img src="' + esc(p.i || '/assets/media/home-hero.webp') + '" alt="" loading="lazy">' +
        '<div class="rt"><a href="/blog/' + esc(p.s) + '.html">' + esc(p.t) + '</a>' +
        (p.p ? '<span class="blog-flag">PINNED</span> ' : '') +
        '<div class="rd">' + esc(p.d) + '</div></div></div>';
    }
    function render() {
      box.innerHTML = posts.slice((cur - 1) * PER, cur * PER).map(item).join('');
      var h = '';
      if (pages > 1) {
        h += cur > 1 ? '<a href="#" data-p="' + (cur - 1) + '" aria-label="Previous">&larr;</a>' : '';
        for (var i = 1; i <= pages; i++) {
          h += i === cur ? '<span class="active">' + i + '</span>' : '<a href="#" data-p="' + i + '">' + i + '</a>';
        }
        h += cur < pages ? '<a href="#" data-p="' + (cur + 1) + '" aria-label="Next">&rarr;</a>' : '';
      }
      pager.innerHTML = h;
    }
    pager.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-p]');
      if (a) { e.preventDefault(); cur = parseInt(a.getAttribute('data-p'), 10) || 1; render(); }
    });
    render();
  })();
})();
