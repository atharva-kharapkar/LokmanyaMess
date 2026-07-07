const fs = require('fs');

if (fs.existsSync('scratch/all_raw_matches.txt')) {
  const content = fs.readFileSync('scratch/all_raw_matches.txt', 'utf8');
  const lines = content.split('\n');
  console.log(`Scanning ${lines.length} lines for database lists...`);
  
  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    try {
      const data = JSON.parse(line);
      const contentStr = JSON.stringify(data.content || data.tool_calls || '');
      if (contentStr.length > 1000) {
        console.log(`\n======================================================`);
        console.log(`[Line ${idx}] Step: ${data.step_index}, Source: ${data.source}, Type: ${data.type}`);
        console.log(`Created At: ${data.created_at}, Content Length: ${contentStr.length}`);
        console.log(`First 500 chars: ${contentStr.substring(0, 500)}`);
        console.log(`Last 500 chars: ${contentStr.substring(contentStr.length - 500)}`);
      }
    } catch (e) {
      console.log(`Line ${idx} error:`, e.message);
    }
  });
}
