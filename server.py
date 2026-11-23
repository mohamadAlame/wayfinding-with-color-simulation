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
ROUTES = {"R1": "D-R2", "R2": "E-R2", "R3": "D-R2", "R4": "E-R2"}  # route: its right building
_T = {"R1": ("second street on your right", "first street on your left", "right", "red"), "R2": ("first street on your left", "second street on your right", "left", "yellow"),
      "R3": ("second street on your left", "first street on your right", "left", "purple"), "R4": ("first street on your right", "second street on your left", "right", "green")}
DEFAULT = {"v": 2, "open": True, "directions": {r: {
    "plain": f"Go straight and take the {a}. Then take the {b}. It's the second building on the {s}.",
    "coloured": f"Go straight and take the {a}. Then take the {b}. It's the building with the {c} banner, on the {s}."} for r, (a, b, s, c) in _T.items()}}
# Who walks what: pairs of routes (1+2, 3+4). Neighbouring cells swap the colour between the same two routes,
# and the second half repeats the first with the routes in the other order. 8 people fill it once.
def _cell(x, y, first):
    return [{"route": x, "coloured": first}, {"route": y, "coloured": not first}]
CELLS = [_cell(x, y, f) for pair in ((("R1", "R2"), ("R3", "R4")), (("R2", "R1"), ("R4", "R3"))) for x, y in pair for f in (True, False)]
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
if os.path.exists(CONFIG) and read(CONFIG).get("v") != 2:
    os.replace(CONFIG, os.path.join(DATA, "config-old.json"))
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

def assign():
    """The cell with the fewest people (finished, or running now); the lowest number on a tie."""
    now, n = time.time(), [0] * len(CELLS)
    for s in sessions():
        if s.get("cell", -1) >= 0 and not s["preview"] and (s["status"] == "complete" or (s.get("consent") and now - s["t"] < 1800)):
            n[s["cell"]] += 1
    return n.index(min(n))

def txt(v, n=120):
    return str(v if v is not None else "")[:n]

def num(v, hi=10**8):
    return max(0, min(hi, int(v))) if isinstance(v, (int, float)) and v == v and abs(v) != float("inf") else 0

def snum(v, hi):
    return max(-hi, min(hi, int(v))) if isinstance(v, (int, float)) and v == v and abs(v) != float("inf") else 0

def clean_walk(t, right):
    path, rec, ev = (t.get(k) if isinstance(t.get(k), list) else [] for k in ("path", "rec", "events"))
    out = {"ms": num(t.get("ms")), "hiddenMs": num(t.get("hiddenMs")), "readMs": num(t.get("readMs")), "chosen": txt(t.get("chosen"), 8), "correct": t.get("chosen") == right,
           "path": [[num(p[0]), txt(p[1], 5), num(p[2], 360)] for p in path[:1500] if isinstance(p, list) and len(p) == 3],
           "rec": [[num(p[0])] + [snum(v, 10**6) for v in p[1:]] for p in rec[:5000] if isinstance(p, list) and len(p) == 5],
           "events": [[num(p[0]), txt(p[1], 20), txt(p[2], 8)] for p in ev[:200] if isinstance(p, list) and len(p) == 3]}
    if isinstance(t.get("after"), dict):
        out["after"] = {"confidence": txt(t["after"].get("confidence"), 2), "ease": txt(t["after"].get("ease"), 2), "used": txt(t["after"].get("used"), 600)}
    return out

def clean(b):
    """Only known fields, with limits: this endpoint is open to the internet."""
    out = {}
    for k in ("consent", "practiceDone", "directionsShown"):
        if b.get(k) is True:
            out[k] = True
    if isinstance(b.get("about"), dict):
        out["about"] = {k: txt(b["about"].get(k), 40) for k in ("sense", "games", "colour_vision")}
    if isinstance(b.get("end"), dict):
        out["end"] = {k: txt(b["end"].get(k), 600) for k in ("remember", "noticed", "banners")}
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
            if not 0 < n <= 600_000:
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

    def reply(self, s):
        self.send(200, {"code": s["code"], "token": s["token"], "plan": s["plan"]})

    def start(self, b):
        cfg, pv = read(CONFIG), txt(b.get("preview"), 12)
        m = re.match(r"^(R[1-4])-(plain|coloured)$", pv)
        if not cfg["open"] and not pv:
            return self.send(423, {"error": "closed"})
        s = self.mine(b)
        if s and "plan" in s and not s.get("directionsShown") and not s["preview"] and not pv:  # reloaded before the directions
            return self.reply(s)
        if len(os.listdir(SESS)) >= MAX_SESSIONS:
            return self.send(503, {"error": "full"})
        code = ""
        while not code or os.path.exists(spath(code)):
            code = "P-" + "".join(secrets.choice(ABC) for _ in range(5))
        cell = -1 if m else assign()
        plan = [{"route": m.group(1), "coloured": m.group(2) == "coloured"}] if m else [dict(w) for w in CELLS[cell]]
        for w in plan:
            w["directions"] = cfg["directions"][w["route"]]["coloured" if w["coloured"] else "plain"]
        s = {"v": 2, "code": code, "token": secrets.token_urlsafe(16), "cell": cell, "plan": plan, "walks": [], "preview": bool(pv), "status": "started", "t": time.time(),
             "created": datetime.now(timezone.utc).isoformat(timespec="seconds"), "device": txt(b.get("device"), 20), "screen": txt(b.get("screen"), 12)}
        write(spath(code), s)
        self.reply(s)

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
            if "plan" in s:
                one = {b.get("walk"): b.get("data")} if type(b.get("walk")) is int else dict(enumerate(b["walks"])) if isinstance(b.get("walks"), list) else {}
                for i, d in one.items():
                    if 0 <= i < len(s["plan"]) and isinstance(d, dict):
                        while len(s["walks"]) <= i:
                            s["walks"].append(None)
                        w = clean_walk(d, ROUTES[s["plan"][i]["route"]])
                        if w["chosen"] or not (s["walks"][i] and s["walks"][i]["chosen"]):  # a late partial save never replaces a finished walk
                            if s["walks"][i] and "after" in s["walks"][i]:
                                w.setdefault("after", s["walks"][i]["after"])
                            s["walks"][i] = w
            if b.get("complete") is True and "plan" in s and len(s["walks"]) == len(s["plan"]) and all(w and w["chosen"] and "after" in w for w in s["walks"]):
                s["status"], s["finished"] = "complete", datetime.now(timezone.utc).isoformat(timespec="seconds")
            write(spath(s["code"]), s)
        self.send(200, {"ok": True})

    def manage(self, what, b):
        if what == "state":
            return self.send(200, {"config": read(CONFIG), "cells": CELLS, "sessions": [{k: v for k, v in s.items() if k != "token"} for s in sessions()]})
        if what == "config":
            d = {r: {k: txt(b["directions"][r][k], 1000).strip() for k in ("plain", "coloured")} for r in ROUTES}
            if not all(v for x in d.values() for v in x.values()):
                return self.send(400, {"error": "Every route needs both directions."})
            write(CONFIG, {"v": 2, "open": b.get("open") is True, "directions": d})
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
