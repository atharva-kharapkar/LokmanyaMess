const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const dbPath = path.join(appData, 'lokmanya-mess-desktop', 'data', 'database.json');

if (fs.existsSync(dbPath)) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log('Last 5 transactions in DB:');
  if (data.transactions) {
    console.log(JSON.stringify(data.transactions.slice(-5), null, 2));
  } else {
    console.log('No transactions field.');
  }
} else {
  console.log('No DB found.');
}

