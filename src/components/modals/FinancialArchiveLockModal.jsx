import React, { useRef, useEffect } from 'react';
import { Lock, X } from 'lucide-react';

export default function FinancialArchiveLockModal({
  isOpen,
  onClose,
  pinInput,
  setPinInput,
  pinError,
  setPinError,
  onSubmit,
  isMarathi
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="modal-card animate-scale" style={{ maxWidth: '400px', width: '100%', backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', padding: '24px', position: 'relative' }}>
        <button
          type="button"
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(216, 90, 48, 0.12)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <Lock size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text)' }}>
            {isMarathi ? 'मागील महिन्यांचे रेकॉर्ड्स लॉक आहेत' : 'Past Months Financials Locked'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
            {isMarathi
              ? 'मागील महिन्यांचे जमा किंवा खर्चाचे रेकॉर्ड्स पाहण्यासाठी कृपया मालक PIN टाका.'
              : 'Please enter the Owner PIN to unlock past months\' financial records.'}
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <input
            ref={inputRef}
            type="password"
            className="form-input"
            maxLength="6"
            placeholder="••••••"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value.slice(0, 6));
              if (pinError && setPinError) setPinError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            autoFocus
            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', marginBottom: '16px', padding: '12px', width: '100%', borderRadius: '10px' }}
          />

          {pinError && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
              {pinError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', fontWeight: '600' }}
            >
              {isMarathi ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px', fontWeight: '700' }}
            >
              {isMarathi ? 'अनलॉक करा' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
