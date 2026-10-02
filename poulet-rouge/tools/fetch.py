"""Fetch the photos and fonts for the Poulet Rouge concept.

Runs in GitHub Actions (.github/workflows/poulet-rouge-assets.yml), because the
development sandbox cannot reach photo sites or font CDNs.

fonts          fonts.json -> ../assets/fonts/ (skipped when already there)
sheets mode    (no picks.json): every candidate in sources.json -- Pexels photos
               by id, plus Openverse search results limited to CC0, public
               domain and CC BY -- as labelled contact sheets in staging/sheets/,
               with their details in staging/candidates.json.
download mode  (picks.json present): each pick cropped to its aspect around a
               focal point, saved as WebP at the listed widths in
               ../assets/<dir>/, with credits in credits.json.
               "cut": "circle" masks the square crop to a circle with a
               transparent outside.
"""
import io
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image, ImageDraw, ImageFont

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


def open_image(data):
    im = Image.open(io.BytesIO(data))
    im.load()
    return im.convert("RGB")


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
            data = get(url, ua=BROWSER_UA)
            if data[:4] != b"wOF2":
                raise RuntimeError("not a woff2 file")
            open(dest, "wb").write(data)
            log("font", name, len(data))
        except Exception as e:  # noqa: BLE001
            log("FAIL font", name, e)


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
    sources = json.load(open(os.path.join(HERE, "sources.json")))
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
        json.dump(allc, open(os.path.join(STAGING, "candidates.json"), "w"), indent=1, ensure_ascii=False)


def run_previews():
    """Chosen candidates at a larger size with a 10% grid, to place crops by eye."""
    path = os.path.join(HERE, "previews.json")
    if not os.path.exists(path):
        return
    cands = json.load(open(os.path.join(STAGING, "candidates.json")))
    out = os.path.join(STAGING, "previews")
    os.makedirs(out, exist_ok=True)
    f = font(22)
    for label, ref in json.load(open(path)).items():
        try:
            c = resolve({"pick": ref}, cands)
            im = fetch_candidate(c, 1600)
        except Exception as e:  # noqa: BLE001
            log("FAIL preview", label, e)
            continue
        im.thumbnail((1000, 1000))
        d = ImageDraw.Draw(im)
        W, H = im.size
        for k in range(1, 10):
            x, y = round(W * k / 10), round(H * k / 10)
            d.line([(x, 0), (x, H)], fill=(255, 255, 255), width=1)
            d.line([(0, y), (W, y)], fill=(255, 255, 255), width=1)
            d.text((x + 3, 3), "%d" % k, fill=(255, 40, 40), font=f)
            d.text((3, y + 3), "%d" % k, fill=(255, 40, 40), font=f)
        d.text((8, H - 30), "%s  %dx%d" % (label, c.get("fetched", [0, 0])[0], c.get("fetched", [0, 0])[1]), fill=(255, 255, 0), font=f)
        im.save(os.path.join(out, label.replace("#", "-") + ".jpg"), quality=82)
        log("preview", label, W, H)


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


def circle(im):
    """Mask a square image to a circle, anti-aliased by drawing the mask at 4x."""
    w, h = im.size
    big = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(big).ellipse((0, 0, w * 4 - 1, h * 4 - 1), fill=255)
    mask = big.resize((w, h), Image.LANCZOS)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


def resolve(pick, cands):
    src, _, ident = pick["pick"].partition(":")
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
    credits = {}
    cache = {}
    for key, p in picks.items():
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
        box = crop_box(W, H, p)
        crop = im.crop(box)
        if p.get("aspect", [1, 1])[0] == p.get("aspect", [1, 1])[1] and crop.width != crop.height:
            s = min(crop.size)
            crop = crop.crop((0, 0, s, s))
        cut = p.get("cut") == "circle"
        outdir = os.path.join(SITE, "assets", p.get("dir", "photos"))
        os.makedirs(outdir, exist_ok=True)
        for w in p.get("widths", [640]):
            h = w if cut else round(w * crop.height / crop.width)
            out = crop.resize((w, h), Image.LANCZOS) if w < crop.width else crop.copy()
            name = "%s-%d.webp" % (p.get("name", key), w)
            if cut:
                circle(out).save(os.path.join(outdir, name), quality=84, method=6)
            else:
                out.save(os.path.join(outdir, name), quality=80, method=6)
        credits[key] = {k: c.get(k, "") for k in ("src", "id", "page", "title", "creator", "creator_url", "license", "license_url", "provider")}
        credits[key].update({"source_size": [W, H], "box": list(box)})
        log("ok  ", key, c["src"], c["id"], "source %dx%d" % (W, H), "box", box)
    json.dump(credits, open(os.path.join(HERE, "credits.json"), "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    os.makedirs(STAGING, exist_ok=True)
    run_fonts()
    if os.path.exists(os.path.join(HERE, "picks.json")):
        run_download()
    else:
        run_sheets()
        run_previews()
    sys.exit(0)
