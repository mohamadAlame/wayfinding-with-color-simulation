"""Auto-deploy: put the newest commit of the GitHub repository live, if it changed and passes basic checks.
Runs as root on the server: every 5 minutes (banner-study-deploy.timer) and at once when the admin page's
"Get the latest from GitHub now" writes deploy-request into the data folder (banner-study-deploy.path).
Only the code is replaced (server.py and web/). The data folder (sessions, settings, admin token) is never touched.
Settings: /etc/banner-study/deploy.json, {"repo": "https://github.com/<owner>/<name>.git", "branch": "main"}."""
import json, os, shutil, subprocess, sys, tempfile, time
from datetime import datetime, timezone

SETTINGS = "/etc/banner-study/deploy.json"
DATA = "/var/lib/private/banner-study"
STATUS, REQUEST = os.path.join(DATA, "deploy.json"), os.path.join(DATA, "deploy-request")
SRC, APP, PREV = "/var/lib/banner-study-src", "/opt/banner-study", "/opt/banner-study.prev"
DEPLOYED = os.path.join(APP, "DEPLOYED")
NEEDED = ["server.py", "web/index.html", "web/app.js", "web/admin.js", "web/world.js", "web/scene.js", "web/three.module.min.js"]

def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def run(*a, **k):
    return subprocess.run(a, check=True, capture_output=True, text=True, timeout=120, **k).stdout.strip()

def save(**info):
    old = {}
    try:
        with open(STATUS) as f:
            old = json.load(f)
    except (OSError, ValueError):
        pass
    old.update(info, checked=now())
    tmp = STATUS + ".tmp"
    with open(tmp, "w") as f:
        json.dump(old, f)
    os.chmod(tmp, 0o644)
    os.replace(tmp, STATUS)

def main():
    try:
        os.remove(REQUEST)
    except OSError:
        pass
    try:
        with open(SETTINGS) as f:
            cfg = json.load(f)
    except (OSError, ValueError):
        cfg = {}
    repo, branch = cfg.get("repo", ""), cfg.get("branch", "main")
    if not repo:
        return save(ok=False, repo="", branch=branch, result="No GitHub repository is set on the server yet.")
    try:
        if not os.path.isdir(os.path.join(SRC, ".git")) or run("git", "-C", SRC, "remote", "get-url", "origin") != repo:
            shutil.rmtree(SRC, ignore_errors=True)
            run("git", "clone", "--quiet", "--branch", branch, repo, SRC)
        run("git", "-C", SRC, "fetch", "--quiet", "origin", branch)
        sha = run("git", "-C", SRC, "rev-parse", "FETCH_HEAD")
    except subprocess.SubprocessError as e:
        return save(ok=False, repo=repo, branch=branch, result="Could not read the repository: " + (getattr(e, "stderr", "") or str(e))[-300:])
    live = open(DEPLOYED).read().strip() if os.path.exists(DEPLOYED) else ""
    run("git", "-C", SRC, "reset", "--quiet", "--hard", sha)
    commit = {"sha": sha, "message": run("git", "-C", SRC, "log", "-1", "--format=%s"), "author": run("git", "-C", SRC, "log", "-1", "--format=%an"), "date": run("git", "-C", SRC, "log", "-1", "--format=%cI")}
    if sha == live:
        return save(ok=True, repo=repo, branch=branch, result="Up to date.", latest=commit)
    # checks before anything changes
    missing = [p for p in NEEDED if not os.path.isfile(os.path.join(SRC, p))]
    problem = "Missing files: " + ", ".join(missing) if missing else ""
    if not problem:
        try:
            run(sys.executable, "-m", "py_compile", os.path.join(SRC, "server.py"))
            with tempfile.TemporaryDirectory() as t:
                for n in os.listdir(os.path.join(SRC, "web")):
                    if n.endswith(".js") and not n.startswith("three"):
                        shutil.copy(os.path.join(SRC, "web", n), os.path.join(t, n[:-3] + ".mjs"))
                        run("node", "--check", os.path.join(t, n[:-3] + ".mjs"))
        except subprocess.CalledProcessError as e:
            problem = "The new code has an error: " + (e.stderr or "")[-400:]
    if problem:
        return save(ok=False, repo=repo, branch=branch, result="Not put live. " + problem, latest=commit)
    # swap the code, keeping the old copy to fall back on
    shutil.rmtree(PREV, ignore_errors=True)
    shutil.copytree(APP, PREV, symlinks=True)
    shutil.rmtree(os.path.join(APP, "web.new"), ignore_errors=True)
    shutil.copytree(os.path.join(SRC, "web"), os.path.join(APP, "web.new"))
    shutil.copy(os.path.join(SRC, "server.py"), os.path.join(APP, "server.py"))
    shutil.rmtree(os.path.join(APP, "web"))
    os.rename(os.path.join(APP, "web.new"), os.path.join(APP, "web"))
    run("chown", "-R", "root:root", APP)
    subprocess.run(["systemctl", "restart", "banner-study"])
    time.sleep(4)
    if subprocess.run(["systemctl", "is-active", "--quiet", "banner-study"]).returncode:
        shutil.rmtree(APP)
        shutil.copytree(PREV, APP, symlinks=True)
        subprocess.run(["systemctl", "restart", "banner-study"])
        return save(ok=False, repo=repo, branch=branch, result="The new version did not start, so the previous one was put back.", latest=commit)
    with open(DEPLOYED, "w") as f:
        f.write(sha)
    save(ok=True, repo=repo, branch=branch, result="Put live.", latest=commit, live=commit, live_since=now())

if __name__ == "__main__":
    main()
