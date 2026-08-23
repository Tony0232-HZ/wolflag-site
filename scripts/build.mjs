#!/usr/bin/env node
/**
 * WOLFLAG static site builder — zero dependencies, Node >= 18.
 * Reads content/*.json → renders static/*.html, copies media/ and admin/.
 *
 * Usage: node scripts/build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const MEDIA = join(ROOT, 'media');
const ADMIN = join(ROOT, 'admin');
const STATIC = join(ROOT, 'static');
const TMPL = join(ROOT, 'templates');

const j = (p) => JSON.parse(readFileSync(p, 'utf8'));

const settings = j(join(CONTENT, 'settings.json'));
const home = j(join(CONTENT, 'home.json'));
const about = j(join(CONTENT, 'about.json'));
const pageFiles = {};
for (const f of readdirSync(join(CONTENT, 'products'))) {
  if (f.endsWith('.json')) pageFiles[f.replace(/\.json$/, '')] = j(join(CONTENT, 'products', f));
}

const SITE = 'https://wolflag.pages.dev'; // TODO: replace with real domain when attached

/* ---------------- page registry ---------------- */
const PAGES = [
  { file: 'index.html',      slug: '/',                 title: home.seo.title,           desc: home.seo.description,        nav: '/' },
  { file: 'feather-flag.html',  slug: '/feather-flag.html',  title: pageFiles['feather-flags'].seo.title,  desc: pageFiles['feather-flags'].seo.description,  nav: '/feather-flag.html' },
  { file: 'banner.html', slug: '/banner.html',    title: pageFiles.banners.seo.title,        desc: pageFiles.banners.seo.description,        nav: '/banner.html' },
  { file: 'national-flag.html', slug: '/national-flag.html', title: pageFiles['national-flags'].seo.title, desc: pageFiles['national-flags'].seo.description, nav: '/national-flag.html' },
  { file: 'pole-display.html',  slug: '/pole-display.html',  title: pageFiles['pole-display'].seo.title,  desc: pageFiles['pole-display'].seo.description,  nav: '/pole-display.html' },
  { file: 'about-us.html',      slug: '/about-us.html',      title: about.seo.title,            desc: about.seo.description,            nav: '/about-us.html' },
];

/* ---------------- helpers ---------------- */
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function header(active) {
  const menu = settings.nav.map((item) => {
    const cls = item.url === active ? 'active' : item.external ? 'more' : '';
    const ext = item.external ? ' target="_blank" rel="noopener"' : '';
    return `<a class="${cls}" href="${esc(item.url)}"${ext}>${esc(item.label)}</a>`;
  }).join('\n      ');
  return `<header class="site-header">
  <nav class="navbar">
    <a class="nav-logo" href="/" aria-label="WOLFLAG home">
      <img src="${settings.logo}" alt="WOLFLAG logo" width="36" height="36">
    </a>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">&#9776;</button>
    <ul class="nav-menu">
      ${menu}
    </ul>
    <a class="nav-cta" href="${esc(settings.contactButton.url)}">${esc(settings.contactButton.text)}</a>
  </nav>
</header>`;
}

function footer() {
  const cols = settings.footer.sections.map((s) =>
    `    <div class="footer-col">
      <h4>${esc(s.heading)}</h4>
      ${s.lines.map((l) => `<p>${esc(l)}</p>`).join('\n      ')}
    </div>`).join('\n');
  const mails = (settings.footer.emails || [settings.footer.email]).map((e) =>
    `<p><a href="mailto:${e}" style="color:inherit">${esc(e)}</a></p>`).join('\n');
  const phoneRows = settings.footer.phones.slice(1).map((p) =>
    `<p><a href="tel:${p.replace(/[^+\d]/g, '')}" style="color:inherit">${esc(p)}</a></p>`).join('\n');
  const socialIcons = settings.footer.icons.map((i) => `<a href="mailto:${settings.footer.email}" aria-label="Contact us"><img src="${i}" alt=""></a>`).join('\n');
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="f-brand"><img src="${settings.footer.logo}" alt="wolflag"></div>
        <div class="footer-social">${socialIcons}</div>
      </div>
      ${cols}
      <div class="footer-col">
        <p class="f-phone-main">${esc(settings.footer.phones[0] || '')}</p>
        ${phoneRows}
        ${mails}
      </div>
    </div>
    <div class="footer-bottom">${esc(settings.footer.copyright)}</div>
  </div>
</footer>`;
}

function minimalFooter() {
  return `<footer class="site-footer site-footer-minimal">
  <div class="container">
    <div class="footer-bottom">${esc(settings.footer.copyright)}</div>
  </div>
</footer>`;
}

function shell({ title, desc, body, active, ogImage, footerMode }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE}/">
  ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
  <link rel="icon" type="image/png" href="/assets/media/favicon.webp">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Catamaran:wght@400;700&family=Antic+Slab&family=Bona+Nova:wght@400;700&family=Rufina&family=Acme&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>
${header(active)}
<main>
${body}
</main>
${footerMode === 'minimal' ? minimalFooter() : footer()}
<script src="/assets/js/site.js"></script>
</body>
</html>`;
}

