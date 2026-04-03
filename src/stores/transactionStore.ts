/**
 * Zustand store for transactions
 */
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, MonthlyMeta, BudgetAlert } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES } from '../types';
import * as db from '../db/database';
import { useSettingsStore } from './settingsStore';

interface TransactionState {
  transactions: Transaction[];
  monthlyMeta: Record<string, MonthlyMeta>;
  isLoading: boolean;

  // Load
  loadTransactionsByDate: (date: string) => Promise<void>;
  loadTransactionsByMonth: (yearMonth: string) => Promise<void>;
  loadTransactionsByYear: (year: number) => Promise<void>;
  loadAllTransactions: () => Promise<void>;

  // CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'order_index'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  restoreTransaction: (id: string) => Promise<void>;
  reorderTransactions: (date: string, orderedIds: string[]) => Promise<void>;

  // Monthly Meta
  loadMonthlyMeta: (yearMonth: string) => Promise<MonthlyMeta>;
  updateMonthlyMeta: (yearMonth: string, updates: Partial<MonthlyMeta>) => Promise<void>;
  updateEstimasi: (yearMonth: string, type: 'pemasukan' | 'pengeluaran', kategori: string, value: number) => Promise<void>;

  // Computed
  getMonthSummary: (yearMonth: string) => { pemasukan: number; pengeluaran: number; saldo: number };
  getYearSummary: (year: number) => { pemasukan: number; pengeluaran: number; saldo: number };
  getCategoryTotals: (yearMonth: string, type: 'pemasukan' | 'pengeluaran') => Record<string, number>;
  getDailySummary: (date: string) => { pemasukan: number; pengeluaran: number; saldo: number };
  getBudgetAlerts: (yearMonth: string) => BudgetAlert[];
  getTopCategory: (year: number) => { kategori: string; percentage: number } | null;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  monthlyMeta: {},
  isLoading: false,

  loadTransactionsByDate: async (date) => {
    set({ isLoading: true });
    const txs = await db.getTransactionsByDate(date);
    set({ transactions: txs, isLoading: false });
  },

  loadTransactionsByMonth: async (yearMonth) => {
    set({ isLoading: true });
    const txs = await db.getTransactionsByMonth(yearMonth);
    set({ transactions: txs, isLoading: false });
  },

  loadTransactionsByYear: async (year) => {
    set({ isLoading: true });
    const txs = await db.getTransactionsByYear(year);
    set({ transactions: txs, isLoading: false });
  },

  loadAllTransactions: async () => {
    set({ isLoading: true });
    const txs = await db.getAllTransactions();
    set({ transactions: txs, isLoading: false });
  },

  addTransaction: async (txData) => {
    const now = new Date().toISOString();
    const existing = get().transactions.filter((t) => t.date === txData.date);
    const maxOrder = existing.reduce((max, t) => Math.max(max, t.order_index), -1);

    const tx: Transaction = {
      ...txData,
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      order_index: maxOrder + 1,
      deleted_at: null,
    };

    await db.saveTransaction(tx);
    set((state) => ({ transactions: [...state.transactions, tx] }));
    return tx;
  },

  updateTransaction: async (id, updates) => {
    const txs = get().transactions;
    const idx = txs.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const updated = { ...txs[idx], ...updates, updated_at: new Date().toISOString() };
    await db.saveTransaction(updated);

    const newTxs = [...txs];
    newTxs[idx] = updated;
    set({ transactions: newTxs });
  },

  deleteTransaction: async (id) => {
    await db.softDeleteTransaction(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  restoreTransaction: async (id) => {
    await db.restoreTransaction(id);
    // Reload from DB to get the restored transaction
    const all = await db.getAllTransactions();
    const restored = all.find((t) => t.id === id);
    if (restored) {
      set((state) => ({
        transactions: [...state.transactions, restored].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.order_index - b.order_index;
        }),
      }));
    }
  },

