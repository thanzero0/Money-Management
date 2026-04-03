import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Upload, Download, Trash2, Plus, X } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { toast } from '../common/Toast';
import { formatRupiah, parseCurrencyInput } from '../../utils/currency';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../../types';
import * as db from '../../db/database';
import { exportToXLSX, importFromXLSX } from '../../utils/excelExport';
import { getTransactionCountByCategory } from '../../db/database';

export function SettingsView() {
  const navigate = useNavigate();
  const { settings, updateSettings, toggleTheme, setName, addCustomCategory, removeCustomCategory, setBudget } = useSettingsStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearDoubleConfirm, setShowClearDoubleConfirm] = useState(false);
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txs = await importFromXLSX(file);
      await db.importData({ transactions: txs });
      toast.success(`${txs.length} transaksi berhasil diimpor!`);
    } catch (err) {
      toast.error('Gagal mengimpor data.');
      console.error(err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportAll = async () => {
    try {
      const allTx = await db.getAllTransactions();
      const allMeta = await db.getAllMonthlyMeta();
      exportToXLSX({
        transactions: allTx,
        monthlyMetas: allMeta,
        userName: settings.name || 'Pengguna',
        options: { range: 'year', year: new Date().getFullYear() },
      });
      toast.success('Data berhasil diekspor!');
    } catch (err) {
      toast.error('Gagal mengekspor data.');
    }
  };

  const handleClearAll = async () => {
    try {
      await db.clearAllData();
      toast.success('Semua data berhasil dihapus.');
      setShowClearConfirm(false);
      setShowClearDoubleConfirm(false);
    } catch (err) {
      toast.error('Gagal menghapus data.');
    }
  };

  const handleDeleteCategory = async (type: 'income' | 'expense', cat: string) => {
    const count = await getTransactionCountByCategory(cat);
    if (count > 0) {
      toast.error(`Tidak bisa menghapus "${cat}" — masih digunakan oleh ${count} transaksi.`);
      return;
    }
    removeCustomCategory(type, cat);
    toast.success(`Kategori "${cat}" dihapus.`);
  };

  const allExpenseCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...settings.custom_expense_categories];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 hover:bg-[var(--color-cream-dark)] dark:hover:bg-[var(--color-dark-surface-elevated)] rounded-lg transition-colors"
        >
          <ArrowLeft size={18} className="text-[var(--color-muted)]" />
        </button>
        <h1
          className="text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-cream)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Pengaturan
        </h1>
      </div>

      <div className="space-y-6">
        {/* ─── Profil ─── */}
        <section className="surface-card p-5 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Profil</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[var(--color-accent)] rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)' }}>
                  {settings.name ? settings.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              <div className="flex-1">
                <label className="text-xs text-[var(--color-muted)] block mb-1">Nama tampilan</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
            </div>
            {settings.google_client_id && (
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">Google Client ID</label>
                <input
                  type="text"
                  value={settings.google_client_id}
                  onChange={(e) => updateSettings({ google_client_id: e.target.value })}
                  placeholder="Masukkan Google OAuth Client ID..."
                  className="w-full px-3 py-2 text-xs font-mono border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
                />
              </div>
            )}
          </div>
        </section>

        {/* ─── Preferensi ─── */}
        <section className="surface-card p-5 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Preferensi</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">Format angka</label>
                <select
                  value={settings.number_format}
                  onChange={(e) => updateSettings({ number_format: e.target.value as 'id' | 'en' })}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
                >
                  <option value="id">Rp 1.000.000</option>
                  <option value="en">IDR 1,000,000</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">Tahun aktif default</label>
                <select
                  value={settings.default_year}
                  onChange={(e) => updateSettings({ default_year: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
                >
                  {Array.from({ length: 10 }, (_, i) => 2020 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Targets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">Target tabungan / bulan</label>
                <input
                  type="number"
                  value={settings.target_tabungan || ''}
                  onChange={(e) => updateSettings({ target_tabungan: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] font-mono-number dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">Batas pengeluaran / bulan</label>
                <input
                  type="number"
                  value={settings.target_pengeluaran_max || ''}
                  onChange={(e) => updateSettings({ target_pengeluaran_max: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] font-mono-number dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Kategori Kustom ─── */}
        <section className="surface-card p-5 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Kategori Kustom</h2>

          {/* Income categories */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-[var(--color-positive)] mb-2">Pemasukan</h3>
            <div className="space-y-1 mb-2">
              {DEFAULT_INCOME_CATEGORIES.map((c) => (
                <div key={c} className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-cream)]/50 dark:bg-[var(--color-dark-surface-elevated)]/50 rounded text-sm text-[var(--color-text)] dark:text-[var(--color-dark-text)]">
                  <span>{c}</span>
                  <span className="text-[10px] text-[var(--color-muted)]">default</span>
                </div>
              ))}
              {settings.custom_income_categories.map((c) => (
                <div key={c} className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-cream)]/50 dark:bg-[var(--color-dark-surface-elevated)]/50 rounded text-sm">
                  <span className="text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{c}</span>
                  <button onClick={() => handleDeleteCategory('income', c)} className="text-[var(--color-muted)] hover:text-[var(--color-danger)]">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newIncomeCat}
                onChange={(e) => setNewIncomeCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newIncomeCat.trim()) {
                    addCustomCategory('income', newIncomeCat.trim());
                    setNewIncomeCat('');
                  }
                }}
                placeholder="Tambah kategori..."
                className="flex-1 px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (newIncomeCat.trim()) {
                    addCustomCategory('income', newIncomeCat.trim());
                    setNewIncomeCat('');
                  }
                }}
                disabled={!newIncomeCat.trim()}
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>

          {/* Expense categories */}
          <div>
            <h3 className="text-xs font-medium text-[var(--color-danger)] mb-2">Pengeluaran</h3>
            <div className="space-y-1 mb-2">
              {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                <div key={c} className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-cream)]/50 dark:bg-[var(--color-dark-surface-elevated)]/50 rounded text-sm text-[var(--color-text)] dark:text-[var(--color-dark-text)]">
                  <span>{c}</span>
                  <span className="text-[10px] text-[var(--color-muted)]">default</span>
                </div>
              ))}
              {settings.custom_expense_categories.map((c) => (
                <div key={c} className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-cream)]/50 dark:bg-[var(--color-dark-surface-elevated)]/50 rounded text-sm">
                  <span className="text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{c}</span>
                  <button onClick={() => handleDeleteCategory('expense', c)} className="text-[var(--color-muted)] hover:text-[var(--color-danger)]">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExpenseCat}
                onChange={(e) => setNewExpenseCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newExpenseCat.trim()) {
                    addCustomCategory('expense', newExpenseCat.trim());
                    setNewExpenseCat('');
                  }
                }}
                placeholder="Tambah kategori..."
                className="flex-1 px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)]"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (newExpenseCat.trim()) {
                    addCustomCategory('expense', newExpenseCat.trim());
                    setNewExpenseCat('');
                  }
                }}
                disabled={!newExpenseCat.trim()}
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Budget per Kategori ─── */}
        <section className="surface-card p-5 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Budget per Kategori</h2>
          <div className="space-y-2">
            {allExpenseCategories.map((cat) => {
              const budget = settings.budget_per_kategori[cat] || 0;
              const isEditing = editingBudget === cat;
              return (
                <div key={cat} className="flex items-center justify-between px-3 py-2 bg-[var(--color-cream)]/50 dark:bg-[var(--color-dark-surface-elevated)]/50 rounded">
                  <span className="text-sm text-[var(--color-text)] dark:text-[var(--color-dark-text)]">{cat}</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={budgetValue}
                      onChange={(e) => setBudgetValue(e.target.value)}
                      onBlur={() => {
                        setBudget(cat, Number(budgetValue) || 0);
                        setEditingBudget(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setBudget(cat, Number(budgetValue) || 0);
                          setEditingBudget(null);
                        }
                      }}
                      className="w-28 px-2 py-1 text-sm text-right border border-[var(--color-accent)] rounded font-mono-number bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:text-[var(--color-dark-text)]"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingBudget(cat);
                        setBudgetValue(budget > 0 ? budget.toString() : '');
                      }}
                      className="text-sm font-mono-number text-[var(--color-muted)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-dark-text)]"
                    >
                      {budget > 0 ? formatRupiah(budget) : 'Belum diatur'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Data & Sync ─── */}
        <section className="surface-card p-5 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Data & Sinkronisasi</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--color-muted)] block mb-1">Google OAuth Client ID</label>
              <input
                type="text"
                value={settings.google_client_id}
                onChange={(e) => updateSettings({ google_client_id: e.target.value })}
                placeholder="Masukkan Client ID untuk sinkronisasi Google Sheets..."
                className="w-full px-3 py-2 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)] dark:text-[var(--color-dark-text)] font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-cream)] dark:border-[var(--color-dark-border)] dark:hover:bg-[var(--color-dark-surface-elevated)] transition-colors text-[var(--color-text)] dark:text-[var(--color-dark-text)]"
              >
                <Upload size={16} />
                Impor dari .xlsx
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />

              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-cream)] dark:border-[var(--color-dark-border)] dark:hover:bg-[var(--color-dark-surface-elevated)] transition-colors text-[var(--color-text)] dark:text-[var(--color-dark-text)]"
              >
                <Download size={16} />
                Ekspor semua data
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--color-danger)]/30 text-[var(--color-danger)] rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                Hapus semua data
              </button>
            </div>
          </div>
        </section>

        {/* ─── Tampilan ─── */}
        <section className="surface-card p-5 dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Tampilan</h2>
          <div className="space-y-4">
            {/* Theme toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Mode Gelap</p>
                <p className="text-xs text-[var(--color-muted)]">Ganti tampilan terang/gelap</p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform flex items-center justify-center ${
                    settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                >
                  {settings.theme === 'dark' ? <Moon size={12} className="text-[var(--color-primary)]" /> : <Sun size={12} className="text-yellow-500" />}
                </div>
              </button>
            </div>

            {/* Font size  */}
            <div>
              <p className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-dark-text)] mb-2">Ukuran font</p>
              <div className="flex gap-2">
                {(['compact', 'normal', 'comfortable'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSettings({ font_size: size })}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      settings.font_size === size
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] dark:border-[var(--color-dark-border)]'
                    }`}
                  >
                    {size === 'compact' ? 'Kompak' : size === 'normal' ? 'Normal' : 'Nyaman'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Clear data confirmation modals */}
      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Hapus Semua Data?" size="sm">
        <p className="text-sm text-[var(--color-text)] dark:text-[var(--color-dark-text)] mb-4">
          Tindakan ini akan menghapus <strong>semua transaksi, catatan, dan estimasi</strong>. Pengaturan profil akan tetap tersimpan.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>Batal</Button>
          <Button variant="danger" onClick={() => { setShowClearConfirm(false); setShowClearDoubleConfirm(true); }}>
            Ya, Lanjutkan
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showClearDoubleConfirm} onClose={() => setShowClearDoubleConfirm(false)} title="Konfirmasi Terakhir" size="sm">
        <p className="text-sm text-[var(--color-danger)] font-medium mb-4">
          Apakah kamu benar-benar yakin? Data yang dihapus tidak bisa dikembalikan.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowClearDoubleConfirm(false)}>Batal</Button>
          <Button variant="danger" onClick={handleClearAll}>
            Hapus Permanen
          </Button>
        </div>
      </Modal>
    </div>
  );
}
