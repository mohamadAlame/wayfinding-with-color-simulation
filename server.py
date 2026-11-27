"""Remote banner study. Python 3.9+, no installs. Run: python3 server.py
Admin page: /admin-<token>, printed at start. The token is in admin-token.txt (git-ignored)."""
import gzip, hmac, json, os, re, secrets, sys, tempfile, threading, time
from datetime import datetime, timezone
from functools import lru_cache
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
_T = {"R1": ("tene mafra2 3al yamin", "awal mafra2 3al shmel", "yamin", "a7mar"), "R2": ("awal mafra2 3al shmel", "tene mafra2 3al yamin", "shmel", "asfar"),
      "R3": ("tene mafra2 3al shmel", "awal mafra2 3al yamin", "shmel", "mauve"), "R4": ("awal mafra2 3al yamin", "tene mafra2 3al shmel", "yamin", "akhdar")}
DIRECTIONS1 = {r: {  # Lebanese Arabizi; study 1 (posters only), closed 27 Nov
    "plain": f"Btemsho deghre, btekhdo {a}, w ba3da {b}. Btkoun tene bineye 3al {s}.",
    "coloured": f"Btemsho deghre, btekhdo {a}, w ba3da {b}. Btkoun l bineye yalli 3layha yafta/poster kbir {c}, 3al {s}."} for r, (a, b, s, c) in _T.items()}
# Study 2 (posters and lines on the road). Routes 2 and 4 now say "skip the first, take the second":
# "awal ..., w ba3da tene ..." was read by some as "first turn, then second turn".
_T2 = {"R1": "Btemsho deghre, btekhdo tene mafra2 3al yamin, w ba3da awal mafra2 3al shmel.",
       "R2": "Btemsho deghre, btekhdo awal mafra2 3al shmel. Ba3da btetrko awal mafra2 3al yamin, w btekhdo l tene.",
       "R3": "Btemsho deghre, btekhdo tene mafra2 3al shmel, w ba3da awal mafra2 3al yamin.",
       "R4": "Btemsho deghre, btekhdo awal mafra2 3al yamin. Ba3da btetrko awal mafra2 3al shmel, w btekhdo l tene."}
DIRECTIONS2 = {r: {"plain": f"{_T2[r]} Btkoun tene bineye 3al {s}.",
                   "coloured": f"{_T2[r]} Btkoun l bineye yalli 3layha yafta/poster kbir {c}, 3al {s}. W fi khatt {c} 3al ard, lhaa2o byousalak la 3enda."}
               for r, (a, b, s, c) in _T.items()}
STUDY = 2  # new participants go here; study 1 stays readable
DEFAULT = {"v": 3, "open": True, "directions": DIRECTIONS1, "directions2": DIRECTIONS2}
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
if os.path.exists(CONFIG) and read(CONFIG).get("v") == 2:  # study 1's settings: keep its directions, add study 2's
    _c = read(CONFIG)
    os.replace(CONFIG, os.path.join(DATA, "config-study1.json"))
    write(CONFIG, {"v": 3, "open": _c.get("open", True), "directions": _c["directions"], "directions2": DIRECTIONS2})
elif os.path.exists(CONFIG) and read(CONFIG).get("v") != 3:
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

def study(s):
    return s.get("study", 1)

def assign():
    """The cell with the fewest people in this study (finished, running now, or opened in the last 10 minutes, so
    two people opening the link together get different cells); the lowest number on a tie."""
    now, n = time.time(), [0] * len(CELLS)
    for s in sessions():
        if study(s) == STUDY and s.get("cell", -1) >= 0 and not s["preview"] and (s["status"] == "complete" or now - s["t"] < 600 or (s.get("consent") and now - s["t"] < 1800)):
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
        out["about"] = {k: txt(b["about"].get(k), 40) for k in ("sense", "games", "colour_vision", "before") if k in b["about"]}
    if isinstance(b.get("end"), dict):
        out["end"] = {k: txt(b["end"].get(k), 600) for k in ("remember", "noticed", "banners", "lines", "lines_notes") if k in b["end"]}
    if b.get("problem"):
        out["problem"] = txt(b["problem"], 200)
    return out

@lru_cache(maxsize=16)
def gz(body):
    return gzip.compress(body, 6)

class H(BaseHTTPRequestHandler):
    server_version, sys_version, timeout = "study", "", 20

    def send(self, status, body, ctype="application/json", cache="no-store"):
        if not isinstance(body, bytes):
            body = json.dumps(body, ensure_ascii=False).encode()
        zipped = len(body) > 1000 and "gzip" in self.headers.get("Accept-Encoding", "")
        if zipped:
            body = gz(body)
        self.send_response(status)
        if zipped:
            self.send_header("Content-Encoding", "gzip")
        self.send_header("Vary", "Accept-Encoding")
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
        self.send(200, {"code": s["code"], "token": s["token"], "plan": s["plan"], "study": study(s)})

    def start(self, b):
        cfg, pv = read(CONFIG), txt(b.get("preview"), 16)
        m = re.match(r"^(?:([12])-)?(R[1-4])-(plain|coloured)$", pv)
        st = int(m.group(1) or STUDY) if m else STUDY
        if not cfg["open"] and not pv:
            return self.send(423, {"error": "closed"})
        s = self.mine(b)
        if s and "plan" in s and study(s) == STUDY and not s.get("directionsShown") and not s["preview"] and not pv:  # reloaded before the directions
            return self.reply(s)
        if len(os.listdir(SESS)) >= MAX_SESSIONS:
            return self.send(503, {"error": "full"})
        code = ""
        while not code or os.path.exists(spath(code)):
            code = "P-" + "".join(secrets.choice(ABC) for _ in range(5))
        cell = -1 if m else assign()
        plan = [{"route": m.group(2), "coloured": m.group(3) == "coloured"}] if m else [dict(w) for w in CELLS[cell]]
        for w in plan:
            w["directions"] = cfg["directions" if st == 1 else "directions2"][w["route"]]["coloured" if w["coloured"] else "plain"]
        s = {"v": 3, "study": st, "code": code, "token": secrets.token_urlsafe(16), "cell": cell, "plan": plan, "walks": [], "preview": bool(pv), "status": "started", "t": time.time(),
             "created": datetime.now(timezone.utc).isoformat(timespec="seconds"), "device": txt(b.get("device"), 20), "screen": txt(b.get("screen"), 12)}
        # Same browser as an earlier study session? It proves it with that session's code and token, kept in the browser.
        old = self.mine(b.get("before") if isinstance(b.get("before"), dict) else {})
        if old and study(old) < st:
            s["before"] = {"code": old["code"], "study": study(old), "finished": old["status"] == "complete"}
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
            return self.send(200, {"config": read(CONFIG), "cells": CELLS, "study": STUDY, "sessions": [{k: v for k, v in s.items() if k != "token"} for s in sessions()]})
        if what == "config":
            d = {r: {k: txt(b["directions2"][r][k], 1000).strip() for k in ("plain", "coloured")} for r in ROUTES}
            if not all(v for x in d.values() for v in x.values()):
                return self.send(400, {"error": "Every route needs both directions."})
            cfg = read(CONFIG)
            write(CONFIG, {**cfg, "v": 3, "open": b.get("open") is True, "directions2": d})
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
    ThreadingHTTPServer.request_queue_size = 64
    ThreadingHTTPServer((HOST, PORT), H).serve_forever()
