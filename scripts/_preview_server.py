#!/usr/bin/env python3
"""本地预览服务器 —— 模拟 Cloudflare Pages 的 clean URL 行为。
/foo        → static/foo.html  (200)
/foo.html   → 308 → /foo
/blog/x     → static/blog/x.html (200)
仅供本地验证用，不参与部署。用法: python scripts/_preview_server.py 8080

⚠️ 2026-09-13 改为**多线程**（原为单线程 TCPServer）：
   首页现在有 68 张图，浏览器开 6 条并发连接，单线程一次只处理一个请求，
   监听队列（默认 5）瞬间被打满 → 多余的连接直接 ERR_CONNECTION_REFUSED
   → 页面上会看到一批"裂图"。**那是本地预览工具的毛病，不是网站的问题，
   线上 Cloudflare 不受影响。** 换成 ThreadingTCPServer 后实测裂图 0。
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


class _Threaded(socketserver.ThreadingTCPServer):
    """多线程版（见文件头说明）：并发处理图片请求，避免连接被拒。"""
    allow_reuse_address = True
    daemon_threads = True
    # ⚠️ 必须调大：socketserver 默认 request_queue_size=5（listen backlog 只有 5）。
    # 首页现在有 80 张图，浏览器一波并发就能打满队列 → 即便有多线程，来不及 accept 的连接
    # 照样被拒（ERR_CONNECTION_REFUSED）。实测默认 5 时首页仍会偶发 20+ 张"裂图"。
    request_queue_size = 256


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    with _Threaded(('127.0.0.1', port), Handler) as httpd:
        print(f'preview server (clean-url, threaded) → http://127.0.0.1:{port}  root={ROOT}')
        httpd.serve_forever()
