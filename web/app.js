let cfg, banner, key, view = null, S = null, phase = "setup", walkStart = 0, walkKind = "", warnTimer, code = "";
const sections = ["setup","consent","about","practiceIntro","practiceDone","directions","after","handover","outcome"];
function show(id) {
  phase = id;
  for (const s of sections) $(s).hidden = s !== id;
  $("page").hidden = false;
  $("stopLine").hidden = !["about","practiceIntro","practiceDone","directions","after"].includes(id);
  scrollTo(0, 0);
}
const newCode = () => "P-" + Array.from(crypto.getRandomValues(new Uint8Array(4)), b => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
document.querySelectorAll(".opts").forEach(el => el.dataset.o.split("|").forEach(o => {
  const l = document.createElement("label"), i = document.createElement("input");
  i.type = "radio"; i.name = el.dataset.q; i.value = o; i.required = true; l.append(i, " " + o); el.append(l);
}));
const answers = form => Object.fromEntries(new FormData(form));
const log = event => S.events.push({event, at: new Date().toISOString()});
async function save() { await api("/api/session", S); }
const saveQuiet = () => save().catch(() => {}); // the final save reports errors and can be retried

function script() { $("script").textContent = cfg.directions[$("mode").value] || "(not written yet: Settings)"; }
async function reset() {
  S = null; clearView();
  $("walk").hidden = true; $("walk").className = ""; $("walk").removeAttribute("style");
  document.querySelectorAll("form").forEach(f => f.reset());
  $("c1").checked = $("c2").checked = false; $("agree").disabled = true;
  $("say").textContent = "";
  code = newCode(); for (const id of ["code","code2","code3"]) $(id).textContent = code;
  show("setup");
  try {
    cfg = await api("/api/config"); banner = await api("/api/banner"); key = (await api("/api/key")).key;
    const done = (await api("/api/sessions")).filter(s => s.kind === "study" && s.status === "complete" && s.outcome?.result !== "Technical problem");
    const n = m => done.filter(s => s.mode === m).length;
    $("counts").textContent = `A = directions only (${n("plain")} done) · B = directions with the banner (${n("banner")} done). Preselected: the one with fewer.`;
    $("mode").value = n("banner") < n("plain") ? "banner" : "plain";
    const missing = [!toEmbed(cfg.practice.view) && "practice Street View", !toEmbed(cfg.test.view) && "test Street View",
      !cfg.directions.plain && "directions A", !cfg.directions.banner && "directions B",
      banner.on && !key && "Google key (needed while the drawn banner is on)"].filter(Boolean);
    $("problem").textContent = missing.length ? "Missing in Settings: " + missing.join(", ") + "." : "";
    $("begin").disabled = missing.length > 0;
    script();
  } catch (e) { $("problem").textContent = e.message; $("begin").disabled = true; }
}
$("mode").onchange = script;
$("begin").onclick = () => {
  S = {code, mode: $("mode").value, delivery: $("delivery").value, kind: $("kind").value, status: "started",
    created: new Date().toISOString(), config: cfg, banner: {on: banner.on, colour: banner.colour, placed: Object.keys(banner.places).length}, events: []};
  document.querySelector("#setup details").open = false;
  show("consent");
};
$("c1").onchange = $("c2").onchange = () => { $("agree").disabled = !($("c1").checked && $("c2").checked); };
$("decline").onclick = reset; // nothing has been written yet
$("agree").onclick = () => { log("consent"); saveQuiet(); show("about"); };
$("aboutForm").onsubmit = e => { e.preventDefault(); S.about = answers(e.target); saveQuiet(); practice(); };
function practice() { $("practiceSay").textContent = cfg.practice.directions; show("practiceIntro"); }
$("again").onclick = practice;
$("practiceGo").onclick = () => walk("practice");
$("toDirections").onclick = () => {
  $("say").textContent = S.delivery === "screen" ? cfg.directions[S.mode] : "Listen to the directions.";
  log("directions_shown"); show("directions");
};
$("directionsGo").onclick = () => { $("say").textContent = ""; log("directions_closed"); walk("test"); };

function walk(kind) {
  walkKind = kind; phase = "walk"; walkStart = 0;
  clearView();
  $("page").hidden = true; $("walk").className = ""; $("walk").hidden = false;
  $("loading").hidden = false; $("loading").textContent = "Loading…"; $("there").disabled = true;
  clearTimeout(warnTimer);
  warnTimer = setTimeout(() => { if (!walkStart) $("loading").textContent = "Street View is not loading. Check the internet connection."; }, 15000);
  const begin = () => { if (walkStart || phase !== "walk" || walkKind !== kind) return; walkStart = performance.now(); log(kind + "_start"); $("loading").hidden = true; $("there").disabled = false; };
  if (banner.on) {
    const box = document.createElement("div"); box.style.cssText = "position:absolute;inset:0"; $("frame").prepend(box);
    view = new BannerView(box, banner);
    view.onstep = (pano, lat, lng) => { if (phase === "walk") (S[kind + "_path"] ||= []).push({pano, lat, lng, t: walkStart ? Math.round(performance.now() - walkStart) : 0}); };
    view.open(key, toView(cfg[kind].view)).then(begin, e => { if (phase === "walk") $("loading").textContent = e.message; });
    return;
  }
  const f = document.createElement("iframe");
  f.title = "Street View"; f.referrerPolicy = "strict-origin-when-cross-origin";
  // The clock starts once Google's page has loaded, so a slow connection isn't counted.
  f.onload = begin;
  f.src = toEmbed(cfg[kind].view);
  $("frame").prepend(f);
}
function clearView() { view = null; [...$("frame").children].forEach(c => { if (c.id !== "loading") c.remove(); }); }
function endWalk(how) {
  const ms = walkStart ? Math.round(performance.now() - walkStart) : null;
  clearTimeout(warnTimer); log(walkKind + "_" + how);
  if (walkKind === "practice") {
    S.practices = (S.practices || 0) + 1;
    $("walk").hidden = true; clearView(); saveQuiet(); return show("practiceDone");
  }
  S.test = {ms, ended: how, overLimit: ms !== null && ms > cfg.limitMinutes * 60000};
  $("walk").classList.add("parked"); // kept off-screen, so the final view can be judged afterwards
  saveQuiet(); show("after");
}
$("there").onclick = () => { if (walkStart) endWalk("arrived"); };
async function stopAll() {
  if (!confirm("Stop the whole session?")) return;
  if (phase === "walk" && walkKind === "test") return endWalk("gave_up");
  log("stopped"); S.status = "stopped"; clearTimeout(warnTimer);
  try { await save(); } catch (e) { alert("Not saved: " + e.message); return; }
  reset();
}
$("stop").onclick = stopAll; $("stopPage").onclick = stopAll;
$("afterForm").onsubmit = e => { e.preventDefault(); S.after = answers(e.target); saveQuiet(); show("handover"); };
$("toOutcome").onclick = () => {
  show("outcome"); $("saveErr").textContent = "";
  $("walk").className = "review";
  // Moving an iframe in the page reloads it, so it is placed visually instead.
  const r = $("reviewSlot"); r.style.height = "440px";
  const b = r.getBoundingClientRect();
  Object.assign($("walk").style, {position: "absolute", left: b.left + "px", top: b.top + scrollY + "px", width: b.width + "px"});
};
$("outcomeForm").onsubmit = async e => {
  e.preventDefault(); S.outcome = answers(e.target); S.status = "complete"; log("saved");
  try { await save(); $("walk").removeAttribute("style"); reset(); }
  catch (err) { $("saveErr").textContent = "Not saved: " + err.message + " Press the button again."; }
};
addEventListener("beforeunload", e => { if (S) e.preventDefault(); });
history.pushState(null, ""); addEventListener("popstate", () => history.pushState(null, "")); // Back does nothing
reset();
