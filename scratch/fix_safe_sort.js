const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// Replace standard localeCompare with a safe fallback to prevent crashes if id is undefined
const sortTarget = `    return list.sort((a, b) => {
      const duesDiff = getCustomerDues(b) - getCustomerDues(a);
      if (duesDiff !== 0) return duesDiff;
      return b.id.localeCompare(a.id); // Show newer customers first when dues are equal
    });`;

const sortReplacement = `    return list.sort((a, b) => {
      const duesDiff = getCustomerDues(b) - getCustomerDues(a);
      if (duesDiff !== 0) return duesDiff;
      const idA = a.id || '';
      const idB = b.id || '';
      return idB.localeCompare(idA); // Show newer customers first when dues are equal
    });`;

if (content.includes(sortTarget)) {
  content = content.replace(sortTarget, sortReplacement);
  console.log('Successfully made customer list sorting safe against missing IDs!');
  fs.writeFileSync(appFile, content, 'utf8');
} else {
  console.error('Target sorting block not found in App.jsx!');
}

