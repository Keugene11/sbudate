import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'ios', 'App', 'fastlane', 'screenshots', 'en-US');

// iPhone 6.7" dimensions at 3x = 1290x2796, but we render at 430x932 (logical) and scale 3x
const WIDTH = 430;
const HEIGHT = 932;
const SCALE = 3;

const screens = [
  {
    name: '01_discover',
    title: 'Find your person\nat Stony Brook',
    subtitle: 'Browse profiles of real SBU students',
    html: `
      <div style="padding: 60px 24px 0; font-family: 'DM Sans', system-ui, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 20px; font-weight: 600; color: #1a1a1a;">Sarah</span>
          <div style="display: flex; gap: 6px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #999;">✕</div>
            <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #1a1a1a;">•••</div>
          </div>
        </div>
        <div style="width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, #f0e6ff 0%, #ffe6f0 50%, #e6f0ff 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; position: relative;">
          <span style="font-size: 64px;">👩‍🎓</span>
          <div style="position: absolute; bottom: 16px; right: 16px; width: 48px; height: 48px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
            <span style="font-size: 22px;">🤍</span>
          </div>
        </div>
      </div>
    `,
  },
  {
    name: '02_prompts',
    title: 'Show your\npersonality',
    subtitle: 'Answer fun prompts that go beyond photos',
    html: `
      <div style="padding: 60px 24px 0; font-family: 'DM Sans', system-ui, sans-serif;">
        <div style="background: white; border: 1px solid #efefef; border-radius: 16px; padding: 40px 24px 56px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 16px;">
          <p style="font-size: 15px; color: #737373; margin: 0 0 12px;">My simple pleasures</p>
          <p style="font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.3; margin: 0;">Late night ramen runs, coding with lo-fi beats, and finding the perfect sunset spot on campus</p>
        </div>
        <div style="background: white; border: 1px solid #efefef; border-radius: 16px; padding: 40px 24px 56px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
          <p style="font-size: 15px; color: #737373; margin: 0 0 12px;">The way to win me over is</p>
          <p style="font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.3; margin: 0;">Make me laugh so hard I snort, then pretend you didn't hear it</p>
        </div>
      </div>
    `,
  },
  {
    name: '03_likes',
    title: 'See who\nlikes you',
    subtitle: 'Respond to what they liked about your profile',
    html: `
      <div style="padding: 60px 24px 0; font-family: 'DM Sans', system-ui, sans-serif;">
        <h1 style="font-size: 26px; font-weight: 600; color: #1a1a1a; margin: 0 0 4px;">Likes You</h1>
        <p style="font-size: 13px; color: #999; margin: 0 0 16px;">3 people liked you</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          ${[
            { name: 'Emily, 20', emoji: '👩‍💻', bg: '#ffe6f0' },
            { name: 'Alex, 21', emoji: '🧑‍🎨', bg: '#e6f0ff' },
            { name: 'Priya, 19', emoji: '👩‍🔬', bg: '#f0ffe6' },
            { name: 'Mike, 22', emoji: '🧑‍💼', bg: '#fff0e6' },
          ].map(p => `
            <div style="aspect-ratio: 1; background: ${p.bg}; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
              <span style="font-size: 48px; margin-bottom: 8px;">${p.emoji}</span>
              <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 14px; background: linear-gradient(transparent, rgba(0,0,0,0.4)); border-radius: 0 0 16px 16px;">
                <span style="color: white; font-size: 16px; font-weight: 600;">${p.name}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `,
  },
  {
    name: '04_chat',
    title: 'Start real\nconversations',
    subtitle: 'Chat with your matches and plan to meet up',
    html: `
      <div style="padding: 60px 24px 0; font-family: 'DM Sans', system-ui, sans-serif;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #efefef;">
          <div style="width: 40px; height: 40px; background: #ffe6f0; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><span style="font-size: 20px;">👩‍🎓</span></div>
          <span style="font-size: 17px; font-weight: 600; color: #1a1a1a;">Emily</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="align-self: flex-start; background: #f0f0f0; border-radius: 18px 18px 18px 6px; padding: 12px 16px; max-width: 75%;">
            <p style="margin: 0; font-size: 15px; color: #1a1a1a;">omg your prompt about ramen runs 😭 where do you go??</p>
          </div>
          <div style="align-self: flex-end; background: #1a1a1a; border-radius: 18px 18px 6px 18px; padding: 12px 16px; max-width: 75%;">
            <p style="margin: 0; font-size: 15px; color: white;">Haha have you tried the spot near Roth?? Its so good at 2am</p>
          </div>
          <div style="align-self: flex-start; background: #f0f0f0; border-radius: 18px 18px 18px 6px; padding: 12px 16px; max-width: 75%;">
            <p style="margin: 0; font-size: 15px; color: #1a1a1a;">no way we should go together sometime!</p>
          </div>
          <div style="align-self: flex-end; background: #1a1a1a; border-radius: 18px 18px 6px 18px; padding: 12px 16px; max-width: 75%;">
            <p style="margin: 0; font-size: 15px; color: white;">I'm down! This week?</p>
          </div>
        </div>
      </div>
    `,
  },
  {
    name: '05_profile',
    title: 'Built for\nStony Brook',
    subtitle: 'Filter by major, dorm, grad year, and more',
    html: `
      <div style="padding: 60px 24px 0; font-family: 'DM Sans', system-ui, sans-serif;">
        <div style="background: white; border: 1px solid #efefef; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
          <div style="display: flex; align-items: center; padding: 0 4px; overflow: hidden;">
            ${[
              { icon: '🎂', label: '21' },
              { icon: '👤', label: 'Woman' },
              { icon: '📏', label: "5'4\"" },
              { icon: '🎓', label: 'Class of 2027' },
            ].map((p, i, a) => `
              <div style="display: flex; align-items: center; gap: 8px; padding: 14px 16px; flex-shrink: 0;">
                <span style="font-size: 16px;">${p.icon}</span>
                <span style="font-size: 15px; color: #1a1a1a; white-space: nowrap;">${p.label}</span>
              </div>
              ${i < a.length - 1 ? '<div style="width: 1px; height: 20px; background: #e5e5e5; flex-shrink: 0;"></div>' : ''}
            `).join('')}
          </div>
          ${[
            { icon: '💼', label: 'Computer Science' },
            { icon: '🏠', label: 'Greeley Hall' },
            { icon: '📍', label: 'Queens, NY' },
          ].map(p => `
            <div style="border-top: 1px solid #f0f0f0; display: flex; align-items: center; gap: 14px; padding: 14px 20px;">
              <span style="font-size: 16px;">${p.icon}</span>
              <span style="font-size: 15px; color: #1a1a1a;">${p.label}</span>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 16px; background: #1a1a1a; border-radius: 16px; padding: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center;">
            <p style="font-size: 13px; color: rgba(255,255,255,0.5); margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.08em;">Exclusively for</p>
            <p style="font-size: 22px; font-weight: 700; color: white; margin: 0;">Stony Brook University</p>
          </div>
        </div>
      </div>
    `,
  },
];

async function generateScreenshots() {
  const browser = await chromium.launch();

  for (const screen of screens) {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: SCALE,
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #f5f5f7;
          font-family: 'DM Sans', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          width: ${WIDTH}px;
          height: ${HEIGHT}px;
          overflow: hidden;
        }
        .header {
          padding: 80px 24px 24px;
          text-align: center;
        }
        .header h1 {
          font-size: 34px;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.15;
          letter-spacing: -0.5px;
          white-space: pre-line;
          margin-bottom: 8px;
        }
        .header p {
          font-size: 16px;
          color: #999;
        }
        .nav {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: #1a1a1a;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 20px;
        }
        .nav-icon {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: rgba(255,255,255,0.2);
        }
        .nav-icon.active {
          background: rgba(255,255,255,0.9);
        }
        .nav-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${screen.title}</h1>
        <p>${screen.subtitle}</p>
      </div>
      ${screen.html}
      <div class="nav">
        <div class="nav-icon ${screen.name.includes('discover') ? 'active' : ''}"></div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <div class="nav-dot"></div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500); // wait for fonts

    const filePath = path.join(outDir, `${screen.name}.png`);
    await page.screenshot({ path: filePath, type: 'png' });
    console.log(`✓ ${screen.name}.png (${WIDTH * SCALE}x${HEIGHT * SCALE})`);
    await page.close();
  }

  await browser.close();
  console.log(`\nDone! ${screens.length} screenshots saved to ${outDir}`);
}

generateScreenshots();
