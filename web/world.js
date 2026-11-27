// Four made-up neighbourhoods plus a practice street. Metres; x = east, z = south, so "straight on" from the start is -z.
// Every route is the same length (about 250 m), has two turns and ends at the second building on one side.
// A route's streets and buildings are identical in both conditions; only banner colours differ.
export const COLOURS = {red:'#a6544f', blue:'#6f9fb4', yellow:'#c5a35c', purple:'#7d7094', green:'#5f8f70', pink:'#bd8d9c', brown:'#8f7561'};
const B = (id, x0, x1, z0, z1, face, style, floors, o = {}) => ({id, x0, x1, z0, z1, face, style, floors, ...o});
const lot = (id, x0, x1, z0, z1, face, kind) => ({id, x0, x1, z0, z1, face, kind, lot: true});
// Streets around the start, shared by both layouts
const avenue = () => [
  B('S', -26, 26, 14, 30, 'n', 'concrete', 5), B('N', -26, 26, -222, -202, 's', 'stone', 6),
  B('A-L1', -25, -7.5, -16, 13, 'e', 'balcony', 6), B('A-L2', -25, -7, -52, -19, 'e', 'glass', 6, {banner: 'pink'}),
  B('A-L3', -25, -7.5, -84, -68, 'e', 'old', 3), lot('A-Lp', -25, -7.5, -104, -86, 'e', 'parking'), B('A-L4', -25, -7.5, -122, -106, 'e', 'balcony', 5),
  B('A-L5', -25, -7.5, -168, -138, 'e', 'white', 5), B('A-L6', -25, -7.5, -201, -171, 'e', 'stone', 5),
  B('A-R1', 7.5, 25, -10, 13, 'w', 'old', 3), B('A-R1b', 7.5, 25, -30, -11.5, 'w', 'balcony', 7), B('A-R2', 7.5, 25, -52, -33, 'w', 'concrete', 4),
  B('A-R3', 7.5, 25, -90, -68, 'w', 'brick', 4), B('A-R4', 6.5, 25, -122, -93, 'w', 'stone', 7, {banner: 'brown'}),
  B('A-R5', 7.5, 25, -160, -138, 'w', 'balcony', 6), lot('A-Rp', 7.5, 25, -180, -162, 'w', 'site'), B('A-R6', 7.5, 25, -201, -182, 'w', 'white', 5),
  B('1-e', -50, -28, -86, -68, 's', 'balcony', 5), lot('1-ep', -66, -52, -86, -68, 's', 'park'), B('1-f', -89, -68, -86, -68, 's', 'concrete', 4),
  B('1-g', -58, -28, -52, -35, 'n', 'white', 5), B('1-h', -89, -60, -52, -35, 'n', 'old', 3),
  B('2-g', -56, -28, -156, -138, 's', 'old', 3), B('2-h', -89, -59, -156, -138, 's', 'glass', 5),
  B('2-i', -58, -28, -122, -105, 'n', 'balcony', 6), B('2-j', -89, -60, -122, -105, 'n', 'brick', 4),
  B('C1W', -108, -90, -80, -40, 'e', 'balcony', 5), B('C2W', -108, -90, -150, -110, 'e', 'brick', 4),
];
// the two side streets off the cross street: t is the cross street's z
const sides = (t, first) => {
  const z = v => t + v, D = first ? 'D' : 'E', E = first ? 'E' : 'D', x1 = 80, x2 = 150;
  const row = (n, cx, main) => [
    B(n + '-R1', cx + 7.5, cx + 25, z(-30), z(-7.5), 'w', 'stone', 4),
    B(n + '-R2', cx + 6, cx + 25, z(-56), z(-33), 'w', 'stone', 7, main ? {banner: 'target'} : {banner: 'blue'}),
    B(n + '-R3', cx + 7.5, cx + 25, z(-81), z(-59), 'w', main ? 'balcony' : 'concrete', 4),
    main ? B(n + '-R4', cx + 6, cx + 25, z(-110), z(-84), 'w', 'stone', 6, {banner: 'b2'}) : B(n + '-R4', cx + 7.5, cx + 25, z(-110), z(-84), 'w', 'white', 4),
    B(n + '-L1', cx - 25, cx - 7.5, z(-33), z(-7.5), 'e', main ? 'concrete' : 'balcony', 4),
    main ? B(n + '-L2', cx - 25, cx - 6, z(-60), z(-36), 'e', 'stone', 6, {banner: 'b3'}) : B(n + '-L2', cx - 25, cx - 7.5, z(-60), z(-36), 'e', 'brick', 5),
    lot(n + '-L3', cx - 25, cx - 7.5, z(-84), z(-63), 'e', main ? 'parking' : 'park'),
    main ? B(n + '-L4', cx - 25, cx - 6, z(-110), z(-87), 'e', 'glass', 6, {banner: 'b4'}) : B(n + '-L4', cx - 25, cx - 7.5, z(-110), z(-87), 'e', 'old', 3),
    B(n + 'N', cx - 24, cx + 24, z(-132), z(-114), 's', main ? 'concrete' : 'balcony', 5),
  ];
  return [...row('D', x1, first), ...row('E', x2, !first), B('X', 107, 122, z(-26), z(-8), 's', 'old', 3),
    B('T-E', 180, 198, z(-20), z(20), 'w', 'balcony', 6), B('T-c', 28, 50, z(8), z(25), 'n', 'balcony', 5), lot('T-p', 52, 72, z(8), z(25), 'n', 'parking'), B('T-d', 74, 98, z(8), z(25), 'n', 'stone', 6), B('T-e', 100, 124, z(8), z(25), 'n', 'old', 3), B('T-f', 126, 150, z(8), z(25), 'n', 'white', 5), B('T-g', 153, 179, z(8), z(25), 'n', 'balcony', 4),
    B('T-a', 28, 52, z(-26), z(-8), 's', 'brick', 4)];
};
// "second, then first": the turn is at the second cross street
const layout2 = () => ({start: {node: 'a0', yaw: 0}, target: 'D-R2',
  buildings: [...avenue(), ...sides(-130, true), B('C1E', 90, 108, -80, -40, 'w', 'brick', 5), B('1-a', 28, 58, -86, -68, 's', 'old', 3), B('1-b', 60, 89, -86, -67.5, 's', 'glass', 5), B('1-c', 28, 54, -52, -35, 'n', 'balcony', 5), lot('1-d', 57, 89, -52, -35, 'n', 'parking')],
  blocks: [[-130,-4,-270,-134],[4,76,-270,-134],[84,146,-270,-134],[154,210,-270,-134],[-130,-4,-126,-64],[4,210,-126,-64],[-130,-4,-56,40],[4,210,-56,40]],
  lines: [['a', 0, 0, 0, -190], ['b', -80, -60, 80, -60], ['c', -80, -130, 170, -130], ['d', 80, -130, 80, -230], ['e', 150, -130, 150, -230]]});
