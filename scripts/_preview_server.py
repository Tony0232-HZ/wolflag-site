#!/usr/bin/env python3
"""本地预览服务器 —— 模拟 Cloudflare Pages 的 clean URL 行为。
/foo        → static/foo.html  (200)
/foo.html   → 308 → /foo
/blog/x     → static/blog/x.html (200)
仅供本地验证用，不参与部署。用法: python scripts/_preview_server.py 8080
"""
import http.server, socketserver, os, sys, posixpath, urllib.parse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'static')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def translate_path(self, path):
        path = urllib.parse.urlparse(path).path
        path = posixpath.normpath(urllib.parse.unquote(path))
        parts = [p for p in path.split('/') if p and p not in ('.', '..')]
        local = os.path.join(ROOT, *parts)
        # 与 Cloudflare 一致：/foo 优先取 foo.html，其次才是 foo/ 目录（避免 /blog 被当成目录列表）
        if os.path.exists(local + '.html'):
            return local + '.html'
        if os.path.isdir(local):
            idx = os.path.join(local, 'index.html')
            if os.path.exists(idx):
                return idx
        return local

    def do_GET(self):
        p = urllib.parse.urlparse(self.path).path
        # 模拟 Cloudflare：带 .html 的一律 308 到无后缀
        if p.endswith('.html') and p != '/index.html':
            tgt = p[:-5]
            self.send_response(308)
            self.send_header('Location', tgt)
            self.end_headers()
            return
        if p == '/index.html':
            self.send_response(308)
            self.send_header('Location', '/')
            self.end_headers()
            return
        # 模拟 Cloudflare Pages：找不到的路径用 404.html 应答，并返回 HTTP 404
        local = self.translate_path(p)
        if not os.path.exists(local):
            body = open(os.path.join(ROOT, '404.html'), 'rb').read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', port), Handler) as httpd:
        print(f'preview server (clean-url) → http://127.0.0.1:{port}  root={ROOT}')
        httpd.serve_forever()
