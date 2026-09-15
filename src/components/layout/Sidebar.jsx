import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  IndianRupee,
  Coins,
  TrendingUp,
  History,
  Settings,
  LogOut
} from 'lucide-react';
import { isOwnerRole } from '../../utils/helpers';

export default function Sidebar({
  db,
  role,
  handleLogout,
  currentTab,
  setCurrentTab,
  t,
  setIsArchiveUnlocked,
  setIsCollectionArchiveUnlocked,
  setIsExpenseArchiveUnlocked
}) {
  const isMarathi = db?.settings?.lang === 'mr';
  const messName = db?.settings?.messName || 'Lokmanya Mess';

  return (
    <aside className="sidebar">
      {/* Sidebar Header with Logo Image */}
      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <img 
          src="./assets/icon.jpg" 
          style={{ width: '64px', height: '64px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.15)', objectFit: 'cover', boxShadow: 'var(--shadow-md)' }} 
          alt="Logo" 
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="sidebar-logo-text" style={{ fontSize: '16px', fontWeight: '800', textAlign: 'center', color: '#fff', letterSpacing: '0.5px' }}>
          {messName}
        </div>
      </div>

      {/* Navigation Menu Items */}
      <nav className="sidebar-menu" style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          className={`sidebar-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('dashboard');
            if (typeof setIsArchiveUnlocked === 'function') setIsArchiveUnlocked(false);
          }}
        >
          <LayoutDashboard size={18} />
          <span>{t('dashboard')}</span>
        </div>

        <div
          className={`sidebar-item ${currentTab === 'customers' || currentTab === 'dinein' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('customers');
            if (typeof setIsArchiveUnlocked === 'function') setIsArchiveUnlocked(false);
          }}
        >
          <Users size={18} />
          <span>{t('customers')}</span>
        </div>

        <div
          className={`sidebar-item ${currentTab === 'tiffin' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('tiffin');
            if (typeof setIsArchiveUnlocked === 'function') setIsArchiveUnlocked(false);
          }}
        >
          <ClipboardList size={18} />
          <span>{t('tiffin')}</span>
        </div>

        <div
          className={`sidebar-item ${currentTab === 'shortterm' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('shortterm');
            if (typeof setIsArchiveUnlocked === 'function') setIsArchiveUnlocked(false);
          }}
        >
          <IndianRupee size={18} />
          <span>{t('shortterm')}</span>
        </div>

        <div
          className={`sidebar-item ${currentTab === 'collections' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('collections');
            if (typeof setIsCollectionArchiveUnlocked === 'function') setIsCollectionArchiveUnlocked(false);
          }}
        >
          <Coins size={18} />
          <span>{t('collections')}</span>
        </div>

        <div
          className={`sidebar-item ${currentTab === 'expenses' ? 'active' : ''}`}
          onClick={() => {
            setCurrentTab('expenses');
            if (typeof setIsExpenseArchiveUnlocked === 'function') setIsExpenseArchiveUnlocked(false);
          }}
        >
          <TrendingUp size={18} />
          <span>{t('expenses')}</span>
        </div>

        {isOwnerRole(role) && (
          <div
            className={`sidebar-item ${currentTab === 'oldcustomers' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('oldcustomers');
            }}
          >
            <History size={18} />
            <span>{t('oldcustomers')}</span>
          </div>
        )}

        {isOwnerRole(role) && (
          <div
            className={`sidebar-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('settings');
            }}
          >
            <Settings size={18} />
            <span>{t('settings')}</span>
          </div>
        )}
      </nav>

      {/* Sidebar Footer with Logout Button */}
      <div className="sidebar-footer" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          <span>{isMarathi ? 'लॉगआउट' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
}
