import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEY_ID = "B53WPHJTLN";
const ISSUER_ID = "e30fca41-01fd-4020-9b38-9bbde2b0ed44";
const KEY_FILE = path.join(process.env.USERPROFILE || "", "Downloads", "AuthKey_B53WPHJTLN.p8");
const LOC_ID = "6e3065f0-d9c6-4602-b9bc-90dc744a42d5";
const SCREENSHOT_DIR = path.join(import.meta.dirname, '..', 'ios', 'App', 'fastlane', 'screenshots', 'en-US');

const key = fs.readFileSync(KEY_FILE, 'utf8');

let token = null;
let tokenExp = 0;

function jwt() {
  const now = Math.floor(Date.now() / 1000);
  if (token && now < tokenExp - 60) return token;
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const exp = now + 1200;
  const p = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: now, exp, aud: 'appstoreconnect-v1' })).toString('base64url');
  const si = h + '.' + p;
  const s = crypto.createSign('SHA256'); s.update(si);
  token = si + '.' + Buffer.from(s.sign({ key, dsaEncoding: 'ieee-p1363' })).toString('base64url');
  tokenExp = exp;
  return token;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(endpoint, method = 'GET', body = null, raw = false) {
  const opts = { method, headers: { Authorization: 'Bearer ' + jwt(), 'Content-Type': 'application/json' } };
  if (body && !raw) opts.body = JSON.stringify(body);
  if (raw) { opts.body = body; opts.headers['Content-Type'] = raw; }
  const res = await fetch('https://api.appstoreconnect.apple.com/v1' + endpoint, opts);
  if (raw) return res;
  const d = await res.json();
  if (!res.ok) { console.error(`  ✗ ${method} ${endpoint}:`, d.errors?.[0]?.detail || JSON.stringify(d.errors)); return null; }
  return d;
}

const DISPLAY_TYPES = [
  { type: 'APP_IPHONE_67', files: ['01_discover.png', '02_prompts.png', '03_likes.png', '04_chat.png', '05_profile.png'] },
  { type: 'APP_IPHONE_65', files: ['07_65inch.png'] },
  { type: 'APP_IPAD_PRO_3GEN_129', files: ['06_ipad.png'] },
];

async function uploadScreenshot(setId, filePath, fileName) {
  const fileData = fs.readFileSync(filePath);
  const fileSize = fileData.length;
  const checksum = crypto.createHash('md5').update(fileData).digest('base64');

  // Step 1: Reserve
  console.log(`  Reserving ${fileName}...`);
  const reserve = await api('/appScreenshots', 'POST', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } }
    }
  });
  if (!reserve) return false;

  const screenshotId = reserve.data.id;
  const uploadOps = reserve.data.attributes.uploadOperations;

  // Step 2: Upload parts
  for (const op of uploadOps) {
    console.log(`  Uploading part (${op.length} bytes)...`);
    const chunk = fileData.subarray(op.offset, op.offset + op.length);
    const headers = {};
    for (const h of op.requestHeaders) headers[h.name] = h.value;
    const res = await fetch(op.url, { method: op.method, headers, body: chunk });
    if (!res.ok) { console.error(`  ✗ Upload failed: ${res.status}`); return false; }
  }

  // Step 3: Commit
  console.log(`  Committing...`);
  const commit = await api(`/appScreenshots/${screenshotId}`, 'PATCH', {
    data: {
      type: 'appScreenshots',
      id: screenshotId,
      attributes: { uploaded: true, sourceFileChecksum: checksum }
    }
  });
  return !!commit;
}

async function main() {
  for (const { type, files } of DISPLAY_TYPES) {
    console.log(`\nCreating screenshot set: ${type}`);
    const set = await api('/appScreenshotSets', 'POST', {
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: type },
        relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: LOC_ID } } }
      }
    });
    if (!set) { console.log(`  ✗ Failed to create set for ${type}`); continue; }
    const setId = set.data.id;
    console.log(`  Set ID: ${setId}`);

    for (const file of files) {
      const filePath = path.join(SCREENSHOT_DIR, file);
      if (!fs.existsSync(filePath)) { console.log(`  ✗ File not found: ${file}`); continue; }
      await sleep(1000);
      const ok = await uploadScreenshot(setId, filePath, file);
      console.log(`  ${file}: ${ok ? '✓' : '✗'}`);
    }
  }
  console.log('\nDone!');
}

main().catch(console.error);
