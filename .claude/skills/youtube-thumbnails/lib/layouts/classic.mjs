// "Emerge from black" (concept C) — dark, moody, photo beside the title with the
// last title line in an accent highlight box. The 2025/2026 finals use this.
import { FONTS_LINK, dataUri, wordmark, wrapTitle, frameBg, motifLayer, escapeHtml } from "../helpers.mjs";

export const label = "Classic / emerge-from-black";

function titleHtml(lines, treatment) {
  return lines
    .map((l, i) => {
      const last = i === lines.length - 1;
      const cls = last && treatment === "box" ? "tline hl" : last && treatment !== "box" ? "tline accent" : "tline";
      const underline = last && treatment === "underline" ? '<span class="ul"></span>' : "";
      return `<span class="${cls}">${escapeHtml(l)}${underline}</span>`;
    })
    .join("");
}

export function talk({ repo, theme, year, talk }) {
  const lines = wrapTitle(talk.title);
  const photo = dataUri(repo, talk.authorImage);
  const side = theme.headshotSide === "right" ? "row-reverse" : "row";
  const shape = theme.headshotShape === "rounded" ? "28px" : "50%";
  const nameSide = theme.headshotSide === "right" ? "left:96px;" : "right:96px; text-align:right;";
  const badge =
    theme.badge === "circle"
      ? `<div class="badge-circle"><span class="yr">${year}</span><span class="wave">〜〜〜</span></div>`
      : `<div class="corner-label">${year} · Talk</div>`;
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>
    *{margin:0;padding:0;box-sizing:border-box}html,body{width:1280px;height:720px;overflow:hidden}
    .frame{position:relative;width:1280px;height:720px;${frameBg(theme)}color:${theme.ink};font-family:'Inter',system-ui,sans-serif}
    .motif{position:absolute;inset:0;width:100%;height:100%}
    .wordmark{position:absolute;top:44px;left:56px;z-index:3}.wordmark svg{height:34px;width:auto;display:block}
    .corner-label{position:absolute;top:48px;right:56px;z-index:3;letter-spacing:.22em;font-weight:800;font-size:20px;text-transform:uppercase;opacity:.85}
    .content{position:absolute;inset:0;z-index:2;display:flex;flex-direction:${side};align-items:center;gap:56px;padding:120px 72px 96px}
    .photo{flex:0 0 auto;width:360px;height:360px;border-radius:${shape};border:10px solid ${theme.accent};background:#0002 center/cover no-repeat;box-shadow:0 18px 48px #0007}
    .titlewrap{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:6px}
    .tline{position:relative;font-family:'Anton',sans-serif;line-height:.94;font-size:104px;letter-spacing:.005em;text-transform:uppercase}
    .tline.accent{color:${theme.accent}}
    .tline.hl{display:inline-block;background:${theme.accent};color:${theme.accentInk};padding:2px 16px 8px;border-radius:6px;margin-top:6px}
    .ul{position:absolute;left:0;right:0;bottom:-10px;height:10px;background:${theme.accent};border-radius:6px}
    .name{position:absolute;bottom:70px;z-index:3;font-family:'Caveat',cursive;font-weight:700;font-size:52px;opacity:.95;${nameSide}}
    .badge-circle{position:absolute;bottom:52px;right:64px;z-index:3;width:112px;height:112px;border-radius:50%;border:4px solid ${theme.accent};display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0003}
    .badge-circle .yr{font-family:'Anton',sans-serif;font-size:38px;line-height:1}.badge-circle .wave{font-size:16px;opacity:.7;margin-top:2px}
  </style></head><body><div class="frame">
    ${motifLayer(theme)}
    <div class="wordmark">${wordmark(repo, theme.ink)}</div>
    ${theme.badge === "circle" ? "" : badge}
    <div class="content">
      <div class="photo" style="${photo ? `background-image:url('${photo}')` : ""}"></div>
      <div class="titlewrap">${titleHtml(lines, theme.titleTreatment || "box")}</div>
    </div>
    <div class="name">${escapeHtml(talk.author)}</div>
    ${theme.badge === "circle" ? badge : ""}
  </div></body></html>`;
}

export function cover({ repo, theme, year, talks }) {
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
    .wordmark{position:absolute;top:44px;left:56px;z-index:3}.wordmark svg{height:34px;width:auto;display:block}
    .grid{position:absolute;z-index:2;top:96px;left:64px;width:560px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
    .gcell{width:100%;aspect-ratio:1;border-radius:50%;border:6px solid ${theme.accent};background:#0002 center/cover no-repeat;box-shadow:0 10px 24px #0006}
    .big{position:absolute;z-index:2;right:96px;top:206px;text-align:right}
    .big .yr{font-family:'Anton',sans-serif;font-size:220px;line-height:.9}
    .big .lineup{letter-spacing:.24em;font-weight:800;text-transform:uppercase;font-size:22px;opacity:.85;margin-top:10px}
    .url{position:absolute;z-index:3;bottom:44px;right:64px;letter-spacing:.12em;font-weight:600;font-size:18px;opacity:.7;text-transform:uppercase}
  </style></head><body><div class="frame">
    ${motifLayer(theme)}
    <div class="wordmark">${wordmark(repo, theme.ink)}</div>
    <div class="grid">${cells}</div>
    <div class="big"><div class="yr">${year}</div><div class="lineup">The Full Lineup</div></div>
    <div class="url">brightonruby.com</div>
  </div></body></html>`;
}

export default { label, talk, cover };
