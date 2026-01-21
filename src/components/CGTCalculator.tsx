/**
 * Capital Gains Tax Calculator Component
 */

import { useState } from 'react';
import { cn } from '@/utils/cn';
import { formatNaira, formatPercent, parseNairaInput } from '@/utils/formatters';
import { calculateCGT, CGTResult, TaxpayerType } from '@/services/cgtCalculator';
import { COMPANY_CGT_RATE, SMALL_COMPANY_TURNOVER_LIMIT } from '@/config/taxConfig';
import { ResultCard, SummaryCard } from './ResultCard';
import { SaveCalculationButton, DownloadPDFButton } from './auth/ProtectedAction';

export function CGTCalculator() {
  const [taxpayerType, setTaxpayerType] = useState<TaxpayerType>('individual');
  const [saleProceeds, setSaleProceeds] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [improvementCosts, setImprovementCosts] = useState('');
  const [transferCosts, setTransferCosts] = useState('');
  const [companyTurnover, setCompanyTurnover] = useState('');
  const [isOffshoreTransfer, setIsOffshoreTransfer] = useState(false);
  const [result, setResult] = useState<CGTResult | null>(null);

  const parsedTurnover = parseNairaInput(companyTurnover);
  const isSmallCompany = taxpayerType === 'company' && parsedTurnover > 0 && parsedTurnover <= SMALL_COMPANY_TURNOVER_LIMIT;

  const handleCalculate = () => {
    const calcResult = calculateCGT({
      taxpayerType,
      saleProceeds: parseNairaInput(saleProceeds),
      acquisitionCost: parseNairaInput(acquisitionCost),
      improvementCosts: parseNairaInput(improvementCosts),
      transferCosts: parseNairaInput(transferCosts),
      companyTurnover: taxpayerType === 'company' ? parseNairaInput(companyTurnover) : undefined,
      isOffshoreTransfer,
    });
    setResult(calcResult);
  };

  const resetCalculator = () => {
    setSaleProceeds('');
    setAcquisitionCost('');
    setImprovementCosts('');
    setTransferCosts('');
    setCompanyTurnover('');
    setIsOffshoreTransfer(false);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Rate Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👤</span>
            <div>
              <div className="font-bold text-blue-700">Individual CGT</div>
              <div className="text-sm text-blue-600">Progressive rates (max 25%)</div>
              <div className="text-xs text-gray-500">Uses PIT tax brackets</div>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <div>
              <div className="font-bold text-purple-700">Company CGT</div>
              <div className="text-sm text-purple-600">{COMPANY_CGT_RATE}% flat rate</div>
              <div className="text-xs text-gray-500">Small companies: 0%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <h3 className="font-semibold text-gray-800 text-lg">Capital Gains Details</h3>

        {/* Taxpayer Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Taxpayer Type
          </label>
          <div className="flex gap-4">
            <label className={cn(
              'flex-1 p-4 border rounded-lg cursor-pointer transition',
              taxpayerType === 'individual'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                : 'border-gray-200 hover:border-green-300'
            )}>
              <input
                type="radio"
                checked={taxpayerType === 'individual'}
                onChange={() => setTaxpayerType('individual')}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="font-medium">Individual</div>
                  <div className="text-xs text-gray-500">Progressive rates</div>
                </div>
              </div>
            </label>
            <label className={cn(
              'flex-1 p-4 border rounded-lg cursor-pointer transition',
              taxpayerType === 'company'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                : 'border-gray-200 hover:border-green-300'
            )}>
              <input
                type="radio"
                checked={taxpayerType === 'company'}
                onChange={() => setTaxpayerType('company')}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <div className="font-medium">Company</div>
                  <div className="text-xs text-gray-500">{COMPANY_CGT_RATE}% flat rate</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Company Turnover (if company) */}
        {taxpayerType === 'company' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Turnover (for size classification)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                type="text"
                value={companyTurnover}
                onChange={(e) => setCompanyTurnover(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            {parsedTurnover > 0 && (
              <p className={cn(
                'text-xs mt-1',
                isSmallCompany ? 'text-green-600' : 'text-purple-600'
              )}>
                {isSmallCompany
                  ? '✓ Small Company - CGT exempt'
                  : `→ Standard Company - ${COMPANY_CGT_RATE}% CGT`}
              </p>
            )}
          </div>
        )}

        {/* Sale Proceeds & Costs */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Proceeds
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                type="text"
                value={saleProceeds}
                onChange={(e) => setSaleProceeds(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acquisition Cost
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                type="text"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Improvement Costs (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                type="text"
                value={improvementCosts}
                onChange={(e) => setImprovementCosts(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer/Incidental Costs (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                type="text"
                value={transferCosts}
                onChange={(e) => setTransferCosts(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Offshore Transfer */}
        {taxpayerType === 'company' && (
          <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-lg">
            <input
              type="checkbox"
              checked={isOffshoreTransfer}
              onChange={(e) => setIsOffshoreTransfer(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">
                Indirect Offshore Share Transfer
              </span>
              <p className="text-xs text-gray-500">
                CGT applies to offshore transfers deriving value from Nigerian assets
              </p>
            </div>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCalculate}
            disabled={!saleProceeds || !acquisitionCost}
            className={cn(
              'px-6 py-2 rounded-lg font-medium transition',
              saleProceeds && acquisitionCost
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Calculate CGT 🧮
          </button>
          {result && (
            <button
              onClick={resetCalculator}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={result.taxpayerType === 'individual' ? '👤' : '🏢'}
              label="Taxpayer Type"
              value={result.taxpayerType === 'individual' ? 'Individual' : 'Company'}
              subtext={typeof result.cgtRate === 'number' ? `${result.cgtRate}% rate` : result.cgtRate}
            />
            <SummaryCard
              icon="💵"
              label="Sale Proceeds"
              value={formatNaira(result.saleProceeds)}
            />
            <SummaryCard
              icon="📈"
              label="Capital Gain"
              value={formatNaira(result.capitalGain)}
              variant={result.capitalGain > 0 ? 'default' : 'success'}
            />
            <SummaryCard
              icon="🧾"
              label="CGT Payable"
              value={formatNaira(result.cgtAmount)}
              subtext={result.isExempt ? 'Exempt' : `${formatPercent(result.effectiveRate)} effective`}
              variant={result.isExempt ? 'success' : 'warning'}
            />
          </div>

          {result.isExempt && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold text-green-800">CGT Exempt!</p>
                <p className="text-sm text-green-700">{result.exemptReason}</p>
              </div>
            </div>
          )}

          <ResultCard
            title="Calculation Breakdown"
            variant="info"
            items={result.breakdown.map(item => ({
              label: item.label,
              value: item.amount,
              note: item.note,
            }))}
          />

          <ResultCard
            title="Summary"
            variant="success"
            items={[
              { label: 'Sale Proceeds', value: result.saleProceeds },
              { label: 'Less: Total Costs', value: result.totalCosts },
              { label: 'Capital Gain', value: result.capitalGain },
              { label: 'CGT Payable', value: result.cgtAmount },
              { label: 'Net Proceeds After Tax', value: result.netProceeds, highlight: true },
            ]}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <SaveCalculationButton 
              onSave={() => alert('CGT calculation saved! (Demo)')} 
            />
            <DownloadPDFButton 
              onDownload={() => alert('PDF download started! (Demo)')} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
