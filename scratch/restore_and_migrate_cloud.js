const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');

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
const db = getFirestore(app);

const TARGET_CUSTOMER_IDS = [
  "cust_1782418880380", // atharva manohar kharapkar
  "cust_1782545308285", // mohan
  "cust_1782549652122", // ankit
  "cust_1782553902654", // atharva deshmukh
  "cust_1782585099794", // samrat deshmukh
  "cust_1782591548011", // parth ulhe
  "cust_1782796082324", // Rahul Babulkar
  "cust_1782796127530"  // Rahul Babulkar
];

async function restore() {
  console.log("Connecting to Firebase...");
  try {
    // 1. Fetch from old 'customers' collection
    const oldSnap = await getDocs(collection(db, 'customers'));
    console.log(`Found ${oldSnap.size} total documents in old 'customers' collection.`);
    
    let migratedCount = 0;
    for (const d of oldSnap.docs) {
      const data = d.data();
      // Check if this document is one of the 8 desktop profiles
      if (TARGET_CUSTOMER_IDS.includes(d.id) || (data.name && TARGET_CUSTOMER_IDS.some(id => d.id === id))) {
        console.log(`Restoring customer: ${data.name} (ID: ${d.id}) to desktop_customers...`);
        // Write to new 'desktop_customers' collection
        await setDoc(doc(db, 'desktop_customers', d.id), {
          ...data,
          status: data.status || 'active',
          category: data.category || 'dinein',
          branch: data.branch || 'Branch 1'
        });
        migratedCount++;
      }
    }
    console.log(`Restored ${migratedCount} customers to desktop_customers collection!`);

    // 2. Fetch and restore matching transactions
    const oldTxnsSnap = await getDocs(collection(db, 'transactions'));
    console.log(`Found ${oldTxnsSnap.size} total documents in old 'transactions' collection.`);
    
    let migratedTxnsCount = 0;
    for (const d of oldTxnsSnap.docs) {
      const data = d.data();
      if (TARGET_CUSTOMER_IDS.includes(data.custId)) {
        console.log(`Restoring transaction: ${data.id || d.id} (Amount: ${data.amount}) to desktop_transactions...`);
        await setDoc(doc(db, 'desktop_transactions', data.id || d.id), data);
        migratedTxnsCount++;
      }
    }
    console.log(`Restored ${migratedTxnsCount} transactions to desktop_transactions collection!`);
    
  } catch (err) {
    console.error("Error during restore operation:", err);
  }
  process.exit(0);
}

restore();

