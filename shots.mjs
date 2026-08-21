// Capture screenshots of the client sites for the work cards.
//
//   npm i -D playwright && npx playwright install chromium
//   node tools/shots.mjs
//
// Writes img/work/<slug>.jpg at 1440x900, which is roughly 2x the size the
// cards display at, so they stay sharp on a retina screen.
//
// The <slug> must match the filename in the card markup. If a capture fails,
// the card falls back to a clean panel showing the business name and domain —
// nothing breaks, so a partial run is safe.

import { chromium } from 'playwright';
import { mkdir, stat } from 'node:fs/promises';

const SITES = [
  ['rokiovertime',       'https://www.rokiovertime.com'],
  ['cme-detailing',      'https://cmedetailing.net'],
  ['nutraviva',          'https://www.nutraviva.com.au'],
  ['krause-photography', 'https://yherhr.github.io/Krause_Photography/'],
];

await mkdir('img/work', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  // some sites gate on a real UA
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
             '(KHTML, like Gecko) Chrome/126.0 Safari/537.36',
});

let ok = 0, failed = 0;

for (const [slug, url] of SITES) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

    // dismiss the usual cookie / newsletter interruptions so they don't end up
    // baked into the screenshot
    for (const label of [/accept/i, /agree/i, /got it/i, /close/i, /dismiss/i, /no thanks/i]) {
      const btn = page.getByRole('button', { name: label }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(400);
      }
    }

    // trigger lazy-loaded imagery, then return to the top for the capture
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);

    await page.screenshot({
      path: `img/work/${slug}.jpg`,
      type: 'jpeg',
      quality: 80,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });

    const { size } = await stat(`img/work/${slug}.jpg`);
    console.log(`  ok      ${slug.padEnd(20)} ${(size / 1024).toFixed(0)} KB`);
    ok++;
  } catch (err) {
    console.log(`  FAILED  ${slug.padEnd(20)} ${err.message.split('\n')[0]}`);
    failed++;
  } finally {
    await page.close();
  }
}

await browser.close();
console.log(`\n${ok} captured, ${failed} failed.`);
if (failed) console.log('Failed cards show a clean name/domain panel instead — safe to ship.');
