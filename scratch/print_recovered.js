const fs = require('fs');

if (fs.existsSync('scratch/recovered_database_dumps.txt')) {
  const content = fs.readFileSync('scratch/recovered_database_dumps.txt', 'utf8');
  console.log('Recovered content length:', content.length);
  // Print the first 2000 characters
  console.log('Content:\n', content.substring(0, 2000));
} else {
  console.log('No matches found.');
}

