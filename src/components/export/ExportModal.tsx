import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { toast } from '../common/Toast';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { exportToXLSX } from '../../utils/excelExport';
import { MONTH_NAMES_ID } from '../../types';
import type { ExportOptions, ExportRange } from '../../types';
import * as db from '../../db/database';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const now = new Date();
  const { settings } = useSettingsStore();
  const [range, setRange] = useState<ExportRange>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [fromMonth, setFromMonth] = useState(`${now.getFullYear()}-01`);
  const [toMonth, setToMonth] = useState(`${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allTransactions = await db.getAllTransactions();
      const allMeta = await db.getAllMonthlyMeta();

      const options: ExportOptions = {
        range,
        year,
        month,
        from_month: fromMonth,
        to_month: toMonth,
      };

      exportToXLSX({
        transactions: allTransactions,
        monthlyMetas: allMeta,
        userName: settings.name || 'Pengguna',
        options,
      });

      toast.success('File berhasil diekspor!');
      onClose();
    } catch (err) {
      toast.error('Gagal mengekspor data.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ekspor Data" size="md">
      <div className="space-y-4">
        {/* Range selection */}
        <div className="space-y-2">
          {[
            { value: 'month' as ExportRange, label: `Bulan ini (${MONTH_NAMES_ID[now.getMonth()]} ${now.getFullYear()})` },
            { value: 'quarter' as ExportRange, label: `Kuartal ini (Q${currentQuarter} ${now.getFullYear()})` },
            { value: 'year' as ExportRange, label: `Tahun ini (${now.getFullYear()})` },
            { value: 'custom' as ExportRange, label: 'Rentang kustom' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                range === opt.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border)] hover:border-[var(--color-accent)] dark:border-[var(--color-dark-border)]'
              }`}
            >
              <input
                type="radio"
                name="exportRange"
                value={opt.value}
                checked={range === opt.value}
                onChange={(e) => setRange(e.target.value as ExportRange)}
                className="accent-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{opt.label}</span>
            </label>
          ))}
        </div>

        {/* Custom range inputs */}
        {range === 'custom' && (
          <div className="flex items-center gap-3 pl-8">
            <input
              type="month"
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
            />
            <span className="text-sm text-[var(--color-muted)]">s/d</span>
            <input
              type="month"
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
            />
          </div>
        )}

        {/* Format note */}
        <div className="text-xs text-[var(--color-muted)] px-1">
          Format: .xlsx — sesuai format Keuangan standar
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Batalkan
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Mengekspor...' : 'Ekspor'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
