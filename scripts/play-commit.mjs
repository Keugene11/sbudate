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
  console.log('Creating edit...');
  const { data: edit } = await play.edits.insert({ packageName: PACKAGE_NAME });
  const editId = edit.id;
  console.log(`✓ Edit ID: ${editId}`);

  // Set listing
  console.log('Setting store listing...');
  await play.edits.listings.update({
    packageName: PACKAGE_NAME,
    editId,
    language: 'en-US',
    requestBody: {
      title: 'SBUdate',
      shortDescription: 'Dating exclusively for Stony Brook University students.',
      fullDescription: `SBUdate is a dating app built exclusively for Stony Brook University students. Designed to help you meet real people on campus, not just swipe mindlessly.\n\nHOW IT WORKS\nBrowse profiles of verified SBU students. Like a specific photo or prompt that catches your eye. Leave a comment to stand out. When someone likes you back, you match and can start chatting.\n\nFEATURES\n• Prompt-based profiles that show your personality beyond just photos\n• Like specific photos or prompt answers, not just a whole profile\n• Forced engagement — you have to respond to match\n• SBU verified students only\n• Clean, minimal design\n\nBUILT FOR SBU\nFilter by major, graduation year, residence hall, and more. Find someone in your dorm, your lecture, or across campus.\n\nDesigned to be deleted.`,
      language: 'en-US',
    },
  });
  console.log('✓ Listing set');

  // Upload images
  const images = [
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

  for (const img of images) {
    const filePath = path.join(GRAPHICS_DIR, img.file);
    if (!fs.existsSync(filePath)) continue;
    try {
      await play.edits.images.upload({
        packageName: PACKAGE_NAME, editId, language: 'en-US', imageType: img.type,
        media: { mimeType: 'image/png', body: fs.createReadStream(filePath) },
      });
      console.log(`✓ ${img.file}`);
    } catch (e) { console.log(`✗ ${img.file}: ${e.message}`); }
  }

  // Create a draft internal track release with the existing AAB
  console.log('Getting existing tracks...');
  try {
    const { data: tracks } = await play.edits.tracks.list({ packageName: PACKAGE_NAME, editId });
    console.log('Tracks:', tracks.tracks?.map(t => `${t.track}: ${t.releases?.[0]?.status}`));
  } catch (e) { console.log('Tracks error:', e.message); }

  // Try to commit as draft
  console.log('Committing as draft...');
  try {
    await play.edits.commit({ packageName: PACKAGE_NAME, editId, changesNotSentForReview: true });
    console.log('✓ Committed!');
  } catch (e) {
    console.log('Commit error:', e.message);
    // Try validate instead
    console.log('Trying validate...');
    try {
      await play.edits.validate({ packageName: PACKAGE_NAME, editId });
      console.log('✓ Validated');
      await play.edits.commit({ packageName: PACKAGE_NAME, editId });
      console.log('✓ Committed!');
    } catch (e2) {
      console.log('Validate error:', e2.message);
    }
  }
}

main().catch(e => console.error('Fatal:', e.message));
