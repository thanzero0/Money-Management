import { Toaster, toast as hotToast } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          padding: '12px 16px',
          maxWidth: '400px',
        },
        success: {
          style: {
            background: '#F0FFF4',
            color: '#22543D',
            borderColor: '#C6F6D5',
          },
          iconTheme: { primary: '#27AE60', secondary: '#fff' },
        },
        error: {
          style: {
            background: '#FFF5F5',
            color: '#742A2A',
            borderColor: '#FED7D7',
          },
          iconTheme: { primary: '#C0392B', secondary: '#fff' },
        },
      }}
      containerStyle={{ top: 16, right: 16 }}
      gutter={8}
    />
  );
}

export const toast = {
  success: (msg: string) => hotToast.success(msg),
  error: (msg: string) => hotToast.error(msg),
  info: (msg: string) =>
    hotToast(msg, {
      style: {
        background: '#F7FAFC',
        color: '#2D3748',
        borderColor: '#E2E8F0',
      },
      icon: 'ℹ️',
    }),
  warning: (msg: string) =>
    hotToast(msg, {
      style: {
        background: '#FFFFF0',
        color: '#744210',
        borderColor: '#FEFCBF',
      },
      icon: '⚠️',
    }),
  undo: (msg: string, onUndo: () => void) =>
    hotToast(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{msg}</span>
          <button
            onClick={() => {
              onUndo();
              hotToast.dismiss(t.id);
            }}
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontSize: '0.875rem',
            }}
          >
            Urungkan
          </button>
        </div>
      ),
      { duration: 3000 }
    ),
};
