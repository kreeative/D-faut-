"""Fetch the photos and fonts for the Guillemot site.

Runs in GitHub Actions (.github/workflows/guillemot-assets.yml), because the
development sandbox cannot reach photo sites or font CDNs.

fonts          fonts.json -> ../assets/fonts/ (skipped when already there)
sheets mode    (no picks.json): a small version of every candidate in
               sources.json, as labelled contact sheets in staging/sheets/.
download mode  (picks.json present): each pick cropped to its aspect around a
               focal point, saved at the listed widths in ../assets/photos/,
               with credits in credits.json. "cut": "circle" masks the square
               crop to a circle with a transparent outside (WebP only).

Photos are from Pexels, used under the Pexels License (free to use, no
attribution required); the credits are kept anyway.
"""
import io
import json
import os
import sys
import time
import urllib.request

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
STAGING = os.path.join(HERE, "staging")
PHOTOS = os.path.join(SITE, "assets", "photos")
FONTS = os.path.join(SITE, "assets", "fonts")
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0 Safari/537.36")


def log(*a):
    print(*a, flush=True)


def get(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/avif,image/webp,image/*,*/*"})
            with urllib.request.urlopen(req, timeout=40) as r:
                return r.read(), r.geturl()
        except Exception as e:  # noqa: BLE001 - report and retry
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


def fetch(c, w):
    errors = []
    for u in pexels_urls(c, w):
        try:
            data, final = get(u)
            im = Image.open(io.BytesIO(data))
            im.load()
            return im.convert("RGB"), final
        except Exception as e:  # noqa: BLE001
            errors.append("%s -> %s" % (u.split("?")[0][-60:], e))
    raise RuntimeError("; ".join(errors))


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def run_fonts():
    path = os.path.join(HERE, "fonts.json")
    if not os.path.exists(path):
        return
    os.makedirs(FONTS, exist_ok=True)
    for name, url in json.load(open(path)).items():
        dest = os.path.join(FONTS, name)
        if os.path.exists(dest):
            continue
        try:
            data, _ = get(url)
            if data[:4] != b"wOF2":
                raise RuntimeError("not a woff2 file")
            open(dest, "wb").write(data)
            log("font", name, len(data))
        except Exception as e:  # noqa: BLE001
            log("FAIL font", name, e)


def run_sheets():
    sources = json.load(open(os.path.join(HERE, "sources.json")))
    os.makedirs(os.path.join(STAGING, "sheets"), exist_ok=True)
    status = {}
    tile, cols = 360, 4
    for key, cands in sources.items():
        rows = (len(cands) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tile, rows * (tile + 26)), (230, 228, 224))
        draw = ImageDraw.Draw(sheet)
        f = font(18)
        status[key] = []
        for n, c in enumerate(cands):
            x, y = (n % cols) * tile, (n // cols) * (tile + 26)
            label = "%s%d  %s" % (key[0].upper(), n + 1, c["id"])
            try:
                im, final = fetch(c, 720)
                im.thumbnail((tile - 8, tile - 8))
                sheet.paste(im, (x + (tile - im.width) // 2, y + (tile - im.height) // 2))
                status[key].append({"n": n + 1, "ok": True, "size": [im.width, im.height], **c})
                log("ok  ", key, label)
            except Exception as e:  # noqa: BLE001
                draw.text((x + 8, y + 8), "failed", fill=(200, 0, 0), font=f)
                status[key].append({"n": n + 1, "ok": False, **c, "error": str(e)[:300]})
                log("FAIL", key, label, str(e)[:300])
            draw.text((x + 6, y + tile + 3), label, fill=(20, 20, 20), font=f)
        sheet.save(os.path.join(STAGING, "sheets", key + ".jpg"), quality=80, optimize=True)
    json.dump(status, open(os.path.join(STAGING, "status.json"), "w"), indent=1)


def crop_box(W, H, c):
    """The largest box of the pick's aspect, scaled by zoom, centred on (cx, cy) and kept inside."""
    aw, ah = c.get("aspect", [1, 1])
    zoom = c.get("zoom", 1.0)
    w = int(min(W, H * aw / ah) / zoom)
    h = min(H, int(round(w * ah / aw)))
    x0 = int(round(min(max(c.get("cx", 0.5) * W - w / 2, 0), W - w)))
    y0 = int(round(min(max(c.get("cy", 0.5) * H - h / 2, 0), H - h)))
    return x0, y0, x0 + w, y0 + h


def circle(im):
    """Mask a square image to a circle, anti-aliased by drawing the mask at 4x."""
    w, h = im.size
    big = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(big).ellipse((0, 0, w * 4 - 1, h * 4 - 1), fill=255)
    mask = big.resize((w, h), Image.LANCZOS)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


def run_download():
    picks = json.load(open(os.path.join(HERE, "picks.json")))
    os.makedirs(PHOTOS, exist_ok=True)
    credits = {}
    for key, c in picks.items():
        try:
            im, final = fetch(c, c.get("fetch", 2400))
        except Exception as e:  # noqa: BLE001
            log("FAIL", key, c["id"], e)
            continue
        W, H = im.size
        box = crop_box(W, H, c)
        crop = im.crop(box)
        cut = c.get("cut") == "circle"
        for w in c.get("widths", [800, 1600]):
            if w > crop.width * 1.02 and w != c.get("widths", [800])[0]:
                log("skip", key, w, "(source crop is only %d wide)" % crop.width)
                continue
            h = w if cut else round(w * crop.height / crop.width)
            out = crop.resize((w, h), Image.LANCZOS) if w < crop.width else crop.copy()
            if cut:
                circle(out).save(os.path.join(PHOTOS, "%s-%d.webp" % (key, w)), quality=86, method=6)
            else:
                out.save(os.path.join(PHOTOS, "%s-%d.webp" % (key, w)), quality=82, method=6)
        credits[key] = {"id": c["id"], "page": "https://www.pexels.com/photo/%s-%d/" % (c.get("slug", "photo"), c["id"]),
                        "license": "Pexels License", "source_size": [W, H], "box": list(box)}
        log("ok  ", key, c["id"], "source %dx%d" % (W, H), "box", box)
    json.dump(credits, open(os.path.join(HERE, "credits.json"), "w"), indent=1)


if __name__ == "__main__":
    os.makedirs(STAGING, exist_ok=True)
    run_fonts()
    if os.path.exists(os.path.join(HERE, "picks.json")):
        run_download()
    else:
        run_sheets()
    sys.exit(0)
