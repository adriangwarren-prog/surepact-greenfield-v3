import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  Compass,
  Send,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  FileText,
  Shield,
  PlusCircle,
  Star,
  Mail,
  Zap,
  DollarSign
} from 'lucide-react';

interface OnboardingHelpCenterProps {
  organization: any;
  onOpenNewGrant: () => void;
  setActiveTab: (tab: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
  tourStep: number;
  setTourStep: (step: number) => void;
  onOpenTierSwitcher?: () => void;
}

export const OnboardingHelpCenter: React.FC<OnboardingHelpCenterProps> = ({
  organization,
  onOpenNewGrant,
  setActiveTab,
  isOpen,
  setIsOpen,
  isTourActive,
  setIsTourActive,
  tourStep,
  setTourStep,
  onOpenTierSwitcher
}) => {
  const [activeTab, setActiveTabMenu] = useState<'walkthrough' | 'knowledge' | 'support' | 'feedback'>('walkthrough');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  // Ticket submission state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('GENERAL_ENQUIRY');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Auto-launch walkthrough tour for new users if not dismissed
  useEffect(() => {
    try {
      const hasSeenTour = localStorage.getItem('surepact_onboarding_tour_dismissed');
      if (!hasSeenTour) {
        // Auto-open tour after 1.5 seconds on first visit
        const timer = setTimeout(() => {
          setIsTourActive(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, []);

  const tier = organization?.pricingTier || 'FREE_TRIAL';

  // Tour Steps definition strictly covering FREE_TRIAL features
  const tourSteps = [
    {
      title: '👋 Welcome to SurePact!',
      subtitle: `Your ${tier.replace('_', ' ')} workspace is initialized.`,
      icon: Sparkles,
      color: '#fbbd08',
      content: `SurePact is Australia's leading Grant Management Platform. This guided tour takes you through the core features available in your Free Trial evaluation workspace.`,
      actionBtn: 'Start Tour ➔',
      targetTab: 'grants'
    },
    {
      title: '🔎 Step 1: Grant Search & URL Web Ingestion',
      subtitle: 'Scrape government portals or search opportunities',
      icon: Search,
      color: '#3b82f6',
      content: `Search thousands of active government grants or ingest guidelines directly from any website URL into staged opportunities in your registry.`,
      actionBtn: 'Try Grant Search ➔',
      targetTab: 'search-external'
    },
    {
      title: '📋 Step 2: Grants Registry & Workflow Stages',
      subtitle: 'Manual entry & 5-stage workflow gates',
      icon: PlusCircle,
      color: '#10b981',
      content: `Manage grant opportunities from Pre-Application Risk assessment through Application Submission, Awarded Obligations, and Final Closeout. Click "+ New Grant" to add a grant manually.`,
      actionBtn: 'Try Adding Grant',
      onAction: () => {
        setTourStep(3); // Land on Step 4 (Documents Library) when returning
        setIsTourActive(false);
        onOpenNewGrant();
      },
      targetTab: 'grants'
    },
    {
      title: '📁 Step 3: Global Documents Library',
      subtitle: 'File attachments, agreements & templates',
      icon: FileText,
      color: '#a855f7',
      content: `Upload grant agreements, funding guidelines, and milestone evidence files. Access document templates and filter attachments by category.`,
      actionBtn: 'Explore Documents ➔',
      targetTab: 'documents'
    },
    {
      title: '💰 Step 4: Finance & Transaction Ledger',
      subtitle: 'Income, expenditure & financial balances',
      icon: DollarSign,
      color: '#6366f1',
      content: `Track grant income receipts, project expenditure invoices, and net balances per grant with category breakdowns and acquittal statements.`,
      actionBtn: 'View Finance Ledger ➔',
      targetTab: 'finance'
    },
    {
      title: '📚 Step 5: Knowledge Centre & Support Hub',
      subtitle: 'Inbuilt guides, support tickets & feedback',
      icon: BookOpen,
      color: '#fbbd08',
      content: `Search step-by-step how-to articles, submit support tickets directly to sales@surepact.com, or share product feedback with our team.`,
      actionBtn: 'Finish Tour ✓',
      targetTab: 'knowledge'
    }
  ];

  const handleNextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      const next = tourStep + 1;
      setTourStep(next);
      if (tourSteps[next].targetTab) {
        setActiveTab(tourSteps[next].targetTab);
      }
    } else {
      handleDismissTour();
    }
  };

  const handlePrevTourStep = () => {
    if (tourStep > 0) {
      const prev = tourStep - 1;
      setTourStep(prev);
      if (tourSteps[prev].targetTab) {
        setActiveTab(tourSteps[prev].targetTab);
      }
    }
  };

  const handleDismissTour = () => {
    setIsTourActive(false);
    try {
      localStorage.setItem('surepact_onboarding_tour_dismissed', 'true');
    } catch (e) {}
  };

  // Knowledge Articles Base
  const articles = [
    {
      id: 'a1',
      category: 'Getting Started',
      title: 'How to Add and Setup Your First Grant Agreement',
      summary: 'Learn how to create a grant record, define funding amounts, set workflow stages, and assign department owners.',
      content: `### 1. Navigating to the Grants Registry
From the main sidebar, select **Grants Registry**. Click the bright yellow **"+ New Grant"** button located in the top control bar.

### 2. Filling Out Mandatory Grant Metadata
- **Grant Title**: Enter a clear, descriptive name (e.g. *Infrastructure Greening & Waterway Restoration Grant*).
- **Funder Agency**: Specify the funding body (e.g. *Commonwealth Department of Climate Change*).
- **Total Awarded & Requested Value**: Input the dollar amounts in AUD.
- **Closing & Execution Dates**: Set critical milestones for obligations tracking.

### 3. Setting Initial Workflow Stage
Assign the grant to its current stage:
- **1. Pre-Application Risk Assessment**: Evaluating strategic merit.
- **2. Application Staged**: Writing response and collecting documents.
- **4. Obligation Management**: Grant awarded and active.

### 4. Saving & Assigning
Click **"Save Grant Record"**. The grant will immediately appear in your telemetry metrics and dashboard registry.`
    },
    {
      id: 'a2',
      category: 'Funder Acquittals',
      title: 'Generating Funder Progress Reports & AASB 15 Acquittal Statements',
      summary: 'Step-by-step guide to generating certified financial statements and audit ZIP packages for funding bodies.',
      content: `### 1. Opening the Acquittals Generator
Navigate to **Resource & Financial Center ➔ Acquittals & Reports** in the left sidebar menu.

### 2. Selecting the Active Grant Contract
Use the top dropdown to select the target grant agreement. SurePact will automatically extract executed agreement schedules (e.g. *Schedule 2 — Annual Financial Acquittal*).

### 3. Generating Export Formatted Reports
- Click **"Export Formatted PDF Report"** for a clean, audit-ready document.
- Click **"Audit ZIP Package"** to download a complete manifest containing the PDF statement, itemized transaction spreadsheet, and verified invoice receipts.`
    },
    {
      id: 'a3',
      category: 'AI Tools',
      requiredTier: 'STARTER',
      title: 'Using the AI Grant Writing Assistant with Corporate Knowledge',
      summary: 'How to leverage past proposals, strategic plans, and organizational profiles to generate high-scoring responses.',
      content: `### 1. Upload Corporate Knowledge Documents
Go to **Resource & Financial Center ➔ Organizational Knowledge Centre**. Upload your council or company strategic plan, annual financial report, or policy documents.

### 2. Launching AI Grant Writer
Select **AI Intelligence & Ingestion ➔ AI Grant Writer**. Choose your target grant and select a criterion prompt (e.g. *Community Economic Impact & Job Creation*).

### 3. Interactively Refining Proposals
Click **"Draft Criterion Response with Gemini AI"**. Edit the generated draft directly in the interactive editor and export as Word or PDF.`
    },
    {
      id: 'a4',
      category: 'Multi-Tenancy',
      title: 'Switching Workspaces & Pricing Tier Feature Quotas',
      summary: 'Understand how workspace switching works and the capabilities included at your tier.',
      content: `### 1. Workspace Switcher
Click the workspace dropdown in the top right header (\`🏢 Organization Name ▾\`). You can switch between registered council or corporate workspaces seamlessly.

### 2. Pricing Tiers Overview
- **FREE_TRIAL**: 14-day evaluation access with sample demo records.
- **STARTER**: Up to 50 active grants, 10 team users, and standard reporting.
- **ENTERPRISE**: Unlimited grants, unlimited users, AI contract ingestion, and dedicated executive support.`
    }
  ];

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      alert('Please fill out the ticket subject and message.');
      return;
    }
    setSubmittingTicket(true);
    setTimeout(() => {
      setSubmittingTicket(false);
      alert(`Ticket submitted successfully! Confirmation sent to sales@surepact.com for tenant "${organization?.name || 'Workspace'}".`);
      setTicketSubject('');
      setTicketMessage('');
      setIsOpen(false);
    }, 800);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText) {
      alert('Please enter your feedback comments.');
      return;
    }
    setSubmittingFeedback(true);
    setTimeout(() => {
      setSubmittingFeedback(false);
      alert(`Thank you for your ${rating}-star feedback! Our product team has received your comments.`);
      setFeedbackText('');
      setIsOpen(false);
    }, 800);
  };

  return (
    <>
      {/* WALKTHROUGH TOUR SPOTLIGHT MODAL OVERLAY */}
      {isTourActive && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.82)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div className="panel-card" style={{
            width: '100%',
            maxWidth: '560px',
            background: 'var(--bg-secondary)',
            border: '2px solid #fbbd08',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header with Progress dots */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {tourSteps.map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: idx === tourStep ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: idx === tourStep ? '#fbbd08' : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
              <button
                onClick={handleDismissTour}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
              >
                Skip Tour ×
              </button>
            </div>

            {/* Step Icon & Title */}
            {(() => {
              const current = tourSteps[tourStep];
              const IconComp = current.icon;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: 'rgba(251, 189, 8, 0.15)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(251, 189, 8, 0.3)' }}>
                      <IconComp size={32} color={current.color} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: current.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Step {tourStep + 1} of {tourSteps.length}
                      </span>
                      <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                        {current.title}
                      </h2>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{current.subtitle}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0, background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    {current.content}
                  </p>

                  {/* Step Action & Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <button
                      disabled={tourStep === 0}
                      onClick={handlePrevTourStep}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-color)',
                        color: tourStep === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        cursor: tourStep === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ChevronLeft size={16} /> Back
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {current.onAction && (
                        <button
                          onClick={current.onAction}
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <PlusCircle size={16} /> {current.actionBtn}
                        </button>
                      )}
                      <button
                        onClick={handleNextTourStep}
                        style={{
                          background: '#fbbd08',
                          color: '#151226',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {tourStep === tourSteps.length - 1 ? 'Finish Tour ✓' : 'Next Step ➔'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* KNOWLEDGE CENTER & SUPPORT POPOVER MODAL (Anchored next to Sidebar) */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px', left: '270px',
          width: '460px',
          maxHeight: '620px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Header Bar */}
          <div style={{ background: 'linear-gradient(135deg, rgba(251, 189, 8, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={20} color="#fbbd08" />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  SurePact Knowledge Hub
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {organization?.name || 'Workspace Onboarding'} • {tier}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* 4 Navigation Sub-Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
            <button
              onClick={() => { setActiveTabMenu('walkthrough'); setSelectedArticle(null); }}
              style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'walkthrough' ? '3px solid #fbbd08' : '3px solid transparent', color: activeTab === 'walkthrough' ? '#fbbd08' : 'var(--text-muted)', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
            >
              🚀 Tour
            </button>
            <button
              onClick={() => { setActiveTabMenu('knowledge'); setSelectedArticle(null); }}
              style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'knowledge' ? '3px solid #fbbd08' : '3px solid transparent', color: activeTab === 'knowledge' ? '#fbbd08' : 'var(--text-muted)', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
            >
              📚 Articles
            </button>
            <button
              onClick={() => { setActiveTabMenu('support'); setSelectedArticle(null); }}
              style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'support' ? '3px solid #fbbd08' : '3px solid transparent', color: activeTab === 'support' ? '#fbbd08' : 'var(--text-muted)', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
            >
              ✉️ Support
            </button>
            <button
              onClick={() => { setActiveTabMenu('feedback'); setSelectedArticle(null); }}
              style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'feedback' ? '3px solid #fbbd08' : '3px solid transparent', color: activeTab === 'feedback' ? '#fbbd08' : 'var(--text-muted)', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
            >
              ⭐ Feedback
            </button>
          </div>

          {/* TAB 1: WALKTHROUGH TOUR OVERVIEW */}
          {activeTab === 'walkthrough' && (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ background: 'rgba(251, 189, 8, 0.08)', border: '1px solid rgba(251, 189, 8, 0.3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={24} color="#fbbd08" />
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    Headline Features Checklist ({tier})
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Walk through how to add a grant, track clawback risks, and export acquittals.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tourSteps.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setTourStep(idx);
                      setIsTourActive(true);
                      setIsOpen(false);
                    }}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(251, 189, 8, 0.2)', color: '#fbbd08', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{step.title}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{step.subtitle}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setTourStep(0);
                  setIsTourActive(true);
                  setIsOpen(false);
                }}
                style={{ background: '#fbbd08', color: '#151226', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}
              >
                <Compass size={16} /> Launch Interactive Tour Mode
              </button>
            </div>
          )}

          {/* TAB 2: SEARCHABLE KNOWLEDGE ARTICLES */}
          {activeTab === 'knowledge' && (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
              {selectedArticle ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    style={{ background: 'none', border: 'none', color: '#fbbd08', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}
                  >
                    ← Back to Articles
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                      {selectedArticle.title}
                    </h4>
                    {selectedArticle.requiredTier && (
                      <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)', padding: '3px 8px', borderRadius: '6px' }}>
                        🔒 {selectedArticle.requiredTier} FEATURE
                      </span>
                    )}
                  </div>
                  {selectedArticle.requiredTier && (organization?.pricingTier === 'FREE_TRIAL' || !organization?.pricingTier) && (
                    <div style={{ background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(245, 158, 11, 0.12) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px', padding: '12px 14px', fontSize: '11px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔒 This article explains features available in <strong>{selectedArticle.requiredTier}</strong> tier.</span>
                      <button onClick={onOpenTierSwitcher} style={{ background: '#fbbd08', color: '#151226', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>
                        Upgrade Plan
                      </button>
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-line', background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    {selectedArticle.content}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="url-input"
                      placeholder="Search how-to articles & guides..."
                      style={{ paddingLeft: '36px', fontSize: '12px', width: '100%' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredArticles.map(art => (
                      <div
                        key={art.id}
                        onClick={() => setSelectedArticle(art)}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#fbbd08', textTransform: 'uppercase' }}>
                            {art.category}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {art.requiredTier && (
                              <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                                🔒 {art.requiredTier}
                              </span>
                            )}
                            <ChevronRight size={14} color="var(--text-muted)" />
                          </div>
                        </div>
                        <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                          {art.title}
                        </h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                          {art.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: SUPPORT TICKET SUBMISSION */}
          {activeTab === 'support' && (
            <form onSubmit={handleSendTicket} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={20} color="var(--accent-indigo)" />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Tickets are routed directly to <strong>sales@surepact.com</strong> &amp; dedicated support.
                </span>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Enquiry Category
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="url-input"
                  style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                >
                  <option value="GENERAL_ENQUIRY">General Platform Enquiry</option>
                  <option value="TIER_UPGRADE">Enterprise Tier Upgrade / Sales</option>
                  <option value="TECHNICAL_HELP">Technical Support &amp; Integration</option>
                  <option value="BILLING">Billing &amp; Licensing</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Subject
                </label>
                <input
                  type="text"
                  className="url-input"
                  placeholder="Summary of enquiry..."
                  style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  className="url-input"
                  placeholder="Provide details about your question or requested feature..."
                  style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submittingTicket}
                style={{ background: '#fbbd08', color: '#151226', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Send size={14} /> {submittingTicket ? 'Submitting Ticket...' : 'Submit Ticket to sales@surepact.com'}
              </button>
            </form>
          )}

          {/* TAB 4: PRODUCT FEEDBACK */}
          {activeTab === 'feedback' && (
            <form onSubmit={handleSendFeedback} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  How satisfied are you with SurePact?
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      <Star size={24} color={star <= rating ? '#fbbd08' : 'var(--text-muted)'} fill={star <= rating ? '#fbbd08' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Product Feedback &amp; Suggestions
                </label>
                <textarea
                  rows={4}
                  className="url-input"
                  placeholder="What features or improvements would help your grant management workflow?"
                  style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <MessageSquare size={14} /> {submittingFeedback ? 'Submitting...' : 'Send Feedback to Product Team'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};
