import React from 'react';
import { MapPin } from 'lucide-react';
import { getUniqueAreas } from '../utils/areaHelpers';

export default function AreaInputField({
  value = '',
  onChange,
  customers = [],
  customAreas = [],
  lang = 'en',
  isTiffin = false
}) {
  const isMarathi = lang === 'mr';
  
  // Use master customAreas strictly from settings
  const masterAreas = getUniqueAreas(customers, null, customAreas);

  return (
    <div className="form-group" style={{ marginBottom: '16px' }}>
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px', color: 'var(--text)' }}>
        <MapPin size={14} style={{ color: '#E11D48' }} />
        <span>
          {isMarathi 
            ? (isTiffin ? 'टिफिन डिलीव्हरी एरिया / परिसर (उदा. Kothrud, Deccan) *' : 'एरिया / परिसर (उदा. Kothrud)') 
            : (isTiffin ? 'Tiffin Delivery Area / Zone (e.g. Kothrud, Deccan) *' : 'Area / Delivery Zone')}
        </span>
      </label>
      <input
        type="text"
        className="form-input"
        list={masterAreas.length > 0 ? "area-datalist-suggestions" : undefined}
        placeholder={isMarathi ? 'उदा. Kothrud, Deccan, Karve Nagar' : 'e.g. Kothrud, Deccan, Karve Nagar'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '6px'
        }}
      />
      {masterAreas.length > 0 && (
        <datalist id="area-datalist-suggestions">
          {masterAreas.map(area => (
            <option key={area} value={area} />
          ))}
        </datalist>
      )}

      {/* Quick Select Master Area Pills (Only created custom master areas) */}
      {masterAreas.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
          {masterAreas.map(area => (
            <button
              key={area}
              type="button"
              className="btn btn-sm"
              onClick={() => onChange(area)}
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                borderRadius: '6px',
                fontWeight: '700',
                backgroundColor: value === area ? '#E11D48' : '#F1F5F9',
                color: value === area ? '#FFFFFF' : '#334155',
                border: value === area ? '1px solid #E11D48' : '1px solid #CBD5E1',
                cursor: 'pointer'
              }}
            >
              📍 {area}
            </button>
          ))}
        </div>
      )}

      {masterAreas.length > 0 && (
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
          {isMarathi 
            ? 'खालील एरिया वर क्लिक करा किंवा टाइप करा.' 
            : 'Click any created area pill above or type a new one.'}
        </span>
      )}
    </div>
  );
}
