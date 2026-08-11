import React, { useState, useEffect } from 'react';
import { processAskSurePactQuery } from '../services/askSurepactService';
import { DynamicChartRenderer } from './DynamicChartRenderer';
import { exportAnalyticsPdfReport } from '../services/AnalyticsPdfExporter';
import type {
  AskSurePactReportResponse,
  AskSurePactMetric,
  AskSurePactChartPoint
} from '../services/askSurepactService';

interface AskSurePactReporterProps {
  grants?: any[];
  projects?: any[];
  tasks?: any[];
  transactions?: any[];
  fundingBodies?: any[];
  businessUnits?: any[];
  onNavigateToGrant?: (grantId: string) => void;
  initialQuery?: string;
}

export const AskSurePactReporter: React.FC<AskSurePactReporterProps> = ({
  grants = [],
  projects = [],
  tasks = [],
  transactions = [],
  fundingBodies = [],
  businessUnits = [],
  onNavigateToGrant,
  initialQuery = ''
}) => {
  const [prompt, setPrompt] = useState<string>(
    initialQuery || (grants.length > 0 ? 'show me all grants we have applied to with NT based funding bodies in the past three years' : '')
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AskSurePactReportResponse | null>(null);
  const [savedQueries, setSavedQueries] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('surepact_pinned_queries');
      if (stored) return JSON.parse(stored);
      return grants.length > 0
        ? [
            'show me all grants we have applied to with NT based funding bodies in the past three years',
            'what percentage of grants we have applied for with state funding bodies have we won?'
          ]
        : [];
    } catch {
      return [];
    }
  });

  const [tableFilter, setTableFilter] = useState<string>('');
  const [isPinned, setIsPinned] = useState<boolean>(false);

  // Default sample chips
  const samplePrompts = [
    {
      label: '📍 NT Funders (3 Yrs)',
      text: 'show me all grants we have applied to with NT based funding bodies in the past three years'
    },
    {
      label: '🏆 Win Rate Breakdown',
      text: 'what percentage of grants we have applied for with state funding bodies have we won?'
    },
    {
      label: '💰 5-Year Funder Totals',
      text: 'how much total funding have we received from top 5 funders over the past 5 years'
    },
    {
      label: '⏳ Acquittals Due < 60 Days',
      text: 'which awarded grants have upcoming milestone acquittals due in the next 60 days with unspent budget over $50k'
    },
    {
      label: '⚠️ High Risk Evaluations',
      text: 'list all grants in Risk Assessment with high financial risk score but high strategic alignment'
    },
    {
      label: '🏢 Business Unit Financials',
      text: 'compare total income vs expenditure across all business units for FY2025-2026'
    },
    {
      label: '📋 Overdue Task Bottlenecks',
      text: 'show overdue tasks grouped by team member and associated grant funding contract'
    }
  ];

  const handleExecuteQuery = async (queryToRun?: string) => {
    const q = queryToRun !== undefined ? queryToRun : prompt;
    if (!q.trim()) return;

    setLoading(true);
    try {
      // Try backend endpoint first
      const res = await fetch('/api/analytics/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q })
      });
      const data = await res.json();
      const isTaskPrompt = /\btasks?\b|\bmilestones?\b|\bdue\b|\bmonths?\b|\bdeadlines?\b|\boverdue\b|\bacquittals?\b/i.test(q);
      const isProjectPrompt = /\bprojects?\b|\bcapital works?\b|\bspend\b|\bspent\b|\bdepartments?\b|\bcommunity services?\b|\bcummunity\b/i.test(q);
      const isMismatched = (isTaskPrompt && data.data?.tableHeaders && !data.data.tableHeaders.includes('Task Title')) ||
                           (isProjectPrompt && data.data?.tableHeaders && !data.data.tableHeaders.includes('Project Name'));

      if (data.success && data.data && !isMismatched && !data.data.queryTitle?.includes('Custom Analytics Search')) {
        setReport(data.data);
      } else {
        // Fallback to client service with exact smart entity routing
        const clientReport = processAskSurePactQuery(q, grants, tasks, transactions, fundingBodies, businessUnits, projects);
        setReport(clientReport);
      }
    } catch {
      // Offline fallback
      const clientReport = processAskSurePactQuery(q, grants, tasks, transactions, fundingBodies, businessUnits, projects);
      setReport(clientReport);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (grants.length > 0 && prompt) {
      handleExecuteQuery(prompt);
    }
  }, []);

  useEffect(() => {
    if (report && savedQueries.includes(prompt.trim())) {
      setIsPinned(true);
    } else {
      setIsPinned(false);
    }
  }, [report, prompt, savedQueries]);

  const handleTogglePin = () => {
    const currentQ = prompt.trim();
    if (!currentQ) return;
    let updated: string[];
    if (savedQueries.includes(currentQ)) {
      updated = savedQueries.filter(q => q !== currentQ);
      setIsPinned(false);
    } else {
      updated = [currentQ, ...savedQueries];
      setIsPinned(true);
    }
    setSavedQueries(updated);
    try {
      localStorage.setItem('surepact_pinned_queries', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save pinned queries:', e);
    }
  };

  const handleDownloadCSV = () => {
    if (!report || !report.csvData) return;
    const blob = new Blob([report.csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Ask_SurePact_Report_${report.queryTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    exportAnalyticsPdfReport({
      title: report.queryTitle || 'Ask SurePact AI Report',
      subtitle: report.queryIntentText || `Query: "${prompt}"`,
      summaryText: report.executiveSummary,
      metrics: report.metrics,
      tableHeaders: report.tableHeaders,
      tableRows: report.tableRows
    });
  };

  // Filter table rows
  const filteredRows = (report?.tableRows || []).filter((row: Record<string, any>) => {
    if (!tableFilter.trim()) return true;
    const search = tableFilter.toLowerCase();
    return Object.values(row).some(val => String(val).toLowerCase().includes(search));
  });

  return (
    <div className="ask-surepact-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Search Section */}
      <div
        className="ask-surepact-card dark-navy-card"
        style={{
          background: '#151226',
          borderRadius: '12px',
          padding: '28px',
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(21, 18, 38, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(252, 182, 21, 0.2)',
                border: '1px solid #fcb615',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}
            >
              ✨
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em', fontFamily: 'Raleway, sans-serif' }}>
                Ask SurePact &mdash; AI Natural Language Reporting
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', margin: '4px 0 0 0', fontWeight: 500 }}>
                Query any combination of grants, funders, budgets, risk scores, and acquittals using plain English.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span
              className="live-engine-badge"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#fcb615',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fcb615' }}></span>
              <span style={{ color: '#fcb615' }}>Live Data Engine</span>
            </span>
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleExecuteQuery();
          }}
          style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. show me all grants we have applied to with NT based funding bodies in the past three years"
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: '#ffffff',
                color: '#151226',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
            {prompt && (
              <button
                type="button"
                onClick={() => setPrompt('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#666666',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-yellow"
            style={{
              background: '#fcb615',
              color: '#151226',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 26px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(252, 182, 21, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <span style={{ color: '#151226' }}>Analyzing Data...</span>
            ) : (
              <>
                <span style={{ color: '#151226' }}>Generate Report</span>
                <span style={{ fontSize: '16px', color: '#151226' }}>➔</span>
              </>
            )}
          </button>
        </form>

        {/* Sample Prompt Chips */}
        <div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Suggested Natural Language Prompts:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {samplePrompts.map((chip, idx) => {
              const isSelected = prompt.trim() === chip.text;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(chip.text);
                    handleExecuteQuery(chip.text);
                  }}
                  className={isSelected ? 'prompt-chip-selected btn-yellow' : 'prompt-chip-unselected'}
                  style={{
                    background: isSelected ? '#fcb615' : 'rgba(255, 255, 255, 0.12)',
                    color: isSelected ? '#151226' : '#ffffff',
                    border: isSelected ? '1px solid #fcb615' : '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ color: isSelected ? '#151226' : '#ffffff' }}>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Saved / Pinned Dashboard Queries */}
      {savedQueries.length > 0 && (
        <div style={{ background: '#ffffff', borderRadius: '10px', padding: '16px 20px', border: '1px solid #E5E5E5', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d1a43', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📌</span> Pinned Report Widgets on Analytics Hub
            </div>
            <span style={{ fontSize: '11px', color: '#4B4F58' }}>Click any pinned query to re-run instantly</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {savedQueries.map((q, idx) => (
              <div
                key={idx}
                style={{
                  background: '#F5F5F5',
                  border: '1px solid #E5E5E5',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: '#2d2d2e',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span
                  onClick={() => {
                    setPrompt(q);
                    handleExecuteQuery(q);
                  }}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  "{q.length > 55 ? q.slice(0, 52) + '...' : q}"
                </span>
                <span
                  onClick={() => {
                    const updated = savedQueries.filter(sq => sq !== q);
                    setSavedQueries(updated);
                    localStorage.setItem('surepact_pinned_queries', JSON.stringify(updated));
                  }}
                  style={{ cursor: 'pointer', color: '#888', fontWeight: 800 }}
                  title="Unpin"
                >
                  ✕
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Container */}
      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive Header & Action Buttons */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '20px 24px',
              border: '1px solid #E5E5E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0170B9', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Generated AI Report &bull; {report.recordCount} Records Extracted
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1d1a43', margin: 0 }}>
                {report.queryTitle}
              </h3>
              <p style={{ fontSize: '13px', color: '#4B4F58', margin: '4px 0 0 0' }}>
                {report.queryIntentText}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleTogglePin}
                className={isPinned ? 'btn dark-navy-btn' : 'btn'}
                style={{
                  background: isPinned ? '#151226' : '#F5F5F5',
                  color: isPinned ? '#ffffff' : '#151226',
                  border: isPinned ? '1px solid #151226' : '1px solid #E5E5E5',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ color: isPinned ? '#ffffff' : '#151226' }}>
                  {isPinned ? '📌 Pinned to Dashboard' : '📌 Pin to Dashboard'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                style={{
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                }}
              >
                <span>Export PDF Report</span>
                <span style={{ fontSize: '14px' }}>📄</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                style={{
                  background: '#0170B9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(1, 112, 185, 0.25)'
                }}
              >
                <span>Export Report to CSV</span>
                <span style={{ fontSize: '14px' }}>📥</span>
              </button>
            </div>
          </div>

          {/* AI Executive Summary Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              padding: '20px 24px',
              borderLeft: '5px solid #0170B9',
              border: '1px solid #E5E5E5',
              borderLeftWidth: '5px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1d1a43', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Executive Summary
              </h4>
            </div>
            <p style={{ fontSize: '14px', color: '#2d2d2e', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
              {report.executiveSummary}
            </p>
          </div>

          {/* KPI Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {report.metrics.map((m: AskSurePactMetric, idx: number) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '18px 20px',
                  border: '1px solid #E5E5E5',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#4B4F58', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#1d1a43', margin: '8px 0 4px 0' }}>
                  {m.value}
                </div>
                {m.subtext && (
                  <div style={{ fontSize: '12px', color: '#0170B9', fontWeight: 600 }}>
                    {m.subtext}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Visualization Card */}
          {report.chartData && report.chartData.length > 0 && (
            <DynamicChartRenderer
              data={report.chartData}
              title="Distribution Breakdown"
              subtitle="Interactive Multi-Mode Metrics Visualization"
              defaultChartType={report.chartType || 'bar'}
            />
          )}

          {/* Interactive Data Table */}
          <div style={{ background: '#ffffff', borderRadius: '10px', padding: '20px 24px', border: '1px solid #E5E5E5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d1a43' }}>
                Detailed Extracted Records ({filteredRows.length})
              </div>

              <input
                type="text"
                value={tableFilter}
                onChange={e => setTableFilter(e.target.value)}
                placeholder="Filter extracted rows..."
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #E5E5E5',
                  fontSize: '13px',
                  outline: 'none',
                  minWidth: '220px'
                }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F5F5F5', borderBottom: '2px solid #E5E5E5' }}>
                    {report.tableHeaders.map((h: string, i: number) => (
                      <th key={i} style={{ padding: '12px 14px', fontWeight: 800, color: '#1d1a43', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={report.tableHeaders.length} style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                        No records match the active row filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row: Record<string, any>, rIdx: number) => (
                      <tr key={rIdx} style={{ borderBottom: '1px solid #E5E5E5', background: rIdx % 2 === 0 ? '#ffffff' : '#FAFAFA' }}>
                        {report.tableHeaders.map((h: string, cIdx: number) => {
                          const val = row[h];
                          const isStatus = h.toLowerCase().includes('status');
                          return (
                            <td key={cIdx} style={{ padding: '12px 14px', color: '#2d2d2e', fontWeight: cIdx === 0 ? 700 : 500 }}>
                              {isStatus ? (
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    background:
                                      val === 'AWARDED' || val === 'CLOSED' || val === 'On Track' || val === 'Compliant'
                                        ? '#e6f4ea'
                                        : val === 'REJECTED' || val === 'Overdue'
                                        ? '#fce8e6'
                                        : val === 'RISK_ASSESSMENT' || val === 'IN_PROGRESS'
                                        ? '#feefc3'
                                        : '#e8f0fe',
                                    color:
                                      val === 'AWARDED' || val === 'CLOSED' || val === 'On Track' || val === 'Compliant'
                                        ? '#137333'
                                        : val === 'REJECTED' || val === 'Overdue'
                                        ? '#c5221f'
                                        : val === 'RISK_ASSESSMENT' || val === 'IN_PROGRESS'
                                        ? '#b06000'
                                        : '#1a73e8'
                                  }}
                                >
                                  {val}
                                </span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
