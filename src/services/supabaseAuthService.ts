/**
 * Supabase Authentication Service
 * 
 * PRODUCTION-READY IMPLEMENTATION
 * 
 * Handles authentication using Supabase Auth with:
 * - Email/password signup and login
 * - Google OAuth (requires Google Cloud Console setup)
 * - Session management with automatic refresh
 * - Profile management
 * 
 * SETUP INSTRUCTIONS FOR GOOGLE OAUTH:
 * 
 * 1. Go to Google Cloud Console: https://console.cloud.google.com
 * 2. Create a new project or select existing
 * 3. Enable Google+ API and Google Identity API
 * 4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
 * 5. Set Application type to "Web application"
 * 6. Add Authorized JavaScript origins:
 *    - http://localhost:5173 (development)
 *    - https://your-app.netlify.app (production)
 * 7. Add Authorized redirect URIs:
 *    - http://localhost:5173/auth/callback
 *    - https://your-app.netlify.app/auth/callback
 *    - https://YOUR_PROJECT.supabase.co/auth/v1/callback
 * 8. Copy Client ID and Client Secret
 * 9. In Supabase Dashboard > Authentication > Providers > Google:
 *    - Enable Google provider
 *    - Paste Client ID and Client Secret
 * 
 * FALLBACK BEHAVIOR:
 * When Supabase is not configured, the service falls back to demo mode
 * with mock authentication for development/preview purposes.
 */

import { supabase, isSupabaseConfigured, getRedirectUrl } from '@/lib/supabase';
import type { User as AppUser, AuthSession } from '@/types/auth';
import type { AuthError, Session, User } from '@supabase/supabase-js';

/**
 * Convert Supabase user to app user format
 * Merges auth data with profile data for complete user object
 */
function toAppUser(
  user: User, 
  profile?: { display_name?: string; photo_url?: string; role?: string }
): AppUser {
  return {
    id: user.id,
    email: user.email || '',
    displayName: 
      profile?.display_name || 
      user.user_metadata?.display_name || 
      user.user_metadata?.full_name || 
      user.user_metadata?.name ||
      user.email?.split('@')[0] || 
      'User',
    photoURL: 
      profile?.photo_url || 
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture,
    role: (profile?.role || 'individual') as AppUser['role'],
    provider: user.app_metadata?.provider === 'google' ? 'google' : 'email',
    createdAt: new Date(user.created_at),
    lastLoginAt: new Date(user.last_sign_in_at || user.created_at),
    isEmailVerified: user.email_confirmed_at !== null,
  };
}

/**
 * Convert Supabase session to app session format
 */
function toAppSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000,
  };
}

/**
 * Fetch user profile from database
 */
async function fetchProfile(userId: string): Promise<{ display_name?: string; photo_url?: string; role?: string } | null> {
  if (!isSupabaseConfigured()) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('display_name, photo_url, role')
    .eq('id', userId)
    .single();
  
  return data;
}

/**
 * Sign up with email and password
 * Creates a new user account and profile
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: AppUser; session: AuthSession }> {
  // Fallback to demo mode if Supabase not configured
  if (!isSupabaseConfigured()) {
    const { signUpWithEmail: mockSignUp } = await import('./authService');
    return mockSignUp({ email, password, displayName });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: getRedirectUrl(),
    },
  });

  if (error) throw new Error(handleAuthError(error));
  if (!data.user) throw new Error('Signup failed - please try again');
  
  // For email confirmation flow, session might be null initially
  if (!data.session) {
    // User needs to confirm email
    throw new Error('Please check your email to confirm your account');
  }

  return {
    user: toAppUser(data.user, { display_name: displayName }),
    session: toAppSession(data.session),
  };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: AppUser; session: AuthSession }> {
  // Fallback to demo mode if Supabase not configured
  if (!isSupabaseConfigured()) {
    const { signInWithEmail: mockSignIn } = await import('./authService');
    return mockSignIn({ email, password });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(handleAuthError(error));
  if (!data.user || !data.session) throw new Error('Login failed - please try again');

  // Fetch profile for additional data
  const profile = await fetchProfile(data.user.id);

  return {
    user: toAppUser(data.user, profile || undefined),
    session: toAppSession(data.session),
  };
}

/**
 * Sign in with Google OAuth
 * Redirects to Google for authentication
 */
