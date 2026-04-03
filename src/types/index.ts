// ─── Transaction ────────────────────────────────────────────
export interface Transaction {
  id: string;
  date: string; // ISO date: "2025-04-04"
  keterangan: string;
  kategori: string;
  pemasukan: number;
  pengeluaran: number;
  note?: string;
  recurring?: RecurringRule;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  order_index: number;
  is_scheduled?: boolean;
}

// ─── Recurring ──────────────────────────────────────────────
export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  active: boolean;
}

// ─── Monthly Meta ───────────────────────────────────────────
export interface MonthlyMeta {
  year_month: string; // "2025-04"
  estimasi_pemasukan: Record<string, number>;
  estimasi_pengeluaran: Record<string, number>;
  catatan_bulan: string;
  starting_balance: number;
}

// ─── Budget Alert ───────────────────────────────────────────
export interface BudgetAlert {
  kategori: string;
  budget: number;
  actual: number;
  percentage: number;
  status: 'normal' | 'warning' | 'exceeded';
}

// ─── User Settings ──────────────────────────────────────────
export interface UserSettings {
  name: string;
  default_year: number;
  theme: 'light' | 'dark';
  currency: 'IDR' | 'USD' | 'EUR';
  number_format: 'id' | 'en'; // Rp 1.000.000 vs IDR 1,000,000
  language: 'id' | 'en';
  font_size: 'compact' | 'normal' | 'comfortable';
  google_client_id: string;
  budget_per_kategori: Record<string, number>;
  custom_income_categories: string[];
  custom_expense_categories: string[];
  target_tabungan: number;
  target_pengeluaran_max: number;
}

// ─── Categories ─────────────────────────────────────────────
export const DEFAULT_INCOME_CATEGORIES = [
  'Uang Saku / Jajan',
  'Stipend PKL',
  'Freelance / Project',
  'Lain-lain (Pemasukan)',
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Makan & Minum',
  'Transport (PKL)',
  'Pulsa / Internet',
  'Gym',
  'Buku / Belajar',
  'Gaming / Hiburan',
  'Kebutuhan Pribadi',
  'Lain-lain (Pengeluaran)',
] as const;

// ─── Month / Day names in Indonesian ────────────────────────
export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

export const MONTH_NAMES_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

export const DAY_NAMES_ID = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
] as const;

// ─── Sync ───────────────────────────────────────────────────
export interface SyncLogEntry {
  timestamp: string;
  action: 'push' | 'pull' | 'conflict';
  details: string;
  status: 'success' | 'error';
}

// ─── Export ─────────────────────────────────────────────────
export type ExportRange = 'month' | 'quarter' | 'year' | 'custom';

export interface ExportOptions {
  range: ExportRange;
  year: number;
  month?: number;
  from_month?: string; // "2025-01"
  to_month?: string;   // "2025-06"
}

// ─── Chart Data ─────────────────────────────────────────────
export interface MonthlyChartData {
  month: string;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

export interface CategorySpending {
  kategori: string;
  amount: number;
  percentage: number;
  color: string;
}
