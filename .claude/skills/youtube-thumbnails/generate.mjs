#!/usr/bin/env node
// Brighton Ruby — YouTube asset generator.
//
// Renders 1280x720 talk thumbnails and a playlist cover for a given year using
// an HTML/CSS template driven by _posts/<year> data and a per-year theme in
// themes.json. Optionally emits a copy/paste YouTube descriptions doc.
//
// Usage:
//   node generate.mjs --year 2027 [--out DIR] [--only "Talk Title"]
//                     [--no-thumbnails] [--no-cover] [--descriptions]
//                     [--repo /path/to/site]
//
// First run: `npm install` in this directory (downloads Chromium via Playwright).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const a = {
    year: null,
    out: null,
    only: null,
    repo: path.resolve(__dirname, "../../.."), // .claude/skills/youtube-thumbnails -> repo root
    thumbnails: true,
    cover: true,
    descriptions: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--year") a.year = argv[++i];
    else if (arg === "--out") a.out = argv[++i];
    else if (arg === "--only") a.only = argv[++i];
    else if (arg === "--repo") a.repo = path.resolve(argv[++i]);
    else if (arg === "--no-thumbnails") a.thumbnails = false;
    else if (arg === "--no-cover") a.cover = false;
    else if (arg === "--descriptions") a.descriptions = true;
    else if (arg === "--help" || arg === "-h") a.help = true;
  }
  return a;
}

const HELP = `Brighton Ruby YouTube asset generator

  node generate.mjs --year 2027 [options]

Options:
  --year YYYY        Conference year to build (reads _posts/YYYY). Required.
  --out DIR          Output directory (default: <repo>/thumbnail-concepts/final-YYYY).
  --only "Title"     Only render talks whose title contains this substring.
  --repo PATH        Path to the site repo (default: inferred from skill location).
  --no-thumbnails    Skip per-talk thumbnails.
  --no-cover         Skip the playlist cover.
  --descriptions     Also write youtube-descriptions-YYYY.md.
  -h, --help         Show this help.
`;

// ---------------------------------------------------------------------------
// data
// ---------------------------------------------------------------------------
function loadTheme(year) {
  const themes = JSON.parse(fs.readFileSync(path.join(__dirname, "themes.json"), "utf8"));
  const base = themes.default;
  const year_ = themes[String(year)];
  if (!year_) {
    console.warn(
      `\n⚠  No theme for ${year} in themes.json — using the default (teal) palette.\n` +
        `   Add a "${year}" entry to themes.json to give the year its own variant.\n`
    );
  }
  return { ...base, ...(year_ || {}) };
}

function readTalks(repo, year) {
  const dir = path.join(repo, "_posts", String(year));
  if (!fs.existsSync(dir)) throw new Error(`No posts directory: ${dir}`);
  const talks = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".md")) continue;
    const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    if (data.break === true) continue; // skip registration/coffee/lunch/etc.
    if (!data.title || !data.author) continue; // skip anything without a speaker
    talks.push({
      file,
      title: String(data.title),
      author: String(data.author),
      authorImage: data.author_image || `/images/${year}/speakers/${slugAuthor(data.author)}.jpg`,
      bio: data.author_bio_markdown ? String(data.author_bio_markdown) : "",
      social: Array.isArray(data.author_social) ? data.author_social : [],
      abstract: (data.description && data.description !== "TBD" ? String(data.description) : content.trim()),
    });
  }
  return talks;
}

const slugAuthor = (name) => name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

