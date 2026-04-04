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

const token = jwt();
const r = await fetch('https://api.appstoreconnect.apple.com/v1/appPriceSchedules', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: {
      type: 'appPriceSchedules',
      relationships: {
        app: { data: { type: 'apps', id: '6761519244' } },
        baseTerritory: { data: { type: 'territories', id: 'USA' } },
        manualPrices: { data: [{ type: 'appPrices', id: '${price1}' }] }
      }
    },
    included: [{
      type: 'appPrices',
      id: '${price1}',
      attributes: { startDate: null },
      relationships: {
        appPricePoint: { data: null }
      }
    }]
  })
});
const d = await r.json();
console.log('Pricing:', r.status, d.data ? '✓ FREE' : JSON.stringify(d.errors?.[0]));
