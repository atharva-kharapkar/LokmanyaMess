import React, { memo } from 'react';
import { Phone, MapPin, Edit, Trash2, History, RotateCcw, PauseCircle, PlayCircle } from 'lucide-react';
import { getMealTypeLabel, getMealSlotLabel } from '../../utils/mealConfig';
import CustomerAreaBadge from '../CustomerAreaBadge';
import { formatDisplayDate } from '../../utils/formatters';

const CustomerCard = memo(function CustomerCard({
  customer,
  status,
  remaining,
  hasDues,
  displayedDeposited,
  warningDays,
  daysPendingDues,
  shouldShowDuesWarning,
  expiryStrVal,
  lang,
  role,
  currentTab,
  PLAN_DAYS,
  t,
  onEnlargePhoto,
  onOpenPayModal,
  onOpenHistoryModal,
  onSendWhatsAppReminder,
  onOpenEditCust,
  onDeleteCustomer,
  onRestoreCustomer,
  onOpenPauseModal
}) {
  const c = customer;
  const isMarathi = lang === 'mr';

  return (
    <div key={c.id} className={`customer-bar status-${status} ${hasDues ? 'has-dues' : 'no-dues'}`}>
      {/* Column 1: Profile Photo */}
      <div 
        className="customer-bar-avatar-container" 
        style={{ cursor: 'pointer', border: '1.5px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', width: '140px', height: '140px', flexShrink: 0 }}
        onClick={() => typeof onEnlargePhoto === 'function' && onEnlargePhoto({ url: c.photo || '', name: c.name || 'Customer' })}
        title={isMarathi ? 'फोटो मोठा करा' : 'Click to enlarge'}
      >
        {c.photo ? (
          <img 
            src={c.photo} 
            className="customer-bar-avatar" 
            alt={c.name} 
            style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover', border: 'none', boxShadow: 'none' }} 
          />
        ) : (
          <div className="customer-bar-avatar-placeholder" style={{ width: '100%', height: '100%', borderRadius: '8px', border: 'none', backgroundColor: 'var(--border)', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: '800' }}>
            {(c.name || 'C').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Column 2: Basic Info */}
      <div className="customer-bar-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: 'center' }}>
        <div 
          className="customer-bar-name"
          style={{ 
            fontSize: '20px',
            color: shouldShowDuesWarning ? '#FF0000' : '#111827', 
            fontWeight: '800',
            textTransform: 'capitalize'
          }}
        >
          {c.name}
        </div>
        {shouldShowDuesWarning && (
          <div style={{ color: '#ff1e1e', fontSize: '16px', fontWeight: '900', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ⚠️ {isMarathi 
              ? `मागील ${daysPendingDues} दिवसांपासून थकीत रक्कम बाकी आहे` 
              : `Due is pending from last ${daysPendingDues} days`}
          </div>
        )}
        <div className="customer-bar-subinfo" style={{ display: 'flex', alignItems: 'center', fontSize: '15px', color: '#000000', fontWeight: '800', marginTop: '3px' }}>
          <Phone size={14} style={{ color: '#EF4444', marginRight: '6px', flexShrink: 0 }} /> {c.phone}
        </div>
        <div className="customer-bar-subinfo" style={{ display: 'flex', alignItems: 'center', fontSize: '15px', color: '#000000', fontWeight: '800', marginTop: '3px' }}>
          <MapPin size={14} style={{ color: '#EC4899', marginRight: '6px', flexShrink: 0 }} /> {c.addr || c.area || 'Amravati'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
          <CustomerAreaBadge area={c.area} />
          <span style={{ 
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: c.category === 'tiffin' ? '#EFF6FD' : c.category === 'shortterm' ? '#FDF7EC' : '#FDF1ED',
            color: c.category === 'tiffin' ? '#1D4ED8' : c.category === 'shortterm' ? '#B45309' : '#C2410C',
            border: `1px solid ${c.category === 'tiffin' ? '#BFDBFE' : c.category === 'shortterm' ? '#FDE68A' : '#FFEDD5'}`
          }}>
            {c.category === 'tiffin' ? (isMarathi ? '📦 टिफिन डिलिव्हरी' : '📦 Tiffin Delivery') : c.category === 'shortterm' ? (isMarathi ? '⚡ अल्पमुदत' : '⚡ Short-Term') : (isMarathi ? '🍽️ डाईन इन' : '🍽️ Dine In')}
          </span>
          {c.isPaused && (
            <span style={{ 
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              backgroundColor: '#EDE9FE',
              color: '#6D28D9',
              border: '1px solid #C4B5FD'
            }}>
              ⏸️ {isMarathi ? `सुट्टीवर (${formatDisplayDate(c.pauseStartDate)} पासून)` : `PAUSED (Leave since ${formatDisplayDate(c.pauseStartDate)})`}
            </span>
          )}
        </div>
      </div>

      {/* Column 3: Plan Details */}
      <div className="customer-bar-plan" style={{ display: 'flex', flexDirection: 'column', alignSelf: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
          PLAN & CYCLE
        </div>
        <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>
          {c.category === 'shortterm' 
            ? (isMarathi 
                ? `शॉर्ट-टर्म (${c.shortTermDays || '10'} दिवस)` 
                : `Short-Term (${c.shortTermDays || '10'} Days)`)
            : (c.plan === 'Monthly' 
                ? t('monthly30') 
                : c.plan === 'Weekly' 
                  ? t('weekly7') 
                  : c.plan === 'Daily' 
                    ? t('daily1') 
                    : t('custom'))
          }
        </div>
        <div style={{ fontSize: '13px', color: '#111827', fontWeight: '600', marginBottom: '4px' }}>
          Started: {formatDisplayDate(c.joinDate)}
        </div>
        <div style={{ fontSize: '13px', color: '#111827', fontWeight: '600' }}>
          Expires: {formatDisplayDate(expiryStrVal)}
        </div>
      </div>

      {/* Column 4: Upside Meal Badge Slot & Financial Box */}
      <div className="customer-bar-financial-column" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignSelf: 'center', width: '100%' }}>
        {(() => {
          const typeLabel = getMealTypeLabel(c.mealType || c.mealSelection || c.tiffinPlan, lang);
          const slotLabel = getMealSlotLabel(c.mealSlot, lang);
          const badgeItems = [typeLabel, slotLabel].filter(Boolean);
          if (!badgeItems.length) return null;
          return (
            <div style={{ 
              backgroundColor: '#FEF2F2', 
              color: '#DC2626', 
              border: '1.5px solid #FCA5A5', 
              padding: '4px 12px', 
              borderRadius: '8px', 
              fontSize: '16px', 
              fontWeight: '800', 
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              width: 'fit-content',
              alignSelf: 'flex-start'
            }}>
              🍱 {badgeItems.join(' • ')}
            </div>
          );
        })()}
        
        <div className="customer-bar-financials">
          <div className="financial-col">
            <span className="customer-bar-label" style={{ fontSize: '10px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase' }}>SUBSCRIPTION FEE</span>
            <span className="customer-bar-val" style={{ fontSize: '20px', fontWeight: '800', color: '#111827' }}>₹{c.amount}</span>
          </div>
          <div className="financial-col">
            <span className="customer-bar-label" style={{ fontSize: '10px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase' }}>DEPOSITED</span>
            <span className="customer-bar-val" style={{ fontSize: '20px', fontWeight: '800', color: '#008000' }}>₹{displayedDeposited}</span>
          </div>
          <div className="financial-col">
            <span className="customer-bar-label" style={{ fontSize: '10px', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase' }}>REMAINING AMOUNT</span>
            {hasDues ? (
              <span className="customer-bar-val" style={{ fontSize: '20px', fontWeight: '800', color: '#FF0000', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                ₹{remaining} <span style={{ fontSize: '14px', color: '#F59E0B' }} title="Dues Pending">⚠️</span>
              </span>
            ) : (
              <span className="customer-bar-val" style={{ fontSize: '20px', fontWeight: '800', color: '#008000' }}>
                ₹0
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Column 5: Status Pills & Action Buttons */}
      <div className="customer-bar-actions-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div className="badge-row" style={{ display: 'flex', gap: '6px', marginBottom: '2px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {c.status === 'old' ? (
            <span style={{ backgroundColor: '#E5E7EB', color: '#374151', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
              Archived
            </span>
          ) : (
            <span style={{ 
              backgroundColor: status === 'active' ? '#D1FAE5' : '#FEE2E2', 
              color: status === 'active' ? '#065F46' : '#B91C1C', 
              padding: '4px 10px', 
              borderRadius: '9999px', 
              fontSize: '11px', 
              fontWeight: '700', 
              textTransform: 'uppercase' 
            }}>
              {status === 'active' ? (isMarathi ? 'सक्रिय' : 'Active') : (isMarathi ? 'मुदत संपली' : 'Expired')}
            </span>
          )}
          <span style={{ 
            backgroundColor: hasDues ? '#DBEAFE' : '#D1FAE5', 
            color: hasDues ? '#1E3A8A' : '#065F46', 
            padding: '4px 10px', 
            borderRadius: '9999px', 
            fontSize: '11px', 
            fontWeight: '700', 
            textTransform: 'uppercase' 
          }}>
            {hasDues ? (isMarathi ? 'थकबाकी' : 'Dues Pending') : (isMarathi ? 'पूर्ण भरले' : 'Fully Paid')}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '240px' }}>
          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
            {c.status === 'old' && role === 'owner' ? (
              <button
                className="btn btn-sm btn-success"
                title={isMarathi ? 'पुनर्संचयित करा' : 'Restore Customer'}
                onClick={() => onRestoreCustomer(c.id)}
                style={{ flex: 1, height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <RotateCcw size={14} />
                <span>{isMarathi ? 'पुनर्संचयित' : 'Restore'}</span>
              </button>
            ) : (
              <>
                <button 
                  className="btn btn-sm btn-success"
                  style={{ flex: 1, height: '32px', fontSize: '12px', fontWeight: '800' }}
                  onClick={() => onOpenPayModal(c)}
                >
                  ₹ {isMarathi ? 'जमा' : 'Pay'}
                </button>
                <button 
                  className="btn btn-sm"
                  style={{ flex: 1, height: '32px', fontSize: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
                  onClick={() => onOpenHistoryModal(c)}
                >
                  <History size={14} style={{ marginRight: '4px' }} />
                  {isMarathi ? 'इतिहास' : 'History'}
                </button>
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
            <button 
              className="btn btn-sm"
              style={{ flex: 1, height: '32px', fontSize: '11px', backgroundColor: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '0 4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              onClick={() => onSendWhatsAppReminder(c)}
              title={isMarathi ? 'WhatsApp आठवण पाठवा' : 'Send WhatsApp Reminder'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>WhatsApp</span>
            </button>
            <button 
              className="btn btn-sm btn-icon"
              title={isMarathi ? 'प्रोफाइल बदला' : 'Edit Profile'}
              onClick={() => onOpenEditCust(c)}
              style={{ width: '32px', height: '32px' }}
            >
              <Edit size={14} />
            </button>
            <button
              className="btn btn-sm btn-icon"
              title={c.isPaused ? (isMarathi ? 'प्लॅन पुन्हा सुरू करा (Resume)' : 'Resume Plan') : (isMarathi ? 'प्लॅन सुट्टीवर ठेवा (Pause)' : 'Pause Plan')}
              onClick={() => onOpenPauseModal && onOpenPauseModal(c)}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: c.isPaused ? '#ECFDF5' : '#F5F3FF',
                color: c.isPaused ? '#059669' : '#7C3AED',
                border: `1px solid ${c.isPaused ? '#A7F3D0' : '#DDD6FE'}`
              }}
            >
              {c.isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
            </button>
            {(role === 'owner' || role === 'branch1' || role === 'branch2') && (
              <button 
                className="btn btn-sm btn-icon btn-danger"
                title={isMarathi ? 'ग्राहक हटवा' : 'Delete Customer'}
                onClick={() => onDeleteCustomer(c.id)}
                style={{ width: '32px', height: '32px' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomerCard;
