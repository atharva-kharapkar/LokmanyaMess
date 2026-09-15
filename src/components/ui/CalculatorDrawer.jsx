import React from 'react';

export default function CalculatorDrawer({
  calcInput,
  setCalcInput,
  calcResult,
  handleCalcKeyPress,
  showCalculator,
  lang = 'en'
}) {
  if (!showCalculator) return null;
  const isMarathi = lang === 'mr';

  return (
    <div 
      className="calculator-drawer"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '280px',
        backgroundColor: 'var(--card)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: 'var(--shadow-xl)',
        border: '1.5px solid var(--border)',
        zIndex: 900
      }}
    >
      <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
        <span>🧮 {isMarathi ? 'मेस कॅल्क्युलेटर' : 'Mess Calculator'}</span>
        <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => { setCalcInput(''); }}>
          {isMarathi ? 'साफ करा' : 'Clear'}
        </span>
      </div>

      <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', textAlign: 'right' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', minHeight: '20px', wordBreak: 'break-all' }}>
          {calcInput || '0'}
        </div>
        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', minHeight: '26px' }}>
          {calcResult ? `= ₹${calcResult}` : ''}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
          <button
            key={btn}
            type="button"
            className="btn btn-sm"
            onClick={() => handleCalcKeyPress(btn)}
            style={{
              padding: '10px 0',
              fontWeight: '800',
              fontSize: '14px',
              backgroundColor: ['/', '*', '-', '+', '='].includes(btn) ? 'var(--primary-light)' : '#fff',
              color: ['/', '*', '-', '+', '='].includes(btn) ? 'var(--primary)' : 'var(--text)',
              border: '1px solid var(--border)'
            }}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
