import React, { useState } from 'react';
import { Users, Coins, TrendingUp, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import CustomerCard from '../components/ui/CustomerCard';
import SectionDashboardTiles from '../components/dashboard/SectionDashboardTiles';
import { 
  computeStatus as defaultComputeStatus, 
  getCustomerDues as defaultGetCustomerDues, 
  getDueWarningDays as defaultGetDueWarningDays, 
  getDaysPendingDues as defaultGetDaysPendingDues, 
  getExpiryDate as defaultGetExpiryDate, 
  getExpiryDays as defaultGetExpiryDays, 
  expiryStr as defaultExpiryStr, 
  PLAN_DAYS as defaultPLAN_DAYS, 
  parseLocalDate as defaultParseLocalDate,
  getCurrentCycleDeposited as defaultGetCurrentCycleDeposited
} from '../utils/helpers';

export default function DashboardTab({
  db = { customers: [], transactions: [], expenses: [], settings: {} },
  t,
  role,
  ownerBranchDashboardData,
  metrics,
  currentMonthNetProfit,
  showCalculator,
  activeBranch,
  computeStatus: computeStatusProp,
  getCustomerDues: getCustomerDuesProp,
  getDueWarningDays: getDueWarningDaysProp,
  getDaysPendingDues: getDaysPendingDuesProp,
  getExpiryDate: getExpiryDateProp,
  getExpiryDays: getExpiryDaysProp,
  expiryStr: expiryStrProp,
  PLAN_DAYS: PLAN_DAYSProp,
  parseLocalDate: parseLocalDateProp,
  openEditCust,
  deleteCustomer,
  onEnlargePhoto,
  onOpenPayModal,
  onOpenHistoryModal,
  onSendWhatsAppReminder,
  onRestoreCustomer,
  onOpenPauseModal
}) {
  const isMarathi = db.settings?.lang === 'mr';
  const [dashboardFilter, setDashboardFilter] = useState('action'); // 'action', 'all', 'active', 'expiring', 'dues'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'tiffin', 'dinein'

  const computeStatus = typeof computeStatusProp === 'function' ? computeStatusProp : defaultComputeStatus;
  const getCustomerDues = typeof getCustomerDuesProp === 'function' ? getCustomerDuesProp : defaultGetCustomerDues;
  const getDueWarningDays = typeof getDueWarningDaysProp === 'function' ? getDueWarningDaysProp : defaultGetDueWarningDays;
  const getDaysPendingDues = typeof getDaysPendingDuesProp === 'function' ? getDaysPendingDuesProp : defaultGetDaysPendingDues;
  const getExpiryDate = typeof getExpiryDateProp === 'function' ? getExpiryDateProp : defaultGetExpiryDate;
  const getExpiryDays = typeof getExpiryDaysProp === 'function' ? getExpiryDaysProp : defaultGetExpiryDays;
  const expiryStr = typeof expiryStrProp === 'function' ? expiryStrProp : defaultExpiryStr;
  const PLAN_DAYS = PLAN_DAYSProp || defaultPLAN_DAYS;
  const parseLocalDate = typeof parseLocalDateProp === 'function' ? parseLocalDateProp : defaultParseLocalDate;

  // Owner Multi-Branch View
  if (role === 'owner' && activeBranch === 'All' && ownerBranchDashboardData) {
    return (
      <div className="tab-panel animate-fade" style={{ overflowY: 'auto', padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>
          {isMarathi ? 'सर्व शाखांचा एकत्रित व्यवसाय डॅशबोर्ड' : 'All Branches Multi-Branch Dashboard'}
        </h2>
      </div>
    );
  }

  const allBranchCustomers = (db?.customers || []).filter(c => {
    if (!c) return false;
    const matchesBranch = !activeBranch || activeBranch === 'All' || (c.branch || 'Branch 1') === activeBranch;
    return matchesBranch && c.status !== 'old' && c.status !== 'archived';
  });

  // Action Required & Filtered list (Sorted by Dues Pending TOP, Fully Paid BOTTOM)
  const expiringOrDuesList = allBranchCustomers.filter(c => {
    const status = typeof computeStatus === 'function' ? computeStatus(c) : 'active';
    const dues = typeof getCustomerDues === 'function' ? getCustomerDues(c) : 0;

    if (categoryFilter === 'tiffin' && c.category !== 'tiffin') return false;
    if (categoryFilter === 'dinein' && c.category !== 'dinein') return false;

    if (dashboardFilter === 'all') return true;
    if (dashboardFilter === 'active') return status === 'active';
    if (dashboardFilter === 'expiring') return status === 'expiring' || status === 'expired';
    if (dashboardFilter === 'dues') return dues > 0;
    return status === 'expired' || status === 'expiring' || dues > 0;
  });

  expiringOrDuesList.sort((a, b) => {
    const duesA = typeof getCustomerDues === 'function' ? getCustomerDues(a) : 0;
    const duesB = typeof getCustomerDues === 'function' ? getCustomerDues(b) : 0;

    const hasDuesA = duesA > 0 ? 1 : 0;
    const hasDuesB = duesB > 0 ? 1 : 0;

    if (hasDuesA !== hasDuesB) return hasDuesB - hasDuesA;
    if (duesA !== duesB) return duesB - duesA;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="tab-panel animate-fade">
      {/* 1. Separated Section Dashboard Tiles (Tiffin vs Dine-In) */}
      <SectionDashboardTiles
        allCustomers={allBranchCustomers}
        computeStatus={computeStatus}
        getCustomerDues={getCustomerDues}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        dashboardFilter={dashboardFilter}
        setDashboardFilter={setDashboardFilter}
        isMarathi={isMarathi}
      />

      {/* 2. Unified Financial Overview Cards (Total Collections & Net Profit) */}
      <div 
        className="dashboard-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '16px', 
          marginBottom: '20px' 
        }}
      >
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Coins size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'एकूण जमा रक्कम' : 'TOTAL COLLECTIONS'}</div>
            <div className="stat-value" style={{ color: '#10b981' }}>₹{metrics?.totalCollections || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'निव्वळ नफा (महिना)' : 'NET PROFIT (MONTHLY)'}</div>
            <div className="stat-value" style={{ color: (currentMonthNetProfit || 0) >= 0 ? '#10b981' : '#ef4444' }}>
              ₹{currentMonthNetProfit || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Action Required List Section */}
      <div className="card-section" style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="section-title" style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, textTransform: 'uppercase' }}>
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            <span>
              {dashboardFilter === 'all' 
                ? (isMarathi ? 'सर्व ग्राहक' : 'All Customers') 
                : dashboardFilter === 'active' 
                ? (isMarathi ? 'सक्रिय ग्राहक' : 'Active Members')
                : dashboardFilter === 'expiring' 
                ? (isMarathi ? 'मुदत संपणारे ग्राहक' : 'Expiring Members')
                : dashboardFilter === 'dues' 
                ? (isMarathi ? 'थकीत बाकी असलेले ग्राहक' : 'Customers with Dues')
                : (isMarathi ? 'तात्काळ कारवाई आवश्यक ग्राहक' : 'Action Required Customers')}
              {' '}({expiringOrDuesList.length})
            </span>
          </h3>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn btn-sm ${dashboardFilter === 'action' ? 'btn-primary' : ''}`} 
              onClick={() => setDashboardFilter('action')}
            >
              {isMarathi ? 'तात्काळ' : 'Action'}
            </button>
            <button 
              className={`btn btn-sm ${dashboardFilter === 'all' ? 'btn-primary' : ''}`} 
              onClick={() => setDashboardFilter('all')}
            >
              {isMarathi ? 'सर्व' : 'All'}
            </button>
          </div>
        </div>

        {expiringOrDuesList.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {isMarathi ? 'कोणतेही ग्राहक सापडले नाहीत.' : 'No customers match the selected filter.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expiringOrDuesList.map(c => {
              const status = computeStatus(c);
              const dues = getCustomerDues(c);
              const hasDues = dues > 0;
              const displayedDeposited = getCurrentCycleDeposited(c);
              const warningDays = getDueWarningDays(c);
              const daysPendingDues = getDaysPendingDues(c);
              const isShortTerm = c.category === 'shortterm';
              const isGracePeriodOver = isShortTerm ? daysPendingDues > 2 : daysPendingDues > 6;
              const shouldShowDuesWarning = hasDues && isGracePeriodOver;
              const expiryStrVal = expiryStr(c);

              return (
                <CustomerCard
                  key={c.id}
                  customer={c}
                  status={status}
                  remaining={dues}
                  hasDues={hasDues}
                  displayedDeposited={displayedDeposited}
                  warningDays={warningDays}
                  daysPendingDues={daysPendingDues}
                  shouldShowDuesWarning={shouldShowDuesWarning}
                  expiryStrVal={expiryStrVal}
                  lang={db.settings?.lang}
                  role={role}
                  currentTab="dashboard"
                  PLAN_DAYS={PLAN_DAYS}
                  t={t}
                  onEnlargePhoto={onEnlargePhoto}
                  onOpenPayModal={onOpenPayModal}
                  onOpenHistoryModal={onOpenHistoryModal}
                  onSendWhatsAppReminder={onSendWhatsAppReminder}
                  onOpenEditCust={openEditCust}
                  onDeleteCustomer={deleteCustomer}
                  onRestoreCustomer={onRestoreCustomer}
                  onOpenPauseModal={onOpenPauseModal}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
