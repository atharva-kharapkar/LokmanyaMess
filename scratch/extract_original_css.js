const fs = require('fs');
const readline = require('readline');

const logFile = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\logs\\transcript.jsonl";

async function extractOriginal() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let idx = 0;
  for await (const line of rl) {
    idx++;
    if (idx === 5882) {
      const obj = JSON.parse(line);
      console.log('Step Type:', obj.type);
      console.log('Step Source:', obj.source);
      
      // Let's write the content (which is the read CSS file) to a file
      fs.writeFileSync('scratch/original_view_file_output.txt', obj.content, 'utf8');
      console.log('Saved step 5882 content to scratch/original_view_file_output.txt');
      break;
    }
  }
}

extractOriginal();