export async function signInWithGoogle(): Promise<void> {
  // Fallback to demo mode if Supabase not configured
  if (!isSupabaseConfigured()) {
    const { signInWithGoogle: mockGoogleSignIn } = await import('./authService');
    await mockGoogleSignIn();
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl(),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      scopes: 'openid email profile',
    },
  });

  if (error) throw new Error(handleAuthError(error));
  // OAuth will redirect - no return value needed
}

/**
 * Sign out current user
 * Clears session from both client and server
 */
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    const { signOut: mockSignOut } = await import('./authService');
    return mockSignOut();
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(handleAuthError(error));
}

/**
 * Get current session
 * Returns null if not authenticated
 */
export async function getCurrentSession(): Promise<{ user: AppUser | null; session: AuthSession | null }> {
  if (!isSupabaseConfigured()) {
    const { getCurrentSession: mockGetSession } = await import('./authService');
    return mockGetSession();
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { user: null, session: null };
  }

  // Fetch profile for additional data
  const profile = await fetchProfile(session.user.id);

  return {
    user: toAppUser(session.user, profile || undefined),
    session: toAppSession(session),
  };
}

/**
 * Refresh the current session
 * Called automatically by Supabase, but can be triggered manually
 */
export async function refreshSession(): Promise<{ user: AppUser | null; session: AuthSession | null }> {
  if (!isSupabaseConfigured()) {
    return getCurrentSession();
  }

  const { data: { session }, error } = await supabase.auth.refreshSession();
  
  if (error || !session) {
    return { user: null, session: null };
  }

  const profile = await fetchProfile(session.user.id);

  return {
    user: toAppUser(session.user, profile || undefined),
    session: toAppSession(session),
  };
}

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export function onAuthStateChange(
  callback: (user: AppUser | null, session: AuthSession | null) => void
): () => void {
  if (!isSupabaseConfigured()) {
    // Demo mode doesn't support real-time updates
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      callback(null, null);
      return;
    }
    
    if (session?.user) {
      // Fetch profile on auth state change
      const profile = await fetchProfile(session.user.id);
      callback(
        toAppUser(session.user, profile || undefined),
        toAppSession(session)
      );
    } else {
      callback(null, null);
    }
  });

  return () => subscription.unsubscribe();
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    // Demo mode - just simulate success
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw new Error(handleAuthError(error));
}

/**
 * Update user password
 * Requires user to be authenticated
 */
export async function updatePassword(newPassword: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    // Demo mode - just simulate success
    await new Promise(resolve => setTimeout(resolve, 500));
    return;
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(handleAuthError(error));
}

/**
 * Update user profile
 */
export async function updateProfile(updates: {
  displayName?: string;
  photoUrl?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: updates.displayName,
      photo_url: updates.photoUrl,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', user.id);

  if (error) throw new Error(error.message);
}

/**
 * Handle auth errors with user-friendly messages
 */
function handleAuthError(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email address before signing in',
    'User already registered': 'An account with this email already exists',
    'Password should be at least 6 characters': 'Password must be at least 6 characters',
    'Email rate limit exceeded': 'Too many attempts. Please try again later',
    'Invalid email': 'Please enter a valid email address',
    'Signup requires a valid password': 'Please enter a valid password',
    'User not found': 'No account found with this email',
    'Invalid Refresh Token: Refresh Token Not Found': 'Session expired. Please sign in again',
  };

  return errorMessages[error.message] || error.message || 'An error occurred';
}
