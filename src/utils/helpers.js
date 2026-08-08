export const PLAN_DAYS = { Monthly: 30, Weekly: 7, Daily: 1, Custom: 30 };
export const PIN_LENGTH = 6;
export const ARCHIVE_PIN_MIN_LENGTH = 4;
export const ARCHIVE_PIN_MAX_LENGTH = 6;

export const todayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toLocalYYYYMMDD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
export const isBlank = (value) => normalizeText(value).length === 0;
export const isExactDigits = (value, length) => new RegExp(`^\\d{${length}}$`).test(String(value ?? ''));
export const isArchivePinValid = (value) => /^\d{4}$/.test(String(value ?? ''));
export const toAmountNumber = (value) => {
  const str = String(value ?? '').trim().replace(/[^\d.]/g, '');
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : 0;
};

export function sha256Pure(ascii) {
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

export async function hashSecret(secret) {
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

export async function secureSettings(inputSettings = {}) {
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

export function hasLegacySecrets(settings = {}) {
  return ['ownerPin', 'branch1Pin', 'branch2Pin', 'archivePassword'].some((key) => Boolean(settings[key]));
}

export async function matchesSecret(candidate, storedHash, expectedLength) {
  if (!isExactDigits(candidate, expectedLength)) return false;
  if (!storedHash) return false;
  return (await hashSecret(candidate)) === storedHash;
}

export async function matchesArchiveSecret(candidate, storedHash) {
  if (!/^\d{4,6}$/.test(String(candidate ?? ''))) return false;
  if (!storedHash) return false;
  return (await hashSecret(candidate)) === storedHash;
}

export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date();
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function isValidDate(dateStr) {
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

export function getEffectiveJoinDate(c) {
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c.billingStartDate || c.joinDate || '';
}

export function getExpiryDate(c, optionalPlan) {
  const refDate = getEffectiveJoinDate(c);
  if (!refDate) return new Date();
  const startDate = parseLocalDate(refDate);

  if (typeof c === 'object' && c.category === 'shortterm') {
    const durationDays = Number(c.shortTermDays || 10);
    const expiryDate = new Date(startDate);
    expiryDate.setDate(startDate.getDate() + durationDays);
    return expiryDate;
  }

  const daysPerCycle = PLAN_DAYS[(typeof c === 'object' ? c.plan : optionalPlan)] || 30;
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

export function getExpiryDays(c) {
  if (!c) return 0;
  const joinDate = typeof c === 'string' ? c : c.joinDate;
  if (!joinDate) return 0;
  const expiryDate = getExpiryDate(c, typeof c === 'string' ? arguments[1] : undefined);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = expiryDate - todayMidnight;
  return Math.round(diffTime / 86400000);
}

export function expiryStr(c) {
  if (!c) return '';
  const joinDate = typeof c === 'string' ? c : c.joinDate;
  if (!joinDate) return '';
  const d = getExpiryDate(c, typeof c === 'string' ? arguments[1] : undefined);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const TRANSLATIONS = {
  en: {
    pinTitle: "Lokmanya Mess",
    pinSubtitle: "Enter PIN to Access System",
    pinError: "Invalid PIN! Please try again.",
    dashboard: "Dashboard",
    customers: "Dine-in Members",
    tiffin: "Tiffin Delivery",
    shortterm: "Short-Term Members",
    collections: "Collections",
    expenses: "Expenses",
    oldcustomers: "Old Customers",
    settings: "Settings",
    logout: "Logout",
    businessDashboard: "Business Dashboard",
    manageCustomers: "Manage Dine-in Members",
    manageTiffin: "Manage Tiffin Delivery",
    manageShortTerm: "Manage Short-Term Members",
    manageCollections: "Collection Reports",
    manageExpenses: "Expenditure Tracker",
    manageOldCustomers: "Archive (Old Customers)",
    appSettings: "App Settings",
    totalCollections: "Total Collections",
    activeMembers: "Active Members",
    expiringSoon: "Expiring Soon",
    pendingDues: "Pending Dues",
    expiringExpired: "Action Required (Expired, Expiring, or Pending Dues)",
    allActive: "All subscriptions are currently active!",
    custName: "Customer Name",
    phoneNo: "Phone Number",
    plan: "Plan",
    amount: "Amount",
    status: "Status",
    expiryDate: "Expiry Date",
    addCustomer: "Add Customer",
    exportCsv: "Export CSV",
    searchPlaceholder: "Search customers...",
    filterAll: "All Customers",
    filterActive: "Active Only",
    filterExpired: "Expired Only",
    filterExpiring: "Expiring Soon",
    noCusts: "No customer records found.",
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
    pinTitle: "लोकमान्य मेस",
    pinSubtitle: "सिस्टममध्ये प्रवेश करण्यासाठी पिन प्रविष्ट करा",
    pinError: "चुकीचा पिन! कृपया पुन्हा प्रयत्न करा.",
    dashboard: "डॅशबोर्ड",
    customers: "डाईन-इन ग्राहक",
    tiffin: "टिफिन डिलिव्हरी",
    shortterm: "अल्पमुदत ग्राहक",
    collections: "जमा रक्कम",
    expenses: "खर्च व्यवस्थापन",
    oldcustomers: "जुने ग्राहक (संग्रह)",
    settings: "सेटिंग्ज",
    logout: "लॉगआउट",
    businessDashboard: "व्यवसाय डॅशबोर्ड",
    manageCustomers: "डाईन-इन ग्राहक व्यवस्थापित करा",
    manageTiffin: "टिफिन डिलिव्हरी व्यवस्थापित करा",
    manageShortTerm: "अल्पमुदत ग्राहक व्यवस्थापित करा",
    manageCollections: "जमा रक्कम इतिहास",
    manageExpenses: "खर्च ट्रॅकर",
    manageOldCustomers: "जुने ग्राहक इतिहास",
    appSettings: "ॲप सेटिंग्ज",
    totalCollections: "एकूण जमा",
    activeMembers: "सक्रिय ग्राहक",
    expiringSoon: "लवकरच संपणारे",
    pendingDues: "थकीत रक्कम",
    expiringExpired: "लक्ष देणे आवश्यक (मुदत संपलेले, लवकरच संपणारे किंवा थकीत रक्कम)",
    allActive: "सर्व ग्राहकांचे प्लॅन्स सध्या सक्रिय आहेत!",
    custName: "ग्राहकाचे नाव",
    phoneNo: "फोन नंबर",
    plan: "प्लॅन",
    amount: "रक्कम",
    status: "स्थिती",
    expiryDate: "मुदत समाप्ती तारीख",
    addCustomer: "नवीन ग्राहक जोडा",
    exportCsv: "CSV एक्सपोर्ट करा",
    searchPlaceholder: "शोध ग्राहक...",
    filterAll: "सर्व ग्राहक",
    filterActive: "फक्त सक्रिय",
    filterExpired: "फक्त मुदत संपलेले",
    filterExpiring: "लवकरच संपणारे",
    noCusts: "कोणताही ग्राहक आढळला नाही.",
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

export function getCustomerDues(c) {
  if (!c) return 0;
  if (c.category === 'shortterm') {
    return Math.max(0, Number(c.amount || 0) - Number(c.deposited || 0));
  }
  const refDate = getEffectiveJoinDate(c);
  if (!refDate) return 0;
  const daysPerCycle = PLAN_DAYS[c.plan] || 30;
  const startDate = parseLocalDate(refDate);
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

export function getCustomerDuesBreakdown(c) {
  if (!c) return { prevDues: 0, currentDues: 0, totalDues: 0 };
  if (c.category === 'shortterm') {
    const totalDues = Math.max(0, Number(c.amount || 0) - Number(c.deposited || 0));
    return { prevDues: 0, currentDues: totalDues, totalDues };
  }
  const refDate = getEffectiveJoinDate(c);
  if (!refDate) return { prevDues: 0, currentDues: 0, totalDues: 0 };
  const daysPerCycle = PLAN_DAYS[c.plan] || 30;
  const startDate = parseLocalDate(refDate);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const elapsedTime = todayMidnight - startDate;
  const elapsedDays = Math.round(elapsedTime / 86400000);
  
  let elapsedCycles = 0;
  if (elapsedDays > 0) {
    elapsedCycles = Math.floor(elapsedDays / daysPerCycle);
  }
  
  const completedCyclesAmount = elapsedCycles * c.amount;
  const currentCycleFee = c.amount;
  const deposited = Number(c.deposited || 0);

  const prevDues = Math.max(0, completedCyclesAmount - deposited);
  const totalDues = Math.max(0, (completedCyclesAmount + currentCycleFee) - deposited);
  const currentDues = Math.max(0, totalDues - prevDues);

  return { prevDues, currentDues, totalDues };
}

export function computeStatus(c) {
  const refDate = getEffectiveJoinDate(c);
  if (!c || !refDate) return 'expired';
  
  if (c.category === 'shortterm') {
    const daysRemaining = getExpiryDays(c);
    if (daysRemaining > 2) return 'active';
    if (daysRemaining >= -2) return 'expiring';
    return 'expired';
  }

  const daysPerCycle = PLAN_DAYS[c.plan] || 30;
  const startDate = parseLocalDate(refDate);
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

export function getDueWarningDays(c) {
  if (!c || c.status === 'old') return 0;
  const refDate = getEffectiveJoinDate(c);
  if (!refDate) return 0;

  const remaining = getCustomerDues(c);
  if (remaining <= 0) return 0;

  const startDate = parseLocalDate(refDate);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const elapsedTime = todayMidnight - startDate;
  const elapsedDays = Math.max(0, Math.round(elapsedTime / 86400000));

  if (c.category === 'shortterm') {
    return elapsedDays >= 2 ? elapsedDays : 0;
  }

  const daysPerCycle = PLAN_DAYS[c.plan] || 30;
  const cycleDay = elapsedDays % daysPerCycle;
  return cycleDay >= 6 ? cycleDay : 0;
}

export function getDaysPendingDues(c) {
  if (!c || c.status === 'old') return 0;
  const refDate = getEffectiveJoinDate(c);
  if (!refDate) return 0;
  const dues = getCustomerDues(c);
  if (dues <= 0) return 0;

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = parseLocalDate(refDate);

  if (c.category === 'shortterm') {
    const diffTime = todayMidnight - startDate;
    return Math.max(0, Math.round(diffTime / 86400000));
  }

  const daysPerCycle = PLAN_DAYS[c.plan] || 30;
  const amount = Number(c.amount || 0);
  if (amount <= 0) return 0;

  const paidCycles = Math.max(0, Math.floor((c.deposited || 0) / amount));
  const unpaidCycleStartDate = new Date(startDate);
  unpaidCycleStartDate.setDate(startDate.getDate() + paidCycles * daysPerCycle);

  const diffTime = todayMidnight - unpaidCycleStartDate;
  return Math.max(0, Math.round(diffTime / 86400000));
}

export function sanitizeImportedDbHelper(rawDb) {
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

  const archives = ensureArray(rawDb.archives, 'archives').map((item, index) => {
    const arch = ensureObject(item, `archives[${index}]`);
    if (typeof arch.id !== 'string' || arch.id.trim() === '') {
      throw new Error(`archives[${index}] is missing a valid id.`);
    }
    return arch;
  });

  const settings = ensureObject(rawDb.settings, 'settings');

  return {
    customers,
    transactions,
    employees,
    salaries,
    expenses,
    archives,
    settings
  };
}

export function isOwnerRole(role) {
  return role === 'owner';
}

export function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}
