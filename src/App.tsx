/**
 * Nigerian Tax Calculator - Main Application
 * 
 * 2026-Ready • NRS Compliant
 * Based on Nigeria Tax Act, Nigeria Tax Administration Act,
 * Nigeria Revenue Service (Establishment) Act, and Joint Revenue Board Act
 * 
 * Signed: June 26, 2025 | Effective: January 1, 2026
 */

import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { ModuleSelector, TaxModule } from './components/ModuleSelector';
import { PITCalculator } from './components/PITCalculator';
import { CITCalculator } from './components/CITCalculator';
import { CGTCalculator } from './components/CGTCalculator';
import { VATCalculator } from './components/VATCalculator';
import { ComplianceInfo } from './components/ComplianceInfo';
import { Disclaimer } from './components/Disclaimer';
import { AuthModal } from './components/auth/AuthModal';
import { Dashboard } from './components/Dashboard';
import { FilingReminders } from './components/FilingReminders';

type AppView = 'calculator' | 'dashboard' | 'reminders';

function TaxCalculatorApp() {
  const [activeModule, setActiveModule] = useState<TaxModule>('pit');
  const [currentView, setCurrentView] = useState<AppView>('calculator');

  const renderModule = () => {
    switch (activeModule) {
      case 'pit':
        return <PITCalculator />;
      case 'cit':
        return <CITCalculator />;
      case 'cgt':
        return <CGTCalculator />;
      case 'vat':
        return <VATCalculator />;
      case 'compliance':
        return <ComplianceInfo />;
      default:
        return <PITCalculator />;
    }
  };

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'pit':
        return { icon: '👤', title: 'Personal Income Tax (PIT/PAYE)', subtitle: 'Calculate your individual income tax' };
      case 'cit':
        return { icon: '🏢', title: 'Corporate Income Tax (CIT)', subtitle: 'Calculate company taxes and development levy' };
      case 'cgt':
        return { icon: '📈', title: 'Capital Gains Tax (CGT)', subtitle: 'Calculate tax on asset sales' };
      case 'vat':
        return { icon: '🧾', title: 'Value Added Tax (VAT)', subtitle: 'Calculate VAT at 7.5%' };
      case 'compliance':
        return { icon: '📋', title: 'Compliance & Administration', subtitle: 'Filing deadlines, TIN validation, and more' };
      default:
        return { icon: '🧮', title: 'Tax Calculator', subtitle: '' };
    }
  };

  const moduleInfo = getModuleTitle();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'reminders':
        return <FilingReminders />;
      case 'calculator':
      default:
        return (
          <>
            {/* Module Selector */}
            <div className="bg-white rounded-lg border shadow-sm p-2">
              <ModuleSelector activeModule={activeModule} onModuleChange={setActiveModule} />
            </div>

            {/* Module Title */}
            <div className="flex items-center gap-4 py-2">
              <span className="text-4xl">{moduleInfo.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{moduleInfo.title}</h2>
                <p className="text-gray-600">{moduleInfo.subtitle}</p>
              </div>
            </div>

            {/* Calculator Module */}
            <div className="pb-8">
              {renderModule()}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            <button
              onClick={() => setCurrentView('calculator')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                currentView === 'calculator'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🧮 Calculator
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                currentView === 'dashboard'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setCurrentView('reminders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                currentView === 'reminders'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ⏰ Reminders
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Disclaimer - only show on calculator view */}
        {currentView === 'calculator' && <Disclaimer />}

        {/* Render current view */}
        {renderView()}

        {/* Footer */}
        <footer className="border-t pt-6 pb-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <span className="text-2xl">🇳🇬</span>
              <span className="font-semibold">Nigerian Tax Calculator 2026</span>
            </div>
            
            <div className="text-sm text-gray-500 space-y-1">
              <p>Based on Nigeria Tax Act, NTAA, NRS Establishment Act & Joint Revenue Board Act</p>
              <p>Laws signed: June 26, 2025 • Effective: January 1, 2026</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
              <span>✓ PIT/PAYE</span>
              <span>✓ CIT</span>
              <span>✓ CGT</span>
              <span>✓ VAT</span>
              <span>✓ Development Levy</span>
              <span>✓ METR (Pillar Two)</span>
              <span>✓ CFC Rules</span>
            </div>

            <p className="text-xs text-gray-400 max-w-2xl mx-auto">
              This calculator is for informational purposes only. Always consult with a qualified 
              tax professional or the Nigeria Revenue Service (NRS) for official guidance on your tax obligations.
            </p>
          </div>
        </footer>
      </main>

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

/**
 * Main App wrapper with Authentication Provider
 * This keeps auth logic completely separate from calculator logic
 */
export function App() {
  return (
    <AuthProvider>
      <TaxCalculatorApp />
      <AuthModal />
    </AuthProvider>
  );
}
