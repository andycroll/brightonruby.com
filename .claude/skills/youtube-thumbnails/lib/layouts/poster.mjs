// "Seaside poster" (concept A) — light/airy, radiating sun + rays, pill label,
// hand-drawn underline squiggle, ringed circular headshot top-right. Summery.
// Best with a LIGHT palette (see _example_poster in themes.json).
import { FONTS_LINK, dataUri, wordmark, wrapTitle, frameBg, motifLayer, escapeHtml } from "../helpers.mjs";

export const label = "Seaside poster";

// A hand-drawn wavy underline spanning the accented last line.
function squiggle(color) {
  return (
    `<svg class="squig" viewBox="0 0 300 20" preserveAspectRatio="none">` +
    `<path d="M2 12 C 40 2, 70 20, 110 10 S 190 2, 230 12 S 290 18, 298 8" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/></svg>`
  );
}

function titleHtml(lines, theme) {
  return lines
    .map((l, i) => {
      const last = i === lines.length - 1;
      return `<span class="tline${last ? " accent" : ""}">${escapeHtml(l)}${last ? squiggle(theme.accent) : ""}</span>`;
    })
    .join("");
}

export function talk({ repo, theme, year, talk }) {
  const lines = wrapTitle(talk.title, 12);
  const photo = dataUri(repo, talk.authorImage);
  const sun = theme.sun || "#f2c94c";
  const ring = theme.ringColors[0] || theme.accent;
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>
    *{margin:0;padding:0;box-sizing:border-box}html,body{width:1280px;height:720px;overflow:hidden}
    .frame{position:relative;width:1280px;height:720px;${frameBg(theme)}color:${theme.ink};font-family:'Inter',system-ui,sans-serif}
    .motif{position:absolute;inset:0;width:100%;height:100%}
    .sun{position:absolute;top:60px;right:250px;width:150px;height:150px;border-radius:50%;background:${sun};z-index:1;box-shadow:0 0 60px ${sun}}
    .pill{position:absolute;top:44px;left:56px;z-index:4;display:flex;align-items:center;gap:12px;border:3px solid ${theme.accent};border-radius:999px;padding:8px 18px;background:${theme.bg.from}}
    .pill svg{height:22px;width:auto;display:block}
    .pill .yr{font-weight:800;letter-spacing:.14em;font-size:16px;color:${theme.accent}}
    .content{position:absolute;inset:0;z-index:3;display:flex;align-items:center;gap:48px;padding:150px 72px 120px}
    .titlewrap{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px}
    .tline{position:relative;font-family:'Anton',sans-serif;line-height:.96;font-size:100px;text-transform:uppercase}
    .tline.accent{color:${theme.accent};padding-bottom:22px}
    .squig{position:absolute;left:0;bottom:2px;width:100%;height:20px}
    .photo{flex:0 0 auto;width:340px;height:340px;border-radius:50%;border:12px solid ${ring};background:#0001 center/cover no-repeat;box-shadow:0 18px 48px #0003;z-index:3}
    .meta{position:absolute;left:72px;bottom:56px;z-index:4}
    .meta .nm{font-weight:800;font-size:34px}
    .meta .sub{margin-top:6px;font-weight:600;font-size:16px;letter-spacing:.14em;text-transform:uppercase;opacity:.7}
  </style></head><body><div class="frame">
    ${motifLayer(theme)}
    <div class="sun"></div>
    <div class="pill">${wordmark(repo, theme.accent)}<span class="yr">${year}</span></div>
    <div class="content">
      <div class="titlewrap">${titleHtml(lines, theme)}</div>
      <div class="photo" style="${photo ? `background-image:url('${photo}')` : ""}"></div>
    </div>
    <div class="meta"><div class="nm">${escapeHtml(talk.author)}</div>${talk.role ? `<div class="sub">${escapeHtml(talk.role)}</div>` : `<div class="sub">brightonruby.com · Brighton, UK</div>`}</div>
  </div></body></html>`;
}

export function cover({ repo, theme, year, talks }) {
  const sun = theme.sun || "#f2c94c";
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
    .sun{position:absolute;top:70px;right:230px;width:170px;height:170px;border-radius:50%;background:${sun};z-index:1;box-shadow:0 0 70px ${sun}}
    .pill{position:absolute;top:44px;left:56px;z-index:4;display:flex;align-items:center;gap:12px;border:3px solid ${theme.accent};border-radius:999px;padding:8px 18px;background:${theme.bg.from}}
    .pill svg{height:22px;width:auto;display:block}.pill .yr{font-weight:800;letter-spacing:.14em;font-size:16px;color:${theme.accent}}
    .grid{position:absolute;z-index:3;top:120px;left:64px;width:540px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
    .gcell{width:100%;aspect-ratio:1;border-radius:50%;border:6px solid ${theme.accent};background:#0001 center/cover no-repeat;box-shadow:0 10px 24px #0002}
    .big{position:absolute;z-index:3;right:96px;top:210px;text-align:right}
    .big .yr{font-family:'Anton',sans-serif;font-size:210px;line-height:.9;color:${theme.accent}}
    .big .lineup{letter-spacing:.24em;font-weight:800;text-transform:uppercase;font-size:22px;opacity:.75;margin-top:10px}
    .url{position:absolute;z-index:4;bottom:44px;right:64px;letter-spacing:.12em;font-weight:600;font-size:18px;opacity:.65;text-transform:uppercase}
  </style></head><body><div class="frame">
    ${motifLayer(theme)}
    <div class="sun"></div>
    <div class="pill">${wordmark(repo, theme.accent)}<span class="yr">${year}</span></div>
    <div class="grid">${cells}</div>
    <div class="big"><div class="yr">${year}</div><div class="lineup">The Full Lineup</div></div>
    <div class="url">brightonruby.com</div>
  </div></body></html>`;
}

export default { label, talk, cover };
