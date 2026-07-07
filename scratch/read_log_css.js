const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logFile = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\logs\\transcript.jsonl";

console.log('Reading log file:', logFile);

async function findPreviousCss() {
  if (!fs.existsSync(logFile)) {
    console.error('Log file does not exist at:', logFile);
    return;
  }
  
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let cssContents = [];
  
  for await (const line of rl) {
    if (line.includes('index.css')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          for (const call of obj.tool_calls) {
            if (call.name === 'write_to_file' && call.args && call.args.TargetFile && call.args.TargetFile.endsWith('index.css')) {
              cssContents.push({
                step: obj.step_index,
                type: 'write_to_file',
                content: call.args.CodeContent
              });
            }
            if (call.name === 'replace_file_content' && call.args && call.args.TargetFile && call.args.TargetFile.endsWith('index.css')) {
              cssContents.push({
                step: obj.step_index,
                type: 'replace_file_content',
                target: call.args.TargetContent,
                replacement: call.args.ReplacementContent
              });
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
  
  console.log('Found', cssContents.length, 'occurrences of index.css operations in the log.');
  cssContents.forEach(c => console.log('Step:', c.step, 'Type:', c.type));
  
  fs.writeFileSync('scratch/css_history.json', JSON.stringify(cssContents, null, 2), 'utf8');
  console.log('Wrote CSS history to scratch/css_history.json');
}

findPreviousCss();
