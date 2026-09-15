import React from 'react';
import { Coins, Trash2 } from 'lucide-react';

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
                    <div className="stat-label">{db.settings.lang === 'mr' ? 'आजची एकूण जमा' : "Today's Collections"}</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>₹{todayCollectionTotal}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(29, 158, 117, 0.15)', color: 'var(--success)' }}>
                    <Coins size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{db.settings.lang === 'mr' ? 'चालू महिन्याची एकूण जमा' : "Current Month's Collections"}</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>₹{currentMonthCollectionTotal}</div>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {/* Left Panel: Detailed Transactions List */}
                <div className="card-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="section-title">
                      {db.settings.lang === 'mr' ? 'जमा रक्कम तपशील' : 'Collections Ledger'}
                    </h3>
                    <div className="toolbar" style={{ margin: 0, gap: '6px' }}>
                      <button 
                        className={`btn btn-sm ${collectionFilter === 'today' ? 'btn-primary' : ''}`}
                        onClick={() => setCollectionFilter('today')}
                      >
                        {db.settings.lang === 'mr' ? 'आज' : 'Today'}
                      </button>
                      <button 
                        className={`btn btn-sm ${collectionFilter === 'custom' ? 'btn-primary' : ''}`}
                        onClick={() => setCollectionFilter('custom')}
                      >
                        {db.settings.lang === 'mr' ? 'तारीख निवडा' : 'Date Range'}
                      </button>
                      <button 
                        className={`btn btn-sm ${collectionFilter === 'month' ? 'btn-primary' : ''}`}
                        onClick={() => setCollectionFilter('month')}
                      >
                        {db.settings.lang === 'mr' ? 'चालू महिना' : 'Current Month'}
                      </button>
                    </div>
                  </div>

                  {collectionFilter === 'custom' && (
                    <div className="date-picker-row" style={{ display: 'flex', gap: '12px', padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', backgroundColor: 'var(--primary-light)', borderRadius: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>
                          {db.settings.lang === 'mr' ? 'पासून:' : 'From:'}
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
                          {db.settings.lang === 'mr' ? 'पर्यंत:' : 'To:'}
                        </span>
                        <input
                          type="date"
                          className="form-input"
                          value={colEndDate}
                          min={todayStr().slice(0, 7) + '-01'}
                          max={todayStr()}
                          onChange={(e) => setColEndDate(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '13px', width: '130px', height: '30px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Transactions List */}
                  <div style={{ flex: 1, maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', backgroundColor: '#f8f9fc' }}>
                    {filteredTxns.map((tx, idx) => {
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
                              onClick={() => cust && setSelectedCustomerProfile(cust)}
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
                                  color: cust ? 'var(--primary)' : 'var(--text)', 
                                  cursor: cust ? 'pointer' : 'default',
                                  display: 'inline-block'
                                }}
                                onClick={() => cust && setSelectedCustomerProfile(cust)}
                                className={cust ? "hover-underline" : ""}
                              >
                                {tx.custName}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📅 {tx.date}</span>
                                <span className="badge badge-active" style={{ fontSize: '9px', padding: '2px 6px' }}>{tx.paymentMode}</span>
                              </div>
                              {tx.note && (
                                <div style={{ fontSize: '12px', color: 'var(--primary)', fontStyle: 'italic', marginTop: '4px', backgroundColor: 'var(--primary-light)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                  📝 Note: {tx.note}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: '800', color: 'var(--success)', fontSize: '15px' }}>₹{tx.amount}</span>
                            {role === 'owner' && (
                              <button 
                                className="btn btn-sm btn-icon btn-danger" 
                                title={db.settings.lang === 'mr' ? 'व्यवहार हटवा' : 'Delete Transaction'}
                                onClick={() => handleDeleteTxn(tx.id, tx.custId, tx.amount)}
                                style={{ width: '28px', height: '28px' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {filteredTxns.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        {db.settings.lang === 'mr' ? 'कोणतेही रेकॉर्ड सापडले नाही.' : 'No collections recorded.'}
                      </div>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="card" style={{ margin: 0, padding: '16px', backgroundColor: 'var(--success-light)', borderColor: '#1d9e7533', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#085041' }}>
                      {db.settings.lang === 'mr' ? 'एकूण जमा:' : 'Total Collections:'}
                    </span>
                    <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--success)' }}>
                      ₹{filteredTxnsTotal}
                    </span>
                  </div>
                </div>

              {/* Past Months' Collections Archive Area */}
              {role === 'owner' && (
                <div className="card-section" style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>
                      📂 {db.settings.lang === 'mr' ? 'मागील महिन्यांचे जमा रेकॉर्ड (संग्रह)' : "Past Months' Collections Archive"}
                    </h3>
                    {!isCollectionArchiveUnlocked ? (
                      <span className="badge badge-expired">{db.settings.lang === 'mr' ? 'लॉक केलेले' : 'Locked'}</span>
                    ) : (
                      <button className="btn btn-sm" onClick={() => setIsCollectionArchiveUnlocked(false)}>
                        🔒 {db.settings.lang === 'mr' ? 'लॉक करा' : 'Lock Archive'}
                      </button>
                    )}
                  </div>

                  {!isCollectionArchiveUnlocked ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', backgroundColor: '#f8f9fc', borderRadius: '12px', border: '1px solid var(--border)', gap: '12px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        {db.settings.lang === 'mr' ? 'मागील महिन्यांचे जमा रेकॉर्ड पाहण्यासाठी पासवर्ड टाका.' : 'Please enter the archive passcode to view past months\' collections.'}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          key={`collection-passcode-input-${currentTab}-${isCollectionArchiveUnlocked}`}
                          ref={collectionInputRef}
                          type="password"
                          className="form-input"
                          placeholder="Passcode"
                          maxLength="4"
                          value={collectionArchivePinInput}
                          onChange={(e) => setCollectionArchivePinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
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
                            if (await matchesArchiveSecret(collectionArchivePinInput, db.settings.archivePasswordHash)) {
                              setIsCollectionArchiveUnlocked(true);
                              setCollectionArchivePinInput('');
                            } else {
                              showToast(db.settings.lang === 'mr' ? 'चुकीचा पासवर्ड!' : 'Incorrect passcode!', 'error');
                              setCollectionArchivePinInput('');
                            }
                          }}
                        >
                          {db.settings.lang === 'mr' ? 'अनलॉक' : 'Unlock'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {archiveCollectionMonths.map(monthGroup => {
                        return (
                          <div key={monthGroup.monthStr} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                              <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                                📂 {monthGroup.monthLabel}
                              </span>
                              <span style={{ fontWeight: '800', color: 'var(--success)' }}>
                                Total Received: ₹{monthGroup.total}
                              </span>
                            </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px', backgroundColor: '#fff' }}>
                              {monthGroup.items.map((tx, idx) => (
                                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: idx === monthGroup.items.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{tx.custName} ({tx.paymentMode})</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>📅 {tx.date}</div>
                                    {tx.note && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Note: {tx.note}</div>}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: '700', color: 'var(--success)', fontSize: '13px' }}>₹{tx.amount}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {archiveCollectionMonths.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                          {db.settings.lang === 'mr' ? 'संग्रहात कोणतेही रेकॉर्ड सापडले नाही.' : 'No archived collection months found.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          )}
    </>
  );
}
