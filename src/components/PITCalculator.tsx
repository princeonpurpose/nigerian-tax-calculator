/**
 * Personal Income Tax Calculator Component
 */

import { useState } from 'react';
import { cn } from '@/utils/cn';
import { formatNaira, formatPercent, parseNairaInput } from '@/utils/formatters';
import { calculatePIT, PITResult } from '@/services/pitCalculator';
import { PIT_BRACKETS, INCOME_SOURCES, DEDUCTION_TYPES, RESIDENCY_DAYS_THRESHOLD } from '@/config/taxConfig';
import { ResultCard, SummaryCard } from './ResultCard';
import { SaveCalculationButton, DownloadPDFButton, ViewHistoryButton } from './auth/ProtectedAction';
import { useAuth } from '@/context/AuthContext';
import { saveCalculation } from '@/services/databaseService';
import { downloadCalculationPDF } from '@/services/pdfService';
import type { PITCalculationData } from '@/types/database';

interface IncomeEntry {
  type: string;
  amount: string;
}

interface DeductionEntry {
  type: string;
  amount: string;
}

export function PITCalculator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isResident, setIsResident] = useState(true);
  const [daysInNigeria, setDaysInNigeria] = useState('183');
  const [incomes, setIncomes] = useState<IncomeEntry[]>([{ type: 'salary', amount: '' }]);
  const [deductions, setDeductions] = useState<DeductionEntry[]>([]);
  const [result, setResult] = useState<PITResult | null>(null);

  const addIncome = () => {
    setIncomes([...incomes, { type: 'salary', amount: '' }]);
  };

  const removeIncome = (index: number) => {
    setIncomes(incomes.filter((_, i) => i !== index));
  };

  const updateIncome = (index: number, field: 'type' | 'amount', value: string) => {
    const updated = [...incomes];
    updated[index][field] = value;
    setIncomes(updated);
  };

  const addDeduction = () => {
    setDeductions([...deductions, { type: 'pension', amount: '' }]);
  };

  const removeDeduction = (index: number) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const updateDeduction = (index: number, field: 'type' | 'amount', value: string) => {
    const updated = [...deductions];
    updated[index][field] = value;
    setDeductions(updated);
  };

  const handleCalculate = () => {
    const incomeSources = incomes
      .filter(i => parseNairaInput(i.amount) > 0)
      .map(i => ({ type: i.type, amount: parseNairaInput(i.amount) }));

    const deductionList = deductions
      .filter(d => parseNairaInput(d.amount) > 0)
      .map(d => ({ type: d.type, amount: parseNairaInput(d.amount) }));

    const calcResult = calculatePIT(incomeSources, deductionList, isResident);
    setResult(calcResult);
    setStep(3);
  };

  const resetCalculator = () => {
    setStep(1);
    setIncomes([{ type: 'salary', amount: '' }]);
    setDeductions([]);
    setResult(null);
  };

  const { user } = useAuth();

  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getCalculationData = (): PITCalculationData => ({
    type: 'pit',
    inputs: {
      incomes: incomes
        .filter(i => parseNairaInput(i.amount) > 0)
        .map(i => ({ type: i.type, amount: parseNairaInput(i.amount) })),
      deductions: deductions
        .filter(d => parseNairaInput(d.amount) > 0)
        .map(d => ({ type: d.type, amount: parseNairaInput(d.amount) })),
      isResident,
      daysInNigeria: parseInt(daysInNigeria) || 0,
    },
    results: {
      grossIncome: result?.grossIncome || 0,
      totalDeductions: result?.totalDeductions || 0,
      taxableIncome: result?.taxableIncome || 0,
      totalTax: result?.totalTax || 0,
      netTakeHome: result?.netTakeHome || 0,
      effectiveRate: result?.effectiveRate || 0,
      isExempt: result?.isExempt || false,
    },
  });

  const handleSaveCalculation = async () => {
    if (!user || !result) return;
    
    setSaveStatus(null);
    const calculationData = getCalculationData();
    const { error } = await saveCalculation(user.id, calculationData);
    
    if (error) {
      setSaveStatus({ type: 'error', text: error });
    } else {
      setSaveStatus({ type: 'success', text: 'Saved!' });
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    const calcData = getCalculationData();
    downloadCalculationPDF({
      id: `temp-${Date.now()}`,
      user_id: user?.id || '',
      type: 'pit',
      inputs: calcData.inputs,
      results: calcData.results,
      notes: null,
      is_saved: false,
      created_at: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Tax Brackets Reference */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span>📊</span> 2026 Progressive Tax Brackets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PIT_BRACKETS.map((bracket, index) => (
            <div
              key={index}
              className={cn(
                'text-center p-2 rounded border',
                bracket.rate === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              )}
            >
              <div className="text-lg font-bold text-green-700">{bracket.rate}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {bracket.max === null
                  ? `Above ₦${((bracket.min - 1) / 1_000_000).toFixed(0)}M`
                  : bracket.min === 0
                  ? `₦0 - ₦${(bracket.max / 1_000_000).toFixed(1)}M`
                  : `₦${(bracket.min / 1_000_000).toFixed(1)}M - ₦${(bracket.max / 1_000_000).toFixed(0)}M`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm',
                step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              )}
            >
              {s}
            </div>
            {s < 3 && <div className={cn('w-12 h-1 mx-2', step > s ? 'bg-green-600' : 'bg-gray-200')} />}
          </div>
        ))}
      </div>
      <div className="text-center text-sm text-gray-600">
        {step === 1 && 'Step 1: Residency & Income'}
        {step === 2 && 'Step 2: Deductions & Reliefs'}
        {step === 3 && 'Step 3: Results'}
      </div>

      {/* Step 1: Residency & Income */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Residency */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Residency Status</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days present in Nigeria (this year)
                </label>
                <input
                  type="number"
                  value={daysInNigeria}
                  onChange={(e) => {
                    setDaysInNigeria(e.target.value);
                    setIsResident(parseInt(e.target.value) >= RESIDENCY_DAYS_THRESHOLD);
                  }}
                  min="0"
                  max="365"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex items-end">
                <div className={cn(
                  'w-full p-3 rounded-lg text-sm',
                  isResident ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
                )}>
                  <strong>{isResident ? '✓ Resident' : '⚠ Non-Resident'}</strong>
                  <p className="text-xs mt-1">
                    {isResident
                      ? 'Taxed on worldwide income'
                      : 'Taxed only on Nigerian-source income'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Income Sources */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Annual Income Sources</h3>
              <button
                onClick={addIncome}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Add Income
              </button>
            </div>
            <div className="space-y-3">
              {incomes.map((income, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <select
                      value={income.type}
                      onChange={(e) => updateIncome(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {INCOME_SOURCES.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                      <input
                        type="text"
                        value={income.amount}
                        onChange={(e) => updateIncome(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  {incomes.length > 1 && (
                    <button
                      onClick={() => removeIncome(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Next: Deductions →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Deductions */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Deductions & Reliefs</h3>
              <button
                onClick={addDeduction}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Add Deduction
              </button>
            </div>
            
            {deductions.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                No deductions added. Click "Add Deduction" to claim reliefs.
              </p>
            ) : (
              <div className="space-y-3">
                {deductions.map((deduction, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <select
                        value={deduction.type}
                        onChange={(e) => updateDeduction(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        {DEDUCTION_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {DEDUCTION_TYPES.find(t => t.id === deduction.type)?.description}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                        <input
                          type="text"
                          value={deduction.amount}
                          onChange={(e) => updateDeduction(index, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeDeduction(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              ← Back
            </button>
            <button
              onClick={handleCalculate}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Calculate Tax 🧮
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon="💰"
              label="Gross Income"
              value={formatNaira(result.grossIncome)}
              subtext="Annual"
            />
            <SummaryCard
              icon="📉"
              label="Total Deductions"
              value={formatNaira(result.totalDeductions)}
            />
            <SummaryCard
              icon="🧾"
              label="Tax Payable"
              value={formatNaira(result.totalTax)}
              subtext={`${formatPercent(result.effectiveRate)} effective rate`}
              variant={result.isExempt ? 'success' : 'default'}
            />
            <SummaryCard
              icon="✅"
              label="Net Take-Home"
              value={formatNaira(result.netTakeHome)}
              subtext={`${formatNaira(result.monthlyNetPay)}/month`}
              variant="success"
            />
          </div>

          {/* Exemption Notice */}
          {result.isExempt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold text-green-800">Tax Exempt!</p>
                <p className="text-sm text-green-700">{result.exemptReason}</p>
              </div>
            </div>
          )}

          {/* Detailed Breakdown */}
          <div className="grid lg:grid-cols-2 gap-4">
            <ResultCard
              title="Income Summary"
              items={[
                { label: 'Gross Annual Income', value: result.grossIncome },
                { label: 'Less: Deductions', value: result.totalDeductions },
                { label: 'Taxable Income', value: result.taxableIncome, highlight: true },
              ]}
            />
            <ResultCard
              title="Tax Breakdown by Bracket"
              variant="info"
              items={result.bracketBreakdown
                .filter(b => b.taxableInBracket > 0)
                .map(b => ({
                  label: `${b.bracket.rate}% Bracket`,
                  value: b.taxForBracket,
                  note: `On ${formatNaira(b.taxableInBracket)}`,
                }))}
            />
          </div>

          <ResultCard
            title="Monthly Breakdown"
            variant="success"
            items={[
              { label: 'Monthly Gross', value: result.grossIncome / 12 },
              { label: 'Monthly Tax (PAYE)', value: result.monthlyTax },
              { label: 'Monthly Net Pay', value: result.monthlyNetPay, highlight: true },
            ]}
          />

          {/* Save Status Message */}
          {saveStatus && (
            <div className={cn(
              'text-center py-2 px-4 rounded-lg text-sm',
              saveStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}>
              {saveStatus.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <SaveCalculationButton 
              onSave={handleSaveCalculation} 
            />
            <DownloadPDFButton 
              onDownload={handleDownloadPDF} 
            />
            <ViewHistoryButton 
              onClick={() => {
                // Navigate to dashboard - in real app this would use router
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }));
              }} 
            />
            <button
              onClick={resetCalculator}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              <span>↺</span>
              <span>New Calculation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
