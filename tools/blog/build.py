#!/usr/bin/env python3
"""Build the blog for maxkmedia.com.

Reads the Markdown posts in content/blog/ and writes:

    blog.html              the index
    blog/<slug>.html       one page per post
    blog/feed.xml          Atom feed
    og/blog*.jpg           share images (new ones automatically, all with --og)

It also keeps the rest of the site pointing at the blog: the Blog link in the
navigation and footer of every page, and the blog entries in sitemap.xml,
sitemap.html and llms.txt. Every one of those edits is idempotent, so running
the build twice changes nothing, and running it after a fresh copy of the main
site has been dropped over the repo puts the blog links back.

The page chrome (stylesheet, header, footer, enquiry panel, business schema)
is lifted from the guides pages at build time, so blog pages always match the
site as it stands and no phone number or address is repeated in this file.

    python3 tools/blog/build.py            build
    python3 tools/blog/build.py --og       build and re-render every share image
    python3 tools/blog/build.py --check    exit 1 if the committed output is stale
    python3 tools/blog/build.py --prune    also delete pages whose source is gone
"""
from __future__ import annotations

import argparse
import base64
import datetime as dt
import json
import re
import struct
import sys
from dataclasses import dataclass
from pathlib import Path

try:
    import markdown
except ImportError:  # pragma: no cover
    sys.exit("Python-Markdown is missing. Run: pip install -r tools/blog/requirements.txt")

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content" / "blog"
SITE = "https://maxkmedia.com"
SITE_NAME = "Max K Media"
RECENT = 6                 # posts listed beside an article
TITLE_MAX = 65             # whole <title>, including the site name
DESC_RANGE = (70, 160)
SKIP_DIRS = {"blog", "content", "tools", "node_modules", ".git", ".github"}
MONTHS = ("January February March April May June July August September "
          "October November December").split()

# Rules the main stylesheet has no need for: a date on index rows, and the
# Markdown elements the hand-written guides never use.
BLOG_CSS = (
    ".rows time{display:block;font-size:.875rem;color:var(--smoke);margin-bottom:6px;"
    "font-variant-numeric:tabular-nums}"
    ".prose blockquote{border-left:3px solid var(--moss);padding:4px 0 4px 18px}"
    ".prose blockquote p{color:var(--bone)}"
    ".prose pre{overflow-x:auto;background:var(--surface);border:1px solid var(--line);"
    "padding:16px 18px;font-size:.9375rem;line-height:1.55}"
    ".prose code{font-family:ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;font-size:.92em}"
    ".prose :not(pre)>code{background:var(--surface-2);color:var(--bone);padding:.12em .36em;"
    "border-radius:4px}"
    ".prose hr{border:0;border-top:1px solid var(--line);margin-block:2em}"
    ".prose figure img{width:100%;background:var(--surface-2)}"
    # The site styles list items by ancestor, so a list inside a list of the other
    # kind would pick up both markers. Give nested items the marker of their own list.
    ".prose li>ul,.prose li>ol{margin-top:.5em}"
    ".prose ol ul>li{counter-increment:none;padding-left:1.5em}"
    ".prose ol ul>li::before{content:\"\";top:.72em;width:.7em;height:1px;background:var(--amber)}"
    ".prose ul ol>li{padding-left:2.1em}"
    ".prose ul ol>li::before{top:0;width:auto;height:auto;background:none}"
)

warnings: list[str] = []


