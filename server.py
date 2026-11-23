"""Local server for the banner test. Python 3.9+, no installs. Run: python3 server.py"""
import json, os, re, sys, tempfile, threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "web")
DATA = os.environ.get("BANNER_DATA") or os.path.join(HERE, "data")
CONFIG = os.environ.get("BANNER_CONFIG") or os.path.join(HERE, "config.json")
BANNER = os.environ.get("BANNER_FILE") or os.path.join(HERE, "banner.json")
KEY = os.environ.get("BANNER_KEY") or os.path.join(HERE, "google-key.txt")  # git-ignored
PORT = int(os.environ.get("BANNER_PORT", "8700"))
HOSTS = {f"localhost:{PORT}", f"127.0.0.1:{PORT}"}
CODE = re.compile(r"^P-[A-Z2-9]{4}$")
TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css"}
LOCK = threading.Lock()

def write(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)

def sessions():
    out = []
    if os.path.isdir(DATA):
        for n in sorted(os.listdir(DATA)):
            if CODE.match(n[:-5]) and n.endswith(".json"):
                try:
                    with open(os.path.join(DATA, n), encoding="utf-8") as f:
                        out.append(json.load(f))
                except ValueError:
                    print("Could not read", n, file=sys.stderr)
    return out

class H(BaseHTTPRequestHandler):
    def send(self, status, body, ctype="application/json"):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def local(self):
        ok = self.headers.get("Host") in HOSTS
        if not ok:
            self.send(403, {"error": "local only"})
        return ok

    def do_GET(self):
        if not self.local():
            return
        p = urlparse(self.path).path
        if p == "/api/config":
            with open(CONFIG, encoding="utf-8") as f:
                return self.send(200, json.load(f))
        if p == "/api/banner":
            with open(BANNER, encoding="utf-8") as f:
                return self.send(200, json.load(f))
        if p == "/api/key":
            key = ""
            if os.path.exists(KEY):
                with open(KEY, encoding="utf-8") as f:
                    key = f.read().strip()
            return self.send(200, {"key": key})
        if p == "/api/sessions":
            return self.send(200, sessions())
        name = {"/": "index.html", "/settings": "settings.html", "/results": "results.html", "/banner": "banner.html"}.get(p, p.lstrip("/"))
        full = os.path.join(WEB, name)
        ext = os.path.splitext(name)[1]
        if "/" in name or ext not in TYPES or not os.path.isfile(full):
            return self.send(404, {"error": "not found"})
        with open(full, "rb") as f:
            self.send(200, f.read(), TYPES[ext])

    def do_POST(self):
        if not self.local():
            return
        if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
            return self.send(415, {"error": "JSON only"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            if n > 1_000_000:
                return self.send(413, {"error": "too large"})
            body = json.loads(self.rfile.read(n))
            p = urlparse(self.path).path
            with LOCK:
                if p == "/api/config":
                    write(CONFIG, body)
                elif p == "/api/banner":
                    write(BANNER, body)
                elif p == "/api/key":
                    with open(KEY, "w", encoding="utf-8") as f:
                        f.write(str(body.get("key", "")).strip())
                    os.chmod(KEY, 0o600)
                elif p in ("/api/session", "/api/withdraw"):
                    code = body.get("code", "")
                    if not CODE.match(code):
                        return self.send(400, {"error": "bad code"})
                    path = os.path.join(DATA, code + ".json")
                    if p == "/api/session":
                        write(path, body)
                    elif os.path.exists(path):
                        os.remove(path)
                    else:
                        return self.send(404, {"error": "no such code"})
                else:
                    return self.send(404, {"error": "not found"})
            self.send(200, {"ok": True})
        except (ValueError, AttributeError) as e:
            self.send(400, {"error": str(e)})

    def log_message(self, *a):
        pass

if __name__ == "__main__":
    print(f"Open http://localhost:{PORT}   (Ctrl+C to stop)")
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
