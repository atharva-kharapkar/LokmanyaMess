const fs = require('fs');
const readline = require('readline');

const logFile = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\logs\\transcript.jsonl";

async function combineByStep() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let part1Content = '';
  let part2Content = '';
  
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 5601 && obj.type === 'VIEW_FILE') {
        part1Content = obj.content;
      }
      if (obj.step_index === 5788 && obj.type === 'VIEW_FILE') {
        part2Content = obj.content;
      }
    } catch (e) {
      // ignore
    }
  }
  
  if (!part1Content) {
    console.error('Failed to extract part 1 (step 5601) of CSS from the logs!');
  }
  if (!part2Content) {
    console.error('Failed to extract part 2 (step 5788) of CSS from the logs!');
  }
  if (!part1Content || !part2Content) return;
  
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
  
  console.log('Reconstructed Part 1 lines count:', cleanPart1.length);
  console.log('Reconstructed Part 2 lines count:', cleanPart2.length);
  
  // Take lines 1 to 299 from cleanPart1 (0-based indices 0 to 298)
  // Take lines 300 to end from cleanPart2 (0-based indices 0 to end, since step 5788 starts at line 300)
  console.log('Part 1 Line 299:', cleanPart1[298]);
  console.log('Part 2 Line 300 (first line of part 2):', cleanPart2[0]);
  
  const combined = [...cleanPart1.slice(0, 299), ...cleanPart2];
  
  fs.writeFileSync('src/index.css', combined.join('\n'), 'utf8');
  console.log('Successfully combined and wrote reconstructed CSS to src/index.css! Total lines:', combined.length);
}

combineByStep();
