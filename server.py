"""Remote banner study. Python 3.9+, no installs. Run: python3 server.py
Admin page: /admin-<token>, printed at start. The token is in admin-token.txt (git-ignored)."""
import hmac, json, os, re, secrets, sys, tempfile, threading, time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "web")
DATA = os.environ.get("STUDY_DATA") or os.path.join(HERE, "data")
SESS = os.path.join(DATA, "sessions")
CONFIG = os.path.join(DATA, "config.json")
TOKEN_FILE = os.path.join(DATA, "admin-token.txt")
HOST, PORT = os.environ.get("STUDY_HOST", "127.0.0.1"), int(os.environ.get("STUDY_PORT", "8710"))
DEFAULT = {"open": True, "assign": "balanced", "targetColour": "#a6544f", "directions": {
    "plain": "Go straight and take the second street on your right. Then take the first street on your left. It's the second building on the right.",
    "banner": "Go straight and take the second street on your right. Then take the first street on your left. It's the building with the red banner, on the right."}}
CODE = re.compile(r"^P-[A-HJ-NP-Z2-9]{5}$")
ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css"}
LOCK = threading.RLock()
MAX_SESSIONS = 3000
os.makedirs(SESS, mode=0o700, exist_ok=True)

def write(path, obj):
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)
    os.replace(tmp, path)

def read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

if not os.path.exists(TOKEN_FILE):
    with open(os.open(TOKEN_FILE, os.O_WRONLY | os.O_CREAT, 0o600), "w") as f:
        f.write(secrets.token_urlsafe(18))
with open(TOKEN_FILE) as f:
    TOKEN = f.read().strip()
if not os.path.exists(CONFIG):
    write(CONFIG, DEFAULT)

def spath(code):
    return os.path.join(SESS, code + ".json")

def sessions():
    out = []
    for n in sorted(os.listdir(SESS)):
        if CODE.match(n[:-5]) and n.endswith(".json"):
            try:
                out.append(read(os.path.join(SESS, n)))
            except (OSError, ValueError):
                print("unreadable", n, file=sys.stderr)
    return out

def assign(cfg):
    """The mode with fewer finished or currently running sessions."""
    if cfg["assign"] in ("plain", "banner"):
        return cfg["assign"]
    now, n = time.time(), {"plain": 0, "banner": 0}
    for s in sessions():
        if not s["preview"] and (s["status"] == "complete" or (s.get("consent") and now - s["t"] < 1800)):
            n[s["mode"]] += 1
    if n["plain"] == n["banner"]:
        return secrets.choice(["plain", "banner"])
    return min(n, key=n.get)

def txt(v, n=120):
    return str(v if v is not None else "")[:n]

def num(v, hi=10**8):
    return max(0, min(hi, int(v))) if isinstance(v, (int, float)) and v == v and abs(v) != float("inf") else 0

def snum(v, hi):
    return max(-hi, min(hi, int(v))) if isinstance(v, (int, float)) and v == v and abs(v) != float("inf") else 0

def clean(b):
    """Only known fields, with limits: this endpoint is open to the internet."""
    out = {}
    for k in ("consent", "practiceDone", "directionsShown"):
        if b.get(k) is True:
            out[k] = True
    if isinstance(b.get("about"), dict):
        out["about"] = {k: txt(b["about"].get(k), 40) for k in ("sense", "games", "colour_vision")}
    if isinstance(b.get("after"), dict):
        out["after"] = {"confidence": txt(b["after"].get("confidence"), 2), "ease": txt(b["after"].get("ease"), 2), "used": txt(b["after"].get("used"), 600)}
    if isinstance(b.get("test"), dict):
        t = b["test"]
        path = t.get("path") if isinstance(t.get("path"), list) else []
        out["test"] = {"ms": num(t.get("ms")), "hiddenMs": num(t.get("hiddenMs")), "readMs": num(t.get("readMs")), "chosen": txt(t.get("chosen"), 8),
                       "correct": t.get("chosen") == "D-R2",
                       "path": [[num(p[0]), txt(p[1], 5), num(p[2], 360)] for p in path[:1500] if isinstance(p, list) and len(p) == 3],
                       "rec": [[num(p[0])] + [snum(v, 10**6) for v in p[1:]] for p in (t.get("rec") if isinstance(t.get("rec"), list) else [])[:6000] if isinstance(p, list) and len(p) == 5],
                       "events": [[num(p[0]), txt(p[1], 20), txt(p[2], 8)] for p in (t.get("events") if isinstance(t.get("events"), list) else [])[:200] if isinstance(p, list) and len(p) == 3]}
    if b.get("problem"):
        out["problem"] = txt(b["problem"], 200)
    return out

