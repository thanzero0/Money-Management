import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] focus-visible:outline-[var(--color-primary)] active:scale-[0.98]',
    secondary: 'bg-[var(--color-cream)] text-[var(--color-primary)] border border-[var(--color-border)] hover:bg-[var(--color-cream-dark)] dark:bg-[var(--color-dark-surface)] dark:text-[var(--color-dark-text)] dark:border-[var(--color-dark-border)] dark:hover:bg-[var(--color-dark-surface-elevated)]',
    ghost: 'text-[var(--color-secondary)] hover:bg-[var(--color-cream)] dark:text-[var(--color-dark-text-secondary)] dark:hover:bg-[var(--color-dark-surface-elevated)]',
    danger: 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger-light)] focus-visible:outline-[var(--color-danger)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
