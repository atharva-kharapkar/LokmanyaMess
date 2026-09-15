const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dirsToClean = [
  path.join(rootDir, 'dist'),
  path.join(rootDir, 'release')
];

dirsToClean.forEach((dirPath) => {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Successfully cleaned build directory: ${dirPath}`);
    } catch (err) {
      console.warn(`Warning: Could not remove directory ${dirPath}: ${err.message}`);
    }
  }
});
