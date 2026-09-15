const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
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
  const srcFiles = getAllFiles(path.join(root, 'src'));
  const allAppCode = srcFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

  const mainJs = read('main.js');
  const preloadJs = read('preload.js');
  const firestoreRules = read('firestore.rules');
  const firebaseJson = JSON.parse(read('firebase.json'));

  if (packageJson.scripts['check:security'] !== 'node scripts/check-security.js') {
    throw new Error('package.json is missing the check:security script');
  }

  assertExcludes(allAppCode, 'LKMESSDEV2026', 'hardcoded developer master key');
  assertIncludes(allAppCode, 'const updateArchivePasscodeWithOwnerPin = useCallback(async () => {', 'owner PIN archive passcode updater');
  assertIncludes(allAppCode, 'await matchesSecret(cleanedOwnerPin, db.settings.ownerPinHash, PIN_LENGTH)', 'owner PIN verification');
  assertIncludes(allAppCode, 'function sanitizeImportedDb(rawDb) {', 'backup import sanitizer');
  assertIncludes(allAppCode, "if (file.size > 5 * 1024 * 1024)", 'backup file size limit');
  assertIncludes(allAppCode, 'const sanitizedImport = sanitizeImportedDb(parsed);', 'sanitized backup import');

  assertIncludes(mainJs, 'function isAllowedWhatsAppUrl(rawUrl) {', 'WhatsApp allowlist helper');
  assertIncludes(mainJs, "['web.whatsapp.com', 'api.whatsapp.com', 'wa.me'].includes(parsed.hostname)", 'WhatsApp hostname allowlist');
  assertIncludes(mainJs, "return { action: 'deny' };", 'deny-by-default window open handler');
  assertIncludes(mainJs, "mainWindow.webContents.on('will-navigate'", 'navigation guard');

  assertIncludes(preloadJs, "contextBridge.exposeInMainWorld('electronAPI'", 'context bridge usage');
  assertIncludes(allAppCode, "Owner access is required to delete this transaction.", 'owner-only transaction delete guard');
  assertIncludes(allAppCode, "Owner access is required to modify customers.", 'owner-only customer guard');
  assertIncludes(allAppCode, "Owner access is required to restore customers.", 'owner-only restore guard');
  assertIncludes(allAppCode, "Owner access is required to delete expenses.", 'owner-only expense guard');
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
