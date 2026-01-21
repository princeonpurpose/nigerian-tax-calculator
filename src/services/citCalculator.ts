/**
 * Corporate Income Tax (CIT) Calculator Service
 * Based on Nigeria Tax Act 2026
 */

import {
  SMALL_COMPANY_TURNOVER_LIMIT,
  CIT_RATE,
  SMALL_COMPANY_CIT_RATE,
  DEVELOPMENT_LEVY_RATE,
  MINIMUM_EFFECTIVE_TAX_RATE,
} from '@/config/taxConfig';

export type CompanySize = 'small' | 'other';
export type CompanyType = 'domestic' | 'multinational';

export interface CITInput {
  turnover: number;
  assessableProfits: number;
  companyType: CompanyType;
  isMultinationalSubject: boolean; // Subject to Pillar Two / GloBE rules
  foreignProfits?: number; // For CFC rules
  distributedForeignProfits?: number;
}

export interface CITResult {
  companySize: CompanySize;
  turnover: number;
  assessableProfits: number;
  citRate: number;
  citAmount: number;
  developmentLevy: number;
  totalTaxBeforeTopUp: number;
  effectiveTaxRate: number;
  minimumTaxTopUp: number;
  cfcTax: number;
  totalTaxPayable: number;
  breakdown: {
    label: string;
    amount: number;
    rate?: number;
    note?: string;
  }[];
}

/**
 * Determine company size based on turnover
 */
export function determineCompanySize(turnover: number): CompanySize {
  return turnover <= SMALL_COMPANY_TURNOVER_LIMIT ? 'small' : 'other';
}

/**
 * Calculate CIT for small companies (0% rate)
 */
function calculateSmallCompanyCIT(input: CITInput): CITResult {
  return {
    companySize: 'small',
    turnover: input.turnover,
    assessableProfits: input.assessableProfits,
    citRate: SMALL_COMPANY_CIT_RATE,
    citAmount: 0,
    developmentLevy: 0, // Small companies exempt from development levy
    totalTaxBeforeTopUp: 0,
    effectiveTaxRate: 0,
    minimumTaxTopUp: 0,
    cfcTax: 0,
    totalTaxPayable: 0,
    breakdown: [
      {
        label: 'Company Classification',
        amount: 0,
        note: `Small Company (Turnover ≤ ₦${SMALL_COMPANY_TURNOVER_LIMIT.toLocaleString()})`,
      },
      {
        label: 'Corporate Income Tax',
        amount: 0,
        rate: SMALL_COMPANY_CIT_RATE,
        note: '0% CIT rate for small companies',
      },
      {
        label: 'Development Levy',
        amount: 0,
        rate: 0,
        note: 'Exempt for small companies',
      },
    ],
  };
}

/**
 * Calculate Minimum Effective Tax Rate top-up for multinationals
 * Based on OECD Pillar Two / GloBE rules
 */
function calculateMinimumTaxTopUp(
  assessableProfits: number,
  currentTax: number,
  isSubjectToMETR: boolean
): number {
  if (!isSubjectToMETR || assessableProfits <= 0) {
    return 0;
  }

  const currentEffectiveRate = (currentTax / assessableProfits) * 100;
  
  if (currentEffectiveRate >= MINIMUM_EFFECTIVE_TAX_RATE) {
    return 0;
  }

  // Calculate top-up to reach 15% minimum
  const minimumTax = (assessableProfits * MINIMUM_EFFECTIVE_TAX_RATE) / 100;
  return minimumTax - currentTax;
}

/**
 * Calculate Controlled Foreign Company (CFC) tax
 * Tax on undistributed foreign profits
 */
function calculateCFCTax(
  foreignProfits: number = 0,
  distributedProfits: number = 0
): number {
  const undistributedProfits = Math.max(0, foreignProfits - distributedProfits);
  // CFC tax at CIT rate on undistributed profits
  return (undistributedProfits * CIT_RATE) / 100;
}

/**
 * Main CIT calculation function for other (non-small) companies
 */
function calculateOtherCompanyCIT(input: CITInput): CITResult {
  const breakdown: CITResult['breakdown'] = [];

  // CIT at 30%
  const citAmount = (input.assessableProfits * CIT_RATE) / 100;
  breakdown.push({
    label: 'Corporate Income Tax',
    amount: citAmount,
    rate: CIT_RATE,
    note: `${CIT_RATE}% on assessable profits`,
  });

  // Development Levy at 4%
  const developmentLevy = (input.assessableProfits * DEVELOPMENT_LEVY_RATE) / 100;
  breakdown.push({
    label: 'Development Levy',
    amount: developmentLevy,
    rate: DEVELOPMENT_LEVY_RATE,
    note: `${DEVELOPMENT_LEVY_RATE}% of assessable profits`,
  });

  const totalTaxBeforeTopUp = citAmount + developmentLevy;

  // Minimum Effective Tax Rate top-up for multinationals
  const minimumTaxTopUp = calculateMinimumTaxTopUp(
    input.assessableProfits,
    totalTaxBeforeTopUp,
    input.isMultinationalSubject
  );

  if (input.isMultinationalSubject) {
    breakdown.push({
      label: 'Minimum Tax Top-Up (METR 15%)',
      amount: minimumTaxTopUp,
      rate: MINIMUM_EFFECTIVE_TAX_RATE,
      note: minimumTaxTopUp > 0 
        ? 'Top-up applied to meet 15% minimum effective rate'
        : 'No top-up needed - effective rate already ≥15%',
    });
  }

  // CFC Tax on undistributed foreign profits
  const cfcTax = calculateCFCTax(input.foreignProfits, input.distributedForeignProfits);
  if (input.foreignProfits && input.foreignProfits > 0) {
    breakdown.push({
      label: 'CFC Tax (Foreign Profits)',
      amount: cfcTax,
      rate: CIT_RATE,
      note: 'Tax on undistributed foreign subsidiary profits',
    });
  }

  const totalTaxPayable = totalTaxBeforeTopUp + minimumTaxTopUp + cfcTax;
  const effectiveTaxRate = input.assessableProfits > 0 
    ? (totalTaxPayable / input.assessableProfits) * 100 
    : 0;

  return {
    companySize: 'other',
    turnover: input.turnover,
    assessableProfits: input.assessableProfits,
    citRate: CIT_RATE,
    citAmount,
    developmentLevy,
    totalTaxBeforeTopUp,
    effectiveTaxRate,
    minimumTaxTopUp,
    cfcTax,
    totalTaxPayable,
    breakdown,
  };
}

/**
 * Main CIT calculation entry point
 */
export function calculateCIT(input: CITInput): CITResult {
  const companySize = determineCompanySize(input.turnover);

  if (companySize === 'small') {
    return calculateSmallCompanyCIT(input);
  }

  return calculateOtherCompanyCIT(input);
}

/**
 * Quick CIT estimate for simple cases
 */
export function quickCITEstimate(turnover: number, profits: number): CITResult {
  return calculateCIT({
    turnover,
    assessableProfits: profits,
    companyType: 'domestic',
    isMultinationalSubject: false,
  });
}
