import React from 'react';
import { MapPin } from 'lucide-react';

export default function CustomerAreaBadge({ area }) {
  if (!area || typeof area !== 'string' || area.trim() === '') {
    return null;
  }

  return (
    <div 
      className="customer-area-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: '#FFF1F2',
        color: '#E11D48',
        border: '1px solid #FECDD3',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '700',
        whiteSpace: 'nowrap',
        width: 'fit-content',
        marginTop: '2px'
      }}
    >
      <MapPin size={12} style={{ color: '#E11D48' }} />
      <span>{area.trim()}</span>
    </div>
  );
}
