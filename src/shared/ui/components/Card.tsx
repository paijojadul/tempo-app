import type { ReactNode } from 'react';

interface CardProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function Card({ children, className = '', title, variant = 'default' }: CardProps) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    primary: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <div className={`card rounded-lg shadow-sm p-4 border ${variantStyles[variant]} ${className}`}>
      {title && (
        <h3
          className={`text-lg font-semibold mb-2 ${
            variant === 'primary'
              ? 'text-blue-800'
              : variant === 'success'
                ? 'text-green-800'
                : variant === 'warning'
                  ? 'text-yellow-800'
                  : 'text-gray-800'
          }`}
        >
          {title}
        </h3>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
}
