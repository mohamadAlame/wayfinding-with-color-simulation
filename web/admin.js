import {TEST, graph} from './world.js';
import {Street} from './scene.js';
const $ = id => document.getElementById(id), TOKEN = location.pathname.split('admin-').pop();
let st;
async function api(p, b = {}) { const r = await fetch('api/admin/' + p, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Admin': TOKEN}, body: JSON.stringify(b)}); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; }
const M = {plain: 'A', banner: 'B'}, N = graph(TEST);
const COL = {code: s => s.code, mode: s => M[s.mode], preview: s => s.preview, status: s => s.status, chosen: s => s.test?.chosen, correct: s => s.test?.correct, seconds: s => s.test && (s.test.ms / 1000).toFixed(1), away_seconds: s => s.test && (s.test.hiddenMs / 1000).toFixed(1), reading_seconds: s => s.test && (s.test.readMs / 1000).toFixed(1), moves: s => s.test && stats(s).moves, off_route: s => s.test && stats(s).off, turned_back: s => s.test && stats(s).back, longest_stop_s: s => s.test && (stats(s).pause / 1000).toFixed(1), confidence: s => s.after?.confidence, ease: s => s.after?.ease, used: s => s.after?.used, sense: s => s.about?.sense, games: s => s.about?.games, colour_vision: s => s.about?.colour_vision, device: s => s.device, screen: s => s.screen, target_colour: s => s.shown?.targetColour, directions: s => s.shown?.directions, problem: s => s.problem, created: s => s.created};
const table = (el, d) => el.replaceChildren(...d.map((r, i) => { const tr = document.createElement('tr'); r.forEach(c => { const x = document.createElement(i ? 'td' : 'th'); x.textContent = c ?? ''; tr.append(x); }); return tr; }));
const med = a => { if (!a.length) return '–'; a.sort((x, y) => x - y); const m = a.length >> 1; return (a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2).toFixed(1); }, avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '–';
async function load(settings) {
  st = await api('state'); const ok = st.sessions.filter(s => !s.preview && s.status === 'complete');
  table($('sum'), [['Mode', 'Finished', 'Started, not finished', 'Right building', 'Median s (right)', 'Median moves', 'Sure 1–5', 'Easy 1–5'], ...['plain', 'banner'].map(m => { const a = ok.filter(s => s.mode === m), f = a.filter(s => s.test.correct); return [m === 'plain' ? 'A · same banners' : 'B · coloured banners', a.length, st.sessions.filter(s => !s.preview && s.mode === m && s.consent && s.status !== 'complete').length, f.length + ' of ' + a.length, med(f.map(s => s.test.ms / 1000)), med(a.map(s => stats(s).moves)), avg(a.map(s => +s.after.confidence)), avg(a.map(s => +s.after.ease))]; })]);
  list();
  table($('all'), [Object.keys(COL), ...st.sessions.map(s => Object.values(COL).map(f => f(s)))]);
  const P = s => s.test.path.map(p => N[p[1]]).filter(Boolean).map((n, i) => `${n.x + (s.mode === 'plain' ? -1.2 : 1.2)},${n.z}`).join(' ');
  $('map').innerHTML = `<svg class="map" viewBox="-110 -265 310 300">${TEST.buildings.map(b => `<rect x="${b.x0}" y="${b.z0}" width="${b.x1 - b.x0}" height="${b.z1 - b.z0}" fill="#cfc8b8" ${b.id === TEST.target ? 'stroke="#a5343c" stroke-width="2"' : ''}/>`).join('')}${ok.map(s => `<polyline points="${P(s)}" fill="none" stroke="${s.mode === 'plain' ? '#2c6c9c' : '#d0722a'}" stroke-opacity=".5" stroke-width="1.6"/>`).join('')}<circle cx="0" cy="0" r="3"/></svg>`;
  if (settings) { const c = st.config; $('open').checked = c.open; $('assign').value = c.assign; $('da').value = c.directions.plain; $('db').value = c.directions.banner; $('col').value = c.targetColour; }
}
$('refresh').onclick = () => load();
$('f').onsubmit = async e => { e.preventDefault(); try { await api('config', {open: $('open').checked, assign: $('assign').value, targetColour: $('col').value, directions: {plain: $('da').value, banner: $('db').value}}); $('msg').textContent = 'Saved.'; } catch (x) { $('msg').textContent = 'Not saved: ' + x.message; } };
$('del').onclick = async () => { const code = $('code').value.trim().toUpperCase(); if (!confirm('Delete all data for ' + code + '? This can’t be undone.')) return; try { await api('delete', {code}); $('code').value = ''; load(); } catch (x) { alert(x.message); } };
$('csv').onclick = () => { const q = v => { v = String(v ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replaceAll('"', '""') + '"'; }; const t = [Object.keys(COL), ...st.sessions.map(s => Object.values(COL).map(f => f(s)))].map(r => r.map(q).join(',')).join('\n'), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + t], {type: 'text/csv'})); a.download = 'banner-study.csv'; a.click(); };

