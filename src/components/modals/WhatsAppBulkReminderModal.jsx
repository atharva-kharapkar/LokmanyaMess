import React, { useState, useEffect, useMemo } from 'react';
import { X, Bell } from 'lucide-react';
import { buildCustomerReminderMessage, openWhatsAppWithTypedMessage } from '../../utils/whatsapp';

export default function WhatsAppBulkReminderModal(props) {
  const {
    isBulkReminderOpen = props.isOpen || false,
    setIsBulkReminderOpen = props.onClose || (() => {}),
    customers = props.db?.customers || [],
    settings = props.db?.settings || {},
    showToast = (() => {}),
    getCustomerDues = (() => 0)
  } = props;

  const isOpenModal = Boolean(isBulkReminderOpen || props.isOpen);

  // Self-contained internal state
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkQueueIndex, setBulkQueueIndex] = useState(0);
  const [isQueueProcessing, setIsQueueProcessing] = useState(false);
  const [bulkSearch, setBulkSearch] = useState('');
  const [selectedWhatsAppCustomerIds, setSelectedWhatsAppCustomerIds] = useState([]);

  // Compute due customers list
  const modalDueCustomers = useMemo(() => {
    return (customers || []).filter(c => c.status !== 'archived' && getCustomerDues(c) > 0);
  }, [customers, getCustomerDues]);

  // Compute filtered due customers
  const filteredModalDueCustomers = useMemo(() => {
    if (!bulkSearch) return modalDueCustomers;
    const q = bulkSearch.toLowerCase().trim();
    return modalDueCustomers.filter(c => 
      (c.name || '').toLowerCase().includes(q) || 
      (c.phone || '').includes(q) ||
      (c.area || '').toLowerCase().includes(q)
    );
  }, [modalDueCustomers, bulkSearch]);

  // Reset/Initialize selection when modal opens
  useEffect(() => {
    if (isOpenModal) {
      const allDueIds = modalDueCustomers.map(c => c.id);
      setSelectedWhatsAppCustomerIds(allDueIds);
      setIsQueueProcessing(false);
      setBulkQueue([]);
      setBulkQueueIndex(0);
      setBulkSearch('');
    }
  }, [isOpenModal, modalDueCustomers]);

  const toggleSelectAllBulk = () => {
    const currentFilteredIds = filteredModalDueCustomers.map(c => c.id);
    const allSelected = currentFilteredIds.every(id => selectedWhatsAppCustomerIds.includes(id));

    if (allSelected) {
      setSelectedWhatsAppCustomerIds(prev => prev.filter(id => !currentFilteredIds.includes(id)));
    } else {
      setSelectedWhatsAppCustomerIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const toggleWhatsAppCustomer = (id) => {
    setSelectedWhatsAppCustomerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const sendBulkWhatsAppReminders = () => {
    const isMarathi = settings?.lang === 'mr';
    const queue = modalDueCustomers.filter(c => selectedWhatsAppCustomerIds.includes(c.id));

    if (queue.length === 0) {
      showToast(isMarathi ? 'कृपया संदेश पाठवण्यासाठी किमान एक ग्राहक निवडा.' : 'Please select at least one customer to send reminders.', 'error');
      return;
    }

    setBulkQueue(queue);
    setBulkQueueIndex(0);
    setIsQueueProcessing(true);
  };

  const handleQueueCancel = () => {
    setIsQueueProcessing(false);
    setBulkQueue([]);
    setBulkQueueIndex(0);
  };

  const handleQueueNext = (skip = false) => {
    const isMarathi = settings?.lang === 'mr';
    if (!bulkQueue || bulkQueueIndex >= bulkQueue.length) return;

    const currentCust = bulkQueue[bulkQueueIndex];
    if (!skip && currentCust && currentCust.phone) {
      const dueAmt = typeof getCustomerDues === 'function' ? getCustomerDues(currentCust) : 0;
      const msg = buildCustomerReminderMessage(currentCust, dueAmt, settings);
      openWhatsAppWithTypedMessage(currentCust.phone, msg, settings?.whatsappMode);
    }

    const nextIndex = bulkQueueIndex + 1;
    if (nextIndex >= bulkQueue.length) {
      setIsQueueProcessing(false);
      setBulkQueue([]);
      setBulkQueueIndex(0);
      showToast(isMarathi ? 'सर्व WhatsApp संदेश पाठवणे पूर्ण झाले!' : 'All WhatsApp reminders processed!', 'success');
      setIsBulkReminderOpen(false);
    } else {
      setBulkQueueIndex(nextIndex);
    }
  };

  if (!isOpenModal) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-card" style={{ maxWidth: '600px', width: '92%', maxHeight: '85vh', overflowY: 'auto', borderRadius: '16px', padding: '24px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span className="modal-title" style={{ fontSize: '18px', fontWeight: '800' }}>
            {isQueueProcessing
              ? (settings?.lang === 'mr' ? 'बुल्क संदेश पाठवत आहे...' : 'Sending Bulk Reminders...')
              : (settings?.lang === 'mr' ? 'बुल्क WhatsApp आठवण' : 'Bulk WhatsApp Reminder')
            }
          </span>
          <X 
            style={{ cursor: 'pointer' }}
            onClick={isQueueProcessing ? handleQueueCancel : () => setIsBulkReminderOpen(false)} 
          />
        </div>
        
        {isQueueProcessing ? (
          <div className="modal-body">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <span>
                  {settings?.lang === 'mr' 
                    ? `प्रगती: ग्राहक ${bulkQueueIndex + 1} पैकी ${bulkQueue.length}` 
                    : `Progress: Customer ${bulkQueueIndex + 1} of ${bulkQueue.length}`}
                </span>
                <span>
                  {Math.round((bulkQueueIndex / (bulkQueue.length || 1)) * 100)}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${(bulkQueueIndex / (bulkQueue.length || 1)) * 100}%`, 
                  height: '100%', 
                  backgroundColor: 'var(--success)', 
                  borderRadius: '4px',
                  transition: 'width 0.3s ease' 
                }} />
              </div>
            </div>

            {bulkQueue[bulkQueueIndex] && (
              <div style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {bulkQueue[bulkQueueIndex].name}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      📞 {bulkQueue[bulkQueueIndex].phone}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>
                      ₹{typeof getCustomerDues === 'function' ? getCustomerDues(bulkQueue[bulkQueueIndex]) : 0}
                    </span>
                    <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      {settings?.lang === 'mr' ? 'थकीत रक्कम' : 'Pending Due'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                  <div>
                    <strong>{settings?.lang === 'mr' ? 'योजना:' : 'Plan:'}</strong> {bulkQueue[bulkQueueIndex].plan}
                  </div>
                  <div style={{ marginLeft: '12px' }}>
                    <strong>{settings?.lang === 'mr' ? 'सुरुवात तारीख:' : 'Start Date:'}</strong> {bulkQueue[bulkQueueIndex].joinDate}
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(216, 90, 48, 0.05)', border: '1px solid rgba(216, 90, 48, 0.1)', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#c2410c', lineHeight: '1.5' }}>
              💡 {settings?.lang === 'mr' 
                ? 'खालील "चॅट उघडा" बटण दाबा. WhatsApp उघडल्यावर चॅटमध्ये संदेश पाठवा (Send) बटण दाबा. त्यानंतर पुढील ग्राहकासाठी येथे परत या.' 
                : 'Click "Open Chat & Next" to launch the message draft in WhatsApp. Press "Send" in WhatsApp, then return here for the next customer.'}
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div style={{ marginBottom: '16px', background: 'rgba(34, 197, 94, 0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {settings?.lang === 'mr' 
                  ? 'ग्राहकांना थकीत रक्कम आठवण पाठवा. खालील यादीतून ग्राहक निवडा.' 
                  : 'Send payment reminders to multiple customers via WhatsApp. Select customers from the list below.'}
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                className="search-input"
                placeholder={settings?.lang === 'mr' ? 'नाव किंवा फोन नंबर शोधा...' : 'Search by name or phone...'}
                value={bulkSearch}
                onChange={(e) => setBulkSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {filteredModalDueCustomers.length > 0 && (
              <div 
                style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', background: 'rgba(0, 0, 0, 0.03)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer', userSelect: 'none' }} 
                onClick={toggleSelectAllBulk}
              >
                <input
                  type="checkbox"
                  checked={filteredModalDueCustomers.map(c => c.id).every(id => selectedWhatsAppCustomerIds.includes(id))}
                  onChange={toggleSelectAllBulk}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginRight: '10px', width: '16px', height: '16px', accentColor: 'var(--success)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {settings?.lang === 'mr' ? 'सर्व निवडा' : 'Select All'} ({filteredModalDueCustomers.length})
                </span>
              </div>
            )}

            <div 
              className="bulk-customer-list-container"
              style={{ maxHeight: '320px', overflowY: 'auto', scrollBehavior: 'smooth', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {filteredModalDueCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {settings?.lang === 'mr' ? 'थकीत रक्कम असलेले ग्राहक आढळले नाहीत.' : 'No customers with pending dues found.'}
                </div>
              ) : (
                filteredModalDueCustomers.map(c => {
                  const isSelected = selectedWhatsAppCustomerIds.includes(c.id);
                  const dueAmt = typeof getCustomerDues === 'function' ? getCustomerDues(c) : 0;
                  return (
                    <div 
                      key={c.id} 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.04)' : 'var(--card)', border: isSelected ? '1.5px solid var(--success)' : '1.5px solid var(--border)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s ease', gap: '12px' }}
                      onClick={() => toggleWhatsAppCustomer(c.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleWhatsAppCustomer(c.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--success)', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--border)', flexShrink: 0 }}>
                          {c.photo ? (
                            <img src={c.photo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-secondary)' }}>
                              {(c.name || 'C').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {c.name}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            📞 {c.phone}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--danger)' }}>
                          ₹{dueAmt}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {isQueueProcessing ? (
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button className="btn btn-danger" onClick={handleQueueCancel}>
              {settings?.lang === 'mr' ? 'थांबवा' : 'Stop'}
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" onClick={() => handleQueueNext(true)}>
                {settings?.lang === 'mr' ? 'वगळा' : 'Skip'}
              </button>
              <button className="btn btn-success" onClick={() => handleQueueNext(false)}>
                <Bell size={14} style={{ marginRight: '6px' }} />
                {settings?.lang === 'mr' ? 'चॅट उघडा' : 'Open Chat & Next'}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button className="btn" onClick={() => setIsBulkReminderOpen(false)}>
              {settings?.lang === 'mr' ? 'बंद करा' : 'Close'}
            </button>
            <button 
              className="btn btn-success" 
              onClick={sendBulkWhatsAppReminders}
              disabled={selectedWhatsAppCustomerIds.length === 0}
            >
              <Bell size={14} style={{ marginRight: '6px' }} />
              {settings?.lang === 'mr' ? 'संदेश पाठवा' : 'Send Reminders'} ({selectedWhatsAppCustomerIds.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
