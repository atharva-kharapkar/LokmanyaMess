const fs = require('fs');
const path = require('path');

const tasksDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\tasks\\';

if (fs.existsSync(tasksDir)) {
  const files = fs.readdirSync(tasksDir);
  const largeFiles = [];
  
  files.forEach(file => {
    const filePath = path.join(tasksDir, file);
    const stat = fs.statSync(filePath);
    if (stat.size > 10000) {
      largeFiles.push({
        name: file,
        size: stat.size,
        mtime: stat.mtime
      });
    }
  });
  
  largeFiles.sort((a, b) => b.mtime - a.mtime);
  
  console.log(`Found ${largeFiles.length} large log files:`);
  largeFiles.forEach(f => {
    console.log(`- File: ${f.name}, Size: ${f.size} bytes, Modified: ${f.mtime.toISOString()}`);
  });
} else {
  console.log("Tasks directory not found!");
}

