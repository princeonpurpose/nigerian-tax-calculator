/**
 * Header component for Nigerian Tax Calculator
 */

import { UserMenu } from './auth/UserMenu';

export function Header() {
  return (
    <header className="bg-gradient-to-r from-green-700 to-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <img 
                src="https://flagcdn.com/w40/ng.png" 
                srcSet="https://flagcdn.com/w80/ng.png 2x"
                alt="Nigeria"
                className="w-8 h-6 rounded shadow-sm"
              />
              <span className="hidden sm:inline">Nigerian Tax Calculator</span>
              <span className="sm:hidden">Tax Calculator</span>
            </h1>
            <p className="text-green-100 text-xs sm:text-sm mt-0.5 hidden sm:block">
              2026-Ready • NRS Compliant • Based on Nigeria Tax Act
            </p>
          </div>
          
          {/* Status Badge */}
          <div className="hidden md:block bg-green-800/50 rounded-lg px-3 py-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Effective Jan 1, 2026</span>
            </div>
          </div>
          
          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
