import React, { useState } from 'react';
import { Search, Plus, Bell, Download } from 'lucide-react';
import CustomerCard from '../components/ui/CustomerCard';
import TiffinAreaFilter from '../components/TiffinAreaFilter';
import { getCurrentCycleDeposited } from '../utils/helpers';

export default function CustomersTab({
  db = { customers: [], settings: {} },
  activeBranch = 'All',
  currentTab,
  isArchiveUnlocked,
  archiveInputRef,
  archivePinInput,
  setArchivePinInput,
  showToast,
  matchesArchiveSecret,
  setIsArchiveUnlocked,
  t,
  custSearch,
  setCustSearch,
  tiffinAreaFilter,
  setTiffinAreaFilter,
  filteredCustomers,
  computeStatus,
  getCustomerDues,
  PLAN_DAYS,
  parseLocalDate,
  getDueWarningDays,
  getDaysPendingDues,
  expiryStr,
  openAddCust,
  onOpenAddCust,
  openEditCust,
  onOpenEditCust,
  deleteCustomer,
  onDeleteCustomer,
  restoreCustomer,
  onRestoreCustomer,
  role,
  onEnlargePhoto,
  onOpenPayModal,
  onOpenHistoryModal,
  onSendWhatsAppReminder,
  onOpenBulkReminder,
  onExportCustomers,
  onAddArea,
  handleAddArea,
  onDeleteArea,
  handleDeleteArea,
  onDeleteAllAreas,
  handleDeleteAllAreas,
  onOpenPauseModal
}) {
  const isMarathi = db?.settings?.lang === 'mr';
  const [localArchivePin, setLocalArchivePin] = useState('');

  // Passcode Lock for Old Customers Archive
  if (currentTab === 'oldcustomers' && !isArchiveUnlocked) {
    const handleUnlockArchive = async (e) => {
      if (e) e.preventDefault();
      const pinToTest = String(localArchivePin || '').trim();
      if (!pinToTest) {
        showToast(isMarathi ? 'कृपया पासवर्ड प्रविष्ट करा' : 'Please enter password', 'error');
        return;
      }
      const isOk = typeof matchesArchiveSecret === 'function' ? await matchesArchiveSecret(pinToTest) : (pinToTest === '1234' || pinToTest === '123456' || pinToTest === '000000');
      if (isOk) {
        if (typeof setIsArchiveUnlocked === 'function') setIsArchiveUnlocked(true);
        setLocalArchivePin('');
        showToast(isMarathi ? 'प्रवेश मंजूर!' : 'Access Granted!', 'success');
      } else {
        showToast(isMarathi ? 'चुकीचा पासवर्ड! पुन्हा प्रयत्न करा.' : 'Incorrect Passcode! Please try again.', 'error');
        setLocalArchivePin('');
      }
    };

    return (
      <div className="tab-panel animate-fade">
        <div className="card-section" style={{ maxWidth: '420px', margin: '60px auto', padding: '32px', textAlign: 'center', borderRadius: '16px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>{isMarathi ? 'आर्काइव्ह प्रवेश नियंत्रण' : 'Archive Access Control'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 20px' }}>
            {isMarathi ? 'संग्रहित जुने ग्राहक पाहण्यासाठी पासवर्ड प्रविष्ट करा.' : 'Please enter the access passcode to view archived customer profiles.'}
          </p>
          <form onSubmit={handleUnlockArchive}>
            <input
              type="password"
              className="form-input"
              placeholder="••••••"
              value={localArchivePin}
              onChange={(e) => setLocalArchivePin(e.target.value)}
              style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '6px', marginBottom: '20px', padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid var(--primary)', backgroundColor: 'var(--card)', color: 'var(--text)' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '15px' }}
            >
              {isMarathi ? 'अनलॉक करा' : 'Unlock Archive'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-panel animate-fade">
      <div className="card-section">
        {/* Toolbar */}
        <div className="toolbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
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

          {currentTab === 'tiffin' && (
            <TiffinAreaFilter 
              customers={db.customers}
              selectedArea={tiffinAreaFilter}
              onSelectArea={setTiffinAreaFilter}
              customAreas={db.settings?.customAreas}
              onAddArea={onAddArea || handleAddArea}
              onDeleteArea={onDeleteArea || handleDeleteArea}
              onDeleteAllAreas={onDeleteAllAreas || handleDeleteAllAreas}
              lang={db.settings?.lang}
              activeBranch={activeBranch}
            />
          )}

          {currentTab !== 'oldcustomers' && (
            <button className="btn btn-primary" onClick={() => openAddCust(currentTab)}>
              <Plus size={16} /> {t('addCustomer')}
            </button>
          )}

          <button
            className="btn btn-sm btn-success"
            onClick={onOpenBulkReminder}
            title={isMarathi ? 'बुल्क WhatsApp आठवण पाठवा' : 'Send WhatsApp reminders in bulk'}
          >
            <Bell size={16} style={{ marginRight: '6px' }} />
            {isMarathi ? 'बुल्क WhatsApp आठवण' : 'Bulk WhatsApp Reminder'}
          </button>

          <button className="btn" onClick={onExportCustomers}>
            <Download size={16} /> {t('exportCsv')}
          </button>
        </div>

        {/* Customer List (Using Memoized CustomerCard Component for high performance) */}
        <div className="customer-bars-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(filteredCustomers || []).map(c => {
            const status = typeof computeStatus === 'function' ? computeStatus(c) : 'active';
            const remaining = typeof getCustomerDues === 'function' ? getCustomerDues(c) : 0;
            const hasDues = remaining > 0;

            const displayedDeposited = getCurrentCycleDeposited(c);

            const warningDays = typeof getDueWarningDays === 'function' ? getDueWarningDays(c) : 0;
            const daysPendingDues = typeof getDaysPendingDues === 'function' ? getDaysPendingDues(c) : 0;
            const isShortTerm = c.category === 'shortterm';
            const isGracePeriodOver = isShortTerm ? daysPendingDues > 2 : daysPendingDues > 6;
            const shouldShowDuesWarning = hasDues && isGracePeriodOver;
            const expiryVal = typeof expiryStr === 'function' ? expiryStr(c) : '';

            return (
              <CustomerCard
                key={c.id}
                customer={c}
                status={status}
                remaining={remaining}
                hasDues={hasDues}
                displayedDeposited={displayedDeposited}
                warningDays={warningDays}
                daysPendingDues={daysPendingDues}
                shouldShowDuesWarning={shouldShowDuesWarning}
                expiryStrVal={expiryVal}
                lang={db?.settings?.lang}
                role={role}
                currentTab={currentTab}
                PLAN_DAYS={PLAN_DAYS}
                t={t}
                onEnlargePhoto={onEnlargePhoto}
                onOpenPayModal={onOpenPayModal}
                onOpenHistoryModal={onOpenHistoryModal}
                onSendWhatsAppReminder={onSendWhatsAppReminder}
                onOpenEditCust={openEditCust || onOpenEditCust}
                onDeleteCustomer={deleteCustomer || onDeleteCustomer}
                onRestoreCustomer={restoreCustomer || onRestoreCustomer}
                onOpenPauseModal={onOpenPauseModal}
              />
            );
          })}

          {(!filteredCustomers || filteredCustomers.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              {t('noCusts')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
