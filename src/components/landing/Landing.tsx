import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
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
  const { loadTransactionsByYear, getMonthSummary } = useTransactionStore();
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
      {/* Hero / Greeting - Ultra clean */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative">
        <div className="text-center w-full max-w-3xl animate-fade-in-up">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-medium text-[var(--color-primary)] dark:text-[var(--color-dark-text)] mb-6 tracking-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {settings.name ? `Halo, ${settings.name}.` : 'Halo.'}
          </h1>

          <p className="text-sm sm:text-base text-[var(--color-muted)] mb-16 tracking-wide">
            {formatDateIndonesian(now)}
          </p>

          {/* Simple text-based summary instead of pills */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 border-t border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] py-8 mx-auto">
            <div>
              <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-1.5">Pemasukan Bulan Ini</p>
              <p className="text-lg text-[var(--color-text)] dark:text-[var(--color-dark-text)] font-mono-number">
                {formatRupiah(monthSummary.pemasukan)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-1.5">Pengeluaran Bulan Ini</p>
              <p className="text-lg text-[var(--color-text)] dark:text-[var(--color-dark-text)] font-mono-number">
                {formatRupiah(monthSummary.pengeluaran)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-1.5">Saldo</p>
              <p className={`text-lg font-mono-number font-medium ${monthSummary.saldo < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]'}`}>
                {formatRupiah(monthSummary.saldo)}
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToDashboard}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors animate-bounce-subtle"
          aria-label="Scroll ke dashboard"
        >
          <ChevronDown size={24} strokeWidth={1.5} />
        </button>
      </section>

      {/* Dashboard Section */}
      <section id="dashboard-section" className="min-h-screen pb-20 pt-10 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <YearView />
      </section>

      {/* Name Modal */}
      <Modal isOpen={showNameModal} onClose={() => {}} showClose={false} size="sm">
        <div className="text-center py-6">
          <h2
            className="text-2xl font-medium text-[var(--color-primary)] dark:text-[var(--color-dark-text)] mb-3"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Siapa namamu?
          </h2>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetName()}
            placeholder="..."
            className="w-full text-center text-lg bg-transparent border-b-2 border-[var(--color-border)] dark:border-[var(--color-dark-border)] py-2 text-[var(--color-primary)] dark:text-[var(--color-dark-text)] focus:border-[var(--color-text)] focus:outline-none mb-8 transition-colors"
            style={{ fontFamily: 'var(--font-serif)' }}
            autoFocus
          />
          <Button onClick={handleSetName} size="md" className="w-full" disabled={!nameInput.trim()}>
            Mulai
          </Button>
        </div>
      </Modal>
    </div>
  );
}
