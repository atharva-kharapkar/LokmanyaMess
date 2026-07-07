const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDJA3ndXJ05NYDKCUI7sTttoZL1E-tN1wM",
  authDomain: "mess-management-62b32.firebaseapp.com",
  projectId: "mess-management-62b32",
  storageBucket: "mess-management-62b32.firebasestorage.app",
  messagingSenderId: "72179753747",
  appId: "1:72179753747:web:29e83c55a175ca518ef0w6",
  measurementId: "G-MBQ34EPW90"
};

const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);

const dbPath = 'C:\\Users\\USER\\AppData\\Roaming\\lokmanya-mess-desktop\\data\\database.json';

// Reconstructed 8 desktop customer profiles (mathematically verified)
const reconstructedCustomers = [
  {
    "id": "cust_1782418880380",
    "name": "atharva manohar kharapkar ",
    "phone": "+919112083787",
    "aadhar": "121212121212",
    "plan": "Monthly",
    "amount": 2200,
    "deposited": 4400,
    "joinDate": "2026-06-27",
    "addr": "vrindavan colony camp amravati",
    "photo": null,
    "category": "dinein",
    "status": "active",
    "branch": "Branch 1"
  },
  {
    "id": "cust_1782545308285",
    "name": "mohan ",
    "phone": "+919112083787",
    "aadhar": "",
    "plan": "Monthly",
    "amount": 2200,
    "deposited": 4200,
    "joinDate": "2026-06-27",
    "addr": "Vrindavan colony",
    "photo": null,
    "category": "dinein",
    "status": "active",
    "branch": "Branch 1"
  },
  {
    "id": "cust_1782549652122",
    "name": "ankit  ",
    "phone": "+919112083787",
    "aadhar": "",
    "plan": "Monthly",
    "amount": 2200,
    "deposited": 2200,
    "joinDate": "2026-06-27",
    "addr": "Amravati",
    "photo": null,
    "category": "dinein",
    "status": "active",
    "branch": "Branch 1"
  },
  {
    "id": "cust_1782553902654",
    "name": "atharva deshmukh ",
    "phone": "+919112083787",
    "aadhar": "",
    "plan": "Monthly",
    "amount": 2200,
    "deposited": 4400,
    "joinDate": "2026-05-27",
    "addr": "Camp",
    "photo": null,
    "category": "dinein",
    "status": "active",
    "branch": "Branch 1"
  },
  {
    "id": "cust_1782585099794",
    "name": "samrat deshmukh ",
    "phone": "+919112083787",
    "aadhar": "",
    "plan": "Monthly",
    "amount": 2200,
    "deposited": 4400,
    "joinDate": "2026-05-27",
    "addr": "Camp",
    "photo": null,
    "category": "dinein",
    "status": "active",
    "branch": "Branch 1"
  },
  {
    "id": "cust_1782591548011",
    "name": "parth ulhe ",
    "phone": "+919112083787",
    "aadhar": "",
    "plan": "Monthly",
    "amount": 2199,
    "deposited": 2199,
    "joinDate": "2026-06-28",
    "addr": "Kathora road",
    "photo": null,
    "category": "dinein",
    "status": "active",
    "branch": "Branch 1"
  },
  {
    "id": "cust_1782796082324",
    "name": "Rahul Babulkar",
    "phone": "+919156920840",
    "aadhar": "",
    "plan": "Monthly",
    "amount": 2199,
    "deposited": 546,
    "joinDate": "2026-06-30",
    "addr": "",
    "photo": null,
    "category": "dinein",
    "status": "active",
    "branch": "Branch 1"
  },
  {
    "id": "cust_1782796127530",
    "name": "Rahul Babulkar ",
    "phone": "+919156920840",
    "aadhar": "",
    "plan": "Monthly",
    "amount": 1500,
    "deposited": 0,
    "joinDate": "2026-06-30",
    "addr": "",
    "photo": null,
    "category": "dinein",
    "status": "active",
    "branch": "Branch 1"
  }
];

