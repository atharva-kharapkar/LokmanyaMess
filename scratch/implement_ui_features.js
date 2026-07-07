const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Wrap the Customers panel rendering with the multi-tab check and passcode overlay
const panelTarget = `          {/* CUSTOMERS TAB */}
          {currentTab === 'customers' && (
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
                  {/* Filter dropdown removed */}
                  <button className="btn btn-primary" onClick={openAddCust}>
                    <Plus size={16} /> {t('addCustomer')}
                  </button>
                  <button className="btn" onClick={handleExportCustomers}>
                    <Download size={16} /> {t('exportCsv')}
                  </button>
                </div>

                <div className="customer-bars-list">
                  {filteredCustomers.map(c => {
                    const status = computeStatus(c);
                    const remaining = getCustomerDues(c);
                    const hasDues = remaining > 0;
                    
                    return (
                      <div key={c.id} className={\`customer-bar status-\${status} \${hasDues ? 'has-dues' : 'no-dues'}\`}>`;

const panelReplacement = `          {/* CUSTOMERS, TIFFIN, SHORT-TERM, AND OLD CUSTOMERS TABS */}
          {(currentTab === 'customers' || currentTab === 'tiffin' || currentTab === 'shortterm' || currentTab === 'oldcustomers') && (
            currentTab === 'oldcustomers' && !isArchiveUnlocked ? (
              <div className="tab-panel animate-fade">
                <div className="card-section" style={{ maxWidth: '420px', margin: '60px auto', padding: '32px', textAlign: 'center', borderRadius: '16px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{db.settings.lang === 'mr' ? 'आर्काइव्ह प्रवेश नियंत्रण' : 'Archive Access Control'}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 24px' }}>
                    {db.settings.lang === 'mr' ? 'संग्रहित जुने ग्राहक रेकॉर्ड पाहण्यासाठी संकेतशब्द प्रविष्ट करा.' : 'Please enter the archive access password to view archived profiles.'}
                  </p>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••"
                    value={archivePinInput}
                    onChange={(e) => setArchivePinInput(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '6px', marginBottom: '20px', padding: '10px' }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={() => {
                      const correctPin = db.settings.archivePassword || '1234';
                      if (archivePinInput === correctPin) {
                        setIsArchiveUnlocked(true);
                        setArchivePinInput('');
                        showToast(db.settings.lang === 'mr' ? 'प्रवेश मंजूर!' : 'Access Granted!', 'success');
                      } else {
                        showToast(db.settings.lang === 'mr' ? 'चुकीचा पासवर्ड!' : 'Incorrect Password!', 'error');
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
                    <button className="btn" onClick={handleExportCustomers}>
                      <Download size={16} /> {t('exportCsv')}
                    </button>
                  </div>

                  <div className="customer-bars-list">
                    {filteredCustomers.map(c => {
                      const status = computeStatus(c);
                      const remaining = getCustomerDues(c);
                      const hasDues = remaining > 0;
                      
                      // 6-day grace period logic for Dine-in & Tiffin
                      let isNameRed = false;
                      if (hasDues && c.category !== 'shortterm' && c.status !== 'old') {
                        const daysPerCycle = PLAN_DAYS[c.plan] || 30;
                        const startDate = parseLocalDate(c.joinDate);
                        const today = new Date();
                        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const elapsedTime = todayMidnight - startDate;
                        const elapsedDays = Math.round(elapsedTime / 86400000);
                        const currentCycleDays = elapsedDays % daysPerCycle;
                        if (currentCycleDays >= 6) {
                          isNameRed = true;
                        }
                      }
                      
                      return (
                        <div key={c.id} className={\`customer-bar status-\${status} \${hasDues ? 'has-dues' : 'no-dues'}\`}>`;

if (content.includes(panelTarget)) {
  content = content.replace(panelTarget, panelReplacement);
  console.log('Wrapped customer lists inside tab routing, passcode, and grace checkers!');
} else {
  console.error('Failed to locate panel target in App.jsx');
}

