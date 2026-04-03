/**
 * Category color mapping for charts
 */

export const CATEGORY_COLORS: Record<string, string> = {
  'Makan & Minum': '#E67E22',
  'Transport (PKL)': '#3498DB',
  'Pulsa / Internet': '#9B59B6',
  'Gym': '#1ABC9C',
  'Buku / Belajar': '#F39C12',
  'Gaming / Hiburan': '#E74C3C',
  'Kebutuhan Pribadi': '#2ECC71',
  'Lain-lain (Pengeluaran)': '#95A5A6',
  'Uang Saku / Jajan': '#27AE60',
  'Stipend PKL': '#2980B9',
  'Freelance / Project': '#8E44AD',
  'Lain-lain (Pemasukan)': '#7F8C8D',
};

export function getCategoryColor(kategori: string): string {
  return CATEGORY_COLORS[kategori] || '#95A5A6';
}
