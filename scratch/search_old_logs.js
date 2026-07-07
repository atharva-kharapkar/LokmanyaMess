const fs = require('fs');
const readline = require('readline');
const path = require('path');

const brainDir = "C:\\Users\\USER\\.gemini\\antigravity\\brain";
const oldSessions = [
  'e0cd0c4e-b2cc-45eb-9d64-41ee5743f2d1',
  'f3fbbaec-83af-4f0e-9240-59f8f156e2a4'
];

async function searchOldLogs() {
  for (const session of oldSessions) {
    const logFile = path.join(brainDir, session, '.system_generated', 'logs', 'transcript.jsonl');
    if (!fs.existsSync(logFile)) {
      console.log('Log file does not exist:', logFile);
      continue;
    }
    
    console.log('Searching log file:', logFile);
    
    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let lineIdx = 0;
    for await (const line of rl) {
      lineIdx++;
      if (line.includes('index.css') && line.includes('write_to_file') && line.includes('CodeContent')) {
        try {
          const obj = JSON.parse(line);
          for (const call of obj.tool_calls) {
            if (call.name === 'write_to_file' && call.args && call.args.TargetFile && call.args.TargetFile.endsWith('index.css')) {
              console.log(`FOUND write_to_file in session ${session} line ${lineIdx}, Content Length:`, call.args.CodeContent.length);
              fs.writeFileSync(`scratch/recovered_${session}_${lineIdx}.css`, call.args.CodeContent, 'utf8');
              console.log(`Saved recovered CSS to scratch/recovered_${session}_${lineIdx}.css`);
            }
          }
        } catch(e) {}
      }
      
      if (line.includes('index.css') && line.includes('VIEW_FILE') && line.includes('Showing lines 1 to')) {
        try {
          const obj = JSON.parse(line);
          if (obj.type === 'VIEW_FILE' && obj.content) {
            console.log(`FOUND VIEW_FILE in session ${session} line ${lineIdx}, Content Length:`, obj.content.length);
            fs.writeFileSync(`scratch/recovered_view_${session}_${lineIdx}.txt`, obj.content, 'utf8');
            console.log(`Saved recovered view to scratch/recovered_view_${session}_${lineIdx}.txt`);
          }
        } catch(e) {}
      }
    }
  }
  console.log('Search finished.');
}

searchOldLogs();
