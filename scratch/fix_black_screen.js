const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Locate the entire mount useEffect from line 378 to line 496, and replace it
const targetMountBlock = `  // Load database and setup Firebase real-time listeners on mount
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

const replacementMountBlock = `  // Load database and setup Firebase real-time listeners on mount
  useEffect(() => {
    // 1. Setup real-time listeners immediately for instant UI load (offline-first)
    const unsubCustomers = onSnapshot(collection(firestoreDb, 'customers'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.customers) === JSON.stringify(list)) return prev;
        return { ...prev, customers: list };
      });
    });

    const unsubTxns = onSnapshot(collection(firestoreDb, 'transactions'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.transactions) === JSON.stringify(list)) return prev;
        return { ...prev, transactions: list };
      });
    });

    const unsubEmployees = onSnapshot(collection(firestoreDb, 'employees'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.employees) === JSON.stringify(list)) return prev;
        return { ...prev, employees: list };
      });
    });

    const unsubSalaries = onSnapshot(collection(firestoreDb, 'salaries'), (snapshot) => {
      const list = snapshot.docs.map(d => d.data());
      setDb(prev => {
        if (JSON.stringify(prev.salaries) === JSON.stringify(list)) return prev;
        return { ...prev, salaries: list };
      });
    });

    const unsubSettings = onSnapshot(doc(firestoreDb, 'config', 'app_settings'), (snapshot) => {
      if (snapshot.exists()) {
        const settingsData = snapshot.data();
        setDb(prev => {
          if (JSON.stringify(prev.settings) === JSON.stringify(settingsData)) return prev;
          return { ...prev, settings: settingsData };
        });
        setNewPinInput(settingsData.ownerPin || '123456');
        setMessNameInput(settingsData.messName || 'Lokmanya Mess');
        setOwnerNameInput(settingsData.ownerName || 'Mess Owner');
      }
    });

    // 2. Perform local-to-cloud data migration asynchronously in the background (only if online & not done yet)
    async function migrateLocalToCloudIfNeeded() {
      if (!navigator.onLine) {
        console.log('Device is offline. Skipping cloud migration checks.');
        return;
      }
      if (localStorage.getItem('lokmanya_migration_done') === 'true') {
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
          const q = query(collection(firestoreDb, 'customers'), limit(1));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            console.log('Cloud database is empty. Migrating local records to cloud in the background...');
            // Migrate settings
            if (localData.settings) {
              await setDoc(doc(firestoreDb, 'config', 'app_settings'), localData.settings);
            }
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
            console.log('Migration completed successfully in background!');
          }
        }
        localStorage.setItem('lokmanya_migration_done', 'true');
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
    };
  }, []);`;

if (content.includes(targetMountBlock)) {
  content = content.replace(targetMountBlock, replacementMountBlock);
  console.log('Successfully optimized useEffect mounting block for fast, offline-first execution!');
} else {
  console.error('Error: Could not locate the target mount useEffect block in App.jsx');
}

// 2. Replace openAddCust and openEditCust to correctly handle short-term day/meal selections
const targetEditHandlers = `  const openAddCust = () => {
    setEditCustId(null);
    setCustForm({ name: '', phone: '', aadhar: '', plan: 'Monthly', amount: '1500', deposited: '0', joinDate: todayStr(), addr: '', photo: '' });
    setCustModal(true);
  };

  const openEditCust = (c) => {
    setEditCustId(c.id);
    setCustForm({ name: c.name, phone: c.phone, aadhar: c.aadhar || '', plan: c.plan, amount: String(c.amount), deposited: String(c.deposited || 0), joinDate: c.joinDate, addr: c.addr || '', photo: c.photo || '' });
    setCustModal(true);
  };`;

const replacementEditHandlers = `  const openAddCust = () => {
    setEditCustId(null);
    if (currentTab === 'shortterm') {
      setShortTermDays('10');
      setShortTermMeals('2');
      setCustForm({ name: '', phone: '', aadhar: '', plan: 'Short-Term', amount: String(10 * 2 * 80), deposited: '0', joinDate: todayStr(), addr: '', photo: '' });
    } else {
      setCustForm({ name: '', phone: '', aadhar: '', plan: 'Monthly', amount: '1500', deposited: '0', joinDate: todayStr(), addr: '', photo: '' });
    }
    setCustModal(true);
  };

  const openEditCust = (c) => {
    setEditCustId(c.id);
    if (c.category === 'shortterm') {
      setShortTermDays(String(c.shortTermDays || '10'));
      setShortTermMeals(String(c.shortTermMeals || '2'));
    }
    setCustForm({ name: c.name, phone: c.phone, aadhar: c.aadhar || '', plan: c.plan, amount: String(c.amount), deposited: String(c.deposited || 0), joinDate: c.joinDate, addr: c.addr || '', photo: c.photo || '' });
    setCustModal(true);
  };`;

if (content.includes(targetEditHandlers)) {
  content = content.replace(targetEditHandlers, replacementEditHandlers);
  console.log('Successfully parameterized customer form modals for Tiffin and Short-term categories!');
} else {
  console.error('Error: Could not locate openAddCust/openEditCust functions in App.jsx');
}

// 3. Skip archived customers on active dashboard stats
const dashboardStatsTarget = `    db.customers.forEach(c => {
      const status = computeStatus(c);`;

const dashboardStatsReplacement = `    db.customers.forEach(c => {
      if (c.status === 'old') return; // Skip archived customers on active dashboard
      const status = computeStatus(c);`;

if (content.includes(dashboardStatsTarget)) {
  content = content.replace(dashboardStatsTarget, dashboardStatsReplacement);
  console.log('Updated dashboard metrics calculations to skip archived customers!');
}

fs.writeFileSync(appFile, content, 'utf8');
console.log('Finished App.jsx modifications for black screen fix.');

