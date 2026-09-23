import React from 'react';
import { TrendingDown, Trash2, Lock } from 'lucide-react';
import { formatDisplayDate } from '../utils/formatters';
import FinancialArchiveLockModal from '../components/modals/FinancialArchiveLockModal';
import { useFinancialArchive } from '../features/financialArchive/useFinancialArchive';

export default function ExpensesTab({
  db = { customers: [], transactions: [], expenses: [], settings: {} },
  role,
  todayExpenseTotal,
  currentMonthExpenseTotal,
  expenseForm,
  setExpenseForm,
  onSaveExpense,
  handleSaveExpense,
  onDeleteExpense,
  handleDeleteExpense,
  expenseFilter,
  setExpenseFilter,
  expStartDate,
  setExpStartDate,
  expEndDate,
  setExpEndDate,
  todayStr,
  filteredExpenses,
  filteredExpensesTotal,
  showToast
}) {
  const isMarathi = db?.settings?.lang === 'mr';
  const archive = useFinancialArchive({ db, role, showToast });
  const saveFn = onSaveExpense || handleSaveExpense;
  const deleteFn = onDeleteExpense || handleDeleteExpense;

  return (
    <div className="tab-panel animate-fade">
      {/* Header Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'आजचा एकूण खर्च' : "Today's Total Expenses"}</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{todayExpenseTotal}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'चालू महिन्याचा एकूण खर्च' : "Current Month's Total Expenses"}</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{currentMonthExpenseTotal}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left: Add Expense Form */}
        <div className="card-section">
          <h3 className="section-title">{isMarathi ? 'नवीन खर्च नोंदवा' : 'Record New Expense'}</h3>
          <form onSubmit={saveFn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'रक्कम (रुपये) *' : 'Amount (Rs) *'}</label>
              <input
                type="text"
                className="form-input"
                inputMode="numeric"
                placeholder="e.g. 500"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value.replace(/[^\d.]/g, '') })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{isMarathi ? 'खर्चाचा तपशील / कारण *' : 'Expense Note / Reason *'}</label>
              <input
                type="text"
                className="form-input"
                placeholder={isMarathi ? 'उदा. भाजीपाला, गॅस सिलेंडर' : 'e.g. Vegetables, Gas Cylinder'}
                value={expenseForm.note}
                onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-danger" style={{ width: '100%', padding: '12px' }}>
              {isMarathi ? 'खर्च जतन करा' : 'Save Expense'}
            </button>
          </form>
        </div>

        {/* Right: Expenses Ledger */}
        <div className="card-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title">{isMarathi ? 'खर्च इतिहास' : 'Expenses Ledger'}</h3>
            <div className="toolbar" style={{ margin: 0, gap: '6px' }}>
              <button className={`btn btn-sm ${expenseFilter === 'today' ? 'btn-primary' : ''}`} onClick={() => setExpenseFilter('today')}>
                {isMarathi ? 'आज' : 'Today'}
              </button>
              <button className={`btn btn-sm ${expenseFilter === 'custom' ? 'btn-primary' : ''}`} onClick={() => setExpenseFilter('custom')}>
                {isMarathi ? 'तारीख निवडा' : 'Date Range'}
              </button>
              <button className={`btn btn-sm ${expenseFilter === 'month' ? 'btn-primary' : ''}`} onClick={() => setExpenseFilter('month')}>
                {isMarathi ? 'चालू महिना' : 'Current Month'}
              </button>
              <select
                className="form-input"
                value={archive.selectedMonth}
                onChange={(e) => archive.handleSelectMonth(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
              >
                <option value="">{isMarathi ? '📅 महिना निवडा (Archives)' : '📅 Select Month (Archives)'}</option>
                {archive.availableMonths.map(m => {
                  const isPast = m !== archive.currentMonthStr;
                  const isLocked = isPast && (!archive.isUnlocked && role !== 'owner');
                  return (
                    <option key={m} value={m}>
                      {m} {isPast ? (isLocked ? '🔒 (Locked)' : '📂 (Archived)') : '✨ (Current)'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', backgroundColor: '#f8f9fc' }}>
            {(filteredExpenses || []).map((exp, idx) => (
              <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: idx === (filteredExpenses || []).length - 1 ? 'none' : '1px solid var(--border)', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>
                    {exp.note}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    📅 {formatDisplayDate(exp.date)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--danger)', fontSize: '15px' }}>₹{exp.amount}</span>
                  {(role === 'owner' || !role) && (
                    <button className="btn btn-sm btn-icon btn-danger" onClick={() => deleteFn && deleteFn(exp.id)} title={isMarathi ? 'खर्च हटवा' : 'Delete expense'}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {(!filteredExpenses || filteredExpenses.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                {isMarathi ? 'कोणताही खर्च सापडला नाही.' : 'No expenses recorded.'}
              </div>
            )}
          </div>

          <div className="card" style={{ margin: 0, padding: '16px', backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#991B1B' }}>{isMarathi ? 'एकूण खर्च:' : 'Total Expenses:'}</span>
            <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--danger)' }}>₹{filteredExpensesTotal}</span>
          </div>
        </div>
      </div>

      <FinancialArchiveLockModal
        isOpen={archive.isLockModalOpen}
        onClose={() => archive.setIsLockModalOpen(false)}
        pinInput={archive.pinInput}
        setPinInput={archive.setPinInput}
        pinError={archive.pinError}
        setPinError={archive.setPinError}
        onSubmit={archive.handleUnlockSubmit}
        isMarathi={isMarathi}
      />
    </div>
  );
}
