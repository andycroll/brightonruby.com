#!/usr/bin/env node
// Brighton Ruby — YouTube asset generator.
//
// Two modes, built for a divergent→converge workflow:
//
//   sheet   Render a spread of candidate CONCEPTS (each a JSON theme file) for one
//           representative talk, plus a labelled contact sheet to winnow from.
//   build   Render the whole year (every talk + playlist cover [+ descriptions])
//           from a single chosen concept file (or a themes.json entry).
//
// Concepts are standalone JSON files (a theme object + a "label"); the selected
// one is passed to `build --concept`. Talk data comes from _posts/<year>/; the
// wordmark is the era-correct logo for the year (see logos.json).
//
// First run: `npm install` here (downloads Chromium via Playwright).
//
//   node generate.mjs sheet --year 2027 [--concepts DIR] [--rep "substring"] [--out DIR]
//   node generate.mjs build --year 2027 --concept path/to/chosen.json [--descriptions]
//   node generate.mjs build --year 2026            # falls back to themes.json[2026]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { chromium } from "playwright";
import { getLayout, layouts } from "./lib/layouts/index.mjs";
import { resolveLogo } from "./lib/helpers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(__dirname, ".logo-cache");

function parseArgs(argv) {
  const a = {
    mode: "build", year: null, concept: null, theme: null, layout: null,
    concepts: null, rep: null, out: null, only: null,
    repo: path.resolve(__dirname, "../../.."),
    thumbnails: true, cover: true, descriptions: false,
  };
  const rest = [];
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--year") a.year = argv[++i];
    else if (arg === "--concept") a.concept = argv[++i];
    else if (arg === "--concepts") a.concepts = argv[++i];
    else if (arg === "--theme") a.theme = argv[++i];
    else if (arg === "--layout") a.layout = argv[++i];
    else if (arg === "--rep") a.rep = argv[++i];
    else if (arg === "--out") a.out = argv[++i];
    else if (arg === "--only") a.only = argv[++i];
    else if (arg === "--repo") a.repo = path.resolve(argv[++i]);
    else if (arg === "--no-thumbnails") a.thumbnails = false;
    else if (arg === "--no-cover") a.cover = false;
    else if (arg === "--descriptions") a.descriptions = true;
    else if (arg === "--help" || arg === "-h") a.help = true;
    else if (!arg.startsWith("-")) rest.push(arg);
  }
  if (rest[0]) a.mode = rest[0];
  return a;
}

const HELP = `Brighton Ruby YouTube asset generator

  node generate.mjs sheet --year 2027 [options]     explore concepts → contact sheet
  node generate.mjs build --year 2027 [options]     render the whole year

Common options:
  --year YYYY        Conference year (reads _posts/YYYY, picks era logo). Required.
  --out DIR          Output dir (sheet: explore-YYYY; build: final-YYYY).
  --repo PATH        Site repo path (default: inferred from skill location).

sheet:
  --concepts DIR     Dir of concept *.json files (default: <repo>/thumbnail-concepts/explore-YYYY/concepts).
  --rep "substring"  Which talk to render as the representative sample (default: first).

build:
  --concept FILE     Concept JSON to render the year from (the winner).
  --theme KEY        Use a themes.json entry instead of a concept file.
  --layout NAME      Override layout (${Object.keys(layouts).join(" | ")}).
  --only "substring" Render only matching talks.
  --no-cover | --no-thumbnails | --descriptions

Layouts: ${Object.entries(layouts).map(([k, v]) => `${k} (${v.label})`).join(", ")}
`;

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const themesBase = () => readJson(path.join(__dirname, "themes.json")).default;
const logosMap = () => readJson(path.join(__dirname, "logos.json"));

function themeFrom(a) {
  const base = themesBase();
  if (a.concept) return { ...base, ...readJson(path.resolve(a.concept)) };
  const themes = readJson(path.join(__dirname, "themes.json"));
  if (a.theme) {
    if (!themes[a.theme]) throw new Error(`No "${a.theme}" entry in themes.json.`);
    return { ...base, ...themes[a.theme] };
  }
  const yr = themes[String(a.year)];
  if (!yr) console.warn(`\n⚠  No concept/theme for ${a.year}; using default palette.\n`);
  return { ...base, ...(yr || {}) };
}

