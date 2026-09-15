import React from 'react';
import { 
  ALL_MEAL_TYPES, 
  ALL_MEAL_SLOTS, 
  getMealTypeLabel, 
  getMealSlotLabel,
  normalizeMealType,
  normalizeMealSlot
} from '../utils/mealConfig';

export default function MealSelector({ mealType, setMealType, mealSlot, setMealSlot, lang = 'en' }) {
  const isMr = lang === 'mr';
  const currentType = normalizeMealType(mealType);
  const currentSlot = normalizeMealSlot(mealSlot);

  const handleClearAll = () => {
    setMealType('NONE');
    setMealSlot('NONE');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '16px',
      backgroundColor: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginTop: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>
          {isMr ? 'जेवणाचा प्रकार आणि वेळ' : 'Meal Type & Slot'}
        </h3>
        <button
          type="button"
          onClick={handleClearAll}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {isMr ? '❌ निवड रद्द करा (Deselect)' : '❌ Deselect / Clear'}
        </button>
      </div>

      {/* Select Meal Type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            {isMr ? 'प्रकार निवडा:' : 'Select Type:'}
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {isMr ? '(पुन्हा क्लिक करून रद्द करा)' : '(Click again to deselect)'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {ALL_MEAL_TYPES.map(type => {
            const isSelected = currentType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(isSelected ? 'NONE' : type)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'rgba(216, 90, 48, 0.12)' : 'var(--card)',
                  color: isSelected ? 'var(--primary)' : 'var(--text)',
                  fontSize: '13px',
                  fontWeight: isSelected ? '800' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  textAlign: 'center'
                }}
              >
                {getMealTypeLabel(type, lang)} {isSelected ? ' ✓' : ''}
              </button>
            );
          })}
          {/* Explicit Deselect Option Button */}
          <button
            type="button"
            onClick={() => setMealType('NONE')}
            style={{
              gridColumn: 'span 2',
              padding: '8px 12px',
              borderRadius: '8px',
              border: currentType === 'NONE' ? '2px solid #6b7280' : '1px dashed var(--border)',
              backgroundColor: currentType === 'NONE' ? 'rgba(107, 114, 128, 0.15)' : 'transparent',
              color: currentType === 'NONE' ? 'var(--text)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            🚫 {isMr ? 'कोणताही प्रकार नाही (Deselect Type)' : 'None / Deselect Type'}
          </button>
        </div>
      </div>

      {/* Select Meal Slot */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            {isMr ? 'वेळ निवडा:' : 'Select Slot:'}
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {isMr ? '(पुन्हा क्लिक करून रद्द करा)' : '(Click again to deselect)'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {ALL_MEAL_SLOTS.map(slot => {
            const isSelected = currentSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setMealSlot(isSelected ? 'NONE' : slot)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'rgba(216, 90, 48, 0.12)' : 'var(--card)',
                  color: isSelected ? 'var(--primary)' : 'var(--text)',
                  fontSize: '13px',
                  fontWeight: isSelected ? '800' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  textAlign: 'center'
                }}
              >
                {getMealSlotLabel(slot, lang)} {isSelected ? ' ✓' : ''}
              </button>
            );
          })}
          {/* Explicit Deselect Option Button */}
          <button
            type="button"
            onClick={() => setMealSlot('NONE')}
            style={{
              gridColumn: 'span 3',
              padding: '8px 12px',
              borderRadius: '8px',
              border: currentSlot === 'NONE' ? '2px solid #6b7280' : '1px dashed var(--border)',
              backgroundColor: currentSlot === 'NONE' ? 'rgba(107, 114, 128, 0.15)' : 'transparent',
              color: currentSlot === 'NONE' ? 'var(--text)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            🚫 {isMr ? 'कोणतीही वेळ नाही (Deselect Slot)' : 'None / Deselect Slot'}
          </button>
        </div>
      </div>
    </div>
  );
}
