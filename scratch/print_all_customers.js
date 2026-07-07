const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const dbPath = path.join(appData, 'lokmanya-mess-desktop', 'data', 'database.json');

if (fs.existsSync(dbPath)) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log('All customers in DB:');
  data.customers.forEach((c, idx) => {
    console.log(`[${idx}] ID: ${c.id}, Name: "${c.name}", Phone: "${c.phone}", Plan: "${c.plan}", Amount: ${c.amount}, Deposited: ${c.deposited}, JoinDate: "${c.joinDate}"`);
  });
} else {
  console.log('No DB found.');
}