const slugAuthor = (name) =>
  name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const safeName = (s) =>
  s.replace(/:/g, ",").replace(/[\/\\]/g, "-").replace(/["<>|*?]/g, "").replace(/\s+/g, " ").trim();

function readTalks(repo, year) {
  const dir = path.join(repo, "_posts", String(year));
  if (!fs.existsSync(dir)) throw new Error(`No posts directory: ${dir}`);
  const talks = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".md")) continue;
    let data, content;
    try {
      ({ data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8")));
    } catch (e) {
      console.warn(`⚠  skipping ${file}: frontmatter parse error (${e.reason || e.message})`);
      continue;
    }
    if (data.break === true || !data.title || !data.author) continue;
    talks.push({
      file,
      title: String(data.title),
      author: String(data.author),
      authorImage: data.author_image || `/images/${year}/speakers/${slugAuthor(data.author)}.jpg`,
      role: data.role ? String(data.role) : null,
      bio: data.author_bio_markdown ? String(data.author_bio_markdown) : "",
      social: Array.isArray(data.author_social) ? data.author_social : [],
      abstract: data.description && data.description !== "TBD" ? String(data.description) : content.trim(),
    });
  }
  return talks;
}

function descriptionsMarkdown(year, talks) {
  const foot =
    "Brighton Ruby is a summer-y, friendly, one-day Ruby conference held in Brighton, UK.\nhttps://brightonruby.com\n\n#BrightonRuby #Ruby #RubyOnRails";
  const blocks = talks.map((t) => {
    const socials = t.social
      .filter((s) => s && s.name && s.url && s.name !== "TBD" && s.url !== "TBD")
      .map((s) => `${s.name}: ${s.url}`).join("\n");
    const abstract = t.abstract && t.abstract !== "TBD" ? t.abstract : "[ADD DESCRIPTION]";
    return (
      `## ${t.author} — ${t.title}\n\n\`\`\`\n${abstract}\n\n` +
      `Talk by ${t.author} at Brighton Ruby ${year}.\n\n${t.bio || "[ADD BIO]"}\n\n` +
      (socials ? socials + "\n\n" : "") + foot + "\n\`\`\`\n"
    );
  });
  return `# Brighton Ruby ${year} — YouTube descriptions\n\nCopy-paste ready. One block per talk, in schedule order.\n\n---\n\n${blocks.join("\n---\n\n")}`;
}

async function withPage(fn) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  try {
    return await fn(page);
  } finally {
    await browser.close();
  }
}

async function shoot(page, html, outPath, w = 1280, h = 720) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: w, height: h } });
}

