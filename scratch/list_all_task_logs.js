const fs = require('fs');
const path = require('path');

const tasksDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\tasks\\';

if (fs.existsSync(tasksDir)) {
  const files = fs.readdirSync(tasksDir);
  console.log(`Found ${files.length} log files in tasks directory:`);
  
  const fileDetails = files.map(file => {
    const filePath = path.join(tasksDir, file);
    const stat = fs.statSync(filePath);
    return {
      name: file,
      size: stat.size,
      mtime: stat.mtime
    };
  });
  
  // Sort by modification time descending
  fileDetails.sort((a, b) => b.mtime - a.mtime);
  
  fileDetails.forEach(f => {
    console.log(`- File: ${f.name}, Size: ${f.size} bytes, Modified: ${f.mtime.toISOString()}`);
  });
} else {
  console.log("Tasks directory not found!");
}

