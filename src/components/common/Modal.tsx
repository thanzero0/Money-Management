import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-fade-in" />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} surface-card p-6 animate-slide-in dark:bg-[var(--color-dark-surface)] dark:border-[var(--color-dark-border)]`}
        style={{ borderRadius: '12px' }}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h3 className="text-lg font-semibold text-[var(--color-primary)] dark:text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-serif)' }}>
                {title}
              </h3>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-[var(--color-cream)] dark:hover:bg-[var(--color-dark-surface-elevated)] transition-colors"
                aria-label="Tutup"
              >
                <X size={18} className="text-[var(--color-muted)]" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
