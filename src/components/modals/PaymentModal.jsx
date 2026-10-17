import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { todayStr, formatDisplayDate } from '../../utils/helpers';

export default function PaymentModal({
  isOpen = true,
  customer,
  amount,
  payAmount,
  setAmount,
  setPayAmount,
  date,
  payDate,
  setDate,
  setPayDate,
  mode,
  payMode,
  setMode,
  setPayMode,
  note,
  payNote,
  setNote,
  setPayNote,
  isSaving,
  isSavingPayment,
  onSave,
  onSubmit,
  onClose,
  db = { settings: {} },
  lang = 'en',
  getCustomerDues
}) {
  if (!isOpen || !customer) return null;

  const isMarathi = (db.settings && db.settings.lang === 'mr') || lang === 'mr';
  const savingState = isSaving || isSavingPayment;

  // Encapsulated Local State prevents full app re-renders on every keystroke
  const [localAmount, setLocalAmount] = useState(() => {
    return amount !== undefined && amount !== '' 
      ? String(amount) 
      : (payAmount !== undefined && payAmount !== '' ? String(payAmount) : '');
  });
  const [localDate, setLocalDate] = useState(() => date || payDate || todayStr());
  const [localMode, setLocalMode] = useState(() => mode || payMode || 'Cash');
  const [localNote, setLocalNote] = useState(() => note || payNote || '');

  // Sync initial state when modal opens or customer changes
  useEffect(() => {
    if (isOpen && customer) {
      const initAmt = amount !== undefined && amount !== '' 
        ? String(amount) 
        : (payAmount !== undefined && payAmount !== '' ? String(payAmount) : '');
      setLocalAmount(initAmt);
      setLocalDate(date || payDate || todayStr());
      setLocalMode(mode || payMode || 'Cash');
      setLocalNote(note || payNote || '');
    }
  }, [isOpen, customer?.id]);

  const handleAmountChange = (val) => {
    const clean = val.replace(/[^\d.]/g, '');
    setLocalAmount(clean);
    if (typeof setAmount === 'function') setAmount(clean);
    if (typeof setPayAmount === 'function') setPayAmount(clean);
  };

  const handleDateChange = (val) => {
    setLocalDate(val);
    if (typeof setDate === 'function') setDate(val);
    if (typeof setPayDate === 'function') setPayDate(val);
  };

  const handleModeChange = (val) => {
    setLocalMode(val);
    if (typeof setMode === 'function') setMode(val);
    if (typeof setPayMode === 'function') setPayMode(val);
  };

  const handleNoteChange = (val) => {
    setLocalNote(val);
    if (typeof setNote === 'function') setNote(val);
    if (typeof setPayNote === 'function') setPayNote(val);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const saveFn = onSave || onSubmit;
    if (typeof saveFn === 'function') {
      saveFn(localAmount, localDate, localMode, localNote);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', padding: '24px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          <span className="modal-title" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text)' }}>
            {isMarathi ? 'पेमेंट नोंदवा' : 'Record Payment'}
          </span>
          <X className="modal-close" style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={onClose} />
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(216, 90, 48, 0.05)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(216, 90, 48, 0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {isMarathi ? 'ग्राहक:' : 'Customer:'}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
                  {customer.name}
                </div>
              </div>
              {typeof getCustomerDues === 'function' && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{isMarathi ? 'थकबाकी' : 'Dues'}</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: getCustomerDues(customer) > 0 ? '#ef4444' : '#10b981' }}>
                    ₹{getCustomerDues(customer)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>{isMarathi ? 'रक्कम (Amount) ₹' : 'Amount ₹'}</label>
              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                value={localAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                required
                autoFocus
                style={{ width: '100%', padding: '10px', fontSize: '18px', fontWeight: '800', borderRadius: '8px', border: '1.5px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--text)' }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>{isMarathi ? 'तारीख (Date)' : 'Date'}</label>
              <input
                type="date"
                className="form-input"
                value={localDate || todayStr()}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--text)' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                {isMarathi ? `स्वरूप: DD/MM/YYYY (${formatDisplayDate(localDate || todayStr())})` : `Format: DD/MM/YYYY (${formatDisplayDate(localDate || todayStr())})`}
              </span>
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>{isMarathi ? 'पेमेंट पद्धत (Mode)' : 'Payment Mode'}</label>
              <select
                className="form-select"
                value={localMode}
                onChange={(e) => handleModeChange(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--text)' }}
              >
                <option value="Cash">{isMarathi ? 'रोख (Cash)' : 'Cash'}</option>
                <option value="UPI">{isMarathi ? 'ऑनलाईन (UPI)' : 'UPI'}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>{isMarathi ? 'टीप (Note)' : 'Note'}</label>
              <input
                type="text"
                className="form-input"
                value={localNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder={isMarathi ? 'उदा. रोख मिळाला, सवलत दिली' : 'e.g. Paid by friend, discount'}
                style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn" onClick={onClose} disabled={savingState} style={{ padding: '8px 16px', borderRadius: '8px' }}>
              {isMarathi ? 'रद्द करा' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-success" disabled={savingState} style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: '700' }}>
              {savingState ? (isMarathi ? 'नोंदवत आहे...' : 'Recording...') : (isMarathi ? 'नोंदवा' : 'Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
