import * as T from './three.module.min.js';
import {COLOURS, graph} from './world.js';
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
    const wall = {stone: '#d8cbb2', concrete: '#c6c2b8', brick: '#bfa288', glass: '#7f969b', balcony: '#d9cdb8', white: '#dcdad3', old: '#cdb487'}[style];
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
      } else if (style === 'balcony') {
        g.fillStyle = 'rgba(60,45,30,.25)'; g.fillRect(x + 18, y + 18, 92, 100); pane(x + 22, y + 22, 84, 96); g.fillStyle = '#cfc9bd'; g.fillRect(x + 62, y + 22, 4, 96);
        if (r() < .5) { g.fillStyle = ['#8d9a7d', '#a08a6e', '#7f8f9a', '#b7ab95'][r() * 4 | 0]; g.fillRect(x + 22, y + 22, r() < .5 ? 40 : 84, 40 + r() * 56); }
        g.fillStyle = 'rgba(80,70,55,.18)'; g.fillRect(x + r() * 100, y, 6 + r() * 14, S);
      } else if (style === 'white') {
        g.fillStyle = '#8a9090'; g.fillRect(x, y + 34, S, 58); pane(x + 2, y + 36, S - 4, 54); g.fillStyle = '#c9c8c2'; g.fillRect(x + 60, y + 36, 8, 54); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x, y + 92, S, 5);
      } else if (style === 'old') {
        const arch = (ax, w, c) => { g.fillStyle = c; g.beginPath(); g.arc(ax, y + 52, w / 2, Math.PI, 0); g.lineTo(ax + w / 2, y + 112); g.lineTo(ax - w / 2, y + 112); g.fill(); };
        arch(x + 64, 62, '#e9dfc8'); arch(x + 64, 52, '#76868c'); g.fillStyle = '#e9dfc8'; g.fillRect(x + 62, y + 28, 4, 84);
        g.fillStyle = ['#5f7a6b', '#6b7f8a', '#7d6a55'][(j + i) % 3]; g.fillRect(x + 16, y + 52, 17, 60); g.fillRect(x + 95, y + 52, 17, 60); g.fillStyle = 'rgba(110,85,50,.16)'; g.fillRect(x, y + 120, S, 8);
      } else {
        g.fillStyle = 'rgba(70,35,20,.10)'; for (let k = 0; k < 16; k++) g.fillRect(x, y + k * 8, S, 1);
        g.fillStyle = '#e4d6bf'; g.fillRect(x + 28, y + 18, 72, 92); pane(x + 34, y + 24, 60, 80);
        g.fillStyle = '#e8e0d0'; g.fillRect(x + 62, y + 24, 4, 80); g.fillRect(x + 34, y + 56, 60, 3);
      }
    }
  });
}
// Made-up shop signs and adverts. None uses a banner's layout or slogan.
const SIGNS = [['Pharmacy', 'صيدلية', '#2f6b4a'], ['Bakery', 'فرن', '#7a4a2a'], ['Café Lina', 'قهوة', '#2e2a28'], ['Copy Center', 'تصوير', '#2c4a6b'], ['Mini Market', 'سوبرماركت', '#4a6b2c'], ['Flowers', 'أزهار', '#5d6b3a'], ['Optics', 'نظارات', '#33404f'], ['Bank', 'مصرف', '#1f3a5a'], ['Juice Bar', 'عصير', '#b5672a'], ['Books', 'مكتبة', '#4b3a2c'], ['Mobile', 'خليوي', '#222831'], ['Barber', 'حلاق', '#3c3c3c'], ['Falafel', 'فلافل', '#5b6b2f'], ['Dry Clean', 'تنظيف', '#3f6f86'], ['Medical Lab', 'مختبر', '#44606b'], ['Kiosk', 'دكان', '#6b5a3a']];
const signTex = () => canvasTex(1024, 512, g => SIGNS.forEach(([a, b, c], i) => { const x = i % 4 * 256, y = (i / 4 | 0) * 128; g.fillStyle = c; g.fillRect(x, y, 256, 128); g.fillStyle = '#f3efe4'; g.textAlign = 'center'; g.font = 'bold 42px Verdana,sans-serif'; g.fillText(a, x + 128, y + 58, 236); g.font = '34px sans-serif'; g.fillText(b, x + 128, y + 106, 236); }), false);
const adTex = () => canvasTex(1024, 512, g => [['FRESH', 'every morning', '#31503f', '#e9e3c9'], ['4G+', 'everywhere', '#1d2c44', '#dfe6ee'], ['NEW HOMES', 'from the 5th floor up', '#e4ddcd', '#4a3d2e'], ['Iced coffee', 'now', '#3b2c22', '#e8d3b0'], ['SALE', 'up to 50%', '#22262a', '#f0efe9'], ['Fly direct', 'Istanbul · Paris', '#8fb3c9', '#16303f'], ['Mountain water', 'ماء', '#d9e6ea', '#2a5670'], ['Jazz night', 'Thursday', '#2a2438', '#d8c9a0']].forEach(([a, b, bg, fg], i) => { const x = i % 4 * 256, y = (i / 4 | 0) * 256; g.fillStyle = bg; g.fillRect(x, y, 256, 256); g.globalAlpha = .18; g.fillStyle = fg; g.beginPath(); g.arc(x + 190, y + 190, 80, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = fg; g.textAlign = 'center'; g.font = 'bold 46px Verdana,sans-serif'; g.fillText(a, x + 128, y + 110, 236); g.font = '26px Verdana,sans-serif'; g.fillText(b, x + 128, y + 160, 236); }), false);
const shops = () => canvasTex(512, 256, (g, W, H) => {
  const r = rng(17); g.fillStyle = '#a99f8e'; g.fillRect(0, 0, W, H); speckle(g, W, H, 2500, r, .1);
  for (let i = 0; i < 2; i++) { const x = i * 256; if (i) { g.fillStyle = '#7d8081'; g.fillRect(x + 20, 76, 216, 170); for (let k = 0; k < 17; k++) { g.fillStyle = k % 2 ? '#74777a' : '#8b8f90'; g.fillRect(x + 20, 76 + k * 10, 216, 10); } } else { g.fillStyle = '#4d565a'; g.fillRect(x + 20, 76, 216, 170); g.fillStyle = 'rgba(235,215,170,.35)'; g.fillRect(x + 26, 82, 120, 120); for (let k = 0; k < 9; k++) { g.fillStyle = ['#8f9a6a', '#a67c52', '#6f8794', '#b9a67e'][r() * 4 | 0]; g.fillRect(x + 34 + k * 12, 150 + r() * 40, 9, 40); } g.fillStyle = '#2f3538'; g.fillRect(x + 160, 82, 60, 164); } }
  g.fillStyle = '#857c6d'; g.fillRect(0, 244, W, 12);
});
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
  quadUV(k, a, b, c, d, n, [u0, v0, u1, v1]) { const o = this.get(k), P = [a, b, c, a, c, d], U = [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]]; P.forEach((p, i) => { o.p.push(...p); o.n.push(...n); o.u.push(...U[i]); o.c.push(1, 1, 1); }); }
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
  constructor(canvas, world, coloured) {
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
    this.sky(); this.build(coloured); R.shadowMap.needsUpdate = true;
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
  build(coloured) {
    const w = this.world, bag = new Bag(), r = rng(w.seed * 131 + 4), L = o => new T.MeshLambertMaterial({vertexColors: true, ...o});
    const mats = {plain: L({}), two: L({side: T.DoubleSide}), leaf: L({}), road: L({map: canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#73757a'; g.fillRect(0, 0, W, H); speckle(g, W, H, 6000, rng(2), .12); })}),
      pave: L({map: canvasTex(128, 128, (g, W, H) => { g.fillStyle = '#c3bcae'; g.fillRect(0, 0, W, H); speckle(g, W, H, 900, rng(3), .1); g.strokeStyle = 'rgba(70,60,45,.25)'; g.lineWidth = 2; for (let i = 0; i < 128; i += 64) { g.strokeRect(0, i, 128, 64); g.strokeRect(i, 0, 64, 128); } })}),
      paint: L({polygonOffset: true, polygonOffsetFactor: -2}), ground: L({map: ground()}), shops: L({map: shops()}), sign: L({map: signTex()}), ad: L({map: adTex()})};
    for (const k of ['stone', 'concrete', 'brick', 'glass', 'balcony', 'white', 'old']) mats[k] = L({map: facade(k)});
    const flat = (k, x0, x1, z0, z1, y, uv, tint) => bag.quad(k, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], (x1 - x0) / uv, (z1 - z0) / uv, tint);
    flat('road', -220, 300, -380, 160, 0, 7);
    for (const [x0, x1, z0, z1] of w.blocks) { flat('pave', x0, x1, z0, z1, .15, 2.4); bag.walls(x0, x1, z0, z1, 0, .15, () => ['plain', 1, 1, hex('#a39c90')]); }
    // centre dashes and zebra crossings
    for (const [, x0, z0, x1, z1] of w.lines) {
      const n = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / n, dz = (z1 - z0) / n;
      for (let t = 3; t < n; t += 6) { const x = x0 + dx * t, z = z0 + dz * t; if (w.lines.some(l => (l[1] === l[3]) !== (x0 === x1) && (dx ? Math.abs(x - l[1]) < 8 : Math.abs(z - l[2]) < 8))) continue; flat('paint', x - (dx ? 1.2 : .07), x + (dx ? 1.2 : .07), z - (dz ? 1.2 : .07), z + (dz ? 1.2 : .07), .02, 1, hex('#dcd9cf')); }
    }
    for (const n of Object.values(graph(w))) if (n.next.length > 2) for (const id of n.next) { const N = graph(w)[id], ux = Math.sign(N.x - n.x), uz = Math.sign(N.z - n.z); for (let k = -3.2; k < 3.4; k += 1.3) { const cx = n.x + ux * 5.8, cz = n.z + uz * 5.8; if (uz) flat('paint', cx + k, cx + k + .65, cz - 1.3, cz + 1.3, .02, 1, hex('#dcd9cf')); else flat('paint', cx - 1.3, cx + 1.3, cz + k, cz + k + .65, .02, 1, hex('#dcd9cf')); } }
    this.banners = [];
    for (const b of w.buildings) b.lot || this.building(bag, b, r);
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
    const palm = (x, z) => { const h = 5 + r() * 2; bag.geo('plain', cyl, x, h / 2, z, .16, h, .16, hex('#8a7458')); for (let i = 0; i < 9; i++) { const a = i * .7 + r() * .3, dx = Math.cos(a), dz = Math.sin(a), c = [.2, .32, .16].map(v => v * (.8 + r() * .4)), A = [x, h, z], M = [x + dx * 1.1, h + .45, z + dz * 1.1], Z = [x + dx * 2.2, h - .6, z + dz * 2.2], ox = -dz * .28, oz = dx * .28; bag.quad('two', [A[0] - ox * .3, A[1], A[2] - oz * .3], [A[0] + ox * .3, A[1], A[2] + oz * .3], [M[0] + ox, M[1], M[2] + oz], [M[0] - ox, M[1], M[2] - oz], [0, 1, 0], 1, 1, c); bag.quad('two', [M[0] - ox, M[1], M[2] - oz], [M[0] + ox, M[1], M[2] + oz], [Z[0] + ox * .2, Z[1], Z[2] + oz * .2], [Z[0] - ox * .2, Z[1], Z[2] - oz * .2], [0, 1, 0], 1, 1, c); } };
    const ad = (i, A, Bq, C, D, n) => bag.quadUV('ad', A, Bq, C, D, n, [i % 4 / 4, i < 4 ? .5 : 0, i % 4 / 4 + .25, i < 4 ? 1 : .5]);
    const poleAd = (x, z, along) => { const i = r() * 8 | 0, w2 = .6; bag.geo('plain', cyl, x, 1.3, z, .06, 2.3, .06, hex('#50585b')); if (along) { bag.box('plain', x - w2, x + w2, 1.6, 3.4, z - .07, z + .07, hex('#50585b')); ad(i, [x - w2 + .06, 1.66, z + .08], [x + w2 - .06, 1.66, z + .08], [x + w2 - .06, 3.34, z + .08], [x - w2 + .06, 3.34, z + .08], [0, 0, 1]); ad(i, [x + w2 - .06, 1.66, z - .08], [x - w2 + .06, 1.66, z - .08], [x - w2 + .06, 3.34, z - .08], [x + w2 - .06, 3.34, z - .08], [0, 0, -1]); } else { bag.box('plain', x - .07, x + .07, 1.6, 3.4, z - w2, z + w2, hex('#50585b')); ad(i, [x + .08, 1.66, z + w2 - .06], [x + .08, 1.66, z - w2 + .06], [x + .08, 3.34, z - w2 + .06], [x + .08, 3.34, z + w2 - .06], [1, 0, 0]); ad(i, [x - .08, 1.66, z - w2 + .06], [x - .08, 1.66, z + w2 - .06], [x - .08, 3.34, z + w2 - .06], [x - .08, 3.34, z - w2 + .06], [-1, 0, 0]); } };
    const bike = (x, z, along) => { const c = hex(['#3a3d40', '#5b4a44', '#48545c'][r() * 3 | 0]), q = (a0, a1, w2, y0, y1, t) => along ? bag.box('plain', x - w2, x + w2, y0, y1, z + a0, z + a1, t) : bag.box('plain', x + a0, x + a1, y0, y1, z - w2, z + w2, t); q(-.5, .5, .16, .45, .8, c); q(-.6, .05, .14, .8, .9, hex('#222')); q(.45, .6, .3, .95, 1.05, c); for (const a of [-.65, .65]) bag.geo('plain', new T.CylinderGeometry(.3, .3, .12, 10).rotateZ(Math.PI / 2).rotateY(along ? 0 : Math.PI / 2), along ? x : x + a, .3, along ? z + a : z, 1, 1, 1, hex('#1e2022')); };
    const bin = (x, z) => { bag.geo('plain', cyl, x, .65, z, .3, 1, .3, hex('#47504f')); };
    const kiosk = (x, z) => { bag.box('plain', x - .9, x + .9, .15, 2.4, z - .8, z + .8, hex('#8a9a8c')); bag.box('plain', x - 1.1, x + 1.1, 2.4, 2.55, z - 1, z + 1, hex('#d9d2bf')); };
    const person = (x, z) => { const h = .92 + r() * .16, c = hex(['#39434c', '#6b6259', '#8a8f93', '#4d5a4c', '#b3a892', '#2b2d30'][r() * 6 | 0]), l = hex(['#2d3440', '#55504a', '#22252a'][r() * 3 | 0]), sk = hex(['#c99f7d', '#a97c5c', '#d9b496'][r() * 3 | 0]); bag.geo('plain', cyl, x - .09, .55, z, .08, .85 * h, .08, l); bag.geo('plain', cyl, x + .09, .55, z, .08, .85 * h, .08, l); bag.geo('plain', cyl, x, 1.2 * h + .1, z, .21, .62, .15, c); bag.geo('plain', ico, x, 1.68 * h + .08, z, .12, .14, .12, sk); bag.geo('plain', ico, x, 1.74 * h + .08, z, .125, .1, .13, hex('#2a211b')); };
    const cars = ['#9aa2a6', '#d7d8d5', '#3b4347', '#7c8791', '#b9b5aa', '#5b6468'];
    for (const [, x0, z0, x1, z1] of w.lines) {
      const along = x0 === x1, n = Math.abs(along ? z1 - z0 : x1 - x0), dir = Math.sign(along ? z1 - z0 : x1 - x0);
      for (let t = 8; t < n; t += 8) for (const s of [-1, 1]) {
        const p = along ? z0 + dir * t : x0 + dir * t, x = along ? x0 + s * 4.7 : p, z = along ? p : z0 + s * 4.7;
        if (w.lines.some(l => { const a = l[1] === l[3]; return a !== along && Math.abs((a ? l[1] : l[2]) - p) < 10; })) continue;
        const k = r();
        if (k < .24) tree(x, z); else if (k < .33) hedge(x, z, along); else if (k < .42) lamp(x, z, along ? -s : 0); else if (k < .48) palm(x, z); else if (k < .56) poleAd(x, z, along, s); else if (k < .63) bike(x, z, along); else if (k < .69) bin(x, z); else if (k < .73) kiosk(along ? x0 + s * 5.6 : x, along ? z : z0 + s * 5.6);
        if (r() < .33) person(along ? x0 + s * (5.3 + r() * 1.3) : p + r() * 5, along ? p + r() * 5 : z0 + s * (5.3 + r() * 1.3));
        if (r() < .42 && t > 18) car(along ? x0 + s * 3 : p + 3, along ? p + 3 : z0 + s * 3, along, cars[r() * cars.length | 0]);
      }
    }
    // lots between the buildings
    for (const b of w.buildings) if (b.lot) {
      const {x0, x1, z0, z1} = b, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, wall = (a, c, d, e, h, col) => bag.box('plain', a, c, .15, h, d, e, hex(col));
      if (b.kind === 'parking') {
        flat('road', x0, x1, z0, z1, .17, 7);
        for (let i = x0 + 2.2; i < x1 - 1; i += 2.9) { flat('paint', i, i + .1, z0 + 1, z0 + 5.4, .19, 1, hex('#dcd9cf')); if (r() < .75) car(i + 1.4, z0 + 3.2, true, cars[r() * cars.length | 0]); if (z1 - z0 > 15 && r() < .7) car(i + 1.4, z1 - 3.2, true, cars[r() * cars.length | 0]); }
        wall(x0, x1, z0 - .1, z0 + .1, 2.2, '#b8ae9b'); bag.box('plain', mx + 1, mx + 3, .15, 2.5, mz - 1, mz + 1, hex('#d8d4c8'));
      } else if (b.kind === 'park') {
        flat('plain', x0, x1, z0, z1, .18, 1, hex('#7d8f5c')); flat('pave', mx - 1.2, mx + 1.2, z0, z1, .2, 2.4);
        for (let i = 0; i < 8; i++) tree(x0 + 2 + r() * (x1 - x0 - 4), z0 + 2 + r() * (z1 - z0 - 4)); for (const q of [-4, 4]) bag.box('plain', mx + q - .9, mx + q + .9, .5, .6, mz - .25, mz + .25, hex('#7a5f45'));
        wall(x0, x1, z0 - .1, z0 + .1, 1.4, '#c9bfa9');
      } else {
        flat('plain', x0, x1, z0, z1, .18, 1, hex('#a89678')); const f = hex('#b9b5ab');
        for (let k = 0; k < 4; k++) bag.box('plain', x0 + 3, x1 - 2, 3.6 + k * 3.4, 3.9 + k * 3.4, z0 + 2, z1 - 2, f);
        for (let i = x0 + 3.3; i < x1 - 2; i += 5) for (let j = z0 + 2.3; j < z1 - 2; j += 5) bag.box('plain', i, i + .5, .15, 14.5, j, j + .5, f);
        const E = {e: [x1, x1 + .1, z0, z1], w: [x0 - .1, x0, z0, z1], s: [x0, x1, z1, z1 + .1], n: [x0, x1, z0 - .1, z0]}[b.face]; wall(E[0], E[1], E[2], E[3], 2.4, '#6f8794');
      }
    }
    // cables over the street, as in Hamra
    const pts = []; for (const [, x0, z0, x1, z1] of w.lines) { const along = x0 === x1, n = Math.abs(along ? z1 - z0 : x1 - x0), d = Math.sign(along ? z1 - z0 : x1 - x0); for (let t = 14; t < n; t += 13 + r() * 16) { const h = 8 + r() * 3, a = 8, sk = (r() - .5) * 8; let l = null; for (let i = 0; i <= 10; i++) { const u = -1 + i / 5, y = h - (1 - u * u) * .9, o = d * t + sk * u, v = along ? [x0 + u * a, y, z0 + o] : [x0 + o, y, z0 + u * a]; if (l) pts.push(...l, ...v); l = v; } } }
    if (pts.length) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); this.scene.add(new T.LineSegments(g, new T.LineBasicMaterial({color: '#3b3d3f'}))); }
    bag.meshes(mats, this.scene);
    const cache = {};
    for (const q of this.banners) {
      const col = COLOURS[coloured ? q.colour : 'blue'];
      const mat = cache[col] ||= new T.MeshLambertMaterial({map: bannerTex(col)});
      const m = new T.Mesh(new T.PlaneGeometry(q.w, q.h), mat); m.position.set(q.x, q.y, q.z); m.rotation.y = q.ry; m.receiveShadow = true; this.scene.add(m);
    }
  }
  building(bag, b, r) {
    const {x0, x1, z0, z1, style} = b, H = GH + b.floors * FH, t = .9 + r() * .16, tint = [t, t * (.98 + r() * .03), t * (.95 + r() * .05)];
    const shop = !b.banner && style !== 'glass' && style !== 'white';
    bag.walls(x0, x1, z0, z1, .15, GH, (s, w) => [shop ? 'shops' : 'ground', Math.max(1, Math.round(w / 8)), 1, tint, .8]);
    const sideways = b.face === 'e' || b.face === 'w';
    const gable = s => b.banner && (sideways ? s === 's' || s === 'n' : s === 'e' || s === 'w');
    bag.walls(x0, x1, z0, z1, GH, H, (s, w, h) => gable(s) ? ['plain', 1, 1, hex(style === 'glass' ? '#a9b0ae' : '#d3c6ad').map(v => v * t)] : [style, Math.max(1, Math.round(w / 4)) / 4, b.floors / 4, tint]);
    const o = .45, cap = hex(style === 'glass' ? '#a5adac' : '#d9d2c2').map(v => v * t);
    bag.box('plain', x0 - o, x1 + o, H, H + .5, z0 - o, z1 + o, cap); bag.quad('plain', [x0 - o, H, z0 - o], [x1 + o, H, z0 - o], [x1 + o, H, z1 + o], [x0 - o, H, z1 + o], [0, -1, 0], 1, 1, cap.map(v => v * .7));
    bag.box('plain', x0 - .12, x1 + .12, GH - .25, GH + .15, z0 - .12, z1 + .12, cap);
    bag.box('plain', x0 + 4, x0 + 8, H + .5, H + 2.6, z0 + 4, z0 + 8, cap.map(v => v * .85));
    // vertical fins on the stone buildings' street side
    if (style === 'stone') { const n = Math.round((sideways ? z1 - z0 : x1 - x0) / 4); for (let i = 0; i <= n; i++) { const f = i / n, c = cap.map(v => v * 1.03); if (sideways) { const x = b.face === 'w' ? x0 : x1, z = z0 + (z1 - z0) * f; bag.box('plain', x - .28, x + .28, GH, H, z - .22, z + .22, c); } else { const z = b.face === 'n' ? z0 : z1, x = x0 + (x1 - x0) * f; bag.box('plain', x - .22, x + .22, GH, H, z - .28, z + .28, c); } } }
    // which wall faces the street, as a function from (along, out, height) to a point
    const W = sideways ? z1 - z0 : x1 - x0, at = (a, o, y) => b.face === 'w' ? [x0 - o, y, z0 + a] : b.face === 'e' ? [x1 + o, y, z1 - a] : b.face === 's' ? [x0 + a, y, z1 + o] : [x1 - a, y, z0 - o], nrm = {w: [-1, 0, 0], e: [1, 0, 0], s: [0, 0, 1], n: [0, 0, -1]}[b.face];
    const slab = (a0, a1, o0, o1, y0, y1, c, k = 'plain') => { const p = at(a0, o0, y0), q = at(a1, o1, y1); bag.box(k, Math.min(p[0], q[0]), Math.max(p[0], q[0]), y0, y1, Math.min(p[2], q[2]), Math.max(p[2], q[2]), c); };
    if (shop) for (let a = .6; a + 4.2 < W; a += 4.6) if (r() < .78) {
      const i = r() * 16 | 0, u = i % 4 / 4, v = 1 - ((i / 4 | 0) + 1) / 4; slab(a, a + 3.8, .02, .16, 3.1, 4.05, hex('#3a3a38')); bag.quadUV('sign', at(a + .05, .18, 3.14), at(a + 3.75, .18, 3.14), at(a + 3.75, .18, 4.01), at(a + .05, .18, 4.01), nrm, [u, v, u + .25, v + .25]);
      if (r() < .4) { const c = hex(['#8a8f78', '#a39480', '#6f7f86', '#b4a98f'][r() * 4 | 0]); bag.quad('two', at(a, 1.5, 2.55), at(a + 3.8, 1.5, 2.55), at(a + 3.8, .1, 3.1), at(a, .1, 3.1), [nrm[0] * .4, .9, nrm[2] * .4], 1, 1, c); }
    }
    if (style === 'balcony') for (let f = 0; f < b.floors; f++) for (let a = .5; a + 5.6 < W; a += 8) { const y = GH + f * FH, rail = hex(['#8b8c88', '#b3a78f', '#6d7577'][(f + b.floors) % 3]); slab(a, a + 6.4, 0, 1.25, y, y + .16, cap); slab(a, a + 6.4, 1.18, 1.25, y + .16, y + 1.1, rail); if (r() < .3) slab(a + .1, a + 6.3, 1.12, 1.16, y + 1.1, y + 2.9, hex(['#b5aa90', '#8d9a86', '#9a8c78', '#a7b0b3'][r() * 4 | 0])); else if (r() < .3) for (let k = 0; k < 3; k++) { const p = at(a + 1 + k * 1.7, 1, y + 1.2); bag.geo('leaf', new T.IcosahedronGeometry(1, 0), p[0], p[1], p[2], .35, .3, .35, [.2, .33, .16]); } }
    if (style !== 'glass' && style !== 'stone') for (let k = 0; k < b.floors * 2; k++) if (r() < .55) { const a = 1 + r() * (W - 2.2), y = GH + .6 + (r() * b.floors | 0) * FH; slab(a, a + .85, 0, .34, y, y + .55, hex('#dddcd6')); }
    // rooftops: water tanks, dishes, sometimes an advert
    for (let k = 0; k < 4; k++) if (r() < .7) { const tx = x0 + 2 + r() * (x1 - x0 - 4), tz = z0 + 2 + r() * (z1 - z0 - 4); bag.geo('plain', new T.CylinderGeometry(1, 1, 1, 10), tx, H + 1.4, tz, .7, 1.7, .7, hex(['#e3e2dc', '#5a7f9a', '#34383a'][r() * 3 | 0])); }
    if (!b.banner && b.floors < 6 && W > 14 && r() < .38) { const i = r() * 8 | 0, bw = Math.min(11, W - 3), a = (W - bw) / 2, y = H + 1.6; slab(a, a + bw, -.9, -.7, y, y + bw / 2, hex('#54585a')); bag.quadUV('ad', at(a + .1, -.68, y + .1), at(a + bw - .1, -.68, y + .1), at(a + bw - .1, -.68, y + bw / 2 - .1), at(a + .1, -.68, y + bw / 2 - .1), nrm, [i % 4 / 4, (i < 4 ? .5 : 0) + .06, i % 4 / 4 + .25, (i < 4 ? 1 : .5) - .06]); for (const q of [a + .4, a + bw - .6]) slab(q, q + .2, -.95, -.75, H, y, hex('#54585a')); }
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
