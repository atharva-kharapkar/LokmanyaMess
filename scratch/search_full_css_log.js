const fs = require('fs');
const readline = require('readline');

const logFile = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\logs\\transcript.jsonl";

async function search() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineIdx = 0;
  let matches = [];
  
  for await (const line of rl) {
    lineIdx++;
    if (line.includes('index.css')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          for (const call of obj.tool_calls) {
            // Check if it's a view_file call starting near line 1
            if (call.name === 'view_file' && call.args && call.args.AbsolutePath && call.args.AbsolutePath.endsWith('index.css')) {
              matches.push({
                line: lineIdx,
                step: obj.step_index,
                type: 'view_file_call',
                startLine: call.args.StartLine,
                endLine: call.args.EndLine
              });
            }
          }
        }
        if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('1: :root')) {
          matches.push({
            line: lineIdx,
            step: obj.step_index,
            type: 'view_file_response_start_1',
            length: obj.content.length
          });
        }
      } catch (e) {
        // ignore
      }
    }
  }
  
  console.log('Matches found:', matches);
}

search();

