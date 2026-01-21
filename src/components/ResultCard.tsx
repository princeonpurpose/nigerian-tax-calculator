/**
 * Reusable result display card component
 */

import { cn } from '@/utils/cn';
import { formatNaira, formatPercent } from '@/utils/formatters';

interface ResultItem {
  label: string;
  value: number;
  isPercentage?: boolean;
  isCurrency?: boolean;
  highlight?: boolean;
  note?: string;
}

interface ResultCardProps {
  title: string;
  items: ResultItem[];
  variant?: 'default' | 'success' | 'info';
  className?: string;
}

export function ResultCard({ title, items, variant = 'default', className }: ResultCardProps) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden', variantStyles[variant], className)}>
      <div className={cn(
        'px-4 py-3 border-b font-semibold',
        variant === 'success' && 'bg-green-100 border-green-200 text-green-800',
        variant === 'info' && 'bg-blue-100 border-blue-200 text-blue-800',
        variant === 'default' && 'bg-gray-50 border-gray-200 text-gray-800'
      )}>
        {title}
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'flex justify-between items-center px-4 py-3',
              item.highlight && 'bg-yellow-50 font-semibold'
            )}
          >
            <div className="flex flex-col">
              <span className={cn('text-gray-700', item.highlight && 'text-gray-900')}>
                {item.label}
              </span>
              {item.note && (
                <span className="text-xs text-gray-500 mt-0.5">{item.note}</span>
              )}
            </div>
            <span className={cn(
              'font-medium tabular-nums',
              item.highlight ? 'text-green-700 text-lg' : 'text-gray-900'
            )}>
              {item.isPercentage
                ? formatPercent(item.value)
                : item.isCurrency !== false
                ? formatNaira(item.value)
                : item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: string;
  label: string;
  value: string;
  subtext?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function SummaryCard({ icon, label, value, subtext, variant = 'default' }: SummaryCardProps) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-300',
    warning: 'bg-amber-50 border-amber-300',
    error: 'bg-red-50 border-red-300',
  };

  return (
    <div className={cn('border rounded-lg p-4', variantStyles[variant])}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  );
}
