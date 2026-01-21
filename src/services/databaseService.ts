/**
 * Database Service
 * 
 * Handles all database operations for calculations, profiles, and subscriptions.
 * Uses Supabase as the backend with Row Level Security (RLS) for data protection.
 */

import { supabase, isSupabaseConfigured, handleSupabaseError } from '@/lib/supabase';
import type {
  Calculation,
  CalculationInsert,
  CalculationType,
  Profile,
  ProfileUpdate,
  Subscription,
  CalculationData,
} from '@/types/database';

// =============================================================================
// CALCULATIONS CRUD
// =============================================================================

/**
 * Save a new calculation
 */
export async function saveCalculation(
  userId: string,
  data: CalculationData,
  notes?: string
): Promise<{ data: Calculation | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    // Mock implementation when Supabase is not configured
    console.log('Mock: Saving calculation', { userId, data, notes });
    const mockCalculation: Calculation = {
      id: `calc_${Date.now()}`,
      user_id: userId,
      type: data.type,
      inputs: data.inputs as Calculation['inputs'],
      results: data.results as Calculation['results'],
      notes: notes || null,
      is_saved: false,
      created_at: new Date().toISOString(),
    };
    return { data: mockCalculation, error: null };
  }

  try {
    const insert: CalculationInsert = {
      user_id: userId,
      type: data.type,
      inputs: data.inputs,
      results: data.results,
      notes,
    };

    const { data: calculation, error } = await supabase
      .from('calculations')
      .insert(insert as never)
      .select()
      .single();

    if (error) throw error;
    return { data: calculation, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
}

/**
 * Fetch user's calculation history
 */
export async function getCalculationHistory(
  userId: string,
  options?: {
    type?: CalculationType;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: Calculation[]; error: string | null; count: number }> {
  if (!isSupabaseConfigured()) {
    // Mock implementation
    console.log('Mock: Fetching calculation history', { userId, options });
    return { data: [], error: null, count: 0 };
  }

  try {
    let query = supabase
      .from('calculations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], error: null, count: count || 0 };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error), count: 0 };
  }
}

/**
 * Get a single calculation by ID
 */
export async function getCalculation(
  calculationId: string
): Promise<{ data: Calculation | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    console.log('Mock: Fetching calculation', { calculationId });
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('calculations')
      .select('*')
      .eq('id', calculationId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
}

/**
 * Delete a calculation
 */
export async function deleteCalculation(
  calculationId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    console.log('Mock: Deleting calculation', { calculationId });
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('calculations')
      .delete()
      .eq('id', calculationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
}

/**
 * Update calculation notes
 */
export async function updateCalculationNotes(
  calculationId: string,
  notes: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    console.log('Mock: Updating calculation notes', { calculationId, notes });
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('calculations')
      .update({ notes } as never)
      .eq('id', calculationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
}

/**
 * Toggle saved status of a calculation
 */
export async function toggleSaveCalculation(
  calculationId: string,
  isSaved: boolean
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    console.log('Mock: Toggling save status', { calculationId, isSaved });
    return { success: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('calculations')
      .update({ is_saved: isSaved } as never)
      .eq('id', calculationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error) };
  }
}

/**
 * Fetch user's saved calculations
 */
export async function getSavedCalculations(
  userId: string,
  options?: {
    type?: CalculationType;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: Calculation[]; error: string | null; count: number }> {
  if (!isSupabaseConfigured()) {
    console.log('Mock: Fetching saved calculations', { userId, options });
    return { data: [], error: null, count: 0 };
  }

  try {
    let query = supabase
      .from('calculations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_saved', true)
      .order('created_at', { ascending: false });

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], error: null, count: count || 0 };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error), count: 0 };
  }
}

// =============================================================================
// USER PROFILE
// =============================================================================

/**
 * Get user profile
 */
export async function getProfile(
  userId: string
): Promise<{ data: Profile | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    console.log('Mock: Fetching profile', { userId });
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<{ data: Profile | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    console.log('Mock: Updating profile', { userId, updates });
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() } as never)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

/**
 * Get user subscription
 */
export async function getSubscription(
  userId: string
): Promise<{ data: Subscription | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    console.log('Mock: Fetching subscription', { userId });
    // Return mock free subscription
    return {
      data: {
        id: `sub_${userId}`,
        user_id: userId,
        plan: 'free',
        status: 'active',
        payment_provider: null,
        payment_reference: null,
        started_at: new Date().toISOString(),
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(
  userId: string,
  requiredPlan?: string[]
): Promise<boolean> {
  const { data } = await getSubscription(userId);
  
  if (!data) return false;
  if (data.status !== 'active' && data.status !== 'trial') return false;
  
  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }
  
  // Check required plan
  if (requiredPlan && !requiredPlan.includes(data.plan)) {
    return false;
  }
  
  return true;
}

// =============================================================================
// CALCULATION EXPORT (PDF-Ready)
// =============================================================================

/**
 * Format calculation for PDF export
 * Returns a structured object ready for PDF generation
 */
export function formatCalculationForExport(calculation: Calculation): {
  type: string;
  title: string;
  date: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  summary: { label: string; value: string }[];
} {
  const typeLabels: Record<CalculationType, string> = {
    pit: 'Personal Income Tax (PIT/PAYE)',
    cit: 'Corporate Income Tax (CIT)',
    cgt: 'Capital Gains Tax (CGT)',
    vat: 'Value Added Tax (VAT)',
  };

  const results = calculation.results as Record<string, unknown>;
  const summary: { label: string; value: string }[] = [];

  // Build summary based on calculation type
  switch (calculation.type) {
    case 'pit':
      summary.push(
        { label: 'Gross Income', value: formatNaira(results.grossIncome as number) },
        { label: 'Total Deductions', value: formatNaira(results.totalDeductions as number) },
        { label: 'Taxable Income', value: formatNaira(results.taxableIncome as number) },
        { label: 'Total Tax', value: formatNaira(results.totalTax as number) },
        { label: 'Net Take-Home', value: formatNaira(results.netTakeHome as number) }
      );
      break;
    case 'cit':
      summary.push(
        { label: 'CIT Amount', value: formatNaira(results.citAmount as number) },
        { label: 'Development Levy', value: formatNaira(results.developmentLevy as number) },
        { label: 'Total Tax Payable', value: formatNaira(results.totalTaxPayable as number) }
      );
      break;
    case 'cgt':
      summary.push(
        { label: 'Capital Gain', value: formatNaira(results.capitalGain as number) },
        { label: 'CGT Amount', value: formatNaira(results.cgtAmount as number) },
        { label: 'Net Proceeds', value: formatNaira(results.netProceeds as number) }
      );
      break;
    case 'vat':
      if (results.netVAT !== undefined) {
        summary.push(
          { label: 'Output VAT', value: formatNaira(results.outputVAT as number || 0) },
          { label: 'Input VAT', value: formatNaira(results.inputVAT as number || 0) },
          { label: 'Net VAT', value: formatNaira(results.netVAT as number) }
        );
      } else {
        summary.push(
          { label: 'Net Amount', value: formatNaira(results.netAmount as number || 0) },
          { label: 'VAT Amount', value: formatNaira(results.vatAmount as number || 0) },
          { label: 'Gross Amount', value: formatNaira(results.grossAmount as number || 0) }
        );
      }
      break;
  }

  return {
    type: calculation.type,
    title: typeLabels[calculation.type],
    date: new Date(calculation.created_at).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    inputs: calculation.inputs as Record<string, unknown>,
    results,
    summary,
  };
}

/**
 * Helper to format currency
 */
function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount).replace('NGN', '₦');
}
