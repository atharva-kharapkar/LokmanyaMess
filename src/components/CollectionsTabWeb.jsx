import React from 'react';
import { Coins, Trash2 } from 'lucide-react';
import SectionCollectionBreakdown from './collections/SectionCollectionBreakdown';

export default function CollectionsTabWeb({
  db,
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
  deleteTxn,
  isCollectionArchiveUnlocked,
  setIsCollectionArchiveUnlocked,
  collectionArchivePinInput,
  setCollectionArchivePinInput,
  collectionInputRef,
  matchesArchiveSecret,
  showToast,
  archiveCollectionMonths,
  currentTab
}) {
  const isMarathi = db.settings?.lang === 'mr';

  return (
    <>
      {currentTab === 'collections' && (
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

          {/* Section-Wise 1-Month Collections Breakdown (Tiffin vs Dine-In) */}
          <SectionCollectionBreakdown
            filteredTxns={filteredTxns}
            db={db}
            isMarathi={isMarathi}
          />

          {/* Main Content Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            {/* Left Panel: Detailed Transactions List */}
            <div className="card-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="section-title">
                  {isMarathi ? 'जमा रक्कम तपशील' : 'Collections Ledger'}
                </h3>
                <div className="toolbar" style={{ margin: 0, gap: '6px' }}>
                  <button 
                    className={`btn btn-sm ${collectionFilter === 'today' ? 'btn-primary' : ''}`}
                    onClick={() => setCollectionFilter('today')}
                  >
                    {isMarathi ? 'आज' : 'Today'}
                  </button>
                  <button 
                    className={`btn btn-sm ${collectionFilter === 'custom' ? 'btn-primary' : ''}`}
                    onClick={() => setCollectionFilter('custom')}
                  >
                    {isMarathi ? 'तारीख निवडा' : 'Date Range'}
                  </button>
                  <button 
                    className={`btn btn-sm ${collectionFilter === 'month' ? 'btn-primary' : ''}`}
                    onClick={() => setCollectionFilter('month')}
                  >
                    {isMarathi ? 'चालू महिना' : 'Current Month'}
                  </button>
                </div>
              </div>

              {collectionFilter === 'custom' && (
                <div className="date-picker-row" style={{ display: 'flex', gap: '12px', padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', backgroundColor: 'var(--primary-light)', borderRadius: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                      {isMarathi ? 'पासून:' : 'From:'}
                    </span>
                    <input
                      type="date"
                      className="form-input"
                      value={colStartDate}
                      min={todayStr().slice(0, 7) + '-01'}
                      max={todayStr()}
                      onChange={(e) => setColStartDate(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '13px', width: '130px', height: '30px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                      {isMarathi ? 'पर्यंत:' : 'To:'}
                    </span>
                    <input
                      type="date"
                      className="form-input"
                      value={colEndDate}
                      min={colStartDate || (todayStr().slice(0, 7) + '-01')}
                      max={todayStr()}
                      onChange={(e) => setColEndDate(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '13px', width: '130px', height: '30px' }}
                    />
                  </div>
                </div>
              )}

              {/* Transactions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredTxns.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {isMarathi ? 'कोणतेही व्यवहार सापडले नाहीत.' : 'No collection records found.'}
                  </div>
                ) : (
                  filteredTxns.map((tx, idx) => {
                    const cust = tx.customer;
                    const hasPhoto = cust && cust.photo;
                    return (
                      <div key={tx.id} className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: idx === filteredTxns.length - 1 ? 'none' : '1px solid var(--border)', gap: '12px', backgroundColor: '#fff', borderRadius: '8px', marginBottom: '6px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          {/* Avatar */}
                          <div 
                            style={{ 
                              width: '36px', 
                              height: '36px', 
                              borderRadius: '50%', 
                              overflow: 'hidden', 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              backgroundColor: 'var(--primary-light)', 
                              border: '1px solid var(--border)',
                              cursor: cust ? 'pointer' : 'default',
                              flexShrink: 0
                            }}
                          >
                            {hasPhoto ? (
                              <img src={cust.photo} alt={tx.custName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>
                                {(tx.custName || 'C').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div style={{ flex: 1 }}>
                            <div 
                              style={{ 
                                fontWeight: '700', 
                                fontSize: '14px', 
                                color: 'var(--text)', 
                                display: 'inline-block'
                              }}
                            >
                              {tx.custName}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {tx.date} • {tx.mode ? tx.mode.toUpperCase() : 'CASH'} {tx.note ? `• ${tx.note}` : ''}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--success)' }}>
                            +₹{tx.amount}
                          </div>
                          {deleteTxn && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              style={{ padding: '4px 8px', borderRadius: '6px' }}
                              onClick={() => deleteTxn(tx.id)}
                              title={isMarathi ? 'हटावा' : 'Delete'}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
