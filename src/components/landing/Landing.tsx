import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { formatDateIndonesian, toYearMonth } from '../../utils/date';
import { formatRupiah } from '../../utils/currency';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { YearView } from './YearView';

export function Landing() {
  const navigate = useNavigate();
  const { settings, setName, isLoaded } = useSettingsStore();
  const { loadTransactionsByYear, getMonthSummary, transactions } = useTransactionStore();
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);

  const now = new Date();
  const currentYearMonth = toYearMonth(now);

  useEffect(() => {
    if (isLoaded && !settings.name) {
      setShowNameModal(true);
    }
  }, [isLoaded, settings.name]);

  useEffect(() => {
    loadTransactionsByYear(now.getFullYear());
  }, []);

  const handleSetName = async () => {
    if (nameInput.trim()) {
      await setName(nameInput.trim());
      setShowNameModal(false);
    }
  };

  const monthSummary = getMonthSummary(currentYearMonth);

  const scrollToDashboard = () => {
    setShowDashboard(true);
    setTimeout(() => {
      document.getElementById('dashboard-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen">
      {/* Hero / Welcome Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative">
        <div className="text-center animate-fade-in-up">
          {/* Greeting */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-cream)] mb-3"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {settings.name ? `Halo, ${settings.name}.` : 'Halo.'}
          </h1>

          {/* Date */}
          <p className="text-base sm:text-lg text-[var(--color-muted)] mb-10">
            {formatDateIndonesian(now)}
          </p>

          {/* Summary pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 surface-card dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
              <TrendingUp size={16} className="text-[var(--color-positive)]" />
              <span className="text-xs text-[var(--color-muted)]">Pemasukan</span>
              <span className="text-sm font-semibold text-[var(--color-positive)] font-mono-number">
                {formatRupiah(monthSummary.pemasukan)}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 surface-card dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
              <TrendingDown size={16} className="text-[var(--color-danger)]" />
              <span className="text-xs text-[var(--color-muted)]">Pengeluaran</span>
              <span className="text-sm font-semibold text-[var(--color-danger)] font-mono-number">
                {formatRupiah(monthSummary.pengeluaran)}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 surface-card dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
              <Wallet size={16} className="text-[var(--color-primary)] dark:text-[var(--color-accent)]" />
              <span className="text-xs text-[var(--color-muted)]">Saldo</span>
              <span className={`text-sm font-semibold font-mono-number ${
                monthSummary.saldo >= 0 ? 'text-[var(--color-primary)] dark:text-[var(--color-accent)]' : 'text-[var(--color-danger)]'
              }`}>
                {formatRupiah(monthSummary.saldo)}
              </span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToDashboard}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--color-muted)] hover:text-[var(--color-secondary)] transition-colors animate-bounce-subtle"
          aria-label="Scroll ke dashboard"
        >
          <ChevronDown size={28} />
        </button>
      </section>

      {/* Dashboard Section */}
      {showDashboard && (
        <section id="dashboard-section" className="min-h-screen pb-20">
          <YearView />
        </section>
      )}

      {/* Always show dashboard below */}
      {!showDashboard && (
        <section id="dashboard-section" className="min-h-screen pb-20">
          <YearView />
        </section>
      )}

      {/* Name Modal */}
      <Modal isOpen={showNameModal} onClose={() => {}} showClose={false} size="sm">
        <div className="text-center py-4">
          <h2
            className="text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-accent)] mb-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Siapa namamu?
          </h2>
          <p className="text-sm text-[var(--color-muted)] mb-6">
            Nama ini akan digunakan untuk sapaan dan laporan keuanganmu.
          </p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetName()}
            placeholder="Ketik namamu..."
            className="w-full px-4 py-3 text-center text-lg border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)] focus:border-[var(--color-accent)] focus:outline-none mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}
            autoFocus
          />
          <Button onClick={handleSetName} size="lg" className="w-full" disabled={!nameInput.trim()}>
            Lanjutkan
          </Button>
        </div>
      </Modal>
    </div>
  );
}
