import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatRupiah, parseCurrencyInput } from '../../utils/currency';
import { formatDateShort, parseISODate, toISODate } from '../../utils/date';
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

  const groupedByDate = transactions.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] pb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] dark:hover:text-[var(--color-dark-text)] uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(`/month/${getPrevMonth()}`)} className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1
            className="text-xl sm:text-2xl text-[var(--color-primary)] dark:text-[var(--color-cream)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {month > 0 && MONTH_NAMES_ID[month - 1]} {year}
          </h1>
          <button onClick={() => navigate(`/month/${getNextMonth()}`)} className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="mb-16">
        {/* PEMASUKAN */}
        <div className="mb-12">
          <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-4">
            Pemasukan
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <th className="text-left py-2 text-[10px] uppercase text-[var(--color-muted)] font-medium">Sumber</th>
                <th className="text-right py-2 text-[10px] uppercase text-[var(--color-muted)] font-medium">Estimasi</th>
                <th className="text-right py-2 text-[10px] uppercase text-[var(--color-muted)] font-medium">Aktual</th>
                <th className="text-right py-2 text-[10px] uppercase text-[var(--color-muted)] font-medium">Selisih</th>
              </tr>
            </thead>
            <tbody>
              {incomeCategories.map((cat) => {
                const est = meta.estimasi_pemasukan[cat] || 0;
                const akt = incomeTotals[cat] || 0;
                const selisih = akt - est;
                const cellKey = `pemasukan-${cat}`;
                return (
                  <tr key={cat} className="border-b border-[var(--color-border)]/50 dark:border-[var(--color-dark-border)]/50 group hover:bg-[var(--color-cream-dark)]/30 dark:hover:bg-[var(--color-dark-surface-elevated)]/30 transition-colors">
                    <td className="py-2 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{cat}</td>
                    <td className="py-2 text-right">
                      {editingCell === cellKey ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEstimasiSave('pemasukan', cat)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEstimasiSave('pemasukan', cat)}
                          className="w-24 px-2 py-0.5 text-right text-sm border-b border-[var(--color-text)] bg-transparent font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)] outline-none"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleEstimasiClick('pemasukan', cat)}
                          className="font-mono-number text-[var(--color-muted)] group-hover:text-[var(--color-text)] dark:group-hover:text-[var(--color-dark-text)] cursor-text"
                        >
                          {est > 0 ? formatRupiah(est) : '—'}
                        </button>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">
                      {formatRupiah(akt)}
                    </td>
                    <td className={`py-2 text-right font-mono-number ${selisih >= 0 ? 'text-[var(--color-text)] dark:text-[var(--color-dark-text)]' : 'text-[var(--color-danger)]'}`}>
                      {formatRupiah(Math.abs(selisih))} {selisih < 0 && '↓'}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <td className="py-3 text-[10px] uppercase tracking-widest text-[var(--color-muted)]">Total Pemasukan</td>
                <td className="py-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(totalEstPemasukan)}</td>
                <td className="py-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(summary.pemasukan)}</td>
                <td className="py-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PENGELUARAN */}
        <div className="mb-12">
          <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] mb-4">
            Pengeluaran
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <th className="text-left py-2 text-[10px] uppercase text-[var(--color-muted)] font-medium">Kategori</th>
                <th className="text-right py-2 text-[10px] uppercase text-[var(--color-muted)] font-medium">Estimasi</th>
                <th className="text-right py-2 text-[10px] uppercase text-[var(--color-muted)] font-medium">Aktual</th>
                <th className="text-right py-2 text-[10px] uppercase text-[var(--color-muted)] font-medium">Selisih</th>
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
                  <tr key={cat} className="border-b border-[var(--color-border)]/50 dark:border-[var(--color-dark-border)]/50 group hover:bg-[var(--color-cream-dark)]/30 dark:hover:bg-[var(--color-dark-surface-elevated)]/30 transition-colors">
                    <td className="py-2 text-[var(--color-text)] dark:text-[var(--color-dark-text)] flex items-center justify-between">
                      {cat}
                      {alert && alert.status !== 'normal' && (
                        <span className={`w-1.5 h-1.5 rounded-full ${alert.status === 'exceeded' ? 'bg-[var(--color-danger)]' : 'bg-yellow-500'}`} />
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {editingCell === cellKey ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleEstimasiSave('pengeluaran', cat)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEstimasiSave('pengeluaran', cat)}
                          className="w-24 px-2 py-0.5 text-right text-sm border-b border-[var(--color-text)] bg-transparent font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)] outline-none"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleEstimasiClick('pengeluaran', cat)}
                          className="font-mono-number text-[var(--color-muted)] group-hover:text-[var(--color-text)] dark:group-hover:text-[var(--color-dark-text)] cursor-text"
                        >
                          {est > 0 ? formatRupiah(est) : '—'}
                        </button>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">
                      {formatRupiah(akt)}
                    </td>
                    <td className={`py-2 text-right font-mono-number ${selisih > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)] dark:text-[var(--color-dark-text)]'}`}>
                      {formatRupiah(Math.abs(selisih))} {selisih > 0 && '↑'}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <td className="py-3 text-[10px] uppercase tracking-widest text-[var(--color-muted)]">Total Pengeluaran</td>
                <td className="py-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(totalEstPengeluaran)}</td>
                <td className="py-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(summary.pengeluaran)}</td>
                <td className="py-3 text-right font-mono-number text-[var(--color-text)] dark:text-[var(--color-dark-text)]">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* NET SALDO */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] pt-6">
          <span className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-bold">Saldo Bersih</span>
          <span className={`text-2xl font-mono-number font-medium tracking-tight ${summary.saldo < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]'}`}>
            {formatRupiah(summary.saldo)}
          </span>
        </div>
      </div>

      {/* Spending Charts */}
      <SpendingCharts yearMonth={yearMonth || ''} transactions={transactions} />

      {/* Daily Preview - Minimal */}
      <div className="mt-16 pt-8 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-medium">Transaksi Harian</h3>
          <button
            onClick={() => navigate(`/day/${toISODate(new Date())}`)}
            className="text-[10px] uppercase tracking-widest text-[var(--color-text)] dark:text-[var(--color-dark-text)] hover:text-[var(--color-muted)] transition-colors border-b border-[var(--color-text)] dark:border-[var(--color-dark-text)]"
          >
            Tulis Jurnal
          </button>
        </div>

        {Object.keys(groupedByDate).length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic">Belum ada transaksi bulan ini</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByDate).sort((a, b) => a[0].localeCompare(b[0])).map(([date, txs]) => {
              const isExpanded = expandedDates.has(date);
              const dayIncome = txs.reduce((s, t) => s + (t.pemasukan || 0), 0);
              const dayExpense = txs.reduce((s, t) => s + (t.pengeluaran || 0), 0);

              return (
                <div key={date} className="border-b border-[var(--color-border)]/50 dark:border-[var(--color-dark-border)]/50 pb-2">
                  <button
                    onClick={() => {
                      const next = new Set(expandedDates);
                      isExpanded ? next.delete(date) : next.add(date);
                      setExpandedDates(next);
                    }}
                    className="w-full flex items-center justify-between py-2 text-[var(--color-text)] dark:text-[var(--color-dark-text)] hover:text-[var(--color-muted)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="text-sm font-medium">{formatDateShort(parseISODate(date))}</span>
                    </div>
                    <div className="flex gap-4 text-xs font-mono-number text-[var(--color-muted)]">
                      {dayIncome > 0 && <span>In: {formatRupiah(dayIncome)}</span>}
                      {dayExpense > 0 && <span>Out: {formatRupiah(dayExpense)}</span>}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pl-7 pb-3 pr-2 text-sm text-[var(--color-muted)]">
                      {txs.map((tx) => (
                        <div key={tx.id} className="flex justify-between py-1 cursor-pointer hover:text-[var(--color-text)] dark:hover:text-[var(--color-dark-text)]" onClick={() => navigate(`/day/${date}`)}>
                          <span className="truncate pr-4">{tx.keterangan}</span>
                          <span className="font-mono-number">{formatRupiah(tx.pemasukan || tx.pengeluaran)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-16">
        <label className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-medium block mb-3">
          Catatan Bulan Ini
        </label>
        <textarea
          value={meta.catatan_bulan}
          onChange={(e) => updateMonthlyMeta(yearMonth || '', { catatan_bulan: e.target.value })}
          placeholder="..."
          className="w-full text-sm bg-transparent border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)] resize-none h-20 focus:border-[var(--color-primary)] dark:focus:border-[var(--color-dark-text)] focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
