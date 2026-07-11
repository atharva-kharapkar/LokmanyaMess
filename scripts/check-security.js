const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertIncludes(content, snippet, label) {
  if (!content.includes(snippet)) {
    throw new Error(`Missing ${label}`);
  }
}

function assertExcludes(content, snippet, label) {
  if (content.includes(snippet)) {
    throw new Error(`Found forbidden ${label}`);
  }
}

try {
  const packageJson = JSON.parse(read('package.json'));
  const appJsx = read(path.join('src', 'App.jsx'));
  const mainJs = read('main.js');
  const preloadJs = read('preload.js');
  const firestoreRules = read('firestore.rules');
  const firebaseJson = JSON.parse(read('firebase.json'));

  if (packageJson.scripts['check:security'] !== 'node scripts/check-security.js') {
    throw new Error('package.json is missing the check:security script');
  }

  assertExcludes(appJsx, 'LKMESSDEV2026', 'hardcoded developer master key');
  assertIncludes(appJsx, 'const updateArchivePasscodeWithOwnerPin = useCallback(async () => {', 'owner PIN archive passcode updater');
  assertIncludes(appJsx, 'await matchesSecret(cleanedOwnerPin, db.settings.ownerPinHash, PIN_LENGTH)', 'owner PIN verification');
  assertIncludes(appJsx, 'function sanitizeImportedDb(rawDb) {', 'backup import sanitizer');
  assertIncludes(appJsx, "if (file.size > 5 * 1024 * 1024)", 'backup file size limit');
  assertIncludes(appJsx, 'const sanitizedImport = sanitizeImportedDb(parsed);', 'sanitized backup import');

  assertIncludes(mainJs, 'function isAllowedWhatsAppUrl(rawUrl) {', 'WhatsApp allowlist helper');
  assertIncludes(mainJs, "['web.whatsapp.com', 'api.whatsapp.com', 'wa.me'].includes(parsed.hostname)", 'WhatsApp hostname allowlist');
  assertIncludes(mainJs, "return { action: 'deny' };", 'deny-by-default window open handler');
  assertIncludes(mainJs, "mainWindow.webContents.on('will-navigate'", 'navigation guard');

  assertIncludes(preloadJs, "contextBridge.exposeInMainWorld('electronAPI'", 'context bridge usage');
  assertIncludes(appJsx, "Owner access is required to delete this transaction.", 'owner-only transaction delete guard');
  assertIncludes(appJsx, "Owner access is required to modify customers.", 'owner-only customer guard');
  assertIncludes(appJsx, "Owner access is required to restore customers.", 'owner-only restore guard');
  assertIncludes(appJsx, "Owner access is required to delete expenses.", 'owner-only expense guard');
  assertIncludes(firestoreRules, "allow read, write: if false;", 'deny-by-default Firestore rules');
  assertIncludes(firestoreRules, "match /desktop_customers/{docId}", 'customers rules block');
  if (firebaseJson.firestore?.rules !== 'firestore.rules') {
    throw new Error('firebase.json does not point Firestore at firestore.rules');
  }

  console.log('Security checks passed.');
  process.exit(0);
} catch (error) {
  console.error('Security check failed:', error.message);
  process.exit(2);
}
