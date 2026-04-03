import { useState, useRef, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { toast } from '../common/Toast';
import { parseQuickEntry, getAllCategories } from '../../utils/parser';
import { formatRupiah } from '../../utils/currency';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { toISODate } from '../../utils/date';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickEntryModal({ isOpen, onClose }: QuickEntryModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseQuickEntry> | null>(null);
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editKategori, setEditKategori] = useState('');
  const [editPemasukan, setEditPemasukan] = useState(0);
  const [editPengeluaran, setEditPengeluaran] = useState(0);
  const { addTransaction, loadTransactionsByDate } = useTransactionStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setParsed(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleParse = () => {
    if (!input.trim()) return;
    const result = parseQuickEntry(input);
    setParsed(result);
    setEditKeterangan(result.keterangan);
    setEditKategori(result.kategori);
    setEditPemasukan(result.pemasukan);
    setEditPengeluaran(result.pengeluaran);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (parsed) {
        handleSave();
      } else {
        handleParse();
      }
    }
  };

  const handleSave = async () => {
    const today = toISODate(new Date());
    await addTransaction({
      date: today,
      keterangan: editKeterangan,
      kategori: editKategori,
      pemasukan: editPemasukan,
      pengeluaran: editPengeluaran,
    });
    await loadTransactionsByDate(today);
    toast.success('Transaksi berhasil ditambahkan!');
    setInput('');
    setParsed(null);
    onClose();
  };

  const categories = getAllCategories(
    settings.custom_income_categories,
    settings.custom_expense_categories
  );
  const allCategories = [...categories.income, ...categories.expense];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Cepat" size="md">
      <div className="space-y-4">
        {/* Input */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-[var(--color-accent)]" />
            <span className="text-xs text-[var(--color-muted)]">
              Ketik dalam bahasa alami, misal: "Makan siang warteg 15rb"
            </span>
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setParsed(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder='Contoh: "Bayar gym 150000" atau "Gaji PKL 2jt"'
              className="flex-1 px-3 py-2.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <Button onClick={handleParse} size="md" disabled={!input.trim()}>
              Parse
            </Button>
          </div>
        </div>

        {/* Parsed result */}
        {parsed && (
          <div className="space-y-3 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-cream)]/50 dark:bg-[var(--color-dark-surface-elevated)] dark:border-[var(--color-dark-border)] animate-fade-in-up">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">Hasil Deteksi</span>
              <span className="text-xs text-[var(--color-muted)]">
                Akurasi: {Math.round(parsed.confidence * 100)}%
              </span>
            </div>

            {/* Keterangan */}
            <div>
              <label className="text-xs text-[var(--color-muted)] mb-1 block">Keterangan</label>
              <input
                type="text"
                value={editKeterangan}
                onChange={(e) => setEditKeterangan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="text-xs text-[var(--color-muted)] mb-1 block">Kategori</label>
              <select
                value={editKategori}
                onChange={(e) => setEditKategori(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
              >
                <optgroup label="Pemasukan">
                  {categories.income.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                <optgroup label="Pengeluaran">
                  {categories.expense.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--color-positive)] mb-1 block">Pemasukan</label>
                <input
                  type="number"
                  value={editPemasukan || ''}
                  onChange={(e) => {
                    setEditPemasukan(Number(e.target.value));
                    if (Number(e.target.value) > 0) setEditPengeluaran(0);
                  }}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] font-mono-number dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-danger)] mb-1 block">Pengeluaran</label>
                <input
                  type="number"
                  value={editPengeluaran || ''}
                  onChange={(e) => {
                    setEditPengeluaran(Number(e.target.value));
                    if (Number(e.target.value) > 0) setEditPemasukan(0);
                  }}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] font-mono-number dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="text-sm text-[var(--color-text)] dark:text-[var(--color-dark-text)] pt-1">
              {editPemasukan > 0 && (
                <span className="text-[var(--color-positive)] font-mono-number font-medium">
                  + {formatRupiah(editPemasukan)}
                </span>
              )}
              {editPengeluaran > 0 && (
                <span className="text-[var(--color-danger)] font-mono-number font-medium">
                  - {formatRupiah(editPengeluaran)}
                </span>
              )}
            </div>

            {/* Save */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setParsed(null)}>
                Ubah
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check size={14} />
                Simpan
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