def fail(message: str) -> None:
    sys.exit(f"blog build failed: {message}")


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def esc(text: str) -> str:
    return (text.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;"))


def nice_date(day: dt.date) -> str:
    return f"{day.day} {MONTHS[day.month - 1]} {day.year}"


def first_sunday(year: int, month: int) -> dt.date:
    first = dt.date(year, month, 1)
    return first + dt.timedelta(days=(6 - first.weekday()) % 7)


def stamp(day: dt.date) -> str:
    """Midnight in Sydney as an Atom timestamp. Daylight saving runs from the
    first Sunday of October to the first Sunday of April; worked out here so
    the build needs no time zone database (Windows has none by default)."""
    summer = day > first_sunday(day.year, 10) or day <= first_sunday(day.year, 4)
    return f"{day.isoformat()}T00:00:00+{'11' if summer else '10'}:00"


# ---------------------------------------------------------------- sources --

def read_source(path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    match = re.match(r"---\n(.*?)\n---\n?(.*)\Z", text, re.S)
    if not match:
        fail(f"{rel(path)} must open with a block of 'key: value' lines between two --- lines")
    meta: dict[str, str] = {}
    for line in match.group(1).split("\n"):
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, colon, value = line.partition(":")
        if not colon:
            fail(f"{rel(path)}: cannot read the line '{line}' (expected 'key: value')")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        meta[key.strip().lower()] = value
    return meta, match.group(2)


def need(meta: dict[str, str], key: str, path: Path) -> str:
    if not meta.get(key):
        fail(f"{rel(path)} has no '{key}:' line")
    return meta[key]


def parse_day(value: str, path: Path) -> dt.date:
    try:
        return dt.date.fromisoformat(value)
    except ValueError:
        fail(f"{rel(path)}: '{value}' is not a date; write it as 2026-11-13")
        raise


def image_size(path: Path) -> tuple[int, int] | None:
    """Pixel size of a PNG, JPEG or WebP, read from its header."""
    data = path.read_bytes()
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    if data[:2] == b"\xff\xd8":
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                height, width = struct.unpack(">HH", data[i + 5:i + 9])
                return width, height
            if marker in (0x01, 0xD8, 0xFF) or 0xD0 <= marker <= 0xD7:
                i += 2 if marker != 0xFF else 1
                continue
            i += 2 + struct.unpack(">H", data[i + 2:i + 4])[0]
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        kind = data[12:16]
        if kind == b"VP8X":
            return (1 + int.from_bytes(data[24:27], "little"),
                    1 + int.from_bytes(data[27:30], "little"))
        if kind == b"VP8 ":
            width, height = struct.unpack("<HH", data[26:30])
            return width & 0x3FFF, height & 0x3FFF
        if kind == b"VP8L":
            bits = int.from_bytes(data[21:25], "little")
            return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    return None


def site_file(url: str, where: str) -> Path:
    """The file a root-relative address ('/img/blog/x.jpg') points at."""
    target = ROOT / url.lstrip("/").split("#")[0].split("?")[0]
    if not target.is_file():
        fail(f"{where}: {url} does not exist in the site")
    return target


def figure(attrs: dict[str, str], where: str, lazy: bool = True) -> str:
    src = attrs.get("src", "")
    if not attrs.get("alt"):
        fail(f"{where}: the image {src} has no description; write ![what it shows]({src})")
    size = ""
    if src.startswith("/"):
        found = image_size(site_file(src, where))
        if found:
            size = f' width="{found[0]}" height="{found[1]}"'
        else:
            warnings.append(f"{where}: could not read the size of {src}; use JPEG, PNG or WebP")
    hint = ' loading="lazy" decoding="async"' if lazy else ' decoding="async"'
    caption = f"<figcaption>{attrs['title']}</figcaption>" if attrs.get("title") else ""
    return f'<figure><img src="{src}" alt="{attrs["alt"]}"{size}{hint}>{caption}</figure>'


def render_body(source: str, where: str) -> str:
    body = markdown.Markdown(extensions=["extra", "sane_lists"], output_format="html").convert(source)
    if re.search(r"<h1[ >]", body):
        fail(f"{where}: start headings at ## (the post title is the page's only top heading)")
    # A picture on its own line becomes a figure with its size and, if given, a caption.
    body = re.sub(
        r"<p><img ([^>]*?)\s*/?></p>",
        lambda m: figure(dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1))), where),
        body)
    body = body.replace("<table>", '<div class="tablewrap"><table>').replace("</table>", "</table></div>")
    body = re.sub(r"<thead>.*?</thead>", lambda m: re.sub(r"<th(?=[ >])", '<th scope="col"', m.group(0)), body, flags=re.S)
    body = re.sub(r'<a href="(https?://(?!maxkmedia\.com)[^"]+)"', r'<a href="\1" rel="noopener"', body)
    for url in re.findall(r'(?:href|src)="(/[^"]*)"', body):
        if url != "/" and not url.startswith(("//", "/blog/", "/blog.html")):
            site_file(url, where)   # other posts are checked once every page is built
    return body


