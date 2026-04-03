/**
 * Currency formatting utilities for Indonesian Rupiah
 */

/** Format number to Indonesian Rupiah string: Rp 1.500.000 */
export function formatRupiah(amount: number, showPrefix = true): string {
  if (amount === 0 && !showPrefix) return '0';
  const prefix = showPrefix ? 'Rp ' : '';
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}${prefix}${formatted}`;
}

/** Format for English locale: IDR 1,500,000 */
export function formatIDREnglish(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${isNegative ? '-' : ''}IDR ${formatted}`;
}

/** Parse a currency string back to number */
export function parseCurrencyInput(value: string): number {
  // Remove all non-numeric chars except minus
  const cleaned = value.replace(/[^\d-]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/** Parse Indonesian shorthand amounts: 15rb, 1.5jt, 150k */
export function parseShorthandAmount(text: string): number | null {
  // Match patterns like: 15rb, 15 rb, 1.5jt, 1,5jt, 150k, 150000
  const patterns = [
    { regex: /(\d+[.,]?\d*)\s*jt/i, multiplier: 1_000_000 },
    { regex: /(\d+[.,]?\d*)\s*juta/i, multiplier: 1_000_000 },
    { regex: /(\d+[.,]?\d*)\s*rb/i, multiplier: 1_000 },
    { regex: /(\d+[.,]?\d*)\s*ribu/i, multiplier: 1_000 },
    { regex: /(\d+[.,]?\d*)\s*k\b/i, multiplier: 1_000 },
    { regex: /(\d+[.,]?\d*)\s*m\b/i, multiplier: 1_000_000 },
  ];

  for (const { regex, multiplier } of patterns) {
    const match = text.match(regex);
    if (match) {
      const num = parseFloat(match[1].replace(',', '.'));
      return Math.round(num * multiplier);
    }
  }

  // Try plain number
  const plainMatch = text.match(/(\d{3,})/);
  if (plainMatch) {
    return parseInt(plainMatch[1], 10);
  }

  return null;
}

/** Format number for input display (on focus: raw number, on blur: formatted) */
export function formatForDisplay(amount: number): string {
  if (amount === 0) return '';
  return formatRupiah(amount);
}

export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return formatRupiah(amount);
}
