import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import type { Transaction } from '../../types';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../types';
import { getCategoryColor } from '../../utils/categories';
import { formatRupiah } from '../../utils/currency';
import { getWeekOfMonth, parseISODate, getDaysInMonth } from '../../utils/date';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

interface SpendingChartsProps {
  yearMonth: string;
  transactions: Transaction[];
}

export function SpendingCharts({ yearMonth, transactions }: SpendingChartsProps) {
  const txs = useMemo(
    () => transactions.filter((t) => t.date.startsWith(yearMonth) && !t.deleted_at),
    [transactions, yearMonth]
  );

  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1;
  const daysInMonth = getDaysInMonth(year, month);

  // Category spending for donut
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const tx of txs) {
      if (tx.pengeluaran > 0) {
        totals[tx.kategori] = (totals[tx.kategori] || 0) + tx.pengeluaran;
      }
    }
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(([k]) => k),
      data: entries.map(([, v]) => v),
      colors: entries.map(([k]) => getCategoryColor(k)),
    };
  }, [txs]);

  // Weekly income vs expense for bar chart
  const weeklyData = useMemo(() => {
    const weeks: Record<number, { pemasukan: number; pengeluaran: number }> = {};
    for (let w = 1; w <= 5; w++) weeks[w] = { pemasukan: 0, pengeluaran: 0 };
    for (const tx of txs) {
      const w = getWeekOfMonth(parseISODate(tx.date));
      if (weeks[w]) {
        weeks[w].pemasukan += tx.pemasukan || 0;
        weeks[w].pengeluaran += tx.pengeluaran || 0;
      }
    }
    const labels = Object.keys(weeks).map((w) => `Minggu ${w}`);
    return {
      labels,
      pemasukan: Object.values(weeks).map((w) => w.pemasukan),
      pengeluaran: Object.values(weeks).map((w) => w.pengeluaran),
    };
  }, [txs]);

  // Daily running balance for line chart
  const dailyBalance = useMemo(() => {
    const balances: number[] = [];
    const labels: string[] = [];
    let running = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yearMonth}-${d.toString().padStart(2, '0')}`;
      const dayTxs = txs.filter((t) => t.date === dateStr);
      for (const tx of dayTxs) {
        running += (tx.pemasukan || 0) - (tx.pengeluaran || 0);
      }
      balances.push(running);
      labels.push(d.toString());
    }
    return { labels, data: balances };
  }, [txs, yearMonth, daysInMonth]);

  if (txs.length === 0) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#2D4A3E',
        titleFont: { family: 'DM Sans' },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${formatRupiah(ctx.raw)}`,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Donut: spending by category */}
      {categoryData.data.length > 0 && (
        <div className="surface-card p-4 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
            Pengeluaran per Kategori
          </h4>
          <div className="h-48 flex items-center justify-center">
            <Doughnut
              data={{
                labels: categoryData.labels,
                datasets: [{
                  data: categoryData.data,
                  backgroundColor: categoryData.colors,
                  borderWidth: 2,
                  borderColor: 'var(--color-surface)',
                }],
              }}
              options={{
                ...chartOptions,
                cutout: '65%',
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
              }}
            />
          </div>
          <div className="mt-3 space-y-1.5">
            {categoryData.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryData.colors[i] }} />
                  <span className="text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{label}</span>
                </div>
                <span className="font-mono-number text-[var(--color-muted)]">{formatRupiah(categoryData.data[i])}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bar: weekly income vs expense */}
      <div className="surface-card p-4 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
        <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
          Pemasukan vs Pengeluaran per Minggu
        </h4>
        <div className="h-48">
          <Bar
            data={{
              labels: weeklyData.labels,
              datasets: [
                {
                  label: 'Pemasukan',
                  data: weeklyData.pemasukan,
                  backgroundColor: '#27AE6080',
                  borderColor: '#27AE60',
                  borderWidth: 1,
                  borderRadius: 4,
                },
                {
                  label: 'Pengeluaran',
                  data: weeklyData.pengeluaran,
                  backgroundColor: '#C0392B80',
                  borderColor: '#C0392B',
                  borderWidth: 1,
                  borderRadius: 4,
                },
              ],
            }}
            options={{
              ...chartOptions,
              scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 } } },
                y: { grid: { color: '#E0D8CC40' }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, callback: (v: any) => formatRupiah(v, false) } },
              },
              plugins: {
                ...chartOptions.plugins,
                legend: { display: true, position: 'top' as const, labels: { font: { family: 'DM Sans', size: 11 }, boxWidth: 8, boxHeight: 8, usePointStyle: true } },
              },
            }}
          />
        </div>
      </div>

      {/* Line: daily running balance */}
      <div className="surface-card p-4 md:col-span-2 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
        <h4 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
          Saldo Harian
        </h4>
        <div className="h-40">
          <Line
            data={{
              labels: dailyBalance.labels,
              datasets: [{
                data: dailyBalance.data,
                borderColor: '#2D4A3E',
                backgroundColor: '#8FAF9F30',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHitRadius: 10,
              }],
            }}
            options={{
              ...chartOptions,
              scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 10 }, maxTicksLimit: 10 } },
                y: { grid: { color: '#E0D8CC40' }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, callback: (v: any) => formatRupiah(v, false) } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
