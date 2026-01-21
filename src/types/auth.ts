/**
 * Authentication Types
 * Defines user, session, and auth state types
 */

export type UserRole = 'individual' | 'business' | 'admin';

export type AuthProvider = 'email' | 'google';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  provider: AuthProvider;
  createdAt: Date;
  lastLoginAt: Date;
  tinNumber?: string;
  isEmailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

// Protected feature types
export type ProtectedFeature = 
  | 'save_calculation'
  | 'view_history'
  | 'download_pdf'
  | 'subscription'
  | 'premium_features';

export interface ProtectedActionContext {
  feature: ProtectedFeature;
  returnPath?: string;
  pendingAction?: () => void;
}