def localise(markup: str, prefix: str) -> str:
    """Posts are written with addresses from the site root ('/guides.html').
    Rewrite them relative to the page, so the site works at the domain root,
    under a sub-path and opened straight from a folder."""
    markup = re.sub(r'\b(href|src)="/"', rf'\1="{prefix}index.html"', markup)
    return re.sub(r'\b(href|src)="/(?!/)([^"]+)"', rf'\1="{prefix}\2"', markup)


@dataclass
class Post:
    slug: str
    title: str
    seo_title: str
    description: str
    date: dt.date
    updated: dt.date
    body: str
    minutes: int
    image: str = ""
    image_alt: str = ""
    image_size: tuple[int, int] | None = None

    @property
    def path(self) -> str:
        return f"blog/{self.slug}.html"

    @property
    def url(self) -> str:
        return f"{SITE}/{self.path}"

    @property
    def card(self) -> str:
        """Share image: the post's own picture if it has one, else a title card."""
        return self.image.lstrip("/") if self.image else f"og/blog--{self.slug}.jpg"


def load_posts() -> list[Post]:
    posts: list[Post] = []
    for path in sorted(CONTENT.glob("*.md")):
        if path.name.startswith("_"):
            continue
        meta, source = read_source(path)
        slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem)
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
            fail(f"{rel(path)}: name the file like 2026-11-13-short-title.md "
                 "(lower-case letters, numbers and hyphens)")
        if any(p.slug == slug for p in posts):
            fail(f"two posts would both be published at blog/{slug}.html")
        title = need(meta, "title", path)
        description = need(meta, "description", path)
        day = parse_day(need(meta, "date", path), path)
        updated = parse_day(meta["updated"], path) if meta.get("updated") else day
        if updated < day:
            fail(f"{rel(path)}: 'updated' is earlier than 'date'")
        body = render_body(source, rel(path))
        words = len(re.sub(r"<[^>]+>", " ", body).split())
        post = Post(slug=slug, title=title, seo_title=meta.get("seo_title") or title,
                    description=description, date=day, updated=updated, body=body,
                    minutes=max(1, round(words / 200)))
        if meta.get("image"):
            post.image = "/" + meta["image"].lstrip("/")
            post.image_alt = need(meta, "image_alt", path)
            post.image_size = image_size(site_file(post.image, rel(path)))
        if len(f"{post.seo_title} | {SITE_NAME}") > TITLE_MAX:
            warnings.append(f"{rel(path)}: the search title runs past {TITLE_MAX} characters; "
                            "add a shorter 'seo_title:' line")
        if not DESC_RANGE[0] <= len(description) <= DESC_RANGE[1]:
            warnings.append(f"{rel(path)}: the description is {len(description)} characters; "
                            f"aim for {DESC_RANGE[0]} to {DESC_RANGE[1]}")
        posts.append(post)
    return sorted(posts, key=lambda p: (p.date, p.slug), reverse=True)


# ------------------------------------------------- the site around the blog --

def site_pages() -> list[Path]:
    return sorted(p for p in ROOT.rglob("*.html")
                  if not (set(p.relative_to(ROOT).parts[:-1]) & SKIP_DIRS)
                  and p.name != "blog.html")


def with_blog_links(page: str) -> str:
    """Add Blog after Guides in the main navigation and the footer list."""
    def nav(match: re.Match) -> str:
        block = match.group(0)
        if 'blog.html">Blog</a>' in block:
            return block
        return re.sub(r'<a href="([^"]*)guides\.html"(?: aria-current="(?:page|true)")?>Guides</a>',
                      r'\g<0><a href="\1blog.html">Blog</a>', block, count=1)

    def foot(match: re.Match) -> str:
        block = match.group(0)
        if 'blog.html">Blog</a>' in block:
            return block
        return re.sub(r'<li><a href="([^"]*)guides\.html">Guides</a></li>',
                      r'\g<0><li><a href="\1blog.html">Blog</a></li>', block, count=1)

    page = re.sub(r'<nav class="nav" id="nav".*?</nav>', nav, page, count=1, flags=re.S)
    return re.sub(r'<footer class="foot">.*?</footer>', foot, page, count=1, flags=re.S)


