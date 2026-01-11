import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeDefined();
  });

  it('renders with title prop', () => {
    render(<Card title="Card Title">Content</Card>);
    expect(screen.getByText('Card Title')).toBeDefined();
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="my-custom-class">Test</Card>);
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass('my-custom-class');
  });

  it('has default styling', () => {
    const { container } = render(<Card>Test</Card>);
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass('rounded-lg');
    expect(cardElement).toHaveClass('shadow-sm');
    expect(cardElement).toHaveClass('p-4');
  });

  it('supports primary variant', () => {
    const { container } = render(<Card variant="primary">Primary Card</Card>);
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass('bg-blue-50');
    expect(cardElement).toHaveClass('border-blue-200');
  });
});
