/**
 * Authentication Modal
 * Shows login/signup forms when users attempt protected actions
 */

import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword } from '@/services/authService';
import { ProtectedFeature } from '@/types/auth';

const featureMessages: Record<ProtectedFeature, { title: string; description: string }> = {
  save_calculation: {
    title: 'Save Your Calculations',
    description: 'Create an account to save your tax calculations and access them anytime.'
  },
  view_history: {
    title: 'View Calculation History',
    description: 'Sign in to view your past tax calculations and track changes over time.'
  },
  download_pdf: {
    title: 'Download PDF Reports',
    description: 'Create an account to download professional PDF tax reports.'
  },
  subscription: {
    title: 'Manage Subscription',
    description: 'Sign in to manage your subscription and billing settings.'
  },
  premium_features: {
    title: 'Access Premium Features',
    description: 'Sign in to unlock advanced tax planning tools and features.'
  }
};

export function AuthModal() {
  const { 
    showAuthModal, 
    setShowAuthModal, 
    authModalMode, 
    setAuthModalMode,
    login,
    signup,
    loginWithGoogle,
    isLoading,
    error,
    clearError,
    pendingAction
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  // Clear form when modal closes or mode changes
  useEffect(() => {
    if (!showAuthModal) {
      setEmail('');
      setPassword('');
      setDisplayName('');
      setLocalErrors([]);
      clearError();
    }
  }, [showAuthModal, clearError]);

  useEffect(() => {
    setLocalErrors([]);
    clearError();
  }, [authModalMode, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErrors([]);

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setLocalErrors([emailValidation.message]);
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (authModalMode === 'signup' && !passwordValidation.isValid) {
      setLocalErrors(passwordValidation.errors);
      return;
    }

    // Validate display name for signup
    if (authModalMode === 'signup' && displayName.trim().length < 2) {
      setLocalErrors(['Display name must be at least 2 characters']);
      return;
    }

    try {
      if (authModalMode === 'login') {
        await login({ email, password });
      } else {
        await signup({ email, password, displayName: displayName.trim() });
      }
    } catch {
      // Error is handled by context
    }
  };

  const handleGoogleLogin = async () => {
    setLocalErrors([]);
    try {
      await loginWithGoogle();
    } catch {
      // Error is handled by context
    }
  };

  const featureInfo = pendingAction?.feature 
    ? featureMessages[pendingAction.feature] 
    : null;

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowAuthModal(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-4rem)] overflow-hidden animate-fade-in flex flex-col">
        {/* Close button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 text-white text-center flex-shrink-0">
          <div className="text-4xl mb-3">🇳🇬</div>
          <h2 className="text-2xl font-bold">
            {authModalMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          {featureInfo && (
            <div className="mt-3 bg-white/10 rounded-lg p-3">
              <p className="font-medium">{featureInfo.title}</p>
              <p className="text-sm text-green-100 mt-1">{featureInfo.description}</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Benefits */}
          {authModalMode === 'signup' && (
            <div className="bg-green-50 rounded-lg p-3 mb-2">
              <h3 className="font-medium text-green-800 mb-1 text-sm">Account Benefits:</h3>
              <ul className="text-xs text-green-700 grid grid-cols-2 gap-1">
                <li className="flex items-center gap-1">
                  <span>✓</span> Save calculations
                </li>
                <li className="flex items-center gap-1">
                  <span>✓</span> Download PDFs
                </li>
                <li className="flex items-center gap-1">
                  <span>✓</span> View history
                </li>
                <li className="flex items-center gap-1">
                  <span>✓</span> Filing reminders
                </li>
              </ul>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-gray-700">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Error Messages */}
          {(error || localErrors.length > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error && <p>{error}</p>}
              {localErrors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authModalMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authModalMode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {authModalMode === 'signup' && password && (
                <PasswordStrengthIndicator password={password} />
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full py-3 rounded-lg font-medium transition',
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : authModalMode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Mode Toggle */}
          <p className="text-center text-sm text-gray-600">
            {authModalMode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setAuthModalMode('signup')}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setAuthModalMode('login')}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const validation = validatePassword(password);
  
  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
  };
  
  const strengthWidth = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full'
  };

  return (
    <div className="mt-2">
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className={cn(
          'h-full transition-all duration-300',
          strengthColors[validation.strength],
          strengthWidth[validation.strength]
        )} />
      </div>
      <p className={cn(
        'text-xs mt-1',
        validation.strength === 'weak' && 'text-red-600',
        validation.strength === 'medium' && 'text-yellow-600',
        validation.strength === 'strong' && 'text-green-600'
      )}>
        Password strength: {validation.strength}
      </p>
    </div>
  );
}
