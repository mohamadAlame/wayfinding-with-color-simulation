import {Street} from './scene.js';
import {TEST, PRACTICE, graph, facing} from './world.js';
const $ = id => document.getElementById(id), q = new URLSearchParams(location.search), preview = q.get('preview');
const KEY = 'finding-a-building', store = {get: () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }, set: v => { if (!preview) try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }};
let S, cfg, walk = null;
const show = id => { document.querySelectorAll('main>section').forEach(s => s.hidden = s.id !== 's-' + id); $('page').hidden = false; $('walk').hidden = true; scrollTo(0, 0); };
const message = (t, p) => { $('msgT').textContent = t; $('msgP').textContent = p; show('msg'); };
document.querySelectorAll('.opts').forEach(el => el.dataset.o.split('|').forEach(o => { const l = document.createElement('label'), i = document.createElement('input'); i.type = 'radio'; i.name = el.dataset.q; i.value = o; i.required = true; l.append(i, o); el.append(l); }));
const answers = f => Object.fromEntries(new FormData(f));
async function api(path, body) {
  const r = await fetch('api/' + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), keepalive: true});
  const j = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(j.error || 'No connection.'), {status: r.status}); return j;
}
const save = part => api('save', {code: S.code, token: S.token, ...part});
const saveQuiet = part => save(part).catch(() => setTimeout(() => save(part).catch(() => {}), 3000));
async function begin() {
  const old = preview ? {} : store.get();
  if (old.stage === 'done') return message('You already took part', 'Thank you! Your code is ' + old.code + '.');
  if (old.stage === 'test') return message('This session has ended', 'The page was reloaded after the directions were shown, so it can’t be continued. Thank you for trying. Your code is ' + old.code + '.');
  try { S = await api('start', {preview: preview || '', code: old.code || '', token: old.token || '', device: matchMedia('(pointer:coarse)').matches ? 'phone/tablet' : 'computer', screen: innerWidth + 'x' + innerHeight}); }
  catch (e) { return e.status === 423 ? message('The study is closed', 'Thank you for your interest.') : message('Something went wrong', 'Please check your connection and reload the page.'); }
  store.set({code: S.code, token: S.token, stage: 'start'});
  document.querySelectorAll('[data-code]').forEach(e => e.textContent = S.code); show('welcome');
}
$('c1').onchange = () => $('agree').disabled = !$('c1').checked;
$('agree').onclick = () => { saveQuiet({consent: true}); show('about'); };
$('aboutForm').onsubmit = e => { e.preventDefault(); saveQuiet({about: answers(e.target)}); show('practice'); };
$('goPractice').onclick = $('again').onclick = () => startWalk('practice');
$('goDirections').onclick = () => { $('say').textContent = S.directions; store.set({code: S.code, token: S.token, stage: 'test'}); saveQuiet({directionsShown: true}); S.readFrom = performance.now(); show('directions'); };
$('goTest').onclick = () => { S.readMs = Math.round(performance.now() - S.readFrom); $('say').textContent = ''; startWalk('test'); };
$('afterForm').onsubmit = async e => {
  e.preventDefault(); const b = e.target.querySelector('button'); b.disabled = true; $('saveErr').textContent = '';
  try { await save({after: answers(e.target), test: S.test, complete: true}); store.set({code: S.code, token: S.token, stage: 'done'}); show('thanks'); }
  catch { $('saveErr').textContent = 'Not saved. Check your connection and press Finish again.'; b.disabled = false; }
};
$('erase').onclick = async () => { if (!confirm('Delete all your answers? This can’t be undone.')) return; try { await api('erase', {code: S.code, token: S.token}); message('Deleted', 'Your answers were deleted. Thank you anyway.'); } catch { alert('Could not delete. Please try again.'); } };

