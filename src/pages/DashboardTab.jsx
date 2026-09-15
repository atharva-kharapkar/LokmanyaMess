import React, { useState } from 'react';
import { Users, Coins, TrendingUp, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import CustomerCard from '../components/ui/CustomerCard';
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
  
  // Calculate specific metric counts
  const totalCustomersCount = allBranchCustomers.length;
  const tiffinCustomersCount = allBranchCustomers.filter(c => c.category === 'tiffin').length;
  const dineInCustomersCount = allBranchCustomers.filter(c => c.category === 'dinein').length;

  const activeCount = allBranchCustomers.filter(c => computeStatus(c) === 'active').length;
  const expiringCount = allBranchCustomers.filter(c => computeStatus(c) === 'expiring').length;
  const expiredCount = allBranchCustomers.filter(c => computeStatus(c) === 'expired').length;
  const duesCount = allBranchCustomers.filter(c => getCustomerDues(c) > 0).length;

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
      {/* Metric Cards Grid */}
      <div 
        className="dashboard-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', 
          gap: '16px', 
          marginBottom: '20px' 
        }}
      >
        {/* 1. Total Customers */}
        <div 
          className="stat-card" 
          onClick={() => setDashboardFilter(dashboardFilter === 'all' ? 'action' : 'all')}
          style={{ cursor: 'pointer', border: dashboardFilter === 'all' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(216, 90, 48, 0.1)', color: 'var(--primary)' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'एकूण ग्राहक' : 'TOTAL CUSTOMERS'}</div>
            <div className="stat-value" style={{ color: 'var(--text)' }}>
              {totalCustomersCount}
            </div>
          </div>
        </div>

        {/* 1B. Tiffin Delivery Members */}
        <div 
          className="stat-card" 
          onClick={() => setCategoryFilter(categoryFilter === 'tiffin' ? 'all' : 'tiffin')}
          style={{ cursor: 'pointer', border: categoryFilter === 'tiffin' ? '2px solid #d85a30' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(216, 90, 48, 0.15)', color: '#d85a30' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">🍱 {isMarathi ? 'टिफिन ग्राहक' : 'TIFFIN MEMBERS'}</div>
            <div className="stat-value" style={{ color: '#d85a30' }}>
              {tiffinCustomersCount}
            </div>
          </div>
        </div>

        {/* 1C. Dine In Members */}
        <div 
          className="stat-card" 
          onClick={() => setCategoryFilter(categoryFilter === 'dinein' ? 'all' : 'dinein')}
          style={{ cursor: 'pointer', border: categoryFilter === 'dinein' ? '2px solid #8b5cf6' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">🍽️ {isMarathi ? 'डाइन इन ग्राहक' : 'DINE IN MEMBERS'}</div>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>
              {dineInCustomersCount}
            </div>
          </div>
        </div>

        {/* 2. Total Collections */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Coins size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'एकूण जमा रक्कम' : 'TOTAL COLLECTIONS'}</div>
            <div className="stat-value" style={{ color: '#10b981' }}>₹{metrics.totalCollections}</div>
          </div>
        </div>

        {/* 3. Active Members */}
        <div 
          className="stat-card"
          onClick={() => setDashboardFilter(dashboardFilter === 'active' ? 'all' : 'active')}
          style={{ cursor: 'pointer', border: dashboardFilter === 'active' ? '2px solid #3b82f6' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <UserCheck size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'सक्रिय ग्राहक' : 'ACTIVE MEMBERS'}</div>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{activeCount}</div>
          </div>
        </div>

        {/* 4. Expiring Soon */}
        <div 
          className="stat-card"
          onClick={() => setDashboardFilter(dashboardFilter === 'expiring' ? 'all' : 'expiring')}
          style={{ cursor: 'pointer', border: dashboardFilter === 'expiring' ? '2px solid #f59e0b' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'मुदत संपणारे' : 'EXPIRING SOON'}</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{expiringCount + expiredCount}</div>
          </div>
        </div>

        {/* 5. Pending Dues */}
        <div 
          className="stat-card"
          onClick={() => setDashboardFilter(dashboardFilter === 'dues' ? 'all' : 'dues')}
          style={{ cursor: 'pointer', border: dashboardFilter === 'dues' ? '2px solid #ef4444' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'थकीत बाकी' : 'PENDING DUES'}</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>₹{metrics.totalDues}</div>
          </div>
        </div>

        {/* 6. Net Profit */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'निव्वळ नफा (महिना)' : 'NET PROFIT (MONTHLY)'}</div>
            <div className="stat-value" style={{ color: currentMonthNetProfit >= 0 ? '#10b981' : '#ef4444' }}>
              ₹{currentMonthNetProfit}
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
              {dashboardFilter === 'action' && (isMarathi ? 'लक्ष केंद्रित ग्राहक (मुदत संपलेले / थकीत)' : 'ACTION REQUIRED (EXPIRED, EXPIRING, OR PENDING DUES)')}
              {dashboardFilter === 'all' && (isMarathi ? 'सर्व ग्राहक सूची' : 'ALL CUSTOMERS')}
              {dashboardFilter === 'active' && (isMarathi ? 'सक्रिय ग्राहक' : 'ACTIVE MEMBERS')}
              {dashboardFilter === 'expiring' && (isMarathi ? 'मुदत संपणारे ग्राहक' : 'EXPIRING / EXPIRED MEMBERS')}
              {dashboardFilter === 'dues' && (isMarathi ? 'थकीत बाकी असलेले ग्राहक' : 'MEMBERS WITH PENDING DUES')}
              {' '}({expiringOrDuesList.length})
            </span>
          </h3>

          {dashboardFilter !== 'action' && (
            <button className="btn btn-sm" onClick={() => setDashboardFilter('action')} style={{ fontSize: '12px', padding: '4px 10px' }}>
              {isMarathi ? 'ॲक्शन आवश्यक' : 'Show Action Required'}
            </button>
          )}
        </div>

        <div className="customer-bars-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {expiringOrDuesList.map(c => {
            const status = computeStatus(c);
            const remaining = getCustomerDues(c);
            const hasDues = remaining > 0;

            const displayedDeposited = defaultGetCurrentCycleDeposited(c);

            const warningDays = getDueWarningDays(c);
            const daysPendingDues = getDaysPendingDues(c);
            const isShortTerm = c.category === 'shortterm';
            const isGracePeriodOver = isShortTerm ? daysPendingDues > 2 : daysPendingDues > 6;
            const shouldShowDuesWarning = hasDues && isGracePeriodOver;

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
                expiryStrVal={expiryStr(c)}
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

          {expiringOrDuesList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>
              🎉 {isMarathi ? 'कोणतेही प्रलंबित थकीत किंवा संपलेले रेकॉर्ड नाहीत!' : 'No pending dues or expired records!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
