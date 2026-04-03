import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Settings, Download, Menu, X, WifiOff, Plus } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { SearchModal } from '../common/SearchModal';
import { ExportModal } from '../export/ExportModal';
import { QuickEntryModal } from '../daily/QuickEntryModal';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettingsStore();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setQuickEntryOpen(true);
      }
      if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setExportOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isLanding = location.pathname === '/';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
          isLanding
            ? 'bg-transparent'
            : 'bg-[var(--color-cream)]/95 backdrop-blur-sm border-b border-[var(--color-border)] dark:bg-[var(--color-dark-bg)]/95 dark:border-[var(--color-dark-border)]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-serif)' }}>
                  L
                </span>
              </div>
              <span
                className="text-lg font-semibold text-[var(--color-primary)] dark:text-[var(--color-cream)] hidden sm:inline"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Ledger
              </span>
            </button>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-1">
              {isOffline && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium mr-2 border border-yellow-200">
                  <WifiOff size={14} />
                  Offline
                </div>
              )}

              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
              >
                <Search size={16} />
                <span className="text-xs">Ctrl+K</span>
              </button>

              <button
                onClick={() => setQuickEntryOpen(true)}
                className="p-2 text-[var(--color-muted)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
                title="Tambah cepat (Ctrl+N)"
              >
                <Plus size={18} />
              </button>

              <button
                onClick={() => setExportOpen(true)}
                className="p-2 text-[var(--color-muted)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
                title="Ekspor (Ctrl+E)"
              >
                <Download size={18} />
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-[var(--color-muted)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
                title="Pengaturan"
              >
                <Settings size={18} />
              </button>

              {settings.name && (
                <div className="ml-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {settings.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[var(--color-secondary)] dark:text-[var(--color-dark-text)]"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] animate-slide-in">
            <div className="px-4 py-3 space-y-1">
              {isOffline && (
                <div className="flex items-center gap-1.5 px-3 py-2 text-yellow-700 text-sm">
                  <WifiOff size={14} />
                  Mode Offline
                </div>
              )}
              <button
                onClick={() => { setSearchOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-cream)] rounded-lg dark:text-[var(--color-dark-text)] dark:hover:bg-[var(--color-dark-surface-elevated)]"
              >
                <Search size={16} /> Cari Transaksi
              </button>
              <button
                onClick={() => { setQuickEntryOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-cream)] rounded-lg dark:text-[var(--color-dark-text)] dark:hover:bg-[var(--color-dark-surface-elevated)]"
              >
                <Plus size={16} /> Tambah Cepat
              </button>
              <button
                onClick={() => { setExportOpen(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-cream)] rounded-lg dark:text-[var(--color-dark-text)] dark:hover:bg-[var(--color-dark-surface-elevated)]"
              >
                <Download size={16} /> Ekspor Data
              </button>
              <button
                onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-[var(--color-secondary)] hover:bg-[var(--color-cream)] rounded-lg dark:text-[var(--color-dark-text)] dark:hover:bg-[var(--color-dark-surface-elevated)]"
              >
                <Settings size={16} /> Pengaturan
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Modals */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <QuickEntryModal isOpen={quickEntryOpen} onClose={() => setQuickEntryOpen(false)} />
    </>
  );
}
