// "Ticket stub" (concept B) — bold colour field, a perforated ticket edge, and a
// large rectangular headshot bleeding off the right. Editorial/energetic.
// Best with a saturated palette (see _example_ticket in themes.json).
import { FONTS_LINK, dataUri, wordmark, wrapTitle, frameBg, motifLayer, escapeHtml } from "../helpers.mjs";

export const label = "Ticket stub";

const PANEL = 0.37; // right photo panel width as a fraction of 1280
const PERF_X = Math.round(1280 * (1 - PANEL)); // ~806px

function perforation(bgFrom) {
  // dashed line + tear-notch circles straddling it, top and bottom
  const notches = [];
  for (let y = -8; y < 720; y += 34) {
    notches.push(`<circle cx="0" cy="${y}" r="9" fill="${bgFrom}"/>`);
  }
  return (
    `<svg class="perf" viewBox="0 0 20 720" preserveAspectRatio="none" style="left:${PERF_X - 10}px">` +
    `<line x1="10" y1="0" x2="10" y2="720" stroke="#ffffff" stroke-width="2" stroke-dasharray="2 12" opacity=".8"/>` +
    `<g transform="translate(10 0)">${notches.join("")}</g></svg>`
  );
}

function titleHtml(lines, theme) {
  const box = (theme.titleTreatment || "plain") === "box";
  const accent = theme.titleAccent || "#f2c94c";
  return lines
    .map((l, i) => {
      const last = i === lines.length - 1;
      if (last && box) return `<span class="tline hl">${escapeHtml(l)}</span>`;
      return `<span class="tline"${last ? ` style="color:${accent}"` : ""}>${escapeHtml(l)}</span>`;
    })
    .join("");
}

export function talk({ repo, theme, year, talk, logo }) {
  const lines = wrapTitle(talk.title, 12);
  const photo = dataUri(repo, talk.authorImage);
  const tag = theme.tag || "#39c0c8";
  const radius = theme.headshotShape === "rounded" ? "24px 0 0 24px" : "0";
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>
    *{margin:0;padding:0;box-sizing:border-box}html,body{width:1280px;height:720px;overflow:hidden}
    .frame{position:relative;width:1280px;height:720px;${frameBg(theme)}color:${theme.ink};font-family:'Inter',system-ui,sans-serif}
    .motif{position:absolute;inset:0;width:100%;height:100%}
    .panel{position:absolute;top:0;right:0;bottom:0;width:${Math.round(PANEL * 100)}%;background:#0002 center/cover no-repeat;border-radius:${radius};${photo ? `background-image:url('${photo}')` : ""};z-index:1}
    .panel::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg, ${theme.bg.from} 0%, transparent 22%)}
    .perf{position:absolute;top:0;height:720px;width:20px;z-index:2}
    .wordmark{position:absolute;top:46px;left:64px;z-index:3;display:flex;align-items:center;gap:12px}
    .wordmark svg{height:30px;width:auto;display:block}.wordmark .yr{font-weight:800;letter-spacing:.14em;font-size:16px;opacity:.85}
    .titlewrap{position:absolute;left:64px;top:180px;width:${PERF_X - 110}px;z-index:3;display:flex;flex-direction:column;gap:2px}
    .tline{font-family:'Anton',sans-serif;line-height:.95;font-size:96px;text-transform:uppercase}
    .tline.hl{display:inline-block;background:${theme.titleAccent || "#f2c94c"};color:${theme.bg.to};padding:2px 14px 8px;border-radius:6px}
    .tag{position:absolute;left:64px;bottom:150px;z-index:3;display:inline-flex;align-items:center;background:${tag};color:#06262a;font-weight:800;font-size:16px;letter-spacing:.12em;text-transform:uppercase;padding:8px 16px;border-radius:6px}
    .meta{position:absolute;left:64px;bottom:64px;z-index:3}
    .meta .nm{font-weight:800;font-size:32px}
    .meta .sub{margin-top:6px;font-weight:600;font-size:16px;letter-spacing:.12em;text-transform:uppercase;opacity:.8}
  </style></head><body><div class="frame">
    ${motifLayer(theme)}
    <div class="panel"></div>
    ${perforation(theme.bg.from)}
    <div class="wordmark">${wordmark(logo, theme.ink)}<span class="yr">${year}</span></div>
    <div class="titlewrap">${titleHtml(lines, theme)}</div>
    <div class="tag">+ Talk Recording</div>
    <div class="meta"><div class="nm">${escapeHtml(talk.author)}</div>${talk.role ? `<div class="sub">${escapeHtml(talk.role)}</div>` : ""}</div>
  </div></body></html>`;
}

export function cover({ repo, theme, year, talks, logo }) {
  const cells = talks
    .map((t, i) => {
      const photo = dataUri(repo, t.authorImage);
      const ring = theme.ringColors[i % theme.ringColors.length];
      return `<div class="gcell" style="border-color:${ring};${photo ? `background-image:url('${photo}')` : ""}"></div>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>
    *{margin:0;padding:0;box-sizing:border-box}html,body{width:1280px;height:720px;overflow:hidden}
    .frame{position:relative;width:1280px;height:720px;${frameBg(theme)}color:${theme.ink};font-family:'Inter',system-ui,sans-serif}
    .motif{position:absolute;inset:0;width:100%;height:100%}
    .wordmark{position:absolute;top:46px;left:64px;z-index:3;display:flex;align-items:center;gap:12px}
    .wordmark svg{height:30px;width:auto;display:block}.wordmark .yr{font-weight:800;letter-spacing:.14em;font-size:16px;opacity:.85}
    .grid{position:absolute;z-index:2;top:120px;left:64px;width:540px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
    .gcell{width:100%;aspect-ratio:1;border-radius:14px;border:5px solid ${theme.titleAccent || theme.accent};background:#0002 center/cover no-repeat;box-shadow:0 10px 24px #0005}
    .big{position:absolute;z-index:2;right:96px;top:210px;text-align:right}
    .big .yr{font-family:'Anton',sans-serif;font-size:210px;line-height:.9;color:${theme.titleAccent || "#f2c94c"}}
    .big .lineup{letter-spacing:.24em;font-weight:800;text-transform:uppercase;font-size:22px;opacity:.85;margin-top:10px}
    .url{position:absolute;z-index:3;bottom:44px;right:64px;letter-spacing:.12em;font-weight:600;font-size:18px;opacity:.75;text-transform:uppercase}
  </style></head><body><div class="frame">
    ${motifLayer(theme)}
    <div class="wordmark">${wordmark(logo, theme.ink)}<span class="yr">${year}</span></div>
    <div class="grid">${cells}</div>
    <div class="big"><div class="yr">${year}</div><div class="lineup">The Full Lineup</div></div>
    <div class="url">brightonruby.com</div>
  </div></body></html>`;
}

export default { label, talk, cover };
