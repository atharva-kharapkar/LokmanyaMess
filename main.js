const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

// Runtime flags
const isDev = !app.isPackaged;

// Global crash handlers for the main process — log and show a dialog so the app doesn't silently exit
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception (main):', err);
  try { dialog.showErrorBox('Unexpected Error', String(err)); } catch (e) { /* best-effort */ }
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection (main):', reason);
  try { dialog.showErrorBox('Unhandled Promise Rejection', String(reason)); } catch (e) { /* best-effort */ }
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: " ",
    icon: path.join(__dirname, 'assets', 'transparent_icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.maximize();
  mainWindow.show();
  mainWindow.setMenuBarVisibility(false);

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  // Permission handler: only allow camera/microphone for trusted origins (dev server or packaged file://)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    try {
      const url = webContents.getURL();
      if (permission === 'media') {
        if ((isDev && url.startsWith('http://localhost:5173')) || (!isDev && url.startsWith('file://'))) {
          callback(true);
          return;
        }
      }
    } catch (e) {
      console.error('Permission handler error:', e);
    }
    callback(false);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

const getDbPath = () => {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'database.json');
};

ipcMain.handle('read-database', async () => {
  const dbPath = getDbPath();
  const defaultDb = {
    customers: [],
    employees: [],
    transactions: [],
    salaries: [],
    settings: {
      lang: 'en',
      upiId: '',
    ownerPin: '', // Owner must set PIN on first run
    requireSetup: true,
    messName: 'Lokmanya Mess',
    ownerName: 'Mess Owner'
    }
  };

  if (!fs.existsSync(dbPath)) {
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    // Basic validation: ensure parsed is an object with settings
    if (!parsed || typeof parsed !== 'object') return defaultDb;
    if (!parsed.settings || typeof parsed.settings !== 'object') parsed.settings = defaultDb.settings;
    return parsed;
  } catch (e) {
    console.error("Error reading database:", e);
    // On parse/read error, return a safe default instead of null to avoid crashes in renderer
    return defaultDb;
  }
});

ipcMain.handle('write-database', async (event, data) => {
  const dbPath = getDbPath();
  // Validate input to avoid corruption of the local DB file
  if (!data || typeof data !== 'object') {
    console.error('write-database: invalid payload');
    return { success: false, error: 'Invalid payload' };
  }
  try {
    // Minimal structural sanity check
    const safeData = {
      customers: Array.isArray(data.customers) ? data.customers : [],
      employees: Array.isArray(data.employees) ? data.employees : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      salaries: Array.isArray(data.salaries) ? data.salaries : [],
      settings: (data.settings && typeof data.settings === 'object') ? data.settings : { lang: 'en' }
    };
    fs.writeFileSync(dbPath, JSON.stringify(safeData, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    console.error("Error writing database:", e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('save-csv', async (event, { content, defaultName }) => {
  if (!mainWindow) return { success: false };
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export CSV Report',
    defaultPath: path.join(app.getPath('downloads'), defaultName),
    filters: [
      { name: 'CSV Files', extensions: ['csv'] }
    ]
  });

  if (!filePath) {
    return { success: false, canceled: true };
  }

  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true, filePath };
  } catch (e) {
    console.error("Error saving CSV file:", e);
    return { success: false, error: e.message };
  }
});
