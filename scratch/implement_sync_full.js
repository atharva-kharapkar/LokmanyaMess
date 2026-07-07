const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Add Firestore imports at the top of src/App.jsx
const importsTarget = `import {
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
  EyeOff
} from 'lucide-react';`;

const importsReplacement = `import {
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
  EyeOff
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, query, limit } from 'firebase/firestore';
import { db as firestoreDb } from './firebase';`;

if (content.includes(importsTarget) && !content.includes("from 'firebase/firestore'")) {
  content = content.replace(importsTarget, importsReplacement);
  console.log('Successfully added Firebase Firestore imports!');
}

// 2. Locate the database mount useEffect and replace it with Firebase listeners & migration logic
const initDbTarget = `  // Load database on mount
  useEffect(() => {
    async function initDb() {
      let data = null;
      if (isElectron) {
        data = await window.electronAPI.readDatabase();
      } else {
        const local = localStorage.getItem('lokmanya_db');
        if (local) data = JSON.parse(local);
      }
      if (data) {
        setDb(data);
        setNewPinInput(data.settings?.ownerPin || '123456');
        setMessNameInput(data.settings?.messName || 'Lokmanya Mess');
        setOwnerNameInput(data.settings?.ownerName || 'Mess Owner');
      }
    }
    initDb();
  }, []);`;

const initDbReplacement = `  // Load database and setup Firebase real-time listeners on mount
  useEffect(() => {
    async function migrateLocalToCloudIfNeeded() {
      try {
        // Read local database
        let localData = null;
        if (isElectron) {
          localData = await window.electronAPI.readDatabase();
        } else {
          const local = localStorage.getItem('lokmanya_db');
          if (local) localData = JSON.parse(local);
        }

        if (localData && localData.customers && localData.customers.length > 0) {
          // Check if Cloud Database has any customers
          const q = query(collection(firestoreDb, 'customers'), limit(1));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            console.log('Cloud database is empty. Performing automatic data migration...');
            
            // Migrate customers
            for (const c of localData.customers) {
              await setDoc(doc(firestoreDb, 'customers', c.id), c);
            }
            // Migrate transactions
            if (localData.transactions) {
              for (const t of localData.transactions) {
                await setDoc(doc(firestoreDb, 'transactions', t.id), t);
              }
            }
            // Migrate employees
            if (localData.employees) {
              for (const emp of localData.employees) {
                await setDoc(doc(firestoreDb, 'employees', emp.id), emp);
              }
            }
            // Migrate salaries
            if (localData.salaries) {
              for (const sal of localData.salaries) {
                await setDoc(doc(firestoreDb, 'salaries', sal.id), sal);
              }
            }
            // Migrate settings
            if (localData.settings) {
              await setDoc(doc(firestoreDb, 'config', 'app_settings'), localData.settings);
            }
            console.log('Migration completed successfully!');
          }
        }
      } catch (err) {
        console.error('Error during local-to-cloud migration:', err);
      }
    }

    // Run migration checks first
    migrateLocalToCloudIfNeeded().then(() => {
      // 1. Listen to customers
      onSnapshot(collection(firestoreDb, 'customers'), (snapshot) => {
        const list = snapshot.docs.map(d => d.data());
        setDb(prev => {
          if (JSON.stringify(prev.customers) === JSON.stringify(list)) return prev;
          // Keep a local file backup updated
          const updated = { ...prev, customers: list };
          if (isElectron) window.electronAPI.writeDatabase(updated);
          return updated;
        });
      });

      // 2. Listen to transactions
      onSnapshot(collection(firestoreDb, 'transactions'), (snapshot) => {
        const list = snapshot.docs.map(d => d.data());
        setDb(prev => {
          if (JSON.stringify(prev.transactions) === JSON.stringify(list)) return prev;
          const updated = { ...prev, transactions: list };
          if (isElectron) window.electronAPI.writeDatabase(updated);
          return updated;
        });
      });

      // 3. Listen to employees
      onSnapshot(collection(firestoreDb, 'employees'), (snapshot) => {
        const list = snapshot.docs.map(d => d.data());
        setDb(prev => {
          if (JSON.stringify(prev.employees) === JSON.stringify(list)) return prev;
          const updated = { ...prev, employees: list };
          if (isElectron) window.electronAPI.writeDatabase(updated);
          return updated;
        });
      });

      // 4. Listen to salaries
      onSnapshot(collection(firestoreDb, 'salaries'), (snapshot) => {
        const list = snapshot.docs.map(d => d.data());
        setDb(prev => {
          if (JSON.stringify(prev.salaries) === JSON.stringify(list)) return prev;
          const updated = { ...prev, salaries: list };
          if (isElectron) window.electronAPI.writeDatabase(updated);
          return updated;
        });
      });

      // 5. Listen to settings
      onSnapshot(doc(firestoreDb, 'config', 'app_settings'), (snapshot) => {
        if (snapshot.exists()) {
          const settingsData = snapshot.data();
          setDb(prev => {
            if (JSON.stringify(prev.settings) === JSON.stringify(settingsData)) return prev;
            const updated = { ...prev, settings: settingsData };
            if (isElectron) window.electronAPI.writeDatabase(updated);
            return updated;
          });
          setNewPinInput(settingsData.ownerPin || '123456');
          setMessNameInput(settingsData.messName || 'Lokmanya Mess');
          setOwnerNameInput(settingsData.ownerName || 'Mess Owner');
        }
      });
    });
  }, []);`;

