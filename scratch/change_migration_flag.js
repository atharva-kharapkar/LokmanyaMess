const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// Replace the migration flag key with a new desktop-specific version
content = content.replaceAll("'lokmanya_migration_done'", "'lokmanya_migration_done_desktop_v1'");

fs.writeFileSync(appFile, content, 'utf8');
console.log('Successfully updated the migration flag key!');

