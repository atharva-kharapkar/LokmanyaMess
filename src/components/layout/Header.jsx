import React from 'react';
import { LogOut, Eye, EyeOff, Building2, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { isOwnerRole } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function Header({
  db,
  role,
  activeBranch,
  setActiveBranch,
  branches = ['Branch 1', 'Branch 2'],
  showCalculator,
  setShowCalculator,
  handleLogout,
  currentTab
}) {
  const isMarathi = db?.settings?.lang === 'mr';
  const messName = db?.settings?.messName || 'Lokmanya Mess';
  const { saveHealth, handleForceUploadToCloud } = useAuth();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '0.5px' }}>
          🍱 {messName}
        </h1>

        {/* Live Cloud Sync Status Badge */}
        <div
          onClick={handleForceUploadToCloud}
          title={
            isMarathi
              ? `क्लाउड सिंक: ${isOnline ? 'सुरू (क्लिक करून सिंक करा)' : 'इंटरनेट बंद (स्थानिक सुरक्षित)'}\nशेवटचा सिंक: ${saveHealth?.lastCloudSyncAt ? new Date(saveHealth.lastCloudSyncAt).toLocaleTimeString('en-IN') : 'नाही'}`
              : `Cloud Sync: ${isOnline ? 'Active (Click to re-sync)' : 'Offline (Saved locally)'}\nLast Sync: ${saveHealth?.lastCloudSyncAt ? new Date(saveHealth.lastCloudSyncAt).toLocaleTimeString('en-IN') : 'None'}`
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            backgroundColor: !isOnline ? 'rgba(239, 68, 68, 0.2)' : (saveHealth?.status === 'saving' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)'),
            color: !isOnline ? '#fca5a5' : (saveHealth?.status === 'saving' ? '#fcd34d' : '#86efac'),
            border: `1px solid ${!isOnline ? 'rgba(239, 68, 68, 0.3)' : (saveHealth?.status === 'saving' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)')}`
          }}
        >
          {!isOnline ? (
            <>
              <CloudOff size={13} />
              <span>{isMarathi ? 'ऑफलाइन' : 'Offline'}</span>
            </>
          ) : saveHealth?.status === 'saving' ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>{isMarathi ? 'सिंक होत आहे...' : 'Syncing...'}</span>
            </>
          ) : (
            <>
              <Cloud size={13} />
              <span>{isMarathi ? 'क्लाउड सिंक' : 'Cloud Synced'}</span>
            </>
          )}
        </div>

        {isOwnerRole(role) && currentTab !== 'oldcustomers' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
            <Building2 size={14} color="rgba(255, 255, 255, 0.7)" />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' }}>
              {isMarathi ? 'शाखा:' : 'Branch:'}
            </span>
            <select
              value={activeBranch}
              onChange={(e) => setActiveBranch(e.target.value)}
              style={{
                padding: '3px 8px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#111827',
                border: 'none',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Toggle Calculator Button */}
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setShowCalculator(!showCalculator)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: showCalculator ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.12)',
            color: showCalculator ? '#fca5a5' : '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '12px',
            cursor: 'pointer',
            height: '34px',
            transition: 'all 0.2s ease'
          }}
          title={showCalculator ? (isMarathi ? 'कॅल्क्युलेटर लपवा' : 'Hide Calculator') : (isMarathi ? 'कॅल्क्युलेटर दाखवा' : 'Show Calculator')}
        >
          {showCalculator ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{showCalculator ? (isMarathi ? 'लपवा' : 'Hide Calc') : (isMarathi ? 'दाखवा' : 'Show Calc')}</span>
        </button>

        {/* Logout Button */}
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '34px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '8px'
          }}
        >
          <LogOut size={14} />
          <span>{isMarathi ? 'लॉगआउट' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
}
