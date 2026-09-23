import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI);
const shouldUseServiceWorker =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  window.isSecureContext &&
  window.location.protocol !== 'file:' &&
  !isElectron;

async function clearStaleOfflineShell() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys
        .filter((key) => key.startsWith('lokmanya-mess-'))
        .map((key) => caches.delete(key))
    );
  }
}

if (shouldUseServiceWorker) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
} else {
  clearStaleOfflineShell().catch((error) => {
    console.warn('Offline shell cleanup failed:', error);
  });
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('EB caught:\n' + (error?.stack || error) + '\n' + (errorInfo?.componentStack || ''));
  }

  render() {
    if (this.state.hasError) {
      const errorText = this.state.error?.stack || this.state.error?.message || String(this.state.error);
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', color: '#F8FAFC', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ maxWidth: '640px', width: '100%', backgroundColor: '#1E293B', padding: '32px', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: '#F43F5E' }}>
              काहीतरी समस्या आली आहे (Application Needs Refresh)
            </h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '24px', lineHeight: '1.6' }}>
              अॅपमध्ये तांत्रिक अडचण आली आहे. तुमचा सर्व डेटा पूर्णपणे सुरक्षित आहे. अॅप रीलोड करण्यासाठी खालील बटणावर क्लिक करा.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: '12px 24px', fontSize: '15px', fontWeight: '700', borderRadius: '10px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)' }}
              >
                🔄 अॅप रीलोड करा (Reload App)
              </button>
              <button
                onClick={() => {
                  try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
                  window.location.reload();
                }}
                style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', borderRadius: '10px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
              >
                🧹 सत्राचा डेटा साफ करा व रीलोड करा
              </button>
            </div>
            {this.state.error && (
              <details open style={{ marginTop: '16px', textAlign: 'left', backgroundColor: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid #334155', fontSize: '12px', color: '#F1F5F9', maxHeight: '240px', overflowY: 'auto' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#F43F5E', marginBottom: '8px' }}>🔍 तांत्रिक तपशील (Technical Stack Trace)</summary>
                <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', color: '#F87171' }}>{errorText}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
