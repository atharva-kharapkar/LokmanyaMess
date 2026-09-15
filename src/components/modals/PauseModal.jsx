import React, { useState, useEffect } from 'react';
import { PauseCircle, PlayCircle, X } from 'lucide-react';
import { todayStr } from '../../utils/formatters';

export default function PauseModal({
  isOpen,
  onClose,
  customer,
  onSavePause,
  onSaveResume,
  isMarathi = false
}) {
  if (!isOpen || !customer) return null;

  const isAlreadyPaused = Boolean(customer.isPaused);
  const [pauseStartDate, setPauseStartDate] = useState(customer.pauseStartDate || todayStr());
  const [pauseReason, setPauseReason] = useState(customer.pauseReason || '');

  useEffect(() => {
    if (isOpen && customer) {
      setPauseStartDate(customer.pauseStartDate || todayStr());
      setPauseReason(customer.pauseReason || '');
    }
  }, [isOpen, customer]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isAlreadyPaused) {
      onSaveResume(customer);
    } else {
      onSavePause(customer, pauseStartDate, pauseReason);
    }
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--card)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAlreadyPaused ? (
              <>
                <PlayCircle size={22} style={{ color: '#10B981' }} />
                <span>{isMarathi ? 'प्लॅन पुन्हा सुरू करा (Resume)' : 'Resume Customer Plan'}</span>
              </>
            ) : (
              <>
                <PauseCircle size={22} style={{ color: '#8B5CF6' }} />
                <span>{isMarathi ? 'प्लॅन सुट्टीवर ठेवा (Pause Plan)' : 'Pause Customer Plan'}</span>
              </>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg)', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#000000' }}>👤 {customer.name}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#000000', marginTop: '2px' }}>📞 {customer.phone}</div>
          </div>

          {isAlreadyPaused ? (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.5', margin: 0 }}>
                {isMarathi
                  ? `हा प्लॅन ${customer.pauseStartDate || ''} पासून सुट्टीवर आहे. आता पुन्हा सुरू केल्यास सुट्टीचे सर्व दिवस प्लॅनच्या मूळ मुदतीमध्ये (Expiry Date) आपोआप वाढवले जातील.`
                  : `This plan has been paused since ${customer.pauseStartDate || ''}. Resuming now will extend the plan duration by the exact number of paused days.`}
              </p>
              {customer.pauseReason && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  📌 {isMarathi ? 'कारण:' : 'Reason:'} {customer.pauseReason}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  {isMarathi ? 'सुट्टी सुरू झालेली तारीख *' : 'Pause Start Date *'}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={pauseStartDate}
                  onChange={(e) => setPauseStartDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  {isMarathi ? 'कारण / टीप (ऐच्छिक)' : 'Reason / Note (Optional)'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={isMarathi ? 'उदा. गावाला गेला आहे' : 'e.g. Gone to hometown'}
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }}
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: '1px solid var(--border)' }}
            >
              {isMarathi ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              className={isAlreadyPaused ? 'btn btn-success' : 'btn btn-primary'}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                backgroundColor: isAlreadyPaused ? '#10B981' : '#8B5CF6',
                color: '#ffffff',
                border: 'none'
              }}
            >
              {isAlreadyPaused
                ? (isMarathi ? '▶️ पुन्हा सुरू करा' : '▶️ Resume Plan')
                : (isMarathi ? '⏸️ सुट्टीवर ठेवा' : '⏸️ Confirm Pause')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
