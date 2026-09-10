#!/usr/bin/env python3
"""本地链接自检：遍历 static/ 所有页面与内部链接，报告 404 / 非 200。
用法: python scripts/_check_links.py [base_url]   (默认 http://127.0.0.1:8099)
仅供本地验证用，不参与部署。
"""
import urllib.request, urllib.error, os, re, sys

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8099'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
STATIC = os.path.join(ROOT, 'static')

pages = []
for r, d, fs in os.walk(STATIC):
    d[:] = [x for x in d if x not in ('assets', 'admin')]
    for f in fs:
        if f.endswith('.html'):
            rel = os.path.relpath(os.path.join(r, f), STATIC).replace(os.sep, '/')
            url = '/' + (rel[:-10].rstrip('/') if rel.endswith('index.html') else rel[:-5])
            pages.append(url or '/')

print('共 %d 个页面待测' % len(pages))

bad = []
links = set()
for p in pages:
    try:
        html = urllib.request.urlopen(BASE + p, timeout=10).read().decode('utf-8')
    except Exception as e:
        bad.append((p, '页面打不开', str(e)))
        continue
    for m in re.finditer(r'href="(/[^"#?]*)"', html):
        u = m.group(1)
        if u.startswith('/assets/') or u.startswith('/admin'):
            continue
        links.add(u)

print('共发现 %d 个内部链接' % len(links))
for u in sorted(links):
    try:
        r = urllib.request.urlopen(BASE + u, timeout=10)
        if r.status != 200:
            bad.append((u, 'HTTP %s' % r.status, ''))
    except urllib.error.HTTPError as e:
        bad.append((u, 'HTTP %s' % e.code, ''))
    except Exception as e:
        bad.append((u, 'ERR', str(e)))

if bad:
    print('\n[!] 有问题的链接:')
    for b in bad:
        print('   ', b)
else:
    print('\n[OK] 全部内部链接均 200，无 404')

print('\n=== sitemap 里的网址逐个验证 ===')
sm = urllib.request.urlopen(BASE + '/sitemap.xml', timeout=10).read().decode()
for loc in re.findall(r'<loc>([^<]+)</loc>', sm):
    path = loc.replace('https://www.wolflag.com', '') or '/'
    try:
        r = urllib.request.urlopen(BASE + path, timeout=10)
        print('   %s  %s' % (r.status, path))
    except urllib.error.HTTPError as e:
        print('   [X] %s  %s' % (e.code, path))

print('\n=== 资源文件抽查（css/js/图片） ===')
for a in ['/assets/css/site.css', '/assets/js/site.js', '/assets/media/logo.webp',
          '/assets/media/home-hero.webp']:
    try:
        r = urllib.request.urlopen(BASE + a, timeout=10)
        print('   %s  %s' % (r.status, a))
    except urllib.error.HTTPError as e:
        print('   [X] %s  %s' % (e.code, a))
