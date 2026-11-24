"""Add new photographs to maxkmedia.com, matching the November 2026 generator's output.

Usage: python3 -I add_photos.py <repo> <src-dir>

Per photo: AVIF at 360/640/960/1280 + the large width, JPEG at 640 + the large width,
large = fit inside 1600 x 2000 (same box the generator used). XMP carries creator and
credit; licensable frames also carry rights, licence and licensor. No EXIF is copied,
so camera serials and any GPS stay out of the published files.
"""
import html
import json
import re
import sys
from pathlib import Path

from PIL import Image

REPO = Path(sys.argv[1])
SRC = Path(sys.argv[2])
PHOTOS = REPO / "img/photos"
SITE = "https://maxkmedia.com"

PHOTOS_NEW = [
    # key, source, slug, caption, alt, licensable, pages
    dict(src="5336.jpg", slug="formal-grand-entrance-blue-satin-gown",
         cap="The grand entrance, formal night",
         alt="Guest in a pale blue satin gown making her entrance at a formal dinner while the room watches from the tables",
         lic=False, events=True),
    dict(src="5362.jpg", slug="formal-friends-jasmine-pergola",
         cap="Friends before the formal",
         alt="Four friends in red, blue, black and burgundy gowns holding hands in a line under a jasmine-covered pergola",
         lic=False, events=True),
    dict(src="5255.jpg", slug="formal-couple-red-gown-old-tree",
         cap="Formal portraits under the old tree",
         alt="Couple at a formal, one in a red lace gown and one in a black suit with a red tie and sunglasses, in front of a large tree",
         lic=False, events=True),
    dict(src="5381.jpg", slug="formal-friends-lit-stone-stairs",
         cap="Lit stairs at dusk",
         alt="Two friends in formal dresses standing on a sandstone staircase lit from beneath each step at dusk",
         lic=False, events=True),
    dict(src="2813.jpg", slug="red-spire-lodge-misty-forest-japan",
         cap="Red spire in the autumn mist, Japan",
         alt="Timber lodge with a red pointed spire roof in front of a forested hillside turning autumn colours under low mist in Japan",
         lic=True, events=False),
    dict(src="2682.jpg", slug="mountain-town-low-cloud-japan",
         cap="Low cloud over a mountain town, Japan",
         alt="Cloud rolling down forested mountains above the rooftops, power poles and sheds of a small town in Japan",
         lic=True, events=False),
    dict(src="3514.jpg", slug="koi-carp-pond-overhead",
         cap="Koi from above",
         alt="Three orange koi carp swimming over a dark green pond floor, photographed from above",
         lic=True, events=False),
]

XMP_BASE = (
    '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
    '<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" '
    'xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" '
    'xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/"><dc:creator><rdf:Seq><rdf:li>Max Krause</rdf:li></rdf:Seq></dc:creator>'
    '<dc:description><rdf:Alt><rdf:li xml:lang="x-default">{alt}</rdf:li></rdf:Alt></dc:description>'
    '<photoshop:Credit>Max K Media</photoshop:Credit>{rights}</rdf:Description></rdf:RDF></x:xmpmeta>'
)
XMP_RIGHTS = (
    '<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">© Max Krause / Max K Media. All rights reserved.</rdf:li></rdf:Alt></dc:rights>'
    '<xmpRights:Marked>True</xmpRights:Marked><xmpRights:WebStatement>https://maxkmedia.com/image-licensing.html</xmpRights:WebStatement>'
    '<plus:Licensor><rdf:Seq><rdf:li rdf:parseType="Resource"><plus:LicensorName>Max K Media</plus:LicensorName>'
    '<plus:LicensorURL>https://maxkmedia.com/contact.html</plus:LicensorURL></rdf:li></rdf:Seq></plus:Licensor>'
)


def build_images(p):
    im = Image.open(SRC / p["src"]).convert("RGB")
    im.thumbnail((1600, 2000), Image.LANCZOS)
    W, H = im.size
    xmp = XMP_BASE.format(alt=html.escape(p["alt"], quote=False),
                          rights=XMP_RIGHTS if p["lic"] else "").encode()
    avif_w = [w for w in (360, 640, 960, 1280) if w < W] + [W]
    for w in avif_w:
        v = im if w == W else im.resize((w, round(H * w / W)), Image.LANCZOS)
        v.save(PHOTOS / f"{p['slug']}-{w}.avif", quality=38, speed=4, xmp=xmp)
    for w in (640, W):
        v = im if w == W else im.resize((w, round(H * w / W)), Image.LANCZOS)
        v.save(PHOTOS / f"{p['slug']}-{w}.jpg", quality=74, optimize=True, progressive=True, xmp=xmp)
    p.update(W=W, H=H, avif_w=avif_w)


