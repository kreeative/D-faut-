"""Fetch and prepare the assets for The Bakery site.

Runs in GitHub Actions (.github/workflows/the-bakery-assets.yml), because the
development sandbox cannot reach photo sites, font CDNs or package indexes.

fonts          fonts.json -> files (a key with a "/" is relative to this folder,
               otherwise it goes to ../assets/fonts/); skipped when present.
marks          marks.json: the brand's own artwork in brand/ keyed to one colour
               and traced with potrace into SVG, in staging/marks/.
sheets mode    (no picks.json): every candidate in sources.json -- Pexels photos
               by id, plus Openverse search results limited to CC0, public
               domain and CC BY -- as labelled contact sheets in staging/sheets/,
               with their details in staging/candidates.json.
download mode  (picks.json present): each pick cropped around a focal point,
               or cut out of its background ("cut": "remove-bg", with rembg),
               saved as WebP at the listed widths in ../assets/<dir>/, with
               credits in credits.json. "pick": "local:brand/x.webp" uses one
               of the brand's own images instead of a photo library.
"""
import io
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
STAGING = os.path.join(HERE, "staging")
FONTS = os.path.join(SITE, "assets", "fonts")
BROWSER_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
              "Chrome/126.0 Safari/537.36")
BOT_UA = "KreeativeConceptPhotos/1.0 (+https://kreeative.xyz; design concept, one-off fetch)"
OPENVERSE = "https://api.openverse.org/v1/images/"
MAX_BYTES = 14 * 1024 * 1024


def log(*a):
    print(*a, flush=True)


