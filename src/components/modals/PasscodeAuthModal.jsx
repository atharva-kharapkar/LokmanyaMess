import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { matchesSecret, matchesArchiveSecret } from '../../utils/helpers';

export default function PasscodeAuthModal({
  isOpen,
  title,
  subtitle,
  expectedLength = 6,
  hashToMatch,
  showToast,
  onSuccess,
  onClose,
  lang = 'en'
}) {
  if (!isOpen) return null;
  const isMarathi = lang === 'mr';

  const [pinInput, setPinInput] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!hashToMatch) {
      showToast(isMarathi ? 'कृपया सेटिंग्जमध्ये पिन सेट करा.' : 'Please set a PIN in Settings first.', 'error');
      return;
    }

    const isValid = expectedLength === 4 
      ? await matchesArchiveSecret(pinInput, hashToMatch)
      : await matchesSecret(pinInput, hashToMatch, expectedLength);

    if (isValid) {
      onSuccess();
      setPinInput('');
      onClose();
    } else {
      showToast(isMarathi ? 'चुकीचा पिन!' : 'Incorrect PIN!', 'error');
      setPinInput('');
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }} onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '380px', width: '90%', borderRadius: '16px', padding: '24px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 20px 0' }}>{subtitle}</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="form-input"
            placeholder="••••"
            maxLength={expectedLength}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, expectedLength))}
            autoFocus
            style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '6px', marginBottom: '20px', padding: '10px' }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose}>
              {isMarathi ? 'रद्द करा' : 'Cancel'}
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isMarathi ? 'अनलॉक' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
