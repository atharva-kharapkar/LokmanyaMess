const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\logs\\transcript.jsonl';

async function recover() {
  if (!fs.existsSync(logPath)) {
    console.log("Log file not found at " + logPath);
    return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Scanning log file...");
  let count = 0;
  for await (const line of rl) {
    const lower = line.toLowerCase();
    if (lower.includes("atharva") || lower.includes("babulkar")) {
      count++;
      console.log(`Match ${count}: line length ${line.length}`);
      fs.appendFileSync('scratch/all_raw_matches.txt', line + '\n');
    }
  }
  console.log(`Finished. Saved ${count} matches to scratch/all_raw_matches.txt`);
}

recover();
