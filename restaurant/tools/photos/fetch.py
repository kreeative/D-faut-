"""Fetch free food photos for the Basil & Bloom app.

Runs in GitHub Actions (see .github/workflows/restaurant-photos.yml), because
the development sandbox cannot reach photo sites.

sheets mode   (no picks.json): downloads a small version of every candidate in
              sources.json and writes labelled contact sheets to staging/sheets/.
download mode (picks.json present): downloads the chosen photos at 1600px into
              staging/full/ and records credits in credits.json.

Sources: Pexels (Pexels License) and Unsplash (Unsplash License). Both allow
free commercial use without attribution; credits are kept anyway.
"""
import io
import json
import os
import re
import sys
import time
import urllib.request

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
STAGING = os.path.join(HERE, "staging")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0 Safari/537.36")


def log(*a):
    print(*a, flush=True)


def get(url, tries=2):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/avif,image/webp,image/*,*/*"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read(), r.geturl()
        except Exception as e:
            last = e
            time.sleep(1 + i * 2)
    raise last


def pexels_urls(c, w):
    i, slug = c["id"], c.get("slug", "")
    q = "?auto=compress&cs=tinysrgb&w=%d" % w
    yield "https://images.pexels.com/photos/%d/pexels-photo-%d.jpeg%s" % (i, i, q)
    yield "https://images.pexels.com/photos/%d/pexels-photo-%d.png%s" % (i, i, q)
    if slug:
        yield "https://images.pexels.com/photos/%d/free-photo-of-%s.jpeg%s" % (i, slug, q)
        yield "https://images.pexels.com/photos/%d/pexels-photo-%d/free-photo-of-%s.jpeg%s" % (i, i, slug, q)


def unsplash_urls(c, w):
    yield "https://unsplash.com/photos/%s/download?force=true&w=%d" % (c["id"], w)


def fetch(c, w):
    urls = pexels_urls(c, w) if c["src"] == "pexels" else unsplash_urls(c, w)
    errors = []
    for u in urls:
        try:
            data, final = get(u)
            im = Image.open(io.BytesIO(data))
            im.load()
            return im.convert("RGB"), final
        except Exception as e:
            errors.append("%s -> %s" % (u.split("?")[0][-60:], e))
    raise RuntimeError("; ".join(errors))


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def run_sheets():
    sources = json.load(open(os.path.join(HERE, "sources.json")))
    os.makedirs(os.path.join(STAGING, "sheets"), exist_ok=True)
    status = {}
    tile, cols = 300, 3
    for key, cands in sources.items():
        rows = (len(cands) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tile, rows * (tile + 24)), (236, 236, 236))
        draw = ImageDraw.Draw(sheet)
        f = font(16)
        status[key] = []
        for n, c in enumerate(cands):
            x, y = (n % cols) * tile, (n // cols) * (tile + 24)
            label = "%d %s %s" % (n + 1, c["src"][0], c["id"])
            try:
                im, final = fetch(c, 600)
                im.thumbnail((tile - 6, tile - 6))
                sheet.paste(im, (x + (tile - im.width) // 2, y + (tile - im.height) // 2))
                status[key].append({"n": n + 1, "ok": True, **c, "url": final.split("?")[0]})
                log("ok  ", key, label)
            except Exception as e:
                draw.text((x + 8, y + 8), "failed", fill=(200, 0, 0), font=f)
                status[key].append({"n": n + 1, "ok": False, **c, "error": str(e)[:300]})
                log("FAIL", key, label, str(e)[:300])
            draw.text((x + 6, y + tile + 3), label, fill=(20, 20, 20), font=f)
        sheet.save(os.path.join(STAGING, "sheets", key + ".jpg"), quality=76, optimize=True)
    json.dump(status, open(os.path.join(STAGING, "status.json"), "w"), indent=1)


def run_download():
    """Download each pick, crop a square around the dish and save it at <=1600px."""
    picks = json.load(open(os.path.join(HERE, "picks.json")))
    os.makedirs(os.path.join(STAGING, "full"), exist_ok=True)
    credits = {}
    for key, c in picks.items():
        try:
            im, final = fetch(c, c.get("w", 2400))
        except Exception as e:
            log("FAIL", key, c["id"], e)
            continue
        W, H = im.size
        side = int(min(W, H) * c.get("side", 1.0))
        x0 = int(min(max(c.get("cx", 0.5) * W - side / 2, 0), W - side))
        y0 = int(min(max(c.get("cy", 0.5) * H - side / 2, 0), H - side))
        crop = im.crop((x0, y0, x0 + side, y0 + side))
        if side > 1600:
            crop = crop.resize((1600, 1600), Image.LANCZOS)
        crop.save(os.path.join(STAGING, "full", key + ".jpg"), quality=88)
        page = ("https://www.pexels.com/photo/%s-%d/" % (c.get("slug", "photo"), c["id"]) if c["src"] == "pexels"
                else "https://unsplash.com/photos/%s" % c["id"])
        credits[key] = {"source": c["src"], "id": c["id"], "page": page,
                        "license": "Pexels License" if c["src"] == "pexels" else "Unsplash License",
                        "source_size": [W, H], "box": [x0, y0, side]}
        log("ok  ", key, c["id"], "source %dx%d" % (W, H), "crop %d at %d,%d" % (side, x0, y0))
    json.dump(credits, open(os.path.join(HERE, "credits.json"), "w"), indent=1)


if __name__ == "__main__":
    os.makedirs(STAGING, exist_ok=True)
    if os.path.exists(os.path.join(HERE, "picks.json")):
        run_download()
    else:
        run_sheets()
    sys.exit(0)
