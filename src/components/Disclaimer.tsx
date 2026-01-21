/**
 * Legal disclaimer component
 */

export function Disclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
      <div className="flex gap-3">
        <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
        <div>
          <p className="font-medium">Disclaimer</p>
          <p className="mt-1 text-amber-700">
            This calculator is for informational purposes only and does not constitute legal or tax advice. 
            Please consult a qualified tax professional or the Nigeria Revenue Service (NRS) for official guidance 
            on your tax obligations.
          </p>
        </div>
      </div>
    </div>
  );
}
