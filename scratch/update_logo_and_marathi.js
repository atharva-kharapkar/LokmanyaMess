const fs = require('fs');
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix Marathi "App Settings" translation (replace 'अॅप' with 'ॲप')
content = content.replace('appSettings: "अॅप सेटिंग्ज",', 'appSettings: "ॲप सेटिंग्ज",');
console.log('Fixed Marathi App Settings translation!');

// 2. Replace the sidebar header to render the logo in a larger, clearer size on all pages
const targetSidebarHeader = `<div className="sidebar-header">
          <div className="sidebar-logo-text">🍱 {db.settings.messName}</div>
        </div>`;

const replacementSidebarHeader = `<div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img 
            src="./assets/icon.jpg" 
            style={{ width: '64px', height: '64px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.15)', objectFit: 'cover', boxShadow: 'var(--shadow-md)' }} 
            alt="Logo" 
          />
          <div className="sidebar-logo-text" style={{ fontSize: '16px', fontWeight: '800', textAlign: 'center', color: '#fff', letterSpacing: '0.5px' }}>{db.settings.messName}</div>
        </div>`;

if (content.includes(targetSidebarHeader)) {
  content = content.replace(targetSidebarHeader, replacementSidebarHeader);
  console.log('Updated Sidebar logo rendering successfully!');
} else {
  // Try with single quotes or different whitespace
  const flexibleRegex = /<div className="sidebar-header">[\s\S]*?<div className="sidebar-logo-text">🍱 \{db\.settings\.messName\}<\/div>[\s\S]*?<\/div>/;
  if (flexibleRegex.test(content)) {
    content = content.replace(flexibleRegex, replacementSidebarHeader);
    console.log('Updated Sidebar logo rendering via regex successfully!');
  } else {
    console.error('Could not find sidebar header block in App.jsx');
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Finished updating App.jsx');

