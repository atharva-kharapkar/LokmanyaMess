const fs = require('fs');
const readline = require('readline');
const path = require('path');

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
  for await (const line of rl) {
    // Look for tool output containing customer information
    if (line.includes("cust_1782418880380") || line.includes("atharva manohar kharapkar")) {
      console.log("Found matching line in log!");
      // Print the line or extract JSON
      fs.writeFileSync('scratch/extracted_log_match.txt', line);
      console.log("Saved match to scratch/extracted_log_match.txt");
    }
  }
  console.log("Finished scan.");
}

recover();

