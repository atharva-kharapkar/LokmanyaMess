import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import LocalDataBackupsSection from './LocalDataBackupsSection';

export default function SettingsTabWeb({
  db,
  saveDb,
  role,
  isSettingsUnlocked,
  setIsSettingsUnlocked,
  settingsPinInput,
  setSettingsPinInput,
  settingsInputRef,
  showToast,
  matchesArchiveSecret,
  t,
  messNameInput,
  setMessNameInput,
  ownerNameInput,
  setOwnerNameInput,
  ownerAddressInput,
  setOwnerAddressInput,
  upiIdInput,
  setUpiIdInput,
  paymentPhoneInput,
  setPaymentPhoneInput,
  whatsappDuesTemplateInput,
  setWhatsappDuesTemplateInput,
  duesLimitInput,
  setDuesLimitInput,
  saveSettingField,
  activeBranch,
  setActiveBranch,
  boundBranch,
  setBoundBranch,
  showSettingsPin,
  setShowSettingsPin,
  newPinInput,
  setNewPinInput,
  savePinSetting,
  showBranch1Pin,
  setShowBranch1Pin,
  newBranch1PinInput,
  setNewBranch1PinInput,
  showBranch2Pin,
  setShowBranch2Pin,
  newBranch2PinInput,
  setNewBranch2PinInput,
  archiveOwnerPinInput,
  setArchiveOwnerPinInput,
  newArchivePinInput,
  setNewArchivePinInput,
  updateArchivePasscodeWithCurrentPasscode,
  updateArchivePasscodeWithOwnerPin,
  saveHealthUi,
  saveHealth,
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
  return (
    <>
      {currentTab === 'settings' && (
            db?.settings?.archivePasswordHash && !isSettingsUnlocked ? (
              <div className="tab-panel animate-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', minHeight: '60vh' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '30px 24px', textAlign: 'center', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
                    <span style={{ fontSize: '24px' }}>🔒</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    {db?.settings?.lang === 'mr' ? 'सेटिंग्ज लॉक' : 'Settings Locked'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 24px', lineHeight: '1.5' }}>
                    {db?.settings?.lang === 'mr' ? 'सिस्टम सेटिंग्ज पाहण्यासाठी किंवा बदलण्यासाठी कृपया पासकोड प्रविष्ट करा.' : 'Please enter the access passcode to view or modify system settings.'}
                  </p>
                  <input
                    key={`settings-passcode-input-${currentTab}-${isSettingsUnlocked}`}
                    id="settings-passcode-input"
                    data-testid="settings-passcode-input"
                    ref={settingsInputRef}
                    type="password"
                    className="form-input"
                    placeholder="••••"
                    maxLength="4"
                    value={settingsPinInput}
                    onChange={(e) => setSettingsPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        if (await matchesArchiveSecret(settingsPinInput, db?.settings?.archivePasswordHash)) {
                          setIsSettingsUnlocked(true);
                          setSettingsPinInput('');
                          showToast(db?.settings?.lang === 'mr' ? 'प्रवेश मंजूर!' : 'Access Granted!', 'success');
                        } else {
                          showToast(db?.settings?.lang === 'mr' ? 'चुकीचा संकेतशब्द!' : 'Incorrect Passcode!', 'error');
                        setSettingsPinInput('');
                        }
                      }
                    }}
                    autoFocus={true}
                    style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '6px', marginBottom: '20px', padding: '10px', pointerEvents: 'auto', userSelect: 'text' }}
                  />
                  <button
                    id="settings-passcode-unlock-btn"
                    data-testid="settings-passcode-unlock-btn"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontWeight: '700' }}
                    onClick={async () => {
                      if (await matchesArchiveSecret(settingsPinInput, db?.settings?.archivePasswordHash)) {
                        setIsSettingsUnlocked(true);
                        setSettingsPinInput('');
                        showToast(db?.settings?.lang === 'mr' ? 'प्रवेश मंजूर!' : 'Access Granted!', 'success');
                      } else {
                        showToast(db?.settings?.lang === 'mr' ? 'चुकीचा संकेतशब्द!' : 'Incorrect Passcode!', 'error');
                        setSettingsPinInput('');
                      }
                    }}
                  >
                    {db?.settings?.lang === 'mr' ? 'अनलॉक करा' : 'Unlock Settings'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="tab-panel animate-fade">
              <div className="card-section">
                <div className="section-header">
                  <span className="section-title">{t('systemSettings')}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {role !== 'owner' ? (
                    /* Simplified view for branch staff - language preference only */
                    <div className="form-row">
                      <div className="form-group" style={{ maxWidth: '50%' }}>
                        <label className="form-label">{t('langPreference')}</label>
                        <select
                          className="form-select"
                          value={db.settings.lang || 'en'}
                          onChange={(e) => saveDb((currentDb) => ({ ...currentDb, settings: { ...currentDb.settings, lang: e.target.value } }))}
                        >
                          <option value="en">English</option>
                          <option value="mr">मराठी (Marathi)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    /* Full view for owner */
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">{t('messName')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={messNameInput}
                            onChange={(e) => setMessNameInput(e.target.value)}
                            onBlur={() => saveSettingField('messName', messNameInput, { required: true, label: 'Mess name' })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{t('ownerName')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={ownerNameInput}
                            onChange={(e) => setOwnerNameInput(e.target.value)}
                            onBlur={() => saveSettingField('ownerName', ownerNameInput, { required: true, label: 'Owner name' })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                          <label className="form-label">{t('ownerAddress')}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={ownerAddressInput}
                            onChange={(e) => setOwnerAddressInput(e.target.value)}
                            onBlur={() => saveSettingField('ownerAddress', ownerAddressInput, { required: true, label: 'Address' })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'UPI आयडी' : 'UPI ID'}</label>
                          <input
                            type="text"
                            id="settings-upi-input"
                            data-testid="settings-upi-input"
                            className="form-input"
                            value={upiIdInput}
                            onChange={(e) => setUpiIdInput(e.target.value)}
                            onBlur={() => saveSettingField('upiId', upiIdInput.trim(), { label: 'UPI ID' })}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                            placeholder={db.settings.lang === 'mr' ? 'उदा. name@bank' : 'Example: name@bank'}
                          />
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            {db.settings.lang === 'mr'
                              ? 'ही आयडी WhatsApp रिमाइंडरमध्ये पेमेंट लिंकसाठी वापरली जाईल.'
                              : 'This is used to add a payment link in WhatsApp reminders.'}
                          </div>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'पेमेंट मोबाईल नंबर' : 'Payment Mobile Number'}</label>
                          <input
                            type="text"
                            id="settings-phone-input"
                            data-testid="settings-phone-input"
                            className="form-input"
                            value={paymentPhoneInput}
                            onChange={(e) => setPaymentPhoneInput(e.target.value.replace(/\D/g, ''))}
                            onBlur={() => saveSettingField('paymentPhone', paymentPhoneInput.trim(), { label: 'Payment Mobile Number' })}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                            placeholder={db.settings.lang === 'mr' ? 'उदा. 9876543210' : 'Example: 9876543210'}
                            maxLength="10"
                          />
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            {db.settings.lang === 'mr'
                              ? 'UPI लिंक अयशस्वी झाल्यास ग्राहक या नंबरवर थेट पेमेंट करू शकतात.'
                              : 'Customers can pay directly to this number if the UPI link declines.'}
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'थकीत रक्कम आठवण मेसेज साचा' : 'Dues Reminder Template'}</label>
                          <textarea
                            className="form-input"
                            rows="2"
                            value={whatsappDuesTemplateInput}
                            onChange={(e) => setWhatsappDuesTemplateInput(e.target.value)}
                            onBlur={() => saveSettingField('whatsappDuesTemplate', whatsappDuesTemplateInput, { label: 'Dues reminder template' })}
                            style={{ resize: 'vertical', fontSize: '13px', WebkitUserSelect: 'text', userSelect: 'text', minHeight: '60px' }}
                            placeholder={db.settings.lang === 'mr'
                              ? 'नमस्कार [Name], तुमची थकीत रक्कम ₹[Dues] आहे. कृपया पेमेंट करा: [UpiLink] - [MessName]'
                              : 'Dear [Name], your pending dues are Rs [Dues]. Please pay here: [UpiLink] - [MessName]'}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Placeholder tokens: <code>[Name]</code>, <code>[Dues]</code>, <code>[Amount]</code>, <code>[PrevDues]</code>, <code>[CurrentDues]</code>, <code>[Date]</code>, <code>[UpiLink]</code>, <code>[MessName]</code>
                          </span>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                          <label className="form-label">
                            {db.settings.lang === 'mr' ? 'व्हॉट्सॲप मेसेजिंग प्रकार' : 'WhatsApp Messaging Mode'}
                          </label>
                          <select
                            className="form-select"
                            value={db.settings?.whatsappMode || 'desktop'}
                            onChange={(e) => {
                              const val = e.target.value;
                              saveSettingField('whatsappMode', val, { label: 'WhatsApp Mode' });
                            }}
                          >
                            <option value="web">
                              {db.settings.lang === 'mr' ? 'व्हॉट्सॲप वेब (ॲपच्या आत उघडते - शिफारस केलेले)' : 'WhatsApp Web (Built-in Window - Recommended)'}
                            </option>
                            <option value="desktop">
                              {db.settings.lang === 'mr' ? 'व्हॉट्सॲप डेस्कटॉप ॲप्लिकेशन (संगणक ॲप आवश्यक)' : 'WhatsApp Desktop App (Requires Windows app installed)'}
                            </option>
                          </select>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {db.settings.lang === 'mr'
                              ? 'टीप: "व्हॉट्सॲप वेब" वापरल्याने कोणत्याही बाह्य सॉफ्टवेअरशिवाय मेसेज यशस्वीपणे पाठवले जातात.'
                              : 'Note: "WhatsApp Web" loads internally inside the app, ensuring message delivery without needing any external desktop software.'}
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                          <label className="form-label">
                            {db.settings.lang === 'mr' ? 'थकीत रक्कम अलर्ट मर्यादा (Dues Warning Limit)' : 'Dues Warning Limit (Multiplier)'}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-input"
                            value={duesLimitInput}
                            onChange={(e) => setDuesLimitInput(e.target.value.replace(/[^\d.]/g, ''))}
                            onBlur={() => {
                              const val = parseFloat(duesLimitInput);
                              const finalVal = isNaN(val) || val <= 0 ? 1.5 : val;
                              setDuesLimitInput(String(finalVal));
                              saveSettingField('duesLimit', finalVal, { label: 'Dues Warning Limit' });
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                            placeholder="e.g. 1.5"
                          />
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            {db.settings.lang === 'mr'
                              ? 'जर थकबाकीची रक्कम मासिक शुल्काच्या या पटीपेक्षा जास्त असेल (उदा. १.५ पट), तर ग्राहकाच्या कार्डवर विशेष चेतावणी दिसेल.'
                              : 'Displays a critical dues warning badge on customer cards if their dues exceed this multiplier of their plan fee (e.g. 1.5x fee).'}
                          </div>
                        </div>
                      </div>

                      <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">{t('langPreference')}</label>
                          <select
                            className="form-select"
                            value={db.settings.lang || 'en'}
                            onChange={(e) => saveDb((currentDb) => ({ ...currentDb, settings: { ...currentDb.settings, lang: e.target.value } }))}
                          >
                            <option value="en">English</option>
                            <option value="mr">मराठी (Marathi)</option>
                          </select>
                        </div>
                        
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'या कॉम्प्युटरसाठी कार्यरत शाखा' : 'Active Branch for this Laptop'}</label>
                          <select
                            className="form-select"
                            value={activeBranch}
                            disabled={boundBranch !== 'All'}
                            onChange={(e) => {
                              setActiveBranch(e.target.value);
                              showToast(db.settings.lang === 'mr' ? 'शाखा बदलली!' : 'Active branch updated!', 'success');
                            }}
                          >
                            <option value="Branch 1">Branch 1 (Mess 1)</option>
                            <option value="Branch 2">Branch 2 (Mess 2)</option>
                          </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">
                            {db.settings.lang === 'mr' ? 'या कॉम्प्युटरचे शाखा बंधन' : 'Device Branch Binding'}
                          </label>
                          <select
                            className="form-select"
                            value={boundBranch}
                            onChange={(e) => {
                              const val = e.target.value;
                              localStorage.setItem('mess_bound_branch', val);
                              setBoundBranch(val);
                              if (val !== 'All') {
                                setActiveBranch(val);
                              }
                              showToast(
                                db.settings.lang === 'mr' 
                                  ? 'कॉम्प्युटरचे शाखा बंधन यशस्वीरित्या अद्ययावत केले!' 
                                  : 'Device branch binding updated successfully!', 
                                'success'
                              );
                            }}
                          >
                            <option value="All">{db.settings.lang === 'mr' ? 'पूर्ण प्रवेश (Unbound)' : 'Unbound (All Access)'}</option>
                            <option value="Branch 1">{db.settings.lang === 'mr' ? 'फक्त शाखा १ (Branch 1)' : 'Lock to Branch 1'}</option>
                            <option value="Branch 2">{db.settings.lang === 'mr' ? 'फक्त शाखा २ (Branch 2)' : 'Lock to Branch 2'}</option>
                          </select>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />

                      {/* PIN Settings Row */}
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{t('ownerPin')}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                type={showSettingsPin ? "text" : "password"}
                                className="form-input"
                                maxLength="6"
                                placeholder="******"
                                value={newPinInput}
                                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
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
                              onClick={async () => {
                                const saved = await savePinSetting('ownerPinHash', newPinInput, 'PIN changed and saved successfully!');
                                if (saved) setNewPinInput('');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'शाखा १ लॉगिन पिन' : 'Branch 1 Login PIN'}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="password"
                              className="form-input"
                              maxLength="6"
                              placeholder="******"
                              value={newBranch1PinInput}
                              onChange={(e) => setNewBranch1PinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              style={{ flex: 1 }}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={async () => {
                                const saved = await savePinSetting('branch1PinHash', newBranch1PinInput, 'Branch 1 PIN saved successfully!');
                                if (saved) setNewBranch1PinInput('');
                              }}
                            >
                            onBlur={() => saveSettingField('whatsappDuesTemplate', whatsappDuesTemplateInput, { label: 'Dues reminder template' })}
                            style={{ resize: 'vertical', fontSize: '13px', WebkitUserSelect: 'text', userSelect: 'text', minHeight: '60px' }}
                            placeholder={db.settings.lang === 'mr'
                              ? 'नमस्कार [Name], तुमची थकीत रक्कम ₹[Dues] आहे. कृपया पेमेंट करा: [UpiLink] - [MessName]'
                              : 'Dear [Name], your pending dues are Rs [Dues]. Please pay here: [UpiLink] - [MessName]'}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Placeholder tokens: <code>[Name]</code>, <code>[Dues]</code>, <code>[Amount]</code>, <code>[PrevDues]</code>, <code>[CurrentDues]</code>, <code>[Date]</code>, <code>[UpiLink]</code>, <code>[MessName]</code>
                          </span>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                          <label className="form-label">
                            {db.settings.lang === 'mr' ? 'व्हॉट्सॲप मेसेजिंग प्रकार' : 'WhatsApp Messaging Mode'}
                          </label>
                          <select
                            className="form-select"
                            value={db.settings?.whatsappMode || 'desktop'}
                            onChange={(e) => {
                              const val = e.target.value;
                              saveSettingField('whatsappMode', val, { label: 'WhatsApp Mode' });
                            }}
                          >
                            <option value="web">
                              {db.settings.lang === 'mr' ? 'व्हॉट्सॲप वेब (ॲपच्या आत उघडते - शिफारस केलेले)' : 'WhatsApp Web (Built-in Window - Recommended)'}
                            </option>
                            <option value="desktop">
                              {db.settings.lang === 'mr' ? 'व्हॉट्सॲप डेस्कटॉप ॲप्लिकेशन (संगणक ॲप आवश्यक)' : 'WhatsApp Desktop App (Requires Windows app installed)'}
                            </option>
                          </select>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {db.settings.lang === 'mr'
                              ? 'टीप: "व्हॉट्सॲप वेब" वापरल्याने कोणत्याही बाह्य सॉफ्टवेअरशिवाय मेसेज यशस्वीपणे पाठवले जातात.'
                              : 'Note: "WhatsApp Web" loads internally inside the app, ensuring message delivery without needing any external desktop software.'}
                          </div>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ width: '100%' }}>
                          <label className="form-label">
                            {db.settings.lang === 'mr' ? 'थकीत रक्कम अलर्ट मर्यादा (Dues Warning Limit)' : 'Dues Warning Limit (Multiplier)'}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-input"
                            value={duesLimitInput}
                            onChange={(e) => setDuesLimitInput(e.target.value.replace(/[^\d.]/g, ''))}
                            onBlur={() => {
                              const val = parseFloat(duesLimitInput);
                              const finalVal = isNaN(val) || val <= 0 ? 1.5 : val;
                              setDuesLimitInput(String(finalVal));
                              saveSettingField('duesLimit', finalVal, { label: 'Dues Warning Limit' });
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                            placeholder="e.g. 1.5"
                          />
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            {db.settings.lang === 'mr'
                              ? 'जर थकबाकीची रक्कम मासिक शुल्काच्या या पटीपेक्षा जास्त असेल (उदा. १.५ पट), तर ग्राहकाच्या कार्डवर विशेष चेतावणी दिसेल.'
                              : 'Displays a critical dues warning badge on customer cards if their dues exceed this multiplier of their plan fee (e.g. 1.5x fee).'}
                          </div>
                        </div>
                      </div>

                      <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">{t('langPreference')}</label>
                          <select
                            className="form-select"
                            value={db.settings.lang || 'en'}
                            onChange={(e) => saveDb((currentDb) => ({ ...currentDb, settings: { ...currentDb.settings, lang: e.target.value } }))}
                          >
                            <option value="en">English</option>
                            <option value="mr">मराठी (Marathi)</option>
                          </select>
                        </div>
                        
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'या कॉम्प्युटरसाठी कार्यरत शाखा' : 'Active Branch for this Laptop'}</label>
                          <select
                            className="form-select"
                            value={activeBranch}
                            disabled={boundBranch !== 'All'}
                            onChange={(e) => {
                              setActiveBranch(e.target.value);
                              showToast(db.settings.lang === 'mr' ? 'शाखा बदलली!' : 'Active branch updated!', 'success');
                            }}
                          >
                            <option value="Branch 1">Branch 1 (Mess 1)</option>
                            <option value="Branch 2">Branch 2 (Mess 2)</option>
                          </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">
                            {db.settings.lang === 'mr' ? 'या कॉम्प्युटरचे शाखा बंधन' : 'Device Branch Binding'}
                          </label>
                          <select
                            className="form-select"
                            value={boundBranch}
                            onChange={(e) => {
                              const val = e.target.value;
                              localStorage.setItem('mess_bound_branch', val);
                              setBoundBranch(val);
                              if (val !== 'All') {
                                setActiveBranch(val);
                              }
                              showToast(
                                db.settings.lang === 'mr' 
                                  ? 'कॉम्प्युटरचे शाखा बंधन यशस्वीरित्या अद्ययावत केले!' 
                                  : 'Device branch binding updated successfully!', 
                                'success'
                              );
                            }}
                          >
                            <option value="All">{db.settings.lang === 'mr' ? 'पूर्ण प्रवेश (Unbound)' : 'Unbound (All Access)'}</option>
                            <option value="Branch 1">{db.settings.lang === 'mr' ? 'फक्त शाखा १ (Branch 1)' : 'Lock to Branch 1'}</option>
                            <option value="Branch 2">{db.settings.lang === 'mr' ? 'फक्त शाखा २ (Branch 2)' : 'Lock to Branch 2'}</option>
                          </select>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />

                      {/* PIN Settings Row */}
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{t('ownerPin')}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                type={showSettingsPin ? "text" : "password"}
                                className="form-input"
                                maxLength="6"
                                placeholder="******"
                                value={newPinInput}
                                onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
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
                              onClick={async () => {
                                const saved = await savePinSetting('ownerPinHash', newPinInput, 'PIN changed and saved successfully!');
                                if (saved) setNewPinInput('');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'शाखा १ लॉगिन पिन' : 'Branch 1 Login PIN'}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="password"
                              className="form-input"
                              maxLength="6"
                              placeholder="******"
                              value={newBranch1PinInput}
                              onChange={(e) => setNewBranch1PinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              style={{ flex: 1 }}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={async () => {
                                const saved = await savePinSetting('branch1PinHash', newBranch1PinInput, 'Branch 1 PIN saved successfully!');
                                if (saved) setNewBranch1PinInput('');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                          <label className="form-label">{db.settings.lang === 'mr' ? 'शाखा २ लॉगिन पिन' : 'Branch 2 Login PIN'}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="password"
                              className="form-input"
                              maxLength="6"
                              placeholder="******"
                              value={newBranch2PinInput}
                              onChange={(e) => setNewBranch2PinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              style={{ flex: 1 }}
                            />
                            <button
                              className="btn btn-primary"
                              onClick={async () => {
                                const saved = await savePinSetting('branch2PinHash', newBranch2PinInput, 'Branch 2 PIN saved successfully!');
                                if (saved) setNewBranch2PinInput('');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'जतन करा' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderBottom: '1px solid var(--border)' }} />

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <label className="form-label" style={{ fontWeight: '700', fontSize: '15px', marginBottom: 0 }}>
                          {db.settings.lang === 'mr' ? 'जुने ग्राहक आर्काइव्ह संकेतशब्द सेटिंग्ज' : 'Old Customers Archive Passcode settings'}
                        </label>
                        
                        {/* Option 1: Current Passcode */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '12px', fontWeight: '600' }}>
                                {db.settings.lang === 'mr' ? 'नवीन आर्काइव्ह पासवर्ड (४-अंकी)' : 'New Archive Passcode (4-digit)'}
                              </label>
                              <input
                                type="password"
                                id="settings-archive-new-input"
                                className="form-input"
                                maxLength="4"
                                placeholder={db.settings.lang === 'mr' ? 'नवीन पासवर्ड (४-अंकी)' : 'Enter 4-digit passcode'}
                                value={newArchivePinInput}
                                onChange={(e) => setNewArchivePinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              />
                            </div>
                            <button
                              className="btn btn-primary"
                              onClick={async () => {
                                const saved = await saveArchivePasscodeSetting(newArchivePinInput);
                                if (saved) setNewArchivePinInput('');
                              }}
                            >
                              {db.settings.lang === 'mr' ? 'पासवर्ड जतन करा' : 'Save Passcode'}
                            </button>
                          </div>
                        </div>
                                {db.settings.lang === 'mr' 
                                  ? 'इशारा: यामुळे सर्व ग्राहक, पेमेंट आणि कर्मचाऱ्यांची माहिती डिलीट होईल. लॉगिन सेटिंग्ज सुरक्षित राहतील.' 
                                  : 'WARNING: This will permanently delete all customers, transactions, and employees from both local and cloud databases. Login credentials will remain safe.'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        )}
    </>
  );
}
