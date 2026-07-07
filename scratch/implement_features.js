const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Update Translations with new tabs and field names
const translationsTarget = `// Translations Map
const TRANSLATIONS = {
  en: {
    // PIN screen
    pinTitle: "Lokmanya Mess",
    pinSubtitle: "Enter PIN to Access System",
    pinError: "Invalid PIN! Please try again.",
    
    // Sidebar
    dashboard: "Dashboard",
    customers: "Customers Registry",
    settings: "Settings",
    logout: "Logout",
    
    // Header
    businessDashboard: "Business Dashboard",
    manageCustomers: "Manage Customers",
    appSettings: "App Settings",`;

const translationsReplacement = `// Translations Map
const TRANSLATIONS = {
  en: {
    // PIN screen
    pinTitle: "Lokmanya Mess",
    pinSubtitle: "Enter PIN to Access System",
    pinError: "Invalid PIN! Please try again.",
    
    // Sidebar
    dashboard: "Dashboard",
    customers: "Dine-in Members",
    tiffin: "Tiffin Delivery",
    shortterm: "Short-Term Members",
    oldcustomers: "Old Customers",
    settings: "Settings",
    logout: "Logout",
    
    // Header
    businessDashboard: "Business Dashboard",
    manageCustomers: "Manage Dine-in Members",
    manageTiffin: "Manage Tiffin Delivery",
    manageShortTerm: "Manage Short-Term Members",
    manageOldCustomers: "Archive (Old Customers)",
    appSettings: "App Settings",`;

if (content.includes(translationsTarget)) {
  content = content.replace(translationsTarget, translationsReplacement);
}

// 1b. Update Marathi Translations
const mrTranslationsTarget = `  mr: {
    // PIN screen
    pinTitle: "लोकमान्य मेस",
    pinSubtitle: "सिस्टममध्ये प्रवेश करण्यासाठी पिन प्रविष्ट करा",
    pinError: "चुकीचा पिन! कृपया पुन्हा प्रयत्न करा.",
    
    // Sidebar
    dashboard: "डॅशबोर्ड",
    customers: "ग्राहक नोंदणी",
    settings: "सेटिंग्ज",
    logout: "लॉगआउट",
    
    // Header
    businessDashboard: "व्यवसाय डॅशबोर्ड",
    manageCustomers: "ग्राहक व्यवस्थापित करा",
    appSettings: "ॲप सेटिंग्ज",`;

const mrTranslationsReplacement = `  mr: {
    // PIN screen
    pinTitle: "लोकमान्य मेस",
    pinSubtitle: "सिस्टममध्ये प्रवेश करण्यासाठी पिन प्रविष्ट करा",
    pinError: "चुकीचा पिन! कृपया पुन्हा प्रयत्न करा.",
    
    // Sidebar
    dashboard: "डॅशबोर्ड",
    customers: "डाईन-इन ग्राहक",
    tiffin: "टिफिन डिलिव्हरी",
    shortterm: "अल्पमुदत ग्राहक",
    oldcustomers: "जुने ग्राहक (संग्रह)",
    settings: "सेटिंग्ज",
    logout: "लॉगआउट",
    
    // Header
    businessDashboard: "व्यवसाय डॅशबोर्ड",
    manageCustomers: "डाईन-इन ग्राहक व्यवस्थापित करा",
    manageTiffin: "टिफिन डिलिव्हरी व्यवस्थापित करा",
    manageShortTerm: "अल्पमुदत ग्राहक व्यवस्थापित करा",
    manageOldCustomers: "जुने ग्राहक इतिहास",
    appSettings: "ॲप सेटिंग्ज",`;

if (content.includes(mrTranslationsTarget)) {
  content = content.replace(mrTranslationsTarget, mrTranslationsReplacement);
}

// 2. Add local activeBranch state, Archive Lock state, and Settings form input states
const stateDeclarationsTarget = `  const [toast, setToast] = useState(null);
  const [messNameInput, setMessNameInput] = useState('');
  const [ownerNameInput, setOwnerNameInput] = useState('');`;

