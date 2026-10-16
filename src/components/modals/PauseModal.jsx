import React, { useState, useEffect } from 'react';
import { PauseCircle, PlayCircle, X, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { todayStr, toLocalYYYYMMDD, formatDisplayDate } from '../../utils/formatters';
import { getExpiryDate, parseLocalDate } from '../../utils/helpers';

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

  // Calculate elapsed pause days
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const pauseStart = customer.pauseStartDate ? parseLocalDate(customer.pauseStartDate) : todayMidnight;
  const elapsedPauseDays = Math.max(0, Math.round((todayMidnight - pauseStart) / 86400000));

  // Compute base expiry (if 0 days added / original expiry maintained)
  const baseExpiryObj = getExpiryDate({ ...customer, isPaused: false, customExpiryDate: null });
  const baseExpiryStr = toLocalYYYYMMDD(baseExpiryObj);

  // Compute extended expiry (if all elapsed pause days are added)
  const extendedExpiryObj = new Date(baseExpiryObj);
  extendedExpiryObj.setDate(baseExpiryObj.getDate() + elapsedPauseDays);
  const extendedExpiryStr = toLocalYYYYMMDD(extendedExpiryObj);

  // Initial resume expiry date recommendation:
  // If customer returned in < 5 days, default to baseExpiryStr (0 days added as per mess rule)
  // If customer was away >= 5 days, default to extendedExpiryStr (+elapsedPauseDays)
  const initialDefaultExp = elapsedPauseDays >= 5 ? extendedExpiryStr : baseExpiryStr;
  const [resumeExpiryDate, setResumeExpiryDate] = useState(initialDefaultExp);
  const [addedDays, setAddedDays] = useState(elapsedPauseDays >= 5 ? elapsedPauseDays : 0);

  useEffect(() => {
    if (isOpen && customer) {
      setPauseStartDate(customer.pauseStartDate || todayStr());
      setPauseReason(customer.pauseReason || '');

      const t = new Date();
      const tMid = new Date(t.getFullYear(), t.getMonth(), t.getDate());
      const pStart = customer.pauseStartDate ? parseLocalDate(customer.pauseStartDate) : tMid;
      const days = Math.max(0, Math.round((tMid - pStart) / 86400000));

      const bExp = getExpiryDate({ ...customer, isPaused: false, customExpiryDate: null });
      const bExpStr = toLocalYYYYMMDD(bExp);

      const extExp = new Date(bExp);
      extExp.setDate(bExp.getDate() + days);
      const extExpStr = toLocalYYYYMMDD(extExp);

      const initExp = days >= 5 ? extExpStr : bExpStr;
      setResumeExpiryDate(initExp);
      setAddedDays(days >= 5 ? days : 0);
    }
  }, [isOpen, customer]);

  const handleDateChange = (val) => {
    setResumeExpiryDate(val);
    if (val) {
      const targetDate = parseLocalDate(val);
      const diff = Math.round((targetDate - baseExpiryObj) / 86400000);
      setAddedDays(Math.max(0, diff));
    }
  };

  const handleSelectZeroDays = () => {
    setResumeExpiryDate(baseExpiryStr);
    setAddedDays(0);
  };

  const handleSelectFullDays = () => {
    setResumeExpiryDate(extendedExpiryStr);
    setAddedDays(elapsedPauseDays);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isAlreadyPaused) {
      onSaveResume(customer, resumeExpiryDate, addedDays);
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
          maxWidth: '460px',
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
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg)', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#000000' }}>👤 {customer.name}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#000000', marginTop: '2px' }}>📞 {customer.phone}</div>
          </div>

          {isAlreadyPaused ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {/* Leave Info Box */}
              <div 
                style={{ 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '10px', 
                  padding: '12px 14px', 
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>
                    {isMarathi ? 'सुट्टी सुरू तारीख:' : 'Pause Start Date:'}
                  </span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>
                    📅 {formatDisplayDate(customer.pauseStartDate || todayStr())}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>
                    {isMarathi ? 'आज परत आला (Resume):' : 'Returned Today (Resume):'}
                  </span>
                  <span style={{ fontWeight: '700', color: '#1e293b' }}>
                    📅 {formatDisplayDate(todayStr())}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>
                    {isMarathi ? 'एकूण सुट्टीचे दिवस:' : 'Total Paused Days:'}
                  </span>
                  <span style={{ fontWeight: '800', color: '#7c3aed', backgroundColor: '#f5f3ff', padding: '2px 8px', borderRadius: '6px' }}>
                    ⏱️ {elapsedPauseDays} {isMarathi ? 'दिवस' : 'days'}
                  </span>
                </div>

                {customer.pauseReason && (
                  <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                    📌 {isMarathi ? 'कारण:' : 'Reason:'} {customer.pauseReason}
                  </div>
                )}
              </div>

              {/* Notice for 5-day rule if returned early */}
              {elapsedPauseDays < 5 && (
                <div 
                  style={{ 
                    backgroundColor: '#fffbeb', 
                    border: '1px solid #fde68a', 
                    borderRadius: '8px', 
                    padding: '8px 12px', 
                    fontSize: '12px', 
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, color: '#d97706' }} />
                  <span>
                    {isMarathi 
                      ? `ग्राहक ५ दिवसांच्या आत परत आला आहे. मेसच्या नियमानुसार दिवस वाढवले जात नाहीत (मूळ तारीख कायम राहील).` 
                      : `Customer returned in less than 5 days. As per mess rules, plan days are not extended (original expiry preserved).`}
                  </span>
                </div>
              )}

              {/* Expiry Date Control & Quick Buttons */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', marginBottom: '8px', color: 'var(--text)' }}>
                  🎯 {isMarathi ? 'मुदत समाप्ती तारीख (Expiry Date बदला / निवडा) *' : 'Plan Expiry Date (Edit / Choose) *'}
                </label>

                {/* Quick Action Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={handleSelectZeroDays}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: addedDays === 0 ? '2px solid #059669' : '1px solid #cbd5e1',
                      backgroundColor: addedDays === 0 ? '#ecfdf5' : '#ffffff',
                      color: addedDays === 0 ? '#065f46' : '#475569',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>⚡ {isMarathi ? '० दिवस वाढवा' : 'Add 0 Days'}</span>
                    <span style={{ fontSize: '11px', fontWeight: '800' }}>
                      ({formatDisplayDate(baseExpiryStr)})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectFullDays}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: addedDays === elapsedPauseDays && elapsedPauseDays > 0 ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                      backgroundColor: addedDays === elapsedPauseDays && elapsedPauseDays > 0 ? '#f5f3ff' : '#ffffff',
                      color: addedDays === elapsedPauseDays && elapsedPauseDays > 0 ? '#5b21b6' : '#475569',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>➕ {isMarathi ? `+${elapsedPauseDays} दिवस वाढवा` : `Add +${elapsedPauseDays} Days`}</span>
                    <span style={{ fontSize: '11px', fontWeight: '800' }}>
                      ({formatDisplayDate(extendedExpiryStr)})
                    </span>
                  </button>
                </div>

                {/* Manual Calendar Date Picker Input */}
                <input
                  type="date"
                  className="form-input"
                  value={resumeExpiryDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #6366f1',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#1e1b4b',
                    backgroundColor: '#ffffff'
                  }}
                />

                {/* Live Status Summary */}
                <div 
                  style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    backgroundColor: addedDays === 0 ? '#ecfdf5' : '#eff6ff', 
                    border: `1px solid ${addedDays === 0 ? '#a7f3d0' : '#bfdbfe'}`,
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: addedDays === 0 ? '#065f46' : '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                  <span>
                    {addedDays === 0
                      ? (isMarathi 
                          ? `नियम लागू: ० दिवस वाढवले — मूळ मुदत ${formatDisplayDate(baseExpiryStr)} कायम राहील.` 
                          : `Rule applied: 0 days added — Original expiry ${formatDisplayDate(baseExpiryStr)} kept.`)
                      : (isMarathi 
                          ? `+${addedDays} दिवस वाढवले — नवीन मुदत: ${formatDisplayDate(resumeExpiryDate)}` 
                          : `+${addedDays} days added — New expiry: ${formatDisplayDate(resumeExpiryDate)}`)}
                  </span>
                </div>
              </div>
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
