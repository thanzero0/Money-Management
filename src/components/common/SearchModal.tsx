import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { getAllTransactions } from '../../db/database';
import type { Transaction } from '../../types';
import { formatRupiah } from '../../utils/currency';
import { formatDateShort, parseISODate } from '../../utils/date';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Transaction[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const all = await getAllTransactions();
    const lower = q.toLowerCase();
    const filtered = all
      .filter(
        (t) =>
          t.keterangan.toLowerCase().includes(lower) ||
          t.kategori.toLowerCase().includes(lower)
      )
      .slice(0, 20);
    setResults(filtered);
    setSelectedIdx(0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      navigateToResult(results[selectedIdx]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const navigateToResult = (tx: Transaction) => {
    onClose();
    navigate(`/day/${tx.date}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-xl surface-card overflow-hidden dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]"
        style={{ borderRadius: '12px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
          <Search size={18} className="text-[var(--color-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari transaksi..."
            className="flex-1 bg-transparent text-sm outline-none text-[var(--color-text)] dark:text-[var(--color-dark-text)] placeholder:text-[var(--color-muted)]"
          />
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-secondary)]">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {results.map((tx, idx) => (
              <button
                key={tx.id}
                onClick={() => navigateToResult(tx)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  idx === selectedIdx
                    ? 'bg-[var(--color-cream)] dark:bg-[var(--color-dark-surface-elevated)]'
                    : 'hover:bg-[var(--color-cream)]/50 dark:hover:bg-[var(--color-dark-surface-elevated)]/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-dark-text)] truncate">
                    {tx.keterangan}
                  </div>
                  <div className="text-xs text-[var(--color-muted)] flex items-center gap-2 mt-0.5">
                    <span>{formatDateShort(parseISODate(tx.date))}</span>
                    <span>·</span>
                    <span>{tx.kategori}</span>
                  </div>
                </div>
                <div className="shrink-0 ml-3">
                  {tx.pemasukan > 0 && (
                    <span className="text-sm font-medium text-[var(--color-positive)] font-mono-number">
                      +{formatRupiah(tx.pemasukan)}
                    </span>
                  )}
                  {tx.pengeluaran > 0 && (
                    <span className="text-sm font-medium text-[var(--color-danger)] font-mono-number">
                      -{formatRupiah(tx.pengeluaran)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
            Tidak ada transaksi ditemukan
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center gap-4 text-xs text-[var(--color-muted)]">
          <span>↑↓ navigasi</span>
          <span>↵ buka</span>
          <span>esc tutup</span>
        </div>
      </div>
    </div>
  );
}
