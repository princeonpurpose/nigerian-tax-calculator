/**
 * Value Added Tax (VAT) Calculator Service
 * Based on Nigeria Tax Act 2026
 */

import { VAT_RATE } from '@/config/taxConfig';

export type VATCalculationType = 'inclusive' | 'exclusive';

export interface VATInput {
  amount: number;
  calculationType: VATCalculationType;
}

export interface VATBusinessInput {
  outputVAT: number; // VAT collected on sales
  inputVAT: number; // VAT paid on purchases
}

export interface VATResult {
  originalAmount: number;
  vatRate: number;
  vatAmount: number;
  netAmount: number; // Amount excluding VAT
  grossAmount: number; // Amount including VAT
  calculationType: VATCalculationType;
}

export interface VATBusinessResult {
  outputVAT: number;
  inputVAT: number;
  netVAT: number;
  isPayable: boolean;
  isRefundable: boolean;
  explanation: string;
}

/**
 * Calculate VAT from a price (inclusive or exclusive)
 */
export function calculateVAT(input: VATInput): VATResult {
  const vatRate = VAT_RATE;
  const vatMultiplier = vatRate / 100;

  if (input.calculationType === 'exclusive') {
    // Price is VAT-exclusive, add VAT on top
    const netAmount = input.amount;
    const vatAmount = netAmount * vatMultiplier;
    const grossAmount = netAmount + vatAmount;

    return {
      originalAmount: input.amount,
      vatRate,
      vatAmount,
      netAmount,
      grossAmount,
      calculationType: 'exclusive',
    };
  } else {
    // Price is VAT-inclusive, extract VAT
    const grossAmount = input.amount;
    const netAmount = grossAmount / (1 + vatMultiplier);
    const vatAmount = grossAmount - netAmount;

    return {
      originalAmount: input.amount,
      vatRate,
      vatAmount,
      netAmount,
      grossAmount,
      calculationType: 'inclusive',
    };
  }
}

/**
 * Calculate net VAT payable/refundable for businesses
 * Output VAT - Input VAT = Net VAT
 */
export function calculateBusinessVAT(input: VATBusinessInput): VATBusinessResult {
  const netVAT = input.outputVAT - input.inputVAT;
  const isPayable = netVAT > 0;
  const isRefundable = netVAT < 0;

  let explanation: string;

  if (isPayable) {
    explanation = `You collected ₦${input.outputVAT.toLocaleString()} in VAT from customers and paid ₦${input.inputVAT.toLocaleString()} in VAT on purchases. You owe ₦${Math.abs(netVAT).toLocaleString()} to NRS.`;
  } else if (isRefundable) {
    explanation = `You collected ₦${input.outputVAT.toLocaleString()} in VAT from customers but paid ₦${input.inputVAT.toLocaleString()} in VAT on purchases. You are entitled to a refund of ₦${Math.abs(netVAT).toLocaleString()} from NRS.`;
  } else {
    explanation = `Your output VAT equals your input VAT. No VAT payment or refund is due.`;
  }

  return {
    outputVAT: input.outputVAT,
    inputVAT: input.inputVAT,
    netVAT,
    isPayable,
    isRefundable,
    explanation,
  };
}

/**
 * Quick VAT calculation (exclusive)
 */
export function quickVATExclusive(amount: number): VATResult {
  return calculateVAT({ amount, calculationType: 'exclusive' });
}

/**
 * Quick VAT calculation (inclusive)
 */
export function quickVATInclusive(amount: number): VATResult {
  return calculateVAT({ amount, calculationType: 'inclusive' });
}

/**
 * Calculate VAT for multiple line items
 */
export function calculateMultiItemVAT(
  items: { description: string; amount: number; isVATExempt?: boolean }[]
): {
  items: { description: string; amount: number; vatAmount: number; totalWithVAT: number; isExempt: boolean }[];
  totalNet: number;
  totalVAT: number;
  grandTotal: number;
} {
  const vatRate = VAT_RATE / 100;
  let totalNet = 0;
  let totalVAT = 0;

  const processedItems = items.map((item) => {
    const isExempt = item.isVATExempt || false;
    const vatAmount = isExempt ? 0 : item.amount * vatRate;
    const totalWithVAT = item.amount + vatAmount;

    totalNet += item.amount;
    totalVAT += vatAmount;

    return {
      description: item.description,
      amount: item.amount,
      vatAmount,
      totalWithVAT,
      isExempt,
    };
  });

  return {
    items: processedItems,
    totalNet,
    totalVAT,
    grandTotal: totalNet + totalVAT,
  };
}