// 2. Adjust name color rendering inside the card
const nameTarget = `                        {/* Middle-Left: Basic Info */}
                        <div className="customer-bar-info">
                          <div className="customer-bar-name">{c.name}</div>`;

const nameReplacement = `                        {/* Middle-Left: Basic Info */}
                        <div className="customer-bar-info">
                          <div 
                            className="customer-bar-name"
                            style={{ 
                              color: isNameRed ? '#ff1e1e' : 'var(--text-primary)', 
                              fontWeight: isNameRed ? '800' : '600'
                            }}
                          >
                            {c.name} {isNameRed && (db.settings.lang === 'mr' ? ' (६ दिवस थकीत!)' : ' (6-Day Dues Warning!)')}
                          </div>`;

if (content.includes(nameTarget)) {
  content = content.replace(nameTarget, nameReplacement);
  console.log('Modified customer name coloring for overdue dues warning!');
}

// 3. Update the customer Add/Edit modal form fields
// First: Parameterize the billing plan selection for shortterm
const modalPlanTarget = `              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('billingPlan')}</label>
                  <select
                    className="form-select"
                    value={custForm.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      const amount = plan === 'Monthly' ? '1500' : plan === 'Weekly' ? '500' : plan === 'Daily' ? '80' : '0';
                      setCustForm({ ...custForm, plan, amount, deposited: '0' });
                    }}
                  >
                    <option value="Monthly">{t('monthly30')}</option>
                    <option value="Weekly">{t('weekly7')}</option>
                    <option value="Daily">{t('daily1')}</option>
                    <option value="Custom">{t('custom')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('subFeeLabel')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={custForm.amount}
                    onChange={(e) => setCustForm({ ...custForm, amount: e.target.value })}
                  />
                </div>
              </div>`;

const modalPlanReplacement = `              {currentTab === 'shortterm' ? (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{db.settings.lang === 'mr' ? 'कालावधी (दिवस) *' : 'Duration (Days) *'}</label>
                    <input
                      type="number"
                      className="form-input"
                      value={shortTermDays}
                      onChange={(e) => {
                        const days = e.target.value;
                        setShortTermDays(days);
                        const amt = Number(days) * Number(shortTermMeals) * 80;
                        setCustForm(prev => ({ ...prev, amount: String(amt) }));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{db.settings.lang === 'mr' ? 'रोजचे जेवण *' : 'Meals Per Day *'}</label>
                    <select
                      className="form-select"
                      value={shortTermMeals}
                      onChange={(e) => {
                        const meals = e.target.value;
                        setShortTermMeals(meals);
                        const amt = Number(shortTermDays) * Number(meals) * 80;
                        setCustForm(prev => ({ ...prev, amount: String(amt) }));
                      }}
                    >
                      <option value="1">1 Meal / Day</option>
                      <option value="2">2 Meals / Day</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('billingPlan')}</label>
                    <select
                      className="form-select"
                      value={custForm.plan}
                      onChange={(e) => {
                        const plan = e.target.value;
                        const amount = plan === 'Monthly' ? '1500' : plan === 'Weekly' ? '500' : plan === 'Daily' ? '80' : '0';
                        setCustForm({ ...custForm, plan, amount, deposited: '0' });
                      }}
                    >
                      <option value="Monthly">{t('monthly30')}</option>
                      <option value="Weekly">{t('weekly7')}</option>
                      <option value="Daily">{t('daily1')}</option>
                      <option value="Custom">{t('custom')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('subFeeLabel')}</label>
                    <input
                      type="number"
                      className="form-input"
                      value={custForm.amount}
                      onChange={(e) => setCustForm({ ...custForm, amount: e.target.value })}
                      readOnly={currentTab === 'shortterm'}
                    />
                  </div>
                </div>
              )}`;

if (content.includes(modalPlanTarget)) {
  content = content.replace(modalPlanTarget, modalPlanReplacement);
  console.log('Parameterized modal billing selector for short-term members!');
}

