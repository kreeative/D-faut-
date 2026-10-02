#!/usr/bin/env python3
"""Exporte la page d'accueil en un seul fichier HTML autonome, prêt pour Figma.

Le fichier produit contient deux planches côte à côte (ordinateur 1440 px et
mobile 390 px). Le CSS, les images et les polices y sont intégrés, parce que
l'import Figma (outil « html_to_figma » du serveur MCP Figma) ne va pas chercher
les fichiers externes.

Ce qui est transformé pour l'export :
- les @media de largeur deviennent des @container : chaque planche se met en
  page selon sa propre largeur, comme un cadre Figma ;
- les unités vw deviennent cqw (relatives à la planche) et les hauteurs d'écran
  (svh, vh) des valeurs fixes ;
- les icônes <use href="#..."> sont recopiées en entier (Figma ne suit pas les
  références) ;
- les éléments masqués (suggestions, panneau de l'assistant…) sont retirés.

Usage :
    python3 docs/figma/export-pour-figma.py [sortie.html]
"""
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs/figma/out/accueil-figma.html"

_cache = {}


def data_uri(rel_path):
    """Contenu d'un fichier du site encodé en data URI (mis en cache)."""
    if rel_path not in _cache:
        ext = rel_path.rsplit(".", 1)[-1].lower()
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                "svg": "image/svg+xml", "woff2": "font/woff2"}[ext]
        raw = (ROOT / rel_path).read_bytes()
        _cache[rel_path] = f"data:{mime};base64," + base64.b64encode(raw).decode()
    return _cache[rel_path]


html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "assets/css/styles.css").read_text(encoding="utf-8")

# --- Contenu de la page ----------------------------------------------------
body = html.split("<body>", 1)[1].split('<script src="assets/js/main.js"', 1)[0]

# Icônes : on recopie chaque symbole du sprite à l'endroit où il est utilisé.
sprite = re.search(r"<svg hidden[^>]*>(.*?)</svg>", body, re.S)
symbols = {
    m.group(1): (m.group(2), m.group(3), m.group(4))
    for m in re.finditer(r'<symbol id="([^"]+)" viewBox="([^"]+)"([^>]*)>(.*?)</symbol>', sprite.group(1), re.S)
}
body = body.replace(sprite.group(0), "")


def inline_icon(m):
    attrs, sid = m.group(1), m.group(2)
    view_box, sym_attrs, inner = symbols[sid]
    if "viewBox" not in attrs:
        attrs += f' viewBox="{view_box}"'
    return f"<svg{attrs}{sym_attrs}>{inner}</svg>"


body = re.sub(r'<svg([^>]*)>\s*<use href="#([^"]+)"\s*/>\s*</svg>', inline_icon, body)

# Éléments invisibles à l'écran : inutiles dans une maquette.
body = re.sub(r'<a class="skip-link"[^>]*>.*?</a>\s*', "", body, flags=re.S)
body = re.sub(r'<ul class="search__list"[^>]*hidden></ul>', "", body)
body = re.sub(r'<section class="results".*?</section>', "", body, flags=re.S)
body = re.sub(r'<p class="feedback__thanks"[^>]*hidden></p>', "", body)
body = re.sub(r'<section class="assist__panel".*?</section>', "", body, flags=re.S)
body = re.sub(r'<(p|span) class="visually-hidden"[^>]*>.*?</\1>', "", body, flags=re.S)
body = re.sub(r'<p class="search__status"[^>]*></p>', "", body)

# État par défaut de la carte : Abidjan sélectionné (comme sur le site).
body = re.sub(r'(<path class="map__district" data-district-path="abidjan"[^>]*?)aria-pressed="false"',
              r'\1aria-pressed="true"', body)


def variant(markup, kind):
    """Version ordinateur ou mobile : choisit l'image de chaque <picture> et intègre les images."""
    def picture(m):
        block = m.group(0)
        mobile_src = re.search(r'<source media="[^"]*" srcset="([^"]+)">', block).group(1)
        img = re.search(r'<img src="([^"]+)"([^>]*)>', block)
        src = mobile_src if kind == "mobile" else img.group(1)
        return f'<img src="{src}"{img.group(2)}>'

    markup = re.sub(r"<picture>.*?</picture>", picture, markup, flags=re.S)
    markup = re.sub(r'src="(assets/img/[^"]+)"', lambda m: f'src="{data_uri(m.group(1))}"', markup)
    return markup.replace(' loading="lazy"', "")


# --- Styles ----------------------------------------------------------------
css = css.replace('"Fraunces Variable"', '"Fraunces"').replace('"Instrument Sans Variable"', '"Instrument Sans"')
css = re.sub(r'url\("\.\./fonts/([^"]+)"\)', lambda m: f'url("{data_uri("assets/fonts/" + m.group(1))}")', css)
css = css.replace(":root {", ".page {").replace("html:not(.js) .reveal", ".page .reveal")
css = re.sub(r"(^|\n)html \{", r"\1.page {", css)
css = re.sub(r"(^|\n)body \{", r"\1.page {", css)
css = re.sub(r"@media \((min|max)-width:", r"@container site (\1-width:", css)
css = re.sub(r"(\d+(?:\.\d+)?)vw\b", r"\1cqw", css)
css = css.replace("100svh", "880px").replace("62vh", "560px").replace("100vh", "900px")
css = css.replace("position: fixed", "position: absolute")

export_css = """
html, body { margin: 0; }
body { background: #d9d4ca; display: flex; align-items: flex-start; gap: 160px; width: max-content; }
.artboard { container-type: inline-size; container-name: site; position: relative; overflow: hidden; flex: none; }
.artboard--desktop { width: 1440px; }
.artboard--mobile { width: 390px; }
.page { position: relative; }
.page .reveal { opacity: 1 !important; transform: none !important; }
.page .hero__media img { animation: none !important; transform: none !important; }
.page .assist { position: absolute !important; bottom: auto !important; }
.artboard--desktop .assist { top: 724px; right: 32px; }
.artboard--mobile .assist { top: 770px; right: 16px; }
"""

doc = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Concept portail citoyen CI — export Figma</title>
<style>
{css}
{export_css}
</style>
</head>
<body>
<div class="artboard artboard--desktop" id="accueil-ordinateur-1440" aria-label="Accueil — ordinateur 1440">
<div class="page">
{variant(body, "desktop")}
</div>
</div>
<div class="artboard artboard--mobile" id="accueil-mobile-390" aria-label="Accueil — mobile 390">
<div class="page">
{variant(body, "mobile")}
</div>
</div>
</body>
</html>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(doc, encoding="utf-8")
print(f"{OUT}  ({len(doc.encode('utf-8')) / 1024 / 1024:.1f} Mo)")
