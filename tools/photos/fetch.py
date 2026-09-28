"""Fetches Pexels photos for the Jessica's Secrets site. Runs in GitHub Actions, which has open internet.

First pass (no picks.json): downloads every candidate in sources.json small and saves labelled contact
sheets to tools/photos/staging/ (4 per row, labelled with slot, number and id).

Second pass (picks.json present): downloads each pick at full size, crops the largest box of the
requested aspect ratio around the focal point (cx, cy from 0 to 1, zoom >= 1 tightens it), resizes it
to each output width (never upscaling) and saves WebP into the output folder, with credits.json and a
preview sheet of the crops in staging/.
"""
import io
import json
import os
import time
import urllib.error
import urllib.request

from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
STAGING = os.path.join(HERE, 'staging')
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36')


def candidate_urls(pid, slug, width):
    query = '?auto=compress&cs=tinysrgb' + ('&w=%d' % width if width else '')
    base = 'https://images.pexels.com/photos/%d/' % pid
    return [base + 'pexels-photo-%d.jpeg' % pid + query,
            base + 'pexels-photo-%d.png' % pid + query,
            base + 'free-photo-of-%s.jpeg' % slug + query]


def fetch(pid, slug, width=None):
    last = None
    for url in candidate_urls(pid, slug, width):
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={
                    'User-Agent': UA,
                    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                    'Referer': 'https://www.pexels.com/'})
                with urllib.request.urlopen(req, timeout=90) as r:
                    data = r.read()
                im = Image.open(io.BytesIO(data))
                im.load()
                return ImageOps.exif_transpose(im).convert('RGB'), url
            except urllib.error.HTTPError as e:
                last = '%s -> HTTP %d' % (url, e.code)
                if e.code in (403, 404):
                    break
            except Exception as e:  # network hiccup or unreadable image: retry, then try the next URL
                last = '%s -> %s' % (url, e)
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(last)


def load_font(size):
    for path in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                 '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def sheet(cells, path, cell=300, label=34, cols=4):
    """cells: list of (image or None, caption). Saves a grid with captions under each image."""
    font = load_font(15)
    rows = (len(cells) + cols - 1) // cols
    out = Image.new('RGB', (cols * cell, rows * (cell + label)), (250, 247, 245))
    draw = ImageDraw.Draw(out)
    for k, (im, caption) in enumerate(cells):
        x, y = (k % cols) * cell, (k // cols) * (cell + label)
        if im is None:
            draw.text((x + 12, y + cell // 2), 'download failed', fill=(170, 20, 40), font=font)
        else:
            thumb = ImageOps.contain(im, (cell - 10, cell - 10))
            out.paste(thumb, (x + (cell - thumb.width) // 2, y + (cell - thumb.height) // 2))
        draw.text((x + 8, y + cell + 7), caption, fill=(40, 20, 30), font=font)
    out.save(path, quality=86)


def staging_pass(sources):
    os.makedirs(STAGING, exist_ok=True)
    cache, entries, failed = {}, [], []
    for slot, candidates in sources.items():
        for n, c in enumerate(candidates, 1):
            pid = c['id']
            if pid not in cache:
                try:
                    cache[pid] = fetch(pid, c['slug'], 600)[0]
                except Exception as e:
                    cache[pid] = None
                    failed.append('%s #%d %d: %s' % (slot, n, pid, e))
            im = cache[pid]
            size = '%dx%d' % im.size if im else '-'
            entries.append((im, '%s #%d · %d · %s' % (slot, n, pid, size)))
    per_sheet = 16
    for i in range(0, len(entries), per_sheet):
        sheet(entries[i:i + per_sheet], os.path.join(STAGING, 'sheet-%02d.jpg' % (i // per_sheet + 1)))
    with open(os.path.join(STAGING, 'failed.txt'), 'w') as f:
        f.write('\n'.join(failed) + '\n' if failed else 'none\n')
    print('staging: %d candidates, %d unique, %d failed' % (len(entries), len(cache), len(failed)))


def ratio(aspect):
    w, h = aspect.split(':')
    return float(w) / float(h)


def crop_box(width, height, ar, cx, cy, zoom):
    """Largest box of aspect ar inside the image, shrunk by zoom, centred on the focal point and kept inside."""
    if width / height > ar:
        h, w = height, height * ar
    else:
        w, h = width, width / ar
    w, h = w / zoom, h / zoom
    left = min(max(cx * width - w / 2, 0), width - w)
    top = min(max(cy * height - h / 2, 0), height - h)
    return round(left), round(top), round(left + w), round(top + h)


def picks_pass(picks):
    outdir = os.path.join(ROOT, picks.get('outdir', 'tools/photos/out'))
    os.makedirs(outdir, exist_ok=True)
    os.makedirs(STAGING, exist_ok=True)
    credits, previews, failed = [], [], []
    for p in picks['images']:
        name, pid, slug = p['name'], p['id'], p['slug']
        try:
            im, url = fetch(pid, slug)
        except Exception as e:
            failed.append('%s %d: %s' % (name, pid, e))
            previews.append((None, name))
            continue
        ar = ratio(p['aspect'])
        crop = im.crop(crop_box(im.width, im.height, ar, p.get('cx', 0.5), p.get('cy', 0.5), p.get('zoom', 1.0)))
        files = []
        for w in sorted(set(p['widths'])):
            if w > crop.width:
                continue  # never upscale
            h = round(w / ar)
            path = os.path.join(outdir, '%s-%d.webp' % (name, w))
            crop.resize((w, h), Image.LANCZOS).save(path, 'WEBP', quality=p.get('quality', 82), method=6)
            files.append({'file': os.path.relpath(path, ROOT), 'width': w, 'height': h})
        if not files:  # the crop is smaller than every requested width: keep it at its own size
            w, h = crop.width, round(crop.width / ar)
            path = os.path.join(outdir, '%s-%d.webp' % (name, w))
            crop.resize((w, h), Image.LANCZOS).save(path, 'WEBP', quality=p.get('quality', 82), method=6)
            files.append({'file': os.path.relpath(path, ROOT), 'width': w, 'height': h})
        credits.append({'name': name, 'id': pid, 'page': 'https://www.pexels.com/photo/%s-%d/' % (slug, pid),
                        'source': url, 'original': '%dx%d' % im.size, 'files': files})
        previews.append((crop, '%s · %d · %s' % (name, pid, p['aspect'])))
        print('%s: %d from %dx%d -> %s' % (name, pid, im.width, im.height, ', '.join(str(f['width']) for f in files)))
    with open(os.path.join(outdir, 'credits.json'), 'w') as f:
        json.dump(credits, f, indent=2)
    sheet(previews, os.path.join(STAGING, 'picks.jpg'))
    with open(os.path.join(STAGING, 'failed.txt'), 'w') as f:
        f.write('\n'.join(failed) + '\n' if failed else 'none\n')
    print('picks: %d done, %d failed' % (len(credits), len(failed)))


if __name__ == '__main__':
    picks_path = os.path.join(HERE, 'picks.json')
    if os.path.exists(picks_path):
        with open(picks_path) as f:
            picks_pass(json.load(f))
    else:
        with open(os.path.join(HERE, 'sources.json')) as f:
            staging_pass(json.load(f))