// Second: Parameterize the Address Label
const modalAddressTarget = `              <div className="form-group">
                <label className="form-label">{t('addressLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('addressPlaceholder')}
                  value={custForm.addr}
                  onChange={(e) => setCustForm({ ...custForm, addr: e.target.value })}
                />
              </div>`;

const modalAddressReplacement = `              <div className="form-group">
                <label className="form-label">
                  {currentTab === 'tiffin' 
                    ? (db.settings.lang === 'mr' ? 'टिफिन डिलिव्हरी पत्ता *' : 'Tiffin Delivery Address *')
                    : t('addressLabel')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={currentTab === 'tiffin' ? (db.settings.lang === 'mr' ? 'उदा. फ्लैट ३०४, साई सावली अपार्टमेंट' : 'e.g. Flat 304, Sai Savli Apartment') : t('addressPlaceholder')}
                  value={custForm.addr}
                  onChange={(e) => setCustForm({ ...custForm, addr: e.target.value })}
                  required={currentTab === 'tiffin'}
                />
              </div>`;

if (content.includes(modalAddressTarget)) {
  content = content.replace(modalAddressTarget, modalAddressReplacement);
  console.log('Parameterized address input labels in modal!');
}

// 4. Update the Settings page rendering to include Branch Selection and Archive passcode modifier
const settingsBranchTarget = `                  <div className="form-row">
                    <div className="form-group" style={{ maxWidth: '50%' }}>
                      <label className="form-label">{t('langPreference')}</label>
                      <select
                        className="form-select"
                        value={db.settings.lang || 'en'}
                        onChange={(e) => saveDb({ ...db, settings: { ...db.settings, lang: e.target.value } })}
                      >
                        <option value="en">English</option>
                        <option value="mr">मराठी (Marathi)</option>
                      </select>
                    </div>
                  </div>`;

const settingsBranchReplacement = `                  <div className="form-row">
                    <div className="form-group" style={{ maxWidth: '50%' }}>
                      <label className="form-label">{t('langPreference')}</label>
                      <select
                        className="form-select"
                        value={db.settings.lang || 'en'}
                        onChange={(e) => saveDb({ ...db, settings: { ...db.settings, lang: e.target.value } })}
                      >
                        <option value="en">English</option>
                        <option value="mr">मराठी (Marathi)</option>
                      </select>
                    </div>
                    
                    <div className="form-group" style={{ maxWidth: '50%' }}>
                      <label className="form-label">{db.settings.lang === 'mr' ? 'या कॉम्प्युटरसाठी कार्यरत शाखा' : 'Active Branch for this Laptop'}</label>
                      <select
                        className="form-select"
                        value={activeBranch}
                        onChange={(e) => {
                          setActiveBranch(e.target.value);
                          localStorage.setItem('lokmanya_active_branch', e.target.value);
                          showToast(db.settings.lang === 'mr' ? 'शाखा बदलली!' : 'Active branch updated!', 'success');
                        }}
                      >
                        <option value="Branch 1">Branch 1 (Mess 1)</option>
                        <option value="Branch 2">Branch 2 (Mess 2)</option>
                      </select>
                    </div>
                  </div>`;

if (content.includes(settingsBranchTarget)) {
  content = content.replace(settingsBranchTarget, settingsBranchReplacement);
  console.log('Added branch selector in Settings page!');
}

const settingsSecurityTarget = `                  <div className="form-group" style={{ maxWidth: '50%' }}>
                    <label className="form-label">{t('ownerPin')}</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          type={showSettingsPin ? "text" : "password"}
                          className="form-input"
                          maxLength="6"
                          placeholder="••••••"
                          value={newPinInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\\D/g, '');
                            setNewPinInput(val);
                          }}
                          style={{ width: '100%', paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPin(!showSettingsPin)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                          }}
                        >
                          {showSettingsPin ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          if (newPinInput.length !== 6) {
                            showToast(db.settings.lang === 'mr' ? 'पिन अचूक ६ अंकी असणे आवश्यक आहे.' : 'PIN must be exactly 6 digits.', 'error');
                            return;
                          }
                          saveDb({ ...db, settings: { ...db.settings, ownerPin: newPinInput } });
                          showToast(db.settings.lang === 'mr' ? 'पिन यशस्वीरित्या बदलला आणि जतन केला!' : 'PIN changed and saved successfully!', 'success');
                        }}
                      >
                        {db.settings.lang === 'mr' ? 'पिन जतन करा' : 'Save PIN'}
                      </button>
                    </div>
                  </div>`;

