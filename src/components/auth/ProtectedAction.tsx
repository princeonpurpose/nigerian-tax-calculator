/**
 * Protected Action Components
 * Buttons and wrappers that require authentication
 */

import { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { ProtectedFeature } from '@/types/auth';

interface ProtectedButtonProps {
  feature: ProtectedFeature;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Button that requires authentication before executing action
 */
export function ProtectedButton({ 
  feature, 
  onClick, 
  children, 
  className,
  disabled 
}: ProtectedButtonProps) {
  const { requireAuth, isAuthenticated } = useAuth();

  const handleClick = () => {
    if (requireAuth(feature, onClick)) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative',
        className,
        !isAuthenticated && 'group'
      )}
    >
      {children}
      {!isAuthenticated && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-xs">
          🔒
        </span>
      )}
    </button>
  );
}

interface ProtectedFeatureProps {
  feature: ProtectedFeature;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper that shows content only if authenticated
 */
export function ProtectedFeatureWrapper({ 
  feature: _feature, 
  children, 
  fallback 
}: ProtectedFeatureProps) {
  const { isAuthenticated, setShowAuthModal, setAuthModalMode } = useAuth();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
      <div className="text-4xl mb-3">🔐</div>
      <h3 className="font-medium text-gray-800 mb-2">Sign in required</h3>
      <p className="text-sm text-gray-600 mb-4">
        Create an account or sign in to access this feature.
      </p>
      <button
        onClick={() => {
          setAuthModalMode('login');
          setShowAuthModal(true);
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
      >
        Sign In
      </button>
    </div>
  );
}

/**
 * Action buttons for saving calculations
 */
export function SaveCalculationButton({ onSave }: { onSave: () => void }) {
  return (
    <ProtectedButton
      feature="save_calculation"
      onClick={onSave}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
    >
      <span>💾</span>
      <span>Save Calculation</span>
    </ProtectedButton>
  );
}

/**
 * Download PDF button
 */
export function DownloadPDFButton({ onDownload }: { onDownload: () => void }) {
  return (
    <ProtectedButton
      feature="download_pdf"
      onClick={onDownload}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
    >
      <span>📄</span>
      <span>Download PDF</span>
    </ProtectedButton>
  );
}

/**
 * View History button
 */
export function ViewHistoryButton({ onClick }: { onClick: () => void }) {
  return (
    <ProtectedButton
      feature="view_history"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
    >
      <span>📊</span>
      <span>View History</span>
    </ProtectedButton>
  );
}
