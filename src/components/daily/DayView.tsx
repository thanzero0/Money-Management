import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatRupiah, parseCurrencyInput } from '../../utils/currency';
import { formatDateIndonesian, parseISODate, toISODate } from '../../utils/date';
import { toast } from '../common/Toast';
import { getAllCategories, isIncomeCategory } from '../../utils/parser';
import type { Transaction } from '../../types';

// ─── Sortable Row ─────────────────────────────────────────
function SortableRow({
  tx,
  index,
  onUpdate,
  onDelete,
  categories,
  isLast,
  onAddRow,
}: {
  tx: Transaction;
  index: number;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
  categories: { income: string[]; expense: string[] };
  isLast: boolean;
  onAddRow: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tx.id });
  const [localKeterangan, setLocalKeterangan] = useState(tx.keterangan);
  const [localPemasukan, setLocalPemasukan] = useState(tx.pemasukan > 0 ? tx.pemasukan.toString() : '');
  const [localPengeluaran, setLocalPengeluaran] = useState(tx.pengeluaran > 0 ? tx.pengeluaran.toString() : '');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const allCategories = [...categories.income, ...categories.expense];
  const isIncome = isIncomeCategory(tx.kategori, categories.income.filter(c => ![...['Uang Saku / Jajan', 'Stipend PKL', 'Freelance / Project', 'Lain-lain (Pemasukan)']].includes(c)));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const handleBlurKeterangan = () => {
    if (localKeterangan !== tx.keterangan) onUpdate(tx.id, 'keterangan', localKeterangan);
    setFocusedField(null);
  };

  const handleBlurPemasukan = () => {
    const val = parseCurrencyInput(localPemasukan);
    if (val !== tx.pemasukan) {
      onUpdate(tx.id, 'pemasukan', val);
      if (val > 0) {
        onUpdate(tx.id, 'pengeluaran', 0);
        setLocalPengeluaran('');
        // Auto-select income category if expense category is selected
        if (!isIncomeCategory(tx.kategori)) {
          onUpdate(tx.id, 'kategori', categories.income[0]);
        }
      }
    }
    setFocusedField(null);
  };

  const handleBlurPengeluaran = () => {
    const val = parseCurrencyInput(localPengeluaran);
    if (val !== tx.pengeluaran) {
      onUpdate(tx.id, 'pengeluaran', val);
      if (val > 0) {
        onUpdate(tx.id, 'pemasukan', 0);
        setLocalPemasukan('');
        if (isIncomeCategory(tx.kategori)) {
          onUpdate(tx.id, 'kategori', categories.expense[0]);
        }
      }
    }
    setFocusedField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      // Let Tab naturally move to next input
      if (e.key === 'Enter' && field === 'pengeluaran' && isLast) {
        e.preventDefault();
        onAddRow();
      }
    }
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-[var(--color-border)]/40 dark:border-[var(--color-dark-border)]/40 hover:bg-[var(--color-cream)]/30 dark:hover:bg-[var(--color-dark-surface-elevated)]/30">
      {/* Drag handle + index */}
      <td className="py-1.5 px-2 text-center w-12">
        <div className="flex items-center gap-1">
          <button {...attributes} {...listeners} className="cursor-grab text-[var(--color-muted)] hover:text-[var(--color-secondary)] touch-none">
            <GripVertical size={14} />
          </button>
          <span className="text-xs text-[var(--color-muted)] font-mono-number">{index + 1}</span>
        </div>
      </td>

      {/* Keterangan */}
      <td className="py-1.5 px-2">
        <input
          type="text"
          value={localKeterangan}
          onChange={(e) => setLocalKeterangan(e.target.value)}
          onBlur={handleBlurKeterangan}
          onFocus={() => setFocusedField('keterangan')}
          onKeyDown={(e) => handleKeyDown(e, 'keterangan')}
          placeholder="Keterangan..."
          className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:bg-[var(--color-surface)] dark:focus:bg-[var(--color-dark-surface)] focus:border focus:border-[var(--color-accent)] rounded text-[var(--color-text)] dark:text-[var(--color-dark-text)] placeholder:text-[var(--color-muted)]/50 outline-none"
        />
      </td>

      {/* Kategori */}
      <td className="py-1.5 px-2">
        <select
          value={tx.kategori}
          onChange={(e) => onUpdate(tx.id, 'kategori', e.target.value)}
          className="w-full px-2 py-1 text-sm bg-transparent border-0 focus:bg-[var(--color-surface)] dark:focus:bg-[var(--color-dark-surface)] focus:border focus:border-[var(--color-accent)] rounded text-[var(--color-text)] dark:text-[var(--color-dark-text)] outline-none appearance-none cursor-pointer"
        >
          <optgroup label="Pemasukan">
            {categories.income.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="Pengeluaran">
            {categories.expense.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>
      </td>

      {/* Pemasukan */}
      <td className="py-1.5 px-2">
        <input
          type={focusedField === 'pemasukan' ? 'number' : 'text'}
          value={focusedField === 'pemasukan' ? localPemasukan : (tx.pemasukan > 0 ? formatRupiah(tx.pemasukan) : '')}
          onChange={(e) => setLocalPemasukan(e.target.value)}
          onFocus={() => {
            setFocusedField('pemasukan');
            setLocalPemasukan(tx.pemasukan > 0 ? tx.pemasukan.toString() : '');
          }}
          onBlur={handleBlurPemasukan}
          onKeyDown={(e) => handleKeyDown(e, 'pemasukan')}
          placeholder="—"
          className="w-full px-2 py-1 text-sm text-right bg-transparent border-0 focus:bg-[var(--color-surface)] dark:focus:bg-[var(--color-dark-surface)] focus:border focus:border-[var(--color-accent)] rounded font-mono-number text-[var(--color-positive)] placeholder:text-[var(--color-muted)]/30 outline-none"
        />
      </td>

      {/* Pengeluaran */}
      <td className="py-1.5 px-2">
        <input
          type={focusedField === 'pengeluaran' ? 'number' : 'text'}
          value={focusedField === 'pengeluaran' ? localPengeluaran : (tx.pengeluaran > 0 ? formatRupiah(tx.pengeluaran) : '')}
          onChange={(e) => setLocalPengeluaran(e.target.value)}
          onFocus={() => {
            setFocusedField('pengeluaran');
            setLocalPengeluaran(tx.pengeluaran > 0 ? tx.pengeluaran.toString() : '');
          }}
          onBlur={handleBlurPengeluaran}
          onKeyDown={(e) => handleKeyDown(e, 'pengeluaran')}
          placeholder="—"
          className="w-full px-2 py-1 text-sm text-right bg-transparent border-0 focus:bg-[var(--color-surface)] dark:focus:bg-[var(--color-dark-surface)] focus:border focus:border-[var(--color-accent)] rounded font-mono-number text-[var(--color-danger)] placeholder:text-[var(--color-muted)]/30 outline-none"
        />
      </td>

      {/* Delete */}
      <td className="py-1.5 px-2 text-center w-10">
        <button
          onClick={() => onDelete(tx.id)}
          className="p-1 text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors rounded"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

// ─── Main Daily View ──────────────────────────────────────
export function DayView() {
  const { date: dateParam } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const {
    transactions,
    loadTransactionsByDate,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreTransaction,
    reorderTransactions,
    getDailySummary,
  } = useTransactionStore();

  const date = dateParam || toISODate(new Date());
  const dateObj = parseISODate(date);
  const yearMonth = date.substring(0, 7);

  const categories = getAllCategories(
    settings.custom_income_categories,
    settings.custom_expense_categories
  );

  useEffect(() => {
    loadTransactionsByDate(date);
  }, [date]);

  // "/"" shortcut to add row
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === '/') {
        e.preventDefault();
        handleAddRow();
      }
      if (e.key === 'ArrowLeft') {
        const prev = new Date(dateObj);
        prev.setDate(prev.getDate() - 1);
        navigate(`/day/${toISODate(prev)}`);
      }
      if (e.key === 'ArrowRight') {
        const next = new Date(dateObj);
        next.setDate(next.getDate() + 1);
        navigate(`/day/${toISODate(next)}`);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [date]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = transactions.findIndex((t) => t.id === active.id);
      const newIndex = transactions.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(transactions, oldIndex, newIndex);
      await reorderTransactions(date, newOrder.map((t) => t.id));
    }
  };

  const handleAddRow = async () => {
    await addTransaction({
      date,
      keterangan: '',
      kategori: categories.expense[0],
      pemasukan: 0,
      pengeluaran: 0,
    });
    await loadTransactionsByDate(date);
    // Focus the new row's keterangan input after render
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('table tbody tr:last-child input[type="text"]');
      if (inputs.length > 0) inputs[0].focus();
    }, 100);
  };

  const handleUpdate = async (id: string, field: string, value: any) => {
    await updateTransaction(id, { [field]: value });
  };

  const handleDelete = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    await deleteTransaction(id);
    toast.undo(
      `Transaksi "${tx?.keterangan || 'item'}" dihapus`,
      async () => {
        await restoreTransaction(id);
        await loadTransactionsByDate(date);
      }
    );
  };

  const summary = getDailySummary(date);

  // Navigation dates
  const prevDate = new Date(dateObj);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(dateObj);
  nextDate.setDate(nextDate.getDate() + 1);

  const [dailyNote, setDailyNote] = useState('');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(`/month/${yearMonth}`)}
          className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-secondary)] transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke {yearMonth}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/day/${toISODate(prevDate)}`)}
            className="p-1.5 hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
          >
            <ArrowLeft size={16} className="text-[var(--color-muted)]" />
          </button>
          <span className="text-sm text-[var(--color-muted)]">
            {dateObj.getDate()} {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][dateObj.getMonth()]}
          </span>
          <button
            onClick={() => navigate(`/day/${toISODate(nextDate)}`)}
            className="p-1.5 hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
          >
            <ArrowRight size={16} className="text-[var(--color-muted)]" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h1
        className="text-xl sm:text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-cream)] mb-1"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Jurnal Harian
      </h1>
      <p className="text-sm text-[var(--color-muted)] mb-5">
        {formatDateIndonesian(dateObj)}
      </p>

      {/* Daily Summary Bar */}
      <div className="sticky top-14 z-20 surface-card p-3 mb-4 flex flex-wrap items-center justify-between gap-3 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <div>
            <span className="text-xs text-[var(--color-muted)]">Pemasukan </span>
            <span className="font-semibold text-[var(--color-positive)] font-mono-number">{formatRupiah(summary.pemasukan)}</span>
          </div>
          <div>
            <span className="text-xs text-[var(--color-muted)]">Pengeluaran </span>
            <span className="font-semibold text-[var(--color-danger)] font-mono-number">{formatRupiah(summary.pengeluaran)}</span>
          </div>
          <div>
            <span className="text-xs text-[var(--color-muted)]">Saldo </span>
            <span className={`font-semibold font-mono-number ${summary.saldo >= 0 ? 'text-[var(--color-primary)] dark:text-[var(--color-accent)]' : 'text-[var(--color-danger)]'}`}>
              {formatRupiah(summary.saldo)}
            </span>
          </div>
        </div>
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
        >
          <Plus size={14} />
          Tambah baris
        </button>
      </div>

      {/* Transaction Table */}
      <div className="surface-card overflow-x-auto dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] animate-fade-in-up">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-primary)] text-white">
              <th className="py-2 px-2 text-center text-xs font-medium w-12">#</th>
              <th className="py-2 px-2 text-left text-xs font-medium">Keterangan</th>
              <th className="py-2 px-2 text-left text-xs font-medium w-40">Kategori</th>
              <th className="py-2 px-2 text-right text-xs font-medium w-32">Pemasukan</th>
              <th className="py-2 px-2 text-right text-xs font-medium w-32">Pengeluaran</th>
              <th className="py-2 px-2 text-center text-xs font-medium w-10">Aksi</th>
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={transactions.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {transactions.map((tx, idx) => (
                  <SortableRow
                    key={tx.id}
                    tx={tx}
                    index={idx}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    categories={categories}
                    isLast={idx === transactions.length - 1}
                    onAddRow={handleAddRow}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>

          {/* Add row button */}
          <tbody>
            <tr className="border-b border-[var(--color-border)]/40 dark:border-[var(--color-dark-border)]/40">
              <td colSpan={6} className="py-2 px-2 text-center">
                <button
                  onClick={handleAddRow}
                  className="text-xs text-[var(--color-accent)] hover:text-[var(--color-primary)] font-medium transition-colors"
                >
                  + Tambah baris
                </button>
              </td>
            </tr>

            {/* Totals */}
            <tr className="bg-[var(--color-cream)]/50 dark:bg-[var(--color-dark-surface-elevated)]/50 font-semibold">
              <td colSpan={3} className="py-2 px-2 text-right text-xs text-[var(--color-muted)] uppercase">Total</td>
              <td className="py-2 px-2 text-right font-mono-number text-[var(--color-positive)]">{formatRupiah(summary.pemasukan)}</td>
              <td className="py-2 px-2 text-right font-mono-number text-[var(--color-danger)]">{formatRupiah(summary.pengeluaran)}</td>
              <td></td>
            </tr>
            <tr className="bg-[var(--color-cream)]/50 dark:bg-[var(--color-dark-surface-elevated)]/50 font-bold">
              <td colSpan={3} className="py-2 px-2 text-right text-xs text-[var(--color-muted)] uppercase">Saldo</td>
              <td colSpan={2} className={`py-2 px-2 text-right font-mono-number ${summary.saldo >= 0 ? 'text-[var(--color-primary)] dark:text-[var(--color-accent)]' : 'text-[var(--color-danger)]'}`}>
                {formatRupiah(summary.saldo)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--color-muted)] mb-3">Belum ada transaksi hari ini</p>
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors"
          >
            <Plus size={16} />
            Tambah transaksi pertama
          </button>
          <p className="text-xs text-[var(--color-muted)] mt-3">
            Tekan <kbd className="px-1.5 py-0.5 bg-[var(--color-cream-dark)] dark:bg-[var(--color-dark-surface-elevated)] rounded text-[var(--color-secondary)] dark:text-[var(--color-dark-text)] font-mono-number">/</kbd> untuk menambah baris baru
          </p>
        </div>
      )}

      {/* Daily Notes */}
      <div className="mt-6 surface-card p-4 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
        <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide block mb-2">
          Catatan Harian
        </label>
        <textarea
          value={dailyNote}
          onChange={(e) => setDailyNote(e.target.value)}
          placeholder="Tulis catatan untuk hari ini..."
          className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)] resize-none h-20 focus:border-[var(--color-accent)] focus:outline-none"
        />
      </div>
    </div>
  );
}
