const fs = require('fs');

if (fs.existsSync('scratch/extracted_log_match.txt')) {
  const content = fs.readFileSync('scratch/extracted_log_match.txt', 'utf8');
  console.log('Recovered log line length:', content.length);
  // Print the first 1000 characters
  console.log('Snippet:', content.substring(0, 1000));
} else {
  console.log('No matches found.');
}