/* ---- one participant ---- */
const T = ms => Math.floor(ms / 60000) + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0');
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
// shortest way from the start to the point outside the right building
const BEST = (() => { const t = TEST.buildings.find(b => b.id === TEST.target), goal = Object.values(N).reduce((a, n) => Math.hypot(n.x - t.x0, n.z - (t.z0 + t.z1) / 2) < Math.hypot(a.x - t.x0, a.z - (t.z0 + t.z1) / 2) ? n : a).id, from = {[TEST.start.node]: null}, q = [TEST.start.node]; for (const c of q) for (const k of N[c].next) if (!(k in from)) { from[k] = c; q.push(k); } const p = []; for (let c = goal; c; c = from[c]) p.unshift(c); return p; })();
const describe = id => { const b = TEST.buildings.find(b => b.id === id); if (!b) return id || '–'; return id === TEST.target ? 'the right building' : 'a wrong building (' + id + (b.banner ? ', with a banner' : ', no banner') + ', ' + ({D: 'right street', E: 'one street too far', A: 'on the first street', 1: 'on the first cross street', 2: 'on the second cross street'}[id[0]] || 'end of a street') + ')'; };
function stats(s) {
  const p = s.test.path, steps = p.slice(1).filter((x, i) => x[1] !== p[i][1]), ids = steps.map(x => x[1]); let back = 0, off = 0, pause = 0, pauseAt = 0;
  const seen = [p[0]?.[1], ...ids]; for (let i = 2; i < seen.length; i++) if (seen[i] === seen[i - 2]) back++;
  off = ids.filter(i => !BEST.includes(i)).length;
  for (let i = 1; i < p.length; i++) { const g = p[i][0] - p[i - 1][0]; if (g > pause) { pause = g; pauseAt = p[i - 1][0]; } }
  return {moves: ids.length, back, off, pause, pauseAt};
}
function list() {
  const t = $('list'); t.replaceChildren(); const h = el('tr'); ['', 'Code', 'Mode', 'Status', 'Chose', 'Time', 'Moves', 'Off route', 'Sure', 'Easy', 'Device', 'When'].forEach(x => h.append(el('th', x))); t.append(h);
  for (const s of [...st.sessions].filter(s => s.consent || s.test).sort((a, b) => b.t - a.t)) {
    const r = el('tr'), b = el('button', 'View', 'alt'), c = el('td'), q = s.test && stats(s); b.onclick = () => view(s); c.append(b); r.append(c);
    [s.code, M[s.mode] + (s.preview ? ' (preview)' : ''), s.status === 'complete' ? 'finished' : 'not finished', s.test?.chosen ? (s.test.correct ? 'Right' : 'Wrong') : '–', s.test ? T(s.test.ms) : '–', q?.moves ?? '–', q?.off ?? '–', s.after?.confidence ?? '–', s.after?.ease ?? '–', s.device, new Date(s.t * 1000).toLocaleString()].forEach(x => r.append(el('td', x))); t.append(r);
  }
}
// older sessions have no view recording: rebuild an approximate one from the points they passed
function frames(s) {
  if (s.test.rec?.length) return s.test.rec.map(f => [f[0], f[1] / 10, f[2] / 10, f[3] / 10, f[4] / 10]);
  const out = []; let yaw = null;
  for (const [t, id, h] of s.test.path) { const n = N[id]; if (!n) continue; yaw = yaw === null ? h : yaw + ((h - yaw + 540) % 360 - 180); const l = out[out.length - 1]; if (l && t - l[0] > 620) out.push([t - 620, l[1], l[2], yaw, 3]); out.push([t, n.x, n.z, yaw, 3]); }
  return out;
}
let R = null;
function stopReplay() { if (R) { R.on = false; R.street.dispose(); R = null; } }
function view(s) {
  stopReplay(); $('one').hidden = false; $('oneT').textContent = s.code + ' · mode ' + M[s.mode];
  const q = s.test && stats(s), dl = el('dl'), add = (a, b) => { if (b !== undefined && b !== null && b !== '') dl.append(el('dt', a), el('dd', b)); };
  add('Result', s.test?.chosen ? 'Chose ' + describe(s.test.chosen) : 'Never chose a building');
  if (s.test) { add('Time walking', T(s.test.ms) + (s.test.hiddenMs > 500 ? ' (' + T(s.test.hiddenMs) + ' away from the page)' : '')); add('Reading directions', (s.test.readMs / 1000).toFixed(1) + ' s'); add('Moves', q.moves + ' (direct route to its door: ' + (BEST.length - 1) + ')'); add('Moves off the route', q.off); add('Turned back', q.back + ' times'); add('Longest stop', (q.pause / 1000).toFixed(1) + ' s, at ' + T(q.pauseAt)); }
  add('How sure', s.after && s.after.confidence + ' of 5'); add('How easy', s.after && s.after.ease + ' of 5'); add('What helped', s.after?.used); add('Finds their way', s.about && s.about.sense + ' of 5'); add('3D games', s.about?.games); add('Trouble with colours', s.about?.colour_vision); add('Device', s.device + ', ' + s.screen); add('Directions shown', s.shown?.directions); add('Problem', s.problem); add('Started', new Date(s.t * 1000).toLocaleString());
  $('facts').replaceChildren(dl); $('log').replaceChildren(); $('mini').innerHTML = '';
  const F = s.test ? frames(s) : [], has = F.length > 1; $('play').disabled = $('seek').disabled = !has; document.querySelector('.stage').hidden = !has;
  $('note').textContent = !has ? 'No walk was recorded for this person.' : s.test.rec?.length ? 'Replayed from their position and view direction, in their screen shape.' : 'Recorded before replays existed: the route and times are real, but where they looked between points is approximate.';
  $('one').scrollIntoView({behavior: 'smooth'}); if (!has) return;
  const items = [[0, 'Started walking']]; let off = false; s.test.path.forEach(([t, id], i) => { const o = !BEST.includes(id); if (i && o !== off) items.push([t, o ? 'Left the direct route' : 'Back on the direct route']); off = o; });
  const E = {'asked': id => 'Pressed “This is the building” facing ' + describe(id), 'too far': () => 'Pressed “This is the building” with none close enough', 'kept walking': () => 'Changed their mind and kept walking', 'chose': id => 'Confirmed ' + describe(id), 'left the page': () => 'Left the page', 'came back': () => 'Came back'};
  (s.test.events || []).forEach(([t, e, id]) => items.push([t, E[e] ? E[e](id) : e])); const p = s.test.path; for (let i = 1; i < p.length; i++) if (p[i][0] - p[i - 1][0] > 4000) items.push([p[i - 1][0], 'Stopped for ' + ((p[i][0] - p[i - 1][0]) / 1000).toFixed(1) + ' s']);
  items.sort((a, b) => a[0] - b[0]).forEach(([t, x]) => { const li = el('li'), b = el('button', T(t), 'quiet'); b.onclick = () => { seek(t); }; li.append(b, ' ' + x); $('log').append(li); });
  const [sw, sh] = (s.screen || '').split('x').map(Number), box = document.querySelector('.stage'), a = sw && sh ? sw / sh : 1.6, H = box.clientHeight, W = box.clientWidth, w = Math.min(W, H * a), h = w / a;
  const cv = document.createElement('canvas'); cv.id = 'rv'; cv.style.width = w + 'px'; cv.style.height = h + 'px'; $('rv').replaceWith(cv);
  const street = new Street(cv, TEST, s.mode, s.shown?.targetColour); street.resize();
  $('mini').innerHTML = `<svg class="map" viewBox="-110 -265 310 300">${TEST.buildings.map(b => `<rect x="${b.x0}" y="${b.z0}" width="${b.x1 - b.x0}" height="${b.z1 - b.z0}" fill="#cfc8b8" ${b.id === TEST.target ? 'stroke="#a5343c" stroke-width="2"' : ''}/>`).join('')}<polyline points="${BEST.map(i => N[i].x + ',' + N[i].z).join(' ')}" fill="none" stroke="#777" stroke-dasharray="3 3"/><polyline points="${F.map(f => f[1] + ',' + f[2]).join(' ')}" fill="none" stroke="#2c6c9c" stroke-width="2"/><g id="me"><path d="M0 0L-9 -20L9 -20Z" fill="#2c6c9c" opacity=".35"/><circle r="4" fill="#2c6c9c"/></g></svg><p class="small muted">Dashed: direct way. Blue: their way.</p>`;
  R = {on: false, F, street, t: 0, end: Math.max(s.test.ms, F[F.length - 1][0])}; $('seek').max = R.end; $('play').textContent = 'Play'; seek(0);
}
function seek(t) {
  if (!R) return; R.t = Math.max(0, Math.min(R.end, t)); const F = R.F; let i = 0; while (i < F.length - 2 && F[i + 1][0] <= R.t) i++;
  const a = F[i], b = F[i + 1], k = Math.max(0, Math.min(1, (R.t - a[0]) / Math.max(1, b[0] - a[0]))), m = j => a[j] + (b[j] - a[j]) * k;
  R.street.render(m(1), m(2), m(3) * Math.PI / 180, m(4) * Math.PI / 180); $('me').setAttribute('transform', `translate(${m(1)} ${m(2)}) rotate(${m(3)})`); $('seek').value = R.t; $('clock').textContent = T(R.t) + ' / ' + T(R.end);
}
$('seek').oninput = () => seek(+$('seek').value);
$('play').onclick = () => { if (!R) return; if (R.on) { R.on = false; $('play').textContent = 'Play'; return; } if (R.t >= R.end) seek(0); const me = R; me.on = true; $('play').textContent = 'Pause'; let last = performance.now(); const tick = n => { if (R !== me || !me.on) return; seek(me.t + (n - last) * +$('speed').value); last = n; if (me.t >= me.end) { me.on = false; $('play').textContent = 'Play'; } else requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
load(true).catch(e => $('msg').textContent = e.message);
