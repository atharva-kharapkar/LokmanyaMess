import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  Bell,
  Search,
  Plus,
  Trash2,
  Edit,
  Download,
  LogOut,
  AlertTriangle,
  X,
  FileSpreadsheet,
  DollarSign,
  History,
  Eye,
  EyeOff,
  RotateCcw,
  Coins,
  TrendingUp
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, query, limit } from 'firebase/firestore';
import { db as firestoreDb } from './firebase';

const isElectron = typeof window !== 'undefined' && window.electronAPI;

// Utility functions
const todayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalYYYYMMDD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PLAN_DAYS = { Monthly: 30, Weekly: 7, Daily: 1, Custom: 30 };

function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

function getExpiryDate(joinDate, plan) {
  const startDate = parseLocalDate(joinDate);
  const daysPerCycle = PLAN_DAYS[plan] || 30;
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const elapsedTime = todayMidnight - startDate;
  const elapsedDays = Math.round(elapsedTime / 86400000);
  
  let elapsedCycles = 0;
  if (elapsedDays > 0) {
    elapsedCycles = Math.floor(elapsedDays / daysPerCycle);
  }
  
  const currentCycleExpiry = new Date(startDate);
  currentCycleExpiry.setDate(startDate.getDate() + (elapsedCycles + 1) * daysPerCycle);
  return currentCycleExpiry;
}

function getExpiryDays(joinDate, plan) {
  if (!joinDate) return 0;
  const expiryDate = getExpiryDate(joinDate, plan);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = expiryDate - todayMidnight;
  return Math.round(diffTime / 86400000);
}

function expiryStr(joinDate, plan) {
  if (!joinDate) return '';
  const d = getExpiryDate(joinDate, plan);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}



// Translations Map
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
    collections: "Collections",
    expenses: "Expenses",
    oldcustomers: "Old Customers",
    settings: "Settings",
    logout: "Logout",
    
    // Header
    businessDashboard: "Business Dashboard",
    manageCustomers: "Manage Dine-in Members",
    manageTiffin: "Manage Tiffin Delivery",
    manageShortTerm: "Manage Short-Term Members",
    manageCollections: "Collection Reports",
    manageExpenses: "Expenditure Tracker",
    manageOldCustomers: "Archive (Old Customers)",
    appSettings: "App Settings",
    
    // Dashboard
    totalCollections: "Total Collections",
    activeMembers: "Active Members",
    expiringSoon: "Expiring Soon",
    pendingDues: "Pending Dues",
    expiringExpired: "Action Required (Expired, Expiring, or Pending Dues)",
    allActive: "All subscriptions are currently active!",
    
    // Customer headers
    custName: "Customer Name",
    phoneNo: "Phone Number",
    plan: "Plan",
    amount: "Amount",
    status: "Status",
    expiryDate: "Expiry Date",
    
    // Registry toolbar
    addCustomer: "Add Customer",
    exportCsv: "Export CSV",
    searchPlaceholder: "Search customers...",
    filterAll: "All Customers",
    filterActive: "Active Only",
    filterExpired: "Expired Only",
    filterExpiring: "Expiring Soon",
    noCusts: "No customer records found.",
    
    // Customer card details
    planCycle: "Plan & Cycle",
    planSuffix: "Plan",
    started: "Started",
    expires: "Expires",
    fee: "Subscription Fee",
    deposited: "Deposited",
    remaining: "Remaining Amount",
    duesPending: "Dues Pending",
    fullyPaid: "Fully Paid",
    editProfile: "Edit Profile",
    deleteCust: "Delete Customer",
    
    // Customer Modal
    addNewCust: "Add New Customer",
    editCustProfile: "Edit Customer Profile",
    fullName: "Full Name *",
    aadharCard: "Aadhar Card No.",
    billingPlan: "Billing Plan",
    monthly30: "Monthly (30 days)",
    weekly7: "Weekly (7 days)",
    daily1: "Daily (1 day)",
    custom: "Custom",
    subFeeLabel: "Subscription Fee (Rs) *",
    depositLabel: "Total Amount Deposited / Paid (Rs) *",
    joinDateLabel: "Joining Date *",
    addressLabel: "Address / Room Details",
    addressPlaceholder: "e.g. Room 104, B wing",
    cancel: "Cancel",
    saveProfile: "Save Profile",
    takePhoto: "Take Photo",
    uploadPhoto: "Upload Photo",
    removePhoto: "Remove Photo",
    capture: "Capture"
  },
  mr: {
    // PIN screen
    pinTitle: "लोकमान्य मेस",
    pinSubtitle: "सिस्टममध्ये प्रवेश करण्यासाठी पिन प्रविष्ट करा",
    pinError: "चुकीचा पिन! कृपया पुन्हा प्रयत्न करा.",
    
    // Sidebar
    dashboard: "डॅशबोर्ड",
    customers: "डाईन-इन ग्राहक",
    tiffin: "टिफिन डिलिव्हरी",
    shortterm: "अल्पमुदत ग्राहक",
    collections: "जमा रक्कम",
    expenses: "खर्च व्यवस्थापन",
    oldcustomers: "जुने ग्राहक (संग्रह)",
    settings: "सेटिंग्ज",
    logout: "लॉगआउट",
    
    // Header
    businessDashboard: "व्यवसाय डॅशबोर्ड",
    manageCustomers: "डाईन-इन ग्राहक व्यवस्थापित करा",
    manageTiffin: "टिफिन डिलिव्हरी व्यवस्थापित करा",
    manageShortTerm: "अल्पमुदत ग्राहक व्यवस्थापित करा",
    manageCollections: "जमा रक्कम इतिहास",
    manageExpenses: "खर्च ट्रॅकर",
    manageOldCustomers: "जुने ग्राहक इतिहास",
    appSettings: "ॲप सेटिंग्ज",
    
    // Dashboard
    totalCollections: "एकूण जमा",
    activeMembers: "सक्रिय ग्राहक",
    expiringSoon: "लवकरच संपणारे",
    pendingDues: "थकीत रक्कम",
    expiringExpired: "लक्ष देणे आवश्यक (मुदत संपलेले, लवकरच संपणारे किंवा थकीत रक्कम)",
    allActive: "सर्व ग्राहकांचे प्लॅन्स सध्या सक्रिय आहेत!",
    
    // Customer headers
    custName: "ग्राहकाचे नाव",
    phoneNo: "फोन नंबर",
    plan: "प्लॅन",
    amount: "रक्कम",
    status: "स्थिती",
    expiryDate: "मुदत समाप्ती तारीख",
    
    // Registry toolbar
    addCustomer: "नवीन ग्राहक जोडा",
    exportCsv: "CSV एक्सपोर्ट करा",
    searchPlaceholder: "शोध ग्राहक...",
    filterAll: "सर्व ग्राहक",
    filterActive: "फक्त सक्रिय",
    filterExpired: "फक्त मुदत संपलेले",
    filterExpiring: "लवकरच संपणारे",
    noCusts: "कोणताही ग्राहक आढळला नाही.",
    
    // Customer card details
    planCycle: "प्लॅन आणि सायकल",
    planSuffix: "प्लॅन",
    started: "सुरू झाले",
    expires: "संपणार",
    fee: "प्लॅन शुल्क",
    deposited: "जमा रक्कम",
    remaining: "थकीत रक्कम",
    duesPending: "बाकी आहे",
    fullyPaid: "पूर्ण भरले",
    editProfile: "प्रोफाइल बदला",
    deleteCust: "ग्राहक हटवा",
    
    // Customer Modal
    addNewCust: "नवीन ग्राहक जोडा",
    editCustProfile: "ग्राहक प्रोफाइल बदला",
    fullName: "पूर्ण नाव *",
    aadharCard: "आधार कार्ड नंबर",
    billingPlan: "बिलिंग प्लॅन",
    monthly30: "मासिक (३० दिवस)",
    weekly7: "साप्ताहिक (७ दिवस)",
    daily1: "दैनिक (१ दिवस)",
    custom: "इतर (कस्टम)",
    subFeeLabel: "प्लॅन फी (रुपये) *",
    depositLabel: "एकूण जमा रक्कम (रुपये) *",
    joinDateLabel: "सुरू झालेली तारीख *",
    addressLabel: "पत्ता / रूम तपशील",
    addressPlaceholder: "उदा. रूम १०४, बी विंग",
    cancel: "रद्द करा",
    saveProfile: "प्रोफाइल जतन करा",
    takePhoto: "फोटो काढा",
    uploadPhoto: "फोटो अपलोड करा",
    removePhoto: "फोटो काढा",
    capture: "फोटो घ्या"
  }
};

function getCustomerDues(c) {
  if (!c) return 0;
  if (c.category === 'shortterm') {
    return Math.max(0, Number(c.amount || 0) - Number(c.deposited || 0));
  }
  if (!c.joinDate) return 0;
  const daysPerCycle = PLAN_DAYS[c.plan] || 30;
  const startDate = parseLocalDate(c.joinDate);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const elapsedTime = todayMidnight - startDate;
  const elapsedDays = Math.round(elapsedTime / 86400000);
  
  let elapsedCycles = 0;
  if (elapsedDays > 0) {
    elapsedCycles = Math.floor(elapsedDays / daysPerCycle);
  }
  
  const totalCyclesEntered = elapsedCycles + 1;
  const totalOwed = totalCyclesEntered * c.amount;
  return Math.max(0, totalOwed - (c.deposited || 0));
}

function computeStatus(c) {
  if (!c || !c.joinDate) return 'expired';
  
  const daysPerCycle = PLAN_DAYS[c.plan] || 30;
  const startDate = parseLocalDate(c.joinDate);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const elapsedTime = todayMidnight - startDate;
  const elapsedDays = Math.round(elapsedTime / 86400000);
  
  let elapsedCycles = 0;
  if (elapsedDays > 0) {
    elapsedCycles = Math.floor(elapsedDays / daysPerCycle);
  }
  
  const completedCyclesAmount = elapsedCycles * c.amount;
  const hasPaidPastCycles = (c.deposited || 0) >= completedCyclesAmount;
  
  if (!hasPaidPastCycles) {
    return 'expired';
  }
  
  const currentCycleExpiry = new Date(startDate);
  currentCycleExpiry.setDate(startDate.getDate() + (elapsedCycles + 1) * daysPerCycle);
  const diffTime = currentCycleExpiry - todayMidnight;
  const days = Math.round(diffTime / 86400000);
  
  if (days <= 0) return 'expired';
  
  let expiringThreshold = 3;
  if (c.plan === 'Daily') {
    expiringThreshold = 0;
  } else if (c.plan === 'Weekly') {
    expiringThreshold = 1;
  }
  
  if (days <= expiringThreshold) return 'expiring';
  return 'active';
}

function getDueWarningDays(c) {
  if (!c || !c.joinDate || c.category === 'shortterm' || c.status === 'old') return 0;

  const remaining = getCustomerDues(c);
  if (remaining <= 0) return 0;

  const daysPerCycle = PLAN_DAYS[c.plan] || 30;
  const startDate = parseLocalDate(c.joinDate);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const elapsedTime = todayMidnight - startDate;
  const elapsedDays = Math.round(elapsedTime / 86400000);
  const cycleDay = elapsedDays % daysPerCycle;

  return cycleDay >= 6 ? cycleDay : 0;
}

