import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3 } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16">
      {/* Header / Filter */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] pb-4 mb-12">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="text-xl sm:text-2xl font-medium bg-transparent text-[var(--color-primary)] dark:text-[var(--color-cream)] focus:outline-none cursor-pointer appearance-none"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          onClick={() => navigate('/charts')}
          className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] dark:hover:text-[var(--color-dark-text)] uppercase tracking-widest transition-colors"
        >
          <BarChart3 size={14} />
          Grafik
        </button>
      </div>

      {/* Annual Summary - Ultra clean */}
      <div className="flex flex-wrap gap-8 sm:gap-16 mb-16 px-2">
        <div>
          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-2">Pemasukan</p>
          <p className="text-xl sm:text-2xl text-[var(--color-text)] dark:text-[var(--color-dark-text)] font-mono-number font-medium">
            {formatRupiah(yearSummary.pemasukan)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-2">Pengeluaran</p>
          <p className="text-xl sm:text-2xl text-[var(--color-text)] dark:text-[var(--color-dark-text)] font-mono-number font-medium">
            {formatRupiah(yearSummary.pengeluaran)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest mb-2">Saldo Bersih</p>
          <p className={`text-xl sm:text-2xl font-mono-number font-bold ${yearSummary.saldo < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]'}`}>
            {formatRupiah(yearSummary.saldo)}
          </p>
        </div>
      </div>

      {/* Minimalist Month Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-border)] dark:bg-[var(--color-dark-border)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        {MONTH_NAMES_ID.map((monthName, idx) => {
          const yearMonth = `${selectedYear}-${(idx + 1).toString().padStart(2, '0')}`;
          const summary = getMonthSummary(yearMonth);
          const hasData = summary.pemasukan > 0 || summary.pengeluaran > 0;

          return (
            <button
              key={idx}
              onClick={() => navigate(`/month/${yearMonth}`)}
              className="bg-[var(--color-cream)] dark:bg-[var(--color-dark-bg)] p-6 text-left hover:bg-[var(--color-surface)] dark:hover:bg-[var(--color-dark-surface)] transition-all group flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-primary)] dark:text-[var(--color-dark-text)] tracking-wider mb-5">
                  {monthName}
                </h3>
                
                {hasData ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-muted)] font-medium uppercase tracking-wider text-[9px]">Pemasukan</span>
                      <span className="font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(summary.pemasukan)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-muted)] font-medium uppercase tracking-wider text-[9px]">Pengeluaran</span>
                      <span className="font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(summary.pengeluaran)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--color-muted)]/40 mt-1">—</p>
                )}
              </div>

              <div className="mt-6 flex items-end justify-between">
                <span className={`text-sm font-semibold font-mono-number ${summary.saldo < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]'}`}>
                  {hasData ? formatRupiah(summary.saldo) : ''}
                </span>
                <ArrowRight size={14} className="text-[var(--color-muted)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
