import React, { useEffect } from 'react';

export default function PhotoPreviewModal({ previewImage, setPreviewImage, onClose }) {
  if (!previewImage) return null;

  const handleClose = typeof onClose === 'function' 
    ? onClose 
    : () => typeof setPreviewImage === 'function' && setPreviewImage(null);

  const imageUrl = typeof previewImage === 'string' 
    ? previewImage 
    : (previewImage && typeof previewImage.url === 'string' ? previewImage.url : '');

  const imageName = (previewImage && typeof previewImage.name === 'string') 
    ? previewImage.name 
    : 'Profile Photo';

  if (!imageUrl) return null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div 
      className="image-preview-overlay"
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0, 0, 0, 0.82)', 
        zIndex: 3000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={handleClose}
    >
      <div 
        style={{ 
          position: 'relative', 
          background: 'var(--card)', 
          padding: '20px', 
          borderRadius: '20px', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)', 
          maxWidth: '92vw', 
          width: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '-14px',
            right: '-14px',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--card)',
            border: '2px solid var(--border)',
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
          title="Close (Esc)"
        >
          ✕
        </button>

        <div style={{ 
          width: '100%', 
          aspectRatio: '1 / 1', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          backgroundColor: '#f8fafc', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          border: '1px solid var(--border)',
          boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
        }}>
          <img 
            src={imageUrl} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            alt={imageName} 
          />
        </div>

        {imageName && (
          <div style={{ marginTop: '16px', fontSize: '18px', fontWeight: '800', color: 'var(--text)', textAlign: 'center', letterSpacing: '-0.3px' }}>
            {imageName}
          </div>
        )}
      </div>
    </div>
  );
}
