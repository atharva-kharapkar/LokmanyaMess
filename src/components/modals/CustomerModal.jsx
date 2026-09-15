import React, { useState, useEffect } from 'react';
import { Camera, X, Check } from 'lucide-react';
import MealSelector from '../MealSelector';
import AreaInputField from '../AreaInputField';
import { DEFAULT_MEAL_TYPE, DEFAULT_MEAL_SLOT } from '../../utils/mealConfig';
import { todayStr, isBlank, isValidDate, toAmountNumber, formatDisplayDate } from '../../utils/formatters';

export default function CustomerModal({
  isOpen,
  editCustId,
  initialData,
  customer,
  isEditing,
  currentTab,
  db,
  showToast,
  onSave,
  onClose,
  isSaving
}) {
  if (!isOpen) return null;

  const isMarathi = db?.settings?.lang === 'mr';
  const dataObj = initialData || customer || {};
  const activeEditId = editCustId || (isEditing ? dataObj.id : null);

  // Encapsulated Local State for form inputs (prevents full app re-renders on keystroke)
  const [form, setForm] = useState(() => {
    const d = initialData || customer || {};
    const cat = d.category || (currentTab === 'tiffin' ? 'tiffin' : currentTab === 'shortterm' ? 'shortterm' : 'dinein');
    return {
      name: d.name || '',
      phone: d.phone || '',
      aadhar: d.aadhar || '',
      plan: d.plan || (currentTab === 'shortterm' ? 'Short-Term' : 'Monthly'),
      amount: d.amount !== undefined && d.amount !== null && d.amount !== '' ? String(d.amount) : (currentTab === 'shortterm' ? String(10 * 2 * 80) : '1500'),
      deposited: d.deposited !== undefined && d.deposited !== null && d.deposited !== '' ? String(d.deposited) : '0',
      joinDate: d.joinDate || todayStr(),
      billingStartDate: d.billingStartDate || '',
      addr: d.addr || '',
      photo: d.photo || '',
      category: cat,
      mealType: d.mealType || (cat === 'tiffin' ? DEFAULT_MEAL_TYPE : 'NONE'),
      mealSlot: d.mealSlot || (cat === 'tiffin' ? DEFAULT_MEAL_SLOT : 'NONE'),
      area: d.area || ''
    };
  });

  const [shortTermDays, setShortTermDays] = useState(dataObj?.shortTermDays ? String(dataObj.shortTermDays) : '10');
  const [shortTermMeals, setShortTermMeals] = useState(dataObj?.shortTermMeals ? String(dataObj.shortTermMeals) : '2');

  useEffect(() => {
    if (isOpen) {
      const d = initialData || customer || {};
      const cat = d.category || (currentTab === 'tiffin' ? 'tiffin' : currentTab === 'shortterm' ? 'shortterm' : 'dinein');
      setForm({
        name: d.name || '',
        phone: d.phone || '',
        aadhar: d.aadhar || '',
        plan: d.plan || (currentTab === 'shortterm' ? 'Short-Term' : 'Monthly'),
        amount: d.amount !== undefined && d.amount !== null && d.amount !== '' ? String(d.amount) : (currentTab === 'shortterm' ? String(10 * 2 * 80) : '1500'),
        deposited: d.deposited !== undefined && d.deposited !== null && d.deposited !== '' ? String(d.deposited) : '0',
        joinDate: d.joinDate || todayStr(),
        billingStartDate: d.billingStartDate || '',
        addr: d.addr || '',
        photo: d.photo || '',
        category: cat,
        mealType: d.mealType || (cat === 'tiffin' ? DEFAULT_MEAL_TYPE : 'NONE'),
        mealSlot: d.mealSlot || (cat === 'tiffin' ? DEFAULT_MEAL_SLOT : 'NONE'),
        area: d.area || ''
      });
      setShortTermDays(d.shortTermDays ? String(d.shortTermDays) : '10');
      setShortTermMeals(d.shortTermMeals ? String(d.shortTermMeals) : '2');
    }
  }, [isOpen, editCustId, isEditing, initialData, customer, currentTab]);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = React.useRef(null);

  const setVideoRef = React.useCallback((node) => {
    videoRef.current = node;
    if (node && cameraStream) {
      node.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast(isMarathi ? 'कॅमेरा प्रवेश समर्थित नाही.' : 'Camera access is not supported.', 'error');
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter(d => d.kind === 'videoinput');
      setCameraDevices(videoDevs);
      const devId = videoDevs.length > 0 ? videoDevs[0].deviceId : '';
      setSelectedCameraId(devId);
      await initializeStream(devId);
      setIsCameraActive(true);
    } catch (err) {
      console.error('Error starting camera:', err);
      showToast(isMarathi ? 'कॅमेरा सुरू करताना त्रुटी: ' + err.message : 'Error starting camera: ' + err.message, 'error');
    }
  };

  const initializeStream = async (deviceId) => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    const constraints = deviceId ? { video: { deviceId: { exact: deviceId } } } : { video: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setCameraStream(stream);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setForm(prev => ({ ...prev, photo: dataUrl }));
    stopCamera();
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onSave(form, shortTermDays, shortTermMeals);
  };

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 2000, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.65)', 
        backdropFilter: 'blur(4px)' 
      }} 
      onClick={() => { stopCamera(); onClose(); }}
    >
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '560px', 
          width: '90%', 
          maxHeight: '85vh', 
          overflowY: 'auto', 
          borderRadius: '16px', 
          padding: '24px', 
          backgroundColor: 'var(--card)', 
          border: '1px solid var(--border)', 
          boxShadow: 'var(--shadow-xl)' 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
            {editCustId ? (isMarathi ? 'ग्राहक प्रोफाइल बदला' : 'Edit Customer Profile') : (isMarathi ? 'नवीन ग्राहक जोडा' : 'Add New Customer')}
          </h2>
          <button className="btn btn-sm btn-icon" onClick={() => { stopCamera(); onClose(); }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Photo Capture / Upload */}
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                {isMarathi ? 'ग्राहकाचा फोटो' : 'Customer Photo'}
              </label>

              {isCameraActive ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <video ref={setVideoRef} autoPlay playsInline style={{ width: '220px', height: '165px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-sm btn-primary" onClick={capturePhoto}>
                      <Check size={14} /> {isMarathi ? 'फोटो घ्या' : 'Capture'}
                    </button>
                    <button type="button" className="btn btn-sm" onClick={stopCamera}>
                      {isMarathi ? 'रद्द करा' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  {form.photo ? (
                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                      <img src={form.photo} alt="Preview" style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                      <button 
                        type="button" 
                        className="btn btn-sm btn-danger btn-icon" 
                        onClick={() => setForm(prev => ({ ...prev, photo: '' }))}
                        style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: '100px', height: '100px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', border: '2px dashed var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
                      <Camera size={32} />
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-sm" onClick={startCamera}>
                      <Camera size={14} style={{ marginRight: '4px' }} /> {isMarathi ? 'फोटो काढा' : 'Take Photo'}
                    </button>
                    <label className="btn btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                      {isMarathi ? 'फोटो अपलोड' : 'Upload Photo'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setForm(prev => ({ ...prev, photo: reader.result }));
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Category Selection */}
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'ग्राहक प्रकार / वर्ग *' : 'Customer Category *'}</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <option value="dinein">{isMarathi ? 'डाईन इन मेस (Dine In)' : 'Dine In Member'}</option>
                <option value="tiffin">{isMarathi ? 'टिफिन डिलिव्हरी (Tiffin Delivery)' : 'Tiffin Delivery'}</option>
                <option value="shortterm">{isMarathi ? 'अल्पमुदत सदस्य (Short-Term Member)' : 'Short-Term Member'}</option>
              </select>
            </div>

            {/* Customer Name */}
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'पूर्ण नाव *' : 'Full Name *'}</label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={isMarathi ? 'उदा. राहुल देशमूख' : 'e.g. Rahul Deshmukh'}
                required
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'फोन नंबर *' : 'Phone Number *'}</label>
              <input
                type="text"
                className="form-input"
                inputMode="numeric"
                maxLength="10"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="9876543210"
                required
              />
            </div>



            {/* Fee & Deposit */}
            <div className="form-group">
              <label className="form-label">{isMarathi ? 'प्लॅन फी (रुपये) *' : 'Subscription Fee (Rs) *'}</label>
              <input
                type="text"
                className="form-input"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value.replace(/[^\d.]/g, '') }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{isMarathi ? 'एकूण जमा रक्कम (रुपये) *' : 'Total Amount Deposited / Paid (Rs) *'}</label>
              <input
                type="text"
                className="form-input"
                inputMode="numeric"
                value={form.deposited}
                onChange={(e) => setForm(prev => ({ ...prev, deposited: e.target.value.replace(/[^\d.]/g, '') }))}
                required
              />
            </div>

            {/* Joining Date */}
            <div className="form-group">
              <label className="form-label">
                {isMarathi ? 'सुरू झालेली तारीख *' : 'Joining Date *'}
                {form.joinDate && (
                  <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--primary)', fontWeight: '700' }}>
                    (📅 {formatDisplayDate(form.joinDate)})
                  </span>
                )}
              </label>
              <input
                type="date"
                className="form-input"
                value={form.joinDate}
                onChange={(e) => setForm(prev => ({ ...prev, joinDate: e.target.value }))}
                required
              />
            </div>

            {/* Meal Selector */}
            <MealSelector 
              mealType={form.mealType} 
              setMealType={(type) => setForm(prev => ({ ...prev, mealType: type }))}
              mealSlot={form.mealSlot}
              setMealSlot={(slot) => setForm(prev => ({ ...prev, mealSlot: slot }))}
              lang={db.settings?.lang}
            />

            {/* Area Field */}
            <AreaInputField 
              value={form.area || ''}
              onChange={(val) => setForm(prev => ({ ...prev, area: val }))}
              customers={db.customers}
              customAreas={db.settings?.customAreas}
              lang={db.settings?.lang}
              isTiffin={currentTab === 'tiffin'}
            />

            {/* Address */}
            <div className="form-group">
              <label className="form-label">
                {currentTab === 'tiffin' ? (isMarathi ? 'टिफिन डिलिव्हरी पत्ता *' : 'Tiffin Delivery Address *') : (isMarathi ? 'पत्ता / रूम तपशील' : 'Address / Room Details')}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={currentTab === 'tiffin' ? (isMarathi ? 'उदा. फ्लैट ३०४, साई सावली अपार्टमेंट' : 'e.g. Flat 304, Sai Savli Apartment') : (isMarathi ? 'उदा. रूम १०४, बी विंग' : 'e.g. Room 104, B wing')}
                value={form.addr}
                onChange={(e) => setForm(prev => ({ ...prev, addr: e.target.value }))}
                required={currentTab === 'tiffin'}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn" onClick={() => { stopCamera(); onClose(); }} disabled={isSaving}>
              {isMarathi ? 'रद्द करा' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (isMarathi ? 'जतन करत आहे...' : 'Saving...') : (isMarathi ? 'प्रोफाइल जतन करा' : 'Save Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
