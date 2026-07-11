const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'release', 'dist', 'coverage'].includes(file)) continue;
      walk(full, filelist);
    } else {
      if (file.startsWith('.env')) continue;
      filelist.push(full);
    }
  }
  return filelist;
}

const repoRoot = path.join(__dirname, '..');
const allFiles = walk(repoRoot);
let found = [];
for (const f of allFiles) {
  try {
    const txt = fs.readFileSync(f, 'utf8');
    if (/AIza[0-9A-Za-z-_]{35}/.test(txt)) found.push({file: f, match: 'Firebase API Key'});
    if (/ownerPin:\s*'123456'/.test(txt)) found.push({file: f, match: 'Default ownerPin 123456'});
  } catch (e) {}
}
if (found.length === 0) {
  console.log('No obvious secrets found.');
  process.exit(0);
} else {
  console.log('Potential secrets found:');
  for (const f of found) console.log(f.file, '-', f.match);
  process.exit(2);
}
