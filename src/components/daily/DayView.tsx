import { useState, useEffect } from 'react';
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
        if (!isIncomeCategory(tx.kategori)) onUpdate(tx.id, 'kategori', categories.income[0]);
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
        if (isIncomeCategory(tx.kategori)) onUpdate(tx.id, 'kategori', categories.expense[0]);
      }
    }
    setFocusedField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && field === 'pengeluaran' && isLast) {
      e.preventDefault();
      onAddRow();
    }
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] hover:bg-[var(--color-cream-dark)]/50 dark:hover:bg-[var(--color-dark-surface-elevated)]/50 group">
      <td className="py-2 px-2 text-center w-8">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button {...attributes} {...listeners} className="cursor-grab text-[var(--color-muted)] hover:text-[var(--color-primary)] touch-none">
            <GripVertical size={14} />
          </button>
        </div>
      </td>

      <td className="py-2 px-2">
        <input
          type="text"
          value={localKeterangan}
          onChange={(e) => setLocalKeterangan(e.target.value)}
          onBlur={handleBlurKeterangan}
          onFocus={() => setFocusedField('keterangan')}
          onKeyDown={(e) => handleKeyDown(e, 'keterangan')}
          placeholder="Keterangan..."
          className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent focus:bg-[var(--color-surface)] dark:focus:bg-[var(--color-dark-surface)] focus:border-[var(--color-border)] rounded text-[var(--color-text)] dark:text-[var(--color-dark-text)] placeholder:text-[var(--color-muted)]/40 outline-none transition-colors"
        />
      </td>

      <td className="py-2 px-2">
        <select
          value={tx.kategori}
          onChange={(e) => onUpdate(tx.id, 'kategori', e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent focus:bg-[var(--color-surface)] dark:focus:bg-[var(--color-dark-surface)] focus:border-[var(--color-border)] rounded text-[var(--color-text)] dark:text-[var(--color-dark-text)] outline-none appearance-none cursor-pointer transition-colors"
        >
          <optgroup label="Pemasukan">
            {categories.income.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="Pengeluaran">
            {categories.expense.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>
      </td>

      <td className="py-2 px-2">
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
          className="w-full px-2 py-1.5 text-sm text-right bg-transparent border border-transparent focus:bg-[var(--color-surface)] dark:focus:bg-[var(--color-dark-surface)] focus:border-[var(--color-border)] rounded font-mono-number text-[var(--color-positive)] dark:text-[var(--color-dark-text)] placeholder:text-[var(--color-muted)]/30 outline-none transition-colors"
        />
      </td>

      <td className="py-2 px-2">
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
          className="w-full px-2 py-1.5 text-sm text-right bg-transparent border border-transparent focus:bg-[var(--color-surface)] dark:focus:bg-[var(--color-dark-surface)] focus:border-[var(--color-border)] rounded font-mono-number text-[var(--color-danger)] placeholder:text-[var(--color-muted)]/30 outline-none transition-colors"
        />
      </td>

      <td className="py-2 px-2 text-center w-10">
        <button
          onClick={() => onDelete(tx.id)}
          className="p-1 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-danger)] transition-all rounded"
          tabIndex={-1}
        >
          <Trash2 size={14} strokeWidth={1.5} />
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

  const categories = getAllCategories(settings.custom_income_categories, settings.custom_expense_categories);

  useEffect(() => { loadTransactionsByDate(date); }, [date]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === '/') { e.preventDefault(); handleAddRow(); }
      if (e.key === 'ArrowLeft') { const d = new Date(dateObj); d.setDate(d.getDate() - 1); navigate(`/day/${toISODate(d)}`); }
      if (e.key === 'ArrowRight') { const d = new Date(dateObj); d.setDate(d.getDate() + 1); navigate(`/day/${toISODate(d)}`); }
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
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('table tbody tr:last-child input[type="text"]');
      if (inputs.length > 0) inputs[0].focus();
    }, 100);
  };

  const summary = getDailySummary(date);
  const [dailyNote, setDailyNote] = useState('');
  
  const prevDate = new Date(dateObj); prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(dateObj); nextDate.setDate(nextDate.getDate() + 1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20">
      {/* Detailed Header - Minimal */}
      <div className="flex items-center justify-between mb-10 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] pb-4">
        <button
          onClick={() => navigate(`/month/${yearMonth}`)}
          className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] dark:hover:text-[var(--color-dark-text)] uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(`/day/${toISODate(prevDate)}`)} className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl sm:text-2xl text-[var(--color-primary)] dark:text-[var(--color-cream)]" style={{ fontFamily: 'var(--font-serif)' }}>
            {formatDateIndonesian(dateObj)}
          </h1>
          <button onClick={() => navigate(`/day/${toISODate(nextDate)}`)} className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Spreadsheet Journal */}
      <div className="mb-16">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
              <th className="py-3 px-2 text-center text-[9px] uppercase tracking-widest text-[var(--color-muted)] font-medium w-8"></th>
              <th className="py-3 px-2 text-left text-[9px] uppercase tracking-widest text-[var(--color-muted)] font-medium">Keterangan</th>
              <th className="py-3 px-2 text-left text-[9px] uppercase tracking-widest text-[var(--color-muted)] font-medium w-40">Kategori</th>
              <th className="py-3 px-2 text-right text-[9px] uppercase tracking-widest text-[var(--color-muted)] font-medium w-32">Pemasukan</th>
              <th className="py-3 px-2 text-right text-[9px] uppercase tracking-widest text-[var(--color-muted)] font-medium w-32">Pengeluaran</th>
              <th className="py-3 px-2 text-center w-10"></th>
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
                    onUpdate={(id, f, v) => updateTransaction(id, { [f]: v })}
                    onDelete={async (id) => {
                      await deleteTransaction(id);
                      toast.undo('Transaksi dihapus', async () => { await restoreTransaction(id); await loadTransactionsByDate(date); });
                    }}
                    categories={categories}
                    isLast={idx === transactions.length - 1}
                    onAddRow={handleAddRow}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>

          <tbody>
            <tr className="border-b border-[var(--color-border)]/50 dark:border-[var(--color-dark-border)]/50">
              <td colSpan={6} className="py-3 px-2 text-left">
                <button
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] dark:hover:text-[var(--color-dark-text)] font-medium transition-colors"
                >
                  <Plus size={14} />
                  Tambah baris ( / )
                </button>
              </td>
            </tr>

            {/* Totals */}
            <tr>
              <td colSpan={3} className="py-4 px-2 text-right text-[10px] uppercase tracking-widest text-[var(--color-muted)]">Total</td>
              <td className="py-4 px-2 text-right font-mono-number text-sm text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(summary.pemasukan)}</td>
              <td className="py-4 px-2 text-right font-mono-number text-sm text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{formatRupiah(summary.pengeluaran)}</td>
              <td></td>
            </tr>
            <tr className="border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
              <td colSpan={3} className="py-4 px-2 text-right text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-bold">Saldo</td>
              <td colSpan={2} className={`py-4 px-2 text-right font-mono-number font-medium text-lg ${summary.saldo < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-primary)] dark:text-[var(--color-dark-text)]'}`}>
                {formatRupiah(summary.saldo)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="text-center py-20 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
            <p className="text-sm text-[var(--color-muted)] mb-4">Belum ada transaksi hari ini</p>
            <button
              onClick={handleAddRow}
              className="px-6 py-2 text-sm bg-[var(--color-primary)] text-[var(--color-cream)] hover:opacity-90 transition-opacity"
            >
              Mulai Jurnal
            </button>
          </div>
        )}
      </div>

      {/* Daily Notes */}
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[var(--color-muted)] font-medium block mb-3">
          Catatan Harian
        </label>
        <textarea
          value={dailyNote}
          onChange={(e) => setDailyNote(e.target.value)}
          placeholder="Tulis impresi atau catatan hari ini..."
          className="w-full text-sm bg-transparent border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)] resize-none h-16 focus:border-[var(--color-primary)] dark:focus:border-[var(--color-dark-text)] focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
