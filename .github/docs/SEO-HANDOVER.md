# SEO handover: maxkmedia.com, November 2026

## What was built

**Structure**

- 84 indexable pages: home, 4 discipline pages (web, photography, video, automation), support, 6 web service pages, 48 service-by-town pages, 4 photography category pages, work index and 4 case studies, guides index and 6 guides, plus about, contact, questions, service areas, an HTML site map, privacy and image licensing.
- All 210 addresses in the old sitemap still resolve. The 6 root pages and 48 town pages keep their addresses. The other 156 town addresses are instant redirects to the same service in the nearest of the 8 towns, each with a canonical pointing at its destination.
- Three-level hierarchy for web services: `web.html`, then `services/<service>.html`, then `services/<service>-<town>.html`, with breadcrumbs and cross-links in both directions (same service in other towns, other services in the same town).

**On every page**

- Unique title (65 characters or fewer) and description (70 to 160), one `h1`, absolute canonical, `en-AU` language tags, Open Graph and Twitter tags, and its own 1200 x 630 share image in the brand type.
- A JSON-LD graph: `ProfessionalService` (address, geo, 8 towns served, ABN, phone, email, social profiles, service catalogue), `Person`, `WebSite`, `WebPage` and `BreadcrumbList`. Service pages add `Service` with the area served and the hourly rate. Guides add `Article`. Galleries add `ImageGallery`.
- No third-party requests at all: fonts are hosted with the site, there are no trackers, and no map iframe (the service-area map is drawn in SVG from the towns' coordinates).

**Images**

- 34 photographs, 5 client-site screenshots and your portrait on the About page, each exported as AVIF at up to six widths with a JPEG fallback, with `width` and `height` set so nothing shifts while loading.
- Descriptive file names and alt text written from what is in each frame.
- Creator, credit, copyright and licence URLs are embedded in each file (XMP) and repeated in the page schema. That is what Google Images reads for its "Licensable" badge. The four private-event frames carry creator and credit only, because copyright in privately commissioned photos can sit with the client.
- An image sitemap inside `sitemap.xml` (82 entries).

**Crawler files**

- `sitemap.xml`, `robots.txt`, `feed.xml` (Atom, for the guides), `llms.txt`, an IndexNow key file with a submit script, and a `404.html` that works at any depth.

## What was measured

| Check | Result |
|---|---|
| Static audit (`check.py`) | 242 HTML files, 0 broken links or assets, 210 of 210 legacy addresses resolve, no duplicate titles or descriptions, all JSON-LD parses with no dangling references |
| Browser sweep (`sweep.py`) | 652 page loads at 14 widths from 320 to 1920 px: no horizontal overflow, no clipped text, no wrapped nav links, no console errors |
| Rendering locations | Sub-path, domain root and straight from disk all load styles and images |
| Favicon | Fetched through the page's own link tags at root depth and one level down, on both servers |
| Behaviour | Mobile menu, lightbox, form submit (mocked endpoint), service prefill and the no-JavaScript nav fallback all pass |
| Lighthouse, mobile, 5 pages | Performance 96 to 100, Accessibility 100, Best Practices 100, SEO 100. Layout shift 0. Largest paint 0.9 s on text pages, 2.1 to 2.2 s on the two image-led pages |
| Town page overlap | Same service across towns shares 38% of four-word phrases on average (44% at most). Same town across services shares about 48% |

Lighthouse ran against a local server with simulated mobile throttling. Treat the numbers as a floor check, not a field measurement. Not tested: Google's Rich Results Test and the live Web3Forms endpoint, neither of which is reachable from the build sandbox.

## Decisions worth knowing

- **FAQ markup stays, but expect nothing from it in Google.** Google stopped showing FAQ rich results on 7 May 2026. The markup is still valid schema.org and other engines read it, so it costs nothing to keep. The visible questions are there for readers.
- **`llms.txt` is included, with no ranking claim.** Google's May 2026 guide to AI search says it gives the file no special treatment. Chrome's Lighthouse now audits for it, and some AI tools read it. It is one small file.
- **No star ratings or review markup.** There are no real reviews on the site to mark up, and invented ones breach Google's rules and consumer law. When you have Google reviews, a quoted handful on the home page is worth adding.
- **Eight towns, not thirty-four.** The September consolidation stands. Each town page has a town-specific angle for that service, a local business list, nearby villages and its own questions. Google's AI guide names "pages for every possible query" as scaled content abuse, so I did not widen the matrix.
- **SEO claims in the copy match that position.** The SEO service page says outright that nobody can guarantee a ranking.

## Check this copy before you publish

I wrote these from what I know of your work plus standard practice. Strike anything that is not how you operate.

1. **Service inclusions** on the six `services/` pages and `support.html`: uptime monitoring, test-restored backups, a yearly review, a written handover guide, ad conversion tracking.
2. **Pricing statements**: $180 an hour plus GST appears on the service, town, support and questions pages and in one guide. The 2.5 hour call-out minimum appears on `support.html`. Automation is described as quoted per job, with no rate shown.
3. **About page**: it names the NSW Country Regional Network and mineral processing as background. No employer is named anywhere on the site.
4. **Case studies** (`work/`): CME Detailing, Rural Asset Protection Solutions, BX Realty and Rokiovertime. They describe what was built at the level your current site already does, with more detail on method. Rokiovertime is described as a label you produce the media for, not as a client. Nutraviva is listed with a one-line description and no page.
5. **Photography pages**: turnaround wording, travel, release forms and "private sessions stay private unless you agree".
6. **Privacy page**: names Web3Forms, Google Workspace, GitHub Pages and Cloudflare. I am not a lawyer; have it looked over if you tender for government work.

## Photos

**Used: 34 frames.** 31 from the gallery already published on the site (apparel 17, automotive 5, gym and sport 7, family 1, outdoor 1) and 3 from Drive.

The zip you sent holds the brand files only (favicons, og-image, signature icons), so there were no photographs in it. The "existing" set is the gallery from the live site.

**Drive: 3 used, 32 not.**

| Drive item | Outcome |
|---|---|
| `_DSC1540-5` (GT-R, wide crop) | Used: home strip, photography hero, automotive gallery |
| `_DSC0807`, `_DSC0599` (graduation day) | Used: events and portraits gallery |
| `_DSC0763` (graduation day) | Removed at your request on 11 November. The file is gone from the site and from the generator's source folder |
| `_DSC1540-6` | Not used: a tighter crop of the same frame |
| `_DSC0608` | Not used: a 698 px crop of `_DSC0599` |
| `_DSC0662` | Left out: the subject is making a rude hand gesture |
| 28 other JPEGs (6.8 to 20 MB each) | Could not be downloaded. The Drive connector refuses files over 10 MB and the link drops above roughly 6.5 MB |
| 115 film TIFFs (104 MB each) | Out of reach for the same reason, and not web-ready |

To get the rest in: export them from Lightroom at 2400 px on the long edge, quality 80. They come out under 2 MB each and will download. The same fix applies to the Instagram post task.

**Your portrait** on the About page is `Profile.png` from the `Krause_Photography` repo, the same file the old site used. It is also the `image` on the Person entry in the structured data. The file has a small four-point sparkle mark in its bottom-right corner; the 4:5 crop on the page leaves it out of view, but it is still in the image file itself.

The graduation frames show identifiable people at a private event. Worth a quick check that they are happy to be on a business site.

## What only you can do, in order of payoff

1. **Google Business Profile.** For local searches this outweighs everything on the site. Primary category, service areas (hide the address if you work from home), services, photos and a link to the site. The checklist is in `guides/google-business-profile-checklist.html`.
2. **Search Console and Bing.** Submit the sitemap and run `indexnow.py`. A `site:maxkmedia.com` query through my search tool returned no pages from the domain. That tool is not Google, so read nothing firm into it, but check the Pages report in Search Console to see how much of the current site is indexed.
3. **Reviews.** Ask every client for a Google review. Five real ones change the map results more than fifty pages.
4. **Links from clients.** A "Website by Max K Media" footer link on each client site, pointing at the relevant case study, is the strongest link source you have.
5. **Real numbers in the case studies.** Enquiries before and after, rankings won, load times. One measured result per case study is worth more than any amount of description.
6. **Consistent listings.** Same name, phone and "Bathurst NSW 2795" on LinkedIn, Instagram, Facebook and any directory.
7. **More guides.** One a month, each answering a question a client asked you.

## Sources

- [Google drops FAQ rich results from Search (Search Engine Journal)](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/)
- [Optimizing your website for generative AI features on Google Search (Google Search Central)](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google's AI search guide and the Lighthouse llms.txt audit (TechWyse)](https://www.techwyse.com/news/ai-search/google-ai-search-optimization-guide-llms-txt-lighthouse-audit)
- [Structured data after I/O 2026 (Digital Applied)](https://www.digitalapplied.com/blog/structured-data-after-io-2026-schema-updates)
- [Image metadata in Google Images (Google Search Central)](https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata)
- [Using custom workflows with GitHub Pages (GitHub Docs)](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
