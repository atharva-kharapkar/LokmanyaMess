const fs = require('fs');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\tasks\\task-5980.log';

if (fs.existsSync(logPath)) {
  const stat = fs.statSync(logPath);
  console.log('Log size on disk:', stat.size);
  // Read first 1000 characters
  const fd = fs.openSync(logPath, 'r');
  const buffer = Buffer.alloc(2000);
  fs.readSync(fd, buffer, 0, 2000, 0);
  console.log('Snippet of log:\n', buffer.toString('utf8'));
  fs.closeSync(fd);
} else {
  console.log('Log not found.');
}
