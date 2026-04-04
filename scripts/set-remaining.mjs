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

async function api(endpoint, method = 'GET', body = null) {
  const opts = { method, headers: { Authorization: 'Bearer ' + jwt(), 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('https://api.appstoreconnect.apple.com' + endpoint, opts);
  const d = await res.json();
  return { status: res.status, ok: res.ok, data: d };
}

async function main() {
  // 1. Try setting availability (which includes pricing) to all territories
  console.log("Setting availability to all territories...");
  let r = await api('/v2/apps/6761519244/appAvailabilities', 'POST', {
    data: {
      type: 'appAvailabilities',
      attributes: { availableInNewTerritories: true },
      relationships: {
        app: { data: { type: 'apps', id: '6761519244' } },
        availableTerritories: { data: [{ type: 'territories', id: 'USA' }] }
      }
    }
  });
  console.log('Availability:', r.status, r.ok ? '✓' : r.data.errors?.[0]?.detail);

  // 2. Try getting all review submission info
  console.log("\nChecking what's still needed...");
  r = await api('/v1/appStoreVersions/9db92e70-17e6-41ea-98ba-13e65ad1830d?include=appStoreReviewDetail');
  if (r.ok) {
    const reviewDetail = r.data.included?.find(i => i.type === 'appStoreReviewDetails');
    console.log('Review detail exists:', !!reviewDetail);

    if (!reviewDetail) {
      // Create review detail with contact info
      console.log("Creating review detail with contact info...");
      r = await api('/v1/appStoreReviewDetails', 'POST', {
        data: {
          type: 'appStoreReviewDetails',
          attributes: {
            contactFirstName: 'Keugene',
            contactLastName: 'Lee',
            contactEmail: 'keugenelee11@gmail.com',
            contactPhone: '+1234567890',
            demoAccountName: '',
            demoAccountPassword: '',
            demoAccountRequired: false,
            notes: 'SBUdate is a dating app for Stony Brook University students. Users sign in with Google OAuth via Supabase Auth.'
          },
          relationships: {
            appStoreVersion: { data: { type: 'appStoreVersions', id: '9db92e70-17e6-41ea-98ba-13e65ad1830d' } }
          }
        }
      });
      console.log('Review detail:', r.status, r.ok ? '✓' : r.data.errors?.[0]?.detail);
    }
  }
}

main().catch(console.error);
