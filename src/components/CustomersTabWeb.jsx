import React from 'react';
import { Edit, Trash2, History } from 'lucide-react';
import { formatDisplayDate } from '../utils/formatters';

export default function CustomersTabWeb({
  db,
  currentTab,
  isArchiveUnlocked,
  archiveInputRef,
  archivePinInput,
  setArchivePinInput,
  showToast,
  matchesArchiveSecret,
  setIsArchiveUnlocked,
  t,
  searchQuery,
  setSearchQuery,
  showArchived,
  setShowArchived,
  custSort,
  setCustSort,
  branchFilter,
  setBranchFilter,
  activeBranch,
  branches,
  statusFilter,
  setStatusFilter,
  openNewCust,
  openEditCust,
  filteredCustomers,
  computeStatus,
  getCustomerDues,
  PLAN_DAYS,
  parseLocalDate,
  getDueWarningDays,
  getDaysPendingDues,
  setPreviewImage,
  openHistoryModal,
  sendWhatsAppReminder,
  role,
  deleteCustomer,
  areaGroups
}) {
  return (
    <>
      {(currentTab === 'customers' || currentTab === 'tiffin' || currentTab === 'shortterm' || currentTab === 'oldcustomers') && (
            currentTab === 'oldcustomers' && !isArchiveUnlocked ? (
              <div className="tab-panel animate-fade">
                        showToast(db.settings.lang === 'mr' ? 'कृपया सेटिंग्जमध्ये आर्काइव्ह पासकोड सेट करा.' : 'Please set an archive passcode in Settings first.', 'error');
                        return;
                      }
                      if (await matchesArchiveSecret(archivePinInput, db.settings.archivePasswordHash)) {
                        setIsArchiveUnlocked(true);
                        setArchivePinInput('');
                        showToast(db.settings.lang === 'mr' ? 'प्रवेश मंजूर!' : 'Access Granted!', 'success');
                      } else {
                        showToast(db.settings.lang === 'mr' ? 'चुकीचा पासवर्ड!' : 'Incorrect Password!', 'error');
                        setArchivePinInput('');
                      }
                    }}
                  >
                    {db.settings.lang === 'mr' ? 'अनलॉक करा' : 'Unlock Archive'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="tab-panel">
                <div className="card-section">
                  <div className="toolbar">
                    <div className="search-container">
                      <Search className="search-icon" size={18} />
                      <input
                        type="text"
                        className="search-input"
                        placeholder={t('searchPlaceholder')}
                        value={custSearch}
                        onChange={(e) => setCustSearch(e.target.value)}
                      />
                    </div>

                    {/* Hide Add Customer button in Old Customers Archive */}
                    {currentTab !== 'oldcustomers' && (
                      <button className="btn btn-primary" onClick={openAddCust}>
                        <Plus size={16} /> {t('addCustomer')}
                      </button>
                    )}

                    {/* Bulk WhatsApp Reminder */}
                    <button
                      className="btn btn-sm btn-success"
                      onClick={handleOpenBulkReminder}
                      title={
                        db.settings.lang === 'mr' ? 'बुल्क WhatsApp आठवण पाठवा' : 'Send WhatsApp reminders in bulk'
                      }
                    >
                      <Bell size={16} style={{ marginRight: '6px' }} />
                      {db.settings.lang === 'mr' ? 'बुल्क WhatsApp आठवण' : 'Bulk WhatsApp Reminder'}
                    </button>

                    <button className="btn" onClick={handleExportCustomers}>
                      <Download size={16} /> {t('exportCsv')}
                    </button>
                  </div>

                  {currentTab === 'tiffin' && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <button 
                        className={`btn ${tiffinViewMode === 'all' ? 'btn-primary' : ''}`}
                        onClick={() => setTiffinViewMode('all')}
                        style={{ flex: 1, backgroundColor: tiffinViewMode === 'all' ? 'var(--primary)' : 'var(--bg-secondary)', color: tiffinViewMode === 'all' ? 'white' : 'var(--text-primary)' }}
                      >
                        {db.settings.lang === 'mr' ? 'सर्व ग्राहक' : 'All Customers'}
                      </button>
                      <button 
                        className={`btn ${tiffinViewMode === 'area' ? 'btn-primary' : ''}`}
                        onClick={() => setTiffinViewMode('area')}
                        style={{ flex: 1, backgroundColor: tiffinViewMode === 'area' ? 'var(--primary)' : 'var(--bg-secondary)', color: tiffinViewMode === 'area' ? 'white' : 'var(--text-primary)' }}
                      >
                        {db.settings.lang === 'mr' ? 'एरिया नुसार' : 'Area-Wise Delivery'}
                      </button>
                    </div>
                  )}

                  <div className="customer-bars-list">
                    {currentTab === 'tiffin' && tiffinViewMode === 'area' ? (
                      (() => {
                        const areaGroups = {};
                        filteredCustomers.forEach(c => {
                          const area = c.area ? c.area.trim() : (db.settings.lang === 'mr' ? 'इतर (Area Not Set)' : 'Other (Area Not Set)');
                          if (!areaGroups[area]) areaGroups[area] = [];
                          areaGroups[area].push(c);
                        });
                        
                        return Object.keys(areaGroups).sort().map(area => (
                          <div key={area} style={{ marginBottom: '24px' }}>
                            <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '18px', fontWeight: '900', marginBottom: '12px', textTransform: 'uppercase' }}>
                              📍 {area} ({areaGroups[area].length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {areaGroups[area].map(c => (
                                <div key={c.id} className="customer-bar" onClick={() => openEditCust(c)} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>{c.name}</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>📞 {c.phone || (db.settings.lang === 'mr' ? 'नंबर नाही' : 'No Number')}</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>🏠 {c.addr || (db.settings.lang === 'mr' ? 'पत्ता नाही' : 'No Address')}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '8px 16px', borderRadius: '8px', color: 'var(--primary)', fontWeight: '900', fontSize: '16px', height: 'fit-content' }}>
                                    🍽️ {c.mealSelection || '1 meal per day'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()
                    ) : (
                      filteredCustomers.map(c => {
                      const status = computeStatus(c);
                      const remaining = getCustomerDues(c);
                      const hasDues = remaining > 0;
                      
                      let displayedDeposited = c.deposited || 0;
                      if (c.category !== 'shortterm' && c.joinDate) {
                        const daysPerCycle = PLAN_DAYS[c.plan] || 30;
                        const startDate = parseLocalDate(c.joinDate);
                        const today = new Date();
                        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const elapsedTime = todayMidnight - startDate;
                        const elapsedDays = Math.round(elapsedTime / 86400000);
                        let elapsedCycles = 0;
                        if (elapsedDays > 0) {
                          elapsedCycles = Math.floor(elapsedDays / daysPerCycle);
                        }
                        displayedDeposited = Math.max(0, (c.deposited || 0) - elapsedCycles * c.amount);
                      }
                      
                      const warningDays = getDueWarningDays(c);
                      const isNameRed = warningDays > 0;
                      const daysPendingDues = getDaysPendingDues(c);
                      const isShortTerm = c.category === 'shortterm';
                      const isGracePeriodOver = isShortTerm ? daysPendingDues > 2 : daysPendingDues > 6;
                      const shouldShowDuesWarning = hasDues && isGracePeriodOver;
                      
                      return (
                        <div key={c.id} className={`customer-bar status-${status} ${hasDues ? 'has-dues' : 'no-dues'}`}>
                        {/* Left: Profile Photo */}
                        <div 
                          className="customer-bar-avatar-container" 
                          style={{ cursor: c.photo ? 'pointer' : 'default', border: '1.5px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', width: '140px', height: '140px', flexShrink: 0 }}
                          onClick={() => c.photo && setPreviewImage({ url: c.photo, name: c.name })}
                          title={c.photo ? (db.settings.lang === 'mr' ? 'फोटो मोठा करा' : 'Click to enlarge') : ''}
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

                        {/* Middle-Left: Basic Info */}
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
                          {c.category === 'dinein' && c.mealSelection && (
                            <div style={{ color: 'var(--primary)', fontSize: '16px', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase', backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                              🍽️ {c.mealSelection}
                            </div>
                          )}
                          {shouldShowDuesWarning && (
                            <div style={{ color: '#ff1e1e', fontSize: '16px', fontWeight: '900', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              ⚠️ {db.settings.lang === 'mr' 
                                ? `मागील ${daysPendingDues} दिवसांपासून थकीत रक्कम बाकी आहे` 
                                : `Due is pending from last ${daysPendingDues} days`}
                            </div>
                          )}
                          <div className="customer-bar-subinfo" style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '2px' }}>
                            <Phone size={13} style={{ color: '#EF4444', marginRight: '6px', flexShrink: 0 }} /> {c.phone}
                          </div>
                          <div className="customer-bar-subinfo" style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '2px' }}>
      {(currentTab === 'customers' || currentTab === 'tiffin' || currentTab === 'shortterm' || currentTab === 'oldcustomers') && (
            currentTab === 'oldcustomers' && !isArchiveUnlocked ? (
              <div className="tab-panel animate-fade">
                        showToast(db.settings.lang === 'mr' ? 'कृपया सेटिंग्जमध्ये आर्काइव्ह पासकोड सेट करा.' : 'Please set an archive passcode in Settings first.', 'error');
                        return;
                      }
                      if (await matchesArchiveSecret(archivePinInput, db.settings.archivePasswordHash)) {
                        setIsArchiveUnlocked(true);
                        setArchivePinInput('');
                        showToast(db.settings.lang === 'mr' ? 'प्रवेश मंजूर!' : 'Access Granted!', 'success');
                      } else {
                        showToast(db.settings.lang === 'mr' ? 'चुकीचा पासवर्ड!' : 'Incorrect Password!', 'error');
                        setArchivePinInput('');
                      }
                    }}
                  >
                    {db.settings.lang === 'mr' ? 'अनलॉक करा' : 'Unlock Archive'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="tab-panel">
                <div className="card-section">
                  <div className="toolbar">
                    <div className="search-container">
                      <Search className="search-icon" size={18} />
                      <input
                        type="text"
                        className="search-input"
                        placeholder={t('searchPlaceholder')}
                        value={custSearch}
                        onChange={(e) => setCustSearch(e.target.value)}
                      />
                    </div>

                    {/* Hide Add Customer button in Old Customers Archive */}
                    {currentTab !== 'oldcustomers' && (
                      <button className="btn btn-primary" onClick={openAddCust}>
                        <Plus size={16} /> {t('addCustomer')}
                      </button>
                    )}

                    {/* Bulk WhatsApp Reminder */}
                    <button
                      className="btn btn-sm btn-success"
                      onClick={handleOpenBulkReminder}
                      title={
                        db.settings.lang === 'mr' ? 'बुल्क WhatsApp आठवण पाठवा' : 'Send WhatsApp reminders in bulk'
                      }
                    >
                      <Bell size={16} style={{ marginRight: '6px' }} />
                      {db.settings.lang === 'mr' ? 'बुल्क WhatsApp आठवण' : 'Bulk WhatsApp Reminder'}
                    </button>

                    <button className="btn" onClick={handleExportCustomers}>
                      <Download size={16} /> {t('exportCsv')}
                    </button>
                  </div>

                  {currentTab === 'tiffin' && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <button 
                        className={`btn ${tiffinViewMode === 'all' ? 'btn-primary' : ''}`}
                        onClick={() => setTiffinViewMode('all')}
                        style={{ flex: 1, backgroundColor: tiffinViewMode === 'all' ? 'var(--primary)' : 'var(--bg-secondary)', color: tiffinViewMode === 'all' ? 'white' : 'var(--text-primary)' }}
                      >
                        {db.settings.lang === 'mr' ? 'सर्व ग्राहक' : 'All Customers'}
                      </button>
                      <button 
                        className={`btn ${tiffinViewMode === 'area' ? 'btn-primary' : ''}`}
                        onClick={() => setTiffinViewMode('area')}
                        style={{ flex: 1, backgroundColor: tiffinViewMode === 'area' ? 'var(--primary)' : 'var(--bg-secondary)', color: tiffinViewMode === 'area' ? 'white' : 'var(--text-primary)' }}
                      >
                        {db.settings.lang === 'mr' ? 'एरिया नुसार' : 'Area-Wise Delivery'}
                      </button>
                    </div>
                  )}

                  <div className="customer-bars-list">
                    {currentTab === 'tiffin' && tiffinViewMode === 'area' ? (
                      (() => {
                        const areaGroups = {};
                        filteredCustomers.forEach(c => {
                          const area = c.area ? c.area.trim() : (db.settings.lang === 'mr' ? 'इतर (Area Not Set)' : 'Other (Area Not Set)');
                          if (!areaGroups[area]) areaGroups[area] = [];
                          areaGroups[area].push(c);
                        });
                        
                        return Object.keys(areaGroups).sort().map(area => (
                          <div key={area} style={{ marginBottom: '24px' }}>
                            <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '18px', fontWeight: '900', marginBottom: '12px', textTransform: 'uppercase' }}>
                              📍 {area} ({areaGroups[area].length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {areaGroups[area].map(c => (
                                <div key={c.id} className="customer-bar" onClick={() => openEditCust(c)} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '4px' }}>{c.name}</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>📞 {c.phone || (db.settings.lang === 'mr' ? 'नंबर नाही' : 'No Number')}</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>🏠 {c.addr || (db.settings.lang === 'mr' ? 'पत्ता नाही' : 'No Address')}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '8px 16px', borderRadius: '8px', color: 'var(--primary)', fontWeight: '900', fontSize: '16px', height: 'fit-content' }}>
                                    🍽️ {c.mealSelection || '1 meal per day'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()
                    ) : (
                      filteredCustomers.map(c => {
                      const status = computeStatus(c);
                      const remaining = getCustomerDues(c);
                      const hasDues = remaining > 0;
                      
                      let displayedDeposited = c.deposited || 0;
                      if (c.category !== 'shortterm' && c.joinDate) {
                        const daysPerCycle = PLAN_DAYS[c.plan] || 30;
                        const startDate = parseLocalDate(c.joinDate);
                        const today = new Date();
                        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const elapsedTime = todayMidnight - startDate;
                        const elapsedDays = Math.round(elapsedTime / 86400000);
                        let elapsedCycles = 0;
                        if (elapsedDays > 0) {
                          elapsedCycles = Math.floor(elapsedDays / daysPerCycle);
                        }
                        displayedDeposited = Math.max(0, (c.deposited || 0) - elapsedCycles * c.amount);
                      }
                      
                      const warningDays = getDueWarningDays(c);
                      const isNameRed = warningDays > 0;
                      const daysPendingDues = getDaysPendingDues(c);
                      const isShortTerm = c.category === 'shortterm';
                      const isGracePeriodOver = isShortTerm ? daysPendingDues > 2 : daysPendingDues > 6;
                      const shouldShowDuesWarning = hasDues && isGracePeriodOver;
                      
                      return (
                        <div key={c.id} className={`customer-bar status-${status} ${hasDues ? 'has-dues' : 'no-dues'}`}>
                        {/* Left: Profile Photo */}
                        <div 
                          className="customer-bar-avatar-container" 
                          style={{ cursor: c.photo ? 'pointer' : 'default', border: '1.5px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', width: '140px', height: '140px', flexShrink: 0 }}
                          onClick={() => c.photo && setPreviewImage({ url: c.photo, name: c.name })}
                          title={c.photo ? (db.settings.lang === 'mr' ? 'फोटो मोठा करा' : 'Click to enlarge') : ''}
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

                        {/* Middle-Left: Basic Info */}
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
                          {c.category === 'dinein' && c.mealSelection && (
                            <div style={{ color: 'var(--primary)', fontSize: '16px', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase', backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                              🍽️ {c.mealSelection}
                            </div>
                          )}
                          {shouldShowDuesWarning && (
                            <div style={{ color: '#ff1e1e', fontSize: '16px', fontWeight: '900', marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              ⚠️ {db.settings.lang === 'mr' 
                                ? `मागील ${daysPendingDues} दिवसांपासून थकीत रक्कम बाकी आहे` 
                                : `Due is pending from last ${daysPendingDues} days`}
                            </div>
                          )}
                          <div className="customer-bar-subinfo" style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '2px' }}>
                            <Phone size={13} style={{ color: '#EF4444', marginRight: '6px', flexShrink: 0 }} /> {c.phone}
                          </div>
                          <div className="customer-bar-subinfo" style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '2px' }}>
                            <MapPin size={13} style={{ color: '#EC4899', marginRight: '6px', flexShrink: 0 }} /> {c.addr || 'No Address'}
                          </div>
                        </div>

                        {/* Middle: Plan details */}
                        <div className="customer-bar-plan" style={{ display: 'flex', flexDirection: 'column', alignSelf: 'center' }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            PLAN & CYCLE
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>
                            {c.category === 'shortterm' 
                              ? (db.settings.lang === 'mr' 
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
                            Expires: {formatDisplayDate(expiryStr(c))}
                          </div>
                        </div>

                        {/* Middle-Right: Fees & Dues */}
                        <div className="customer-bar-financial-column" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignSelf: 'center', width: '100%' }}>
                          {(() => {
                            const typeLabel = getMealTypeLabel(c.mealType || c.mealSelection || c.tiffinPlan, db.settings?.lang);
                            const slotLabel = getMealSlotLabel(c.mealSlot, db.settings?.lang);
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

                        {/* Right: Status & Actions */}
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
                                {status === 'active' ? (db.settings.lang === 'mr' ? 'सक्रिय' : 'Active') : (db.settings.lang === 'mr' ? 'मुदत संपली' : 'Expired')}
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
                              {hasDues ? (db.settings.lang === 'mr' ? 'थकबाकी' : 'Dues Pending') : (db.settings.lang === 'mr' ? 'पूर्ण भरले' : 'Fully Paid')}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '240px' }}>
                            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                              {c.status === 'old' && role === 'owner' ? (
                                <button
                                  className="btn btn-sm btn-success"
                                  title={db.settings.lang === 'mr' ? 'पुनर्संचयित करा' : 'Restore Customer'}
                                  onClick={() => restoreCustomer(c.id)}
                                  style={{ flex: 1, height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <RotateCcw size={12} />
                                  Restore
                                </button>
                              ) : (
                                c.status !== 'old' && (
                                  <button
                                    className="btn btn-sm btn-success"
                                    title={db.settings.lang === 'mr' ? 'पेमेंट नोंदवा' : 'Record Payment'}
                                    onClick={() => openPayModal(c)}
                                    style={{ flex: 1, height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', backgroundColor: '#008000', borderColor: '#008000', color: '#fff' }}
                                  >
                                    <span style={{ fontSize: '14px', fontWeight: '800' }}>₹</span>
                                    Pay
                                  </button>
                                )
                              )}
                              <button
                                className="btn btn-sm"
                                title={db.settings.lang === 'mr' ? 'पेमेंट इतिहास' : 'Payment History'}
                                onClick={() => openHistoryModal(c)}
                                style={{ flex: 1, height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', backgroundColor: '#fff', border: '1px solid #D1D5DB', color: '#1F2937' }}
                              >
                                <History size={12} />
                                History
                              </button>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                              <button
                                className="btn btn-sm"
                                title={db.settings.lang === 'mr' ? 'WhatsApp आठवण' : 'WhatsApp Reminder'}
                                onClick={() => sendWhatsAppReminder(c)}
                                style={{ flex: '1 1 0%', height: '32px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', backgroundColor: '#fff', border: '1px solid #D1D5DB', color: '#1F2937' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                WhatsApp
                              </button>
                              
                              
                              
                              <button
                                className="btn btn-sm btn-icon"
                                title={t('editProfile')}
                                onClick={() => openEditCust(c)}
                                style={{ width: '32px', height: '32px', flex: '0 0 32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #D1D5DB', color: '#1F2937' }}
                              >
                                <Edit size={12} />
                              </button>
                              
                              <button
                                  className="btn btn-sm btn-icon"
                                  title={t('deleteCust')}
                                  onClick={() => deleteCustomer(c.id)}
                                  style={{ width: '32px', height: '32px', flex: '0 0 32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF0000', border: '1px solid #FF0000', color: '#fff' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                  )}
                  {filteredCustomers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      {t('noCusts')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
    </>
  );
}
