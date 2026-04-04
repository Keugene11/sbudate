import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const outDir = path.join(process.env.USERPROFILE || "", "Downloads", "sbudate-play");
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const browser = await chromium.launch();

  // 1. App icon 512x512
  console.log("Generating app icon...");
  let page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  await page.setContent(`
    <html><body style="margin:0;width:512px;height:512px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;">
      <div style="text-align:center;">
        <div style="font-size:120px;font-weight:800;color:white;letter-spacing:-4px;line-height:1;">S</div>
        <div style="font-size:28px;color:rgba(255,255,255,0.4);font-weight:600;margin-top:-5px;">SBUdate</div>
      </div>
    </body></html>
  `);
  await page.screenshot({ path: path.join(outDir, 'icon-512.png') });
  console.log("✓ icon-512.png");
  await page.close();

  // 2. Feature graphic 1024x500
  console.log("Generating feature graphic...");
  page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  await page.setContent(`
    <html><head>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;800&display=swap" rel="stylesheet">
    </head><body style="margin:0;width:1024px;height:500px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',system-ui,sans-serif;">
      <div style="text-align:center;">
        <div style="font-size:56px;font-weight:800;color:white;letter-spacing:-1px;line-height:1.15;">Dating for<br>Stony Brook Students</div>
        <div style="font-size:20px;color:rgba(255,255,255,0.45);font-weight:500;margin-top:16px;">Designed to be deleted.</div>
      </div>
    </body></html>
  `, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'feature-1024x500.png') });
  console.log("✓ feature-1024x500.png");
  await page.close();

  // 3. Phone screenshots (reuse existing ones — just copy)
  const screenshotDir = path.join(import.meta.dirname, '..', 'ios', 'App', 'fastlane', 'screenshots', 'en-US');
  for (const f of ['01_discover.png', '02_prompts.png', '03_likes.png', '04_chat.png', '05_profile.png']) {
    const src = path.join(screenshotDir, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(outDir, `phone_${f}`));
      console.log(`✓ phone_${f}`);
    }
  }

  // 4. 7-inch tablet screenshot (reuse iPad)
  const ipad = path.join(screenshotDir, '06_ipad.png');
  if (fs.existsSync(ipad)) {
    fs.copyFileSync(ipad, path.join(outDir, 'tablet_7inch.png'));
    console.log("✓ tablet_7inch.png");
  }

  // 5. 10-inch tablet screenshot — generate at 1200x1920
  console.log("Generating 10-inch tablet screenshot...");
  page = await browser.newPage({ viewport: { width: 1200, height: 1920 }, deviceScaleFactor: 1 });
  await page.setContent(`
    <html><head>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f5f7; font-family: 'DM Sans', system-ui, sans-serif; width: 1200px; height: 1920px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .content { text-align: center; max-width: 700px; }
        h1 { font-size: 56px; font-weight: 800; color: #1a1a1a; line-height: 1.15; margin-bottom: 12px; }
        p { font-size: 22px; color: #999; margin-bottom: 48px; }
        .cards { display: flex; gap: 20px; justify-content: center; }
        .card { background: white; border: 1px solid #efefef; border-radius: 20px; padding: 40px 28px 56px; width: 300px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); text-align: left; }
        .card .q { font-size: 16px; color: #737373; margin-bottom: 10px; }
        .card .a { font-size: 26px; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
      </style>
    </head><body>
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
    </body></html>
  `, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'tablet_10inch.png') });
  console.log("✓ tablet_10inch.png");
  await page.close();

  await browser.close();
  console.log(`\nAll files saved to: ${outDir}`);
}

main().catch(console.error);
