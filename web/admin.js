import {ROUTES as WORLD1, ROUTES2 as WORLD2, graph, bestPath} from './world.js';
import {Street} from './scene.js';
const $ = id => document.getElementById(id), TOKEN = location.pathname.split('admin-').pop();
let st, raw, STUDY = 2, ROUTES, G, BEST;
const studyOf = s => s.study || 1;
function use(n) { STUDY = n; ROUTES = n === 1 ? WORLD1 : WORLD2; G = Object.fromEntries(Object.keys(ROUTES).map(r => [r, graph(ROUTES[r])])); BEST = Object.fromEntries(Object.keys(ROUTES).map(r => [r, bestPath(ROUTES[r], G[r])])); }
use(2);
async function api(p, b = {}) { const r = await fetch('api/admin/' + p, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Admin': TOKEN}, body: JSON.stringify(b)}); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; }
const C = c => c ? 'coloured' : 'same', med = a => { a = a.filter(x => x != null && !isNaN(x)); if (!a.length) return '–'; a.sort((x, y) => x - y); const m = a.length >> 1; return (a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2).toFixed(1); }, avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '–';
const table = (el, d) => el.replaceChildren(...d.map((r, i) => { const tr = document.createElement('tr'); r.forEach(c => { const x = document.createElement(i ? 'td' : 'th'); x.textContent = c ?? ''; tr.append(x); }); return tr; }));
// every walk of every session, flat
const walksOf = s => (s.plan || []).map((p, i) => ({s, i, ...p, w: s.walks[i]})).filter(x => x.w);
// Corners on the direct route: first choice, whether it was right, time to decide
function corners(x) {
  const N = G[x.route], best = BEST[x.route], p = x.w.path, out = [];
  best.forEach((id, k) => {
    if (N[id].next.length < 3 || k === best.length - 1) return;
    const i = p.findIndex(q => q[1] === id); if (i < 0) return out.push({id, n: out.length + 1, reached: false});
    let j = i + 1; while (j < p.length && p[j][1] === id) j++;
    if (j >= p.length) return out.push({id, n: out.length + 1, reached: true, choice: 'stopped here', right: false, ms: null, at: p[i][0]});
    const to = p[j][1], a = i ? N[p[i - 1][1]] : null, n = N[id], t = N[to], ang = a ? Math.atan2((n.x - a.x) * (t.z - n.z) - (n.z - a.z) * (t.x - n.x), (n.x - a.x) * (t.x - n.x) + (n.z - a.z) * (t.z - n.z)) : 0;
    out.push({id, n: out.length + 1, reached: true, choice: Math.abs(ang) < .5 ? 'straight' : Math.abs(ang) > 2.6 ? 'back' : ang > 0 ? 'right' : 'left', right: to === best[k + 1], ms: Math.max(0, p[j][0] - 640 - p[i][0]), at: p[i][0]});
  });
  return out;
}
function stats(x) {
  const p = x.w.path, steps = p.slice(1).filter((q, i) => q[1] !== p[i][1]), ids = steps.map(q => q[1]), seen = [p[0]?.[1], ...ids]; let back = 0, pause = 0, pauseAt = 0;
  for (let i = 2; i < seen.length; i++) if (seen[i] === seen[i - 2]) back++;
  for (let i = 1; i < p.length; i++) { const g = p[i][0] - p[i - 1][0]; if (g > pause) { pause = g; pauseAt = p[i - 1][0]; } }
  const c = corners(x); return {moves: ids.length, back, off: ids.filter(i => !BEST[x.route].includes(i)).length, pause, pauseAt, first: steps.length ? Math.max(0, steps[0][0] - 640) : null, wrong: c.filter(k => k.reached && !k.right).length, decide: c.filter(k => k.ms != null).map(k => k.ms / 1000)};
}
// Did this person take part in an earlier study? 'same browser' is proven by the browser; 'said yes' is their answer.
const before = s => s.before ? 'yes, same browser (' + s.before.code + (s.before.finished ? '' : ', not finished') + ')' : s.about?.before === 'Yes' ? 'yes, they said' : s.about?.before === 'Not sure' ? 'not sure' : s.about?.before ? 'no' : '';
const returning = s => !!s.before || s.about?.before === 'Yes';
const WC = {study: x => studyOf(x.s), code: x => x.s.code, before: x => before(x.s), cell: x => x.s.cell + 1, preview: x => x.s.preview, status: x => x.s.status, walk: x => x.i + 1, route: x => x.route, banners: x => C(x.coloured), chosen: x => x.w.chosen, correct: x => x.w.correct, seconds: x => (x.w.ms / 1000).toFixed(1), away_seconds: x => (x.w.hiddenMs / 1000).toFixed(1), reading_seconds: x => (x.w.readMs / 1000).toFixed(1), seconds_to_first_move: x => stats(x).first == null ? '' : (stats(x).first / 1000).toFixed(1), moves: x => stats(x).moves, off_route: x => stats(x).off, turned_back: x => stats(x).back, wrong_first_choices: x => stats(x).wrong, median_decide_s: x => med(stats(x).decide), longest_stop_s: x => (stats(x).pause / 1000).toFixed(1), confidence: x => x.w.after?.confidence, ease: x => x.w.after?.ease, used: x => x.w.after?.used, remember: x => x.s.end?.remember, noticed: x => x.s.end?.noticed, banner_notes: x => x.s.end?.banners, sense: x => x.s.about?.sense, games: x => x.s.about?.games, colour_vision: x => x.s.about?.colour_vision, age: x => x.s.about?.age, gender: x => x.s.about?.gender, aubmc: x => x.s.about?.aubmc, noticed_lines: x => x.s.end?.lines, device: x => x.s.device, screen: x => x.s.screen, directions: x => x.directions, created: x => x.s.created};
const svg = (r, inner) => `<svg class="map" viewBox="${Math.min(...ROUTES[r].buildings.map(b => b.x0)) - 5} -265 315 300">${ROUTES[r].buildings.map(b => `<rect x="${b.x0}" y="${b.z0}" width="${b.x1 - b.x0}" height="${b.z1 - b.z0}" fill="${b.lot ? '#d9d6c6' : '#cfc8b8'}" ${b.id === ROUTES[r].target ? 'stroke="#a5343c" stroke-width="2"' : ''}/>`).join('')}${inner}</svg>`;
let ALL = [];
async function load(settings) {
  raw = await api('state'); raw.sessions.sort((a, b) => b.t - a.t); render(settings);
}
const ago = iso => { if (!iso) return '–'; const s = (Date.now() - new Date(iso)) / 1000; return s < 90 ? Math.round(s) + ' s ago' : s < 5400 ? Math.round(s / 60) + ' min ago' : new Date(iso).toLocaleString(); };
function showDeploy(d) {
  if (!d) return $('dep').textContent = 'Auto-deploy is not set up on this server.';
  const c = d.live || d.latest, gh = d.repo ? d.repo.replace(/\.git$/, '') : '';
  $('dep').replaceChildren(...[['Repository', gh ? gh + ' (' + d.branch + ')' : 'none set'], ['Last check', ago(d.checked) + ': ' + d.result], ['Live version', d.live ? d.live.sha.slice(0, 7) + ' “' + d.live.message + '” by ' + d.live.author + ', live since ' + ago(d.live_since) : 'as installed by hand']].map(([a, b]) => { const p = el('p'); p.append(el('strong', a + ': '), b); return p; }));
  if (gh) { const a = el('a', 'Open the repository'); a.href = gh; a.target = '_blank'; $('dep').append(a); }
}
function render(settings) {
  showDeploy(raw.deploy);
  const keep = s => studyOf(s) === STUDY && !(STUDY === 2 && $('newOnly').checked && returning(s));
  st = {...raw, sessions: raw.sessions.filter(keep)}; ALL = st.sessions.flatMap(walksOf);
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('alt', +b.dataset.tab !== STUDY)); document.querySelectorAll('.only2').forEach(e => e.hidden = STUDY !== 2);
  const s2 = raw.sessions.filter(s => studyOf(s) === 2 && !s.preview && s.status === 'complete');
  $('back').textContent = STUDY === 2 ? `Finished: ${s2.length}. Took part in study 1 before: ${s2.filter(s => s.before).length} shown by their browser, ${s2.filter(s => !s.before && s.about?.before === 'Yes').length} more said so, ${s2.filter(s => !s.before && s.about?.before === 'Not sure').length} not sure.` : 'Study 1: posters only, many on each route. Closed on 27 Nov; new participants go to study 2.';
  const ok = ALL.filter(x => !x.s.preview && x.s.status === 'complete'), H = ['Banners', 'Walks', 'Right building', 'Median s (right)', 'Median moves', 'Wrong first choices', 'Median s per corner', 'Sure 1–5', 'Easy 1–5'];
  const line = (n, a) => [n, a.length, a.filter(x => x.w.correct).length + ' of ' + a.length, med(a.filter(x => x.w.correct).map(x => x.w.ms / 1000)), med(a.map(x => stats(x).moves)), a.reduce((t, x) => t + stats(x).wrong, 0), med(a.flatMap(x => stats(x).decide)), avg(a.map(x => +x.w.after.confidence)), avg(a.map(x => +x.w.after.ease))];
  table($('sum'), [H, line('Same (today)', ok.filter(x => !x.coloured)), line('Coloured', ok.filter(x => x.coloured))]);
  const both = st.sessions.filter(s => !s.preview && s.status === 'complete' && s.plan?.length === 2).map(s => { const a = walksOf(s), p = a.find(x => !x.coloured), c = a.find(x => x.coloured); return p && c && {d: (c.w.ms - p.w.ms) / 1000, r: p.w.correct && c.w.correct, gain: c.w.correct - p.w.correct}; }).filter(Boolean);
  $('within').textContent = both.length ? `Same person, coloured minus same: median ${med(both.filter(b => b.r).map(b => b.d))} s (${both.filter(b => b.r).length} people right in both). Right only with colours: ${both.filter(b => b.gain > 0).length}. Right only without: ${both.filter(b => b.gain < 0).length}.` : '';
  table($('byroute'), [['Route', ...H], ...Object.keys(ROUTES).flatMap(r => [false, true].map(c => [r, ...line(C(c), ok.filter(x => x.route === r && x.coloured === c))]))]);
  table($('corners'), [['Route', 'Corner', 'Banners', 'Reached', 'Right first choice', 'Median s to decide', 'Wrong choices made'], ...Object.keys(ROUTES).flatMap(r => { const k = BEST[r].filter((id, i) => G[r][id].next.length > 2 && i < BEST[r].length - 1).length; return Array.from({length: k}, (_, n) => [false, true].map(c => { const a = ok.filter(x => x.route === r && x.coloured === c).map(x => corners(x)[n]).filter(q => q?.reached); return [r, n + 1, C(c), a.length, a.filter(q => q.right).length + ' of ' + a.length, med(a.filter(q => q.ms != null).map(q => q.ms / 1000)), a.filter(q => !q.right).map(q => q.choice).join(', ')]; })).flat(); })]);
  const cnt = i => st.sessions.filter(s => !s.preview && s.cell === i && s.status === 'complete').length;
  table($('cells'), [['Tester', 'First walk', 'Second walk', 'Finished'], ...st.cells.map((c, i) => [i + 1, c[0].route + ' ' + C(c[0].coloured), c[1].route + ' ' + C(c[1].coloured), cnt(i)])]);
  list(); table($('all'), [Object.keys(WC), ...ALL.map(x => Object.values(WC).map(f => f(x)))]);
  $('map').innerHTML = Object.keys(ROUTES).map(r => `<div><strong>${r}</strong>${svg(r, ok.filter(x => x.route === r).map(x => `<polyline points="${x.w.path.map(p => G[r][p[1]]).filter(Boolean).map(n => n.x + (x.coloured ? 1.2 : -1.2) + ',' + n.z).join(' ')}" fill="none" stroke="${x.coloured ? '#d0722a' : '#2c6c9c'}" stroke-opacity=".5" stroke-width="1.8"/>`).join('') + '<circle r="3"/>')}</div>`).join('');
  if (settings) {
    $('open').checked = st.config.open; $('dirs').replaceChildren(...Object.keys(WORLD2).flatMap(r => ['plain', 'coloured'].map(k => { const l = el('label', `${r}, ${k === 'plain' ? 'same posters, no lines' : 'coloured posters and lines'}`, 'f'), t = el('textarea'); t.rows = 3; t.id = 'd-' + r + k; t.value = st.config.directions2[r][k]; l.append(t); return l; })));
    $('pv').innerHTML = 'Study 2: ' + Object.keys(WORLD2).map(r => `${r} <a href="./?preview=2-${r}-plain" target="_blank">same</a> / <a href="./?preview=2-${r}-coloured" target="_blank">coloured</a>`).join(' · ') + '<br>Study 1: ' + Object.keys(WORLD1).map(r => `${r} <a href="./?preview=1-${r}-plain" target="_blank">same</a> / <a href="./?preview=1-${r}-coloured" target="_blank">coloured</a>`).join(' · ');
  }
}
$('refresh').onclick = () => load();
$('check').onclick = async () => {
  const before = raw.deploy?.checked; $('check').disabled = true; $('depMsg').textContent = 'Checking…';
  try { await api('check'); } catch (x) { $('depMsg').textContent = 'Could not ask: ' + x.message; $('check').disabled = false; return; }
  for (let i = 0; i < 45; i++) { // a new version restarts the server for a moment, so failed requests are retried
    await new Promise(r => setTimeout(r, 2000));
    try { const s = await api('state'); if (s.deploy?.checked && s.deploy.checked !== before) { await load(); $('depMsg').textContent = s.deploy.result; break; } } catch {}
    if (i === 44) $('depMsg').textContent = 'No answer from the deploy job yet. Press Refresh in a minute.';
  }
  $('check').disabled = false;
};
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { stopReplay(); $('one').hidden = true; use(+b.dataset.tab); render(); });
$('newOnly').onchange = () => render();
$('f').onsubmit = async e => { e.preventDefault(); try { await api('config', {open: $('open').checked, directions2: Object.fromEntries(Object.keys(WORLD2).map(r => [r, {plain: $('d-' + r + 'plain').value, coloured: $('d-' + r + 'coloured').value}]))}); $('msg').textContent = 'Saved.'; } catch (x) { $('msg').textContent = 'Not saved: ' + x.message; } };
$('del').onclick = async () => { const code = $('code').value.trim().toUpperCase(); if (!confirm('Delete all data for ' + code + '? This can’t be undone.')) return; try { await api('delete', {code}); $('code').value = ''; load(); } catch (x) { alert(x.message); } };
const down = (name, rows) => { const q = v => { v = String(v ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replaceAll('"', '""') + '"'; }, a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(q).join(',')).join('\n')], {type: 'text/csv'})); a.download = name; a.click(); };
$('csv').onclick = () => down('walks-study' + STUDY + '.csv', [Object.keys(WC), ...ALL.map(x => Object.values(WC).map(f => f(x)))]);
$('csv2').onclick = () => down('corners-study' + STUDY + '.csv', [['study', 'code', 'before', 'preview', 'status', 'walk', 'route', 'banners', 'corner', 'node', 'reached', 'first_choice', 'right', 'arrived_s', 'decide_s'], ...ALL.flatMap(x => corners(x).map(k => [STUDY, x.s.code, before(x.s), x.s.preview, x.s.status, x.i + 1, x.route, C(x.coloured), k.n, k.id, k.reached, k.choice, k.right, k.at == null ? '' : (k.at / 1000).toFixed(1), k.ms == null ? '' : (k.ms / 1000).toFixed(1)]))]);

