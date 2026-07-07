const fs = require('fs');

if (fs.existsSync('scratch/all_raw_matches.txt')) {
  const fileContent = fs.readFileSync('scratch/all_raw_matches.txt', 'utf8');
  const lines = fileContent.split('\n');
  console.log(`Analyzing ${lines.length} lines...`);
  
  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    try {
      const data = JSON.parse(line);
      console.log(`[Line ${idx}] Step: ${data.step_index}, Source: ${data.source}, Type: ${data.type}`);
      // If it is a tool output, print it
      if (data.type === 'TOOL_OUTPUT' || data.type === 'SYSTEM' || data.type === 'RUN_COMMAND') {
        console.log(`--- Tool output content length: ${JSON.stringify(data.content || data.tool_calls).length}`);
        fs.writeFileSync(`scratch/match_detail_${data.step_index}.json`, JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log(`[Line ${idx}] Error parsing JSON:`, e.message);
    }
  });
}
