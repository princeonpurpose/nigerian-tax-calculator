/**
 * Formatting utilities for Nigerian Tax Calculator
 */

/**
 * Format number as Nigerian Naira currency
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('NGN', '₦');
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format percentage
 */
export function formatPercent(rate: number, decimals: number = 1): string {
  return `${rate.toFixed(decimals)}%`;
}

/**
 * Parse Nigerian currency string to number
 */
export function parseNairaInput(value: string): number {
  const cleaned = value.replace(/[₦,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format input as currency while typing
 */
export function formatCurrencyInput(value: string): string {
  const number = parseNairaInput(value);
  if (number === 0 && value === '') return '';
  return formatNumber(number);
}

/**
 * Format bracket range for display
 */
export function formatBracketRange(min: number, max: number | null): string {
  if (max === null) {
    return `Above ${formatNaira(min - 1)}`;
  }
  if (min === 0) {
    return `${formatNaira(0)} – ${formatNaira(max)}`;
  }
  return `${formatNaira(min)} – ${formatNaira(max)}`;
}
