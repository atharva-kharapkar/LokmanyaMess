import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Calendar, User, Phone, MapPin } from 'lucide-react';
import { todayStr, formatDisplayDate } from '../../utils/helpers';

export default function RestoreCustomerModal({
  isOpen,
  onClose,
  customer,
  onConfirmRestore,
  isMarathi = false
}) {
  const [startDate, setStartDate] = useState(todayStr());

  useEffect(() => {
    if (isOpen) {
      setStartDate(todayStr());
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const categoryLabel = customer.category === 'tiffin'
    ? (isMarathi ? '📦 टिफिन डिलिव्हरी' : '📦 Tiffin Delivery')
    : customer.category === 'shortterm'
      ? (isMarathi ? '⚡ अल्पमुदत' : '⚡ Short-Term')
      : (isMarathi ? '🍽️ डाईन इन' : '🍽️ Dine In');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!startDate) return;
    onConfirmRestore(customer, startDate);
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
          color: 'var(--text)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
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
                {isMarathi ? 'जुना ग्राहक मूळ विभागात सक्रिय करा' : 'Reactivate customer in original section'}
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
          gap: '8px'
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

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border)', paddingTop: '6px', marginTop: '4px' }}>
            <span>{isMarathi ? 'प्लॅन' : 'Plan'}: <strong>{customer.plan || 'Monthly'}</strong></span>
            <span>{isMarathi ? 'शुल्क' : 'Fee'}: <strong>₹{customer.amount || 0}</strong></span>
          </div>
        </div>

        {/* Notice */}
        <div style={{
          fontSize: '12px',
          lineHeight: '1.4',
          color: '#0369A1',
          backgroundColor: '#F0F9FF',
          border: '1px solid #BAE6FD',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '16px'
        }}>
          ℹ️ {isMarathi
            ? 'ग्राहकाची सर्व माहिती (नाव, पत्ता, फोटो, प्लॅन) सुरक्षित राहील आणि हा ग्राहक थेट त्याच्या मूळ विभागात सक्रिय होईल.'
            : 'All profile details (name, photo, address, plan) remain intact. The customer will be restored to their original section.'}
        </div>

        {/* Form: New Start Date */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
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
                ? 'आजच्या तारखेपासून किंवा इच्छित तारखेपासून नवीन सायकल सुरू करा.'
                : 'Defaults to today. Subscription cycle will start from this date with ₹0 deposited.'}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}
            >
              {isMarathi ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn btn-success"
              style={{
                padding: '8px 20px',
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
