/**
 * Excel export utility using SheetJS
 */
import * as XLSX from 'xlsx';
import type { Transaction, MonthlyMeta, ExportOptions } from '../types';
import { MONTH_NAMES_ID, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../types';
import { formatMonthYear } from './date';

interface ExportData {
  transactions: Transaction[];
  monthlyMetas: MonthlyMeta[];
  userName: string;
  options: ExportOptions;
}

function getMonthsForExport(options: ExportOptions): string[] {
  const months: string[] = [];
  const year = options.year;

  switch (options.range) {
    case 'month':
      if (options.month !== undefined) {
        months.push(`${year}-${(options.month + 1).toString().padStart(2, '0')}`);
      }
      break;
    case 'quarter':
      if (options.month !== undefined) {
        const q = Math.floor(options.month / 3) * 3;
        for (let i = q; i < q + 3; i++) {
          months.push(`${year}-${(i + 1).toString().padStart(2, '0')}`);
        }
      }
      break;
    case 'year':
      for (let i = 0; i < 12; i++) {
        months.push(`${year}-${(i + 1).toString().padStart(2, '0')}`);
      }
      break;
    case 'custom':
      if (options.from_month && options.to_month) {
        let current = options.from_month;
        while (current <= options.to_month) {
          months.push(current);
          const [y, m] = current.split('-').map(Number);
          const next = m === 12 ? `${y + 1}-01` : `${y}-${(m + 1).toString().padStart(2, '0')}`;
          current = next;
        }
      }
      break;
  }

  return months;
}

function buildRingkasanSheet(data: ExportData): XLSX.WorkSheet {
  const months = getMonthsForExport(data.options);
  const rows: any[][] = [];

  // Build columns for each month side by side
  const colsPerMonth = 4; // Kategori, Estimasi, Aktual, Selisih + 1 gap
  const incomeCategories = [...DEFAULT_INCOME_CATEGORIES];
  const expenseCategories = [...DEFAULT_EXPENSE_CATEGORIES];

  // Header row
  const headerRow: any[] = [];
  months.forEach((ym, idx) => {
    const [y, m] = ym.split('-').map(Number);
    const offset = idx * (colsPerMonth + 1);
    headerRow[offset] = `LAPORAN KEUANGAN — ${formatMonthYear(y, m - 1).toUpperCase()}`;
  });
  rows.push(headerRow);

  // User name row
  const nameRow: any[] = [];
  months.forEach((_, idx) => {
    nameRow[idx * (colsPerMonth + 1)] = data.userName;
  });
  rows.push(nameRow);

  // Empty row
  rows.push([]);

  // PEMASUKAN header
  const incHeader: any[] = [];
  months.forEach((_, idx) => {
    const o = idx * (colsPerMonth + 1);
    incHeader[o] = 'PEMASUKAN';
  });
  rows.push(incHeader);

  // Column headers
  const colHeaders: any[] = [];
  months.forEach((_, idx) => {
    const o = idx * (colsPerMonth + 1);
    colHeaders[o] = 'Sumber';
    colHeaders[o + 1] = 'Estimasi';
    colHeaders[o + 2] = 'Aktual';
    colHeaders[o + 3] = 'Selisih';
  });
  rows.push(colHeaders);

  // Income rows
  incomeCategories.forEach((cat) => {
    const row: any[] = [];
    months.forEach((ym, idx) => {
      const o = idx * (colsPerMonth + 1);
      const meta = data.monthlyMetas.find((m) => m.year_month === ym);
      const txs = data.transactions.filter((t) => t.date.startsWith(ym) && t.kategori === cat && !t.deleted_at);
      const estimasi = meta?.estimasi_pemasukan?.[cat] || 0;
      const aktual = txs.reduce((sum, t) => sum + (t.pemasukan || 0), 0);
      row[o] = cat;
      row[o + 1] = estimasi;
      row[o + 2] = aktual;
      row[o + 3] = aktual - estimasi;
    });
    rows.push(row);
  });

  // Total Pemasukan
  const totalIncRow: any[] = [];
  months.forEach((ym, idx) => {
    const o = idx * (colsPerMonth + 1);
    const meta = data.monthlyMetas.find((m) => m.year_month === ym);
    const txs = data.transactions.filter((t) => t.date.startsWith(ym) && t.pemasukan > 0 && !t.deleted_at);
    const totalEst = Object.values(meta?.estimasi_pemasukan || {}).reduce((s: number, v: any) => s + (v || 0), 0);
    const totalAkt = txs.reduce((sum, t) => sum + (t.pemasukan || 0), 0);
    totalIncRow[o] = 'TOTAL PEMASUKAN';
    totalIncRow[o + 1] = totalEst;
    totalIncRow[o + 2] = totalAkt;
    totalIncRow[o + 3] = totalAkt - totalEst;
  });
  rows.push(totalIncRow);

  // Empty row
  rows.push([]);

  // PENGELUARAN header
  const expHeader: any[] = [];
  months.forEach((_, idx) => {
    const o = idx * (colsPerMonth + 1);
    expHeader[o] = 'PENGELUARAN';
  });
  rows.push(expHeader);

  // Column headers
  const expColHeaders: any[] = [];
  months.forEach((_, idx) => {
    const o = idx * (colsPerMonth + 1);
    expColHeaders[o] = 'Kategori';
    expColHeaders[o + 1] = 'Estimasi';
    expColHeaders[o + 2] = 'Aktual';
    expColHeaders[o + 3] = 'Selisih';
  });
  rows.push(expColHeaders);

  // Expense rows
  expenseCategories.forEach((cat) => {
    const row: any[] = [];
    months.forEach((ym, idx) => {
      const o = idx * (colsPerMonth + 1);
      const meta = data.monthlyMetas.find((m) => m.year_month === ym);
      const txs = data.transactions.filter((t) => t.date.startsWith(ym) && t.kategori === cat && !t.deleted_at);
      const estimasi = meta?.estimasi_pengeluaran?.[cat] || 0;
      const aktual = txs.reduce((sum, t) => sum + (t.pengeluaran || 0), 0);
      row[o] = cat;
      row[o + 1] = estimasi;
      row[o + 2] = aktual;
      row[o + 3] = aktual - estimasi;
    });
    rows.push(row);
  });

  // Total Pengeluaran
  const totalExpRow: any[] = [];
  months.forEach((ym, idx) => {
    const o = idx * (colsPerMonth + 1);
    const meta = data.monthlyMetas.find((m) => m.year_month === ym);
    const txs = data.transactions.filter((t) => t.date.startsWith(ym) && t.pengeluaran > 0 && !t.deleted_at);
    const totalEst = Object.values(meta?.estimasi_pengeluaran || {}).reduce((s: number, v: any) => s + (v || 0), 0);
    const totalAkt = txs.reduce((sum, t) => sum + (t.pengeluaran || 0), 0);
    totalExpRow[o] = 'TOTAL PENGELUARAN';
    totalExpRow[o + 1] = totalEst;
    totalExpRow[o + 2] = totalAkt;
    totalExpRow[o + 3] = totalAkt - totalEst;
  });
  rows.push(totalExpRow);

  // Empty row
  rows.push([]);

  // NET / SALDO
  const netRow: any[] = [];
  months.forEach((ym, idx) => {
    const o = idx * (colsPerMonth + 1);
    const meta = data.monthlyMetas.find((m) => m.year_month === ym);
    const txs = data.transactions.filter((t) => t.date.startsWith(ym) && !t.deleted_at);
    const totalIncEst = Object.values(meta?.estimasi_pemasukan || {}).reduce((s: number, v: any) => s + (v || 0), 0);
    const totalExpEst = Object.values(meta?.estimasi_pengeluaran || {}).reduce((s: number, v: any) => s + (v || 0), 0);
    const totalIncAkt = txs.reduce((sum, t) => sum + (t.pemasukan || 0), 0);
    const totalExpAkt = txs.reduce((sum, t) => sum + (t.pengeluaran || 0), 0);
    netRow[o] = 'NET / SALDO';
    netRow[o + 1] = totalIncEst - totalExpEst;
    netRow[o + 2] = totalIncAkt - totalExpAkt;
    netRow[o + 3] = (totalIncAkt - totalExpAkt) - (totalIncEst - totalExpEst);
  });
  rows.push(netRow);

  // Empty row
  rows.push([]);

  // Catatan
  const catatanLabelRow: any[] = [];
  months.forEach((_, idx) => {
    catatanLabelRow[idx * (colsPerMonth + 1)] = 'CATATAN:';
  });
  rows.push(catatanLabelRow);

  const catatanRow: any[] = [];
  months.forEach((ym, idx) => {
    const meta = data.monthlyMetas.find((m) => m.year_month === ym);
    catatanRow[idx * (colsPerMonth + 1)] = meta?.catatan_bulan || '';
  });
  rows.push(catatanRow);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  const colWidths: XLSX.ColInfo[] = [];
  for (let i = 0; i < months.length * (colsPerMonth + 1); i++) {
    const pos = i % (colsPerMonth + 1);
    if (pos === 0) colWidths.push({ wch: 22 });
    else if (pos === 4) colWidths.push({ wch: 3 }); // gap column
    else colWidths.push({ wch: 16 });
  }
  ws['!cols'] = colWidths;

  return ws;
}

function buildTransaksiSheet(data: ExportData): XLSX.WorkSheet {
  const months = getMonthsForExport(data.options);
  const filtered = data.transactions
    .filter((t) => {
      if (t.deleted_at) return false;
      return months.some((ym) => t.date.startsWith(ym));
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const rows: any[][] = [
    ['TRANSAKSI HARIAN'],
    [],
    ['Tanggal', 'Keterangan', 'Kategori', 'Pemasukan', 'Pengeluaran'],
  ];

  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  for (const tx of filtered) {
    rows.push([tx.date, tx.keterangan, tx.kategori, tx.pemasukan || '', tx.pengeluaran || '']);
    totalPemasukan += tx.pemasukan || 0;
    totalPengeluaran += tx.pengeluaran || 0;
  }

  rows.push([]);
  rows.push(['', '', 'TOTAL', totalPemasukan, totalPengeluaran]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
  ];

  return ws;
}

export function exportToXLSX(data: ExportData): void {
  const wb = XLSX.utils.book_new();

  const ringkasanSheet = buildRingkasanSheet(data);
  XLSX.utils.book_append_sheet(wb, ringkasanSheet, 'Ringkasan');

  const transaksiSheet = buildTransaksiSheet(data);
  XLSX.utils.book_append_sheet(wb, transaksiSheet, 'Transaksi Harian');

  // Generate filename
  const months = getMonthsForExport(data.options);
  let filename = 'Keuangan';
  if (months.length === 1) {
    const [y, m] = months[0].split('-').map(Number);
    filename += `_${MONTH_NAMES_ID[m - 1]}_${y}`;
  } else if (data.options.range === 'quarter') {
    const [y, m] = months[0].split('-').map(Number);
    const q = Math.ceil(m / 3);
    filename += `_Q${q}_${y}`;
  } else if (data.options.range === 'year') {
    filename += `_${data.options.year}`;
  } else {
    filename += `_${months[0]}_to_${months[months.length - 1]}`;
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function importFromXLSX(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        // Try to read "Transaksi Harian" sheet
        const sheetName = wb.SheetNames.find((s) => s.includes('Transaksi')) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        const transactions: Transaction[] = [];
        let headerIdx = -1;

        // Find header row
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] as any[];
          if (row && row.some((cell: any) => typeof cell === 'string' && cell.includes('Tanggal'))) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          resolve([]);
          return;
        }

        // Parse data rows
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i] as any[];
          if (!row || !row[0]) continue;
          if (typeof row[0] === 'string' && row[0].includes('TOTAL')) break;

          const tx: Transaction = {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${i}`,
            date: String(row[0]),
            keterangan: String(row[1] || ''),
            kategori: String(row[2] || 'Lain-lain (Pengeluaran)'),
            pemasukan: Number(row[3]) || 0,
            pengeluaran: Number(row[4]) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            order_index: i - headerIdx - 1,
            deleted_at: null,
          };
          transactions.push(tx);
        }

        resolve(transactions);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
