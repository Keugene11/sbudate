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
  // Step 1: Create edit
  const { data: edit } = await play.edits.insert({ packageName: PACKAGE_NAME });
  const editId = edit.id;
  console.log('Edit:', editId);

  // Step 2: Update listing text
  try {
    await play.edits.listings.update({
      packageName: PACKAGE_NAME, editId, language: 'en-US',
      requestBody: {
        language: 'en-US',
        title: 'SBUdate',
        shortDescription: 'Dating exclusively for Stony Brook University students.',
        fullDescription: 'SBUdate is a dating app built exclusively for Stony Brook University students. Designed to help you meet real people on campus, not just swipe mindlessly.\n\nHOW IT WORKS\nBrowse profiles of verified SBU students. Like a specific photo or prompt that catches your eye. Leave a comment to stand out. When someone likes you back, you match and can start chatting.\n\nFEATURES\n\u2022 Prompt-based profiles that show your personality beyond just photos\n\u2022 Like specific photos or prompt answers, not just a whole profile\n\u2022 Forced engagement \u2014 you have to respond to match\n\u2022 SBU verified students only\n\u2022 Clean, minimal design\n\nBUILT FOR SBU\nFilter by major, graduation year, residence hall, and more. Find someone in your dorm, your lecture, or across campus.\n\nDesigned to be deleted.',
      },
    });
    console.log('✓ Listing text');
  } catch (e) { console.log('✗ Listing:', e.message); }

  // Step 3: Upload all images
  const uploads = [
    ['icon', 'icon-512.png'],
    ['featureGraphic', 'feature-1024x500.png'],
    ['phoneScreenshots', 'phone_01_discover.png'],
    ['phoneScreenshots', 'phone_02_prompts.png'],
    ['phoneScreenshots', 'phone_03_likes.png'],
    ['phoneScreenshots', 'phone_04_chat.png'],
    ['phoneScreenshots', 'phone_05_profile.png'],
    ['sevenInchScreenshots', 'tablet_7inch.png'],
    ['tenInchScreenshots', 'tablet_10inch.png'],
  ];

  for (const [imageType, fileName] of uploads) {
    const filePath = path.join(GRAPHICS_DIR, fileName);
    if (!fs.existsSync(filePath)) { console.log(`✗ ${fileName} missing`); continue; }
    try {
      await play.edits.images.upload({
        packageName: PACKAGE_NAME, editId, language: 'en-US', imageType,
        media: { mimeType: 'image/png', body: fs.createReadStream(filePath) },
      });
      console.log(`✓ ${fileName}`);
    } catch (e) { console.log(`✗ ${fileName}: ${e.message}`); }
  }

  // Step 4: Commit — try multiple approaches
  console.log('\nCommitting...');

  // First try: normal commit
  try {
    await play.edits.commit({ packageName: PACKAGE_NAME, editId });
    console.log('✓ Committed successfully!');
    return;
  } catch (e) {
    console.log('Normal commit failed:', e.message);
  }

  // Second try: create a draft release on internal track then commit
  try {
    console.log('Trying with draft internal release...');
    // Get the latest version code from the internal track
    const { data: track } = await play.edits.tracks.get({ packageName: PACKAGE_NAME, editId, track: 'internal' });
    const versionCode = track.releases?.[0]?.versionCodes?.[0];
    console.log('Version code:', versionCode);

    if (versionCode) {
      await play.edits.tracks.update({
        packageName: PACKAGE_NAME, editId, track: 'internal',
        requestBody: {
          track: 'internal',
          releases: [{ status: 'draft', versionCodes: [versionCode] }],
        },
      });
      console.log('✓ Set internal track to draft');
    }

    await play.edits.commit({ packageName: PACKAGE_NAME, editId });
    console.log('✓ Committed with draft release!');
    return;
  } catch (e) {
    console.log('Draft commit failed:', e.message);
  }

  // Third try: just validate to see what's wrong
  try {
    await play.edits.validate({ packageName: PACKAGE_NAME, editId });
    console.log('Validation passed');
  } catch (e) {
    console.log('Validation errors:', e.message);
    if (e.errors) console.log(JSON.stringify(e.errors, null, 2));
  }
}

main().catch(e => console.error('Fatal:', e.message));
