/**
 * VAT Calculator Component
 */

import { useState } from 'react';
import { cn } from '@/utils/cn';
import { formatNaira, parseNairaInput } from '@/utils/formatters';
import { 
  calculateVAT, 
  calculateBusinessVAT, 
  VATResult, 
  VATBusinessResult,
  VATCalculationType 
} from '@/services/vatCalculator';
import { VAT_RATE } from '@/config/taxConfig';
import { SummaryCard } from './ResultCard';
import { SaveCalculationButton, DownloadPDFButton } from './auth/ProtectedAction';
import { downloadCalculationPDF } from '@/services/pdfService';
import { saveCalculation } from '@/services/databaseService';
import { useAuth } from '@/context/AuthContext';
import type { VATCalculationData } from '@/types/database';

type CalculatorMode = 'simple' | 'business';

export function VATCalculator() {
  const { user } = useAuth();
  const [mode, setMode] = useState<CalculatorMode>('simple');
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Simple mode
  const [amount, setAmount] = useState('');
  const [calculationType, setCalculationType] = useState<VATCalculationType>('exclusive');
  const [simpleResult, setSimpleResult] = useState<VATResult | null>(null);

  // Business mode
  const [outputVAT, setOutputVAT] = useState('');
  const [inputVAT, setInputVAT] = useState('');
  const [businessResult, setBusinessResult] = useState<VATBusinessResult | null>(null);

  const handleSimpleCalculate = () => {
    const result = calculateVAT({
      amount: parseNairaInput(amount),
      calculationType,
    });
    setSimpleResult(result);
  };

  const handleBusinessCalculate = () => {
    const result = calculateBusinessVAT({
      outputVAT: parseNairaInput(outputVAT),
      inputVAT: parseNairaInput(inputVAT),
    });
    setBusinessResult(result);
  };

  const resetCalculator = () => {
    setAmount('');
    setOutputVAT('');
    setInputVAT('');
    setSimpleResult(null);
    setBusinessResult(null);
  };

  return (
    <div className="space-y-6">
      {/* VAT Rate Info */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-5xl font-bold text-green-700">{VAT_RATE}%</div>
        <div className="text-lg text-green-600 mt-2">Standard VAT Rate</div>
        <div className="text-sm text-gray-500 mt-1">Effective January 1, 2026</div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => { setMode('simple'); resetCalculator(); }}
          className={cn(
            'flex-1 py-2 px-4 rounded-md font-medium transition',
            mode === 'simple'
              ? 'bg-white text-green-700 shadow'
              : 'text-gray-600 hover:text-gray-800'
          )}
        >
          🧮 Simple Calculator
        </button>
        <button
          onClick={() => { setMode('business'); resetCalculator(); }}
          className={cn(
            'flex-1 py-2 px-4 rounded-md font-medium transition',
            mode === 'business'
              ? 'bg-white text-green-700 shadow'
              : 'text-gray-600 hover:text-gray-800'
          )}
        >
          🏢 Business VAT
        </button>
      </div>

      {/* Simple Calculator */}
      {mode === 'simple' && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h3 className="font-semibold text-gray-800 text-lg">VAT Price Calculator</h3>
          
          {/* Calculation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Price Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={cn(
                'p-4 border rounded-lg cursor-pointer transition text-center',
                calculationType === 'exclusive'
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-green-300'
              )}>
                <input
                  type="radio"
                  checked={calculationType === 'exclusive'}
                  onChange={() => setCalculationType('exclusive')}
                  className="sr-only"
                />
                <div className="font-medium">VAT Exclusive</div>
                <div className="text-xs text-gray-500 mt-1">Add VAT to price</div>
              </label>
              <label className={cn(
                'p-4 border rounded-lg cursor-pointer transition text-center',
                calculationType === 'inclusive'
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 hover:border-green-300'
              )}>
                <input
                  type="radio"
                  checked={calculationType === 'inclusive'}
                  onChange={() => setCalculationType('inclusive')}
                  className="sr-only"
                />
                <div className="font-medium">VAT Inclusive</div>
                <div className="text-xs text-gray-500 mt-1">Extract VAT from price</div>
              </label>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {calculationType === 'exclusive' ? 'Net Amount (Before VAT)' : 'Gross Amount (Including VAT)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <button
            onClick={handleSimpleCalculate}
            disabled={!amount}
            className={cn(
              'w-full py-3 rounded-lg font-medium transition',
              amount
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Calculate VAT
          </button>

          {/* Simple Result */}
          {simpleResult && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-500">Net Amount</div>
                  <div className="text-lg font-bold text-gray-800">{formatNaira(simpleResult.netAmount)}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-blue-600">VAT ({VAT_RATE}%)</div>
                  <div className="text-lg font-bold text-blue-700">{formatNaira(simpleResult.vatAmount)}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-green-600">Gross Amount</div>
                  <div className="text-lg font-bold text-green-700">{formatNaira(simpleResult.grossAmount)}</div>
                </div>
              </div>
              
              {/* Save Status */}
              {saveStatus && (
                <div className={`text-center py-2 px-4 rounded-lg text-sm ${
                  saveStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {saveStatus.text}
                </div>
              )}

              {/* Action Buttons for Simple Calculator */}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <SaveCalculationButton 
                  onSave={async () => {
                    if (!user) return;
                    const calcData: VATCalculationData = {
                      type: 'vat',
                      inputs: { mode: 'simple', amount: parseNairaInput(amount), calculationType },
                      results: { vatAmount: simpleResult?.vatAmount, netAmount: simpleResult?.netAmount, grossAmount: simpleResult?.grossAmount },
                    };
                    const { error } = await saveCalculation(user.id, calcData);
                    if (error) setSaveStatus({ type: 'error', text: error });
                    else { setSaveStatus({ type: 'success', text: 'Saved!' }); setTimeout(() => setSaveStatus(null), 3000); }
                  }} 
                />
                <DownloadPDFButton 
                  onDownload={() => {
                    if (!simpleResult) return;
                    downloadCalculationPDF({
                      id: `temp-${Date.now()}`,
                      user_id: user?.id || '',
                      type: 'vat',
                      inputs: { mode: 'simple', amount: parseNairaInput(amount), calculationType },
                      results: { vatAmount: simpleResult.vatAmount, netAmount: simpleResult.netAmount, grossAmount: simpleResult.grossAmount },
                      notes: null,
                      is_saved: false,
                      created_at: new Date().toISOString(),
                    });
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Business VAT Calculator */}
      {mode === 'business' && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h3 className="font-semibold text-gray-800 text-lg">Business VAT Calculator</h3>
          <p className="text-sm text-gray-600">
            Calculate your net VAT payable or refundable based on output VAT (collected from customers) 
            and input VAT (paid on purchases).
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                  Output VAT (Collected)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                <input
                  type="text"
                  value={outputVAT}
                  onChange={(e) => setOutputVAT(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">VAT charged to customers on sales</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                  Input VAT (Paid)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                <input
                  type="text"
                  value={inputVAT}
                  onChange={(e) => setInputVAT(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">VAT paid on business purchases</p>
            </div>
          </div>

          <button
            onClick={handleBusinessCalculate}
            disabled={!outputVAT && !inputVAT}
            className={cn(
              'w-full py-3 rounded-lg font-medium transition',
              outputVAT || inputVAT
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Calculate Net VAT
          </button>

          {/* Business Result */}
          {businessResult && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid sm:grid-cols-3 gap-4">
                <SummaryCard
                  icon="📤"
                  label="Output VAT"
                  value={formatNaira(businessResult.outputVAT)}
                  subtext="Collected from sales"
                />
                <SummaryCard
                  icon="📥"
                  label="Input VAT"
                  value={formatNaira(businessResult.inputVAT)}
                  subtext="Paid on purchases"
                />
                <SummaryCard
                  icon={businessResult.isPayable ? '💸' : businessResult.isRefundable ? '💰' : '⚖️'}
                  label={businessResult.isPayable ? 'VAT Payable' : businessResult.isRefundable ? 'VAT Refundable' : 'Net VAT'}
                  value={formatNaira(Math.abs(businessResult.netVAT))}
                  variant={businessResult.isPayable ? 'warning' : businessResult.isRefundable ? 'success' : 'default'}
                />
              </div>

              <div className={cn(
                'p-4 rounded-lg',
                businessResult.isPayable ? 'bg-amber-50 text-amber-800' :
                businessResult.isRefundable ? 'bg-green-50 text-green-800' :
                'bg-gray-50 text-gray-800'
              )}>
                <p className="text-sm">{businessResult.explanation}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📋 Filing Reminder</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• VAT returns due by 21st of following month</li>
                  <li>• E-invoicing mandatory for all VAT-registered businesses</li>
                  <li>• Maintain proper records for NRS audit</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <SaveCalculationButton 
                  onSave={async () => {
                    if (!user || !businessResult) return;
                    const calcData: VATCalculationData = {
                      type: 'vat',
                      inputs: { mode: 'business', outputVAT: parseNairaInput(outputVAT), inputVAT: parseNairaInput(inputVAT) },
                      results: { netVAT: businessResult.netVAT, isPayable: businessResult.isPayable, isRefundable: businessResult.isRefundable },
                    };
                    const { error } = await saveCalculation(user.id, calcData);
                    if (error) setSaveStatus({ type: 'error', text: error });
                    else { setSaveStatus({ type: 'success', text: 'Saved!' }); setTimeout(() => setSaveStatus(null), 3000); }
                  }} 
                />
                <DownloadPDFButton 
                  onDownload={() => {
                    if (!businessResult) return;
                    downloadCalculationPDF({
                      id: `temp-${Date.now()}`,
                      user_id: user?.id || '',
                      type: 'vat',
                      inputs: { mode: 'business', outputVAT: parseNairaInput(outputVAT), inputVAT: parseNairaInput(inputVAT) },
                      results: { netVAT: businessResult.netVAT, outputVAT: businessResult.outputVAT, inputVAT: businessResult.inputVAT },
                      notes: null,
                      is_saved: false,
                      created_at: new Date().toISOString(),
                    });
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
