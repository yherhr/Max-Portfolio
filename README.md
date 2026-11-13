# maxkmedia.com

The published website for Max K Media. GitHub Pages serves this repository exactly as committed, so whatever is on `main` is live. There is no build step on deploy.

## Making a change

1. Work on a branch.
2. Open a pull request into `main`.
3. Merge it. `.github/workflows/pages.yml` publishes on every push to `main`.

## What is in here

| Path | What it is |
|---|---|
| `*.html`, `services/`, `guides/`, `work/`, `photography/`, `img/`, `og/`, `fonts/`, `js/` | The site, pre-built by the November 2026 generator |
| `content/blog/` | Blog posts, written in Markdown |
| `blog.html`, `blog/` | The blog pages built from those posts. Do not edit these by hand |
| `tools/blog/build.py` | The script that builds the blog |
| `.github/docs/SEO-HANDOVER.md` | Handover notes from the November 2026 build |

## Writing a blog post

Add a file to `content/blog/` named `YYYY-MM-DD-short-title.md`. The part after the date becomes the address, so `2026-11-20-shed-shoot.md` is published at `blog/shed-shoot.html`.

```
---
title: Shooting a shed that is still being built
description: One or two sentences, 70 to 160 characters. Shown under the title, on the blog's front page and in search results.
date: 2026-11-20
---

The post, in Markdown.

## Headings start at two hashes

Link to pages on this site from the root, [like this](/guides.html).

![What the picture shows](/img/blog/shed-frame.jpg "An optional caption")
```

Then build and commit:

```
python3 tools/blog/build.py
git add -A
git commit -m "Blog: shooting a shed"
```

The build writes the post's page, updates the blog's front page, the feed, the sitemap, the site map page and `llms.txt`, and renders a share image for the post. Commit all of it along with the Markdown.

Optional lines for the block at the top:

| Line | Use |
|---|---|
| `updated: 2026-12-01` | Shows an "Updated" date beside the original one |
| `seo_title: A shorter title` | Used in the browser tab and search results when the full title is too long |
| `image: img/blog/hero.jpg` and `image_alt: What it shows` | A picture at the top of the post, also used as the share image |

Things worth knowing:

- Put pictures in `img/blog/`, saved upright as JPEG, PNG or WebP and no wider than 1600 pixels.
- A picture on a line of its own becomes a figure. Every picture needs a description in the square brackets.
- Do not rename a post's file once it is published. The address would change and old links would break.
- The words on the blog's front page live in `content/blog/_index.md`.
- A post that is not ready can sit in an open pull request. Nothing is published until it is merged.

### Setting up the build

It needs Python 3.10 or newer.

```
pip install -r tools/blog/requirements.txt
pip install playwright && playwright install chromium
```

Playwright is only used to render share images. `python3 tools/blog/build.py --og` re-renders all of them, which is worth doing after changing a post's title.

`python3 tools/blog/build.py --check` changes nothing and fails if the committed blog pages are out of date with the Markdown.

## The rest of the site

Every page outside the blog was written by a Python generator (`generator/` in the November 2026 delivery). That generator is not in this repository yet, which has two consequences:

- A page edited by hand here will be overwritten the next time generator output is copied in. Make lasting changes in the generator.
- When a fresh build is copied in, copy the contents of its `site/` folder over the top of this repository. Do **not** clear the repository first, as the delivery's own notes suggest: that would delete `content/` and `tools/`, and the blog with them. Then run `python3 tools/blog/build.py`, which puts the Blog links back into the navigation, footer, sitemap and site map page, and commit.

## After a deploy

1. `https://maxkmedia.com/` loads with the favicon in the tab.
2. `https://maxkmedia.com/services/seo-parkes.html` lands on the Orange SEO page (a retired address redirecting).
3. `https://maxkmedia.com/nothing-here` shows the styled 404 page.
4. `https://maxkmedia.com/blog.html` lists the latest post.
5. An enquiry sent from the contact page arrives.
