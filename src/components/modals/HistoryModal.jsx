import React from 'react';
import { X, History, Clock, CheckCircle2 } from 'lucide-react';
import { formatDisplayDate, formatTxnTime } from '../../utils/formatters';

export default function HistoryModal({
  customer,
  transactions = [],
  db,
  getCustomerDues,
  onClose,
  isOpen
}) {
  if (!customer) return null;
  const isMarathi = db?.settings?.lang === 'mr';

  // Extract all transactions from prop or directly from db.transactions
  const allTxns = (Array.isArray(transactions) && transactions.length > 0)
    ? transactions
    : (Array.isArray(db?.transactions) ? db.transactions : []);

  // Match all transactions for this customer by ID, CustomerId, or Phone
  const custTxns = allTxns.filter(t => {
    if (!t) return false;
    const matchId = (t.custId && String(t.custId).trim() === String(customer.id).trim())
      || (t.customerId && String(t.customerId).trim() === String(customer.id).trim());
    const matchPhone = Boolean(t.custPhone && customer.phone && String(t.custPhone).trim() === String(customer.phone).trim());
    return matchId || matchPhone;
  });

  // Sort by date / createdAt descending (newest payments on top)
  custTxns.sort((a, b) => {
    const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0);
    const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0);
    return timeB - timeA;
  });

  // Calculate customer dues and category
  const dues = typeof getCustomerDues === 'function' 
    ? getCustomerDues(customer) 
    : Math.max(0, Number(customer.amount || 0) - Number(customer.deposited || 0));

  const category = (customer.category || 'dinein').toLowerCase();
  const categoryLabel = category === 'tiffin' 
    ? (isMarathi ? '📦 टिफिन' : '📦 Tiffin') 
    : category === 'shortterm' 
    ? (isMarathi ? '⚡ अल्पमुदत' : '⚡ Short-Term') 
    : (isMarathi ? '🍽️ डाईन इन' : '🍽️ Dine In');

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.65)', 
        backdropFilter: 'blur(4px)', 
        zIndex: 2000, 
        position: 'fixed', 
        inset: 0, 
        padding: '20px' 
      }} 
      onClick={onClose}
    >
      <div 
        className="modal-content animate-fade-in" 
        style={{ 
          maxWidth: '500px', 
          width: '100%', 
          borderRadius: '16px', 
          padding: '24px', 
          backgroundColor: 'var(--card)', 
          boxShadow: 'var(--shadow-xl)', 
          border: '1px solid var(--border)',
          position: 'relative'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(79, 70, 229, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <History size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text)' }}>
                {customer.name}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isMarathi ? 'जमा पेमेंट इतिहास (Payment History)' : 'Customer Payment History'}
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-icon" 
            onClick={onClose} 
            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title={isMarathi ? 'बंद करा' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Customer Summary Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '12px', backgroundColor: 'var(--bg)', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {isMarathi ? 'प्लॅन शुल्क' : 'PLAN FEE'}
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)', marginTop: '2px' }}>
              ₹{customer.amount || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {isMarathi ? 'एकूण जमा' : 'TOTAL DEPOSITED'}
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--success)', marginTop: '2px' }}>
              ₹{customer.deposited || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {isMarathi ? 'शिल्लक बाकी' : 'REMAINING'}
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: dues > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '2px' }}>
              ₹{dues}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="modal-body" style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
          {custTxns.map((t) => {
            const txnTime = formatTxnTime(t);
            return (
              <div 
                key={t.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 14px', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px', 
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--success)' }}>
                      ₹{Number(t.amount || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="badge badge-active" style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {t.paymentMode || t.mode || 'Cash'}
                    </span>
                    {t.branch && (
                      <span className="badge" style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: t.branch === 'Branch 2' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: t.branch === 'Branch 2' ? '#ea580c' : '#2563eb', fontWeight: '700' }}>
                        {t.branch}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>📅 {formatDisplayDate(t.date)}</span>
                    {txnTime && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '700', color: '#1e293b' }}>
                        <Clock size={11} style={{ color: '#4f46e5' }} />
                        <span>{txnTime}</span>
                      </span>
                    )}
                  </div>
                  {t.note && (
                    <div style={{ fontSize: '11px', color: 'var(--primary)', fontStyle: 'italic', marginTop: '3px' }}>
                      💬 {t.note}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className="badge" style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} />
                    <span>{isMarathi ? 'यशस्वी' : 'Received'}</span>
                  </span>
                </div>
              </div>
            );
          })}

          {/* If no transactions found in log, but customer has deposited amount from initial joining */}
          {custTxns.length === 0 && Number(customer.deposited || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: '1px solid #bbf7d0', borderRadius: '10px', backgroundColor: '#f0fdf4' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--success)' }}>
                  ₹{Number(customer.deposited).toLocaleString('en-IN')} (Cash)
                </div>
                <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
                  📅 {formatDisplayDate(customer.joinDate)} — {isMarathi ? 'जॉइनिंग ठेव रक्कम (Initial Deposit)' : 'Joining Deposit'}
                </div>
              </div>
              <span className="badge" style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '700' }}>
                {isMarathi ? 'नोंदवलेले' : 'Recorded'}
              </span>
            </div>
          )}

          {custTxns.length === 0 && (!customer.deposited || Number(customer.deposited) === 0) && (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💳</div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>
                {isMarathi ? 'कोणताही जमा इतिहास सापडला नाही.' : 'No payment transactions recorded yet.'}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                {isMarathi ? 'या ग्राहकाने अद्याप कोणतेही पेमेंट जमा केलेले नाही.' : 'This member has not made any payments yet.'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            {categoryLabel} • {isMarathi ? `${custTxns.length > 0 ? custTxns.length : (Number(customer.deposited || 0) > 0 ? 1 : 0)} व्यवहार` : `${custTxns.length > 0 ? custTxns.length : (Number(customer.deposited || 0) > 0 ? 1 : 0)} transactions`}
          </div>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '8px' }}>
            {isMarathi ? 'बंद करा' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