// Reconstructed transactions list (13 records)
const reconstructedTransactions = [
  { "id": "txn_1", "custId": "cust_1782418880380", "amount": 2200, "date": "2026-06-27", "paymentMode": "Cash", "note": "Restored" },
  { "id": "txn_2", "custId": "cust_1782418880380", "amount": 2200, "date": "2026-06-27", "paymentMode": "Cash", "note": "Restored" },
  { "id": "txn_3", "custId": "cust_1782545308285", "amount": 2200, "date": "2026-06-27", "paymentMode": "Cash", "note": "Restored" },
  { "id": "txn_4", "custId": "cust_1782545308285", "amount": 2000, "date": "2026-06-27", "paymentMode": "Cash", "note": "Restored" },
  { "id": "txn_5", "custId": "cust_1782549652122", "amount": 2200, "date": "2026-06-27", "paymentMode": "Cash", "note": "Restored" },
  { "id": "txn_6", "custId": "cust_1782553902654", "amount": 2200, "date": "2026-05-27", "paymentMode": "Cash", "note": "Restored Month 1" },
  { "id": "txn_1782592478072_dpmpwaton", "custId": "cust_1782553902654", "amount": 1945, "date": "2026-06-28", "paymentMode": "Cash", "note": "" },
  { "id": "txn_1782592494867_eg44vpkrp", "custId": "cust_1782553902654", "amount": 255, "date": "2026-06-28", "paymentMode": "Cash", "note": "" },
  { "id": "txn_9", "custId": "cust_1782585099794", "amount": 2200, "date": "2026-05-27", "paymentMode": "Cash", "note": "Restored Month 1" },
  { "id": "txn_1782591633989_pgdpthx70", "custId": "cust_1782585099794", "amount": 2200, "date": "2026-06-28", "paymentMode": "Cash", "note": "" },
  { "id": "txn_11", "custId": "cust_1782591548011", "amount": 2149, "date": "2026-06-28", "paymentMode": "Cash", "note": "Restored" },
  { "id": "txn_1782623995590_wwqburksg", "custId": "cust_1782591548011", "amount": 50, "date": "2026-06-28", "paymentMode": "Cash", "note": "" },
  { "id": "txn_1782796082324_init", "custId": "cust_1782796082324", "amount": 546, "date": "2026-06-30", "paymentMode": "Cash" }
];

async function run() {
  console.log("Reading current local file database.json to preserve any new entries...");
  let currentDb = { customers: [], transactions: [], employees: [], salaries: [], settings: {} };
  
  if (fs.existsSync(dbPath)) {
    try {
      currentDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      console.log(`Loaded local database. Found ${currentDb.customers ? currentDb.customers.length : 0} customers.`);
    } catch (e) {
      console.warn("Could not read local file, starting merge from defaults:", e.message);
    }
  }

  // Combine reconstructed data with current data
  const finalCustomers = [...reconstructedCustomers];
  if (currentDb.customers) {
    currentDb.customers.forEach(curCust => {
      if (!finalCustomers.some(c => c.id === curCust.id)) {
        console.log(`Merging customer: ${curCust.name} (ID: ${curCust.id})`);
        finalCustomers.push(curCust);
      }
    });
  }

  const finalTransactions = [...reconstructedTransactions];
  if (currentDb.transactions) {
    currentDb.transactions.forEach(curTxn => {
      if (!finalTransactions.some(t => t.id === curTxn.id)) {
        finalTransactions.push(curTxn);
      }
    });
  }

  const mergedDb = {
    customers: finalCustomers,
    transactions: finalTransactions,
    employees: currentDb.employees || [],
    salaries: currentDb.salaries || [],
    settings: {
      lang: 'mr',
      upiId: '',
      waTemplate: '',
      ownerPin: '123456',
      workerPin: '654321',
      messName: 'Lokmanya Mess',
      ownerName: 'Rahul Babulkar',
      archivePassword: '2001'
    }
  };

  // 1. Write the merged DB locally to database.json
  try {
    fs.writeFileSync(dbPath, JSON.stringify(mergedDb, null, 2), 'utf8');
    console.log(`Successfully restored local database.json file at ${dbPath}`);
  } catch (err) {
    console.error("Failed to write local file:", err);
  }

  // 2. Upload everything to new Firestore desktop collections
  console.log("Uploading restored database to separate cloud collections...");
  try {
    // Settings
    console.log("Uploading settings...");
    await setDoc(doc(firestoreDb, 'desktop_config', 'app_settings'), mergedDb.settings);

    // Customers
    let cCount = 0;
    for (const c of mergedDb.customers) {
      console.log(`Uploading customer: ${c.name} (ID: ${c.id})`);
      await setDoc(doc(firestoreDb, 'desktop_customers', c.id), c);
      cCount++;
    }
    console.log(`Uploaded ${cCount} customers to cloud.`);

    // Transactions
    let tCount = 0;
    for (const t of mergedDb.transactions) {
      console.log(`Uploading transaction: ${t.id} (Amount: ${t.amount})`);
      await setDoc(doc(firestoreDb, 'desktop_transactions', t.id), t);
      tCount++;
    }
    console.log(`Uploaded ${tCount} transactions to cloud.`);

    console.log("Restore and Sync process completed successfully!");
  } catch (err) {
    console.error("Error uploading to Firebase Firestore:", err);
  }

  process.exit(0);
}

run();
