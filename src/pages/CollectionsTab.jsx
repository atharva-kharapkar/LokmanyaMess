import React from 'react';
import { Coins, Trash2, Lock } from 'lucide-react';
import { formatDisplayDate } from '../utils/formatters';
import FinancialArchiveLockModal from '../components/modals/FinancialArchiveLockModal';
import { useFinancialArchive } from '../features/financialArchive/useFinancialArchive';

export default function CollectionsTab({
  db = { customers: [], transactions: [], expenses: [], settings: {} },
  role,
  todayCollectionTotal,
  currentMonthCollectionTotal,
  collectionFilter,
  setCollectionFilter,
  colStartDate,
  setColStartDate,
  colEndDate,
  setColEndDate,
  todayStr,
  filteredTxns,
  filteredTxnsTotal,
  onDeleteTxn,
  deleteTransaction,
  showToast
}) {
  const isMarathi = db.settings?.lang === 'mr';
  const archive = useFinancialArchive({ db, role, showToast });

  return (
    <div className="tab-panel animate-fade">
      {/* Header Summary Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(29, 158, 117, 0.1)', color: 'var(--success)' }}>
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'आजची एकूण जमा' : "Today's Collections"}</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>₹{todayCollectionTotal}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(29, 158, 117, 0.15)', color: 'var(--success)' }}>
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'चालू महिन्याची एकूण जमा' : "Current Month's Collections"}</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>₹{currentMonthCollectionTotal}</div>
          </div>
        </div>
      </div>

      {/* Main Ledger */}
      <div className="card-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title">{isMarathi ? 'जमा रक्कम तपशील' : 'Collections Ledger'}</h3>
          <div className="toolbar" style={{ margin: 0, gap: '6px' }}>
            <button className={`btn btn-sm ${collectionFilter === 'today' ? 'btn-primary' : ''}`} onClick={() => setCollectionFilter('today')}>
              {isMarathi ? 'आज' : 'Today'}
            </button>
            <button className={`btn btn-sm ${collectionFilter === 'custom' ? 'btn-primary' : ''}`} onClick={() => setCollectionFilter('custom')}>
              {isMarathi ? 'तारीख निवडा' : 'Date Range'}
            </button>
            <button className={`btn btn-sm ${collectionFilter === 'month' ? 'btn-primary' : ''}`} onClick={() => setCollectionFilter('month')}>
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

        {collectionFilter === 'custom' && (
          <div className="date-picker-row" style={{ display: 'flex', gap: '12px', padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', backgroundColor: 'var(--primary-light)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>{isMarathi ? 'पासून:' : 'From:'}</span>
              <input type="date" className="form-input" value={colStartDate} onChange={(e) => setColStartDate(e.target.value)} style={{ padding: '4px 8px', fontSize: '13px', width: '130px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>{isMarathi ? 'पर्यंत:' : 'To:'}</span>
              <input type="date" className="form-input" value={colEndDate} onChange={(e) => setColEndDate(e.target.value)} style={{ padding: '4px 8px', fontSize: '13px', width: '130px' }} />
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', backgroundColor: '#f8f9fc' }}>
          {(filteredTxns || []).map(tx => {
            const cust = tx.customer;
            return (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '6px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cust && cust.photo ? (
                      <img src={cust.photo} alt={tx.custName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>
                        {(tx.custName || 'C').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--primary)' }}>
                      {tx.custName}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📅 {formatDisplayDate(tx.date)}</span>
                      <span className="badge badge-active" style={{ fontSize: '9px', padding: '2px 6px' }}>{tx.paymentMode || 'Cash'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '800', color: 'var(--success)', fontSize: '15px' }}>₹{tx.amount}</span>
                  {(role === 'owner' || !role) && (
                    <button 
                      className="btn btn-sm btn-icon btn-danger" 
                      onClick={() => {
                        const fn = onDeleteTxn || deleteTransaction;
                        if (typeof fn === 'function') {
                          fn(tx.id);
                        }
                      }}
                      title={isMarathi ? 'व्यवहार हटवा' : 'Delete transaction'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {(!filteredTxns || filteredTxns.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              {isMarathi ? 'कोणतेही रेकॉर्ड सापडले नाही.' : 'No collections recorded.'}
            </div>
          )}
        </div>

        <div className="card" style={{ margin: 0, padding: '16px', backgroundColor: 'var(--success-light)', borderColor: '#1d9e7533', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', fontSize: '15px', color: '#085041' }}>{isMarathi ? 'एकूण जमा:' : 'Total Collections:'}</span>
          <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--success)' }}>₹{filteredTxnsTotal}</span>
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
