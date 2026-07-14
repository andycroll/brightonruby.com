# YouTube Data API — one-time setup

Uploading videos, editing metadata and modifying playlists are *write*
operations, so they need OAuth on an account that owns (or manages) the
Brighton Ruby YouTube channel. A plain API key is **not** enough.

Do this once; the token is cached afterwards.

## 1. Create a Google Cloud project + enable the API

1. Go to <https://console.cloud.google.com/> and create a project (e.g. `brighton-ruby-youtube`).
2. **APIs & Services → Library →** search "YouTube Data API v3" → **Enable**.

## 2. Configure the OAuth consent screen

1. **APIs & Services → OAuth consent screen.**
2. User type **External**. Fill app name, your support email, developer email.
3. Add the scope `https://www.googleapis.com/auth/youtube`.
4. Under **Test users**, add the Google account that manages the channel.
   (In "Testing" mode a token lasts 7 days; that's fine for a batch run.
   Click **Publish app** if you want a long-lived refresh token.)

## 3. Create the OAuth client credential

1. **APIs & Services → Credentials → Create credentials → OAuth client ID.**
2. Application type: **Desktop app**. Name it anything.
3. **Download JSON**, rename it to `client_secret.json`, and put it in this
   directory (`.claude/skills/youtube-thumbnails/youtube/`).

`client_secret.json` and the generated `token.json` are gitignored — never
commit them.

## 4. Authorise

```bash
cd .claude/skills/youtube-thumbnails/youtube
pip install -r requirements.txt        # or: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
python upload.py auth
```

A browser opens; sign in with the channel-managing account and approve. On
success you'll see `✓ Authorised.` and `token.json` appears.

## 5. Use it

See the examples at the top of `upload.py --help`. Typical flow for a year:

```bash
# 1. create the playlist (or reuse an existing id)
python upload.py create-playlist --title "Brighton Ruby 2027" \
  --description "Talks from Brighton Ruby 2027, held in Brighton, UK." --privacy public
# -> prints PLAYLIST_ID

# 2. drive the whole set from a manifest
python upload.py sync --manifest manifest.json
```

## Quota note

The API allows **10,000 units/day**. A video **upload costs ~1,600 units**
(so ~6 full uploads/day), while adding to a playlist, setting a thumbnail, or
updating metadata are ~50 units each (cheap). If you're only assigning
already-uploaded videos to playlists + setting thumbnails/descriptions, you'll
stay well within quota. Large upload batches may need to span days or a quota
increase.

## manifest.json shape

```json
{
  "create_playlist": { "title": "Brighton Ruby 2027", "description": "…", "privacy": "public" },
  "defaults": { "privacy": "private", "category": "28", "tags": "ruby,rails,brightonruby" },
  "items": [
    { "video": "VIDEOID", "thumbnail": "…/Talk - Speaker [Brighton Ruby 2027].png", "description_file": "desc/talk.txt" },
    { "file": "assets/Talk - Speaker.mp4", "title": "Talk Title", "thumbnail": "…png", "description_file": "desc/talk.txt" }
  ]
}
```

- Entries with `"video"` operate on an **already-uploaded** video (add to
  playlist / set thumbnail / update description).
- Entries with `"file"` **upload** a new video (then add to playlist / set
  thumbnail). `category` 28 = Science & Technology, 27 = Education.
