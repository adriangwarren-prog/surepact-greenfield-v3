import React from 'react';
import { AskSurePactReporter } from './AskSurePactReporter';
import { ClawbackSentinel } from './ClawbackSentinel';
import { DynamicChartRenderer } from './DynamicChartRenderer';
import { exportAnalyticsPdfReport } from '../services/AnalyticsPdfExporter';
import { Download, DollarSign, CheckSquare, Users, Activity } from 'lucide-react';

interface AnalyticsHubProps {
  grants?: any[];
  projects?: any[];
  tasks?: any[];
  finances?: any;
  fundingBodies?: any[];
  businessUnits?: any[];
  onNavigateToGrant?: (grantId: string) => void;
}

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({
  grants = [],
  projects = [],
  tasks = [],
  finances,
  fundingBodies = [],
  businessUnits = [],
  onNavigateToGrant
}) => {
  const today = new Date('2026-07-01T09:44:15+10:00');

  // 1. Grants Calculations
  const activeGrants = grants.filter(g => g.status === 'AWARDED' || g.status === 'CLOSED');
  const activeGrantsCount = activeGrants.length;
  const activeGrantsValue = activeGrants.reduce((sum, g) => {
    const amt = g.contracts?.[0]?.totalObligatedAmount ?? g.totalFundingValue ?? 0;
    return sum + amt;
  }, 0);

  const pendingGrants = grants.filter(g => g.status === 'APPLICATION_STAGED' || g.status === 'SUBMITTED');
  const pendingGrantsCount = pendingGrants.length;
  const pendingGrantsValue = pendingGrants.reduce((sum, g) => sum + (g.amountRequested || 0), 0);

  const awardedCount = grants.filter(g => g.status === 'AWARDED').length;
  const rejectedCount = grants.filter(g => g.status === 'REJECTED').length;
  const winLossRatio = (awardedCount + rejectedCount) === 0 ? '0%' : `${Math.round((awardedCount / (awardedCount + rejectedCount)) * 100)}%`;

  // Next Quarter Dates
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentQuarter = Math.floor(currentMonth / 3);
  const nextQuarter = (currentQuarter + 1) % 4;
  const nextQuarterYear = currentQuarter === 3 ? currentYear + 1 : currentYear;
  const nextQStart = new Date(nextQuarterYear, nextQuarter * 3, 1);
  const nextQEnd = new Date(nextQuarterYear, (nextQuarter * 3) + 3, 0);

  const grantsEndingNextQuarter = grants.filter(g => {
    if (!g.closeDate) return false;
    const d = new Date(g.closeDate);
    return d >= nextQStart && d <= nextQEnd;
  }).length;

  const grantsAwaitingRiskApproval = grants.filter(g => g.status === 'RISK_ASSESSMENT').length;

  // Funder analytics
  const funderTotals: Record<string, number> = {};
  grants.forEach(g => {
    const amt = g.contracts?.[0]?.totalObligatedAmount ?? g.totalFundingValue ?? 0;
    funderTotals[g.funderName || 'Unspecified Funder'] = (funderTotals[g.funderName || 'Unspecified Funder'] || 0) + amt;
  });
  const topFunders = Object.entries(funderTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxFunderValue = topFunders.length > 0 ? topFunders[0][1] : 1;

  // 2. Tasks Calculations
  const overdueTasks = tasks.filter(t => t.status !== 'COMPLETED' && new Date(t.dueDate) < today);
  const overdueTasksCount = overdueTasks.length;

  const tasksDue30DaysLimit = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const tasksDue30DaysCount = tasks.filter(t => t.status !== 'COMPLETED' && new Date(t.dueDate) >= today && new Date(t.dueDate) <= tasksDue30DaysLimit).length;

  const sumOverdueDays = overdueTasks.reduce((sum, t) => {
    const diffTime = today.getTime() - new Date(t.dueDate).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);
  const avgDaysOverdue = overdueTasksCount === 0 ? 0 : Math.round(sumOverdueDays / overdueTasksCount);

  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const taskCompletionPercent = tasks.length === 0 ? 0 : Math.round((completedTasksCount / tasks.length) * 100);

  // 3. CRM Calculations
  const allInteractions = fundingBodies.flatMap(fb => (fb.contacts || []).flatMap((c: any) => c.interactions || []));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const interactionsThisMonthCount = allInteractions.filter(i => {
    const d = new Date(i.createdAt);
    return d >= startOfMonth && d <= endOfMonth;
  }).length;

  const upcomingCrmTasksThisMonthCount = allInteractions.filter(i => {
    if (i.type !== 'TASK' || i.status === 'COMPLETED' || !i.dueDate) return false;
    const d = new Date(i.dueDate);
    return d >= today && d <= endOfMonth;
  }).length;

  const overdueCrmTasksCount = allInteractions.filter(i => {
    if (i.type !== 'TASK' || i.status === 'COMPLETED' || !i.dueDate) return false;
    const d = new Date(i.dueDate);
    return d < today;
  }).length;

  const opportunitiesCreatedThisYearCount = fundingBodies
    .flatMap(fb => fb.opportunities || [])
    .filter(o => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === today.getFullYear();
    }).length;

  const interactionTypes = { EMAIL: 0, CALL: 0, MEETING: 0, NOTE: 0, TASK: 0 };
  allInteractions.forEach(i => {
    if (i.type in interactionTypes) {
      interactionTypes[i.type as keyof typeof interactionTypes]++;
    }
  });
  const totalInteractions = allInteractions.length || 1;

  // 4. Projects Calculations
  const openProjects = projects.filter(p => p.status === 'IN_PROGRESS');
  const openProjectsCount = openProjects.length;

  const overdueProjectTasksCount = tasks.filter(t => t.projectId && t.status !== 'COMPLETED' && new Date(t.dueDate) < today).length;
  const upcomingProjectTasksThisMonthCount = tasks.filter(t => t.projectId && t.status !== 'COMPLETED' && new Date(t.dueDate) >= today && new Date(t.dueDate) <= endOfMonth).length;

  const qStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
  const qEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
  const upcomingMilestonesThisQuarterCount = projects
    .flatMap(p => p.milestones || [])
    .filter(m => m.dueDate && new Date(m.dueDate) >= qStart && new Date(m.dueDate) <= qEnd).length;

  const totalProjectBudget = projects.reduce((sum, p) => sum + (p.budgetAmount || p.totalCost || 0), 0);
  const transactionsList = finances?.transactions || [];
  const totalProjectSpend = transactionsList
    .filter((t: any) => t.projectId && t.type === 'EXPENDITURE')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const budgetSpentPercent = totalProjectBudget === 0 ? 0 : Math.round((totalProjectSpend / totalProjectBudget) * 100);

  // Department Budget allocation breakdown
  const deptBudgets: Record<string, { allocated: number; spent: number }> = {};
  projects.forEach(p => {
    const dept = p.department || 'General';
    if (!deptBudgets[dept]) deptBudgets[dept] = { allocated: 0, spent: 0 };
    deptBudgets[dept].allocated += p.budgetAmount || p.totalCost || 0;

    const projTransactions = transactionsList.filter((t: any) => t.projectId === p.id && t.type === 'EXPENDITURE');
    deptBudgets[dept].spent += projTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  });

  // Dynamic Chart Points Data
  const funderChartData = topFunders.map(([label, value]) => ({
    label,
    value,
    category: 'Funding Body'
  }));

  const projectChartData = projects.map(p => ({
    label: p.name || 'Project',
    value: p.budgetAmount || p.totalCost || 0,
    category: 'Capital Project'
  }));

  const handleExportExecutivePdf = () => {
    exportAnalyticsPdfReport({
      title: 'SurePact Platform Executive Intelligence Report',
      subtitle: 'Comprehensive Cross-System Analytics, Awarded Grants, & Capital Expenditures',
      summaryText: `As of ${new Date().toLocaleDateString('en-AU')}, SurePact is managing ${grants.length} total grant opportunities worth $${activeGrantsValue.toLocaleString()} in active awarded funding. System compliance index is at ${tasks.length === 0 ? 100 : Math.round(((tasks.length - overdueTasksCount) / tasks.length) * 100)}% across ${tasks.length} active acquittal milestones.`,
      metrics: [
        { label: 'Active Awarded Grants', value: activeGrantsCount, subtext: 'In Obligation Mgmt' },
        { label: 'Total Awarded Funding', value: `$${activeGrantsValue.toLocaleString()}`, subtext: 'Executed Agreements' },
        { label: 'Applications Staged', value: pendingGrantsCount, subtext: 'Pre-Pipeline' },
        { label: 'Active Capital Projects', value: projects.length, subtext: 'Split-Funding Tracking' }
      ],
      tableHeaders: ['Grant Title', 'Funder Agency', 'Status', 'Total Value', 'Closing Date'],
      tableRows: grants.map(g => ({
        'Grant Title': g.title,
        'Funder Agency': g.funderName,
        'Status': g.status,
        'Total Value': g.totalFundingValue ? `$${g.totalFundingValue.toLocaleString()}` : '$0',
        'Closing Date': g.closeDate ? new Date(g.closeDate).toLocaleDateString('en-AU') : 'N/A'
      }))
    });
  };

  return (
    <div className="panel animate" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Controls Header Bar with Compact PDF Export Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '-8px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Analytics Hub
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Cross-system performance indicators, compliance indices, fund drawdowns, and CRM statistics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExecutivePdf}
          className="btn"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
          }}
        >
          <Download size={14} />
          Export PDF Executive Summary
        </button>
      </div>

      {/* 1. Ask SurePact Natural Language AI Reporter */}
      <AskSurePactReporter
        grants={grants}
        projects={projects}
        tasks={tasks}
        transactions={transactionsList}
        fundingBodies={fundingBodies}
        businessUnits={businessUnits}
        onNavigateToGrant={onNavigateToGrant}
      />

      {/* 1b. Clawback Sentinel & Audit Readiness Guardian */}
      <ClawbackSentinel
        grants={grants}
        tasks={tasks}
        transactions={transactionsList}
      />

      {/* 2. Top Row: System Health Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="metric-card">
          <div className="metric-info">
            <h3>Active Inbound Funds</h3>
            <div className="metric-value" style={{ color: 'var(--color-success)' }}>
              ${activeGrantsValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="metric-icon-box green">
            <DollarSign size={22} />
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-info">
            <h3>Compliance Score</h3>
            <div className="metric-value" style={{ color: overdueTasksCount === 0 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {tasks.length === 0 ? '100' : Math.round(((tasks.length - overdueTasksCount) / tasks.length) * 100)}%
            </div>
          </div>
          <div className="metric-icon-box cyan">
            <CheckSquare size={22} />
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-info">
            <h3>CRM Contacts Touch</h3>
            <div className="metric-value">
              {interactionsThisMonthCount} Interactions
            </div>
          </div>
          <div className="metric-icon-box indigo">
            <Users size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Capital Works Drawdown</h3>
            <div className="metric-value" style={{ color: budgetSpentPercent > 90 ? 'var(--color-danger)' : 'var(--color-warning)' }}>
              {budgetSpentPercent}% Spent
            </div>
          </div>
          <div className="metric-icon-box warning">
            <Activity size={22} />
          </div>
        </div>
      </div>

      {/* 3. Main Analytics Grid (Grants, Tasks, CRM, Projects Telemetry) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Panel 1: Grants Analytics */}
        <div className="panel-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Grants Telemetry</span>
            <span className="badge badge-potential">AWARD METRICS</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Grants:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{activeGrantsCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Grants Value:</span>
                <span style={{ color: 'var(--color-success)', fontWeight: '700' }}>${activeGrantsValue.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pending Awards:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{pendingGrantsCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pending Value:</span>
                <span style={{ color: 'var(--accent-indigo)', fontWeight: '700' }}>${pendingGrantsValue.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Win / Loss Ratio:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>{winLossRatio}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ending Next Quarter:</span>
                <span style={{ color: 'var(--color-warning)', fontWeight: '700' }}>{grantsEndingNextQuarter}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Awaiting Risk Approval:</span>
                <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>{grantsAwaitingRiskApproval}</span>
              </div>
            </div>

            {/* Top Funders Graph Widget */}
            <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Top Funder Agencies</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'center' }}>
                {topFunders.map(([name, val]) => {
                  const pct = Math.round((val / maxFunderValue) * 100);
                  return (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '150px' }} title={name}>{name}</span>
                      <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-indigo)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Tasks Analytics */}
        <div className="panel-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Tasks & Compliance</span>
            <span className="badge badge-risk">HEALTH CHECK</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overdue Compliance Tasks:</span>
                <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>{overdueTasksCount} Tasks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Due in Next 30 Days:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{tasksDue30DaysCount} Tasks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Average Latency Overdue:</span>
                <span style={{ color: 'var(--color-warning)', fontWeight: '700' }}>{avgDaysOverdue} Days</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Compliance Items:</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{tasks.length} Total</span>
              </div>
            </div>

            {/* Completion Ring Widget */}
            <div style={{ width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Completion Ring</span>
              <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                <svg width="70" height="70" viewBox="0 0 36 36">
                  <path
                    style={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: '3' }}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    style={{ stroke: 'var(--color-success)', strokeWidth: '3', strokeDasharray: `${taskCompletionPercent}, 100` }}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {taskCompletionPercent}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: CRM Interactions */}
        <div className="panel-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Funder CRM & Engagements</span>
            <span className="badge badge-staged">CRM STATS</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Interactions This Month:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>{interactionsThisMonthCount} Touches</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Upcoming Action Tasks (Month):</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{upcomingCrmTasksThisMonthCount} Tasks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overdue Action Tasks:</span>
                <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>{overdueCrmTasksCount} Tasks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Opportunities Created (Year):</span>
                <span style={{ color: 'var(--color-success)', fontWeight: '700' }}>{opportunitiesCreatedThisYearCount} Opps</span>
              </div>
            </div>

            {/* CRM Types Graph */}
            <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Interactions breakdown</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'center' }}>
                {Object.entries(interactionTypes).map(([type, count]) => {
                  const pct = totalInteractions === 0 ? 0 : Math.round((count / totalInteractions) * 100);
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{type}:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: Projects Analytics */}
        <div className="panel-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>Capital Projects Analytics</span>
            <span className="badge badge-awarded">Linked Projects</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Open Active Projects:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{openProjectsCount} Projects</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Projects Budget:</span>
                <span style={{ color: 'var(--color-success)', fontWeight: '700' }}>${totalProjectBudget.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Projects Spent:</span>
                <span style={{ color: 'var(--color-warning)', fontWeight: '700' }}>${totalProjectSpend.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overdue Project Tasks:</span>
                <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>{overdueProjectTasksCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Upcoming Tasks (Month):</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>{upcomingProjectTasksThisMonthCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Milestones Due (Quarter):</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>{upcomingMilestonesThisQuarterCount} Milestones</span>
              </div>
            </div>

            {/* Department Budget Graph */}
            <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Dept Spent Ratio</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'center' }}>
                {Object.entries(deptBudgets).slice(0, 3).map(([dept, data]) => {
                  const pct = data.allocated === 0 ? 0 : Math.min(100, Math.round((data.spent / data.allocated) * 100));
                  return (
                    <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '150px' }}>{dept}</span>
                      <div style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-warning)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Dynamic Multi-Mode Charts (Interactive Bar / Pie / Line / Table Controls) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px', marginTop: '8px' }}>
        <DynamicChartRenderer
          title="Funding Portfolio by Agency"
          subtitle="Total Allocated AUD Value per Funding Body"
          data={funderChartData.length > 0 ? funderChartData : [{ label: 'Department of Infrastructure', value: 450000 }, { label: 'NSW Office of Sport', value: 75000 }]}
          defaultChartType="bar"
        />

        <DynamicChartRenderer
          title="Capital Project Allocations"
          subtitle="Project Budget Distribution Across Infrastructure Portfolio"
          data={projectChartData.length > 0 ? projectChartData : [{ label: 'Regional Connectivity Phase 1', value: 350000 }, { label: 'Community Hub Upgrade', value: 120000 }]}
          defaultChartType="pie"
        />
      </div>

    </div>
  );
};