// -- contact sheet (montage of concept previews) ----------------------------
function contactSheetHtml(cards) {
  const cols = cards.length <= 4 ? 2 : 3;
  const cw = 520, ch = Math.round((cw * 720) / 1280);
  const cells = cards
    .map(
      (c) =>
        `<figure><img src="${c.dataUri}" width="${cw}" height="${ch}"><figcaption><b>${c.id}</b>${c.label ? " — " + c.label : ""}<br><span>${c.meta}</span></figcaption></figure>`
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#111;color:#eee;font-family:system-ui,sans-serif;padding:28px;width:${cols * (cw + 28) + 28}px}
    .grid{display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:28px}
    figure{background:#1c1c1c;border-radius:10px;overflow:hidden;box-shadow:0 6px 20px #0008}
    img{display:block;width:${cw}px;height:${ch}px;object-fit:cover}
    figcaption{padding:10px 14px;font-size:15px;line-height:1.4}
    figcaption b{font-size:16px}figcaption span{opacity:.6;font-size:13px}
  </style></head><body><div class="grid">${cells}</div></body></html>`;
}

async function modeSheet(a) {
  const conceptsDir = a.concepts || path.join(a.repo, "thumbnail-concepts", `explore-${a.year}`, "concepts");
  if (!fs.existsSync(conceptsDir)) throw new Error(`No concepts dir: ${conceptsDir}\n   Author concept *.json files there first (see SKILL.md).`);
  const files = fs.readdirSync(conceptsDir).filter((f) => f.endsWith(".json")).sort();
  if (!files.length) throw new Error(`No *.json concepts in ${conceptsDir}`);

  const talks = readTalks(a.repo, a.year);
  const rep = a.rep ? talks.find((t) => t.title.toLowerCase().includes(a.rep.toLowerCase())) : talks[0];
  if (!rep) throw new Error("Representative talk not found.");
  const logo = resolveLogo(a.repo, a.year, logosMap(), CACHE);

  const outDir = a.out || path.join(a.repo, "thumbnail-concepts", `explore-${a.year}`);
  const previews = path.join(outDir, "previews");
  fs.mkdirSync(previews, { recursive: true });
  console.log(`\nExplore ${a.year} — ${files.length} concept(s), rep talk "${rep.title}"\n`);

  const base = themesBase();
  const cards = await withPage(async (page) => {
    const out = [];
    for (const f of files) {
      const id = f.replace(/\.json$/, "");
      const theme = { ...base, ...readJson(path.join(conceptsDir, f)) };
      const layout = getLayout(a.layout || theme.layout);
      const html = layout.talk({ repo: a.repo, theme, year: a.year, talk: rep, logo });
      const png = path.join(previews, `${id}.png`);
      await shoot(page, html, png);
      const meta = `${theme.layout || "classic"} · ${theme.motif || "icons"} · ${(theme.bg && theme.bg.from) || ""}`;
      out.push({ id, label: theme.label || "", meta, dataUri: `data:image/png;base64,${fs.readFileSync(png).toString("base64")}` });
      console.log(`✓ ${id}`);
    }
    const sheetPng = path.join(outDir, "contact-sheet.png");
    const cols = out.length <= 4 ? 2 : 3;
    const cw = 520, ch = Math.round((cw * 720) / 1280);
    const rows = Math.ceil(out.length / cols);
    await shoot(page, contactSheetHtml(out), sheetPng, cols * (cw + 28) + 28, rows * (ch + 70) + 28);
    console.log(`\n✓ contact-sheet.png → ${outDir}`);
    return out;
  });
  console.log(`\nWinnow, then: node generate.mjs build --year ${a.year} --concept ${conceptsDir}/<id>.json\n`);
  return cards;
}

async function modeBuild(a) {
  const theme = themeFrom(a);
  if (a.layout) theme.layout = a.layout;
  const layout = getLayout(theme.layout);
  const logo = resolveLogo(a.repo, a.year, logosMap(), CACHE);

  let talks = readTalks(a.repo, a.year);
  if (a.only) talks = talks.filter((t) => t.title.toLowerCase().includes(a.only.toLowerCase()));
  if (!talks.length) throw new Error("No matching talks found.");

  const outDir = a.out || path.join(a.repo, "thumbnail-concepts", `final-${a.year}`);
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`\nBuild ${a.year} — layout "${theme.layout || "classic"}"${theme.label ? ` (${theme.label})` : ""} — ${talks.length} talk(s) → ${outDir}\n`);

  if (a.descriptions) {
    const p = path.join(outDir, `youtube-descriptions-${a.year}.md`);
    fs.writeFileSync(p, descriptionsMarkdown(a.year, talks));
    console.log(`✓ ${path.basename(p)}`);
  }
  if (a.thumbnails || a.cover) {
    await withPage(async (page) => {
      if (a.thumbnails) {
        for (const talk of talks) {
          const html = layout.talk({ repo: a.repo, theme, year: a.year, talk, logo });
          const name = `${safeName(talk.title)} - ${talk.author} [Brighton Ruby ${a.year}].png`;
          await shoot(page, html, path.join(outDir, name));
          console.log(`✓ ${name}`);
        }
      }
      if (a.cover) {
        const html = layout.cover({ repo: a.repo, theme, year: a.year, talks, logo });
        const name = `Brighton Ruby ${a.year} - Playlist Cover.png`;
        await shoot(page, html, path.join(outDir, name));
        console.log(`✓ ${name}`);
      }
    });
  }
  console.log(`\nDone.\n`);
}

async function main() {
  const a = parseArgs(process.argv);
  if (a.help || !a.year) {
    console.log(HELP);
    process.exit(a.year ? 0 : 1);
  }
  if (a.mode === "sheet") await modeSheet(a);
  else if (a.mode === "build") await modeBuild(a);
  else throw new Error(`Unknown mode "${a.mode}" (expected: sheet | build).`);
}

main().catch((e) => {
  console.error("\n✖", e.message, "\n");
  process.exit(1);
});