if (content.includes(initDbTarget)) {
  content = content.replace(initDbTarget, initDbReplacement);
  console.log('Replaced local initDb with Firebase real-time listeners and migration!');
} else {
  // Line-ending agnostic regex replacement for initDb
  const regex = /  \/\/ Load database on mount\r?\n\s*useEffect\(\(\) => \{\r?\n\s*async function initDb\(\) \{\r?\n[\s\S]*?\}\r?\n\s*initDb\(\);\r?\n\s*\}, \[\]\);/;
  if (regex.test(content)) {
    content = content.replace(regex, initDbReplacement);
    console.log('Replaced local initDb with Firebase via regex!');
  } else {
    console.error('Failed to locate initDb block in App.jsx');
  }
}

// 3. Rewrite saveDb to act as a middleware to write changes to Firestore collections
const saveDbTarget = `  const saveDb = async (newDb) => {
    setDb(newDb);
    if (isElectron) {
      await window.electronAPI.writeDatabase(newDb);
    } else {
      localStorage.setItem('lokmanya_db', JSON.stringify(newDb));
    }
  };`;

const saveDbReplacement = `  const saveDb = async (newDb) => {
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
        await setDoc(doc(firestoreDb, 'config', 'app_settings'), newDb.settings);
      }

      // Sync customers array
      if (JSON.stringify(oldDb.customers) !== JSON.stringify(newDb.customers)) {
        const oldMap = new Map(oldDb.customers.map(c => [c.id, c]));
        const newMap = new Map(newDb.customers.map(c => [c.id, c]));
        // Add or Update
        for (const c of newDb.customers) {
          const oldC = oldMap.get(c.id);
          if (!oldC || JSON.stringify(oldC) !== JSON.stringify(c)) {
            await setDoc(doc(firestoreDb, 'customers', c.id), c);
          }
        }
        // Delete
        for (const c of oldDb.customers) {
          if (!newMap.has(c.id)) {
            await deleteDoc(doc(firestoreDb, 'customers', c.id));
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
            await setDoc(doc(firestoreDb, 'transactions', t.id), t);
          }
        }
        // Delete
        for (const t of oldDb.transactions) {
          if (!newMap.has(t.id)) {
            await deleteDoc(doc(firestoreDb, 'transactions', t.id));
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
            await setDoc(doc(firestoreDb, 'employees', e.id), e);
          }
        }
        // Delete
        for (const e of oldDb.employees) {
          if (!newMap.has(e.id)) {
            await deleteDoc(doc(firestoreDb, 'employees', e.id));
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
            await setDoc(doc(firestoreDb, 'salaries', s.id), s);
          }
        }
        // Delete
        for (const s of oldDb.salaries) {
          if (!newMap.has(s.id)) {
            await deleteDoc(doc(firestoreDb, 'salaries', s.id));
          }
        }
      }
    } catch (err) {
      console.error('Error syncing changes to Firebase Firestore:', err);
    }
  };`;

if (content.includes(saveDbTarget)) {
  content = content.replace(saveDbTarget, saveDbReplacement);
  console.log('Replaced saveDb with Firebase collection sync middleware!');
} else {
  const regex = /  const saveDb = async \(newDb\) => \{\r?\n\s*setDb\(newDb\);\r?\n[\s\S]*?\r?\n  \};/;
  if (regex.test(content)) {
    content = content.replace(regex, saveDbReplacement);
    console.log('Replaced saveDb with Firebase middleware via regex!');
  } else {
    console.error('Failed to locate saveDb block in App.jsx');
  }
}

fs.writeFileSync(appFile, content, 'utf8');
console.log('Finished updating App.jsx for Firebase sync');
