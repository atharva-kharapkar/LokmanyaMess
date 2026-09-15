import { useState, useMemo, useCallback } from 'react';
import { matchesSecret } from '../../utils/helpers';

export function useFinancialArchive({ db, role, showToast }) {
  const isMarathi = db?.settings?.lang === 'mr';
  const isOwner = role === 'owner';

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Extract unique available YYYY-MM months from transactions and expenses
  const availableMonths = useMemo(() => {
    const monthSet = new Set();
    (db?.transactions || []).forEach(t => {
      if (t.date && t.date.length >= 7) monthSet.add(t.date.slice(0, 7));
    });
    (db?.expenses || []).forEach(e => {
      if (e.date && e.date.length >= 7) monthSet.add(e.date.slice(0, 7));
    });
    const todayMonth = new Date().toISOString().slice(0, 7);
    monthSet.add(todayMonth);
    return Array.from(monthSet).sort().reverse();
  }, [db?.transactions, db?.expenses]);

  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const handleSelectMonth = useCallback((monthStr) => {
    if (!monthStr || monthStr === currentMonthStr) {
      setSelectedMonth(monthStr);
      return;
    }

    // Past month selected: check permissions
    if (isOwner && isUnlocked) {
      setSelectedMonth(monthStr);
    } else {
      setPinInput('');
      setPinError('');
      setIsLockModalOpen(true);
    }
  }, [currentMonthStr, isOwner, isUnlocked]);

  const handleUnlockSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!pinInput) {
      setPinError(isMarathi ? 'कृपया पासवर्ड टाका' : 'Please enter PIN');
      return;
    }

    const ownerHash = db?.settings?.ownerPinHash;
    const archiveHash = db?.settings?.archivePasswordHash;
    
    let isMatch = false;
    if (ownerHash) {
      isMatch = await matchesSecret(pinInput, ownerHash);
    }
    if (!isMatch && archiveHash) {
      isMatch = await matchesSecret(pinInput, archiveHash);
    }

    if (isMatch) {
      setIsUnlocked(true);
      setIsLockModalOpen(false);
      setPinInput('');
      setPinError('');
      showToast(isMarathi ? 'मागील महिन्यांचे रेकॉर्ड अनलॉक झाले!' : 'Past months unlocked!', 'success');
    } else {
      setPinError(isMarathi ? 'चुकीचा PIN / पासवर्ड!' : 'Incorrect PIN / Passcode!');
      setPinInput('');
    }
  }, [pinInput, db?.settings, isMarathi, showToast]);

  return {
    isUnlocked,
    setIsUnlocked,
    isLockModalOpen,
    setIsLockModalOpen,
    selectedMonth,
    setSelectedMonth,
    handleSelectMonth,
    pinInput,
    setPinInput,
    pinError,
    setPinError,
    handleUnlockSubmit,
    availableMonths,
    currentMonthStr
  };
}
