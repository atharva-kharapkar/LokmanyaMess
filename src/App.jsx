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
  IndianRupee,
  History,
  Eye,
  EyeOff,
  RotateCcw,
  Coins,
  TrendingUp
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, query, limit } from 'firebase/firestore';
import { db as firestoreDb, firebaseBootError } from './firebase';

const isElectron = typeof window !== 'undefined' && window.electronAPI;
const isCloudSyncAvailable = Boolean(firestoreDb);

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
const PIN_LENGTH = 6;
const ARCHIVE_PIN_MIN_LENGTH = 4;
const ARCHIVE_PIN_MAX_LENGTH = 6;

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const isBlank = (value) => normalizeText(value).length === 0;
const isExactDigits = (value, length) => new RegExp(`^\\d{${length}}$`).test(String(value ?? ''));
const isArchivePinValid = (value) => /^\d{4}$/.test(String(value ?? ''));
const toAmountNumber = (value) => Number(String(value ?? '').trim());

function sha256Pure(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiLength = ascii[lengthProperty] * 8;
  
  const hash = [];
  const k = [];
  let primeCounter = 0;

  const getPrime = (candidate) => {
    for (let factor = 2; factor * factor <= candidate; factor++) {
      if (candidate % factor === 0) return false;
    }
    return true;
  };

  let candidate = 2;
  while (primeCounter < 64) {
    if (getPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
    candidate++;
  }
  
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) {
    ascii += '\x00';
  }
  
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return; // ASCII only
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiLength | 0);
  
  let hash0 = hash[0], hash1 = hash[1], hash2 = hash[2], hash3 = hash[3],
      hash4 = hash[4], hash5 = hash[5], hash6 = hash[6], hash7 = hash[7];

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = words.slice(i, i + 16);
    let oldHash0 = hash0, oldHash1 = hash1, oldHash2 = hash2, oldHash3 = hash3,
        oldHash4 = hash4, oldHash5 = hash5, oldHash6 = hash6, oldHash7 = hash7;

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const w15 = w[j - 15], w2 = w[j - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const ch = (hash4 & hash5) ^ (~hash4 & hash6);
      const maj = (hash0 & hash1) ^ (hash0 & hash2) ^ (hash1 & hash2);
      const s0 = rightRotate(hash0, 2) ^ rightRotate(hash0, 13) ^ rightRotate(hash0, 22);
      const s1 = rightRotate(hash4, 6) ^ rightRotate(hash4, 11) ^ rightRotate(hash4, 25);
      const temp1 = (hash7 + s1 + ch + k[j] + w[j]) | 0;
      const temp2 = (s0 + maj) | 0;

      hash7 = hash6;
      hash6 = hash5;
      hash5 = hash4;
      hash4 = (hash3 + temp1) | 0;
      hash3 = hash2;
      hash2 = hash1;
      hash1 = hash0;
      hash0 = (temp1 + temp2) | 0;
    }

    hash0 = (hash0 + oldHash0) | 0;
    hash1 = (hash1 + oldHash1) | 0;
    hash2 = (hash2 + oldHash2) | 0;
    hash3 = (hash3 + oldHash3) | 0;
    hash4 = (hash4 + oldHash4) | 0;
    hash5 = (hash5 + oldHash5) | 0;
    hash6 = (hash6 + oldHash6) | 0;
    hash7 = (hash7 + oldHash7) | 0;
  }

  const h = [hash0, hash1, hash2, hash3, hash4, hash5, hash6, hash7];
  for (i = 0; i < 8; i++) {
    const val = h[i];
    result += ((val >>> 24) & 0xff).toString(16).padStart(2, '0') +
              ((val >>> 16) & 0xff).toString(16).padStart(2, '0') +
              ((val >>> 8) & 0xff).toString(16).padStart(2, '0') +
              (val & 0xff).toString(16).padStart(2, '0');
  }
  return result;
}

async function hashSecret(secret) {
  const normalized = String(secret ?? '');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('crypto.subtle failed, falling back to pure JS hash:', e);
    }
  }
  return sha256Pure(normalized);
}

async function secureSettings(inputSettings = {}) {
  const nextSettings = { ...inputSettings };
  const secretFields = [
    ['ownerPin', 'ownerPinHash', (value) => isExactDigits(value, PIN_LENGTH)],
    ['branch1Pin', 'branch1PinHash', (value) => isExactDigits(value, PIN_LENGTH)],
    ['branch2Pin', 'branch2PinHash', (value) => isExactDigits(value, PIN_LENGTH)],
    ['archivePassword', 'archivePasswordHash', isArchivePinValid],
  ];

  for (const [legacyKey, hashKey, validator] of secretFields) {
    const rawValue = nextSettings[legacyKey];
    if (validator(rawValue)) {
      nextSettings[hashKey] = await hashSecret(rawValue);
    }
    delete nextSettings[legacyKey];
  }

  return nextSettings;
}

function hasLegacySecrets(settings = {}) {
  return ['ownerPin', 'branch1Pin', 'branch2Pin', 'archivePassword'].some((key) => Boolean(settings[key]));
}

async function matchesSecret(candidate, storedHash, expectedLength) {
  if (!isExactDigits(candidate, expectedLength)) return false;
  if (!storedHash) return false;
  return (await hashSecret(candidate)) === storedHash;
}

async function matchesArchiveSecret(candidate, storedHash) {
  if (!/^\d{4,6}$/.test(String(candidate ?? ''))) return false;
  if (!storedHash) return false;
  return (await hashSecret(candidate)) === storedHash;
}

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
    ownerAddress: "Mess Address",
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
    ownerAddress: "मेसचा पत्ता",
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

function getDaysPendingDues(c) {
  if (!c || !c.joinDate || c.status === 'old') return 0;
  const dues = getCustomerDues(c);
  if (dues <= 0) return 0;

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = parseLocalDate(c.joinDate);

  if (c.category === 'shortterm') {
    const diffTime = todayMidnight - startDate;
    return Math.max(0, Math.round(diffTime / 86400000));
  }

  const daysPerCycle = PLAN_DAYS[c.plan] || 30;
  const amount = Number(c.amount || 0);
  if (amount <= 0) return 0;

  const paidCycles = Math.floor((c.deposited || 0) / amount);
  const unpaidCycleStartDate = new Date(startDate);
  unpaidCycleStartDate.setDate(startDate.getDate() + paidCycles * daysPerCycle);

  const diffTime = todayMidnight - unpaidCycleStartDate;
  return Math.max(0, Math.round(diffTime / 86400000));
}