const stateDeclarationsReplacement = `  const [toast, setToast] = useState(null);
  const [messNameInput, setMessNameInput] = useState('');
  const [ownerNameInput, setOwnerNameInput] = useState('');
  const [activeBranch, setActiveBranch] = useState(() => localStorage.getItem('lokmanya_active_branch') || 'Branch 1');
  const [isArchiveUnlocked, setIsArchiveUnlocked] = useState(false);
  const [archivePinInput, setArchivePinInput] = useState('');
  const [devKeyInput, setDevKeyInput] = useState('');
  const [newArchivePinInput, setNewArchivePinInput] = useState('');
  const [shortTermDays, setShortTermDays] = useState('10');
  const [shortTermMeals, setShortTermMeals] = useState('2');`;

if (content.includes(stateDeclarationsTarget)) {
  content = content.replace(stateDeclarationsTarget, stateDeclarationsReplacement);
}

// 3. Update getCustomerDues to handle Short-Term (days-based ₹80 rate)
const getCustomerDuesTarget = `function getCustomerDues(c) {
  if (!c || !c.joinDate) return 0;
  const daysPerCycle = PLAN_DAYS[c.plan] || 30;`;

const getCustomerDuesReplacement = `function getCustomerDues(c) {
  if (!c) return 0;
  if (c.category === 'shortterm') {
    return Math.max(0, Number(c.amount || 0) - Number(c.deposited || 0));
  }
  if (!c.joinDate) return 0;
  const daysPerCycle = PLAN_DAYS[c.plan] || 30;`;

if (content.includes(getCustomerDuesTarget)) {
  content = content.replace(getCustomerDuesTarget, getCustomerDuesReplacement);
}

// 4. Update filteredCustomers memoization to filter by currentTab (dinein, tiffin, shortterm, oldcustomers), branch, and sort stably
const filteredCustomersTarget = `  // Filtered customer list (sorted with pending dues first, search by Name, Phone, and Aadhar)
  const filteredCustomers = useMemo(() => {
    const list = db.customers.filter(c => {
      const searchLower = custSearch.toLowerCase();
      const matchesName = c.name.toLowerCase().includes(searchLower);
      const matchesPhone = c.phone.includes(custSearch);
      const matchesAadhar = c.aadhar && c.aadhar.includes(custSearch);
      const matchesAddr = c.addr && c.addr.toLowerCase().includes(searchLower);
      return matchesName || matchesPhone || matchesAadhar || matchesAddr;
    });
    return list.sort((a, b) => {
      const duesDiff = getCustomerDues(b) - getCustomerDues(a);
      if (duesDiff !== 0) return duesDiff;
      return b.id.localeCompare(a.id); // Show newer customers first when dues are equal
    });
  }, [db.customers, custSearch]);`;

const filteredCustomersReplacement = `  // Filtered customer list (sorted with pending dues first, filtered by category/branch)
  const filteredCustomers = useMemo(() => {
    let targetCategory = 'dinein';
    if (currentTab === 'tiffin') targetCategory = 'tiffin';
    if (currentTab === 'shortterm') targetCategory = 'shortterm';
    if (currentTab === 'oldcustomers') targetCategory = 'old';

    const list = db.customers.filter(c => {
      // Archive/Status Filter
      if (targetCategory === 'old') {
        if (c.status !== 'old') return false;
      } else {
        if (c.status === 'old') return false;
        const itemCat = c.category || 'dinein';
        if (itemCat !== targetCategory) return false;
      }

      // Branch Filter (ignore branch for old customers archive)
      if (targetCategory !== 'old') {
        const itemBranch = c.branch || 'Branch 1';
        if (itemBranch !== activeBranch) return false;
      }

      const searchLower = custSearch.toLowerCase();
      const matchesName = c.name.toLowerCase().includes(searchLower);
      const matchesPhone = c.phone.includes(custSearch);
      const matchesAadhar = c.aadhar && c.aadhar.includes(custSearch);
      const matchesAddr = c.addr && c.addr.toLowerCase().includes(searchLower);
      return matchesName || matchesPhone || matchesAadhar || matchesAddr;
    });

    return list.sort((a, b) => {
      const duesDiff = getCustomerDues(b) - getCustomerDues(a);
      if (duesDiff !== 0) return duesDiff;
      return b.id.localeCompare(a.id); // Show newer customers first when dues are equal
    });
  }, [db.customers, custSearch, currentTab, activeBranch]);`;