@dataclass
class Shell:
    """The parts of an existing page that every blog page reuses."""
    style: str
    meta: list[str]
    links: list[str]
    script: str
    opening: str
    cta: str
    closing: str
    business: list[dict]
    panel: str = ""
    author: str = ""


def read_shell(text: str, name: str, article: bool) -> Shell:
    def grab(pattern: str, what: str) -> str:
        found = re.search(pattern, text, re.S)
        if not found:
            fail(f"could not find {what} in {name}; the page layout has changed and "
                 "tools/blog/build.py needs updating to match")
        return found.group(0)

    style = grab(r"<style>.*?</style>", "the stylesheet")[len("<style>"):-len("</style>")]
    graph = json.loads(grab(r'<script type="application/ld\+json">.*?</script>', "the structured data")
                       [len('<script type="application/ld+json">'):-len("</script>")])["@graph"]
    opening = text[text.index("<body>"):text.index('<main id="main">')]
    if 'blog.html">Blog</a>' not in opening:
        fail(f"{name} has no Blog link in its navigation")
    # The site marks a section's own index "page" and the pages under it "true".
    here = "true" if article else "page"
    opening = re.sub(r' aria-current="(?:page|true)"', "", opening).replace(
        'blog.html">Blog</a>', f'blog.html" aria-current="{here}">Blog</a>', 1)
    return Shell(
        style=style,
        meta=re.findall(r'<meta name="(?:theme-color|color-scheme|author|geo\.[a-z]+)" content="[^"]*">', text),
        links=re.findall(r'<link rel="(?:icon|apple-touch-icon|manifest|preload)"[^>]*>', text),
        script=grab(r'<script src="[^"]*js/site\.js[^"]*" defer></script>', "the site script"),
        opening=opening,
        cta=grab(r'<section class="cta".*?</section>', "the closing call to action"),
        closing=text[text.index("</main>"):],
        business=[n for n in graph if n.get("@type") in ("ProfessionalService", "Person", "WebSite")],
        panel=grab(r'<div class="panel">.*?</div>', "the enquiry panel") if article else "",
        author=grab(r'<span>By <a class="tl" href="[^"]*">[^<]*</a></span>', "the byline") if article else "",
    )