  reorderTransactions: async (date, orderedIds) => {
    const txs = get().transactions;
    const updated: Transaction[] = [];

    orderedIds.forEach((id, index) => {
      const tx = txs.find((t) => t.id === id);
      if (tx) {
        const u = { ...tx, order_index: index, updated_at: new Date().toISOString() };
        updated.push(u);
      }
    });

    await db.saveTransactions(updated);

    set((state) => {
      const otherTxs = state.transactions.filter((t) => t.date !== date);
      return {
        transactions: [...otherTxs, ...updated].sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.order_index - b.order_index;
        }),
      };
    });
  },

  // Monthly Meta
  loadMonthlyMeta: async (yearMonth) => {
    let meta = await db.getMonthlyMeta(yearMonth);
    if (!meta) {
      meta = {
        year_month: yearMonth,
        estimasi_pemasukan: {},
        estimasi_pengeluaran: {},
        catatan_bulan: '',
        starting_balance: 0,
      };
    }
    set((state) => ({
      monthlyMeta: { ...state.monthlyMeta, [yearMonth]: meta },
    }));
    return meta;
  },

  updateMonthlyMeta: async (yearMonth, updates) => {
    const current = get().monthlyMeta[yearMonth] || {
      year_month: yearMonth,
      estimasi_pemasukan: {},
      estimasi_pengeluaran: {},
      catatan_bulan: '',
      starting_balance: 0,
    };
    const updated = { ...current, ...updates };
    await db.saveMonthlyMeta(updated);
    set((state) => ({
      monthlyMeta: { ...state.monthlyMeta, [yearMonth]: updated },
    }));
  },

  updateEstimasi: async (yearMonth, type, kategori, value) => {
    const meta = get().monthlyMeta[yearMonth] || {
      year_month: yearMonth,
      estimasi_pemasukan: {},
      estimasi_pengeluaran: {},
      catatan_bulan: '',
      starting_balance: 0,
    };
    const key = type === 'pemasukan' ? 'estimasi_pemasukan' : 'estimasi_pengeluaran';
    const updated = {
      ...meta,
      [key]: { ...meta[key], [kategori]: value },
    };
    await db.saveMonthlyMeta(updated);
    set((state) => ({
      monthlyMeta: { ...state.monthlyMeta, [yearMonth]: updated },
    }));
  },

  // Computed values
  getMonthSummary: (yearMonth) => {
    const txs = get().transactions.filter((t) => t.date.startsWith(yearMonth) && !t.deleted_at);
    const pemasukan = txs.reduce((sum, t) => sum + (t.pemasukan || 0), 0);
    const pengeluaran = txs.reduce((sum, t) => sum + (t.pengeluaran || 0), 0);
    return { pemasukan, pengeluaran, saldo: pemasukan - pengeluaran };
  },

  getYearSummary: (year) => {
    const txs = get().transactions.filter((t) => t.date.startsWith(`${year}`) && !t.deleted_at);
    const pemasukan = txs.reduce((sum, t) => sum + (t.pemasukan || 0), 0);
    const pengeluaran = txs.reduce((sum, t) => sum + (t.pengeluaran || 0), 0);
    return { pemasukan, pengeluaran, saldo: pemasukan - pengeluaran };
  },

  getCategoryTotals: (yearMonth, type) => {
    const txs = get().transactions.filter(
      (t) => t.date.startsWith(yearMonth) && !t.deleted_at
    );
    const totals: Record<string, number> = {};
    for (const tx of txs) {
      const amount = type === 'pemasukan' ? tx.pemasukan : tx.pengeluaran;
      if (amount > 0) {
        totals[tx.kategori] = (totals[tx.kategori] || 0) + amount;
      }
    }
    return totals;
  },

  getDailySummary: (date) => {
    const txs = get().transactions.filter((t) => t.date === date && !t.deleted_at);
    const pemasukan = txs.reduce((sum, t) => sum + (t.pemasukan || 0), 0);
    const pengeluaran = txs.reduce((sum, t) => sum + (t.pengeluaran || 0), 0);
    return { pemasukan, pengeluaran, saldo: pemasukan - pengeluaran };
  },

  getBudgetAlerts: (yearMonth) => {
    const settings = useSettingsStore.getState().settings;
    const budgets = settings.budget_per_kategori;
    const categoryTotals = get().getCategoryTotals(yearMonth, 'pengeluaran');
    const alerts: BudgetAlert[] = [];

    for (const [kategori, budget] of Object.entries(budgets)) {
      if (budget <= 0) continue;
      const actual = categoryTotals[kategori] || 0;
      const percentage = (actual / budget) * 100;
      let status: BudgetAlert['status'] = 'normal';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      alerts.push({ kategori, budget, actual, percentage, status });
    }

    return alerts;
  },

  getTopCategory: (year) => {
    const txs = get().transactions.filter(
      (t) => t.date.startsWith(`${year}`) && !t.deleted_at && t.pengeluaran > 0
    );
    const totals: Record<string, number> = {};
    let total = 0;
    for (const tx of txs) {
      totals[tx.kategori] = (totals[tx.kategori] || 0) + tx.pengeluaran;
      total += tx.pengeluaran;
    }
    if (total === 0) return null;
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;
    return {
      kategori: entries[0][0],
      percentage: Math.round((entries[0][1] / total) * 100),
    };
  },
}));