// "first, then second": the turn is at the first cross street
const layout1 = () => ({start: {node: 'a0', yaw: 0}, target: 'E-R2',
  buildings: [...avenue(), ...sides(-60, false), B('C2E', 46, 53, -150, -110, 'w', 'concrete', 5), B('2-a', 28, 45, -156, -138, 's', 'balcony', 5), B('2-c', 28, 45, -122, -105, 'n', 'old', 3)],
  blocks: [[-130,-4,-56,40],[4,210,-56,40],[-130,-4,-126,-64],[4,76,-126,-64],[84,146,-270,-64],[154,210,-270,-64],[-130,-4,-270,-134],[4,76,-270,-134],[44,76,-134,-126]],
  lines: [['a', 0, 0, 0, -190], ['b', -80, -60, 170, -60], ['c', -80, -130, 40, -130], ['d', 80, -60, 80, -160], ['e', 150, -60, 150, -160]]});
function finish(w, {mirror, seed, colours, target, posters}) {
  const key = posters ? {target, ...posters} : {target, blue: colours[0], pink: colours[1], brown: colours[2], b2: colours[3], b3: colours[4], b4: colours[5]};
  if (posters) { const c = w.target === 'D-R2' ? 'C1W' : 'C2W'; w.buildings = w.buildings.map(b => b.id === c ? {...b, banner: 'cross'} : b); }
  const swap = {stone: 'stone', glass: 'glass', concrete: ['concrete', 'white', 'brick', 'balcony'], brick: ['brick', 'old', 'balcony', 'concrete'], old: ['old', 'brick', 'white', 'old'], white: ['white', 'concrete', 'old', 'brick'], balcony: ['balcony', 'balcony', 'concrete', 'balcony']};
  w.buildings = w.buildings.map((b, i) => {
    b = {...b}; if (b.banner) b.banner = key[b.banner] || undefined;
    // a different look for each neighbourhood; buildings with banners keep their shape in all four
    if (!b.lot && !b.banner && Array.isArray(swap[b.style])) { b.style = swap[b.style][(i * 7 + seed * 3) % 4]; b.floors = Math.max(3, b.floors + ((i * 5 + seed) % 3) - 1); if (/^[DE]-/.test(b.id)) b.floors = Math.min(b.floors, 4); if (b.style === 'old') b.floors = Math.min(b.floors, 3); }
    if (b.lot && !/^[DE]-/.test(b.id)) b.kind = ['parking', 'park', 'site', 'parking'][(i + seed) % 4];
    if (mirror) { [b.x0, b.x1] = [-b.x1, -b.x0]; b.face = {e: 'w', w: 'e'}[b.face] || b.face; }
    return b;
  });
  if (mirror) { w.blocks = w.blocks.map(([a, b, c, d]) => [-b, -a, c, d]); w.lines = w.lines.map(([n, a, b, c, d]) => [n, -a, b, -c, d]); }
  return {...w, seed, targetColour: target};
}
export const ROUTES = {
  R1: finish(layout2(), {mirror: false, seed: 1, target: 'red', colours: ['blue', 'pink', 'brown', 'yellow', 'purple', 'green']}),
  R2: finish(layout1(), {mirror: true, seed: 2, target: 'yellow', colours: ['blue', 'brown', 'green', 'purple', 'red', 'pink']}),
  R3: finish(layout2(), {mirror: true, seed: 3, target: 'purple', colours: ['blue', 'green', 'pink', 'red', 'yellow', 'brown']}),
  R4: finish(layout1(), {mirror: false, seed: 4, target: 'green', colours: ['blue', 'yellow', 'brown', 'pink', 'red', 'purple']}),
};
// Study 2: four posters per route, each colour once (the right building, the same spot on the other side street,
// one on the avenue, one down the other cross street), and in the coloured walk a line of each colour on the road.
export const ROUTES2 = {
  R1: finish(layout2(), {mirror: false, seed: 1, target: 'red', posters: {blue: 'blue', brown: 'yellow', cross: 'green'}}),
  R2: finish(layout1(), {mirror: true, seed: 2, target: 'yellow', posters: {blue: 'purple', brown: 'red', cross: 'blue'}}),
  R3: finish(layout2(), {mirror: true, seed: 3, target: 'purple', posters: {blue: 'green', brown: 'blue', cross: 'red'}}),
  R4: finish(layout1(), {mirror: false, seed: 4, target: 'green', posters: {blue: 'red', brown: 'purple', cross: 'yellow'}}),
};
for (const w of Object.values(ROUTES2)) w.guides = true;
export const PRACTICE = {seed: 9,
  start: {node: 'p0', yaw: 0}, target: 'P-a2', directions: 'Btemsho deghre, btekhdo awal mafra2 3al yamin. Btkoun tene bineye 3al shmel.',
  buildings: [
    B('P-end', 66, 84, -62, -20, 'w', 'stone', 4), B('P-S', -20, 20, 12, 28, 'n', 'brick', 4), B('P-N', -26, 4.5, -76, -58, 's', 'balcony', 5),
    B('P-L1', -25, -7.5, -14, 11, 'e', 'old', 3), B('P-L2', -25, -7.5, -57, -17, 'e', 'concrete', 4), B('P-R1', 7.5, 25, -32, 11, 'w', 'white', 4),
    B('P-a1', 7.5, 28, -66, -47.5, 's', 'brick', 4), B('P-a2', 31, 54, -66, -47.5, 's', 'glass', 5), lot('P-ap', 56, 64, -66, -47.5, 's', 'park'),
    B('P-b', 27, 55, -32, -14, 'n', 'balcony', 5),
  ],
  blocks: [[-40,-4,-70,40],[4,90,-36,40],[4,90,-90,-44]], lines: [['p', 0, 0, 0, -40], ['q', 0, -40, 60, -40]],
};
// Walking points every 10 m, joined where streets cross.
export function graph(w) {
  const by = new Map(), nodes = {};
  for (const [n, x0, z0, x1, z1] of w.lines) {
    const k = Math.round(Math.hypot(x1 - x0, z1 - z0) / 10); let prev = null;
    for (let i = 0; i <= k; i++) {
      const x = x0 + (x1 - x0) * i / k, z = z0 + (z1 - z0) * i / k, key = x + ',' + z;
      let id = by.get(key);
      if (!id) { id = n + i; by.set(key, id); nodes[id] = {id, x, z, next: []}; }
      if (prev) { nodes[prev].next.push(id); nodes[id].next.push(prev); }
      prev = id;
    }
  }
  return nodes;
}
// The building straight ahead within reach. yaw 0 looks along -z; positive turns right.
export function facing(w, x, z, yaw, reach = 20) {
  const dx = Math.sin(yaw), dz = -Math.cos(yaw); let best = null, bd = reach;
  for (const b of w.buildings) {
    if (b.lot) continue;
    let t0 = 0, t1 = 1e9;
    for (const [o, d, lo, hi] of [[x, dx, b.x0, b.x1], [z, dz, b.z0, b.z1]]) {
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) t1 = -1; continue; }
      const a = (lo - o) / d, c = (hi - o) / d; t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c));
    }
    if (t0 <= t1 && t0 < bd) { bd = t0; best = b; }
  }
  return best;
}
// Shortest way from the start to the point outside a building (the right one by default)
export const bestPath = (w, N = graph(w)) => pathTo(w, w.target, N);
export function pathTo(w, id, N = graph(w)) {
  const t = w.buildings.find(b => b.id === id), cz = (t.z0 + t.z1) / 2, d = n => Math.hypot(n.x - Math.max(t.x0, Math.min(t.x1, n.x)), n.z - cz);
  const goal = Object.values(N).reduce((a, n) => d(n) < d(a) ? n : a).id, from = {[w.start.node]: null}, q = [w.start.node];
  for (const c of q) for (const k of N[c].next) if (!(k in from)) { from[k] = c; q.push(k); }
  const p = []; for (let c = goal; c; c = from[c]) p.unshift(c); return p;
}
