import {Street} from './scene.js';
import {ROUTES, ROUTES2, PRACTICE, graph, facing} from './world.js';
const $ = id => document.getElementById(id), q = new URLSearchParams(location.search), preview = q.get('preview');
// Study 2 has its own key. Study 1's key, if this browser has one, tells the server this person took part before.
const KEY = 'finding-a-building-2', KEY1 = 'finding-a-building', got = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
const store = {get: () => got(KEY), set: v => { if (!preview) try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }};
let S, walk = null, at = 0; // at = which of their walks
const show = id => { document.querySelectorAll('main>section').forEach(s => s.hidden = s.id !== 's-' + id); $('page').hidden = false; $('walk').hidden = true; scrollTo(0, 0); };
const message = (t, p) => { $('msgT').textContent = t; $('msgP').textContent = p; show('msg'); };
document.querySelectorAll('.opts').forEach(el => el.dataset.o.split('|').forEach(o => { const l = document.createElement('label'), i = document.createElement('input'); i.type = 'radio'; i.name = el.dataset.q; i.value = o; i.required = true; l.append(i, o); el.append(l); }));
const answers = f => Object.fromEntries(new FormData(f));
async function api(path, body) {
  const text = JSON.stringify(body); // keepalive lets a save survive closing the page, but browsers cap it at 64 KB
  const r = await fetch('api/' + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: text, keepalive: text.length < 60000});
  const j = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(j.error || 'No connection.'), {status: r.status}); return j;
}
const save = part => api('save', {code: S.code, token: S.token, ...part});
const saveQuiet = part => save(part).catch(() => setTimeout(() => save(part).catch(() => {}), 3000));
async function begin() {
  const old = preview ? {} : store.get();
  if (old.stage === 'done') return message('You already took part', 'Thank you! Your code is ' + old.code + '.');
  if (old.stage === 'test') return message('This session has ended', 'The page was reloaded after the directions were shown, so it can’t be continued. Thank you for trying. Your code is ' + old.code + '.');
  const o1 = preview ? {} : got(KEY1);
  try { S = await api('start', {preview: preview || '', code: old.code || '', token: old.token || '', before: {code: o1.code || '', token: o1.token || ''}, device: matchMedia('(pointer:coarse)').matches ? 'phone/tablet' : 'computer', screen: innerWidth + 'x' + innerHeight}); }
  catch (e) { return e.status === 423 ? message('The study is closed', 'Thank you for your interest.') : message('Something went wrong', 'Please check your connection and reload the page.'); }
  store.set({code: S.code, token: S.token, stage: 'start'}); S.walks = []; S.world = S.study === 1 ? ROUTES : ROUTES2;
  document.body.dataset.study = S.study; if (S.study !== 2) document.querySelectorAll('.s2 input').forEach(i => i.required = false);
  document.querySelectorAll('[data-code]').forEach(e => e.textContent = S.code); show('welcome');
}
$('c1').onchange = () => $('agree').disabled = !$('c1').checked;
$('agree').onclick = () => { saveQuiet({consent: true}); show('about'); };
$('aboutForm').onsubmit = e => { e.preventDefault(); saveQuiet({about: answers(e.target)}); show('practice'); };
$('practiceSay').textContent = PRACTICE.directions;
$('goPractice').onclick = () => { $('practiceSay').hidden = true; startWalk('practice'); };
$('again').onclick = () => { $('practiceSay').hidden = false; show('practice'); };
function ready() { $('readyT').textContent = at ? 'Second walk' : 'Good, you’ve got it'; $('readyP').textContent = at ? 'A different neighbourhood, with new directions. Again you read them once.' : 'Now the first real walk. Same as the practice: you read the directions once, then they disappear. This time there are no hints and you choose only once. Take your time, and don’t write them down.'; $('again').hidden = at > 0; show('ready'); }
$('goDirections').onclick = () => { $('say').textContent = S.plan[at].directions; store.set({code: S.code, token: S.token, stage: 'test'}); saveQuiet({directionsShown: true}); S.readFrom = performance.now(); show('directions'); };
$('goTest').onclick = () => { S.readMs = Math.round(performance.now() - S.readFrom); $('say').textContent = ''; startWalk('test'); };
$('afterForm').onsubmit = e => {
  e.preventDefault(); S.walks[at].after = answers(e.target); e.target.reset(); saveQuiet({walk: at, data: S.walks[at]});
  if (++at < S.plan.length) ready(); else show('end');
};
$('endForm').onsubmit = e => { e.preventDefault(); S.end = answers(e.target); saveQuiet({end: S.end}); show('end2'); };
$('end2Form').onsubmit = async e => {
  e.preventDefault(); const b = e.submitter || e.target.querySelector('button'); b.disabled = true; $('saveErr').textContent = '';
  try { await save({end: {...S.end, ...answers(e.target)}, walks: S.walks, complete: true}); store.set({code: S.code, token: S.token, stage: 'done'}); show('thanks'); }
  catch { $('saveErr').textContent = 'Not saved. Check your connection and press Finish again.'; b.disabled = false; }
};
$('erase').onclick = async () => { if (!confirm('Delete all your answers? This can’t be undone.')) return; try { await api('erase', {code: S.code, token: S.token}); message('Deleted', 'Your answers were deleted. Thank you anyway.'); } catch { alert('Could not delete. Please try again.'); } };

