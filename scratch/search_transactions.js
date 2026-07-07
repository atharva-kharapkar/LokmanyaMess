const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\logs\\transcript.jsonl';

async function scanTxns() {
  if (!fs.existsSync(logPath)) {
    console.log("Log not found.");
    return;
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Scanning logs for transaction records...");
  let count = 0;
  for await (const line of rl) {
    if (line.includes("txn_")) {
      count++;
      console.log(`Line ${count} matches. Length: ${line.length}`);
      fs.appendFileSync('scratch/txn_log_matches.txt', line + '\n');
    }
  }
  console.log(`Scan complete. Found ${count} lines.`);
}

scanTxns();

