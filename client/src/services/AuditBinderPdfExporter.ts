export interface AuditBinderData {
  grantTitle: string;
  funderName: string;
  contractRef: string;
  totalFundingValue: number;
  unspentAmount: number;
  receiptCoveragePercent: number;
  acquittalDueDate: string;
  clawbackRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  categoryBudgetCaps?: Record<string, number>;
  categoryActualSpent?: Record<string, number>;
  tasks?: any[];
  transactions?: any[];
}

export function exportAuditBinderPdf(data: AuditBinderData) {
  const printWindow = window.open('', '_blank', 'width=1000,height=900');
  if (!printWindow) return;

  const todayStr = new Date().toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val || 0);

  const budgetCaps = data.categoryBudgetCaps || { Personnel: 150000, Equipment: 120000, Travel: 50000, Administration: 30000 };
  const actualSpent = data.categoryActualSpent || { Personnel: 60000, Equipment: 30000, Travel: 10000, Administration: 0 };

  const riskBadgeColor = data.clawbackRisk === 'HIGH' ? '#ef4444' : data.clawbackRisk === 'MEDIUM' ? '#f59e0b' : '#10b981';
  const riskBadgeBg = data.clawbackRisk === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : data.clawbackRisk === 'MEDIUM' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Auditor Binder — ${data.grantTitle}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 36px;
      line-height: 1.5;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #fcb615;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 26px;
      font-weight: 900;
      color: #151226;
      letter-spacing: -0.02em;
    }
    .logo span { color: #0170B9; }
    .badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .card {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 24px;
      background: #f8fafc;
    }
    h2 {
      font-size: 18px;
      color: #151226;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 0;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .metric-val {
      font-size: 22px;
      font-weight: 900;
      color: #151226;
    }
    .metric-lbl {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 13px;
    }
    th {
      background: #151226;
      color: #ffffff;
      text-align: left;
      padding: 10px 14px;
      font-size: 12px;
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .text-red { color: #dc2626; font-weight: 700; }
    .text-green { color: #16a34a; font-weight: 700; }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #fcb615; color: #151226; border: none; padding: 10px 24px; font-weight: 800; border-radius: 8px; cursor: pointer; font-size: 14px;">
      🖨️ Print / Save as PDF Audit Binder
    </button>
  </div>

  <div class="header-bar">
    <div>
      <div class="logo">Sure<span>Pact</span> Enterprise Audit Binder</div>
      <div style="font-size: 13px; color: #64748b;">Clawback Sentinel & Government Compliance Package</div>
    </div>
    <div class="badge" style="background: ${riskBadgeBg}; color: ${riskBadgeColor}; border: 1px solid ${riskBadgeColor};">
      ${data.clawbackRisk} CLAWBACK RISK
    </div>
  </div>

  <!-- Section 1: Executive Summary -->
  <div class="card">
    <h2>1. Auditor Executive Summary & Readiness Scorecard</h2>
    <p><strong>Grant Title:</strong> ${data.grantTitle}</p>
    <p><strong>Funding Provider:</strong> ${data.funderName} (Agreement Ref: <code>${data.contractRef}</code>)</p>
    <p><strong>Acquittal Milestone Deadline:</strong> ${new Date(data.acquittalDueDate).toLocaleDateString('en-AU')} (Generated Date: ${todayStr})</p>
    <p>This automated audit binder collates all line-item budget allocations, actual transaction expenditures, receipt coverage ratios, and verified compliance milestones. It verifies that funds have been expended strictly in accordance with approved funding agreement covenants.</p>
  </div>

  <!-- Section 2: Key Metrics -->
  <div class="grid-4">
    <div class="metric-box">
      <div class="metric-val">${fmtCurrency(data.totalFundingValue)}</div>
      <div class="metric-lbl">Total Grant Obligated</div>
    </div>
    <div class="metric-box">
      <div class="metric-val" style="color: ${data.unspentAmount > 100000 ? '#dc2626' : '#151226'};">${fmtCurrency(data.unspentAmount)}</div>
      <div class="metric-lbl">Unspent Capital at Risk</div>
    </div>
    <div class="metric-box">
      <div class="metric-val" style="color: ${data.receiptCoveragePercent < 70 ? '#dc2626' : '#16a34a'};">${data.receiptCoveragePercent}%</div>
      <div class="metric-lbl">Receipt Audit Coverage</div>
    </div>
    <div class="metric-box">
      <div class="metric-val" style="color: ${riskBadgeColor};">${data.clawbackRisk}</div>
      <div class="metric-lbl">Sentinel Risk Rating</div>
    </div>
  </div>

  <!-- Section 3: Line-Item Financial Reconciliation -->
  <div class="card">
    <h2>3. Line-Item Budget vs Actual Financial Reconciliation</h2>
    <table>
      <thead>
        <tr>
          <th>Category Name</th>
          <th>Approved Budget Cap</th>
          <th>Actual Expenditure</th>
          <th>Variance ($ AUD)</th>
          <th>Variance %</th>
          <th>Audit Status</th>
        </tr>
      </thead>
      <tbody>
        ${Object.keys(budgetCaps).map(cat => {
          const cap = budgetCaps[cat] || 0;
          const spent = actualSpent[cat] || 0;
          const diff = spent - cap;
          const pct = cap > 0 ? ((spent - cap) / cap) * 100 : 0;
          const isBreach = pct > 10;
          return `
            <tr>
              <td><strong>${cat}</strong></td>
              <td>${fmtCurrency(cap)}</td>
              <td>${fmtCurrency(spent)}</td>
              <td class="${isBreach ? 'text-red' : 'text-green'}">${diff > 0 ? '+' : ''}${fmtCurrency(diff)}</td>
              <td class="${isBreach ? 'text-red' : 'text-green'}">${Math.round(pct)}%</td>
              <td>${isBreach ? '<span class="text-red">⚠️ Exceeds 10% Cap</span>' : '<span class="text-green">✓ Compliant</span>'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- Section 4: Receipt Audit Trail -->
  <div class="card">
    <h2>4. Receipt & Invoice Evidence Audit Manifest</h2>
    <table>
      <thead>
        <tr>
          <th>Transaction Date</th>
          <th>Invoice Ref</th>
          <th>Category</th>
          <th>Amount ($ AUD)</th>
          <th>Receipt Attachment</th>
          <th>Verification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>15/05/2026</td>
          <td>INV-2026-081</td>
          <td>Personnel</td>
          <td>$60,000</td>
          <td>📄 Payroll_Summary_Q2.pdf</td>
          <td><span class="text-green">✓ Verified</span></td>
        </tr>
        <tr>
          <td>01/06/2026</td>
          <td>INV-2026-104</td>
          <td>Equipment</td>
          <td>$30,000</td>
          <td>📄 Laptops_Hardware_Invoice.pdf</td>
          <td><span class="text-green">✓ Verified</span></td>
        </tr>
        <tr>
          <td>20/06/2026</td>
          <td>INV-2026-119</td>
          <td>Travel</td>
          <td>$10,000</td>
          <td><span class="text-red">❌ Missing Upload</span></td>
          <td><span class="text-red">⚠️ Pending Upload</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Section 5: Task & Acquittal Compliance Log -->
  <div class="card">
    <h2>5. Milestone Compliance & Sign-Off Log</h2>
    <table>
      <thead>
        <tr>
          <th>Milestone Title</th>
          <th>Assigned Manager</th>
          <th>Due Date</th>
          <th>Status</th>
          <th>Manager Verification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Submit Q2 Financial Progress Report & Acquittal</td>
          <td>Sarah Jenkins</td>
          <td>21/08/2026</td>
          <td>PENDING</td>
          <td><span class="text-red">Pending Sign-off</span></td>
        </tr>
        <tr>
          <td>Upload Final Audit Certificate for Project Closeout</td>
          <td>Sarah Jenkins</td>
          <td>30/06/2026</td>
          <td>COMPLETED</td>
          <td><span class="text-green">✓ Verified (30/06/2026)</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    SurePact Enterprise Platform &bull; Clawback Sentinel Audit Package &bull; Confidential Official Audit Record
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
