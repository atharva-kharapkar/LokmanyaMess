const fs = require('fs');
const file = 'src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the second (duplicate) declaration of toast state and helper
const targetDecl = `  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);`;

// Replace ONLY the second occurrence of this declaration
const firstDeclIndex = content.indexOf(targetDecl);
if (firstDeclIndex !== -1) {
  const secondDeclIndex = content.indexOf(targetDecl, firstDeclIndex + targetDecl.length);
  if (secondDeclIndex !== -1) {
    content = content.substring(0, secondDeclIndex) + content.substring(secondDeclIndex + targetDecl.length);
    console.log('Removed duplicate showToast declaration successfully!');
  }
}

// 2. Remove the second (duplicate) toast markup in the PIN screen
const targetMarkup = `        {/* TOAST NOTIFICATION CONTAINER */}
        {toast && (
          <div className="toast-notification" style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '700',
            animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
            <span>{toast.message}</span>
          </div>
        )}`;

const firstMarkupIndex = content.indexOf(targetMarkup);
if (firstMarkupIndex !== -1) {
  const secondMarkupIndex = content.indexOf(targetMarkup, firstMarkupIndex + targetMarkup.length);
  if (secondMarkupIndex !== -1) {
    content = content.substring(0, secondMarkupIndex) + content.substring(secondMarkupIndex + targetMarkup.length);
    console.log('Removed duplicate toast markup from PIN screen successfully!');
  }
}

// 3. Append toast notification container to the very bottom of the main app layout
const bottomIndex = content.lastIndexOf(`    </div>\n  );\n}`);
if (bottomIndex !== -1) {
  const replacementBottom = `      {/* TOAST NOTIFICATION CONTAINER FOR MAIN APP */}
      {toast && (
        <div className="toast-notification" style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '700',
          animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <span>{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );\n}`;
  content = content.substring(0, bottomIndex) + replacementBottom;
  console.log('Appended Toast notification to main app successfully!');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');

