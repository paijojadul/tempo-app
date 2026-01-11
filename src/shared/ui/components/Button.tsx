import type { ReactNode } from 'react';

interface ButtonProps {
  children?: ReactNode;
  className?: string;
}

export function Button({ children, className = '' }: ButtonProps) {
  return <div className={`button ${className}`}>{children}</div>;
}
