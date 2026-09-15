import React from 'react';
import { X, Camera, SwitchCamera, Upload } from 'lucide-react';
import { expiryStr, getEffectiveJoinDate, parseLocalDate, formatDisplayDate } from '../../utils/helpers';

export default function CustomerModalWeb({
  editCustId,
  setCustModal,
  setEditCustId,
  t,
  saveCustomer,
  isCameraActive,
  setVideoRef,
  cameraDevices,
  selectedCameraId,
  handleCameraChange,
  capturePhoto,
  stopCamera,
  startCamera,
  custForm,
  setCustForm,
  handleProfilePicUpload,
  db,
  PLAN_AMT,
  todayStr,
  isSavingCustomer
}) {
  return (
    <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-title">{editCustId ? t('editCustProfile') : t('addNewCust')}</span>
              <X className="modal-close" onClick={() => { setCustModal(false); setEditCustId(null); }} />
            </div>
            <form className="modal-body" onSubmit={(e) => { e.preventDefault(); saveCustomer(); }}>
              {/* Profile Photo Capture Section */}
              <div className="avatar-capture-section">
                {isCameraActive ? (
                  <div className="camera-box">
                    <video ref={setVideoRef} autoPlay playsInline className="camera-video" />
                    <div className="camera-controls">
                      {cameraDevices.length > 1 && (
                        <select className="form-select camera-select" value={selectedCameraId} onChange={handleCameraChange}>
                          {cameraDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || `Camera ${cameraDevices.indexOf(device) + 1}`}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="camera-button-row">
                        <button className="btn btn-success btn-sm" onClick={capturePhoto}>{t('capture')}</button>
                        <button className="btn btn-danger btn-sm" onClick={stopCamera}>{t('cancel')}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="avatar-display-box">
                    {custForm.photo ? (
                      <div className="avatar-preview-wrapper">
                        <img src={custForm.photo} className="avatar-large" alt="Profile" />
                        <button className="btn btn-sm btn-danger remove-photo-btn" onClick={() => setCustForm(prev => ({ ...prev, photo: '' }))}>{t('removePhoto')}</button>
                      </div>
                    ) : (
                      <div className="avatar-large-placeholder">
                        👤
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button className="btn btn-sm" onClick={startCamera}>
                        📸 {t('takePhoto')}
                      </button>
                      <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
                        📁 {t('uploadPhoto')}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setCustForm(prev => ({ ...prev, photo: evt.target.result }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('fullName')}</label>
                <input
                  type="text"
                  id="customer-name-input"
                  data-testid="customer-name-input"
                  className="form-input"
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('phoneNo')}</label>
                <input
                  type="text"
                  id="customer-phone-input"
                  data-testid="customer-phone-input"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={custForm.phone}
                  inputMode="numeric"
                  maxLength="10"
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setCustForm({ ...custForm, phone: digitsOnly });
                  }}
                />
              </div>
              {currentTab === 'shortterm' ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{db.settings.lang === 'mr' ? 'कालावधी (दिवस) *' : 'Duration (Days) *'}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-input"
                        value={shortTermDays}
                        onChange={(e) => {
                          const days = e.target.value.replace(/\D/g, '');
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

                  <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#065f46' }}>
                      {db.settings.lang === 'mr' ? 'एकूण शुल्क (Calculated Fee):' : 'Calculated Fee Amount:'}
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                      ₹ {Number(shortTermDays || 0) * Number(shortTermMeals || 0) * 80}
                    </span>
                  </div>
                </>
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
                      type="text"
                      id="customer-fee-input"
                      data-testid="customer-fee-input"
                      inputMode="numeric"
                      className="form-input"
                      value={custForm.amount}
                      onChange={(e) => setCustForm({ ...custForm, amount: e.target.value.replace(/[^\d.]/g, '') })}
                      readOnly={currentTab === 'shortterm'}
                    />
                  </div>
                </div>
              )}

              {(currentTab === 'dinein' || currentTab === 'tiffin') && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{db.settings.lang === 'mr' ? 'जेवणाची निवड *' : 'Meal Selection *'}</label>
                    <select
                      className="form-select"
                      value={custForm.mealSelection || '1 meal per day'}
                      onChange={(e) => {
                        const sel = e.target.value;
                        let amt = custForm.amount;
                        if (sel === '1 meal per day') amt = '1500';
                        else if (sel === '2 meal per day') amt = '2800';
                        else if (sel === '2 half meal') amt = '2000';
                        else if (sel === '1 half meal') amt = '1000';
                        setCustForm({ ...custForm, mealSelection: sel, amount: amt });
                      }}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={db.settings.lang === 'mr' ? 'उदा. कोथरुड' : 'e.g. Kothrud'}
                    value={custForm.area || ''}
                    onChange={(e) => setCustForm({ ...custForm, area: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
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
              </div>
            </form>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => { setCustModal(false); setEditCustId(null); }} disabled={isSavingCustomer}>{t('cancel')}</button>
              <button type="submit" className="btn btn-primary" disabled={isSavingCustomer}>
                {isSavingCustomer 
                  ? (db.settings.lang === 'mr' ? 'जतन करत आहे...' : 'Saving...') 
                  : t('saveProfile')}
              </button>
            </div>
          </div>
        </div>
  );
}
