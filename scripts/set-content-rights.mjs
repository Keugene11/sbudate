import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEY_FILE = path.join(process.env.USERPROFILE || "", "Downloads", "AuthKey_B53WPHJTLN.p8");
const key = fs.readFileSync(KEY_FILE, 'utf8');

function jwt() {
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: 'B53WPHJTLN', typ: 'JWT' })).toString('base64url');
  const n = Math.floor(Date.now() / 1000);
  const p = Buffer.from(JSON.stringify({ iss: 'e30fca41-01fd-4020-9b38-9bbde2b0ed44', iat: n, exp: n + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
  const si = h + '.' + p;
  const s = crypto.createSign('SHA256'); s.update(si);
  return si + '.' + Buffer.from(s.sign({ key, dsaEncoding: 'ieee-p1363' })).toString('base64url');
}

// Mark as does not use third-party content
const r = await fetch('https://api.appstoreconnect.apple.com/v1/appStoreVersions/9db92e70-17e6-41ea-98ba-13e65ad1830d', {
  method: 'PATCH',
  headers: { Authorization: 'Bearer ' + jwt(), 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      type: 'appStoreVersions',
      id: '9db92e70-17e6-41ea-98ba-13e65ad1830d',
      attributes: {
        usesIdfa: false,
      }
    }
  })
});
const d = await r.json();
console.log('Version update:', r.status, d.data ? '✓' : JSON.stringify(d.errors?.[0]?.detail));
