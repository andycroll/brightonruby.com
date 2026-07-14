#!/usr/bin/env python3
"""Brighton Ruby — YouTube Data API helper.

Create playlists, upload videos, add videos to playlists, set thumbnails and
update metadata for the Brighton Ruby channel.

Setup (once): see SETUP.md. You need `client_secret.json` (an OAuth *Desktop app*
credential) in this directory. First run opens a browser to authorise; the
resulting token is cached in `token.json` so later runs are non-interactive.

Examples:
  # one-time authorisation
  python upload.py auth

  # create a year playlist (prints the playlist id)
  python upload.py create-playlist --title "Brighton Ruby 2027" \\
      --description "Talks from Brighton Ruby 2027." --privacy public

  # add an already-uploaded video to a playlist
  python upload.py add --video VIDEOID --playlist PLAYLISTID

  # set a thumbnail on an existing video
  python upload.py thumbnail --video VIDEOID --file "path/to/thumb.png"

  # update title/description on an existing video
  python upload.py update --video VIDEOID --title "..." --description-file desc.txt

  # upload a new video, add to playlist, set thumbnail in one go
  python upload.py upload --file talk.mp4 --title "..." --description-file desc.txt \\
      --playlist PLAYLISTID --thumbnail thumb.png --privacy private

  # batch everything from a manifest (see --help and SETUP.md)
  python upload.py sync --manifest manifest.json
"""

import argparse
import json
import os
import sys

SCOPES = ["https://www.googleapis.com/auth/youtube"]
HERE = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRET = os.path.join(HERE, "client_secret.json")
TOKEN = os.path.join(HERE, "token.json")


def die(msg):
    print(f"\n✖ {msg}\n", file=sys.stderr)
    sys.exit(1)


def service():
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
    except ImportError:
        die("Missing deps. Run: pip install -r requirements.txt")

    creds = None
    if os.path.exists(TOKEN):
        creds = Credentials.from_authorized_user_file(TOKEN, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CLIENT_SECRET):
                die(f"Missing {CLIENT_SECRET}. See SETUP.md.")
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN, "w") as fh:
            fh.write(creds.to_json())
    return build("youtube", "v3", credentials=creds)


