import React from 'react';

export default function LocalDataBackupsSection({
  db,
  saveDb,
  saveHealth = {},
  saveHealthUi = {},
  formatHealthTimestamp,
  retryLastSave,
  todayStr,
  sanitizeImportedDb,
  handleForceRestoreFromCloud,
  isFactoryResetSectionUnlocked,
  setIsFactoryResetSectionUnlocked,
  setIsFactoryResetSectionAuthOpen,
  handleFactoryReset
}) {
  const isMarathi = db?.settings?.lang === 'mr';

  return (
    <div style={{ marginTop: '16px' }}>
      <label className="form-label" style={{ fontWeight: '700', fontSize: '15px' }}>
        {isMarathi ? 'लोकल डेटा आणि बॅकअप्स (Local Data & Backups)' : 'Local Data & Backups'}
      </label>

      {/* Save Health & Status Box */}
      <div
        style={{
          marginTop: '10px',
          padding: '14px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: saveHealthUi.color || '#10b981',
              display: 'inline-block'
            }}
          />
          <strong style={{ color: 'var(--text)' }}>{saveHealthUi.label || 'Storage Status'}</strong>
          {saveHealth.pending > 0 && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              {saveHealth.pending} queued
            </span>
          )}
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {saveHealthUi.details}
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'grid', gap: '4px' }}>
          <span>
            {isMarathi ? 'शेवटची लोकल सेव्ह वेळ: ' : 'Last local save: '}
            {formatHealthTimestamp ? formatHealthTimestamp(saveHealth.lastLocalSaveAt) : (saveHealth.lastLocalSaveAt || 'N/A')}
          </span>
          <span>
            {isMarathi ? 'शेवटची क्लाउड सिंक वेळ: ' : 'Last cloud sync: '}
            {formatHealthTimestamp ? formatHealthTimestamp(saveHealth.lastCloudSyncAt) : (saveHealth.lastCloudSyncAt || 'N/A')}
          </span>
          <span>
            {isMarathi ? 'पूर्ण झालेली सेव्ह वेळ: ' : 'Last completed save: '}
            {formatHealthTimestamp ? formatHealthTimestamp(saveHealth.lastSavedAt) : (saveHealth.lastSavedAt || 'N/A')}
          </span>
          {saveHealth.lastError && (
            <span style={{ color: 'var(--danger)' }}>
              {isMarathi ? 'शेवटची त्रुटी: ' : 'Latest issue: '}{saveHealth.lastError}
            </span>
          )}
        </div>

        {(saveHealth.status === 'error' || saveHealth.status === 'degraded') && retryLastSave && (
          <div>
            <button className="btn btn-sm" onClick={retryLastSave}>
              {isMarathi ? 'पुन्हा प्रयत्न करा (Retry Last Save)' : 'Retry Last Save'}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
        {/* Download Backup */}
        <button
          type="button"
          className="btn"
          onClick={() => {
            const dbString = JSON.stringify(db, null, 2);
            const blob = new Blob([dbString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            const dateSuffix = todayStr ? todayStr() : new Date().toISOString().split('T')[0];
            link.setAttribute("download", `lokmanya_db_backup_${dateSuffix}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          📁 {isMarathi ? 'डेटाबेस बॅकअप फाईल डाउनलोड करा' : 'Download DB Backup file'}
        </button>

        {/* Import Backup */}
        <label className="btn" style={{ cursor: 'pointer', margin: 0 }}>
          📥 {isMarathi ? 'डेटाबेस बॅकअप फाईल इंपोर्ट करा' : 'Import DB Backup file'}
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                alert(isMarathi ? 'बॅकअप फाईल खूप मोठी आहे. कृपया ५ MB पेक्षा लहान फाईल वापरा.' : 'Backup file is too large. Please use a file under 5 MB.');
                e.target.value = '';
                return;
              }
              const reader = new FileReader();
              reader.onload = async (evt) => {
                try {
                  const parsed = JSON.parse(evt.target.result);
                  const sanitizedImport = sanitizeImportedDb ? sanitizeImportedDb(parsed) : parsed;
                  const confirmImport = window.confirm(
                    isMarathi 
                      ? 'बॅकअप इंपोर्ट केल्याने सध्याचा डेटा बदलला जाईल. पुढे जायचे का?'
                      : 'Importing a backup will replace current in-memory data. Continue?'
                  );
                  if (!confirmImport) {
                    e.target.value = '';
                    return;
                  }
                  await saveDb(sanitizedImport);
                  alert(isMarathi ? 'डेटाबेस यशस्वीरित्या इंपोर्ट झाला!' : 'Database imported successfully!');
                  window.location.reload();
                } catch (err) {
                  alert((isMarathi ? 'फाईल वाचताना त्रुटी: ' : 'Error reading file: ') + err.message);
                } finally {
                  e.target.value = '';
                }
              };
              reader.readAsText(file);
            }}
          />
        </label>

        {/* Restore / Sync from Cloud Button */}
        <button 
          type="button"
          className="btn btn-outline" 
          style={{ 
            backgroundColor: '#EFF6FF', 
            color: '#1D4ED8', 
            borderColor: '#BFDBFE', 
            fontWeight: '700', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}
          onClick={handleForceRestoreFromCloud}
        >
          ☁️ {isMarathi ? 'क्लाउडवरून डेटा सिंक करा (Restore / Sync from Cloud)' : 'Restore / Sync from Cloud'}
        </button>
      </div>

      {/* Factory Reset Unlock Section */}
      <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        {!isFactoryResetSectionUnlocked ? (
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontWeight: '600', color: 'var(--primary)', borderColor: 'var(--primary)' }}
            onClick={() => setIsFactoryResetSectionAuthOpen(true)}
          >
            🔑 {isMarathi ? 'फॅक्टरी रीसेट पर्याय अनलॉक करा' : 'Unlock Factory Reset'}
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn btn-danger" 
                style={{ 
                  backgroundColor: '#dc2626', 
                  borderColor: '#dc2626', 
                  color: '#ffffff',
                  fontWeight: '600'
                }} 
                onClick={handleFactoryReset}
              >
                🚨 {isMarathi ? 'सर्व डेटा रीसेट करा (Factory Reset)' : 'Factory Reset (Delete All Data)'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setIsFactoryResetSectionUnlocked(false)}
              >
                🔒 {isMarathi ? 'लॉक करा' : 'Lock'}
              </button>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '6px' }}>
              {isMarathi 
                ? 'इशारा: यामुळे सर्व ग्राहक, पेमेंट आणि कर्मचाऱ्यांची माहिती डिलीट होईल. लॉगिन सेटिंग्ज सुरक्षित राहतील.' 
                : 'WARNING: This will permanently delete all customers, transactions, and employees from both local and cloud databases. Login credentials will remain safe.'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
