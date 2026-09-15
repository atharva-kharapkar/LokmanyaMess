import React from 'react';

export default function PhotoPreviewModal({ previewImage, onClose }) {
  if (!previewImage) return null;

  const imageUrl = previewImage.url || (typeof previewImage === 'string' ? previewImage : '');
  const imageName = previewImage.name || 'Photo';

  return (
    <div 
      className="image-preview-overlay"
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.75)', 
        zIndex: 3000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backdropFilter: 'blur(5px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          position: 'relative', 
          background: 'var(--card)', 
          padding: '16px', 
          borderRadius: '16px', 
          boxShadow: 'var(--shadow-lg)', 
          maxWidth: '90%', 
          width: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-16px',
            right: '-16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          ✕
        </button>
        <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border)' }}>
          <img 
            src={imageUrl} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            alt={imageName} 
          />
        </div>
        {previewImage.name && (
          <div style={{ marginTop: '14px', fontSize: '16px', fontWeight: '700', color: 'var(--text)', textAlign: 'center' }}>
            {imageName}
          </div>
        )}
      </div>
    </div>
  );
}
