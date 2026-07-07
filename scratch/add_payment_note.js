const fs = require('fs');
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Declare payNote state
content = content.replace(
  "  const [payMode, setPayMode] = useState('Cash');",
  "  const [payMode, setPayMode] = useState('Cash');\n  const [payNote, setPayNote] = useState('');"
);
console.log('Added payNote state variable!');

// 2. Reset payNote in openPayModal
content = content.replace(
  "    setPayMode('Cash');\n  };",
  "    setPayMode('Cash');\n    setPayNote('');\n  };"
);
console.log('Added payNote reset to openPayModal!');

// 3. Save payNote in handlePaySubmit newTxn object
const targetNewTxn = `    const newTxn = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      custId: payModalCustomer.id,
      amount: amt,
      date: payDate,
      paymentMode: payMode
    };`;

const replacementNewTxn = `    const newTxn = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      custId: payModalCustomer.id,
      amount: amt,
      date: payDate,
      paymentMode: payMode,
      note: payNote.trim()
    };`;

content = content.replace(targetNewTxn, replacementNewTxn);
console.log('Added note property saving to newTxn!');

// 4. Add Note field in the Record Payment Modal form
const targetModalFormGroup = `                <div className="form-group">
                  <label className="form-label">{db.settings.lang === 'mr' ? 'पेमेंट पद्धत (Mode)' : 'Payment Mode'}</label>
                  <select
                    className="form-select"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                  >
                    <option value="Cash">{db.settings.lang === 'mr' ? 'रोख (Cash)' : 'Cash'}</option>
                    <option value="UPI">{db.settings.lang === 'mr' ? 'ऑनलाईन (UPI)' : 'UPI'}</option>
                  </select>
                </div>
              </div>`;

const replacementModalFormGroup = `                <div className="form-group">
                  <label className="form-label">{db.settings.lang === 'mr' ? 'पेमेंट पद्धत (Mode)' : 'Payment Mode'}</label>
                  <select
                    className="form-select"
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                  >
                    <option value="Cash">{db.settings.lang === 'mr' ? 'रोख (Cash)' : 'Cash'}</option>
                    <option value="UPI">{db.settings.lang === 'mr' ? 'ऑनलाईन (UPI)' : 'UPI'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{db.settings.lang === 'mr' ? 'टीप (Note)' : 'Note'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder={db.settings.lang === 'mr' ? 'उदा. रोख मिळाला, सवलत दिली' : 'e.g. Paid by friend, discount'}
                  />
                </div>
              </div>`;

content = content.replace(targetModalFormGroup, replacementModalFormGroup);
console.log('Added Note field to Record Payment Modal!');

// 5. Add Note header to History Table
const targetHistoryHeaders = `                        <th>{db.settings.lang === 'mr' ? 'तारीख' : 'Date'}</th>
                        <th>{db.settings.lang === 'mr' ? 'रक्कम' : 'Amount'}</th>
                        <th>{db.settings.lang === 'mr' ? 'पद्धत' : 'Mode'}</th>
                        <th style={{ textAlign: 'right' }}>{db.settings.lang === 'mr' ? 'क्रिया' : 'Action'}</th>`;

const replacementHistoryHeaders = `                        <th>{db.settings.lang === 'mr' ? 'तारीख' : 'Date'}</th>
                        <th>{db.settings.lang === 'mr' ? 'रक्कम' : 'Amount'}</th>
                        <th>{db.settings.lang === 'mr' ? 'पद्धत' : 'Mode'}</th>
                        <th>{db.settings.lang === 'mr' ? 'टीप' : 'Note'}</th>
                        <th style={{ textAlign: 'right' }}>{db.settings.lang === 'mr' ? 'क्रिया' : 'Action'}</th>`;

content = content.replace(targetHistoryHeaders, replacementHistoryHeaders);
console.log('Added Note header to Payment History table!');

// 6. Add Note value cell to History Table rows
const targetHistoryCells = `                            <td>
                              <span className={\`badge \${t.paymentMode === 'UPI' ? 'badge-active' : 'badge-expiring'}\`}>
                                {t.paymentMode === 'UPI' ? 'UPI' : 'Cash'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>`;

const replacementHistoryCells = `                            <td>
                              <span className={\`badge \${t.paymentMode === 'UPI' ? 'badge-active' : 'badge-expiring'}\`}>
                                {t.paymentMode === 'UPI' ? 'UPI' : 'Cash'}
                              </span>
                            </td>
                            <td>{t.note || '-'}</td>
                            <td style={{ textAlign: 'right' }}>`;

content = content.replace(targetHistoryCells, replacementHistoryCells);
console.log('Added Note text value cell to Payment History table rows!');

fs.writeFileSync(file, content, 'utf8');
console.log('All replacements completed successfully!');