if (content.includes(filteredCustomersTarget)) {
  content = content.replace(filteredCustomersTarget, filteredCustomersReplacement);
}

// 5. Update openAddCust to reset fields based on active tab
const openAddCustTarget = `  const openAddCust = () => {
    setEditCustId(null);
    setCustForm({
      name: '',
      phone: '',
      aadhar: '',
      plan: 'Monthly',
      amount: '1500',
      deposited: '0',
      joinDate: todayStr(),
      addr: '',
      photo: ''
    });
    setCustModal(true);
  };`;

const openAddCustReplacement = `  const openAddCust = () => {
    setEditCustId(null);
    if (currentTab === 'shortterm') {
      setShortTermDays('10');
      setShortTermMeals('2');
      setCustForm({
        name: '',
        phone: '',
        aadhar: '',
        plan: 'Short-Term',
        amount: String(10 * 2 * 80),
        deposited: '0',
        joinDate: todayStr(),
        addr: '',
        photo: ''
      });
    } else {
      setCustForm({
        name: '',
        phone: '',
        aadhar: '',
        plan: 'Monthly',
        amount: '1500',
        deposited: '0',
        joinDate: todayStr(),
        addr: '',
        photo: ''
      });
    }
    setCustModal(true);
  };`;

if (content.includes(openAddCustTarget)) {
  content = content.replace(openAddCustTarget, openAddCustReplacement);
}

// 6. Update saveCustomer to auto-inject category and branch
const saveCustomerTarget = `    const newCust = { ...finalForm, id: 'cust_' + Date.now(), amount: Number(finalForm.amount), deposited: Number(finalForm.deposited) || 0 };
    updatedCustomers = [...db.customers, newCust];`;

const saveCustomerReplacement = `    const targetCategory = currentTab === 'tiffin' ? 'tiffin' : currentTab === 'shortterm' ? 'shortterm' : 'dinein';
    const newCust = { 
      ...finalForm, 
      id: 'cust_' + Date.now(), 
      amount: Number(finalForm.amount), 
      deposited: Number(finalForm.deposited) || 0,
      category: targetCategory,
      branch: activeBranch,
      status: 'active'
    };
    if (currentTab === 'shortterm') {
      newCust.shortTermDays = Number(shortTermDays);
      newCust.shortTermMeals = Number(shortTermMeals);
    }
    updatedCustomers = [...db.customers, newCust];`;

if (content.includes(saveCustomerTarget)) {
  content = content.replace(saveCustomerTarget, saveCustomerReplacement);
}

// 7. Update editCustomer to set forms
const editCustTarget = `  const editCustomer = (c) => {
    setEditCustId(c.id);
    setCustForm({
      name: c.name,
      phone: c.phone,
      aadhar: c.aadhar || '',
      plan: c.plan,
      amount: String(c.amount),
      deposited: String(c.deposited),
      joinDate: c.joinDate,
      addr: c.addr || '',
      photo: c.photo || ''
    });
    setCustModal(true);
  };`;

const editCustReplacement = `  const editCustomer = (c) => {
    setEditCustId(c.id);
    if (c.category === 'shortterm') {
      setShortTermDays(String(c.shortTermDays || '10'));
      setShortTermMeals(String(c.shortTermMeals || '2'));
    }
    setCustForm({
      name: c.name,
      phone: c.phone,
      aadhar: c.aadhar || '',
      plan: c.plan,
      amount: String(c.amount),
      deposited: String(c.deposited),
      joinDate: c.joinDate,
      addr: c.addr || '',
      photo: c.photo || ''
    });
    setCustModal(true);
  };`;

if (content.includes(editCustTarget)) {
  content = content.replace(editCustTarget, editCustReplacement);
}

// 8. Update deleteCustomer to move customer to Old Customers archive
const deleteCustTarget = `  const deleteCustomer = (id) => {
    if (confirm(db.settings.lang === 'mr' ? 'तुम्हाला खात्री आहे की तुम्ही हा ग्राहक हटवू इच्छिता?' : 'Are you sure you want to delete this customer?')) {
      const updated = db.customers.filter(c => c.id !== id);
      const updatedTxns = db.transactions.filter(t => t.custId !== id);
      saveDb({ ...db, customers: updated, transactions: updatedTxns });
      showToast(db.settings.lang === 'mr' ? 'ग्राहक यशस्वीरित्या हटवला!' : 'Customer deleted successfully!', 'success');
    }
  };`;

