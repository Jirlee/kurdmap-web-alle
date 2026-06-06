#!/usr/bin/env python3
"""SPA-aware static server for the KurdMap admin panel.

Serves the compiled Angular build with an index.html fallback for client-side
routes. Used in BOTH development and production — in production it runs inside
the admin container behind the host Caddy reverse proxy (mirroring how the SSR
frontend is served).

Security: the admin panel must never appear in search engines. Every response
carries an `X-Robots-Tag: noindex` header and `/robots.txt` disallows all
crawling, so the panel is reachable only by someone who already knows its URL.
"""
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = "/dist"
PORT = int(os.environ.get("PORT", "8080"))

ROBOTS_TXT = b"User-agent: *\nDisallow: /\n"
NOINDEX = "noindex, nofollow, noarchive, nosnippet, noimageindex"


class SpaHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        # Defense in depth: keep the admin panel out of every search index.
        self.send_header("X-Robots-Tag", NOINDEX)
        super().end_headers()

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] == "/robots.txt":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(ROBOTS_TXT)))
            self.end_headers()
            self.wfile.write(ROBOTS_TXT)
            return
        super().do_GET()

    def translate_path(self, path: str) -> str:
        translated = super().translate_path(path)
        # Serve real files as-is; fall back to index.html for SPA routes and
        # for any directory request (no directory listings are exposed).
        if os.path.isfile(translated):
            return translated
        return os.path.join(ROOT, "index.html")

    def log_message(self, fmt: str, *args) -> None:
        print("[admin] " + (fmt % args))


def main() -> None:
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), SpaHandler)
    print(f"Serving KurdMap admin SPA on http://0.0.0.0:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
