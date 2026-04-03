/**
 * Natural language transaction parser for Quick Entry
 * Parses Indonesian text like "Makan siang warteg 15rb" into structured data
 */

import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../types';
import { parseShorthandAmount } from './currency';

interface ParsedTransaction {
  keterangan: string;
  kategori: string;
  pemasukan: number;
  pengeluaran: number;
  confidence: number; // 0-1
}

// Keyword → category mapping
const EXPENSE_KEYWORDS: Record<string, string[]> = {
  'Makan & Minum': ['makan', 'minum', 'lunch', 'dinner', 'breakfast', 'sarapan', 'warteg', 'nasi', 'kopi', 'coffee', 'snack', 'jajan', 'resto', 'cafe', 'bakso', 'mie', 'ayam', 'es', 'teh', 'boba'],
  'Transport (PKL)': ['transport', 'ojek', 'gojek', 'grab', 'bensin', 'parkir', 'tol', 'bus', 'kereta', 'angkot', 'taxi', 'uber', 'bbm'],
  'Pulsa / Internet': ['pulsa', 'internet', 'data', 'wifi', 'kuota', 'paket data'],
  'Gym': ['gym', 'fitness', 'olahraga', 'sport'],
  'Buku / Belajar': ['buku', 'kursus', 'course', 'udemy', 'belajar', 'sekolah', 'kuliah', 'print', 'fotokopi', 'atk'],
  'Gaming / Hiburan': ['game', 'gaming', 'steam', 'ml', 'mobile', 'nonton', 'bioskop', 'netflix', 'spotify', 'hiburan', 'top up', 'topup'],
  'Kebutuhan Pribadi': ['sabun', 'shampo', 'skincare', 'obat', 'laundry', 'cuci', 'baju', 'celana', 'sepatu'],
};

const INCOME_KEYWORDS: Record<string, string[]> = {
  'Stipend PKL': ['gaji', 'stipend', 'pkl', 'bayaran', 'salary', 'upah'],
  'Freelance / Project': ['freelance', 'project', 'client', 'proyek', 'kerja', 'fee', 'honor'],
  'Uang Saku / Jajan': ['uang saku', 'kiriman', 'transfer', 'dari mama', 'dari papa', 'ortu', 'allowance'],
};

function detectCategory(text: string): { kategori: string; isIncome: boolean; confidence: number } {
  const lower = text.toLowerCase();

  // Check income keywords first
  for (const [category, keywords] of Object.entries(INCOME_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return { kategori: category, isIncome: true, confidence: 0.8 };
      }
    }
  }

  // Check expense keywords
  for (const [category, keywords] of Object.entries(EXPENSE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return { kategori: category, isIncome: false, confidence: 0.8 };
      }
    }
  }

  // Default to expense "Lain-lain"
  return { kategori: 'Lain-lain (Pengeluaran)', isIncome: false, confidence: 0.3 };
}

function extractAmountFromText(text: string): { amount: number; cleanedText: string } {
  // Try shorthand first
  const shorthandPatterns = [
    /(\d+[.,]?\d*)\s*(jt|juta|rb|ribu|k|m)\b/gi,
    /(\d{4,})/g,
  ];

  let amount = 0;
  let cleanedText = text;

  for (const pattern of shorthandPatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = parseShorthandAmount(match[0]);
      if (parsed && parsed > 0) {
        amount = parsed;
        cleanedText = text.replace(match[0], '').trim();
        break;
      }
    }
  }

  // Also try bare numbers like "bayar 150000"
  if (amount === 0) {
    const bareNum = text.match(/\b(\d{3,})\b/);
    if (bareNum) {
      amount = parseInt(bareNum[1], 10);
      cleanedText = text.replace(bareNum[0], '').trim();
    }
  }

  return { amount, cleanedText };
}

export function parseQuickEntry(input: string): ParsedTransaction {
  const { amount, cleanedText } = extractAmountFromText(input);
  const { kategori, isIncome, confidence } = detectCategory(input);

  // Clean up keterangan: remove amount-related words, capitalize first letter
  let keterangan = cleanedText
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();

  if (keterangan.length === 0) {
    keterangan = input.replace(/\d+[.,]?\d*\s*(jt|juta|rb|ribu|k|m)?/gi, '').trim();
    if (keterangan.length === 0) keterangan = input;
  }

  // Capitalize first letter
  keterangan = keterangan.charAt(0).toUpperCase() + keterangan.slice(1);

  return {
    keterangan,
    kategori,
    pemasukan: isIncome ? amount : 0,
    pengeluaran: isIncome ? 0 : amount,
    confidence,
  };
}

export function getAllCategories(
  customIncome: string[] = [],
  customExpense: string[] = []
): { income: string[]; expense: string[] } {
  return {
    income: [...DEFAULT_INCOME_CATEGORIES, ...customIncome],
    expense: [...DEFAULT_EXPENSE_CATEGORIES, ...customExpense],
  };
}

export function isIncomeCategory(kategori: string, customIncome: string[] = []): boolean {
  const allIncome = [...DEFAULT_INCOME_CATEGORIES, ...customIncome];
  return allIncome.includes(kategori);
}