const settingsSecurityReplacement = `                  <div className="form-group" style={{ maxWidth: '50%' }}>
                    <label className="form-label">{t('ownerPin')}</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          type={showSettingsPin ? "text" : "password"}
                          className="form-input"
                          maxLength="6"
                          placeholder="••••••"
                          value={newPinInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\\D/g, '');
                            setNewPinInput(val);
                          }}
                          style={{ width: '100%', paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPin(!showSettingsPin)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                          }}
                        >
                          {showSettingsPin ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          if (newPinInput.length !== 6) {
                            showToast(db.settings.lang === 'mr' ? 'पिन अचूक ६ अंकी असणे आवश्यक आहे.' : 'PIN must be exactly 6 digits.', 'error');
                            return;
                          }
                          saveDb({ ...db, settings: { ...db.settings, ownerPin: newPinInput } });
                          showToast(db.settings.lang === 'mr' ? 'पिन यशस्वीरित्या बदलला आणि जतन केला!' : 'PIN changed and saved successfully!', 'success');
                        }}
                      >
                        {db.settings.lang === 'mr' ? 'पिन जतन करा' : 'Save PIN'}
                      </button>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: '700', fontSize: '15px' }}>
                      {db.settings.lang === 'mr' ? 'जुने ग्राहक आर्काइव्ह संकेतशब्द सेटिंग्ज' : 'Old Customers Archive Passcode settings'}
                    </label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>{db.settings.lang === 'mr' ? 'डेव्हलपर मास्टर की' : 'Developer Master Key'}</label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Developer Key"
                          value={devKeyInput}
                          onChange={(e) => setDevKeyInput(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>{db.settings.lang === 'mr' ? 'नवीन आर्काइव्ह पासवर्ड' : 'New Archive Password'}</label>
                        <input
                          type="password"
                          className="form-input"
                          maxLength="6"
                          placeholder="New Passcode"
                          value={newArchivePinInput}
                          onChange={(e) => setNewArchivePinInput(e.target.value.replace(/\\D/g, ''))}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            if (devKeyInput !== 'LKMESSDEV2026') {
                              showToast(db.settings.lang === 'mr' ? 'चुकीची डेव्हलपर मास्टर की!' : 'Invalid Developer Master Key!', 'error');
                              return;
                            }
                            if (newArchivePinInput.length < 4) {
                              showToast(db.settings.lang === 'mr' ? 'पासवर्ड किमान ४ अंकी असावा!' : 'Password must be at least 4 digits!', 'error');
                              return;
                            }
                            saveDb({ ...db, settings: { ...db.settings, archivePassword: newArchivePinInput } });
                            setDevKeyInput('');
                            setNewArchivePinInput('');
                            showToast(db.settings.lang === 'mr' ? 'आर्काइव्ह पासवर्ड यशस्वीरित्या बदलला!' : 'Archive passcode updated successfully!', 'success');
                          }}
                        >
                          {db.settings.lang === 'mr' ? 'अपडेट करा' : 'Update Passcode'}
                        </button>
                      </div>
                    </div>
                  </div>`;

if (content.includes(settingsSecurityTarget)) {
  content = content.replace(settingsSecurityTarget, settingsSecurityReplacement);
  console.log('Added archive security passcode editor in Settings page!');
}

fs.writeFileSync(appFile, content, 'utf8');
console.log('Finished updating UI features inside App.jsx');
