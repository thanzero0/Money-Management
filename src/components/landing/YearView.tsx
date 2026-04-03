import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatRupiah } from '../../utils/currency';
import { MONTH_NAMES_ID } from '../../types';

export function YearView() {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { loadTransactionsByYear, getYearSummary, getMonthSummary } = useTransactionStore();
  const [selectedYear, setSelectedYear] = useState(settings.default_year || new Date().getFullYear());

  useEffect(() => {
    loadTransactionsByYear(selectedYear);
  }, [selectedYear]);

  const yearSummary = getYearSummary(selectedYear);

  const years = [];
  for (let y = 2020; y <= new Date().getFullYear() + 1; y++) {
    years.push(y);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16">
      {/* Centered Annual Filter & Graph Shortcut */}
      <div className="flex items-center justify-between mb-24 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] pb-8 px-4">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="text-xl sm:text-2xl font-medium bg-transparent text-[var(--color-primary)] dark:text-[var(--color-cream)] focus:outline-none cursor-pointer appearance-none text-center"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          onClick={() => navigate('/charts')}
          className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] dark:hover:text-[var(--color-dark-text)] uppercase tracking-[0.2em] transition-colors"
        >
          <BarChart3 size={14} />
          Grafik Tren
        </button>
      </div>

      {/* Centered Annual Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 mb-32 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] pb-24">
        <div className="text-center">
          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3">Pemasukan Global</p>
          <p className="text-xl sm:text-3xl text-[var(--color-text)] dark:text-[var(--color-dark-text)] font-mono-number font-medium tracking-tight">
            {formatRupiah(yearSummary.pemasukan)}
          </p>
        </div>
        <div className="text-center hidden sm:block w-px h-12 bg-[var(--color-border)] dark:bg-[var(--color-dark-border)]"></div>
        <div className="text-center">
          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3">Pengeluaran Global</p>
          <p className="text-xl sm:text-3xl text-[var(--color-text)] dark:text-[var(--color-dark-text)] font-mono-number font-medium tracking-tight">
            {formatRupiah(yearSummary.pengeluaran)}
          </p>
        </div>
        <div className="text-center hidden sm:block w-px h-12 bg-[var(--color-border)] dark:bg-[var(--color-dark-border)]"></div>
        <div className="text-center">
          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-3">Saldo Akumulasi</p>
          <p className={`text-xl sm:text-3xl font-mono-number font-medium tracking-tight ${yearSummary.saldo < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]'}`}>
            {formatRupiah(yearSummary.saldo)}
          </p>
        </div>
      </div>

      {/* Extreme Minimalist Centered Month Grid Without Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-20 gap-x-12 pb-32">
        {MONTH_NAMES_ID.map((monthName, idx) => {
          const yearMonth = `${selectedYear}-${(idx + 1).toString().padStart(2, '0')}`;
          const summary = getMonthSummary(yearMonth);
          const hasData = summary.pemasukan > 0 || summary.pengeluaran > 0;

          return (
            <button
              key={idx}
              onClick={() => navigate(`/month/${yearMonth}`)}
              className="text-center group flex flex-col items-center justify-center hover:-translate-y-1 transition-transform duration-300"
            >
              <h3 className="text-xs font-semibold text-[var(--color-primary)] dark:text-[var(--color-dark-text)] tracking-[0.2em] uppercase mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                {monthName}
              </h3>
              
              <div className="h-4 flex items-center justify-center">
               {hasData ? (
                 <span className={`text-xs font-mono-number tracking-wider ${summary.saldo < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)] dark:text-[var(--color-dark-text)]'}`}>
                   {formatRupiah(summary.saldo)}
                 </span>
               ) : (
                 <span className="text-[10px] text-[var(--color-muted)]/30 group-hover:text-[var(--color-muted)] transition-colors">—</span>
               )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
