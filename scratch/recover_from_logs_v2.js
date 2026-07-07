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

  console.log("Scanning log file for database contents...");
  let count = 0;
  for await (const line of rl) {
    // Only target tool outputs or system messages, ignore MODEL planning responses
    if (line.includes("cust_1782418880380") && (line.includes("TOOL_OUTPUT") || line.includes("SYSTEM") || line.includes("run_command") || line.includes("runCmd"))) {
      count++;
      console.log(`Found matching tool output line ${count}!`);
      fs.appendFileSync('scratch/recovered_database_dumps.txt', line + '\n');
    }
  }
  console.log(`Finished scan. Saved ${count} matches to scratch/recovered_database_dumps.txt`);
}

recover();
