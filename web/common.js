const $ = id => document.getElementById(id);
const api = async (path, body) => {
  const r = await fetch(path, body === undefined ? {cache: "no-store"} :
    {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "The local server did not answer.");
  return r.json();
};
const MODES = {plain: "A", banner: "B"};
// Takes what Google gives you (embed code, embed link, or the address bar while in Street View)
// and returns an embeddable address, or "" if it can't.
function toEmbed(text) {
  text = (text || "").trim();
  const src = text.match(/src="([^"]+)"/);
  if (src) text = src[1].replaceAll("&amp;", "&");
  let u;
  try { u = new URL(text); } catch { return ""; }
  if (u.protocol !== "https:" || !/^(www\.|maps\.)?google\.[a-z.]{2,6}$/.test(u.hostname)) return "";
  if (u.pathname === "/maps/embed" && u.searchParams.has("pb")) return u.href;
  if (u.searchParams.get("output") === "svembed") return u.href;
  const at = u.pathname.match(/@(-?[\d.]+),(-?[\d.]+),3a,[\d.]+y(?:,(-?[\d.]+)h)?(?:,([\d.]+)t)?/);
  if (!at) return "";
  const [, lat, lng, h = "0", t = "90"] = at, pitch = Number(t) - 90;
  const pano = decodeURIComponent(u.href).match(/!1s([\w-]{22})!/);
  if (pano) return `https://www.google.com/maps/embed?pb=!4v1!6m8!1m7!1s${pano[1]}!2m2!1d${lat}!2d${lng}!3f${h}!4f${pitch}!5f0.78`;
  return `https://maps.google.com/maps?layer=c&cbll=${lat},${lng}&cbp=11,${h},0,0,${-pitch}&output=svembed`;
}
