---
name: youtube-thumbnails
description: Generate Brighton Ruby YouTube talk thumbnails, playlist covers and descriptions for a conference year, and (optionally) push videos into YouTube playlists via the Data API. Use when preparing a year's talk videos for YouTube — creating thumbnails, a playlist cover, description text, or uploading/organising videos into a playlist.
---

# Brighton Ruby — YouTube thumbnails & playlists

Produces the YouTube assets for a conference year: a 1280×720 thumbnail per talk,
a playlist cover, and a copy/paste descriptions doc. Talk data (title, speaker,
headshot, bio, socials, abstract) is read straight from `_posts/<year>/`, so the
only per-year input you author is a **theme** in `themes.json` — which picks a
**layout** and its palette/options.

## Layouts (archetypes)

Each year picks a structurally different layout, not just a recolour. They live
in `lib/layouts/` and are pluggable:

- **`classic`** — "emerge from black": dark, photo beside the title, last title
  line in an accent box. The 2025/2026 finals use this.
- **`poster`** — "seaside": light/airy, radiating sun + rays, pill label,
  hand-drawn underline squiggle, ringed circular headshot. Use a light palette.
- **`ticket`** — "ticket stub": bold colour field, perforated ticket edge, a
  large rectangular headshot bleeding off-frame, a recording tag. Saturated
  palette.

Preview any layout on real talk data with `--theme`:

```bash
node generate.mjs --year 2026 --theme _example_poster --only "Ethiopia" --no-cover
node generate.mjs --year 2026 --theme _example_ticket --only "Ethiopia" --no-cover
```

## Generate assets for a year

```bash
cd .claude/skills/youtube-thumbnails
npm install                 # first time only; downloads Chromium via Playwright
node generate.mjs --year 2027 --descriptions
```

Outputs to `thumbnail-concepts/final-<year>/`:
- `<Talk Title> - <Speaker> [Brighton Ruby <year>].png` per talk
- `Brighton Ruby <year> - Playlist Cover.png`
- `youtube-descriptions-<year>.md` (with `--descriptions`)

Flags: `--layout NAME` (override the theme's layout), `--theme KEY` (use a
specific themes.json entry on this year's data), `--only "substring"`,
`--no-cover`, `--no-thumbnails`, `--out DIR`, `--repo PATH`. `node generate.mjs
--help` lists everything.

## Make a new-year variant

Add an entry to `themes.json` keyed by the year (copy `2026`, `_example_poster`,
or `_example_ticket` and tweak). Fields:

- `layout` — `classic` | `poster` | `ticket`.
- **Palette** — `bg` (top→bottom gradient; equal `from`/`to` for flat), `ink`,
  `accent`, `accentInk`, `ringColors` (cycle across the cover grid).
- **Background motif** — `motif`: `icons` | `rays` | `flat`, with
  `iconColor`/`iconOpacity` (and `motifOrigin` for rays).
- **Headshot** — `headshotShape`: `circle` | `rounded` | `bleed`;
  `headshotSide`: `left` | `right`.
- **Title** — `titleTreatment`: `box` | `underline` | `plain`.
- **Per-layout extras** — `glow` (classic dark glow), `badge` (`label`/`circle`),
  `sun` (poster sun colour), `titleAccent` + `tag` (ticket).

Omitted fields fall back to `default`. A year with no entry still renders on the
default (classic) palette and warns.

## Add a whole new layout

Drop a module in `lib/layouts/` exporting `talk(ctx)`, `cover(ctx)`, and `label`
(see `poster.mjs` for a template — `ctx` is `{ repo, theme, year, talk|talks }`),
then register it in `lib/layouts/index.mjs`. Reuse the shared primitives in
`lib/helpers.mjs` (wordmark, headshot data-URI, title wrap, motif layers, glow).

## Notes

- **Data source:** any `_posts/<year>/*.md` with a `title` + `author` and without
  `break: true`. Headshot comes from `author_image` (falls back to
  `/images/<year>/speakers/<author_slug>.jpg`). An optional `role:` in a post's
  frontmatter shows as the speaker's role line where the layout supports it.
- **Fonts:** the template loads Google Fonts (Anton = display, Caveat = script,
  Inter = labels) — close, swappable stand-ins for the brand fonts (edit
  `lib/helpers.mjs`). Rendering needs network access the first time to fetch them.
- **Filenames** follow the existing convention: `:` → `,`, `/` → `-`.
- Review output before uploading. Multi-speaker talks use the single
  `author_image`; composite headshots still need a manual pass.

## Upload / organise videos on YouTube

See `youtube/SETUP.md` for one-time Google Cloud OAuth setup, then use
`youtube/upload.py` to create a playlist, add already-uploaded videos to it, set
thumbnails, update descriptions, or upload new video files — individually or in
bulk from a `manifest.json`. Secrets (`client_secret.json`, `token.json`) are
gitignored.

```bash
cd youtube && pip install -r requirements.txt && python upload.py --help
```
