import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatRupiah, parseCurrencyInput } from '../../utils/currency';
import { formatMonthYear, formatDateShort, parseISODate, toISODate } from '../../utils/date';
import { MONTH_NAMES_ID, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../../types';
import { getCategoryColor } from '../../utils/categories';
import { SpendingCharts } from './SpendingCharts';

export function MonthView() {
  const { yearMonth } = useParams<{ yearMonth: string }>();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const {
    transactions,
    loadTransactionsByMonth,
    loadMonthlyMeta,
    updateMonthlyMeta,
    updateEstimasi,
    getMonthSummary,
    getCategoryTotals,
    getBudgetAlerts,
    monthlyMeta: metaStore,
  } = useTransactionStore();

  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [year, month] = (yearMonth || '').split('-').map(Number);
  const meta = metaStore[yearMonth || ''] || {
    year_month: yearMonth,
    estimasi_pemasukan: {},
    estimasi_pengeluaran: {},
    catatan_bulan: '',
    starting_balance: 0,
  };

  useEffect(() => {
    if (yearMonth) {
      loadTransactionsByMonth(yearMonth);
      loadMonthlyMeta(yearMonth);
    }
  }, [yearMonth]);

  // Navigation
  const getPrevMonth = () => {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    return `${y}-${m.toString().padStart(2, '0')}`;
  };

  const getNextMonth = () => {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    return `${y}-${m.toString().padStart(2, '0')}`;
  };

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') navigate(`/month/${getPrevMonth()}`);
      if (e.key === 'ArrowRight') navigate(`/month/${getNextMonth()}`);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [year, month]);

  const summary = getMonthSummary(yearMonth || '');
  const incomeTotals = getCategoryTotals(yearMonth || '', 'pemasukan');
  const expenseTotals = getCategoryTotals(yearMonth || '', 'pengeluaran');
  const budgetAlerts = getBudgetAlerts(yearMonth || '');

  // Group transactions by date
  const groupedByDate = transactions.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

  // Estimasi edit handlers
  const handleEstimasiClick = (type: 'pemasukan' | 'pengeluaran', kategori: string) => {
    const key = `${type}-${kategori}`;
    const currentVal = type === 'pemasukan'
      ? meta.estimasi_pemasukan[kategori] || 0
      : meta.estimasi_pengeluaran[kategori] || 0;
    setEditingCell(key);
    setEditValue(currentVal > 0 ? currentVal.toString() : '');
  };

  const handleEstimasiSave = async (type: 'pemasukan' | 'pengeluaran', kategori: string) => {
    const value = parseCurrencyInput(editValue);
    await updateEstimasi(yearMonth || '', type, kategori, value);
    setEditingCell(null);
    setEditValue('');
  };

  const incomeCategories = [...DEFAULT_INCOME_CATEGORIES, ...settings.custom_income_categories];
  const expenseCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...settings.custom_expense_categories];

  const totalEstPemasukan = incomeCategories.reduce((s, c) => s + (meta.estimasi_pemasukan[c] || 0), 0);
  const totalEstPengeluaran = expenseCategories.reduce((s, c) => s + (meta.estimasi_pengeluaran[c] || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-secondary)] transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <h1
          className="text-xl sm:text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-cream)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {month > 0 && MONTH_NAMES_ID[month - 1]} {year}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/month/${getPrevMonth()}`)}
            className="p-1.5 hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
          >
            <ArrowLeft size={16} className="text-[var(--color-muted)]" />
          </button>
          <button
            onClick={() => navigate(`/month/${getNextMonth()}`)}
            className="p-1.5 hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
          >
            <ArrowRight size={16} className="text-[var(--color-muted)]" />
          </button>
        </div>
      </div>

      {/* Monthly Analysis Table */}
      <div className="surface-card p-4 sm:p-6 mb-6 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] animate-fade-in-up">
        <h2 className="text-sm font-semibold text-[var(--color-muted)] tracking-wider uppercase mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
          Laporan Keuangan — {month > 0 && MONTH_NAMES_ID[month - 1]} {year}
        </h2>
        <p className="text-xs text-[var(--color-muted)] mb-4">{settings.name || 'Pengguna'}</p>

        {/* PEMASUKAN */}
        <div className="mb-6">
          <div className="bg-[var(--color-accent)]/20 px-3 py-1.5 rounded-t-lg">
            <h3 className="text-xs font-bold text-[var(--color-primary)] dark:text-[var(--color-accent)] uppercase tracking-wider">
              Pemasukan
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--color-muted)]">Sumber</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--color-muted)]">Estimasi</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--color-muted)]">Aktual</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--color-muted)]">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {incomeCategories.map((cat) => {
                  const est = meta.estimasi_pemasukan[cat] || 0;
                  const akt = incomeTotals[cat] || 0;
                  const selisih = akt - est;
                  const cellKey = `pemasukan-${cat}`;
                  return (
                    <tr key={cat} className="border-b border-[var(--color-border)]/50 dark:border-[var(--color-dark-border)]/50">
                      <td className="py-2 px-3 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{cat}</td>
                      <td className="py-2 px-3 text-right">
                        {editingCell === cellKey ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleEstimasiSave('pemasukan', cat)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEstimasiSave('pemasukan', cat)}
                            className="w-24 px-2 py-0.5 text-right text-sm border border-[var(--color-accent)] rounded bg-[var(--color-surface)] font-mono-number dark:bg-[var(--color-dark-surface)] dark:text-[var(--color-dark-text)]"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => handleEstimasiClick('pemasukan', cat)}
                            className="font-mono-number text-[var(--color-muted)] hover:text-[var(--color-text)] hover:underline cursor-pointer dark:hover:text-[var(--color-dark-text)]"
                          >
                            {est > 0 ? formatRupiah(est) : 'Rp —'}
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">
                        {akt > 0 ? formatRupiah(akt) : 'Rp —'}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono-number ${selisih >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                        {est > 0 || akt > 0 ? formatRupiah(selisih) : 'Rp 0'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-semibold border-t-2 border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                  <td className="py-2 px-3 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">TOTAL PEMASUKAN</td>
                  <td className="py-2 px-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(totalEstPemasukan)}</td>
                  <td className="py-2 px-3 text-right font-mono-number text-[var(--color-positive)]">{formatRupiah(summary.pemasukan)}</td>
                  <td className={`py-2 px-3 text-right font-mono-number ${summary.pemasukan - totalEstPemasukan >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                    {formatRupiah(summary.pemasukan - totalEstPemasukan)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* PENGELUARAN */}
        <div className="mb-6">
          <div className="bg-[var(--color-danger)]/10 px-3 py-1.5 rounded-t-lg">
            <h3 className="text-xs font-bold text-[var(--color-danger)] uppercase tracking-wider">
              Pengeluaran
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                  <th className="text-left py-2 px-3 text-xs font-medium text-[var(--color-muted)]">Kategori</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--color-muted)]">Estimasi</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--color-muted)]">Aktual</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--color-muted)]">Selisih</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-[var(--color-muted)] w-16">Budget</th>
                </tr>
              </thead>
              <tbody>
                {expenseCategories.map((cat) => {
                  const est = meta.estimasi_pengeluaran[cat] || 0;
                  const akt = expenseTotals[cat] || 0;
                  const selisih = akt - est;
                  const cellKey = `pengeluaran-${cat}`;
                  const alert = budgetAlerts.find((a) => a.kategori === cat);
                  return (
                    <tr key={cat} className="border-b border-[var(--color-border)]/50 dark:border-[var(--color-dark-border)]/50">
                      <td className="py-2 px-3 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
                          {cat}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {editingCell === cellKey ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleEstimasiSave('pengeluaran', cat)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEstimasiSave('pengeluaran', cat)}
                            className="w-24 px-2 py-0.5 text-right text-sm border border-[var(--color-accent)] rounded bg-[var(--color-surface)] font-mono-number dark:bg-[var(--color-dark-surface)] dark:text-[var(--color-dark-text)]"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => handleEstimasiClick('pengeluaran', cat)}
                            className="font-mono-number text-[var(--color-muted)] hover:text-[var(--color-text)] hover:underline cursor-pointer dark:hover:text-[var(--color-dark-text)]"
                          >
                            {est > 0 ? formatRupiah(est) : 'Rp —'}
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">
                        {akt > 0 ? formatRupiah(akt) : 'Rp —'}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono-number ${selisih <= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                        {est > 0 || akt > 0 ? formatRupiah(selisih) : 'Rp 0'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {alert && alert.status !== 'normal' && (
                          <span className={`inline-block w-2 h-2 rounded-full ${alert.status === 'exceeded' ? 'bg-[var(--color-danger)]' : 'bg-yellow-500'}`} title={`${Math.round(alert.percentage)}% dari budget`} />
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-semibold border-t-2 border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                  <td className="py-2 px-3 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">TOTAL PENGELUARAN</td>
                  <td className="py-2 px-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(totalEstPengeluaran)}</td>
                  <td className="py-2 px-3 text-right font-mono-number text-[var(--color-danger)]">{formatRupiah(summary.pengeluaran)}</td>
                  <td className={`py-2 px-3 text-right font-mono-number ${summary.pengeluaran - totalEstPengeluaran <= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                    {formatRupiah(summary.pengeluaran - totalEstPengeluaran)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* NET SALDO */}
        <div className="border-t-2 border-[var(--color-primary)] dark:border-[var(--color-accent)] pt-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--color-primary)] dark:text-[var(--color-accent)]">NET (Saldo)</span>
            <div className="flex items-center gap-8 text-sm font-bold font-mono-number">
              <span className="text-[var(--color-text)] dark:text-[var(--color-dark-text)]">
                {formatRupiah(totalEstPemasukan - totalEstPengeluaran)}
              </span>
              <span className={summary.saldo >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}>
                {formatRupiah(summary.saldo)}
              </span>
              <span className={summary.saldo - (totalEstPemasukan - totalEstPengeluaran) >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}>
                {formatRupiah(summary.saldo - (totalEstPemasukan - totalEstPengeluaran))}
              </span>
            </div>
          </div>
        </div>

        {/* Catatan */}
        <div>
          <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide block mb-2">
            Catatan Bulan Ini
          </label>
          <textarea
            value={meta.catatan_bulan}
            onChange={(e) => updateMonthlyMeta(yearMonth || '', { catatan_bulan: e.target.value })}
            placeholder="Tulis catatan untuk bulan ini..."
            className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)] resize-none h-20 focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>
      </div>

      {/* Spending Charts */}
      <SpendingCharts yearMonth={yearMonth || ''} transactions={transactions} />

      {/* Daily Transaction Preview */}
      <div className="surface-card p-4 sm:p-6 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-muted)] tracking-wider uppercase" style={{ fontFamily: 'var(--font-sans)' }}>
            Transaksi Harian
          </h3>
          <button
            onClick={() => navigate(`/day/${toISODate(new Date())}`)}
            className="text-xs text-[var(--color-accent)] hover:text-[var(--color-primary)] font-medium transition-colors"
          >
            + Tambah Transaksi
          </button>
        </div>

        {Object.keys(groupedByDate).length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] text-center py-8 italic">
            Belum ada transaksi bulan ini
          </p>
        ) : (
          <div className="space-y-1">
            {Object.entries(groupedByDate)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([date, txs]) => {
                const isExpanded = expandedDates.has(date);
                const dayIncome = txs.reduce((s, t) => s + (t.pemasukan || 0), 0);
                const dayExpense = txs.reduce((s, t) => s + (t.pengeluaran || 0), 0);

                return (
                  <div key={date} className="border border-[var(--color-border)]/50 dark:border-[var(--color-dark-border)]/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        const next = new Set(expandedDates);
                        isExpanded ? next.delete(date) : next.add(date);
                        setExpandedDates(next);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--color-cream)]/50 dark:hover:bg-[var(--color-dark-surface-elevated)]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-dark-text)]">
                          {formatDateShort(parseISODate(date))}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">({txs.length} transaksi)</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono-number">
                        {dayIncome > 0 && <span className="text-[var(--color-positive)]">+{formatRupiah(dayIncome)}</span>}
                        {dayExpense > 0 && <span className="text-[var(--color-danger)]">-{formatRupiah(dayExpense)}</span>}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--color-border)]/50 dark:border-[var(--color-dark-border)]/50">
                        {txs.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[var(--color-cream)]/30 dark:hover:bg-[var(--color-dark-surface-elevated)]/30 cursor-pointer"
                            onClick={() => navigate(`/day/${date}`)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(tx.kategori) }} />
                              <span className="text-[var(--color-text)] dark:text-[var(--color-dark-text)] truncate">{tx.keterangan}</span>
                              <span className="text-[var(--color-muted)] shrink-0">· {tx.kategori}</span>
                            </div>
                            <span className={`shrink-0 ml-2 font-mono-number ${tx.pemasukan > 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                              {tx.pemasukan > 0 ? `+${formatRupiah(tx.pemasukan)}` : `-${formatRupiah(tx.pengeluaran)}`}
                            </span>
                          </div>
                        ))}
                        <button
                          onClick={() => navigate(`/day/${date}`)}
                          className="w-full px-3 py-2 text-xs text-[var(--color-accent)] hover:bg-[var(--color-cream)]/50 dark:hover:bg-[var(--color-dark-surface-elevated)]/50 text-center font-medium"
                        >
                          Buka jurnal harian →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
