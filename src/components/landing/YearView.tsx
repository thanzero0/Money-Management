import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatRupiah } from '../../utils/currency';
import { MONTH_NAMES_ID } from '../../types';
import { getCategoryColor } from '../../utils/categories';

export function YearView() {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { transactions, loadTransactionsByYear, getYearSummary, getMonthSummary, getCategoryTotals, getTopCategory } = useTransactionStore();
  const [selectedYear, setSelectedYear] = useState(settings.default_year || new Date().getFullYear());

  useEffect(() => {
    loadTransactionsByYear(selectedYear);
  }, [selectedYear]);

  const yearSummary = getYearSummary(selectedYear);
  const topCategory = getTopCategory(selectedYear);
  const expenditureRatio = yearSummary.pemasukan > 0
    ? Math.round((yearSummary.pengeluaran / yearSummary.pemasukan) * 100)
    : 0;

  const years = [];
  for (let y = 2020; y <= new Date().getFullYear() + 1; y++) {
    years.push(y);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20">
      {/* Filter Bar */}
      <div className="sticky top-14 z-30 py-3 bg-[var(--color-cream)]/95 backdrop-blur-sm dark:bg-[var(--color-dark-bg)]/95 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 text-sm font-medium bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)] focus:outline-none focus:border-[var(--color-accent)]"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="text-sm text-[var(--color-muted)]">Tampilan Tahunan</span>
          </div>

          <button
            onClick={() => navigate('/charts')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-secondary)] hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
          >
            <BarChart3 size={16} />
            Lihat Grafik
          </button>
        </div>
      </div>

      {/* Annual Summary Card */}
      <div className="surface-card p-6 mb-6 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] animate-fade-in-up">
        <h2
          className="text-sm font-semibold text-[var(--color-muted)] tracking-wider uppercase mb-4"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Ringkasan Tahunan — {selectedYear}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5">
          <div>
            <p className="text-xs text-[var(--color-muted)] mb-1">Total Pemasukan</p>
            <p className="text-xl font-semibold text-[var(--color-positive)] font-mono-number">
              {formatRupiah(yearSummary.pemasukan)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)] mb-1">Total Pengeluaran</p>
            <p className="text-xl font-semibold text-[var(--color-danger)] font-mono-number">
              {formatRupiah(yearSummary.pengeluaran)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)] mb-1">Saldo</p>
            <p className={`text-xl font-semibold font-mono-number ${
              yearSummary.saldo >= 0 ? 'text-[var(--color-primary)] dark:text-[var(--color-accent)]' : 'text-[var(--color-danger)]'
            }`}>
              {formatRupiah(yearSummary.saldo)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-[var(--color-muted)] mb-1.5">
            <span>Rasio Pengeluaran / Pemasukan</span>
            <span className="font-mono-number">{expenditureRatio}%</span>
          </div>
          <div className="h-2 bg-[var(--color-cream)] dark:bg-[var(--color-dark-surface-elevated)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                expenditureRatio > 100 ? 'bg-[var(--color-danger)]' : expenditureRatio > 80 ? 'bg-yellow-500' : 'bg-[var(--color-accent)]'
              }`}
              style={{ width: `${Math.min(expenditureRatio, 100)}%` }}
            />
          </div>
        </div>

        {topCategory && (
          <p className="text-xs text-[var(--color-muted)]">
            Kategori teratas:{' '}
            <span className="font-medium text-[var(--color-secondary)] dark:text-[var(--color-dark-text)]">
              {topCategory.kategori} — {topCategory.percentage}%
            </span>
          </p>
        )}
      </div>

      {/* Month Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MONTH_NAMES_ID.map((monthName, idx) => {
          const yearMonth = `${selectedYear}-${(idx + 1).toString().padStart(2, '0')}`;
          const summary = getMonthSummary(yearMonth);
          const hasData = summary.pemasukan > 0 || summary.pengeluaran > 0;
          const categoryTotals = getCategoryTotals(yearMonth, 'pengeluaran');
          const totalExpense = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

          return (
            <button
              key={idx}
              onClick={() => navigate(`/month/${yearMonth}`)}
              className={`surface-card p-4 text-left hover:shadow-lg transition-all duration-200 opacity-0 animate-fade-in-up dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] hover:border-[var(--color-accent)] dark:hover:border-[var(--color-accent)]`}
              style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'forwards' }}
            >
              {/* Month name */}
              <h3
                className="text-sm font-semibold text-[var(--color-primary)] dark:text-[var(--color-accent)] mb-3 uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {monthName} {selectedYear}
              </h3>

              {hasData ? (
                <>
                  {/* Income */}
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={13} className="text-[var(--color-positive)]" />
                    <span className="text-sm font-medium text-[var(--color-positive)] font-mono-number">
                      {formatRupiah(summary.pemasukan)}
                    </span>
                  </div>

                  {/* Expense */}
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={13} className="text-[var(--color-danger)]" />
                    <span className="text-sm font-medium text-[var(--color-danger)] font-mono-number">
                      {formatRupiah(summary.pengeluaran)}
                    </span>
                  </div>

                  {/* Balance */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-[var(--color-muted)]">=</span>
                    <span className={`text-sm font-bold font-mono-number ${
                      summary.saldo >= 0 ? 'text-[var(--color-primary)] dark:text-[var(--color-accent)]' : 'text-[var(--color-danger)]'
                    }`}>
                      {formatRupiah(summary.saldo)}
                    </span>
                  </div>

                  {/* Mini category bar */}
                  {totalExpense > 0 && (
                    <div className="h-1.5 rounded-full overflow-hidden flex">
                      {Object.entries(categoryTotals)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, amt]) => (
                          <div
                            key={cat}
                            className="h-full"
                            style={{
                              width: `${(amt / totalExpense) * 100}%`,
                              backgroundColor: getCategoryColor(cat),
                              minWidth: '2px',
                            }}
                            title={`${cat}: ${formatRupiah(amt)}`}
                          />
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-[var(--color-muted)] italic py-4">
                  Belum ada data
                </p>
              )}

              {/* Detail link */}
              <div className="flex items-center gap-1 mt-3 text-xs text-[var(--color-accent)] group-hover:text-[var(--color-primary)]">
                <span>Lihat Detail</span>
                <ArrowRight size={12} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Targets Section */}
      {(settings.target_tabungan > 0 || settings.target_pengeluaran_max > 0) && (
        <div className="mt-8 surface-card p-6 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <h3
            className="text-sm font-semibold text-[var(--color-muted)] tracking-wider uppercase mb-4"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Target Bulanan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {settings.target_tabungan > 0 && (
              <div>
                <div className="flex justify-between text-xs text-[var(--color-muted)] mb-1">
                  <span>Target Tabungan</span>
                  <span className="font-mono-number">
                    {formatRupiah(yearSummary.saldo)} / {formatRupiah(settings.target_tabungan)}
                  </span>
                </div>
                <div className="h-2 bg-[var(--color-cream)] dark:bg-[var(--color-dark-surface-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-positive)] rounded-full transition-all"
                    style={{ width: `${Math.min((yearSummary.saldo / settings.target_tabungan) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {settings.target_pengeluaran_max > 0 && (() => {
              const currentMonth = toYearMonth(new Date());
              const currentMonthSummary = getMonthSummary(currentMonth);
              const ratio = (currentMonthSummary.pengeluaran / settings.target_pengeluaran_max) * 100;
              return (
                <div>
                  <div className="flex justify-between text-xs text-[var(--color-muted)] mb-1">
                    <span>Batas Pengeluaran Bulan Ini</span>
                    <span className="font-mono-number">
                      {formatRupiah(currentMonthSummary.pengeluaran)} / {formatRupiah(settings.target_pengeluaran_max)}
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--color-cream)] dark:bg-[var(--color-dark-surface-elevated)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ratio > 100 ? 'bg-[var(--color-danger)]' : ratio > 80 ? 'bg-yellow-500' : 'bg-[var(--color-accent)]'}`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}
