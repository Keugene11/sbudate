import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const PROJECT = 'C:/Users/Daniel/Projects/sbudate';
const IOS_DIR = join(PROJECT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
const ANDROID_RES = join(PROJECT, 'android/app/src/main/res');

// Heart SVG path - smooth modern vector heart
const HEART_SVG = `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <path d="M256 448l-30.164-27.211C118.718 322.927 48 258.373 48 179.612 48 114.612 99.974 64 164.5 64c36.491 0 71.525 17.087 91.5 43.937C276.475 81.087 311.509 64 348 64 412.526 64 464 114.612 464 179.612c0 78.761-70.718 143.315-177.836 241.177L256 448z" fill="white"/>
</svg>`;

// HTML for the full icon (dark bg + white heart)
function fullIconHTML(size) {
  return `<!DOCTYPE html>
<html><head><style>
* { margin: 0; padding: 0; }
body {
  width: ${size}px;
  height: ${size}px;
  background: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
}
.heart {
  width: ${Math.round(size * 0.58)}px;
  height: ${Math.round(size * 0.58)}px;
}
</style></head><body>
  <div class="heart">${HEART_SVG}</div>
</body></html>`;
}

// HTML for foreground only (transparent bg + white heart, with adaptive icon safe zone padding)
function foregroundHTML(size) {
  // Adaptive icons have ~66% safe zone in center, so heart should be smaller
  const heartSize = Math.round(size * 0.38);
  return `<!DOCTYPE html>
<html><head><style>
* { margin: 0; padding: 0; }
body {
  width: ${size}px;
  height: ${size}px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.heart {
  width: ${heartSize}px;
  height: ${heartSize}px;
}
</style></head><body>
  <div class="heart">${HEART_SVG}</div>
</body></html>`;
}

async function screenshot(page, html, size, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outPath, type: 'png', omitBackground: html.includes('transparent') });
  const label = outPath.replace(/\\/g, '/').split('sbudate/')[1] || outPath;
  console.log(`  ${label} (${size}x${size})`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Generating iOS icons...');
  await screenshot(page, fullIconHTML(1024), 1024, join(IOS_DIR, 'AppIcon-512@2x.png'));

  console.log('Generating Android launcher icons...');
  const androidSizes = [
    ['mipmap-mdpi', 48],
    ['mipmap-hdpi', 72],
    ['mipmap-xhdpi', 96],
    ['mipmap-xxhdpi', 144],
    ['mipmap-xxxhdpi', 192],
  ];

  for (const [folder, size] of androidSizes) {
    await screenshot(page, fullIconHTML(size), size, join(ANDROID_RES, folder, 'ic_launcher.png'));
    await screenshot(page, fullIconHTML(size), size, join(ANDROID_RES, folder, 'ic_launcher_round.png'));
  }

  console.log('Generating Android foreground icons...');
  const fgSizes = [
    ['mipmap-mdpi', 108],
    ['mipmap-hdpi', 162],
    ['mipmap-xhdpi', 216],
    ['mipmap-xxhdpi', 324],
    ['mipmap-xxxhdpi', 432],
  ];

  for (const [folder, size] of fgSizes) {
    await screenshot(page, foregroundHTML(size), size, join(ANDROID_RES, folder, 'ic_launcher_foreground.png'));
  }

  await browser.close();
  console.log('Done! All icons generated.');
}

main().catch(err => { console.error(err); process.exit(1); });
