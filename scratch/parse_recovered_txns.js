const fs = require('fs');

if (fs.existsSync('scratch/txn_log_matches.txt')) {
  const content = fs.readFileSync('scratch/txn_log_matches.txt', 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    try {
      const data = JSON.parse(line);
      const contentStr = JSON.stringify(data.content || data.tool_calls || '');
      console.log(`[Match ${idx}] Step: ${data.step_index}, Source: ${data.source}, Type: ${data.type}, Length: ${contentStr.length}`);
      if (contentStr.includes('[') && contentStr.includes('amount') && (data.type === 'TOOL_OUTPUT' || data.type === 'RUN_COMMAND' || data.type === 'SYSTEM')) {
        console.log(`---> Potentially contains JSON array!`);
        fs.writeFileSync(`scratch/txn_detail_${data.step_index}.json`, JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log(`[Match ${idx}] JSON parse error:`, e.message);
    }
  });
}

