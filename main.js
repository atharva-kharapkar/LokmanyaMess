const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

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
  // Automatically grant camera permissions for Webcams
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
    } else {
      callback(false);
    }
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
  if (!fs.existsSync(dbPath)) {
    return {
      customers: [],
      employees: [],
      transactions: [],
      salaries: [],
      settings: {
        lang: 'en',
        upiId: '',
        ownerPin: '123456',
        messName: 'Lokmanya Mess',
        ownerName: 'Mess Owner'
      }
    };
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading database:", e);
    return null;
  }
});

ipcMain.handle('write-database', async (event, data) => {
  const dbPath = getDbPath();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
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
