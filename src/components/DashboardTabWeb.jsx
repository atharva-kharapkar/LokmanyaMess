import React from 'react';
import { Users, Coins, TrendingUp, AlertTriangle, Bell, Edit, Trash2 } from 'lucide-react';

export default function DashboardTabWeb({
  db,
  t,
  role,
  ownerBranchDashboardData,
  metrics,
  currentMonthNetProfit,
  showCalculator,
  activeBranch,
  computeStatus,
  getCustomerDues,
  getDueWarningDays,
  openEditCust,
  deleteCustomer
}) {
  return (
    <>
      {currentTab === 'dashboard' && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowCalculator(!showCalculator)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginRight: '20px',
                  backgroundColor: showCalculator ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                  color: showCalculator ? 'var(--danger)' : 'var(--primary)',
                  border: '1px solid currentColor',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  height: '32px'
                }}
                title={showCalculator ? (db.settings.lang === 'mr' ? 'कॅल्क्युलेटर लपवा' : 'Hide Calculator') : (db.settings.lang === 'mr' ? 'कॅल्क्युलेटर दाखवा' : 'Show Calculator')}
              >
                {showCalculator ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showCalculator ? (db.settings.lang === 'mr' ? 'लपवा' : 'Hide Calc') : (db.settings.lang === 'mr' ? 'दाखवा' : 'Show Calc')}</span>
              </button>
            )}
    </>
  );
}
