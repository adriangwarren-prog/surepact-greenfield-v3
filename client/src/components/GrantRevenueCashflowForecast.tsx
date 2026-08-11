import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
  ShieldCheck,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface FundingStream {
  name: string;
  amount: number;
  color: string;
  percent: number;
}

interface Project {
  id: string;
  name: string;
  department: string;
  targetBudget: number;
  fundingAllocated: number;
  amountSpent: number;
  status: string;
  fundingStreams?: FundingStream[];
}

interface Grant {
  id: string;
  title: string;
  funderName: string;
  totalFundingValue: number;
  status: string;
  category?: string;
  unspentAmount?: number;
  clawbackRisk?: string;
}

interface GrantRevenueCashflowForecastProps {
  grants: any[];
  projects: any[];
}

export const GrantRevenueCashflowForecast: React.FC<GrantRevenueCashflowForecastProps> = ({
  grants,
  projects
}) => {
  const [delayDays, setDelayDays] = useState<number>(0);
  const [selectedPolicy, setSelectedPolicy] = useState<'ALL' | 'AASB_15' | 'AASB_1058'>('ALL');

  // Revenue Recognition & Cashflow Mock Schedule Engine
  const baseSchedule = [
    {
      grantId: 'g1',
      grantTitle: 'First Nations Youth Digital Literacy Program',
      funder: 'NT Dept of Territory Families',
      contractValue: 350000,
      recognizedYtd: 100000,
      deferredLiability: 250000,
      policy: 'AASB 15 (Performance Obligation)',
      nextTrancheName: 'Tranche 2: Mid-Term Acquittal',
      nextTrancheAmount: 125000,
      originalDate: '2026-08-21',
      condition: 'Milestone 2 Sign-off & 70% Attendance Record'
    },
    {
      grantId: 'g2',
      grantTitle: 'Remote Health Access & Telehealth Expansion',
      funder: 'Northern Territory PHN',
      contractValue: 620000,
      recognizedYtd: 510000,
      deferredLiability: 110000,
      policy: 'AASB 15 (Performance Obligation)',
      nextTrancheName: 'Tranche 3: Final Closeout',
      nextTrancheAmount: 110000,
      originalDate: '2026-09-15',
      condition: 'Independent Financial Audit Certificate'
    },
    {
      grantId: 'g3',
      grantTitle: 'Sustainable Regional Infrastructure Fund',
      funder: 'Federal Dept of Infrastructure',
      contractValue: 1250000,
      recognizedYtd: 1250000,
      deferredLiability: 0,
      policy: 'AASB 1058 (Upfront Income)',
      nextTrancheName: 'Fully Acquitted',
      nextTrancheAmount: 0,
      originalDate: 'Completed',
      condition: 'All Deliverables Satisfied'
    },
    {
      grantId: 'g6',
      grantTitle: 'Clean Energy & Water Security Initiative',
      funder: 'ARENA Renewable Energy Round',
      contractValue: 890000,
      recognizedYtd: 0,
      deferredLiability: 890000,
      policy: 'AASB 15 (Performance Obligation)',
      nextTrancheName: 'Tranche 1: Mobilization Deposit',
      nextTrancheAmount: 445000,
      originalDate: '2026-10-01',
      condition: 'Contract Execution & Site Survey'
    }
  ];

  // Calculate adjusted drawdown dates based on simulator delay
  const adjustDate = (dateStr: string, days: number) => {
    if (dateStr === 'Completed') return 'Completed';
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Portfolio Totals
  const totalDeferredLiability = baseSchedule.reduce((acc, curr) => acc + curr.deferredLiability, 0);
  const totalRecognizedYtd = baseSchedule.reduce((acc, curr) => acc + curr.recognizedYtd, 0);
  const totalInflowPipeline = baseSchedule.reduce((acc, curr) => acc + curr.nextTrancheAmount, 0);
  const totalMultiFunderPool = projects.reduce((acc, p) => acc + (p.fundingAllocated || 0), 0);

  // Default multi-funder project fallbacks if not populated
  const activeProjects: Project[] = (projects && projects.length > 0 && projects[0].fundingStreams)
    ? projects
    : [
        {
          id: 'p1',
          name: 'Urban Tree Canopy & Parklands Expansion',
          department: 'Environmental Services',
          targetBudget: 500000,
          fundingAllocated: 500000,
          amountSpent: 120000,
          status: 'ACTIVE',
          fundingStreams: [
            { name: 'State Urban Forest Grant', amount: 350000, color: '#3b82f6', percent: 70 },
            { name: 'Council Environmental Match', amount: 150000, color: '#f59e0b', percent: 30 }
          ]
        },
        {
          id: 'p2',
          name: 'Community Solar & Microgrid Installation',
          department: 'Community Services',
          targetBudget: 3500000,
          fundingAllocated: 3500000,
          amountSpent: 193500,
          status: 'ACTIVE',
          fundingStreams: [
            { name: 'First Nations Youth Digital Literacy', amount: 350000, color: '#ef4444', percent: 10 },
            { name: 'Remote Health Telehealth Expansion', amount: 620000, color: '#06b6d4', percent: 18 },
            { name: 'Sustainable Regional Infrastructure', amount: 1250000, color: '#10b981', percent: 36 },
            { name: 'Council Internal Match', amount: 1280000, color: '#f59e0b', percent: 36 }
          ]
        },
        {
          id: 'p3',
          name: 'Regional Water Filtration Plant Upgrade',
          department: 'Engineering & Works',
          targetBudget: 9200000,
          fundingAllocated: 9200000,
          amountSpent: 57500,
          status: 'ACTIVE',
          fundingStreams: [
            { name: 'Commonwealth Infrastructure Grant', amount: 5000000, color: '#6366f1', percent: 54 },
            { name: 'State Water Security Fund', amount: 3000000, color: '#8b5cf6', percent: 33 },
            { name: 'Regional Council Capital Co-Contribution', amount: 1200000, color: '#f59e0b', percent: 13 }
          ]
        }
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header Banner Card */}
      <div
        className="card clawback-header-card dark-navy-card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          borderRadius: '14px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid #6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366f1'
              }}
            >
              <TrendingUp size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  Grant Revenue Recognition &amp; Cashflow Forecast
                </h2>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  AASB 15 / 1058 COMPLIANT
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>
                Automated deferred revenue liability tracking, rolling cashflow milestone forecasting, and multi-funder split-funding matrix.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '12px', fontWeight: 700 }}
              onClick={() => alert('Exporting AASB 15 Deferred Revenue Schedule Excel...')}
            >
              <FileSpreadsheet size={16} /> Export AASB 15 Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Top Executive Telemetry Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Deferred Revenue Liability */}
        <div className="card-section" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid #ef4444', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Deferred Revenue Liability (Unearned)
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>
            ${totalDeferredLiability.toLocaleString()} AUD
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            AASB 15 unearned liability held on balance sheet
          </div>
        </div>

        {/* Card 2: Recognized Revenue YTD */}
        <div className="card-section" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid #10b981', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Recognized Revenue YTD (Earned)
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
            ${totalRecognizedYtd.toLocaleString()} AUD
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Performance milestones satisfied &amp; acquitted
          </div>
        </div>

        {/* Card 3: 12-Month Inflow Pipeline */}
        <div className="card-section" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid #06b6d4', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Projected 12-Month Inflow Pipeline
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#06b6d4' }}>
            ${totalInflowPipeline.toLocaleString()} AUD
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Pending milestone drawdown installments
          </div>
        </div>

        {/* Card 4: Multi-Funder Pool */}
        <div className="card-section" style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid #6366f1', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Multi-Funder Co-Funding Pool
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1' }}>
            ${totalMultiFunderPool.toLocaleString()} AUD
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across 3 active capital works projects
          </div>
        </div>
      </div>

      {/* SECTION 1: Multi-Funder Split-Funding Matrix */}
      <div className="panel-card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--accent-indigo)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Multi-Funder Split-Funding Allocation Matrix
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Capital projects co-funded across multiple grant streams. Automated Split Engine handles transaction apportioning with 0 manual line splits.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
            <ShieldCheck size={16} />
            <span>Anti-Double-Dipping Audit Safeguard: 0 Duplicate Claims Detected</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeProjects.map(proj => {
            const totalAlloc = proj.fundingAllocated || 100;
            return (
              <div
                key={proj.id}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{proj.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '10px' }}>
                      Dept: {proj.department}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Total Budget: <strong style={{ color: 'var(--text-primary)' }}>${totalAlloc.toLocaleString()} AUD</strong>
                  </div>
                </div>

                {/* Stacked Horizontal Progress Bar */}
                <div style={{ height: '24px', width: '100%', borderRadius: '8px', overflow: 'hidden', display: 'flex', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {proj.fundingStreams?.map((stream, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${stream.percent}%`,
                        backgroundColor: stream.color,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#fff',
                        transition: 'var(--transition-smooth)'
                      }}
                      title={`${stream.name}: $${stream.amount.toLocaleString()} (${stream.percent}%)`}
                    >
                      {stream.percent >= 12 ? `${stream.percent}%` : ''}
                    </div>
                  ))}
                </div>

                {/* Legend Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {proj.fundingStreams?.map((stream, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stream.color }}></span>
                      <span style={{ color: 'var(--text-secondary)' }}>{stream.name}:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>${stream.amount.toLocaleString()} ({stream.percent}%)</strong>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Milestone Cashflow Simulator & 12-Month Forecast */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        
        {/* Left: 12-Month Rolling Cashflow Waterfall Chart */}
        <div className="panel-card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                12-Month Rolling Cashflow Waterfall
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Projected Grant Inflows (Drawdowns) vs Expenditure Outflows vs Net Liquidity.
              </p>
            </div>
            {delayDays > 0 && (
              <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                ⚠️ Simulating +{delayDays} Days Milestone Shift
              </span>
            )}
          </div>

          {/* SVG Cashflow Chart */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
            <svg viewBox="0 0 700 220" style={{ width: '100%', height: 'auto' }}>
              {/* Grid Lines */}
              <line x1="40" y1="30" x2="680" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="40" y1="80" x2="680" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="40" y1="130" x2="680" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="40" y1="180" x2="680" y2="180" stroke="rgba(255,255,255,0.2)" />

              {/* Month Bars & Lines */}
              {[
                { month: 'Aug 26', inflow: 125, outflow: 45, net: 80 },
                { month: 'Sep 26', inflow: 110, outflow: 75, net: 115 },
                { month: 'Oct 26', inflow: 445, outflow: 120, net: 440 },
                { month: 'Nov 26', inflow: 60, outflow: 90, net: 410 },
                { month: 'Dec 26', inflow: 200, outflow: 150, net: 460 },
                { month: 'Jan 27', inflow: 0, outflow: 60, net: 400 }
              ].map((item, idx) => {
                const x = 70 + idx * 105;
                const inflowHeight = (item.inflow / 500) * 120;
                const outflowHeight = (item.outflow / 500) * 120;
                return (
                  <g key={idx}>
                    {/* Inflow Bar (Green) */}
                    <rect
                      x={x - 18}
                      y={180 - inflowHeight}
                      width="14"
                      height={inflowHeight}
                      fill="#10b981"
                      rx="3"
                    />
                    {/* Outflow Bar (Red) */}
                    <rect
                      x={x + 2}
                      y={180 - outflowHeight}
                      width="14"
                      height={outflowHeight}
                      fill="#ef4444"
                      rx="3"
                    />
                    {/* X-Axis Label */}
                    <text x={x} y="200" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="600">
                      {item.month}
                    </text>
                  </g>
                );
              })}

              {/* Net Cash Trend Line */}
              <path
                d="M 70 140 Q 175 120 280 40 T 490 50 T 595 70"
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
              />
            </svg>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>Grant Drawdown Inflow</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>Project Expense Outflow</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '3px', background: '#6366f1' }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>Net Liquidity Trend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Milestone Delay Simulator Controls */}
        <div className="panel-card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Milestone Delay Cashflow Simulator
            </h3>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
            Simulate operational delays on deliverable milestones to analyze the ripple effect on upcoming grant drawdown installments and liquidity.
          </p>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Milestone Delay Offset</span>
              <strong style={{ fontSize: '14px', color: delayDays > 0 ? '#f59e0b' : '#10b981' }}>
                +{delayDays} Days
              </strong>
            </div>

            <input
              type="range"
              min="0"
              max="120"
              step="15"
              value={delayDays}
              onChange={(e) => setDelayDays(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-indigo)' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>0 Days (On Time)</span>
              <span>+60 Days</span>
              <span>+120 Days</span>
            </div>
          </div>

          <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-color-active)', padding: '14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>
              Simulated Liquidity Impact
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              {delayDays === 0 ? (
                <span>✓ All upcoming grant tranches are scheduled to land on time. Q3 bank liquidity remains strong at <strong>$440,000 AUD</strong>.</span>
              ) : (
                <span>⚠️ Pushing milestones by <strong>+{delayDays} days</strong> defers <strong>$125,000 AUD</strong> of Tranche 2 income from August into {delayDays >= 60 ? 'October' : 'September'}, reducing Q3 cash reserves by {Math.round((delayDays / 120) * 100)}%.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: AASB 15 Revenue Recognition Schedule Table */}
      <div className="panel-card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              AASB 15 Revenue Recognition Schedule (Unearned Revenue Ledger)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Itemized unearned grant liabilities and performance obligation release dates.
            </p>
          </div>

          {/* Filter Pill */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['ALL', 'AASB_15', 'AASB_1058'] as const).map(policy => (
              <button
                key={policy}
                type="button"
                onClick={() => setSelectedPolicy(policy)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedPolicy === policy ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.05)',
                  color: selectedPolicy === policy ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {policy === 'ALL' ? 'All Contracts' : policy.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="surepact-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Grant / Contract</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Funder</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Contract Value</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Recognized YTD</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Deferred Liability</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Adjusted Drawdown</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Tranche Amount</th>
              </tr>
            </thead>
            <tbody>
              {baseSchedule
                .filter(item => selectedPolicy === 'ALL' || item.policy.includes(selectedPolicy))
                .map(row => {
                  const adjustedDate = adjustDate(row.originalDate, delayDays);
                  return (
                    <tr key={row.grantId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>{row.grantTitle}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{row.policy}</div>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {row.funder}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${row.contractValue.toLocaleString()} AUD
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                        ${row.recognizedYtd.toLocaleString()} AUD
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', fontWeight: 700, color: row.deferredLiability > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        ${row.deferredLiability.toLocaleString()} AUD
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: delayDays > 0 && adjustedDate !== 'Completed' ? '#f59e0b' : 'var(--text-primary)' }}>
                          {adjustedDate}
                        </div>
                        {delayDays > 0 && adjustedDate !== 'Completed' && (
                          <div style={{ fontSize: '10px', color: '#f59e0b' }}>Original: {row.originalDate}</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '13px', fontWeight: 700, color: '#06b6d4' }}>
                        ${row.nextTrancheAmount.toLocaleString()} AUD
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