/* ---------------- page bodies ---------------- */

function homeBody() {
  const pills = home.hero.features.map((f, i) =>
    `<span class="tag-pill ${i === 0 ? 'fill' : 'line'}">${esc(f)}</span>`).join('');
  const imgs = home.intro.images;
  const photos = `
      <img src="${imgs[0]}" alt="WOLFLAG printing workshop" loading="lazy" decoding="async" width="1005" height="757">
      <div class="mid">
        <div class="tag-pills">${pills}</div>
        <img src="${imgs[1]}" alt="Flags printing line" loading="lazy" decoding="async" width="1110" height="758">
      </div>
      <img src="${imgs[2]}" alt="Banner production machine" loading="lazy" decoding="async" width="960" height="540">`;
  const cards = home.categories.items.map((c, i) =>
    `<a class="cat-card ${i % 2 === 1 ? 'flip' : ''}" href="${esc(c.link)}">
       <span class="cat-img"><img src="${c.image}" alt="${esc(c.title)}" loading="lazy" decoding="async" width="700" height="700"></span>
       <span class="cat-info">
         <span class="cat-title">${esc(c.title)}</span>
         <span class="cat-desc">${esc(c.text)}</span>
       </span>
     </a>`).join('\n');
  return `
  <section class="home-hero">
    <div class="container hero-row">
      <h1>${esc(home.hero.title)}</h1>
      <p class="hero-text">${esc(home.hero.text)}</p>
    </div>
    <div class="container hero-image">
      <img src="${home.hero.image}" alt="Flags of the world at WOLFLAG flags showroom" width="1259" height="562">
    </div>
  </section>

  <section class="section section-center">
    <div class="container">
      <h2 class="section-title">${esc(home.intro.title)}</h2>
      <p class="section-sub">${esc(home.intro.text)}</p>
      <div class="intro-photos">${photos}</div>
    </div>
  </section>

  <section class="main-products">
    <div class="container">
      <h2 class="eyebrow">${esc(home.categories.title)}</h2>
      <p class="intro">${esc(home.categories.intro)}</p>
      <div class="cat-grid">${cards}</div>
    </div>
  </section>`;
}

function nfBody(data) {
  const cards = data.products.map((p) => `
    <article class="product-card">
      <span class="p-img"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="332" height="332"></span>
      <div class="p-body">
        <h2 class="p-name">${esc(p.name)}</h2>
        <p class="p-size">${esc(p.size)}</p>
        <p class="p-material">${esc(p.material)}</p>
        <span class="p-chip">${esc(p.printing)}</span>
      </div>
    </article>`).join('');
  return `
  <section class="page-hero">
    <div class="container"><h1>${esc(data.tagline)}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-3">${cards}</div>
    </div>
  </section>`;
}

function featherBody(data) {
  const cards = data.products.map((p) => `
    <article class="f-card">
      <span class="f-img"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="280" height="320"></span>
      <div class="f-body">
        ${p.size ? `<p class="f-name-lite">${esc(p.size)}</p>` : ''}
        <h2 class="f-title">${esc(p.name)}</h2>
        <p class="f-desc">${esc(p.material)}<br>${esc(p.desc)}</p>
        <p class="f-cta">${esc(data.cta)}</p>
      </div>
    </article>`).join('');
  return `
  <section class="section" style="padding-bottom:0">
    <div class="container"><h1 class="page-badge">${esc(data.badge)}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-2">${cards}</div>
    </div>
  </section>`;
}

function bannerBody(data) {
  const cards = data.products.map((p) => `
    <article class="product-card">
      <span class="p-img"><img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="332" height="332"></span>
      <div class="p-body">
        <h2 class="p-name">${esc(p.name)}</h2>
        <p class="p-desc">${esc(p.desc)}</p>
        <p class="p-material">${esc(p.material)}</p>
        <p class="p-desc">${esc(p.detail)}</p>
      </div>
    </article>`).join('');
  return `
  <section class="page-hero">
    <div class="container"><h1>${esc(data.tagline)}</h1></div>
  </section>
  <section class="section">
    <div class="container">
      <div class="product-grid-3">${cards}</div>
    </div>
  </section>`;
}

