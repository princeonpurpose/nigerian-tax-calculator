/**
 * Capital Gains Tax (CGT) Calculator Service
 * Based on Nigeria Tax Act 2026
 */

import {
  COMPANY_CGT_RATE,
  SMALL_COMPANY_CGT_RATE,
  SMALL_COMPANY_TURNOVER_LIMIT,
} from '@/config/taxConfig';
import { calculateProgressiveTax } from './pitCalculator';

export type TaxpayerType = 'individual' | 'company';

export interface CGTInput {
  taxpayerType: TaxpayerType;
  saleProceeds: number;
  acquisitionCost: number;
  improvementCosts?: number;
  transferCosts?: number;
  isOffshoreTransfer?: boolean; // For indirect offshore share transfers
  companyTurnover?: number; // To determine if small company
}

export interface CGTResult {
  taxpayerType: TaxpayerType;
  saleProceeds: number;
  totalCosts: number;
  capitalGain: number;
  cgtRate: number | string;
  cgtAmount: number;
  netProceeds: number;
  effectiveRate: number;
  isExempt: boolean;
  exemptReason?: string;
  breakdown: {
    label: string;
    amount: number;
    note?: string;
  }[];
}

/**
 * Calculate total deductible costs
 */
function calculateTotalCosts(input: CGTInput): number {
  return (
    input.acquisitionCost +
    (input.improvementCosts || 0) +
    (input.transferCosts || 0)
  );
}

/**
 * Calculate CGT for companies (30% flat rate)
 */
function calculateCompanyCGT(input: CGTInput): CGTResult {
  const totalCosts = calculateTotalCosts(input);
  const capitalGain = Math.max(0, input.saleProceeds - totalCosts);
  const breakdown: CGTResult['breakdown'] = [];

  // Check if small company (exempt from CGT)
  const isSmallCompany = input.companyTurnover !== undefined && 
    input.companyTurnover <= SMALL_COMPANY_TURNOVER_LIMIT;

  if (isSmallCompany) {
    return {
      taxpayerType: 'company',
      saleProceeds: input.saleProceeds,
      totalCosts,
      capitalGain,
      cgtRate: SMALL_COMPANY_CGT_RATE,
      cgtAmount: 0,
      netProceeds: input.saleProceeds,
      effectiveRate: 0,
      isExempt: true,
      exemptReason: `Small company (turnover ≤ ₦${SMALL_COMPANY_TURNOVER_LIMIT.toLocaleString()}) - CGT exempt`,
      breakdown: [
        { label: 'Sale Proceeds', amount: input.saleProceeds },
        { label: 'Acquisition Cost', amount: input.acquisitionCost },
        { label: 'Improvement Costs', amount: input.improvementCosts || 0 },
        { label: 'Transfer Costs', amount: input.transferCosts || 0 },
        { label: 'Capital Gain', amount: capitalGain },
        { label: 'CGT (Exempt)', amount: 0, note: 'Small company exemption' },
      ],
    };
  }

  // Standard company CGT at 30%
  const cgtAmount = (capitalGain * COMPANY_CGT_RATE) / 100;

  breakdown.push({ label: 'Sale Proceeds', amount: input.saleProceeds });
  breakdown.push({ label: 'Acquisition Cost', amount: input.acquisitionCost });
  
  if (input.improvementCosts && input.improvementCosts > 0) {
    breakdown.push({ label: 'Improvement Costs', amount: input.improvementCosts });
  }
  
  if (input.transferCosts && input.transferCosts > 0) {
    breakdown.push({ label: 'Transfer Costs', amount: input.transferCosts });
  }
  
  breakdown.push({ label: 'Capital Gain', amount: capitalGain });
  breakdown.push({ 
    label: 'CGT (30%)', 
    amount: cgtAmount,
    note: input.isOffshoreTransfer ? 'Includes indirect offshore share transfer' : undefined,
  });

  return {
    taxpayerType: 'company',
    saleProceeds: input.saleProceeds,
    totalCosts,
    capitalGain,
    cgtRate: COMPANY_CGT_RATE,
    cgtAmount,
    netProceeds: input.saleProceeds - cgtAmount,
    effectiveRate: input.saleProceeds > 0 ? (cgtAmount / input.saleProceeds) * 100 : 0,
    isExempt: false,
    breakdown,
  };
}

