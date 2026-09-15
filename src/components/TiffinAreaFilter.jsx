import React, { useState } from 'react';
import { MapPin, Plus, Check, Trash2 } from 'lucide-react';
import { getUniqueAreas } from '../utils/areaHelpers';

export default function TiffinAreaFilter({
  customers = [],
  selectedArea = 'All Areas',
  onSelectArea,
  customAreas = [],
  onAddArea,
  onDeleteArea,
  onDeleteAllAreas,
  lang = 'en',
  activeBranch = 'All'
}) {
  const isMarathi = lang === 'mr';

  // Strictly filter customers by activeBranch first
  const branchCustomers = (customers || []).filter(c => 
    !c ? false : (!activeBranch || activeBranch === 'All' || (c.branch || 'Branch 1') === activeBranch)
  );

  const uniqueAreas = getUniqueAreas(branchCustomers, 'tiffin', customAreas, activeBranch);
  const [isAdding, setIsAdding] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');

  // Count customers per area for active branch (case-insensitive)
  const areaCounts = {};
  branchCustomers.forEach(c => {
    if (c.category === 'tiffin' && c.status !== 'old' && c.status !== 'archived') {
      const areaKey = String(c.area || '').trim().toLowerCase();
      if (areaKey) {
        areaCounts[areaKey] = (areaCounts[areaKey] || 0) + 1;
      }
    }
  });

  const getAreaCount = (areaName) => {
    if (!areaName) return 0;
    const key = String(areaName).trim().toLowerCase();
    return areaCounts[key] || 0;
  };

  const totalTiffinCount = branchCustomers.filter(c => c.category === 'tiffin' && c.status !== 'old' && c.status !== 'archived').length;

  const handleSaveNewArea = async (e) => {
    if (e) e.preventDefault();
    const clean = newAreaInput.trim();
    if (!clean) return;

    if (typeof onAddArea === 'function') {
      await onAddArea(clean);
    }
    onSelectArea(clean);
    setNewAreaInput('');
    setIsAdding(false);
  };

  const handleDeleteCurrentArea = async (areaToDelete) => {
    if (!areaToDelete || areaToDelete === 'All Areas') return;
    const confirmMsg = isMarathi 
      ? `आपण नक्की '${areaToDelete}' हा एरिया हटवू इच्छिता?`
      : `Are you sure you want to delete delivery area '${areaToDelete}'?`;
    
    if (!window.confirm(confirmMsg)) return;

    if (typeof onDeleteArea === 'function') {
      await onDeleteArea(areaToDelete);
    }
    if (selectedArea === areaToDelete) {
      onSelectArea('All Areas');
    }
  };

  const handleConfirmDeleteAllAreas = async () => {
    const confirmMsg = isMarathi
      ? `आपण नक्की सर्व टिफिन एरिया हटवू इच्छिता? सर्व ग्राहकांचे एरिया रिसेट होतील.`
      : `Are you sure you want to delete ALL delivery areas? Area assignments will be cleared.`;

    if (!window.confirm(confirmMsg)) return;

    if (typeof onDeleteAllAreas === 'function') {
      await onDeleteAllAreas();
    }
    onSelectArea('All Areas');
  };

  return (
    <div 
      className="tiffin-area-filter-wrapper"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#FFF5F5',
        border: '1.5px solid #FECDD3',
        borderRadius: '10px',
        padding: '6px 12px',
        maxWidth: '100%',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E11D48', fontWeight: '700', fontSize: '13px' }}>
        <MapPin size={16} style={{ color: '#E11D48' }} />
        <span>{isMarathi ? 'एरिया फिल्टर:' : 'Area Filter:'}</span>
      </div>

      <select
        className="form-input"
        value={selectedArea}
        onChange={(e) => onSelectArea(e.target.value)}
        style={{
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: '700',
          borderRadius: '8px',
          border: '1px solid #FDA4AF',
          backgroundColor: '#FFFFFF',
          color: '#881337',
          cursor: 'pointer',
          height: '34px',
          minWidth: '180px'
        }}
      >
        <option value="All Areas">
          {isMarathi ? `सर्व एरिया (${totalTiffinCount})` : `All Areas (${totalTiffinCount})`}
        </option>
        {uniqueAreas.map(area => (
          <option key={area} value={area}>
            📍 {area} ({getAreaCount(area)})
          </option>
        ))}
      </select>

      {/* Delete Selected Area Button */}
      {selectedArea && selectedArea !== 'All Areas' && (
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => handleDeleteCurrentArea(selectedArea)}
          title={isMarathi ? `'${selectedArea}' एरिया हटवा` : `Delete area '${selectedArea}'`}
          style={{
            height: '34px',
            padding: '0 8px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderRadius: '8px'
          }}
        >
          <Trash2 size={14} />
          <span>{isMarathi ? 'हटवा' : 'Delete Area'}</span>
        </button>
      )}

      {/* Add New Area Button / Inline Input */}
      {isAdding ? (
        <form onSubmit={handleSaveNewArea} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="text"
            className="form-input"
            placeholder={isMarathi ? 'नवीन एरिया नाव...' : 'New area name...'}
            value={newAreaInput}
            onChange={(e) => setNewAreaInput(e.target.value)}
            autoFocus
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid #E11D48',
              width: '140px'
            }}
          />
          <button
            type="submit"
            className="btn btn-sm btn-success"
            style={{ height: '32px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Check size={14} />
            {isMarathi ? 'सेव्ह' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setIsAdding(false)}
            style={{ height: '32px', padding: '0 8px', fontSize: '11px' }}
          >
            ✕
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setIsAdding(true)}
            title={isMarathi ? 'नवीन एरिया जोडा' : 'Add New Delivery Area'}
            style={{
              height: '34px',
              padding: '0 10px',
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: '#FFE4E6',
              color: '#9F1239',
              border: '1px solid #FDA4AF',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} />
            <span>{isMarathi ? 'एरिया जोडा' : 'Add Area'}</span>
          </button>

          {uniqueAreas.length > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleConfirmDeleteAllAreas}
              title={isMarathi ? 'सर्व एरिया हटवा' : 'Delete All Areas'}
              style={{
                height: '34px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: '700',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={13} />
              <span>{isMarathi ? 'सर्व एरिया हटवा' : 'Delete All Areas'}</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Select & Delete Area Pills */}
      {uniqueAreas.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn btn-sm ${selectedArea === 'All Areas' ? 'btn-primary' : ''}`}
            onClick={() => onSelectArea('All Areas')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              borderRadius: '9999px',
              fontWeight: '700',
              backgroundColor: selectedArea === 'All Areas' ? '#E11D48' : '#FFFFFF',
              color: selectedArea === 'All Areas' ? '#FFFFFF' : '#9F1239',
              border: '1px solid #FDA4AF'
            }}
          >
            {isMarathi ? 'सर्व' : 'All'}
          </button>

          {uniqueAreas.map(area => (
            <div 
              key={area} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: selectedArea === area ? '#E11D48' : '#FFFFFF',
                color: selectedArea === area ? '#FFFFFF' : '#9F1239',
                border: '1px solid #FDA4AF',
                borderRadius: '9999px',
                padding: '2px 6px 2px 10px',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              <span 
                onClick={() => onSelectArea(area)} 
                style={{ cursor: 'pointer' }}
              >
                📍 {area} ({getAreaCount(area)})
              </span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCurrentArea(area);
                }}
                title={isMarathi ? `'${area}' एरिया हटवा` : `Delete '${area}'`}
                style={{ 
                  cursor: 'pointer', 
                  fontSize: '12px', 
                  opacity: 0.8,
                  padding: '0 2px',
                  borderRadius: '50%',
                  lineHeight: '1'
                }}
              >
                ×
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
