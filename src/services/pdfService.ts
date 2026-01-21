/**
 * PDF Generation Service
 * 
 * PRODUCTION-READY IMPLEMENTATION
 * 
 * Generates professional PDF reports for tax calculations.
 * Uses browser's print-to-PDF capability for simple, dependency-free PDFs.
 * 
 * For advanced PDF generation (custom layouts, charts, etc.), consider:
 * - jsPDF: https://www.npmjs.com/package/jspdf
 * - pdf-lib: https://www.npmjs.com/package/pdf-lib
 * - React-PDF: https://www.npmjs.com/package/@react-pdf/renderer
 * - Server-side generation with Puppeteer
 */

import { formatNaira } from '@/utils/formatters';
import type { Calculation, CalculationType } from '@/types/database';

const TAX_TYPE_LABELS: Record<CalculationType, string> = {
  pit: 'Personal Income Tax (PIT/PAYE)',
  cit: 'Corporate Income Tax (CIT)',
  cgt: 'Capital Gains Tax (CGT)',
  vat: 'Value Added Tax (VAT)',
};

/**
 * Format date for display in PDF
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate HTML content for PDF
 */
function generatePDFHTML(calculation: Calculation): string {
  const results = calculation.results as Record<string, unknown>;
  const inputs = calculation.inputs as Record<string, unknown>;
  
  // Build results table based on calculation type
  let resultsHTML = '';
  let summaryHTML = '';
  
  switch (calculation.type) {
    case 'pit':
      summaryHTML = `
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Gross Income</span>
            <span class="value">${formatNaira((results.grossIncome as number) || 0)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Deductions</span>
            <span class="value">${formatNaira((results.totalDeductions as number) || 0)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Taxable Income</span>
            <span class="value">${formatNaira((results.taxableIncome as number) || 0)}</span>
          </div>
          <div class="summary-item highlight">
            <span class="label">Total Tax Payable</span>
            <span class="value">${formatNaira((results.totalTax as number) || 0)}</span>
          </div>
          <div class="summary-item success">
            <span class="label">Net Take-Home Pay</span>
            <span class="value">${formatNaira((results.netTakeHome as number) || 0)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Effective Tax Rate</span>
            <span class="value">${((results.effectiveRate as number) || 0).toFixed(2)}%</span>
          </div>
        </div>
      `;
      resultsHTML = `
        <h3>Calculation Details</h3>
        <table>
          <tr><th>Residency Status</th><td>${(inputs.isResident as boolean) ? 'Resident' : 'Non-Resident'}</td></tr>
          <tr><th>Days in Nigeria</th><td>${inputs.daysInNigeria || 'N/A'}</td></tr>
          ${(results.isExempt as boolean) ? `<tr><th>Status</th><td style="color: #16a34a; font-weight: bold;">Tax Exempt</td></tr>` : ''}
        </table>
      `;
      break;
      
    case 'cit':
      summaryHTML = `
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Company Size</span>
            <span class="value">${(results.companySize as string) === 'small' ? 'Small Company' : 'Standard Company'}</span>
          </div>
          <div class="summary-item">
            <span class="label">CIT Amount</span>
            <span class="value">${formatNaira((results.citAmount as number) || 0)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Development Levy</span>
            <span class="value">${formatNaira((results.developmentLevy as number) || 0)}</span>
          </div>
          <div class="summary-item highlight">
            <span class="label">Total Tax Payable</span>
            <span class="value">${formatNaira((results.totalTaxPayable as number) || 0)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Effective Tax Rate</span>
            <span class="value">${((results.effectiveTaxRate as number) || 0).toFixed(2)}%</span>
          </div>
        </div>
      `;
      resultsHTML = `
        <h3>Company Details</h3>
        <table>
          <tr><th>Turnover</th><td>${formatNaira((inputs.turnover as number) || 0)}</td></tr>
          <tr><th>Assessable Profits</th><td>${formatNaira((inputs.assessableProfits as number) || 0)}</td></tr>
          <tr><th>Company Type</th><td>${inputs.companyType || 'domestic'}</td></tr>
        </table>
      `;
      break;
      
    case 'cgt':
      summaryHTML = `
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Sale Proceeds</span>
            <span class="value">${formatNaira((inputs.saleProceeds as number) || 0)}</span>
          </div>
          <div class="summary-item">
            <span class="label">Capital Gain</span>
            <span class="value">${formatNaira((results.capitalGain as number) || 0)}</span>
          </div>
          <div class="summary-item highlight">
            <span class="label">CGT Payable</span>
            <span class="value">${formatNaira((results.cgtAmount as number) || 0)}</span>
          </div>
          <div class="summary-item success">
            <span class="label">Net Proceeds</span>
            <span class="value">${formatNaira((results.netProceeds as number) || 0)}</span>
          </div>
        </div>
      `;
      resultsHTML = `
        <h3>Asset Details</h3>
        <table>
          <tr><th>Taxpayer Type</th><td>${inputs.taxpayerType || 'individual'}</td></tr>
          <tr><th>Acquisition Cost</th><td>${formatNaira((inputs.acquisitionCost as number) || 0)}</td></tr>
          ${(results.isExempt as boolean) ? `<tr><th>Status</th><td style="color: #16a34a; font-weight: bold;">CGT Exempt</td></tr>` : ''}
        </table>
      `;
      break;
      
    case 'vat':
      if ((inputs.mode as string) === 'business') {
        summaryHTML = `
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Output VAT</span>
              <span class="value">${formatNaira((results.outputVAT as number) || 0)}</span>
            </div>
            <div class="summary-item">
              <span class="label">Input VAT</span>
              <span class="value">${formatNaira((results.inputVAT as number) || 0)}</span>
            </div>
            <div class="summary-item ${(results.isPayable as boolean) ? 'highlight' : 'success'}">
              <span class="label">${(results.isPayable as boolean) ? 'VAT Payable' : 'VAT Refundable'}</span>
              <span class="value">${formatNaira(Math.abs((results.netVAT as number) || 0))}</span>
            </div>
          </div>
        `;
      } else {
        summaryHTML = `
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Net Amount</span>
              <span class="value">${formatNaira((results.netAmount as number) || 0)}</span>
            </div>
            <div class="summary-item">
              <span class="label">VAT (7.5%)</span>
              <span class="value">${formatNaira((results.vatAmount as number) || 0)}</span>
            </div>
            <div class="summary-item highlight">
              <span class="label">Gross Amount</span>
              <span class="value">${formatNaira((results.grossAmount as number) || 0)}</span>
            </div>
          </div>
        `;
      }
      break;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Calculation Report - ${TAX_TYPE_LABELS[calculation.type]}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      line-height: 1.6;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #16a34a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header-left h1 {
      font-size: 24px;
      color: #16a34a;
    }
    .header-left p {
      color: #6b7280;
      font-size: 14px;
    }
    .header-right {
      text-align: right;
      font-size: 12px;
      color: #6b7280;
    }
    .type-badge {
      display: inline-block;
      background: #dcfce7;
      color: #16a34a;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .summary-item {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .summary-item .label {
      display: block;
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .summary-item .value {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
    }
    .summary-item.highlight {
      background: #fef3c7;
      border-color: #fcd34d;
    }
    .summary-item.highlight .value { color: #b45309; }
    .summary-item.success {
      background: #dcfce7;
      border-color: #86efac;
    }
    .summary-item.success .value { color: #16a34a; }
    h3 {
      font-size: 16px;
      color: #374151;
      margin: 30px 0 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    table th, table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    table th {
      background: #f9fafb;
      font-weight: 500;
      color: #6b7280;
      width: 40%;
    }
    table td {
      font-weight: 500;
    }
    .notes {
      margin-top: 30px;
      padding: 15px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
    }
    .notes h4 {
      font-size: 14px;
      color: #0369a1;
      margin-bottom: 5px;
    }
    .notes p {
      font-size: 14px;
      color: #0c4a6e;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
    .disclaimer {
      margin-top: 30px;
      padding: 15px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      font-size: 12px;
      color: #92400e;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>🇳🇬 Nigerian Tax Calculator</h1>
      <p>Tax Calculation Report</p>
    </div>
    <div class="header-right">
      <strong>Report Generated</strong><br>
      ${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}<br><br>
      <strong>Calculation Date</strong><br>
      ${formatDate(calculation.created_at)}
    </div>
  </div>

  <div class="type-badge">${TAX_TYPE_LABELS[calculation.type]}</div>

  ${summaryHTML}

  ${resultsHTML}

  ${calculation.notes ? `
  <div class="notes">
    <h4>Notes</h4>
    <p>${calculation.notes}</p>
  </div>
  ` : ''}

  <div class="disclaimer">
    <strong>⚠️ Disclaimer:</strong> This calculation is for informational purposes only and does not constitute legal or tax advice. 
    Please consult with a qualified tax professional or the Nigeria Revenue Service (NRS) for official guidance on your tax obligations.
  </div>

  <div class="footer">
    <p>Nigerian Tax Calculator 2026 • Based on Nigeria Tax Act, NTAA, NRS Establishment Act & Joint Revenue Board Act</p>
    <p>Laws signed: June 26, 2025 • Effective: January 1, 2026</p>
  </div>
</body>
</html>
  `;
}

/**
 * Download calculation as PDF
 * Opens a new window with print dialog
 */
export function downloadCalculationPDF(calculation: Calculation): void {
  const html = generatePDFHTML(calculation);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download the PDF report.');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

/**
 * Generate PDF blob for programmatic download
 * Returns a Blob that can be used with file-saver or similar
 */
export async function generatePDFBlob(calculation: Calculation): Promise<Blob> {
  const html = generatePDFHTML(calculation);
  return new Blob([html], { type: 'text/html' });
}

/**
 * Email calculation report
 * Opens email client with calculation summary
 */
export function emailCalculationReport(calculation: Calculation): void {
  const results = calculation.results as Record<string, unknown>;
  
  let subject = `Tax Calculation Report - ${TAX_TYPE_LABELS[calculation.type]}`;
  let body = `Nigerian Tax Calculator Report\n\n`;
  body += `Tax Type: ${TAX_TYPE_LABELS[calculation.type]}\n`;
  body += `Date: ${formatDate(calculation.created_at)}\n\n`;
  
  switch (calculation.type) {
    case 'pit':
      body += `Gross Income: ${formatNaira((results.grossIncome as number) || 0)}\n`;
      body += `Total Tax: ${formatNaira((results.totalTax as number) || 0)}\n`;
      body += `Net Take-Home: ${formatNaira((results.netTakeHome as number) || 0)}\n`;
      break;
    case 'cit':
      body += `Total Tax Payable: ${formatNaira((results.totalTaxPayable as number) || 0)}\n`;
      break;
    case 'cgt':
      body += `CGT Payable: ${formatNaira((results.cgtAmount as number) || 0)}\n`;
      break;
    case 'vat':
      body += `VAT Amount: ${formatNaira((results.vatAmount as number) || (results.netVAT as number) || 0)}\n`;
      break;
  }
  
  body += `\n---\nGenerated by Nigerian Tax Calculator 2026`;
  
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink, '_blank');
}
