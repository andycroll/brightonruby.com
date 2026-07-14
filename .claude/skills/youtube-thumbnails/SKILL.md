---
name: youtube-thumbnails
description: Generate Brighton Ruby YouTube talk thumbnails, playlist covers and descriptions for a conference year, and (optionally) push videos into YouTube playlists via the Data API. Use when preparing a year's talk videos for YouTube — creating thumbnails, a playlist cover, description text, or uploading/organising videos into a playlist.
---

# Brighton Ruby — YouTube thumbnails & playlists

Produces the YouTube assets for a conference year in the house style: a 1280×720
thumbnail per talk, a playlist cover, and a copy/paste descriptions doc. Talk
data (title, speaker, headshot, bio, socials, abstract) is read straight from
`_posts/<year>/`, so the only per-year input you author is a **theme** — a new
colour/branding *variant* of the established style.

The style: Brighton Ruby wordmark (the real `images/logo.svg`) top-left, a big
condensed uppercase title with the last line in an accent highlight box, a
circular speaker headshot with an accent ring, the speaker's name in a script
font, a year badge, and a faint scattered Ruby/dev-icon background. 2025 is teal;
2026 is near-black with a red glow. New years get their own variant.

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

Useful flags: `--only "substring"` (render one talk while iterating),
`--no-cover`, `--no-thumbnails`, `--out DIR`, `--repo PATH`. Run
`node generate.mjs --help` for all of them.

## Make a new-year variant

Add an entry to `themes.json` keyed by the year (copy `2025`/`2026` and tweak).
Fields: `bg` (top→bottom gradient; equal `from`/`to` for flat), `ink` (text),
`accent` (highlight box + rings), `ringColors` (cycle across the cover grid),
`iconColor`/`iconOpacity` (background glyphs), `headshotSide` (`left`/`right`),
`glow` (radial highlight for dark themes), `badge` (`label` or `circle`). Omitted
fields fall back to `default`. If a year has no entry, generation still runs on
the default palette and warns.

## Notes

- **Data source:** any `_posts/<year>/*.md` with a `title` + `author` and without
  `break: true`. Headshot comes from `author_image` (falls back to
  `/images/<year>/speakers/<author_slug>.jpg`).
- **Fonts:** the template loads Google Fonts (Anton for the display title, Caveat
  for the script name, Inter for labels) — close matches to the brand look and
  easy to swap in `generate.mjs` if you have the exact brand fonts. Rendering
  needs network access the first time to fetch them.
- **Filenames** follow the existing convention: `:` → `,`, `/` → `-`.
- Review output in `thumbnail-concepts/final-<year>/` before uploading. Two- or
  multi-speaker talks use the single `author_image`; composite headshots (e.g.
  the 2025 fireside) still need a manual pass.

## Upload / organise videos on YouTube

See `youtube/SETUP.md` for one-time Google Cloud OAuth setup, then use
`youtube/upload.py` to create a playlist, add already-uploaded videos to it, set
thumbnails, update descriptions, or upload new video files — individually or in
bulk from a `manifest.json`. This is the path for "create a playlist for the
year and drop the talks in" from the generated assets. Secrets
(`client_secret.json`, `token.json`) are gitignored.
```bash
cd youtube && pip install -r requirements.txt && python upload.py --help
```