def figure(p, prefix):
    s, W = p["slug"], p["W"]
    srcset_a = ", ".join(f"{prefix}img/photos/{s}-{w}.avif {w}w" for w in p["avif_w"])
    sizes = "(max-width: 560px) 46vw, (max-width: 1100px) 31vw, 320px"
    big = f"{prefix}img/photos/{s}-{W}.jpg"
    cap = html.escape(p["cap"])
    alt = html.escape(p["alt"])
    return (
        f'<figure><a href="{big}" data-full="{big}" data-cap="{cap}"><picture>'
        f'<source type="image/avif" srcset="{srcset_a}" sizes="{sizes}">'
        f'<img src="{prefix}img/photos/{s}-640.jpg" srcset="{prefix}img/photos/{s}-640.jpg 640w, {big} {W}w" '
        f'sizes="{sizes}" width="{W}" height="{p["H"]}" alt="{alt}" loading="lazy" decoding="async"></picture></a>'
        f'<figcaption>{cap}</figcaption></figure>'
    )


def image_object(p):
    url = f"{SITE}/img/photos/{p['slug']}-{p['W']}.jpg"
    o = {"@type": "ImageObject", "contentUrl": url, "url": url, "width": p["W"], "height": p["H"],
         "name": p["cap"], "description": p["alt"], "creator": {"@id": f"{SITE}/#max"},
         "creditText": "Max K Media"}
    if p["lic"]:
        o.update(copyrightNotice="© Max Krause / Max K Media",
                 license=f"{SITE}/image-licensing.html",
                 acquireLicensePage=f"{SITE}/contact.html")
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def add_to_gallery(page, items, prefix, gallery_id, after_slug=None):
    path = REPO / page
    t = path.read_text(encoding="utf-8")
    figs = "".join(figure(p, prefix) for p in items)
    if after_slug:
        # insert after the <figure> holding after_slug
        i = t.index(f'img/photos/{after_slug}-')
        j = t.index("</figure>", i) + len("</figure>")
    else:
        g = t.index('<div class="gallery')
        j = t.index("</div></div></section>", g)
    t = t[:j] + figs + t[j:]
    # JSON-LD: append ImageObjects to the gallery's image array
    k = t.index(f'"@id":"{SITE}/{gallery_id}#gallery"')
    a = t.index('"image":[', k)
    depth, m = 0, a + len('"image:[')
    for m in range(a + len('"image":['), len(t)):
        c = t[m]
        if c in "[{":
            depth += 1
        elif c in "]}":
            if depth == 0:
                break
            depth -= 1
    t = t[:m] + "," + ",".join(image_object(p) for p in items) + t[m:]
    path.write_text(t, encoding="utf-8")


def sitemap(page_url, items, lastmod):
    path = REPO / "sitemap.xml"
    t = path.read_text(encoding="utf-8")
    start = t.index(f"<loc>{page_url}</loc>")
    end = t.index("</url>", start)
    block = t[start:end]
    block = re.sub(r"<lastmod>[^<]*</lastmod>", f"<lastmod>{lastmod}</lastmod>", block, count=1)
    block += "".join(f"<image:image><image:loc>{SITE}/img/photos/{p['slug']}-{p['W']}.jpg</image:loc></image:image>" for p in items)
    path.write_text(t[:start] + block + t[end:], encoding="utf-8")


if __name__ == "__main__":
    for p in PHOTOS_NEW:
        build_images(p)
        print("built", p["slug"], p["W"], p["H"])
    events = [p for p in PHOTOS_NEW if p["events"]]
    travel = [p for p in PHOTOS_NEW if not p["events"]]
    add_to_gallery("photography/events-portraits.html", events, "../", "photography/events-portraits.html")
    # All work: formals beside the other event frames, travel after the GT-R (the other Japan frame)
    add_to_gallery("photography.html", events, "", "photography.html", after_slug="friends-hugging-sunset")
    add_to_gallery("photography.html", travel, "", "photography.html", after_slug="bronze-nissan-gt-r-street-japan")
    today = sys.argv[3] if len(sys.argv) > 3 else "2026-11-24"
    sitemap(f"{SITE}/photography/events-portraits.html", events, today)
    sitemap(f"{SITE}/photography.html", events + travel, today)
