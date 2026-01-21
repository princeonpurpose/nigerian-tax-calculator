/**
 * Compliance & Administration Information Component
 */

import { useState } from 'react';
import { cn } from '@/utils/cn';
import { validateTIN } from '@/utils/validators';
import { FILING_DEADLINES, PENALTY_CATEGORIES, DISPUTE_RESOLUTION_DAYS } from '@/config/taxConfig';

export function ComplianceInfo() {
  const [tin, setTin] = useState('');
  const [tinValidation, setTinValidation] = useState<{ valid: boolean; message: string } | null>(null);

  const handleTINValidation = () => {
    const result = validateTIN(tin);
    setTinValidation(result);
  };

  return (
    <div className="space-y-6">
      {/* NRS Info */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🏛️</span>
          <div>
            <h2 className="text-xl font-bold">Nigeria Revenue Service (NRS)</h2>
            <p className="text-green-100 mt-1">
              The central tax authority established under the Nigeria Revenue Service (Establishment) Act 2025
            </p>
          </div>
        </div>
      </div>

      {/* TIN Validator */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
          <span>🔍</span> TIN Validation
        </h3>
        <p className="text-sm text-gray-600">
          Validate your Tax Identification Number (TIN) format. A valid TIN is required for all tax transactions.
        </p>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={tin}
              onChange={(e) => { setTin(e.target.value); setTinValidation(null); }}
              placeholder="Enter your TIN (e.g., 1234567890)"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleTINValidation}
            disabled={!tin}
            className={cn(
              'px-6 py-2 rounded-lg font-medium transition',
              tin
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Validate
          </button>
        </div>

        {tinValidation && (
          <div className={cn(
            'p-3 rounded-lg flex items-center gap-2',
            tinValidation.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          )}>
            <span>{tinValidation.valid ? '✓' : '✕'}</span>
            <span>{tinValidation.message}</span>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-amber-800">⚠️ Important</p>
          <p className="text-amber-700 mt-1">
            Awarding contracts to vendors without a valid TIN is prohibited and may result in penalties for both parties.
          </p>
        </div>
      </div>

      {/* Filing Deadlines */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
          <span>📅</span> Filing Deadlines
        </h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(FILING_DEADLINES).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <div>
                  <div className="font-medium text-gray-800">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                  <div className="text-sm text-gray-600">{value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-medium text-blue-800">💡 Pro Tip</p>
          <p className="text-sm text-blue-700 mt-1">
            Set calendar reminders for your filing deadlines. Late filing penalties start at ₦50,000 for the first month.
          </p>
        </div>
      </div>

      {/* Penalties */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
          <span>⚖️</span> Penalty Categories
        </h3>
        <p className="text-sm text-gray-600">
          The Nigeria Tax Administration Act 2025 strengthens penalties for non-compliance:
        </p>

        <div className="space-y-3">
          {Object.entries(PENALTY_CATEGORIES).map(([key, value]) => (
            <div key={key} className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
              <div className="font-medium text-red-800">
                {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </div>
              <div className="text-sm text-red-700 mt-1">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dispute Resolution */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
          <span>⏱️</span> Tax Dispute Resolution
        </h3>

        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 text-center">
          <div className="text-4xl font-bold text-blue-700">{DISPUTE_RESOLUTION_DAYS}</div>
          <div className="text-lg text-blue-600">Days</div>
          <div className="text-sm text-gray-600 mt-2">
            Maximum timeline for tax dispute resolution under the Joint Revenue Board Act 2025
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">Dispute Resolution Process:</h4>
          <ol className="text-sm text-gray-600 space-y-2">
            <li className="flex gap-2">
              <span className="font-bold text-green-600">1.</span>
              <span>Lodge formal objection with NRS within 30 days of assessment</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600">2.</span>
              <span>NRS review and response within 30 days</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600">3.</span>
              <span>Appeal to Tax Appeal Tribunal if unresolved</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600">4.</span>
              <span>Final resolution within {DISPUTE_RESOLUTION_DAYS} days</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
          <span>📚</span> Legal Framework Reference
        </h3>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800">Nigeria Tax Act (NTA)</h4>
            <p className="text-sm text-gray-600 mt-1">
              Consolidates income tax, capital gains tax, and other direct taxes
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800">Nigeria Tax Administration Act (NTAA)</h4>
            <p className="text-sm text-gray-600 mt-1">
              Governs tax administration, compliance, and enforcement
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800">NRS Establishment Act</h4>
            <p className="text-sm text-gray-600 mt-1">
              Creates the Nigeria Revenue Service as central tax authority
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800">Joint Revenue Board Act</h4>
            <p className="text-sm text-gray-600 mt-1">
              Coordinates federal, state, and local revenue collection
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center">
          All laws signed June 26, 2025 • Effective January 1, 2026
        </p>
      </div>
    </div>
  );
}
