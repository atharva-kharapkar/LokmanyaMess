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

try {
  const packageJson = JSON.parse(read('package.json'));
  const appJsx = read(path.join('src', 'App.jsx'));
  const mainJs = read('main.js');
  const preloadJs = read('preload.js');

  if (packageJson.scripts['check:stability'] !== 'node scripts/check-stability.js') {
    throw new Error('package.json is missing the check:stability script');
  }

  assertIncludes(preloadJs, "readDatabase: () => ipcRenderer.invoke('read-database')", 'renderer readDatabase bridge');
  assertIncludes(preloadJs, "writeDatabase: (data) => ipcRenderer.invoke('write-database', data)", 'renderer writeDatabase bridge');
  assertIncludes(mainJs, "ipcMain.handle('write-database'", 'write-database IPC handler');
  assertIncludes(mainJs, "return { success: true };", 'successful local write response');

  assertIncludes(appJsx, 'const saveQueueRef = useRef(Promise.resolve());', 'save queue ref');
  assertIncludes(appJsx, 'const writeLocalBackup = useCallback(async (sanitizedDb) => {', 'verified local backup helper');
  assertIncludes(appJsx, 'const writeResult = await window.electronAPI.writeDatabase(sanitizedDb);', 'awaited local write');
  assertIncludes(appJsx, 'const persistedDb = await window.electronAPI.readDatabase();', 'local backup read verification');
  assertIncludes(appJsx, "const syncDbToCloud = useCallback(async (oldDb, sanitizedDb) => {", 'cloud sync helper');
  assertIncludes(appJsx, "status: 'degraded'", 'degraded save health state');
  assertIncludes(appJsx, 'const retryLastSave = useCallback(async () => {', 'retry last save helper');
  assertIncludes(appJsx, "typeof nextDbOrUpdater === 'function'", 'functional save updater support');

  console.log('Stability checks passed.');
  process.exit(0);
} catch (error) {
  console.error('Stability check failed:', error.message);
  process.exit(2);
}
