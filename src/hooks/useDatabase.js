import { useState, useCallback, useRef, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc, onSnapshot } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { secureSettings, sanitizeImportedDbHelper } from '../utils/helpers';

const isElectron = typeof window !== 'undefined' && window.electronAPI;
const isCloudSyncAvailable = Boolean(firestoreDb);

export function useDatabase(showToast, applyLoadedSettings) {
  const [db, setDb] = useState({
    customers: [],
    employees: [],
    transactions: [],
    salaries: [],
    expenses: [],
    archives: [],
    settings: {
      lang: 'en',
      upiId: '',
      paymentPhone: '',
      whatsappDuesTemplate: '',
      ownerPinHash: '',
      messName: 'Lokmanya Mess',
      ownerName: 'Mess Owner',
      ownerAddress: '',
      whatsappMode: 'desktop'
    }
  });

  const [saveHealth, setSaveHealth] = useState({
    status: 'idle',
    pending: 0,
    lastSavedAt: '',
    lastLocalSaveAt: '',
    lastCloudSyncAt: '',
    lastError: ''
  });

  const saveQueueRef = useRef(Promise.resolve());
  const savePendingCountRef = useRef(0);
  const lastSaveRequestRef = useRef(null);
  const dbRef = useRef(db);

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  useEffect(() => {
    async function loadInitialDb() {
      try {
        let loadedDb = null;
        if (isElectron && window.electronAPI && window.electronAPI.readDatabase) {
          const res = await window.electronAPI.readDatabase();
          if (res && typeof res === 'object') {
            loadedDb = res;
          }
        }
        if (!loadedDb) {
          const localStr = localStorage.getItem('lokmanya_db');
          if (localStr) {
            loadedDb = JSON.parse(localStr);
          }
        }
        if (loadedDb && typeof loadedDb === 'object') {
          const sanitized = sanitizeImportedDbHelper(loadedDb);
          setDb(sanitized);
          if (typeof applyLoadedSettings === 'function') {
            applyLoadedSettings(sanitized.settings || {});
          }
        }
      } catch (err) {
        console.error('Failed to load initial database:', err);
      }
    }
    loadInitialDb();
  }, [applyLoadedSettings]);

  const persistDb = useCallback(async (nextDb) => {
    const securedSettings = await secureSettings(nextDb.settings || {});
    return { ...nextDb, settings: securedSettings };
  }, []);

  const writeLocalBackup = useCallback(async (sanitizedDb) => {
    try {
      localStorage.setItem('lokmanya_db', JSON.stringify(sanitizedDb));
    } catch (e) {
      console.warn('Failed to write to localStorage backup:', e);
    }

    if (isElectron) {
      const writeResult = await window.electronAPI.writeDatabase(sanitizedDb);
      if (!writeResult || !writeResult.success) {
        throw new Error(writeResult?.error || 'Local backup write failed.');
      }
      const persistedDb = await window.electronAPI.readDatabase();
      if (!persistedDb) {
        console.warn('Read verification warning');
      }
    }
  }, []);

  // Real-time Automatic Multi-Laptop Sync Listener (Granular Document-Level)
  useEffect(() => {
    if (!isCloudSyncAvailable) return;

    const collectionsToListen = [
      { cloudName: 'desktop_customers', localKey: 'customers' },
      { cloudName: 'desktop_transactions', localKey: 'transactions' },
      { cloudName: 'desktop_expenses', localKey: 'expenses' },
      { cloudName: 'desktop_employees', localKey: 'employees' },
      { cloudName: 'desktop_salaries', localKey: 'salaries' },
      { cloudName: 'desktop_archives', localKey: 'archives' }
    ];

    const unsubs = [];

    collectionsToListen.forEach(({ cloudName, localKey }) => {
      const unsub = onSnapshot(collection(firestoreDb, cloudName), (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) {
          // Ignore local echo on write-originating laptop
          return;
        }

        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });

        setDb((prevDb) => {
          if (JSON.stringify(prevDb[localKey] || []) === JSON.stringify(items)) {
            return prevDb;
          }

          const nextDb = {
            ...prevDb,
            [localKey]: items
          };
          dbRef.current = nextDb;

          // Silently sync updated database to local hard disk database.json
          writeLocalBackup(nextDb).catch((err) => {
            console.warn('Failed to write local backup during live sync:', err);
          });

          return nextDb;
        });

        setSaveHealth((prev) => ({
          ...prev,
          lastCloudSyncAt: new Date().toISOString()
        }));
      }, (err) => {
        console.warn(`Live sync listener warning for ${cloudName}:`, err);
      });

      unsubs.push(unsub);
    });

    const unsubSettings = onSnapshot(doc(firestoreDb, 'desktop_config', 'app_settings'), (docSnap) => {
      if (docSnap.metadata.hasPendingWrites) return;
      if (docSnap.exists()) {
        const cloudSettings = docSnap.data();
        setDb((prevDb) => {
          if (JSON.stringify(prevDb.settings) === JSON.stringify(cloudSettings)) {
            return prevDb;
          }
          const nextDb = {
            ...prevDb,
            settings: { ...prevDb.settings, ...cloudSettings }
          };
          dbRef.current = nextDb;
          writeLocalBackup(nextDb).catch(() => {});
          if (typeof applyLoadedSettings === 'function') {
            applyLoadedSettings(nextDb.settings);
          }
          return nextDb;
        });
      }
    }, (err) => {
      console.warn('Live sync listener warning for settings:', err);
    });
    unsubs.push(unsubSettings);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [writeLocalBackup, applyLoadedSettings]);

  const syncCollectionDiff = useCallback(async (collectionName, oldList = [], newList = [], forcePushAll = false) => {
    if (!isCloudSyncAvailable || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return;
    }

    if (!forcePushAll && JSON.stringify(oldList) === JSON.stringify(newList)) {
      return;
    }

    const oldMap = new Map((oldList || []).map((item) => [item.id, item]));
    const newMap = new Map((newList || []).map((item) => [item.id, item]));

    for (const item of (newList || [])) {
      const oldItem = oldMap.get(item.id);
      if (forcePushAll || !oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
        const cleanDoc = JSON.parse(JSON.stringify(item));
        await setDoc(doc(firestoreDb, collectionName, item.id), cleanDoc);
      }
    }

    if (!forcePushAll && oldList) {
      for (const item of oldList) {
        if (!newMap.has(item.id)) {
          await deleteDoc(doc(firestoreDb, collectionName, item.id));
        }
      }
    }
  }, []);

  const syncDbToCloud = useCallback(async (oldDb, sanitizedDb) => {
    const forcePushAll = arguments[2] || false;
    if (!isCloudSyncAvailable || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return false;
    }

    const prevDb = oldDb || { customers: [], transactions: [], employees: [], salaries: [], expenses: [], archives: [], settings: {} };

    if (forcePushAll || JSON.stringify(prevDb.settings) !== JSON.stringify(sanitizedDb.settings)) {
      if (sanitizedDb.settings) {
        const cleanSettings = JSON.parse(JSON.stringify(sanitizedDb.settings));
        await setDoc(doc(firestoreDb, 'desktop_config', 'app_settings'), cleanSettings);
      }
    }

    await syncCollectionDiff('desktop_customers', prevDb.customers || [], sanitizedDb.customers || [], forcePushAll);
    await syncCollectionDiff('desktop_transactions', prevDb.transactions || [], sanitizedDb.transactions || [], forcePushAll);
    await syncCollectionDiff('desktop_employees', prevDb.employees || [], sanitizedDb.employees || [], forcePushAll);
    await syncCollectionDiff('desktop_salaries', prevDb.salaries || [], sanitizedDb.salaries || [], forcePushAll);
    await syncCollectionDiff('desktop_expenses', prevDb.expenses || [], sanitizedDb.expenses || [], forcePushAll);
    await syncCollectionDiff('desktop_archives', prevDb.archives || [], sanitizedDb.archives || [], forcePushAll);
    return true;
  }, [syncCollectionDiff]);

  // Automatic Cloud Re-Sync as soon as Internet Connection is Restored
  useEffect(() => {
    const handleOnline = () => {
      if (isCloudSyncAvailable && dbRef.current) {
        syncDbToCloud(null, dbRef.current, true).then(() => {
          setSaveHealth((prev) => ({ ...prev, lastCloudSyncAt: new Date().toISOString() }));
        }).catch((err) => console.warn('Auto-sync on reconnect warning:', err));
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncDbToCloud]);

  const saveDb = useCallback(async (nextDbOrUpdater) => {
    savePendingCountRef.current += 1;
    setSaveHealth((prev) => ({ ...prev, pending: savePendingCountRef.current, status: 'saving' }));

    const promise = saveQueueRef.current.then(async () => {
      try {
        const oldDb = dbRef.current;
        let nextDb;
        if (typeof nextDbOrUpdater === 'function') {
          nextDb = nextDbOrUpdater(oldDb);
        } else {
          nextDb = nextDbOrUpdater;
        }

        const sanitizedDb = await persistDb(nextDb);
        dbRef.current = sanitizedDb;
        setDb(sanitizedDb);
        lastSaveRequestRef.current = sanitizedDb;

        // 1. ALWAYS write to local storage (Electron database.json & localStorage) FIRST & IMMEDIATELY!
        await writeLocalBackup(sanitizedDb);
        setSaveHealth((prev) => ({ ...prev, lastLocalSaveAt: new Date().toISOString() }));

        // 2. Non-blocking background cloud sync attempt (only when online)
        if (isCloudSyncAvailable && typeof navigator !== 'undefined' && navigator.onLine) {
          syncDbToCloud(oldDb, sanitizedDb).then((cloudSynced) => {
            if (cloudSynced) {
              setSaveHealth((prev) => ({ ...prev, lastCloudSyncAt: new Date().toISOString() }));
            }
          }).catch((cloudErr) => {
            console.warn("Offline or background cloud sync deferred:", cloudErr);
          });
        }

        savePendingCountRef.current = Math.max(0, savePendingCountRef.current - 1);
        setSaveHealth((prev) => ({
          ...prev,
          status: savePendingCountRef.current === 0 ? 'idle' : 'saving',
          pending: savePendingCountRef.current,
          lastSavedAt: new Date().toISOString(),
          lastError: ''
        }));
        
        return true;
      } catch (err) {
        console.error("Save operation failed:", err);
        savePendingCountRef.current = Math.max(0, savePendingCountRef.current - 1);
        setSaveHealth((prev) => ({
          ...prev,
          status: 'degraded',
          pending: savePendingCountRef.current,
          lastError: err.message
        }));
        return false;
      }
    });

    saveQueueRef.current = promise.catch(() => {});
    return promise;
  }, [persistDb, writeLocalBackup, syncDbToCloud]);

  const retryLastSave = useCallback(async () => {
    if (lastSaveRequestRef.current) {
      return saveDb(lastSaveRequestRef.current);
    }
  }, [saveDb]);

  const handleForceRestoreFromCloud = useCallback(async () => {
    if (!isCloudSyncAvailable) {
      alert(db.settings.lang === 'mr' 
        ? 'इंटरनेट किंवा क्लाउड कनेक्शन उपलब्ध नाही.' 
        : 'Cloud connection not available.');
      return;
    }

    try {
      showToast(db.settings.lang === 'mr' ? 'क्लाउडवरून डेटा लोड होत आहे...' : 'Restoring data from cloud...', 'info');

      const collectionsToSync = {
        'desktop_customers': 'customers',
        'desktop_transactions': 'transactions',
        'desktop_employees': 'employees',
        'desktop_salaries': 'salaries',
        'desktop_expenses': 'expenses',
        'desktop_archives': 'archives'
      };

      const restoredDb = {
        customers: [], transactions: [], employees: [], salaries: [], expenses: [], archives: [],
        settings: db.settings
      };

      const settingsDoc = await getDoc(doc(firestoreDb, 'desktop_config', 'app_settings'));
      if (settingsDoc.exists()) {
        restoredDb.settings = { ...db.settings, ...settingsDoc.data() };
      }

      for (const [cloudName, localName] of Object.entries(collectionsToSync)) {
        const querySnapshot = await getDocs(collection(firestoreDb, cloudName));
        querySnapshot.forEach((docSnap) => {
          restoredDb[localName].push({ id: docSnap.id, ...docSnap.data() });
        });
      }

      const finalDb = sanitizeImportedDbHelper(restoredDb);
      
      const proceed = window.confirm(
        db.settings.lang === 'mr'
          ? `क्लाउड रिस्टोर यशस्वी झाले. ${finalDb.customers.length} ग्राहक, ${finalDb.transactions.length} पेमेंट्स सापडले. तुम्ही तुमचा सध्याचा डेटा बदलू इच्छिता का?`
          : `Found ${finalDb.customers.length} customers and ${finalDb.transactions.length} transactions in Cloud. This will overwrite your current local data. Proceed?`
      );

      if (proceed) {
        setDb(finalDb);
        applyLoadedSettings(finalDb.settings);
        
        await writeLocalBackup(finalDb);
        
        showToast(
          db.settings.lang === 'mr' ? 'क्लाउड रिस्टोर यशस्वीरित्या पूर्ण झाले!' : 'Cloud restore completed successfully!', 
          'success'
        );
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('Restore cancelled', 'info');
      }
      
    } catch (error) {
      console.error("Cloud restore failed:", error);
      alert('Cloud restore failed: ' + error.message);
    }
  }, [db.settings, applyLoadedSettings, writeLocalBackup, showToast]);

  return {
    db,
    setDb,
    saveDb,
    saveHealth,
    retryLastSave,
    handleForceRestoreFromCloud
  };
}
