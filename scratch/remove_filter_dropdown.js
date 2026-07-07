const fs = require('fs');
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove state variable custFilter
content = content.replace(
  "  const [custFilter, setCustFilter] = useState('all');",
  "  // Filter dropdown state removed"
);
console.log('Removed custFilter state declaration!');

// 2. Remove custFilter logic and add name, mobile, aadhar, and address searching in filteredCustomers
const targetMemo = `  // Filtered customer list (sorted with pending dues first)
  const filteredCustomers = useMemo(() => {
    const list = db.customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch) || (c.addr && c.addr.toLowerCase().includes(custSearch.toLowerCase()));
      const status = computeStatus(c);
      const matchesFilter = custFilter === 'all' || status === custFilter;
      return matchesSearch && matchesFilter;
    });
    return list.sort((a, b) => getCustomerDues(b) - getCustomerDues(a));
  }, [db.customers, custSearch, custFilter]);`;

const replacementMemo = `  // Filtered customer list (sorted with pending dues first, search by Name, Phone, and Aadhar)
  const filteredCustomers = useMemo(() => {
    const list = db.customers.filter(c => {
      const searchLower = custSearch.toLowerCase();
      const matchesName = c.name.toLowerCase().includes(searchLower);
      const matchesPhone = c.phone.includes(custSearch);
      const matchesAadhar = c.aadhar && c.aadhar.includes(custSearch);
      const matchesAddr = c.addr && c.addr.toLowerCase().includes(searchLower);
      return matchesName || matchesPhone || matchesAadhar || matchesAddr;
    });
    return list.sort((a, b) => getCustomerDues(b) - getCustomerDues(a));
  }, [db.customers, custSearch]);`;

content = content.replace(targetMemo, replacementMemo);
console.log('Updated filteredCustomers logic with Name, Phone, and Aadhar search!');

// 3. Remove select tag dropdown rendering from JSX
const targetSelect = `                  <select
                    className="filter-select"
                    value={custFilter}
                    onChange={(e) => setCustFilter(e.target.value)}
                  >
                    <option value="all">{t(\'filterAll\')}</option>
                    <option value="active">{t(\'filterActive\')}</option>
                    <option value="expired">{t(\'filterExpired\')}</option>
                    <option value="expiring">{t(\'filterExpiring\')}</option>
                  </select>`;

const replacementSelect = `                  {/* Filter dropdown removed */}`;

if (content.includes(targetSelect)) {
  content = content.replace(targetSelect, replacementSelect);
  console.log('Removed filter select tag from JSX!');
} else {
  // Use regex in case spacing differs slightly
  const regexSelect = /<select\s+className="filter-select"[\s\S]*?<\/select>/;
  if (regexSelect.test(content)) {
    content = content.replace(regexSelect, replacementSelect);
    console.log('Removed filter select tag from JSX via regex!');
  } else {
    console.error('Failed to locate select tag in App.jsx');
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Finished updating App.jsx');

