import React from 'react';
import { IndianRupee, Trash2 } from 'lucide-react';
import { isOwnerRole } from '../utils/helpers';

export default function ExpensesTabWeb({
  db,
  role,
  todayExpenseTotal,
  currentMonthExpenseTotal,
  expenseForm,
  setExpenseForm,
  saveExpense,
  expenseFilter,
  setExpenseFilter,
  expStartDate,
  setExpStartDate,
  expEndDate,
  setExpEndDate,
  DateInputDD,
  todayStr,
  filteredExpenses,
  deleteExpense,
  filteredExpensesTotal,
  isExpenseArchiveUnlocked,
  setIsExpenseArchiveUnlocked,
  expenseArchivePinInput,
  setExpenseArchivePinInput,
  expenseInputRef,
  matchesArchiveSecret,
  showToast,
  archiveExpenseMonths,
  currentTab,
}) {
  return (
    <div className="tab-panel animate-fade">
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff1f2', color: 'var(--danger)' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{db.settings.lang === 'mr' ? 'आजचा एकूण खर्च' : "Today's Expenses"}</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{todayExpenseTotal}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff1f2', color: 'var(--danger)' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{db.settings.lang === 'mr' ? 'चालू महिन्याचा एकूण खर्च' : "Current Month's Expenses"}</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{currentMonthExpenseTotal}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="card-section">
          <div className="section-header">
            <span className="section-title">{db.settings.lang === 'mr' ? 'नवीन खर्च जोडा' : 'Add New Expense'}</span>
          </div>
          <form onSubmit={saveExpense}>
            <div className="form-group">
              <label className="form-label">{db.settings.lang === 'mr' ? 'रक्कम *' : 'Amount *'}</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 150"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                required
                style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{db.settings.lang === 'mr' ? 'खर्चाचा तपशील / नोट *' : 'Expense Details / Note *'}</label>
              <textarea
                className="form-textarea"
                placeholder={db.settings.lang === 'mr' ? 'उदा. भाजीपाला खरेदी, किराणा' : 'e.g. Vegetable purchase, Gas Cylinder'}
                value={expenseForm.note}
                onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                required
                style={{ height: '100px', WebkitUserSelect: 'text', userSelect: 'text' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {db.settings.lang === 'mr' ? 'खर्च जोडा' : 'Add Expense'}
            </button>
          </form>
        </div>

        <div className="card-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title">
              {db.settings.lang === 'mr' ? 'खर्चाची यादी' : 'Expenses List'}
            </h3>
            <div className="toolbar" style={{ margin: 0, gap: '6px' }}>
              <button
                className={`btn btn-sm ${expenseFilter === 'today' ? 'btn-primary' : ''}`}
                onClick={() => setExpenseFilter('today')}
              >
                {db.settings.lang === 'mr' ? 'आज' : 'Today'}
              </button>
              <button
                className={`btn btn-sm ${expenseFilter === 'custom' ? 'btn-primary' : ''}`}
                onClick={() => setExpenseFilter('custom')}
              >
                {db.settings.lang === 'mr' ? 'तारीख निवडा' : 'Date Range'}
              </button>
              <button
                className={`btn btn-sm ${expenseFilter === 'month' ? 'btn-primary' : ''}`}
                onClick={() => setExpenseFilter('month')}
              >
                {db.settings.lang === 'mr' ? 'चालू महिना' : 'Current Month'}
              </button>
            </div>
          </div>

          {expenseFilter === 'custom' && (
            <div className="date-picker-row" style={{ display: 'flex', gap: '12px', padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', backgroundColor: 'var(--primary-light)', borderRadius: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                  {db.settings.lang === 'mr' ? 'पासून:' : 'From:'}
                </span>
                <DateInputDD
                  className="form-input"
                  value={expStartDate}
                  min={todayStr().slice(0, 7) + '-01'}
                  max={todayStr()}
                  onChange={(e) => setExpStartDate(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '13px', width: '130px', height: '30px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                  {db.settings.lang === 'mr' ? 'पर्यंत:' : 'To:'}
                </span>
                <DateInputDD
                  className="form-input"
                  value={expEndDate}
                  min={todayStr().slice(0, 7) + '-01'}
                  max={todayStr()}
                  onChange={(e) => setExpEndDate(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '13px', width: '130px', height: '30px' }}
                />
              </div>
            </div>
          )}

          <div style={{ flex: 1, maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', backgroundColor: '#f8f9fc' }}>
            {filteredExpenses.map((exp, idx) => (
              <div key={exp.id} className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: idx === filteredExpenses.length - 1 ? 'none' : '1px solid var(--border)', gap: '12px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '6px', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{exp.note}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>📅 {exp.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--danger)', fontSize: '15px' }}>₹{exp.amount}</span>
                  {isOwnerRole(role) && (
                    <button
                      className="btn btn-sm btn-icon btn-danger"
                      title={db.settings.lang === 'mr' ? 'खर्च हटवा' : 'Delete Expense'}
                      onClick={() => deleteExpense(exp.id)}
                      style={{ width: '28px', height: '28px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredExpenses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                {db.settings.lang === 'mr' ? 'कोणतेही रेकॉर्ड सापडले नाही.' : 'No expense records found.'}
              </div>
            )}
          </div>

          <div className="card" style={{ margin: 0, padding: '16px', backgroundColor: 'var(--danger-light)', borderColor: '#e24b4a33', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#791f1f' }}>
              {db.settings.lang === 'mr' ? 'एकूण खर्च:' : 'Total Selected Expenses:'}
            </span>
            <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--danger)' }}>
              ₹{filteredExpensesTotal}
            </span>
          </div>
        </div>

        {isOwnerRole(role) && (
          <div className="card-section" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="section-title" style={{ margin: 0 }}>
                📂 {db.settings.lang === 'mr' ? 'मागील महिन्यांचे खर्च रेकॉर्ड (संग्रह)' : "Past Months' Expense Archive"}
              </h3>
              {!isExpenseArchiveUnlocked ? (
                <span className="badge badge-expired">{db.settings.lang === 'mr' ? 'लॉक केलेले' : 'Locked'}</span>
              ) : (
                <button className="btn btn-sm" onClick={() => setIsExpenseArchiveUnlocked(false)}>
                  🔒 {db.settings.lang === 'mr' ? 'लॉक करा' : 'Lock Archive'}
                </button>
              )}
            </div>

            {!isExpenseArchiveUnlocked ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', backgroundColor: '#f8f9fc', borderRadius: '12px', border: '1px solid var(--border)', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  {db.settings.lang === 'mr' ? 'मागील महिन्यांचे खर्च पाहण्यासाठी पासवर्ड टाका.' : 'Please enter the archive passcode to view past months\' expenses.'}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    key={`expense-passcode-input-${currentTab}-${isExpenseArchiveUnlocked}`}
                    ref={expenseInputRef}
                    type="password"
                    className="form-input"
                    placeholder="Passcode"
                    maxLength="4"
                    value={expenseArchivePinInput}
                    onChange={(e) => setExpenseArchivePinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    autoFocus={true}
                    style={{ width: '120px', textAlign: 'center', WebkitUserSelect: 'text', userSelect: 'text', pointerEvents: 'auto' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      if (!db.settings.archivePasswordHash) {
                        showToast(db.settings.lang === 'mr' ? 'कृपया सेटिंग्जमध्ये आर्काइव्ह पासकोड सेट करा.' : 'Please set an archive passcode in Settings first.', 'error');
                        return;
                      }
                      if (await matchesArchiveSecret(expenseArchivePinInput, db.settings.archivePasswordHash)) {
                        setIsExpenseArchiveUnlocked(true);
                        setExpenseArchivePinInput('');
                      } else {
                        showToast(db.settings.lang === 'mr' ? 'चुकीचा पासवर्ड!' : 'Incorrect passcode!', 'error');
                        setExpenseArchivePinInput('');
                      }
                    }}
                  >
                    {db.settings.lang === 'mr' ? 'अनलॉक' : 'Unlock'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {archiveExpenseMonths.map(monthGroup => (
                  <div key={monthGroup.monthStr} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                        📂 {monthGroup.monthLabel}
                      </span>
                      <span style={{ fontWeight: '800', color: 'var(--danger)' }}>
                        Total: ₹{monthGroup.total}
                      </span>
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px', backgroundColor: '#fff' }}>
                      {monthGroup.items.map((exp, idx) => (
                        <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx === monthGroup.items.length - 1 ? 'none' : '1px solid var(--border)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '13px' }}>{exp.note}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>📅 {exp.date}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--danger)', fontSize: '13px' }}>₹{exp.amount}</span>
                            {isOwnerRole(role) && (
                              <button
                                className="btn btn-sm btn-icon btn-danger"
                                onClick={() => deleteExpense(exp.id)}
                                style={{ width: '22px', height: '22px', padding: 0 }}
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {archiveExpenseMonths.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    {db.settings.lang === 'mr' ? 'संग्रहात कोणतेही रेकॉर्ड सापडले नाही.' : 'No archived expense months found.'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
