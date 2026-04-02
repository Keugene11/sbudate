import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'ios', 'App', 'fastlane', 'screenshots', 'en-US');

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
  });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f5f7; font-family: 'DM Sans', system-ui, sans-serif; width: 1024px; height: 1366px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .content { text-align: center; max-width: 600px; }
        h1 { font-size: 48px; font-weight: 800; color: #1a1a1a; line-height: 1.15; letter-spacing: -0.5px; margin-bottom: 16px; }
        p { font-size: 20px; color: #999; margin-bottom: 48px; }
        .cards { display: flex; gap: 16px; justify-content: center; }
        .card { background: white; border: 1px solid #efefef; border-radius: 16px; padding: 32px 24px 48px; width: 260px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); text-align: left; }
        .card .q { font-size: 14px; color: #737373; margin-bottom: 8px; }
        .card .a { font-size: 22px; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
      </style>
    </head>
    <body>
      <div class="content">
        <h1>Dating for<br>Stony Brook Students</h1>
        <p>Meet real people on campus, not just swipe mindlessly.</p>
        <div class="cards">
          <div class="card">
            <div class="q">My simple pleasures</div>
            <div class="a">Late night ramen runs and coding with lo-fi beats</div>
          </div>
          <div class="card">
            <div class="q">The way to win me over is</div>
            <div class="a">Make me laugh so hard I snort</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `, { waitUntil: 'networkidle' });

  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '06_ipad.png'), type: 'png' });
  console.log('✓ 06_ipad.png (2048x2732)');
  await browser.close();
}

generate();
