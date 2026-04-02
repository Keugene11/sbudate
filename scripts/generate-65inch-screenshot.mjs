import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'ios', 'App', 'fastlane', 'screenshots', 'en-US');

async function generate() {
  const browser = await chromium.launch();
  // 6.5" = 414x896 at 3x = 1242x2688
  const page = await browser.newPage({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 3,
  });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f5f7; font-family: 'DM Sans', system-ui, sans-serif; width: 414px; height: 896px; overflow: hidden; }
        .header { padding: 80px 24px 24px; text-align: center; }
        .header h1 { font-size: 32px; font-weight: 800; color: #1a1a1a; line-height: 1.15; letter-spacing: -0.5px; margin-bottom: 8px; }
        .header p { font-size: 15px; color: #999; }
        .card { background: white; border: 1px solid #efefef; border-radius: 16px; padding: 36px 24px 48px; margin: 0 24px 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .card .q { font-size: 15px; color: #737373; margin-bottom: 10px; }
        .card .a { font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
        .nav { position: absolute; bottom: 0; left: 0; right: 0; height: 56px; background: #1a1a1a; display: flex; align-items: center; justify-content: space-around; padding: 0 20px; }
        .nav-icon { width: 24px; height: 24px; border-radius: 4px; background: rgba(255,255,255,0.9); }
        .nav-dot { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.2); }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Find your person<br>at Stony Brook</h1>
        <p>Browse profiles of real SBU students</p>
      </div>
      <div class="card">
        <div class="q">My simple pleasures</div>
        <div class="a">Late night ramen runs, coding with lo-fi beats, and finding the perfect sunset spot on campus</div>
      </div>
      <div class="card">
        <div class="q">The way to win me over is</div>
        <div class="a">Make me laugh so hard I snort</div>
      </div>
      <div class="nav">
        <div class="nav-icon"></div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <div class="nav-dot"></div>
      </div>
    </body>
    </html>
  `, { waitUntil: 'networkidle' });

  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '07_65inch.png'), type: 'png' });
  console.log('✓ 07_65inch.png (1242x2688)');
  await browser.close();
}

generate();
