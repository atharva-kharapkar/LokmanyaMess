const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

// Runtime flags
const isDev = false;

// Force Indian English locale so native date inputs render DD/MM/YYYY
app.commandLine.appendSwitch('lang', 'en-GB');
app.setName('Lokmanya Mess');

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
let whatsappWindow = null;

function isSafeExternalUrl(rawUrl) {
  if (typeof rawUrl === 'string' && rawUrl.startsWith('whatsapp://')) {
    return true;
  }
  try {
    const parsed = new URL(rawUrl);
    return ['https:', 'http:', 'whatsapp:'].includes(parsed.protocol);
  } catch (error) {
    return false;
  }
}

function isAllowedWhatsAppUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return (
      parsed.protocol === 'https:' &&
      ['web.whatsapp.com', 'api.whatsapp.com', 'wa.me'].includes(parsed.hostname)
    );
  } catch (error) {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    title: " ",
    icon: path.join(__dirname, 'assets', 'transparent_icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.maximize();
      mainWindow.show();
    }
  });


  mainWindow.webContents.setWindowOpenHandler(({ url, frameName }) => {
    if (url.startsWith('whatsapp://') && isSafeExternalUrl(url)) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }

    if (frameName === 'whatsapp_share_tab' && isAllowedWhatsAppUrl(url)) {
      if (whatsappWindow && !whatsappWindow.isDestroyed()) {
        whatsappWindow.loadURL(url);
        whatsappWindow.focus();
      } else {
        whatsappWindow = new BrowserWindow({
          width: 1000,
          height: 750,
          title: "WhatsApp Web - Lokmanya Mess",
          icon: path.join(__dirname, 'assets', 'transparent_icon.png'),
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });
        // WhatsApp Web check requires standard modern user agent
        whatsappWindow.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        whatsappWindow.loadURL(url);
        whatsappWindow.setMenuBarVisibility(false);
      }
      return { action: 'deny' };
    }

    if (isSafeExternalUrl(url) && (url.startsWith('http:') || url.startsWith('https:'))) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (url !== currentUrl) {
      event.preventDefault();
      if (isSafeExternalUrl(url) && (url.startsWith('http:') || url.startsWith('https:'))) {
        require('electron').shell.openExternal(url);
      }
    }
  });

mainWindow.setMenuBarVisibility(false);

// Debug listeners
mainWindow.webContents.on("did-start-loading", () => {
  console.log("Loading started...");
});

mainWindow.webContents.on("did-finish-load", () => {
  console.log("Loading finished.");
});

mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
  console.error("did-fail-load:");
  console.error({
    errorCode,
    errorDescription,
    validatedURL
  });
});

mainWindow.webContents.on("render-process-gone", (event, details) => {
  console.error("Renderer process crashed:", details);
});

mainWindow.webContents.on("console-message", (event, level, message) => {
  console.log("[Renderer]", message);
});