/* ---- walking ---- */
function startWalk(kind) {
  $('page').hidden = true; $('walk').hidden = false; $('loading').hidden = false; $('loading').textContent = 'Loading the street…'; $('ask').hidden = true; $('tip').hidden = true;
  setTimeout(() => {
    try {
      const w = kind === 'test' ? S.world[S.plan[at].route] : PRACTICE, nodes = graph(w), n = nodes[w.start.node];
      // a fresh canvas each time: a disposed WebGL canvas can't be reused reliably
      const cv = document.createElement('canvas'); cv.id = 'cv'; $('cv').replaceWith(cv); bindCanvas(cv);
      const street = new Street(cv, w, kind === 'test' && S.plan[at].coloured);
      walk = {kind, w, nodes, node: n, x: n.x, z: n.z, yaw: w.start.yaw, pitch: .06, street, path: [], rec: [], events: [], moving: false, held: false, turn: 0, hidden: 0, t0: performance.now(), last: 0, dirty: true};
      street.resize(); street.setArrows(n, nodes); street.render(walk.x, walk.z, walk.yaw, walk.pitch); mark();
      requestAnimationFrame(() => { $('loading').hidden = true; walk.t0 = performance.now(); sample(); if (kind === 'practice') tip(matchMedia('(pointer:coarse)').matches ? 'Drag to look around. Hold “Walk” to go forward.' : 'Drag, or A and D, to look around. Hold W or “Walk” to go forward.', 6000); requestAnimationFrame(loop); });
    } catch (e) { console.error(e); $('loading').textContent = 'This device could not show the 3D street. Please try another browser or a computer.'; saveQuiet({problem: String(e).slice(0, 200)}); }
  }, 60);
}
const mark = () => walk.path.push([Math.round(performance.now() - walk.t0), walk.node.id, Math.round(((walk.yaw * 180 / Math.PI) % 360 + 360) % 360)]);
// The walk as positions and view directions, about 8 a second and only when something changes: enough to replay it.
const now = () => Math.round(performance.now() - walk.t0), tenth = v => Math.round(v * 10);
function sample() {
  if (walk.kind !== 'test' || walk.rec.length >= 5000) return;
  const v = [now(), tenth(walk.x), tenth(walk.z), tenth(walk.yaw * 180 / Math.PI), tenth(walk.pitch * 180 / Math.PI)], l = walk.rec[walk.rec.length - 1];
  if (l && (v[0] - l[0] < 125 || !v.slice(1).some((x, i) => x !== l[i + 1]))) return;
  if (l && v[0] - l[0] > 300) walk.rec.push([v[0] - 125, ...l.slice(1)]); // they stood still until here
  walk.rec.push(v);
}
const event = (e, id = '') => { if (walk.kind === 'test' && walk.events.length < 200) walk.events.push([now(), e, id]); };
const result = (w, chosen) => ({ms: Math.round(performance.now() - w.t0), hiddenMs: Math.round(w.hidden), readMs: S.readMs, chosen, path: w.path.slice(0, 1500), rec: w.rec, events: w.events});
let tipT, tipKeep = false; function tip(t, ms, keep = false) { clearTimeout(tipT); tipKeep = keep && !!t; $('tip').textContent = t; $('tip').hidden = !t; if (ms) tipT = setTimeout(() => $('tip').hidden = true, ms); }
const diff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function ahead() { let best = null, bd = .9; for (const id of walk.node.next) { const n = walk.nodes[id], d = Math.abs(diff(Math.atan2(n.x - walk.node.x, -(n.z - walk.node.z)), walk.yaw)); if (d < bd) { bd = d; best = id; } } return best; }
function go(id) { if (!walk || walk.moving || !id || !$('ask').hidden) return; walk.moving = true; walk.from = walk.node; walk.to = walk.nodes[id]; walk.k = 0; walk.street.arrows.visible = false; if (walk.kind === 'practice' && !tipKeep) tip(''); }
function back() { const y = walk.yaw; walk.yaw = y + Math.PI; const id = ahead(); walk.yaw = y; if (id) go(id); else tip('You can’t step back here.', 1800); }
function forward() { const id = ahead(); if (id) go(id); else tip('You can’t walk that way. Turn towards a street.', 2200); }
function loop(t) {
  if (!walk) return; const dt = Math.min(250, t - (walk.last || t)); walk.last = t;
  if (walk.turn && $('ask').hidden) { walk.yaw += walk.turn * dt * .0016; walk.dirty = true; }
  if (walk.moving) {
    walk.k = Math.min(1, walk.k + dt / 620); walk.x = walk.from.x + (walk.to.x - walk.from.x) * walk.k; walk.z = walk.from.z + (walk.to.z - walk.from.z) * walk.k; walk.dirty = true;
    if (walk.k === 1) { walk.moving = false; walk.node = walk.to; mark(); let id = null; if (walk.held) { const y = walk.yaw; if (walk.held < 0) walk.yaw += Math.PI; id = ahead(); walk.yaw = y; } if (id) go(id); else { walk.street.setArrows(walk.node, walk.nodes); walk.street.arrows.visible = true; } if (walk.kind === 'practice' && walk.node.id === 'p4') tip(matchMedia('(pointer:coarse)').matches ? 'This is the first side street. To turn: hold ▶ or ◀, or drag the picture.' : 'This is the first side street. To turn: hold D or A (▶ ◀), or drag the picture.'); if (walk.kind === 'practice' && walk.node.id === 'q1') tip('Count the buildings on each side. To choose one, stand in front of it, put the white dot on it and press “This is the building”.', 8000, true); }
  }
  if (walk.dirty) { walk.street.render(walk.x, walk.z, walk.yaw, walk.pitch); walk.dirty = false; }
  sample(); requestAnimationFrame(loop);
}
function bindCanvas(cv) {
  let p = null;
  cv.onpointerdown = e => { if (!p) { p = {id: e.pointerId, x: e.clientX, y: e.clientY, m: 0}; cv.setPointerCapture(e.pointerId); } };
  cv.onpointermove = e => { if (!p || e.pointerId !== p.id || !walk) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; p.m += Math.abs(dx) + Math.abs(dy); const s = 1.5 / Math.min(cv.clientWidth, 900); walk.yaw -= dx * s; walk.pitch = Math.max(-.6, Math.min(.95, walk.pitch + dy * s)); walk.dirty = true; };
  cv.onpointerup = e => { if (p && e.pointerId === p.id) { if (p.m < 8 && walk) go(walk.street.pick(e.clientX, e.clientY)); p = null; } };
  cv.onpointercancel = () => p = null;
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); $('loading').hidden = false; $('loading').textContent = 'The 3D view stopped. Please try another browser.'; });
}
function hold(el, on, off) { el.onpointerdown = e => { e.preventDefault(); el.setPointerCapture(e.pointerId); on(); }; el.onpointerup = el.onpointercancel = el.onlostpointercapture = off; el.oncontextmenu = e => e.preventDefault(); el.onclick = e => { if (e.detail === 0) { on(); setTimeout(off, 200); } }; }
hold($('fwd'), () => { if (walk) { walk.held = 1; forward(); } }, () => { if (walk) walk.held = 0; });
hold($('left'), () => walk && (walk.turn = -1), () => walk && (walk.turn = 0)); hold($('right'), () => walk && (walk.turn = 1), () => walk && (walk.turn = 0));
// by key position, so it also works with an Arabic keyboard layout
const KEYS = {KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r'}, down = new Set();
addEventListener('keydown', e => {
  const k = KEYS[e.code]; if (!k || !walk || !$('ask').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault(); if (e.repeat) return; down.add(k);
  if (k === 'f') { walk.held = 1; forward(); } else if (k === 'b') { walk.held = -1; back(); } else walk.turn = k === 'l' ? -1 : 1;
});
addEventListener('keyup', e => {
  const k = KEYS[e.code]; if (!k) return; down.delete(k); if (!walk) return;
  if (k === 'f' || k === 'b') walk.held = down.has('f') ? 1 : down.has('b') ? -1 : 0; else walk.turn = down.has('l') ? -1 : down.has('r') ? 1 : 0;
});
addEventListener('resize', () => { if (walk) { walk.street.resize(); walk.dirty = true; } });
document.addEventListener('visibilitychange', () => { if (!walk) return; if (document.hidden) { event('left the page'); if (walk.kind === 'test') saveQuiet({walk: at, data: result(walk, '')}); walk.away = performance.now(); walk.held = 0; walk.turn = 0; } else if (walk.away) { walk.hidden += performance.now() - walk.away; walk.away = 0; walk.dirty = true; event('came back'); } });
addEventListener('blur', () => { down.clear(); if (walk) { walk.held = 0; walk.turn = 0; } });
$('here').onclick = () => {
  if (!walk || walk.moving) return;
  walk.choice = facing(walk.w, walk.x, walk.z, walk.yaw);
  event(walk.choice ? 'asked' : 'too far', walk.choice?.id);
  if (!walk.choice) return tip('Walk up to the building and put the white dot on it, then press again.', 3500);
  walk.held = 0; walk.turn = 0; $('askP').hidden = walk.kind === 'practice'; $('ask').hidden = false; $('yes').focus();
};
$('no').onclick = () => { $('ask').hidden = true; event('kept walking'); };
$('yes').onclick = () => {
  if (!walk?.choice) return; const w = walk, id = w.choice.id; $('ask').hidden = true;
  if (w.kind === 'practice') {
    if (id !== w.w.target) { w.misses = (w.misses || 0) + 1; return tip({'P-a1': 'Not that one: that is the first building on the left. The directions said the second.', 'P-b': 'Not that one: that building is on the right. The directions said the left.', 'P-R1': 'Not that one: that building is on the right. The directions said the left.', 'P-N': 'Not that one. The directions said to take the first side street on the right.'}[id] || 'Not that one. The directions were: “' + PRACTICE.directions + '”', 6000); }
    end(); saveQuiet({practiceDone: true}); return ready();
  }
  mark(); event('chose', id); S.walks[at] = result(w, id);
  end(); saveQuiet({walk: at, data: S.walks[at]}); $('afterT').textContent = at + 1 < S.plan.length ? 'First walk done' : 'Second walk done'; show('after');
};
function end() { walk.street.dispose(); walk = null; }
begin();
