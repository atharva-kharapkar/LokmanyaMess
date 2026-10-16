import React, { useState, useMemo } from 'react';
import { Coins, Trash2, Lock, Search, X, Clock } from 'lucide-react';
import { formatDisplayDate, formatTxnTime } from '../utils/formatters';
import FinancialArchiveLockModal from '../components/modals/FinancialArchiveLockModal';
import { useFinancialArchive } from '../features/financialArchive/useFinancialArchive';
import SectionCollectionBreakdown from '../components/collections/SectionCollectionBreakdown';

export default function CollectionsTab({
  db = { customers: [], transactions: [], expenses: [], settings: {} },
  role,
  activeBranch = 'All',
  todayCollectionTotal,
  currentMonthCollectionTotal,
  filter,
  setFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
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
  showToast,
  onEnlargePhoto
}) {
  const isMarathi = db.settings?.lang === 'mr';
  const archive = useFinancialArchive({ db, role, showToast });
  const [collectionSearch, setCollectionSearch] = useState('');

  // Fast O(1) customer lookup map for instant customer name/phone/category/photo lookup
  const customerMap = useMemo(() => {
    const map = new Map();
    (db.customers || []).forEach(c => {
      if (!c) return;
      if (c.id) map.set(String(c.id).trim(), c);
      if (c.name) map.set(c.name.trim().toLowerCase(), c);
      if (c.phone) map.set(String(c.phone).trim(), c);
    });
    return map;
  }, [db.customers]);

  // Fast display transactions filtering with live search query
  const displayTxns = useMemo(() => {
    const txns = Array.isArray(filteredTxns) ? filteredTxns : [];
    const query = collectionSearch.trim().toLowerCase();
    if (!query) return txns;

    return txns.filter(tx => {
      if (!tx) return false;
      const cust = tx.customer 
        || (tx.custId ? customerMap.get(String(tx.custId).trim()) : null)
        || (tx.customerId ? customerMap.get(String(tx.customerId).trim()) : null)
        || (tx.custName ? customerMap.get(tx.custName.trim().toLowerCase()) : null);

      const custName = (tx.custName || cust?.name || '').toLowerCase();
      const custPhone = (cust?.phone || tx.custPhone || '').toString();
      const amountStr = String(tx.amount || '');
      const modeStr = (tx.paymentMode || tx.mode || '').toLowerCase();
      const noteStr = (tx.note || '').toLowerCase();
      const branchStr = (tx.branch || '').toLowerCase();
      const categoryStr = (tx.category || cust?.category || 'dinein').toLowerCase();
      
      const categoryLabel = categoryStr === 'tiffin' 
        ? (isMarathi ? 'टिफिन tiffin' : 'tiffin')
        : categoryStr === 'shortterm'
        ? (isMarathi ? 'अल्पमुदत shortterm short-term' : 'shortterm short-term')
        : (isMarathi ? 'डाईन इन dinein dine-in' : 'dinein dine-in');

      return custName.includes(query) ||
        custPhone.includes(query) ||
        amountStr.includes(query) ||
        modeStr.includes(query) ||
        noteStr.includes(query) ||
        branchStr.includes(query) ||
        categoryLabel.includes(query);
    });
  }, [filteredTxns, collectionSearch, customerMap, isMarathi]);

  const displayTxnsTotal = useMemo(() => {
    return displayTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [displayTxns]);

  const activeFilter = collectionFilter || filter || 'month';
  const activeSetFilter = setCollectionFilter || setFilter || (() => {});
  const activeStartDate = colStartDate || startDate || '';
  const activeSetStartDate = setColStartDate || setStartDate || (() => {});
  const activeEndDate = colEndDate || endDate || '';
  const activeSetEndDate = setColEndDate || setEndDate || (() => {});

  const nowStr = new Date().toISOString().slice(0, 10);
  const currentMonthStartStr = `${nowStr.slice(0, 7)}-01`;

  const handleTodayClick = () => {
    activeSetFilter('today');
    if (archive.setSelectedMonth) archive.setSelectedMonth('');
  };

  const handleCurrentMonthClick = () => {
    activeSetFilter('month');
    if (archive.setSelectedMonth) archive.setSelectedMonth('');
  };

  const handleCustomDateClick = () => {
    activeSetFilter('custom');
    if (!activeStartDate) activeSetStartDate(currentMonthStartStr);
    if (!activeEndDate) activeSetEndDate(nowStr);
    if (archive.setSelectedMonth) archive.setSelectedMonth('');
  };

  const handleArchiveMonthSelect = (monthStr) => {
    archive.handleSelectMonth(monthStr);
    if (monthStr) {
      const year = monthStr.slice(0, 4);
      const month = monthStr.slice(5, 7);
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const padLastDay = String(lastDay).padStart(2, '0');
      activeSetStartDate(`${monthStr}-01`);
      activeSetEndDate(`${monthStr}-${padLastDay}`);
      activeSetFilter('custom');
    } else {
      activeSetFilter('month');
    }
  };

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
            <div className="stat-value" style={{ color: 'var(--success)' }}>₹{todayCollectionTotal || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(29, 158, 117, 0.15)', color: 'var(--success)' }}>
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'चालू महिन्याची एकूण जमा' : "Current Month's Collections"}</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>₹{currentMonthCollectionTotal || 0}</div>
          </div>
        </div>
      </div>

      {/* Section-Wise 1-Month Collections Breakdown (Tiffin vs Dine-In) */}
      <SectionCollectionBreakdown
        filteredTxns={filteredTxns}
        db={db}
        isMarathi={isMarathi}
      />

      {/* Main Ledger */}
      <div className="card-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-title">{isMarathi ? 'जमा रक्कम तपशील' : 'Collections Ledger'}</h3>
          <div className="toolbar" style={{ margin: 0, gap: '6px' }}>
            <button className={`btn btn-sm ${activeFilter === 'today' ? 'btn-primary' : ''}`} onClick={handleTodayClick}>
              {isMarathi ? 'आज' : 'Today'}
            </button>
            <button className={`btn btn-sm ${activeFilter === 'custom' ? 'btn-primary' : ''}`} onClick={handleCustomDateClick}>
              {isMarathi ? 'तारीख निवडा' : 'Date Range'}
            </button>
            <button className={`btn btn-sm ${activeFilter === 'month' ? 'btn-primary' : ''}`} onClick={handleCurrentMonthClick}>
              {isMarathi ? 'चालू महिना' : 'Current Month'}
            </button>
            <select
              className="form-input"
              value={archive.selectedMonth}
              onChange={(e) => handleArchiveMonthSelect(e.target.value)}
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

        {activeFilter === 'custom' && (
          <div className="date-picker-row" style={{ display: 'flex', gap: '12px', padding: '8px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center', backgroundColor: 'var(--primary-light)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>{isMarathi ? 'पासून:' : 'From:'}</span>
              <input type="date" className="form-input" value={activeStartDate} onChange={(e) => activeSetStartDate(e.target.value)} style={{ padding: '4px 8px', fontSize: '13px', width: '130px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600' }}>{isMarathi ? 'पर्यंत:' : 'To:'}</span>
              <input type="date" className="form-input" value={activeEndDate} onChange={(e) => activeSetEndDate(e.target.value)} style={{ padding: '4px 8px', fontSize: '13px', width: '130px' }} />
            </div>
          </div>
        )}

        {/* Search Bar for instant collection search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#64748b', 
              pointerEvents: 'none' 
            }} 
          />
          <input 
            type="text" 
            className="form-input" 
            placeholder={isMarathi ? '🔍 ग्राहक नाव, फोन नंबर, रक्कम किंवा विभाग (डाईन इन/टिफिन) शोधा...' : '🔍 Search by customer name, phone, amount or section (Dine In/Tiffin)...'}
            value={collectionSearch}
            onChange={(e) => setCollectionSearch(e.target.value)}
            style={{ 
              paddingLeft: '38px', 
              paddingRight: collectionSearch ? '38px' : '14px',
              fontSize: '14px',
              borderRadius: '10px',
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1.5px solid #cbd5e1',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              height: '42px'
            }}
          />
          {collectionSearch && (
            <button
              type="button"
              onClick={() => setCollectionSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title={isMarathi ? 'शोध साफ करा' : 'Clear search'}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {collectionSearch.trim() && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '6px 12px', backgroundColor: '#eef2ff', borderRadius: '8px', color: '#4338ca', fontWeight: '600' }}>
            <span>
              {isMarathi 
                ? `🔍 "${collectionSearch}" साठी ${displayTxns.length} व्यवहार सापडले (एकूण: ₹${displayTxnsTotal.toLocaleString('en-IN')})` 
                : `🔍 Found ${displayTxns.length} transactions for "${collectionSearch}" (Total: ₹${displayTxnsTotal.toLocaleString('en-IN')})`}
            </span>
            <button 
              onClick={() => setCollectionSearch('')}
              style={{ background: 'none', border: 'none', color: '#4338ca', cursor: 'pointer', fontWeight: '700', textDecoration: 'underline', fontSize: '12px' }}
            >
              {isMarathi ? 'सर्व दाखवा (Reset)' : 'Show All (Reset)'}
            </button>
          </div>
        )}

        {/* Transactions List */}
        <div style={{ maxHeight: '440px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px', backgroundColor: '#f8f9fc' }}>
          {(displayTxns || []).map(tx => {
            if (!tx) return null;
            const cust = tx.customer 
              || (tx.custId ? customerMap.get(String(tx.custId).trim()) : null)
              || (tx.customerId ? customerMap.get(String(tx.customerId).trim()) : null)
              || (tx.custName ? customerMap.get(tx.custName.trim().toLowerCase()) : null);

            const category = tx.category || cust?.category || 'dinein';
            const txnTime = formatTxnTime(tx);

            return (
              <div 
                key={tx.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 14px', 
                  backgroundColor: '#ffffff', 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0', 
                  marginBottom: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                {/* Left side: Avatar + Customer Details + Badges */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <div 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => typeof onEnlargePhoto === 'function' && onEnlargePhoto({ url: cust?.photo || '', name: tx.custName || 'Customer' })}
                    title={isMarathi ? 'फोटो मोठा करा' : 'Click to enlarge photo'}
                  >
                    {cust && cust.photo ? (
                      <img src={cust.photo} alt={tx.custName || 'Customer'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)' }}>
                        {(tx.custName || 'C').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span 
                        style={{ fontWeight: '700', fontSize: '15px', color: 'var(--primary)', cursor: 'pointer' }}
                        onClick={() => typeof onEnlargePhoto === 'function' && onEnlargePhoto({ url: cust?.photo || '', name: tx.custName || 'Customer' })}
                      >
                        {tx.custName}
                      </span>

                      {/* Section Badge */}
                      <span 
                        style={{ 
                          fontSize: '11px', 
                          padding: '2px 8px', 
                          fontWeight: '700',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          backgroundColor: category === 'tiffin' ? '#eff6ff' : category === 'shortterm' ? '#fef3c7' : '#f3e8ff',
                          color: category === 'tiffin' ? '#1d4ed8' : category === 'shortterm' ? '#b45309' : '#6b21a8',
                          border: `1px solid ${category === 'tiffin' ? '#bfdbfe' : category === 'shortterm' ? '#fde68a' : '#ddd6fe'}`
                        }}
                      >
                        {category === 'tiffin' 
                          ? (isMarathi ? '📦 टिफिन' : '📦 Tiffin') 
                          : category === 'shortterm' 
                          ? (isMarathi ? '⚡ अल्पमुदत' : '⚡ Short-Term') 
                          : (isMarathi ? '🍽️ डाईन इन' : '🍽️ Dine In')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📅 {formatDisplayDate(tx.date)}</span>
                      <span className="badge badge-active" style={{ fontSize: '10px', padding: '2px 6px' }}>{tx.paymentMode || tx.mode || 'Cash'}</span>
                      {cust?.phone && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📞 {cust.phone}</span>
                      )}
                      {(!activeBranch || activeBranch === 'All') && (
                        <span className="badge" style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: tx.branch === 'Branch 2' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: tx.branch === 'Branch 2' ? '#ea580c' : '#2563eb', fontWeight: '700' }}>
                          {tx.branch || 'Branch 1'}
                        </span>
                      )}
                    </div>
                    {tx.note && (
                      <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '3px' }}>
                        💬 {tx.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: EXACT TIME (in BOLD to the left of amount) + Amount + Action Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  {txnTime && (
                    <span 
                      style={{ 
                        fontWeight: '800', 
                        fontSize: '13px', 
                        color: '#0f172a', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        backgroundColor: '#f8fafc', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        border: '1.5px solid #cbd5e1', 
                        whiteSpace: 'nowrap' 
                      }}
                      title={isMarathi ? 'जमा नोंदवण्याची अचूक वेळ' : 'Payment recording exact time'}
                    >
                      <Clock size={13} style={{ color: '#4f46e5' }} />
                      <span>{txnTime}</span>
                    </span>
                  )}
                  <span style={{ fontWeight: '800', color: 'var(--success)', fontSize: '16px', minWidth: '70px', textAlign: 'right' }}>
                    ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                  </span>
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

          {(!displayTxns || displayTxns.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              {collectionSearch.trim()
                ? (isMarathi ? `"${collectionSearch}" साठी कोणतेही व्यवहार सापडले नाहीत.` : `No transactions matching "${collectionSearch}".`)
                : (isMarathi ? 'कोणतेही रेकॉर्ड सापडले नाही.' : 'No collections recorded.')}
            </div>
          )}
        </div>

        <div className="card" style={{ margin: 0, padding: '16px', backgroundColor: 'var(--success-light)', borderColor: '#1d9e7533', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#085041' }}>
              {collectionSearch.trim() 
                ? (isMarathi ? 'शोधलेली एकूण जमा:' : 'Filtered Collections:')
                : (isMarathi ? 'एकूण जमा:' : 'Total Collections:')}
            </span>
            {(!activeBranch || activeBranch === 'All') && (() => {
              const b1Col = (displayTxns || []).filter(t => (t.branch || 'Branch 1') === 'Branch 1').reduce((s, t) => s + Number(t.amount || 0), 0);
              const b2Col = (displayTxns || []).filter(t => t.branch === 'Branch 2').reduce((s, t) => s + Number(t.amount || 0), 0);
              return (
                <div style={{ fontSize: '11px', color: '#047857', marginTop: '3px', fontWeight: '600' }}>
                  {b2Col > 0 ? (
                    <span>{isMarathi ? `शाखा १: ₹${b1Col.toLocaleString('en-IN')} | शाखा २: ₹${b2Col.toLocaleString('en-IN')}` : `Branch 1: ₹${b1Col.toLocaleString('en-IN')} | Branch 2: ₹${b2Col.toLocaleString('en-IN')}`}</span>
                  ) : (
                    <span>{isMarathi ? `शाखा १: ₹${b1Col.toLocaleString('en-IN')}` : `Branch 1: ₹${b1Col.toLocaleString('en-IN')}`}</span>
                  )}
                </div>
              );
            })()}
          </div>
          <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--success)' }}>₹{displayTxnsTotal.toLocaleString('en-IN')}</span>
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