def get(url, ua=BOT_UA, accept="*/*", tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": accept})
            with urllib.request.urlopen(req, timeout=45) as r:
                data = r.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    raise RuntimeError("file larger than %d MB" % (MAX_BYTES // 1048576))
                return data
        except urllib.error.HTTPError as e:
            last = e
            if e.code == 429:
                wait = int(e.headers.get("Retry-After") or 30)
                log("  429, waiting", wait, "s")
                time.sleep(min(wait, 90))
            elif e.code in (401, 403, 404):
                break
            else:
                time.sleep(2 + i * 3)
        except Exception as e:  # noqa: BLE001 - report and retry
            last = e
            time.sleep(2 + i * 3)
    raise last


def open_image(data, mode="RGB"):
    im = Image.open(io.BytesIO(data))
    im.load()
    return im.convert(mode)


# ---------------------------------------------------------------- fonts

def run_fonts():
    path = os.path.join(HERE, "fonts.json")
    if not os.path.exists(path):
        return
    for name, url in json.load(open(path)).items():
        dest = os.path.join(HERE, name) if "/" in name else os.path.join(FONTS, name)
        if os.path.exists(dest):
            continue
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        try:
            data = get(url, ua=BROWSER_UA)
            if data[:4] != b"wOF2":
                raise RuntimeError("not a woff2 file")
            open(dest, "wb").write(data)
            log("font", name, len(data))
        except Exception as e:  # noqa: BLE001
            log("FAIL font", name, e)


# ---------------------------------------------------------------- marks

def ink(im, spec):
    """How much each pixel belongs to the mark, 0..1."""
    a = np.asarray(im, dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if spec["key"] == "dark":
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        lo, hi = spec.get("range", [60, 200])
        return np.clip((hi - lum) / (hi - lo), 0, 1)
    # "pink": the brand pink (#EE7AAF) against cream, white and pale pattern lines;
    # browns and oranges from photos have little blue, so they are left out
    lo, hi = spec.get("range", [130, 195])
    pink = np.clip((hi - g) / (hi - lo), 0, 1)
    blue_ok = np.clip((b - spec.get("min_blue", 105)) / 30.0, 0, 1)
    return pink * blue_ok


def run_marks():
    path = os.path.join(HERE, "marks.json")
    if not os.path.exists(path):
        return
    out = os.path.join(STAGING, "marks")
    os.makedirs(out, exist_ok=True)
    for name, spec in json.load(open(path)).items():
        if os.path.exists(os.path.join(out, name + ".svg")) and not spec.get("force"):
            continue
        try:
            src = Image.open(os.path.join(HERE, spec["src"])).convert("RGBA")
            flat = Image.new("RGBA", src.size, (255, 255, 255, 255))
            flat.alpha_composite(src)
            im = flat.convert("RGB")
            if "crop" in spec:
                im = im.crop(tuple(spec["crop"]))
            sc = spec.get("scale", 1)
            if sc != 1:
                im = im.resize((round(im.width * sc), round(im.height * sc)), Image.BICUBIC)
            level = Image.fromarray((ink(im, spec) * 255).astype(np.uint8), "L")
            level = level.filter(ImageFilter.GaussianBlur(spec.get("blur", 0.6) * sc))
            level.save(os.path.join(out, name + ".png"))
            mask = level.point(lambda v: 0 if v >= 128 else 255).convert("1")  # black = mark
            pbm = os.path.join(out, name + ".pbm")
            mask.save(pbm)
            svg = os.path.join(out, name + ".svg")
            subprocess.run(["potrace", pbm, "-b", "svg", "-o", svg,
                            "--turdsize", str(spec.get("turd", 4)), "--alphamax", "1.0",
                            "--opttolerance", "0.2"], check=True)
            os.remove(pbm)
            log("mark", name, im.size, os.path.getsize(svg))
        except Exception as e:  # noqa: BLE001
            log("FAIL mark", name, e)


# ---------------------------------------------------------------- photo candidates

def pexels_urls(c, w):
    i, slug = c["id"], c.get("slug", "")
    q = "?auto=compress&cs=tinysrgb&w=%d" % w
    yield "https://images.pexels.com/photos/%d/pexels-photo-%d.jpeg%s" % (i, i, q)
    yield "https://images.pexels.com/photos/%d/pexels-photo-%d.png%s" % (i, i, q)
    if slug:
        yield "https://images.pexels.com/photos/%d/free-photo-of-%s.jpeg%s" % (i, slug, q)


def fetch_pexels(c, w):
    errors = []
    for u in pexels_urls(c, w):
        try:
            return open_image(get(u, ua=BROWSER_UA, accept="image/avif,image/webp,image/*,*/*"))
        except Exception as e:  # noqa: BLE001
            errors.append("%s -> %s" % (u.split("?")[0][-50:], e))
    raise RuntimeError("; ".join(errors))


def openverse_search(query, page_size=8):
    url = OPENVERSE + "?" + urllib.parse.urlencode({
        "q": query, "license": "cc0,pdm,by", "category": "photograph",
        "page_size": page_size, "mature": "false",
    })
    data = json.loads(get(url, accept="application/json"))
    time.sleep(4)  # stay well inside the anonymous rate limit
    return data.get("results", [])


def fetch_candidate(c, w):
    if c["src"] == "local":
        return Image.open(os.path.join(HERE, c["id"])).convert("RGB")
    if c["src"] == "pexels":
        return fetch_pexels(c, w)
    im = open_image(get(c["url"], accept="image/*"))
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    return im


def font(size):
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def candidates_for(key, entry, limit=16):
    out, seen = [], set()
    for p in entry.get("pexels", []):
        out.append({"src": "pexels", "id": p["id"], "slug": p.get("slug", ""),
                    "page": "https://www.pexels.com/photo/%s-%d/" % (p.get("slug", "photo"), p["id"]),
                    "license": "Pexels License", "creator": ""})
        seen.add(("pexels", p["id"]))
    for q in entry.get("openverse", []):
        try:
            results = openverse_search(q)
        except Exception as e:  # noqa: BLE001
            log("  openverse failed", key, q, e)
            continue
        for r in results:
            if ("ov", r["id"]) in seen or not r.get("url"):
                continue
            seen.add(("ov", r["id"]))
            out.append({
                "src": "ov", "id": r["id"], "query": q, "title": r.get("title") or "",
                "url": r["url"], "page": r.get("foreign_landing_url") or "",
                "creator": r.get("creator") or "", "creator_url": r.get("creator_url") or "",
                "license": (r.get("license") or "").upper() + (" " + r["license_version"] if r.get("license_version") else ""),
                "license_url": r.get("license_url") or "", "provider": r.get("provider") or "",
                "size": [r.get("width"), r.get("height")],
            })
    return out[:limit]


def run_sheets():
    path = os.path.join(HERE, "sources.json")
    if not os.path.exists(path):
        return
    sources = json.load(open(path))
    os.makedirs(os.path.join(STAGING, "sheets"), exist_ok=True)
    tile, cols = 300, 4
    cpath = os.path.join(STAGING, "candidates.json")
    allc = json.load(open(cpath)) if os.path.exists(cpath) else {}
    for key, entry in sources.items():
        cands = candidates_for(key, entry)
        rows = max(1, (len(cands) + cols - 1) // cols)
        sheet = Image.new("RGB", (cols * tile, rows * (tile + 24)), (232, 230, 226))
        draw = ImageDraw.Draw(sheet)
        f = font(16)
        for n, c in enumerate(cands):
            c["n"] = n + 1
            x, y = (n % cols) * tile, (n // cols) * (tile + 24)
            label = "%d %s %s" % (n + 1, "P" if c["src"] == "pexels" else "OV", c["license"].replace("Pexels License", ""))
            try:
                im = fetch_candidate(c, 640)
                c["fetched"] = [im.width, im.height]
                im.thumbnail((tile - 6, tile - 6))
                sheet.paste(im, (x + (tile - im.width) // 2, y + (tile - im.height) // 2))
                log("ok  ", key, n + 1, c["src"], c["id"])
            except Exception as e:  # noqa: BLE001
                c["error"] = str(e)[:300]
                draw.text((x + 8, y + 8), "failed", fill=(200, 0, 0), font=f)
                log("FAIL", key, n + 1, c["src"], c["id"], str(e)[:200])
            draw.text((x + 6, y + tile + 3), label, fill=(20, 20, 20), font=f)
        sheet.save(os.path.join(STAGING, "sheets", key + ".jpg"), quality=80, optimize=True)
        allc[key] = cands
        json.dump(allc, open(cpath, "w"), indent=1, ensure_ascii=False)


# ---------------------------------------------------------------- download

def crop_box(W, H, c):
    """The largest box of the pick's aspect, scaled by zoom, centred on (cx, cy) and kept inside."""
    aw, ah = c.get("aspect", [1, 1])
    zoom = c.get("zoom", 1.0)
    w = int(min(W, H * aw / ah) / zoom)
    h = min(H, int(round(w * ah / aw)))
    if aw == ah:
        w = h = min(w, h)
    x0 = int(round(min(max(c.get("cx", 0.5) * W - w / 2, 0), W - w)))
    y0 = int(round(min(max(c.get("cy", 0.5) * H - h / 2, 0), H - h)))
    return x0, y0, x0 + w, y0 + h


_SESSION = None


def cut_out(im, p):
    """Remove the background with rembg, keep the subject, trim and pad it."""
    global _SESSION
    from rembg import new_session, remove  # imported here: only download mode needs it
    if _SESSION is None:
        _SESSION = new_session(os.environ.get("REMBG_MODEL", "isnet-general-use"))
    out = remove(im.convert("RGB"), session=_SESSION)
    a = np.asarray(out.split()[3])
    keep = a > 40
    if p.get("largest", True):
        # drop crumbs and specks: keep the rows/cols around the bulk of the subject
        ys, xs = np.nonzero(keep)
        if len(xs):
            x0, x1 = np.percentile(xs, [0.2, 99.8])
            y0, y1 = np.percentile(ys, [0.2, 99.8])
            box = (int(x0), int(y0), int(x1) + 1, int(y1) + 1)
        else:
            box = out.getbbox()
    else:
        box = out.getbbox()
    out = out.crop(box)
    pad = p.get("pad", 0.06)
    if p.get("square", True):
        s = int(max(out.size) * (1 + 2 * pad))
        canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        canvas.alpha_composite(out, ((s - out.width) // 2, (s - out.height) // 2))
    else:
        mx, my = int(out.width * pad), int(out.height * pad)
        canvas = Image.new("RGBA", (out.width + 2 * mx, out.height + 2 * my), (0, 0, 0, 0))
        canvas.alpha_composite(out, (mx, my))
    return canvas


def resolve(pick, cands):
    src, _, ident = pick["pick"].partition(":")
    if src == "local":
        return {"src": "local", "id": ident, "page": "", "license": "The Bakery brand artwork", "creator": ""}
    for c in cands.get(pick.get("from", ""), []) + [x for v in cands.values() for x in v]:
        if (src == "pexels" and c["src"] == "pexels" and str(c["id"]) == ident) or \
           (src == "ov" and c["src"] == "ov" and c["id"] == ident):
            return c
    if src == "pexels":
        return {"src": "pexels", "id": int(ident), "slug": pick.get("slug", ""),
                "page": "https://www.pexels.com/photo/%s-%s/" % (pick.get("slug", "photo"), ident),
                "license": "Pexels License", "creator": ""}
    raise RuntimeError("unknown candidate " + pick["pick"])


def run_download():
    picks = json.load(open(os.path.join(HERE, "picks.json")))
    cpath = os.path.join(STAGING, "candidates.json")
    cands = json.load(open(cpath)) if os.path.exists(cpath) else {}
    cpath2 = os.path.join(HERE, "credits.json")
    credits = json.load(open(cpath2)) if os.path.exists(cpath2) else {}
    cache = {}
    for key, p in picks.items():
        outdir = os.path.join(SITE, "assets", p.get("dir", "photos"))
        name0 = "%s-%d.webp" % (p.get("name", key), p.get("widths", [640])[0])
        if p.get("skip_existing", True) and os.path.exists(os.path.join(outdir, name0)) and key in credits:
            continue
        try:
            c = resolve(p, cands)
            ck = (c["src"], c["id"])
            if ck not in cache:
                cache[ck] = fetch_candidate(c, p.get("fetch", 2000))
            im = cache[ck]
        except Exception as e:  # noqa: BLE001
            log("FAIL", key, p.get("pick"), e)
            continue
        W, H = im.size
        box = crop_box(W, H, p) if ("cx" in p or "zoom" in p or "aspect" in p) else (0, 0, W, H)
        crop = im.crop(box)
        try:
            if p.get("cut") == "remove-bg":
                crop = cut_out(crop, p)
        except Exception as e:  # noqa: BLE001
            log("FAIL cut", key, e)
            continue
        os.makedirs(outdir, exist_ok=True)
        for w in p.get("widths", [640]):
            h = round(w * crop.height / crop.width)
            out = crop.resize((w, h), Image.LANCZOS) if w < crop.width else crop.copy()
            name = "%s-%d.webp" % (p.get("name", key), w)
            out.save(os.path.join(outdir, name), quality=p.get("quality", 82), method=6)
        credits[key] = {k: c.get(k, "") for k in ("src", "id", "page", "title", "creator", "creator_url", "license", "license_url", "provider")}
        credits[key].update({"source_size": [W, H], "box": list(box)})
        log("ok  ", key, c["src"], c["id"], "source %dx%d" % (W, H), "box", box)
        json.dump(credits, open(cpath2, "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    os.makedirs(STAGING, exist_ok=True)
    run_fonts()
    run_marks()
    if os.path.exists(os.path.join(HERE, "picks.json")):
        run_download()
    else:
        run_sheets()
    sys.exit(0)
