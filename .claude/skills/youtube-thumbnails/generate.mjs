#!/usr/bin/env node
// Brighton Ruby — YouTube asset generator.
//
// Renders 1280x720 talk thumbnails and a playlist cover for a given year using a
// pluggable HTML/CSS *layout* (lib/layouts/*) driven by _posts/<year> data and a
// per-year theme in themes.json. Optionally emits a YouTube descriptions doc.
//
// Usage:
//   node generate.mjs --year 2027 [--out DIR] [--only "Talk Title"]
//                     [--layout ticket] [--no-thumbnails] [--no-cover]
//                     [--descriptions] [--repo /path/to/site]
//
// First run: `npm install` in this directory (downloads Chromium via Playwright).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { chromium } from "playwright";
import { getLayout, layouts } from "./lib/layouts/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const a = {
    year: null, out: null, only: null, layout: null, theme: null,
    repo: path.resolve(__dirname, "../../.."),
    thumbnails: true, cover: true, descriptions: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--year") a.year = argv[++i];
    else if (arg === "--out") a.out = argv[++i];
    else if (arg === "--only") a.only = argv[++i];
    else if (arg === "--layout") a.layout = argv[++i];
    else if (arg === "--theme") a.theme = argv[++i];
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
  --layout NAME      Override the theme's layout (${Object.keys(layouts).join(" | ")}).
  --theme KEY        Use a specific themes.json entry (e.g. _example_ticket) on
                     --year's talk data. Great for previewing a variant.
  --repo PATH        Path to the site repo (default: inferred from skill location).
  --no-thumbnails    Skip per-talk thumbnails.
  --no-cover         Skip the playlist cover.
  --descriptions     Also write youtube-descriptions-YYYY.md.
  -h, --help         Show this help.

Layouts: ${Object.entries(layouts).map(([k, v]) => `${k} (${v.label})`).join(", ")}
`;

function loadTheme(year, key) {
  const themes = JSON.parse(fs.readFileSync(path.join(__dirname, "themes.json"), "utf8"));
  if (key) {
    if (!themes[key]) throw new Error(`No "${key}" entry in themes.json.`);
    return { ...themes.default, ...themes[key] };
  }
  const yr = themes[String(year)];
  if (!yr) {
    console.warn(
      `\n⚠  No theme for ${year} in themes.json — using the default (classic teal) palette.\n` +
        `   Add a "${year}" entry (copy _example_poster / _example_ticket / 2026) to give it a variant.\n`
    );
  }
  return { ...themes.default, ...(yr || {}) };
}

const slugAuthor = (name) =>
  name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

// YouTube-safe filename, matching the existing convention (":" -> ",", "/" -> "-").
const safeName = (s) =>
  s.replace(/:/g, ",").replace(/[\/\\]/g, "-").replace(/["<>|*?]/g, "").replace(/\s+/g, " ").trim();

function readTalks(repo, year) {
  const dir = path.join(repo, "_posts", String(year));
  if (!fs.existsSync(dir)) throw new Error(`No posts directory: ${dir}`);
  const talks = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".md")) continue;
    const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    if (data.break === true) continue;
    if (!data.title || !data.author) continue;
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
      .map((s) => `${s.name}: ${s.url}`)
      .join("\n");
    const abstract = t.abstract && t.abstract !== "TBD" ? t.abstract : "[ADD DESCRIPTION]";
    return (
      `## ${t.author} — ${t.title}\n\n` +
      "```\n" +
      `${abstract}\n\n` +
      `Talk by ${t.author} at Brighton Ruby ${year}.\n\n` +
      `${t.bio || "[ADD BIO]"}\n\n` +
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

async function main() {
  const a = parseArgs(process.argv);
  if (a.help || !a.year) {
    console.log(HELP);
    process.exit(a.year ? 0 : 1);
  }
  const theme = loadTheme(a.year, a.theme);
  if (a.layout) theme.layout = a.layout;
  const layout = getLayout(theme.layout);

  let talks = readTalks(a.repo, a.year);
  if (a.only) talks = talks.filter((t) => t.title.toLowerCase().includes(a.only.toLowerCase()));
  if (talks.length === 0) throw new Error("No matching talks found.");

  const outDir = a.out || path.join(a.repo, "thumbnail-concepts", `final-${a.year}`);
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`\nBrighton Ruby ${a.year} — layout "${theme.layout || "classic"}" — ${talks.length} talk(s) → ${outDir}\n`);

  if (a.descriptions) {
    const p = path.join(outDir, `youtube-descriptions-${a.year}.md`);
    fs.writeFileSync(p, descriptionsMarkdown(a.year, talks));
    console.log(`✓ ${path.basename(p)}`);
  }

  if (a.thumbnails || a.cover) {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const shoot = async (html, name) => {
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(outDir, name), clip: { x: 0, y: 0, width: 1280, height: 720 } });
      console.log(`✓ ${name}`);
    };

    if (a.thumbnails) {
      for (const talk of talks) {
        const html = layout.talk({ repo: a.repo, theme, year: a.year, talk });
        await shoot(html, `${safeName(talk.title)} - ${talk.author} [Brighton Ruby ${a.year}].png`);
      }
    }
    if (a.cover) {
      const html = layout.cover({ repo: a.repo, theme, year: a.year, talks });
      await shoot(html, `Brighton Ruby ${a.year} - Playlist Cover.png`);
    }
    await browser.close();
  }

  console.log(`\nDone.\n`);
}

main().catch((e) => {
  console.error("\n✖", e.message, "\n");
  process.exit(1);
});