const deleteCustReplacement = `  const deleteCustomer = (id) => {
    if (confirm(db.settings.lang === 'mr' ? 'तुम्हाला खात्री आहे की तुम्ही हा ग्राहक जुन्या ग्राहकांच्या संग्रहात हलवू इच्छिता?' : 'Are you sure you want to move this customer to the archive?')) {
      const updated = db.customers.map(c => {
        if (c.id === id) {
          return { ...c, status: 'old' };
        }
        return c;
      });
      saveDb({ ...db, customers: updated });
      showToast(db.settings.lang === 'mr' ? 'ग्राहक संग्रहात (Old Customers) हलवला!' : 'Customer moved to Old Customers archive!', 'success');
    }
  };`;

if (content.includes(deleteCustTarget)) {
  content = content.replace(deleteCustTarget, deleteCustReplacement);
}

// 9. Update Sidebar UI
const sidebarTarget = `        <div className="sidebar-menu">
          <div
            className={\`sidebar-item \${currentTab === 'dashboard' ? 'active' : ''}\`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            {t('dashboard')}
          </div>
          <div
            className={\`sidebar-item \${currentTab === 'customers' ? 'active' : ''}\`}
            onClick={() => setCurrentTab('customers')}
          >
            <Users size={18} />
            {t('customers')}
          </div>`;

const sidebarReplacement = `        <div className="sidebar-menu">
          <div
            className={\`sidebar-item \${currentTab === 'dashboard' ? 'active' : ''}\`}
            onClick={() => {
              setCurrentTab('dashboard');
              setIsArchiveUnlocked(false);
            }}
          >
            <LayoutDashboard size={18} />
            {t('dashboard')}
          </div>
          <div
            className={\`sidebar-item \${currentTab === 'customers' ? 'active' : ''}\`}
            onClick={() => {
              setCurrentTab('customers');
              setIsArchiveUnlocked(false);
            }}
          >
            <Users size={18} />
            {t('customers')}
          </div>
          <div
            className={\`sidebar-item \${currentTab === 'tiffin' ? 'active' : ''}\`}
            onClick={() => {
              setCurrentTab('tiffin');
              setIsArchiveUnlocked(false);
            }}
          >
            <ClipboardList size={18} />
            {t('tiffin')}
          </div>
          <div
            className={\`sidebar-item \${currentTab === 'shortterm' ? 'active' : ''}\`}
            onClick={() => {
              setCurrentTab('shortterm');
              setIsArchiveUnlocked(false);
            }}
          >
            <DollarSign size={18} />
            {t('shortterm')}
          </div>
          <div
            className={\`sidebar-item \${currentTab === 'oldcustomers' ? 'active' : ''}\`}
            onClick={() => {
              setCurrentTab('oldcustomers');
            }}
          >
            <History size={18} />
            {t('oldcustomers')}
          </div>`;

if (content.includes(sidebarTarget)) {
  content = content.replace(sidebarTarget, sidebarReplacement);
}

// 10. Update header title logic
const headerTitleTarget = `            {currentTab === 'dashboard' && t('businessDashboard')}
            {currentTab === 'customers' && t('manageCustomers')}

            {currentTab === 'settings' && t('appSettings')}`;

const headerTitleReplacement = `            {currentTab === 'dashboard' && t('businessDashboard')}
            {currentTab === 'customers' && t('manageCustomers')}
            {currentTab === 'tiffin' && t('manageTiffin')}
            {currentTab === 'shortterm' && t('manageShortTerm')}
            {currentTab === 'oldcustomers' && t('manageOldCustomers')}
            {currentTab === 'settings' && t('appSettings')}`;

if (content.includes(headerTitleTarget)) {
  content = content.replace(headerTitleTarget, headerTitleReplacement);
}

fs.writeFileSync(appFile, content, 'utf8');
console.log('Finished updating translations, state, and sidebar layout inside App.jsx');

