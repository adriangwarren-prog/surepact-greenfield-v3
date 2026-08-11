export interface PdfReportData {
  title: string;
  subtitle?: string;
  generatedBy?: string;
  summaryText?: string;
  metrics?: Array<{ label: string; value: string | number; subtext?: string }>;
  tableHeaders?: string[];
  tableRows?: Array<Record<string, any>>;
}

export function exportAnalyticsPdfReport(data: PdfReportData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export the PDF report.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const metricsHtml = (data.metrics || [])
    .map(
      m => `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; flex: 1; min-width: 180px;">
      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">${m.label}</div>
      <div style="font-size: 22px; font-weight: 800; color: #151226; margin: 6px 0 2px 0;">${m.value}</div>
      ${m.subtext ? `<div style="font-size: 11px; color: #4c3a9e; font-weight: 600;">${m.subtext}</div>` : ''}
    </div>
  `
    )
    .join('');

  const headers = data.tableHeaders || (data.tableRows && data.tableRows.length > 0 ? Object.keys(data.tableRows[0]) : []);
  const headersHtml = headers.map(h => `<th style="padding: 10px 12px; background: #151226; color: #ffffff; text-align: left; font-size: 11px; text-transform: uppercase;">${h}</th>`).join('');

  const rowsHtml = (data.tableRows || [])
    .map(
      (row, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
      ${headers.map(h => `<td style="padding: 10px 12px; font-size: 12px; color: #0f172a;">${row[h] !== undefined ? row[h] : ''}</td>`).join('')}
    </tr>
  `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.title} - SurePact Executive Report</title>
        <style>
          body {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #151226;
            margin: 0;
            padding: 32px;
            background: #ffffff;
          }
          .header-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #fbbd08;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            color: #151226;
          }
          .logo-sub {
            font-size: 11px;
            color: #06b6d4;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .report-meta {
            text-align: right;
            font-size: 12px;
            color: #64748b;
          }
          .summary-card {
            background: #f1f5f9;
            border-left: 4px solid #4c3a9e;
            padding: 16px 20px;
            border-radius: 6px;
            margin-bottom: 24px;
            font-size: 13px;
            line-height: 1.6;
            color: #334155;
          }
          .metrics-grid {
            display: flex;
            gap: 16px;
            margin-bottom: 28px;
            flex-wrap: wrap;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-banner">
          <div>
            <div class="logo-text">SurePact</div>
            <div class="logo-sub">Executive Grant & Financial Intelligence</div>
          </div>
          <div class="report-meta">
            <div><strong>Date:</strong> ${currentDate}</div>
            <div><strong>Author:</strong> ${data.generatedBy || 'Adrian Warren'}</div>
            <div><strong>Status:</strong> Official Confidential Report</div>
          </div>
        </div>

        <h1 style="font-size: 22px; font-weight: 800; color: #151226; margin: 0 0 6px 0;">${data.title}</h1>
        ${data.subtitle ? `<p style="font-size: 13px; color: #64748b; margin: 0 0 20px 0;">${data.subtitle}</p>` : ''}

        ${
          data.summaryText
            ? `
          <div class="summary-card">
            <strong>🤖 Executive Synthesis:</strong><br/>
            ${data.summaryText}
          </div>
        `
            : ''
        }

        ${metricsHtml ? `<div class="metrics-grid">${metricsHtml}</div>` : ''}

        ${
          data.tableRows && data.tableRows.length > 0
            ? `
          <h3 style="font-size: 15px; font-weight: 700; color: #151226; margin-top: 24px;">Extracted Audit Records (${data.tableRows.length})</h3>
          <table>
            <thead><tr>${headersHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        `
            : ''
        }

        <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
          Generated automatically by SurePact AI Engine &bull; Confidential Internal Report
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
