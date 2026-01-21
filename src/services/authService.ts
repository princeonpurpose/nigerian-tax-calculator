/**
 * Authentication Service
 * Handles user authentication, session management, and validation
 * 
 * NOTE: This is a client-side mock implementation for demonstration.
 * In production, replace with actual backend API calls (Supabase, Firebase, etc.)
 */

import { 
  User, 
  LoginCredentials, 
  SignupCredentials, 
  AuthSession, 
  PasswordValidation,
  AuthProvider 
} from '@/types/auth';

// Storage keys
const USER_STORAGE_KEY = 'ngtax_user';
const SESSION_STORAGE_KEY = 'ngtax_session';

// Simulated users database (in production, this would be your backend)
const mockUsersDB: Map<string, { user: User; passwordHash: string }> = new Map();

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; message: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  
  return { valid: true, message: '' };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    strength = 'strong';
  } else if (errors.length <= 2) {
    strength = 'medium';
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Simple password hashing (in production, use bcrypt on backend)
 */
function simpleHash(password: string): string {
  // This is NOT secure - for demo only
  // In production, hashing should happen on the backend with bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Generate mock tokens
 */
function generateTokens(): AuthSession {
  const now = Date.now();
  return {
    accessToken: `at_${now}_${Math.random().toString(36).substr(2, 9)}`,
    refreshToken: `rt_${now}_${Math.random().toString(36).substr(2, 9)}`,
    expiresAt: now + (24 * 60 * 60 * 1000) // 24 hours
  };
}

/**
 * Generate user ID
 */
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(credentials: SignupCredentials): Promise<{ user: User; session: AuthSession }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Validate inputs
  const emailValidation = validateEmail(credentials.email);
  if (!emailValidation.valid) {
    throw new Error(emailValidation.message);
  }
  
  const passwordValidation = validatePassword(credentials.password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors[0]);
  }
  
  if (!credentials.displayName || credentials.displayName.trim().length < 2) {
    throw new Error('Display name must be at least 2 characters');
  }
  
  // Check if user exists
  if (mockUsersDB.has(credentials.email.toLowerCase())) {
    throw new Error('An account with this email already exists');
  }
  
  // Create user
  const now = new Date();
  const user: User = {
    id: generateUserId(),
    email: credentials.email.toLowerCase(),
    displayName: credentials.displayName.trim(),
    role: 'individual',
    provider: 'email',
    createdAt: now,
    lastLoginAt: now,
    isEmailVerified: false
  };
  
  // Store in mock DB
  mockUsersDB.set(user.email, {
    user,
    passwordHash: simpleHash(credentials.password)
  });
  
  // Generate session
  const session = generateTokens();
  
  // Persist to storage
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  
  return { user, session };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(credentials: LoginCredentials): Promise<{ user: User; session: AuthSession }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Validate inputs
  const emailValidation = validateEmail(credentials.email);
  if (!emailValidation.valid) {
    throw new Error(emailValidation.message);
  }
  
  if (!credentials.password) {
    throw new Error('Password is required');
  }
  
  // Check user exists
  const storedUser = mockUsersDB.get(credentials.email.toLowerCase());
  if (!storedUser) {
    throw new Error('Invalid email or password');
  }
  
  // Verify password
  if (storedUser.passwordHash !== simpleHash(credentials.password)) {
    throw new Error('Invalid email or password');
  }
  
  // Update last login
  const user: User = {
    ...storedUser.user,
    lastLoginAt: new Date()
  };
  mockUsersDB.set(user.email, { ...storedUser, user });
  
  // Generate session
  const session = generateTokens();
  
  // Persist to storage
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  
  return { user, session };
}

/**
 * Sign in with Google (mock implementation)
 * In production, use Google OAuth 2.0 flow
 */
export async function signInWithGoogle(): Promise<{ user: User; session: AuthSession }> {
  // Simulate OAuth popup and delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Mock Google user data
  const googleEmail = `user${Date.now()}@gmail.com`;
  const googleName = 'Google User';
  
  // Check if user exists or create new
  let user: User;
  const existingUser = mockUsersDB.get(googleEmail);
  
  if (existingUser) {
    user = {
      ...existingUser.user,
      lastLoginAt: new Date()
    };
    mockUsersDB.set(googleEmail, { ...existingUser, user });
  } else {
    const now = new Date();
    user = {
      id: generateUserId(),
      email: googleEmail,
      displayName: googleName,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(googleName)}&background=16a34a&color=fff`,
      role: 'individual',
      provider: 'google' as AuthProvider,
      createdAt: now,
      lastLoginAt: now,
      isEmailVerified: true // Google emails are verified
    };
    mockUsersDB.set(googleEmail, { user, passwordHash: '' });
  }
  
  // Generate session
  const session = generateTokens();
  
  // Persist to storage
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  
  return { user, session };
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Clear storage
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Get current session from storage
 */
export function getCurrentSession(): { user: User | null; session: AuthSession | null } {
  try {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (!userStr || !sessionStr) {
      return { user: null, session: null };
    }
    
    const user = JSON.parse(userStr) as User;
    const session = JSON.parse(sessionStr) as AuthSession;
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      // Auto-logout on expiration
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return { user: null, session: null };
    }
    
    // Restore Date objects
    user.createdAt = new Date(user.createdAt);
    user.lastLoginAt = new Date(user.lastLoginAt);
    
    return { user, session };
  } catch {
    return { user: null, session: null };
  }
}

/**
 * Check if a feature requires authentication
 */
export function isProtectedFeature(feature: string): boolean {
  const protectedFeatures = [
    'save_calculation',
    'view_history',
    'download_pdf',
    'subscription',
    'premium_features'
  ];
  return protectedFeatures.includes(feature);
}

/**
 * Rate limiting for login attempts (simple in-memory implementation)
 */
const loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(email: string): { allowed: boolean; waitTime: number } {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(key);
  
  if (!record) {
    return { allowed: true, waitTime: 0 };
  }
  
  // Reset if lockout period has passed
  if (now - record.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(key);
    return { allowed: true, waitTime: 0 };
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    const waitTime = LOCKOUT_DURATION - (now - record.lastAttempt);
    return { allowed: false, waitTime };
  }
  
  return { allowed: true, waitTime: 0 };
}

export function recordLoginAttempt(email: string, success: boolean): void {
  const key = email.toLowerCase();
  const now = Date.now();
  
  if (success) {
    loginAttempts.delete(key);
    return;
  }
  
  const record = loginAttempts.get(key);
  if (record) {
    record.count += 1;
    record.lastAttempt = now;
  } else {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
  }
}