/**
 * Calculate CGT for individuals (using PIT progressive brackets, max 25%)
 */
function calculateIndividualCGT(input: CGTInput): CGTResult {
  const totalCosts = calculateTotalCosts(input);
  const capitalGain = Math.max(0, input.saleProceeds - totalCosts);
  const breakdown: CGTResult['breakdown'] = [];

  // Check if gain falls under exempt threshold
  const exemptThreshold = 800_000; // Same as PIT exempt threshold
  
  if (capitalGain <= exemptThreshold) {
    return {
      taxpayerType: 'individual',
      saleProceeds: input.saleProceeds,
      totalCosts,
      capitalGain,
      cgtRate: '0%',
      cgtAmount: 0,
      netProceeds: input.saleProceeds,
      effectiveRate: 0,
      isExempt: true,
      exemptReason: `Capital gain of ₦${capitalGain.toLocaleString()} is below ₦${exemptThreshold.toLocaleString()} threshold`,
      breakdown: [
        { label: 'Sale Proceeds', amount: input.saleProceeds },
        { label: 'Acquisition Cost', amount: input.acquisitionCost },
        { label: 'Improvement Costs', amount: input.improvementCosts || 0 },
        { label: 'Transfer Costs', amount: input.transferCosts || 0 },
        { label: 'Capital Gain', amount: capitalGain },
        { label: 'CGT (Exempt)', amount: 0, note: 'Below exempt threshold' },
      ],
    };
  }

  // Use progressive PIT brackets for individual CGT
  const { totalTax, breakdown: bracketBreakdown } = calculateProgressiveTax(capitalGain);

  breakdown.push({ label: 'Sale Proceeds', amount: input.saleProceeds });
  breakdown.push({ label: 'Acquisition Cost', amount: input.acquisitionCost });
  
  if (input.improvementCosts && input.improvementCosts > 0) {
    breakdown.push({ label: 'Improvement Costs', amount: input.improvementCosts });
  }
  
  if (input.transferCosts && input.transferCosts > 0) {
    breakdown.push({ label: 'Transfer Costs', amount: input.transferCosts });
  }
  
  breakdown.push({ label: 'Capital Gain', amount: capitalGain });

  // Add bracket breakdown
  for (const bracket of bracketBreakdown) {
    if (bracket.taxableInBracket > 0) {
      breakdown.push({
        label: `Tax @ ${bracket.bracket.rate}%`,
        amount: bracket.taxForBracket,
        note: `On ₦${bracket.taxableInBracket.toLocaleString()}`,
      });
    }
  }

  breakdown.push({ label: 'Total CGT', amount: totalTax });

  const effectiveRate = capitalGain > 0 ? (totalTax / capitalGain) * 100 : 0;

  return {
    taxpayerType: 'individual',
    saleProceeds: input.saleProceeds,
    totalCosts,
    capitalGain,
    cgtRate: `Progressive (max 25%)`,
    cgtAmount: totalTax,
    netProceeds: input.saleProceeds - totalTax,
    effectiveRate,
    isExempt: false,
    breakdown,
  };
}

/**
 * Main CGT calculation entry point
 */
export function calculateCGT(input: CGTInput): CGTResult {
  if (input.taxpayerType === 'company') {
    return calculateCompanyCGT(input);
  }
  return calculateIndividualCGT(input);
}

/**
 * Quick CGT estimate
 */
export function quickCGTEstimate(
  taxpayerType: TaxpayerType,
  saleProceeds: number,
  acquisitionCost: number
): CGTResult {
  return calculateCGT({
    taxpayerType,
    saleProceeds,
    acquisitionCost,
  });
}
