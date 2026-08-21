# Max K Media — unified site (v2)

Rebuilt on the **actual theme from your Max Media site**, not an approximation of it.
I pulled `yherhr/Krause_Photography` from raw.githubusercontent and lifted the real
tokens, so this is the same design language rather than something adjacent to it.

Static HTML/CSS/JS. No build step, no dependencies, no framework.

---

## 1. What changed from v1

| | v1 | v2 |
|---|---|---|
| Palette | Violet + gold + 3 accent colours | `--void #0C0B0A` / `--surface #15130F` / `--bone #EDE8DF` / `--smoke #9A938A`. **No accent colour at all** — same as your media site |
| Type | Archivo + IBM Plex | **Bricolage Grotesque + Hanken Grotesk** — your actual pair |
| Controls | Square buttons, hard corners | Pill buttons and chips, `999px` — your actual pattern |
| Hero | Canvas line drawing | Full-bleed photograph, slow zoom, gradient scrim, outlined second line — your actual hero |
| Imagery | Text-only cards | Photographs throughout: hero, three service bands, 16-frame masonry gallery, portrait |
| Client work | Text descriptions | **Live iframe embeds** in browser chrome |
| Message | "Three disciplines" | **End to end for any business** — a five-stage chain is now the first thing under the hero |

The gold is gone completely — `grep` for the old hex values returns nothing.

---

## 2. Files

```
index.html          hero · 5-stage end-to-end chain · 3 image bands · live client
                    embeds · 16-frame gallery · about · process · region · contact
web.html            live embeds, what-you-get, every build, service areas
photography.html    session types, full gallery + lightbox, shoot process
automation.html     capability, platforms, background
404.html            themed, and resolves its own base path (see below)
css/mkm.css         one stylesheet
js/mkm.js           one script, no libraries
tools/              build-sitemap.sh · set-site-url.sh · check-embeds.sh
                    shots.mjs · optimise-images.sh
.github/workflows/  optional Pages deploy — rebuilds the sitemap, audits links
img/work/           poster screenshots go here (empty for now — see §4)
.nojekyll           stops Jekyll eating any file starting with _ (your photos)
favicon.* · og-image.png · site.webmanifest · robots.txt · sitemap.xml
DEPLOY.md           GitHub Pages walkthrough
```

Two things in there that aren't obvious:

**`.nojekyll`** — GitHub Pages runs Jekyll by default, and Jekyll ignores any file
starting with `_`. Your photographs are all `_DSC5307.jpg` and friends, so the moment
you localise them into `img/` they'd vanish with no error. Don't delete that file.

**`404.html`** — GitHub Pages serves it for a missing path at *any* depth, so neither
root-relative nor document-relative links are safe in it. It works out the site root
at runtime (`/<repo>/` on a project site, `/` on a custom domain) and sets its own
links from that.

---

## 3. Deploy

Full step-by-step in **[DEPLOY.md](DEPLOY.md)**. The short version: drop the contents
into the root of `yherhr/Max-Portfolio`, overwriting `index.html`, and leave
`services/` and `locations.html` alone so all 204 of those URLs stay exactly where
they are.

```bash
./tools/build-sitemap.sh    # walks the repo, picks up all 204 services pages
git add -A && git commit -m "Unify portfolio and photography as Max K Media" && git push
```

Changing the site's address later is one command — `./tools/set-site-url.sh
https://maxkmedia.com.au` rewrites canonical, og, JSON-LD, robots.txt and every
sitemap `<loc>`. Nothing else needs touching: every internal link and asset path is
depth-relative, so it resolves the same at a domain root, on a GitHub Pages sub-path,
and from `file://`.

---

## 4. The client-site embeds — read this before launch

Each card renders the client's real site in an iframe at 1440px wide, scaled by JS to
fit the card. They build lazily on scroll, so four third-party sites don't load on
first paint.

**The catch:** a site that sends `X-Frame-Options: DENY`/`SAMEORIGIN`, or a CSP with
`frame-ancestors`, cannot be framed at all — and the browser still fires `load` on the
error page, so JS can't reliably detect it. That means a blocked site would show
Chrome's grey error page inside your card. I could not test this from my sandbox
(outbound network is restricted), so **run the checker before you launch**:

```bash
./tools/check-embeds.sh
```

For anything it reports `BLOCKED`, change that card's `data-embed="live"` to
`data-embed="poster"` on the `.frame__view` element. The card then shows a clean
"open in a new tab" panel instead. Shopify storefronts are the most likely to block,
so I'd expect Rokiovertime to be the one that needs it.

