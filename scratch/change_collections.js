const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// Replace standard collection references with desktop_ prefixed collections
content = content.replaceAll("collection(firestoreDb, 'customers')", "collection(firestoreDb, 'desktop_customers')");
content = content.replaceAll("collection(firestoreDb, 'transactions')", "collection(firestoreDb, 'desktop_transactions')");
content = content.replaceAll("collection(firestoreDb, 'employees')", "collection(firestoreDb, 'desktop_employees')");
content = content.replaceAll("collection(firestoreDb, 'salaries')", "collection(firestoreDb, 'desktop_salaries')");
content = content.replaceAll("doc(firestoreDb, 'config', 'app_settings')", "doc(firestoreDb, 'desktop_config', 'app_settings')");

// Also replace inside migrate checks
content = content.replaceAll("doc(firestoreDb, 'customers',", "doc(firestoreDb, 'desktop_customers',");
content = content.replaceAll("doc(firestoreDb, 'transactions',", "doc(firestoreDb, 'desktop_transactions',");
content = content.replaceAll("doc(firestoreDb, 'employees',", "doc(firestoreDb, 'desktop_employees',");
content = content.replaceAll("doc(firestoreDb, 'salaries',", "doc(firestoreDb, 'desktop_salaries',");

fs.writeFileSync(appFile, content, 'utf8');
console.log('Successfully separated desktop database collections from APK!');

