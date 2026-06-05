#!/usr/bin/env python3
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = "/dist"
PORT = 8081


class SpaHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        translated = super().translate_path(path)
        if os.path.exists(translated):
            return translated
        return os.path.join(ROOT, "index.html")

    def log_message(self, fmt: str, *args) -> None:
        # Keep container logs concise during local dev.
        print("[admin-dev] " + (fmt % args))


def main() -> None:
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), SpaHandler)
    print(f"Serving Admin SPA on http://0.0.0.0:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