**Posters.** Each card also references `img/work/<slug>.jpg`. If the file is missing the
`onerror` removes it cleanly, so nothing broken shows — but generating them is worth it,
both as the poster behind a live frame and as the fallback for a blocked one:

```bash
npm i -D playwright && npx playwright install chromium
node tools/shots.mjs
```

---

## 5. Images

The gallery, hero and bands load from jsDelivr, the **same CDN your media site already
uses**:

```
https://cdn.jsdelivr.net/gh/yherhr/Krause_Photography@main/_DSC5307.jpg
```

That's faster than GitHub Pages and already cached, but it does mean the
`Krause_Photography` repo has to stay published. To localise: copy the JPEGs into
`img/`, then change the `CDN` constant at the top of `js/mkm.js` and find-and-replace
the same base URL across the four HTML files.

Those originals are full-size camera JPEGs. `./tools/optimise-images.sh <folder>`
resizes the longest edge to 1600px at quality 80 — typically a 70–80% payload cut with
no visible difference at the sizes the site actually displays. Worth doing; the gallery
is the heaviest thing on the page by a wide margin.

---

## 6. Decisions I've left to you

**The automation band has no photograph.** There's no industrial imagery in your
library, and using a product shot there would misrepresent the work. So that slot is a
technical panel — platforms and protocols on a faint hatch — which fills the layout
deliberately rather than looking like a missing image. If you can publish a site photo,
swap the `.band__panel` block for a `.band__media` figure and it'll match the other two.

**`automation.html` names Evolution Mining and UGL** as employment background, and
describes work by problem shape rather than by site. That's the conservative framing,
but publishing a consulting offer in the same field as your day job can cut across an
employment agreement. Worth reading your contract before this goes live.

**The "in progress" builds** on `web.html` name OURFARM Machinery, Rural Asset
Protection and Eye Doctors Mona Vale. Confirm each client is happy to be listed.

**The numbers** — 80+ projects, 7-day turnaround — came across from your two existing
sites. They were already public but they're a couple of years old. They're also the most
falsifiable thing on the page, so check they still hold.

---

## 7. Against your standing build rules

| Rule | Status |
|---|---|
| No emoji icons | Clean — three inline SVGs in a `<symbol>` sprite, everything else is CSS |
| No template tells | Bands alternate and vary in height; the gallery is real masonry with per-image row spans, not a uniform card grid |
| Depth-relative links and assets | Verified — no root-relative paths anywhere |
| Working favicon | Verified serving 200: `.ico`, `.svg`, apple-touch, 512 maskable, manifest — all regenerated in the new palette |
| Supplied social links byte-for-byte | Instagram and LinkedIn copied exactly from your source |
| No file-upload inputs | None — enquiry form is `mailto:` only |
| Mobile sweep before delivery | Done — see below |
| URL structure preserved 1:1 | `services/*` and `locations.html` untouched |

### Mobile sweep — what it caught

**Inline styles beating media queries.** I'd set `style="grid-template-columns:repeat(4,…)"`
directly on three grids. Inline styles beat every stylesheet rule, so those grids never
collapsed on phones and long words spilled their tracks at 320px. Replaced with
`.chain--4` / `.chain--3` modifier classes that the responsive rules can actually
override, and added `overflow-wrap: anywhere` so no unbreakable string can widen a
track. (Same class of bug as the specificity trap in v1 — worth watching for.)

**Header overflow at 320px.** Brand + "BATHURST" tag + burger, all `nowrap`, exceeded a
320px viewport. The location tag now hides and the brand shrinks below 400px.

Re-verified at **320 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920** on all four pages:
no element overflows, and `maxScrollX == 0` everywhere — the page genuinely cannot
scroll sideways, which is the test that matters rather than `scrollWidth`.

### Tested working

16 tiles render · filters return exactly 7 studio / 2 gym / 1 outdoor / 2 family /
4 product / 16 all · lightbox scopes to the active filter (opens `01 / 04` inside
Product, not `01 / 16`) · arrow keys, swipe, Escape, focus return · burger open /
Escape-close · header docks on scroll · all four embed views build on scroll · enquiry
form composes a correct `mailto:` with subject and body · zero page errors · JSON-LD
parses on all four pages · `prefers-reduced-motion` honoured · visible keyboard focus ·
skip link.

### Not verified from here

Google Fonts (Bricolage Grotesque, Hanken Grotesk) and the jsDelivr images are both
blocked by my sandbox's network policy, so my screenshots used system fonts and
placeholder frames. Both load from public CDNs and will render normally for you — but
Bricolage is doing a lot of the work in those headlines, so give it one look in a real
browser after you push. The embed behaviour in §4 is the other thing I couldn't test.
