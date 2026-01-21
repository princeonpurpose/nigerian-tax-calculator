/**
 * Validation utilities for Nigerian Tax Calculator
 */

import { TIN_PATTERN, RESIDENCY_DAYS_THRESHOLD } from '@/config/taxConfig';

/**
 * Validate Tax Identification Number (TIN) format
 * Format: 10 digits or 8 digits-4 digits
 */
export function validateTIN(tin: string): { valid: boolean; message: string } {
  if (!tin || tin.trim() === '') {
    return { valid: false, message: 'TIN is required for tax compliance' };
  }

  const cleanedTIN = tin.replace(/[\s-]/g, '');
  
  if (!/^\d+$/.test(cleanedTIN)) {
    return { valid: false, message: 'TIN must contain only numbers' };
  }

  if (cleanedTIN.length !== 10 && cleanedTIN.length !== 12) {
    return { valid: false, message: 'TIN must be 10 or 12 digits' };
  }

  if (TIN_PATTERN.test(tin.replace(/\s/g, ''))) {
    return { valid: true, message: 'Valid TIN format' };
  }

  // Additional format check
  if (cleanedTIN.length === 10 || cleanedTIN.length === 12) {
    return { valid: true, message: 'Valid TIN format' };
  }

  return { valid: false, message: 'Invalid TIN format' };
}

/**
 * Determine residency status based on days in Nigeria
 */
export function determineResidency(daysInNigeria: number, hasEconomicTies: boolean = false): {
  isResident: boolean;
  reason: string;
} {
  if (daysInNigeria >= RESIDENCY_DAYS_THRESHOLD) {
    return {
      isResident: true,
      reason: `Resident: Present in Nigeria for ${daysInNigeria} days (≥${RESIDENCY_DAYS_THRESHOLD} days threshold)`
    };
  }

  if (hasEconomicTies) {
    return {
      isResident: true,
      reason: 'Resident: Strong economic/family ties to Nigeria'
    };
  }

  return {
    isResident: false,
    reason: `Non-Resident: Present in Nigeria for only ${daysInNigeria} days (<${RESIDENCY_DAYS_THRESHOLD} days threshold)`
  };
}

/**
 * Validate company turnover for classification
 */
export function validateTurnover(turnover: number): { valid: boolean; message: string } {
  if (turnover < 0) {
    return { valid: false, message: 'Turnover cannot be negative' };
  }

  if (turnover === 0) {
    return { valid: false, message: 'Please enter company turnover' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate income input
 */
export function validateIncome(income: number): { valid: boolean; message: string } {
  if (income < 0) {
    return { valid: false, message: 'Income cannot be negative' };
  }

  return { valid: true, message: '' };
}

/**
 * Validate deduction does not exceed income
 */
export function validateDeduction(deduction: number, income: number): { valid: boolean; message: string } {
  if (deduction < 0) {
    return { valid: false, message: 'Deduction cannot be negative' };
  }

  if (deduction > income) {
    return { valid: false, message: 'Deductions cannot exceed gross income' };
  }

  return { valid: true, message: '' };
}