function poleBody(data) {
  const feat = data.featured.map((p) => `
    <article class="feat-card">
      <div class="feat-text">
        <h2>${esc(p.name)}</h2>
        <p class="feat-desc">${esc(p.desc)}</p>
        ${p.detail ? `<p class="feat-desc">${esc(p.detail)}</p>` : ''}
        <p class="feat-tag">${esc(p.tag)}</p>
      </div>
      <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="553" height="368">
    </article>`).join('');
  const ing = data.ingredients.items.map((p) => `
    <article class="ing-card">
      <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="318" height="318">
      <h4>${esc(p.name)}</h4>
      <p>${esc(p.desc)}</p>
    </article>`).join('');
  return `
  <section class="page-hero pole-hero">
    <div class="container">
      <h1>${esc(data.subheading)}</h1>
      <p class="pole-subtext">${esc(data.subtext)}</p>
    </div>
  </section>
  <section class="section pole-featured">
    <div class="container">
      <div class="featured-2">${feat}</div>
    </div>
  </section>
  <section class="ingredients">
    <div class="container">
      <h3>${esc(data.ingredients.title)}</h3>
      <p class="ing-sub">${esc(data.ingredients.subtitle)}</p>
      <div class="ing-grid">${ing}</div>
    </div>
  </section>`;
}

function aboutBody(data) {
  const paras = data.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ');
  const faqItems = data.faq.map((f, i) => `
    <div class="faq-item ${i === 0 ? 'open' : ''}">
      <button class="faq-q" aria-expanded="${i === 0}">
        <span>${esc(f.q)}</span>
        <span class="chev" aria-hidden="true">&#9660;</span>
      </button>
      <div class="faq-a"><p>${esc(f.a)}</p></div>
    </div>`).join('');
  return `
  <div class="about-hero">
    <img src="${data.hero.image}" alt="WOLFLAG factory workshop" width="1500" height="575">
  </div>
  <section class="about-grey">
  <div class="about-marquee" aria-hidden="true">
    <div class="track">
      ${`<span>${esc(data.hero.title)}</span>`.repeat(8)}
    </div>
  </div>
  <div class="container about-body">
    <div class="about-copy">
      ${paras}
    </div>
    <div class="about-img"><img src="${data.factoryImage}" alt="WOLFLAG factory building" loading="lazy" decoding="async" width="1259" height="944"></div>
  </div>
  </section>
  <section class="clients">
    <div class="container">
      <div>
        <p class="cl-label">${esc(data.clients.title)}</p>
        <h2>${esc(data.clients.tagline)}</h2>
        <p class="cl-sub">${esc(data.clients.subtitle)}</p>
      </div>
      <div class="cl-logos">
        ${data.clients.logos.map((l) => `<img src="${l}" alt="Client logo" loading="lazy" decoding="async" width="128" height="86">`).join('\n        ')}
      </div>
    </div>
  </section>
  <section class="faq-section">
    <div class="container">
      <h2>FAQ</h2>
      ${faqItems}
    </div>
  </section>`;
}

/* ---------------- render ---------------- */

const bodies = new Map([
  ['index.html', homeBody()],
  ['feather-flag.html', featherBody(pageFiles['feather-flags'])],
  ['banner.html', bannerBody(pageFiles.banners)],
  ['national-flag.html', nfBody(pageFiles['national-flags'])],
  ['pole-display.html', poleBody(pageFiles['pole-display'])],
  ['about-us.html', aboutBody(about)],
]);

/* wipe old html */
for (const f of readdirSync(STATIC)) {
  if (f.endsWith('.html') || f === 'assets' || f === 'admin' || f === 'sitemap.xml' || f === 'robots.txt') {
    rmSync(join(STATIC, f), { recursive: true, force: true });
  }
}

for (const p of PAGES) {
  const title = p.title || 'WOLFLAG — Professional manufacturer of flags, banners, and poles';
  const html = shell({
    title,
    desc: p.desc,
    body: bodies.get(p.file),
    active: p.nav,
    ogImage: home.hero.image,
    footerMode: p.file === 'index.html' || p.file === 'about-us.html' ? 'full' : 'minimal',
  });
  writeFileSync(join(STATIC, p.file), html);
  console.log('built', p.file);
}

/* static assets (css/js sources) */
const SRC = join(ROOT, 'src');
if (existsSync(SRC)) cpSync(SRC, STATIC, { recursive: true });

/* media */
if (existsSync(MEDIA)) cpSync(MEDIA, join(STATIC, 'assets', 'media'), { recursive: true });

/* admin (Decap CMS) */
if (existsSync(ADMIN)) cpSync(ADMIN, join(STATIC, 'admin'), { recursive: true });

/* sitemap */
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${SITE}${p.slug}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
writeFileSync(join(STATIC, 'sitemap.xml'), sitemap);

/* robots */
writeFileSync(join(STATIC, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

console.log('build complete →', STATIC);
