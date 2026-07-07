const fs = require('fs');
const path = require('path');

// 1. Fix package.json build files configuration
const pkgFile = 'package.json';
let pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
if (pkg.build && pkg.build.files) {
  const index = pkg.build.files.indexOf('assets/transparent_icon.png');
  if (index !== -1) {
    pkg.build.files[index] = 'assets/**/*';
    console.log('Updated package.json to include all asset files!');
  } else {
    // Check if assets/**/* is already there
    if (!pkg.build.files.includes('assets/**/*')) {
      pkg.build.files.push('assets/**/*');
      console.log('Added assets/**/* to package.json build files!');
    }
  }
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2), 'utf8');
}

// 2. Fix App.jsx
const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// Insert local state variables for settings inputs
const stateDeclarationsTarget = "  const [toast, setToast] = useState(null);";
const stateDeclarationsReplacement = `  const [toast, setToast] = useState(null);
  const [messNameInput, setMessNameInput] = useState('');
  const [ownerNameInput, setOwnerNameInput] = useState('');`;

if (content.includes(stateDeclarationsTarget) && !content.includes("messNameInput")) {
  content = content.replace(stateDeclarationsTarget, stateDeclarationsReplacement);
  console.log('Added messNameInput and ownerNameInput state variables!');
}

// Initialize settings state variables inside initDb
const initDbTarget = `      if (data) {
        setDb(data);
        setNewPinInput(data.settings?.ownerPin || '123456');
      }`;
const initDbReplacement = `      if (data) {
        setDb(data);
        setNewPinInput(data.settings?.ownerPin || '123456');
        setMessNameInput(data.settings?.messName || 'Lokmanya Mess');
        setOwnerNameInput(data.settings?.ownerName || 'Mess Owner');
      }`;

if (content.includes(initDbTarget) && !content.includes("setMessNameInput")) {
  content = content.replace(initDbTarget, initDbReplacement);
  console.log('Initialized settings state variables in initDb!');
}

// Update the video splash screen error fallback logic
const videoTagTarget = `              <video 
                src="./assets/logo_intro.mp4" 
                autoPlay 
                muted 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onEnded={() => {
                  setShowPinPad(true);
                  setIntroPlayed(true);
                }}
              />`;

const videoTagReplacement = `              <video 
                src="./assets/logo_intro.mp4" 
                autoPlay 
                muted 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onEnded={() => {
                  setShowPinPad(true);
                  setIntroPlayed(true);
                }}
                onError={() => {
                  setShowPinPad(true);
                  setIntroPlayed(true);
                }}
              />`;

if (content.includes(videoTagTarget)) {
  content = content.replace(videoTagTarget, videoTagReplacement);
  console.log('Added onError fallback handler to video splash screen!');
}

// Update saveCustomer to clear search query on save
const saveCustomerTarget = `    saveDb({ ...db, customers: updatedCustomers, transactions: updatedTxns });
    setCustModal(false);`;

const saveCustomerReplacement = `    saveDb({ ...db, customers: updatedCustomers, transactions: updatedTxns });
    setCustSearch(''); // Clear search query to show the new customer immediately
    setCustModal(false);`;

if (content.includes(saveCustomerTarget)) {
  content = content.replace(saveCustomerTarget, saveCustomerReplacement);
  console.log('Added search query clearing to saveCustomer!');
}

// Update settings inputs to use local states and save onBlur
const messNameInputTarget = `                      <input
                        type="text"
                        className="form-input"
                        value={db.settings.messName}
                        onChange={(e) => saveDb({ ...db, settings: { ...db.settings, messName: e.target.value } })}
                      />`;

const messNameInputReplacement = `                      <input
                        type="text"
                        className="form-input"
                        value={messNameInput}
                        onChange={(e) => setMessNameInput(e.target.value)}
                        onBlur={() => saveDb({ ...db, settings: { ...db.settings, messName: messNameInput } })}
                      />`;

const ownerNameInputTarget = `                      <input
                        type="text"
                        className="form-input"
                        value={db.settings.ownerName}
                        onChange={(e) => saveDb({ ...db, settings: { ...db.settings, ownerName: e.target.value } })}
                      />`;

const ownerNameInputReplacement = `                      <input
                        type="text"
                        className="form-input"
                        value={ownerNameInput}
                        onChange={(e) => setOwnerNameInput(e.target.value)}
                        onBlur={() => saveDb({ ...db, settings: { ...db.settings, ownerName: ownerNameInput } })}
                      />`;

if (content.includes(messNameInputTarget)) {
  content = content.replace(messNameInputTarget, messNameInputReplacement);
  console.log('Optimized Mess Name settings input to save onBlur!');
}
if (content.includes(ownerNameInputTarget)) {
  content = content.replace(ownerNameInputTarget, ownerNameInputReplacement);
  console.log('Optimized Owner Name settings input to save onBlur!');
}

// Update sorting logic to be stable (descending ID/timestamp order when dues are equal)
const sortTarget = `    return list.sort((a, b) => getCustomerDues(b) - getCustomerDues(a));`;
const sortReplacement = `    return list.sort((a, b) => {
      const duesDiff = getCustomerDues(b) - getCustomerDues(a);
      if (duesDiff !== 0) return duesDiff;
      return b.id.localeCompare(a.id); // Show newer customers first when dues are equal
    });`;

if (content.includes(sortTarget)) {
  content = content.replace(sortTarget, sortReplacement);
  console.log('Optimized search results sorting to be stable (newest first for equal dues)!');
}

fs.writeFileSync(appFile, content, 'utf8');
console.log('Finished updating App.jsx');

