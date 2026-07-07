const fs = require('fs');
const readline = require('readline');

const logFile = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\logs\\transcript.jsonl";

async function extractCss() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let idx = 0;
  for await (const line of rl) {
    idx++;
    if (idx === 5930) {
      const obj = JSON.parse(line);
      console.log('Step Type:', obj.type);
      console.log('Step Source:', obj.source);
      
      // Let's inspect the keys and find if there is code content
      fs.writeFileSync('scratch/extracted_step.json', JSON.stringify(obj, null, 2), 'utf8');
      console.log('Saved step 5930 full object to scratch/extracted_step.json');
      break;
    }
  }
}

extractCss();

