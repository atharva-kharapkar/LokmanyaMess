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

try {
  const packageJson = JSON.parse(read('package.json'));
  const srcFiles = getAllFiles(path.join(root, 'src'));
  const appHookJsx = srcFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const mainJs = read('main.js');
  const preloadJs = read('preload.js');

  if (packageJson.scripts['check:stability'] !== 'node scripts/check-stability.js') {
    throw new Error('package.json is missing the check:stability script');
  }

  assertIncludes(preloadJs, "readDatabase: () => ipcRenderer.invoke('read-database')", 'renderer readDatabase bridge');
  assertIncludes(preloadJs, "writeDatabase: (data) => ipcRenderer.invoke('write-database', data)", 'renderer writeDatabase bridge');
  assertIncludes(mainJs, "ipcMain.handle('write-database'", 'write-database IPC handler');
  assertIncludes(mainJs, "return { success: true };", 'successful local write response');

  assertIncludes(appHookJsx, 'const saveQueueRef = useRef(Promise.resolve());', 'save queue ref');
  assertIncludes(appHookJsx, 'const writeLocalBackup = useCallback(async (sanitizedDb) => {', 'verified local backup helper');
  assertIncludes(appHookJsx, 'const writeResult = await window.electronAPI.writeDatabase(sanitizedDb);', 'awaited local write');
  assertIncludes(appHookJsx, 'const persistedDb = await window.electronAPI.readDatabase();', 'local backup read verification');
  assertIncludes(appHookJsx, "const syncDbToCloud = useCallback(async (oldDb, sanitizedDb) => {", 'cloud sync helper');
  assertIncludes(appHookJsx, "status: 'degraded'", 'degraded save health state');
  assertIncludes(appHookJsx, 'const retryLastSave = useCallback(async () => {', 'retry last save helper');
  assertIncludes(appHookJsx, "typeof nextDbOrUpdater === 'function'", 'functional save updater support');

  console.log('Stability checks passed.');
  process.exit(0);
} catch (error) {
  console.error('Stability check failed:', error.message);
  process.exit(2);
}
