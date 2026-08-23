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
})();
