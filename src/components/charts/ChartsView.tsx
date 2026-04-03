import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { MONTH_NAMES_SHORT_ID, DEFAULT_EXPENSE_CATEGORIES } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { getCategoryColor } from '../../utils/categories';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

export function ChartsView() {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { transactions, loadTransactionsByYear } = useTransactionStore();
  const [year, setYear] = useState(settings.default_year || new Date().getFullYear());

  useEffect(() => {
    loadTransactionsByYear(year);
  }, [year]);

  const txs = transactions.filter((t) => t.date.startsWith(`${year}`) && !t.deleted_at);

  // Monthly totals
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, () => ({ pemasukan: 0, pengeluaran: 0 }));
    for (const tx of txs) {
      const m = parseInt(tx.date.split('-')[1]) - 1;
      data[m].pemasukan += tx.pemasukan || 0;
      data[m].pengeluaran += tx.pengeluaran || 0;
    }
    return data;
  }, [txs]);

  // Category spending per month (stacked bar)
  const categoryMonthly = useMemo(() => {
    const cats = [...DEFAULT_EXPENSE_CATEGORIES, ...settings.custom_expense_categories];
    const data: Record<string, number[]> = {};
    for (const cat of cats) {
      data[cat] = Array(12).fill(0);
    }
    for (const tx of txs) {
      if (tx.pengeluaran > 0 && data[tx.kategori]) {
        const m = parseInt(tx.date.split('-')[1]) - 1;
        data[tx.kategori][m] += tx.pengeluaran;
      }
    }
    return data;
  }, [txs]);

  // Net savings trend
  const savingsTrend = useMemo(() => {
    let cumulative = 0;
    return monthlyData.map((d) => {
      cumulative += d.pemasukan - d.pengeluaran;
      return cumulative;
    });
  }, [monthlyData]);

  // Spending heatmap data
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    let max = 0;
    for (const tx of txs) {
      data[tx.date] = (data[tx.date] || 0) + tx.pengeluaran;
      if (data[tx.date] > max) max = data[tx.date];
    }
    return { data, max };
  }, [txs]);

  const labels = [...MONTH_NAMES_SHORT_ID];
  const years = [];
  for (let y = 2020; y <= new Date().getFullYear() + 1; y++) years.push(y);

  const chartOpts: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { family: 'DM Sans', size: 11 }, boxWidth: 8, usePointStyle: true } },
      tooltip: {
        backgroundColor: '#2D4A3E',
        titleFont: { family: 'DM Sans' },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${formatRupiah(ctx.raw)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 } } },
      y: { grid: { color: '#E0D8CC40' }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, callback: (v: any) => formatRupiah(v, false) } },
    },
  };

  // Heatmap rendering
  const renderHeatmap = () => {
    const startDate = new Date(year, 0, 1);
    const startDay = startDate.getDay(); // 0=Sunday
    const weeks: { date: string; amount: number; day: number }[][] = [];
    let currentWeek: { date: string; amount: number; day: number }[] = [];

    // Fill empty cells before Jan 1
    for (let i = 0; i < startDay; i++) {
      currentWeek.push({ date: '', amount: 0, day: i });
    }

    const endDate = new Date(year, 11, 31);
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`;
      currentWeek.push({
        date: dateStr,
        amount: heatmapData.data[dateStr] || 0,
        day: current.getDay(),
      });

      if (current.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return (
      <div className="overflow-x-auto">
        <div className="flex gap-[2px]" style={{ minWidth: '700px' }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((cell, ci) => {
                if (!cell.date) return <div key={ci} className="w-3 h-3" />;
                const intensity = heatmapData.max > 0 ? cell.amount / heatmapData.max : 0;
                let bg = 'bg-[var(--color-cream-dark)] dark:bg-[var(--color-dark-surface-elevated)]';
                if (intensity > 0.8) bg = 'bg-[var(--color-danger)]';
                else if (intensity > 0.6) bg = 'bg-[var(--color-danger)]/70';
                else if (intensity > 0.4) bg = 'bg-orange-400';
                else if (intensity > 0.2) bg = 'bg-yellow-400';
                else if (intensity > 0) bg = 'bg-[var(--color-accent)]/50';

                return (
                  <div
                    key={ci}
                    className={`w-3 h-3 rounded-[2px] ${bg} cursor-pointer`}
                    title={`${cell.date}: ${cell.amount > 0 ? formatRupiah(cell.amount) : 'Rp 0'}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-secondary)] transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-1.5 text-sm font-medium bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <h1
        className="text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-cream)] mb-6"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Grafik Keuangan {year}
      </h1>

      {/* Income vs Expense Trend */}
      <div className="surface-card p-4 sm:p-6 mb-4 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] animate-fade-in-up">
        <h3 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
          Tren Pemasukan vs Pengeluaran
        </h3>
        <div className="h-64">
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: 'Pemasukan',
                  data: monthlyData.map((d) => d.pemasukan),
                  borderColor: '#27AE60',
                  backgroundColor: '#27AE6020',
                  fill: true,
                  tension: 0.3,
                  borderWidth: 2,
                  pointRadius: 3,
                },
                {
                  label: 'Pengeluaran',
                  data: monthlyData.map((d) => d.pengeluaran),
                  borderColor: '#C0392B',
                  backgroundColor: '#C0392B20',
                  fill: true,
                  tension: 0.3,
                  borderWidth: 2,
                  pointRadius: 3,
                },
              ],
            }}
            options={chartOpts}
          />
        </div>
      </div>

      {/* Stacked bar by category */}
      <div className="surface-card p-4 sm:p-6 mb-4 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <h3 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
          Pengeluaran per Kategori (Bulanan)
        </h3>
        <div className="h-64">
          <Bar
            data={{
              labels,
              datasets: Object.entries(categoryMonthly)
                .filter(([, vals]) => vals.some((v) => v > 0))
                .map(([cat, vals]) => ({
                  label: cat,
                  data: vals,
                  backgroundColor: getCategoryColor(cat) + '90',
                  borderColor: getCategoryColor(cat),
                  borderWidth: 1,
                  borderRadius: 2,
                })),
            }}
            options={{ ...chartOpts, scales: { ...chartOpts.scales, x: { ...chartOpts.scales.x, stacked: true }, y: { ...chartOpts.scales.y, stacked: true } } }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Net savings trend */}
        <div className="surface-card p-4 sm:p-6 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <h3 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
            Tren Tabungan Kumulatif
          </h3>
          <div className="h-48">
            <Line
              data={{
                labels,
                datasets: [{
                  label: 'Tabungan',
                  data: savingsTrend,
                  borderColor: '#2D4A3E',
                  backgroundColor: '#8FAF9F30',
                  fill: true,
                  tension: 0.3,
                  borderWidth: 2,
                  pointRadius: 3,
                }],
              }}
              options={chartOpts}
            />
          </div>
        </div>

        {/* Spending Heatmap */}
        <div className="surface-card p-4 sm:p-6 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <h3 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
            Intensitas Pengeluaran Harian
          </h3>
          {renderHeatmap()}
          <div className="flex items-center gap-2 mt-3 text-xs text-[var(--color-muted)]">
            <span>Rendah</span>
            <div className="flex gap-[2px]">
              <div className="w-3 h-3 rounded-[2px] bg-[var(--color-cream-dark)] dark:bg-[var(--color-dark-surface-elevated)]" />
              <div className="w-3 h-3 rounded-[2px] bg-[var(--color-accent)]/50" />
              <div className="w-3 h-3 rounded-[2px] bg-yellow-400" />
              <div className="w-3 h-3 rounded-[2px] bg-orange-400" />
              <div className="w-3 h-3 rounded-[2px] bg-[var(--color-danger)]" />
            </div>
            <span>Tinggi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
