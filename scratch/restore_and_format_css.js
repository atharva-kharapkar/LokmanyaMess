const fs = require('fs');

const srcFile = 'scratch/extracted_old_asar/dist/assets/index-BuZAdBrg.css';
const destFile = 'src/index.css';

function restoreAndFormat() {
  if (!fs.existsSync(srcFile)) {
    console.error('Source compiled CSS does not exist:', srcFile);
    return;
  }
  
  let css = fs.readFileSync(srcFile, 'utf8');
  
  // Format minified CSS to be human-readable
  // Replace { with {\n  , } with \n}\n, ; with ;\n  
  let formatted = css
    .replace(/\{/g, ' {\n  ')
    .replace(/\}/g, '\n}\n\n')
    .replace(/;/g, ';\n  ')
    .replace(/, /g, ',\n')
    .replace(/\n\s*\n/g, '\n\n') // remove empty lines
    .trim();
    
  // Append our critical cursor/text selection fix to ensure textboxes work 100%
  const cursorFix = `
/* Textbox cursor and select overrides to prevent input locking */
input, textarea {
  user-select: text !important;
  cursor: text !important;
}
`;

  formatted += cursorFix;
  
  fs.writeFileSync(destFile, formatted, 'utf8');
  console.log('Successfully restored, formatted, and wrote original CSS to', destFile);
}

restoreAndFormat();

