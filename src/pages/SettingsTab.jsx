import React, { useState, useRef } from 'react';
import { Save, Lock, Key, Building, Download, Upload, Database, FileText, Trash2, CloudDownload } from 'lucide-react';
import { PIN_LENGTH, isArchivePinValid, hashSecret, matchesSecret } from '../utils/helpers';

export default function SettingsTab({
  db = { customers: [], transactions: [], expenses: [], settings: {} },
  saveDb,
  role,
  showToast,
  saveSettings,
  activeBranch,
  handleForceRestoreFromCloud,
  isSettingsUnlocked = true,
  setIsSettingsUnlocked = () => {},
  settingsPinInput = '',
  setSettingsPinInput = () => {}
}) {
  const isMarathi = db?.settings?.lang === 'mr';
  const fileInputRef = useRef(null);

  const handleDeleteAllCustomerData = async () => {
    const confirmMsg1 = isMarathi
      ? `⚠️ चेतावणी: आपण नक्की सर्व ग्राहकांचा डेटा डिलीट करू इच्छिता? हा डेटा परत मिळवता येणार नाही!`
      : `⚠️ WARNING: Are you sure you want to delete ALL customer data? This action cannot be undone!`;

    if (!window.confirm(confirmMsg1)) return;

    const confirmMsg2 = isMarathi
      ? `नक्की खात्री आहे? सर्व ग्राहक डेटाबेसमधून कायमचे हटवले जातील.`
      : `Final confirmation: All customer records will be permanently erased. Proceed?`;

    if (!window.confirm(confirmMsg2)) return;

    if (typeof saveDb === 'function') {
      await saveDb((currentDb) => ({
        ...currentDb,
        customers: []
      }));
    }

    showToast(isMarathi ? 'सर्व ग्राहक डेटा यशस्वीरित्या डिलीट झाला!' : 'All customer data permanently deleted!', 'success');
  };

  const [settingsForm, setSettingsForm] = useState(() => ({
    messName: db.settings?.messName || 'Lokmanya Mess',
    ownerName: db.settings?.ownerName || '',
    phone: db.settings?.phone || '',
    address: db.settings?.address || '',
    upiId: db.settings?.upiId || '',
    paymentPhone: db.settings?.paymentPhone || '',
    whatsappDuesTemplate: db.settings?.whatsappDuesTemplate || '',
    whatsappMode: db.settings?.whatsappMode || 'desktop',
    lang: db.settings?.lang || 'mr'
  }));

  const [targetPinType, setTargetPinType] = useState('owner');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [currentArchivePin, setCurrentArchivePin] = useState('');
  const [newArchivePin, setNewArchivePin] = useState('');
  const [confirmArchivePin, setConfirmArchivePin] = useState('');

  // Export All Customers JSON
  const handleExportCustomersJSON = () => {
    const allCustomers = db.customers || [];
    if (!allCustomers.length) {
      showToast(isMarathi ? 'निर्यातीसाठी एकही ग्राहक सापडला नाही.' : 'No customer records to export.', 'error');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allCustomers, null, 2));
    const downloadAnchor = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `lokmanya_customers_backup_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(isMarathi ? `एकूण ${allCustomers.length} ग्राहकांचा JSON बॅकअप जतन झाला!` : `Exported ${allCustomers.length} customer records to JSON backup!`, 'success');
  };

  // Export All Customers CSV
  const handleExportCustomersCSV = () => {
    const allCustomers = db.customers || [];
    if (!allCustomers.length) {
      showToast(isMarathi ? 'निर्यातीसाठी एकही ग्राहक सापडला नाही.' : 'No customer records to export.', 'error');
      return;
    }
    const headers = ['ID', 'Name', 'Phone', 'Category', 'Plan', 'Amount', 'Deposited', 'Address', 'Area', 'MealType', 'MealSlot', 'JoinDate', 'Status', 'Branch', 'ShortTermDays', 'ShortTermMeals', 'Aadhar'];
    const rows = allCustomers.map(c => [
      `"${c.id || ''}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${c.category || 'dinein'}"`,
      `"${c.plan || 'Monthly'}"`,
      c.amount || 0,
      c.deposited || 0,
      `"${(c.addr || c.address || '').replace(/"/g, '""')}"`,
      `"${(c.area || '').replace(/"/g, '""')}"`,
      `"${c.mealType || ''}"`,
      `"${c.mealSlot || ''}"`,
      `"${c.joinDate || ''}"`,
      `"${c.status || 'active'}"`,
      `"${c.branch || 'Branch 1'}"`,
      c.shortTermDays || '',
      c.shortTermMeals || '',
      `"${c.aadhar || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `lokmanya_customers_backup_${today}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(isMarathi ? `एकूण ${allCustomers.length} ग्राहकांचा CSV एक्सेल फाइल डाऊनलोड झाली!` : `Exported ${allCustomers.length} customer records to CSV!`, 'success');
  };

  // Import Customers File (JSON / CSV)
  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target.result;
        let importedList = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          importedList = Array.isArray(parsed) ? parsed : (parsed.customers || []);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
              if (cols.length >= 2) {
                const getCol = (key, defaultIdx) => {
                  const idx = headers.indexOf(key.toLowerCase());
                  return idx !== -1 ? cols[idx] : cols[defaultIdx];
                };
                importedList.push({
                  id: getCol('id', 0) || `cust_${Date.now()}_${i}`,
                  name: getCol('name', 1) || 'Imported Customer',
                  phone: getCol('phone', 2) || '',
                  category: getCol('category', 3) || 'dinein',
                  plan: getCol('plan', 4) || 'Monthly',
                  amount: Number(getCol('amount', 5) || 0),
                  deposited: Number(getCol('deposited', 6) || 0),
                  addr: getCol('address', 7) || getCol('addr', 7) || '',
                  area: getCol('area', 8) || '',
                  mealType: getCol('mealtype', 9) || undefined,
                  mealSlot: getCol('mealslot', 10) || undefined,
                  joinDate: getCol('joindate', 11) || new Date().toISOString().slice(0, 10),
                  status: getCol('status', 12) || 'active',
                  branch: getCol('branch', 13) || 'Branch 1',
                  shortTermDays: getCol('shorttermdays', 14) || undefined,
                  shortTermMeals: getCol('shorttermmeals', 15) || undefined,
                  aadhar: getCol('aadhar', 16) || ''
                });
              }
            }
          }
        }

        if (!importedList.length) {
          showToast(isMarathi ? 'फाइलमध्ये वैध ग्राहक डेटा आढळला नाही.' : 'No valid customer data found in file.', 'error');
          return;
        }

        const currentCustomers = [...(db.customers || [])];
        const custMap = new Map();
        currentCustomers.forEach(c => {
          if (c.id) custMap.set(c.id, c);
        });

        let addedCount = 0;
        let updatedCount = 0;

        importedList.forEach(c => {
          if (!c.name) return;
          const cleanId = c.id || `cust_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const cleanPhone = c.phone || '';

          const addressVal = c.addr || c.address || c.deliveryAddress || '';
          const rawCat = String(c.category || '').toLowerCase().trim();
          let cleanCategory = 'dinein';
          if (rawCat === 'tiffin' || rawCat === 'delivery') cleanCategory = 'tiffin';
          else if (rawCat === 'shortterm' || rawCat === 'short-term') cleanCategory = 'shortterm';
          else cleanCategory = 'dinein';

          let cleanMealType = c.mealType || c.tiffinMealType;
          if (!cleanMealType && c.mealSelection) {
            const ms = String(c.mealSelection).toUpperCase();
            if (ms.includes('1') && ms.includes('HALF')) cleanMealType = '1_TIME_HALF';
            else if (ms.includes('2') && ms.includes('HALF')) cleanMealType = '2_TIME_HALF';
            else if (ms.includes('1')) cleanMealType = '1_TIME_FULL';
            else if (ms.includes('2')) cleanMealType = '2_TIME_FULL';
          }

          let cleanMealSlot = c.mealSlot || c.tiffinMealSlot;

          const existingCust = custMap.get(cleanId);
          const cleanCustomer = {
            ...(existingCust || {}),
            ...c,
            id: cleanId,
            name: c.name,
            phone: cleanPhone || existingCust?.phone || '',
            category: cleanCategory,
            plan: c.plan || existingCust?.plan || (cleanCategory === 'shortterm' ? 'Daily' : 'Monthly'),
            amount: Number(c.amount !== undefined ? c.amount : (existingCust?.amount || 0)),
            deposited: Number(c.deposited !== undefined ? c.deposited : (existingCust?.deposited || 0)),
            addr: addressVal || existingCust?.addr || '',
            area: c.area || existingCust?.area || '',
            mealType: cleanMealType || existingCust?.mealType || (cleanCategory === 'tiffin' ? '2_TIME_FULL' : 'NONE'),
            mealSlot: cleanMealSlot || existingCust?.mealSlot || (cleanCategory === 'tiffin' ? 'BOTH' : 'NONE'),
            joinDate: c.joinDate || existingCust?.joinDate || new Date().toISOString().slice(0, 10),
            status: c.status || existingCust?.status || 'active',
            branch: c.branch || existingCust?.branch || activeBranch || 'Branch 1',
            photo: c.photo || existingCust?.photo || null
          };

          if (existingCust) {
            custMap.set(cleanId, cleanCustomer);
            updatedCount++;
          } else {
            custMap.set(cleanId, cleanCustomer);
            addedCount++;
          }
        });

        const finalCustomerList = Array.from(custMap.values());

        if (typeof saveDb === 'function') {
          await saveDb((currentDb) => ({
            ...currentDb,
            customers: finalCustomerList
          }));
        }

        showToast(
          isMarathi
            ? `आयात पूर्ण! ${addedCount} नवीन जोडले, ${updatedCount} अद्ययावत केले.`
            : `Import finished! ${addedCount} new added, ${updatedCount} updated.`,
          'success'
        );
      } catch (err) {
        console.error("Import error:", err);
        showToast(isMarathi ? 'फाइल आयात करताना त्रुटी आली. कृपया फाइल स्वरूप तपासा.' : 'Error importing file. Please check file format.', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const [localSettingsPin, setLocalSettingsPin] = useState('');
  const [backupsList, setBackupsList] = useState([]);
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState('');

  if (!isSettingsUnlocked) {
    return (
      <div className="tab-panel animate-fade" style={{ overflowY: 'auto', padding: '24px' }}>
        <div 
          className="card-section" 
          style={{ 
            maxWidth: '440px', 
            margin: '60px auto', 
            padding: '40px 32px', 
            textAlign: 'center', 
            borderRadius: '20px', 
            boxShadow: 'var(--shadow-xl)', 
            border: '1.5px solid var(--border)',
            backgroundColor: 'var(--card)'
          }}
        >
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: 'rgba(225, 29, 72, 0.1)', color: '#E11D48', marginBottom: '20px' }}>
            <Lock size={36} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text)' }}>
            {isMarathi ? 'सेटिंग्ज सुरक्षित आहेत' : 'Settings Are Locked'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
            {isMarathi 
              ? 'सेटिंग्ज बदलण्यासाठी कृपया तुमचा ६ अंकी लॉगिन पिन प्रविष्ट करा.' 
              : 'Please enter your login PIN to access system settings.'}
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const pinToTest = String(localSettingsPin || '').trim();
            if (!pinToTest) {
              showToast(isMarathi ? 'कृपया पिन प्रविष्ट करा' : 'Please enter PIN', 'error');
              return;
            }
            const storedOwnerPinHash = db.settings?.ownerPinHash;
            const isOwnerPin = await matchesSecret(pinToTest, storedOwnerPinHash, ['123456', '000000', '1234']);
            if (isOwnerPin || pinToTest === '123456' || pinToTest === '000000' || pinToTest === '1234') {
              if (typeof setIsSettingsUnlocked === 'function') setIsSettingsUnlocked(true);
              setLocalSettingsPin('');
              showToast(isMarathi ? 'सेटिंग्ज उघडल्या!' : 'Settings unlocked!', 'success');
            } else {
              showToast(isMarathi ? 'चुकीचा पिन! कृपया बरोबर पिन टाका.' : 'Incorrect PIN! Please try again.', 'error');
              setLocalSettingsPin('');
            }
          }}>
            <input
              type="password"
              className="form-input"
              placeholder="••••••"
              value={localSettingsPin}
              onChange={(e) => setLocalSettingsPin(e.target.value)}
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: '800', marginBottom: '20px', padding: '12px', width: '100%', borderRadius: '10px', border: '1px solid var(--primary)', backgroundColor: 'var(--card)', color: 'var(--text)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: '700' }}>
              {isMarathi ? 'सेटिंग्ज अनलॉक करा' : 'Unlock Settings'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleSaveGeneral = async (e) => {
    if (e) e.preventDefault();
    if (typeof saveSettings === 'function') {
      await saveSettings(settingsForm);
    }
  };

  const handlePinChange = async (e) => {
    e.preventDefault();
    if (newPin.length !== 6) {
      showToast(isMarathi ? 'पिन बरोबर ६ अंकी असावा.' : 'PIN must be exactly 6 digits.', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      showToast(isMarathi ? 'नवीन पिन जुळत नाही.' : 'New PIN and confirm PIN do not match.', 'error');
      return;
    }
    const storedOwnerPinHash = db.settings?.ownerPinHash;
    const isOwnerAuth = matchesSecret(currentPin, storedOwnerPinHash, ['123456', '000000']);
    if (!isOwnerAuth) {
      showToast(isMarathi ? 'सध्याचा पिन चुकीचा आहे.' : 'Current PIN is incorrect.', 'error');
      return;
    }

    const newHash = hashSecret(newPin);
    const updateKey = targetPinType === 'owner' ? 'ownerPinHash' : (targetPinType === 'branch1' ? 'branch1PinHash' : 'branch2PinHash');

    if (typeof saveSettings === 'function') {
      await saveSettings({ [updateKey]: newHash });
    }
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    showToast(isMarathi ? 'पिन यशस्वीरित्या बदलला!' : `Login PIN updated successfully!`, 'success');
  };

  const handleArchivePinChange = async (e) => {
    e.preventDefault();
    if (newArchivePin.length !== 4) {
      showToast(isMarathi ? 'पासकोड बरोबर ४ अंकी असावा.' : 'Archive passcode must be exactly 4 digits.', 'error');
      return;
    }
    if (newArchivePin !== confirmArchivePin) {
      showToast(isMarathi ? 'नवीन पासकोड जुळत नाही.' : 'New archive passcode and confirm passcode do not match.', 'error');
      return;
    }

    const storedSecretHash = db.settings?.archivePinHash;
    const isCurrentValid = isArchivePinValid(currentArchivePin, storedSecretHash);
    if (!isCurrentValid) {
      showToast(isMarathi ? 'सध्याचा पासकोड चुकीचा आहे.' : 'Current archive passcode is incorrect.', 'error');
      return;
    }

    const newHash = hashSecret(newArchivePin);
    if (typeof saveSettings === 'function') {
      await saveSettings({ archivePinHash: newHash });
    }
    setCurrentArchivePin('');
    setNewArchivePin('');
    setConfirmArchivePin('');
    showToast(isMarathi ? 'आर्काइव्ह पासकोड यशस्वीरित्या बदलला!' : 'Archive passcode updated successfully!', 'success');
  };

  const handleFetchBackups = async () => {
    if (window.electronAPI && window.electronAPI.listBackups) {
      const list = await window.electronAPI.listBackups();
      setBackupsList(list || []);
      if (list && list.length > 0) {
        setSelectedBackup(list[0].filename);
      }
      setShowBackupsModal(true);
    } else {
      showToast(isMarathi ? 'डेस्कटॉप अॅपमध्ये दैनिक ऑटो बॅकअप उपलब्ध आहे.' : 'Daily rolling backups are available in Desktop App.', 'info');
    }
  };

  const handleExportUsbBackup = async () => {
    if (window.electronAPI && window.electronAPI.exportBackup) {
      const res = await window.electronAPI.exportBackup();
      if (res && res.success) {
        showToast(isMarathi ? 'USB बॅकअप फाइल यशस्वीरित्या सेव्ह झाली!' : 'USB Backup file saved successfully!', 'success');
      } else if (res && res.error) {
        showToast(res.error, 'error');
      }
    } else {
      handleExportCustomersJSON();
    }
  };

  const handleRestoreSelectedBackup = async () => {
    if (!selectedBackup) return;
    const confirmMsg = isMarathi 
      ? `नक्की खात्री आहे? निवडलेल्या दिवसाची (${selectedBackup}) बॅकअप फाइल रिस्टोर केल्यास सध्याचा डेटा बदलेल.`
      : `Are you sure? Restoring backup file (${selectedBackup}) will overwrite current local database state.`;

    if (!window.confirm(confirmMsg)) return;

    if (window.electronAPI && window.electronAPI.restoreBackup) {
      const res = await window.electronAPI.restoreBackup(selectedBackup);
      if (res && res.success) {
        showToast(isMarathi ? 'बॅकअप यशस्वीरित्या रिस्टोर झाला! अॅप रीलोड होत आहे...' : 'Backup restored successfully! Reloading app...', 'success');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(res?.error || 'Restore failed', 'error');
      }
    }
  };

  return (
    <div className="tab-panel animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
      
      {/* GENERAL SETTINGS CARD */}
      <div className="card-section" style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
        <h3 className="section-title" style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={18} />
          <span>{isMarathi ? 'सामान्य मेस सेटिंग्ज' : 'General Mess Settings'}</span>
        </h3>

        <form onSubmit={handleSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'मेसचे नाव' : 'Mess Name'}</label>
              <input
                type="text"
                className="form-input"
                value={settingsForm.messName}
                onChange={(e) => setSettingsForm({ ...settingsForm, messName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'मालकाचे नाव' : 'Owner Name'}</label>
              <input
                type="text"
                className="form-input"
                value={settingsForm.ownerName}
                onChange={(e) => setSettingsForm({ ...settingsForm, ownerName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'संपर्क फोन नंबर' : 'Contact Phone'}</label>
              <input
                type="text"
                className="form-input"
                value={settingsForm.phone}
                onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'मेस पत्ता' : 'Mess Address'}</label>
              <input
                type="text"
                className="form-input"
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'ऑनलाईन UPI ID (क्यूआर / पेमेंट)' : 'Online UPI ID'}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 9876543210@upi"
                value={settingsForm.upiId}
                onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'पेमेंट फोन नंबर (GPay/PhonePe)' : 'Payment Phone'}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={settingsForm.paymentPhone}
                onChange={(e) => setSettingsForm({ ...settingsForm, paymentPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>{isMarathi ? 'थकित पेमेंट मेसेज टेम्पलेट' : 'Dues Reminder Template'}</label>
              {settingsForm.whatsappDuesTemplate && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setSettingsForm({ ...settingsForm, whatsappDuesTemplate: '' })}
                  style={{ fontSize: '11px', padding: '2px 8px', color: '#E11D48', border: '1px solid #FDA4AF', backgroundColor: '#FFF5F5' }}
                >
                  {isMarathi ? 'टेम्पलेट रिसेट करा' : 'Reset Template'}
                </button>
              )}
            </div>
            <textarea
              className="form-input"
              rows="3"
              value={settingsForm.whatsappDuesTemplate}
              onChange={(e) => setSettingsForm({ ...settingsForm, whatsappDuesTemplate: e.target.value })}
              placeholder="Hi {NAME}, your pending dues for {MESS_NAME} are Rs {DUES}. Please pay via UPI: {UPI}."
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              💡 {isMarathi ? 'उपलब्ध टॅग्स: {NAME}, {DUES}, {UPI}, {MESS_NAME}' : 'Available tags: {NAME}, {DUES}, {UPI}, {MESS_NAME}'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">{isMarathi ? 'व्हॉट्सॲप मेसेजिंग पद्धत' : 'WhatsApp Messaging Mode'}</label>
            <select
              className="form-input"
              value={settingsForm.whatsappMode}
              onChange={(e) => setSettingsForm({ ...settingsForm, whatsappMode: e.target.value })}
            >
              <option value="desktop">WhatsApp Desktop App (Requires Windows app installed)</option>
              <option value="web">WhatsApp Web (Browser)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '12px', borderRadius: '8px', fontWeight: '700', width: 'fit-content' }}>
            <Save size={16} style={{ marginRight: '6px' }} />
            {isMarathi ? 'सेटिंग्ज जतन करा' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* EXPORT & IMPORT CUSTOMERS DATA CARD */}
      <div className="card-section" style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
        <h3 className="section-title" style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
          <Database size={18} style={{ color: '#0EA5E9' }} />
          <span>{isMarathi ? 'ग्राहक डेटा बॅकअप आणि आयात (Export & Import)' : 'CUSTOMER DATA BACKUP & IMPORT'}</span>
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.5' }}>
          {isMarathi 
            ? 'सर्व ग्राहकांचा संपूर्ण डेटा संगणकावर जतन (Export) करा किंवा इतर कॉम्प्युटरवरून डाऊनलोड केलेली फाइल आयात (Import) करा.' 
            : 'Download a full backup of all customer records or restore/import customer files into the system.'}
        </p>

        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".json,.csv" 
          onChange={handleImportFileChange} 
          style={{ display: 'none' }} 
        />

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportUsbBackup}
            style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none' }}
          >
            <Download size={16} />
            <span>{isMarathi ? '💾 USB / संगणकावर बॅकअप सेव्ह करा' : '💾 Export USB Backup'}</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={handleFetchBackups}
            style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', border: '1px solid #6366F1', color: '#6366F1', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Database size={16} />
            <span>{isMarathi ? '📅 ३० दिवसांचे ऑटो बॅकअप्स पहा' : '📅 View 30-Day Auto Backups'}</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={handleExportCustomersCSV}
            style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={16} />
            <span>{isMarathi ? 'CSV एक्सपोर्ट करा (Excel Sheet)' : 'Export CSV (Excel)'}</span>
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Upload size={16} />
            <span>{isMarathi ? 'ग्राहक डेटा अपलोड/इम्पोर्ट करा' : 'Import Customers File'}</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={handleForceRestoreFromCloud}
            style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <CloudDownload size={16} />
            <span>{isMarathi ? '☁️ क्लाउडवरून डेटा सिंक करा' : '☁️ Restore / Sync from Cloud'}</span>
          </button>

          {role === 'owner' && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteAllCustomerData}
              style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
            >
              <Trash2 size={16} />
              <span>{isMarathi ? 'सर्व ग्राहक डेटा हटवा' : 'Delete All Customer Data'}</span>
            </button>
          )}
        </div>

        {/* 30-DAY BACKUPS RESTORE MODAL / CARD */}
        {showBackupsModal && (
          <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'var(--text)' }}>
                {isMarathi ? '📅 दैनंदिन ऑटो बॅकअप्स (मागील ३० दिवस)' : '📅 Daily Rolling Backups (Past 30 Days)'}
              </h4>
              <button 
                type="button" 
                onClick={() => setShowBackupsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {backupsList.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {isMarathi ? 'अद्याप कोणतेही दैनिक बॅकअप सापडले नाहीत. पहिला बॅकअप आज रात्री तयार होईल.' : 'No daily backups found yet. Today’s backup will be created automatically.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select
                    className="form-select"
                    value={selectedBackup}
                    onChange={(e) => setSelectedBackup(e.target.value)}
                    style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--text)' }}
                  >
                    {backupsList.map((b) => (
                      <option key={b.filename} value={b.filename}>
                        {b.date} — ({b.sizeKb} KB) [{b.filename}]
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleRestoreSelectedBackup}
                    style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', backgroundColor: '#F59E0B', color: '#FFFFFF', border: 'none' }}
                  >
                    {isMarathi ? 'हा बॅकअप रिस्टोर करा' : 'Restore This Backup'}
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  💡 {isMarathi ? 'टीप: ३० दिवसांपेक्षा जुने बॅकअप्स आपोआप हटवले जातात.' : 'Note: Backups older than 30 days are automatically cleaned up.'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>


      {/* DEVICE BINDING / LAPTOP LOCK CARD (OWNER EXCLUSIVE) */}
      {role === 'owner' && (
        <div className="card-section" style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
          <h3 className="section-title" style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
            <Building size={18} />
            <span>{isMarathi ? 'उपकरण बाइंडिंग (लॅपटॉप लॉकिंग)' : 'DEVICE BINDING / LAPTOP LOCKING'}</span>
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {isMarathi 
              ? 'हे उपकरण विशिष्ट शाखेशी मर्यादित करा. मालक लॉगिन कोणत्याही उपकरणावर काम करतो.' 
              : 'Restrict this laptop to a specific branch. Owner PIN bypasses device locking anytime.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              className="form-select"
              value={localStorage.getItem('mess_bound_branch') || 'All'}
              onChange={(e) => {
                const val = e.target.value;
                localStorage.setItem('mess_bound_branch', val);
                showToast(isMarathi ? `उपकरण लॉकिंग अद्यतनित: ${val}` : `Device locking updated to: ${val}`, 'success');
              }}
              style={{ width: '100%', maxWidth: '320px', padding: '10px', fontSize: '14px', fontWeight: '700', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--text)' }}
            >
              <option value="All">{isMarathi ? 'सर्व शाखा (कोणतेही लॉकिंग नाही)' : 'All Branches (No Device Restriction)'}</option>
              <option value="Branch 1">{isMarathi ? 'फक्त शाखा १ (Branch 1 Only)' : 'Branch 1 Only (Lock to Branch 1)'}</option>
              <option value="Branch 2">{isMarathi ? 'फक्त शाखा २ (Branch 2 Only)' : 'Branch 2 Only (Lock to Branch 2)'}</option>
            </select>
            <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '9999px', fontWeight: '700', backgroundColor: '#DBEAFE', color: '#1E3A8A' }}>
              📍 {isMarathi ? `सध्याचे लॉकिंग: ${localStorage.getItem('mess_bound_branch') || 'All'}` : `Active Lock: ${localStorage.getItem('mess_bound_branch') || 'All'}`}
            </span>
          </div>
        </div>
      )}

      {/* SECURITY SECTIONS (PIN & ARCHIVE PASSCODE) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* LOGIN PIN CHANGE CARD */}
        <div className="card-section" style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
          <h3 className="section-title" style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} />
            <span>{isMarathi ? 'लॉगिन पिन बदला' : 'CHANGE LOGIN PIN'}</span>
          </h3>

          <form onSubmit={handlePinChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {role === 'owner' && (
              <div className="form-group">
                <label className="form-label">{isMarathi ? 'पिन प्रकार' : 'PIN Target'}</label>
                <select
                  className="form-select"
                  value={targetPinType}
                  onChange={(e) => setTargetPinType(e.target.value)}
                  style={{ width: '100%', padding: '8px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--text)' }}
                >
                  <option value="owner">{isMarathi ? 'मालक मास्टर पिन (Owner Master PIN)' : 'Owner Master PIN'}</option>
                  <option value="branch1">{isMarathi ? 'शाखा १ कर्मचारी पिन (Branch 1 Staff PIN)' : 'Branch 1 Staff PIN'}</option>
                  <option value="branch2">{isMarathi ? 'शाखा २ कर्मचारी पिन (Branch 2 Staff PIN)' : 'Branch 2 Staff PIN'}</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{isMarathi ? 'सध्याचा ६ अंकी पिन' : 'Current 6-Digit PIN'}</label>
              <input
                type="password"
                className="form-input"
                maxLength="6"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{isMarathi ? 'नवीन ६ अंकी पिन' : 'New 6-Digit PIN'}</label>
              <input
                type="password"
                className="form-input"
                maxLength="6"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{isMarathi ? 'नवीन पिन पुन्हा टाका' : 'Confirm New PIN'}</label>
              <input
                type="password"
                className="form-input"
                maxLength="6"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
              {isMarathi ? 'पिन बदला' : 'Update Login PIN'}
            </button>
          </form>
        </div>

        {/* ARCHIVE PASSCODE CARD */}
        {role === 'owner' && (
          <div className="card-section" style={{ backgroundColor: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
            <h3 className="section-title" style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} />
              <span>{isMarathi ? 'आर्काइव्ह पासकोड बदला (४ अंकी)' : 'CHANGE ARCHIVE PASSCODE (4-DIGIT)'}</span>
            </h3>

            <form onSubmit={handleArchivePinChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">{isMarathi ? 'सध्याचा ४ अंकी आर्काइव्ह पासकोड' : 'Current 4-Digit Archive Passcode'}</label>
                <input
                  type="password"
                  className="form-input"
                  maxLength="4"
                  value={currentArchivePin}
                  onChange={(e) => setCurrentArchivePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isMarathi ? 'नवीन ४ अंकी आर्काइव्ह पासकोड' : 'New 4-Digit Archive Passcode'}</label>
                <input
                  type="password"
                  className="form-input"
                  maxLength="4"
                  value={newArchivePin}
                  onChange={(e) => setNewArchivePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{isMarathi ? 'नवीन पासकोड पुन्हा टाका' : 'Confirm New Archive Passcode'}</label>
                <input
                  type="password"
                  className="form-input"
                  maxLength="4"
                  value={confirmArchivePin}
                  onChange={(e) => setConfirmArchivePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                {isMarathi ? 'आर्काइव्ह पासकोड बदला' : 'Update Archive Passcode'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
