// npm run cover: the itch.io cover image (630x500) from one of the store screenshots, with the
// title over it. Usage: npm run cover -- [screenshot name, default 4-fire-night]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Playwright is not a dependency of the game; use whichever copy this machine has.
const { chromium } = createRequire(import.meta.url)('playwright');
const root = fileURLToPath(new URL('../../', import.meta.url));
const shot = process.argv[2] ?? '4-fire-night';
const bg = readFileSync(`${root}docs/store/screenshots/${shot}.png`).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 630, height: 500 } });
await page.setContent(`<style>
  html, body { margin: 0; width: 630px; height: 500px; overflow: hidden; background: #000; }
  .bg { position: absolute; inset: 0; background: url(data:image/png;base64,${bg}) center / cover; }
  .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5,8,14,0.78) 0%, rgba(5,8,14,0.15) 42%, rgba(5,8,14,0) 60%, rgba(5,8,14,0.7) 100%); }
  h1 { position: absolute; top: 46px; width: 100%; margin: 0; text-align: center; color: #ece5d2;
       font: 400 84px Georgia, 'Times New Roman', serif; letter-spacing: 0.1em; text-shadow: 0 2px 18px rgba(0,0,0,0.6); }
  p { position: absolute; bottom: 30px; width: 100%; margin: 0; text-align: center; color: #ece5d2;
      font: 400 21px 'Segoe UI', system-ui, sans-serif; letter-spacing: 0.06em; opacity: 0.92; }
</style><div class="bg"></div><div class="shade"></div><h1>TAP / OUT</h1><p>Outlast nine strangers, and the North.</p>`);
await page.screenshot({ path: `${root}docs/store/cover-630x500.png` });
await browser.close();
console.log('docs/store/cover-630x500.png from', shot);
