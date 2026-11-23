import * as T from './three.module.min.js';
import {COLOURS} from './world.js';
const FH = 3.4, GH = 4.4;
function rng(seed) { let s = seed >>> 0; return () => ((s = Math.imul(s ^ s >>> 15, 1 | s) + 0x6D2B79F5 | 0, ((s ^ s >>> 14) >>> 0) / 4294967296)); }
function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}
function speckle(g, w, h, n, r, a) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,255,255'},${a * r()})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); } }
// One facade tile is 4 bays by 4 floors
function facade(style) {
  return canvasTex(512, 512, (g, W, H) => {
    const r = rng(style.length * 77 + 5), S = 128;
    const wall = {stone: '#d8cbb2', concrete: '#c6c2b8', brick: '#bfa288', glass: '#7f969b'}[style];
    g.fillStyle = wall; g.fillRect(0, 0, W, H); speckle(g, W, H, 5000, r, .07);
    const pane = (x, y, w, h) => {
      const k = g.createLinearGradient(x, y, x + w, y + h), d = r() * 18;
      k.addColorStop(0, `rgb(${142 + d},${164 + d},${175 + d})`); k.addColorStop(.55, `rgb(${92 + d},${112 + d},${123 + d})`); k.addColorStop(1, `rgb(${120 + d},${142 + d},${152 + d})`);
      g.fillStyle = k; g.fillRect(x, y, w, h);
      if (r() < .4) { g.fillStyle = `rgba(226,218,200,${.3 + r() * .3})`; g.fillRect(x, y, w, h * (.2 + r() * .5)); }
    };
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = i * S, y = j * S;
      if (style === 'glass') {
        pane(x + 4, y + 4, 120, 88); g.fillStyle = '#5e7379'; g.fillRect(x, y + 96, S, 32);
        g.fillStyle = '#c9cfcd'; g.fillRect(x, y, 5, S); g.fillRect(x, y + 93, S, 4);
      } else if (style === 'stone') {
        g.fillStyle = 'rgba(60,45,25,.28)'; g.fillRect(x + 37, y + 23, 58, 84); pane(x + 41, y + 27, 50, 76);
        g.fillStyle = '#efe8d8'; g.fillRect(x + 34, y + 105, 64, 5); g.fillStyle = '#d9dcd8'; g.fillRect(x + 65, y + 27, 3, 76);
        g.fillStyle = 'rgba(80,65,40,.13)'; g.fillRect(x, y, S, 2); g.fillRect(x, y + 64, S, 1);
      } else if (style === 'concrete') {
        g.fillStyle = 'rgba(40,40,40,.25)'; g.fillRect(x + 10, y + 27, 108, 62); pane(x + 14, y + 31, 100, 54);
        g.fillStyle = '#e1ded6'; g.fillRect(x, y + 98, S, 8); g.fillStyle = '#8b8f8e'; g.fillRect(x + 62, y + 31, 4, 54);
      } else {
        g.fillStyle = 'rgba(70,35,20,.10)'; for (let k = 0; k < 16; k++) g.fillRect(x, y + k * 8, S, 1);
        g.fillStyle = '#e4d6bf'; g.fillRect(x + 28, y + 18, 72, 92); pane(x + 34, y + 24, 60, 80);
        g.fillStyle = '#e8e0d0'; g.fillRect(x + 62, y + 24, 4, 80); g.fillRect(x + 34, y + 56, 60, 3);
      }
    }
  });
}
// Ground floor: one tile is 2 bays by one storey
const ground = () => canvasTex(512, 256, (g, W, H) => {
  const r = rng(9); g.fillStyle = '#b9b0a0'; g.fillRect(0, 0, W, H); speckle(g, W, H, 2500, r, .08);
  for (let i = 0; i < 2; i++) {
    const x = i * 256; g.fillStyle = '#5d6d73'; g.fillRect(x + 30, 46, 196, 190);
    const k = g.createLinearGradient(x + 30, 46, x + 226, 236); k.addColorStop(0, 'rgba(190,210,215,.5)'); k.addColorStop(.5, 'rgba(60,75,80,.1)'); k.addColorStop(1, 'rgba(160,180,185,.3)'); g.fillStyle = k; g.fillRect(x + 30, 46, 196, 190);
    g.fillStyle = '#8d918e'; g.fillRect(x + 92, 46, 5, 190); g.fillRect(x + 159, 46, 5, 190); g.fillRect(x + 30, 92, 196, 4);
  }
  g.fillStyle = '#8f8778'; g.fillRect(0, 236, W, 20); g.fillStyle = '#d6cfbf'; g.fillRect(0, 0, W, 14);
});
function bannerTex(colour) {
  return canvasTex(512, 1024, (g, W, H) => {
    g.fillStyle = colour; g.fillRect(0, 0, W, H); g.fillStyle = '#efeee9'; g.fillRect(0, 700, W, 324);
    g.strokeStyle = g.fillStyle = '#f5f4ef'; g.lineWidth = 7; g.beginPath(); g.arc(256, 210, 88, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(256, 135); g.lineTo(312, 225); g.lineTo(276, 225); g.lineTo(276, 275); g.lineTo(236, 275); g.lineTo(236, 225); g.lineTo(200, 225); g.fill();
    g.textAlign = 'center'; g.font = '58px Georgia,serif'; g.fillText('UNIVERSITY', 256, 400); g.fillText('MEDICAL', 256, 465); g.fillText('CENTER', 256, 530);
    g.font = '44px sans-serif'; g.fillText('المركز الطبي', 256, 620);
    g.fillStyle = colour; g.font = '74px Verdana,sans-serif'; g.fillText('Pioneering', 256, 845); g.fillText('Healthcare', 256, 935);
    const k = g.createLinearGradient(0, 0, W, 0); for (let i = 0; i <= 8; i++) k.addColorStop(i / 8, `rgba(0,0,0,${i % 2 ? .07 : 0})`); g.fillStyle = k; g.fillRect(0, 0, W, H);
  }, false);
}
// Collects quads into one mesh per material, so phones draw little
class Bag {
  constructor() { this.m = {}; }
  get(k) { return this.m[k] ||= {p: [], n: [], u: [], c: []}; }
  quad(k, a, b, c, d, n, uw = 1, uh = 1, tint = [1, 1, 1], shade) {
    const o = this.get(k), P = [a, b, c, a, c, d], U = [[0, 0], [uw, 0], [uw, uh], [0, 0], [uw, uh], [0, uh]];
    P.forEach((p, i) => { o.p.push(...p); o.n.push(...n); o.u.push(...U[i]); const s = shade && U[i][1] === 0 ? shade : 1; o.c.push(tint[0] * s, tint[1] * s, tint[2] * s); });
  }
  // sides of a box given in plan; f picks material and uv per side
  walls(x0, x1, z0, z1, y0, y1, f) {
    const h = y1 - y0;
    for (const [s, a, b, n, w] of [['s', [x0, z1], [x1, z1], [0, 0, 1], x1 - x0], ['n', [x1, z0], [x0, z0], [0, 0, -1], x1 - x0], ['e', [x1, z1], [x1, z0], [1, 0, 0], z1 - z0], ['w', [x0, z0], [x0, z1], [-1, 0, 0], z1 - z0]]) {
      const [k, uw, uh, tint, shade] = f(s, w, h);
      this.quad(k, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], n, uw, uh, tint, shade);
    }
  }
  box(k, x0, x1, y0, y1, z0, z1, tint) {
    this.walls(x0, x1, z0, z1, y0, y1, () => [k, 1, 1, tint]);
    this.quad(k, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], 1, 1, tint);
  }
  geo(k, g, x, y, z, sx, sy, sz, tint, vary) {
    g = g.index ? g.toNonIndexed() : g; const o = this.get(k), P = g.attributes.position, N = g.attributes.normal;
    for (let i = 0; i < P.count; i++) {
      o.p.push(P.getX(i) * sx + x, P.getY(i) * sy + y, P.getZ(i) * sz + z); o.n.push(N.getX(i), N.getY(i), N.getZ(i)); o.u.push(0, 0);
      const v = vary ? vary(P.getY(i), i) : 1; o.c.push(tint[0] * v, tint[1] * v, tint[2] * v);
    }
  }
  meshes(mats, scene) {
    for (const [k, o] of Object.entries(this.m)) {
      const g = new T.BufferGeometry();
      for (const [n, a, s] of [['position', o.p, 3], ['normal', o.n, 3], ['uv', o.u, 2], ['color', o.c, 3]]) g.setAttribute(n, new T.Float32BufferAttribute(a, s));
      const m = new T.Mesh(g, mats[k]); m.castShadow = k !== 'road' && k !== 'paint'; m.receiveShadow = true; scene.add(m);
    }
  }
}
const hex = h => { const c = new T.Color(h); return [c.r, c.g, c.b]; };
export class Street {
  constructor(canvas, world, mode, targetColour) {
    this.world = world; this.canvas = canvas;
    const R = this.renderer = new T.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
    R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.toneMapping = T.LinearToneMapping; R.toneMappingExposure = 1.28;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; R.shadowMap.autoUpdate = false;
    const s = this.scene = new T.Scene(); s.fog = new T.Fog('#cfdde6', 70, 330);
    this.camera = new T.PerspectiveCamera(60, 1, .2, 700); this.camera.rotation.order = 'YXZ';
    s.add(new T.HemisphereLight('#dfe9f0', '#b5a78f', 1.75));
    const sun = new T.DirectionalLight('#fff1da', 1.75); sun.position.set(-60 + 40, 130, 75 - 100); sun.target.position.set(40, 0, -110);
    sun.castShadow = true; sun.shadow.mapSize.set(matchMedia('(max-width:700px)').matches ? 2048 : 4096, matchMedia('(max-width:700px)').matches ? 2048 : 4096);
    Object.assign(sun.shadow.camera, {left: -190, right: 190, top: 190, bottom: -190, near: 1, far: 420}); sun.shadow.bias = -.0006; sun.shadow.normalBias = .35;
    s.add(sun, sun.target);
    this.sky(); this.build(mode, targetColour); R.shadowMap.needsUpdate = true;
    this.arrows = new T.Group(); s.add(this.arrows);
  }
  sky() {
    const tex = canvasTex(1024, 512, (g, W, H) => {
      const k = g.createLinearGradient(0, 0, 0, H * .55); k.addColorStop(0, '#4f8fca'); k.addColorStop(.6, '#9cc3e2'); k.addColorStop(1, '#d9e5ea'); g.fillStyle = k; g.fillRect(0, 0, W, H);
      const r = rng(31);
      for (let i = 0; i < 16; i++) { const x = r() * W, y = H * (.2 + r() * .24); for (let j = 0; j < 9; j++) { const q = 10 + r() * 28, px = x + (r() - .5) * 120, py = y + (r() - .5) * 12; const a = g.createRadialGradient(px, py, 0, px, py, q); a.addColorStop(0, 'rgba(255,255,255,.22)'); a.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = a; g.fillRect(px - q, py - q, q * 2, q * 2); } }
    });
    const m = new T.Mesh(new T.SphereGeometry(500, 32, 16), new T.MeshBasicMaterial({map: tex, side: T.BackSide, fog: false, toneMapped: false})); m.position.set(40, 0, -110); this.scene.add(m);
  }
  build(mode, targetColour) {
    const w = this.world, bag = new Bag(), r = rng(4), L = o => new T.MeshLambertMaterial({vertexColors: true, ...o});
    const mats = {plain: L({}), two: L({side: T.DoubleSide}), leaf: L({}), road: L({map: canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#73757a'; g.fillRect(0, 0, W, H); speckle(g, W, H, 6000, rng(2), .12); })}),
      pave: L({map: canvasTex(128, 128, (g, W, H) => { g.fillStyle = '#c3bcae'; g.fillRect(0, 0, W, H); speckle(g, W, H, 900, rng(3), .1); g.strokeStyle = 'rgba(70,60,45,.25)'; g.lineWidth = 2; for (let i = 0; i < 128; i += 64) { g.strokeRect(0, i, 128, 64); g.strokeRect(i, 0, 64, 128); } })}),
      paint: L({polygonOffset: true, polygonOffsetFactor: -2}), ground: L({map: ground()})};
    for (const k of ['stone', 'concrete', 'brick', 'glass']) mats[k] = L({map: facade(k)});
    const flat = (k, x0, x1, z0, z1, y, uv, tint) => bag.quad(k, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], (x1 - x0) / uv, (z1 - z0) / uv, tint);
    flat('road', -220, 300, -380, 160, 0, 7);
    for (const [x0, x1, z0, z1] of w.blocks) { flat('pave', x0, x1, z0, z1, .15, 2.4); bag.walls(x0, x1, z0, z1, 0, .15, () => ['plain', 1, 1, hex('#a39c90')]); }
    // centre dashes and zebra crossings
    for (const [, x0, z0, x1, z1] of w.lines) {
      const n = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / n, dz = (z1 - z0) / n;
      for (let t = 3; t < n; t += 6) { const x = x0 + dx * t, z = z0 + dz * t; if (w.lines.some(l => (l[1] === l[3]) !== (x0 === x1) && (dx ? Math.abs(x - l[1]) < 8 : Math.abs(z - l[2]) < 8))) continue; flat('paint', x - (dx ? 1.2 : .07), x + (dx ? 1.2 : .07), z - (dz ? 1.2 : .07), z + (dz ? 1.2 : .07), .02, 1, hex('#dcd9cf')); }
    }
    if (w.lines.length > 1) for (const [cx, cz] of [[0, -54], [0, -66], [0, -124], [0, -136], [80, -136], [150, -136]]) for (let k = -3.2; k < 3.4; k += 1.3) flat('paint', cx + k, cx + k + .65, cz - 1.4, cz + 1.4, .02, 1, hex('#dcd9cf'));
    this.banners = [];
    for (const b of w.buildings) this.building(bag, b, r);
    // street furniture
    const ico = new T.IcosahedronGeometry(1, 1), cyl = new T.CylinderGeometry(1, 1, 1, 8);
    const tree = (x, z) => {
      const h = 2.4 + r() * .8, t = [.22, .34, .15].map(v => v * (.75 + r() * .5));
      bag.geo('plain', cyl, x, h / 2, z, .13, h, .13, hex('#6d5a47'));
      for (let i = 0; i < 11; i++) { const a = i * 2.4, q = .25 + r() * .95, s = .5 + r() * .38; bag.geo('leaf', ico, x + Math.cos(a) * q, h + .3 + r() * 1.7, z + Math.sin(a) * q, s, s * .85, s, t.map(v => v * (.85 + r() * .35)), y => .78 + y * .28); }
    };
    const lamp = (x, z, s) => { bag.geo('plain', cyl, x, 3, z, .06, 6, .06, hex('#4d5558')); bag.box('plain', Math.min(x, x + s * 1.4), Math.max(x, x + s * 1.4), 5.95, 6.05, z - .05, z + .05, hex('#4d5558')); bag.box('plain', x + s * 1.2 - .3, x + s * 1.2 + .3, 5.85, 5.97, z - .13, z + .13, hex('#e8e4d4')); };
    const hedge = (x, z, along) => { const a = along ? .5 : 1.7, c = along ? 1.7 : .5; bag.box('plain', x - a, x + a, .15, .75, z - c, z + c, hex('#6a6e70')); for (let k = -1.3; k < 1.4; k += .65) bag.geo('leaf', ico, x + (along ? 0 : k), 1, z + (along ? k : 0), .5, .45, .5, [.17, .3, .14], (y, j) => .75 + y * .25 + (j % 7) / 30); };
    const car = (x, z, along, col) => {
      const t = hex(col), X = (a, c) => along ? [x + c, z + a] : [x + a, z + c], bx = (a0, a1, c0, c1, y0, y1, tt) => { const p = X(a0, c0), q = X(a1, c1); bag.box('plain', Math.min(p[0], q[0]), Math.max(p[0], q[0]), y0, y1, Math.min(p[1], q[1]), Math.max(p[1], q[1]), tt); };
      bx(-2.1, 2.1, -.88, .88, .35, .85, t); bx(-1.9, 1.95, -.84, .84, .85, .98, t); { const lo = [[-1.65, -.8], [1.35, -.8], [1.35, .8], [-1.65, .8]], hi = [[-1.1, -.64], [.75, -.64], [.75, .64], [-1.1, .64]], at = ([a, c], y) => { const p = X(a, c); return [p[0], y, p[1]]; }, g = hex('#55646b'); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, A = at(lo[i], .98), Bq = at(lo[j], .98), C = at(hi[j], 1.45), D = at(hi[i], 1.45), m = [(A[0] + Bq[0]) / 2 - x, 0, (A[2] + Bq[2]) / 2 - z], l = Math.hypot(m[0], m[2]), n = [m[0] / l * .9, .43, m[2] / l * .9]; bag.quad('two', A, Bq, C, D, n, 1, 1, g); } bx(-1.1, .75, -.64, .64, 1.43, 1.49, t); }
      for (const a of [-1.3, 1.3]) for (const c of [-.8, .8]) { const p = X(a, c); bag.geo('plain', new T.CylinderGeometry(.34, .34, .22, 12).rotateZ(Math.PI / 2).rotateY(along ? 0 : Math.PI / 2), p[0], .34, p[1], 1, 1, 1, hex('#1e2022')); }
      bx(2.08, 2.13, -.75, -.4, .6, .75, hex('#efe9d8')); bx(2.08, 2.13, .4, .75, .6, .75, hex('#efe9d8'));
    };
    const cars = ['#9aa2a6', '#d7d8d5', '#3b4347', '#7c8791', '#b9b5aa', '#5b6468'];
    for (const [, x0, z0, x1, z1] of w.lines) {
      const along = x0 === x1, n = Math.abs(along ? z1 - z0 : x1 - x0), dir = Math.sign(along ? z1 - z0 : x1 - x0);
      for (let t = 8; t < n; t += 8) for (const s of [-1, 1]) {
        const p = along ? z0 + dir * t : x0 + dir * t, x = along ? x0 + s * 4.7 : p, z = along ? p : z0 + s * 4.7;
        if (w.lines.some(l => { const a = l[1] === l[3]; return a !== along && Math.abs((a ? l[1] : l[2]) - p) < 10; })) continue;
        const k = r();
        if (k < .34) tree(x, z); else if (k < .5) hedge(x, z, along); else if (k < .6) lamp(x, z, along ? -s : 0);
        if (r() < .28 && t > 18) car(along ? x0 + s * 3 : p + 3, along ? p + 3 : z0 + s * 3, along, cars[r() * cars.length | 0]);
      }
    }
    bag.meshes(mats, this.scene);
    const cache = {};
    for (const q of this.banners) {
      const name = mode === 'banner' ? q.colour : 'blue', col = mode === 'banner' && q.id === w.target ? targetColour || COLOURS.red : COLOURS[name];
      const mat = cache[col] ||= new T.MeshLambertMaterial({map: bannerTex(col)});
      const m = new T.Mesh(new T.PlaneGeometry(q.w, q.h), mat); m.position.set(q.x, q.y, q.z); m.rotation.y = q.ry; m.receiveShadow = true; this.scene.add(m);
    }
  }
  building(bag, b, r) {
    const {x0, x1, z0, z1, style} = b, H = GH + b.floors * FH, t = .9 + r() * .16, tint = [t, t * (.98 + r() * .03), t * (.95 + r() * .05)];
    bag.walls(x0, x1, z0, z1, .15, GH, (s, w) => ['ground', Math.max(1, Math.round(w / 8)), 1, tint, .8]);
    const sideways = b.face === 'e' || b.face === 'w';
    const gable = s => b.banner && (sideways ? s === 's' || s === 'n' : s === 'e' || s === 'w');
    bag.walls(x0, x1, z0, z1, GH, H, (s, w, h) => gable(s) ? ['plain', 1, 1, hex(style === 'glass' ? '#a9b0ae' : '#d3c6ad').map(v => v * t)] : [style, Math.max(1, Math.round(w / 4)) / 4, b.floors / 4, tint]);
    const o = .45, cap = hex(style === 'glass' ? '#a5adac' : '#d9d2c2').map(v => v * t);
    bag.box('plain', x0 - o, x1 + o, H, H + .5, z0 - o, z1 + o, cap); bag.quad('plain', [x0 - o, H, z0 - o], [x1 + o, H, z0 - o], [x1 + o, H, z1 + o], [x0 - o, H, z1 + o], [0, -1, 0], 1, 1, cap.map(v => v * .7));
    bag.box('plain', x0 - .12, x1 + .12, GH - .25, GH + .15, z0 - .12, z1 + .12, cap);
    bag.box('plain', x0 + 4, x0 + 8, H + .5, H + 2.6, z0 + 4, z0 + 8, cap.map(v => v * .85));
    // vertical fins on the stone buildings' street side
    if (style === 'stone') { const n = Math.round((sideways ? z1 - z0 : x1 - x0) / 4); for (let i = 0; i <= n; i++) { const f = i / n, c = cap.map(v => v * 1.03); if (sideways) { const x = b.face === 'w' ? x0 : x1, z = z0 + (z1 - z0) * f; bag.box('plain', x - .28, x + .28, GH, H, z - .22, z + .22, c); } else { const z = b.face === 'n' ? z0 : z1, x = x0 + (x1 - x0) * f; bag.box('plain', x - .22, x + .22, GH, H, z - .28, z + .28, c); } } }
    // entrance with canopy
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, d = hex('#30383b'), cn = hex('#8b9291');
    const door = (a0, a1, d0, d1, y0, y1, c) => b.face === 'w' ? bag.box('plain', x0 - d1, x0 - d0, y0, y1, mz + a0, mz + a1, c) : b.face === 'e' ? bag.box('plain', x1 + d0, x1 + d1, y0, y1, mz + a0, mz + a1, c) : b.face === 's' ? bag.box('plain', mx + a0, mx + a1, y0, y1, z1 + d0, z1 + d1, c) : bag.box('plain', mx + a0, mx + a1, y0, y1, z0 - d1, z0 - d0, c);
    door(-1.5, 1.5, 0, .08, .15, 2.9, d); door(-.04, .04, .08, .12, .15, 2.9, cn); door(-2.2, 2.2, 0, 1.5, 3, 3.2, cn);
    if (b.banner) {
      // like today's: high on the wall, on the street side near the end you arrive from, and on the gable
      const h = Math.min(15, H - GH - 4), w = h / 2, y = H - 1 - h / 2, e = .36, add = (x, z, ry) => this.banners.push({id: b.id, colour: b.banner, x, y, z, ry, w, h});
      if (b.face === 'w') { add(x0 - e, z1 - w / 2 - 1, -Math.PI / 2); add(x0 + w / 2 + .7, z1 + .12, 0); }
      if (b.face === 'e') { add(x1 + e, z1 - w / 2 - 1, Math.PI / 2); add(x1 - w / 2 - .7, z1 + .12, 0); }
    }
  }
  setArrows(node, nodes) {
    this.arrows.clear();
    const sh = new T.Shape(); sh.moveTo(0, .55); sh.lineTo(.8, -.2); sh.lineTo(.8, -.6); sh.lineTo(0, .1); sh.lineTo(-.8, -.6); sh.lineTo(-.8, -.2);
    for (const id of node.next) {
      const n = nodes[id], yaw = Math.atan2(n.x - node.x, -(n.z - node.z));
      const m = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshBasicMaterial({color: '#fff', transparent: true, opacity: .92, depthTest: false, fog: false, toneMapped: false}));
      m.rotation.set(-Math.PI / 2, 0, -yaw, 'XYZ'); m.position.set(node.x + Math.sin(yaw) * 6.5, .2, node.z - Math.cos(yaw) * 6.5); m.renderOrder = 5; m.userData.to = id; this.arrows.add(m);
      const hit = new T.Mesh(new T.PlaneGeometry(3.2, 3), new T.MeshBasicMaterial({visible: false})); hit.position.copy(m.position); hit.rotation.x = -Math.PI / 2; hit.userData.to = id; this.arrows.add(hit);
    }
  }
  pick(px, py) {
    const r = this.canvas.getBoundingClientRect(), ray = new T.Raycaster();
    ray.setFromCamera(new T.Vector2((px - r.left) / r.width * 2 - 1, 1 - (py - r.top) / r.height * 2), this.camera);
    return ray.intersectObjects(this.arrows.children)[0]?.object.userData.to;
  }
  resize() {
    const w = this.canvas.clientWidth || 1, h = this.canvas.clientHeight || 1, a = w / h;
    this.renderer.setSize(w, h, false); this.camera.aspect = a;
    this.camera.fov = Math.min(82, Math.max(58, 2 * Math.atan(Math.tan(32 * Math.PI / 180) / a) * 180 / Math.PI)); this.camera.updateProjectionMatrix();
  }
  render(x, z, yaw, pitch) { this.camera.position.set(x, 1.68, z); this.camera.rotation.set(pitch, -yaw, 0); this.renderer.render(this.scene, this.camera); }
  dispose() { this.scene.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose?.(); }); this.renderer.dispose(); }
}