// Load application
if (isDev) {
  console.log("========== DEV MODE ==========");
  mainWindow.loadURL("http://localhost:4173");
} else {
  const indexPath = path.join(__dirname, "dist", "index.html");

  console.log("========== PRODUCTION MODE ==========");
  console.log("Loading:", indexPath);
  console.log("File Exists:", fs.existsSync(indexPath));

  mainWindow.loadFile(indexPath)
    .then(() => {
      console.log("✅ index.html loaded successfully");
    })
    .catch((err) => {
      console.error("❌ loadFile failed:", err);
    });
}
}
app.whenReady().then(() => {
  // Permission handler: only allow camera/microphone for trusted origins (dev server or packaged file://)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    try {
      const url = webContents.getURL();
      if (permission === 'media') {
        if ((isDev && (url.startsWith('http://localhost:5173') || url.startsWith('http://localhost:4173'))) || (!isDev && url.startsWith('file://'))) {
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

const getBackupsDir = () => {
  const userDataPath = app.getPath('userData');
  const backupDir = path.join(userDataPath, 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
};

// Non-blocking background daily backup
const ensureDailyBackup = (safeData) => {
  setImmediate(() => {
    try {
      if (!safeData || typeof safeData !== 'object') return;
      if ((!safeData.customers || safeData.customers.length === 0) && (!safeData.transactions || safeData.transactions.length === 0)) {
        return;
      }
      const backupDir = getBackupsDir();
      const todayStr = new Date().toISOString().split('T')[0];
      const todayBackupPath = path.join(backupDir, `lokmanya_backup_${todayStr}.json`);

      if (!fs.existsSync(todayBackupPath)) {
        fs.writeFileSync(todayBackupPath, JSON.stringify(safeData), 'utf8');
        console.log(`[Backup] Created daily rolling backup for ${todayStr}`);
      }

      // Prune backups older than 30 days asynchronously
      fs.readdir(backupDir, (err, files) => {
        if (err || !Array.isArray(files)) return;
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        files.forEach((file) => {
          if (file.startsWith('lokmanya_backup_') && file.endsWith('.json')) {
            const filePath = path.join(backupDir, file);
            fs.stat(filePath, (statErr, stats) => {
              if (!statErr && stats && now - stats.mtimeMs > thirtyDaysMs) {
                fs.unlink(filePath, () => {});
              }
            });
          }
        });
      });
    } catch (err) {
      console.warn('[Backup] Daily backup check error:', err);
    }
  });
};

ipcMain.handle('read-database', async () => {
  const dbPath = getDbPath();
  const defaultDb = {
    customers: [],
    employees: [],
    transactions: [],
    salaries: [],
    expenses: [],
    archives: [],
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
    if (!parsed.expenses) parsed.expenses = [];
    if (!parsed.archives) parsed.archives = [];
    
    ensureDailyBackup(parsed);
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
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      archives: Array.isArray(data.archives) ? data.archives : [],
      settings: (data.settings && typeof data.settings === 'object') ? data.settings : { lang: 'en' }
    };
    fs.writeFileSync(dbPath, JSON.stringify(safeData, null, 2), 'utf8');
    ensureDailyBackup(safeData);
    return { success: true };
  } catch (e) {
    console.error("Error writing database:", e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('list-backups', async () => {
  try {
    const backupDir = getBackupsDir();
    if (!fs.existsSync(backupDir)) return [];
    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter((file) => file.startsWith('lokmanya_backup_') && file.endsWith('.json'))
      .map((file) => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const dateMatch = file.match(/lokmanya_backup_(\d{4}-\d{2}-\d{2})\.json/);
        const dateStr = dateMatch ? dateMatch[1] : stats.mtime.toISOString().split('T')[0];
        return {
          filename: file,
          date: dateStr,
          sizeKb: Math.round(stats.size / 1024) || 1,
          modifiedAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    return backups;
  } catch (err) {
    console.error('Error listing backups:', err);
    return [];
  }
});

ipcMain.handle('restore-backup', async (event, filename) => {
  try {
    const backupDir = getBackupsDir();
    const backupPath = path.join(backupDir, filename);
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Backup file not found' };
    }
    const content = fs.readFileSync(backupPath, 'utf8');
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid backup content' };
    }

    const dbPath = getDbPath();
    fs.writeFileSync(dbPath, JSON.stringify(parsed, null, 2), 'utf8');
    return { success: true, data: parsed };
  } catch (err) {
    console.error('Error restoring backup:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-backup', async () => {
  if (!mainWindow) return { success: false };
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) return { success: false, error: 'Database file does not exist' };

  const todayStr = new Date().toISOString().split('T')[0];
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export USB / Offline Backup',
    defaultPath: path.join(app.getPath('downloads'), `lokmanya_mess_backup_${todayStr}.json`),
    filters: [{ name: 'JSON Backup Files', extensions: ['json'] }]
  });

  if (!filePath) return { success: false, canceled: true };

  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    fs.writeFileSync(filePath, data, 'utf8');
    return { success: true, filePath };
  } catch (err) {
    console.error('Error exporting backup:', err);
    return { success: false, error: err.message };
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

ipcMain.handle('open-external', async (event, url) => {
  if (isSafeExternalUrl(url)) {
    require('electron').shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'Unsafe URL' };
});


