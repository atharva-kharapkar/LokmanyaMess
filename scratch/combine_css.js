const fs = require('fs');
const readline = require('readline');

const logFile = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\logs\\transcript.jsonl";

async function combine() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let idx = 0;
  let part1Content = '';
  let part2Content = '';
  
  for await (const line of rl) {
    idx++;
    if (idx === 5695) {
      const obj = JSON.parse(line);
      part1Content = obj.content;
    }
    if (idx === 5882) {
      const obj = JSON.parse(line);
      part2Content = obj.content;
    }
  }
  
  if (!part1Content || !part2Content) {
    console.error('Failed to extract both parts of CSS from the logs!');
    return;
  }
  
  // Reconstruct part 1 lines (1 to 800)
  const part1Lines = part1Content.split('\n');
  let cleanPart1 = [];
  for (let line of part1Lines) {
    const match = line.match(/^\d+:\s(.*)/);
    if (match) {
      cleanPart1.push(match[1]);
    } else {
      if (line.includes('File Path:') || line.includes('Total Lines:') || line.includes('Showing lines') || line.includes('modified to include') || line.includes('Please note that') || line.includes('Created At:')) {
        continue;
      }
      cleanPart1.push(line);
    }
  }
  
  // Reconstruct part 2 lines (300 to 1100)
  const part2Lines = part2Content.split('\n');
  let cleanPart2 = [];
  for (let line of part2Lines) {
    const match = line.match(/^\d+:\s(.*)/);
    if (match) {
      cleanPart2.push(match[1]);
    } else {
      if (line.includes('File Path:') || line.includes('Total Lines:') || line.includes('Showing lines') || line.includes('modified to include') || line.includes('Please note that') || line.includes('Created At:')) {
        continue;
      }
      cleanPart2.push(line);
    }
  }
  
  // Combine: part 1 has lines starting from index 1.
  // Since part 2 started at line 300 (which is index 299 in 0-based),
  // we take cleanPart1 from index 0 to 298 (which corresponds to lines 1 to 299).
  // and we take cleanPart2 from index 0 to the end (which corresponds to lines 300 to the end).
  // Let's verify by printing some overlap lines
  console.log('Part 1 Line 299:', cleanPart1[298]);
  console.log('Part 2 Line 300 (first line of part 2):', cleanPart2[0]);
  
  const combined = [...cleanPart1.slice(0, 299), ...cleanPart2];
  
  fs.writeFileSync('src/index.css', combined.join('\n'), 'utf8');
  console.log('Successfully combined and wrote reconstructed CSS to src/index.css! Total lines:', combined.length);
}

combine();
