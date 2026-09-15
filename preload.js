const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readDatabase: () => ipcRenderer.invoke('read-database'),
  writeDatabase: (data) => ipcRenderer.invoke('write-database', data),
  saveCsv: (content, defaultName) => ipcRenderer.invoke('save-csv', { content, defaultName }),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  listBackups: () => ipcRenderer.invoke('list-backups'),
  restoreBackup: (filename) => ipcRenderer.invoke('restore-backup', filename),
  exportBackup: () => ipcRenderer.invoke('export-backup')
});

