/**
 * Nigerian Tax Configuration 2026
 * Based on laws signed June 26, 2025, effective January 1, 2026:
 * - Nigeria Tax Act (NTA)
 * - Nigeria Tax Administration Act (NTAA)
 * - Nigeria Revenue Service (Establishment) Act
 * - Joint Revenue Board Act
 */

// =============================================================================
// PERSONAL INCOME TAX (PIT/PAYE) CONFIGURATION
// =============================================================================

export interface TaxBracket {
  min: number;
  max: number | null; // null means unlimited
  rate: number; // percentage
  label: string;
}

/**
 * 2026 Progressive Tax Brackets for Personal Income Tax
 * Annual income thresholds in Naira (₦)
 */
export const PIT_BRACKETS: TaxBracket[] = [
  { min: 0, max: 800_000, rate: 0, label: "Tax-Exempt" },
  { min: 800_001, max: 3_000_000, rate: 15, label: "15% Bracket" },
  { min: 3_000_001, max: 12_000_000, rate: 18, label: "18% Bracket" },
  { min: 12_000_001, max: 25_000_000, rate: 21, label: "21% Bracket" },
  { min: 25_000_001, max: 50_000_000, rate: 23, label: "23% Bracket" },
  { min: 50_000_001, max: null, rate: 25, label: "25% Bracket (Maximum)" },
];

/**
 * Tax-exempt threshold - annual income below this amount is not taxed
 */
export const PIT_EXEMPT_THRESHOLD = 800_000;

/**
 * Maximum rate for individual capital gains under PIT brackets
 */
export const PIT_MAX_RATE = 25;

/**
 * Residency requirement - days present in Nigeria
 */
export const RESIDENCY_DAYS_THRESHOLD = 183;

/**
 * Job loss compensation exemption limit
 */
export const JOB_LOSS_COMPENSATION_EXEMPT_LIMIT = 50_000_000;

/**
 * Maximum rent relief deduction
 */
export const RENT_RELIEF_MAX = 500_000;

// =============================================================================
// CORPORATE INCOME TAX (CIT) CONFIGURATION
// =============================================================================

/**
 * Small company turnover threshold
 */
export const SMALL_COMPANY_TURNOVER_LIMIT = 100_000_000;

/**
 * CIT rate for regular companies (30%)
 */
export const CIT_RATE = 30;

/**
 * CIT rate for small companies (0%)
 */
export const SMALL_COMPANY_CIT_RATE = 0;

/**
 * Development Levy rate (4% of assessable profits)
 */
export const DEVELOPMENT_LEVY_RATE = 4;

/**
 * Minimum Effective Tax Rate for large multinationals (15%)
 * Based on OECD Pillar Two / GloBE rules
 */
export const MINIMUM_EFFECTIVE_TAX_RATE = 15;

// =============================================================================
// CAPITAL GAINS TAX (CGT) CONFIGURATION
// =============================================================================

/**
 * CGT rate for companies (30%)
 */
export const COMPANY_CGT_RATE = 30;

/**
 * CGT rate for small companies (0%)
 */
export const SMALL_COMPANY_CGT_RATE = 0;

/**
 * Individual CGT uses PIT progressive brackets (max 25%)
 */
export const INDIVIDUAL_CGT_MAX_RATE = 25;

// =============================================================================
// VALUE ADDED TAX (VAT) CONFIGURATION
// =============================================================================

/**
 * Standard VAT rate (7.5%)
 */
export const VAT_RATE = 7.5;

// =============================================================================
// COMPLIANCE & ADMINISTRATION CONFIGURATION
// =============================================================================

/**
 * Tax Identification Number (TIN) format pattern
 * Format: 10 digits with optional hyphen separators
 */
export const TIN_PATTERN = /^[0-9]{10}$|^[0-9]{8}-[0-9]{4}$/;

/**
 * Tax dispute resolution timeline (days)
 */
export const DISPUTE_RESOLUTION_DAYS = 90;

/**
 * Filing deadlines (informational)
 */
export const FILING_DEADLINES = {
  PAYE_MONTHLY: "10th of following month",
  ANNUAL_RETURNS_INDIVIDUAL: "March 31",
  ANNUAL_RETURNS_COMPANY: "6 months after accounting year-end",
  VAT_MONTHLY: "21st of following month",
};

/**
 * Penalty categories (informational)
 */
export const PENALTY_CATEGORIES = {
  FAILURE_TO_REGISTER: "Heavy financial penalties and potential prosecution",
  FAILURE_TO_FILE: "Penalty of ₦50,000 first month, ₦25,000 subsequent months",
  LATE_PAYMENT: "Interest at prevailing CBN MPR + 5% per annum",
  CONTRACT_WITHOUT_TIN: "Contract may be voided; both parties penalized",
};

/**
 * Income source types for PIT
 */
export const INCOME_SOURCES = [
  { id: "salary", label: "Salary & Wages", description: "Employment income" },
  { id: "bonus", label: "Bonuses & Allowances", description: "Performance bonuses, leave allowances, etc." },
  { id: "honorarium", label: "Honorarium", description: "Speaking fees, consulting fees" },
  { id: "prizes", label: "Prizes & Awards", description: "Cash prizes, competition winnings" },
  { id: "digital_assets", label: "Digital/Virtual Assets", description: "Cryptocurrency, NFTs, etc." },
  { id: "rental", label: "Rental Income", description: "Income from property letting" },
  { id: "other", label: "Other Income", description: "Any other taxable income" },
];

/**
 * Deduction types for PIT
 */
export const DEDUCTION_TYPES = [
  { id: "pension", label: "Pension Contribution", description: "Employee contribution to pension scheme", maxPercent: 8 },
  { id: "nhis", label: "NHIS Contribution", description: "National Health Insurance Scheme", maxPercent: 5 },
  { id: "nhf", label: "NHF Contribution", description: "National Housing Fund (2.5% of basic)", maxPercent: 2.5 },
  { id: "rent_relief", label: "Rent Relief", description: "Up to ₦500,000", maxAmount: 500_000 },
  { id: "job_loss", label: "Job Loss Compensation", description: "Exempt up to ₦50 million", maxAmount: 50_000_000 },
];
