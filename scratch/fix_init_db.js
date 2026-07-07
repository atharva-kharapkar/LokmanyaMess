const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// Match `if (data) { ... setNewPinInput(...) ... }` with any line endings
const regex = /if\s*\(data\)\s*\{\r?\n\s*setDb\(data\);\r?\n\s*setNewPinInput\(data\.settings\?\.ownerPin\s*\|\|\s*'123456'\);\r?\n\s*\}/;

const replacement = `if (data) {
        setDb(data);
        setNewPinInput(data.settings?.ownerPin || '123456');
        setMessNameInput(data.settings?.messName || 'Lokmanya Mess');
        setOwnerNameInput(data.settings?.ownerName || 'Mess Owner');
      }`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  console.log('Successfully initialized settings states in initDb using regex!');
  fs.writeFileSync(appFile, content, 'utf8');
} else {
  console.error('Regex did not match inside App.jsx!');
}

