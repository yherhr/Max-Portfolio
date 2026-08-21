# Deploying to GitHub Pages

Everything here is plain static files. No build step, no dependencies, nothing to
compile. Push it and it's live.

---

## Which repo?

**Use your existing `yherhr/Max-Portfolio` repo.** That's where the ~204
`services/*.html` pages and `locations.html` already live, and those URLs are the
bulk of your search footprint. Deploying here means every one of them stays at the
exact same address — no redirects, no ranking reset.

A fresh repo would move the site to `yherhr.github.io/max-k-media/`, orphaning all
204 indexed URLs. Only do that if you're deliberately starting the SEO over.

---

## Option A — into Max-Portfolio (recommended)

```bash
git clone https://github.com/yherhr/Max-Portfolio.git
cd Max-Portfolio

# work on a branch so you can see the result before it's public
git switch -c max-k-media
```

Copy in **the contents** of the `max-k-media/` folder from the zip — the files
themselves, not the folder. It should overwrite `index.html` and add the rest:

```
index.html  web.html  photography.html  automation.html  404.html
css/  js/  img/  tools/  .github/
favicon.*  og-image.png  site.webmanifest  robots.txt  sitemap.xml
.nojekyll  .gitignore  README.md  DEPLOY.md
```

Leave `services/` and `locations.html` exactly as they are.

Then:

```bash
./tools/build-sitemap.sh        # picks up all 204 services pages automatically
git add -A
git commit -m "Unify portfolio and photography as Max K Media"
git push -u origin max-k-media
```

Preview the branch, then merge:

```bash
git switch main
git merge max-k-media
git push
```

Pages will pick it up within a minute or two.

### Repo settings

**Settings → Pages → Build and deployment.** Two choices:

- **Deploy from a branch** — simplest. Source: `main`, folder: `/ (root)`. Delete
  `.github/workflows/pages.yml`; you'd just run `./tools/build-sitemap.sh`
  yourself whenever you add a page.
- **GitHub Actions** — uses the included workflow, which rebuilds the sitemap on
  every push and warns about broken internal links in the Actions log. Worth it
  given how many pages `services/` holds.

---

## Option B — a brand new repo

```bash
mkdir max-k-media && cd max-k-media
# copy in the contents of the max-k-media/ folder
git init -b main
./tools/set-site-url.sh https://yherhr.github.io/max-k-media
./tools/build-sitemap.sh
git add -A
git commit -m "Max K Media site"
git remote add origin https://github.com/yherhr/max-k-media.git
git push -u origin main
```

Then Settings → Pages → Source. The `set-site-url.sh` step matters: it rewrites
canonical, `og:url`, `og:image`, `twitter:image`, the JSON-LD `url` fields, the
`Sitemap:` line in `robots.txt` and every `<loc>` in `sitemap.xml`.

Without it, the new site would tell Google the real version lives at the old
address, and neither would rank properly.

---

## Custom domain later

```bash
./tools/set-site-url.sh https://maxkmedia.com.au
./tools/build-sitemap.sh
echo "maxkmedia.com.au" > CNAME
git add -A && git commit -m "Point at maxkmedia.com.au" && git push
```

Then set the domain under Settings → Pages and tick **Enforce HTTPS** once the
certificate provisions (usually under an hour).

No other edits needed — every internal link and asset path is depth-relative, so
the site renders identically at a domain root, on a Pages sub-path, and from
`file://` on your laptop.

---

## Why `.nojekyll` is in there

GitHub Pages runs Jekyll by default, and **Jekyll silently ignores any file or
folder whose name starts with `_`**. Your photographs are all named `_DSC5307.jpg`
and friends. The moment you localise them out of jsDelivr into `img/`, Jekyll would
drop every single one and the gallery would go blank with no error anywhere.

`.nojekyll` turns that off. Don't delete it.

---

## Before you make it public

Capture the client-site screenshots:

```bash
npm i -D playwright && npx playwright install chromium
node tools/shots.mjs
```

Not blocking — a card with no screenshot yet falls back to a clean name-and-domain
panel, so it ships fine either way. But it's a two-minute job and the cards are
the strongest thing on the page with real screenshots in them.

## After ANY change to css/ or js/

```bash
./tools/stamp-assets.sh
```

This appends a content hash to the css and js links (`css/mkm.css?v=a1b2c3d4`).
Without it, a browser or CDN holding the previous stylesheet will apply it to
your new HTML — any rule you added renders unstyled, text dumps inline and icons
blow up to full size. It looks exactly like a code bug and isn't one. The
included Actions workflow runs this automatically; run it yourself if you deploy
from a branch.

## Adding photos later

```bash
./tools/optimise-images.sh ~/Pictures/some-shoot studio
./tools/build-gallery.sh
./tools/stamp-assets.sh
git add -A && git commit -m "Add shoot" && git push
```

Optimise first — it's the difference between 500 MB and about 50 MB, and Pages
caps a published site at 1 GB. Full detail in README §5, including why Git LFS
is not the answer here.

---

## Local preview

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Use a server rather than opening the file
directly — `file://` blocks the module and fetch behaviour some browsers apply to
local pages, and you want to see it the way a visitor will.

---

## Rolling back

```bash
git revert HEAD          # undo the last commit, keeping history
git push
```

Or in the GitHub UI: Actions → the deployment → re-run a previous successful one.
Because nothing under `services/` was touched, a rollback only ever affects the
new pages.
