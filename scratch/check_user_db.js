const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const dbPath = path.join(appData, 'lokmanya-mess-desktop', 'data', 'database.json');

console.log('Checking database file at:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.log('Database file does not exist at this path.');
} else {
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    console.log('Database file size:', raw.length, 'bytes');
    const data = JSON.parse(raw);
    console.log('Successfully parsed JSON!');
    console.log('Customers count:', data.customers ? data.customers.length : 'undefined');
    console.log('Transactions count:', data.transactions ? data.transactions.length : 'undefined');
    console.log('Settings:', data.settings);
    
    if (data.customers && data.customers.length > 0) {
      console.log('Last 2 customers in DB:');
      console.log(JSON.stringify(data.customers.slice(-2), null, 2));
    }
  } catch (e) {
    console.error('Error reading/parsing database.json:', e);
  }
}
