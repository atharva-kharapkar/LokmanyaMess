const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
function read(p) { return fs.readFileSync(p, 'utf8'); }
const mainJs = path.join(root, 'main.js');
if (!fs.existsSync(mainJs)) { console.error('main.js missing'); process.exit(2); }
const txt = read(mainJs);
if (/ipcMain\.handle\(\s*['\"]read-database['\"]/.test(txt) && /ipcMain\.handle\(\s*['\"]write-database['\"]/.test(txt)) {
  console.log('IPC handlers for read-database and write-database present'); process.exit(0);
} else { console.error('IPC handlers missing'); process.exit(2); }