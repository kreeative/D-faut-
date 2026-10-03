"""Turn a licensed Adobe Stock vector into a PNG and a traced SVG.

Runs in GitHub Actions (.github/workflows/the-bakery-stock.yml), because the
development sandbox cannot reach Adobe Stock downloads. The download link is
passed in as a masked workflow input and expires within the hour.

    STOCK_URL=<licensed download link> STOCK_NAME=<name> python stock.py
"""
import os
import subprocess
import sys
import urllib.request

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "stock")


def main():
    url, name = os.environ["STOCK_URL"], os.environ["STOCK_NAME"]
    os.makedirs(OUT, exist_ok=True)
    src = os.path.join(OUT, name + ".src")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(src, "wb") as f:
        f.write(r.read())
    head = open(src, "rb").read(8)
    print("downloaded", os.path.getsize(src), head)
    png = os.path.join(OUT, name + ".png")
    # EPS and AI (PDF-compatible) files both render with Ghostscript
    subprocess.run(["gs", "-q", "-dNOPAUSE", "-dBATCH", "-dSAFER", "-dEPSCrop", "-sDEVICE=png16m",
                    "-r200", "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4", "-sOutputFile=" + png, src], check=True)
    im = Image.open(png).convert("L")
    print("rendered", im.size)
    # dark ink -> potrace; the result keeps every doodle as separate paths
    mask = im.filter(ImageFilter.GaussianBlur(0.6)).point(lambda v: 0 if v < 140 else 255).convert("1")
    pbm = os.path.join(OUT, name + ".pbm")
    mask.save(pbm)
    subprocess.run(["potrace", pbm, "-b", "svg", "-o", os.path.join(OUT, name + ".svg"),
                    "--turdsize", "6", "--alphamax", "1.0", "--opttolerance", "0.2"], check=True)
    os.remove(pbm)
    os.remove(src)  # keep only the derived files
    # a small preview for choosing doodles
    prev = Image.open(png).convert("RGB")
    prev.thumbnail((1600, 1600))
    prev.save(os.path.join(OUT, name + "-preview.jpg"), quality=82)


if __name__ == "__main__":
    sys.exit(main())
