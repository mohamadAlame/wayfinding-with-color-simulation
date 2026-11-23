// The made-up streets. Metres; x = east, z = south, so "straight on" from the start is -z.
// Buildings are the same in both modes; only banner colours differ.
export const COLOURS = {red:'#a6544f', blue:'#6f9fb4', yellow:'#c5a35c', purple:'#7d7094', teal:'#5f8f89', pink:'#bd8d9c', brown:'#8f7561'};
const B = (id, x0, x1, z0, z1, face, style, floors, o = {}) => ({id, x0, x1, z0, z1, face, style, floors, ...o});
export const TEST = {
  start: {node: 'a0', yaw: 0},
  target: 'D-R2',
  buildings: [
    // behind the start, and street ends
    B('S', -26, 26, 14, 30, 'n', 'concrete', 5), B('N', -26, 26, -222, -202, 's', 'stone', 6),
    B('C1W', -108, -90, -80, -40, 'e', 'concrete', 5), B('C1E', 90, 108, -80, -40, 'w', 'brick', 5),
    B('C2W', -108, -90, -150, -110, 'e', 'brick', 4), B('C2E', 180, 198, -150, -110, 'w', 'concrete', 6),
    B('DN', 56, 104, -262, -244, 's', 'concrete', 5), B('EN', 126, 174, -236, -218, 's', 'brick', 5),
    // avenue, left side
    B('A-L1', -25, -7.5, -16, 13, 'e', 'stone', 4), B('A-L2', -25, -7, -52, -19, 'e', 'glass', 6, {banner: 'pink'}),
    B('A-L3', -25, -7.5, -93, -68, 'e', 'brick', 5), B('A-L4', -25, -7.5, -122, -95, 'e', 'concrete', 4),
    B('A-L5', -25, -7.5, -168, -138, 'e', 'glass', 5), B('A-L6', -25, -7.5, -201, -171, 'e', 'stone', 5),
    // avenue, right side
    B('A-R1', 7.5, 25, -22, 13, 'w', 'brick', 5), B('A-R2', 7.5, 25, -52, -24, 'w', 'concrete', 4),
    B('A-R3', 7.5, 25, -90, -68, 'w', 'stone', 4), B('A-R4', 6.5, 25, -122, -93, 'w', 'stone', 7, {banner: 'brown'}),
    B('A-R5', 7.5, 25, -170, -138, 'w', 'concrete', 5), B('A-R6', 7.5, 25, -201, -172, 'w', 'brick', 6),
    // first cross street
    B('1-a', 28, 58, -86, -68, 's', 'concrete', 4), B('1-b', 60, 89, -86, -67.5, 's', 'glass', 5),
    B('1-c', 28, 54, -52, -35, 'n', 'brick', 4), B('1-d', 57, 89, -52, -35, 'n', 'stone', 6),
    B('1-e', -56, -28, -86, -68, 's', 'stone', 5), B('1-f', -89, -59, -86, -68, 's', 'concrete', 4),
    B('1-g', -58, -28, -52, -35, 'n', 'concrete', 5), B('1-h', -89, -60, -52, -35, 'n', 'brick', 4),
    // second cross street
    B('2-a', 28, 52, -156, -138, 's', 'brick', 4), B('2-b', 107, 122, -156, -138, 's', 'stone', 4),
    B('2-c', 28, 56, -122, -105, 'n', 'concrete', 5), B('2-d', 59, 96, -122, -105, 'n', 'stone', 6),
    B('2-e', 99, 134, -122, -105, 'n', 'brick', 4), B('2-f', 137, 179, -122, -105, 'n', 'glass', 5),
    B('2-g', -56, -28, -156, -138, 's', 'concrete', 4), B('2-h', -89, -59, -156, -138, 's', 'glass', 5),
    B('2-i', -58, -28, -122, -105, 'n', 'stone', 5), B('2-j', -89, -60, -122, -105, 'n', 'brick', 4),
    // the destination street (first left): right side, then left side
    B('D-R1', 87.5, 105, -160, -137.5, 'w', 'stone', 4),
    B('D-R2', 86, 105, -186, -163, 'w', 'stone', 7, {banner: 'red'}),
    B('D-R3', 87.5, 105, -211, -189, 'w', 'concrete', 4),
    B('D-R4', 86, 105, -240, -214, 'w', 'stone', 6, {banner: 'yellow'}),
    B('D-L1', 54, 72.5, -163, -137.5, 'e', 'concrete', 4),
    B('D-L2', 54, 74, -190, -166, 'e', 'stone', 6, {banner: 'purple'}),
    B('D-L3', 54, 72.5, -214, -193, 'e', 'brick', 4),
    B('D-L4', 54, 74, -240, -217, 'e', 'glass', 6, {banner: 'teal'}),
    // the street after it
    B('E-R1', 157.5, 175, -164, -137.5, 'w', 'brick', 4), B('E-R2', 156, 175, -190, -167, 'w', 'stone', 6, {banner: 'blue'}), B('E-R3', 157.5, 175, -216, -193, 'w', 'concrete', 5),
    B('E-L1', 124, 142.5, -162, -137.5, 'e', 'concrete', 4), B('E-L2', 124, 142.5, -188, -165, 'e', 'brick', 5), B('E-L3', 124, 142.5, -216, -191, 'e', 'stone', 4),
  ],
  // kerbed blocks between the roads
  blocks: [[-130,-4,-270,-134],[4,76,-270,-134],[84,146,-270,-134],[154,210,-270,-134],[-130,-4,-126,-64],[4,210,-126,-64],[-130,-4,-56,40],[4,210,-56,40]],
  lines: [['a', 0, 0, 0, -190], ['1', -80, -60, 80, -60], ['2', -80, -130, 170, -130], ['d', 80, -130, 80, -230], ['e', 150, -130, 150, -210]],
};
export const PRACTICE = {
  start: {node: 'p0', yaw: 0}, target: 'P-end',
  buildings: [
    B('P-end', -20, 20, -76, -58, 's', 'stone', 4), B('P-S', -20, 20, 12, 28, 'n', 'brick', 4),
    B('P-L1', -25, -7.5, -20, 11, 'e', 'concrete', 4), B('P-L2', -25, -7.5, -57, -23, 'e', 'brick', 4),
    B('P-R1', 7.5, 25, -25, 11, 'w', 'stone', 5), B('P-R2', 7.5, 25, -57, -28, 'w', 'concrete', 4),
  ],
  blocks: [[-40,-4,-57,40],[4,40,-57,40],[-40,40,-90,-57]],
  lines: [['p', 0, 0, 0, -40]],
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
    let t0 = 0, t1 = 1e9;
    for (const [o, d, lo, hi] of [[x, dx, b.x0, b.x1], [z, dz, b.z0, b.z1]]) {
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) t1 = -1; continue; }
      const a = (lo - o) / d, c = (hi - o) / d; t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c));
    }
    if (t0 <= t1 && t0 < bd) { bd = t0; best = b; }
  }
  return best;
}