// YouTube-safe filename, matching the existing convention (":" -> ",", "/" -> "-").
const safeName = (s) => s.replace(/:/g, ",").replace(/[\/\\]/g, "-").replace(/["<>|*?]/g, "").replace(/\s+/g, " ").trim();

function dataUri(repo, webPath) {
  const abs = path.join(repo, webPath.replace(/^\//, ""));
  if (!fs.existsSync(abs)) return null;
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
  return `data:${mime};base64,${fs.readFileSync(abs).toString("base64")}`;
}

// ---------------------------------------------------------------------------
// title wrapping: greedy word-wrap, then the LAST line gets the accent box
// ---------------------------------------------------------------------------
function wrapTitle(title, maxChars = 14) {
  const words = title.toUpperCase().split(/\s+/);
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

// ---------------------------------------------------------------------------
// SVG assets
// ---------------------------------------------------------------------------
function wordmark(repo, ink) {
  const svg = fs.readFileSync(path.join(repo, "images/logo.svg"), "utf8");
  // recolour the logo paths to the theme ink
  return svg.replace("<svg", `<svg fill="${ink}"`);
}

// A faint scattered layer of simple Ruby / dev glyphs for the background.
function iconLayer(color, opacity) {
  const glyphs = [
    '<path d="M12 2 22 9 12 22 2 9Z"/>', // gem
    '<path d="M8 4l-6 8 6 8M16 4l6 8-6 8"/>', // code brackets
    '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>', // gear-ish
    '<path d="M3 5h18v14H3zM6 9l3 3-3 3M13 15h5"/>', // terminal
    '<path d="M12 21s-8-5-8-11a5 5 0 0 1 8-3 5 5 0 0 1 8 3c0 6-8 11-8 11Z"/>', // heart
    '<path d="M4 7h16M4 12h10M4 17h13"/>', // lines
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>', // spark
    '<path d="M6 3v18M6 3l12 4-12 4"/>', // flag
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
  return `<svg class="icons" style="opacity:${opacity}" viewBox="0 0 1360 800" preserveAspectRatio="xMidYMid slice">${cells.join("")}</svg>`;
}

// ---------------------------------------------------------------------------
// HTML templates
// ---------------------------------------------------------------------------
const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@700&family=Inter:wght@600;800&display=swap" rel="stylesheet">`;

function baseCss(theme) {
  const glow = theme.glow
    ? `background-image: radial-gradient(circle at ${theme.glow.x} ${theme.glow.y}, ${hexA(theme.glow.color, theme.glow.strength)}, transparent 60%), linear-gradient(${theme.bg.from}, ${theme.bg.to});`
    : `background-image: linear-gradient(${theme.bg.from}, ${theme.bg.to});`;
  return `
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:1280px; height:720px; overflow:hidden; }
    .frame { position:relative; width:1280px; height:720px; ${glow} color:${theme.ink};
      font-family:'Inter',system-ui,sans-serif; }
    .icons { position:absolute; inset:0; width:100%; height:100%; }
    .wordmark { position:absolute; top:44px; left:56px; height:34px; z-index:3; }
    .wordmark svg { height:34px; width:auto; display:block; }
    .label { position:absolute; top:48px; right:56px; z-index:3; letter-spacing:.22em;
      font-weight:800; font-size:20px; text-transform:uppercase; opacity:.85; }
    .content { position:absolute; inset:0; z-index:2; display:flex; align-items:center;
      gap:56px; padding:120px 72px 96px; }
    .photo { flex:0 0 auto; width:360px; height:360px; border-radius:50%;
      border:10px solid ${theme.accent}; background:#0002 center/cover no-repeat; box-shadow:0 18px 48px #0007; }
    .titlewrap { flex:1 1 auto; min-width:0; display:flex; flex-direction:column;
      justify-content:center; gap:6px; }
    .title-left { align-items:flex-start; text-align:left; }
    .title-right { align-items:flex-start; text-align:left; }
    .tline { font-family:'Anton',sans-serif; font-weight:400; line-height:.94;
      font-size:104px; letter-spacing:.005em; text-transform:uppercase; }
    .tline.hl { display:inline-block; background:${theme.accent}; color:${theme.accentInk};
      padding:2px 16px 8px; border-radius:6px; margin-top:6px; }
    .name { position:absolute; bottom:70px; z-index:3; font-family:'Caveat',cursive;
      font-weight:700; font-size:52px; opacity:.95; }
    .badge-circle { position:absolute; bottom:52px; right:64px; z-index:3; width:112px; height:112px;
      border-radius:50%; border:4px solid ${theme.accent}; display:flex; flex-direction:column;
      align-items:center; justify-content:center; background:#0003; }
    .badge-circle .yr { font-family:'Anton',sans-serif; font-size:38px; line-height:1; }
    .badge-circle .wave { font-size:16px; opacity:.7; margin-top:2px; }
  `;
}

// hex + alpha(0..1) -> rgba
function hexA(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function talkHtml(repo, theme, year, talk) {
  const lines = wrapTitle(talk.title);
  const photo = dataUri(repo, talk.authorImage);
  const photoSide = theme.headshotSide === "right" ? "row-reverse" : "row";
  const nameSide = theme.headshotSide === "right" ? "left:96px;" : "right:96px; text-align:right;";
  const lineHtml = lines
    .map((l, i) => `<span class="tline${i === lines.length - 1 ? " hl" : ""}">${escapeHtml(l)}</span>`)
    .join("");
  const badge =
    theme.badge === "circle"
      ? `<div class="badge-circle"><span class="yr">${year}</span><span class="wave">〜〜〜</span></div>`
      : `<div class="label">${year} · Talk</div>`;
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>${baseCss(theme)}
    .content { flex-direction:${photoSide}; }
    .name { ${nameSide} }</style></head>
    <body><div class="frame">
      ${iconLayer(theme.iconColor, theme.iconOpacity)}
      <div class="wordmark">${wordmark(repo, theme.ink)}</div>
      ${theme.badge === "circle" ? "" : badge}
      <div class="content">
        <div class="photo" style="${photo ? `background-image:url('${photo}')` : ""}"></div>
        <div class="titlewrap title-${theme.headshotSide}">${lineHtml}</div>
      </div>
      <div class="name">${escapeHtml(talk.author)}</div>
      ${theme.badge === "circle" ? badge : ""}
    </div></body></html>`;
}

function coverHtml(repo, theme, year, talks) {
  const cells = talks
    .map((t, i) => {
      const photo = dataUri(repo, t.authorImage);
      const ring = theme.ringColors[i % theme.ringColors.length];
      return `<div class="gcell" style="border-color:${ring};${photo ? `background-image:url('${photo}')` : ""}"></div>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS_LINK}<style>${baseCss(theme)}
    .grid { position:absolute; z-index:2; top:96px; left:64px; width:560px;
      display:grid; grid-template-columns:repeat(3,1fr); gap:26px; }
    .gcell { width:100%; aspect-ratio:1; border-radius:50%; border:6px solid ${theme.accent};
      background:#0002 center/cover no-repeat; box-shadow:0 10px 24px #0006; }
    .big { position:absolute; z-index:2; right:96px; top:206px; text-align:right; }
    .big .yr { font-family:'Anton',sans-serif; font-size:220px; line-height:.9; }
    .big .lineup { letter-spacing:.24em; font-weight:800; text-transform:uppercase;
      font-size:22px; opacity:.85; margin-top:10px; }
    .url { position:absolute; z-index:3; bottom:44px; right:64px; letter-spacing:.12em;
      font-weight:600; font-size:18px; opacity:.7; text-transform:uppercase; }
    </style></head>
    <body><div class="frame">
      ${iconLayer(theme.iconColor, theme.iconOpacity)}
      <div class="wordmark">${wordmark(repo, theme.ink)}</div>
      <div class="grid">${cells}</div>
      <div class="big"><div class="yr">${year}</div><div class="lineup">The Full Lineup</div></div>
      <div class="url">brightonruby.com</div>
    </div></body></html>`;
}

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------------------------------------------------------------------------
// descriptions doc
// ---------------------------------------------------------------------------
function descriptionsMarkdown(year, talks) {
  const foot =
    "Brighton Ruby is a summer-y, friendly, one-day Ruby conference held in Brighton, UK.\nhttps://brightonruby.com\n\n#BrightonRuby #Ruby #RubyOnRails";
  const blocks = talks.map((t) => {
    const socials = t.social
      .filter((s) => s && s.name && s.url && s.name !== "TBD" && s.url !== "TBD")
      .map((s) => `${s.name}: ${s.url}`)
      .join("\n");
    const abstract = t.abstract && t.abstract !== "TBD" ? t.abstract : "[ADD DESCRIPTION]";
    const bio = t.bio || "[ADD BIO]";
    return (
      `## ${t.author} — ${t.title}\n\n` +
      "```\n" +
      `${abstract}\n\n` +
      `Talk by ${t.author} at Brighton Ruby ${year}.\n\n` +
      `${bio}\n\n` +
      (socials ? socials + "\n\n" : "") +
      foot +
      "\n```\n"
    );
  });
  return (
    `# Brighton Ruby ${year} — YouTube descriptions\n\n` +
    "Copy-paste ready. One block per talk, in schedule order.\n\n---\n\n" +
    blocks.join("\n---\n\n")
  );
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const a = parseArgs(process.argv);
  if (a.help || !a.year) {
    console.log(HELP);
    process.exit(a.year ? 0 : 1);
  }
  const theme = loadTheme(a.year);
  let talks = readTalks(a.repo, a.year);
  if (a.only) talks = talks.filter((t) => t.title.toLowerCase().includes(a.only.toLowerCase()));
  if (talks.length === 0) throw new Error("No matching talks found.");

  const outDir = a.out || path.join(a.repo, "thumbnail-concepts", `final-${a.year}`);
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`\nBrighton Ruby ${a.year} — ${talks.length} talk(s) → ${outDir}\n`);

  if (a.descriptions) {
    const md = descriptionsMarkdown(a.year, talks);
    const p = path.join(outDir, `youtube-descriptions-${a.year}.md`);
    fs.writeFileSync(p, md);
    console.log(`✓ ${path.basename(p)}`);
  }

  if (a.thumbnails || a.cover) {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

    if (a.thumbnails) {
      for (const t of talks) {
        await page.setContent(talkHtml(a.repo, theme, a.year, t), { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        const name = `${safeName(t.title)} - ${t.author} [Brighton Ruby ${a.year}].png`;
        await page.screenshot({ path: path.join(outDir, name), clip: { x: 0, y: 0, width: 1280, height: 720 } });
        console.log(`✓ ${name}`);
      }
    }

    if (a.cover) {
      await page.setContent(coverHtml(a.repo, theme, a.year, talks), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const name = `Brighton Ruby ${a.year} - Playlist Cover.png`;
      await page.screenshot({ path: path.join(outDir, name), clip: { x: 0, y: 0, width: 1280, height: 720 } });
      console.log(`✓ ${name}`);
    }

    await browser.close();
  }

  console.log(`\nDone.\n`);
}

main().catch((e) => {
  console.error("\n✖", e.message, "\n");
  process.exit(1);
});
