const fs = require('fs');

const inputFile = 'scratch/original_view_file_output.txt';
const outputFile = 'src/index.css';

function reconstruct() {
  if (!fs.existsSync(inputFile)) {
    console.error('Input file does not exist:', inputFile);
    return;
  }
  
  const content = fs.readFileSync(inputFile, 'utf8');
  const lines = content.split('\n');
  
  let cssLines = [];
  let foundStart = false;
  
  for (let line of lines) {
    // Check if line contains a line number prefix like "1: :root {" or similar
    const match = line.match(/^\d+:\s(.*)/);
    if (match) {
      cssLines.push(match[1]);
    } else {
      // If it's a blank line or system banner, we skip it unless it's inside the code block
      if (line.includes('File Path:') || line.includes('Total Lines:') || line.includes('Total Bytes:') || line.includes('Showing lines') || line.includes('The following code has been modified') || line.includes('Please note that any changes') || line.includes('Created At:')) {
        continue;
      }
      cssLines.push(line);
    }
  }
  
  const reconstructedContent = cssLines.join('\n');
  fs.writeFileSync(outputFile, reconstructedContent, 'utf8');
  console.log('Successfully reconstructed and wrote original CSS to', outputFile);
}

reconstruct();

