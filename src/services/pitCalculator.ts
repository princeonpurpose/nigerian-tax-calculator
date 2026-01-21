/**
 * Personal Income Tax (PIT/PAYE) Calculator Service
 * Based on Nigeria Tax Act 2026
 */

import {
  PIT_BRACKETS,
  PIT_EXEMPT_THRESHOLD,
  RENT_RELIEF_MAX,
  JOB_LOSS_COMPENSATION_EXEMPT_LIMIT,
  TaxBracket,
} from '@/config/taxConfig';

export interface IncomeSource {
  type: string;
  amount: number;
}

export interface Deduction {
  type: string;
  amount: number;
}

export interface BracketBreakdown {
  bracket: TaxBracket;
  taxableInBracket: number;
  taxForBracket: number;
}

export interface PITResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTax: number;
  netTakeHome: number;
  effectiveRate: number;
  isExempt: boolean;
  exemptReason?: string;
  bracketBreakdown: BracketBreakdown[];
  monthlyTax: number;
  monthlyNetPay: number;
}

/**
 * Calculate total gross income from all sources
 */
export function calculateGrossIncome(incomeSources: IncomeSource[]): number {
  return incomeSources.reduce((total, source) => total + source.amount, 0);
}

/**
 * Calculate total deductions with applicable limits
 */
export function calculateDeductions(
  deductions: Deduction[],
  grossIncome: number
): { total: number; applied: { type: string; amount: number; capped: boolean }[] } {
  const applied: { type: string; amount: number; capped: boolean }[] = [];
  let total = 0;

  for (const deduction of deductions) {
    let amount = deduction.amount;
    let capped = false;

    // Apply specific limits
    if (deduction.type === 'rent_relief' && amount > RENT_RELIEF_MAX) {
      amount = RENT_RELIEF_MAX;
      capped = true;
    }

    if (deduction.type === 'job_loss' && amount > JOB_LOSS_COMPENSATION_EXEMPT_LIMIT) {
      amount = JOB_LOSS_COMPENSATION_EXEMPT_LIMIT;
      capped = true;
    }

    // Pension is typically 8% of basic salary
    if (deduction.type === 'pension') {
      const maxPension = grossIncome * 0.08;
      if (amount > maxPension) {
        amount = maxPension;
        capped = true;
      }
    }

    applied.push({ type: deduction.type, amount, capped });
    total += amount;
  }

  // Total deductions cannot exceed gross income
  if (total > grossIncome) {
    total = grossIncome;
  }

  return { total, applied };
}

/**
 * Calculate tax using progressive brackets
 */
export function calculateProgressiveTax(taxableIncome: number): {
  totalTax: number;
  breakdown: BracketBreakdown[];
} {
  const breakdown: BracketBreakdown[] = [];
  let totalTax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of PIT_BRACKETS) {
    if (remainingIncome <= 0) {
      breakdown.push({
        bracket,
        taxableInBracket: 0,
        taxForBracket: 0,
      });
      continue;
    }

    const bracketMin = bracket.min;
    const bracketMax = bracket.max ?? Infinity;
    const bracketSize = bracketMax - bracketMin + 1;

    // For the first bracket (0%), we check if income falls within it
    if (bracket.rate === 0) {
      if (taxableIncome <= PIT_EXEMPT_THRESHOLD) {
        breakdown.push({
          bracket,
          taxableInBracket: taxableIncome,
          taxForBracket: 0,
        });
        remainingIncome = 0;
      } else {
        breakdown.push({
          bracket,
          taxableInBracket: PIT_EXEMPT_THRESHOLD,
          taxForBracket: 0,
        });
        remainingIncome = taxableIncome - PIT_EXEMPT_THRESHOLD;
      }
      continue;
    }

    // Calculate taxable amount in this bracket
    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    const taxForBracket = (taxableInBracket * bracket.rate) / 100;

    breakdown.push({
      bracket,
      taxableInBracket,
      taxForBracket,
    });

    totalTax += taxForBracket;
    remainingIncome -= taxableInBracket;
  }

  return { totalTax, breakdown };
}

/**
 * Main PIT calculation function
 */
export function calculatePIT(
  incomeSources: IncomeSource[],
  deductions: Deduction[],
  isResident: boolean = true
): PITResult {
  const grossIncome = calculateGrossIncome(incomeSources);
  const { total: totalDeductions } = calculateDeductions(deductions, grossIncome);
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  // Check if exempt
  if (taxableIncome <= PIT_EXEMPT_THRESHOLD) {
    return {
      grossIncome,
      totalDeductions,
      taxableIncome,
      totalTax: 0,
      netTakeHome: grossIncome - totalDeductions,
      effectiveRate: 0,
      isExempt: true,
      exemptReason: `Annual income of ${taxableIncome.toLocaleString()} is below ₦${PIT_EXEMPT_THRESHOLD.toLocaleString()} threshold`,
      bracketBreakdown: [{
        bracket: PIT_BRACKETS[0],
        taxableInBracket: taxableIncome,
        taxForBracket: 0,
      }],
      monthlyTax: 0,
      monthlyNetPay: (grossIncome - totalDeductions) / 12,
    };
  }

  // Calculate progressive tax
  const { totalTax, breakdown } = calculateProgressiveTax(taxableIncome);

  // Non-residents may have different treatment (simplified for this implementation)
  const finalTax = isResident ? totalTax : totalTax;

  const netTakeHome = grossIncome - totalDeductions - finalTax;
  const effectiveRate = grossIncome > 0 ? (finalTax / grossIncome) * 100 : 0;

  return {
    grossIncome,
    totalDeductions,
    taxableIncome,
    totalTax: finalTax,
    netTakeHome,
    effectiveRate,
    isExempt: false,
    bracketBreakdown: breakdown,
    monthlyTax: finalTax / 12,
    monthlyNetPay: netTakeHome / 12,
  };
}

/**
 * Quick tax estimate for a single annual income
 */
export function quickPITEstimate(annualIncome: number): PITResult {
  return calculatePIT([{ type: 'salary', amount: annualIncome }], []);
}
