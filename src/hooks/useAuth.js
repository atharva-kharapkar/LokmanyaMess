import { useState, useCallback, useEffect } from 'react';
import { matchesSecret, matchesArchiveSecret } from '../utils/helpers';

export function useAuth(db) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinPad, setShowPinPad] = useState(true);
  const [role, setRole] = useState(null);
  
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [settingsPinInput, setSettingsPinInput] = useState('');
  
  const [isArchiveUnlocked, setIsArchiveUnlocked] = useState(false);
  const [archivePinInput, setArchivePinInput] = useState('');
  
  const [isCollectionArchiveUnlocked, setIsCollectionArchiveUnlocked] = useState(false);
  const [collectionArchivePinInput, setCollectionArchivePinInput] = useState('');
  
  const [isExpenseArchiveUnlocked, setIsExpenseArchiveUnlocked] = useState(false);
  const [expenseArchivePinInput, setExpenseArchivePinInput] = useState('');

  const handleLogin = useCallback(async (pin, expectedOwnerHash) => {
    // Hardcoded dev bypass
    if (pin === '000000') {
      setIsLoggedIn(true);
      setRole('owner');
      return true;
    }
    
    // Check owner
    const isOwner = await matchesSecret(pin, expectedOwnerHash);
    if (isOwner) {
      setIsLoggedIn(true);
      setRole('owner');
      return true;
    }
    
    // Check branch pins
    if (db?.settings) {
      const isBranch1 = await matchesSecret(pin, db.settings.branch1PinHash);
      if (isBranch1) {
        setIsLoggedIn(true);
        setRole('branch1');
        return true;
      }
      
      const isBranch2 = await matchesSecret(pin, db.settings.branch2PinHash);
      if (isBranch2) {
        setIsLoggedIn(true);
        setRole('branch2');
        return true;
      }
    }
    
    return false;
  }, [db?.settings]);

  const verifyArchiveAccess = useCallback(async (pin, expectedArchiveHash) => {
    return await matchesArchiveSecret(pin, expectedArchiveHash);
  }, []);

  return {
    isLoggedIn, setIsLoggedIn,
    pinInput, setPinInput,
    pinError, setPinError,
    showPinPad, setShowPinPad,
    role, setRole,
    isSettingsUnlocked, setIsSettingsUnlocked,
    settingsPinInput, setSettingsPinInput,
    isArchiveUnlocked, setIsArchiveUnlocked,
    archivePinInput, setArchivePinInput,
    isCollectionArchiveUnlocked, setIsCollectionArchiveUnlocked,
    collectionArchivePinInput, setCollectionArchivePinInput,
    isExpenseArchiveUnlocked, setIsExpenseArchiveUnlocked,
    expenseArchivePinInput, setExpenseArchivePinInput,
    handleLogin,
    verifyArchiveAccess
  };
}
