// Generate poster screenshots for the client-site cards.
//
//   npm i -D playwright && npx playwright install chromium
//   node tools/shots.mjs
//
// Writes img/work/<slug>.jpg. The cards pick these up automatically — a
// missing file removes itself, so partial runs never leave a broken image.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

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
});

for (const [slug, url] of SITES) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2500);
    // settle lazy-loaded imagery, then return to the top for the poster
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `img/work/${slug}.jpg`,
      type: 'jpeg',
      quality: 78,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });
    console.log(`ok      ${slug}`);
  } catch (err) {
    console.log(`failed  ${slug}  ${err.message.split('\n')[0]}`);
  } finally {
    await page.close();
  }
}

await browser.close();