def head(shell: Shell, *, prefix: str, title: str, description: str, url: str, kind: str,
         share_title: str, card: str, card_alt: str, card_size: tuple[int, int] | None,
         graph: list[dict], extra: tuple[str, ...] = ()) -> str:
    image = f"{SITE}/{card}"
    size = [f'<meta property="og:image:width" content="{card_size[0]}">',
            f'<meta property="og:image:height" content="{card_size[1]}">'] if card_size else []
    data = json.dumps({"@context": "https://schema.org", "@graph": shell.business + graph},
                      ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return "\n".join([
        "<!DOCTYPE html>", '<html lang="en-AU">', "<head>", '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        "<script>document.documentElement.className='js'</script>",
        f"<title>{esc(title)}</title>",
        f'<meta name="description" content="{esc(description)}">',
        f'<link rel="canonical" href="{url}">',
        '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
        f'<link rel="alternate" hreflang="en-AU" href="{url}">',
        f'<link rel="alternate" hreflang="x-default" href="{url}">',
        *shell.meta,
        f'<meta property="og:type" content="{kind}">',
        f'<meta property="og:site_name" content="{SITE_NAME}">',
        '<meta property="og:locale" content="en_AU">',
        f'<meta property="og:title" content="{esc(share_title)}">',
        f'<meta property="og:description" content="{esc(description)}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{image}">',
        *size,
        f'<meta property="og:image:alt" content="{esc(card_alt)}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{esc(share_title)}">',
        f'<meta name="twitter:description" content="{esc(description)}">',
        f'<meta name="twitter:image" content="{image}">',
        *extra,
        *shell.links,
        f"<style>{shell.style}{BLOG_CSS}</style>",
        f'<link rel="alternate" type="application/atom+xml" title="{SITE_NAME} blog" href="{prefix}blog/feed.xml">',
        f'<script type="application/ld+json">{data}</script>',
        shell.script, "</head>", ""])


def crumbs(url: str, trail: list[tuple[str, str]]) -> dict:
    return {"@type": "BreadcrumbList", "@id": f"{url}#breadcrumb",
            "itemListElement": [{"@type": "ListItem", "position": n, "name": name, "item": item}
                                for n, (name, item) in enumerate(trail, 1)]}


def webpage(kind: str, *, url: str, title: str, description: str, published: dt.date,
            modified: dt.date, card: str) -> dict:
    return {"@type": kind, "@id": f"{url}#webpage", "url": url, "name": title,
            "description": description, "isPartOf": {"@id": f"{SITE}/#website"},
            "about": {"@id": f"{SITE}/#business"}, "inLanguage": "en-AU",
            "datePublished": published.isoformat(), "dateModified": modified.isoformat(),
            "primaryImageOfPage": {"@type": "ImageObject", "url": f"{SITE}/{card}"},
            "breadcrumb": {"@id": f"{url}#breadcrumb"}}


# ------------------------------------------------------------------ pages --

def post_page(post: Post, posts: list[Post], shell: Shell) -> str:
    title = f"{post.seo_title} | {SITE_NAME}"
    graph = [
        crumbs(post.url, [("Home", f"{SITE}/"), ("Blog", f"{SITE}/blog.html"), (post.title, post.url)]),
        webpage("WebPage", url=post.url, title=title, description=post.description,
                published=post.date, modified=post.updated, card=post.card),
        {"@type": "BlogPosting", "@id": f"{post.url}#article", "headline": post.title,
         "description": post.description, "datePublished": post.date.isoformat(),
         "dateModified": post.updated.isoformat(), "author": {"@id": f"{SITE}/#max"},
         "publisher": {"@id": f"{SITE}/#business"},
         "mainEntityOfPage": {"@id": f"{post.url}#webpage"}, "inLanguage": "en-AU",
         "image": f"{SITE}/{post.card}"},
    ]
    author = re.search(r'<meta name="author" content="([^"]*)">', "".join(shell.meta))
    top = head(shell, prefix="../", title=title, description=post.description, url=post.url,
               kind="article", share_title=post.title, card=post.card,
               card_alt=post.image_alt or post.title,
               card_size=post.image_size if post.image else (1200, 630), graph=graph,
               extra=(f'<meta property="article:published_time" content="{post.date.isoformat()}">',
                      f'<meta property="article:modified_time" content="{post.updated.isoformat()}">',
                      *([f'<meta property="article:author" content="{author.group(1)}">'] if author else [])))
    byline = [shell.author, f'<span><time datetime="{post.date.isoformat()}">{nice_date(post.date)}</time></span>']
    if post.updated != post.date:
        byline.append(f'<span>Updated <time datetime="{post.updated.isoformat()}">{nice_date(post.updated)}</time></span>')
    byline.append(f"<span>{post.minutes} minute read</span>")
    lead = ""
    if post.image:
        lead = figure({"src": post.image, "alt": esc(post.image_alt)}, post.path, lazy=False)
    recent = ""
    if len(posts) > 1:
        here = ' aria-current="page"'
        items = "".join(
            f'<li><a href="/{p.path}"{here if p is post else ""}>{esc(p.title)}</a></li>'
            for p in posts[:RECENT])
        recent = f'<nav class="side" aria-label="Recent posts"><h2>Recent posts</h2><ul>{items}</ul></nav>'
    main = (
        '<main id="main"><header class="phead"><div class="wrap"><nav aria-label="Breadcrumb">'
        '<ol class="crumbs"><li><a href="/index.html">Home</a></li><li><a href="/blog.html">Blog</a></li>'
        f'<li aria-current="page">{esc(post.title)}</li></ol></nav><h1>{esc(post.title)}</h1>'
        f'<p class="lede">{esc(post.description)}</p><p class="byline">{"".join(byline)}</p></div></header>'
        f'<section class="sec"><div class="wrap"><div class="cols"><article class="prose">{lead}{post.body}</article>'
        f"<aside>{shell.panel}{recent}</aside></div></div></section>")
    return top + shell.opening + localise(main, "../") + shell.cta + shell.closing


def index_page(posts: list[Post], shell: Shell, copy: dict[str, str]) -> str:
    url = f"{SITE}/blog.html"
    title = f"{copy['seo_title']} | {SITE_NAME}"
    share = f"{copy['heading']} {copy['subheading']}"
    newest = max((p.updated for p in posts), default=dt.date.today())
    oldest = min((p.date for p in posts), default=newest)
    graph = [
        crumbs(url, [("Home", f"{SITE}/"), ("Blog", url)]),
        webpage("CollectionPage", url=url, title=title, description=copy["description"],
                published=oldest, modified=newest, card="og/blog.jpg"),
        {"@type": "ItemList", "@id": f"{url}#list", "name": "Blog",
         "itemListElement": [{"@type": "ListItem", "position": n, "name": p.title, "url": p.url}
                             for n, p in enumerate(posts, 1)]},
    ]
    top = head(shell, prefix="", title=title, description=copy["description"], url=url,
               kind="website", share_title=share, card="og/blog.jpg", card_alt=share,
               card_size=(1200, 630), graph=graph)
    rows = "".join(
        f'<li><a href="/{p.path}"><div><time datetime="{p.date.isoformat()}">{nice_date(p.date)}</time>'
        f"<h3>{esc(p.title)}</h3></div><p>{esc(p.description)}</p>"
        '<svg class="icon" width="20" height="20" aria-hidden="true" focusable="false"><use href="#i-right"/></svg>'
        "</a></li>" for p in posts)
    listing = f'<ul class="rows">{rows}</ul>' if posts else '<p class="lede">Nothing has been published yet.</p>'
    main = (
        '<main id="main"><header class="phead"><div class="wrap"><nav aria-label="Breadcrumb">'
        '<ol class="crumbs"><li><a href="/index.html">Home</a></li><li aria-current="page">Blog</li></ol></nav>'
        f'<h1>{esc(copy["heading"])}<span class="l2">{esc(copy["subheading"])}</span></h1>'
        f'<p class="lede">{esc(copy["lede"])}</p></div></header>'
        f'<section class="sec"><div class="wrap">{listing}</div></section>')
    return top + shell.opening + localise(main, "") + shell.cta + shell.closing


def feed(posts: list[Post], copy: dict[str, str], author: dict) -> str:
    newest = max((p.updated for p in posts), default=dt.date.today())
    entries = "".join(
        f"<entry><title>{esc(p.title)}</title><link href=\"{p.url}\"/><id>{p.url}</id>"
        f"<published>{stamp(p.date)}</published><updated>{stamp(p.updated)}</updated>"
        f"<summary>{esc(p.description)}</summary></entry>\n" for p in posts)
    return (
        '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-AU">\n'
        f"<title>{SITE_NAME} blog</title><subtitle>{esc(copy['lede'])}</subtitle>\n"
        f'<link href="{SITE}/blog/feed.xml" rel="self"/><link href="{SITE}/blog.html"/><id>{SITE}/blog.html</id>\n'
        f"<updated>{stamp(newest)}</updated><author><name>{esc(author['name'])}</name>"
        f"<uri>{author['url']}</uri></author>\n{entries}</feed>\n")


# --------------------------------------------- files the main site also owns --

def sitemap_xml(text: str, posts: list[Post]) -> str:
    text = re.sub(rf"<url><loc>{re.escape(SITE)}/blog(?:\.html|/[^<]*)</loc>.*?</url>\n", "", text)
    if not posts:
        return text
    lines = [f"<url><loc>{SITE}/blog.html</loc><lastmod>{max(p.updated for p in posts).isoformat()}</lastmod></url>\n"]
    for p in posts:
        picture = (f"<image:image><image:loc>{SITE}{p.image}</image:loc></image:image>" if p.image else "")
        lines.append(f"<url><loc>{p.url}</loc><lastmod>{p.updated.isoformat()}</lastmod>{picture}</url>\n")
    if "</urlset>" not in text:
        fail("sitemap.xml has no closing </urlset>")
    return text.replace("</urlset>", "".join(lines) + "</urlset>", 1)


def sitemap_html(text: str, posts: list[Post], copy: dict[str, str]) -> str:
    text = re.sub(r'<section data-blog>.*?</section>', "", text, flags=re.S)
    text = re.sub(r'<a href="blog\.html" data-blog>[^<]*</a>', "", text)
    start = text.find('<div class="sitemap-cols">')
    end = text.find("</main>", start)
    if start < 0 or end < 0:
        fail("sitemap.html no longer has the page listing tools/blog/build.py expects")
    listing = text[start:end]     # the header and footer have their own Blog links; leave them be
    guides = re.search(r'<a href="guides\.html">[^<]*</a>', listing)
    section = re.search(r"<section><h2>Guides</h2>.*?</section>", listing, re.S)
    if not guides or not section:
        fail("sitemap.html no longer lists the guides the way tools/blog/build.py expects")
    if posts:
        links = "".join(f'<a href="{p.path}">{esc(p.seo_title)}</a>' for p in posts)
        listing = listing.replace(section.group(0), f"{section.group(0)}<section data-blog><h2>Blog</h2>{links}</section>", 1)
    listing = listing.replace(guides.group(0), f'{guides.group(0)}<a href="blog.html" data-blog>{esc(copy["seo_title"])}</a>', 1)
    return text[:start] + listing + text[end:]


def llms_txt(text: str, posts: list[Post], copy: dict[str, str]) -> str:
    text = re.sub(r"## Blog\n.*?(?=\n## |\Z)", "", text, flags=re.S)
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = [f"- [{copy['seo_title']}]({SITE}/blog.html): {copy['description']}"]
    lines += [f"- [{p.seo_title}]({p.url}): {p.description}" for p in posts]
    block = "## Blog\n" + "\n".join(lines) + "\n\n"
    if "## Optional" in text:
        return text.replace("## Optional", block + "## Optional", 1)
    return text.rstrip("\n") + "\n\n" + block.rstrip("\n") + "\n"


# ------------------------------------------------------------ share images --

CARD = """<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:D;src:url("{display}");font-weight:200 800}}
@font-face{{font-family:B;src:url("{text}");font-weight:100 900}}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;background:#0B0D09;color:#EDE8DF;border-top:10px solid #2C3A24;
padding:60px 60px 56px;display:flex;flex-direction:column;justify-content:space-between}}
.w{{font:800 34px/1 D;letter-spacing:.03em;color:#9DB98A}}.w b{{font-weight:inherit;color:#D9A24A}}
h1{{font:800 {size}px/.95 D;letter-spacing:-.03em;text-transform:uppercase;max-width:{measure}px;
text-wrap:balance;margin-top:22px}}
p{{display:flex;align-items:center;gap:16px;font:400 26px/1 B;color:#979B8C}}
p::before{{content:"";width:34px;height:2px;background:#D9A24A}}
</style><div class="w">MAX K <b>MEDIA</b></div><h1>{title}</h1><p>maxkmedia.com Bathurst NSW</p>"""


def render_cards(cards: dict[str, str]) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        fail("share images need Playwright: pip install playwright && playwright install chromium")
    def font(name: str) -> str:   # inlined: a blank page may not load files from disk
        raw = (ROOT / "fonts" / name).read_bytes()
        return "data:font/woff2;base64," + base64.b64encode(raw).decode("ascii")
    faces = {"display": font("bricolage-grotesque.woff2"), "text": font("hanken-grotesk.woff2")}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        for path, title in cards.items():
            size, measure = (60, 860) if len(title) <= 48 else (52, 960) if len(title) <= 80 else (44, 1040)
            page.set_content(CARD.format(size=size, measure=measure, title=esc(title), **faces))
            page.wait_for_function(
                "document.fonts.status === 'loaded' && document.fonts.check('800 32px D')"
                " && document.fonts.check('400 24px B')", timeout=15000)
            (ROOT / path).parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(ROOT / path), type="jpeg", quality=88)
            print(f"  rendered {path}")
        browser.close()


