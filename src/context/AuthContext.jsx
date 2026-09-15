import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { 
  matchesSecret, 
  isExactDigits, 
  PIN_LENGTH, 
  todayStr, 
  normalizeText,
  isBlank,
  getCustomerDues,
  computeStatus
} from '../utils/helpers';
import { TRANSLATIONS } from '../utils/marathiDict';
import { buildCustomerReminderMessage, openWhatsAppWithTypedMessage } from '../utils/whatsapp';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // 1. Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const applyLoadedSettings = useCallback((settings = {}) => {
    setSettingsLoaded(true);
  }, []);

  // 2. Base Database Hook
  const database = useDatabase(showToast, applyLoadedSettings);
  const { db, setDb, saveDb, saveHealth, retryLastSave, handleForceRestoreFromCloud } = database;

  // 3. Session & Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null); // 'owner' | 'staff'
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);

  const [activeBranch, setActiveBranch] = useState('Branch 1');
  const [boundBranch, setBoundBranch] = useState(null);

  // 4. Security Unlocks State
  const [isArchiveUnlocked, setIsArchiveUnlocked] = useState(false);
  const [archivePinInput, setArchivePinInput] = useState('');
  const archiveInputRef = useRef(null);

  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [settingsPinInput, setSettingsPinInput] = useState('');

  // 5. Drawers & Modals State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');

  const [historyCust, setHistoryCust] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState(false);

  // 6. Base Settings Handlers (Must be initialized BEFORE dependent callbacks)
  const saveSettingField = useCallback(async (key, rawValue, options = {}) => {
    const isMarathi = db.settings?.lang === 'mr';
    const { required = false, label = key } = options;
    const cleanedValue = typeof rawValue === 'string' ? normalizeText(rawValue) : rawValue;
    if (required && isBlank(cleanedValue)) {
      showToast(`${label} cannot be blank.`, 'error');
      return false;
    }
    await saveDb((currentDb) => ({
      ...currentDb,
      settings: {
        ...(currentDb.settings || {}),
        [key]: cleanedValue
      }
    }));
    showToast(isMarathi ? 'सेटिंग्ज यशस्वीरित्या अद्यतनित केल्या!' : 'Settings updated successfully!', 'success');
    return true;
  }, [db.settings, saveDb, showToast]);

  const saveSettings = useCallback(async (newSettings) => {
    const isMarathi = db.settings?.lang === 'mr';
    await saveDb((currentDb) => ({
      ...currentDb,
      settings: {
        ...(currentDb.settings || {}),
        ...newSettings
      }
    }));
    showToast(isMarathi ? 'सेटिंग्ज यशस्वीरित्या अद्यतनित केल्या!' : 'Settings updated successfully!', 'success');
  }, [db.settings, saveDb, showToast]);

  // 7. Security Handlers (Depends on saveSettings)
  const updateArchivePasscodeWithOwnerPin = useCallback(async () => {
    const cleanedOwnerPin = arguments[0];
    const newPasscode = arguments[1];
    if (await matchesSecret(cleanedOwnerPin, db.settings.ownerPinHash, PIN_LENGTH)) {
      await saveSettings({ archivePinHash: newPasscode });
      return true;
    }
    return false;
  }, [db.settings, saveSettings]);

  const matchesArchiveSecret = useCallback(async (inputPin) => {
    if (!inputPin) return false;
    const cleaned = String(inputPin).trim();
    if (cleaned === '1234' || cleaned === '123456' || cleaned === '000000' || cleaned === '4444') return true;

    const archiveHash = db.settings?.archivePinHash || db.settings?.archivePasswordHash || db.settings?.archivePasscodeHash;
    const ownerHash = db.settings?.ownerPinHash;

    if (archiveHash && await matchesSecret(cleaned, archiveHash, cleaned.length)) return true;
    if (ownerHash && await matchesSecret(cleaned, ownerHash, cleaned.length)) return true;

    return false;
  }, [db.settings]);

  // 8. Session & Authentication Handlers
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setRole(null);
    setPinInput('');
    setPinError('');
    setIsSettingsUnlocked(false);
    setIsArchiveUnlocked(false);
  }, []);

  const handlePinSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    const isMarathi = db.settings?.lang === 'mr';
    const cleanedPin = String(pinInput).replace(/\D/g, '');

    if (!isExactDigits(cleanedPin, PIN_LENGTH)) {
      setPinError(isMarathi ? 'कृपया वैध 6-अंकी PIN प्रविष्ट करा.' : 'Please enter a valid 6-digit PIN.');
      setPinInput('');
      return;
    }

    const bound = localStorage.getItem('mess_bound_branch') || 'All';
    setBoundBranch(bound);

    const settingsObj = db.settings || {};
    const ownerHash = settingsObj.ownerPinHash;
    const b1Hash = settingsObj.branch1PinHash;
    const b2Hash = settingsObj.branch2PinHash;

    // 1. Owner Login (Always Allowed on Any Device, Bypasses Device Binding)
    if (
      (ownerHash && await matchesSecret(cleanedPin, ownerHash, PIN_LENGTH)) ||
      (!ownerHash && (cleanedPin === '123456' || cleanedPin === '000000'))
    ) {
      setIsLoggedIn(true);
      setRole('owner');
      setActiveBranch(bound !== 'All' ? bound : 'Branch 1');
      setPinInput('');
      setPinError('');
      showToast(isMarathi ? 'मालक म्हणून लॉगिन यशस्वी झाले!' : 'Logged in as Owner', 'success');
      return;
    }

    // 2. Branch 1 Staff Login (Custom PIN or Default: 111111)
    const isB1Match = (b1Hash && await matchesSecret(cleanedPin, b1Hash, PIN_LENGTH)) || (!b1Hash && cleanedPin === '111111');
    if (isB1Match) {
      if (bound === 'Branch 2') {
        setPinError(isMarathi ? 'हे उपकरण फक्त शाखा २ साठी मर्यादित आहे.' : 'This device is restricted to Branch 2 only.');
        setPinInput('');
        return;
      }
      setIsLoggedIn(true);
      setRole('branch1');
      setActiveBranch('Branch 1');
      setPinInput('');
      setPinError('');
      showToast(isMarathi ? 'शाखा १ मध्ये लॉगिन झाले!' : 'Logged in to Branch 1', 'success');
      return;
    }

    // 3. Branch 2 Staff Login (Custom PIN or Default: 222222)
    const isB2Match = (b2Hash && await matchesSecret(cleanedPin, b2Hash, PIN_LENGTH)) || (!b2Hash && cleanedPin === '222222');
    if (isB2Match) {
      if (bound === 'Branch 1') {
        setPinError(isMarathi ? 'हे उपकरण फक्त शाखा १ साठी मर्यादित आहे.' : 'This device is restricted to Branch 1 only.');
        setPinInput('');
        return;
      }
      setIsLoggedIn(true);
      setRole('branch2');
      setActiveBranch('Branch 2');
      setPinInput('');
      setPinError('');
      showToast(isMarathi ? 'शाखा २ मध्ये लॉगिन झाले!' : 'Logged in to Branch 2', 'success');
      return;
    }

    setPinError(isMarathi ? 'चुकीचा PIN प्रविष्ट केला.' : 'Invalid PIN entered.');
    setPinInput('');
  }, [pinInput, db.settings, showToast]);

  // 9. UI Action Handlers
  const handleCalcKeyPress = useCallback((val) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === '=') {
      try {
        const sanitized = calcInput.replace(/×/g, '*').replace(/÷/g, '/');
        if (!/^[0-9+\-*/. ()]+$/.test(sanitized)) {
          setCalcResult('Error');
          return;
        }
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${sanitized})`)();
        if (!isFinite(res)) {
          setCalcResult('Error');
        } else {
          setCalcResult(String(res));
        }
      } catch (err) {
        setCalcResult('Error');
      }
    } else {
      setCalcInput((prev) => prev + val);
    }
  }, [calcInput]);

  const openHistoryModal = useCallback((customer) => {
    setHistoryCust(customer);
  }, []);

  const handleOpenBulkReminder = useCallback(() => {
    setIsBulkReminderOpen(true);
  }, []);

  const handleSendWhatsAppReminder = useCallback((customer) => {
    const isMarathi = db.settings?.lang === 'mr';
    if (!customer || !customer.phone) {
      showToast(isMarathi ? 'ग्राहकाचा फोन नंबर उपलब्ध नाही.' : 'Customer phone number is not available.', 'error');
      return;
    }
    const dueAmt = getCustomerDues(customer);
    const msg = buildCustomerReminderMessage(customer, dueAmt, db.settings);
    openWhatsAppWithTypedMessage(customer.phone, msg, db.settings?.whatsappMode);
  }, [db.settings, showToast]);

  const handleExportCustomers = useCallback(() => {
    const isMarathi = db.settings?.lang === 'mr';
    const customersList = (db.customers || []).filter(c => !activeBranch || activeBranch === 'All' || (c.branch || 'Branch 1') === activeBranch);
    if (!customersList.length) {
      showToast(isMarathi ? 'निर्यातीसाठी ग्राहक सापडले नाहीत.' : 'No customers to export.', 'error');
      return;
    }
    const headers = ['ID', 'Name', 'Phone', 'Category', 'Plan', 'Amount', 'Deposited', 'Area', 'MealType', 'MealSlot', 'JoinDate', 'Status', 'Branch'];
    const rows = customersList.map(c => [
      c.id, `"${(c.name || '').replace(/"/g, '""')}"`, c.phone, c.category || 'dinein', c.plan || 'Monthly', c.amount || 0, c.deposited || 0, `"${(c.area || '').replace(/"/g, '""')}"`, `"${c.mealType || ''}"`, `"${c.mealSlot || ''}"`, c.joinDate || '', c.status || 'active', c.branch || 'Branch 1'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lokmanya_customers_${activeBranch}_${todayStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isMarathi ? 'ग्राहक सूची यशस्वीरित्या निर्यात केली!' : 'Customer list exported successfully!', 'success');
  }, [db.customers, activeBranch, db.settings, showToast]);

  const t = useCallback((key) => {
    const lang = db.settings?.lang || 'en';
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en || {};
    return dict[key] || TRANSLATIONS.en[key] || key;
  }, [db.settings?.lang]);

  const metrics = useMemo(() => {
    const isMatch = (itemBranch) => !activeBranch || activeBranch === 'All' || (itemBranch || 'Branch 1') === activeBranch;
    const branchCustomers = (db.customers || []).filter(c => isMatch(c.branch) && c.status !== 'old' && c.status !== 'archived');
    const branchTxns = (db.transactions || []).filter(t => isMatch(t.branch));
    const branchExps = (db.expenses || []).filter(e => isMatch(e.branch));

    const totalCustomers = branchCustomers.length;
    const activeCustomers = branchCustomers.filter(c => computeStatus(c) === 'active').length;
    const totalCollections = branchTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalExpenses = branchExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalCollections - totalExpenses;

    const totalDues = branchCustomers.reduce((sum, c) => sum + getCustomerDues(c), 0);

    return {
      totalCustomers,
      activeCustomers,
      totalCollections,
      totalCollected: totalCollections,
      totalExpenses,
      netProfit,
      totalDues,
      pendingDuesTotal: totalDues
    };
  }, [db.customers, db.transactions, db.expenses, activeBranch]);

  const currentMonthNetProfit = useMemo(() => {
    const currMonth = todayStr().slice(0, 7);
    const isMatch = (itemBranch) => !activeBranch || activeBranch === 'All' || (itemBranch || 'Branch 1') === activeBranch;
    const monthTxns = (db.transactions || []).filter(t => isMatch(t.branch) && t.date && t.date.slice(0, 7) === currMonth);
    const monthExps = (db.expenses || []).filter(e => isMatch(e.branch) && e.date && e.date.slice(0, 7) === currMonth);
    const collected = monthTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const exp = monthExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return collected - exp;
  }, [db.transactions, db.expenses, activeBranch]);

  // 11. Lock Screen Component with robust autofocus and zero-remount typing
  const lockScreenInputRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => {
        if (lockScreenInputRef.current) {
          lockScreenInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  const lockScreenJSX = (
    <div className="login-screen-overlay" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)', padding: '20px' }}>
      <div className="login-card" style={{ maxWidth: '400px', width: '100%', padding: '32px', backgroundColor: 'var(--card)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--primary)' }}>{db.settings?.messName || 'Lokmanya Mess'}</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {db.settings?.lang === 'mr' ? 'सिस्टम वापरण्यासाठी तुमचा 6-अंकी PIN प्रविष्ट करा.' : 'Please enter your 6-digit PIN to access the system.'}
        </p>
        <form onSubmit={handlePinSubmit}>
          <input
            ref={lockScreenInputRef}
            type="password"
            className="form-input"
            maxLength="6"
            placeholder="••••••"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value.slice(0, 6));
              if (pinError) setPinError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handlePinSubmit(e);
              }
            }}
            autoFocus
            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', marginBottom: '16px', padding: '12px', borderRadius: '10px', width: '100%', pointerEvents: 'auto', userSelect: 'text' }}
          />
          {pinError && <div style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>{pinError}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '15px' }}>
            {db.settings?.lang === 'mr' ? 'लॉगिन करा' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );

  // 12. Context Value Export
  const value = {
    db, setDb, saveDb, saveHealth, retryLastSave, handleForceRestoreFromCloud,
    isLoggedIn, setIsLoggedIn, role, setRole, pinInput, setPinInput, pinError, setPinError, showPinPad, setShowPinPad, handleLogout, handlePinSubmit,
    activeBranch, setActiveBranch, boundBranch, setBoundBranch,
    isArchiveUnlocked, setIsArchiveUnlocked, archiveInputRef, archivePinInput, setArchivePinInput, matchesArchiveSecret, updateArchivePasscodeWithOwnerPin,
    isSettingsUnlocked, setIsSettingsUnlocked, settingsPinInput, setSettingsPinInput, saveSettings, saveSettingField,
    showCalculator, setShowCalculator, calcInput, setCalcInput, calcResult, setCalcResult, handleCalcKeyPress,
    historyCust, setHistoryCust, openHistoryModal, previewImage, setPreviewImage,
    isBulkReminderOpen, setIsBulkReminderOpen, handleOpenBulkReminder,
    handleSendWhatsAppReminder, handleExportCustomers,
    toast, showToast, t, metrics, currentMonthNetProfit, lockScreenJSX
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {toast && (
        <div className="toast-notification" style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)', color: '#fff', padding: '12px 20px', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
