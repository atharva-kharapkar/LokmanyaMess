import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Calendar, Phone, MapPin, IndianRupee, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { todayStr, formatDisplayDate, getCustomerDues } from '../../utils/helpers';

export default function RestoreCustomerModal({
  isOpen,
  onClose,
  customer,
  onConfirmRestore,
  isMarathi = false
}) {
  const [startDate, setStartDate] = useState(todayStr());
  const [pendingDues, setPendingDues] = useState('0');
  const [planAmount, setPlanAmount] = useState('0');

  useEffect(() => {
    if (isOpen && customer) {
      setStartDate(todayStr());
      const initialDues = customer.archivedDues !== undefined
        ? Number(customer.archivedDues)
        : (typeof getCustomerDues === 'function' ? getCustomerDues(customer) : 0);
      setPendingDues(String(Math.max(0, initialDues)));
      setPlanAmount(String(customer.amount || 0));
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const categoryLabel = customer.category === 'tiffin'
    ? (isMarathi ? '📦 टिफिन डिलिव्हरी' : '📦 Tiffin Delivery')
    : customer.category === 'shortterm'
      ? (isMarathi ? '⚡ अल्पमुदत' : '⚡ Short-Term')
      : (isMarathi ? '🍽️ डाईन इन' : '🍽️ Dine In');

  const numPendingDues = Math.max(0, Number(pendingDues) || 0);
  const numPlanAmount = Math.max(0, Number(planAmount) || 0);
  const totalInitialDues = numPendingDues + numPlanAmount;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!startDate) return;
    onConfirmRestore(customer, startDate, numPendingDues, numPlanAmount);
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
          maxWidth: '500px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: 'var(--card)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
          color: 'var(--text)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                {isMarathi ? 'ग्राहक पुन्हा सुरू करा' : 'Restore Customer'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {isMarathi ? 'जुना ग्राहक मूळ विभागात नव्याने सक्रिय करा' : 'Reactivate customer account with new cycle'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-icon"
            style={{ borderRadius: '50%', width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Customer Details Summary Card */}
        <div style={{
          backgroundColor: 'var(--bg)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '16px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>
              {customer.name}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: customer.category === 'tiffin' ? '#EFF6FD' : '#FDF1ED',
              color: customer.category === 'tiffin' ? '#1D4ED8' : '#C2410C',
              border: '1px solid var(--border)'
            }}>
              {categoryLabel}
            </span>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={13} style={{ color: '#EF4444' }} /> {customer.phone || 'N/A'}
          </div>

          {(customer.addr || customer.area) && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} style={{ color: '#EC4899' }} /> {customer.addr || customer.area}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border)', paddingTop: '6px', marginTop: '2px' }}>
            <span>{isMarathi ? 'प्लॅन' : 'Plan'}: <strong>{customer.plan || 'Monthly'}</strong></span>
            <span>{isMarathi ? 'नोंदणीकृत मासिक शुल्क' : 'Registered Fee'}: <strong>₹{customer.amount || 0}</strong></span>
          </div>
        </div>

        {/* Form: Start Date & Editable Amount */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Field 1: New Start Date */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
              <Calendar size={14} style={{ color: 'var(--primary)' }} />
              {isMarathi ? 'नवीन सुरू झालेली तारीख (New Start Date) *' : 'New Start Date *'}
            </label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: '600'
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {isMarathi
                ? 'आजच्या तारखेपासून किंवा निवडलेल्या तारखेपासून ग्राहकाचा नवीन महिना सुरू होईल.'
                : 'Customer subscription cycle starts fresh from this date.'}
            </div>
          </div>

          {/* Field 2: Previous Pending Dues (Pre-filled & Editable) */}
          <div style={{
            backgroundColor: numPendingDues > 0 ? '#FFFBEB' : '#F0FDF4',
            border: numPendingDues > 0 ? '1.5px solid #FCD34D' : '1.5px solid #BBF7D0',
            borderRadius: '12px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '800',
                color: numPendingDues > 0 ? '#92400E' : '#166534',
                margin: 0
              }}>
                <IndianRupee size={15} />
                {isMarathi ? 'मागील बाकी / पूर्वनोंद थकीत रक्कम (₹)' : 'Previous Pending Dues (₹) *'}
              </label>
              {numPendingDues > 0 && (
                <button
                  type="button"
                  onClick={() => setPendingDues('0')}
                  style={{
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #D97706',
                    color: '#B45309',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={isMarathi ? 'मागील बाकी माफ करून ० करा' : 'Clear debt to ₹0'}
                >
                  <RefreshCw size={11} />
                  {isMarathi ? 'बाकी ० करा (Clear)' : 'Set to ₹0'}
                </button>
              )}
            </div>

            <input
              type="number"
              min="0"
              step="any"
              className="form-input"
              value={pendingDues}
              onChange={(e) => setPendingDues(e.target.value)}
              placeholder="0"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: numPendingDues > 0 ? '1.5px solid #F59E0B' : '1.5px solid #16A34A',
                backgroundColor: 'var(--card)',
                color: 'var(--text)',
                fontSize: '18px',
                fontWeight: '800'
              }}
            />

            <div style={{
              fontSize: '12px',
              marginTop: '6px',
              lineHeight: '1.4',
              color: numPendingDues > 0 ? '#B45309' : '#15803D'
            }}>
              {numPendingDues > 0 ? (
                <>
                  ⚠️ {isMarathi
                    ? 'या ग्राहकाची आधीची थकीत बाकी प्री-फिल झाली आहे. जर ही रक्कम माफ करून नव्याने खाते सुरू करायचे असेल, तर वरील रक्कम ० (शून्य) करा.'
                    : 'Customer has past dues pre-filled. If you wish to waive this old debt and start fresh, change this amount to 0.'}
                </>
              ) : (
                <>
                  ✨ {isMarathi
                    ? 'मागील बाकी ० (शून्य) आहे. ग्राहकाचा नवीन महिना कोणत्याही जुन्या कर्जाशिवाय सुरू होईल!'
                    : 'No past debt. The customer will start fresh with ₹0 old balance!'}
                </>
              )}
            </div>
          </div>

          {/* Field 3: Monthly Fee (Editable) */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
              <IndianRupee size={14} style={{ color: 'var(--primary)' }} />
              {isMarathi ? 'चालू महिन्याचे प्लॅन शुल्क (Monthly Plan Fee ₹) *' : 'Monthly Plan Fee (₹) *'}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="form-input"
              value={planAmount}
              onChange={(e) => setPlanAmount(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--border)',
                backgroundColor: 'var(--card)',
                color: 'var(--text)',
                fontSize: '15px',
                fontWeight: '700'
              }}
            />
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {isMarathi
                ? 'या ग्राहकाचे नवीन महिन्याचे नियमित शुल्क (आवश्यक असल्यास बदलू शकता).'
                : 'Regular subscription fee for the restored customer.'}
            </div>
          </div>

          {/* Dues Breakdown Summary Card */}
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '10px',
            padding: '12px 14px',
            border: '1px solid var(--border)',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{isMarathi ? 'मागील बाकी (Past Dues):' : 'Past Dues:'}</span>
              <strong style={{ color: numPendingDues > 0 ? '#DC2626' : '#16A34A' }}>
                ₹{numPendingDues.toLocaleString('en-IN')}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{isMarathi ? 'नवीन महिना शुल्क (New Month Fee):' : 'New Month Fee:'}</span>
              <strong>₹{numPlanAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px dashed var(--border)',
              paddingTop: '6px',
              marginTop: '2px',
              fontSize: '14px',
              fontWeight: '800'
            }}>
              <span>{isMarathi ? 'सुरुवातीची एकूण बाकी (Total Initial Dues):' : 'Total Initial Dues:'}</span>
              <span style={{ color: totalInitialDues > 0 ? '#DC2626' : '#16A34A' }}>
                ₹{totalInitialDues.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: '600' }}
            >
              {isMarathi ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn btn-success"
              style={{
                padding: '9px 22px',
                borderRadius: '8px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={15} />
              {isMarathi ? 'पुनर्संचयित करा' : 'Confirm Restore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