/* ---- one participant ---- */
const T = ms => Math.floor(ms / 60000) + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0');
const el = (t, text, cls) => { const e = document.createElement(t); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
const describe = (r, id) => { const b = ROUTES[r].buildings.find(b => b.id === id); if (!b) return id || '–'; return id === ROUTES[r].target ? 'the right building' : 'a wrong building (' + id + (b.banner ? ', with a banner' : ', no banner') + ')'; };
function list() {
  const t = $('list'); t.replaceChildren(); const h = el('tr'); ['', 'Code', 'Before', 'Tester', 'Walk', 'Banners', 'Status', 'Chose', 'Time', 'Moves', 'Off route', 'Wrong corners', 'Sure', 'Easy', 'Device', 'When'].forEach(x => h.append(el('th', x))); t.append(h);
  for (const s of st.sessions.filter(s => s.consent || s.walks?.length)) {
    const when = new Date(s.t * 1000).toLocaleString(), rows = walksOf(s), base = [s.code, before(s) || '–', s.preview ? 'preview' : s.cell >= 0 ? s.cell + 1 : '–'];
    if (!rows.length) { const r = el('tr'); r.append(el('td')); [...base, '–', '–', s.plan ? 'no walk yet' : 'earlier version', ...Array(8).fill('–'), when].forEach(x => r.append(el('td', x))); t.append(r); continue; }
    for (const x of rows) { const r = el('tr'), b = el('button', 'View', 'alt'), c = el('td'), q = stats(x); b.onclick = () => view(x); c.append(b); r.append(c); [...base, x.route, C(x.coloured), s.status === 'complete' ? 'finished' : 'not finished', x.w.chosen ? (x.w.correct ? 'Right' : 'Wrong') : '–', T(x.w.ms), q.moves, q.off, q.wrong, x.w.after?.confidence ?? '–', x.w.after?.ease ?? '–', s.device, when].forEach(v => r.append(el('td', v))); t.append(r); }
  }
}
const frames = x => x.w.rec.map(f => [f[0], f[1] / 10, f[2] / 10, f[3] / 10, f[4] / 10]);
let R = null;
function stopReplay() { if (R) { R.on = false; R.street.dispose(); R = null; } }
function view(x) {
  const {s, w} = x, best = BEST[x.route]; stopReplay(); $('one').hidden = false; $('oneT').textContent = `${s.code} · walk ${x.i + 1} · ${x.route} · ${C(x.coloured)} banners`;
  const q = stats(x), dl = el('dl'), add = (a, b) => { if (b !== undefined && b !== null && b !== '') dl.append(el('dt', a), el('dd', b)); };
  add('Result', w.chosen ? 'Chose ' + describe(x.route, w.chosen) : 'Never chose a building'); add('Time walking', T(w.ms) + (w.hiddenMs > 500 ? ' (' + T(w.hiddenMs) + ' away from the page)' : '')); add('Reading directions', (w.readMs / 1000).toFixed(1) + ' s'); add('Until first move', q.first == null ? '' : (q.first / 1000).toFixed(1) + ' s'); add('Moves', q.moves + ' (direct route to its door: ' + (best.length - 1) + ')'); add('Moves off the route', q.off); add('Turned back', q.back + ' times'); add('Longest stop', (q.pause / 1000).toFixed(1) + ' s, at ' + T(q.pauseAt));
  corners(x).forEach(k => add('Corner ' + k.n, !k.reached ? 'not reached' : `${k.choice}${k.right ? '' : ' (wrong)'}${k.ms == null ? '' : ', ' + (k.ms / 1000).toFixed(1) + ' s to decide'}`));
  add('How sure', w.after && w.after.confidence + ' of 5'); add('How easy', w.after && w.after.ease + ' of 5'); add('What helped', w.after?.used); add('Remembers', s.end?.remember); add('Noticed banners', s.end?.noticed); add('About the banners', s.end?.banners); add('Finds their way', s.about && s.about.sense + ' of 5'); add('3D games', s.about?.games); add('Trouble with colours', s.about?.colour_vision); add('Age', s.about?.age); add('Gender', s.about?.gender); add('Knows AUBMC', s.about?.aubmc); add('Took part before', before(s)); add('Noticed lines on the road', s.end?.lines); add('Device', s.device + ', ' + s.screen); add('Directions shown', x.directions); add('Problem', s.problem); add('Started', new Date(s.t * 1000).toLocaleString());
  $('facts').replaceChildren(dl); $('log').replaceChildren(); $('mini').innerHTML = '';
  const F = frames(x), has = F.length > 1; $('play').disabled = $('seek').disabled = !has; document.querySelector('.stage').hidden = !has;
  $('note').textContent = has ? 'Replayed from their position and view direction, in their screen shape.' : 'No walk was recorded.';
  $('one').scrollIntoView({behavior: 'smooth'}); if (!has) return;
  const items = [[0, 'Started walking']]; let off = false; w.path.forEach(([t, id], i) => { const o = !best.includes(id); if (i && o !== off) items.push([t, o ? 'Left the direct route' : 'Back on the direct route']); off = o; });
  const E = {'asked': id => 'Pressed “This is the building” facing ' + describe(x.route, id), 'too far': () => 'Pressed “This is the building” with none close enough', 'kept walking': () => 'Changed their mind and kept walking', 'chose': id => 'Confirmed ' + describe(x.route, id), 'left the page': () => 'Left the page', 'came back': () => 'Came back'};
  w.events.forEach(([t, e, id]) => items.push([t, E[e] ? E[e](id) : e])); const p = w.path; for (let i = 1; i < p.length; i++) if (p[i][0] - p[i - 1][0] > 4000) items.push([p[i - 1][0], 'Stopped for ' + ((p[i][0] - p[i - 1][0]) / 1000).toFixed(1) + ' s']);
  items.sort((a, b) => a[0] - b[0]).forEach(([t, what]) => { const li = el('li'), b = el('button', T(t), 'quiet'); b.onclick = () => { seek(t); }; li.append(b, ' ' + what); $('log').append(li); });
  const [sw, sh] = (s.screen || '').split('x').map(Number), box = document.querySelector('.stage'), a = sw && sh ? sw / sh : 1.6, H = box.clientHeight, W = box.clientWidth, cw = Math.min(W, H * a), ch = cw / a;
  const cv = document.createElement('canvas'); cv.id = 'rv'; cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; $('rv').replaceWith(cv);
  const street = new Street(cv, ROUTES[x.route], x.coloured); street.resize();
  $('mini').innerHTML = svg(x.route, `<polyline points="${best.map(i => G[x.route][i].x + ',' + G[x.route][i].z).join(' ')}" fill="none" stroke="#777" stroke-dasharray="3 3"/><polyline points="${F.map(f => f[1] + ',' + f[2]).join(' ')}" fill="none" stroke="#2c6c9c" stroke-width="2"/><g id="me"><path d="M0 0L-9 -20L9 -20Z" fill="#2c6c9c" opacity=".35"/><circle r="4" fill="#2c6c9c"/></g>`) + '<p class="small muted">Dashed: direct way. Blue: their way.</p>';
  R = {on: false, F, street, t: 0, end: Math.max(w.ms, F[F.length - 1][0])}; $('seek').max = R.end; $('play').textContent = 'Play'; seek(0);
}
function seek(t) {
  if (!R) return; R.t = Math.max(0, Math.min(R.end, t)); const F = R.F; let i = 0; while (i < F.length - 2 && F[i + 1][0] <= R.t) i++;
  const a = F[i], b = F[i + 1], k = Math.max(0, Math.min(1, (R.t - a[0]) / Math.max(1, b[0] - a[0]))), m = j => a[j] + (b[j] - a[j]) * k;
  R.street.render(m(1), m(2), m(3) * Math.PI / 180, m(4) * Math.PI / 180); $('me').setAttribute('transform', `translate(${m(1)} ${m(2)}) rotate(${m(3)})`); $('seek').value = R.t; $('clock').textContent = T(R.t) + ' / ' + T(R.end);
}
$('seek').oninput = () => seek(+$('seek').value);
$('play').onclick = () => { if (!R) return; if (R.on) { R.on = false; $('play').textContent = 'Play'; return; } if (R.t >= R.end) seek(0); const me = R; me.on = true; $('play').textContent = 'Pause'; let last = performance.now(); const tick = n => { if (R !== me || !me.on) return; seek(me.t + (n - last) * +$('speed').value); last = n; if (me.t >= me.end) { me.on = false; $('play').textContent = 'Play'; } else requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
load(true).catch(e => $('msg').textContent = e.message);
