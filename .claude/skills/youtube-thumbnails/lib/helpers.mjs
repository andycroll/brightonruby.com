// Shared primitives for the thumbnail layout modules.
import fs from "node:fs";
import path from "node:path";

export const FONTS_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@700&family=Inter:wght@600;800&display=swap" rel="stylesheet">';

export const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// hex (#rgb or #rrggbb) + alpha 0..1 -> rgba()
export function hexA(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Read an image/svg from the repo and return a data: URI (so the headless
// browser needs no file access). Returns null if missing.
export function dataUri(repo, webPath) {
  if (!webPath) return null;
  const abs = path.join(repo, String(webPath).replace(/^\//, ""));
  if (!fs.existsSync(abs)) return null;
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
  return `data:${mime};base64,${fs.readFileSync(abs).toString("base64")}`;
}

// Inline the real Brighton Ruby wordmark, recoloured to `ink`.
export function wordmark(repo, ink) {
  const svg = fs.readFileSync(path.join(repo, "images/logo.svg"), "utf8");
  return svg.replace("<svg", `<svg fill="${ink}"`);
}

// Greedy word-wrap a title to lines of ~maxChars; upper-cased.
export function wrapTitle(title, maxChars = 14) {
  const words = String(title).toUpperCase().split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (!line) line = w;
    else if ((line + " " + w).length <= maxChars) line += " " + w;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Frame background CSS (gradient + optional radial glow), reused by layouts.
export function frameBg(theme) {
  const grad = `linear-gradient(${theme.bg.from}, ${theme.bg.to})`;
  if (theme.glow) {
    return `background-image: radial-gradient(circle at ${theme.glow.x} ${theme.glow.y}, ${hexA(theme.glow.color, theme.glow.strength)}, transparent 60%), ${grad};`;
  }
  return `background-image: ${grad};`;
}

// Background motif layer. `theme.motif`: "icons" | "rays" | "flat".
export function motifLayer(theme) {
  const color = theme.iconColor || theme.ink;
  const opacity = theme.iconOpacity ?? 0.06;
  if (theme.motif === "flat") return "";
  if (theme.motif === "rays") return rays(color, opacity, theme.motifOrigin);
  return icons(color, opacity); // default
}

function icons(color, opacity) {
  const glyphs = [
    '<path d="M12 2 22 9 12 22 2 9Z"/>',
    '<path d="M8 4l-6 8 6 8M16 4l6 8-6 8"/>',
    '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>',
    '<path d="M3 5h18v14H3zM6 9l3 3-3 3M13 15h5"/>',
    '<path d="M12 21s-8-5-8-11a5 5 0 0 1 8-3 5 5 0 0 1 8 3c0 6-8 11-8 11Z"/>',
    '<path d="M4 7h16M4 12h10M4 17h13"/>',
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    '<path d="M6 3v18M6 3l12 4-12 4"/>',
  ];
  const cells = [];
  let i = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 9; c++) {
      const g = glyphs[i % glyphs.length];
      i++;
      const rot = ((i * 47) % 60) - 30;
      const scale = 0.8 + ((i * 13) % 60) / 100;
      cells.push(
        `<g transform="translate(${c * 150 + 40} ${r * 150 + 60}) rotate(${rot}) scale(${scale})">` +
          `<g fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${g}</g></g>`
      );
    }
  }
  return `<svg class="motif" style="opacity:${opacity}" viewBox="0 0 1360 800" preserveAspectRatio="xMidYMid slice">${cells.join("")}</svg>`;
}

// Radiating "sun rays" from an origin (default upper-right), for the poster look.
function rays(color, opacity, origin = { x: 980, y: 150 }) {
  const lines = [];
  const N = 44;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const inner = 90;
    const outer = 1500 + (i % 3) * 120;
    const x1 = origin.x + Math.cos(a) * inner;
    const y1 = origin.y + Math.sin(a) * inner;
    const x2 = origin.x + Math.cos(a) * outer;
    const y2 = origin.y + Math.sin(a) * outer;
    lines.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${18 + (i % 2) * 10}"/>`);
  }
  return `<svg class="motif" style="opacity:${opacity}" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">${lines.join("")}</svg>`;
}