def read_text(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read().strip()


# --- commands --------------------------------------------------------------
def cmd_auth(_):
    service()
    print("✓ Authorised. token.json cached.")


def cmd_create_playlist(a):
    yt = service()
    body = {
        "snippet": {"title": a.title, "description": a.description or ""},
        "status": {"privacyStatus": a.privacy},
    }
    res = yt.playlists().insert(part="snippet,status", body=body).execute()
    print(res["id"])
    return res["id"]


def cmd_add(a):
    yt = service()
    body = {"snippet": {"playlistId": a.playlist, "resourceId": {"kind": "youtube#video", "videoId": a.video}}}
    yt.playlistItems().insert(part="snippet", body=body).execute()
    print(f"✓ added {a.video} -> {a.playlist}")


def cmd_thumbnail(a):
    yt = service()
    yt.thumbnails().set(videoId=a.video, media_body=a.file).execute()
    print(f"✓ thumbnail set on {a.video}")


def cmd_update(a):
    yt = service()
    cur = yt.videos().list(part="snippet", id=a.video).execute()
    if not cur["items"]:
        die(f"Video not found: {a.video}")
    snip = cur["items"][0]["snippet"]
    if a.title:
        snip["title"] = a.title
    if a.description_file:
        snip["description"] = read_text(a.description_file)
    if a.category:
        snip["categoryId"] = a.category
    yt.videos().update(part="snippet", body={"id": a.video, "snippet": snip}).execute()
    print(f"✓ updated {a.video}")


def cmd_upload(a):
    from googleapiclient.http import MediaFileUpload

    yt = service()
    body = {
        "snippet": {
            "title": a.title,
            "description": read_text(a.description_file) if a.description_file else (a.description or ""),
            "tags": a.tags.split(",") if a.tags else [],
            "categoryId": a.category,
        },
        "status": {"privacyStatus": a.privacy, "selfDeclaredMadeForKids": False},
    }
    media = MediaFileUpload(a.file, chunksize=-1, resumable=True, mimetype="video/*")
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    res = None
    while res is None:
        status, res = req.next_chunk()
        if status:
            print(f"  … {int(status.progress() * 100)}%")
    vid = res["id"]
    print(f"✓ uploaded {vid}")
    if a.playlist:
        yt.playlistItems().insert(
            part="snippet",
            body={"snippet": {"playlistId": a.playlist, "resourceId": {"kind": "youtube#video", "videoId": vid}}},
        ).execute()
        print(f"  ✓ added to playlist {a.playlist}")
    if a.thumbnail:
        yt.thumbnails().set(videoId=vid, media_body=a.thumbnail).execute()
        print(f"  ✓ thumbnail set")
    return vid


def cmd_sync(a):
    """Batch driver. manifest.json:
    {
      "playlist": "PLAYLISTID"          # optional; created if "create_playlist" set
      "create_playlist": {"title": "...", "description": "...", "privacy": "public"},
      "defaults": {"privacy": "private", "category": "28", "tags": "ruby,rails"},
      "items": [
        {"video": "VIDEOID", "thumbnail": "a.png", "description_file": "a.txt"},   # existing video
        {"file": "talk.mp4", "title": "...", "thumbnail": "b.png", "description_file": "b.txt"}  # new upload
      ]
    }
    """
    man = json.loads(read_text(a.manifest))
    d = man.get("defaults", {})
    playlist = man.get("playlist")
    if man.get("create_playlist"):
        ns = argparse.Namespace(
            title=man["create_playlist"]["title"],
            description=man["create_playlist"].get("description", ""),
            privacy=man["create_playlist"].get("privacy", "public"),
        )
        playlist = cmd_create_playlist(ns)
    for it in man.get("items", []):
        if it.get("file"):
            ns = argparse.Namespace(
                file=it["file"], title=it["title"],
                description=it.get("description"), description_file=it.get("description_file"),
                tags=it.get("tags", d.get("tags")), category=it.get("category", d.get("category", "28")),
                privacy=it.get("privacy", d.get("privacy", "private")),
                playlist=it.get("playlist", playlist), thumbnail=it.get("thumbnail"),
            )
            cmd_upload(ns)
        else:
            vid = it["video"]
            if playlist:
                cmd_add(argparse.Namespace(video=vid, playlist=playlist))
            if it.get("description_file") or it.get("title"):
                cmd_update(argparse.Namespace(
                    video=vid, title=it.get("title"),
                    description_file=it.get("description_file"), category=it.get("category"),
                ))
            if it.get("thumbnail"):
                cmd_thumbnail(argparse.Namespace(video=vid, file=it["thumbnail"]))


def main():
    p = argparse.ArgumentParser(description="Brighton Ruby YouTube helper", formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("auth").set_defaults(fn=cmd_auth)

    c = sub.add_parser("create-playlist"); c.set_defaults(fn=cmd_create_playlist)
    c.add_argument("--title", required=True); c.add_argument("--description", default="")
    c.add_argument("--privacy", default="public", choices=["public", "unlisted", "private"])

    c = sub.add_parser("add"); c.set_defaults(fn=cmd_add)
    c.add_argument("--video", required=True); c.add_argument("--playlist", required=True)

    c = sub.add_parser("thumbnail"); c.set_defaults(fn=cmd_thumbnail)
    c.add_argument("--video", required=True); c.add_argument("--file", required=True)

    c = sub.add_parser("update"); c.set_defaults(fn=cmd_update)
    c.add_argument("--video", required=True); c.add_argument("--title")
    c.add_argument("--description-file"); c.add_argument("--category")

    c = sub.add_parser("upload"); c.set_defaults(fn=cmd_upload)
    c.add_argument("--file", required=True); c.add_argument("--title", required=True)
    c.add_argument("--description"); c.add_argument("--description-file")
    c.add_argument("--tags"); c.add_argument("--category", default="28")
    c.add_argument("--privacy", default="private", choices=["public", "unlisted", "private"])
    c.add_argument("--playlist"); c.add_argument("--thumbnail")

    c = sub.add_parser("sync"); c.set_defaults(fn=cmd_sync)
    c.add_argument("--manifest", required=True)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