function sanitizeImportedDb(rawDb) {
  if (!rawDb || typeof rawDb !== 'object' || Array.isArray(rawDb)) {
    throw new Error('Backup file must contain a valid database object.');
  }

  const ensureArray = (value, label) => {
    if (value == null) return [];
    if (!Array.isArray(value)) {
      throw new Error(`${label} must be an array.`);
    }
    return value;
  };

  const ensureObject = (value, label) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${label} must be an object.`);
    }
    return value;
  };

  const customers = ensureArray(rawDb.customers, 'customers').map((item, index) => {
    const customer = ensureObject(item, `customers[${index}]`);
    if (typeof customer.id !== 'string' || customer.id.trim() === '') {
      throw new Error(`customers[${index}] is missing a valid id.`);
    }
    return customer;
  });

  const transactions = ensureArray(rawDb.transactions, 'transactions').map((item, index) => {
    const txn = ensureObject(item, `transactions[${index}]`);
    if (typeof txn.id !== 'string' || txn.id.trim() === '') {
      throw new Error(`transactions[${index}] is missing a valid id.`);
    }
    return txn;
  });

  const employees = ensureArray(rawDb.employees, 'employees').map((item, index) => {
    const employee = ensureObject(item, `employees[${index}]`);
    if (typeof employee.id !== 'string' || employee.id.trim() === '') {
      throw new Error(`employees[${index}] is missing a valid id.`);
    }
    return employee;
  });

  const salaries = ensureArray(rawDb.salaries, 'salaries').map((item, index) => {
    const salary = ensureObject(item, `salaries[${index}]`);
    if (typeof salary.id !== 'string' || salary.id.trim() === '') {
      throw new Error(`salaries[${index}] is missing a valid id.`);
    }
    return salary;
  });

  const expenses = ensureArray(rawDb.expenses, 'expenses').map((item, index) => {
    const expense = ensureObject(item, `expenses[${index}]`);
    if (typeof expense.id !== 'string' || expense.id.trim() === '') {
      throw new Error(`expenses[${index}] is missing a valid id.`);
    }
    return expense;
  });

  const settings = ensureObject(rawDb.settings, 'settings');

  return {
    customers,
    transactions,
    employees,
    salaries,
    expenses,
    settings
  };
}

function isOwnerRole(role) {
  return role === 'owner';
}

function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
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
      paymentPhone: '',
      whatsappDuesTemplate: '',
      ownerPinHash: '',
      messName: 'Lokmanya Mess',
      ownerName: 'Mess Owner',
      ownerAddress: ''
    }
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinPad, setShowPinPad] = useState(true);
  const [introPlayed, setIntroPlayed] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [newPinInput, setNewPinInput] = useState('');
  const [showSettingsPin, setShowSettingsPin] = useState(false);
  const [role, setRole] = useState(null);
  const [newBranch1PinInput, setNewBranch1PinInput] = useState('');
  const [newBranch2PinInput, setNewBranch2PinInput] = useState('');

  const [toast, setToast] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [messNameInput, setMessNameInput] = useState('');
  const [ownerNameInput, setOwnerNameInput] = useState('');
  const [ownerAddressInput, setOwnerAddressInput] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [paymentPhoneInput, setPaymentPhoneInput] = useState('');
  const [whatsappDuesTemplateInput, setWhatsappDuesTemplateInput] = useState('');
  const [activeBranch, setActiveBranch] = useState('Branch 1');
  const [isArchiveUnlocked, setIsArchiveUnlocked] = useState(false);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [settingsPinInput, setSettingsPinInput] = useState('');
  const [archivePinInput, setArchivePinInput] = useState('');
  const [archivePinOwnerAuthInput, setArchivePinOwnerAuthInput] = useState('');
  const [archiveOwnerPinInput, setArchiveOwnerPinInput] = useState('');
  const [newArchivePinInput, setNewArchivePinInput] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);
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
  const dbRef = useRef(db);
  const saveQueueRef = useRef(Promise.resolve());
  const savePendingCountRef = useRef(0);
  const lastSaveRequestRef = useRef(null);
  const [saveHealth, setSaveHealth] = useState({
    status: 'idle',
    pending: 0,
    lastSavedAt: '',
    lastLocalSaveAt: '',
    lastCloudSyncAt: '',
    lastError: ''
  });

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  useEffect(() => {
    currentTabRef.current = currentTab;
    // Automatically lock settings and old customers archive when navigating away
    if (currentTab !== 'settings') {
      setIsSettingsUnlocked(false);
      setSettingsPinInput('');
    }
    if (currentTab !== 'oldcustomers') {
      setIsArchiveUnlocked(false);
      setArchivePinInput('');
    }
  }, [currentTab]);

  useEffect(() => {
    showCalculatorRef.current = showCalculator;
  }, [showCalculator]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const applyLoadedSettings = useCallback((settings = {}) => {
    setNewPinInput('');
    setNewBranch1PinInput('');
    setNewBranch2PinInput('');
    setMessNameInput(settings.messName || 'Lokmanya Mess');
    setOwnerNameInput(settings.ownerName || 'Mess Owner');
    setOwnerAddressInput(settings.ownerAddress || '');
    setUpiIdInput(settings.upiId || '');
    setPaymentPhoneInput(settings.paymentPhone || '');
    setWhatsappDuesTemplateInput(settings.whatsappDuesTemplate || '');
  }, []);

  const persistDb = useCallback(async (nextDb) => {
    const securedSettings = await secureSettings(nextDb.settings || {});
    return { ...nextDb, settings: securedSettings };
  }, []);

  const writeLocalBackup = useCallback(async (sanitizedDb) => {
    if (isElectron) {
      const writeResult = await window.electronAPI.writeDatabase(sanitizedDb);
      if (!writeResult || !writeResult.success) {
        throw new Error(writeResult?.error || 'Local backup write failed.');
      }

      const persistedDb = await window.electronAPI.readDatabase();
      if (JSON.stringify(persistedDb) !== JSON.stringify(sanitizedDb)) {
        throw new Error('Local backup verification failed.');
      }
      return;
    }

    const serialized = JSON.stringify(sanitizedDb);
    localStorage.setItem('lokmanya_db', serialized);
    if (localStorage.getItem('lokmanya_db') !== serialized) {
      throw new Error('Browser backup verification failed.');
    }
  }, []);

  const syncCollectionDiff = useCallback(async (collectionName, oldList = [], newList = []) => {
    if (!isCloudSyncAvailable) {
      return;
    }

    if (JSON.stringify(oldList) === JSON.stringify(newList)) {
      return;
    }

    const oldMap = new Map(oldList.map((item) => [item.id, item]));
    const newMap = new Map(newList.map((item) => [item.id, item]));

    for (const item of newList) {
      const oldItem = oldMap.get(item.id);
      if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
        await setDoc(doc(firestoreDb, collectionName, item.id), item);
      }
    }

    for (const item of oldList) {
      if (!newMap.has(item.id)) {
        await deleteDoc(doc(firestoreDb, collectionName, item.id));
      }
    }
  }, []);

  const syncDbToCloud = useCallback(async (oldDb, sanitizedDb) => {
    if (!isCloudSyncAvailable) {
      return false;
    }

    if (JSON.stringify(oldDb.settings) !== JSON.stringify(sanitizedDb.settings)) {
      await setDoc(doc(firestoreDb, 'desktop_config', 'app_settings'), sanitizedDb.settings);
    }

    await syncCollectionDiff('desktop_customers', oldDb.customers || [], sanitizedDb.customers || []);
    await syncCollectionDiff('desktop_transactions', oldDb.transactions || [], sanitizedDb.transactions || []);
    await syncCollectionDiff('desktop_employees', oldDb.employees || [], sanitizedDb.employees || []);
    await syncCollectionDiff('desktop_salaries', oldDb.salaries || [], sanitizedDb.salaries || []);
    await syncCollectionDiff('desktop_expenses', oldDb.expenses || [], sanitizedDb.expenses || []);
    return true;
  }, [syncCollectionDiff]);

  const saveSettingField = useCallback(async (key, rawValue, options = {}) => {
    const { required = false, label = key } = options;
    const cleanedValue = normalizeText(rawValue);
    const isMarathi = db.settings && db.settings.lang === 'mr';

    if (required && isBlank(cleanedValue)) {
      showToast(
        isMarathi ? `${label} रिकामे ठेवता येणार नाही.` : `${label} cannot be blank.`,
        'error'
      );
      return false;
    }

    await saveDb((currentDb) => ({
      ...currentDb,
      settings: {
        ...currentDb.settings,
        [key]: cleanedValue
      }
    }));
    return true;
  }, [db.settings, showToast]);

  const saveArchivePasscodeSetting = useCallback(async (value) => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    if (!isArchivePinValid(value)) {
      showToast(isMarathi ? 'पासवर्ड केवळ ४ अंकी असावा.' : 'Passcode must be exactly 4 digits.', 'error');
      return false;
    }

    await saveDb(async (currentDb) => ({
      ...currentDb,
      settings: {
        ...currentDb.settings,
        archivePasswordHash: await hashSecret(value)
      }
    }));
    showToast(isMarathi ? 'आर्काइव्ह संकेतशब्द यशस्वीरित्या बदलला!' : 'Archive passcode updated successfully!', 'success');
    return true;
  }, [db.settings, showToast]);

  const savePinSetting = useCallback(async (hashField, value, successMessage) => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    if (!isExactDigits(value, PIN_LENGTH)) {
      showToast(isMarathi ? 'पिन अचूक ६ अंकी असणे आवश्यक आहे.' : 'PIN must be exactly 6 digits.', 'error');
      return false;
    }

    await saveDb(async (currentDb) => ({
      ...currentDb,
      settings: {
        ...currentDb.settings,
        [hashField]: await hashSecret(value)
      }
    }));
    showToast(successMessage, 'success');
    return true;
  }, [db.settings, showToast]);

  const updateArchivePasscodeWithCurrentPasscode = useCallback(async () => {
    const isMarathi = db?.settings?.lang === 'mr';

    // If an archive passcode is already configured, we require current passcode verification.
    if (db?.settings?.archivePasswordHash) {
      if (!await matchesArchiveSecret(archivePinOwnerAuthInput, db.settings.archivePasswordHash)) {
        showToast(
          isMarathi
            ? 'सध्याचा संकेतशब्द चुकीचा आहे.'
            : 'Current passcode is incorrect.',
          'error'
        );
        return false;
      }
    }

    const saved = await saveArchivePasscodeSetting(newArchivePinInput);
    if (!saved) return false;

    setArchivePinOwnerAuthInput('');
    setNewArchivePinInput('');
    return true;
  }, [archivePinOwnerAuthInput, db?.settings, newArchivePinInput, saveArchivePasscodeSetting, showToast]);

  const updateArchivePasscodeWithOwnerPin = useCallback(async () => {
    const isMarathi = db?.settings?.lang === 'mr';
    const cleanedOwnerPin = archiveOwnerPinInput.trim();

    if (!db?.settings?.ownerPinHash) {
      showToast(
        isMarathi
          ? 'मालक पिन सेट केलेला नाही. कृपया आधी मालक पिन सेट करा.'
          : 'Owner PIN is not set. Please set the Owner PIN first.',
        'error'
      );
      return false;
    }

    if (!await matchesSecret(cleanedOwnerPin, db.settings.ownerPinHash, PIN_LENGTH)) {
      showToast(
        isMarathi
          ? 'चुकीचा मालक पिन.'
          : 'Invalid Owner PIN.',
        'error'
      );
      return false;
    }

    const saved = await saveArchivePasscodeSetting(newArchivePinInput);
    if (!saved) return false;

    setArchiveOwnerPinInput('');
    setNewArchivePinInput('');
    return true;
  }, [archiveOwnerPinInput, db?.settings, newArchivePinInput, saveArchivePasscodeSetting, showToast]);

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
    const ownerPin = db.settings.ownerPinHash;
    const requireSetup = db.settings.requireSetup;
    if ((!ownerPin || ownerPin === '') && (requireSetup !== false)) {
      setFirstRunPrompted(true);
      setFirstRunModalVisible(true);
    }
  }, [db, firstRunPrompted, settingsLoaded]);

  const handleFirstRunSave = async () => {
    const cleaned = String(firstRunPinInput).replace(/\D/g, '');
    if (!isExactDigits(cleaned, PIN_LENGTH)) {
      setFirstRunPinError('PIN must be exactly 6 digits');
      return;
    }
    const newSettings = { ...db.settings, ownerPinHash: await hashSecret(cleaned) };
    if (newSettings.requireSetup) delete newSettings.requireSetup;
    await saveDb((currentDb) => ({ ...currentDb, settings: newSettings }));
    setFirstRunPinInput('');
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
    let isMounted = true;
    let unsubCustomers = () => {};
    let unsubTxns = () => {};
    let unsubEmployees = () => {};
    let unsubSalaries = () => {};
    let unsubSettings = () => {};
    let unsubExpenses = () => {};

    const loadLocalData = async () => {
      try {
        let localData = null;
        if (isElectron) {
          localData = await window.electronAPI.readDatabase();
        } else {
          const local = localStorage.getItem('lokmanya_db');
          if (local) localData = JSON.parse(local);
        }

        if (!isMounted || !localData || typeof localData !== 'object') {
          return;
        }

        const mergedDb = {
          customers: Array.isArray(localData.customers) ? localData.customers : [],
          employees: Array.isArray(localData.employees) ? localData.employees : [],
          transactions: Array.isArray(localData.transactions) ? localData.transactions : [],
          salaries: Array.isArray(localData.salaries) ? localData.salaries : [],
          expenses: Array.isArray(localData.expenses) ? localData.expenses : [],
          settings: {
            ...dbRef.current.settings,
            ...(localData.settings || {})
          }
        };

        setDb((prev) => ({ ...prev, ...mergedDb }));
        dbRef.current = { ...dbRef.current, ...mergedDb };
        applyLoadedSettings(mergedDb.settings);
      } catch (err) {
        console.error('Error loading local backup during startup:', err);
      } finally {
        if (isMounted) {
          setSettingsLoaded(true);
        }
      }
    };

    loadLocalData();

    if (!isCloudSyncAvailable) {
      if (firebaseBootError) {
        console.error('Cloud sync disabled during startup:', firebaseBootError);
      }
      return () => {
        isMounted = false;
      };
    }

    // 1. Setup real-time listeners immediately for instant UI load (offline-first)
    unsubCustomers = onSnapshot(collection(firestoreDb, 'desktop_customers'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.customers) === JSON.stringify(list)) return prev;
        return { ...prev, customers: list };
      });
    });

    unsubTxns = onSnapshot(collection(firestoreDb, 'desktop_transactions'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.transactions) === JSON.stringify(list)) return prev;
        return { ...prev, transactions: list };
      });
    });

    unsubEmployees = onSnapshot(collection(firestoreDb, 'desktop_employees'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.employees) === JSON.stringify(list)) return prev;
        return { ...prev, employees: list };
      });
    });

    unsubSalaries = onSnapshot(collection(firestoreDb, 'desktop_salaries'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.salaries) === JSON.stringify(list)) return prev;
        return { ...prev, salaries: list };
      });
    });

    unsubSettings = onSnapshot(doc(firestoreDb, 'desktop_config', 'app_settings'), async (snapshot) => {
      if (snapshot.exists()) {
        const rawSettings = snapshot.data();
        const settingsData = await secureSettings(rawSettings);
        setDb(prev => {
          if (JSON.stringify(prev.settings) === JSON.stringify(settingsData)) return prev;
          return { ...prev, settings: settingsData };
        });
        applyLoadedSettings(settingsData);
        if (hasLegacySecrets(rawSettings)) {
          await setDoc(doc(firestoreDb, 'desktop_config', 'app_settings'), settingsData);
        }
      }
      setSettingsLoaded(true);
    });

    unsubExpenses = onSnapshot(collection(firestoreDb, 'desktop_expenses'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.expenses) === JSON.stringify(list)) return prev;
        return { ...prev, expenses: list };
      });
    });

    // 2. Perform local-to-cloud data migration asynchronously in the background (only if online & not done yet)
    async function migrateLocalToCloudIfNeeded() {
      if (!isCloudSyncAvailable) {
        return;
      }

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
              await setDoc(doc(firestoreDb, 'desktop_config', 'app_settings'), await secureSettings(localData.settings));
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
      isMounted = false;
      unsubCustomers();
      unsubTxns();
      unsubEmployees();
      unsubSalaries();
      unsubSettings();
      unsubExpenses();
    };
  }, [applyLoadedSettings]);

  const saveDb = useCallback(async (nextDbOrUpdater) => {
    lastSaveRequestRef.current = nextDbOrUpdater;

    const runSave = async () => {
      savePendingCountRef.current += 1;
      setSaveHealth((prev) => ({
        ...prev,
        status: 'saving',
        pending: savePendingCountRef.current,
        lastError: ''
      }));

      const oldDb = dbRef.current;
      const candidateDb = typeof nextDbOrUpdater === 'function'
        ? await nextDbOrUpdater(oldDb)
        : nextDbOrUpdater;
      const sanitizedDb = await persistDb(candidateDb);

      setDb(sanitizedDb);
      dbRef.current = sanitizedDb;

      const nowIso = new Date().toISOString();
      let cloudSyncOk = !isCloudSyncAvailable;

      try {
        await writeLocalBackup(sanitizedDb);
        setSaveHealth((prev) => ({
          ...prev,
          status: 'saving',
          pending: savePendingCountRef.current,
          lastLocalSaveAt: nowIso,
          lastError: ''
        }));
      } catch (err) {
        console.error('Error saving local backup:', err);
        setDb(oldDb);
        dbRef.current = oldDb;
        const isMarathi = oldDb.settings && oldDb.settings.lang === 'mr';
        const errorMessage = err?.message || 'Local backup write failed.';
        setSaveHealth((prev) => ({
          ...prev,
          status: 'error',
          lastError: errorMessage
        }));
        showToast(
          isMarathi
            ? 'डेटा स्थानिक बॅकअपमध्ये सेव्ह झाला नाही. कृपया पुन्हा प्रयत्न करा.'
            : 'Changes were not saved to the local backup. Please try again.',
          'error'
        );
        throw err;
      }

      try {
        cloudSyncOk = await syncDbToCloud(oldDb, sanitizedDb);
      } catch (err) {
        console.error('Error syncing changes to Firebase Firestore:', err);
        const isMarathi = sanitizedDb.settings && sanitizedDb.settings.lang === 'mr';
        const errorMessage = err?.message || 'Cloud sync failed.';
        setSaveHealth((prev) => ({
          ...prev,
          status: 'degraded',
          lastError: errorMessage,
          lastSavedAt: nowIso,
          lastCloudSyncAt: prev.lastCloudSyncAt
        }));
        showToast(
          isMarathi
            ? 'डेटा स्थानिक पातळीवर सेव्ह झाला, पण क्लाउड सिंक अयशस्वी झाले.'
            : 'Changes were saved locally, but cloud sync failed.',
          'error'
        );
      }

      setSaveHealth((prev) => ({
        ...prev,
        status: cloudSyncOk ? 'healthy' : 'degraded',
        lastSavedAt: nowIso,
        lastCloudSyncAt: cloudSyncOk ? nowIso : prev.lastCloudSyncAt,
        lastError: cloudSyncOk ? '' : prev.lastError
      }));

      return {
        success: true,
        localSaved: true,
        cloudSyncOk,
        savedAt: nowIso,
        db: sanitizedDb
      };
    };

    const queuedSave = saveQueueRef.current.then(runSave, runSave);
    saveQueueRef.current = queuedSave.catch(() => {});

    try {
      return await queuedSave;
    } finally {
      savePendingCountRef.current = Math.max(0, savePendingCountRef.current - 1);
      setSaveHealth((prev) => ({
        ...prev,
        pending: savePendingCountRef.current,
        status:
          prev.status === 'error' || prev.status === 'degraded'
            ? prev.status
            : savePendingCountRef.current > 0
              ? 'saving'
              : prev.lastSavedAt
                ? 'healthy'
                : 'idle'
      }));
    }
  }, [persistDb, showToast, syncDbToCloud, writeLocalBackup]);

  const retryLastSave = useCallback(async () => {
    if (!lastSaveRequestRef.current) return;
    await saveDb(lastSaveRequestRef.current);
  }, [saveDb]);

  const saveHealthUi = useMemo(() => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    switch (saveHealth.status) {
      case 'saving':
        return {
          color: 'var(--warning)',
          label: isMarathi ? 'डेटा सेव्ह होत आहे...' : 'Saving data...',
          details: isMarathi
            ? 'बदल रांगेत आहेत आणि जतन केले जात आहेत.'
            : 'Changes are queued and being persisted.'
        };
      case 'degraded':
        return {
          color: 'var(--warning)',
          label: isMarathi ? 'स्थानिक सेव्ह ठीक, क्लाउड सिंक प्रलंबित' : 'Local save OK, cloud sync pending',
          details: isMarathi
            ? 'तुमचा डेटा या संगणकावर सुरक्षित आहे, पण क्लाउड अपडेट पूर्ण झालेले नाही.'
            : 'Your data is safe on this computer, but cloud sync has not completed.'
        };
      case 'error':
        return {
          color: 'var(--danger)',
          label: isMarathi ? 'सेव्ह अयशस्वी' : 'Save failed',
          details: isMarathi
            ? 'स्थानिक बॅकअप लिहिता आला नाही. पुन्हा प्रयत्न करा.'
            : 'The local backup could not be written. Please retry.'
        };
      case 'healthy':
        return {
          color: 'var(--success)',
          label: isMarathi ? 'सर्व डेटा सुरक्षित आहे' : 'All data is healthy',
          details: isMarathi
            ? 'स्थानिक बॅकअप आणि क्लाउड सिंक दोन्ही पूर्ण झाले.'
            : 'Both local backup and cloud sync completed successfully.'
        };
      default:
        return {
          color: 'var(--text-secondary)',
          label: isMarathi ? 'अद्याप कोणतेही सेव्ह नाही' : 'No saves yet',
          details: isMarathi
            ? 'पहिली नोंद जतन झाल्यावर स्थिती येथे दिसेल.'
            : 'Status will appear here after the first saved change.'
        };
    }
  }, [db.settings, saveHealth.status]);

  const formatHealthTimestamp = useCallback((value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-IN');
  }, []);



  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setPinError('');
    setPinInput('');
    setIsSettingsUnlocked(false);
    setIsArchiveUnlocked(false);
  };

  const handlePinSubmit = async (e) => {
    if (e) e.preventDefault();
    const isMarathi = db.settings && db.settings.lang === 'mr';
    const cleanedPin = String(pinInput).replace(/\D/g, '');
    if (!isExactDigits(cleanedPin, PIN_LENGTH)) {
      setPinError(isMarathi ? 'कृपया ६ अंकी पिन प्रविष्ट करा.' : 'Please enter a valid 6-digit PIN.');
      setPinInput('');
      return;
    }
    
    // If owner PIN not configured, force the user to open settings and set it up first
    if (!db.settings || !db.settings.ownerPinHash) {
      showToast(isMarathi ? 'कृपया प्रथम सेटिंग्जमध्ये मालक PIN सेट करा.' : 'Please set the Owner PIN in Settings before logging in.', 'error');
      setCurrentTab('settings');
      return;
    }

    // 1. Owner Master PIN Check
    if (await matchesSecret(cleanedPin, db.settings.ownerPinHash, PIN_LENGTH)) {
      setIsLoggedIn(true);
      setRole('owner');
      setPinInput('');
      setPinError('');
      showToast(isMarathi ? 'मालक म्हणून यशस्वी लॉगिन!' : 'Logged in successfully as Owner!', 'success');
      return;
    }

    // 2. Branch 1 PIN Check
    if (await matchesSecret(cleanedPin, db.settings.branch1PinHash, PIN_LENGTH)) {
      setIsLoggedIn(true);
      setRole('branch_staff');
      setActiveBranch('Branch 1');
      setPinInput('');
      setPinError('');
      showToast(isMarathi ? 'शाखा १ मध्ये यशस्वी लॉगिन!' : 'Logged in successfully to Branch 1!', 'success');
      return;
    }

    // 3. Branch 2 PIN Check
    if (await matchesSecret(cleanedPin, db.settings.branch2PinHash, PIN_LENGTH)) {
      setIsLoggedIn(true);
      setRole('branch_staff');
      setActiveBranch('Branch 2');
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
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState(false);
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkQueueIndex, setBulkQueueIndex] = useState(0);
  const [isQueueProcessing, setIsQueueProcessing] = useState(false);

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
    if (!payModalCustomer || isSavingPayment) return;
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
    
    setIsSavingPayment(true);
    try {
      const newTxn = {
        id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        custId: payModalCustomer.id,
        amount: amt,
        date: payDate,
        paymentMode: payMode,
        note: payNote.trim()
      };

      await saveDb((currentDb) => ({
        ...currentDb,
        customers: currentDb.customers.map((c) => (
          c.id === payModalCustomer.id
            ? { ...c, deposited: (c.deposited || 0) + amt }
            : c
        )),
        transactions: [...(currentDb.transactions || []), newTxn]
      }));

      showToast(db.settings.lang === 'mr' ? 'पेमेंट यशस्वीरित्या नोंदवले गेले!' : 'Payment recorded successfully!');
      setPayAmount('');
      setPayDate('');
      setPayMode('Cash');
      setPayNote('');
      setPayModalCustomer(null);
    } catch (err) {
      console.error(err);
      showToast(db.settings.lang === 'mr' ? 'त्रुटी आली!' : 'Error saving payment!', 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleDeleteTxn = async (txnId, custId, amount) => {
    if (!isOwnerRole(role)) {
      showToast(
        db.settings.lang === 'mr'
          ? 'हा व्यवहार हटवण्यासाठी मालक प्रवेश आवश्यक आहे.'
          : 'Owner access is required to delete this transaction.',
        'error'
      );
      return;
    }
    const confirmDelete = window.confirm(
      db.settings.lang === 'mr' 
        ? 'तुम्हाला नक्की हे पेमेंट रेकॉर्ड डिलीट करायचे आहे का? यामुळे जमा रक्कम कमी होईल.' 
        : 'Are you sure you want to delete this payment record? This will reduce the deposited amount.'
    );
    if (!confirmDelete) return;

    await saveDb((currentDb) => ({
      ...currentDb,
      customers: currentDb.customers.map((c) => (
        c.id === custId
          ? { ...c, deposited: Math.max(0, (c.deposited || 0) - Number(amount || 0)) }
          : c
      )),
      transactions: currentDb.transactions.filter((t) => t.id !== txnId)
    }));
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

    // Strip leading country codes to show only 10 digits
    let cleanPhone = (c.phone || '').replace(/^\+91|^91/, '');

    setCustForm({ 
      name: c.name, 
      phone: cleanPhone, 
      aadhar: c.aadhar || '', 
      plan: c.plan, 
      amount: String(c.amount), 
      deposited: String(c.deposited || 0), 
      joinDate: c.joinDate, 
      addr: c.addr || '', 
      photo: c.photo || '', 
      category: c.category || 'dinein' 
    });
    setCustModal(true);
  };

  const saveCustomer = async () => {
    const isMarathi = db.settings && db.settings.lang === 'mr';
    if (isBlank(custForm.name) || isBlank(custForm.phone)) {
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

    if (isBlank(custForm.addr)) {
      showToast(isMarathi ? 'कृपया वैध पत्ता प्रविष्ट करा.' : 'Address cannot be blank.', 'error');
      return;
    }

    const amount = toAmountNumber(custForm.amount);
    const deposited = toAmountNumber(custForm.deposited);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast(isMarathi ? 'कृपया वैध रक्कम प्रविष्ट करा.' : 'Please enter a valid amount.', 'error');
      return;
    }
    if (!Number.isFinite(deposited) || deposited < 0) {
      showToast(isMarathi ? 'जमा रक्कम वैध असणे आवश्यक आहे.' : 'Deposited amount must be a valid number.', 'error');
      return;
    }

    const finalForm = { ...custForm, name: normalizeText(custForm.name), addr: normalizeText(custForm.addr), phone: cleanPhone, amount: String(amount), deposited: String(deposited) };

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

    await saveDb((currentDb) => {
      let nextTargetCat = targetCat;
      if (!nextTargetCat && editCustId) {
        const originalCustomer = currentDb.customers.find((c) => c.id === editCustId);
        nextTargetCat = originalCustomer ? (originalCustomer.category || 'dinein') : 'dinein';
      }

      if (editCustId) {
        return {
          ...currentDb,
          customers: currentDb.customers.map((c) => (
            c.id === editCustId
              ? { ...c, ...finalForm, amount, deposited, category: nextTargetCat }
              : c
          ))
        };
      }

      const newCust = {
        ...finalForm,
        id: 'cust_' + Date.now(),
        amount,
        deposited,
        category: nextTargetCat,
        branch: activeBranch
      };
      const nextTransactions = [...(currentDb.transactions || [])];
      if (newCust.deposited > 0) {
        nextTransactions.push({
          id: 'txn_' + Date.now() + '_init',
          custId: newCust.id,
          amount: newCust.deposited,
          date: newCust.joinDate,
          paymentMode: 'Cash'
        });
      }

      return {
        ...currentDb,
        customers: [...currentDb.customers, newCust],
        transactions: nextTransactions
      };
    });
    setCustSearch(''); // Clear search query to show the new customer immediately
    setCustModal(false);
    setEditCustId(null);
  };

  const deleteCustomer = async (id) => {
    if (!isOwnerRole(role)) {
      showToast(
        db.settings.lang === 'mr'
          ? 'ग्राहक बदलण्यासाठी मालक प्रवेश आवश्यक आहे.'
          : 'Owner access is required to modify customers.',
        'error'
      );
      return;
    }
    const customer = db.customers.find(c => c.id === id);
    if (!customer) return;

    if (currentTab === 'oldcustomers') {
      const confirmMsg = db.settings.lang === 'mr'
        ? 'आपण या ग्राहकाला कायमचे हटवू इच्छिता? ही क्रिया पूर्ववत केली जाऊ शकत नाही.'
        : 'Are you sure you want to permanently delete this customer? This cannot be undone.';
      if (!confirm(confirmMsg)) return;

      await saveDb((currentDb) => ({
        ...currentDb,
        customers: currentDb.customers.filter((c) => c.id !== id),
        transactions: currentDb.transactions.filter((t) => t.custId !== id)
      }));
      showToast(
        db.settings.lang === 'mr' ? 'ग्राहक कायमचा हटवला गेला!' : 'Customer permanently deleted!',
        'success'
      );
    } else {
      const confirmMsg = db.settings.lang === 'mr'
        ? 'आपण या ग्राहकाला संग्रहित (archive) करू इच्छिता? त्यांना जुन्या ग्राहकांच्या संग्रहात हलवले जाईल.'
        : 'Are you sure you want to archive this customer? They will be moved to the Old Customers Archive.';
      if (!confirm(confirmMsg)) return;

      await saveDb((currentDb) => ({
        ...currentDb,
        customers: currentDb.customers.map((c) => (c.id === id ? { ...c, status: 'old' } : c))
      }));
      showToast(
        db.settings.lang === 'mr' ? 'ग्राहक संग्रहित केला गेला!' : 'Customer archived successfully!',
        'success'
      );
    }
  };

  const restoreCustomer = async (id) => {
    if (!isOwnerRole(role)) {
      showToast(
        db.settings.lang === 'mr'
          ? 'ग्राहक पुनर्संचयित करण्यासाठी मालक प्रवेश आवश्यक आहे.'
          : 'Owner access is required to restore customers.',
        'error'
      );
      return;
    }
    const confirmMsg = db.settings.lang === 'mr'
      ? 'आपण या ग्राहकाला पुनर्संचयित करू इच्छिता?'
      : 'Are you sure you want to restore this customer back to active lists?';
    if (!confirm(confirmMsg)) return;

    await saveDb((currentDb) => ({
      ...currentDb,
      customers: currentDb.customers.map((c) => (c.id === id ? { ...c, status: undefined } : c))
    }));
    showToast(
      db.settings.lang === 'mr' ? 'ग्राहक यशस्वीरित्या पुनर्संचयित केला गेला!' : 'Customer successfully restored!',
      'success'
    );
  };

  const saveExpense = async (e) => {
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

    await saveDb((currentDb) => ({ ...currentDb, expenses: [newExpense, ...(currentDb.expenses || [])] }));
    setExpenseForm({ amount: '', note: '' });
    showToast(db.settings.lang === 'mr' ? 'खर्च यशस्वीरित्या जोडला गेला!' : 'Expense added successfully!');
  };

  const deleteExpense = async (id) => {
    if (!isOwnerRole(role)) {
      showToast(
        db.settings.lang === 'mr'
          ? 'खर्च हटवण्यासाठी मालक प्रवेश आवश्यक आहे.'
          : 'Owner access is required to delete expenses.',
        'error'
      );
      return;
    }
    const confirmDelete = window.confirm(
      db.settings.lang === 'mr'
        ? 'तुम्हाला नक्की हा खर्च हटवायचा आहे का?'
        : 'Are you sure you want to delete this expense record?'
    );
    if (!confirmDelete) return;

    await saveDb((currentDb) => ({ ...currentDb, expenses: (currentDb.expenses || []).filter((e) => e.id !== id) }));
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

  const buildCustomerReminderMessage = useCallback((customer) => {
    const remaining = getCustomerDues(customer);
    const status = computeStatus(customer);
    const expiry = customer?.joinDate ? expiryStr(customer.joinDate, customer.plan) : '';
    const messName = db.settings?.messName || 'Lokmanya Mess';
    const upiId = String(db.settings?.upiId || '').trim();
    const paymentPhone = String(db.settings?.paymentPhone || '').trim();
    const paymentAmount = remaining > 0 ? remaining : 0;
    const customerName = customer?.name || 'Customer';
    const trId = `LM${customer?.id || 'CUST'}${Date.now()}`;
    const upiLink =
      upiId && paymentAmount > 0
        ? `https://atharva-kharapkar.github.io/LokmanyaMess/public/pay/?pa=${encodeURIComponent(
            upiId
          )}&pn=${encodeURIComponent(
            messName
          )}&am=${encodeURIComponent(
            paymentAmount
          )}&tn=${encodeURIComponent(
            `${messName} reminder for ${customerName}`
          )}&tr=${encodeURIComponent(
            trId
          )}&lang=${db.settings?.lang || 'en'}${paymentPhone ? `&ph=${encodeURIComponent(paymentPhone)}` : ''}`
        : '';
    const defaultTemplate = db.settings?.lang === 'mr'
      ? 'नमस्कार [Name], तुमची थकीत रक्कम ₹[Dues] आहे. कृपया पेमेंट करा: [UpiLink] - [MessName]'
      : 'Dear [Name], your pending dues are Rs [Dues]. Please pay here: [UpiLink] - [MessName]';
    const template = String(db.settings?.whatsappDuesTemplate || defaultTemplate);

    if (template.trim()) {
      return template
        .replace(/\[Name\]/g, customerName)
        .replace(/\[Dues\]/g, String(paymentAmount))
        .replace(/\[Amount\]/g, String(paymentAmount))
        .replace(/\[Date\]/g, expiry || '')
        .replace(/\[MessName\]/g, messName)
        .replace(/\[UpiLink\]/g, upiLink || (upiId || ''))
        .trim();
    }

    const intro = db.settings?.lang === 'mr'
      ? `नमस्कार ${customerName}, ${messName} कडून स्मरणपत्र.`
      : `Hello ${customerName}, this is a reminder from ${messName}.`;

    const dueLine = remaining > 0
      ? (db.settings?.lang === 'mr'
          ? `तुमची थकीत रक्कम ₹${remaining} आहे.`
          : `Your due payment is Rs ${remaining}.`)
      : (db.settings?.lang === 'mr'
          ? `तुमचा प्लॅन ${expiry ? `${expiry} पर्यंत` : 'लवकरच'} नूतनीकरणासाठी येत आहे.`
          : `Your plan is ${status === 'expired' ? 'expired' : 'due for renewal soon'}${expiry ? ` on ${expiry}` : ''}.`);

    const planLine = db.settings?.lang === 'mr'
      ? `विभाग: ${customer.category || 'dinein'} | प्लॅन: ${customer.plan} | जमा: ₹${customer.deposited || 0}`
      : `Section: ${customer.category || 'dinein'} | Plan: ${customer.plan} | Paid: Rs ${customer.deposited || 0}`;

    const paymentLines = upiId && paymentAmount > 0
      ? [
          db.settings?.lang === 'mr'
            ? `पेमेंट UPI: ${upiId}`
            : `UPI payment ID: ${upiId}`,
          upiLink
        ]
      : [];

    const closing = db.settings?.lang === 'mr'
      ? 'कृपया WhatsApp वरूनच पेमेंट पाठवून स्क्रीनशॉट शेअर करा. धन्यवाद.'
      : 'Please send the payment and share the screenshot on WhatsApp. Thank you.';

    return [intro, dueLine, planLine, ...paymentLines, closing].filter(Boolean).join('\n');
  }, [db.settings]);

  const openWhatsAppWithTypedMessage = useCallback(({ phoneDigits, message }) => {
    const encodedMessage = encodeURIComponent(String(message ?? ''));

    // Desktop deep link (pre-fills message; user must press Send)
    const whatsappDesktopDeepLink = `whatsapp://send?phone=${phoneDigits}&text=${encodedMessage}`;
    // Web fallback (pre-fills message)
    const whatsappWebUrl = `https://wa.me/${phoneDigits}?text=${encodedMessage}`;

    if (isElectron) {
      // In Electron: ONLY open the installed desktop app deep-link. 
      // Do not schedule fallback to WhatsApp Web to avoid opening two windows.
      window.open(whatsappDesktopDeepLink, '_blank');
      return;
    }

    // Browser: go directly to WhatsApp Web.
    window.open(whatsappWebUrl, 'whatsapp_share_tab');
  }, []);

  const sendWhatsAppReminder = useCallback((customer) => {
    const phoneDigits = normalizeWhatsAppPhone(customer?.phone);
    if (phoneDigits.length < 10) {
      showToast(
        db.settings?.lang === 'mr'
          ? 'या ग्राहकासाठी वैध WhatsApp नंबर उपलब्ध नाही.'
          : 'A valid WhatsApp number is not available for this customer.',
        'error'
      );
      return;
    }

    const message = buildCustomerReminderMessage(customer);
    openWhatsAppWithTypedMessage({
      phoneDigits,
      message,
      customer,
      messName: db.settings?.messName
    });
  }, [buildCustomerReminderMessage, db.settings, showToast, openWhatsAppWithTypedMessage]);

  // ===== WhatsApp Bulk Reminder (single entry button + multi-select) =====
  const [selectedWhatsAppCustomerIds, setSelectedWhatsAppCustomerIds] = useState([]);
  const [bulkSearch, setBulkSearch] = useState('');

  const modalDueCustomers = useMemo(() => {
    let targetCategory = 'dinein';
    if (currentTab === 'tiffin') targetCategory = 'tiffin';
    if (currentTab === 'shortterm') targetCategory = 'shortterm';
    if (currentTab === 'oldcustomers') targetCategory = 'old';

    return (db.customers || []).filter(c => {
      // Archive/Status Filter
      if (targetCategory === 'old') {
        if (c.status !== 'old') return false;
      } else {
        if (c.status === 'old') return false;
        const itemCat = c.category || 'dinein';
        if (itemCat !== targetCategory) return false;
      }

      // Branch Filter
      if (targetCategory !== 'old') {
        const itemBranch = c.branch || 'Branch 1';
        if (itemBranch !== activeBranch) return false;
      }

      return getCustomerDues(c) > 0;
    });
  }, [db.customers, activeBranch, currentTab]);

  const filteredModalDueCustomers = useMemo(() => {
    const query = bulkSearch.toLowerCase().trim();
    if (!query) return modalDueCustomers;
    return modalDueCustomers.filter(c => 
      (c.name || '').toLowerCase().includes(query) || 
      (c.phone || '').includes(query)
    );
  }, [modalDueCustomers, bulkSearch]);

  const handleOpenBulkReminder = useCallback(() => {
    const dueIds = modalDueCustomers.map(c => c.id);
    setSelectedWhatsAppCustomerIds(dueIds);
    setBulkSearch('');
    setIsBulkReminderOpen(true);
  }, [modalDueCustomers]);

  const toggleSelectAllBulk = useCallback(() => {
    const allFilteredIds = filteredModalDueCustomers.map(c => c.id);
    const areAllSelected = allFilteredIds.every(id => selectedWhatsAppCustomerIds.includes(id));
    
    if (areAllSelected) {
      setSelectedWhatsAppCustomerIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedWhatsAppCustomerIds(prev => {
        const next = [...prev];
        allFilteredIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  }, [filteredModalDueCustomers, selectedWhatsAppCustomerIds]);

  const toggleWhatsAppCustomer = useCallback((custId) => {
    setSelectedWhatsAppCustomerIds((prev) => {
      if (prev.includes(custId)) return prev.filter((id) => id !== custId);
      return [...prev, custId];
    });
  }, []);

  const clearWhatsAppSelection = useCallback(() => {
    setSelectedWhatsAppCustomerIds([]);
  }, []);

  const isWhatsAppSelected = useCallback((custId) => selectedWhatsAppCustomerIds.includes(custId), [selectedWhatsAppCustomerIds]);

  const sendBulkWhatsAppReminders = useCallback(() => {
    const selectedCustomers = db.customers.filter((c) => selectedWhatsAppCustomerIds.includes(c.id));

    if (!selectedCustomers.length) {
      showToast(
        db.settings?.lang === 'mr'
          ? 'कृपया WhatsApp साठी ग्राहक निवडा.'
          : 'Select at least one customer for WhatsApp reminder.',
        'error'
      );
      return;
    }

    // Skip ₹0 pending dues
    const dueCustomers = selectedCustomers
      .filter((c) => getCustomerDues(c) > 0);

    if (!dueCustomers.length) {
      showToast(
        db.settings?.lang === 'mr'
          ? 'निवडलेल्या ग्राहकांपैकी कोणाच्याही थकीत रकमेचा शिल्लक नाही (₹0).'
          : 'Selected customers have no pending dues (₹0).',
        'error'
      );
      return;
    }

    // Initialize the sequential sending queue
    setBulkQueue(dueCustomers);
    setBulkQueueIndex(0);
    setIsQueueProcessing(true);
  }, [db.customers, selectedWhatsAppCustomerIds, db.settings, showToast]);

  const handleQueueNext = useCallback((skip = false) => {
    if (!bulkQueue.length || bulkQueueIndex >= bulkQueue.length) return;

    const currentCustomer = bulkQueue[bulkQueueIndex];
    
    if (!skip) {
      sendWhatsAppReminder(currentCustomer);
    }

    const nextIndex = bulkQueueIndex + 1;
    if (nextIndex >= bulkQueue.length) {
      // Completed the entire queue
      setIsQueueProcessing(false);
      setIsBulkReminderOpen(false);
      setBulkQueue([]);
      setBulkQueueIndex(0);
      setSelectedWhatsAppCustomerIds([]);
      showToast(
        db.settings?.lang === 'mr'
          ? 'सर्व निवडलेल्या ग्राहकांना संदेश यशस्वीरित्या पाठवले आहेत!'
          : 'All selected reminders processed successfully!',
        'success'
      );
    } else {
      setBulkQueueIndex(nextIndex);
    }
  }, [bulkQueue, bulkQueueIndex, sendWhatsAppReminder, db.settings, showToast]);

  const handleQueueCancel = useCallback(() => {
    setIsQueueProcessing(false);
    setBulkQueue([]);
    setBulkQueueIndex(0);
    setSelectedWhatsAppCustomerIds([]);
    showToast(
      db.settings?.lang === 'mr'
        ? 'बुल्क आठवण प्रक्रिया रद्द केली.'
        : 'Bulk reminder process cancelled.',
      'error'
    );
  }, [db.settings, showToast]);



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

  const ownerBranchDashboardData = useMemo(() => {
    const today = todayStr();
    const currentMonth = today.slice(0, 7);
    const branches = ['Branch 1', 'Branch 2'];

    return branches.map((branchName) => {
      const branchCustomers = (db.customers || []).filter((customer) => (customer.branch || 'Branch 1') === branchName && customer.status !== 'old');
      const branchTransactions = (db.transactions || [])
        .filter((tx) => (tx.branch || 'Branch 1') === branchName)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
      const branchExpensesList = (db.expenses || [])
        .filter((expense) => (expense.branch || 'Branch 1') === branchName)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

      const todayCollections = branchTransactions
        .filter((tx) => tx.date === today)
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const monthCollections = branchTransactions
        .filter((tx) => String(tx.date || '').slice(0, 7) === currentMonth)
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      const todayExpenses = branchExpensesList
        .filter((expense) => expense.date === today)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      const monthExpenses = branchExpensesList
        .filter((expense) => String(expense.date || '').slice(0, 7) === currentMonth)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      return {
        name: branchName,
        activeCustomers: branchCustomers.length,
        pendingDues: branchCustomers.reduce((sum, customer) => sum + getCustomerDues(customer), 0),
        todayCollections,
        monthCollections,
        todayExpenses,
        monthExpenses,
        monthNet: monthCollections - monthExpenses,
        recentCollections: branchTransactions.slice(0, 5),
        recentExpenses: branchExpensesList.slice(0, 5)
      };
    });
  }, [db.customers, db.transactions, db.expenses]);

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
              
              <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', margin: '4px 0' }}>
                {db.settings.lang === 'mr' ? '???? ???? ?? ???? ?????? ?????? ?????.' : 'The session stays active only while the app is open.'}
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
            <IndianRupee size={18} />
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
              {db.settings.ownerAddress && (
                <div className="profile-address">{db.settings.ownerAddress}</div>
              )}
            </div>
            <div className="avatar">{db.settings.ownerName.charAt(0)}</div>
          </div>
        </header>

        <div className="content-body">
          {/* DASHBOARD TAB */}
          {currentTab === 'dashboard' && (
            <div className="tab-panel animate-fade">
              {!isElectron && role === 'owner' && (
                <div className="card-section" style={{ marginBottom: '4px' }}>
                  <div className="section-header">
                    <span className="section-title">{db.settings.lang === 'mr' ? 'वेब मालक डॅशबोर्ड - दोन्ही शाखा' : 'Owner Web Dashboard - Both Branches'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {ownerBranchDashboardData.map((branch) => (
                      <div key={branch.name} className="card-section" style={{ padding: '20px', margin: 0, background: 'linear-gradient(180deg, #fffaf6 0%, #ffffff 100%)' }}>
                        <div className="section-header" style={{ marginBottom: '14px' }}>
                          <span className="section-title" style={{ fontSize: '15px' }}>{branch.name}</span>
                          <span className="badge badge-active">{branch.activeCustomers} {db.settings.lang === 'mr' ? 'सक्रिय' : 'active'}</span>
                        </div>
                        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                          <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-info">
                              <div className="stat-label">{db.settings.lang === 'mr' ? 'आजची जमा' : "Today's Collections"}</div>
                              <div className="stat-value" style={{ color: 'var(--success)', fontSize: '22px' }}>₹{branch.todayCollections.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                          <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-info">
                              <div className="stat-label">{db.settings.lang === 'mr' ? 'आजचा खर्च' : "Today's Expenses"}</div>
                              <div className="stat-value" style={{ color: 'var(--danger)', fontSize: '22px' }}>₹{branch.todayExpenses.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                          <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-info">
                              <div className="stat-label">{db.settings.lang === 'mr' ? 'महिन्याची जमा' : "Month's Collections"}</div>
                              <div className="stat-value" style={{ color: 'var(--success)', fontSize: '22px' }}>₹{branch.monthCollections.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                          <div className="stat-card" style={{ padding: '14px' }}>
                            <div className="stat-info">
                              <div className="stat-label">{db.settings.lang === 'mr' ? 'महिन्याचा खर्च' : "Month's Expenses"}</div>
                              <div className="stat-value" style={{ color: 'var(--danger)', fontSize: '22px' }}>₹{branch.monthExpenses.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', backgroundColor: '#fff' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>{db.settings.lang === 'mr' ? 'महिन्याचा नफा' : 'Month Net'}</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: branch.monthNet >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{branch.monthNet.toLocaleString('en-IN')}</div>
                          </div>
                          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', backgroundColor: '#fff' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>{db.settings.lang === 'mr' ? 'बाकी रक्कम' : 'Pending Dues'}</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--warning)' }}>₹{branch.pendingDues.toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', backgroundColor: '#fff' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                              {db.settings.lang === 'mr' ? 'अलीकडील जमा' : 'Recent Collections'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {branch.recentCollections.length > 0 ? branch.recentCollections.map((tx) => (
                                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                  <div>
                                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>{tx.custName}</div>
                                    <div style={{ color: 'var(--text-secondary)' }}>{tx.date}</div>
                                  </div>
                                  <div style={{ fontWeight: '800', color: 'var(--success)' }}>₹{Number(tx.amount || 0).toLocaleString('en-IN')}</div>
                                </div>
                              )) : (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{db.settings.lang === 'mr' ? 'रेकॉर्ड नाही' : 'No records'}</div>
                              )}
                            </div>
                          </div>
                          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', backgroundColor: '#fff' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                              {db.settings.lang === 'mr' ? 'अलीकडील खर्च' : 'Recent Expenses'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {branch.recentExpenses.length > 0 ? branch.recentExpenses.map((expense) => (
                                <div key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                  <div>
                                    <div style={{ fontWeight: '700', color: 'var(--text)' }}>{expense.note || (db.settings.lang === 'mr' ? 'खर्च' : 'Expense')}</div>
                                    <div style={{ color: 'var(--text-secondary)' }}>{expense.date}</div>
                                  </div>
                                  <div style={{ fontWeight: '800', color: 'var(--danger)' }}>₹{Number(expense.amount || 0).toLocaleString('en-IN')}</div>
                                </div>
                              )) : (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{db.settings.lang === 'mr' ? 'रेकॉर्ड नाही' : 'No records'}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="dashboard-grid">
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
                    maxLength="4"
                    value={archivePinInput}
                    onChange={(e) => setArchivePinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '6px', marginBottom: '20px', padding: '10px' }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={async () => {
                      if (!db.settings.archivePasswordHash) {
                        showToast(db.settings.lang === 'mr' ? 'कृपया सेटिंग्जमध्ये आर्काइव्ह पासकोड सेट करा.' : 'Please set an archive passcode in Settings first.', 'error');
                        return;
                      }
                      if (await matchesArchiveSecret(archivePinInput, db.settings.archivePasswordHash)) {
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

                    {/* Bulk WhatsApp Reminder */}
                    <button
                      className="btn btn-sm btn-success"
                      onClick={handleOpenBulkReminder}
                      title={
                        db.settings.lang === 'mr' ? 'बुल्क WhatsApp आठवण पाठवा' : 'Send WhatsApp reminders in bulk'
                      }
                    >
                      <Bell size={16} style={{ marginRight: '6px' }} />
                      {db.settings.lang === 'mr' ? 'बुल्क WhatsApp आठवण' : 'Bulk WhatsApp Reminder'}
                    </button>

                    <button className="btn" onClick={handleExportCustomers}>
                      <Download size={16} /> {t('exportCsv')}
                    </button>
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
                      const daysPendingDues = getDaysPendingDues(c);
                      
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
                          {hasDues && daysPendingDues > 0 && (
                            <div style={{ color: '#ff1e1e', fontSize: '12px', fontWeight: '800', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              ⚠️ {db.settings.lang === 'mr' 
                                ? `मागील ${daysPendingDues} दिवसांपासून थकीत रक्कम बाकी आहे` 
                                : `Due is pending from last ${daysPendingDues} days`}
                            </div>
                          )}
                          <div className="customer-bar-subinfo">📞 {c.phone}</div>
                          {c.addr ? <div className="customer-bar-subinfo">📍 {c.addr}</div> : <div className="customer-bar-subinfo" style={{ color: '#ef4444', fontWeight: '600' }}>📍 No Address</div>}
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
                            <button
                              className="btn btn-sm"
                              title={db.settings.lang === 'mr' ? 'पेमेंट इतिहास' : 'Payment History'}
                              onClick={() => openHistoryModal(c)}
                              style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                            >
                              <History size={12} style={{ marginRight: '2px' }} />
                              {db.settings.lang === 'mr' ? 'इतिहास' : 'History'}
                            </button>
                            {/* WhatsApp Reminder (single) */}
                            <button
                              className="btn btn-sm"
                              title={db.settings.lang === 'mr' ? 'WhatsApp आठवण' : 'WhatsApp Reminder'}
                              onClick={() => sendWhatsAppReminder(c)}
                              style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                            >
                              <Bell size={12} style={{ marginRight: '4px' }} />
                              {db.settings.lang === 'mr' ? 'व्हाट्सएप' : 'WhatsApp'}
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
                        maxLength="4"
                        value={collectionArchivePinInput}
                        onChange={(e) => setCollectionArchivePinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        style={{ width: '120px', textAlign: 'center', WebkitUserSelect: 'text', userSelect: 'text' }}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={async () => {
                          if (!db.settings.archivePasswordHash) {
                            showToast(db.settings.lang === 'mr' ? 'कृपया सेटिंग्जमध्ये आर्काइव्ह पासकोड सेट करा.' : 'Please set an archive passcode in Settings first.', 'error');
                            return;
                          }
                          if (await matchesArchiveSecret(collectionArchivePinInput, db.settings.archivePasswordHash)) {
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
            </div>
          )}
          {currentTab === 'expenses' && (
            <div className="tab-panel animate-fade">
              <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#fff1f2', color: 'var(--danger)' }}>
                    <IndianRupee size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{db.settings.lang === 'mr' ? 'आजचा एकूण खर्च' : "Today's Expenses"}</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{todayExpenseTotal}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: '#fff1f2', color: 'var(--danger)' }}>
                    <IndianRupee size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{db.settings.lang === 'mr' ? 'चालू महिन्याचा एकूण खर्च' : "Current Month's Expenses"}</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{currentMonthExpenseTotal}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div className="card-section">
                  <div className="section-header">
                    <span className="section-title">{db.settings.lang === 'mr' ? 'नवीन खर्च जोडा' : 'Add New Expense'}</span>
                  </div>
                  <form onSubmit={saveExpense}>
                    <div className="form-group">
                      <label className="form-label">{db.settings.lang === 'mr' ? 'रक्कम *' : 'Amount *'}</label>
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
                        maxLength="4"
                        value={expenseArchivePinInput}
                        onChange={(e) => setExpenseArchivePinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        style={{ width: '120px', textAlign: 'center', WebkitUserSelect: 'text', userSelect: 'text' }}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={async () => {
                          if (!db.settings.archivePasswordHash) {
                            showToast(db.settings.lang === 'mr' ? 'कृपया सेटिंग्जमध्ये आर्काइव्ह पासकोड सेट करा.' : 'Please set an archive passcode in Settings first.', 'error');
                            return;
                          }
                          if (await matchesArchiveSecret(expenseArchivePinInput, db.settings.archivePasswordHash)) {
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
            db?.settings?.archivePasswordHash && !isSettingsUnlocked ? (
              <div className="tab-panel animate-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: '60vh' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '30px 24px', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
                    <span style={{ fontSize: '24px' }}>🔒</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    {db?.settings?.lang === 'mr' ? 'सेटिंग्ज लॉक' : 'Settings Locked'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 24px', lineHeight: '1.5' }}>
                    {db?.settings?.lang === 'mr' ? 'सिस्टम सेटिंग्ज पाहण्यासाठी किंवा बदलण्यासाठी कृपया पासकोड प्रविष्ट करा.' : 'Please enter the access passcode to view or modify system settings.'}
                  </p>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••"
                    maxLength="4"
                    value={settingsPinInput}
                    onChange={(e) => setSettingsPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        if (await matchesArchiveSecret(settingsPinInput, db?.settings?.archivePasswordHash)) {
                          setIsSettingsUnlocked(true);
                          setSettingsPinInput('');
                          showToast(db?.settings?.lang === 'mr' ? 'प्रवेश मंजूर!' : 'Access Granted!', 'success');
                        } else {
                          showToast(db?.settings?.lang === 'mr' ? 'चुकीचा संकेतशब्द!' : 'Incorrect Passcode!', 'error');
                        }
                      }
                    }}
                    style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '6px', marginBottom: '20px', padding: '10px' }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontWeight: '700' }}
                    onClick={async () => {
                      if (await matchesArchiveSecret(settingsPinInput, db?.settings?.archivePasswordHash)) {
                        setIsSettingsUnlocked(true);
                        setSettingsPinInput('');
                        showToast(db?.settings?.lang === 'mr' ? 'प्रवेश मंजूर!' : 'Access Granted!', 'success');
                      } else {
                        showToast(db?.settings?.lang === 'mr' ? 'चुकीचा संकेतशब्द!' : 'Incorrect Passcode!', 'error');
                      }
                    }}
                  >
                    {db?.settings?.lang === 'mr' ? 'अनलॉक करा' : 'Unlock Settings'}
                  </button>
                </div>
              </div>
            ) : (
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
                          onChange={(e) => saveDb((currentDb) => ({ ...currentDb, settings: { ...currentDb.settings, lang: e.target.value } }))}
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
                            onBlur={() => saveSettingField('messName', messNameInput, { required: true, label: 'Mess name' })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('ownerName')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={ownerNameInput}
                            onChange={(e) => setOwnerNameInput(e.target.value)}
                            onBlur={() => saveSettingField('ownerName', ownerNameInput, { required: true, label: 'Owner name' })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                          <label className="form-label">{t('ownerAddress')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={ownerAddressInput}
                            onChange={(e) => setOwnerAddressInput(e.target.value)}
                            onBlur={() => saveSettingField('ownerAddress', ownerAddressInput, { required: true, label: 'Address' })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'UPI आयडी' : 'UPI ID'}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={upiIdInput}
                            onChange={(e) => setUpiIdInput(e.target.value)}
                            onBlur={() => saveSettingField('upiId', upiIdInput.trim(), { label: 'UPI ID' })}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                            placeholder={db.settings.lang === 'mr' ? 'उदा. name@bank' : 'Example: name@bank'}
                          />
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            {db.settings.lang === 'mr'
                              ? 'ही आयडी WhatsApp रिमाइंडरमध्ये पेमेंट लिंकसाठी वापरली जाईल.'
                              : 'This is used to add a payment link in WhatsApp reminders.'}
                          </div>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'पेमेंट मोबाईल नंबर' : 'Payment Mobile Number'}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={paymentPhoneInput}
                            onChange={(e) => setPaymentPhoneInput(e.target.value.replace(/\D/g, ''))}
                            onBlur={() => saveSettingField('paymentPhone', paymentPhoneInput.trim(), { label: 'Payment Mobile Number' })}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                            placeholder={db.settings.lang === 'mr' ? 'उदा. 9876543210' : 'Example: 9876543210'}
                            maxLength="10"
                          />
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            {db.settings.lang === 'mr'
                              ? 'UPI लिंक अयशस्वी झाल्यास ग्राहक या नंबरवर थेट पेमेंट करू शकतात.'
                              : 'Customers can pay directly to this number if the UPI link declines.'}
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'थकीत रक्कम आठवण मेसेज साचा' : 'Dues Reminder Template'}</label>
                          <textarea
                            className="form-input"
                            rows="2"
                            value={whatsappDuesTemplateInput}
                            onChange={(e) => setWhatsappDuesTemplateInput(e.target.value)}
                            onBlur={() => saveSettingField('whatsappDuesTemplate', whatsappDuesTemplateInput, { label: 'Dues reminder template' })}
                            style={{ resize: 'vertical', fontSize: '13px', WebkitUserSelect: 'text', userSelect: 'text', minHeight: '60px' }}
                            placeholder={db.settings.lang === 'mr'
                              ? 'नमस्कार [Name], तुमची थकीत रक्कम ₹[Dues] आहे. कृपया पेमेंट करा: [UpiLink] - [MessName]'
                              : 'Dear [Name], your pending dues are Rs [Dues]. Please pay here: [UpiLink] - [MessName]'}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Placeholder tokens: <code>[Name]</code>, <code>[Dues]</code>, <code>[Amount]</code>, <code>[Date]</code>, <code>[UpiLink]</code>, <code>[MessName]</code>
                          </span>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ maxWidth: '50%' }}>
                          <label className="form-label">{t('langPreference')}</label>
                          <select
                            className="form-select"
                            value={db.settings.lang || 'en'}
                            onChange={(e) => saveDb((currentDb) => ({ ...currentDb, settings: { ...currentDb.settings, lang: e.target.value } }))}
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
                              showToast(db.settings.lang === 'mr' ? 'शाखा बदलली!' : 'Active branch updated!', 'success');
                            }}
                          >
                            <option value="Branch 1">Branch 1 (Mess 1)</option>
                            <option value="Branch 2">Branch 2 (Mess 2)</option>
                          </select>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />

                      {/* PIN Settings Row */}
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{t('ownerPin')}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                type={showSettingsPin ? "text" : "password"}
                                className="form-input"
                                maxLength="6"
                                placeholder="******"
                                value={newPinInput}
                                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
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
                              onClick={async () => {
                                const saved = await savePinSetting('ownerPinHash', newPinInput, 'PIN changed and saved successfully!');
                                if (saved) setNewPinInput('');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'शाखा १ लॉगिन पिन' : 'Branch 1 Login PIN'}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="password"
                              className="form-input"
                              maxLength="6"
                              placeholder="******"
                              value={newBranch1PinInput}
                              onChange={(e) => setNewBranch1PinInput(e.target.value.replace(/\D/g, ''))}
                              style={{ flex: 1 }}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={async () => {
                                const saved = await savePinSetting('branch1PinHash', newBranch1PinInput, 'Branch 1 PIN saved successfully!');
                                if (saved) setNewBranch1PinInput('');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'शाखा २ लॉगिन पिन' : 'Branch 2 Login PIN'}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="password"
                              className="form-input"
                              maxLength="6"
                              placeholder="******"
                              value={newBranch2PinInput}
                              onChange={(e) => setNewBranch2PinInput(e.target.value.replace(/\D/g, ''))}
                              style={{ flex: 1 }}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={async () => {
                                const saved = await savePinSetting('branch2PinHash', newBranch2PinInput, 'Branch 2 PIN saved successfully!');
                                if (saved) setNewBranch2PinInput('');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '15px', marginBottom: 0 }}>
                          {db.settings.lang === 'mr' ? 'जुने ग्राहक आर्काइव्ह संकेतशब्द सेटिंग्ज' : 'Old Customers Archive Passcode settings'}
                        </label>
                        
                        {/* Option 1: Current Passcode */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px', letterSpacing: '0.5px' }}>
                            {db.settings.lang === 'mr' ? 'पर्याय १: सध्याचा पासवर्ड वापरा' : 'Option 1: Use Current Passcode'}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '11px' }}>
                                {db.settings.lang === 'mr' ? 'सध्याचा संकेतशब्द' : 'Current Passcode'}
                              </label>
                              <input
                                type="password"
                                className="form-input"
                                maxLength="6"
                                placeholder="******"
                                value={archivePinOwnerAuthInput}
                                onChange={(e) => setArchivePinOwnerAuthInput(e.target.value.replace(/\D/g, ''))}
                              />
                            </div>
                            <div className="form-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '11px' }}>
                                {db.settings.lang === 'mr' ? 'नवीन आर्काइव्ह पासवर्ड' : 'New Archive Password'}
                              </label>
                              <input
                                type="password"
                                className="form-input"
                                maxLength="4"
                                placeholder={db.settings.lang === 'mr' ? 'नवीन पासवर्ड (४-अंकी)' : 'New Passcode (4-digit)'}
                                value={newArchivePinInput}
                                onChange={(e) => setNewArchivePinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                              <button
                                className="btn btn-primary"
                                onClick={updateArchivePasscodeWithCurrentPasscode}
                              >
                                {db.settings.lang === 'mr' ? 'अपडेट करा' : 'Update Passcode'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Option 2: Reset using Owner PIN */}
                        <div style={{ background: 'rgba(249, 115, 22, 0.02)', padding: '12px', borderRadius: '12px', border: '1px dashed rgba(249, 115, 22, 0.3)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px', letterSpacing: '0.5px' }}>
                            {db.settings.lang === 'mr' ? 'पर्याय २: मालक पिनने रीसेट करा' : 'Option 2: Reset with Owner PIN'}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '11px', color: 'var(--primary)' }}>
                                {db.settings.lang === 'mr' ? 'मालक पिन (६-अंकी)' : 'Owner PIN (6-digit)'}
                              </label>
                              <input
                                type="password"
                                className="form-input"
                                maxLength="6"
                                placeholder="******"
                                value={archiveOwnerPinInput}
                                onChange={(e) => setArchiveOwnerPinInput(e.target.value.replace(/\D/g, ''))}
                              />
                            </div>
                            <div className="form-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '11px' }}>
                                {db.settings.lang === 'mr' ? 'नवीन आर्काइव्ह पासवर्ड' : 'New Archive Password'}
                              </label>
                              <input
                                type="password"
                                className="form-input"
                                maxLength="4"
                                placeholder={db.settings.lang === 'mr' ? 'नवीन पासवर्ड (४-अंकी)' : 'New Passcode (4-digit)'}
                                value={newArchivePinInput}
                                onChange={(e) => setNewArchivePinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                              <button
                                className="btn btn-primary"
                                style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }}
                                onClick={updateArchivePasscodeWithOwnerPin}
                              >
                                {db.settings.lang === 'mr' ? 'रीसेट करा' : 'Reset Passcode'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Local Data & Backups</label>
                        <div style={{
                          marginTop: '10px',
                          padding: '14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: saveHealthUi.color,
                              display: 'inline-block'
                            }} />
                            <strong style={{ color: 'var(--text)' }}>{saveHealthUi.label}</strong>
                            {saveHealth.pending > 0 && (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                {saveHealth.pending} queued
                              </span>
                            )}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {saveHealthUi.details}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'grid', gap: '4px' }}>
                            <span>Last local save: {formatHealthTimestamp(saveHealth.lastLocalSaveAt)}</span>
                            <span>Last cloud sync: {formatHealthTimestamp(saveHealth.lastCloudSyncAt)}</span>
                            <span>Last completed save: {formatHealthTimestamp(saveHealth.lastSavedAt)}</span>
                            {saveHealth.lastError && (
                              <span style={{ color: 'var(--danger)' }}>Latest issue: {saveHealth.lastError}</span>
                            )}
                          </div>
                          {(saveHealth.status === 'error' || saveHealth.status === 'degraded') && (
                            <div>
                              <button className="btn btn-sm" onClick={retryLastSave}>
                                Retry Last Save
                              </button>
                            </div>
                          )}
                        </div>
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
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('Backup file is too large. Please use a file under 5 MB.');
                                  e.target.value = '';
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = async (evt) => {
                                  try {
                                    const parsed = JSON.parse(evt.target.result);
                                    const sanitizedImport = sanitizeImportedDb(parsed);
                                    const confirmImport = window.confirm(
                                      'Importing a backup will replace current in-memory data. Continue?'
                                    );
                                    if (!confirmImport) {
                                      e.target.value = '';
                                      return;
                                    }
                                    await saveDb(sanitizedImport);
                                    alert('Database imported successfully!');
                                    window.location.reload();
                                  } catch (err) {
                                    alert('Error reading file: ' + err.message);
                                  } finally {
                                    e.target.value = '';
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
          )
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
                <button type="button" className="btn" onClick={() => setPayModalCustomer(null)} disabled={isSavingPayment}>
                  {db.settings.lang === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-success" disabled={isSavingPayment}>
                  {isSavingPayment ? (
                    db.settings.lang === 'mr' ? 'नोंदवत आहे...' : 'Recording...'
                  ) : (
                    db.settings.lang === 'mr' ? 'नोंदवा' : 'Record'
                  )}
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
              <X className="modal-close" onClick={() => { setCustModal(false); setEditCustId(null); }} />
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
              <button className="btn" onClick={() => { setCustModal(false); setEditCustId(null); }}>{t('cancel')}</button>
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

      {/* BULK WHATSAPP REMINDER MODAL */}
      {isBulkReminderOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '600px', width: '92%' }}>
            <div className="modal-header">
              <span className="modal-title">
                {isQueueProcessing
                  ? (db.settings?.lang === 'mr' ? 'बुल्क संदेश पाठवत आहे...' : 'Sending Bulk Reminders...')
                  : (db.settings?.lang === 'mr' ? 'बुल्क WhatsApp आठवण' : 'Bulk WhatsApp Reminder')
                }
              </span>
              <X 
                className="modal-close" 
                onClick={isQueueProcessing ? handleQueueCancel : () => setIsBulkReminderOpen(false)} 
              />
            </div>
            
            {isQueueProcessing ? (
              <div className="modal-body">
                {/* Progress bar */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    <span>
                      {db.settings?.lang === 'mr' 
                        ? `प्रगती: ग्राहक ${bulkQueueIndex + 1} पैकी ${bulkQueue.length}` 
                        : `Progress: Customer ${bulkQueueIndex + 1} of ${bulkQueue.length}`}
                    </span>
                    <span>
                      {Math.round((bulkQueueIndex / bulkQueue.length) * 100)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(bulkQueueIndex / bulkQueue.length) * 100}%`, 
                      height: '100%', 
                      backgroundColor: 'var(--success)', 
                      borderRadius: '4px',
                      transition: 'width 0.3s ease' 
                    }} />
                  </div>
                </div>

                {/* Current Customer Card */}
                {bulkQueue[bulkQueueIndex] && (
                  <div style={{ 
                    background: 'var(--bg)', 
                    border: '1.5px solid var(--border)', 
                    borderRadius: '12px', 
                    padding: '16px', 
                    marginBottom: '20px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {bulkQueue[bulkQueueIndex].name}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          📞 {bulkQueue[bulkQueueIndex].phone}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>
                          ₹{getCustomerDues(bulkQueue[bulkQueueIndex])}
                        </span>
                        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                          {db.settings?.lang === 'mr' ? 'थकीत रक्कम' : 'Pending Due'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                      <div>
                        <strong>{db.settings?.lang === 'mr' ? 'योजना:' : 'Plan:'}</strong> {bulkQueue[bulkQueueIndex].plan}
                      </div>
                      <div style={{ marginLeft: '12px' }}>
                        <strong>{db.settings?.lang === 'mr' ? 'सुरुवात तारीख:' : 'Start Date:'}</strong> {bulkQueue[bulkQueueIndex].joinDate}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ background: 'rgba(216, 90, 48, 0.05)', border: '1px solid rgba(216, 90, 48, 0.1)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#c2410c', lineHeight: '1.5' }}>
                  💡 {db.settings?.lang === 'mr' 
                    ? 'खालील "चॅट उघडा" बटण दाबा. WhatsApp उघडल्यावर चॅटमध्ये संदेश पाठवा (Send) बटण दाबा. त्यानंतर पुढील ग्राहकासाठी येथे परत या.' 
                    : 'Click "Open Chat & Next" to launch the message draft in WhatsApp. Press "Send" in WhatsApp, then return here for the next customer.'}
                </div>
              </div>
            ) : (
              <div className="modal-body">
                <div style={{ marginBottom: '16px', background: 'rgba(34, 197, 94, 0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {db.settings?.lang === 'mr' 
                      ? 'ग्राहकांना थकीत रक्कम आठवण पाठवा. खालील यादीतून ग्राहक निवडा.' 
                      : 'Send payment reminders to multiple customers via WhatsApp. Select customers from the list below.'}
                  </p>
                </div>

                {/* Search bar inside modal */}
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder={db.settings?.lang === 'mr' ? 'नाव किंवा फोन नंबर शोधा...' : 'Search by name or phone...'}
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Select All Toggle Bar */}
                {filteredModalDueCustomers.length > 0 && (
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }} 
                    onClick={toggleSelectAllBulk}
                  >
                    <input
                      type="checkbox"
                      checked={filteredModalDueCustomers.map(c => c.id).every(id => selectedWhatsAppCustomerIds.includes(id))}
                      onChange={toggleSelectAllBulk}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginRight: '10px', width: '16px', height: '16px', accentColor: 'var(--success)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {db.settings?.lang === 'mr' ? 'सर्व निवडा' : 'Select All'} ({filteredModalDueCustomers.length})
                    </span>
                  </div>
                )}

                {/* Smooth scrolling customer list container */}
                <div 
                  className="bulk-customer-list-container"
                  style={{
                    maxHeight: '320px',
                    overflowY: 'auto',
                    scrollBehavior: 'smooth',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px',
                    backgroundColor: 'var(--bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {filteredModalDueCustomers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {db.settings?.lang === 'mr' ? 'थकीत रक्कम असलेले ग्राहक आढळले नाहीत.' : 'No customers with pending dues found.'}
                    </div>
                  ) : (
                    filteredModalDueCustomers.map(c => {
                      const isSelected = selectedWhatsAppCustomerIds.includes(c.id);
                      const dueAmt = getCustomerDues(c);
                      return (
                        <div 
                          key={c.id} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.04)' : 'var(--card)',
                            border: isSelected ? '1.5px solid var(--success)' : '1.5px solid var(--border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            gap: '12px'
                          }}
                          onClick={() => toggleWhatsAppCustomer(c.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleWhatsAppCustomer(c.id)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ width: '18px', height: '18px', accentColor: 'var(--success)', cursor: 'pointer', flexShrink: 0 }}
                            />
                            
                            {/* Customer Photo / Avatar */}
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--border)', flexShrink: 0 }}>
                              {c.photo ? (
                                <img src={c.photo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                  {(c.name || 'C').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>

                            {/* Customer Info (Name, Phone, Address) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {c.name}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                📞 {c.phone}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                📍 {c.addr || (db.settings?.lang === 'mr' ? 'पत्ता उपलब्ध नाही' : 'No Address')}
                              </span>
                            </div>
                          </div>
                          
                          {/* Remaining Amount */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--danger)' }}>
                              ₹{dueAmt}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                              {db.settings?.lang === 'mr' ? 'थकीत' : 'Due'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {isQueueProcessing ? (
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button className="btn btn-danger" onClick={handleQueueCancel}>
                  {db.settings?.lang === 'mr' ? 'थांबवा' : 'Stop'}
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn" onClick={() => handleQueueNext(true)}>
                    {db.settings?.lang === 'mr' ? 'वगळा' : 'Skip'}
                  </button>
                  <button className="btn btn-success" onClick={() => handleQueueNext(false)}>
                    <Bell size={14} style={{ marginRight: '6px' }} />
                    {db.settings?.lang === 'mr' ? 'चॅट उघडा' : 'Open Chat & Next'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-footer">
                <button className="btn" onClick={() => setIsBulkReminderOpen(false)}>
                  {db.settings?.lang === 'mr' ? 'बंद करा' : 'Close'}
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={sendBulkWhatsAppReminders}
                  disabled={selectedWhatsAppCustomerIds.length === 0}
                  title={db.settings?.lang === 'mr' ? 'निवडलेले पाठवा' : 'Send selected'}
                >
                  <Bell size={14} style={{ marginRight: '6px' }} />
                  {db.settings?.lang === 'mr' ? 'संदेश पाठवा' : 'Send Reminders'} ({selectedWhatsAppCustomerIds.length})
                </button>
              </div>
            )}
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


