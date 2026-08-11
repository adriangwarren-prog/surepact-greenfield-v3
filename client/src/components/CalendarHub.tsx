import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  Briefcase,
  Users,
  ExternalLink,
  Tag,
  List,
  Grid,
  Layers,
  ArrowUpRight,
  Columns
} from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  entityType: 'task' | 'payment' | 'grant_deadline' | 'contract_milestone' | 'crm_followup';
  status?: string;
  amount?: number;
  transactionType?: 'INCOME' | 'EXPENDITURE';
  associatedGrantTitle?: string;
  associatedGrantId?: string;
  associatedProjectName?: string;
  assignedUserName?: string;
  description?: string;
  isOverdue?: boolean;
}

interface CalendarHubProps {
  grants?: any[];
  projects?: any[];
  tasks?: any[];
  transactions?: any[];
  fundingBodies?: any[];
  businessUnits?: any[];
  onNavigateToGrant?: (grantId: string) => void;
  onNavigateToTask?: (taskId: string) => void;
  isTasksOnlyMode?: boolean;
}

export const CalendarHub: React.FC<CalendarHubProps> = ({
  grants = [],
  projects = [],
  tasks = [],
  transactions = [],
  fundingBodies = [],
  businessUnits = [],
  onNavigateToGrant,
  onNavigateToTask,
  isTasksOnlyMode = false
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDayEventsModal, setSelectedDayEventsModal] = useState<{ dateStr: string; dateLabel: string; events: CalendarEvent[] } | null>(null);

  // Active Entity Filters
  const [activeEntityTypes, setActiveEntityTypes] = useState<Record<string, boolean>>({
    task: true,
    payment: !isTasksOnlyMode,
    grant_deadline: !isTasksOnlyMode,
    contract_milestone: !isTasksOnlyMode,
    crm_followup: !isTasksOnlyMode
  });

  const toggleEntityType = (type: string) => {
    if (isTasksOnlyMode) return;
    setActiveEntityTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Compile all date-relevant events across entities
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];
    const now = new Date();

    // 1. Milestone Tasks & Obligations
    if (activeEntityTypes.task) {
      tasks.forEach((t: any) => {
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          const isOverdue = d < now && t.status !== 'COMPLETED';
          events.push({
            id: `task-${t.id}`,
            title: t.title,
            date: d,
            entityType: 'task',
            status: t.status || 'PENDING',
            associatedGrantTitle: t.grant?.title || t.project?.name || 'General Task',
            associatedGrantId: t.grantId || undefined,
            associatedProjectName: t.project?.name,
            assignedUserName: t.assignedToUser?.name || 'Unassigned',
            description: t.description,
            isOverdue
          });
        }
      });
    }

    // 2. Payment Installments & Transactions
    if (!isTasksOnlyMode && activeEntityTypes.payment) {
      grants.forEach((g: any) => {
        if (g.contracts && Array.isArray(g.contracts)) {
          g.contracts.forEach((c: any) => {
            if (c.installments && Array.isArray(c.installments)) {
              c.installments.forEach((inst: any) => {
                if (inst.dueDate) {
                  const d = new Date(inst.dueDate);
                  const isOverdue = d < now && inst.status !== 'PAID';
                  events.push({
                    id: `inst-${inst.id}`,
                    title: `Payment Installment: $${(inst.amount || 0).toLocaleString()} AUD`,
                    date: d,
                    entityType: 'payment',
                    status: inst.status || 'SCHEDULED',
                    amount: inst.amount,
                    transactionType: 'INCOME',
                    associatedGrantTitle: g.title,
                    associatedGrantId: g.id,
                    description: `Funding installment for ${g.title}`,
                    isOverdue
                  });
                }
              });
            }
          });
        }

        if (g.nextExpectedPaymentDate) {
          const d = new Date(g.nextExpectedPaymentDate);
          events.push({
            id: `grant-next-pay-${g.id}`,
            title: `Expected Drawdown: $${(g.nextExpectedPaymentAmount || 0).toLocaleString()} AUD`,
            date: d,
            entityType: 'payment',
            status: 'EXPECTED',
            amount: g.nextExpectedPaymentAmount,
            transactionType: 'INCOME',
            associatedGrantTitle: g.title,
            associatedGrantId: g.id
          });
        }
      });

      transactions.forEach((tx: any) => {
        if (tx.createdAt || tx.date) {
          const d = new Date(tx.date || tx.createdAt);
          events.push({
            id: `tx-${tx.id}`,
            title: `${tx.type === 'INCOME' ? 'Income Drawdown' : 'Expense Spend'}: $${(tx.amount || 0).toLocaleString()} AUD`,
            date: d,
            entityType: 'payment',
            status: 'LOGGED',
            amount: tx.amount,
            transactionType: tx.type || 'EXPENDITURE',
            associatedGrantTitle: tx.grantTitle || 'Ledger Transaction',
            description: tx.description
          });
        }
      });
    }

    // 3. Grant Deadlines
    if (!isTasksOnlyMode && activeEntityTypes.grant_deadline) {
      grants.forEach((g: any) => {
        if (g.closeDate) {
          const d = new Date(g.closeDate);
          const isOverdue = d < now && g.status !== 'SUBMITTED' && g.status !== 'AWARDED' && g.status !== 'CLOSED';
          events.push({
            id: `grant-close-${g.id}`,
            title: `Grant Closing Deadline: ${g.title}`,
            date: d,
            entityType: 'grant_deadline',
            status: g.status,
            amount: g.totalFundingValue || g.amountRequested,
            associatedGrantTitle: g.title,
            associatedGrantId: g.id,
            description: `Closing deadline for ${g.funderName || 'Funder'}. Total Available: $${(g.totalFundingValue || 0).toLocaleString()} AUD`,
            isOverdue
          });
        }

        if (g.openDate) {
          const d = new Date(g.openDate);
          events.push({
            id: `grant-open-${g.id}`,
            title: `Grant Opened: ${g.title}`,
            date: d,
            entityType: 'grant_deadline',
            status: 'OPEN',
            associatedGrantTitle: g.title,
            associatedGrantId: g.id
          });
        }
      });
    }

    // 4. Contract Milestones & Compliance Acquittals
    if (!isTasksOnlyMode && activeEntityTypes.contract_milestone) {
      grants.forEach((g: any) => {
        if (g.contracts && Array.isArray(g.contracts)) {
          g.contracts.forEach((c: any) => {
            if (c.milestones && Array.isArray(c.milestones)) {
              c.milestones.forEach((m: any) => {
                if (m.dueDate) {
                  const d = new Date(m.dueDate);
                  const isOverdue = d < now && !m.isAcquitted;
                  events.push({
                    id: `milestone-${m.id}`,
                    title: `Contract Milestone: ${m.title}`,
                    date: d,
                    entityType: 'contract_milestone',
                    status: m.isAcquitted ? 'ACQUITTED' : 'PENDING',
                    associatedGrantTitle: g.title,
                    associatedGrantId: g.id,
                    description: m.description,
                    isOverdue
                  });
                }
              });
            }
          });
        }
      });
    }

    // 5. CRM Follow-Ups
    if (!isTasksOnlyMode && activeEntityTypes.crm_followup) {
      fundingBodies.forEach((fb: any) => {
        if (fb.contacts && Array.isArray(fb.contacts)) {
          fb.contacts.forEach((c: any) => {
            if (c.interactions && Array.isArray(c.interactions)) {
              c.interactions.forEach((intr: any) => {
                if (intr.dueDate) {
                  const d = new Date(intr.dueDate);
                  events.push({
                    id: `crm-${intr.id}`,
                    title: `CRM Follow-up: ${intr.subject}`,
                    date: d,
                    entityType: 'crm_followup',
                    status: intr.status || 'PENDING',
                    associatedGrantTitle: `${fb.name} (${c.name})`,
                    assignedUserName: c.name,
                    description: intr.content
                  });
                }
              });
            }
          });
        }
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return events.filter(e => 
        e.title.toLowerCase().includes(q) ||
        (e.associatedGrantTitle && e.associatedGrantTitle.toLowerCase().includes(q)) ||
        (e.assignedUserName && e.assignedUserName.toLowerCase().includes(q))
      );
    }

    return events;
  }, [grants, tasks, transactions, fundingBodies, activeEntityTypes, searchQuery, isTasksOnlyMode]);

  // Navigation Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevStep = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const handleNextStep = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    const remainingCells = (42 - days.length) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  }, [year, month]);

  // Week View Grid Calculation (7 days Sunday through Saturday)
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay(); // 0 = Sun
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - dayOfWeek);

    const days: Array<{ date: Date }> = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push({ date: day });
    }
    return days;
  }, [currentDate]);

  // Map events to date keys YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    allEvents.forEach(evt => {
      const key = evt.date.toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    });
    return map;
  }, [allEvents]);

  // Badge Style Definitions
  const getEventBadgeStyle = (evt: CalendarEvent) => {
    switch (evt.entityType) {
      case 'task':
        return {
          bg: evt.isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          color: evt.isOverdue ? '#dc2626' : '#4f46e5',
          border: evt.isOverdue ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.4)',
          label: 'Task'
        };
      case 'payment':
        return {
          bg: evt.transactionType === 'INCOME' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          color: evt.transactionType === 'INCOME' ? '#059669' : '#e11d48',
          border: evt.transactionType === 'INCOME' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
          label: evt.transactionType === 'INCOME' ? 'Drawdown' : 'Expense'
        };
      case 'grant_deadline':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#d97706',
          border: 'rgba(245, 158, 11, 0.4)',
          label: 'Grant Deadline'
        };
      case 'contract_milestone':
        return {
          bg: 'rgba(6, 182, 212, 0.15)',
          color: '#0891b2',
          border: 'rgba(6, 182, 212, 0.4)',
          label: 'Acquittal / Milestone'
        };
      case 'crm_followup':
        return {
          bg: 'rgba(139, 92, 246, 0.15)',
          color: '#7c3aed',
          border: 'rgba(139, 92, 246, 0.4)',
          label: 'CRM Follow-up'
        };
      default:
        return { bg: 'rgba(99, 102, 241, 0.15)', color: '#4f46e5', border: 'rgba(99, 102, 241, 0.3)', label: 'Event' };
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Date Indicator Label
  const dateIndicatorLabel = useMemo(() => {
    if (viewMode === 'month') {
      return `${monthNames[month]} ${year}`;
    }
    if (viewMode === 'week') {
      const startDay = weekDays[0].date;
      const endDay = weekDays[6].date;
      const weekEventsCount = weekDays.reduce((sum, d) => {
        const k = d.date.toISOString().split('T')[0];
        return sum + (eventsByDate[k]?.length || 0);
      }, 0);
      return `Week of ${startDay.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${endDay.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} (${weekEventsCount} ${weekEventsCount === 1 ? 'event' : 'events'})`;
    }
    return `Schedule (${allEvents.length} Events)`;
  }, [viewMode, month, year, weekDays, eventsByDate, allEvents.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Controls Bar */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Title Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border-color-active)'
            }}>
              <CalendarIcon size={22} color="var(--accent-indigo)" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isTasksOnlyMode ? 'Tasks Calendar Schedule' : 'Master Multi-Entity Calendar'}
                <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', padding: '2px 10px', borderRadius: '12px', fontWeight: '700' }}>
                  {allEvents.length} Events
                </span>
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {isTasksOnlyMode 
                  ? 'Visual date schedule of all assigned milestone tasks and obligations.' 
                  : 'Centralized schedule aggregating tasks, payments, grant deadlines, contract milestones & CRM follow-ups.'}
              </p>
            </div>
          </div>

          {/* Navigation Controls: Standalone Today, Flanked Date Indicator, View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            
            {/* 1. Standalone Today Button */}
            <button
              type="button"
              onClick={handleToday}
              style={{
                background: '#151226',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '12px',
                fontWeight: '700',
                padding: '8px 16px',
                cursor: 'pointer',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
              }}
            >
              <Clock size={14} color="#fbbd08" /> Today
            </button>

            {/* 2. Date Indicator Flanked by Prev & Next Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '4px 8px',
              gap: '8px'
            }}>
              <button
                type="button"
                onClick={handlePrevStep}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={viewMode === 'month' ? 'Previous Month' : 'Previous Week'}
              >
                <ChevronLeft size={18} />
              </button>

              <span style={{
                fontSize: '14px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                minWidth: '170px',
                textAlign: 'center',
                padding: '0 8px'
              }}>
                {dateIndicatorLabel}
              </span>

              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={viewMode === 'month' ? 'Next Month' : 'Next Week'}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* 3. View Mode Switcher Bar (Month | Week | Agenda) */}
            <div style={{ display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                style={{
                  background: viewMode === 'month' ? 'var(--accent-indigo)' : 'transparent',
                  color: viewMode === 'month' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Grid size={14} /> Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                style={{
                  background: viewMode === 'week' ? 'var(--accent-indigo)' : 'transparent',
                  color: viewMode === 'week' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Columns size={14} /> Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                style={{
                  background: viewMode === 'agenda' ? 'var(--accent-indigo)' : 'transparent',
                  color: viewMode === 'agenda' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <List size={14} /> Agenda
              </button>
            </div>

          </div>

        </div>

        {/* Filter Chips Bar */}
        {!isTasksOnlyMode && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={12} /> Layers:
              </span>

              <button
                type="button"
                onClick={() => toggleEntityType('task')}
                style={{
                  background: activeEntityTypes.task ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-primary)',
                  border: `1px solid ${activeEntityTypes.task ? '#6366f1' : 'var(--border-color)'}`,
                  color: activeEntityTypes.task ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }}></span>
                Tasks ({tasks.length})
              </button>

              <button
                type="button"
                onClick={() => toggleEntityType('payment')}
                style={{
                  background: activeEntityTypes.payment ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-primary)',
                  border: `1px solid ${activeEntityTypes.payment ? '#10b981' : 'var(--border-color)'}`,
                  color: activeEntityTypes.payment ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                Payments &amp; Drawdowns
              </button>

              <button
                type="button"
                onClick={() => toggleEntityType('grant_deadline')}
                style={{
                  background: activeEntityTypes.grant_deadline ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-primary)',
                  border: `1px solid ${activeEntityTypes.grant_deadline ? '#f59e0b' : 'var(--border-color)'}`,
                  color: activeEntityTypes.grant_deadline ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                Grant Deadlines
              </button>

              <button
                type="button"
                onClick={() => toggleEntityType('contract_milestone')}
                style={{
                  background: activeEntityTypes.contract_milestone ? 'rgba(6, 182, 212, 0.2)' : 'var(--bg-primary)',
                  border: `1px solid ${activeEntityTypes.contract_milestone ? '#06b6d4' : 'var(--border-color)'}`,
                  color: activeEntityTypes.contract_milestone ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }}></span>
                Acquittals &amp; Milestones
              </button>

              <button
                type="button"
                onClick={() => toggleEntityType('crm_followup')}
                style={{
                  background: activeEntityTypes.crm_followup ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-primary)',
                  border: `1px solid ${activeEntityTypes.crm_followup ? '#8b5cf6' : 'var(--border-color)'}`,
                  color: activeEntityTypes.crm_followup ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></span>
                CRM Follow-ups
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search schedule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="url-input"
                style={{ width: '100%', paddingLeft: '34px', paddingRight: '10px', fontSize: '12px' }}
              />
            </div>

          </div>
        )}

      </div>

      {/* 1. MONTH VIEW GRID */}
      {viewMode === 'month' && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          
          {/* Day Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-color)',
            textAlign: 'center',
            fontWeight: '800',
            fontSize: '12px',
            color: 'var(--text-primary)',
            padding: '12px 0'
          }}>
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Grid Cells */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridAutoRows: 'minmax(120px, auto)'
          }}>
            {calendarDays.map((day, idx) => {
              const dateStr = day.date.toISOString().split('T')[0];
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = day.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  style={{
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--border-color)' : 'none',
                    borderBottom: idx < 35 ? '1px solid var(--border-color)' : 'none',
                    background: day.isCurrentMonth ? 'var(--bg-secondary)' : 'rgba(0,0,0,0.03)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    opacity: day.isCurrentMonth ? 1 : 0.55,
                    minHeight: '130px',
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      color: isToday ? '#151226' : 'var(--text-primary)',
                      background: isToday ? '#fbbd08' : 'transparent',
                      width: '24px', height: '24px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {day.date.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span 
                        onClick={() => setSelectedDayEventsModal({
                          dateStr,
                          dateLabel: day.date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                          events: dayEvents
                        })}
                        style={{ fontSize: '10px', color: 'var(--accent-indigo)', fontWeight: '800', cursor: 'pointer' }}
                        title="Click to view all scheduled items for this day"
                      >
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', flexGrow: 1, overflowY: 'auto' }}>
                    {dayEvents.slice(0, 3).map((evt) => {
                      const badge = getEventBadgeStyle(evt);
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          style={{
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                            borderRadius: '6px',
                            padding: '3px 6px',
                            fontSize: '10px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0
                          }}
                          title={`${evt.title} (${badge.label})`}
                        >
                          {evt.isOverdue && <AlertTriangle size={10} color="#ef4444" />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--accent-indigo)',
                          fontWeight: '800',
                          cursor: 'pointer',
                          padding: '3px 6px',
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          borderRadius: '6px',
                          textAlign: 'center',
                          marginTop: '2px',
                          flexShrink: 0
                        }}
                        onClick={() => setSelectedDayEventsModal({
                          dateStr,
                          dateLabel: day.date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                          events: dayEvents
                        })}
                      >
                        +{dayEvents.length - 3} more... (View All)
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 2. WEEK VIEW GRID */}
      {viewMode === 'week' && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {/* Week Day Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-color)',
            textAlign: 'center',
            fontWeight: '800',
            fontSize: '12px',
            color: 'var(--text-primary)',
            padding: '12px 0'
          }}>
            {weekDays.map(wDay => {
              const isToday = wDay.date.toDateString() === new Date().toDateString();
              return (
                <div key={wDay.date.toISOString()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span>{wDay.date.toLocaleDateString('en-AU', { weekday: 'short' })}</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '900',
                    color: isToday ? '#151226' : 'var(--text-primary)',
                    background: isToday ? '#fbbd08' : 'transparent',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {wDay.date.getDate()} {wDay.date.toLocaleDateString('en-AU', { month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 7 Columns Day Events */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            minHeight: '400px'
          }}>
            {weekDays.map((wDay, idx) => {
              const dateStr = wDay.date.toISOString().split('T')[0];
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = wDay.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  style={{
                    borderRight: idx < 6 ? '1px solid var(--border-color)' : 'none',
                    background: isToday ? 'rgba(99, 102, 241, 0.03)' : 'var(--bg-secondary)',
                    padding: '12px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '520px',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'center', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                    {dayEvents.length} {dayEvents.length === 1 ? 'Event' : 'Events'}
                  </div>

                  {dayEvents.length === 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                      No events
                    </div>
                  ) : (
                    dayEvents.map(evt => {
                      const badge = getEventBadgeStyle(evt);
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          style={{
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                            borderRadius: '8px',
                            padding: '8px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>{badge.label}</span>
                            {evt.isOverdue && <AlertTriangle size={12} color="#ef4444" />}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '800', lineHeight: '1.3' }}>{evt.title}</div>
                          {evt.amount && <div style={{ fontSize: '10px', fontWeight: '700', opacity: 0.9 }}>${evt.amount.toLocaleString()} AUD</div>}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 3. AGENDA LIST VIEW */}
      {viewMode === 'agenda' && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Upcoming Date Agenda Schedule
          </h3>

          {allEvents.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No upcoming events found for the active filter selection.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allEvents.slice().sort((a,b) => a.date.getTime() - b.date.getTime()).map((evt) => {
                const badge = getEventBadgeStyle(evt);
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    style={{
                      background: 'var(--bg-primary)',
                      border: `1px solid ${evt.isOverdue ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        padding: '8px 12px', borderRadius: '8px',
                        background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color,
                        fontWeight: '800', fontSize: '12px', textAlign: 'center', minWidth: '90px'
                      }}>
                        {badge.label}
                      </div>

                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {evt.title}
                          {evt.isOverdue && (
                            <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span>📅 {evt.date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {evt.associatedGrantTitle && <span>📍 {evt.associatedGrantTitle}</span>}
                          {evt.assignedUserName && <span>👤 {evt.assignedUserName}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EVENT POPUP MODAL */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 200,
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="panel-card"
            style={{
              width: '100%', maxWidth: '540px', backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px',
              animation: 'fadeIn 0.25s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{
                  fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '12px',
                  background: getEventBadgeStyle(selectedEvent).bg, color: getEventBadgeStyle(selectedEvent).color,
                  border: `1px solid ${getEventBadgeStyle(selectedEvent).border}`, display: 'inline-block', marginBottom: '8px'
                }}>
                  {getEventBadgeStyle(selectedEvent).label}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                <Clock size={16} color="var(--accent-indigo)" />
                <span>
                  <strong>Date:</strong> {selectedEvent.date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {selectedEvent.associatedGrantTitle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <FileText size={16} color="var(--accent-cyan)" />
                  <span>
                    <strong>Associated Record:</strong> {selectedEvent.associatedGrantTitle}
                  </span>
                </div>
              )}

              {selectedEvent.assignedUserName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <Users size={16} color="var(--accent-purple)" />
                  <span>
                    <strong>Assigned To:</strong> {selectedEvent.assignedUserName}
                  </span>
                </div>
              )}

              {selectedEvent.amount !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <DollarSign size={16} color="#10b981" />
                  <span>
                    <strong>Financial Value:</strong> ${selectedEvent.amount.toLocaleString()} AUD
                  </span>
                </div>
              )}

              {selectedEvent.description && (
                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {selectedEvent.description}
                </div>
              )}

            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
              
              {selectedEvent.associatedGrantId && onNavigateToGrant && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onNavigateToGrant(selectedEvent.associatedGrantId!);
                    setSelectedEvent(null);
                  }}
                  style={{ background: '#fbbd08', color: '#151226', border: '1px solid #fbbd08', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowUpRight size={16} /> Jump to Grant Record
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. DAY SCHEDULE OVERFLOW BREAKDOWN MODAL */}
      {selectedDayEventsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: '16px', width: '640px', maxWidth: '92vw', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--bg-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CalendarIcon size={22} color="var(--accent-indigo)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {selectedDayEventsModal.dateLabel}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--accent-indigo)', fontWeight: '700' }}>
                    {selectedDayEventsModal.events.length} Scheduled Items on this Date
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayEventsModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Full List of Scheduled Items */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
              {selectedDayEventsModal.events.map(evt => {
                const badge = getEventBadgeStyle(evt);
                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedEvent(evt);
                      setSelectedDayEventsModal(null);
                    }}
                    style={{
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                      borderRadius: '10px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: badge.color, background: 'rgba(255,255,255,0.4)', padding: '2px 8px', borderRadius: '4px' }}>
                          {badge.label}
                        </span>
                        {evt.status && (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                            [{evt.status}]
                          </span>
                        )}
                        {evt.isOverdue && (
                          <span style={{ fontSize: '10px', fontWeight: '800', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <AlertTriangle size={12} /> OVERDUE
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {evt.title}
                      </span>
                      {evt.associatedGrantTitle && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Record: {evt.associatedGrantTitle}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {evt.amount !== undefined && (
                        <span style={{ fontSize: '13px', fontWeight: '800', color: evt.transactionType === 'INCOME' ? '#10b981' : evt.transactionType === 'EXPENDITURE' ? '#f43f5e' : 'var(--text-primary)' }}>
                          ${evt.amount.toLocaleString()} AUD
                        </span>
                      )}
                      <ArrowUpRight size={16} color={badge.color} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setViewMode('agenda');
                  setSelectedDayEventsModal(null);
                }}
                style={{ fontSize: '12px' }}
              >
                Switch to Agenda List View
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedDayEventsModal(null)}
              >
                Close Schedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
