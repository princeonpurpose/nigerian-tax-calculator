/**
 * User Menu Component
 * Shows user profile and account options when logged in
 * Shows login/signup buttons when logged out
 */

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';

export function UserMenu() {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    logout, 
    setShowAuthModal, 
    setAuthModalMode 
  } = useAuth();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = () => {
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  const handleSignup = () => {
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-400/50 rounded-full animate-pulse" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleLogin}
          className="px-4 py-2 text-sm font-medium text-white hover:bg-green-600 rounded-lg transition"
        >
          Sign In
        </button>
        <button
          onClick={handleSignup}
          className="px-4 py-2 text-sm font-medium bg-white text-green-700 hover:bg-green-50 rounded-lg transition"
        >
          Sign Up
        </button>
      </div>
    );
  }

  // Authenticated
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 hover:bg-green-600 rounded-lg p-1.5 transition"
      >
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName}
            className="w-8 h-8 rounded-full border-2 border-white/50"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-medium">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-white text-sm hidden sm:block max-w-24 truncate">
          {user.displayName}
        </span>
        <svg 
          className={cn(
            'w-4 h-4 text-white transition-transform',
            showDropdown && 'rotate-180'
          )} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border overflow-hidden z-50 animate-fade-in">
          {/* User Info */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.displayName}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                user.role === 'individual' && 'bg-blue-100 text-blue-700',
                user.role === 'business' && 'bg-purple-100 text-purple-700',
                user.role === 'admin' && 'bg-red-100 text-red-700'
              )}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              {user.isEmailVerified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => { setShowDropdown(false); /* Navigate to history */ }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <span>📊</span>
              <span>Calculation History</span>
            </button>
            <button
              onClick={() => { setShowDropdown(false); /* Navigate to saved */ }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <span>💾</span>
              <span>Saved Calculations</span>
            </button>
            <button
              onClick={() => { setShowDropdown(false); /* Navigate to settings */ }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <span>⚙️</span>
              <span>Account Settings</span>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t py-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
