/**
 * Calculation History Dashboard Component
 * Displays user's tax calculation history with analytics
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { formatNaira } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { getCalculationHistory, getSavedCalculations, deleteCalculation, toggleSaveCalculation } from '@/services/databaseService';
import { getUpcomingReminders, getTaxTypeInfo, getDaysUntilDue, getUrgencyLevel } from '@/services/remindersService';
import { downloadCalculationPDF } from '@/services/pdfService';
import { TaxAnalytics } from './TaxAnalytics';
import type { Calculation, CalculationType, FilingReminder } from '@/types/database';

const TAX_TYPE_CONFIG: Record<CalculationType, { label: string; icon: string; color: string; bgColor: string }> = {
  pit: { label: 'Personal Income Tax', icon: '👤', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  cit: { label: 'Company Income Tax', icon: '🏢', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  cgt: { label: 'Capital Gains Tax', icon: '📈', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  vat: { label: 'Value Added Tax', icon: '🧾', color: 'text-green-700', bgColor: 'bg-green-100' },
};

export function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [savedCalculations, setSavedCalculations] = useState<Calculation[]>([]);
  const [reminders, setReminders] = useState<FilingReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'saved' | 'analytics'>('history');
  const [filterType, setFilterType] = useState<CalculationType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [savedPage, setSavedPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch calculations history
      const { data, error: calcError, count } = await getCalculationHistory(user.id, {
        type: filterType === 'all' ? undefined : filterType,
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE,
      });
      
      if (calcError) throw new Error(calcError);
      setCalculations(data);
      setTotalCount(count);
      
      // Fetch saved calculations
      const { data: savedData, count: savedTotal } = await getSavedCalculations(user.id, {
        type: filterType === 'all' ? undefined : filterType,
        limit: ITEMS_PER_PAGE,
        offset: savedPage * ITEMS_PER_PAGE,
      });
      setSavedCalculations(savedData);
      setSavedCount(savedTotal);
      
      // Fetch upcoming reminders
      const { data: reminderData } = await getUpcomingReminders();
      if (reminderData) setReminders(reminderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [user, filterType, page, savedPage]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData();
    }
  }, [isAuthenticated, user, fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calculation?')) return;
    
    const { error } = await deleteCalculation(id);
    if (error) {
      alert(`Failed to delete: ${error}`);
    } else {
      setCalculations(prev => prev.filter(c => c.id !== id));
      setSavedCalculations(prev => prev.filter(c => c.id !== id));
      setTotalCount(prev => prev - 1);
    }
  };

  const handleToggleSave = async (calc: Calculation) => {
    const newSavedStatus = !calc.is_saved;
    const { error } = await toggleSaveCalculation(calc.id, newSavedStatus);
    
    if (error) {
      alert(`Failed to update: ${error}`);
    } else {
      // Update in history list
      setCalculations(prev => 
        prev.map(c => c.id === calc.id ? { ...c, is_saved: newSavedStatus } : c)
      );
      
      // Update saved list
      if (newSavedStatus) {
        setSavedCalculations(prev => [{ ...calc, is_saved: true }, ...prev]);
        setSavedCount(prev => prev + 1);
      } else {
        setSavedCalculations(prev => prev.filter(c => c.id !== calc.id));
        setSavedCount(prev => prev - 1);
      }
    }
  };

  const getTaxResult = (calc: Calculation): number => {
    const results = calc.results as Record<string, unknown>;
    switch (calc.type) {
      case 'pit': return (results.totalTax as number) || 0;
      case 'cit': return (results.totalTaxPayable as number) || 0;
      case 'cgt': return (results.cgtAmount as number) || 0;
      case 'vat': return (results.vatAmount as number) || (results.netVAT as number) || 0;
      default: return 0;
    }
  };

  const getKeyInputs = (calc: Calculation): { label: string; value: string }[] => {
    const inputs = calc.inputs as Record<string, unknown>;
    const results = calc.results as Record<string, unknown>;
    
    switch (calc.type) {
      case 'pit':
        return [
          { label: 'Gross Income', value: formatNaira((results.grossIncome as number) || 0) },
          { label: 'Taxable Income', value: formatNaira((results.taxableIncome as number) || 0) },
        ];
      case 'cit':
        return [
          { label: 'Turnover', value: formatNaira((inputs.turnover as number) || 0) },
          { label: 'Profits', value: formatNaira((inputs.assessableProfits as number) || 0) },
        ];
      case 'cgt':
        return [
          { label: 'Sale Proceeds', value: formatNaira((inputs.saleProceeds as number) || 0) },
          { label: 'Capital Gain', value: formatNaira((results.capitalGain as number) || 0) },
        ];
      case 'vat':
        if ((inputs.mode as string) === 'business') {
          return [
            { label: 'Output VAT', value: formatNaira((inputs.outputVAT as number) || 0) },
            { label: 'Input VAT', value: formatNaira((inputs.inputVAT as number) || 0) },
          ];
        }
        return [
          { label: 'Amount', value: formatNaira((inputs.amount as number) || 0) },
          { label: 'Type', value: (inputs.calculationType as string) || 'exclusive' },
        ];
      default:
        return [];
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in Required</h2>
        <p className="text-gray-600">Please sign in to view your calculation history and analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">View your calculation history and tax analytics</p>
        </div>
        
        {/* Tab Selector */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-4 py-2 rounded-md font-medium transition text-sm',
              activeTab === 'history'
                ? 'bg-white text-green-700 shadow'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            📋 History
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={cn(
              'px-4 py-2 rounded-md font-medium transition text-sm relative',
              activeTab === 'saved'
                ? 'bg-white text-green-700 shadow'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            ⭐ Saved
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {savedCount > 99 ? '99+' : savedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              'px-4 py-2 rounded-md font-medium transition text-sm',
              activeTab === 'analytics'
                ? 'bg-white text-green-700 shadow'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            📊 Analytics
          </button>
        </div>
      </div>

      {/* Upcoming Reminders */}
      {reminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <span>⏰</span> Upcoming Filing Deadlines
          </h3>
          <div className="flex flex-wrap gap-3">
            {reminders.slice(0, 3).map(reminder => {
              const daysUntil = getDaysUntilDue(reminder.due_date);
              const urgency = getUrgencyLevel(daysUntil);
              const typeInfo = getTaxTypeInfo(reminder.tax_type);
              
              return (
                <div
                  key={reminder.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                    urgency === 'urgent' && 'bg-red-100 text-red-800',
                    urgency === 'warning' && 'bg-amber-100 text-amber-800',
                    urgency === 'normal' && 'bg-green-100 text-green-800'
                  )}
                >
                  <span className={cn('px-2 py-0.5 rounded text-xs', typeInfo.bgColor, typeInfo.color)}>
                    {reminder.tax_type.toUpperCase()}
                  </span>
                  <span>{reminder.title}</span>
                  <span className="font-medium">
                    {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <TaxAnalytics calculations={calculations} />
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => { setFilterType('all'); setPage(0); }}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap',
                filterType === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All Types
            </button>
            {(Object.keys(TAX_TYPE_CONFIG) as CalculationType[]).map(type => (
              <button
                key={type}
                onClick={() => { setFilterType(type); setPage(0); }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center gap-2',
                  filterType === type
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <span>{TAX_TYPE_CONFIG[type].icon}</span>
                <span>{type.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading calculations...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-medium">Error loading data</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={fetchData}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && calculations.length === 0 && (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No calculations yet</h3>
              <p className="text-gray-600">
                {filterType === 'all' 
                  ? 'Your saved calculations will appear here.'
                  : `No ${TAX_TYPE_CONFIG[filterType].label} calculations found.`}
              </p>
            </div>
          )}

          {/* Calculation List */}
          {!isLoading && calculations.length > 0 && (
            <div className="space-y-3">
              {calculations.map(calc => {
                const config = TAX_TYPE_CONFIG[calc.type];
                const isExpanded = expandedId === calc.id;
                const taxResult = getTaxResult(calc);
                const keyInputs = getKeyInputs(calc);
                
                return (
                  <div
                    key={calc.id}
                    className="bg-white rounded-lg border hover:border-green-300 transition overflow-hidden"
                  >
                    {/* Main Row */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : calc.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Type Badge */}
                        <div className={cn('p-3 rounded-lg', config.bgColor)}>
                          <span className="text-2xl">{config.icon}</span>
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-xs font-medium px-2 py-0.5 rounded', config.bgColor, config.color)}>
                              {calc.type.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {format(new Date(calc.created_at), 'MMM d, yyyy • h:mm a')}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {keyInputs.map((input, i) => (
                              <span key={i}>
                                <span className="text-gray-400">{input.label}:</span> {input.value}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Tax Result */}
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Tax</div>
                          <div className="font-semibold text-gray-900">{formatNaira(Math.abs(taxResult))}</div>
                        </div>
                        
                        {/* Expand Icon */}
                        <svg 
                          className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Inputs</h4>
                            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                              {JSON.stringify(calc.inputs, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Results</h4>
                            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                              {JSON.stringify(calc.results, null, 2)}
                            </pre>
                          </div>
                        </div>
                        {calc.notes && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                            <p className="text-sm text-gray-600">{calc.notes}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleSave(calc); }}
                            className={cn(
                              'px-3 py-1.5 text-sm rounded transition flex items-center gap-1',
                              calc.is_saved
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            )}
                          >
                            {calc.is_saved ? '⭐ Saved' : '☆ Save'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); downloadCalculationPDF(calc); }}
                            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          >
                            📄 Download PDF
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(calc.id); }}
                            className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-600">
                Showing {page * ITEMS_PER_PAGE + 1} - {Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={cn(
                    'px-4 py-2 rounded border text-sm font-medium transition',
                    page === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * ITEMS_PER_PAGE >= totalCount}
                  className={cn(
                    'px-4 py-2 rounded border text-sm font-medium transition',
                    (page + 1) * ITEMS_PER_PAGE >= totalCount
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Calculations Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {/* Header with info */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Saved Calculations</h3>
                <p className="text-sm text-amber-700">
                  {savedCount === 0 
                    ? 'Save important calculations to quickly access them later.'
                    : `You have ${savedCount} saved calculation${savedCount !== 1 ? 's' : ''}.`}
                </p>
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading saved calculations...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && savedCalculations.length === 0 && (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved calculations</h3>
              <p className="text-gray-600 mb-4">
                When you save a calculation, it will appear here for quick access.
              </p>
              <button
                onClick={() => setActiveTab('history')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Browse History
              </button>
            </div>
          )}

          {/* Saved Calculation List */}
          {!isLoading && savedCalculations.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedCalculations.map(calc => {
                const config = TAX_TYPE_CONFIG[calc.type];
                const taxResult = getTaxResult(calc);
                const keyInputs = getKeyInputs(calc);
                
                return (
                  <div
                    key={calc.id}
                    className="bg-white rounded-lg border hover:shadow-lg transition overflow-hidden group"
                  >
                    {/* Card Header */}
                    <div className={cn('p-3 flex items-center gap-3', config.bgColor)}>
                      <span className="text-2xl">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={cn('font-medium', config.color)}>{config.label}</div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(calc.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleSave(calc)}
                        className="p-1 hover:bg-white/50 rounded transition"
                        title="Remove from saved"
                      >
                        <span className="text-amber-500 text-lg">⭐</span>
                      </button>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-4">
                      {/* Key Inputs */}
                      <div className="space-y-2 mb-4">
                        {keyInputs.map((input, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-500">{input.label}</span>
                            <span className="font-medium text-gray-800">{input.value}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Tax Result */}
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tax Payable</span>
                          <span className="text-lg font-bold text-gray-900">{formatNaira(Math.abs(taxResult))}</span>
                        </div>
                      </div>
                      
                      {/* Notes preview */}
                      {calc.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 line-clamp-2">{calc.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Card Actions */}
                    <div className="px-4 pb-4 flex gap-2">
                      <button
                        onClick={() => { setActiveTab('history'); setExpandedId(calc.id); }}
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => downloadCalculationPDF(calc)}
                        className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                      >
                        📄 PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination for saved */}
          {savedCount > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-600">
                Showing {savedPage * ITEMS_PER_PAGE + 1} - {Math.min((savedPage + 1) * ITEMS_PER_PAGE, savedCount)} of {savedCount}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSavedPage(p => Math.max(0, p - 1))}
                  disabled={savedPage === 0}
                  className={cn(
                    'px-4 py-2 rounded border text-sm font-medium transition',
                    savedPage === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setSavedPage(p => p + 1)}
                  disabled={(savedPage + 1) * ITEMS_PER_PAGE >= savedCount}
                  className={cn(
                    'px-4 py-2 rounded border text-sm font-medium transition',
                    (savedPage + 1) * ITEMS_PER_PAGE >= savedCount
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  )}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
