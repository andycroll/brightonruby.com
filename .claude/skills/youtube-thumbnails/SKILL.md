---
name: youtube-thumbnails
description: Explore and generate Brighton Ruby YouTube talk thumbnails, playlist covers and descriptions for a conference year, then (optionally) push videos into YouTube playlists via the Data API. Use when preparing a year's talk videos for YouTube — exploring thumbnail design directions, rendering the chosen one across all talks, writing descriptions, or uploading/organising videos into a playlist.
---

# Brighton Ruby — YouTube thumbnails & playlists

This skill is a **design workflow, not a one-shot renderer**. For each year you
diverge (generate a spread of distinct concept options), winnow with the user,
then converge (lock one and render the whole year). An HTML/CSS template engine
with pluggable layouts is the renderer behind it. Talk data comes from
`_posts/<year>/`; the wordmark is the **era-correct logo** for the year.

## The loop: explore → winnow → build

**1. Diverge — author concepts.** Write several *distinct* concept files (not
recolours of one idea) to `thumbnail-concepts/explore-<year>/concepts/<id>.json`.
Vary the load-bearing choices: `layout` (classic / poster / ticket), palette,
`motif`, headshot shape/side, title treatment. Each file is a theme object plus a
`"label"`. Copy from `themes.json` (`_example_poster`, `_example_ticket`, `2026`)
as starting points.

**2. Render the contact sheet.**
```bash
cd .claude/skills/youtube-thumbnails && npm install   # first time (downloads Chromium)
node generate.mjs sheet --year 2027 --rep "Ethiopia"
```
Produces `thumbnail-concepts/explore-2027/`: a `previews/<id>.png` per concept and
a labelled `contact-sheet.png`. **Show the contact sheet to the user.**

**3. Winnow + iterate.** Ask which direction they like. Then author *variations
around the favourite* (shift palette, swap motif, try the other headshot side),
drop them in `concepts/`, and re-run `sheet`. Repeat until one wins. This is the
whole point — keep it a conversation, not a single pass.

**4. Converge — build the year** from the chosen concept file:
```bash
node generate.mjs build --year 2027 --concept thumbnail-concepts/explore-2027/concepts/<winner>.json --descriptions
```
Outputs to `thumbnail-concepts/final-2027/`: `<Talk> - <Speaker> [Brighton Ruby
2027].png` per talk, `Brighton Ruby 2027 - Playlist Cover.png`, and
`youtube-descriptions-2027.md`.

## Concept file schema

A concept is a standalone JSON theme object. Fields (unset → `themes.json`
`default`):
- `label` — shown on the contact sheet.
- `layout` — `classic` (dark, photo beside title, accent box) | `poster`
  (light seaside, sun+rays, squiggle underline) | `ticket` (colour field,
  perforated edge, bleeding rectangular headshot, recording tag).
- Palette: `bg` (`{from,to}` gradient), `ink`, `accent`, `accentInk`, `ringColors`.
- `motif`: `icons` | `rays` | `flat` + `iconColor`/`iconOpacity` (+ `motifOrigin`).
- `headshotShape`: `circle` | `rounded` | `bleed`; `headshotSide`: `left` | `right`.
- `titleTreatment`: `box` | `underline` | `plain`.
- Per-layout extras: `glow` (classic), `badge` (`label`/`circle`), `sun` (poster),
  `titleAccent` + `tag` (ticket).

## Era-correct logos (`logos.json`)

Branding changed over the years, so the wordmark is resolved per year:
`{ "file": "images/…" }` for a logo in the tree, or `{ "git": "<rev>:<path>" }`
to pull a historical one from git history (cached in `.logo-cache/`, gitignored).
The current map is a **best guess from git history** — eyeball it per year and
adjust (e.g. `git show 0d0e5b6:images/logo.svg` is the 2017–2023 emblem;
`5f51296`/`1fc31fa:images/logo.png` are the 2014/2015 raster marks). SVGs are
recoloured to the theme ink; raster logos are placed as-is.

## Add a whole new layout

Drop a module in `lib/layouts/` exporting `talk(ctx)`, `cover(ctx)`, `label`
(`ctx` = `{ repo, theme, year, talk|talks, logo }`; see `poster.mjs`), and register
it in `lib/layouts/index.mjs`. Reuse `lib/helpers.mjs` (wordmark, headshot data-URI,
`wrapTitle`, `motifLayer`, `frameBg`).

## Notes

- **Data source:** `_posts/<year>/*.md` with `title` + `author` and no `break: true`.
  Headshot = `author_image` (fallback `/images/<year>/speakers/<slug>.jpg`). Optional
  `role:` shows a role line where the layout supports it. Posts with broken YAML
  frontmatter are skipped with a warning (old years have quirks).
- **Fonts:** Google Fonts (Anton = display, Caveat = script, Inter = labels), close
  swappable stand-ins for the brand fonts (edit `lib/helpers.mjs`). First render
  needs network to fetch them.
- **Filenames** follow the existing convention: `:` → `,`, `/` → `-`.
- Review output before uploading; multi-speaker talks use the single `author_image`.

## Upload / organise videos on YouTube

See `youtube/SETUP.md` for one-time Google Cloud OAuth setup, then use
`youtube/upload.py` to create a playlist, add already-uploaded videos, set
thumbnails, update descriptions, or upload new files — individually or in bulk via
`manifest.json`. Secrets (`client_secret.json`, `token.json`) are gitignored.
```bash
cd youtube && pip install -r requirements.txt && python upload.py --help
```