export default function App() {
  // Database states
  const [db, setDb] = useState({
    customers: [],
    employees: [],
    transactions: [],
    salaries: [],
    expenses: [],
    settings: {
      lang: 'en',
      upiId: '',
      ownerPin: '', // requires initial setup
      messName: 'Lokmanya Mess',
      ownerName: 'Mess Owner',
      whatsappReceiptTemplate: 'Dear [Name], we received your payment of ₹[Amount] on [Date]. Thank you! - [MessName]',
      whatsappDuesTemplate: 'Dear [Name], your plan is expiring soon. Pending dues: ₹[Dues]. Please pay: [UpiLink] - [MessName]'
    }
  });

  // Authentication & Screen states
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('lokmanya_remember_pin') === 'true';
  });
  const [rememberPin, setRememberPin] = useState(() => {
    return localStorage.getItem('lokmanya_remember_pin') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinPad, setShowPinPad] = useState(true);
  const [introPlayed, setIntroPlayed] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [newPinInput, setNewPinInput] = useState('');
  const [showSettingsPin, setShowSettingsPin] = useState(false);
  const [role, setRole] = useState(() => {
    return localStorage.getItem('lokmanya_user_role') || 'owner';
  });
  const [newBranch1PinInput, setNewBranch1PinInput] = useState('');
  const [newBranch2PinInput, setNewBranch2PinInput] = useState('');

  const [toast, setToast] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [messNameInput, setMessNameInput] = useState('');
  const [ownerNameInput, setOwnerNameInput] = useState('');
  const [activeBranch, setActiveBranch] = useState(() => localStorage.getItem('lokmanya_active_branch') || 'Branch 1');
  const [isArchiveUnlocked, setIsArchiveUnlocked] = useState(false);
  const [archivePinInput, setArchivePinInput] = useState('');
  const [devKeyInput, setDevKeyInput] = useState('');
  const [newArchivePinInput, setNewArchivePinInput] = useState('');
  const [shortTermDays, setShortTermDays] = useState('10');
  const [shortTermMeals, setShortTermMeals] = useState('2');

  const [expenseForm, setExpenseForm] = useState({ amount: '', note: '' });
  const [expenseFilter, setExpenseFilter] = useState('today');
  const [expStartDate, setExpStartDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [expEndDate, setExpEndDate] = useState(todayStr);
  const [isExpenseArchiveUnlocked, setIsExpenseArchiveUnlocked] = useState(false);
  const [expenseArchivePinInput, setExpenseArchivePinInput] = useState('');

  const [collectionFilter, setCollectionFilter] = useState('today');
  const [colStartDate, setColStartDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [colEndDate, setColEndDate] = useState(todayStr);
  const [isCollectionArchiveUnlocked, setIsCollectionArchiveUnlocked] = useState(false);
  const [collectionArchivePinInput, setCollectionArchivePinInput] = useState('');

  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [showCalculator, setShowCalculator] = useState(() => localStorage.getItem('lokmanya_show_calculator') !== 'false');

  const currentTabRef = useRef(currentTab);
  const showCalculatorRef = useRef(showCalculator);

  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  useEffect(() => {
    showCalculatorRef.current = showCalculator;
  }, [showCalculator]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Global renderer-side error handlers to prevent uncaught errors from breaking the UI
  useEffect(() => {
    const onError = (event) => {
      console.error('Renderer error:', event.error || event.message || event);
      showToast(db.settings && db.settings.lang === 'mr' ? 'अनपेक्षित त्रुटी आली' : 'An unexpected error occurred', 'error');
    };
    const onRejection = (event) => {
      console.error('Unhandled rejection in renderer:', event.reason || event);
      showToast(db.settings && db.settings.lang === 'mr' ? 'अनपेक्षित वचन त्रुटी' : 'An unexpected promise rejection occurred', 'error');
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [db.settings]);

  // First-run flow: if Owner PIN is not configured, show an in-app modal to set it
  const [firstRunPrompted, setFirstRunPrompted] = useState(false);
  const [firstRunModalVisible, setFirstRunModalVisible] = useState(false);
  const [firstRunPinInput, setFirstRunPinInput] = useState('');
  const [firstRunPinError, setFirstRunPinError] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (!settingsLoaded) return;
    if (firstRunPrompted) return;
    if (!db || !db.settings) return;
    const ownerPin = db.settings.ownerPin;
    const requireSetup = db.settings.requireSetup;
    if ((!ownerPin || ownerPin === '') && (requireSetup !== false)) {
      setFirstRunPrompted(true);
      setFirstRunModalVisible(true);
    }
  }, [db, firstRunPrompted, settingsLoaded]);

  const handleFirstRunSave = async () => {
    const cleaned = String(firstRunPinInput).replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setFirstRunPinError('PIN must be exactly 6 digits');
      return;
    }
    const newSettings = { ...db.settings, ownerPin: cleaned };
    if (newSettings.requireSetup) delete newSettings.requireSetup;
    await saveDb({ ...db, settings: newSettings });
    setFirstRunModalVisible(false);
    showToast(db.settings.lang === 'mr' ? 'पिन सेट केला गेला!' : 'Owner PIN set successfully!', 'success');
  };

  const handleFirstRunCancel = () => {
    setFirstRunModalVisible(false);
    setCurrentTab('settings');
    showToast(db.settings.lang === 'mr' ? 'कृपया सेटिंग्जमध्ये PIN सेट करा.' : 'Please set the PIN in Settings to continue.', 'error');
  };




  // Load database and setup Firebase real-time listeners on mount
  useEffect(() => {
    // 1. Setup real-time listeners immediately for instant UI load (offline-first)
    const unsubCustomers = onSnapshot(collection(firestoreDb, 'desktop_customers'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.customers) === JSON.stringify(list)) return prev;
        return { ...prev, customers: list };
      });
    });

    const unsubTxns = onSnapshot(collection(firestoreDb, 'desktop_transactions'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.transactions) === JSON.stringify(list)) return prev;
        return { ...prev, transactions: list };
      });
    });

    const unsubEmployees = onSnapshot(collection(firestoreDb, 'desktop_employees'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.employees) === JSON.stringify(list)) return prev;
        return { ...prev, employees: list };
      });
    });

    const unsubSalaries = onSnapshot(collection(firestoreDb, 'desktop_salaries'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.salaries) === JSON.stringify(list)) return prev;
        return { ...prev, salaries: list };
      });
    });

    const unsubSettings = onSnapshot(doc(firestoreDb, 'desktop_config', 'app_settings'), (snapshot) => {
      if (snapshot.exists()) {
        const settingsData = snapshot.data();
        setDb(prev => {
          if (JSON.stringify(prev.settings) === JSON.stringify(settingsData)) return prev;
          return { ...prev, settings: settingsData };
        });
        setNewPinInput(settingsData.ownerPin || '');
        setNewBranch1PinInput(settingsData.branch1Pin || '');
        setNewBranch2PinInput(settingsData.branch2Pin || '');
        setMessNameInput(settingsData.messName || 'Lokmanya Mess');
        setOwnerNameInput(settingsData.ownerName || 'Mess Owner');
        setSettingsLoaded(true);
      }
    });

    const unsubExpenses = onSnapshot(collection(firestoreDb, 'desktop_expenses'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.expenses) === JSON.stringify(list)) return prev;
        return { ...prev, expenses: list };
      });
    });

    // 2. Perform local-to-cloud data migration asynchronously in the background (only if online & not done yet)
    async function migrateLocalToCloudIfNeeded() {
      if (!navigator.onLine) {
        console.log('Device is offline. Skipping cloud migration checks.');
        return;
      }
      if (localStorage.getItem('lokmanya_migration_done_desktop_v1') === 'true') {
        return;
      }

      try {
        let localData = null;
        if (isElectron) {
          localData = await window.electronAPI.readDatabase();
        } else {
          const local = localStorage.getItem('lokmanya_db');
          if (local) localData = JSON.parse(local);
        }

        if (localData && localData.customers && localData.customers.length > 0) {
          const q = query(collection(firestoreDb, 'desktop_customers'), limit(1));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            console.log('Cloud database is empty. Migrating local records to cloud in the background...');
            // Migrate settings
            if (localData.settings) {
              await setDoc(doc(firestoreDb, 'desktop_config', 'app_settings'), localData.settings);
            }
            // Migrate customers
            for (const c of localData.customers) {
              await setDoc(doc(firestoreDb, 'desktop_customers', c.id), c);
            }
            // Migrate transactions
            if (localData.transactions) {
              for (const t of localData.transactions) {
                await setDoc(doc(firestoreDb, 'desktop_transactions', t.id), t);
              }
            }
            // Migrate employees
            if (localData.employees) {
              for (const emp of localData.employees) {
                await setDoc(doc(firestoreDb, 'desktop_employees', emp.id), emp);
              }
            }
            // Migrate salaries
            if (localData.salaries) {
              for (const sal of localData.salaries) {
                await setDoc(doc(firestoreDb, 'desktop_salaries', sal.id), sal);
              }
            }
            console.log('Migration completed successfully in background!');
          }
        }
        localStorage.setItem('lokmanya_migration_done_desktop_v1', 'true');
      } catch (err) {
        console.error('Error during local-to-cloud migration:', err);
      }
    }

    migrateLocalToCloudIfNeeded();

    // Clean up real-time snapshot listeners on unmount
    return () => {
      unsubCustomers();
      unsubTxns();
      unsubEmployees();
      unsubSalaries();
      unsubSettings();
      unsubExpenses();
    };
  }, []);

  const saveDb = async (newDb) => {
    // 1. Update React state immediately for instant UI responsiveness
    const oldDb = db;
    setDb(newDb);

    // 2. Save local file backup
    if (isElectron) {
      window.electronAPI.writeDatabase(newDb);
    } else {
      localStorage.setItem('lokmanya_db', JSON.stringify(newDb));
    }

    // 3. Write individual differences to Firebase Firestore collections in the background
    try {
      // Sync settings / config
      if (JSON.stringify(oldDb.settings) !== JSON.stringify(newDb.settings)) {
        await setDoc(doc(firestoreDb, 'desktop_config', 'app_settings'), newDb.settings);
      }

      // Sync customers array
      if (JSON.stringify(oldDb.customers) !== JSON.stringify(newDb.customers)) {
        const oldMap = new Map(oldDb.customers.map(c => [c.id, c]));
        const newMap = new Map(newDb.customers.map(c => [c.id, c]));
        // Add or Update
        for (const c of newDb.customers) {
          const oldC = oldMap.get(c.id);
          if (!oldC || JSON.stringify(oldC) !== JSON.stringify(c)) {
            await setDoc(doc(firestoreDb, 'desktop_customers', c.id), c);
          }
        }
        // Delete
        for (const c of oldDb.customers) {
          if (!newMap.has(c.id)) {
            await deleteDoc(doc(firestoreDb, 'desktop_customers', c.id));
          }
        }
      }

      // Sync transactions array
      if (JSON.stringify(oldDb.transactions) !== JSON.stringify(newDb.transactions)) {
        const oldMap = new Map(oldDb.transactions.map(t => [t.id, t]));
        const newMap = new Map(newDb.transactions.map(t => [t.id, t]));
        // Add or Update
        for (const t of newDb.transactions) {
          const oldT = oldMap.get(t.id);
          if (!oldT || JSON.stringify(oldT) !== JSON.stringify(t)) {
            await setDoc(doc(firestoreDb, 'desktop_transactions', t.id), t);
          }
        }
        // Delete
        for (const t of oldDb.transactions) {
          if (!newMap.has(t.id)) {
            await deleteDoc(doc(firestoreDb, 'desktop_transactions', t.id));
          }
        }
      }

      // Sync employees array
      if (JSON.stringify(oldDb.employees) !== JSON.stringify(newDb.employees)) {
        const oldMap = new Map(oldDb.employees.map(e => [e.id, e]));
        const newMap = new Map(newDb.employees.map(e => [e.id, e]));
        // Add or Update
        for (const e of newDb.employees) {
          const oldE = oldMap.get(e.id);
          if (!oldE || JSON.stringify(oldE) !== JSON.stringify(e)) {
            await setDoc(doc(firestoreDb, 'desktop_employees', e.id), e);
          }
        }
        // Delete
        for (const e of oldDb.employees) {
          if (!newMap.has(e.id)) {
            await deleteDoc(doc(firestoreDb, 'desktop_employees', e.id));
          }
        }
      }

      // Sync salaries array
      if (JSON.stringify(oldDb.salaries) !== JSON.stringify(newDb.salaries)) {
        const oldMap = new Map(oldDb.salaries.map(s => [s.id, s]));
        const newMap = new Map(newDb.salaries.map(s => [s.id, s]));
        // Add or Update
        for (const s of newDb.salaries) {
          const oldS = oldMap.get(s.id);
          if (!oldS || JSON.stringify(oldS) !== JSON.stringify(s)) {
            await setDoc(doc(firestoreDb, 'desktop_salaries', s.id), s);
          }
        }
        // Delete
        for (const s of oldDb.salaries) {
          if (!newMap.has(s.id)) {
            await deleteDoc(doc(firestoreDb, 'desktop_salaries', s.id));
          }
        }
      }

      // Sync expenses array
      if (JSON.stringify(oldDb.expenses) !== JSON.stringify(newDb.expenses)) {
        const oldMap = new Map((oldDb.expenses || []).map(e => [e.id, e]));
        const newMap = new Map((newDb.expenses || []).map(e => [e.id, e]));
        // Add or Update
        for (const e of (newDb.expenses || [])) {
          const oldE = oldMap.get(e.id);
          if (!oldE || JSON.stringify(oldE) !== JSON.stringify(e)) {
            await setDoc(doc(firestoreDb, 'desktop_expenses', e.id), e);
          }
        }
        // Delete
        for (const e of (oldDb.expenses || [])) {
          if (!newMap.has(e.id)) {
            await deleteDoc(doc(firestoreDb, 'desktop_expenses', e.id));
          }
        }
      }
    } catch (err) {
      console.error('Error syncing changes to Firebase Firestore:', err);
    }
  };



  const handleLogout = () => {
    localStorage.removeItem('lokmanya_remember_pin');
    localStorage.removeItem('lokmanya_user_role');
    setRememberPin(false);
    setIsLoggedIn(false);
    setPinInput('');
  };

  const handlePinSubmit = (e) => {
    if (e) e.preventDefault();
    const isMarathi = db.settings && db.settings.lang === 'mr';
    
    // If owner PIN not configured, force the user to open settings and set it up first
    if (!db.settings || !db.settings.ownerPin) {
      showToast(isMarathi ? 'कृपया प्रथम सेटिंग्जमध्ये मालक PIN सेट करा.' : 'Please set the Owner PIN in Settings before logging in.', 'error');
      setCurrentTab('settings');
      return;
    }

    // 1. Owner Master PIN Check
    if (pinInput === db.settings.ownerPin) {
      setIsLoggedIn(true);
      setRole('owner');
      localStorage.setItem('lokmanya_user_role', 'owner');
      if (rememberPin) {
        localStorage.setItem('lokmanya_remember_pin', 'true');
      } else {
        localStorage.removeItem('lokmanya_remember_pin');
      }
      setPinInput('');
      setPinError('');
      showToast(isMarathi ? 'मालक म्हणून यशस्वी लॉगिन!' : 'Logged in successfully as Owner!', 'success');
      return;
    }

    // 2. Branch 1 PIN Check
    if (db.settings.branch1Pin && pinInput === db.settings.branch1Pin) {
      setIsLoggedIn(true);
      setRole('branch_staff');
      localStorage.setItem('lokmanya_user_role', 'branch_staff');
      setActiveBranch('Branch 1');
      localStorage.setItem('lokmanya_active_branch', 'Branch 1');
      if (rememberPin) {
        localStorage.setItem('lokmanya_remember_pin', 'true');
      } else {
        localStorage.removeItem('lokmanya_remember_pin');
      }
      setPinInput('');
      setPinError('');
      showToast(isMarathi ? 'शाखा १ मध्ये यशस्वी लॉगिन!' : 'Logged in successfully to Branch 1!', 'success');
      return;
    }

    // 3. Branch 2 PIN Check
    if (db.settings.branch2Pin && pinInput === db.settings.branch2Pin) {
      setIsLoggedIn(true);
      setRole('branch_staff');
      localStorage.setItem('lokmanya_user_role', 'branch_staff');
      setActiveBranch('Branch 2');
      localStorage.setItem('lokmanya_active_branch', 'Branch 2');
      if (rememberPin) {
        localStorage.setItem('lokmanya_remember_pin', 'true');
      } else {
        localStorage.removeItem('lokmanya_remember_pin');
      }
      setPinInput('');
      setPinError('');
      showToast(isMarathi ? 'शाखा २ मध्ये यशस्वी लॉगिन!' : 'Logged in successfully to Branch 2!', 'success');
      return;
    }

    // Invalid PIN
    setPinError(t('pinError'));
    setPinInput('');
  };

  // Handle intro logo video timer
  useEffect(() => {
    if (!isLoggedIn) {
      if (introPlayed) {
        setShowPinPad(true);
      } else {
        setShowPinPad(false);
        const timer = setTimeout(() => {
          setShowPinPad(true);
          setIntroPlayed(true);
        }, 3000); // 3-second delay
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, introPlayed]);

  // Enumerate video devices on mount
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameraDevices(videoDevices);
      } catch (err) {
        console.error("Error enumerating devices on mount:", err);
      }
    }
    getDevices();
  }, []);

  // Save calculator visibility setting
  useEffect(() => {
    localStorage.setItem('lokmanya_show_calculator', showCalculator);
  }, [showCalculator]);


  // Modals & form states
  const [custModal, setCustModal] = useState(false);
  const [editCustId, setEditCustId] = useState(null);
  const [custForm, setCustForm] = useState({ name: '', phone: '', aadhar: '', plan: 'Monthly', amount: '1500', deposited: '0', joinDate: todayStr(), addr: '', photo: '' });



  // Search & Filters states
  const [custSearch, setCustSearch] = useState('');
  // Filter dropdown state removed

  // Camera States & Refs
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = React.useRef(null);

  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node && cameraStream) {
      node.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);
      
      const defaultId = videoDevices[0]?.deviceId || '';
      setSelectedCameraId(defaultId);
      
      await initializeStream(defaultId);
    } catch (err) {
      console.error("Error accessing camera devices:", err);
      showToast("Failed to access camera: " + err.message, "error");
      setIsCameraActive(false);
    }
  };

  const initializeStream = async (deviceId) => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error initializing stream:", err);
    }
  };

  const handleCameraChange = async (e) => {
    const devId = e.target.value;
    setSelectedCameraId(devId);
    await initializeStream(devId);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setCustForm(prev => ({ ...prev, photo: dataUrl }));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!custModal) {
      stopCamera();
    }
  }, [custModal]);



  // Payment states and handlers
  const [payModalCustomer, setPayModalCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payNote, setPayNote] = useState('');
  const [historyModalCustomer, setHistoryModalCustomer] = useState(null);
  const [receiptModalCustomer, setReceiptModalCustomer] = useState(null);
  const [receiptModalTxn, setReceiptModalTxn] = useState(null);

  // Bulk WhatsApp Alert states
  const [showBulkSmsModal, setShowBulkSmsModal] = useState(false);
  const [sentCustomers, setSentCustomers] = useState([]);

  const getUpiRedirectUrl = (amount) => {
    const upiId = db.settings.upiId || 'lokmanya@upi';
    const pn = encodeURIComponent(db.settings.messName || 'Lokmanya Mess');
    return `https://atharva-kharapkar.github.io/LokmanyaMess/public/pay/index.html?pa=${upiId}&pn=${pn}&am=${amount}&tn=Mess%20Dues`;
  };

  const getBulkDueCount = () => {
    let targetCategory = 'dinein';
    if (currentTab === 'tiffin') targetCategory = 'tiffin';
    else if (currentTab === 'shortterm') targetCategory = 'shortterm';

    return db.customers.filter(c => {
      const matchesBranch = (c.branch || 'Branch 1') === activeBranch;
      const matchesStatus = c.status !== 'old';
      const itemCat = c.category || 'dinein';
      const matchesCategory = itemCat === targetCategory;
      const hasDues = getCustomerDues(c) > 0;
      return matchesBranch && matchesStatus && matchesCategory && hasDues;
    }).length;
  };

  const getBulkDueCustomers = () => {
    let targetCategory = 'dinein';
    if (currentTab === 'tiffin') targetCategory = 'tiffin';
    else if (currentTab === 'shortterm') targetCategory = 'shortterm';

    return db.customers.filter(c => {
      const matchesBranch = (c.branch || 'Branch 1') === activeBranch;
      const matchesStatus = c.status !== 'old';
      const itemCat = c.category || 'dinein';
      const matchesCategory = itemCat === targetCategory;
      const hasDues = getCustomerDues(c) > 0;
      return matchesBranch && matchesStatus && matchesCategory && hasDues;
    });
  };



  const getWhatsAppShareUrl = (phone, message) => {
    let cleanNum = phone.replace(/\D/g, '');
    if (cleanNum.startsWith('91') && cleanNum.length > 10) {
      // already has country code
    } else if (cleanNum.length === 10) {
      cleanNum = '91' + cleanNum;
    }
    return `whatsapp://send?phone=${cleanNum}&text=${encodeURIComponent(message)}`;
  };



  const openPayModal = (customer) => {
    setPayModalCustomer(customer);
    const dues = getCustomerDues(customer);
    setPayAmount(dues > 0 ? dues.toString() : '');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setPayDate(`${yyyy}-${mm}-${dd}`);
    setPayMode('Cash');
    setPayNote('');
  };

  const openHistoryModal = (customer) => {
    setHistoryModalCustomer(customer);
  };

  const handlePaySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!payModalCustomer) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast(db.settings.lang === 'mr' ? 'कृपया वैध रक्कम प्रविष्ट करा.' : 'Please enter a valid amount.', 'error');
      return;
    }

    // Date format validation (must be valid YYYY-MM-DD)
    if (!isValidDate(payDate)) {
      showToast(db.settings.lang === 'mr' ? 'कृपया वैध तारीख प्रविष्ट करा (YYYY-MM-DD).' : 'Please enter a valid date in YYYY-MM-DD format.', 'error');
      return;
    }
    
    const newTxn = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      custId: payModalCustomer.id,
      amount: amt,
      date: payDate,
      paymentMode: payMode,
      note: payNote.trim()
    };

    const updatedCustomers = db.customers.map(c => {
      if (c.id === payModalCustomer.id) {
        return { ...c, deposited: (c.deposited || 0) + amt };
      }
      return c;
    });

    const updatedTxns = [...(db.transactions || []), newTxn];

    await saveDb({
      ...db,
      customers: updatedCustomers,
      transactions: updatedTxns
    });

    showToast(db.settings.lang === 'mr' ? 'पेमेंट यशस्वीरित्या नोंदवले गेले!' : 'Payment recorded successfully!');



    setReceiptModalCustomer(payModalCustomer);
    setReceiptModalTxn(newTxn);

    setPayAmount('');
    setPayDate('');
    setPayMode('Cash');
    setPayNote('');
    setPayModalCustomer(null);
  };

  const handleDeleteTxn = async (txnId, custId, amount) => {
    const confirmDelete = window.confirm(
      db.settings.lang === 'mr' 
        ? 'तुम्हाला नक्की हे पेमेंट रेकॉर्ड डिलीट करायचे आहे का? यामुळे जमा रक्कम कमी होईल.' 
        : 'Are you sure you want to delete this payment record? This will reduce the deposited amount.'
    );
    if (!confirmDelete) return;

    const updatedTxns = db.transactions.filter(t => t.id !== txnId);

    const updatedCustomers = db.customers.map(c => {
      if (c.id === custId) {
        return { ...c, deposited: Math.max(0, (c.deposited || 0) - Number(amount || 0)) };
      }
      return c;
    });

    await saveDb({
      ...db,
      customers: updatedCustomers,
      transactions: updatedTxns
    });
  };

  // Customers handlers
  const openAddCust = () => {
    setEditCustId(null);
    if (currentTab === 'shortterm') {
      setShortTermDays('10');
      setShortTermMeals('2');
      setCustForm({ name: '', phone: '', aadhar: '', plan: 'Short-Term', amount: String(10 * 2 * 80), deposited: '0', joinDate: todayStr(), addr: '', photo: '', category: 'shortterm' });
    } else if (currentTab === 'tiffin') {
      setCustForm({ name: '', phone: '', aadhar: '', plan: 'Monthly', amount: '1500', deposited: '0', joinDate: todayStr(), addr: '', photo: '', category: 'tiffin' });
    } else {
      setCustForm({ name: '', phone: '', aadhar: '', plan: 'Monthly', amount: '1500', deposited: '0', joinDate: todayStr(), addr: '', photo: '', category: 'dinein' });
    }
    setCustModal(true);
  };

  const openEditCust = (c) => {
    setEditCustId(c.id);
    if (c.category === 'shortterm') {
      setShortTermDays(String(c.shortTermDays || '10'));
      setShortTermMeals(String(c.shortTermMeals || '2'));
    }
    setCustForm({ name: c.name, phone: c.phone, aadhar: c.aadhar || '', plan: c.plan, amount: String(c.amount), deposited: String(c.deposited || 0), joinDate: c.joinDate, addr: c.addr || '', photo: c.photo || '', category: c.category || 'dinein' });
    setCustModal(true);
  };

  const saveCustomer = () => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    if (!custForm.name.trim() || !custForm.phone.trim()) {
      showToast(isMarathi ? 'नाव आणि फोन नंबर आवश्यक आहेत.' : 'Name and Phone are required.', 'error');
      return;
    }

    // Convert Devanagari numerals (०-९) to English digits (0-9)
    let phoneInput = custForm.phone;
    const devanagariMap = {
      '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
      '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
    };
    phoneInput = phoneInput.split('').map(char => devanagariMap[char] || char).join('');

    // Clean and validate phone number (extract digits only)
    let digits = phoneInput.replace(/\D/g, '');
    
    // Strip all leading zeros (e.g. 0091... -> 91...)
    while (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    
    // Handle duplicate country codes (e.g. 91919876543210 -> 919876543210)
    if (digits.length === 14 && digits.startsWith('9191')) {
      digits = digits.slice(2);
    }
    
    // Handle country code + leading zero (e.g. 9109876543210 -> 919876543210)
    if (digits.length === 13 && digits.startsWith('910')) {
      digits = '91' + digits.slice(3);
    }

    // Convert 10-digit number to 12-digit (prepend 91)
    if (digits.length === 10) {
      digits = '91' + digits;
    }
    
    // Validate final format (exactly 12 digits starting with 91)
    if (digits.length !== 12 || !digits.startsWith('91')) {
      showToast(
        isMarathi 
          ? 'कृपया वैध १०-अंकी मोबाईल नंबर प्रविष्ट करा (उदा. +९१९८७६५४३२१० किंवा ९८७६५४३२१०).' 
          : 'Phone number must be a valid 10-digit number (e.g. +919876543210 or 9876543210).', 
        'error'
      );
      return;
    }
    
    const cleanPhone = '+' + digits;

    // Aadhar Card validation: if provided, must be exactly 12 digits
    if (custForm.aadhar && custForm.aadhar.trim()) {
      const aadharClean = custForm.aadhar.replace(/\D/g, '');
      if (aadharClean.length !== 12) {
        showToast(
          isMarathi 
            ? 'आधार कार्ड नंबर अचूक १२ अंकी असावा.' 
            : 'Aadhar card number must be exactly 12 digits.', 
          'error'
        );
        return;
      }
    }

    // Date format validation (must be valid YYYY-MM-DD)
    if (!isValidDate(custForm.joinDate)) {
      showToast(
        isMarathi 
          ? 'प्रवेश तारीख वैध YYYY-MM-DD फॉरमॅटमध्ये असावी (उदा. २०२६-०६-२५).' 
          : 'Joining Date must be a valid date in YYYY-MM-DD format (e.g. 2026-06-25).', 
        'error'
      );
      return;
    }

    const finalForm = { ...custForm, phone: cleanPhone };

    let updatedCustomers;
    let updatedTxns = [...(db.transactions || [])];

    if (!editCustId) {
      const activeBranchCount = (db.customers || []).filter(c => (c.branch || 'Branch 1') === activeBranch && c.status !== 'old').length;
      if (activeBranchCount >= 320) {
        showToast(
          isMarathi 
            ? 'या शाखेची ३२० ग्राहकांची मर्यादा संपली आहे!' 
            : 'This branch has reached its capacity limit of 320 customers!', 
          'error'
        );
        return;
      }
    }
    
    let targetCat = custForm.category;
    if (!targetCat) {
      if (editCustId) {
        const orig = db.customers.find(c => c.id === editCustId);
        targetCat = orig ? (orig.category || 'dinein') : 'dinein';
      } else {
        if (currentTab === 'tiffin') targetCat = 'tiffin';
        else if (currentTab === 'shortterm') targetCat = 'shortterm';
        else targetCat = 'dinein';
      }
    }

    if (editCustId) {
      updatedCustomers = db.customers.map(c => c.id === editCustId ? { ...c, ...finalForm, amount: Number(finalForm.amount), deposited: Number(finalForm.deposited) || 0, category: targetCat } : c);
    } else {
      const newCust = { ...finalForm, id: 'cust_' + Date.now(), amount: Number(finalForm.amount), deposited: Number(finalForm.deposited) || 0, category: targetCat, branch: activeBranch };
      updatedCustomers = [...db.customers, newCust];
      if (newCust.deposited > 0) {
        const initialTxn = {
          id: 'txn_' + Date.now() + '_init',
          custId: newCust.id,
          amount: newCust.deposited,
          date: newCust.joinDate,
          paymentMode: 'Cash'
        };
        updatedTxns.push(initialTxn);
      }
    }

    saveDb({ ...db, customers: updatedCustomers, transactions: updatedTxns });
    setCustSearch(''); // Clear search query to show the new customer immediately
    setCustModal(false);
  };

  const deleteCustomer = (id) => {
    const customer = db.customers.find(c => c.id === id);
    if (!customer) return;

    if (currentTab === 'oldcustomers') {
      const confirmMsg = db.settings.lang === 'mr'
        ? 'आपण या ग्राहकाला कायमचे हटवू इच्छिता? ही क्रिया पूर्ववत केली जाऊ शकत नाही.'
        : 'Are you sure you want to permanently delete this customer? This cannot be undone.';
      if (!confirm(confirmMsg)) return;

      const updated = db.customers.filter(c => c.id !== id);
      const updatedTxns = db.transactions.filter(t => t.custId !== id);
      saveDb({ ...db, customers: updated, transactions: updatedTxns });
      showToast(
        db.settings.lang === 'mr' ? 'ग्राहक कायमचा हटवला गेला!' : 'Customer permanently deleted!',
        'success'
      );
    } else {
      const confirmMsg = db.settings.lang === 'mr'
        ? 'आपण या ग्राहकाला संग्रहित (archive) करू इच्छिता? त्यांना जुन्या ग्राहकांच्या संग्रहात हलवले जाईल.'
        : 'Are you sure you want to archive this customer? They will be moved to the Old Customers Archive.';
      if (!confirm(confirmMsg)) return;

      const updated = db.customers.map(c => c.id === id ? { ...c, status: 'old' } : c);
      saveDb({ ...db, customers: updated });
      showToast(
        db.settings.lang === 'mr' ? 'ग्राहक संग्रहित केला गेला!' : 'Customer archived successfully!',
        'success'
      );
    }
  };

  const restoreCustomer = (id) => {
    const confirmMsg = db.settings.lang === 'mr'
      ? 'आपण या ग्राहकाला पुनर्संचयित करू इच्छिता?'
      : 'Are you sure you want to restore this customer back to active lists?';
    if (!confirm(confirmMsg)) return;

    const updated = db.customers.map(c => c.id === id ? { ...c, status: undefined } : c);
    saveDb({ ...db, customers: updated });
    showToast(
      db.settings.lang === 'mr' ? 'ग्राहक यशस्वीरित्या पुनर्संचयित केला गेला!' : 'Customer successfully restored!',
      'success'
    );
  };

  const saveExpense = (e) => {
    if (e) e.preventDefault();
    const amt = parseFloat(expenseForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast(db.settings.lang === 'mr' ? 'कृपया वैध रक्कम प्रविष्ट करा.' : 'Please enter a valid amount.', 'error');
      return;
    }
    if (!expenseForm.note.trim()) {
      showToast(db.settings.lang === 'mr' ? 'कृपया खर्चाचा तपशील प्रविष्ट करा.' : 'Please enter expense details.', 'error');
      return;
    }

    const newExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      amount: amt,
      note: expenseForm.note.trim(),
      date: todayStr(),
      createdAt: new Date().getTime(),
      branch: activeBranch
    };

    const updatedExpenses = [newExpense, ...(db.expenses || [])];
    saveDb({ ...db, expenses: updatedExpenses });
    setExpenseForm({ amount: '', note: '' });
    showToast(db.settings.lang === 'mr' ? 'खर्च यशस्वीरित्या जोडला गेला!' : 'Expense added successfully!');
  };

  const deleteExpense = (id) => {
    const confirmDelete = window.confirm(
      db.settings.lang === 'mr'
        ? 'तुम्हाला नक्की हा खर्च हटवायचा आहे का?'
        : 'Are you sure you want to delete this expense record?'
    );
    if (!confirmDelete) return;

    const updated = (db.expenses || []).filter(e => e.id !== id);
    saveDb({ ...db, expenses: updated });
    showToast(db.settings.lang === 'mr' ? 'खर्च हटवला गेला!' : 'Expense deleted successfully!');
  };

  const handleCalcKeyPress = useCallback((val) => {
    if (val === '=') {
      setCalcInput(prevInput => {
        try {
          const sanitized = prevInput.replace(/[^0-9+\-*/(). ]/g, '');
          if (!sanitized) {
            setCalcResult('');
            return prevInput;
          }
          const evalResult = new Function(`return (${sanitized})`)();
          if (evalResult !== undefined && !isNaN(evalResult) && isFinite(evalResult)) {
            setCalcResult(String(evalResult));
            return String(evalResult);
          } else {
            setCalcResult('Error');
            return prevInput;
          }
        } catch (err) {
          setCalcResult('Error');
          return prevInput;
        }
      });
    } else if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === '⌫') {
      setCalcInput(prev => prev.slice(0, -1));
    } else {
      setCalcInput(prev => prev + val);
    }
  }, []);

  // Keyboard shortcut listener for Quick Calculator
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Use refs to inspect values without registering new event handlers
      if (currentTabRef.current !== 'dashboard' || !showCalculatorRef.current) {
        return; 
      }

      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT' || 
        activeEl.isContentEditable
      )) {
        return; 
      }

      const key = e.key;
      if (/[0-9+\-*/().]/.test(key)) {
        e.preventDefault();
        handleCalcKeyPress(key);
      } else if (key === 'Enter') {
        e.preventDefault();
        handleCalcKeyPress('=');
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleCalcKeyPress('⌫');
      } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCalcKeyPress('C');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCalcKeyPress]);



  // Export CSV
  const handleExportCustomers = async () => {
    if (!db.customers.length) {
      showToast('No customers to export.', 'error');
      return;
    }

    let csvContent = 'Customer Name,Phone Number,Aadhar,Plan,Amount,Status,Join Date,Expiry Date,Address\n';
    db.customers.forEach(c => {
      const status = computeStatus(c).toUpperCase();
      const exp = expiryStr(c.joinDate, c.plan);
      csvContent += `"${c.name}","${c.phone}","${c.aadhar || ''}","${c.plan}",${c.amount},"${status}","${c.joinDate}","${exp}","${c.addr || ''}"\n`;
    });

    const defaultName = `lokmanya_customers_${todayStr()}.csv`;
    if (isElectron) {
      const res = await window.electronAPI.saveCsv(csvContent, defaultName);
      if (res.success) showToast(`Exported to: ${res.filePath}`, 'success');
    } else {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", defaultName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calculations for Dashboard Metrics (filtered by branch)
  const metrics = useMemo(() => {
    const branchCusts = (db.customers || []).filter(c => (c.branch || 'Branch 1') === activeBranch);
    const activeBranchCusts = branchCusts.filter(c => c.status !== 'old');
    const totalCustomersCount = activeBranchCusts.length;
    let totalCollected = branchCusts.reduce((sum, c) => sum + (c.deposited || 0), 0);
    let activeSubCount = 0;
    let expiredSubCount = 0;
    let expiringSubCount = 0;
    let pendingAmount = 0;

    branchCusts.forEach(c => {
      if (c.status === 'old') return; // Skip archived customers on active dashboard
      const status = computeStatus(c);
      const remaining = getCustomerDues(c);
      if (status === 'active' && remaining === 0) activeSubCount++;
      else if (status === 'expiring') expiringSubCount++;
      else {
        expiredSubCount++;
      }
      
      if (remaining > 0) {
        pendingAmount += remaining;
      }
    });

    return {
      totalCollected,
      activeSubCount,
      expiredSubCount,
      expiringSubCount,
      pendingAmount,
      totalCustomersCount
    };
  }, [db.customers, activeBranch]);

  const branchTxns = useMemo(() => {
    const custMap = new Map((db.customers || []).map(c => [c.id, c]));
    return (db.transactions || []).filter(tx => {
      const cust = custMap.get(tx.custId);
      const txBranch = cust ? (cust.branch || 'Branch 1') : 'Branch 1';
      return txBranch === activeBranch;
    });
  }, [db.transactions, db.customers, activeBranch]);

  // --- Collections Calculations ---
  const todayCollectionTotal = useMemo(() => {
    const today = todayStr();
    const currentMonth = today.slice(0, 7);
    return branchTxns
      .filter(tx => tx.date === today && tx.date.slice(0, 7) === currentMonth)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [branchTxns]);

  const currentMonthCollectionTotal = useMemo(() => {
    const currentMonth = todayStr().slice(0, 7);
    return branchTxns
      .filter(tx => tx.date && tx.date.slice(0, 7) === currentMonth)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [branchTxns]);

  const filteredTxns = useMemo(() => {
    const today = todayStr();
    const currentMonth = today.slice(0, 7);
    
    // Auto-Archiving: Active views only display transactions from the current month
    const activeTxns = branchTxns.filter(tx => tx.date && tx.date.slice(0, 7) === currentMonth);

    if (collectionFilter === 'today') {
      return activeTxns.filter(tx => tx.date === today);
    }
    if (collectionFilter === 'custom') {
      return activeTxns.filter(tx => tx.date >= colStartDate && tx.date <= colEndDate);
    }
    return activeTxns; // 'month' filter
  }, [branchTxns, collectionFilter, colStartDate, colEndDate]);

  const filteredTxnsTotal = useMemo(() => {
    return filteredTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [filteredTxns]);

  // Grouped Daily Collections (For active month)
  const dailyCollections = useMemo(() => {
    const currentMonth = todayStr().slice(0, 7);
    const activeTxns = branchTxns.filter(tx => tx.date && tx.date.slice(0, 7) === currentMonth);
    
    const groups = {};
    activeTxns.forEach(tx => {
      const d = tx.date;
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(tx);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a)) // latest dates first
      .map(d => {
        const items = groups[d];
        const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        return {
          date: d,
          items,
          total
        };
      });
  }, [branchTxns]);

  // Grouped Collections Archive (Past Months)
  const archiveCollectionMonths = useMemo(() => {
    const currentMonth = todayStr().slice(0, 7);
    const archived = branchTxns.filter(tx => tx.date && tx.date.slice(0, 7) !== currentMonth);
    
    const groups = {};
    archived.forEach(tx => {
      const mStr = tx.date.slice(0, 7);
      if (!groups[mStr]) {
        groups[mStr] = [];
      }
      groups[mStr].push(tx);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(mStr => {
        const parts = mStr.split('-');
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const items = groups[mStr].sort((x, y) => y.date.localeCompare(x.date));
        const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        return {
          monthStr: mStr,
          monthLabel,
          items,
          total
        };
      });
  }, [branchTxns]);

  const branchExpenses = useMemo(() => {
    return (db.expenses || []).filter(e => (e.branch || 'Branch 1') === activeBranch);
  }, [db.expenses, activeBranch]);

  // --- Expenses Calculations ---
  const todayExpenseTotal = useMemo(() => {
    const today = todayStr();
    const currentMonth = today.slice(0, 7);
    return branchExpenses
      .filter(e => e.date === today && e.date.slice(0, 7) === currentMonth)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [branchExpenses]);

  const currentMonthExpenseTotal = useMemo(() => {
    const currentMonth = todayStr().slice(0, 7);
    return branchExpenses
      .filter(e => e.date && e.date.slice(0, 7) === currentMonth)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [branchExpenses]);

  const filteredExpenses = useMemo(() => {
    const today = todayStr();
    const currentMonth = today.slice(0, 7);
    
    // Auto-Archiving: Active views only display expenses from the current month
    const activeExpenses = branchExpenses.filter(e => e.date && e.date.slice(0, 7) === currentMonth);

    if (expenseFilter === 'today') {
      return activeExpenses.filter(e => e.date === today);
    }
    if (expenseFilter === 'custom') {
      return activeExpenses.filter(e => e.date >= expStartDate && e.date <= expEndDate);
    }
    return activeExpenses; // 'month' filter
  }, [branchExpenses, expenseFilter, expStartDate, expEndDate]);

  const filteredExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  // Grouped Expenses Archive (Past Months)
  const archiveExpenseMonths = useMemo(() => {
    const currentMonth = todayStr().slice(0, 7);
    const archived = branchExpenses.filter(e => e.date && e.date.slice(0, 7) !== currentMonth);
    
    const groups = {};
    archived.forEach(e => {
      const mStr = e.date.slice(0, 7);
      if (!groups[mStr]) {
        groups[mStr] = [];
      }
      groups[mStr].push(e);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(mStr => {
        const parts = mStr.split('-');
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const items = groups[mStr].sort((x, y) => y.date.localeCompare(x.date));
        const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        return {
          monthStr: mStr,
          monthLabel,
          items,
          total
        };
      });
  }, [branchExpenses]);

  // Net Profit/Loss for current month
  const currentMonthNetProfit = useMemo(() => {
    return currentMonthCollectionTotal - currentMonthExpenseTotal;
  }, [currentMonthCollectionTotal, currentMonthExpenseTotal]);

  // Filtered customer list (sorted with pending dues first, filtered by category/branch)
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
      const idA = a.id || '';
      const idB = b.id || '';
      return idB.localeCompare(idA); // Show newer customers first when dues are equal
    });
  }, [db.customers, custSearch, currentTab, activeBranch]);

  // Translation function helper
  const t = (key) => {
    const lang = db.settings.lang || 'en';
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
  };



  // If not logged in, render PIN screen with animated logo intro
  if (!isLoggedIn) {
    return (
      <>
        <div className="pin-screen">
        <div className="pin-card" style={{ maxWidth: '500px', width: '90%', padding: '40px', transition: 'all 0.5s ease', background: 'rgba(30, 30, 36, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {/* Animated Logo Video or Static Logo */}
          <div className="pin-logo" style={{ width: '100%', aspectRatio: '16/9', margin: '0 auto 24px auto', borderRadius: '16px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', boxShadow: 'var(--shadow-lg)' }}>
            {introPlayed ? (
              <img 
                src="./assets/icon.jpg" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt="Logo"
              />
            ) : (
              <video 
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
              />
            )}
          </div>
          <h1 className="pin-title" style={{ fontSize: '26px', marginBottom: '8px', fontWeight: '800' }}>{t('pinTitle')}</h1>
          
          <div className={`pin-entry-container ${showPinPad ? 'fade-in-active' : 'fade-in-hidden'}`}>
            <p className="pin-subtitle" style={{ marginBottom: '20px' }}>{t('pinSubtitle')}</p>
            
            <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px', margin: '0 auto' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••"
                  maxLength="6"
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPinInput(val);
                    setPinError('');
                  }}
                  autoFocus
                  style={{
                    textAlign: 'center',
                    fontSize: '24px',
                    letterSpacing: '8px',
                    height: '50px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="rememberPin"
                  checked={rememberPin}
                  onChange={(e) => setRememberPin(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="rememberPin" style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {db.settings.lang === 'mr' ? 'पिन लक्षात ठेवा (Remember PIN)' : 'Remember PIN'}
                </label>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  height: '46px', 
                  borderRadius: '10px', 
                  fontSize: '14px', 
                  fontWeight: '700',
                  background: 'var(--primary)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(216, 90, 48, 0.3)'
                }}
              >
                {db.settings.lang === 'mr' ? 'प्रवेश करा' : 'Enter Mess'}
              </button>
              
              {pinError && <p className="pin-error" style={{ marginTop: '8px', fontSize: '13px' }}>{pinError}</p>}
            </form>
          </div>
        </div>
        {/* TOAST NOTIFICATION CONTAINER */}
        {toast && (
          <div className="toast-notification" style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '700',
            animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
            <span>{toast.message}</span>
          </div>
        )}



      </div>

      {firstRunModalVisible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 420, maxWidth: '92%', background: 'var(--card)', padding: 20, borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginTop: 0 }}>{db.settings && db.settings.lang === 'mr' ? 'प्रवेश सेटअप' : 'Initial Setup'}</h3>
            <p style={{ marginTop: 0 }}>{db.settings && db.settings.lang === 'mr' ? 'कृपया या संगणकासाठी 6-अंकी मालक PIN सेट करा.' : 'Please set a 6-digit Owner PIN for this device.'}</p>
            <input
              type="password"
              value={firstRunPinInput}
              maxLength={6}
              onChange={(e) => setFirstRunPinInput(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', padding: '10px 12px', fontSize: 18, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', marginTop: 8 }}
            />
            {firstRunPinError && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{firstRunPinError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={handleFirstRunCancel}>{db.settings && db.settings.lang === 'mr' ? 'रद्द करा' : 'Cancel'}</button>
              <button className="btn btn-primary" onClick={handleFirstRunSave}>{db.settings && db.settings.lang === 'mr' ? 'पिन सेट करा' : 'Save PIN'}</button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  return (
    <div className="app-container">
      {firstRunModalVisible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 420, maxWidth: '92%', background: 'var(--card)', padding: 20, borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginTop: 0 }}>{db.settings && db.settings.lang === 'mr' ? 'प्रवेश सेटअप' : 'Initial Setup'}</h3>
            <p style={{ marginTop: 0 }}>{db.settings && db.settings.lang === 'mr' ? 'कृपया या संगणकासाठी 6-अंकी मालक PIN सेट करा.' : 'Please set a 6-digit Owner PIN for this device.'}</p>
            <input
              type="password"
              value={firstRunPinInput}
              maxLength={6}
              onChange={(e) => setFirstRunPinInput(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', padding: '10px 12px', fontSize: 18, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', marginTop: 8 }}
            />
            {firstRunPinError && <div style={{ color: 'var(--danger)', marginTop: 8 }}>{firstRunPinError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={handleFirstRunCancel}>{db.settings && db.settings.lang === 'mr' ? 'रद्द करा' : 'Cancel'}</button>
              <button className="btn btn-primary" onClick={handleFirstRunSave}>{db.settings && db.settings.lang === 'mr' ? 'पिन सेट करा' : 'Save PIN'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img 
            src="./assets/icon.jpg" 
            style={{ width: '64px', height: '64px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.15)', objectFit: 'cover', boxShadow: 'var(--shadow-md)' }} 
            alt="Logo" 
          />
          <div className="sidebar-logo-text" style={{ fontSize: '16px', fontWeight: '800', textAlign: 'center', color: '#fff', letterSpacing: '0.5px' }}>{db.settings.messName}</div>
        </div>
        <div className="sidebar-menu">
          <div
            className={`sidebar-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('dashboard');
              setIsArchiveUnlocked(false);
            }}
          >
            <LayoutDashboard size={18} />
            <span>{t('dashboard')}</span>
          </div>
          <div
            className={`sidebar-item ${currentTab === 'customers' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('customers');
              setIsArchiveUnlocked(false);
            }}
          >
            <Users size={18} />
            <span>{t('customers')}</span>
          </div>
          <div
            className={`sidebar-item ${currentTab === 'tiffin' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('tiffin');
              setIsArchiveUnlocked(false);
            }}
          >
            <ClipboardList size={18} />
            <span>{t('tiffin')}</span>
          </div>
          <div
            className={`sidebar-item ${currentTab === 'shortterm' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('shortterm');
              setIsArchiveUnlocked(false);
            }}
          >
            <DollarSign size={18} />
            <span>{t('shortterm')}</span>
          </div>
          <div
            className={`sidebar-item ${currentTab === 'collections' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('collections');
              setIsCollectionArchiveUnlocked(false);
            }}
          >
            <Coins size={18} />
            <span>{t('collections')}</span>
          </div>
          <div
            className={`sidebar-item ${currentTab === 'expenses' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('expenses');
              setIsExpenseArchiveUnlocked(false);
            }}
          >
            <TrendingUp size={18} />
            <span>{t('expenses')}</span>
          </div>
          <div
            className={`sidebar-item ${currentTab === 'oldcustomers' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('oldcustomers');
            }}
          >
            <History size={18} />
            <span>{t('oldcustomers')}</span>
          </div>


          <div
            className={`sidebar-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('settings')}
          >
            <Settings size={18} />
            <span>{t('settings')}</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-content">
        <header className="main-header">
          <h2 className="header-title">
            {currentTab === 'dashboard' && t('businessDashboard')}
            {currentTab === 'customers' && t('manageCustomers')}
            {currentTab === 'tiffin' && t('manageTiffin')}
            {currentTab === 'shortterm' && t('manageShortTerm')}
            {currentTab === 'collections' && t('manageCollections')}
            {currentTab === 'expenses' && t('manageExpenses')}
            {currentTab === 'oldcustomers' && t('manageOldCustomers')}
            {currentTab === 'settings' && t('appSettings')}
          </h2>
          <div className="header-profile">
            {currentTab === 'dashboard' && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowCalculator(!showCalculator)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginRight: '20px',
                  backgroundColor: showCalculator ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                  color: showCalculator ? 'var(--danger)' : 'var(--primary)',
                  border: '1px solid currentColor',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  height: '32px'
                }}
                title={showCalculator ? (db.settings.lang === 'mr' ? 'कॅल्क्युलेटर लपवा' : 'Hide Calculator') : (db.settings.lang === 'mr' ? 'कॅल्क्युलेटर दाखवा' : 'Show Calculator')}
              >
                {showCalculator ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showCalculator ? (db.settings.lang === 'mr' ? 'लपवा' : 'Hide Calc') : (db.settings.lang === 'mr' ? 'दाखवा' : 'Show Calc')}</span>
              </button>
            )}
            {role === 'owner' && (
              <div style={{ marginRight: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {db.settings.lang === 'mr' ? 'शाखा:' : 'Branch:'}
                </span>
                <select
                  className="form-select"
                  value={activeBranch}
                  onChange={(e) => {
                    setActiveBranch(e.target.value);
                    localStorage.setItem('lokmanya_active_branch', e.target.value);
                    showToast(db.settings.lang === 'mr' ? 'शाखा बदलली!' : 'Active branch updated!', 'success');
                  }}
                  style={{ padding: '4px 8px', fontSize: '13px', width: '120px', height: '32px' }}
                >
                  <option value="Branch 1">Branch 1</option>
                  <option value="Branch 2">Branch 2</option>
                </select>
              </div>
            )}
            {role === 'branch_staff' && (
              <span 
                style={{ 
                  marginRight: '16px', 
                  backgroundColor: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: '700',
                  border: '1px solid var(--border)' 
                }}
              >
                📍 {activeBranch === 'Branch 1' ? (db.settings.lang === 'mr' ? 'शाखा १' : 'Branch 1') : (db.settings.lang === 'mr' ? 'शाखा २' : 'Branch 2')}
              </span>
            )}
            <div className="profile-text">
              <div className="profile-name">{db.settings.ownerName}</div>
              <div className="profile-mess">{db.settings.messName}</div>
            </div>
            <div className="avatar">{db.settings.ownerName.charAt(0)}</div>
          </div>
        </header>

        <div className="content-body">
          {/* DASHBOARD TAB */}
          {currentTab === 'dashboard' && (
            <div className="tab-panel animate-fade">
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{db.settings.lang === 'mr' ? 'एकूण ग्राहक' : 'Total Customers'}</div>
                    <div className="stat-value">{metrics.totalCustomersCount} <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ 320</span></div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{t('totalCollections')}</div>
                    <div className="stat-value">₹{metrics.totalCollected.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{t('activeMembers')}</div>
                    <div className="stat-value">{metrics.activeSubCount}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>
                    <Bell size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{t('expiringSoon')}</div>
                    <div className="stat-value">{metrics.expiringSubCount}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{t('pendingDues')}</div>
                    <div className="stat-value">₹{metrics.pendingAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ 
                    backgroundColor: currentMonthNetProfit >= 0 ? 'rgba(29, 158, 117, 0.1)' : 'rgba(226, 75, 74, 0.1)', 
                    color: currentMonthNetProfit >= 0 ? 'var(--success)' : 'var(--danger)' 
                  }}>
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {db.settings.lang === 'mr' ? 'चालू महिना नफा' : 'Net Profit (Month)'}
                    </div>
                    <div className="stat-value" style={{ 
                      color: currentMonthNetProfit >= 0 ? 'var(--success)' : 'var(--danger)',
                      fontSize: '18px'
                    }}>
                      ₹{currentMonthNetProfit.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: showCalculator ? '2fr 1fr' : '1fr', 
                gap: '24px', 
                alignItems: 'start'
              }}>
                {/* Left Column: Expiring/Expired table */}
                <div className="card-section" style={{ margin: 0 }}>
                  <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="section-title">{t('expiringExpired')}</span>
                  </div>
                  <div className="table-container">
                    <table className="app-table">
                      <thead>
                        <tr>
                          <th>{t('custName')}</th>
                          <th>{t('phoneNo')}</th>
                          <th>{t('plan')}</th>
                          <th>{t('remaining')}</th>
                          <th>{t('status')}</th>
                          <th>{t('expiryDate')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {db.customers.filter(c => (c.branch || 'Branch 1') === activeBranch && c.status !== 'old' && (['expired', 'expiring'].includes(computeStatus(c)) || getCustomerDues(c) > 0))
                          .sort((a, b) => getCustomerDues(b) - getCustomerDues(a))
                          .slice(0, 10)
                          .map(c => {
                          const status = computeStatus(c);
                          const remaining = getCustomerDues(c);
                          return (
                            <tr key={c.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {c.photo ? (
                                    <img src={c.photo} className="customer-table-avatar-sm" alt={c.name} />
                                  ) : (
                                    <div className="customer-table-avatar-sm-placeholder">
                                      {(c.name || 'C').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span style={{ fontWeight: '700' }}>{c.name}</span>
                                </div>
                              </td>
                              <td>{c.phone}</td>
                              <td>{c.plan}</td>
                              <td style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '700' }}>
                                ₹{remaining}
                              </td>
                              <td>
                                <span className={`badge badge-${status}`}>
                                  {status === 'active' && (db.settings.lang === 'mr' ? 'सक्रिय' : 'active')}
                                  {status === 'expired' && (db.settings.lang === 'mr' ? 'मुदत संपली' : 'expired')}
                                  {status === 'expiring' && (db.settings.lang === 'mr' ? 'लवकरच संपणार' : 'expiring')}
                                </span>
                              </td>
                              <td>{expiryStr(c.joinDate, c.plan)}</td>
                            </tr>
                          );
                        })}
                        {db.customers.filter(c => ['expired', 'expiring'].includes(computeStatus(c)) || getCustomerDues(c) > 0).length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                              🎉 {t('allActive')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Calculator */}
                {showCalculator && (
                  <div className="card-section" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="section-title">
                        🧮 {db.settings.lang === 'mr' ? 'कॅल्क्युलेटर' : 'Quick Calculator'}
                      </span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-icon" 
                        onClick={() => setShowCalculator(false)}
                        style={{ width: '28px', height: '28px', padding: 0 }}
                        title={db.settings.lang === 'mr' ? 'लपवा' : 'Hide'}
                      >
                        <EyeOff size={14} />
                      </button>
                    </div>
                    <div className="calculator-box" style={{ width: '100%' }}>
                      {/* Calculator Display Screen */}
                      <div style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        borderRadius: '12px', 
                        padding: '16px', 
                        textAlign: 'right', 
                        marginBottom: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', overflowX: 'auto', whiteSpace: 'nowrap', minHeight: '20px', WebkitUserSelect: 'text', userSelect: 'text' }}>
                          {calcInput || '0'}
                        </div>
                        <div style={{ color: '#10b981', fontSize: '24px', fontWeight: '800', overflowX: 'auto', whiteSpace: 'nowrap', minHeight: '36px', marginTop: '4px', WebkitUserSelect: 'text', userSelect: 'text' }}>
                          {calcResult ? '= ' + calcResult : ''}
                        </div>
                      </div>

                      {/* Calculator Buttons Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(4, 1fr)', 
                        gap: '10px' 
                      }}>
                        {/* Row 1 */}
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleCalcKeyPress('C')} style={{ fontWeight: '800', fontSize: '15px', height: '44px', padding: 0 }}>C</button>
                        <button type="button" className="btn btn-sm btn-warning" onClick={() => handleCalcKeyPress('⌫')} style={{ fontWeight: '800', fontSize: '15px', height: '44px', padding: 0 }}>⌫</button>
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('(')} style={{ fontWeight: '800', fontSize: '15px', height: '44px', padding: 0, backgroundColor: '#e2e8f0', color: '#1e293b' }}>(</button>
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress(')')} style={{ fontWeight: '800', fontSize: '15px', height: '44px', padding: 0, backgroundColor: '#e2e8f0', color: '#1e293b' }}>)</button>

                        {/* Row 2 */}
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('7')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>7</button>
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('8')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>8</button>
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('9')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>9</button>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleCalcKeyPress('/')} style={{ fontWeight: '800', fontSize: '16px', height: '44px', padding: 0 }}>/</button>

                        {/* Row 3 */}
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('4')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>4</button>
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('5')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>5</button>
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('6')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>6</button>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleCalcKeyPress('*')} style={{ fontWeight: '800', fontSize: '16px', height: '44px', padding: 0 }}>*</button>

                        {/* Row 4 */}
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('1')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>1</button>
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('2')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>2</button>
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('3')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>3</button>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleCalcKeyPress('-')} style={{ fontWeight: '800', fontSize: '18px', height: '44px', padding: 0 }}>-</button>

                        {/* Row 5 */}
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('0')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>0</button>
                        <button type="button" className="btn btn-sm" onClick={() => handleCalcKeyPress('.')} style={{ fontWeight: '700', fontSize: '16px', height: '44px', padding: 0, backgroundColor: '#fff', color: '#1e293b', border: '1px solid var(--border)' }}>.</button>
                        <button type="button" className="btn btn-sm btn-success" onClick={() => handleCalcKeyPress('=')} style={{ fontWeight: '800', fontSize: '18px', height: '44px', padding: 0 }}>=</button>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleCalcKeyPress('+')} style={{ fontWeight: '800', fontSize: '16px', height: '44px', padding: 0 }}>+</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CUSTOMERS, TIFFIN, SHORT-TERM, AND OLD CUSTOMERS TABS */}
          {(currentTab === 'customers' || currentTab === 'tiffin' || currentTab === 'shortterm' || currentTab === 'oldcustomers') && (
            currentTab === 'oldcustomers' && !isArchiveUnlocked ? (
              <div className="tab-panel animate-fade">
                <div className="card-section" style={{ maxWidth: '420px', margin: '60px auto', padding: '32px', textAlign: 'center', borderRadius: '16px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{db.settings.lang === 'mr' ? 'आर्काइव्ह प्रवेश नियंत्रण' : 'Archive Access Control'}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 24px' }}>
                    {db.settings.lang === 'mr' ? 'संग्रहित जुने ग्राहक रेकॉर्ड पाहण्यासाठी संकेतशब्द प्रविष्ट करा.' : 'Please enter the archive access password to view archived profiles.'}
                  </p>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••"
                    value={archivePinInput}
                    onChange={(e) => setArchivePinInput(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '6px', marginBottom: '20px', padding: '10px' }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={() => {
                      const correctPin = db.settings.archivePassword || '2001';
                      if (archivePinInput === correctPin) {
                        setIsArchiveUnlocked(true);
                        setArchivePinInput('');
                        showToast(db.settings.lang === 'mr' ? 'प्रवेश मंजूर!' : 'Access Granted!', 'success');
                      } else {
                        showToast(db.settings.lang === 'mr' ? 'चुकीचा पासवर्ड!' : 'Incorrect Password!', 'error');
                      }
                    }}
                  >
                    {db.settings.lang === 'mr' ? 'अनलॉक करा' : 'Unlock Archive'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="tab-panel">
                <div className="card-section">
                  <div className="toolbar">
                    <div className="search-container">
                      <Search className="search-icon" size={18} />
                      <input
                        type="text"
                        className="search-input"
                        placeholder={t('searchPlaceholder')}
                        value={custSearch}
                        onChange={(e) => setCustSearch(e.target.value)}
                      />
                    </div>
                    {/* Hide Add Customer button in Old Customers Archive */}
                    {currentTab !== 'oldcustomers' && (
                      <button className="btn btn-primary" onClick={openAddCust}>
                        <Plus size={16} /> {t('addCustomer')}
                      </button>
                    )}
                    <button className="btn" onClick={handleExportCustomers}>
                      <Download size={16} /> {t('exportCsv')}
                    </button>
                     {currentTab !== 'oldcustomers' && role === 'owner' && (
                       <button 
                         className="btn" 
                         onClick={() => {
                           setSentCustomers([]);
                           setShowBulkSmsModal(true);
                         }}
                         style={{ backgroundColor: '#22c55e', color: '#fff', borderColor: '#22c55e', fontWeight: '600' }}
                       >
                         💬 {db.settings.lang === 'mr' ? 'एकत्रित व्हॉट्सॲप पाठवा' : 'Send Bulk WhatsApp'}
                       </button>
                     )}
                  </div>

                  <div className="customer-bars-list">
                    {filteredCustomers.map(c => {
                      const status = computeStatus(c);
                      const remaining = getCustomerDues(c);
                      const hasDues = remaining > 0;
                      
                      let displayedDeposited = c.deposited || 0;
                      if (c.category !== 'shortterm' && c.joinDate) {
                        const daysPerCycle = PLAN_DAYS[c.plan] || 30;
                        const startDate = parseLocalDate(c.joinDate);
                        const today = new Date();
                        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const elapsedTime = todayMidnight - startDate;
                        const elapsedDays = Math.round(elapsedTime / 86400000);
                        let elapsedCycles = 0;
                        if (elapsedDays > 0) {
                          elapsedCycles = Math.floor(elapsedDays / daysPerCycle);
                        }
                        displayedDeposited = Math.max(0, (c.deposited || 0) - elapsedCycles * c.amount);
                      }
                      
                      const warningDays = getDueWarningDays(c);
                      const isNameRed = warningDays > 0;
                      
                      return (
                        <div key={c.id} className={`customer-bar status-${status} ${hasDues ? 'has-dues' : 'no-dues'}`}>
                        {/* Left: Profile Photo */}
                        <div className="customer-bar-avatar-container">
                          {c.photo ? (
                            <img 
                              src={c.photo} 
                              className="customer-bar-avatar" 
                              alt={c.name} 
                              style={{ cursor: 'pointer' }}
                              onClick={() => setPreviewImage({ url: c.photo, name: c.name })}
                              title={db.settings.lang === 'mr' ? 'फोटो मोठा करा' : 'Click to zoom'}
                            />
                          ) : (
                            <div className="customer-bar-avatar-placeholder">
                              {(c.name || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Middle-Left: Basic Info */}
                        <div className="customer-bar-info">
                          <div 
                            className="customer-bar-name"
                            style={{ 
                              color: isNameRed ? '#ff1e1e' : 'var(--text-primary)', 
                              fontWeight: isNameRed ? '800' : '600'
                            }}
                          >
                            {c.name} {isNameRed && (db.settings.lang === 'mr' ? ` (${warningDays} दिवस थकीत!)` : ` (Due pending for ${warningDays} days)`)}
                          </div>
                          <div className="customer-bar-subinfo">📞 {c.phone}</div>
                          {c.addr && <div className="customer-bar-subinfo">📍 {c.addr}</div>}
                          {c.aadhar && <div className="customer-bar-subinfo">🪪 {t('aadharCard')}: {c.aadhar}</div>}
                        </div>

                        {/* Middle: Plan details */}
                        <div className="customer-bar-plan">
                          <div className="customer-bar-label">{t('planCycle')}</div>
                          <div className="customer-bar-val">{c.plan === 'Monthly' ? t('monthly30') : c.plan === 'Weekly' ? t('weekly7') : c.plan === 'Daily' ? t('daily1') : t('custom')}</div>
                          <div className="customer-bar-subval">{t('started')}: {c.joinDate}</div>
                          <div className="customer-bar-subval">{t('expires')}: {expiryStr(c.joinDate, c.plan)}</div>
                        </div>

                        {/* Middle-Right: Fees & Dues */}
                        <div className="customer-bar-financials">
                          <div className="financial-col">
                            <span className="customer-bar-label">{t('fee')}</span>
                            <span className="customer-bar-val">₹{c.amount}</span>
                          </div>
                          <div className="financial-col">
                            <span className="customer-bar-label">{t('deposited')}</span>
                            <span className="customer-bar-val" style={{ color: 'var(--success)', fontWeight: '700' }}>₹{displayedDeposited}</span>
                          </div>
                          <div className="financial-col">
                            <span className="customer-bar-label">{t('remaining')}</span>
                            {hasDues ? (
                              <span className="customer-bar-val" style={{ color: 'var(--danger)', fontWeight: '800' }}>
                                ₹{remaining} <span className="warning-dot" title="Dues Pending">⚠️</span>
                              </span>
                            ) : (
                              <span className="customer-bar-val" style={{ color: 'var(--success)', fontWeight: '800' }}>
                                ₹0 <span className="check-dot" title="Fully Paid">✓</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Status & Actions */}
                        <div className="customer-bar-actions-panel">
                          <div className="badge-row">
                            {c.status === 'old' ? (
                              <span className="badge badge-archived">
                                {db.settings.lang === 'mr' ? 'संग्रहित' : 'archived'}
                              </span>
                            ) : (
                              <span className={`badge badge-${status}`}>
                                {status === 'active' && (db.settings.lang === 'mr' ? 'सक्रिय' : 'active')}
                                {status === 'expired' && (db.settings.lang === 'mr' ? 'मुदत संपली' : 'expired')}
                                {status === 'expiring' && (db.settings.lang === 'mr' ? 'लवकरच संपणार' : 'expiring')}
                              </span>
                            )}
                            <span className={`badge ${hasDues ? 'badge-pending' : 'badge-active'}`}>
                              {hasDues ? t('duesPending') : t('fullyPaid')}
                            </span>
                          </div>
                          <div className="action-button-row">
                            {c.status === 'old' && role === 'owner' && (
                              <button
                                className="btn btn-sm btn-success"
                                title={db.settings.lang === 'mr' ? 'पुनर्संचयित करा' : 'Restore Customer'}
                                onClick={() => restoreCustomer(c.id)}
                                style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                              >
                                <RotateCcw size={12} style={{ marginRight: '2px' }} />
                                {db.settings.lang === 'mr' ? 'पुनर्संचयित' : 'Restore'}
                              </button>
                            )}
                            {c.status !== 'old' && (
                              <button
                                className="btn btn-sm btn-success"
                                title={db.settings.lang === 'mr' ? 'पेमेंट नोंदवा' : 'Record Payment'}
                                onClick={() => openPayModal(c)}
                                style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                              >
                                <span style={{ marginRight: '2px', fontSize: '14px', fontWeight: '700' }}>₹</span>
                                {db.settings.lang === 'mr' ? 'भरा' : 'Pay'}
                              </button>
                            )}
                            {hasDues && c.status !== 'old' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const template = db.settings.whatsappDuesTemplate || 'Dear [Name], your plan is expiring soon. Pending dues: ₹[Dues]. Please pay: [UpiLink] - [MessName]';
                                  const formattedMsg = template
                                    .replace(/https?:\/\/\s*\[UpiLink\]/gi, '[UpiLink]')
                                    .replace(/\[Name\]/g, c.name)
                                    .replace(/\[Dues\]/g, remaining)
                                    .replace(/\[MessName\]/g, db.settings.messName || 'Lokmanya Mess')
                                    .replace(/\[UpiLink\]/g, getUpiRedirectUrl(remaining));
                                  window.open(getWhatsAppShareUrl(c.phone, formattedMsg), 'whatsapp_share_tab');
                                }}
                                style={{ height: '32px', padding: '0 10px', fontSize: '12px', backgroundColor: '#22c55e', borderColor: '#22c55e', color: '#fff' }}
                                title="Send Dues Reminder via WhatsApp"
                              >
                                💬 {db.settings.lang === 'mr' ? 'व्हाट्सएप' : 'WhatsApp'}
                              </button>
                            )}
                            <button
                              className="btn btn-sm"
                              title={db.settings.lang === 'mr' ? 'पेमेंट इतिहास' : 'Payment History'}
                              onClick={() => openHistoryModal(c)}
                              style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                            >
                              <History size={12} style={{ marginRight: '2px' }} />
                              {db.settings.lang === 'mr' ? 'इतिहास' : 'History'}
                            </button>
                            <button
                              className="btn btn-sm btn-icon"
                              title={t('editProfile')}
                              onClick={() => openEditCust(c)}
                            >
                              <Edit size={14} />
                            </button>
                            {role === 'owner' && (
                              <button
                                className="btn btn-sm btn-icon"
                                title={t('deleteCust')}
                                onClick={() => deleteCustomer(c.id)}
                                style={{ backgroundColor: '#FF0000', color: '#fff', border: '1px solid #FF0000' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      {t('noCusts')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}



          {/* COLLECTIONS TAB */}
          {currentTab === 'collections' && (
            <div className="tab-panel animate-fade">
              {/* Header Summary Cards */}
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(29, 158, 117, 0.1)', color: 'var(--success)' }}>
                    <Coins size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{db.settings.lang === 'mr' ? 'आजची एकूण जमा' : "Today's Collections"}</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>₹{todayCollectionTotal}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(29, 158, 117, 0.15)', color: 'var(--success)' }}>
                    <Coins size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{db.settings.lang === 'mr' ? 'चालू महिन्याची एकूण जमा' : "Current Month's Collections"}</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>₹{currentMonthCollectionTotal}</div>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {/* Left Panel: Detailed Transactions List */}
                <div className="card-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="section-title">
                      {db.settings.lang === 'mr' ? 'जमा रक्कम तपशील' : 'Collections Ledger'}
                    </h3>
                    <div className="toolbar" style={{ margin: 0, gap: '6px' }}>
                      <button 
                        className={`btn btn-sm ${collectionFilter === 'today' ? 'btn-primary' : ''}`}
                        onClick={() => setCollectionFilter('today')}
                      >
                        {db.settings.lang === 'mr' ? 'आज' : 'Today'}
                      </button>
                      <button 
                        className={`btn btn-sm ${collectionFilter === 'custom' ? 'btn-primary' : ''}`}
                        onClick={() => setCollectionFilter('custom')}
                      >
                        {db.settings.lang === 'mr' ? 'तारीख निवडा' : 'Date Range'}
                      </button>
                      <button 
                        className={`btn btn-sm ${collectionFilter === 'month' ? 'btn-primary' : ''}`}
                        onClick={() => setCollectionFilter('month')}
                      >
                        {db.settings.lang === 'mr' ? 'चालू महिना' : 'Current Month'}
                      </button>
                    </div>
                  </div>

                  {collectionFilter === 'custom' && (
                    <div className="date-picker-row" style={{ display: 'flex', gap: '12px', padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', backgroundColor: 'var(--primary-light)', borderRadius: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                          {db.settings.lang === 'mr' ? 'पासून:' : 'From:'}
                        </span>
                        <input
                          type="date"
                          className="form-input"
                          value={colStartDate}
                          min={todayStr().slice(0, 7) + '-01'}
                          max={todayStr()}
                          onChange={(e) => setColStartDate(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '13px', width: '130px', height: '30px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                          {db.settings.lang === 'mr' ? 'पर्यंत:' : 'To:'}
                        </span>
                        <input
                          type="date"
                          className="form-input"
                          value={colEndDate}
                          min={todayStr().slice(0, 7) + '-01'}
                          max={todayStr()}
                          onChange={(e) => setColEndDate(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '13px', width: '130px', height: '30px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Transactions List */}
                  <div style={{ flex: 1, maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', backgroundColor: '#f8f9fc' }}>
                    {filteredTxns.map((tx, idx) => (
                      <div key={tx.id} className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: idx === filteredTxns.length - 1 ? 'none' : '1px solid var(--border)', gap: '12px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '6px', border: '1px solid var(--border)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{tx.custName}</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📅 {tx.date}</span>
                            <span className="badge badge-active" style={{ fontSize: '9px', padding: '2px 6px' }}>{tx.paymentMode}</span>
                          </div>
                          {tx.note && (
                            <div style={{ fontSize: '12px', color: 'var(--primary)', fontStyle: 'italic', marginTop: '4px', backgroundColor: 'var(--primary-light)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                              📝 Note: {tx.note}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: '800', color: 'var(--success)', fontSize: '15px' }}>₹{tx.amount}</span>
                          {role === 'owner' && (
                            <button 
                              className="btn btn-sm btn-icon btn-danger" 
                              title={db.settings.lang === 'mr' ? 'व्यवहार हटवा' : 'Delete Transaction'}
                              onClick={() => handleDeleteTxn(tx.id, tx.custId, tx.amount)}
                              style={{ width: '28px', height: '28px' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredTxns.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        {db.settings.lang === 'mr' ? 'कोणतेही रेकॉर्ड सापडले नाही.' : 'No collections recorded.'}
                      </div>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="card" style={{ margin: 0, padding: '16px', backgroundColor: 'var(--success-light)', borderColor: '#1d9e7533', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#085041' }}>
                      {db.settings.lang === 'mr' ? 'एकूण जमा:' : 'Total Collections:'}
                    </span>
                    <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--success)' }}>
                      ₹{filteredTxnsTotal}
                    </span>
                  </div>
                </div>

                <div className="card-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 className="section-title">
                    📅 {db.settings.lang === 'mr' ? 'दैनिक जमा वर्गीकरण' : 'Daily Collection Grouping'}
                  </h3>
                  <div style={{ flex: 1, maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', backgroundColor: '#f8f9fc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dailyCollections.map(day => (
                      <div key={day.date} style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text)' }}>
                            📅 {day.date}
                          </span>
                          <span style={{ fontWeight: '800', color: 'var(--success)', fontSize: '13px' }}>
                            ₹{day.total}
                          </span>
                        </div>
                        <div style={{ padding: '6px', backgroundColor: '#fff' }}>
                          {day.items.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', fontSize: '12px', borderBottom: '1px dotted var(--border)' }}>
                              <span style={{ color: 'var(--text)', fontWeight: '500' }}>{item.custName} ({item.paymentMode})</span>
                              <span style={{ color: 'var(--success)', fontWeight: '700' }}>₹{item.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {dailyCollections.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {db.settings.lang === 'mr' ? 'कोणतेही दैनिक रेकॉर्ड नाही.' : 'No daily collection summaries.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Past Months' Collections Archive Area */}
              <div className="card-section" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    📂 {db.settings.lang === 'mr' ? 'मागील महिन्यांचे जमा रेकॉर्ड (संग्रह)' : "Past Months' Collections Archive"}
                  </h3>
                  {!isCollectionArchiveUnlocked ? (
                    <span className="badge badge-expired">{db.settings.lang === 'mr' ? 'लॉक केलेले' : 'Locked'}</span>
                  ) : (
                    <button className="btn btn-sm" onClick={() => setIsCollectionArchiveUnlocked(false)}>
                      🔒 {db.settings.lang === 'mr' ? 'लॉक करा' : 'Lock Archive'}
                    </button>
                  )}
                </div>

                {!isCollectionArchiveUnlocked ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', backgroundColor: '#f8f9fc', borderRadius: '12px', border: '1px solid var(--border)', gap: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      {db.settings.lang === 'mr' ? 'मागील महिन्यांचे जमा रेकॉर्ड पाहण्यासाठी पासवर्ड टाका.' : 'Please enter the archive passcode to view past months\' collections.'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Passcode"
                        maxLength="6"
                        value={collectionArchivePinInput}
                        onChange={(e) => setCollectionArchivePinInput(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '120px', textAlign: 'center', WebkitUserSelect: 'text', userSelect: 'text' }}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          const correctPin = db.settings.archivePassword || '2001';
                          if (collectionArchivePinInput === correctPin) {
                            setIsCollectionArchiveUnlocked(true);
                            setCollectionArchivePinInput('');
                          } else {
                            showToast(db.settings.lang === 'mr' ? 'चुकीचा पासवर्ड!' : 'Incorrect passcode!', 'error');
                            setCollectionArchivePinInput('');
                          }
                        }}
                      >
                        {db.settings.lang === 'mr' ? 'अनलॉक' : 'Unlock'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {archiveCollectionMonths.map(monthGroup => {
                      return (
                        <div key={monthGroup.monthStr} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                              📂 {monthGroup.monthLabel}
                            </span>
                            <span style={{ fontWeight: '800', color: 'var(--success)' }}>
                              Total Received: ₹{monthGroup.total}
                            </span>
                          </div>
                          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px', backgroundColor: '#fff' }}>
                            {monthGroup.items.map((tx, idx) => (
                              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx === monthGroup.items.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{tx.custName} ({tx.paymentMode})</div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>📅 {tx.date}</div>
                                  {tx.note && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Note: {tx.note}</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--success)', fontSize: '13px' }}>₹{tx.amount}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {archiveCollectionMonths.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                        {db.settings.lang === 'mr' ? 'संग्रहात कोणतेही रेकॉर्ड सापडले नाही.' : 'No archived collection months found.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPENSES TAB */}
          {currentTab === 'expenses' && (
            <div className="tab-panel animate-fade">
              {/* Header Summary Cards */}
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(226, 75, 74, 0.1)', color: 'var(--danger)' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{db.settings.lang === 'mr' ? 'आजचा एकूण खर्च' : "Today's Total"}</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{todayExpenseTotal}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(226, 75, 74, 0.15)', color: 'var(--danger)' }}>
                    <TrendingUp size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{db.settings.lang === 'mr' ? 'चालू महिन्याचा खर्च' : "Current Month's Total"}</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{currentMonthExpenseTotal}</div>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Left Panel: Add Expense */}
                <div className="card-section">
                  <h3 className="section-title" style={{ marginBottom: '20px' }}>
                    {db.settings.lang === 'mr' ? 'नवीन खर्च नोंदवा' : 'Record New Expense'}
                  </h3>
                  <form onSubmit={saveExpense}>
                    <div className="form-group">
                      <label className="form-label">{db.settings.lang === 'mr' ? 'रक्कम (₹) *' : 'Amount (Rs) *'}</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 150"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        required
                        style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{db.settings.lang === 'mr' ? 'खर्चाचा तपशील / नोट *' : 'Expense Details / Note *'}</label>
                      <textarea
                        className="form-textarea"
                        placeholder={db.settings.lang === 'mr' ? 'उदा. भाजीपाला खरेदी, किराणा' : 'e.g. Vegetable purchase, Gas Cylinder'}
                        value={expenseForm.note}
                        onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                        required
                        style={{ height: '100px', WebkitUserSelect: 'text', userSelect: 'text' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                      {db.settings.lang === 'mr' ? 'खर्च जोडा' : 'Add Expense'}
                    </button>
                  </form>
                </div>

                {/* Right Panel: Daily Expenses & Range Filter */}
                <div className="card-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="section-title">
                      {db.settings.lang === 'mr' ? 'खर्चाची यादी' : 'Expenses List'}
                    </h3>
                    <div className="toolbar" style={{ margin: 0, gap: '6px' }}>
                      <button 
                        className={`btn btn-sm ${expenseFilter === 'today' ? 'btn-primary' : ''}`}
                        onClick={() => setExpenseFilter('today')}
                      >
                        {db.settings.lang === 'mr' ? 'आज' : 'Today'}
                      </button>
                      <button 
                        className={`btn btn-sm ${expenseFilter === 'custom' ? 'btn-primary' : ''}`}
                        onClick={() => setExpenseFilter('custom')}
                      >
                        {db.settings.lang === 'mr' ? 'तारीख निवडा' : 'Date Range'}
                      </button>
                      <button 
                        className={`btn btn-sm ${expenseFilter === 'month' ? 'btn-primary' : ''}`}
                        onClick={() => setExpenseFilter('month')}
                      >
                        {db.settings.lang === 'mr' ? 'चालू महिना' : 'Current Month'}
                      </button>
                    </div>
                  </div>

                  {expenseFilter === 'custom' && (
                    <div className="date-picker-row" style={{ display: 'flex', gap: '12px', padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', backgroundColor: 'var(--primary-light)', borderRadius: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                          {db.settings.lang === 'mr' ? 'पासून:' : 'From:'}
                        </span>
                        <input
                          type="date"
                          className="form-input"
                          value={expStartDate}
                          min={todayStr().slice(0, 7) + '-01'}
                          max={todayStr()}
                          onChange={(e) => setExpStartDate(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '13px', width: '130px', height: '30px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                          {db.settings.lang === 'mr' ? 'पर्यंत:' : 'To:'}
                        </span>
                        <input
                          type="date"
                          className="form-input"
                          value={expEndDate}
                          min={todayStr().slice(0, 7) + '-01'}
                          max={todayStr()}
                          onChange={(e) => setExpEndDate(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '13px', width: '130px', height: '30px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Filtered Expenses List */}
                  <div style={{ flex: 1, maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', backgroundColor: '#f8f9fc' }}>
                    {filteredExpenses.map((exp, idx) => (
                      <div key={exp.id} className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: idx === filteredExpenses.length - 1 ? 'none' : '1px solid var(--border)', gap: '12px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '6px', border: '1px solid var(--border)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{exp.note}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>📅 {exp.date}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: '800', color: 'var(--danger)', fontSize: '15px' }}>₹{exp.amount}</span>
                          <button 
                            className="btn btn-sm btn-icon btn-danger" 
                            title={db.settings.lang === 'mr' ? 'खर्च हटवा' : 'Delete Expense'}
                            onClick={() => deleteExpense(exp.id)}
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        {db.settings.lang === 'mr' ? 'कोणतेही रेकॉर्ड सापडले नाही.' : 'No expense records found.'}
                      </div>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="card" style={{ margin: 0, padding: '16px', backgroundColor: 'var(--danger-light)', borderColor: '#e24b4a33', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#791f1f' }}>
                      {db.settings.lang === 'mr' ? 'एकूण खर्च:' : 'Total Selected Expenses:'}
                    </span>
                    <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--danger)' }}>
                      ₹{filteredExpensesTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Past Months' Expense Archive Area */}
              <div className="card-section" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="section-title" style={{ margin: 0 }}>
                    📂 {db.settings.lang === 'mr' ? 'मागील महिन्यांचे खर्च रेकॉर्ड (संग्रह)' : "Past Months' Expense Archive"}
                  </h3>
                  {!isExpenseArchiveUnlocked ? (
                    <span className="badge badge-expired">{db.settings.lang === 'mr' ? 'लॉक केलेले' : 'Locked'}</span>
                  ) : (
                    <button className="btn btn-sm" onClick={() => setIsExpenseArchiveUnlocked(false)}>
                      🔒 {db.settings.lang === 'mr' ? 'लॉक करा' : 'Lock Archive'}
                    </button>
                  )}
                </div>

                {!isExpenseArchiveUnlocked ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', backgroundColor: '#f8f9fc', borderRadius: '12px', border: '1px solid var(--border)', gap: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      {db.settings.lang === 'mr' ? 'मागील महिन्यांचे खर्च पाहण्यासाठी पासवर्ड टाका.' : 'Please enter the archive passcode to view past months\' expenses.'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Passcode"
                        maxLength="6"
                        value={expenseArchivePinInput}
                        onChange={(e) => setExpenseArchivePinInput(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '120px', textAlign: 'center', WebkitUserSelect: 'text', userSelect: 'text' }}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          const correctPin = db.settings.archivePassword || '2001';
                          if (expenseArchivePinInput === correctPin) {
                            setIsExpenseArchiveUnlocked(true);
                            setExpenseArchivePinInput('');
                          } else {
                            showToast(db.settings.lang === 'mr' ? 'चुकीचा पासवर्ड!' : 'Incorrect passcode!', 'error');
                            setExpenseArchivePinInput('');
                          }
                        }}
                      >
                        {db.settings.lang === 'mr' ? 'अनलॉक' : 'Unlock'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {archiveExpenseMonths.map(monthGroup => {
                      return (
                        <div key={monthGroup.monthStr} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                              📂 {monthGroup.monthLabel}
                            </span>
                            <span style={{ fontWeight: '800', color: 'var(--danger)' }}>
                              Total: ₹{monthGroup.total}
                            </span>
                          </div>
                          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px', backgroundColor: '#fff' }}>
                            {monthGroup.items.map((exp, idx) => (
                              <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx === monthGroup.items.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{exp.note}</div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>📅 {exp.date}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontWeight: '700', color: 'var(--danger)', fontSize: '13px' }}>₹{exp.amount}</span>
                                  <button 
                                    className="btn btn-sm btn-icon btn-danger" 
                                    onClick={() => deleteExpense(exp.id)}
                                    style={{ width: '22px', height: '22px', padding: 0 }}
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {archiveExpenseMonths.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                        {db.settings.lang === 'mr' ? 'संग्रहात कोणतेही रेकॉर्ड सापडले नाही.' : 'No archived expense months found.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === 'settings' && (
            <div className="tab-panel animate-fade">
              <div className="card-section">
                <div className="section-header">
                  <span className="section-title">{t('systemSettings')}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {role !== 'owner' ? (
                    /* Simplified view for branch staff - language preference only */
                    <div className="form-row">
                      <div className="form-group" style={{ maxWidth: '50%' }}>
                        <label className="form-label">{t('langPreference')}</label>
                        <select
                          className="form-select"
                          value={db.settings.lang || 'en'}
                          onChange={(e) => saveDb({ ...db, settings: { ...db.settings, lang: e.target.value } })}
                        >
                          <option value="en">English</option>
                          <option value="mr">मराठी (Marathi)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    /* Full view for owner */
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">{t('messName')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={messNameInput}
                            onChange={(e) => setMessNameInput(e.target.value)}
                            onBlur={() => saveDb({ ...db, settings: { ...db.settings, messName: messNameInput } })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('ownerName')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={ownerNameInput}
                            onChange={(e) => setOwnerNameInput(e.target.value)}
                            onBlur={() => saveDb({ ...db, settings: { ...db.settings, ownerName: ownerNameInput } })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">{db.settings.lang === 'mr' ? 'मालकाचा UPI आयडी (उदा. name@upi)' : 'Owner UPI ID (e.g. name@upi)'}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={db.settings.upiId || ''}
                            onChange={(e) => saveDb({ ...db, settings: { ...db.settings, upiId: e.target.value.trim() } })}
                            placeholder="Enter UPI VPA ID"
                            style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ maxWidth: '50%' }}>
                          <label className="form-label">{t('langPreference')}</label>
                          <select
                            className="form-select"
                            value={db.settings.lang || 'en'}
                            onChange={(e) => saveDb({ ...db, settings: { ...db.settings, lang: e.target.value } })}
                          >
                            <option value="en">English</option>
                            <option value="mr">मराठी (Marathi)</option>
                          </select>
                        </div>
                        
                        <div className="form-group" style={{ maxWidth: '50%' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'या कॉम्प्युटरसाठी कार्यरत शाखा' : 'Active Branch for this Laptop'}</label>
                          <select
                            className="form-select"
                            value={activeBranch}
                            onChange={(e) => {
                              setActiveBranch(e.target.value);
                              localStorage.setItem('lokmanya_active_branch', e.target.value);
                              showToast(db.settings.lang === 'mr' ? 'शाखा बदलली!' : 'Active branch updated!', 'success');
                            }}
                          >
                            <option value="Branch 1">Branch 1 (Mess 1)</option>
                            <option value="Branch 2">Branch 2 (Mess 2)</option>
                          </select>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />

                      {/* WhatsApp Message Templates Section */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 className="section-title" style={{ fontSize: '15px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          💬 {db.settings.lang === 'mr' ? 'व्हॉट्सॲप मेसेज साचे (Templates)' : 'WhatsApp Message Templates'}
                        </h3>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">{db.settings.lang === 'mr' ? 'पेमेंट पावती मेसेज साचा' : 'Payment Receipt Template'}</label>
                            <textarea
                              className="form-input"
                              rows="2"
                              value={db.settings.whatsappReceiptTemplate || 'Dear [Name], we received your payment of ₹[Amount] on [Date]. Thank you! - [MessName]'}
                              onChange={(e) => saveDb({ ...db, settings: { ...db.settings, whatsappReceiptTemplate: e.target.value } })}
                              style={{ resize: 'vertical', fontSize: '13px', WebkitUserSelect: 'text', userSelect: 'text', height: '60px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              Placeholder tokens: <code>[Name]</code>, <code>[Amount]</code>, <code>[Date]</code>, <code>[MessName]</code>
                            </span>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">{db.settings.lang === 'mr' ? 'थकीत रक्कम आठवण मेसेज साचा' : 'Dues Reminder Template'}</label>
                            <textarea
                              className="form-input"
                              rows="2"
                              value={db.settings.whatsappDuesTemplate || 'Dear [Name], your plan is expiring soon. Pending dues: ₹[Dues]. Please pay: [UpiLink] - [MessName]'}
                              onChange={(e) => saveDb({ ...db, settings: { ...db.settings, whatsappDuesTemplate: e.target.value } })}
                              style={{ resize: 'vertical', fontSize: '13px', WebkitUserSelect: 'text', userSelect: 'text', height: '60px' }}
                            />
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              Placeholder tokens: <code>[Name]</code>, <code>[Dues]</code>, <code>[UpiLink]</code>, <code>[MessName]</code>
                            </span>
                          </div>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />

                      {/* PIN Settings Row */}
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {/* Owner Admin PIN */}
                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{t('ownerPin')}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                type={showSettingsPin ? "text" : "password"}
                                className="form-input"
                                maxLength="6"
                                placeholder="••••••"
                                value={newPinInput}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setNewPinInput(val);
                                }}
                                style={{ width: '100%', paddingRight: '40px' }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowSettingsPin(!showSettingsPin)}
                                style={{
                                  position: 'absolute',
                                  right: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-secondary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0
                                }}
                              >
                                {showSettingsPin ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                if (newPinInput.length !== 6) {
                                  showToast(db.settings.lang === 'mr' ? 'पिन अचूक ६ अंकी असणे आवश्यक आहे.' : 'PIN must be exactly 6 digits.', 'error');
                                  return;
                                }
                                saveDb({ ...db, settings: { ...db.settings, ownerPin: newPinInput } });
                                showToast(db.settings.lang === 'mr' ? 'पिन यशस्वीरित्या बदलला आणि जतन केला!' : 'PIN changed and saved successfully!', 'success');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>

                        {/* Branch 1 Staff PIN */}
                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'शाखा १ लॉगिन पिन' : 'Branch 1 Login PIN'}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="password"
                              className="form-input"
                              maxLength="6"
                              placeholder="••••••"
                              value={newBranch1PinInput}
                              onChange={(e) => setNewBranch1PinInput(e.target.value.replace(/\D/g, ''))}
                              style={{ flex: 1 }}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                if (newBranch1PinInput.length !== 6) {
                                  showToast(db.settings.lang === 'mr' ? 'पिन अचूक ६ अंकी असणे आवश्यक आहे.' : 'PIN must be exactly 6 digits.', 'error');
                                  return;
                                }
                                saveDb({ ...db, settings: { ...db.settings, branch1Pin: newBranch1PinInput } });
                                showToast(db.settings.lang === 'mr' ? 'शाखा १ पिन जतन केला!' : 'Branch 1 PIN saved successfully!', 'success');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>

                        {/* Branch 2 Staff PIN */}
                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'शाखा २ लॉगिन पिन' : 'Branch 2 Login PIN'}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="password"
                              className="form-input"
                              maxLength="6"
                              placeholder="••••••"
                              value={newBranch2PinInput}
                              onChange={(e) => setNewBranch2PinInput(e.target.value.replace(/\D/g, ''))}
                              style={{ flex: 1 }}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                if (newBranch2PinInput.length !== 6) {
                                  showToast(db.settings.lang === 'mr' ? 'पिन अचूक ६ अंकी असणे आवश्यक आहे.' : 'PIN must be exactly 6 digits.', 'error');
                                  return;
                                }
                                saveDb({ ...db, settings: { ...db.settings, branch2Pin: newBranch2PinInput } });
                                showToast(db.settings.lang === 'mr' ? 'शाखा २ पिन जतन केला!' : 'Branch 2 PIN saved successfully!', 'success');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />
                      
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '15px' }}>
                          {db.settings.lang === 'mr' ? 'जुने ग्राहक आर्काइव्ह संकेतशब्द सेटिंग्ज' : 'Old Customers Archive Passcode settings'}
                        </label>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>{db.settings.lang === 'mr' ? 'डेव्हलपर मास्टर की' : 'Developer Master Key'}</label>
                            <input
                              type="password"
                              className="form-input"
                              placeholder="Developer Key"
                              value={devKeyInput}
                              onChange={(e) => setDevKeyInput(e.target.value)}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <label className="form-label" style={{ fontSize: '12px' }}>{db.settings.lang === 'mr' ? 'नवीन आर्काइव्ह पासवर्ड' : 'New Archive Password'}</label>
                            <input
                              type="password"
                              className="form-input"
                              maxLength="6"
                              placeholder="New Passcode"
                              value={newArchivePinInput}
                              onChange={(e) => setNewArchivePinInput(e.target.value.replace(/\D/g, ''))}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                if (devKeyInput !== 'LKMESSDEV2026') {
                                  showToast(db.settings.lang === 'mr' ? 'चुकीची डेव्हलपर मास्टर की!' : 'Invalid Developer Master Key!', 'error');
                                  return;
                                }
                                if (newArchivePinInput.length < 4) {
                                  showToast(db.settings.lang === 'mr' ? 'पासवर्ड किमान ४ अंकी असावा!' : 'Password must be at least 4 digits!', 'error');
                                  return;
                                }
                                saveDb({ ...db, settings: { ...db.settings, archivePassword: newArchivePinInput } });
                                setDevKeyInput('');
                                setNewArchivePinInput('');
                                showToast(db.settings.lang === 'mr' ? 'आर्काइव्ह पासवर्ड यशस्वीरित्या बदलला!' : 'Archive passcode updated successfully!', 'success');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'अपडेट करा' : 'Update Passcode'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />

                      <div>
                        <label className="form-label">Local Data & Backups</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button className="btn" onClick={() => {
                            const dbString = JSON.stringify(db, null, 2);
                            const blob = new Blob([dbString], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute("download", `lokmanya_db_backup_${todayStr()}.json`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}>
                            Download DB Backup file
                          </button>
                          <label className="btn" style={{ cursor: 'pointer' }}>
                            Import DB Backup file
                            <input
                              type="file"
                              accept=".json"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = async (evt) => {
                                  try {
                                    const parsed = JSON.parse(evt.target.result);
                                    if (parsed.customers && parsed.settings) {
                                      await saveDb(parsed);
                                      alert('Database imported successfully!');
                                      window.location.reload();
                                    } else {
                                      alert('Invalid database backup file format.');
                                    }
                                  } catch (err) {
                                    alert('Error reading file: ' + err.message);
                                  }
                                };
                                reader.readAsText(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {payModalCustomer && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">
                {db.settings.lang === 'mr' ? 'पेमेंट नोंदवा' : 'Record Payment'}
              </span>
              <X className="modal-close" onClick={() => setPayModalCustomer(null)} />
            </div>
            <form onSubmit={handlePaySubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '16px', background: 'rgba(216, 90, 48, 0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(216, 90, 48, 0.1)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {db.settings.lang === 'mr' ? 'ग्राहक' : 'Customer'}:
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
                    {payModalCustomer.name}
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">{db.settings.lang === 'mr' ? 'रक्कम (Amount) ₹' : 'Amount ₹'}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{db.settings.lang === 'mr' ? 'तारीख (Date)' : 'Date'}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{db.settings.lang === 'mr' ? 'पेमेंट पद्धत (Mode)' : 'Payment Mode'}</label>
                  <select
                    className="form-select"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                  >
                    <option value="Cash">{db.settings.lang === 'mr' ? 'रोख (Cash)' : 'Cash'}</option>
                    <option value="UPI">{db.settings.lang === 'mr' ? 'ऑनलाईन (UPI)' : 'UPI'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{db.settings.lang === 'mr' ? 'टीप (Note)' : 'Note'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder={db.settings.lang === 'mr' ? 'उदा. रोख मिळाला, सवलत दिली' : 'e.g. Paid by friend, discount'}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setPayModalCustomer(null)}>
                  {db.settings.lang === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-success">
                  {db.settings.lang === 'mr' ? 'नोंदवा' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT HISTORY MODAL */}
      {historyModalCustomer && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <span className="modal-title">
                {db.settings.lang === 'mr' ? 'पेमेंट इतिहास' : 'Payment History'}
              </span>
              <X className="modal-close" onClick={() => setHistoryModalCustomer(null)} />
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px', background: 'var(--bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {db.settings.lang === 'mr' ? 'ग्राहक' : 'Customer'}:
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
                  {historyModalCustomer.name}
                </div>
              </div>

              {(db.transactions || []).filter(t => t.custId === historyModalCustomer.id).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)' }}>
                  {db.settings.lang === 'mr' ? 'कोणताही पेमेंट इतिहास आढळला नाही.' : 'No payment history records found.'}
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>{db.settings.lang === 'mr' ? 'तारीख' : 'Date'}</th>
                        <th>{db.settings.lang === 'mr' ? 'रक्कम' : 'Amount'}</th>
                        <th>{db.settings.lang === 'mr' ? 'पद्धत' : 'Mode'}</th>
                        <th>{db.settings.lang === 'mr' ? 'टीप' : 'Note'}</th>
                        <th style={{ textAlign: 'right' }}>{db.settings.lang === 'mr' ? 'क्रिया' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(db.transactions || [])
                        .filter(t => t.custId === historyModalCustomer.id)
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map(t => (
                          <tr key={t.id}>
                            <td>{t.date}</td>
                            <td style={{ fontWeight: '700', color: 'var(--success)' }}>₹{t.amount}</td>
                            <td>
                              <span className={`badge ${t.paymentMode === 'UPI' ? 'badge-active' : 'badge-expiring'}`}>
                                {t.paymentMode === 'UPI' ? 'UPI' : 'Cash'}
                              </span>
                            </td>
                            <td>{t.note || '-'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="btn btn-sm btn-icon btn-danger" 
                                style={{ width: '28px', height: '28px' }}
                                onClick={() => handleDeleteTxn(t.id, t.custId, t.amount)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setHistoryModalCustomer(null)}>
                {db.settings.lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER MODAL */}
      {custModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-title">{editCustId ? t('editCustProfile') : t('addNewCust')}</span>
              <X className="modal-close" onClick={() => setCustModal(false)} />
            </div>
            <div className="modal-body">
              {/* Profile Photo Capture Section */}
              <div className="avatar-capture-section">
                {isCameraActive ? (
                  <div className="camera-box">
                    <video ref={setVideoRef} autoPlay playsInline className="camera-video" />
                    <div className="camera-controls">
                      {cameraDevices.length > 1 && (
                        <select className="form-select camera-select" value={selectedCameraId} onChange={handleCameraChange}>
                          {cameraDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || `Camera ${cameraDevices.indexOf(device) + 1}`}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="camera-button-row">
                        <button className="btn btn-success btn-sm" onClick={capturePhoto}>{t('capture')}</button>
                        <button className="btn btn-danger btn-sm" onClick={stopCamera}>{t('cancel')}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="avatar-display-box">
                    {custForm.photo ? (
                      <div className="avatar-preview-wrapper">
                        <img src={custForm.photo} className="avatar-large" alt="Profile" />
                        <button className="btn btn-sm btn-danger remove-photo-btn" onClick={() => setCustForm(prev => ({ ...prev, photo: '' }))}>{t('removePhoto')}</button>
                      </div>
                    ) : (
                      <div className="avatar-large-placeholder">
                        👤
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button className="btn btn-sm" onClick={startCamera}>
                        📸 {t('takePhoto')}
                      </button>
                      <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
                        📁 {t('uploadPhoto')}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setCustForm(prev => ({ ...prev, photo: evt.target.result }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('fullName')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('phoneNo')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 9876543210"
                    value={custForm.phone}
                    inputMode="numeric"
                    maxLength="10"
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setCustForm({ ...custForm, phone: digitsOnly });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('aadharCard')}</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength="12"
                    value={custForm.aadhar}
                    onChange={(e) => setCustForm({ ...custForm, aadhar: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </div>
              {currentTab === 'shortterm' ? (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{db.settings.lang === 'mr' ? 'कालावधी (दिवस) *' : 'Duration (Days) *'}</label>
                    <input
                      type="number"
                      className="form-input"
                      value={shortTermDays}
                      onChange={(e) => {
                        const days = e.target.value;
                        setShortTermDays(days);
                        const amt = Number(days) * Number(shortTermMeals) * 80;
                        setCustForm(prev => ({ ...prev, amount: String(amt) }));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{db.settings.lang === 'mr' ? 'रोजचे जेवण *' : 'Meals Per Day *'}</label>
                    <select
                      className="form-select"
                      value={shortTermMeals}
                      onChange={(e) => {
                        const meals = e.target.value;
                        setShortTermMeals(meals);
                        const amt = Number(shortTermDays) * Number(meals) * 80;
                        setCustForm(prev => ({ ...prev, amount: String(amt) }));
                      }}
                    >
                      <option value="1">1 Meal / Day</option>
                      <option value="2">2 Meals / Day</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('billingPlan')}</label>
                    <select
                      className="form-select"
                      value={custForm.plan}
                      onChange={(e) => {
                        const plan = e.target.value;
                        const amount = plan === 'Monthly' ? '1500' : plan === 'Weekly' ? '500' : plan === 'Daily' ? '80' : '0';
                        setCustForm({ ...custForm, plan, amount, deposited: '0' });
                      }}
                    >
                      <option value="Monthly">{t('monthly30')}</option>
                      <option value="Weekly">{t('weekly7')}</option>
                      <option value="Daily">{t('daily1')}</option>
                      <option value="Custom">{t('custom')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('subFeeLabel')}</label>
                    <input
                      type="number"
                      className="form-input"
                      value={custForm.amount}
                      onChange={(e) => setCustForm({ ...custForm, amount: e.target.value })}
                      readOnly={currentTab === 'shortterm'}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t('depositLabel')}</label>
                <input
                  type="number"
                  className="form-input"
                  value={custForm.deposited}
                  onChange={(e) => setCustForm({ ...custForm, deposited: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('joinDateLabel')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={custForm.joinDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const originalCust = db.customers.find(c => c.id === editCustId);
                    const originalJoinDate = originalCust ? originalCust.joinDate : '';
                    const shouldResetDeposit = editCustId && originalJoinDate && originalJoinDate !== newDate;
                    setCustForm(prev => ({
                      ...prev,
                      joinDate: newDate,
                      deposited: shouldResetDeposit ? '0' : prev.deposited
                    }));
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {currentTab === 'tiffin' 
                    ? (db.settings.lang === 'mr' ? 'टिफिन डिलिव्हरी पत्ता *' : 'Tiffin Delivery Address *')
                    : t('addressLabel')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={currentTab === 'tiffin' ? (db.settings.lang === 'mr' ? 'उदा. फ्लैट ३०४, साई सावली अपार्टमेंट' : 'e.g. Flat 304, Sai Savli Apartment') : t('addressPlaceholder')}
                  value={custForm.addr}
                  onChange={(e) => setCustForm({ ...custForm, addr: e.target.value })}
                  required={currentTab === 'tiffin'}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setCustModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={saveCustomer}>{t('saveProfile')}</button>
            </div>
          </div>
        </div>
      )}


      {/* PROFILE IMAGE PREVIEW OVERLAY */}
      {previewImage && (
        <div 
          className="image-preview-overlay"
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.75)', 
            zIndex: 3000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div 
            style={{ 
              position: 'relative', 
              background: 'var(--card)', 
              padding: '16px', 
              borderRadius: '16px', 
              boxShadow: 'var(--shadow-lg)', 
              maxWidth: '90%', 
              width: '420px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                fontSize: '18px',
                fontWeight: 'bold',
                zIndex: 10
              }}
            >
              ✕
            </button>
            <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border)' }}>
              <img 
                src={previewImage.url} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt={previewImage.name} 
              />
            </div>
            <div style={{ marginTop: '14px', fontSize: '16px', fontWeight: '700', color: 'var(--text)', textAlign: 'center' }}>
              {previewImage.name}
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION RECEIPT MODAL */}
      {receiptModalCustomer && receiptModalTxn && (
        <div className="modal-overlay" style={{ zIndex: 2500 }}>
          <div className="modal-card" style={{ maxWidth: '420px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                ✓ {db.settings.lang === 'mr' ? 'पेमेंट नोंदवले गेले!' : 'Payment Receipt'}
              </span>
              <X className="modal-close" onClick={() => { setReceiptModalCustomer(null); setReceiptModalTxn(null); }} />
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px' }}>
              <div style={{ backgroundColor: 'var(--success-light)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                  {db.settings.lang === 'mr' ? 'प्राप्त रक्कम' : 'Amount Received'}
                </span>
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--success)', display: 'block', marginTop: '4px' }}>
                  ₹{receiptModalTxn.amount}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{db.settings.lang === 'mr' ? 'ग्राहक:' : 'Customer:'}</span>
                  <span style={{ color: 'var(--text)', fontWeight: '700' }}>{receiptModalCustomer.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{db.settings.lang === 'mr' ? 'तारीख:' : 'Date:'}</span>
                  <span style={{ color: 'var(--text)', fontWeight: '700' }}>{receiptModalTxn.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{db.settings.lang === 'mr' ? 'पेमेंट पद्धत:' : 'Payment Mode:'}</span>
                  <span style={{ color: 'var(--text)', fontWeight: '700' }}>{receiptModalTxn.paymentMode}</span>
                </div>
                {receiptModalTxn.note && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{db.settings.lang === 'mr' ? 'टीप:' : 'Note:'}</span>
                    <span style={{ color: 'var(--text)', fontWeight: '700' }}>{receiptModalTxn.note}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Sharing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const template = db.settings.whatsappReceiptTemplate || 'Dear [Name], we received your payment of ₹[Amount] on [Date]. Thank you! - [MessName]';
                    const formattedMsg = template
                      .replace(/\[Name\]/g, receiptModalCustomer.name)
                      .replace(/\[Amount\]/g, receiptModalTxn.amount)
                      .replace(/\[Date\]/g, receiptModalTxn.date)
                      .replace(/\[MessName\]/g, db.settings.messName || 'Lokmanya Mess');
                    window.open(getWhatsAppShareUrl(receiptModalCustomer.phone, formattedMsg), 'whatsapp_share_tab');
                  }}
                  style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '700', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%' }}
                >
                  💬 {db.settings.lang === 'mr' ? 'व्हॉट्सॲपवर पावती पाठवा' : 'Send WhatsApp Receipt'}
                </button>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
              <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { setReceiptModalCustomer(null); setReceiptModalTxn(null); }}>
                {db.settings.lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP BULK DUES ASSISTANT MODAL */}
      {showBulkSmsModal && (
        <div className="modal-overlay" style={{ zIndex: 2500 }}>
          <div className="modal-card" style={{ maxWidth: '500px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                💬 {db.settings.lang === 'mr' ? 'व्हॉट्सॲप थकीत रक्कम सहाय्यक' : 'WhatsApp Dues Assistant'}
              </span>
              <X className="modal-close" onClick={() => setShowBulkSmsModal(false)} />
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Target Branch & Category info */}
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{db.settings.lang === 'mr' ? 'शाखा:' : 'Target Branch:'}</span>
                  <span style={{ fontWeight: '700', color: 'var(--text)' }}>{activeBranch}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{db.settings.lang === 'mr' ? 'ग्राहक गट (Category):' : 'Target Category:'}</span>
                  <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                    {currentTab === 'tiffin' 
                      ? (db.settings.lang === 'mr' ? 'टिफिन डिलीव्हरी' : 'Tiffin Delivery')
                      : currentTab === 'shortterm'
                      ? (db.settings.lang === 'mr' ? 'अल्पमुदतीचे ग्राहक' : 'Short-Term Members')
                      : (db.settings.lang === 'mr' ? 'डाईन-इन ग्राहक' : 'Dine-in Members')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{db.settings.lang === 'mr' ? 'एकूण थकीत ग्राहक:' : 'Total Due Customers:'}</span>
                  <span style={{ fontWeight: '700', color: 'var(--danger)' }}>
                    {getBulkDueCustomers().length}
                  </span>
                </div>
              </div>

              {/* Scrollable list of due customers to message */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  {db.settings.lang === 'mr' ? 'थकीत ग्राहक यादी (क्लिक करून पाठवा):' : 'Due Customers (Click to send):'}
                </span>
                
                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px', backgroundColor: 'var(--bg)' }}>
                  {getBulkDueCustomers().map(c => {
                    const remaining = getCustomerDues(c);
                    const isSent = sentCustomers.includes(c.id);
                    return (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)', borderRadius: '6px', backgroundColor: isSent ? '#f1f5f9' : '#fff' }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: isSent ? 'var(--text-secondary)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📱 {c.phone} | Dues: <span style={{ fontWeight: '700', color: 'var(--danger)' }}>₹{remaining}</span></div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => {
                            const template = db.settings.whatsappDuesTemplate || 'Dear [Name], your plan is expiring soon. Pending dues: ₹[Dues]. Please pay: [UpiLink] - [MessName]';
                            const formattedMsg = template
                              .replace(/https?:\/\/\s*\[UpiLink\]/gi, '[UpiLink]')
                              .replace(/\[Name\]/g, c.name)
                              .replace(/\[Dues\]/g, remaining)
                              .replace(/\[MessName\]/g, db.settings.messName || 'Lokmanya Mess')
                              .replace(/\[UpiLink\]/g, getUpiRedirectUrl(remaining));
                            
                            window.open(getWhatsAppShareUrl(c.phone, formattedMsg), 'whatsapp_share_tab');
                            setSentCustomers(prev => [...prev, c.id]);
                          }}
                          style={{ 
                            height: '28px', 
                            padding: '0 8px', 
                            fontSize: '11px', 
                            backgroundColor: isSent ? '#94a3b8' : '#22c55e', 
                            borderColor: isSent ? '#94a3b8' : '#22c55e', 
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {isSent ? '✓ Sent' : '💬 Send'}
                        </button>
                      </div>
                    );
                  })}
                  {getBulkDueCustomers().length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      🎉 {db.settings.lang === 'mr' ? 'कोणतीही प्रलंबित देणी नाहीत!' : 'No pending dues found!'}
                    </div>
                  )}
                </div>
              </div>

              {/* Help tip */}
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                ℹ️ {db.settings.lang === 'mr' ? 'टिप: हे बटन दाबल्यावर त्या ग्राहकाचे चॅट उघडेल आणि मेसेजमध्ये रक्कम व UPI पेमेंट लिंक ऑटो-फिल होईल.' : 'Tip: Clicking Send opens WhatsApp with their custom amount and UPI payment link pre-filled.'}
              </div>

            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%' }}
                onClick={() => setShowBulkSmsModal(false)}
              >
                {db.settings.lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION CONTAINER FOR MAIN APP */}
      {toast && (
        <div className="toast-notification" style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '700',
          animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}