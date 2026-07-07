const fs = require('fs');

const firebaseFile = 'src/firebase.js';
let content = fs.readFileSync(firebaseFile, 'utf8');

// Replace persistentMultipleTabManager with persistentSingleTabManager
content = content.replace('persistentMultipleTabManager', 'persistentSingleTabManager');
content = content.replace('persistentMultipleTabManager()', 'persistentSingleTabManager()');

fs.writeFileSync(firebaseFile, content, 'utf8');
console.log('Successfully updated firebase.js to use persistentSingleTabManager!');