# ------------------------------------------------------------------- build --

def check_links(outputs: dict[str, str]) -> None:
    for path, markup in outputs.items():
        if not path.endswith(".html"):
            continue
        # The 404 page is served for any missing address, so it alone resolves from the domain root.
        rooted = '<base href="/">' in markup
        folder = ROOT if rooted else (ROOT / path).parent
        for url in re.findall(r'(?:href|src)="([^"#?]+)[^"]*"', markup):
            if re.match(r"[a-z][a-z0-9+.-]*:", url):
                continue
            if url.startswith("/") and not rooted:
                fail(f"{path} still has an address that starts at the domain root: {url}")
            target = (folder / (url.lstrip("/") or "index.html")).resolve()
            if ROOT not in target.parents:
                fail(f"{path} links outside the site: {url}")
            if rel(target) in outputs or target.is_file():
                continue
            fail(f"{path} links to {url}, which does not exist")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the maxkmedia.com blog.")
    parser.add_argument("--og", action="store_true", help="re-render the share images (needs Playwright)")
    parser.add_argument("--check", action="store_true", help="change nothing; exit 1 if the output is stale")
    parser.add_argument("--prune", action="store_true", help="delete blog pages whose source file is gone")
    args = parser.parse_args()

    index_source = CONTENT / "_index.md"
    if not index_source.is_file():
        fail("content/blog/_index.md is missing")
    copy, _ = read_source(index_source)
    for key in ("heading", "subheading", "seo_title", "description", "lede"):
        need(copy, key, index_source)
    posts = load_posts()

    outputs: dict[str, str] = {}
    pages = {rel(p): p.read_text(encoding="utf-8") for p in site_pages()}
    for path, text in pages.items():
        linked = with_blog_links(text)
        if linked != text:
            outputs[path] = pages[path] = linked

    article_ref = next((p for p in sorted(pages) if p.startswith("guides/")), None)
    if "guides.html" not in pages or not article_ref:
        fail("the blog borrows its layout from guides.html and a page in guides/; neither can be found")
    shell_index = read_shell(pages["guides.html"], "guides.html", article=False)
    shell_post = read_shell(pages[article_ref], article_ref, article=True)
    person = next((n for n in shell_post.business if n.get("@type") == "Person"), None)
    if not person:
        fail(f"{article_ref} has no Person entry in its structured data")

    # guides.html closes by inviting questions for the next guide. The blog index wants
    # the plain enquiry prompt the articles use, with its links re-based to the site root.
    shell_index.cta = shell_post.cta.replace('href="../', 'href="')
    outputs["blog.html"] = index_page(posts, shell_index, copy)
    for post in posts:
        outputs[post.path] = post_page(post, posts, shell_post)
    outputs["blog/feed.xml"] = feed(posts, copy, person)
    outputs["sitemap.xml"] = sitemap_xml((ROOT / "sitemap.xml").read_text(encoding="utf-8"), posts)
    outputs["sitemap.html"] = sitemap_html(pages["sitemap.html"], posts, copy)
    outputs["llms.txt"] = llms_txt((ROOT / "llms.txt").read_text(encoding="utf-8"), posts, copy)

    cards = {"og/blog.jpg": f"{copy['heading']} {copy['subheading']}"}
    cards.update({p.card: p.title for p in posts if not p.image})

    orphans = [rel(p) for p in sorted((ROOT / "blog").glob("*.html")) if rel(p) not in outputs]
    stale = [path for path, text in outputs.items()
             if not (ROOT / path).is_file() or (ROOT / path).read_text(encoding="utf-8") != text]
    missing_cards = [path for path in cards if not (ROOT / path).is_file()]

    if args.check:
        problems = ([f"out of date: {p}" for p in stale] + [f"no source: {p}" for p in orphans]
                    + [f"share image missing: {p}" for p in missing_cards])
        if problems:
            sys.exit("blog output is stale; run python3 tools/blog/build.py\n  " + "\n  ".join(problems))
        print(f"blog output is up to date ({len(posts)} post{'' if len(posts) == 1 else 's'})")
        return

    if orphans and not args.prune:
        fail("these pages have no source file any more: " + ", ".join(orphans) + ". A published "
             "address should not just vanish: restore the source, or re-run with --prune and add "
             "a redirect for the old address")

    for path in stale:
        target = ROOT / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(outputs[path], encoding="utf-8", newline="\n")
    for path in orphans:
        (ROOT / path).unlink()
    wanted = cards if args.og else {path: cards[path] for path in missing_cards}
    if wanted:
        render_cards(wanted)
    check_links(outputs)

    for line in warnings:
        print(f"  note: {line}")
    print(f"blog built: {len(posts)} post{'' if len(posts) == 1 else 's'}, {len(stale)} files written"
          + (f", {len(orphans)} removed" if orphans else ""))


if __name__ == "__main__":
    main()