class H(BaseHTTPRequestHandler):
    server_version, sys_version, timeout = "study", "", 20

    def send(self, status, body, ctype="application/json", cache="no-store"):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        for k, v in (("Content-Type", ctype + "; charset=utf-8"), ("Content-Length", str(len(body))), ("Cache-Control", cache), ("X-Content-Type-Options", "nosniff"),
                     ("Referrer-Policy", "no-referrer"), ("X-Frame-Options", "DENY"), ("X-Robots-Tag", "noindex"),
                     ("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-ancestors 'none'")):
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def admin(self, given):
        return hmac.compare_digest(given.encode(), TOKEN.encode())

    def do_GET(self):
        p = urlparse(self.path).path
        if p.startswith("/admin-") and self.admin(p[7:]):
            name = "admin.html"
        else:
            name = "index.html" if p == "/" else p.lstrip("/")
            if name == "admin.html":
                name = "?"
        ext, full = os.path.splitext(name)[1], os.path.join(WEB, name)
        if "/" in name or ext not in TYPES or not os.path.isfile(full):
            return self.send(404, {"error": "not found"})
        with open(full, "rb") as f:
            self.send(200, f.read(), TYPES[ext], "public, max-age=86400" if name.startswith("three") else "no-cache")

    def do_POST(self):
        try:
            if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                return self.send(415, {"error": "JSON only"})
            n = int(self.headers.get("Content-Length", 0))
            if not 0 < n <= 200_000:
                return self.send(413, {"error": "too large"})
            b = json.loads(self.rfile.read(n))
            if not isinstance(b, dict):
                return self.send(400, {"error": "bad request"})
            p = urlparse(self.path).path
            with LOCK:
                if p == "/api/start":
                    return self.start(b)
                if p in ("/api/save", "/api/erase"):
                    return self.change(p, b)
                m = re.match(r"^/api/admin/(state|config|delete)$", p)
                if m and self.admin(self.headers.get("X-Admin", "")):
                    return self.manage(m.group(1), b)
            self.send(404, {"error": "not found"})
        except (ValueError, TypeError, KeyError):
            self.send(400, {"error": "bad request"})

    def reply(self, s, cfg):
        self.send(200, {"code": s["code"], "token": s["token"], "mode": s["mode"], "directions": cfg["directions"][s["mode"]], "targetColour": cfg["targetColour"]})

    def start(self, b):
        cfg, preview = read(CONFIG), b.get("preview") if b.get("preview") in ("plain", "banner") else ""
        if not cfg["open"] and not preview:
            return self.send(423, {"error": "closed"})
        s = self.mine(b)
        if s and not s.get("directionsShown") and not s["preview"] and not preview:  # reloaded before the directions: same code and mode
            return self.reply(s, cfg)
        if len(os.listdir(SESS)) >= MAX_SESSIONS:
            return self.send(503, {"error": "full"})
        code = ""
        while not code or os.path.exists(spath(code)):
            code = "P-" + "".join(secrets.choice(ABC) for _ in range(5))
        s = {"code": code, "token": secrets.token_urlsafe(16), "mode": preview or assign(cfg), "preview": bool(preview), "status": "started", "t": time.time(),
             "created": datetime.now(timezone.utc).isoformat(timespec="seconds"), "device": txt(b.get("device"), 20), "screen": txt(b.get("screen"), 12),
             "shown": {"targetColour": cfg["targetColour"]}}
        s["shown"]["directions"] = cfg["directions"][s["mode"]]
        write(spath(code), s)
        self.reply(s, cfg)

    def mine(self, b):
        code = b.get("code")
        if not isinstance(code, str) or not CODE.match(code) or not os.path.exists(spath(code)):
            return None
        s = read(spath(code))
        return s if hmac.compare_digest(str(b.get("token", "")).encode(), s["token"].encode()) else None

    def change(self, p, b):
        s = self.mine(b)
        if not s:
            return self.send(404, {"error": "unknown code"})
        if p == "/api/erase":
            os.remove(spath(s["code"]))
            return self.send(200, {"ok": True})
        new = clean(b)
        if s["status"] != "complete":  # finished sessions can't be rewritten
            s.update(new)
            if b.get("complete") is True and "test" in s and "after" in s:
                s["status"], s["finished"] = "complete", datetime.now(timezone.utc).isoformat(timespec="seconds")
            write(spath(s["code"]), s)
        self.send(200, {"ok": True})

    def manage(self, what, b):
        if what == "state":
            return self.send(200, {"config": read(CONFIG), "sessions": [{k: v for k, v in s.items() if k != "token"} for s in sessions()]})
        if what == "config":
            if b.get("assign") not in ("balanced", "plain", "banner") or not re.match(r"^#[0-9a-fA-F]{6}$", b.get("targetColour", "")):
                return self.send(400, {"error": "bad settings"})
            d = {k: txt(b["directions"][k], 1000).strip() for k in ("plain", "banner")}
            if not all(d.values()):
                return self.send(400, {"error": "Both directions are needed."})
            write(CONFIG, {"open": b.get("open") is True, "assign": b["assign"], "targetColour": b["targetColour"], "directions": d})
            return self.send(200, {"ok": True})
        code = str(b.get("code", ""))
        if not CODE.match(code) or not os.path.exists(spath(code)):
            return self.send(404, {"error": "No such code."})
        os.remove(spath(code))
        self.send(200, {"ok": True})

    def log_message(self, *a):  # no IP addresses are logged
        pass

if __name__ == "__main__":
    print(f"Study: http://localhost:{PORT}/\nAdmin: http://localhost:{PORT}/admin-{TOKEN}", flush=True)
    ThreadingHTTPServer((HOST, PORT), H).serve_forever()
