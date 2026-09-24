"""Fetch free food photos for the Basil & Bloom app.

Runs in GitHub Actions (see .github/workflows/restaurant-photos.yml).

search mode   (no picks.json): looks up candidates on Unsplash for every entry in
              queries.json, keeps only photos under the free Unsplash License
              (no Unsplash+), and writes labelled contact sheets to staging/sheets/.
download mode (picks.json present): downloads the chosen photos at 1600px into
              staging/full/ and records credits in credits.json.
"""
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
STAGING = os.path.join(HERE, "staging")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0 Safari/537.36")


def get(url, accept="application/json", tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read()
        except Exception as e:  # network hiccups, 429s
            last = e
            time.sleep(2 + i * 3)
    raise last


def sized(raw_url, **params):
    parts = urllib.parse.urlsplit(raw_url)
    q = dict(urllib.parse.parse_qsl(parts.query))
    q.update({k: str(v) for k, v in params.items()})
    return urllib.parse.urlunsplit(parts._replace(query=urllib.parse.urlencode(q)))


def is_free(p):
    raw = (p.get("urls") or {}).get("raw", "")
    return not p.get("premium") and not p.get("plus") and "plus.unsplash.com" not in raw


def search(query, per_page=24):
    url = "https://unsplash.com/napi/search/photos?" + urllib.parse.urlencode(
        {"query": query, "per_page": per_page, "page": 1})
    data = json.loads(get(url))
    return [p for p in data.get("results", []) if is_free(p)]


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def sheet(key, cands, tile=260, cols=5):
    rows = (len(cands) + cols - 1) // cols
    img = Image.new("RGB", (cols * tile, rows * (tile + 22)), (238, 238, 238))
    draw = ImageDraw.Draw(img)
    f = font(15)
    for i, c in enumerate(cands):
        x, y = (i % cols) * tile, (i // cols) * (tile + 22)
        try:
            th = Image.open(io.BytesIO(get(sized(c["raw"], w=tile * 2, q=70, fm="jpg", fit="max"), "image/*")))
            th = th.convert("RGB")
            th.thumbnail((tile - 8, tile - 8))
            img.paste(th, (x + (tile - th.width) // 2, y + (tile - th.height) // 2))
        except Exception as e:
            draw.text((x + 10, y + 10), "failed: %s" % e, fill=(200, 0, 0), font=f)
        draw.text((x + 6, y + tile + 2), "%d  %s" % (i + 1, c["id"]), fill=(20, 20, 20), font=f)
    os.makedirs(os.path.join(STAGING, "sheets"), exist_ok=True)
    img.save(os.path.join(STAGING, "sheets", key + ".jpg"), quality=78, optimize=True)


def run_search():
    queries = json.load(open(os.path.join(HERE, "queries.json")))
    out = {}
    for key, qs in queries.items():
        seen, cands = set(), []
        limit = 10 if key.startswith("garnish") else 15
        for q in qs:
            try:
                results = search(q)
            except Exception as e:
                print("search failed", key, q, e)
                continue
            for p in results:
                if p["id"] in seen:
                    continue
                seen.add(p["id"])
                cands.append({
                    "id": p["id"], "query": q,
                    "alt": p.get("alt_description") or p.get("description") or "",
                    "width": p.get("width"), "height": p.get("height"),
                    "raw": p["urls"]["raw"],
                    "page": (p.get("links") or {}).get("html", ""),
                    "author": (p.get("user") or {}).get("name", ""),
                    "author_url": ((p.get("user") or {}).get("links") or {}).get("html", ""),
                })
            time.sleep(1)
        cands = cands[:limit]
        out[key] = cands
        print("%-24s %d candidates" % (key, len(cands)))
        if cands:
            sheet(key, cands)
    json.dump(out, open(os.path.join(STAGING, "candidates.json"), "w"), indent=1)


def run_download():
    picks = json.load(open(os.path.join(HERE, "picks.json")))
    os.makedirs(os.path.join(STAGING, "full"), exist_ok=True)
    credits = {}
    for key, pid in picks.items():
        p = json.loads(get("https://unsplash.com/napi/photos/" + pid))
        if not is_free(p):
            print("skipping non-free photo", key, pid)
            continue
        data = get(sized(p["urls"]["raw"], w=1600, q=86, fm="jpg", fit="max"), "image/*")
        im = Image.open(io.BytesIO(data)).convert("RGB")
        im.save(os.path.join(STAGING, "full", key + ".jpg"), quality=90)
        try:  # let Unsplash count the download, as their guidelines ask
            get((p.get("links") or {}).get("download_location", ""))
        except Exception:
            pass
        user = p.get("user") or {}
        credits[key] = {
            "photo": (p.get("links") or {}).get("html", ""), "id": pid,
            "author": user.get("name", ""), "author_url": (user.get("links") or {}).get("html", ""),
            "license": "Unsplash License (https://unsplash.com/license)",
        }
        print("downloaded", key, pid, im.size)
    json.dump(credits, open(os.path.join(HERE, "credits.json"), "w"), indent=1)


if __name__ == "__main__":
    os.makedirs(STAGING, exist_ok=True)
    if os.path.exists(os.path.join(HERE, "picks.json")):
        run_download()
    else:
        run_search()
    sys.exit(0)
