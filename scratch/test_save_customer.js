const db = {
  customers: [],
  transactions: [],
  settings: { lang: 'en', ownerPin: 'REDACTED_PIN' }
};

const custForm = {
  name: 'Test Customer',
  phone: '9876543210',
  aadhar: '123456789012',
  plan: 'Monthly',
  amount: '1500',
  deposited: '1200',
  joinDate: '2026-06-27',
  addr: 'Test Address',
  photo: ''
};

const editCustId = null;

function saveCustomer() {
  if (!custForm.name.trim() || !custForm.phone.trim()) {
    console.error('Name and Phone are required.');
    return;
  }

  let digits = custForm.phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 14 && digits.startsWith('9191')) {
    digits = digits.slice(2);
  }
  if (digits.length === 13 && digits.startsWith('910')) {
    digits = '91' + digits.slice(3);
  }
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  if (digits.length !== 12 || !digits.startsWith('91')) {
    console.error('Phone validation failed: ' + digits);
    return;
  }
  const cleanPhone = '+' + digits;

  if (custForm.aadhar && custForm.aadhar.trim()) {
    const aadharClean = custForm.aadhar.replace(/\D/g, '');
    if (aadharClean.length !== 12) {
      console.error('Aadhar validation failed.');
      return;
    }
  }

  const finalForm = { ...custForm, phone: cleanPhone };

  let updatedCustomers;
  let updatedTxns = [...(db.transactions || [])];
  if (editCustId) {
    updatedCustomers = db.customers.map(c => c.id === editCustId ? { ...c, ...finalForm, amount: Number(finalForm.amount), deposited: Number(finalForm.deposited) || 0 } : c);
  } else {
    const newCust = { ...finalForm, id: 'cust_' + Date.now(), amount: Number(finalForm.amount), deposited: Number(finalForm.deposited) || 0 };
    updatedCustomers = [...db.customers, newCust];
    if (newCust.deposited > 0) {
      const initialTxn = {
        id: 'txn_' + Date.now() + '_init',
        custId: newCust.id,
        amount: newCust.deposited,
        date: newCust.joinDate,
        paymentMode: 'Cash'
      };
      updatedTxns.push(initialTxn);
    }
  }

  console.log('Success! Customers list:', updatedCustomers);
  console.log('Transactions list:', updatedTxns);
}

saveCustomer();