/* ---- walking ---- */
function startWalk(kind) {
  $('page').hidden = true; $('walk').hidden = false; $('loading').hidden = false; $('loading').textContent = 'Loading the street…'; $('ask').hidden = true; $('tip').hidden = true;
  setTimeout(() => {
    try {
      const w = kind === 'test' ? TEST : PRACTICE, nodes = graph(w), n = nodes[w.start.node];
      // a fresh canvas each time: a disposed WebGL canvas can't be reused reliably
      const cv = document.createElement('canvas'); cv.id = 'cv'; $('cv').replaceWith(cv); bindCanvas(cv);
      const street = new Street(cv, w, S.mode, S.targetColour);
      walk = {kind, w, nodes, node: n, x: n.x, z: n.z, yaw: w.start.yaw, pitch: .06, street, path: [], moving: false, held: false, turn: 0, hidden: 0, t0: performance.now(), last: 0, dirty: true};
      street.resize(); street.setArrows(n, nodes); street.render(walk.x, walk.z, walk.yaw, walk.pitch); mark();
      requestAnimationFrame(() => { $('loading').hidden = true; walk.t0 = performance.now(); if (kind === 'practice') tip('Drag to look around. Hold “Walk” to go forward.'); requestAnimationFrame(loop); });
    } catch (e) { console.error(e); $('loading').textContent = 'This device could not show the 3D street. Please try another browser or a computer.'; saveQuiet({problem: String(e).slice(0, 200)}); }
  }, 60);
}
const mark = () => walk.path.push([Math.round(performance.now() - walk.t0), walk.node.id, Math.round(((walk.yaw * 180 / Math.PI) % 360 + 360) % 360)]);
let tipT; function tip(t, ms) { clearTimeout(tipT); $('tip').textContent = t; $('tip').hidden = !t; if (ms) tipT = setTimeout(() => $('tip').hidden = true, ms); }
const diff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function ahead() { let best = null, bd = .9; for (const id of walk.node.next) { const n = walk.nodes[id], d = Math.abs(diff(Math.atan2(n.x - walk.node.x, -(n.z - walk.node.z)), walk.yaw)); if (d < bd) { bd = d; best = id; } } return best; }
function go(id) { if (!walk || walk.moving || !id || !$('ask').hidden) return; walk.moving = true; walk.from = walk.node; walk.to = walk.nodes[id]; walk.k = 0; walk.street.arrows.visible = false; if (walk.kind === 'practice') tip(''); }
function forward() { const id = ahead(); if (id) go(id); else tip('You can’t walk that way. Turn towards a street.', 2200); }
function loop(t) {
  if (!walk) return; const dt = Math.min(250, t - (walk.last || t)); walk.last = t;
  if (walk.turn && $('ask').hidden) { walk.yaw += walk.turn * dt * .0016; walk.dirty = true; }
  if (walk.moving) {
    walk.k = Math.min(1, walk.k + dt / 620); walk.x = walk.from.x + (walk.to.x - walk.from.x) * walk.k; walk.z = walk.from.z + (walk.to.z - walk.from.z) * walk.k; walk.dirty = true;
    if (walk.k === 1) { walk.moving = false; walk.node = walk.to; mark(); const id = walk.held && ahead(); if (id) go(id); else { walk.street.setArrows(walk.node, walk.nodes); walk.street.arrows.visible = true; } if (walk.kind === 'practice' && walk.node.id === 'p4') tip('Now put the white dot on the building ahead and press “This is the building”.'); }
  }
  if (walk.dirty) { walk.street.render(walk.x, walk.z, walk.yaw, walk.pitch); walk.dirty = false; }
  requestAnimationFrame(loop);
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
hold($('fwd'), () => { if (walk) { walk.held = true; forward(); } }, () => { if (walk) walk.held = false; });
hold($('left'), () => walk && (walk.turn = -1), () => walk && (walk.turn = 0)); hold($('right'), () => walk && (walk.turn = 1), () => walk && (walk.turn = 0));
addEventListener('keydown', e => { if (!walk || !$('ask').hidden) return; if (e.key === 'ArrowUp') { walk.held = true; if (!e.repeat) forward(); } else if (e.key === 'ArrowLeft') walk.turn = -1; else if (e.key === 'ArrowRight') walk.turn = 1; else return; e.preventDefault(); });
addEventListener('keyup', e => { if (!walk) return; if (e.key === 'ArrowUp') walk.held = false; if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') walk.turn = 0; });
addEventListener('resize', () => { if (walk) { walk.street.resize(); walk.dirty = true; } });
document.addEventListener('visibilitychange', () => { if (!walk) return; if (document.hidden) { walk.away = performance.now(); walk.held = false; walk.turn = 0; } else if (walk.away) { walk.hidden += performance.now() - walk.away; walk.away = 0; walk.dirty = true; } });
addEventListener('blur', () => { if (walk) { walk.held = false; walk.turn = 0; } });
$('here').onclick = () => {
  if (!walk || walk.moving) return;
  walk.choice = facing(walk.w, walk.x, walk.z, walk.yaw);
  if (!walk.choice) return tip('Walk up to the building and put the white dot on it, then press again.', 3500);
  walk.held = false; walk.turn = 0; $('askP').hidden = walk.kind === 'practice'; $('ask').hidden = false; $('yes').focus();
};
$('no').onclick = () => $('ask').hidden = true;
$('yes').onclick = () => {
  const w = walk, id = w.choice.id; $('ask').hidden = true;
  if (w.kind === 'practice') { if (id !== w.w.target) return tip('Not that one. Choose the building straight ahead, at the end of the street.', 4000); end(); saveQuiet({practiceDone: true}); return show('ready'); }
  mark(); S.test = {ms: Math.round(performance.now() - w.t0), hiddenMs: Math.round(w.hidden), readMs: S.readMs, chosen: id, correct: id === w.w.target, path: w.path.slice(0, 1500)};
  end(); saveQuiet({test: S.test}); show('after');
};
function end() { walk.street.dispose(); walk = null; }
begin();
