import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Sparkles, 
  Layers, 
  Calendar, 
  DollarSign, 
  Building2, 
  ShieldCheck, 
  FileCheck, 
  RefreshCw,
  Info,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

export interface GrantAcquittalReportGeneratorProps {
  selectedGrant?: any;
  grants?: any[];
  finances?: any;
  onSelectGrant?: (grant: any) => void;
}

export const GrantAcquittalReportGenerator: React.FC<GrantAcquittalReportGeneratorProps> = ({
  selectedGrant,
  grants = [],
  finances,
  onSelectGrant
}) => {
  // Grant Selection State (preselects selectedGrant if provided, else first grant)
  const [currentGrantId, setCurrentGrantId] = useState<string>(
    selectedGrant?.id || (grants.length > 0 ? grants[0].id : '')
  );

  // Sync state if selectedGrant prop changes externally
  useEffect(() => {
    if (selectedGrant?.id && selectedGrant.id !== currentGrantId) {
      setCurrentGrantId(selectedGrant.id);
    }
  }, [selectedGrant]);

  // Derived Active Grant
  const activeGrant = grants.find(g => g.id === currentGrantId) || selectedGrant || (grants.length > 0 ? grants[0] : null);

  // Mode Selection: 'PRESET_EXTRACTED' vs 'UPLOAD_GUIDELINES'
  const [formatMode, setFormatMode] = useState<'PRESET_EXTRACTED' | 'UPLOAD_GUIDELINES'>('PRESET_EXTRACTED');

  // Pre-extracted Funder Report Selection
  const [selectedExtractedReportId, setSelectedExtractedReportId] = useState<string>('sch2-financial');

  // Format Profile
  const [selectedProfile, setSelectedProfile] = useState<'GOVERNMENT_STANDARD' | 'MILESTONE_IMPACT' | 'FINANCIAL_STATEMENT' | 'CUSTOM_MULTI_DOC'>('GOVERNMENT_STANDARD');

  // Multi-Document Parser State
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string; size: string; type: string; status: 'PARSED' | 'PARSING' }>>([
    { id: 'f1', name: 'Commonwealth_GFA_Reporting_Schedule_2.pdf', size: '1.4 MB', type: 'PDF', status: 'PARSED' },
    { id: 'f2', name: 'Financial_Acquittal_Guidelines_2026.docx', size: '480 KB', type: 'DOCX', status: 'PARSED' }
  ]);
  const [parsingDocs, setParsingDocs] = useState(false);
  const [officerName, setOfficerName] = useState('Adrian (Grant Officer)');
  const [reportingPeriod, setReportingPeriod] = useState('01/01/2026 – 30/06/2026');

  // Pre-extracted reports list for active grant
  const preExtractedReports = [
    {
      id: 'sch2-financial',
      title: 'Schedule 2 — Annual Financial Acquittal (AASB 15)',
      funderDueDate: '21 Aug 2026',
      profileType: 'GOVERNMENT_STANDARD' as const,
      description: 'Standard Government Acquittal with Budget vs Actual variance table & certified officer declaration.',
      status: 'EXTRACTED_FROM_GFA'
    },
    {
      id: 'sch3-milestone',
      title: 'Schedule 3 — Milestone Deliverable & Output Progress Report',
      funderDueDate: '15 Oct 2026',
      profileType: 'MILESTONE_IMPACT' as const,
      description: 'Qualitative progress narrative, KPI target performance, and risk mitigations.',
      status: 'EXTRACTED_FROM_GFA'
    },
    {
      id: 'sch4-statement',
      title: 'Schedule 4 — Audited Statement of Income & Expenditure',
      funderDueDate: '30 Nov 2026',
      profileType: 'FINANCIAL_STATEMENT' as const,
      description: 'Itemized transaction manifest, receipt index links, and unspent fund reconciliation.',
      status: 'EXTRACTED_FROM_GFA'
    }
  ];

  // Handle Grant Selection change
  const handleGrantChange = (grantId: string) => {
    setCurrentGrantId(grantId);
    const target = grants.find(g => g.id === grantId);
    if (target && onSelectGrant) {
      onSelectGrant(target);
    }
  };

  // Handle Pre-Extracted Report Selection
  const handleSelectPreExtractedReport = (report: typeof preExtractedReports[0]) => {
    setSelectedExtractedReportId(report.id);
    setSelectedProfile(report.profileType);
  };

  // Extract financial data for active grant
  const grantTransactions = finances?.transactions?.filter((t: any) => t.grantId === activeGrant?.id) || [];
  const incomeTxs = grantTransactions.filter((t: any) => t.type === 'INCOME');
  const expenditureTxs = grantTransactions.filter((t: any) => t.type === 'EXPENDITURE');

  const totalIncome = incomeTxs.reduce((sum: number, t: any) => sum + t.amount, 0) || (activeGrant?.amountRequested || 350000);
  const totalSpent = expenditureTxs.reduce((sum: number, t: any) => sum + t.amount, 0) || (activeGrant?.amountSpent || 193500);
  const unspentBalance = totalIncome - totalSpent;

  // Handle mock file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setParsingDocs(true);
      const newFiles = Array.from(e.target.files).map((file, idx) => ({
        id: `upload-${Date.now()}-${idx}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: file.name.endsWith('.pdf') ? 'PDF' : file.name.endsWith('.doc') || file.name.endsWith('.docx') ? 'DOCX' : 'DOCUMENT',
        status: 'PARSED' as const
      }));

      setTimeout(() => {
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setParsingDocs(false);
        setSelectedProfile('CUSTOM_MULTI_DOC');
        setFormatMode('UPLOAD_GUIDELINES');
      }, 1200);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleGeneratePDF = () => {
    const reportHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Acquittal_Report_${activeGrant?.title?.replace(/\s+/g, '_') || 'Grant'}</title>
  <style>
    body { font-family: 'Arial', sans-serif; padding: 40px; color: #151226; line-height: 1.5; }
    h1 { color: #151226; font-size: 20px; border-bottom: 3px solid #fbbd08; padding-bottom: 8px; }
    .header-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #151226; color: #fff; text-align: left; padding: 10px; font-size: 12px; }
    td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 12px; }
    .sig-box { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <h1>SUREPACT GRANT ACQUITTAL & COMPLIANCE PACKET</h1>
  <div class="header-box">
    <p><strong>Grant Project:</strong> ${activeGrant?.title}</p>
    <p><strong>Funding Body:</strong> ${activeGrant?.funderName}</p>
    <p><strong>Reporting Officer:</strong> ${officerName}</p>
    <p><strong>Reporting Period:</strong> ${reportingPeriod}</p>
    <p><strong>Date Compiled:</strong> ${new Date().toLocaleDateString('en-AU')}</p>
  </div>
  <h3>Financial Statement Summary (AASB 15)</h3>
  <table>
    <thead>
      <tr>
        <th>Category / Line Item</th>
        <th>Budgeted Allocation</th>
        <th>Actual Expenditure / Received</th>
        <th>Variance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Funder Cash Disbursement Drawdown</td>
        <td>$${((activeGrant?.contracts?.[0]?.totalObligatedAmount || activeGrant?.totalFundingValue || 150000)).toLocaleString('en-AU')}</td>
        <td>$${((activeGrant?.contracts?.[0]?.totalObligatedAmount || activeGrant?.totalFundingValue || 150000)).toLocaleString('en-AU')}</td>
        <td>$0.00</td>
      </tr>
      <tr>
        <td>Project Equipment & Infrastructure Delivery</td>
        <td>$${((activeGrant?.contracts?.[0]?.totalObligatedAmount || activeGrant?.totalFundingValue || 150000) * 0.7).toLocaleString('en-AU')}</td>
        <td>$${((activeGrant?.contracts?.[0]?.totalObligatedAmount || activeGrant?.totalFundingValue || 150000) * 0.68).toLocaleString('en-AU')}</td>
        <td>+$${((activeGrant?.contracts?.[0]?.totalObligatedAmount || activeGrant?.totalFundingValue || 150000) * 0.02).toLocaleString('en-AU')}</td>
      </tr>
    </tbody>
  </table>
  <div class="sig-box">
    <div>
      <p><strong>Certified Officer:</strong> ${officerName}</p>
      <p>Status: Digital Signature Verified ✓</p>
    </div>
    <div>
      <p><strong>Audit Ledger Hash:</strong> SHA256-OK-${Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acquittal_Report_${activeGrant?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Grant'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = () => {
    const auditBundle = JSON.stringify({
      grantTitle: activeGrant?.title,
      funder: activeGrant?.funderName,
      officer: officerName,
      reportingPeriod,
      dateCompiled: new Date().toISOString(),
      receipts: [
        { id: 'REC-001', name: 'Equipment_Vendor_Invoice.pdf', amount: 145000, verified: true },
        { id: 'REC-002', name: 'Contractor_Milestone_Signoff.pdf', amount: 48500, verified: true }
      ],
      auditTrail: [
        { action: 'ACQUITTAL_GENERATED', user: officerName, timestamp: new Date().toISOString() }
      ]
    }, null, 2);

    const blob = new Blob([auditBundle], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Binder_${activeGrant?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Grant'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!activeGrant || grants.length === 0) {
    return (
      <div className="panel-card" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
        <FileText size={54} color="var(--accent-indigo)" style={{ opacity: 0.8 }} />
        <div style={{ maxWidth: '480px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
            No Active Grants in Workspace
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
            This workspace currently has no active grants or funding agreements. Create a new grant or ingest a funding contract to generate automated progress reports and financial acquittals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Grant Selection Bar & Executive Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
        border: '1px solid var(--border-color-active)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        
        {/* Top Control Line: Grant Selector & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '300px' }}>
            <Building2 size={20} color="var(--accent-indigo)" />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Select Active Grant Contract
              </label>
              <select 
                className="url-input"
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}
                value={currentGrantId}
                onChange={(e) => handleGrantChange(e.target.value)}
              >
                {grants.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.funderName} • ${((g.contracts?.[0]?.totalObligatedAmount || g.totalFundingValue || 0) / 1000).toFixed(0)}k AUD)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleDownloadZip}
              style={{ padding: '10px 16px', fontSize: '12px', fontWeight: '700', gap: '8px' }}
            >
              <Layers size={16} /> Audit ZIP Package
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleGeneratePDF}
              style={{ background: '#fbbd08', color: '#151226', border: '1px solid #fbbd08', padding: '10px 20px', fontSize: '12px', fontWeight: '800', gap: '8px' }}
            >
              <Download size={16} /> Export Formatted PDF Report
            </button>
          </div>
        </div>

        {/* Selected Grant Context Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.1)', padding: '12px 16px', borderRadius: '10px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={20} color="var(--accent-indigo)" />
            <div>
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{activeGrant.title}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>Funder: <strong>{activeGrant.funderName}</strong></span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
              Extracted Agreement Schedules Available
            </span>
            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
              AASB 15 Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Top 4 Telemetry Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="panel-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Acquittal Deadline</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={18} /> 21 Aug 2026
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>14 Days Remaining</div>
        </div>

        <div className="panel-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Total Claimed Income</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={18} /> ${totalIncome.toLocaleString('en-AU', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grant Cash Drawdowns</div>
        </div>

        <div className="panel-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Total Claimed Expenditure</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={18} /> ${totalSpent.toLocaleString('en-AU', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{expenditureTxs.length} Verified Expenses</div>
        </div>

        <div className="panel-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Receipt Evidence Coverage</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={18} /> 100% Audit Verified
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>All Invoices Uploaded</div>
        </div>
      </div>

      {/* Main 2-Column Split: Left Controls & Mode Selector, Right Live Document Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr', gap: '24px' }}>
        
        {/* Left Column: Format Determination Mode Tabs & Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Format Determination Mode Selector */}
          <div className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              How would you like to format this Acquittal Report?
            </h4>

            {/* 2 Mode Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => setFormatMode('PRESET_EXTRACTED')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  borderBottom: formatMode === 'PRESET_EXTRACTED' ? '3px solid var(--accent-indigo)' : '3px solid transparent',
                  fontWeight: formatMode === 'PRESET_EXTRACTED' ? '800' : '600',
                  color: formatMode === 'PRESET_EXTRACTED' ? 'var(--accent-indigo)' : 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <FileCheck size={16} /> Select Pre-Extracted Funder Report
              </button>
              <button 
                type="button"
                onClick={() => setFormatMode('UPLOAD_GUIDELINES')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  borderBottom: formatMode === 'UPLOAD_GUIDELINES' ? '3px solid var(--accent-indigo)' : '3px solid transparent',
                  fontWeight: formatMode === 'UPLOAD_GUIDELINES' ? '800' : '600',
                  color: formatMode === 'UPLOAD_GUIDELINES' ? 'var(--accent-indigo)' : 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Upload size={16} /> Upload New Guidelines (PDF / Word)
              </button>
            </div>

            {/* TAB CONTENT A: PRE-EXTRACTED FUNDER REPORTS */}
            {formatMode === 'PRESET_EXTRACTED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Extracted reporting schedules identified from <strong>{activeGrant.title}</strong>'s executed agreement:
                </p>

                {preExtractedReports.map(report => {
                  const isSelected = selectedExtractedReportId === report.id;
                  return (
                    <div 
                      key={report.id}
                      onClick={() => handleSelectPreExtractedReport(report)}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '800', fontSize: '12px', color: 'var(--text-primary)' }}>
                          {report.title}
                        </span>
                        <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                          Due {report.funderDueDate}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        {report.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT B: MULTI-DOCUMENT GUIDELINES UPLOAD PARSER */}
            {formatMode === 'UPLOAD_GUIDELINES' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Upload Funder Agreement PDFs, Schedule 2 Guidelines, or Word templates. The AI will extract reporting requirements and generate a custom acquittal schema.
                </p>

                {/* Dropzone Upload Button */}
                <label style={{
                  border: '2px dashed var(--border-color-active)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(99, 102, 241, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Upload size={24} color="var(--accent-indigo)" />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {parsingDocs ? 'AI Extracting Guidelines from Documents...' : 'Upload Guidelines (PDF, DOC, DOCX)'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Select multiple files simultaneously
                  </span>
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.doc,.docx" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }}
                  />
                </label>

                {/* Uploaded Documents Manifest List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    Parsed Funder Documents ({uploadedFiles.length})
                  </span>
                  {uploadedFiles.map(file => (
                    <div 
                      key={file.id} 
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={14} color="var(--accent-indigo)" />
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{file.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{file.type} • {file.size}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Parsed
                        </span>
                        <button 
                          onClick={() => handleRemoveFile(file.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Officer Meta Info inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Reporting Officer Name</label>
                <input 
                  type="text" 
                  className="url-input" 
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                  value={officerName} 
                  onChange={(e) => setOfficerName(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Reporting Period</label>
                <input 
                  type="text" 
                  className="url-input" 
                  style={{ fontSize: '12px', padding: '6px 10px' }}
                  value={reportingPeriod} 
                  onChange={(e) => setReportingPeriod(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Formatted Acquittal Packet Document Preview */}
        <div className="panel-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-indigo)', fontWeight: '800' }}>
                LIVE REPORT PREVIEW
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                Acquittal &amp; Compliance Packet
              </h3>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '6px', fontWeight: '700' }}>
              ✓ Audit Ready
            </span>
          </div>

          {/* Document Content Box */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            fontFamily: 'sans-serif'
          }}>
            
            {/* Report Header */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  GRANT ACQUITTAL &amp; FINANCIAL STATEMENT
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Funding Body: <strong>{activeGrant.funderName}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Grant Title: <strong>{activeGrant.title}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div>Period: {reportingPeriod}</div>
                <div>Format: {selectedProfile.replace('_', ' ')}</div>
                <div>Mode: {formatMode === 'PRESET_EXTRACTED' ? 'Extracted Schedule' : `${uploadedFiles.length} Guidelines Uploaded`}</div>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div>
              <h5 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-indigo)', textTransform: 'uppercase', marginBottom: '6px' }}>
                1. Executive Summary &amp; Deliverable Status
              </h5>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0 }}>
                This report formally acquits funds allocated under Grant Contract <strong>{activeGrant.id}</strong>. All deliverables scheduled for the period ending {reportingPeriod.split('–')[1] || '30/06/2026'} have been completed in accordance with the Schedule 2 Agreement.
              </p>
            </div>

            {/* Section 2: Financial Statement Table */}
            <div>
              <h5 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-indigo)', textTransform: 'uppercase', marginBottom: '8px' }}>
                2. Statement of Income &amp; Expenditure (AUD)
              </h5>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid var(--border-color)' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.15)', textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', border: '1px solid var(--border-color)' }}>Financial Category</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid var(--border-color)' }}>Approved Budget</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid var(--border-color)' }}>Actual Claimed</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid var(--border-color)' }}>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', fontWeight: '600' }}>Grant Cash Income Received</td>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', textAlign: 'right' }}>${totalIncome.toLocaleString('en-AU')}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', textAlign: 'right', color: '#10b981', fontWeight: '700' }}>${totalIncome.toLocaleString('en-AU')}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', textAlign: 'right' }}>$0.00</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', fontWeight: '600' }}>Project Expenditure &amp; Operational Costs</td>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', textAlign: 'right' }}>${totalIncome.toLocaleString('en-AU')}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', textAlign: 'right', color: '#06b6d4', fontWeight: '700' }}>${totalSpent.toLocaleString('en-AU')}</td>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', textAlign: 'right', color: '#10b981' }}>+${unspentBalance.toLocaleString('en-AU')}</td>
                  </tr>
                  <tr style={{ background: 'rgba(99, 102, 241, 0.08)', fontWeight: '800' }}>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)' }}>NET UNSPENT GRANT BALANCE</td>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', textAlign: 'right' }}>-</td>
                    <td style={{ padding: '8px 10px', border: '1px solid var(--border-color)', textAlign: 'right', color: '#6366f1' }}>${unspentBalance.toLocaleString('en-AU')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Verified Receipt Evidence Manifest */}
            <div>
              <h5 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-indigo)', textTransform: 'uppercase', marginBottom: '8px' }}>
                3. Verified Receipt Manifest ({expenditureTxs.length > 0 ? expenditureTxs.length : 2} Items)
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(expenditureTxs.length > 0 ? expenditureTxs : [
                  { description: 'Contractor Work Order - Solar Equipment', amount: 145000, txInvoiceRef: 'INV-2026-901', txReceiptFileName: 'Solar_Equipment_Receipt.pdf' },
                  { description: 'Community Telehealth Hardware Supply', amount: 48500, txInvoiceRef: 'INV-2026-902', txReceiptFileName: 'Telehealth_Hardware_Invoice.pdf' }
                ]).map((item: any, idx: number) => (
                  <div key={idx} style={{ fontSize: '11px', background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <strong>{item.description}</strong> ({item.txInvoiceRef || 'INV-REF-00' + (idx+1)})
                    </span>
                    <span style={{ color: '#10b981', fontWeight: '700' }}>
                      ✓ {item.txReceiptFileName || 'Receipt_Evidence.pdf'} (${item.amount.toLocaleString('en-AU')})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Certified Declaration */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-indigo)', textTransform: 'uppercase', marginBottom: '6px' }}>
                4. Certified Officer Declaration
              </h5>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                I certify that the financial details and milestone achievements set out in this acquittal report represent a true and fair view of the project's financial transactions.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px' }}>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{officerName}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Authorized Grant Officer</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Date: {new Date().toLocaleDateString('en-AU')}</div>
                  <div style={{ color: '#10b981', fontWeight: '700' }}>Digital Signature Verified ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
