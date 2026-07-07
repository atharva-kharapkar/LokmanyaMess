const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "mess-management-62b32.firebaseapp.com",
  projectId: "mess-management-62b32",
  storageBucket: "mess-management-62b32.firebasestorage.app",
  messagingSenderId: "REDACTED",
  appId: "REDACTED",
  measurementId: "REDACTED"
};

const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\b2113483-ada5-4091-97b6-4808a89d2306\\.system_generated\\tasks\\task-5980.log';
const dbPath = 'C:\\Users\\USER\\AppData\\Roaming\\lokmanya-mess-desktop\\data\\database.json';

async function restore() {
  console.log("Starting data recovery process...");

  if (!fs.existsSync(logPath)) {
    console.error("Error: Log backup file not found!");
    process.exit(1);
  }

  // 1. Read and parse log database (historical)
  let backupDb = null;
  try {
    const rawContent = fs.readFileSync(logPath, 'utf8');
    backupDb = JSON.parse(rawContent);
    console.log(`Parsed backup log file. Found:`);
    console.log(`- Customers: ${backupDb.customers ? backupDb.customers.length : 0}`);
    console.log(`- Transactions: ${backupDb.transactions ? backupDb.transactions.length : 0}`);
    console.log(`- Employees: ${backupDb.employees ? backupDb.employees.length : 0}`);
    console.log(`- Salaries: ${backupDb.salaries ? backupDb.salaries.length : 0}`);
  } catch (err) {
    console.error("Error parsing backup log JSON:", err);
    process.exit(1);
  }

  // 2. Read current database (to get the customer added today)
  let currentDb = { customers: [], transactions: [], employees: [], salaries: [], settings: {} };
  if (fs.existsSync(dbPath)) {
    try {
      const rawCurrent = fs.readFileSync(dbPath, 'utf8');
      currentDb = JSON.parse(rawCurrent);
      console.log(`Read current database. Found ${currentDb.customers ? currentDb.customers.length : 0} customers.`);
    } catch (err) {
      console.warn("Could not read current database, starting fresh merge:", err.message);
    }
  }

  // 3. Merge databases
  const mergedDb = {
    customers: backupDb.customers || [],
    transactions: backupDb.transactions || [],
    employees: backupDb.employees || [],
    salaries: backupDb.salaries || [],
    settings: backupDb.settings || currentDb.settings || {}
  };

  // Add any customer from currentDb that is not in backupDb (e.g. atharv kharapkar)
  if (currentDb.customers) {
    for (const curCust of currentDb.customers) {
      if (!mergedDb.customers.some(c => c.id === curCust.id)) {
        console.log(`Merging newly created customer: ${curCust.name} (ID: ${curCust.id})`);
        mergedDb.customers.push(curCust);
      }
    }
  }
  if (currentDb.transactions) {
    for (const curTxn of currentDb.transactions) {
      if (!mergedDb.transactions.some(t => t.id === curTxn.id)) {
        mergedDb.transactions.push(curTxn);
      }
    }
  }

  // Ensure default passcode fallback to 2001
  if (mergedDb.settings) {
    if (!mergedDb.settings.archivePassword) {
      mergedDb.settings.archivePassword = '2001';
    }
  }

  // 4. Save to local database.json file
  try {
    fs.writeFileSync(dbPath, JSON.stringify(mergedDb, null, 2), 'utf8');
    console.log(`Successfully wrote merged database to ${dbPath}`);
  } catch (err) {
    console.error("Error writing to database.json file:", err);
  }

  // 5. Upload everything to the new desktop Firestore collections
  console.log("Uploading restored database to separate cloud collections...");
  try {
    // 5a. Upload settings
    if (mergedDb.settings) {
      console.log("Uploading settings...");
      await setDoc(doc(firestoreDb, 'desktop_config', 'app_settings'), mergedDb.settings);
    }

    // 5b. Upload customers
    let custCount = 0;
    for (const c of mergedDb.customers) {
      console.log(`Uploading customer: ${c.name} (ID: ${c.id})`);
      await setDoc(doc(firestoreDb, 'desktop_customers', c.id), c);
      custCount++;
    }
    console.log(`Uploaded ${custCount} customers to cloud.`);

    // 5c. Upload transactions
    let txnCount = 0;
    for (const t of mergedDb.transactions) {
      console.log(`Uploading transaction: ${t.id} (Amount: ${t.amount})`);
      await setDoc(doc(firestoreDb, 'desktop_transactions', t.id), t);
      txnCount++;
    }
    console.log(`Uploaded ${txnCount} transactions to cloud.`);

    // 5d. Upload employees
    let empCount = 0;
    for (const emp of mergedDb.employees) {
      console.log(`Uploading employee: ${emp.name} (ID: ${emp.id})`);
      await setDoc(doc(firestoreDb, 'desktop_employees', emp.id), emp);
      empCount++;
    }
    console.log(`Uploaded ${empCount} employees to cloud.`);

    // 5e. Upload salaries
    let salCount = 0;
    for (const sal of mergedDb.salaries) {
      console.log(`Uploading salary record: ${sal.id}`);
      await setDoc(doc(firestoreDb, 'desktop_salaries', sal.id), sal);
      salCount++;
    }
    console.log(`Uploaded ${salCount} salaries to cloud.`);

    console.log("Data recovery and sync upload completed successfully!");
  } catch (err) {
    console.error("Error uploading to Firebase Firestore:", err);
  }

  process.exit(0);
}

restore();

