import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEY_ID = "B53WPHJTLN";
const ISSUER_ID = "e30fca41-01fd-4020-9b38-9bbde2b0ed44";
const KEY_FILE = path.join(process.env.USERPROFILE || "", "Downloads", "AuthKey_B53WPHJTLN.p8");

function makeJWT() {
  const key = fs.readFileSync(KEY_FILE, 'utf8');
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
  const signingInput = header + '.' + payload;
  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  const derSig = sign.sign({ key, dsaEncoding: 'ieee-p1363' });
  return signingInput + '.' + Buffer.from(derSig).toString('base64url');
}

async function api(endpoint, method = 'GET', body = null) {
  const token = makeJWT();
  const opts = { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1${endpoint}`, opts);
  const text = await res.text();
  try { const d = JSON.parse(text); if (!res.ok) { console.error(`  ✗ ${method} ${endpoint}:`, d.errors?.[0]?.detail || d.errors?.[0]?.title || text); return null; } return d; }
  catch { if (!res.ok) { console.error(`  ✗ ${res.status}`); return null; } return text; }
}

async function main() {
  // Find app
  const apps = await api(`/apps?filter[bundleId]=com.sbudate.app`);
  const appId = apps?.data?.[0]?.id;
  if (!appId) { console.error("App not found"); return; }
  console.log(`✓ App: ${appId}`);

  // Get app info
  const appInfos = await api(`/apps/${appId}/appInfos`);
  const appInfoId = appInfos?.data?.[0]?.id;
  console.log(`✓ AppInfo: ${appInfoId}`);

  // Set category
  if (appInfoId) {
    console.log("Setting category...");
    await api(`/appInfos/${appInfoId}`, 'PATCH', {
      data: { type: 'appInfos', id: appInfoId, relationships: { primaryCategory: { data: { type: 'appCategories', id: 'SOCIAL_NETWORKING' } } } }
    });
    console.log("✓ Category: Social Networking");
  }

  // Get version
  const versions = await api(`/apps/${appId}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION`);
  const versionId = versions?.data?.[0]?.id;
  console.log(`✓ Version: ${versionId}`);

  // Set copyright
  if (versionId) {
    console.log("Setting copyright...");
    await api(`/appStoreVersions/${versionId}`, 'PATCH', {
      data: { type: 'appStoreVersions', id: versionId, attributes: { copyright: '© 2026 Keugene Lee' } }
    });
    console.log("✓ Copyright set");
  }

  // Set localized metadata
  if (versionId) {
    const locs = await api(`/appStoreVersions/${versionId}/appStoreVersionLocalizations`);
    const locId = locs?.data?.find(l => l.attributes?.locale === 'en-US')?.id;
    if (locId) {
      console.log("Setting description/keywords...");
      await api(`/appStoreVersionLocalizations/${locId}`, 'PATCH', {
        data: { type: 'appStoreVersionLocalizations', id: locId, attributes: {
          description: "SBUdate is a dating app built exclusively for Stony Brook University students. Designed to help you meet real people on campus, not just swipe mindlessly.\n\nHOW IT WORKS\n\nBrowse profiles of verified SBU students. Like a specific photo or prompt that catches your eye. Leave a comment to stand out. When someone likes you back, you match and can start chatting.\n\nFEATURES\n\n- Prompt-based profiles: Answer fun prompts that show your personality beyond just photos\n- Specific likes: Like a particular photo or prompt answer, not just a whole profile\n- Forced engagement: To match, you have to actually respond — no silent likes\n- SBU verified: Only Stony Brook students\n- Clean, minimal design inspired by the apps you already love\n\nBUILT FOR SBU\n\nFilter by major, graduation year, residence hall, and more. Find someone in your dorm, your lecture, or across campus.\n\nDesigned to be deleted.",
          keywords: "dating,stony brook,sbu,college,university,students,match,campus,love",
          whatsNew: "Initial release of SBUdate — dating for Stony Brook University students.",
          promotionalText: "Dating exclusively for Stony Brook University students. Meet someone on campus today.",
          supportUrl: "https://sbudate.vercel.app/privacy",
        }}
      });
      console.log("✓ Metadata set");
    }
  }

  // Export compliance on build
  if (versionId) {
    const buildRel = await api(`/appStoreVersions/${versionId}/build`);
    const buildId = buildRel?.data?.id;
    if (buildId) {
      console.log("Setting export compliance...");
      await api(`/builds/${buildId}`, 'PATCH', {
        data: { type: 'builds', id: buildId, attributes: { usesNonExemptEncryption: false } }
      });
      console.log("✓ Export compliance: No encryption");
    }
  }

  // Set content rights on appInfo
  if (appInfoId) {
    // Try getting app info localizations for content rights
    const appInfoLocs = await api(`/appInfos/${appInfoId}/appInfoLocalizations`);
    const appInfoLocId = appInfoLocs?.data?.find(l => l.attributes?.locale === 'en-US')?.id;
    if (appInfoLocId) {
      console.log("Setting privacy/subtitle...");
      await api(`/appInfoLocalizations/${appInfoLocId}`, 'PATCH', {
        data: { type: 'appInfoLocalizations', id: appInfoLocId, attributes: {
          name: 'SBUdate',
          subtitle: 'Dating for SBU Students',
          privacyPolicyUrl: 'https://sbudate.vercel.app/privacy',
        }}
      });
      console.log("✓ App info localization set");
    }
  }

  console.log("\n=== DONE ===");
  console.log("Still manual (no API):");
  console.log("  - Contact info (name/email/phone)");
  console.log("  - App Privacy nutrition labels");
  console.log("  - Pricing → Free");
  console.log("  - Screenshots upload");
}

main().catch(console.error);
