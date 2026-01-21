/**
 * Supabase Client Configuration
 * 
 * PRODUCTION-READY CONFIGURATION
 * 
 * This file sets up the Supabase client for authentication and database operations.
 * Environment variables are used for security - never expose secrets in frontend code.
 * 
 * Setup Instructions:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Go to Settings > API to get your URL and anon key
 * 3. Add to Netlify Environment Variables:
 *    - VITE_SUPABASE_URL
 *    - VITE_SUPABASE_ANON_KEY
 * 4. For Netlify Functions, also add:
 *    - SUPABASE_URL (same as VITE_SUPABASE_URL)
 *    - SUPABASE_SERVICE_ROLE_KEY (from Settings > API > service_role)
 * 
 * SECURITY NOTES:
 * - The anon key is safe for client-side usage (protected by RLS)
 * - The service_role key should ONLY be used in Netlify Functions (server-side)
 * - Never commit .env files to version control
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment variables (Vite exposes them with VITE_ prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Track configuration status
const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.includes('supabase.co')
);

// Log configuration status in development only
if (import.meta.env.DEV && !isConfigured) {
  console.info(
    '%c⚠️ Supabase not configured',
    'color: #f59e0b; font-weight: bold;',
    '\n\nTo enable real authentication and data persistence:',
    '\n1. Create a Supabase project at https://supabase.com',
    '\n2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file',
    '\n3. Run the schema.sql in your Supabase SQL Editor',
    '\n\nThe app will use demo mode until configured.'
  );
}

/**
 * Supabase client instance
 * Uses the anon key which is safe for client-side usage
 * Row Level Security (RLS) protects data at the database level
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Persist session in localStorage
      persistSession: true,
      // Auto-refresh tokens before expiry
      autoRefreshToken: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
      // Storage key for session
      storageKey: 'ngtax-auth',
      // Flow type for OAuth
      flowType: 'pkce',
    },
    // Global options
    global: {
      headers: {
        'x-application-name': 'nigerian-tax-calculator',
      },
    },
    // Database options
    db: {
      schema: 'public',
    },
  }
);

/**
 * Check if Supabase is properly configured
 * Returns true only when valid credentials are provided
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

/**
 * Get the redirect URL for OAuth callbacks
 * Automatically handles different environments
 */
export function getRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/auth/callback`;
  }
  // Fallback for SSR or Netlify Functions
  return process.env.URL 
    ? `${process.env.URL}/auth/callback`
    : 'http://localhost:5173/auth/callback';
}

/**
 * Helper to handle Supabase errors consistently
 * Converts error objects to user-friendly messages
 */
export function handleSupabaseError(error: unknown): string {
  if (!error) return 'An unexpected error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error && typeof error === 'object') {
    // Supabase error format
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      const message = (error as { message: string }).message;
      
      // Map common errors to user-friendly messages
      const errorMap: Record<string, string> = {
        'JWT expired': 'Your session has expired. Please sign in again.',
        'Invalid login credentials': 'Invalid email or password.',
        'Email not confirmed': 'Please verify your email address.',
        'User already registered': 'An account with this email already exists.',
        'Password should be at least 6 characters': 'Password must be at least 6 characters.',
        'Email rate limit exceeded': 'Too many attempts. Please try again later.',
        'Invalid email': 'Please enter a valid email address.',
        'new row violates row-level security policy': 'You do not have permission to perform this action.',
      };
      
      return errorMap[message] || message;
    }
    
    // PostgrestError format
    if ('details' in error && typeof (error as { details: unknown }).details === 'string') {
      return (error as { details: string }).details;
    }
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if the current user is authenticated
 * Returns the user if authenticated, null otherwise
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Subscribe to realtime changes on a table
 * Useful for live updates to calculations or reminders
 */
export function subscribeToTable<T>(
  table: string,
  callback: (payload: { new: T; old: T | null; eventType: string }) => void,
  filter?: { column: string; value: string }
) {
  let channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
      },
      (payload) => {
        callback({
          new: payload.new as T,
          old: payload.old as T | null,
          eventType: payload.eventType,
        });
      }
    );
  
  channel = channel.subscribe();
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
