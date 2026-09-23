import React from 'react';
import { Users, UserCheck, AlertTriangle, Coins } from 'lucide-react';

export default function SectionDashboardTiles({
  allCustomers = [],
  computeStatus,
  getCustomerDues,
  categoryFilter,
  setCategoryFilter,
  dashboardFilter,
  setDashboardFilter,
  isMarathi
}) {
  // Separate metrics by section
  const tiffinCusts = allCustomers.filter(c => c.category === 'tiffin');
  const dineInCusts = allCustomers.filter(c => c.category === 'dinein');

  const getMetricsForList = (list) => {
    const total = list.length;
    const active = list.filter(c => computeStatus(c) === 'active').length;
    const expiring = list.filter(c => {
      const s = computeStatus(c);
      return s === 'expiring' || s === 'expired';
    }).length;
    const duesCusts = list.filter(c => getCustomerDues(c) > 0);
    const duesCount = duesCusts.length;
    const totalDuesAmount = duesCusts.reduce((sum, c) => sum + getCustomerDues(c), 0);

    return { total, active, expiring, duesCount, totalDuesAmount };
  };

  const allMetrics = getMetricsForList(allCustomers);
  const tiffinMetrics = getMetricsForList(tiffinCusts);
  const dineInMetrics = getMetricsForList(dineInCusts);

  // Active display metrics depending on selected category filter
  const currentMetrics = categoryFilter === 'tiffin'
    ? tiffinMetrics
    : categoryFilter === 'dinein'
      ? dineInMetrics
      : allMetrics;

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Category Section Filter Bar */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '8px 12px',
          backgroundColor: 'var(--card)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
          {isMarathi ? 'विभाग डॅशबोर्ड विवरण:' : 'Section Dashboard Breakdown:'}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-sm ${categoryFilter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setCategoryFilter('all')}
            style={{ borderRadius: '8px', padding: '6px 14px', fontWeight: '700' }}
          >
            🌐 {isMarathi ? 'सर्व एकत्र' : 'All Sections'} ({allMetrics.total})
          </button>
          <button
            className={`btn btn-sm ${categoryFilter === 'tiffin' ? 'btn-primary' : ''}`}
            onClick={() => setCategoryFilter('tiffin')}
            style={{ 
              borderRadius: '8px', 
              padding: '6px 14px', 
              fontWeight: '700',
              backgroundColor: categoryFilter === 'tiffin' ? '#d85a30' : undefined,
              borderColor: categoryFilter === 'tiffin' ? '#d85a30' : undefined,
              color: categoryFilter === 'tiffin' ? '#fff' : undefined
            }}
          >
            🍱 {isMarathi ? 'टिफिन विभाग' : 'Tiffin Section'} ({tiffinMetrics.total})
          </button>
          <button
            className={`btn btn-sm ${categoryFilter === 'dinein' ? 'btn-primary' : ''}`}
            onClick={() => setCategoryFilter('dinein')}
            style={{ 
              borderRadius: '8px', 
              padding: '6px 14px', 
              fontWeight: '700',
              backgroundColor: categoryFilter === 'dinein' ? '#8b5cf6' : undefined,
              borderColor: categoryFilter === 'dinein' ? '#8b5cf6' : undefined,
              color: categoryFilter === 'dinein' ? '#fff' : undefined
            }}
          >
            🍽️ {isMarathi ? 'डायनिंग विभाग' : 'Dine-In Section'} ({dineInMetrics.total})
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div 
        className="dashboard-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}
      >
        {/* 1. Total Customers Card */}
        <div 
          className="stat-card" 
          onClick={() => setDashboardFilter(dashboardFilter === 'all' ? 'action' : 'all')}
          style={{ cursor: 'pointer', border: dashboardFilter === 'all' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(216, 90, 48, 0.1)', color: 'var(--primary)' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">
              {categoryFilter === 'tiffin' ? '🍱 ' : categoryFilter === 'dinein' ? '🍽️ ' : ''}
              {isMarathi ? 'एकूण ग्राहक' : 'TOTAL CUSTOMERS'}
            </div>
            <div className="stat-value" style={{ color: 'var(--text)' }}>
              {currentMetrics.total}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              🍱 Tiffin: {tiffinMetrics.total} | 🍽️ Dine-In: {dineInMetrics.total}
            </div>
          </div>
        </div>

        {/* 2. Active Members Card */}
        <div 
          className="stat-card"
          onClick={() => setDashboardFilter(dashboardFilter === 'active' ? 'all' : 'active')}
          style={{ cursor: 'pointer', border: dashboardFilter === 'active' ? '2px solid #3b82f6' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <UserCheck size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'सक्रिय सभासद' : 'ACTIVE MEMBERS'}</div>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{currentMetrics.active}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              🍱 Tiffin: {tiffinMetrics.active} | 🍽️ Dine-In: {dineInMetrics.active}
            </div>
          </div>
        </div>

        {/* 3. Expiring Soon / Expired Card */}
        <div 
          className="stat-card"
          onClick={() => setDashboardFilter(dashboardFilter === 'expiring' ? 'all' : 'expiring')}
          style={{ cursor: 'pointer', border: dashboardFilter === 'expiring' ? '2px solid #ef4444' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'मुदत संपत आलेली / संपलेली' : 'EXPIRING / EXPIRED'}</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{currentMetrics.expiring}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              🍱 Tiffin: {tiffinMetrics.expiring} | 🍽️ Dine-In: {dineInMetrics.expiring}
            </div>
          </div>
        </div>

        {/* 4. Remaining Dues Card */}
        <div 
          className="stat-card"
          onClick={() => setDashboardFilter(dashboardFilter === 'dues' ? 'all' : 'dues')}
          style={{ cursor: 'pointer', border: dashboardFilter === 'dues' ? '2px solid #f59e0b' : '1px solid var(--border)' }}
        >
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Coins size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">{isMarathi ? 'बाकी थकबाकी' : 'REMAINING DUES'}</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>
              ₹{currentMetrics.totalDuesAmount} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>({currentMetrics.duesCount})</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              🍱 ₹{tiffinMetrics.totalDuesAmount} | 🍽️ ₹{dineInMetrics.totalDuesAmount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
