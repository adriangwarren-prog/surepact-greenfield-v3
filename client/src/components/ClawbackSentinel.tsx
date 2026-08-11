import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, ShieldAlert as ShieldWarning, FileText, Upload, AlertTriangle, CheckCircle, Clock, FileSpreadsheet, Download } from 'lucide-react';
import { exportAuditBinderPdf } from '../services/AuditBinderPdfExporter';

interface ClawbackSentinelProps {
  grants?: any[];
  tasks?: any[];
  transactions?: any[];
}

export const ClawbackSentinel: React.FC<ClawbackSentinelProps> = ({
  grants = [],
  tasks = [],
  transactions = []
}) => {
  const [selectedGrantId, setSelectedGrantId] = useState<string>('g1');
  const [uploadedReceipts, setUploadedReceipts] = useState<Record<string, boolean>>({
    'g1-personnel': true,
    'g1-equipment': true,
    'g1-travel': false
  });

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val || 0);

  const awardedGrants = grants.filter(g => g.status === 'AWARDED' || g.status === 'CLOSED');
  const activeGrants = awardedGrants;

  const totalAtRiskCapital = activeGrants.reduce((sum, g) => sum + (g.unspentAmount || 0), 0);
  const highRiskCount = activeGrants.filter(g => g.clawbackRisk === 'HIGH').length;
  const mediumRiskCount = activeGrants.filter(g => g.clawbackRisk === 'MEDIUM').length;
  const lowRiskCount = activeGrants.filter(g => g.clawbackRisk === 'LOW').length;
  const avgReceiptCoverage = Math.round(
    activeGrants.reduce((sum, g) => sum + (g.receiptCoveragePercent || 50), 0) / (activeGrants.length || 1)
  );

  const selectedGrant = activeGrants.find(g => g.id === selectedGrantId) || activeGrants[0];

  const handleSimulateUploadReceipt = (categoryKey: string) => {
    setUploadedReceipts(prev => ({ ...prev, [categoryKey]: true }));
  };

  const handleExportBinder = (grantItem: any) => {
    exportAuditBinderPdf({
      grantTitle: grantItem.title,
      funderName: grantItem.funderName,
      contractRef: grantItem.contracts?.[0]?.fundingAgreementReference || 'GFA-2026-01',
      totalFundingValue: grantItem.totalFundingValue || 350000,
      unspentAmount: grantItem.unspentAmount || 0,
      receiptCoveragePercent: grantItem.receiptCoveragePercent || 75,
      acquittalDueDate: grantItem.acquittalDueDate || '2026-08-21T00:00:00Z',
      clawbackRisk: grantItem.clawbackRisk || 'LOW',
      categoryBudgetCaps: grantItem.categoryBudgetCaps,
      categoryActualSpent: grantItem.categoryActualSpent
    });
  };

  return (
    <div className="clawback-sentinel-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sentinel Top Header Card */}
      <div
        className="card clawback-header-card dark-navy-card"
        style={{
          background: 'linear-gradient(135deg, #151226 0%, #1e1b38 100%)',
          borderRadius: '12px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(21, 18, 38, 0.25)',
          border: '1px solid rgba(252, 182, 21, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}
            >
              <ShieldAlert size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  Clawback Sentinel &amp; Audit Readiness Sentinel
                </h2>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  24/7 ACTIVE GUARDIAN
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0 0' }}>
                Continuous monitoring of unspent grant capital, milestone acquittal deadlines, category budget caps, and invoice receipt coverage.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleExportBinder(selectedGrant)}
            style={{
              background: '#fcb615',
              color: '#151226',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(252, 182, 21, 0.3)'
            }}
          >
            <Download size={16} />
            Generate Auditor Binder (PDF &amp; Zip)
          </button>
        </div>
      </div>

      {/* 4 Telemetry Exposure Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div className="panel-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #ef4444', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Unspent at Risk</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626', marginTop: '6px' }}>{fmtCurrency(totalAtRiskCapital)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Across {activeGrants.length} active agreements</div>
        </div>

        <div className="panel-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #f59e0b', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Clawback Exposure</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#151226', marginTop: '6px' }}>
            <span style={{ color: '#ef4444' }}>{highRiskCount} High</span> &bull; <span style={{ color: '#f59e0b' }}>{mediumRiskCount} Med</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{lowRiskCount} Audit-Ready Grants</div>
        </div>

        <div className="panel-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #0170B9', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Portfolio Receipt Audit %</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0170B9', marginTop: '6px' }}>{avgReceiptCoverage}%</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Verified Expenditure Invoices</div>
        </div>

        <div className="panel-card" style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Next Acquittal Milestone</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', marginTop: '6px' }}>14 Days</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Due 21/08/2026 (GFA-2024-88)</div>
        </div>
      </div>

      {/* Main Grid: Active Grants Sentinel Status & Detail Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        {/* Active Grants Sentinel Risk Table */}
        <div className="panel-card" style={{ background: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#151226', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} color="#0170B9" />
            Active Grant Sentinel Risk Matrix
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Risk Status</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Grant / Agreement</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Unspent AUD</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Receipt Coverage</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeGrants.map(grant => {
                const isSelected = grant.id === selectedGrantId;
                const riskColor = grant.clawbackRisk === 'HIGH' ? '#ef4444' : grant.clawbackRisk === 'MEDIUM' ? '#f59e0b' : '#10b981';
                const riskBg = grant.clawbackRisk === 'HIGH' ? 'rgba(239, 68, 68, 0.12)' : grant.clawbackRisk === 'MEDIUM' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';

                return (
                  <tr
                    key={grant.id}
                    onClick={() => setSelectedGrantId(grant.id)}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isSelected ? 'rgba(1, 112, 185, 0.05)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          background: riskBg,
                          color: riskColor,
                          border: `1px solid ${riskColor}`,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {grant.clawbackRisk === 'HIGH' && <ShieldAlert size={12} />}
                        {grant.clawbackRisk === 'MEDIUM' && <ShieldWarning size={12} />}
                        {grant.clawbackRisk === 'LOW' && <ShieldCheck size={12} />}
                        {grant.clawbackRisk} RISK
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#151226' }}>{grant.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{grant.funderName} &bull; <code>{grant.contracts?.[0]?.fundingAgreementReference || 'GFA-2026'}</code></div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 800, color: grant.unspentAmount > 100000 ? '#dc2626' : '#151226' }}>
                      {fmtCurrency(grant.unspentAmount)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${grant.receiptCoveragePercent}%`, height: '100%', background: grant.receiptCoveragePercent < 70 ? '#ef4444' : '#10b981' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{grant.receiptCoveragePercent}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportBinder(grant);
                        }}
                        style={{
                          background: '#151226',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Audit Binder
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Grant Detailed Inspection & Receipt Gap Inspector */}
        <div className="panel-card" style={{ background: '#ffffff', borderRadius: '10px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#151226', margin: '0 0 8px 0' }}>
            Audit Inspection &amp; Receipt Gap Checklist
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
            Inspecting: <strong>{selectedGrant.title}</strong>
          </p>

          {/* Line Item Budget Variance */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#151226', marginBottom: '10px', textTransform: 'uppercase' }}>
              Line-Item Budget vs Actual Variance
            </div>
            {Object.keys(selectedGrant.categoryBudgetCaps || {}).map(cat => {
              const cap = selectedGrant.categoryBudgetCaps[cat] || 0;
              const spent = selectedGrant.categoryActualSpent[cat] || 0;
              const isBreach = cap > 0 && ((spent - cap) / cap) > 0.1;

              return (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#151226' }}>{cat}</span>
                    <span style={{ color: '#64748b', marginLeft: '6px' }}>Cap: {fmtCurrency(cap)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: isBreach ? '#dc2626' : '#151226' }}>Spent: {fmtCurrency(spent)}</span>
                    {isBreach ? (
                      <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        ⚠️ &gt;10% Cap Breach
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                        ✓ OK
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Missing Receipt Gap Checklist */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#151226', marginBottom: '10px', textTransform: 'uppercase' }}>
              Expenditure Receipt Evidence Status
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#151226' }}>Personnel Wages Q2 &bull; $60,000 AUD</div>
                  <div style={{ fontSize: '11px', color: '#16a34a' }}>✓ Payroll_Summary_Q2.pdf Attached</div>
                </div>
                <CheckCircle size={16} color="#16a34a" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#151226' }}>Equipment Laptops &bull; $30,000 AUD</div>
                  <div style={{ fontSize: '11px', color: '#16a34a' }}>✓ Hardware_Invoice.pdf Attached</div>
                </div>
                <CheckCircle size={16} color="#16a34a" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: '#ffffff', padding: '10px', borderRadius: '6px', border: uploadedReceipts['g1-travel'] ? '1px solid #10b981' : '1px solid #ef4444' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#151226' }}>Regional Travel &amp; Flight Booking &bull; $10,000 AUD</div>
                  {uploadedReceipts['g1-travel'] ? (
                    <div style={{ fontSize: '11px', color: '#16a34a' }}>✓ Travel_Receipt_Uploaded.pdf Attached</div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#dc2626' }}>⚠️ Missing Upload &bull; Audit Gap</div>
                  )}
                </div>
                {uploadedReceipts['g1-travel'] ? (
                  <CheckCircle size={16} color="#16a34a" />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSimulateUploadReceipt('g1-travel')}
                    style={{
                      background: '#0170B9',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Upload size={12} /> Upload Receipt
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
