/**
 * Authentication Context
 * Provides auth state and methods throughout the application
 * 
 * Uses Supabase Auth when configured, falls back to mock auth otherwise.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  AuthState, 
  LoginCredentials, 
  SignupCredentials,
  ProtectedFeature,
  ProtectedActionContext 
} from '@/types/auth';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as authSignOut,
  getCurrentSession,
  onAuthStateChange,
} from '@/services/supabaseAuthService';
import {
  checkRateLimit,
  recordLoginAttempt
} from '@/services/authService';

interface AuthContextType extends AuthState {
  // Auth methods
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Protected action handling
  pendingAction: ProtectedActionContext | null;
  setPendingAction: (action: ProtectedActionContext | null) => void;
  requireAuth: (feature: ProtectedFeature, action?: () => void) => boolean;
  executePendingAction: () => void;
  
  // Modal state
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMode: 'login' | 'signup';
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  
  // Clear error
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  const [pendingAction, setPendingAction] = useState<ProtectedActionContext | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Initialize auth state from storage/Supabase
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { user } = await getCurrentSession();
        setAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    };

    initAuth();

    // Subscribe to auth state changes (for Supabase real-time updates)
    const unsubscribe = onAuthStateChange((user) => {
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }));
    });

    return () => unsubscribe();
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check rate limit
      const { allowed, waitTime } = checkRateLimit(credentials.email);
      if (!allowed) {
        const minutes = Math.ceil(waitTime / 60000);
        throw new Error(`Too many login attempts. Please try again in ${minutes} minute(s).`);
      }
      
      const { user } = await signInWithEmail(credentials.email, credentials.password);
      recordLoginAttempt(credentials.email, true);
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      setShowAuthModal(false);
    } catch (error) {
      recordLoginAttempt(credentials.email, false);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      throw error;
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user } = await signUpWithEmail(
        credentials.email, 
        credentials.password, 
        credentials.displayName
      );
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      setShowAuthModal(false);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      }));
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // This will redirect to Google OAuth
      await signInWithGoogle();
      
      // For mock implementation or after redirect, session will be handled by onAuthStateChange
      // For now, get current session after mock Google login
      const { user } = await getCurrentSession();
      
      if (user) {
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        setShowAuthModal(false);
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Google login failed'
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authSignOut();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      setPendingAction(null);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }));
    }
  }, []);

  const requireAuth = useCallback((feature: ProtectedFeature, action?: () => void): boolean => {
    if (authState.isAuthenticated) {
      return true;
    }
    
    // Store pending action and show auth modal
    setPendingAction({
      feature,
      pendingAction: action
    });
    setAuthModalMode('login');
    setShowAuthModal(true);
    
    return false;
  }, [authState.isAuthenticated]);

  const executePendingAction = useCallback(() => {
    if (pendingAction?.pendingAction && authState.isAuthenticated) {
      pendingAction.pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction, authState.isAuthenticated]);

  // Execute pending action after successful auth
  useEffect(() => {
    if (authState.isAuthenticated && pendingAction?.pendingAction) {
      executePendingAction();
    }
  }, [authState.isAuthenticated, pendingAction, executePendingAction]);

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    loginWithGoogle,
    logout,
    pendingAction,
    setPendingAction,
    requireAuth,
    executePendingAction,
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
