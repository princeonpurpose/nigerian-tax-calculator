/**
 * Corporate Income Tax Calculator Component
 */

import { useState } from 'react';
import { cn } from '@/utils/cn';
import { formatNaira, formatPercent, parseNairaInput } from '@/utils/formatters';
import { calculateCIT, CITResult, CompanyType } from '@/services/citCalculator';
import { SMALL_COMPANY_TURNOVER_LIMIT, CIT_RATE, DEVELOPMENT_LEVY_RATE, MINIMUM_EFFECTIVE_TAX_RATE } from '@/config/taxConfig';
import { ResultCard, SummaryCard } from './ResultCard';
import { SaveCalculationButton, DownloadPDFButton } from './auth/ProtectedAction';

export function CITCalculator() {
  const [turnover, setTurnover] = useState('');
  const [profits, setProfits] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('domestic');
  const [isMultinational, setIsMultinational] = useState(false);
  const [foreignProfits, setForeignProfits] = useState('');
  const [distributedForeignProfits, setDistributedForeignProfits] = useState('');
  const [result, setResult] = useState<CITResult | null>(null);

  const parsedTurnover = parseNairaInput(turnover);
  const isSmallCompany = parsedTurnover > 0 && parsedTurnover <= SMALL_COMPANY_TURNOVER_LIMIT;

  const handleCalculate = () => {
    const calcResult = calculateCIT({
      turnover: parseNairaInput(turnover),
      assessableProfits: parseNairaInput(profits),
      companyType,
      isMultinationalSubject: isMultinational,
      foreignProfits: parseNairaInput(foreignProfits),
      distributedForeignProfits: parseNairaInput(distributedForeignProfits),
    });
    setResult(calcResult);
  };

  const resetCalculator = () => {
    setTurnover('');
    setProfits('');
    setCompanyType('domestic');
    setIsMultinational(false);
    setForeignProfits('');
    setDistributedForeignProfits('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Rate Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-700">0%</div>
          <div className="text-sm text-green-600 mt-1">Small Companies</div>
          <div className="text-xs text-gray-500">Turnover ≤ ₦100M</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-700">{CIT_RATE}%</div>
          <div className="text-sm text-blue-600 mt-1">Other Companies</div>
          <div className="text-xs text-gray-500">Standard CIT Rate</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-amber-700">{DEVELOPMENT_LEVY_RATE}%</div>
          <div className="text-sm text-amber-600 mt-1">Development Levy</div>
          <div className="text-xs text-gray-500">On Assessable Profits</div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <h3 className="font-semibold text-gray-800 text-lg">Company Information</h3>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Turnover */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Turnover
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                type="text"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            {parsedTurnover > 0 && (
              <p className={cn(
                'text-xs mt-1',
                isSmallCompany ? 'text-green-600' : 'text-blue-600'
              )}>
                {isSmallCompany
                  ? '✓ Qualifies as Small Company (0% CIT)'
                  : '→ Standard Company (30% CIT)'}
              </p>
            )}
          </div>

          {/* Assessable Profits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessable Profits
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
              <input
                type="text"
                value={profits}
                onChange={(e) => setProfits(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Company Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={companyType === 'domestic'}
                onChange={() => setCompanyType('domestic')}
                className="text-green-600 focus:ring-green-500"
              />
              <span>Domestic Company</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={companyType === 'multinational'}
                onChange={() => setCompanyType('multinational')}
                className="text-green-600 focus:ring-green-500"
              />
              <span>Multinational</span>
            </label>
          </div>
        </div>

        {/* Multinational Options */}
        {companyType === 'multinational' && (
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-blue-800">Multinational Tax Rules</h4>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isMultinational}
                onChange={(e) => setIsMultinational(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-blue-800">
                  Subject to Minimum Effective Tax Rate ({MINIMUM_EFFECTIVE_TAX_RATE}%)
                </span>
                <p className="text-xs text-blue-600">
                  Based on OECD Pillar Two / GloBE rules for large multinationals
                </p>
              </div>
            </label>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Foreign Subsidiary Profits
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                  <input
                    type="text"
                    value={foreignProfits}
                    onChange={(e) => setForeignProfits(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Distributed (Repatriated) Profits
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                  <input
                    type="text"
                    value={distributedForeignProfits}
                    onChange={(e) => setDistributedForeignProfits(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  CFC tax applies to undistributed foreign profits
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCalculate}
            disabled={!turnover || !profits}
            className={cn(
              'px-6 py-2 rounded-lg font-medium transition',
              turnover && profits
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Calculate CIT 🧮
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
              icon="🏢"
              label="Company Size"
              value={result.companySize === 'small' ? 'Small' : 'Standard'}
              subtext={result.companySize === 'small' ? '0% CIT Rate' : '30% CIT Rate'}
              variant={result.companySize === 'small' ? 'success' : 'default'}
            />
            <SummaryCard
              icon="💵"
              label="Turnover"
              value={formatNaira(result.turnover)}
            />
            <SummaryCard
              icon="📊"
              label="Assessable Profits"
              value={formatNaira(result.assessableProfits)}
            />
            <SummaryCard
              icon="🧾"
              label="Total Tax Payable"
              value={formatNaira(result.totalTaxPayable)}
              subtext={`${formatPercent(result.effectiveTaxRate)} effective`}
              variant={result.totalTaxPayable === 0 ? 'success' : 'warning'}
            />
          </div>

          <ResultCard
            title="Tax Breakdown"
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
              { label: 'Corporate Income Tax', value: result.citAmount },
              { label: 'Development Levy', value: result.developmentLevy },
              { label: 'Minimum Tax Top-Up', value: result.minimumTaxTopUp },
              { label: 'CFC Tax', value: result.cfcTax },
              { label: 'Total Tax Payable', value: result.totalTaxPayable, highlight: true },
            ]}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <SaveCalculationButton 
              onSave={() => alert('CIT calculation saved! (Demo)')} 
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
