// npm run icon: draws scripts/icon/icon.svg at each Windows icon size with the pre-installed
// Chromium and writes apps/desktop/build/icon.ico, icon.png and the web build's favicon.
// No other tools needed: an .ico is a small header plus PNG images.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Playwright is not a dependency of the game; use whichever copy this machine has.
const { chromium } = createRequire(import.meta.url)('playwright');
const root = fileURLToPath(new URL('../../', import.meta.url));
const svg = readFileSync(`${root}scripts/icon/icon.svg`, 'utf8');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

const browser = await chromium.launch();
const page = await browser.newPage();
const png = async (size) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
};
const images = [];
for (const size of SIZES) images.push(await png(size));
const big = await png(512);
await browser.close();

const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((img, i) => {
  const e = 6 + 16 * i;
  const s = SIZES[i] >= 256 ? 0 : SIZES[i];
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(img.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
mkdirSync(`${root}apps/desktop/build`, { recursive: true });
writeFileSync(`${root}apps/desktop/build/icon.ico`, Buffer.concat([header, ...images]));
writeFileSync(`${root}apps/desktop/build/icon.png`, big);
writeFileSync(`${root}apps/game/public/favicon.png`, images[SIZES.indexOf(64)]);
console.log('icon.ico', SIZES.join(', '), '+ icon.png 512 + favicon.png 64');
