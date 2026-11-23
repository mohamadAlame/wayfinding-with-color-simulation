// Draws a banner on Street View. For each panorama, the four corners of the banner are stored as
// directions (heading, pitch), so it stays on the wall while the participant looks around.
const RAD = Math.PI / 180;
function basis(pov) {
  const h = pov.heading * RAD, p = pov.pitch * RAD, ch = Math.cos(h), sh = Math.sin(h), cp = Math.cos(p), sp = Math.sin(p);
  return {f: [sh * cp, ch * cp, sp], r: [ch, -sh, 0], u: [-sh * sp, -ch * sp, cp]};
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const dir = ([h, p]) => basis({heading: h, pitch: p}).f;
const focal = (pov, w) => (w / 2) / Math.pow(2, 1 - (pov.zoom || 0)); // horizontal view angle = 2·atan(2^(1-zoom))
function project(pt, pov, w, h) {
  const d = dir(pt), b = basis(pov), z = dot(d, b.f), F = focal(pov, w);
  return z < 0.05 ? null : [w / 2 + F * dot(d, b.r) / z, h / 2 - F * dot(d, b.u) / z];
}
function unproject([x, y], pov, w, h) {
  const b = basis(pov), F = focal(pov, w), a = (x - w / 2) / F, c = (h / 2 - y) / F;
  const d = b.f.map((v, i) => v + a * b.r[i] + c * b.u[i]), n = Math.hypot(...d);
  return [(Math.atan2(d[0], d[1]) / RAD + 360) % 360, Math.asin(d[2] / n) / RAD];
}
// CSS matrix taking a W×H box to four points (top-left, top-right, bottom-right, bottom-left)
function quadMatrix(W, H, [p0, p1, p2, p3]) {
  const dx1 = p1[0] - p2[0], dx2 = p3[0] - p2[0], sx = p0[0] - p1[0] + p2[0] - p3[0];
  const dy1 = p1[1] - p2[1], dy2 = p3[1] - p2[1], sy = p0[1] - p1[1] + p2[1] - p3[1];
  const den = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den, k = (dx1 * sy - sx * dy1) / den;
  const a = p1[0] - p0[0] + g * p1[0], b = p3[0] - p0[0] + k * p3[0], d = p1[1] - p0[1] + g * p1[1], e = p3[1] - p0[1] + k * p3[1];
  return `matrix3d(${[a / W, d / W, 0, g / W, b / H, e / H, 0, k / H, 0, 0, 1, 0, p0[0], p0[1], 0, 1].join(",")})`;
}
const BW = 360, BH = 720;
function bannerSvg(colour) {
  const t = (y, s, txt, fill = "#fff", f = "Georgia,serif") => `<text x="180" y="${y}" font-size="${s}" font-family="${f}" fill="${fill}" text-anchor="middle">${txt}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 360 720"><rect width="360" height="720" fill="${colour}"/><rect y="490" width="360" height="230" fill="#f3f3f0"/>
  <circle cx="180" cy="170" r="52" fill="none" stroke="#fff" stroke-width="4"/><path d="M180 128l26 52h-18v28h-16v-28h-18z" fill="#fff"/>
  ${t(270, 32, "AMERICAN")}${t(306, 28, "UNIVERSITY OF BEIRUT")}${t(342, 30, "MEDICAL CENTER")}
  ${t(590, 48, "Pioneering", colour, "Verdana,sans-serif")}${t(645, 48, "Healthcare", colour, "Verdana,sans-serif")}</svg>`;
}
let mapsLoad;
function loadMaps(key) {
  return mapsLoad ||= new Promise((ok, no) => {
    const fail = m => { mapsLoad = null; no(new Error(m)); };
    if (key !== "DEV") window.gm_authFailure = () => { window.mapsRefused = true; fail("Google refused the key. Check it in Settings."); document.dispatchEvent(new Event("mapsrefused")); };
    window.mapsReady = () => ok();
    const s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?v=weekly&loading=async&callback=mapsReady" + (key && key !== "DEV" ? "&key=" + encodeURIComponent(key) : "");
    s.onerror = () => fail("Google Maps could not be loaded. Check the internet connection.");
    document.head.append(s);
  });
}
class BannerView {
  constructor(box, data) {
    this.box = box; this.data = data;
    this.pano = document.createElement("div"); this.pano.style.cssText = "position:absolute;inset:0;z-index:0;isolation:isolate";
    this.clip = document.createElement("div"); this.clip.style.cssText = "position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:3;transition:opacity .25s";
    this.img = document.createElement("div"); this.img.style.cssText = `position:absolute;left:0;top:0;width:${BW}px;height:${BH}px;transform-origin:0 0;filter:brightness(.93)`;
    this.clip.append(this.img); box.append(this.pano, this.clip); this.paint();
    new ResizeObserver(() => this.draw()).observe(box);
  }
  paint() { this.img.innerHTML = bannerSvg(/^#[0-9a-f]{6}$/i.test(this.data.colour) ? this.data.colour : "#e0641b"); }
  async open(key, v) {
    await loadMaps(key);
    if (window.mapsRefused) throw new Error("Google refused the key. Check it in Settings.");
    const start = v.pano ? {pano: v.pano} : {position: {lat: v.lat, lng: v.lng}};
    this.sv = new google.maps.StreetViewPanorama(this.pano, {...start, pov: {heading: v.heading, pitch: v.pitch}, zoom: 0,
      addressControl: false, showRoadLabels: false, fullscreenControl: false, motionTracking: false, motionTrackingControl: false, enableCloseButton: false});
    let last = "", timer;
    const step = () => {
      const id = this.sv.getPano(), p = this.sv.getPosition();
      if (!id || !p || id === last) return;
      last = id; this.onstep?.(id, p.lat(), p.lng());
    };
    this.sv.addListener("position_changed", step);
    this.sv.addListener("pano_changed", () => { // the picture cross-fades: show the banner once the new one is in
      this.clip.style.opacity = 0; clearTimeout(timer);
      timer = setTimeout(() => { this.draw(); this.clip.style.opacity = 1; }, 500);
    });
    this.sv.addListener("pov_changed", () => this.draw());
    this.sv.addListener("zoom_changed", () => this.draw());
    await new Promise((ok, no) => {
      const check = () => { const s = this.sv.getStatus(); if (s === "OK") ok(); else if (s) no(new Error("No Street View at this start point.")); };
      this.sv.addListener("status_changed", check); check();
    });
    step(); this.draw();
  }
  state() { const p = this.sv.getPov(); return [{heading: p.heading, pitch: p.pitch, zoom: this.sv.getZoom() || 0}, this.box.clientWidth, this.box.clientHeight]; }
  draw() {
    if (!this.sv) return;
    const place = this.data.places[this.sv.getPano()], st = this.state();
    const q = place?.corners?.map(c => project(c, ...st));
    const show = !!q && q.every(Boolean);
    this.img.hidden = !show;
    if (show) this.img.style.transform = quadMatrix(BW, BH, q);
    const holes = (place?.blocks || []).map(b => b.map(c => project(c, ...st))).filter(b => b.length > 2 && b.every(Boolean));
    this.clip.style.clipPath = holes.length ? `path(evenodd,"M0 0H${st[1]}V${st[2]}H0Z ${holes.map(b => "M" + b.map(p => p.join(" ")).join("L") + "Z").join(" ")}")` : "";
    this.ondraw?.();
  }
}
