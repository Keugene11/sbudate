import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const PACKAGE_NAME = 'com.sbudate.app';
const SA_KEY = path.join(process.env.USERPROFILE || '', 'Downloads', 'voicenote-pro-484818-6d6db67c7fdb.json');
const GRAPHICS_DIR = path.join(process.env.USERPROFILE || '', 'Downloads', 'sbudate-play');

const auth = new google.auth.GoogleAuth({
  keyFile: SA_KEY,
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

const play = google.androidpublisher({ version: 'v3', auth });

async function main() {
  // Create an edit
  console.log('Creating edit...');
  const { data: edit } = await play.edits.insert({ packageName: PACKAGE_NAME });
  const editId = edit.id;
  console.log(`✓ Edit ID: ${editId}`);

  // Set store listing
  console.log('Setting store listing...');
  await play.edits.listings.update({
    packageName: PACKAGE_NAME,
    editId,
    language: 'en-US',
    requestBody: {
      title: 'SBUdate',
      shortDescription: 'Dating exclusively for Stony Brook University students.',
      fullDescription: `SBUdate is a dating app built exclusively for Stony Brook University students. Designed to help you meet real people on campus, not just swipe mindlessly.

HOW IT WORKS
Browse profiles of verified SBU students. Like a specific photo or prompt that catches your eye. Leave a comment to stand out. When someone likes you back, you match and can start chatting.

FEATURES
• Prompt-based profiles that show your personality beyond just photos
• Like specific photos or prompt answers, not just a whole profile
• Forced engagement — you have to respond to match
• SBU verified students only
• Clean, minimal design

BUILT FOR SBU
Filter by major, graduation year, residence hall, and more. Find someone in your dorm, your lecture, or across campus.

Designed to be deleted.`,
      language: 'en-US',
    },
  });
  console.log('✓ Store listing set');

  // Upload images
  const imageTypes = [
    { type: 'icon', file: 'icon-512.png' },
    { type: 'featureGraphic', file: 'feature-1024x500.png' },
    { type: 'phoneScreenshots', file: 'phone_01_discover.png' },
    { type: 'phoneScreenshots', file: 'phone_02_prompts.png' },
    { type: 'phoneScreenshots', file: 'phone_03_likes.png' },
    { type: 'phoneScreenshots', file: 'phone_04_chat.png' },
    { type: 'phoneScreenshots', file: 'phone_05_profile.png' },
    { type: 'sevenInchScreenshots', file: 'tablet_7inch.png' },
    { type: 'tenInchScreenshots', file: 'tablet_10inch.png' },
  ];

  for (const img of imageTypes) {
    const filePath = path.join(GRAPHICS_DIR, img.file);
    if (!fs.existsSync(filePath)) { console.log(`  ✗ ${img.file} not found`); continue; }
    console.log(`  Uploading ${img.file} as ${img.type}...`);
    try {
      await play.edits.images.upload({
        packageName: PACKAGE_NAME,
        editId,
        language: 'en-US',
        imageType: img.type,
        media: {
          mimeType: 'image/png',
          body: fs.createReadStream(filePath),
        },
      });
      console.log(`  ✓ ${img.file}`);
    } catch (e) {
      console.log(`  ✗ ${img.file}: ${e.message}`);
    }
  }

  // Commit the edit
  console.log('Committing edit...');
  await play.edits.commit({ packageName: PACKAGE_NAME, editId });
  console.log('✓ All done! Store listing published.');
}

main().catch(e => {
  console.error('Error:', e.message);
  if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
});
