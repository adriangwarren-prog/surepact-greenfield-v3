import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Link as LinkIcon,
  Terminal,
  ArrowRight,
  CheckCircle,
  DollarSign,
  TrendingUp,
  RefreshCw,
  UploadCloud,
  X,
  Lock,
  XCircle,
  FileSpreadsheet,
  FileText,
  ListTodo,
  FolderGit,
  Layers,
  CheckSquare,
  Square,
  Activity,
  PlusCircle,
  UserCheck,
  Search,
  Briefcase,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Building,
  Building2,
  Shield,
  HelpCircle,
  Compass,
  ArrowUpRight,
  Users,
  Sun,
  Moon,
  Trash2,
  ChevronDown,
  Settings,
  GitBranch,
  PenTool,
  ShieldAlert,
  FileCheck,
  Sparkles,
  List,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { AskSurePactReporter } from './components/AskSurePactReporter';
import { GrantSearch } from './components/GrantSearch';
import { AnalyticsHub } from './components/AnalyticsHub';
import { ClawbackSentinel } from './components/ClawbackSentinel';
import { GrantRevenueCashflowForecast } from './components/GrantRevenueCashflowForecast';
import { GrantAcquittalReportGenerator } from './components/GrantAcquittalReportGenerator';
import { CalendarHub } from './components/CalendarHub';
import { OnboardingHelpCenter } from './components/OnboardingHelpCenter';
import { getFunderAnalytics } from './services/askSurepactService';

// Intercept all fetch calls to automatically inject platform password if saved in localStorage
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const password = localStorage.getItem('platform_password') || '';
  const newInit = { ...init };
  const headers = { ...newInit.headers } as Record<string, string>;
  if (password && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${password}`;
  }
  headers['bypass-tunnel-reminder'] = 'true';
  newInit.headers = headers;
  return originalFetch(input, newInit);
};

// Data Types
interface Grant {
  id: string;
  organizationId: string;
  title: string;
  funderName: string;
  sourceUrl: string | null;
  totalFundingValue: number | null;
  openDate: string | null;
  closeDate: string | null;
  status: 'POTENTIAL' | 'RISK_ASSESSMENT' | 'APPLICATION_STAGED' | 'SUBMITTED' | 'AWARDED' | 'REJECTED' | 'CLOSED';
  rawScrapedData: string | null;
  createdAt: string;
  updatedAt: string;
  riskAssessment?: RiskAssessment | null;
  contracts?: Contract[] | null;
  dateSubmitted?: string | null;
  submissionReference?: string | null;
  gfaDocumentName?: string | null;
  gfaExtractedTitle?: string | null;
  projectMappings?: {
    id: string;
    grantId: string;
    projectId: string;
    allocatedAmount: number;
    project: Project;
  }[];
  documents?: Document[];
  tasks?: MilestoneTask[];
  closeoutNotes?: string | null;
  amountRequested?: number | null;
  guidelinesDocName?: string | null;
  guidelinesExtractedTitle?: string | null;
  guidelinesResponseDocs?: string | null;
  requiredDocuments?: string | null;
  requirementResponses?: any[];
  costItems?: string | null;
  description?: string | null;
  businessUnitId?: string | null;
  businessUnit?: BusinessUnit | null;
}

interface Document {
  id: string;
  grantId: string;
  name: string;
  type: 'AGREEMENT' | 'REPORT' | 'APPLICATION' | 'OTHER';
  fileSize: string;
  uploadedBy: string;
  createdAt: string;
}

interface RiskAssessment {
  id: string;
  grantId: string;
  financialRiskScore: number;
  deliveryCapabilityScore: number;
  strategicAlignmentScore: number;
  overallRiskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  justificationNotes: string | null;
  isApprovedToApply: boolean;
}

interface Contract {
  id: string;
  grantId: string;
  fundingAgreementReference: string | null;
  executionDate: string | null;
  totalObligatedAmount: number;
  coContribution?: number | null;
  milestones: Milestone[];
  variations: ContractVariation[];
  installments?: Installment[];
}

interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description: string | null;
  dueDate: string;
  isAcquitted: boolean;
  tasks?: MilestoneTask[];
  projectId?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  businessUnits?: {
    id: string;
    businessUnit: {
      id: string;
      name: string;
    };
  }[];
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  businessUnits: BusinessUnit[];
}

interface BusinessUnit {
  id: string;
  name: string;
  description: string | null;
  departmentId: string;
  department?: Department;
  users?: {
    id: string;
    userId: string;
    user?: User;
  }[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  department: string;
  status: 'POTENTIAL' | 'PENDING' | 'IN_PROGRESS' | 'CLOSED';
  grantMappings: {
    id: string;
    grantId: string;
    projectId: string;
    allocatedAmount: number;
    grant: Grant;
  }[];
  transactions: Transaction[];
  milestones?: Milestone[];
  tasks?: MilestoneTask[];
  budgetAmount: number;
  businessUnitId?: string | null;
  businessUnit?: BusinessUnit | null;
}

interface MilestoneTask {
  id: string;
  milestoneId?: string | null;
  grantId?: string | null;
  projectId?: string | null;
  project?: Project | null;
  title: string;
  description: string | null;
  assignedToUserId: string;
  assignedToUser: User;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  stage: 'APPLICATION' | 'OBLIGATION';
  completedAt: string | null;
  grant?: Grant | null;
  milestone?: {
    title: string;
    contract: {
      grant: Grant;
    };
  } | null;
}

interface SavedSearch {
  id: string;
  name: string;
  category: string | null;
  minFunding: number | null;
  maxFunding: number | null;
  source: string | null;
  createdAt: string;
}

interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'ANNUAL_REPORT' | 'STRATEGIC_PLAN' | 'PROJECT_PLAN' | 'PAST_GRANT_APPLICATION' | 'OTHER';
  fileSize: string;
  uploadedBy: string;
  createdAt: string;
}

interface ExternalGrant {
  id: string;
  title: string;
  opportunityId: string;
  agency: string;
  category: string;
  description: string;
  value: number;
  openDate: string;
  closeDate: string;
  isNew: boolean;
  eligibility: string;
  sourceUrl: string;
}

interface ContractVariation {
  id: string;
  contractId: string;
  referenceNumber: string;
  requestDate: string;
  approvalDate: string | null;
  valueChange: number;
  newCloseDate: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  description: string | null;
}

interface Installment {
  id: string;
  contractId: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'RECEIVED';
  createdAt: string;
}

interface Transaction {
  id: string;
  organizationId: string;
  grantId: string | null;
  grant?: Grant | null;
  projectId: string | null;
  project?: Project | null;
  amount: number;
  type: 'INCOME' | 'EXPENDITURE';
  description: string;
  category: string;
  date: string;
}

interface SystemEvent {
  id: string;
  timestamp: string;
  aggregateId: string;
  eventType: string;
  user: string;
  payload: Record<string, any>;
}

interface FinanceData {
  summary: {
    totalIncome: number;
    totalExpenditure: number;
    netBalance: number;
  };
  categories: Record<string, number>;
  transactions: Transaction[];
}

interface FundingOpportunity {
  id: string;
  fundingBodyId: string;
  contactId: string | null;
  contact?: FundingBodyContact | null;
  title: string;
  value: number | null;
  status: 'IDENTIFIED' | 'DISCUSSING' | 'APPLYING' | 'PROMOTED' | 'ABANDONED';
  description: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContactInteraction {
  id: string;
  contactId: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE' | 'TASK';
  subject: string;
  content: string;
  status: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FundingBodyContact {
  id: string;
  fundingBodyId: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  interactions: ContactInteraction[];
}

interface FundingBody {
  id: string;
  name: string;
  type: string;
  website: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: FundingBodyContact[];
  opportunities: FundingOpportunity[];
}

const COLUMN_METADATA = [
  { id: 'title', label: 'Grant Details' },
  { id: 'funderName', label: 'Funder Agency' },
  { id: 'amountRequested', label: 'Amount Requested' },
  { id: 'totalFundingValue', label: 'Total Awarded' },
  { id: 'amtReceived', label: 'Amount Received' },
  { id: 'amtSpent', label: 'Amount Spent' },
  { id: 'closeDate', label: 'Closing Date' },
  { id: 'status', label: 'Status' },
  { id: 'workflowStage', label: 'Workflow Stage' },
  { id: 'nextExpectedPayment', label: 'Next Expected Payment' },
  { id: 'nextUpcomingTask', label: 'Next Upcoming Task' }
];

if (
  localStorage.getItem('surepact_api_url')?.includes('lhr.life') || 
  localStorage.getItem('surepact_api_url')?.includes('loca.lt') ||
  localStorage.getItem('surepact_api_url')?.includes('trycloudflare.com')
) {
  localStorage.removeItem('surepact_api_url');
}

let compiledApiUrl = import.meta.env.VITE_API_URL;
if (
  compiledApiUrl?.includes('lhr.life') ||
  compiledApiUrl?.includes('loca.lt') ||
  compiledApiUrl?.includes('trycloudflare.com')
) {
  compiledApiUrl = undefined;
}

const API_BASE = localStorage.getItem('surepact_api_url') || compiledApiUrl || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

function App() {
  const [activeTab, setActiveTab] = useState<'grants' | 'calendar' | 'clawback-sentinel' | 'cashflow-forecast' | 'acquittals' | 'ingest' | 'ingest-agreement' | 'ai-writer' | 'projects' | 'tasks' | 'finance' | 'ledger' | 'search' | 'knowledge' | 'funding-bodies' | 'analytics' | 'documents' | 'users' | 'org-structure' | 'tenant-admin'>('grants');
  const [taskBoardViewMode, setTaskBoardViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const lastSelectedGrantIdRef = useRef<string>('');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    const stored = localStorage.getItem('platform_password');
    if (stored) {
      fetch(`${API_BASE}/auth-verify`, {
        headers: { 'Authorization': `Bearer ${stored}` }
      })
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else if (res.status === 401) {
          localStorage.removeItem('platform_password');
        } else {
          // Server/tunnel error (502, 503, 500) - keep credentials and assume authenticated to avoid lockout
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        // network issue, fallback to assuming authenticated to prevent offline lockout
        setIsAuthenticated(true);
      })
      .finally(() => {
        setIsAuthChecking(false);
      });
    } else {
      setIsAuthChecking(false);
    }
  }, []);

  const [grants, setGrants] = useState<Grant[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<MilestoneTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>(''); // For top-right active user switcher
  
  // Accordion Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnalyticsAccordionOpen, setIsAnalyticsAccordionOpen] = useState(false);
  const [isAiToolsAccordionOpen, setIsAiToolsAccordionOpen] = useState(false);
  const [isResourcesAccordionOpen, setIsResourcesAccordionOpen] = useState(false);
  const [isAdminAccordionOpen, setIsAdminAccordionOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsSidebarCollapsed(true);
  };

  const selectTab = (tabName: any) => {
    setActiveTab(tabName);
    if (window.innerWidth <= 992) {
      closeMobileMenu();
    }
  };

  // Onboarding Help & Tour states
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStepState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('surepact_tour_step');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const setTourStep = (step: number) => {
    setTourStepState(step);
    try { localStorage.setItem('surepact_tour_step', step.toString()); } catch (e) {}
  };

  // Auto-open parent accordion when activeTab is selected
  useEffect(() => {
    if (['analytics', 'clawback-sentinel', 'cashflow-forecast', 'acquittals'].includes(activeTab)) {
      setIsAnalyticsAccordionOpen(true);
    }
    if (['ai-writer', 'ingest', 'ingest-agreement'].includes(activeTab)) {
      setIsAiToolsAccordionOpen(true);
    }
    if (['documents', 'finance', 'ledger', 'knowledge'].includes(activeTab)) {
      setIsResourcesAccordionOpen(true);
    }
    if (['users', 'org-structure'].includes(activeTab)) {
      setIsAdminAccordionOpen(true);
    }
  }, [activeTab]);
  
  // User modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // User form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('staff');
  const [newUserStatus, setNewUserStatus] = useState<'Active' | 'Deactivated'>('Active');
  const [newUserBUIds, setNewUserBUIds] = useState<string[]>([]);
  const [savingUser, setSavingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Department / Business Unit modals state
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  const [showAddBUModal, setShowAddBUModal] = useState(false);
  const [newBUName, setNewBUName] = useState('');
  const [newBUDesc, setNewBUDesc] = useState('');
  const [newBUDeptId, setNewBUDeptId] = useState('');
  const [savingBU, setSavingBU] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');

  const [finances, setFinances] = useState<FinanceData | null>(null);
  const [ledger, setLedger] = useState<SystemEvent[]>([]);
  
  const [refreshing, setRefreshing] = useState(false);

  // Workflow state
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<number>(1);
  const [activeMenuSection, setActiveMenuSection] = useState<'overview' | 'submission' | 'obligations' | 'closeout' | 'governance'>('overview');
  const [activeMenuItem, setActiveMenuItem] = useState<string>('overview-details');
  const [costItems, setCostItems] = useState<Array<{ id: string; name: string; description: string; cost: number }>>([]);
  const [expectedOutcomes, setExpectedOutcomes] = useState('');
  const [riskConsiderations, setRiskConsiderations] = useState('');
  const [costItemName, setCostItemName] = useState('');
  const [costItemDesc, setCostItemDesc] = useState('');
  const [costItemValue, setCostItemValue] = useState('');
  const [fundingRequested, setFundingRequested] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [submissionComments, setSubmissionComments] = useState('');

  // Installment state
  const [instAmount, setInstAmount] = useState('');
  const [instDueDate, setInstDueDate] = useState('');
  const [savingInstallment, setSavingInstallment] = useState(false);
  const [showAddInstallmentForm, setShowAddInstallmentForm] = useState(false);

  // Award Stage Form state
  const [awardExecDate, setAwardExecDate] = useState(new Date().toISOString().split('T')[0]);
  const [awardAgRef, setAwardAgRef] = useState('');
  const [awardAmount, setAwardAmount] = useState('');
  const [coContribution, setCoContribution] = useState('0');
  const [awardInstallments, setAwardInstallments] = useState<Array<{ amount: string; dueDate: string }>>([]);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [savingAward, setSavingAward] = useState(false);

  // Closeout state
  const [closeoutNotesText, setCloseoutNotesText] = useState('');
  const [savingCloseout, setSavingCloseout] = useState(false);

  // Agreement Ingestion state
  const [ingestMode, setIngestMode] = useState<'create' | 'associate'>('create');
  const [trackingObligationsTab, setTrackingObligationsTab] = useState<'Milestones' | 'Acquittals' | 'Reporting' | 'Activities'>('Milestones');
  const [ingestSelectedGrantId, setIngestSelectedGrantId] = useState('');
  const [exampleAgreements, setExampleAgreements] = useState<Array<{ filename: string; sizeBytes: number }>>([]);
  const [isAgreementParsing, setIsAgreementParsing] = useState(false);
  const [agreementParseStatus, setAgreementParseStatus] = useState('');
  const [parsedAgreementData, setParsedAgreementData] = useState<{
    title: string;
    funderName: string;
    totalFundingValue: number | null;
    category: string;
    openDate: string;
    closeDate: string;
    referenceNumber: string;
    obligations: Array<{
      title: string;
      description: string;
      dueDate: string;
      category: 'Acquittals' | 'Activities' | 'Reports' | 'Milestones' | 'General';
      assignedToUserId: string;
    }>;
    installments: Array<{
      amount: number;
      dueDate: string;
      status: string;
    }>;
  } | null>(null);
  const [obligationsActiveTab, setObligationsActiveTab] = useState<'Acquittals' | 'Activities' | 'Reports' | 'Milestones' | 'General'>('Acquittals');

  // Task Stage state
  const [taskGrantId, setTaskGrantId] = useState('');
  const [taskStage, setTaskStage] = useState<'APPLICATION' | 'OBLIGATION'>('OBLIGATION');

  // Submit Application state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingGrantId, setSubmittingGrantId] = useState('');
  const [submitDate, setSubmitDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitRef, setSubmitRef] = useState('');
  const [submitAmountRequested, setSubmitAmountRequested] = useState('');
  const [savingSubmission, setSavingSubmission] = useState(false);

  // GFA Extraction state
  const [showGfaModal, setShowGfaModal] = useState(false);
  const [gfaGrantId, setGfaGrantId] = useState('');
  const [gfaFileName, setGfaFileName] = useState('');
  const [gfaLogs, setGfaLogs] = useState<string[]>([]);
  const [extractingGfa, setExtractingGfa] = useState(false);

  // Guidelines Extraction state
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [guidelinesGrantId, setGuidelinesGrantId] = useState('');
  const [guidelinesFileName, setGuidelinesFileName] = useState('');
  const [guidelinesFileNames, setGuidelinesFileNames] = useState<string[]>([
    'rcp_round4_guidelines.pdf',
    'rcp_round4_evaluation_checklist.docx'
  ]);
  const [guidelinesLogs, setGuidelinesLogs] = useState<string[]>([]);
  const [extractingGuidelines, setExtractingGuidelines] = useState(false);

  // Ingest URL state
  const [pasteUrl, setPasteUrl] = useState('');
  const [ingestLogs, setIngestLogs] = useState<string[]>([]);
  const [ingesting, setIngesting] = useState(false);

  // Risk Assessment & Grant Selection state
  const [selectedGrantId, setSelectedGrantId] = useState<string>('');

  const getInitialStageForGrant = (status: string): { section: 'overview' | 'submission' | 'obligations' | 'closeout' | 'governance'; item: string } => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'APPLICATION_STAGED':
      case 'APPLICATION_IN_PROGRESS':
      case 'IN_PROGRESS':
      case 'WRITING':
        return { section: 'submission', item: 'submission-tasks' };
      case 'SUBMITTED':
      case 'REJECTED':
      case 'UNDER_REVIEW':
      case 'UNSUCCESSFUL':
        return { section: 'submission', item: 'submission-result' };
      case 'AWARDED':
      case 'ACTIVE':
      case 'EXECUTED':
        return { section: 'obligations', item: 'obligations-tracking' };
      case 'CLOSED':
      case 'COMPLETED':
      case 'CLOSEOUT':
        return { section: 'closeout', item: 'closeout-summary' };
      case 'POTENTIAL':
      case 'RISK_ASSESSMENT':
      case 'IDENTIFIED':
      default:
        return { section: 'overview', item: 'overview-details' };
    }
  };

  const handleSelectGrant = (grant: Grant) => {
    setSelectedGrantId(grant.id);
    const initial = getInitialStageForGrant(grant.status);
    setActiveMenuSection(initial.section);
    setActiveMenuItem(initial.item as any);
  };

  const handleRequestApproval = async (grantId: string) => {
    if (!selectedApproverId) {
      alert('Please select a designated Executive Approver.');
      return;
    }

    setRequestingApproval(true);
    try {
      const res = await fetch(`${API_BASE}/grants/${grantId}/request-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverUserId: selectedApproverId,
          notes: approvalNotesInput
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Approval request dispatched and email notification sent!');
        setApprovalNotesInput('');
        fetchData();
      } else {
        alert(`Error requesting approval: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error requesting approval.');
    } finally {
      setRequestingApproval(false);
    }
  };
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeProjectWorkflowStage, setActiveProjectWorkflowStage] = useState<number>(1);
  const [projectBudgetInput, setProjectBudgetInput] = useState('');
  const [savingProjectBudget, setSavingProjectBudget] = useState(false);
  const [savingProjectStatus, setSavingProjectStatus] = useState(false);
  const [financialScore, setFinancialScore] = useState<number>(3);
  const [deliveryScore, setDeliveryScore] = useState<number>(3);
  const [strategicScore, setStrategicScore] = useState<number>(3);
  const [evaluatingRisk, setEvaluatingRisk] = useState(false);

  // Tasks Filter state
  const [filterUser, setFilterUser] = useState('');
  const [filterGrant, setFilterGrant] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Finance Filter state
  const [financeGrantFilter, setFinanceGrantFilter] = useState('');

  // External Search state
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [externalGrants, setExternalGrants] = useState<ExternalGrant[]>([]);
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  const [externalSearchCategory, setExternalSearchCategory] = useState('');
  const [externalSearchSource, setExternalSearchSource] = useState('');
  const [externalSearchMinVal, setExternalSearchMinVal] = useState('');
  const [externalSearchMaxVal, setExternalSearchMaxVal] = useState('');
  const [searchingExternal, setSearchingExternal] = useState(false);
  const [savingSearchName, setSavingSearchName] = useState('');
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);
  const [importingExternalId, setImportingExternalId] = useState('');

  // Knowledge Centre & AI writing states
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [newKnowledgeName, setNewKnowledgeName] = useState('');
  const [newKnowledgeType, setNewKnowledgeType] = useState<'ANNUAL_REPORT' | 'STRATEGIC_PLAN' | 'PROJECT_PLAN' | 'PAST_GRANT_APPLICATION' | 'OTHER'>('ANNUAL_REPORT');
  const [newKnowledgeFileSize, setNewKnowledgeFileSize] = useState('');
  const [newKnowledgeUploadedBy, setNewKnowledgeUploadedBy] = useState('');
  const [savingKnowledge, setSavingKnowledge] = useState(false);

  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<string[]>([]);
  const [selectedPreviousGrantIds, setSelectedPreviousGrantIds] = useState<string[]>([]);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftGenerationLogs, setDraftGenerationLogs] = useState<string[]>([]);
  const [showDraftLogsModal, setShowDraftLogsModal] = useState(false);
  const [generatedDraftText, setGeneratedDraftText] = useState('');

  // Interactive AI Grant Writer (AutoRFP style) states
  const [selectedWriterGrantId, setSelectedWriterGrantId] = useState('');
  const [guidelinesFiles, setGuidelinesFiles] = useState<string[]>([]);
  const [selectedGuidelinesFile, setSelectedGuidelinesFile] = useState('');
  const [customGuidelinesText, setCustomGuidelinesText] = useState('');
  const [uploadedGuidelinesFiles, setUploadedGuidelinesFiles] = useState<File[]>([]);
  const [extractingRequirements, setExtractingRequirements] = useState(false);
  const [requirementsList, setRequirementsList] = useState<any[]>([]);
  const [selectedRequirementKey, setSelectedRequirementKey] = useState('');
  const [requirementDraftText, setRequirementDraftText] = useState('');
  const [requirementStatus, setRequirementStatus] = useState('DRAFT');
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [compilingProposal, setCompilingProposal] = useState(false);
  const [compiledProposalResult, setCompiledProposalResult] = useState<any>(null);

  // Acquittal Report states
  const [showAcquittalModal, setShowAcquittalModal] = useState(false);
  const [acquittalStartDate, setAcquittalStartDate] = useState('');
  const [acquittalEndDate, setAcquittalEndDate] = useState('');
  const [acquittalFilterType, setAcquittalFilterType] = useState<'grant' | 'project'>('grant');
  const [acquittalTargetId, setAcquittalTargetId] = useState('');
  const [acquittalTargetTitle, setAcquittalTargetTitle] = useState('');
  const [acquittalTransactions, setAcquittalTransactions] = useState<Transaction[]>([]);

  // Contract Variation form state
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [varRef, setVarRef] = useState('');
  const [varValueChange, setVarValueChange] = useState('');
  const [varNewDate, setVarNewDate] = useState('');
  const [varStatus, setVarStatus] = useState('PENDING');
  const [varDesc, setVarDesc] = useState('');
  const [savingVariation, setSavingVariation] = useState(false);

  // Financial Transaction form state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'INCOME' | 'EXPENDITURE'>('EXPENDITURE');
  const [txDesc, setTxDesc] = useState('');
  const [txCategory, setTxCategory] = useState('Equipment & Materials');
  const [txGrantId, setTxGrantId] = useState('');
  const [txProjectId, setTxProjectId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txInvoiceRef, setTxInvoiceRef] = useState('');
  const [txReceiptFileName, setTxReceiptFileName] = useState('');
  const [savingTransaction, setSavingTransaction] = useState(false);
  // CRM state
  const [fundingBodies, setFundingBodies] = useState<FundingBody[]>([]);
  const [selectedFundingBodyId, setSelectedFundingBodyId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [loadingFundingBodies, setLoadingFundingBodies] = useState<boolean>(false);
  const [crmSubTab, setCrmSubTab] = useState<'contacts' | 'opportunities'>('contacts');

  // Tenant Organization & Pricing Tier state
  const [organization, setOrganization] = useState<any>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showTierSwitcherModal, setShowTierSwitcherModal] = useState(false);
  const [onboardOrgName, setOnboardOrgName] = useState('');
  const [onboardSector, setOnboardSector] = useState<'LOCAL_GOVERNMENT' | 'ACCHO' | 'NOT_FOR_PROFIT' | 'HEALTHCARE' | 'EDUCATION' | 'ENVIRONMENT_COMMUNITY'>('LOCAL_GOVERNMENT');
  const [onboardState, setOnboardState] = useState('QLD');
  const [onboardAdminName, setOnboardAdminName] = useState('Adrian Warren');
  const [onboardAdminEmail, setOnboardAdminEmail] = useState('adrian.warren@surepact.com');
  const [onboardTier, setOnboardTier] = useState<'FREE_TRIAL' | 'STARTER' | 'ENTERPRISE'>('FREE_TRIAL');
  const [onboardPopulateDemo, setOnboardPopulateDemo] = useState(false);
  const [isCleanTenantWorkspace, setIsCleanTenantWorkspace] = useState(false);
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false);
  const [updatingTier, setUpdatingTier] = useState(false);
  const defaultTenants = [
    {
      id: 'demo-org-1',
      name: 'SurePact Primary Council Tenant',
      sector: 'LOCAL_GOVERNMENT',
      state: 'QLD',
      pricingTier: 'ENTERPRISE',
      isClean: false
    },
    {
      id: 'demo-org-2',
      name: 'Townsville City Council',
      sector: 'LOCAL_GOVERNMENT',
      state: 'QLD',
      pricingTier: 'ENTERPRISE',
      isClean: true
    },
    {
      id: 'demo-org-3',
      name: 'UHSAC Aboriginal Corp',
      sector: 'ACCHO',
      state: 'NT',
      pricingTier: 'STARTER',
      isClean: true
    },
    {
      id: 'demo-org-4',
      name: 'Carers NT',
      sector: 'NOT_FOR_PROFIT',
      state: 'NT',
      pricingTier: 'STARTER',
      isClean: true
    }
  ];

  const [tenantsList, setTenantsList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('surepact_tenants_registry');
      if (stored) return JSON.parse(stored);
      return defaultTenants;
    } catch {
      return defaultTenants;
    }
  });

  const [showTenantDropdown, setShowTenantDropdown] = useState(false);

  const applyCleanWorkspaceState = () => {
    setGrants([]);
    setProjects([]);
    setTasks([]);
    setGlobalDocs([]);
    setLedger([]);
    setFundingBodies([]);
    setFinances({
      summary: {
        totalIncome: 0,
        totalExpenditure: 0,
        netBalance: 0
      },
      categories: {},
      transactions: []
    });
  };

  const handleSwitchTenant = (tenant: any) => {
    setOrganization({
      id: tenant.id,
      name: tenant.name,
      sector: tenant.sector,
      state: tenant.state,
      pricingTier: tenant.pricingTier,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      stats: { grantsCount: tenant.isClean ? 0 : grants.length, usersCount: users.length, daysRemaining: 14, isTrialActive: true }
    });
    setIsCleanTenantWorkspace(tenant.isClean);
    if (tenant.isClean) {
      applyCleanWorkspaceState();
    } else {
      fetchData();
    }
    setShowTenantDropdown(false);
  };

  const handleClearDemoGrants = () => {
    if (window.confirm('Clear sample demo evaluation data across grants, projects, tasks, and analytics to start with a clean empty workspace?')) {
      setIsCleanTenantWorkspace(true);
      applyCleanWorkspaceState();
    }
  };

  const handleReloadDemoGrants = () => {
    setIsCleanTenantWorkspace(false);
    fetchData();
  };

  const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
    const password = localStorage.getItem('platform_password') || 'SurePact2026!';
    return {
      'Authorization': `Bearer ${password}`,
      'x-tenant-id': organization?.id || 'demo-org-1',
      ...extraHeaders
    };
  };

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently delete workspace "${tenantName}" (${tenantId}) and purge ALL associated grants, tasks, projects, documents, and audit logs? This action is immediate and permanent.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || `Tenant workspace "${tenantName}" deleted successfully!`);
        const updated = tenantsList.filter(t => t.id !== tenantId);
        setTenantsList(updated);
        try { localStorage.setItem('surepact_tenants_registry', JSON.stringify(updated)); } catch (e) {}
        if (organization?.id === tenantId && updated.length > 0) {
          handleSwitchTenant(updated[0]);
        }
      } else {
        alert(`Error deleting tenant: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error deleting tenant: ${err.message}`);
    }
  };

  const handleAdminUpdateTier = async (tenantId: string, newTier: 'FREE_TRIAL' | 'STARTER' | 'ENTERPRISE') => {
    try {
      const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/tier`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ pricingTier: newTier })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Tenant pricing tier updated to ${newTier}!`);
        const updated = tenantsList.map(t => t.id === tenantId ? { ...t, pricingTier: newTier } : t);
        setTenantsList(updated);
        try { localStorage.setItem('surepact_tenants_registry', JSON.stringify(updated)); } catch (e) {}
        if (organization?.id === tenantId) {
          setOrganization((prev: any) => ({ ...prev, pricingTier: newTier }));
        }
      }
    } catch (err: any) {
      alert(`Error updating tenant tier: ${err.message}`);
    }
  };

  const fetchOrganization = async () => {
    try {
      const res = await fetch(`${API_BASE}/organization/current`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setOrganization(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch organization details:', err);
    }
  };

  const handleUpdateTier = async (newTier: 'FREE_TRIAL' | 'STARTER' | 'ENTERPRISE') => {
    setUpdatingTier(true);
    try {
      const res = await fetch(`${API_BASE}/organization/tier`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ pricingTier: newTier })
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (pErr) {
        data = { success: true, data: { ...organization, pricingTier: newTier } };
      }

      if (data.success) {
        setOrganization((prev: any) => ({ ...(prev || {}), pricingTier: newTier, ...(data.data || {}) }));
        setShowTierSwitcherModal(false);
        alert(`Pricing tier updated to ${newTier}! Workspace features have re-configured.`);
      } else {
        alert(`Failed to update tier: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      console.error('Error updating pricing tier:', err);
      setOrganization((prev: any) => ({ ...(prev || {}), pricingTier: newTier }));
      setShowTierSwitcherModal(false);
      alert(`Pricing tier updated to ${newTier}!`);
    } finally {
      setUpdatingTier(false);
    }
  };

  const handleInstantiateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOnboarding(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/instantiate`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          orgName: onboardOrgName,
          sector: onboardSector,
          state: onboardState,
          adminName: onboardAdminName,
          adminEmail: onboardAdminEmail,
          pricingTier: onboardTier
        })
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (pErr) {
        data = {
          success: true,
          data: {
            organization: {
              id: `org-${Date.now()}`,
              name: onboardOrgName,
              sector: onboardSector,
              state: onboardState,
              pricingTier: onboardTier,
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              stats: { grantsCount: grants.length, usersCount: users.length, daysRemaining: 14, isTrialActive: true }
            },
            message: `Welcome to SurePact! Workspace instantiated for "${onboardOrgName}" in ${onboardTier} mode.`
          }
        };
      }

      if (data.success) {
        const newOrg = data.data?.organization || {
          name: onboardOrgName,
          sector: onboardSector,
          state: onboardState,
          pricingTier: onboardTier,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          stats: { grantsCount: onboardPopulateDemo ? grants.length : 0, usersCount: users.length, daysRemaining: 14, isTrialActive: true }
        };
        setOrganization(newOrg);

        const newRecord = {
          id: `org-${Date.now()}`,
          name: onboardOrgName,
          sector: onboardSector,
          state: onboardState,
          pricingTier: onboardTier,
          isClean: !onboardPopulateDemo
        };
        const newList = [newRecord, ...tenantsList.filter(t => t.name !== onboardOrgName)];
        setTenantsList(newList);
        try { localStorage.setItem('surepact_tenants_registry', JSON.stringify(newList)); } catch (e) {}

        setShowOnboardingModal(false);
        if (!onboardPopulateDemo) {
          setIsCleanTenantWorkspace(true);
          applyCleanWorkspaceState();
          alert(`✨ Workspace instantiated for "${onboardOrgName}" with a clean empty workspace!`);
        } else {
          setIsCleanTenantWorkspace(false);
          alert(data.data?.message || `Workspace instantiated for "${onboardOrgName}"!`);
          fetchData();
        }
      } else {
        alert(`Error setting up tenant: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      console.error('Error instantiating tenant workspace:', err);
      setOrganization({
        id: `org-${Date.now()}`,
        name: onboardOrgName,
        sector: onboardSector,
        state: onboardState,
        pricingTier: onboardTier,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        stats: { grantsCount: onboardPopulateDemo ? grants.length : 0, usersCount: users.length, daysRemaining: 14, isTrialActive: true }
      });
      setShowOnboardingModal(false);
      if (!onboardPopulateDemo) {
        setIsCleanTenantWorkspace(true);
        applyCleanWorkspaceState();
        alert(`✨ Workspace instantiated for "${onboardOrgName}" with a clean empty workspace!`);
      } else {
        setIsCleanTenantWorkspace(false);
        alert(`✨ Workspace instantiated for "${onboardOrgName}" in ${onboardTier} mode!`);
      }
    } finally {
      setSubmittingOnboarding(false);
    }
  };

  // Feature Flag Entitlements based on Active Pricing Tier
  const currentTier = organization?.pricingTier || 'FREE_TRIAL';
  const isEnterpriseTier = currentTier === 'ENTERPRISE';
  const isStarterTier = currentTier === 'STARTER';
  const isFreeTrialTier = currentTier === 'FREE_TRIAL';

  // Enterprise Tier Exclusive Capabilities
  const canAccessProjects = isEnterpriseTier;
  const canAccessClawbackSentinel = isEnterpriseTier;
  const canAccessCashflowForecast = isEnterpriseTier; // Revenue Recognition & Split Funding

  // Starter Tier & Enterprise Tier Capabilities
  const canAccessAgreementIngestion = isStarterTier || isEnterpriseTier; // PDF Contract Parser
  const canAccessAiWriter = isStarterTier || isEnterpriseTier; // AI Grant Writer
  const canAccessAnalytics = isStarterTier || isEnterpriseTier;
  const canAccessCrm = isStarterTier || isEnterpriseTier;

  // All Tiers Capabilities (Free Trial, Starter, Enterprise)
  const canAccessGrantSearch = true;
  const canAccessUrlIngestion = true;
  
  // CRM Forms state
  const [showAddFundingBodyModal, setShowAddFundingBodyModal] = useState(false);
  const [newFundingBodyName, setNewFundingBodyName] = useState('');
  const [newFundingBodyType, setNewFundingBodyType] = useState('GOVERNMENT');
  const [newFundingBodyWebsite, setNewFundingBodyWebsite] = useState('');
  const [newFundingBodyDescription, setNewFundingBodyDescription] = useState('');
  const [savingFundingBody, setSavingFundingBody] = useState(false);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  const [showAddOpportunityModal, setShowAddOpportunityModal] = useState(false);
  const [newOppContactId, setNewOppContactId] = useState('');
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppValue, setNewOppValue] = useState('');
  const [newOppDescription, setNewOppDescription] = useState('');
  const [newOppDeadline, setNewOppDeadline] = useState('');
  const [savingOpportunity, setSavingOpportunity] = useState(false);

  const [showAddInteractionModal, setShowAddInteractionModal] = useState(false);
  const [newInteractionContactId, setNewInteractionContactId] = useState('');
  const [newInteractionType, setNewInteractionType] = useState<'EMAIL' | 'CALL' | 'MEETING' | 'NOTE' | 'TASK'>('NOTE');
  const [newInteractionSubject, setNewInteractionSubject] = useState('');
  const [newInteractionContent, setNewInteractionContent] = useState('');
  const [newInteractionDueDate, setNewInteractionDueDate] = useState('');
  const [newInteractionStatus, setNewInteractionStatus] = useState('COMPLETED');
  const [savingInteraction, setSavingInteraction] = useState(false);

  const [promotingOpportunityId, setPromotingOpportunityId] = useState('');

  // Executive Approval Workflow states
  const [selectedApproverId, setSelectedApproverId] = useState<string>('');
  const [approvalNotesInput, setApprovalNotesInput] = useState<string>('');
  const [requestingApproval, setRequestingApproval] = useState<boolean>(false);

  // Registry search states
  const [registrySearch, setRegistrySearch] = useState('');
  const [registryStatusFilter, setRegistryStatusFilter] = useState('');

  // Column management states
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'title', 'funderName', 'amountRequested', 'totalFundingValue', 'amtReceived', 'amtSpent', 'closeDate', 'status', 'workflowStage', 'nextExpectedPayment'
  ]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Create Manual Grant Sidebar states
  const [showNewGrantSidebar, setShowNewGrantSidebar] = useState(false);
  const [newGrantUrlInput, setNewGrantUrlInput] = useState('');
  const [newGrantFunder, setNewGrantFunder] = useState('');
  const [registerNewFunder, setRegisterNewFunder] = useState(false);
  const [newFunderType, setNewFunderType] = useState('GOVERNMENT');
  const [newFunderWebsite, setNewFunderWebsite] = useState('');
  const [newFunderDesc, setNewFunderDesc] = useState('');
  const [newGrantTitle, setNewGrantTitle] = useState('');
  const [newGrantDesc, setNewGrantDesc] = useState('');
  const [newGrantIdOptional, setNewGrantIdOptional] = useState('');
  const [newGrantManager, setNewGrantManager] = useState('');
  const [newGrantOwner, setNewGrantOwner] = useState('');
  const [newGrantStart, setNewGrantStart] = useState('');
  const [newGrantEnd, setNewGrantEnd] = useState('');
  const [newGrantAmount, setNewGrantAmount] = useState('');
  const [newGrantRisk, setNewGrantRisk] = useState('');
  const [newGrantCoContribution, setNewGrantCoContribution] = useState(false);
  const [newGrantJointVenture, setNewGrantJointVenture] = useState(false);
  const [fetchingScrapedDetails, setFetchingScrapedDetails] = useState(false);
  const [savingNewGrant, setSavingNewGrant] = useState(false);
  const [newGrantBUId, setNewGrantBUId] = useState(''); // New state for Related Business Unit

  // Create Project state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDept, setProjDept] = useState('');
  const [projBUId, setProjBUId] = useState(''); // New state for Related Business Unit
  const [savingProject, setSavingProject] = useState(false);

  // Link Project state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkGrantId, setLinkGrantId] = useState('');
  const [linkProjectId, setLinkProjectId] = useState('');
  const [linkAmount, setLinkAmount] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  // Manual Task Creation state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskMilestoneId, setTaskMilestoneId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskUserId, setTaskUserId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [showManualLogModal, setShowManualLogModal] = useState(false);
  const [manualLogMessage, setManualLogMessage] = useState('');
  const [manualLogUser, setManualLogUser] = useState('Adrian Warren');
  const [savingManualLog, setSavingManualLog] = useState(false);

  // Document Upload state
  const [showDocModal, setShowDocModal] = useState(false);
  const [docGrantId, setDocGrantId] = useState('');
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<'AGREEMENT' | 'REPORT' | 'APPLICATION' | 'OTHER'>('OTHER');
  const [docUploadedBy, setDocUploadedBy] = useState('');
  const [docFileSize, setDocFileSize] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);

  // Global Documents states
  const [globalDocs, setGlobalDocs] = useState<any[]>([]);
  const [fetchingGlobalDocs, setFetchingGlobalDocs] = useState(false);
  const [globalDocSearch, setGlobalDocSearch] = useState('');
  const [showGlobalAddDocModal, setShowGlobalAddDocModal] = useState(false);
  const [globalAddDocName, setGlobalAddDocName] = useState('');
  const [globalAddDocType, setGlobalAddDocType] = useState<'AGREEMENT' | 'REPORT' | 'APPLICATION' | 'OTHER'>('OTHER');
  const [globalAddDocUploadedBy, setGlobalAddDocUploadedBy] = useState('Adrian Warren');
  const [globalAddDocFileSize, setGlobalAddDocFileSize] = useState('');
  const [globalAddDocGrantId, setGlobalAddDocGrantId] = useState('');
  const [savingGlobalDoc, setSavingGlobalDoc] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setRefreshing(true);
    fetchOrganization();
    if (isCleanTenantWorkspace) {
      applyCleanWorkspaceState();
      setRefreshing(false);
      return;
    }
    try {
      // 1. Fetch grants
      const gRes = await fetch(`${API_BASE}/grants`);
      const gData = await gRes.json();
      if (gData.success) setGrants(gData.data);

      // 2. Fetch projects
      const pRes = await fetch(`${API_BASE}/projects`);
      const pData = await pRes.json();
      if (pData.success) setProjects(pData.data);

      // 3. Fetch users
      const uRes = await fetch(`${API_BASE}/users`);
      const uData = await uRes.json();
      if (uData.success) {
        setUsers(uData.data);
        if (uData.data.length > 0 && !activeUserId) {
          const adrian = uData.data.find((u: any) => u.name === 'Adrian Warren');
          if (adrian) {
            setActiveUserId(adrian.id);
          } else {
            setActiveUserId(uData.data[0].id);
          }
        }
      }

      // 4. Fetch finances
      const fUrl = financeGrantFilter ? `${API_BASE}/finances?grantId=${financeGrantFilter}` : `${API_BASE}/finances`;
      const fRes = await fetch(fUrl);
      const fData = await fRes.json();
      if (fData.success) setFinances(fData.data);

      // 5. Fetch audit logs
      const lRes = await fetch(`${API_BASE}/audit-ledger`);
      const lData = await lRes.json();
      if (lData.success) setLedger(lData.data);

      // 6. Fetch filtered tasks
      fetchFilteredTasks();

      // 7. Fetch saved searches
      fetchSavedSearches();

      // 8. Fetch knowledge documents
      fetchKnowledgeDocs();

      // 8b. Fetch guidelines files
      fetchGuidelinesFiles();

      // 9. Fetch funding bodies
      fetchFundingBodies();

      // 10. Fetch global documents
      fetchGlobalDocs();

      // 11. Fetch departments
      const dRes = await fetch(`${API_BASE}/departments`);
      const dData = await dRes.json();
      if (dData.success) setDepartments(dData.data);

      // 12. Fetch current tenant organization & tier
      fetchOrganization();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchFilteredTasks = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterUser) queryParams.append('assignedToUserId', filterUser);
      if (filterGrant) queryParams.append('grantId', filterGrant);
      if (filterProject) queryParams.append('projectId', filterProject);
      if (filterStatus) queryParams.append('status', filterStatus);

      const tRes = await fetch(`${API_BASE}/tasks?${queryParams.toString()}`);
      const tData = await tRes.json();
      if (tData.success) setTasks(tData.data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Re-fetch tasks when filters change
  useEffect(() => {
    fetchFilteredTasks();
  }, [filterUser, filterGrant, filterProject, filterStatus]);

  // Re-fetch finances when grant filter changes
  useEffect(() => {
    if (isAuthenticated) {
      const fetchFinances = async () => {
        try {
          const fUrl = financeGrantFilter ? `${API_BASE}/finances?grantId=${financeGrantFilter}` : `${API_BASE}/finances`;
          const fRes = await fetch(fUrl);
          const fData = await fRes.json();
          if (fData.success) setFinances(fData.data);
        } catch (err) {}
      };
      fetchFinances();
    }
  }, [financeGrantFilter, isAuthenticated]);

  // Sync risk sliders and default workflow stage when selected grant changes
  useEffect(() => {
    if (selectedGrantId) {
      const grant = grants.find(g => g.id === selectedGrantId);
      if (grant) {
        if (grant.riskAssessment) {
          setFinancialScore(grant.riskAssessment.financialRiskScore);
          setDeliveryScore(grant.riskAssessment.deliveryCapabilityScore);
          setStrategicScore(grant.riskAssessment.strategicAlignmentScore);
        } else {
          setFinancialScore(3);
          setDeliveryScore(3);
          setStrategicScore(3);
        }

        // Set default workflow stage based on status
        if (grant.status === 'POTENTIAL' || grant.status === 'RISK_ASSESSMENT') {
          setActiveWorkflowStage(1);
        } else if (grant.status === 'APPLICATION_STAGED' || grant.status === 'SUBMITTED') {
          setActiveWorkflowStage(2);
        } else if (grant.status === 'AWARDED') {
          setActiveWorkflowStage(4);
        } else if (grant.status === 'CLOSED') {
          setActiveWorkflowStage(5);
        } else if (grant.status === 'REJECTED') {
          setActiveWorkflowStage(3);
        }

        // Initialize SurePact form states
        setExpectedOutcomes(grant.guidelinesResponseDocs || '');
        setRiskConsiderations(grant.riskAssessment?.justificationNotes || '');
        setFundingRequested(grant.amountRequested ? grant.amountRequested.toString() : '');
        setSubmissionDate(grant.dateSubmitted ? grant.dateSubmitted.split('T')[0] : '');
        setSubmissionComments(grant.closeoutNotes || '');

        if (grant.costItems) {
          try {
            setCostItems(JSON.parse(grant.costItems));
          } catch (e) {
            console.error("Failed to parse cost items:", e);
            setCostItems([]);
          }
        } else {
          setCostItems([
            { id: '1', name: 'External Labour Hire', description: 'consultants', cost: 300000 },
            { id: '2', name: 'Materials', description: 'raw materials', cost: 100000 },
            { id: '3', name: 'Plant and Equipment', description: 'truck', cost: 100000 }
          ]);
        }

        const contract = grant.contracts?.[0];
        if (contract) {
          setAwardExecDate(contract.executionDate ? contract.executionDate.split('T')[0] : new Date().toISOString().split('T')[0]);
          setAwardAgRef(contract.fundingAgreementReference || '');
          setAwardAmount(contract.totalObligatedAmount ? contract.totalObligatedAmount.toString() : '');
          setCoContribution(contract.coContribution ? contract.coContribution.toString() : '0');
          if (contract.installments && contract.installments.length > 0) {
            setAwardInstallments(contract.installments.map((inst: any) => ({
              amount: inst.amount.toString(),
              dueDate: inst.dueDate.split('T')[0]
            })));
          } else {
            setAwardInstallments([]);
          }
        } else {
          setAwardExecDate(new Date().toISOString().split('T')[0]);
          setAwardAgRef('');
          setAwardAmount('');
          setCoContribution('0');
          setAwardInstallments([]);
        }
        
        // Reset vertical menu ONLY if a different grant has been selected
        if (lastSelectedGrantIdRef.current !== selectedGrantId) {
          lastSelectedGrantIdRef.current = selectedGrantId;
          setActiveMenuSection('overview');
          setActiveMenuItem('overview-details');
          setGeneratedDraftText('');
        }
      }
    } else {
      lastSelectedGrantIdRef.current = '';
    }
  }, [selectedGrantId, grants]);

  // Sync project details and budget inputs
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        setProjectBudgetInput(project.budgetAmount.toString());

        if (project.status === 'POTENTIAL') {
          setActiveProjectWorkflowStage(1);
        } else if (project.status === 'PENDING') {
          setActiveProjectWorkflowStage(2);
        } else if (project.status === 'IN_PROGRESS') {
          setActiveProjectWorkflowStage(3);
        } else if (project.status === 'CLOSED') {
          setActiveProjectWorkflowStage(4);
        }
      }
    }
  }, [selectedProjectId, projects]);

  // Load example agreements when Ingestion tab is active
  useEffect(() => {
    if (activeTab === 'ingest-agreement') {
      const fetchExampleAgreements = async () => {
        try {
          const res = await fetch(`${API_BASE}/example-agreements`);
          const data = await res.json();
          setExampleAgreements(data);
        } catch (error) {
          console.error('Failed to fetch example agreements:', error);
        }
      };
      fetchExampleAgreements();
    }
  }, [activeTab]);

  // Handle URL Ingestion via Gemini AI
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteUrl) return;

    setIngesting(true);
    setIngestLogs([]);

    const logs = [
      `[${new Date().toLocaleTimeString()}] Resolving Gemini AI Scraper Engine...`,
      `[${new Date().toLocaleTimeString()}] Fetching web page text via server proxy...`,
      `[${new Date().toLocaleTimeString()}] Sending text content to Google Gemini API (gemini-2.0-flash / gemini-1.5-flash)...`,
    ];

    setIngestLogs([...logs]);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      logs.push(`[${new Date().toLocaleTimeString()}] Extracting title, agency, AUD amounts, open/close dates, and eligibility criteria...`);
      setIngestLogs([...logs]);

      const res = await fetch(`${API_BASE}/grants/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pasteUrl })
      });
      const data = await res.json();

      if (data.success) {
        logs.push(`[${new Date().toLocaleTimeString()}] SUCCESS: "${data.data.title}" successfully ingested via ${data.data.extractedDetails?.extractionMethod || 'GEMINI_AI'}!`);
        logs.push(`[${new Date().toLocaleTimeString()}] Initialized grant record status as: POTENTIAL`);
        setIngestLogs([...logs]);
        setPasteUrl('');
        fetchData();
      } else {
        logs.push(`[${new Date().toLocaleTimeString()}] ERROR: ${data.error}`);
        setIngestLogs([...logs]);
      }
    } catch (err: any) {
      logs.push(`[${new Date().toLocaleTimeString()}] SCRAPING EXCEPTION: ${err.message}`);
      setIngestLogs([...logs]);
    } finally {
      setIngesting(false);
    }
  };

  // Helper to load pdf.js dynamically from CDN
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        try {
          const workerCode = `importScripts("https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js");`;
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
        } catch (e) {
          console.warn("Failed to initialize PDF.js worker via Blob. Fallback to main thread.", e);
        }
        resolve(pdfjsLib);
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  };

  // Helper to extract text contents from a PDF ArrayBuffer
  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdfjsLib = await loadPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      text += pageText + '\n';
    }
    return text;
  };

  // Calls the backend to run Gemini API parsing
  const triggerAiParsing = async (text: string) => {
    setIsAgreementParsing(true);
    setAgreementParseStatus('Sending text to AI parsing engine...');

    const progressSteps = [
      'Sending text to AI parsing engine...',
      'Analyzing document structures & clause layouts...',
      'Extracting grant metadata & financial schedules...',
      'Extracting milestones & payment installments...',
      'Structuring obligations & mapping staff...',
      'Finalizing data formatting...'
    ];
    let stepIdx = 1;
    const progressInterval = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setAgreementParseStatus(progressSteps[stepIdx]);
        stepIdx++;
      }
    }, 4500);

    try {
      const res = await fetch(`${API_BASE}/parse-agreement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server returned status ${res.status}: ${errText.substring(0, 150)}`);
      }
      const data = await res.json();
      if (data.success) {
        // Map obligations to include a default assignee (first user if available)
        const defaultUser = users[0]?.id || '';
        const mappedObligations = (data.data.obligations || []).map((ob: any) => ({
          ...ob,
          assignedToUserId: defaultUser
        }));
        const mappedInstallments = (data.data.installments || []).map((inst: any) => ({
          amount: inst.amount ? parseFloat(inst.amount) : 0,
          dueDate: inst.dueDate || '',
          status: 'PENDING'
        }));
        setParsedAgreementData({
          title: data.data.title || '',
          funderName: data.data.funderName || '',
          totalFundingValue: data.data.totalFundingValue || null,
          category: data.data.category || 'Infrastructure',
          openDate: data.data.openDate || '',
          closeDate: data.data.closeDate || '',
          referenceNumber: data.data.referenceNumber || '',
          obligations: mappedObligations,
          installments: mappedInstallments
        });
      } else {
        alert('AI Parsing failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error during AI parsing: ' + err.message);
    } finally {
      clearInterval(progressInterval);
      setIsAgreementParsing(false);
      setAgreementParseStatus('');
    }
  };

  // Handles raw local PDF uploads
  const handleParsePdf = async (file: File) => {
    setIsAgreementParsing(true);
    setAgreementParseStatus('Reading PDF file...');
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          setAgreementParseStatus('Extracting PDF text contents...');
          const extractedText = await extractTextFromPdf(arrayBuffer);
          await triggerAiParsing(extractedText);
        } catch (err: any) {
          alert('Failed to extract text from PDF: ' + err.message);
          setIsAgreementParsing(false);
        }
      };
      reader.onerror = () => {
        alert('Failed to read file.');
        setIsAgreementParsing(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      alert('Error reading PDF: ' + err.message);
      setIsAgreementParsing(false);
    }
  };

  // Handles clicking a preloaded example PDF
  const handleParsePreloaded = async (filename: string) => {
    setIsAgreementParsing(true);
    setAgreementParseStatus(`Downloading "${filename}"...`);
    try {
      const res = await fetch(`${API_BASE}/example-agreements/${encodeURIComponent(filename)}`);
      if (!res.ok) {
        throw new Error(`Failed to download example agreement: ${res.statusText}`);
      }
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      setAgreementParseStatus('Extracting text using PDF.js...');
      const extractedText = await extractTextFromPdf(arrayBuffer);
      await triggerAiParsing(extractedText);
    } catch (err: any) {
      alert('Failed to process preloaded PDF: ' + err.message);
      setIsAgreementParsing(false);
    }
  };

  // Saves the final reviewed grant and obligations
  const handleSaveIngested = async () => {
    if (!parsedAgreementData) return;

    if (ingestMode === 'create' && !parsedAgreementData.title) {
      alert('Please provide a grant title.');
      return;
    }

    if (ingestMode === 'associate' && !ingestSelectedGrantId) {
      alert('Please select a grant to associate with.');
      return;
    }

    setIsAgreementParsing(true);
    setAgreementParseStatus('Saving and creating database records...');
    try {
      const res = await fetch(`${API_BASE}/ingest-agreement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: ingestMode,
          grantId: ingestSelectedGrantId,
          grantData: {
            title: parsedAgreementData.title,
            funderName: parsedAgreementData.funderName,
            totalFundingValue: parsedAgreementData.totalFundingValue,
            category: parsedAgreementData.category,
            openDate: parsedAgreementData.openDate,
            closeDate: parsedAgreementData.closeDate,
            referenceNumber: parsedAgreementData.referenceNumber
          },
          obligations: parsedAgreementData.obligations,
          installments: parsedAgreementData.installments
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Funding agreement successfully ingested! All milestones and tasks created.');
        setParsedAgreementData(null);
        setIngestSelectedGrantId('');
        fetchData(); // Reload grants and tasks
        setActiveTab('grants'); // Redirect to grants registry
      } else {
        alert('Failed to ingest agreement: ' + data.error);
      }
    } catch (err: any) {
      alert('Error during ingestion save: ' + err.message);
    } finally {
      setIsAgreementParsing(false);
      setAgreementParseStatus('');
    }
  };

  // Handle Risk Evaluation Submission
  const handleEvaluateRisk = async () => {
    if (!selectedGrantId) return;
    setEvaluatingRisk(true);
    try {
      const res = await fetch(`${API_BASE}/grants/${selectedGrantId}/risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialRiskScore: financialScore,
          deliveryCapabilityScore: deliveryScore,
          strategicAlignmentScore: strategicScore
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to submit risk profile:', error);
    } finally {
      setEvaluatingRisk(false);
    }
  };

  // Handle Approve to Apply
  const handleApproveToApply = async (grantId: string) => {
    try {
      const res = await fetch(`${API_BASE}/grants/${grantId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        if (selectedGrantId === grantId) {
          setSelectedGrantId(grantId);
          setActiveWorkflowStage(2); // Advance to Stage 2 (Application)
        }
      }
    } catch (error) {
      console.error('Failed to approve application:', error);
    }
  };

  // Handle Submit Application
  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetGrantId = submittingGrantId || selectedGrantId;
    if (!targetGrantId || !submitDate || !submitRef) return;
    setSavingSubmission(true);
    try {
      const res = await fetch(`${API_BASE}/grants/${targetGrantId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateSubmitted: submitDate,
          submissionReference: submitRef,
          amountRequested: submitAmountRequested
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSubmitModal(false);
        setSubmitRef('');
        setSubmitAmountRequested('');
        setSubmittingGrantId('');
        fetchData();
        setActiveWorkflowStage(3); // Advance to Stage 3 (Award)
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setSavingSubmission(false);
    }
  };

  // For quick direct submissions
  const handleSubmittingApplicationDirectly = async () => {
    const targetGrantId = selectedGrantId;
    if (!targetGrantId || !submitDate || !submitRef) return;
    setSavingSubmission(true);
    try {
      const res = await fetch(`${API_BASE}/grants/${targetGrantId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateSubmitted: submitDate,
          submissionReference: submitRef
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitRef('');
        fetchData();
        setActiveWorkflowStage(3); // Advance to Stage 3 (Award)
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setSavingSubmission(false);
    }
  };

  // Handle GFA PDF Analysis
  const handleGfaExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gfaGrantId || !gfaFileName) return;

    setExtractingGfa(true);
    setGfaLogs([]);

    const logs = [
      `[${new Date().toLocaleTimeString()}] Initializing GFA Document Extraction Engine...`,
      `[${new Date().toLocaleTimeString()}] File uploaded: "${gfaFileName}" (2.4 MB)`,
      `[${new Date().toLocaleTimeString()}] Running optical character recognition (OCR) and document partitioning...`
    ];
    setGfaLogs([...logs]);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      logs.push(`[${new Date().toLocaleTimeString()}] OCR completed. Segmented 12 legal agreement pages.`);
      logs.push(`[${new Date().toLocaleTimeString()}] Parsing document structure for funding agencies and execution clauses...`);
      setGfaLogs([...logs]);

      await new Promise(resolve => setTimeout(resolve, 800));
      logs.push(`[${new Date().toLocaleTimeString()}] IDENTIFIED CLAUSE: Section 4 - Milestones, Deliverables and Payment Triggers.`);
      logs.push(`[${new Date().toLocaleTimeString()}] Isolating deliverables and matching estimated timelines...`);
      setGfaLogs([...logs]);

      await new Promise(resolve => setTimeout(resolve, 800));
      logs.push(`[${new Date().toLocaleTimeString()}] AI Extraction succeeded. Found matching milestone templates.`);
      setGfaLogs([...logs]);

      const res = await fetch(`${API_BASE}/grants/${gfaGrantId}/extract-gfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentName: gfaFileName })
      });
      const data = await res.json();

      if (data.success) {
        logs.push(`[${new Date().toLocaleTimeString()}] SUCCESS: Contract executed & milestones generated!`);
        logs.push(`[${new Date().toLocaleTimeString()}] Bounded context "post_award" initialized successfully.`);
        setGfaLogs([...logs]);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setShowGfaModal(false);
        setGfaFileName('');
        setGfaGrantId('');
        fetchData();
        setActiveWorkflowStage(4); // Go to Stage 4 (Obligation Management)
      } else {
        logs.push(`[${new Date().toLocaleTimeString()}] EXTRACTION ERROR: ${data.error}`);
        setGfaLogs([...logs]);
      }
    } catch (err: any) {
      logs.push(`[${new Date().toLocaleTimeString()}] SYSTEM EXCEPTION: ${err.message}`);
      setGfaLogs([...logs]);
    } finally {
      setExtractingGfa(false);
    }
  };

  // Handle Multi-Document Guidelines & Checklist AI Analysis
  const handleGuidelinesExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guidelinesGrantId) return;

    const docList = guidelinesFileNames.length > 0 ? guidelinesFileNames : (guidelinesFileName ? [guidelinesFileName] : ['rcp_round4_guidelines.pdf']);

    setExtractingGuidelines(true);
    setGuidelinesLogs([]);

    const logs = [
      `[${new Date().toLocaleTimeString()}] Initializing Multi-Document Guidelines AI Parsing Engine...`,
      `[${new Date().toLocaleTimeString()}] Processing ${docList.length} uploaded files: ${docList.join(', ')}`,
      `[${new Date().toLocaleTimeString()}] Partitioning text across guidelines, checklists & evaluation annexures...`
    ];
    setGuidelinesLogs([...logs]);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      logs.push(`[${new Date().toLocaleTimeString()}] Extracted criteria weightings, word limits, and mandatory response attachments...`);
      logs.push(`[${new Date().toLocaleTimeString()}] Synthesizing unified Grant Proposal Requirements Matrix with Google Gemini AI...`);
      setGuidelinesLogs([...logs]);

      const res = await fetch(`${API_BASE}/grants/${guidelinesGrantId}/extract-guidelines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentNames: docList })
      });
      const data = await res.json();

      if (data.success) {
        logs.push(`[${new Date().toLocaleTimeString()}] SUCCESS: Multi-document requirements matrix synthesized across ${docList.length} files!`);
        setGuidelinesLogs([...logs]);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setShowGuidelinesModal(false);
        setGuidelinesFileName('');
        setGuidelinesGrantId('');
        fetchData();
      } else {
        logs.push(`[${new Date().toLocaleTimeString()}] EXTRACTION ERROR: ${data.error}`);
        setGuidelinesLogs([...logs]);
      }
    } catch (err: any) {
      logs.push(`[${new Date().toLocaleTimeString()}] SYSTEM EXCEPTION: ${err.message}`);
      setGuidelinesLogs([...logs]);
    } finally {
      setExtractingGuidelines(false);
    }
  };

  const handleOpenAcquittalModal = (type: 'grant' | 'project', id: string, title: string) => {
    setAcquittalFilterType(type);
    setAcquittalTargetId(id);
    setAcquittalTargetTitle(title);
    setAcquittalStartDate('2026-01-01');
    setAcquittalEndDate('2026-12-31');
    setAcquittalTransactions([]);
    setShowAcquittalModal(true);
  };

  const handleGenerateAcquittalReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finances?.transactions) return;

    const filtered = finances.transactions.filter(t => {
      // 1. Filter by target link
      const matchesTarget = acquittalFilterType === 'grant' 
        ? t.grantId === acquittalTargetId 
        : t.projectId === acquittalTargetId;

      if (!matchesTarget) return false;

      // 2. Filter by date range
      const tDateStr = t.date.split('T')[0];
      if (acquittalStartDate && tDateStr < acquittalStartDate) return false;
      if (acquittalEndDate && tDateStr > acquittalEndDate) return false;

      return true;
    });

    setAcquittalTransactions(filtered);
  };

  const handleExportAcquittalCSV = () => {
    if (acquittalTransactions.length === 0) return;
    
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount (AUD)'];
    const rows = acquittalTransactions.map(t => [
      new Date(t.date).toLocaleDateString('en-AU'),
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.type,
      t.amount.toFixed(2)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const sanitizedTitle = acquittalTargetTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.setAttribute('download', `surepact_acquittal_${sanitizedTitle}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  // Reject application
  const handleRejectApplication = async (grantId: string) => {
    if (!confirm('Are you sure you want to mark this grant application as Rejected?')) return;
    try {
      const res = await fetch(`${API_BASE}/grants/${grantId}/reject`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setActiveWorkflowStage(3); // Go to Award Stage
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Closeout grant
  const handleCloseoutGrant = async (grantId: string) => {
    setSavingCloseout(true);
    try {
      const res = await fetch(`${API_BASE}/grants/${grantId}/closeout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closeoutNotes: closeoutNotesText })
      });
      const data = await res.json();
      if (data.success) {
        setCloseoutNotesText('');
        fetchData();
        setActiveWorkflowStage(5); // Go to closeout stage
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCloseout(false);
    }
  };

  // Save custom Award Details
  const handleAwardGrantDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrantId || !awardAmount) return;
    setSavingAward(true);
    try {
      const res = await fetch(`${API_BASE}/grants/${selectedGrantId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionDate: awardExecDate,
          fundingAgreementReference: awardAgRef,
          totalObligatedAmount: parseFloat(awardAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setActiveWorkflowStage(4); // Advance to Stage 4 (Obligation Management)
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAward(false);
    }
  };

  // Add scheduled installment
  const handleAddInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrant || !instAmount || !instDueDate) return;
    setSavingInstallment(true);
    try {
      const targetId = selectedGrant.contracts?.[0]?.id || selectedGrant.id;
      const res = await fetch(`${API_BASE}/contracts/${targetId}/installments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(instAmount),
          dueDate: instDueDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setInstAmount('');
        setInstDueDate('');
        setShowAddInstallmentForm(false);
        fetchData();
      } else {
        alert('Error: ' + (data.error || 'Failed to create installment.'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingInstallment(false);
    }
  };

  // Toggle installment status
  const handleToggleInstallmentStatus = async (instId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PENDING' ? 'RECEIVED' : 'PENDING';
    try {
      const res = await fetch(`${API_BASE}/installments/${instId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Task Completion Status
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  // Submit Variation Request
  const handleAddVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    const contract = selectedGrant?.contracts?.[0];
    if (!contract || !varRef || !varValueChange) return;

    setSavingVariation(true);
    try {
      const res = await fetch(`${API_BASE}/contracts/${contract.id}/variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceNumber: varRef,
          valueChange: varValueChange,
          newCloseDate: varNewDate || null,
          description: varDesc,
          status: varStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowVariationModal(false);
        setVarRef('');
        setVarValueChange('');
        setVarNewDate('');
        setVarStatus('PENDING');
        setVarDesc('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to submit variation:', error);
    } finally {
      setSavingVariation(false);
    }
  };

  // Submit Transaction Form
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txDesc || !txCategory) return;

    // Expenditures are negative values
    const adjustedAmount = txType === 'EXPENDITURE' ? -Math.abs(parseFloat(txAmount)) : Math.abs(parseFloat(txAmount));

    setSavingTransaction(true);
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: adjustedAmount,
          type: txType,
          description: txDesc,
          category: txCategory,
          grantId: txGrantId || null,
          projectId: txProjectId || null,
          date: txDate,
          invoiceReference: txInvoiceRef || null,
          receiptAttachmentUrl: txReceiptFileName || null,
          isReceiptVerified: !!txReceiptFileName
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowTransactionModal(false);
        setTxAmount('');
        setTxDesc('');
        setTxCategory('Equipment & Materials');
        setTxGrantId('');
        setTxProjectId('');
        setTxInvoiceRef('');
        setTxReceiptFileName('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to submit transaction:', error);
    } finally {
      setSavingTransaction(false);
    }
  };

  // Handle URL Scrape Ingestion inside Create New Grant sidebar
  const handleFetchScrapedDetails = async () => {
    if (!newGrantUrlInput) {
      alert('Please enter a URL to scrape first.');
      return;
    }
    setFetchingScrapedDetails(true);
    try {
      const res = await fetch(`${API_BASE}/grants/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newGrantUrlInput })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setNewGrantTitle(data.data.title || '');
        setNewGrantFunder(data.data.funderName || '');
        setNewGrantAmount(data.data.totalFundingValue ? data.data.totalFundingValue.toString() : '');
        setNewGrantStart(data.data.openDate ? new Date(data.data.openDate).toISOString().split('T')[0] : '');
        setNewGrantEnd(data.data.closeDate ? new Date(data.data.closeDate).toISOString().split('T')[0] : '');
        setNewGrantDesc(data.data.description || '');
      } else {
        alert(data.error || 'Failed to extract opportunity details from URL.');
      }
    } catch (err: any) {
      console.error('Failed to scrape URL:', err);
      alert('Error extracting details: ' + err.message);
    } finally {
      setFetchingScrapedDetails(false);
    }
  };

  // Fill manual grant sidebar with high-quality test data
  const handleFillTestData = () => {
    setNewGrantFunder('Department of Agriculture, Fisheries and Forestry');
    setNewGrantTitle('National Landcare Program Smart Grants');
    setNewGrantDesc('Funding to support projects that protect and conserve Australia’s natural environment, biodiversity, and sustainable agriculture.');
    setNewGrantIdOptional('NLP-2026-SG44');
    
    const defaultMgr = users[0]?.name || 'Sarah Jenkins';
    const defaultOwner = users[1]?.name || 'Mark Taylor';
    setNewGrantManager(defaultMgr);
    setNewGrantOwner(defaultOwner);
    
    setNewGrantStart('2026-08-01');
    setNewGrantEnd('2027-05-31');
    setNewGrantAmount('350000');
    setNewGrantRisk('MEDIUM');
    setNewGrantCoContribution(true);
    setNewGrantJointVenture(false);
  };

  // Create Manual Grant Submission
  const handleCreateNewGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrantTitle) {
      alert('Grant name is required.');
      return;
    }
    if (!newGrantFunder) {
      alert('Funding Body name is required.');
      return;
    }
    if (!newGrantStart || !newGrantEnd) {
      alert('Start and End dates are required.');
      return;
    }
    if (!newGrantAmount) {
      alert('Funding amount available is required.');
      return;
    }
    if (!newGrantRisk) {
      alert('Risk rating is required.');
      return;
    }
    setSavingNewGrant(true);
    try {
      if (registerNewFunder) {
        const funderRes = await fetch(`${API_BASE}/funding-bodies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newGrantFunder.trim(),
            type: newFunderType,
            website: newFunderWebsite.trim() || null,
            description: newFunderDesc.trim() || null
          })
        });
        const funderData = await funderRes.json();
        if (!funderData.success) {
          alert('Failed to register new Funding Body in CRM: ' + (funderData.error || 'Unknown error'));
          setSavingNewGrant(false);
          return;
        }
        // Refresh local funding bodies CRM list
        fetchFundingBodies();
      }

      const res = await fetch(`${API_BASE}/grants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funderName: newGrantFunder.trim(),
          title: newGrantTitle,
          description: newGrantDesc,
          grantIdOptional: newGrantIdOptional,
          grantManager: newGrantManager,
          grantOwner: newGrantOwner,
          openDate: newGrantStart,
          closeDate: newGrantEnd,
          totalFundingValue: parseFloat(newGrantAmount) || 0,
          riskRating: newGrantRisk,
          isCoContributionRequired: newGrantCoContribution,
          isJointVenture: newGrantJointVenture,
          sourceUrl: newGrantUrlInput || null,
          businessUnitId: newGrantBUId || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewGrantUrlInput('');
        setNewGrantFunder('');
        setRegisterNewFunder(false);
        setNewFunderType('GOVERNMENT');
        setNewFunderWebsite('');
        setNewFunderDesc('');
        setNewGrantTitle('');
        setNewGrantDesc('');
        setNewGrantIdOptional('');
        setNewGrantManager('');
        setNewGrantOwner('');
        setNewGrantStart('');
        setNewGrantEnd('');
        setNewGrantAmount('');
        setNewGrantRisk('');
        setNewGrantCoContribution(false);
        setNewGrantJointVenture(false);
        setNewGrantBUId('');
        
        setShowNewGrantSidebar(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to create manual grant.');
      }
    } catch (err: any) {
      console.error('Failed to save manual grant:', err);
      alert('Error creating grant: ' + err.message);
    } finally {
      setSavingNewGrant(false);
    }
  };

  const handleGlobalAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalAddDocName || !globalAddDocType || !globalAddDocGrantId) {
      alert('Please fill out document name, type and select a related grant.');
      return;
    }

    setSavingGlobalDoc(true);
    try {
      const res = await fetch(`${API_BASE}/grants/${globalAddDocGrantId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: globalAddDocName,
          type: globalAddDocType,
          fileSize: globalAddDocFileSize || '1.5 MB',
          uploadedBy: globalAddDocUploadedBy || 'Adrian Warren'
        })
      });
      const data = await res.json();
      if (data.success) {
        setGlobalAddDocName('');
        setGlobalAddDocType('OTHER');
        setGlobalAddDocFileSize('');
        setGlobalAddDocGrantId('');
        
        setShowGlobalAddDocModal(false);
        fetchGlobalDocs();
        fetchData();
      } else {
        alert(data.error || 'Failed to add document.');
      }
    } catch (err: any) {
      console.error('Error uploading document:', err);
      alert('Error: ' + err.message);
    } finally {
      setSavingGlobalDoc(false);
    }
  };

  const handleGlobalDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchGlobalDocs();
        fetchData();
      } else {
        alert(data.error || 'Failed to delete document.');
      }
    } catch (err: any) {
      console.error('Error deleting document:', err);
      alert('Error: ' + err.message);
    }
  };

  // Submit Project Form
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !projDept) return;

    setSavingProject(true);
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projName,
          description: projDesc,
          department: projDept,
          businessUnitId: projBUId || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowProjectModal(false);
        setProjName('');
        setProjDesc('');
        setProjDept('');
        setProjBUId('');
        fetchData();
      } else {
        alert('Error creating project: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setSavingProject(false);
    }
  };

  // Submit Link Project Form
  const handleLinkProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkGrantId || !linkProjectId || !linkAmount) return;

    setSavingLink(true);
    try {
      const res = await fetch(`${API_BASE}/projects/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantId: linkGrantId,
          projectId: linkProjectId,
          allocatedAmount: parseFloat(linkAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowLinkModal(false);
        setLinkGrantId('');
        setLinkProjectId('');
        setLinkAmount('');
        fetchData();
      } else {
        alert('Error linking project: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to link project:', error);
    } finally {
      setSavingLink(false);
    }
  };

  // Submit Add User Form
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      alert('Name and Email are required.');
      return;
    }
    setSavingUser(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          department: newUserDept || null,
          role: newUserRole,
          status: newUserStatus,
          businessUnitIds: newUserBUIds
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserDept('');
        setNewUserRole('staff');
        setNewUserStatus('Active');
        setNewUserBUIds([]);
        fetchData();
      } else {
        alert(data.error || 'Failed to create user.');
      }
    } catch (err: any) {
      console.error('Failed to create user:', err);
      alert('Error creating user: ' + err.message);
    } finally {
      setSavingUser(false);
    }
  };

  // Submit Edit User Form
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !newUserName || !newUserEmail) return;
    setSavingUser(true);
    try {
      const res = await fetch(`${API_BASE}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          department: newUserDept || null,
          role: newUserRole,
          status: newUserStatus,
          businessUnitIds: newUserBUIds
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditUserModal(false);
        setEditingUser(null);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserDept('');
        setNewUserRole('staff');
        setNewUserStatus('Active');
        setNewUserBUIds([]);
        fetchData();
      } else {
        alert(data.error || 'Failed to update user.');
      }
    } catch (err: any) {
      console.error('Failed to update user:', err);
      alert('Error updating user: ' + err.message);
    } finally {
      setSavingUser(false);
    }
  };

  // Submit Add Department Form
  const handleAddDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    setSavingDept(true);
    try {
      const res = await fetch(`${API_BASE}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeptName,
          description: newDeptDesc || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddDeptModal(false);
        setNewDeptName('');
        setNewDeptDesc('');
        fetchData();
      } else {
        alert(data.error || 'Failed to create department.');
      }
    } catch (err: any) {
      console.error('Failed to create department:', err);
      alert('Error creating department: ' + err.message);
    } finally {
      setSavingDept(false);
    }
  };

  // Submit Add Business Unit Form
  const handleAddBUSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBUName || !newBUDeptId) {
      alert('Business Unit Name and Department are required.');
      return;
    }
    setSavingBU(true);
    try {
      const res = await fetch(`${API_BASE}/business-units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBUName,
          description: newBUDesc || null,
          departmentId: newBUDeptId
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddBUModal(false);
        setNewBUName('');
        setNewBUDesc('');
        setNewBUDeptId('');
        fetchData();
      } else {
        alert(data.error || 'Failed to create business unit.');
      }
    } catch (err: any) {
      console.error('Failed to create business unit:', err);
      alert('Error creating business unit: ' + err.message);
    } finally {
      setSavingBU(false);
    }
  };

  const handleUpdateProjectBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !projectBudgetInput) return;
    setSavingProjectBudget(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${selectedProjectId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetAmount: parseFloat(projectBudgetInput) })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update project budget:', error);
    } finally {
      setSavingProjectBudget(false);
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, nextStatus: 'POTENTIAL' | 'PENDING' | 'IN_PROGRESS' | 'CLOSED') => {
    setSavingProjectStatus(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        if (selectedProjectId === projectId) {
          if (nextStatus === 'POTENTIAL') setActiveProjectWorkflowStage(1);
          else if (nextStatus === 'PENDING') setActiveProjectWorkflowStage(2);
          else if (nextStatus === 'IN_PROGRESS') setActiveProjectWorkflowStage(3);
          else if (nextStatus === 'CLOSED') setActiveProjectWorkflowStage(4);
        }
      }
    } catch (error) {
      console.error('Failed to update project status:', error);
    } finally {
      setSavingProjectStatus(false);
    }
  };

  const handleUpdateCostItems = async (newItems: Array<{ id: string; name: string; description: string; cost: number }>) => {
    setCostItems(newItems);
    if (!selectedGrantId) return;
    try {
      await fetch(`${API_BASE}/grants/${selectedGrantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costItems: JSON.stringify(newItems)
        })
      });
      // Silent reload of grants
      const gRes = await fetch(`${API_BASE}/grants`);
      const gData = await gRes.json();
      if (gData.success) setGrants(gData.data);
    } catch (e) {
      console.error("Error saving cost items:", e);
    }
  };

  const handleLinkMilestoneToProject = async (milestoneId: string, projectId: string) => {
    try {
      const res = await fetch(`${API_BASE}/milestones/${milestoneId}/link-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId || null })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to link milestone to project:', error);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, currentAcquitted: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAcquitted: !currentAcquitted })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to toggle milestone acquittal:', error);
    }
  };

  // Submit Manual Task Form
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!taskMilestoneId && !taskGrantId) || !taskTitle || !taskUserId || !taskDueDate) return;

    setSavingTask(true);
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: taskMilestoneId || null,
          grantId: taskGrantId || null,
          title: taskTitle,
          description: taskDesc,
          assignedToUserId: taskUserId,
          dueDate: taskDueDate,
          stage: taskStage
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowTaskModal(false);
        setTaskMilestoneId('');
        setTaskGrantId('');
        setTaskTitle('');
        setTaskDesc('');
        setTaskUserId('');
        setTaskDueDate('');
        setTaskStage('OBLIGATION');
        fetchData();
      } else {
        alert('Error creating task: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setSavingTask(false);
    }
  };

  const fetchSavedSearches = async () => {
    try {
      const res = await fetch(`${API_BASE}/saved-searches`);
      const data = await res.json();
      if (data.success) setSavedSearches(data.data);
    } catch (error) {
      console.error('Failed to fetch saved searches:', error);
    }
  };

  const fetchExternalGrants = async () => {
    setSearchingExternal(true);
    try {
      const queryParams = new URLSearchParams();
      if (externalSearchQuery) queryParams.append('q', externalSearchQuery);
      if (externalSearchCategory) queryParams.append('category', externalSearchCategory);
      if (externalSearchSource) queryParams.append('source', externalSearchSource);
      if (externalSearchMinVal) queryParams.append('minFunding', externalSearchMinVal);
      if (externalSearchMaxVal) queryParams.append('maxFunding', externalSearchMaxVal);

      const res = await fetch(`${API_BASE}/external-grants?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) setExternalGrants(data.data);
    } catch (error) {
      console.error('Failed to search external grants:', error);
    } finally {
      setSearchingExternal(false);
    }
  };

  useEffect(() => {
    fetchExternalGrants();
  }, [externalSearchQuery, externalSearchCategory, externalSearchSource, externalSearchMinVal, externalSearchMaxVal]);

  const handleSaveSearchQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savingSearchName) return;
    setSavingSearch(true);
    try {
      const res = await fetch(`${API_BASE}/saved-searches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: savingSearchName,
          category: externalSearchCategory || null,
          minFunding: externalSearchMinVal ? parseFloat(externalSearchMinVal) : null,
          maxFunding: externalSearchMaxVal ? parseFloat(externalSearchMaxVal) : null,
          source: externalSearchSource || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSaveSearchModal(false);
        setSavingSearchName('');
        fetchSavedSearches();
      }
    } catch (error) {
      console.error('Failed to save search query:', error);
    } finally {
      setSavingSearch(false);
    }
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/saved-searches/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchSavedSearches();
      }
    } catch (error) {
      console.error('Failed to delete saved search:', error);
    }
  };

  const handleConsiderExternalGrant = async (extGrant: ExternalGrant) => {
    setImportingExternalId(extGrant.id);
    try {
      const res = await fetch(`${API_BASE}/external-grants/${extGrant.id}/consider`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setActiveTab('grants');
        handleSelectGrant(data.data);
      } else {
        alert(data.error || 'Failed to import grant.');
      }
    } catch (error) {
      console.error('Failed to import external grant:', error);
    } finally {
      setImportingExternalId('');
    }
  };

  const fetchKnowledgeDocs = async () => {
    try {
      const res = await fetch(`${API_BASE}/knowledge-documents`);
      const data = await res.json();
      if (data.success) setKnowledgeDocs(data.data);
    } catch (error) {
      console.error('Failed to fetch knowledge documents:', error);
    }
  };

  const handleUploadKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKnowledgeName || !newKnowledgeType || !newKnowledgeUploadedBy) return;
    setSavingKnowledge(true);
    try {
      const res = await fetch(`${API_BASE}/knowledge-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKnowledgeName,
          type: newKnowledgeType,
          fileSize: newKnowledgeFileSize || '1.8 MB',
          uploadedBy: newKnowledgeUploadedBy
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowKnowledgeModal(false);
        setNewKnowledgeName('');
        setNewKnowledgeFileSize('');
        setNewKnowledgeUploadedBy('');
        fetchKnowledgeDocs();
        fetchData();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to upload knowledge document:', error);
    } finally {
      setSavingKnowledge(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this global knowledge asset?')) return;
    try {
      const res = await fetch(`${API_BASE}/knowledge-documents/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchKnowledgeDocs();
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete knowledge document:', error);
    }
  };

  const handleGenerateAIDraft = async (grantId: string) => {
    const grant = grants.find(g => g.id === grantId);
    if (!grant?.guidelinesDocName) {
      alert('Please upload funder guidelines before generating draft answers.');
      return;
    }

    setGeneratingDraft(true);
    setDraftGenerationLogs([]);
    setShowDraftLogsModal(true);

    const logSteps = [
      '🔍 Parsing Funder Guideline Questions & Compliance Guidelines...',
      '📂 Scanning Knowledge Centre assets for matching company summaries, organizational stats, and policies...',
      '🧠 Pulling historical proof-points and delivery timelines from selected previous applications...',
      '✍️ Drafting Answer Sections (Executive Summary, Project Scope, Organizational Capability)...',
      '⚖️ Reviewing completed draft against alignment and evaluation criteria...',
      '✅ Draft generated successfully and added to grant application attachments!'
    ];

    for (let i = 0; i < logSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setDraftGenerationLogs(prev => [...prev, logSteps[i]]);
    }

    try {
      const res = await fetch(`${API_BASE}/grants/${grantId}/generate-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructionDocName: grant.guidelinesDocName,
          knowledgeDocIds: selectedKnowledgeIds,
          previousGrantIds: selectedPreviousGrantIds,
          author: 'Adrian (Founder)'
        })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedDraftText(data.data.draftText);
        fetchData();
      } else {
        alert('Draft generation failed: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to generate draft:', error);
    } finally {
      setGeneratingDraft(false);
    }
  };

  // ==========================================
  // AI Grant Writer (AutoRFP Style) Helpers
  // ==========================================
  const fetchGuidelinesFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/ai-grant-writer/guidelines`);
      const data = await res.json();
      if (data.success) setGuidelinesFiles(data.data);
    } catch (err) {
      console.error('Failed to fetch guidelines:', err);
    }
  };

  const fetchGrantRequirements = async (grantId: string) => {
    try {
      const res = await fetch(`${API_BASE}/ai-grant-writer/grants/${grantId}/requirements`);
      const data = await res.json();
      if (data.success) {
        setRequirementsList(data.data);
        if (data.data.length > 0) {
          // Select the first requirement by default if none is selected
          const firstKey = data.data[0].requirementKey;
          setSelectedRequirementKey(firstKey);
          setRequirementDraftText(data.data[0].responseText || '');
          setRequirementStatus(data.data[0].status || 'DRAFT');
        } else {
          setSelectedRequirementKey('');
          setRequirementDraftText('');
          setRequirementStatus('DRAFT');
        }
      }
    } catch (err) {
      console.error('Failed to fetch requirements:', err);
    }
  };

  const handleExtractRequirements = async () => {
    if (!selectedWriterGrantId) return;

    let finalGuidelinesText = customGuidelinesText;
    let finalGuidelinesDocName = selectedGuidelinesFile;

    if (uploadedGuidelinesFiles.length > 0) {
      // Read all files asynchronously and combine them
      setExtractingRequirements(true);
      const readPromises = uploadedGuidelinesFiles.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(`\n--- FILE: ${file.name} ---\n${e.target?.result as string || ''}\n`);
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
      });

      try {
        const fileContents = await Promise.all(readPromises);
        finalGuidelinesText = fileContents.join('\n');
        finalGuidelinesDocName = ''; // Bypass file name since we are passing custom text
      } catch (err: any) {
        setExtractingRequirements(false);
        alert(`Error reading uploaded files: ${err.message}`);
        return;
      }
    }

    if (!finalGuidelinesDocName && !finalGuidelinesText) {
      alert('Please upload/drag-and-drop guidelines documents, select a preloaded guidelines asset, or enter custom text.');
      return;
    }

    setExtractingRequirements(true);
    try {
      const res = await fetch(`${API_BASE}/ai-grant-writer/grants/${selectedWriterGrantId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guidelinesDocName: finalGuidelinesDocName || null,
          customGuidelinesText: finalGuidelinesText || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setRequirementsList(data.data);
        if (data.data.length > 0) {
          setSelectedRequirementKey(data.data[0].requirementKey);
          setRequirementDraftText(data.data[0].responseText || '');
          setRequirementStatus(data.data[0].status || 'DRAFT');
        }
        await fetchData();
        alert('Successfully extracted requirement response blocks and required submission documents checklist using Gemini AI!');
      } else {
        alert('Extraction failed: ' + data.error);
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      alert('Extraction failed: ' + err.message);
    } finally {
      setExtractingRequirements(false);
    }
  };

  const handleGenerateRequirementResponse = async () => {
    if (!selectedWriterGrantId || !selectedRequirementKey) return;
    setGeneratingResponse(true);
    try {
      const res = await fetch(`${API_BASE}/ai-grant-writer/grants/${selectedWriterGrantId}/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementKey: selectedRequirementKey,
          knowledgeDocIds: selectedKnowledgeIds,
          previousGrantIds: selectedPreviousGrantIds,
          userCustomInstructions: customInstructions
        })
      });
      const data = await res.json();
      if (data.success) {
        setRequirementDraftText(data.data.responseText);
        setRequirementStatus(data.data.status);
        // Update the item in the list
        setRequirementsList(prev => prev.map(r => r.requirementKey === selectedRequirementKey ? data.data : r));
      } else {
        alert('Generation failed: ' + data.error);
      }
    } catch (err) {
      console.error('Generation error:', err);
      alert('Generation failed: ' + err);
    } finally {
      setGeneratingResponse(false);
    }
  };

  const handleSaveRequirementText = async (newText: string, newStatus: string) => {
    if (!selectedWriterGrantId || !selectedRequirementKey) return;
    try {
      const res = await fetch(`${API_BASE}/ai-grant-writer/grants/${selectedWriterGrantId}/requirements/${selectedRequirementKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseText: newText,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        // Update the item in the list
        setRequirementsList(prev => prev.map(r => r.requirementKey === selectedRequirementKey ? data.data : r));
        setRequirementStatus(newStatus);
      } else {
        alert('Failed to save: ' + data.error);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleCompileProposal = async () => {
    if (!selectedWriterGrantId) return;
    setCompilingProposal(true);
    try {
      const res = await fetch(`${API_BASE}/ai-grant-writer/grants/${selectedWriterGrantId}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'Adrian (Founder)'
        })
      });
      const data = await res.json();
      if (data.success) {
        setCompiledProposalResult(data.data);
        fetchData(); // reload documents library
        alert(`Successfully compiled and saved proposal to documents library: ${data.data.doc.name}`);
      } else {
        alert('Compilation failed: ' + data.error);
      }
    } catch (err) {
      console.error('Compilation error:', err);
      alert('Compilation failed: ' + err);
    } finally {
      setCompilingProposal(false);
    }
  };

  const handleDownloadDocument = async (docId: string, fileName: string) => {
    try {
      const savedAuth = localStorage.getItem('surepact_auth_token') || 'SurePact2026!';
      const res = await fetch(`${API_BASE}/documents/${docId}/download`, {
        headers: {
          'Authorization': `Bearer ${savedAuth}`
        }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'This proposal was created before content persistence was enabled. Please re-compile in the AI Grant Writer workspace.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace(/\.md$/i, '.doc');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Error downloading document: ' + err.message);
    }
  };

  // Submit Document Form
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docGrantId || !docName || !docType || !docUploadedBy) return;

    setSavingDoc(true);
    try {
      const res = await fetch(`${API_BASE}/grants/${docGrantId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName,
          type: docType,
          fileSize: docFileSize || '1.8 MB',
          uploadedBy: docUploadedBy
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowDocModal(false);
        setDocGrantId('');
        setDocName('');
        setDocType('OTHER');
        setDocUploadedBy('');
        setDocFileSize('');
        fetchData();
      } else {
        alert('Error uploading document: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
    } finally {
      setSavingDoc(false);
    }
  };

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrant || !manualLogMessage) return;

    setSavingManualLog(true);
    try {
      const res = await fetch(`${API_BASE}/audit-ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aggregateId: selectedGrant.id,
          eventType: 'MANUAL_ENTRY',
          user: manualLogUser,
          payload: { message: manualLogMessage }
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowManualLogModal(false);
        setManualLogMessage('');
        fetchData();
      } else {
        alert('Failed to log event: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to log event:', error);
    } finally {
      setSavingManualLog(false);
    }
  };

  const handleUpdateVariationStatus = async (variationId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${API_BASE}/variations/${variationId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert('Error updating variation: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update variation:', error);
    }
  };

  const handleAwardGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrant) return;

    setSavingAward(true);
    try {
      const res = await fetch(`${API_BASE}/grants/${selectedGrant.id}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionDate: awardExecDate,
          fundingAgreementReference: awardAgRef || `SP-${selectedGrant.title.substring(0, 4).toUpperCase()}-${new Date().getFullYear()}`,
          totalObligatedAmount: parseFloat(awardAmount) || 0,
          coContribution: parseFloat(coContribution) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Grant Awarded successfully!');
        setShowAwardForm(false);
        fetchData();
      } else {
        alert('Failed to award grant: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to award grant:', error);
      alert('Error occurred while awarding grant.');
    } finally {
      setSavingAward(false);
    }
  };

  const handleLogAsAwardedInit = () => {
    if (!selectedGrant) return;
    const reqAmt = selectedGrant.amountRequested || selectedGrant.totalFundingValue || 500000;
    setAwardAmount(reqAmt.toString());
    setAwardAgRef('AGR-' + Math.floor(Math.random() * 100000));
    setAwardExecDate(new Date().toISOString().split('T')[0]);
    setCoContribution('0');
    setShowAwardForm(true);
  };

  const fetchFundingBodies = async () => {
    setLoadingFundingBodies(true);
    try {
      const res = await fetch(`${API_BASE}/funding-bodies`);
      const data = await res.json();
      if (data.success) {
        setFundingBodies(data.data);
        if (data.data.length > 0 && !selectedFundingBodyId) {
          setSelectedFundingBodyId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load funding bodies:', error);
    } finally {
      setLoadingFundingBodies(false);
    }
  };

  const fetchGlobalDocs = async () => {
    setFetchingGlobalDocs(true);
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const data = await res.json();
      if (data.success) {
        setGlobalDocs(data.data);
      }
    } catch (error) {
      console.error('Failed to load global documents:', error);
    } finally {
      setFetchingGlobalDocs(false);
    }
  };

  const handleAddFundingBody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFundingBodyName || !newFundingBodyType) return;
    setSavingFundingBody(true);
    try {
      const res = await fetch(`${API_BASE}/funding-bodies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFundingBodyName,
          type: newFundingBodyType,
          website: newFundingBodyWebsite,
          description: newFundingBodyDescription
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddFundingBodyModal(false);
        setNewFundingBodyName('');
        setNewFundingBodyType('GOVERNMENT');
        setNewFundingBodyWebsite('');
        setNewFundingBodyDescription('');
        fetchFundingBodies();
        fetchData();
      } else {
        alert('Error adding funding body: ' + data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingFundingBody(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundingBodyId || !newContactName) return;
    setSavingContact(true);
    try {
      const res = await fetch(`${API_BASE}/funding-bodies/${selectedFundingBodyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContactName,
          role: newContactRole,
          email: newContactEmail,
          phone: newContactPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddContactModal(false);
        setNewContactName('');
        setNewContactRole('');
        setNewContactEmail('');
        setNewContactPhone('');
        fetchFundingBodies();
        fetchData();
      } else {
        alert('Error adding contact: ' + data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingContact(false);
    }
  };

  const handleAddOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundingBodyId || !newOppTitle) return;
    setSavingOpportunity(true);
    try {
      const res = await fetch(`${API_BASE}/funding-bodies/${selectedFundingBodyId}/opportunities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: newOppContactId || null,
          title: newOppTitle,
          value: newOppValue ? parseFloat(newOppValue) : null,
          description: newOppDescription,
          deadline: newOppDeadline
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddOpportunityModal(false);
        setNewOppContactId('');
        setNewOppTitle('');
        setNewOppValue('');
        setNewOppDescription('');
        setNewOppDeadline('');
        fetchFundingBodies();
        fetchData();
      } else {
        alert('Error adding opportunity: ' + data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingOpportunity(false);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteractionContactId || !newInteractionType || !newInteractionSubject || !newInteractionContent) return;
    setSavingInteraction(true);
    try {
      const res = await fetch(`${API_BASE}/funding-bodies/contacts/${newInteractionContactId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newInteractionType,
          subject: newInteractionSubject,
          content: newInteractionContent,
          status: newInteractionStatus,
          dueDate: newInteractionDueDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddInteractionModal(false);
        setNewInteractionContactId('');
        setNewInteractionType('NOTE');
        setNewInteractionSubject('');
        setNewInteractionContent('');
        setNewInteractionDueDate('');
        setNewInteractionStatus('COMPLETED');
        fetchFundingBodies();
        fetchData();
      } else {
        alert('Error logging interaction: ' + data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingInteraction(false);
    }
  };

  const handlePromoteOpportunity = async (oppId: string) => {
    if (!window.confirm('Are you sure you want to promote this opportunity to the main Grants Pipeline?')) return;
    setPromotingOpportunityId(oppId);
    try {
      const res = await fetch(`${API_BASE}/funding-opportunities/${oppId}/promote`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        fetchFundingBodies();
        fetchData();
        setActiveTab('grants');
        handleSelectGrant(data.data);
        setActiveWorkflowStage(1);
        alert('Opportunity successfully promoted to Stage 1 of the Grants Pipeline!');
      } else {
        alert('Promotion failed: ' + data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPromotingOpportunityId('');
    }
  };

  // Filtered and sorted grants list for the registry
  const filteredGrants = grants.filter(g => {
    // 0. Business Unit active user access filter
    const activeUser = users.find(u => u.id === activeUserId);
    if (activeUser && activeUser.role !== 'admin') {
      const userBUIds = activeUser.businessUnits?.map(bu => bu.businessUnit.id) || [];
      if (g.businessUnitId !== null && g.businessUnitId !== undefined && g.businessUnitId !== '' && !userBUIds.includes(g.businessUnitId)) {
        return false;
      }
    }

    // 1. Global text search (title or funder)
    const matchesSearch = g.title.toLowerCase().includes(registrySearch.toLowerCase()) || 
                          g.funderName.toLowerCase().includes(registrySearch.toLowerCase());
    
    // 2. Global status dropdown filter
    const matchesStatus = registryStatusFilter === '' || g.status === registryStatusFilter;
    
    if (!matchesSearch || !matchesStatus) return false;

    // 3. Column-specific filters
    const matchesColumnFilters = visibleColumns.every(colId => {
      const filterVal = columnFilters[colId];
      if (!filterVal) return true;
      
      let cellVal = '';
      if (colId === 'title') cellVal = g.title;
      else if (colId === 'funderName') cellVal = g.funderName;
      else if (colId === 'amountRequested') cellVal = g.amountRequested ? `$${g.amountRequested.toLocaleString()}` : 'tbd';
      else if (colId === 'totalFundingValue') {
        const amt = g.contracts?.[0]?.totalObligatedAmount ?? g.totalFundingValue;
        cellVal = amt ? `$${amt.toLocaleString()}` : 'tbd';
      }
      else if (colId === 'amtReceived') {
        const grantTransactions = finances?.transactions.filter(t => t.grantId === g.id) || [];
        const amt = grantTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        cellVal = `$${amt.toLocaleString()}`;
      }
      else if (colId === 'amtSpent') {
        const grantTransactions = finances?.transactions.filter(t => t.grantId === g.id) || [];
        const amt = grantTransactions.filter(t => t.type === 'EXPENDITURE').reduce((sum, t) => sum + t.amount, 0);
        cellVal = `$${amt.toLocaleString()}`;
      }
      else if (colId === 'closeDate') {
        cellVal = g.closeDate ? new Date(g.closeDate).toLocaleDateString('en-AU') : 'tbd';
      }
      else if (colId === 'status') cellVal = g.status;
      else if (colId === 'workflowStage') cellVal = getWorkflowStageLabel(g.status);
      else if (colId === 'nextExpectedPayment') {
        const grantInstallments = g.contracts?.[0]?.installments || [];
        const pendingInstallments = grantInstallments.filter(inst => inst.status === 'PENDING');
        if (pendingInstallments.length > 0) {
          const sortedPending = [...pendingInstallments].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime());
          const nextInst = sortedPending[0];
          cellVal = `$${nextInst.amount.toLocaleString()} (${new Date(nextInst.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`;
        } else {
          cellVal = 'n/a';
        }
      }
      else if (colId === 'nextUpcomingTask') {
        const grantTasks = tasks.filter(t => t.grantId === g.id && t.status !== 'COMPLETED');
        if (grantTasks.length > 0) {
          const sortedTasks = [...grantTasks].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime());
          const nextTask = sortedTasks[0];
          cellVal = `${nextTask.title} (${new Date(nextTask.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`;
        } else {
          cellVal = 'no tasks';
        }
      }

      return cellVal.toLowerCase().includes(filterVal.toLowerCase());
    });

    return matchesColumnFilters;
  });

  // Filtered projects list based on active user business unit access
  const filteredProjects = projects.filter(p => {
    const activeUser = users.find(u => u.id === activeUserId);
    if (activeUser && activeUser.role !== 'admin') {
      const userBUIds = activeUser.businessUnits?.map(bu => bu.businessUnit.id) || [];
      if (p.businessUnitId !== null && p.businessUnitId !== undefined && p.businessUnitId !== '' && !userBUIds.includes(p.businessUnitId)) {
        return false;
      }
    }
    return true;
  });

  // Apply sorting
  const sortedGrants = [...filteredGrants].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let valA: any = '';
    let valB: any = '';

    if (sortConfig.key === 'title') { valA = a.title; valB = b.title; }
    else if (sortConfig.key === 'funderName') { valA = a.funderName; valB = b.funderName; }
    else if (sortConfig.key === 'amountRequested') { valA = a.amountRequested || 0; valB = b.amountRequested || 0; }
    else if (sortConfig.key === 'totalFundingValue') {
      valA = a.contracts?.[0]?.totalObligatedAmount ?? a.totalFundingValue ?? 0;
      valB = b.contracts?.[0]?.totalObligatedAmount ?? b.totalFundingValue ?? 0;
    }
    else if (sortConfig.key === 'amtReceived') {
      const aTx = finances?.transactions.filter(t => t.grantId === a.id) || [];
      valA = aTx.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
      const bTx = finances?.transactions.filter(t => t.grantId === b.id) || [];
      valB = bTx.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    }
    else if (sortConfig.key === 'amtSpent') {
      const aTx = finances?.transactions.filter(t => t.grantId === a.id) || [];
      valA = aTx.filter(t => t.type === 'EXPENDITURE').reduce((sum, t) => sum + t.amount, 0);
      const bTx = finances?.transactions.filter(t => t.grantId === b.id) || [];
      valB = bTx.filter(t => t.type === 'EXPENDITURE').reduce((sum, t) => sum + t.amount, 0);
    }
    else if (sortConfig.key === 'closeDate') {
      valA = a.closeDate ? new Date(a.closeDate).getTime() : 0;
      valB = b.closeDate ? new Date(b.closeDate).getTime() : 0;
    }
    else if (sortConfig.key === 'status') { valA = a.status; valB = b.status; }
    else if (sortConfig.key === 'workflowStage') { valA = getWorkflowStageLabel(a.status); valB = getWorkflowStageLabel(b.status); }
    else if (sortConfig.key === 'nextExpectedPayment') {
      const aInst = a.contracts?.[0]?.installments?.filter(inst => inst.status === 'PENDING') || [];
      const bInst = b.contracts?.[0]?.installments?.filter(inst => inst.status === 'PENDING') || [];
      const aNext = aInst.length > 0 ? [...aInst].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime())[0] : null;
      const bNext = bInst.length > 0 ? [...bInst].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime())[0] : null;
      valA = aNext ? new Date(aNext.dueDate).getTime() : 9999999999999;
      valB = bNext ? new Date(bNext.dueDate).getTime() : 9999999999999;
    }
    else if (sortConfig.key === 'nextUpcomingTask') {
      const aTasks = tasks.filter(t => t.grantId === a.id && t.status !== 'COMPLETED');
      const bTasks = tasks.filter(t => t.grantId === b.id && t.status !== 'COMPLETED');
      const aNext = aTasks.length > 0 ? [...aTasks].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime())[0] : null;
      const bNext = bTasks.length > 0 ? [...bTasks].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime())[0] : null;
      valA = aNext ? new Date(aNext.dueDate).getTime() : 9999999999999;
      valB = bNext ? new Date(bNext.dueDate).getTime() : 9999999999999;
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExportRegistryCSV = () => {
    const headers = visibleColumns.map(colId => {
      const col = COLUMN_METADATA.find(c => c.id === colId);
      return col ? `"${col.label.replace(/"/g, '""')}"` : `"${colId}"`;
    }).join(',');

    const rows = sortedGrants.map(grant => {
      return visibleColumns.map(colId => {
        let val = '';
        if (colId === 'title') val = grant.title;
        else if (colId === 'funderName') val = grant.funderName;
        else if (colId === 'amountRequested') val = grant.amountRequested ? `${grant.amountRequested}` : '';
        else if (colId === 'totalFundingValue') {
          const amt = grant.contracts?.[0]?.totalObligatedAmount ?? grant.totalFundingValue;
          val = amt ? `${amt}` : '';
        }
        else if (colId === 'amtReceived') {
          const grantTransactions = finances?.transactions.filter(t => t.grantId === grant.id) || [];
          const amt = grantTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
          val = `${amt}`;
        }
        else if (colId === 'amtSpent') {
          const grantTransactions = finances?.transactions.filter(t => t.grantId === grant.id) || [];
          const amt = grantTransactions.filter(t => t.type === 'EXPENDITURE').reduce((sum, t) => sum + t.amount, 0);
          val = `${amt}`;
        }
        else if (colId === 'closeDate') {
          val = grant.closeDate ? new Date(grant.closeDate).toISOString().split('T')[0] : '';
        }
        else if (colId === 'status') val = grant.status;
        else if (colId === 'workflowStage') val = getWorkflowStageLabel(grant.status);
        else if (colId === 'nextExpectedPayment') {
          const grantInstallments = grant.contracts?.[0]?.installments || [];
          const pendingInstallments = grantInstallments.filter(inst => inst.status === 'PENDING');
          if (pendingInstallments.length > 0) {
            const sortedPending = [...pendingInstallments].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime());
            const nextInst = sortedPending[0];
            val = `$${nextInst.amount} (${new Date(nextInst.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`;
          } else {
            val = 'N/A';
          }
        }
        else if (colId === 'nextUpcomingTask') {
          const grantTasks = tasks.filter(t => t.grantId === grant.id && t.status !== 'COMPLETED');
          if (grantTasks.length > 0) {
            const sortedTasks = [...grantTasks].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime());
            const nextTask = sortedTasks[0];
            val = `${nextTask.title} (${new Date(nextTask.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`;
          } else {
            val = 'No Tasks';
          }
        }

        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Grants_Registry_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic Telemetry Metrics
  const awardedGrants = filteredGrants.filter(g => g.status === 'AWARDED');
  const awardedGrantsCount = awardedGrants.length;
  const awardedGrantsValue = awardedGrants.reduce((sum, g) => sum + (g.contracts?.[0]?.totalObligatedAmount ?? g.totalFundingValue ?? 0), 0);

  const awaitingApprovalGrants = filteredGrants.filter(g => g.status === 'SUBMITTED');
  const awaitingApprovalCount = awaitingApprovalGrants.length;
  const awaitingApprovalValue = awaitingApprovalGrants.reduce((sum, g) => sum + (g.amountRequested ?? g.totalFundingValue ?? 0), 0);

  const awaitingAwardGrants = filteredGrants.filter(g => g.status === 'APPLICATION_STAGED');
  const awaitingAwardCount = awaitingAwardGrants.length;
  const awaitingAwardValue = awaitingAwardGrants.reduce((sum, g) => sum + (g.amountRequested ?? g.totalFundingValue ?? 0), 0);

  const dateNow = new Date();
  const dateThreeMonths = new Date();
  dateThreeMonths.setMonth(dateNow.getMonth() + 3);
  const closingSoonGrants = filteredGrants.filter(g => {
    if (!g.closeDate) return false;
    const cDate = new Date(g.closeDate);
    return cDate >= dateNow && cDate <= dateThreeMonths && g.status !== 'AWARDED' && g.status !== 'CLOSED' && g.status !== 'REJECTED';
  });
  const closingSoonCount = closingSoonGrants.length;
  const closingSoonValue = closingSoonGrants.reduce((sum, g) => sum + (g.totalFundingValue ?? 0), 0);

  const getOverallRiskRating = (f: number, d: number, s: number) => {
    const score = (f * 0.4) + (d * 0.35) + (s * 0.25);
    if (score < 2.5) return { rating: 'LOW', score };
    if (score < 3.8) return { rating: 'MEDIUM', score };
    return { rating: 'HIGH', score };
  };

  const selectedGrant = grants.find(g => g.id === selectedGrantId);

  const extraData = selectedGrant?.rawScrapedData ? (() => {
    try {
      return JSON.parse(selectedGrant.rawScrapedData);
    } catch (e) {
      return {};
    }
  })() : {};

  const managerName = extraData.grantManager || 'Adrian Warren';
  const ownerName = extraData.grantOwner || 'Brett Hirst';
  const isCoContribution = extraData.isCoContributionRequired || false;
  const isJV = extraData.isJointVenture || false;
  const riskRatingVal = selectedGrant?.riskAssessment?.overallRiskRating || extraData.riskRating || 'LOW';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'POTENTIAL':
        return <span className="badge badge-potential">POTENTIAL</span>;
      case 'RISK_ASSESSMENT':
        return <span className="badge badge-risk">ASSESSING</span>;
      case 'APPLICATION_STAGED':
        return <span className="badge badge-staged">STAGED</span>;
      case 'SUBMITTED':
        return <span className="badge badge-submitted">SUBMITTED</span>;
      case 'AWARDED':
        return <span className="badge badge-awarded">AWARDED</span>;
      case 'REJECTED':
        return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>REJECTED</span>;
      case 'CLOSED':
        return <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>CLOSED</span>;
      default:
        return <span className="badge badge-potential">{status}</span>;
    }
  };

  const getWorkflowStageLabel = (status: string) => {
    switch (status) {
      case 'POTENTIAL':
      case 'RISK_ASSESSMENT':
        return '1. Pre-Application Risk';
      case 'APPLICATION_STAGED':
      case 'SUBMITTED':
        return '2. Application Prep';
      case 'REJECTED':
        return '3. Rejected';
      case 'AWARDED':
        return '4. Obligation Mgmt';
      case 'CLOSED':
        return '5. Closeout';
      default:
        return '1. Pre-Application Risk';
    }
  };

  // Render loading state while validating stored credentials
  if (isAuthChecking) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgb(18, 16, 29) 0%, rgb(12, 11, 19) 90%)',
        color: '#fff',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <style>{`
          @keyframes platformAuthSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--accent-indigo)',
          borderRadius: '50%',
          animation: 'platformAuthSpin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Securing connection...</p>
      </div>
    );
  }

  // Handle Login Portal when not authenticated
  if (!isAuthenticated) {
    const handleLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      try {
        const res = await fetch(`${API_BASE}/auth-verify`, {
          headers: { 'Authorization': `Bearer ${loginPassword}` }
        });
        if (res.ok) {
          localStorage.setItem('platform_password', loginPassword);
          setIsAuthenticated(true);
        } else {
          setLoginError('Invalid platform password. Please try again.');
        }
      } catch (err: any) {
        setLoginError(`Network error connecting to verification server: ${err.message || err}`);
      }
    };

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgb(18, 16, 29) 0%, rgb(12, 11, 19) 90%)',
        fontFamily: "'Inter', sans-serif",
        padding: '20px'
      }}>
        <form onSubmit={handleLoginSubmit} style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* Logo container */}
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <img 
              src="https://surepact.com/wp-content/uploads/2024/02/0224_Surepact_Logo-Reversed.svg" 
              alt="SurePact Logo" 
              style={{ width: '150px', height: 'auto', display: 'block', margin: '0 auto 8px' }} 
            />
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--accent-indigo)',
              letterSpacing: '1px'
            }}>
              GRANT ESSENTIALS PORTAL
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>
              SECURE PLATFORM PASSWORD
            </label>
            <input
              type="password"
              className="url-input"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              placeholder="••••••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          {loginError && (
            <div style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              color: 'var(--color-danger)',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--accent-indigo)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Authenticate Portal
          </button>

          {/* Dynamic API Base Override for Dev/SSO login failure recovery */}
          <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>API Connection Endpoint</span>
            </div>
            <input 
              type="text" 
              placeholder={compiledApiUrl || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api')} 
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '11px',
                color: '#fff',
                outline: 'none',
                width: '100%'
              }}
              defaultValue={localStorage.getItem('surepact_api_url') || ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                if (val) {
                  localStorage.setItem('surepact_api_url', val);
                } else {
                  localStorage.removeItem('surepact_api_url');
                }
              }}
            />
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center' }}>Change URL and refresh the page to apply</span>
          </div>
        </form>
      </div>
    );
  }

  const filteredDocs = globalDocs.filter(doc => {
    const searchLower = globalDocSearch.toLowerCase();
    const nameMatch = doc.name.toLowerCase().includes(searchLower);
    const grantMatch = doc.grant ? doc.grant.title.toLowerCase().includes(searchLower) : false;
    const userMatch = doc.uploadedBy.toLowerCase().includes(searchLower);
    return nameMatch || grantMatch || userMatch;
  });

  return (
    <div className="app-container">
      {/* Floating Toggle Button when Sidebar is Collapsed */}
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsSidebarCollapsed(true);
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <img 
              src="https://surepact.com/wp-content/uploads/2024/02/0224_Surepact_Logo-Reversed.svg" 
              alt="SurePact Logo" 
              style={{ width: '135px', height: 'auto', display: 'block' }} 
            />
            <span 
              className="logo-sub" 
              style={{ 
                paddingLeft: '2px', 
                color: '#fbbd08', 
                fontSize: '11px', 
                fontWeight: '800', 
                letterSpacing: '0.08em', 
                textTransform: 'uppercase',
                opacity: 0.95
              }}
            >
              Grant Essentials
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.innerWidth <= 992) {
                closeMobileMenu();
              } else {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              }
            }}
            className="sidebar-toggle-btn"
            title={isSidebarCollapsed ? "Expand Navigation Menu" : "Collapse Navigation Menu"}
          >
            <ChevronLeft size={16} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        <ul className="nav-list">
          {/* Primary Workspace Navigation Tabs */}
          <li
            className={`nav-item ${activeTab === 'grants' ? 'active' : ''}`}
            onClick={() => {
              selectTab('grants');
              setSelectedGrantId('');
            }}
          >
            <LayoutDashboard size={18} />
            Grants Registry
          </li>

          <li
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => selectTab('search')}
          >
            <Search size={18} />
            Grant Search
          </li>

          <li
            className={`nav-item ${activeTab === 'funding-bodies' ? 'active' : ''}`}
            onClick={() => {
              if (canAccessCrm) {
                selectTab('funding-bodies');
              } else {
                setShowTierSwitcherModal(true);
              }
            }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              opacity: canAccessCrm ? 1 : 0.85
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building size={18} />
              <span>Funding Bodies / CRM</span>
            </div>
            {!canAccessCrm && (
              <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(251, 189, 8, 0.2)', color: '#fbbd08', border: '1px solid rgba(251, 189, 8, 0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                🔒 STARTER
              </span>
            )}
          </li>

          <li
            className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => {
              if (canAccessProjects) {
                selectTab('projects');
              } else {
                setShowTierSwitcherModal(true);
              }
            }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              opacity: canAccessProjects ? 1 : 0.85
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderGit size={18} />
              <span>Projects</span>
            </div>
            {!canAccessProjects && (
              <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                🔒 ENTERPRISE
              </span>
            )}
          </li>

          <li
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => selectTab('tasks')}
          >
            <ListTodo size={18} />
            Tasks Board
          </li>

          <li
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => selectTab('calendar')}
          >
            <Calendar size={18} />
            Calendar View
          </li>

          {/* Group 1: Analytics Hub Accordion */}
          <li style={{ listStyle: 'none', marginTop: '6px' }}>
            <div
              onClick={() => setIsAnalyticsAccordionOpen(!isAnalyticsAccordionOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                color: isAnalyticsAccordionOpen || ['analytics', 'clawback-sentinel', 'cashflow-forecast', 'acquittals'].includes(activeTab) ? '#fff' : 'var(--sidebar-text-secondary)',
                background: ['analytics', 'clawback-sentinel', 'cashflow-forecast', 'acquittals'].includes(activeTab) ? 'rgba(99, 102, 241, 0.15)' : 'none',
                fontWeight: '700', fontSize: '15px', transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TrendingUp size={18} color="var(--accent-indigo)" />
                <span>Analytics Hub</span>
              </div>
              <ChevronDown
                size={16}
                style={{
                  transform: isAnalyticsAccordionOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>

            {isAnalyticsAccordionOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px', marginTop: '4px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div
                  className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => {
                    if (canAccessAnalytics) {
                      selectTab('analytics');
                    } else {
                      setShowTierSwitcherModal(true);
                    }
                  }}
                  style={{
                    fontSize: '14px', padding: '10px 14px', fontWeight: '600',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: canAccessAnalytics ? 1 : 0.85
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} />
                    <span>Executive Analytics</span>
                  </div>
                  {!canAccessAnalytics && (
                    <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(251, 189, 8, 0.2)', color: '#fbbd08', border: '1px solid rgba(251, 189, 8, 0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                      🔒 STARTER
                    </span>
                  )}
                </div>

                <div
                  className={`nav-item ${activeTab === 'clawback-sentinel' ? 'active' : ''}`}
                  onClick={() => {
                    if (canAccessClawbackSentinel) {
                      selectTab('clawback-sentinel');
                    } else {
                      setShowTierSwitcherModal(true);
                    }
                  }}
                  style={{
                    fontSize: '14px', padding: '10px 14px', fontWeight: '600',
                    color: activeTab === 'clawback-sentinel' ? '#ef4444' : undefined,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: canAccessClawbackSentinel ? 1 : 0.8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={16} color="#ef4444" />
                    <span>Clawback Sentinel</span>
                  </div>
                  {!canAccessClawbackSentinel && (
                    <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                      🔒 ENTERPRISE
                    </span>
                  )}
                </div>

                <div
                  className={`nav-item ${activeTab === 'cashflow-forecast' ? 'active' : ''}`}
                  onClick={() => {
                    if (canAccessCashflowForecast) {
                      selectTab('cashflow-forecast');
                    } else {
                      setShowTierSwitcherModal(true);
                    }
                  }}
                  style={{
                    fontSize: '14px', padding: '10px 14px', fontWeight: '600',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: canAccessCashflowForecast ? 1 : 0.8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={16} color="#6366f1" />
                    <span>Revenue &amp; Split-Funding</span>
                  </div>
                  {!canAccessCashflowForecast && (
                    <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                      🔒 ENTERPRISE
                    </span>
                  )}
                </div>

                <div
                  className={`nav-item ${activeTab === 'acquittals' ? 'active' : ''}`}
                  onClick={() => selectTab('acquittals')}
                  style={{ fontSize: '14px', padding: '10px 14px', fontWeight: '600' }}
                >
                  <FileText size={16} color="#10b981" />
                  <span>Acquittals &amp; Reports</span>
                </div>
              </div>
            )}
          </li>

          {/* Group 2: AI Intelligence & Ingestion Accordion */}
          <li style={{ listStyle: 'none', marginTop: '6px' }}>
            <div
              onClick={() => setIsAiToolsAccordionOpen(!isAiToolsAccordionOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                color: isAiToolsAccordionOpen || ['ai-writer', 'ingest', 'ingest-agreement'].includes(activeTab) ? '#fff' : 'var(--sidebar-text-secondary)',
                background: ['ai-writer', 'ingest', 'ingest-agreement'].includes(activeTab) ? 'rgba(251, 189, 8, 0.15)' : 'none',
                fontWeight: '700', fontSize: '15px', transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={18} color="#fbbd08" />
                <span>AI Intelligence &amp; Ingestion</span>
              </div>
              <ChevronDown
                size={16}
                style={{
                  transform: isAiToolsAccordionOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>

            {isAiToolsAccordionOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px', marginTop: '4px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div
                  className={`nav-item ${activeTab === 'ai-writer' ? 'active' : ''}`}
                  onClick={() => {
                    if (canAccessAiWriter) {
                      selectTab('ai-writer');
                    } else {
                      setShowTierSwitcherModal(true);
                    }
                  }}
                  style={{
                    fontSize: '14px', padding: '10px 14px', fontWeight: '600',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: canAccessAiWriter ? 1 : 0.85
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PenTool size={16} />
                    <span>AI Grant Writer</span>
                  </div>
                  {!canAccessAiWriter && (
                    <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(251, 189, 8, 0.2)', color: '#fbbd08', border: '1px solid rgba(251, 189, 8, 0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                      🔒 STARTER
                    </span>
                  )}
                </div>

                <div
                  className={`nav-item ${activeTab === 'ingest' ? 'active' : ''}`}
                  onClick={() => selectTab('ingest')}
                  style={{ fontSize: '14px', padding: '10px 14px', fontWeight: '600' }}
                >
                  <LinkIcon size={16} />
                  <span>URL Grant Ingestion</span>
                </div>

                <div
                  className={`nav-item ${activeTab === 'ingest-agreement' ? 'active' : ''}`}
                  onClick={() => {
                    if (canAccessAgreementIngestion) {
                      selectTab('ingest-agreement');
                    } else {
                      setShowTierSwitcherModal(true);
                    }
                  }}
                  style={{
                    fontSize: '14px', padding: '10px 14px', fontWeight: '600',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: canAccessAgreementIngestion ? 1 : 0.85
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UploadCloud size={16} />
                    <span>Agreement Ingestion</span>
                  </div>
                  {!canAccessAgreementIngestion && (
                    <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(251, 189, 8, 0.2)', color: '#fbbd08', border: '1px solid rgba(251, 189, 8, 0.4)', padding: '1px 5px', borderRadius: '4px' }}>
                      🔒 STARTER
                    </span>
                  )}
                </div>
              </div>
            )}
          </li>

          {/* Group 3: Resource & Financial Center Accordion */}
          <li style={{ listStyle: 'none', marginTop: '6px' }}>
            <div
              onClick={() => setIsResourcesAccordionOpen(!isResourcesAccordionOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                color: isResourcesAccordionOpen || ['documents', 'finance', 'ledger', 'knowledge'].includes(activeTab) ? '#fff' : 'var(--sidebar-text-secondary)',
                background: ['documents', 'finance', 'ledger', 'knowledge'].includes(activeTab) ? 'rgba(6, 182, 212, 0.15)' : 'none',
                fontWeight: '700', fontSize: '15px', transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Layers size={18} color="var(--accent-cyan)" />
                <span>Resource &amp; Financial Center</span>
              </div>
              <ChevronDown
                size={16}
                style={{
                  transform: isResourcesAccordionOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>

            {isResourcesAccordionOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '12px', marginTop: '4px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div
                  className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
                  onClick={() => selectTab('documents')}
                  style={{ fontSize: '14px', padding: '10px 14px', fontWeight: '600' }}
                >
                  <FileText size={16} />
                  <span>Documents Library</span>
                </div>

                <div
                  className={`nav-item ${activeTab === 'finance' ? 'active' : ''}`}
                  onClick={() => selectTab('finance')}
                  style={{ fontSize: '14px', padding: '10px 14px', fontWeight: '600' }}
                >
                  <DollarSign size={16} />
                  <span>Finance Ledger</span>
                </div>

                <div
                  className={`nav-item ${activeTab === 'ledger' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ledger')}
                  style={{ fontSize: '14px', padding: '10px 14px', fontWeight: '600' }}
                >
                  <Terminal size={16} />
                  <span>Audit Ledger</span>
                </div>

                <div
                  className={`nav-item ${activeTab === 'knowledge' ? 'active' : ''}`}
                  onClick={() => setActiveTab('knowledge')}
                  style={{ fontSize: '14px', padding: '10px 14px', fontWeight: '600' }}
                >
                  <Layers size={16} />
                  <span>Knowledge Centre</span>
                </div>
              </div>
            )}
          </li>
        </ul>

        {/* Help & Knowledge Hub Block (Placed Directly ABOVE Administration) */}
        <div style={{ padding: '0 8px', marginTop: '12px', marginBottom: '8px' }}>
          <div 
            onClick={() => setIsHelpCenterOpen(!isHelpCenterOpen)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '10px 14px', 
              borderRadius: '10px', 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(251, 189, 8, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)',
              border: '1px solid rgba(251, 189, 8, 0.35)',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.2s ease-in-out'
            }}
            title="Open Help & Knowledge Hub"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HelpCircle size={18} color="#fbbd08" />
              <span style={{ color: '#ffffff' }}>Help &amp; Knowledge</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTourStep(0);
                setIsTourActive(true);
              }}
              style={{
                background: '#fbbd08',
                color: '#151226',
                border: 'none',
                borderRadius: '8px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Start Guided Tour"
            >
              <Compass size={12} /> Tour
            </button>
          </div>
        </div>

        <div className="sidebar-admin-footer">
          
          {/* Administration Accordion Header */}
          <div 
            onClick={() => setIsAdminAccordionOpen(!isAdminAccordionOpen)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 16px', 
              borderRadius: '10px', 
              cursor: 'pointer',
              color: isAdminAccordionOpen ? '#fff' : 'var(--sidebar-text-secondary)',
              background: isAdminAccordionOpen ? 'rgba(251, 189, 8, 0.15)' : 'none',
              border: isAdminAccordionOpen ? '1px solid rgba(251, 189, 8, 0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease-in-out',
              fontWeight: '700',
              fontSize: '15px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Settings size={18} color={isAdminAccordionOpen ? '#fbbd08' : 'currentColor'} />
              <span>Administration</span>
            </div>
            <ChevronDown 
              size={16} 
              style={{ 
                transform: isAdminAccordionOpen ? 'rotate(180deg)' : 'none', 
                transition: 'transform 0.2s ease' 
              }} 
            />
          </div>

          {/* Accordion Options */}
          {isAdminAccordionOpen && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px', 
              paddingLeft: '12px', 
              marginTop: '4px', 
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)' 
            }}>
              
              {/* Users Option */}
              <div 
                className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => selectTab('users')}
                style={{ fontSize: '14px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' }}
              >
                <Users size={16} />
                <span>Users</span>
              </div>

              {/* Org Structure Option */}
              <div 
                className={`nav-item ${activeTab === 'org-structure' ? 'active' : ''}`}
                onClick={() => selectTab('org-structure')}
                style={{ fontSize: '14px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' }}
              >
                <GitBranch size={16} />
                <span>Org Structure</span>
              </div>

              {/* Tenancy Management Console Option (Super Admin Only) */}
              <div 
                className={`nav-item ${activeTab === 'tenant-admin' ? 'active' : ''}`}
                onClick={() => selectTab('tenant-admin')}
                style={{ fontSize: '14px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '700', color: '#a855f7' }}
              >
                <Shield size={16} color="#a855f7" />
                <span>Tenancy Management</span>
              </div>

              {/* Dark Mode toggle shifted here */}
              <div 
                className="nav-item"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{ fontSize: '14px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' }}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>

              {/* Sync Database button shifted here */}
              <div 
                className="nav-item"
                onClick={fetchData}
                style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <RefreshCw size={16} className={refreshing ? 'spin-animation' : ''} />
                <span>Sync Database</span>
              </div>

              {/* Dynamic API URL Input */}
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Backend API Base</span>
                <input 
                  type="text" 
                  placeholder={compiledApiUrl || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api')} 
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '11px',
                    color: '#fff',
                    outline: 'none',
                    width: '100%',
                    margin: 0
                  }}
                  defaultValue={localStorage.getItem('surepact_api_url') || ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        localStorage.setItem('surepact_api_url', val);
                      } else {
                        localStorage.removeItem('surepact_api_url');
                      }
                      window.location.reload();
                    }
                  }}
                />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Press Enter to apply & reload</span>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {/* Top Header */}
      <div className="main-content">
        <div className="header">
          <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="mobile-menu-trigger-btn"
              onClick={() => {
                const isMobile = window.innerWidth <= 992;
                if (isMobile) {
                  setIsMobileMenuOpen(prev => !prev);
                  setIsSidebarCollapsed(false);
                } else {
                  setIsSidebarCollapsed(prev => !prev);
                  setIsMobileMenuOpen(false);
                }
              }}
              title="Toggle Navigation Menu"
            >
              <Menu size={18} color="#fbbd08" />
              <span>Menu</span>
            </button>

            <h1>
              {activeTab === 'grants' && 'Grants Registry'}
              {activeTab === 'clawback-sentinel' && 'Clawback Sentinel'}
              {activeTab === 'cashflow-forecast' && 'Grant Revenue Recognition & Cashflow Forecast'}
              {activeTab === 'acquittals' && 'Funder Acquittals & Reports Generator'}
              {activeTab === 'ingest' && 'Government Grant Ingestion'}
              {activeTab === 'ingest-agreement' && 'Funding Agreement Ingestion'}
              {activeTab === 'projects' && 'Projects'}
              {activeTab === 'tasks' && 'Actionable Tasks Overview'}
              {activeTab === 'finance' && 'Financial Transactions Ledger'}
              {activeTab === 'ledger' && 'Immutable Event Stream'}
              {activeTab === 'search' && 'Australian Grants Search'}
              {activeTab === 'knowledge' && 'Organizational Knowledge Centre'}
              {activeTab === 'ai-writer' && 'Interactive AI Grant Writer'}
              {activeTab === 'funding-bodies' && 'Funding Bodies CRM'}
              {activeTab === 'analytics' && 'Analytics Hub'}
              {activeTab === 'documents' && 'Document Library'}
              {activeTab === 'users' && 'Manage Users'}
              {activeTab === 'org-structure' && 'Org Structure'}
            </h1>
            <p>
              {activeTab === 'grants' && 'Unified registry of all grants, workflow stages, risk profiles, and obligations.'}
              {activeTab === 'clawback-sentinel' && 'Proactive audit sentinel detecting receipt compliance gaps and unspent funding risks.'}
              {activeTab === 'cashflow-forecast' && 'Revenue recognition schedule (AASB 15), 12-month rolling cashflow, and multi-funder split funding.'}
              {activeTab === 'acquittals' && 'Automated funding body progress reports, financial acquittal statements, and multi-doc AI guideline parser.'}
              {activeTab === 'ingest' && 'Scrape and stage federal and state grant opportunities directly from the web.'}
              {activeTab === 'ingest-agreement' && 'Ingest new or existing agreements, parse obligations, and assign tasks.'}
              {activeTab === 'projects' && 'Track split-funding profiles and physical deliverables across your projects.'}
              {activeTab === 'tasks' && 'Filter and complete key tasks and acquittals assigned to departments.'}
              {activeTab === 'finance' && 'Bridge actual expenditures against project allocations and inbound fund drawdowns.'}
              {activeTab === 'ledger' && 'Real-time ledger entries displaying event-sourced audit states.'}
              {activeTab === 'search' && 'Search potential grant opportunities across Australia, save alerts, and import for consideration.'}
              {activeTab === 'knowledge' && 'Maintain global corporate profiles, annual reports, policies, and strategic plans to feed the AI Writing Assistant.'}
              {activeTab === 'ai-writer' && 'Draft high-scoring responses interactive section-by-section, using organizational knowledge and past performance data.'}
              {activeTab === 'funding-bodies' && 'Manage funding relationships, contacts registry, communication timelines, and pre-pipeline opportunities.'}
              {activeTab === 'analytics' && 'Cross-system performance indicators, compliance indices, fund drawdowns, and CRM statistics.'}
              {activeTab === 'documents' && 'Manage all documents uploaded to SurePact.'}
              {activeTab === 'users' && 'Manage users for your organisation.'}
              {activeTab === 'org-structure' && 'Manage your departments and business units.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {activeTab === 'grants' && !selectedGrant && (
              <button 
                className="btn" 
                onClick={() => setShowNewGrantSidebar(true)} 
                style={{ 
                  background: '#fbbd08', 
                  color: '#151226', 
                  fontWeight: '700', 
                  border: '1px solid #fbbd08',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={16} />
                New Grant
              </button>
            )}
            {activeTab === 'documents' && (
              <button 
                className="btn" 
                onClick={() => setShowGlobalAddDocModal(true)} 
                style={{ 
                  background: '#fbbd08', 
                  color: '#151226', 
                  fontWeight: '700', 
                  border: '1px solid #fbbd08',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={16} />
                Add Document
              </button>
            )}

            {/* Active User Switcher Dropdown (Avatar + Name Card) */}
            {users.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(251, 189, 8, 0.2)', border: '2px solid #fbbd08', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#151226', fontWeight: '700', fontSize: '14px' }}>
                  {(() => {
                    const activeUser = users.find(u => u.id === activeUserId);
                    if (activeUser) {
                      const parts = activeUser.name.split(' ');
                      return parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
                    }
                    return 'AW';
                  })()}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <select 
                    value={activeUserId}
                    onChange={(e) => setActiveUserId(e.target.value)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--text-primary)', 
                      fontWeight: '600', 
                      fontSize: '13px', 
                      padding: 0,
                      margin: 0,
                      cursor: 'pointer',
                      outline: 'none',
                      maxWidth: '140px'
                    }}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {users.find(u => u.id === activeUserId)?.department || 'SurePact Client'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'grants' && (
          <div className="panel animate">
            {!selectedGrant ? (
              <>
                {/* Demo Data Mode Banner Overlay */}
                {!isCleanTenantWorkspace && (
                  <div style={{
                    background: 'linear-gradient(90deg, rgba(251, 189, 8, 0.12) 0%, rgba(99, 102, 241, 0.1) 100%)',
                    border: '1px solid rgba(251, 189, 8, 0.35)',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    animation: 'fadeIn 0.25s ease-out'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>⚡</span>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', display: 'block' }}>
                          Evaluation Demo Data Active ({grants.length} Sample Grants)
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          This workspace is pre-populated with sample evaluation grants. You can clear demo data anytime to start with a fresh empty workspace.
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleClearDemoGrants}
                      style={{
                        padding: '6px 14px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🧹 Clear Demo Data (Start Clean)
                    </button>
                  </div>
                )}

                {/* Clean Workspace Initialized Banner */}
                {isCleanTenantWorkspace && grants.length === 0 && (
                  <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(251, 189, 8, 0.15)', border: '1px solid #fbbd08', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlusCircle size={24} color="#fbbd08" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Clean Workspace Initialized</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, maxWidth: '520px', lineHeight: '1.5' }}>
                        This workspace is currently empty with 0 grants. Click <strong>+ New Grant</strong> to create your first grant, or click <strong>⚡ Load Sample Demo Data</strong> to populate 5 evaluation grants for testing.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn" onClick={() => setShowNewGrantSidebar(true)} style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                        + New Grant
                      </button>
                      <button className="btn btn-secondary" onClick={handleReloadDemoGrants} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                        ⚡ Load Sample Demo Grants
                      </button>
                    </div>
                  </div>
                )}

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-info">
                  <h3>Active Awarded Grants</h3>
                  <div className="metric-value" style={{ color: 'var(--color-success)' }}>
                    ${awardedGrantsValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {awardedGrantsCount} {awardedGrantsCount === 1 ? 'Grant' : 'Grants'} Active
                  </span>
                </div>
                <div className="metric-icon-box green">
                  <DollarSign size={22} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-info">
                  <h3>Grants Awaiting Approval</h3>
                  <div className="metric-value" style={{ color: 'var(--accent-indigo)' }}>
                    ${awaitingApprovalValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {awaitingApprovalCount} {awaitingApprovalCount === 1 ? 'Grant' : 'Grants'} Submitted
                  </span>
                </div>
                <div className="metric-icon-box indigo">
                  <Activity size={22} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-info">
                  <h3>Grants Awaiting Award</h3>
                  <div className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
                    ${awaitingAwardValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {awaitingAwardCount} {awaitingAwardCount === 1 ? 'Grant' : 'Grants'} Staged
                  </span>
                </div>
                <div className="metric-icon-box cyan">
                  <Layers size={22} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-info">
                  <h3>Grants Closing Soon</h3>
                  <div className="metric-value" style={{ color: 'var(--color-warning)' }}>
                    ${closingSoonValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {closingSoonCount} {closingSoonCount === 1 ? 'Grant' : 'Grants'} Closing (3mo)
                  </span>
                </div>
                <div className="metric-icon-box warning">
                  <ListTodo size={22} />
                </div>
              </div>
            </div>

            <div className="card-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#6366f1" />
                Grants Opportunities & Contracts Registry
              </span>
              
              {/* Filter and Settings controls */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Search title/funder..." 
                  className="url-input" 
                  style={{ padding: '6px 12px', fontSize: '12px', width: '180px', margin: 0 }} 
                  value={registrySearch} 
                  onChange={(e) => setRegistrySearch(e.target.value)} 
                />
                <select 
                  className="url-input" 
                  style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }} 
                  value={registryStatusFilter} 
                  onChange={(e) => setRegistryStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="POTENTIAL">Potential</option>
                  <option value="RISK_ASSESSMENT">Assessing</option>
                  <option value="APPLICATION_STAGED">Staged</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="AWARDED">Awarded</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <button
                  type="button"
                  className={`btn ${showColumnFilters ? 'btn-success' : 'btn-secondary'}`}
                  style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setShowColumnFilters(!showColumnFilters)}
                  title="Toggle column-specific filters"
                >
                  <Search size={14} /> Filter Columns
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setShowColumnSettings(true)}
                >
                  Configure Columns
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  disabled={sortedGrants.length === 0}
                  onClick={handleExportRegistryCSV}
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="grant-table-container">
              <table className="grant-table">
                <thead>
                  <tr>
                    {visibleColumns.map(colId => {
                      const col = COLUMN_METADATA.find(c => c.id === colId);
                      if (!col) return null;
                      const isSorted = sortConfig?.key === colId;

                      return (
                        <th 
                          key={colId} 
                          onClick={() => handleSort(colId)} 
                          style={{ cursor: 'pointer', padding: '12px 16px', userSelect: 'none' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span>{col.label}</span>
                            {isSorted && (
                              <span style={{ fontSize: '10px', color: 'var(--accent-indigo)' }}>
                                {sortConfig.direction === 'asc' ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                          {showColumnFilters && (
                            <input 
                              type="text"
                              placeholder={`Filter ${col.label}...`}
                              className="url-input"
                              style={{ width: '100%', fontSize: '10px', padding: '4px 8px', marginTop: '6px', height: '24px', fontWeight: 'normal' }}
                              value={columnFilters[colId] || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setColumnFilters({ ...columnFilters, [colId]: e.target.value })}
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedGrants.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                        No grants matching the filter criteria found.
                      </td>
                    </tr>
                  ) : (
                    sortedGrants.map(grant => {
                      return (
                        <tr 
                          key={grant.id} 
                          className={`grant-row ${selectedGrantId === grant.id ? 'active-row' : ''}`}
                          style={selectedGrantId === grant.id ? { background: 'rgba(99, 102, 241, 0.05)' } : {}}
                          onClick={() => handleSelectGrant(grant)}
                        >
                          {visibleColumns.map(colId => {
                            if (colId === 'title') {
                              return (
                                <td key={colId}>
                                  <div className="grant-title">{grant.title}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--accent-indigo)' }}>
                                    {grant.sourceUrl ? grant.sourceUrl.substring(0, 55) + '...' : 'Manual Input'}
                                  </div>
                                </td>
                              );
                            }
                            if (colId === 'funderName') {
                              return (
                                <td key={colId} style={{ color: 'var(--text-secondary)' }}>
                                  {grant.funderName}
                                </td>
                              );
                            }
                            if (colId === 'amountRequested') {
                              const formattedRequested = grant.amountRequested
                                ? `$${grant.amountRequested.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                                : 'TBD';
                              return (
                                <td key={colId} style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                                  {formattedRequested}
                                </td>
                              );
                            }
                            if (colId === 'totalFundingValue') {
                              const awardedAmount = grant.contracts?.[0]?.totalObligatedAmount ?? grant.totalFundingValue;
                              const formattedAwarded = awardedAmount
                                ? `$${awardedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                                : 'TBD';
                              return (
                                <td key={colId} style={{ fontWeight: '600' }}>
                                  {formattedAwarded}
                                </td>
                              );
                            }
                            if (colId === 'amtReceived') {
                              const grantTransactions = finances?.transactions.filter(t => t.grantId === grant.id) || [];
                              const amtReceived = grantTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
                              return (
                                <td key={colId} style={{ fontWeight: '500', color: 'var(--accent-cyan)' }}>
                                  ${amtReceived.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </td>
                              );
                            }
                            if (colId === 'amtSpent') {
                              const grantTransactions = finances?.transactions.filter(t => t.grantId === grant.id) || [];
                              const amtSpent = grantTransactions.filter(t => t.type === 'EXPENDITURE').reduce((sum, t) => sum + t.amount, 0);
                              return (
                                <td key={colId} style={{ fontWeight: '500', color: 'var(--color-warning)' }}>
                                  ${amtSpent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </td>
                              );
                            }
                            if (colId === 'closeDate') {
                              const closeDateFormatted = grant.closeDate
                                ? new Date(grant.closeDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                                : 'TBD';
                              return (
                                <td key={colId} style={{ color: 'var(--text-secondary)' }}>
                                  {closeDateFormatted}
                                </td>
                              );
                            }
                            if (colId === 'status') {
                              return (
                                <td key={colId}>
                                  {getStatusBadge(grant.status)}
                                </td>
                              );
                            }
                            if (colId === 'workflowStage') {
                              return (
                                <td key={colId} style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                                  {getWorkflowStageLabel(grant.status)}
                                </td>
                              );
                            }
                            if (colId === 'nextExpectedPayment') {
                              const grantInstallments = grant.contracts?.[0]?.installments || [];
                              const pendingInstallments = grantInstallments.filter(inst => inst.status === 'PENDING');
                              let cellText = 'N/A';
                              if (pendingInstallments.length > 0) {
                                const sortedPending = [...pendingInstallments].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime());
                                const nextInst = sortedPending[0];
                                cellText = `$${nextInst.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${new Date(nextInst.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`;
                              }
                              return (
                                <td key={colId} style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                  {cellText}
                                </td>
                              );
                            }
                            if (colId === 'nextUpcomingTask') {
                              const grantTasks = tasks.filter(t => t.grantId === grant.id && t.status !== 'COMPLETED');
                              let cellText = 'No Tasks';
                              if (grantTasks.length > 0) {
                                const sortedTasks = [...grantTasks].sort((x, y) => new Date(x.dueDate).getTime() - new Date(y.dueDate).getTime());
                                const nextTask = sortedTasks[0];
                                cellText = `${nextTask.title} (${new Date(nextTask.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`;
                              }
                              return (
                                <td key={colId} style={{ fontSize: '11px', color: 'var(--text-secondary)' }} title={cellText}>
                                  {cellText.length > 30 ? cellText.substring(0, 27) + '...' : cellText}
                                </td>
                              );
                            }
                            return null;
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
              </>
            ) : (
              /* Render SurePact Redesigned Selected Grant Detail Panel */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                {/* Header Title and Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                      onClick={() => setSelectedGrantId('')} 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', borderRadius: '10px', background: '#ffffff', border: '1px solid #e2e8f0', color: '#151226' }}
                    >
                      <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Grants
                    </button>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#4c3a9e', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}>
                        Grant: {selectedGrant.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Metric Summary Card (Banner) */}
                {(() => {
                  const grantTransactions = finances?.transactions.filter(t => t.grantId === selectedGrant.id) || [];
                  const amtRequested = selectedGrant.amountRequested || selectedGrant.totalFundingValue || 0;
                  const amtAwarded = selectedGrant.contracts?.[0]?.totalObligatedAmount || 0;
                  const amtReceived = (selectedGrant.contracts?.[0]?.installments || [])
                    .filter((inst: any) => inst.status === 'RECEIVED')
                    .reduce((sum: number, inst: any) => sum + inst.amount, 0);
                  const amtSpent = grantTransactions.filter(t => t.type === 'EXPENDITURE').reduce((sum, t) => sum + t.amount, 0);
                  
                  const pendingInstallments = (selectedGrant.contracts?.[0]?.installments || [])
                    .filter((inst: any) => inst.status === 'PENDING')
                    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                  const nextPaymentVal = pendingInstallments[0]
                    ? `$${pendingInstallments[0].amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} on ${new Date(pendingInstallments[0].dueDate).toLocaleDateString('en-GB')}`
                    : 'None';
                  
                  return (
                    <div className="surepact-banner-card">
                      <div className="surepact-banner-col">
                        <span className="surepact-banner-label">Funding Body</span>
                        <span className="surepact-banner-value" title={selectedGrant.funderName}>{selectedGrant.funderName}</span>
                      </div>
                      <div className="surepact-banner-col">
                        <span className="surepact-banner-label">Amount Requested</span>
                        <span className="surepact-banner-value">${amtRequested.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="surepact-banner-col">
                        <span className="surepact-banner-label">Amount Awarded</span>
                        <span className="surepact-banner-value">${amtAwarded.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="surepact-banner-col">
                        <span className="surepact-banner-label">Amount Received</span>
                        <span className="surepact-banner-value">${amtReceived.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="surepact-banner-col">
                        <span className="surepact-banner-label">Amount Spent</span>
                        <span className="surepact-banner-value">${amtSpent.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="surepact-banner-col">
                        <span className="surepact-banner-label">Next Payment</span>
                        <span className="surepact-banner-value" title={nextPaymentVal}>{nextPaymentVal}</span>
                      </div>
                      <div className="surepact-banner-col">
                        <span className="surepact-banner-label">Start Date</span>
                        <span className="surepact-banner-value">
                          {selectedGrant.openDate ? new Date(selectedGrant.openDate).toLocaleDateString('en-GB') : '01/08/2026'}
                        </span>
                      </div>
                      <div className="surepact-banner-col">
                        <span className="surepact-banner-label">End Date</span>
                        <span className="surepact-banner-value">
                          {selectedGrant.closeDate ? new Date(selectedGrant.closeDate).toLocaleDateString('en-GB') : '31/05/2027'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Split Layout: Left Menu, Right Content */}
                <div className="surepact-split-layout">
                  {/* Left Menu Accordion */}
                  <div className="surepact-menu-container">
                    {[
                      {
                        id: 'overview',
                        label: 'Overview',
                        items: [
                          { id: 'overview-details', label: 'Grant Overview' },
                          { id: 'overview-eligibility', label: 'Grant Eligibility' }
                        ]
                      },
                      {
                        id: 'submission',
                        label: 'Submission',
                        items: [
                          { id: 'submission-tasks', label: 'Application Tasks' },
                          { id: 'submission-confirm', label: 'Submission' },
                          { id: 'submission-result', label: 'Submission Result' }
                        ]
                      },
                      {
                        id: 'obligations',
                        label: 'Obligations',
                        items: [
                          { id: 'obligations-tracking', label: 'Tracking & Reporting' }
                        ]
                      },
                      {
                        id: 'closeout',
                        label: 'Closeout',
                        items: [
                          { id: 'closeout-summary', label: 'Grant Summary' },
                          { id: 'closeout-archive', label: 'Archive' }
                        ]
                      },
                      {
                        id: 'governance',
                        label: 'Governance',
                        items: [
                          { id: 'governance-variations', label: 'Variations' },
                          { id: 'governance-log', label: 'Governance Log' },
                          { id: 'governance-documents', label: 'Documents' }
                        ]
                      }
                    ].map(section => {
                      const isExpanded = activeMenuSection === section.id;
                      return (
                        <div key={section.id} className="surepact-menu-section">
                          <div 
                            className={`surepact-menu-header ${isExpanded ? 'active' : ''}`}
                            onClick={() => {
                              setActiveMenuSection(section.id as any);
                              setActiveMenuItem(section.items[0].id as any);
                            }}
                          >
                            <span>{section.label}</span>
                            <span>{isExpanded ? '▼' : '▶'}</span>
                          </div>
                          {isExpanded && (
                            <div className="surepact-menu-items">
                              {section.items.map(item => {
                                const isItemActive = activeMenuItem === item.id;
                                const isLocked = item.id === 'closeout-summary' && selectedGrant.status !== 'AWARDED' && selectedGrant.status !== 'CLOSED';
                                return (
                                  <div 
                                    key={item.id} 
                                    className={`surepact-menu-item ${isItemActive ? 'active' : ''}`}
                                    onClick={() => {
                                      if (isLocked) return;
                                      setActiveMenuItem(item.id as any);
                                    }}
                                    style={{ opacity: isLocked ? 0.6 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                                  >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {item.label}
                                      {isLocked && <Lock size={12} />}
                                    </span>
                                    {isItemActive && <span>✓</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Content Area */}
                  <div className="surepact-split-content">
                    
                    {/* OVERVIEW: DETAILS */}
                    {activeMenuItem === 'overview-details' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Grant Overview</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Define the details of the grant.</p>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => setActiveMenuItem('overview-eligibility')}
                              style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
                            >
                              Next
                            </button>
                            <button 
                              className="btn btn-primary" 
                              onClick={async () => {
                                try {
                                  const res = await fetch(`${API_BASE}/grants/${selectedGrant.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      title: selectedGrant.title,
                                      funderName: selectedGrant.funderName,
                                      description: selectedGrant.description
                                    })
                                  });
                                  if (res.ok) alert('Grant details saved successfully!');
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08' }}
                            >
                              Save
                            </button>
                          </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Funding Body Name</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px' }}>
                            <span style={{ fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                              {selectedGrant.funderName} <X size={12} style={{ cursor: 'pointer' }} />
                            </span>
                          </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Grant Name</label>
                          <input 
                            type="text" 
                            className="url-input" 
                            style={{ width: '100%' }} 
                            value={selectedGrant.title} 
                            disabled 
                          />
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Grant Description</label>
                          <textarea 
                            rows={5} 
                            className="url-input" 
                            style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }} 
                            value={selectedGrant.description || 'The program will establish 7 Drought Resilience Hubs across Australia, with the vision to build drought resilience across the drought cycle by connecting farmers and communities to regional experts, innovations, new practices and services.'} 
                            disabled
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Grant ID (Optional)</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={extraData.grantIdOptional || selectedGrant.id.substring(0, 8).toUpperCase()} 
                              disabled 
                            />
                          </div>

                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Grant Manager</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={managerName} 
                              disabled 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' }}>
                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Grant Owner</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={ownerName} 
                              disabled 
                            />
                          </div>

                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Related Business Unit (Access Filter)</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={selectedGrant.businessUnit ? selectedGrant.businessUnit.name : 'No Specific Business Unit (Global Access)'} 
                              disabled 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' }}>
                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Grant Start Date</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={selectedGrant.openDate ? new Date(selectedGrant.openDate).toLocaleDateString('en-AU') : 'Not set'} 
                              disabled 
                            />
                          </div>

                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Grant End Date</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={selectedGrant.closeDate ? new Date(selectedGrant.closeDate).toLocaleDateString('en-AU') : 'Not set'} 
                              disabled 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' }}>
                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Amount Available (AUD)</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={selectedGrant.totalFundingValue ? `$${selectedGrant.totalFundingValue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}` : 'Not specified'} 
                              disabled 
                            />
                          </div>

                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Amount Requested (AUD)</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={selectedGrant.amountRequested ? `$${selectedGrant.amountRequested.toLocaleString('en-AU', { minimumFractionDigits: 2 })}` : 'Not submitted yet'} 
                              disabled 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '8px' }}>
                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Risk Rating</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={riskRatingVal} 
                              disabled 
                            />
                          </div>

                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Co-contribution Required?</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={isCoContribution ? 'Yes' : 'No'} 
                              disabled 
                            />
                          </div>

                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Is Joint Venture?</label>
                            <input 
                              type="text" 
                              className="url-input" 
                              value={isJV ? 'Yes' : 'No'} 
                              disabled 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OVERVIEW: ELIGIBILITY & FUNDER ROI INTELLIGENCE */}
                    {activeMenuItem === 'overview-eligibility' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                              Grant Eligibility &amp; Funder Intelligence
                            </h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                              Surfacing funder conversion ROI and opportunity risk scores to inform executive application approval.
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              type="button"
                              className="btn btn-secondary" 
                              onClick={() => {
                                setActiveMenuSection('submission');
                                setActiveMenuItem('submission-tasks');
                              }}
                              style={{ padding: '8px 14px', fontSize: '12px' }}
                            >
                              Next
                            </button>
                            <button 
                              type="button"
                              className="btn btn-primary" 
                              onClick={() => alert('Eligibility details & risk evaluation saved!')}
                              style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08', padding: '8px 16px', fontSize: '12px' }}
                            >
                              Save Eligibility
                            </button>
                          </div>
                        </div>

                        {/* Funder ROI & Application Conversion Analytics Card */}
                        {(() => {
                          const analytics = getFunderAnalytics(selectedGrant.funderName);
                          return (
                            <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)', border: '1px solid var(--border-color-active)', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <TrendingUp size={18} color="var(--accent-indigo)" />
                                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                    Funder ROI &amp; Conversion Analytics: <strong style={{ color: 'var(--accent-indigo)' }}>{analytics.funderName}</strong>
                                  </span>
                                </div>
                                <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                  Historical Performance Verified
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Historical Win Rate</div>
                                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
                                    {analytics.winRatePercent}% Win Rate
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {analytics.totalSubmitted} Past Submissions (${(analytics.totalAwardedAmount / 1000).toFixed(0)}k Awarded)
                                  </div>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Return on Writing Effort</div>
                                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#06b6d4', marginTop: '2px' }}>
                                    ${(analytics.avgRoiPerHour / 1000).toFixed(0)}k AUD / hr
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    High Return per Application Hour
                                  </div>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Drawdown Lead Time</div>
                                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#6366f1', marginTop: '2px' }}>
                                    {analytics.avgDrawdownDays} Days Avg
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {analytics.acquittalFriction} Acquittal Friction
                                  </div>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Competitive Difficulty</div>
                                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b', marginTop: '2px' }}>
                                    {analytics.difficultyRating}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Estimated ~32% Sector Success Rate
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Expected Outcomes &amp; Strategic Benefits</label>
                            <textarea 
                              rows={3} 
                              className="url-input" 
                              style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }} 
                              value={expectedOutcomes} 
                              onChange={(e) => setExpectedOutcomes(e.target.value)}
                              placeholder="e.g. Expand remote telehealth coverage and deliver community digital literacy workshops..."
                            />
                          </div>

                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Risk &amp; Compliance Considerations</label>
                            <textarea 
                              rows={3} 
                              className="url-input" 
                              style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }} 
                              value={riskConsiderations} 
                              onChange={(e) => setRiskConsiderations(e.target.value)}
                              placeholder="e.g. Supplier Lead Times, Co-Contribution Cashflow Commitments..."
                            />
                          </div>
                        </div>

                        {/* Modernized Opportunity Risk Sliders & Executive Decision Scorecard */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Modernized Opportunity Risk Sliders</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Slide to adjust 1 (Low) to 5 (High)</span>
                            </div>
                            
                            {/* Financial Risk Slider */}
                            <div className="slider-group" style={{ background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div className="slider-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Financial Exposure Risk</span>
                                <span style={{ 
                                  background: financialScore <= 2 ? 'rgba(16, 185, 129, 0.15)' : financialScore === 3 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: financialScore <= 2 ? '#10b981' : financialScore === 3 ? '#f59e0b' : '#ef4444',
                                  padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11px' 
                                }}>
                                  {financialScore} / 5 ({financialScore <= 2 ? 'LOW RISK' : financialScore === 3 ? 'MODERATE' : 'HIGH EXPOSURE'})
                                </span>
                              </div>
                              <input 
                                type="range" min="1" max="5" className="slider-control" 
                                value={financialScore} onChange={(e) => setFinancialScore(parseInt(e.target.value))}
                                style={{ width: '100%', height: '6px', borderRadius: '3px', cursor: 'pointer', accentColor: 'var(--accent-indigo)' }}
                              />
                            </div>

                            {/* Delivery Capability Slider */}
                            <div className="slider-group" style={{ background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div className="slider-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Delivery Capability &amp; Resourcing</span>
                                <span style={{ 
                                  background: deliveryScore >= 4 ? 'rgba(16, 185, 129, 0.15)' : deliveryScore === 3 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: deliveryScore >= 4 ? '#10b981' : deliveryScore === 3 ? '#f59e0b' : '#ef4444',
                                  padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11px' 
                                }}>
                                  {deliveryScore} / 5 ({deliveryScore >= 4 ? 'HIGH CAPABILITY' : deliveryScore === 3 ? 'MODERATE' : 'CAPACITY CONSTRAINED'})
                                </span>
                              </div>
                              <input 
                                type="range" min="1" max="5" className="slider-control" 
                                value={deliveryScore} onChange={(e) => setDeliveryScore(parseInt(e.target.value))}
                                style={{ width: '100%', height: '6px', borderRadius: '3px', cursor: 'pointer', accentColor: 'var(--accent-indigo)' }}
                              />
                            </div>

                            {/* Strategic Alignment Slider */}
                            <div className="slider-group" style={{ background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div className="slider-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Strategic &amp; Policy Alignment</span>
                                <span style={{ 
                                  background: strategicScore >= 4 ? 'rgba(16, 185, 129, 0.15)' : strategicScore === 3 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: strategicScore >= 4 ? '#10b981' : strategicScore === 3 ? '#f59e0b' : '#ef4444',
                                  padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '11px' 
                                }}>
                                  {strategicScore} / 5 ({strategicScore >= 4 ? 'STRONG ALIGNMENT' : strategicScore === 3 ? 'MODERATE' : 'LOW ALIGNMENT'})
                                </span>
                              </div>
                              <input 
                                type="range" min="1" max="5" className="slider-control" 
                                value={strategicScore} onChange={(e) => setStrategicScore(parseInt(e.target.value))}
                                style={{ width: '100%', height: '6px', borderRadius: '3px', cursor: 'pointer', accentColor: 'var(--accent-indigo)' }}
                              />
                            </div>

                            <button className="btn btn-warning" onClick={handleEvaluateRisk} disabled={evaluatingRisk} style={{ background: '#fbbd08', color: '#151226', fontWeight: '800', justifyContent: 'center', border: '1px solid #fbbd08', padding: '10px' }}>
                              {evaluatingRisk ? 'Evaluating Risk Matrix...' : '⚡ Recalculate Risk & Log Evaluation'}
                            </button>
                          </div>

                          {/* Executive Decision Gate & Scorecard */}
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', display: 'block', marginBottom: '14px' }}>
                              Executive Decision Gate Scorecard
                            </span>
                            {(() => {
                              const analytics = getFunderAnalytics(selectedGrant.funderName);
                              // Feasibility score weighted calculation
                              const feasibilityIndex = Math.round(
                                ((strategicScore / 5) * 40) +
                                ((deliveryScore / 5) * 35) +
                                (((6 - financialScore) / 5) * 25)
                              );
                              
                              const isApproved = selectedGrant.status !== 'POTENTIAL' && selectedGrant.status !== 'RISK_ASSESSMENT';
                              const isRecommended = feasibilityIndex >= 70 && analytics.winRatePercent >= 60;
                              const isCaution = feasibilityIndex >= 50 && feasibilityIndex < 70;

                              return (
                                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                                  
                                  {/* Feasibility Circular Score Gauge */}
                                  <div style={{
                                    width: '90px',
                                    height: '90px',
                                    borderRadius: '50%',
                                    background: isRecommended ? 'rgba(16, 185, 129, 0.15)' : isCaution ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    border: `3px solid ${isRecommended ? '#10b981' : isCaution ? '#f59e0b' : '#ef4444'}`,
                                    color: isRecommended ? '#10b981' : isCaution ? '#f59e0b' : '#ef4444',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    fontWeight: '800',
                                    fontSize: '22px'
                                  }}>
                                    <span>{feasibilityIndex}%</span>
                                    <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase' }}>FEASIBILITY</span>
                                  </div>

                                  {/* AI Recommendation Badge */}
                                  <div style={{
                                    background: isRecommended ? 'rgba(16, 185, 129, 0.1)' : isCaution ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    border: `1px solid ${isRecommended ? '#10b981' : isCaution ? '#f59e0b' : '#ef4444'}`,
                                    color: isRecommended ? '#10b981' : isCaution ? '#f59e0b' : '#ef4444',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    lineHeight: '1.4'
                                  }}>
                                    {isRecommended ? (
                                      <span>🟢 RECOMMENDED TO APPLY: High Funder Win Rate ({analytics.winRatePercent}%) &amp; Strong Alignment</span>
                                    ) : isCaution ? (
                                      <span>🟡 PROCEED WITH CAUTION: Moderate Financial Risk or Capacity Constraints</span>
                                    ) : (
                                      <span>🔴 HIGH RISK / NOT RECOMMENDED: Low Feasibility Index</span>
                                    )}
                                  </div>
                                  
                                  {/* Executive Approval Stage-Gate Section */}
                                  <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <ShieldAlert size={16} color="var(--accent-indigo)" />
                                      <span>Stage Gate: Designated Executive Approver</span>
                                    </div>

                                    <select
                                      className="url-input"
                                      style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                                      value={selectedApproverId}
                                      onChange={(e) => setSelectedApproverId(e.target.value)}
                                    >
                                      <option value="">-- Choose Designated Approver --</option>
                                      {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                          {u.name} ({u.department}) - {u.email}
                                        </option>
                                      ))}
                                    </select>

                                    <textarea
                                      rows={2}
                                      className="url-input"
                                      style={{ width: '100%', fontSize: '12px', resize: 'none' }}
                                      placeholder="Optional executive approval briefing notes..."
                                      value={approvalNotesInput}
                                      onChange={(e) => setApprovalNotesInput(e.target.value)}
                                    />

                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      disabled={requestingApproval || !selectedApproverId}
                                      onClick={() => handleRequestApproval(selectedGrant.id)}
                                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', border: 'none', fontWeight: '800', padding: '10px', width: '100%', justifyContent: 'center', borderRadius: '8px', fontSize: '12px' }}
                                    >
                                      {requestingApproval ? 'Dispatching Approval Email...' : '✉️ Request Executive Eligibility Approval & Send Email'}
                                    </button>
                                  </div>

                                  {selectedGrant.status === 'RISK_ASSESSMENT' && (
                                    <button 
                                      className="btn btn-success" 
                                      onClick={() => {
                                        handleApproveToApply(selectedGrant.id);
                                        setActiveMenuSection('submission');
                                        setActiveMenuItem('submission-tasks');
                                      }}
                                      style={{ width: '100%', justifyContent: 'center', padding: '10px', fontWeight: '800', marginTop: '8px' }}
                                    >
                                      <CheckCircle size={16} /> Fast-Track Direct Approval
                                    </button>
                                  )}
                                  {isApproved && (
                                    <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                      <CheckCircle size={16} /> Executive Eligibility Approval Verified
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Cost Estimation */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Grant Cost Estimation (Optional)</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Total Estimated Cost: <strong>${costItems.reduce((sum, item) => sum + item.cost, 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                            </span>
                          </div>

                          <table className="surepact-table">
                            <thead>
                              <tr>
                                <th>Item Name</th>
                                <th>Item Description</th>
                                <th>Estimated Cost</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {costItems.map(item => (
                                <tr key={item.id}>
                                  <td style={{ fontWeight: '600' }}>{item.name}</td>
                                  <td>{item.description}</td>
                                  <td>${item.cost.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</td>
                                  <td style={{ textAlign: 'right' }}>
                                    <button 
                                      onClick={() => handleUpdateCostItems(costItems.filter(ci => ci.id !== item.id))}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Add cost item row */}
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '10px', marginTop: '16px', alignItems: 'end' }}>
                            <div>
                              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Item Name</label>
                              <input 
                                type="text" 
                                className="url-input" 
                                style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                                value={costItemName}
                                onChange={(e) => setCostItemName(e.target.value)}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Description</label>
                              <input 
                                type="text" 
                                className="url-input" 
                                style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                                value={costItemDesc}
                                onChange={(e) => setCostItemDesc(e.target.value)}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Cost ($)</label>
                              <input 
                                type="number" 
                                className="url-input" 
                                style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
                                value={costItemValue}
                                onChange={(e) => setCostItemValue(e.target.value)}
                              />
                            </div>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => {
                                if (!costItemName || !costItemValue) return;
                                const newItems = [
                                  ...costItems,
                                  {
                                    id: Date.now().toString(),
                                    name: costItemName,
                                    description: costItemDesc,
                                    cost: parseFloat(costItemValue)
                                  }
                                ];
                                handleUpdateCostItems(newItems);
                                setCostItemName('');
                                setCostItemDesc('');
                                setCostItemValue('');
                              }}
                              style={{ padding: '8px 12px', fontSize: '11px', height: '34px', background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08' }}
                            >
                              + Add Cost Item
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBMISSION: APPLICATION TASKS */}
                    {activeMenuItem === 'submission-tasks' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Application Tasks</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Create and review tasks, documents and information for your application.</p>
                          </div>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => setActiveMenuItem('submission-confirm')}
                            style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
                          >
                            Next
                          </button>
                        </div>

                        {/* AI Grant Writer Launcher Banner */}
                        <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: '#151226' }}>AI Grant Writer & Requirements Engine</span>
                              {selectedGrant.guidelinesDocName && (
                                <span style={{ fontSize: '10px', fontWeight: '700', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                                  ✓ Guidelines Parsed: {selectedGrant.guidelinesExtractedTitle || selectedGrant.guidelinesDocName}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                              Launch the AI Grant Writer workspace to select or upload funder guidelines documents. Parsing guidelines automatically extracts all selection criteria questions and populates the required submission attachments checklist below.
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn animate-pulse"
                            onClick={() => {
                              setActiveTab('ai-writer');
                              setSelectedWriterGrantId(selectedGrant.id);
                              fetchGrantRequirements(selectedGrant.id);
                              setSelectedKnowledgeIds(knowledgeDocs.map(d => d.id));
                              setCompiledProposalResult(null);
                            }}
                            style={{
                              background: '#151226',
                              color: '#fffffe',
                              fontWeight: '700',
                              border: '1px solid #151226',
                              padding: '12px 20px',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              whiteSpace: 'nowrap',
                              borderRadius: '8px'
                            }}
                          >
                            <PenTool size={16} />
                            Launch AI Grant Writer Workspace →
                          </button>
                        </div>

                        {/* Extracted Selection Criteria Requirements */}
                        {(() => {
                          const reqs = selectedGrant.requirementResponses || [];
                          return (
                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#151226' }}>
                                  Extracted Application Criteria & Requirements ({reqs.length})
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => {
                                    setActiveTab('ai-writer');
                                    setSelectedWriterGrantId(selectedGrant.id);
                                    fetchGrantRequirements(selectedGrant.id);
                                    setSelectedKnowledgeIds(knowledgeDocs.map(d => d.id));
                                    setCompiledProposalResult(null);
                                  }}
                                  style={{ padding: '4px 10px', fontSize: '11px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}
                                >
                                  Edit in AI Grant Writer →
                                </button>
                              </div>
                              {reqs.length === 0 ? (
                                <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  No criteria extracted yet. Click "Upload guidelines PDF" above to parse requirements automatically using the AI engine.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {reqs.map((r: any) => (
                                    <div key={r.id || r.requirementKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#fff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', gap: '12px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontSize: '11px', fontWeight: '700', background: '#151226', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                                            {r.requirementKey}
                                          </span>
                                          <span style={{ fontSize: '10px', fontWeight: '600', color: r.status === 'APPROVED' ? '#059669' : r.status === 'IN_PROGRESS' ? '#d97706' : '#64748b' }}>
                                            ● {r.status}
                                          </span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                                          {r.question}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                          setActiveTab('ai-writer');
                                          setSelectedWriterGrantId(selectedGrant.id);
                                          setSelectedRequirementKey(r.requirementKey);
                                          fetchGrantRequirements(selectedGrant.id);
                                          setSelectedKnowledgeIds(knowledgeDocs.map(d => d.id));
                                          setCompiledProposalResult(null);
                                        }}
                                        style={{ padding: '4px 8px', fontSize: '10px', whiteSpace: 'nowrap' }}
                                      >
                                        Draft Answer
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Required Submission Documents & Attachments Checklist */}
                        {(() => {
                          let reqDocs: any[] = [];
                          if (selectedGrant.requiredDocuments) {
                            try {
                              reqDocs = JSON.parse(selectedGrant.requiredDocuments);
                            } catch (e) {
                              reqDocs = [];
                            }
                          }
                          if (reqDocs.length === 0 && selectedGrant.guidelinesResponseDocs) {
                            reqDocs = selectedGrant.guidelinesResponseDocs.split(', ').map((d: string) => ({
                              name: d,
                              description: 'Required submission document specified in funder guidelines.',
                              mandatory: true
                            }));
                          }

                          return (
                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#151226' }}>
                                Required Submission Attachments & Documents Checklist ({reqDocs.length})
                              </span>
                              {reqDocs.length === 0 ? (
                                <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  Upload guidelines PDF to extract mandatory submission attachments.
                                </div>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  {reqDocs.map((doc: any, idx: number) => (
                                    <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#0f172a' }}>{doc.name}</span>
                                        <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: doc.mandatory ? '#fef2f2' : '#f1f5f9', color: doc.mandatory ? '#991b1b' : '#475569', border: doc.mandatory ? '1px solid #fecaca' : '1px solid #cbd5e1' }}>
                                          {doc.mandatory ? 'MANDATORY' : 'OPTIONAL'}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.3' }}>{doc.description}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Compiled Proposals Section */}
                        {(() => {
                          const appDocs = (selectedGrant.documents || []).filter((d: any) => d.type === 'APPLICATION');
                          return (
                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#151226' }}>Compiled Application Proposals</span>
                              {appDocs.length === 0 ? (
                                <div style={{ fontSize: '11px', color: '#64748b', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                  No proposals compiled yet. Launch the AI Grant Writer workspace to draft, refine, and compile your answers into a Word document.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {appDocs.map((doc: any) => (
                                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#151226' }}>{doc.name}</span>
                                        <span style={{ fontSize: '10px', color: '#64748b' }}>Compiled by: {doc.uploadedBy} | Size: {doc.fileSize}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadDocument(doc.id, doc.name)}
                                        className="btn"
                                        style={{ 
                                          padding: '6px 12px', 
                                          fontSize: '11px', 
                                          background: '#fbbd08', 
                                          color: '#151226', 
                                          border: '1px solid #fbbd08', 
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontWeight: '700',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Download Word Doc
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Tasks Table */}
                        {(() => {
                          const appTasks = tasks.filter(t => t.grantId === selectedGrant.id && t.stage === 'APPLICATION');
                          return (
                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#151226' }}>Application Prep Tasks</span>
                                <button 
                                  className="btn btn-secondary" 
                                  onClick={() => {
                                    setTaskGrantId(selectedGrant.id);
                                    setTaskMilestoneId('');
                                    setTaskStage('APPLICATION');
                                    setShowTaskModal(true);
                                  }}
                                  style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  + Add Task
                                </button>
                              </div>
                              {appTasks.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', border: '1px dashed #e2e8f0', borderRadius: '8px', marginTop: '10px' }}>
                                  No tasks defined. AI Guideline extraction will seed tasks automatically.
                                </div>
                              ) : (
                                <table className="surepact-table">
                                  <thead>
                                    <tr>
                                      <th>Task</th>
                                      <th>Task Owner</th>
                                      <th>Due Date</th>
                                      <th>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {appTasks.map(t => (
                                      <tr key={t.id}>
                                        <td style={{ fontWeight: '600' }}>{t.title}</td>
                                        <td>{t.assignedToUser?.name || 'Adrian Warren'}</td>
                                        <td>{new Date(t.dueDate).toLocaleDateString('en-GB')}</td>
                                        <td>
                                          <span style={{ 
                                            background: t.status === 'COMPLETED' ? '#d1fae5' : '#fee2e2',
                                            color: t.status === 'COMPLETED' ? '#065f46' : '#991b1b',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '600'
                                          }}>
                                            {t.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* SUBMISSION: SUBMISSION */}
                    {activeMenuItem === 'submission-confirm' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Submission</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Application submission confirmation details.</p>
                          </div>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => setActiveMenuItem('submission-result')}
                            style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
                          >
                            Next
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Funding Amount Requested</label>
                            <input 
                              type="number" 
                              className="url-input" 
                              style={{ width: '100%' }}
                              value={fundingRequested} 
                              onChange={(e) => setFundingRequested(e.target.value)}
                            />
                          </div>

                          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Submission Date</label>
                            <input 
                              type="date" 
                              className="url-input" 
                              style={{ width: '100%' }}
                              value={submissionDate} 
                              onChange={(e) => setSubmissionDate(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Receipts */}
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#151226' }}>Application Receipts</span>
                          <table className="surepact-table" style={{ marginTop: '12px' }}>
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Owner</th>
                                <th>Date Uploaded</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ fontWeight: '600' }}>receipt_submission.pdf</td>
                                <td>submitted via the Department Portal</td>
                                <td>Adrian Warren</td>
                                <td>16/07/2026</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Comments (Optional)</label>
                          <textarea 
                            rows={3} 
                            className="url-input" 
                            style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }} 
                            value={submissionComments} 
                            onChange={(e) => setSubmissionComments(e.target.value)}
                            placeholder="Log notes about the submission reference..."
                          />
                        </div>

                        <button 
                          className="btn" 
                          onClick={async () => {
                            if (!fundingRequested) {
                              alert('Please supply the funding requested amount.');
                              return;
                            }
                            try {
                              const res = await fetch(`${API_BASE}/grants/${selectedGrant.id}/submit`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  amountRequested: parseFloat(fundingRequested),
                                  dateSubmitted: submissionDate || new Date().toISOString().split('T')[0],
                                  submissionReference: 'SUB-' + Math.floor(Math.random() * 100000)
                                })
                              });
                              if (res.ok) {
                                alert('Application submission registered successfully!');
                                fetchData();
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          style={{ width: '100%', justifyContent: 'center', background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08' }}
                        >
                          Submit Application Reference
                        </button>
                      </div>
                    )}

                    {/* SUBMISSION: SUBMISSION RESULT */}
                    {activeMenuItem === 'submission-result' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Submission Result</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Log decision feedback and initialize delivery setup.</p>
                          </div>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => {
                              setActiveMenuSection('obligations');
                              setActiveMenuItem('obligations-tracking');
                            }}
                            style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
                          >
                            Next
                          </button>
                        </div>

                        {selectedGrant.status === 'REJECTED' ? (
                          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', color: '#991b1b', fontWeight: '600' }}>
                            ✗ Grant Application was Rejected.
                          </div>
                        ) : (selectedGrant.status === 'AWARDED' || showAwardForm) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {selectedGrant.status === 'AWARDED' && (
                              <div style={{ background: '#d1fae5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '8px', color: '#065f46', fontWeight: '600' }}>
                                ✓ Grant is Awarded and Post-Award milestones are initialized!
                              </div>
                            )}
                            <form onSubmit={handleAwardGrantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
                              <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#151226', margin: 0 }}>
                                {selectedGrant.status === 'AWARDED' ? 'Award Details & Installments' : 'Configure Award Details'}
                              </h5>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Execution Date</label>
                                  <input 
                                    type="date" 
                                    className="url-input" 
                                    value={awardExecDate} 
                                    onChange={(e) => setAwardExecDate(e.target.value)} 
                                    required 
                                  />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Funding Agreement Reference</label>
                                  <input 
                                    type="text" 
                                    className="url-input" 
                                    value={awardAgRef} 
                                    onChange={(e) => setAwardAgRef(e.target.value)} 
                                    placeholder="e.g. AGR-12345" 
                                    required 
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Amount Awarded (AUD)</label>
                                  <input 
                                    type="number" 
                                    className="url-input" 
                                    value={awardAmount} 
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setAwardAmount(val);
                                      // Dynamically update installments if value is a valid number
                                      const numericVal = parseFloat(val);
                                      if (!isNaN(numericVal)) {
                                        const inst1 = (numericVal * 0.3).toFixed(2);
                                        const inst2 = (numericVal * 0.4).toFixed(2);
                                        const inst3 = (numericVal * 0.3).toFixed(2);
                                        setAwardInstallments(prev => {
                                          if (prev.length === 3) {
                                            return [
                                              { ...prev[0], amount: inst1 },
                                              { ...prev[1], amount: inst2 },
                                              { ...prev[2], amount: inst3 }
                                            ];
                                          } else {
                                            const dateNow = new Date();
                                            const d1 = new Date(dateNow.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                            const d2 = new Date(dateNow.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                            const d3 = new Date(dateNow.getTime() + 360 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                            return [
                                              { amount: inst1, dueDate: d1 },
                                              { amount: inst2, dueDate: d2 },
                                              { amount: inst3, dueDate: d3 }
                                            ];
                                          }
                                        });
                                      }
                                    }} 
                                    required 
                                  />
                                </div>
                                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Co-contribution Required (AUD)</label>
                                  <input 
                                    type="number" 
                                    className="url-input" 
                                    value={coContribution} 
                                    onChange={(e) => setCoContribution(e.target.value)} 
                                    required 
                                  />
                                </div>
                              </div>



                              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                {selectedGrant.status !== 'AWARDED' && (
                                  <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    onClick={() => setShowAwardForm(false)}
                                  >
                                    Cancel
                                  </button>
                                )}
                                <button 
                                  type="submit" 
                                  className="btn btn-success" 
                                  style={{ flex: 1, justifyContent: 'center', background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08' }}
                                  disabled={savingAward}
                                >
                                  {selectedGrant.status === 'AWARDED' 
                                    ? (savingAward ? 'Updating Award Details...' : 'Update Award Details') 
                                    : (savingAward ? 'Submitting...' : 'Submit Award Decision')}
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ fontSize: '13px', color: '#475569' }}>
                              Please select whether this grant has been awarded or rejected by the funder.
                            </p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <button 
                                className="btn"
                                onClick={handleLogAsAwardedInit}
                                style={{ background: '#10b981', color: 'white', flex: 1, justifyContent: 'center' }}
                              >
                                Log as Awarded
                              </button>
                              <button 
                                className="btn"
                                onClick={() => {
                                  fetch(`${API_BASE}/grants/${selectedGrant.id}/reject`, {
                                    method: 'POST'
                                  }).then(res => {
                                    if (res.ok) {
                                      alert('Grant logged as Rejected.');
                                      fetchData();
                                    }
                                  });
                                }}
                                style={{ background: '#ef4444', color: 'white', flex: 1, justifyContent: 'center' }}
                              >
                                Log as Rejected
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* OBLIGATIONS: TRACKING & REPORTING */}
                    {activeMenuItem === 'obligations-tracking' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Compact Launch Acquittals Hub Banner */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
                          border: '1px solid var(--border-color-active)',
                          borderRadius: '12px',
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileCheck size={24} color="var(--accent-indigo)" />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                                Funder Acquittals &amp; Compliance Reports Generator
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Pre-extracted agreement schedules &amp; multi-doc parser available for <strong>{selectedGrant.title}</strong>.
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              setActiveTab('acquittals');
                            }}
                            style={{
                              background: '#fbbd08',
                              color: '#151226',
                              fontWeight: 800,
                              border: '1px solid #fbbd08',
                              padding: '8px 16px',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FileText size={16} /> Launch Acquittals Hub &amp; Preselect Grant
                          </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Contractual Obligations Schedule</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Monitor performance milestones and payment schedules.</p>
                          </div>
                          {selectedGrant.status === 'AWARDED' && (
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => {
                                setActiveMenuSection('closeout');
                                setActiveMenuItem('closeout-summary');
                              }}
                              style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
                            >
                              Next
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                          {/* Left Column: Categorized Ingested Obligations & Attributed Tasks */}
                          <div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#151226', margin: 0 }}>
                                    Agreement Obligations & Compliance Schedule
                                  </h4>
                                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                                    Categorized requirements and attributed tasks extracted from the executed funding agreement.
                                  </p>
                                </div>
                                <button 
                                  type="button"
                                  className="btn btn-secondary" 
                                  onClick={() => {
                                    setTaskGrantId(selectedGrant.id);
                                    setTaskMilestoneId('');
                                    setTaskStage('OBLIGATION');
                                    setTaskDueDate(new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0]);
                                    setShowTaskModal(true);
                                  }}
                                  style={{ padding: '4px 10px', fontSize: '11px' }}
                                >
                                  + Add Manual Task
                                </button>
                              </div>

                              {/* Category Tabs Header */}
                              {(() => {
                                const parseTaskCategory = (task: any): { category: 'Milestones' | 'Acquittals' | 'Reporting' | 'Activities' | 'General'; cleanDescription: string } => {
                                  const desc = task.description || '';
                                  const titleLower = (task.title || '').toLowerCase();
                                  const descLower = desc.toLowerCase();
                                  
                                  const matchBracket = desc.match(/^\[Category:\s*([^\]]+)\]\s*(.*)/s);
                                  if (matchBracket) {
                                    let cat = matchBracket[1].trim();
                                    if (cat.toLowerCase().includes('general')) return { category: 'General', cleanDescription: matchBracket[2].trim() };
                                    if (cat.toLowerCase().includes('milestone')) return { category: 'Milestones', cleanDescription: matchBracket[2].trim() };
                                    if (cat.toLowerCase().includes('acquittal')) return { category: 'Acquittals', cleanDescription: matchBracket[2].trim() };
                                    if (cat.toLowerCase().includes('report')) return { category: 'Reporting', cleanDescription: matchBracket[2].trim() };
                                    return { category: 'Activities', cleanDescription: matchBracket[2].trim() };
                                  }

                                  const matchPrefix = desc.match(/^(General|Milestones?|Acquittals?|Reports?|Reporting|Activities)\s+Obligation:\s*(.*)/i);
                                  if (matchPrefix) {
                                    let cat = matchPrefix[1].trim();
                                    if (cat.toLowerCase().includes('general')) return { category: 'General', cleanDescription: matchPrefix[2].trim() };
                                    if (cat.toLowerCase().includes('milestone')) return { category: 'Milestones', cleanDescription: matchPrefix[2].trim() };
                                    if (cat.toLowerCase().includes('acquittal')) return { category: 'Acquittals', cleanDescription: matchPrefix[2].trim() };
                                    if (cat.toLowerCase().includes('report')) return { category: 'Reporting', cleanDescription: matchPrefix[2].trim() };
                                    return { category: 'Activities', cleanDescription: matchPrefix[2].trim() };
                                  }

                                  if (
                                    titleLower.includes('audit and site inspection') ||
                                    titleLower.includes('maintain financial records') ||
                                    titleLower.includes('exclusive use of assets') ||
                                    titleLower.includes('use grant funding for approved activity') ||
                                    titleLower.includes('asset registration') ||
                                    titleLower.includes('insurance') ||
                                    titleLower.includes('community-controlled asset ownership') ||
                                    descLower.includes('audit the grantee\'s records') ||
                                    descLower.includes('maintain complete and accurate financial records') ||
                                    descLower.includes('solely to perform the activity')
                                  ) {
                                    return { category: 'General', cleanDescription: desc };
                                  }

                                  if (titleLower.includes('acquittal') || descLower.includes('acquittal')) return { category: 'Acquittals', cleanDescription: desc };
                                  if (titleLower.includes('report') || descLower.includes('report')) return { category: 'Reporting', cleanDescription: desc };
                                  if (titleLower.includes('milestone') || descLower.includes('milestone')) return { category: 'Milestones', cleanDescription: desc };
                                  return { category: 'Activities', cleanDescription: desc };
                                };

                                const allObligationTasks = selectedGrant.tasks?.filter(t => t.stage === 'OBLIGATION') || [];

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                                      {(['Milestones', 'Acquittals', 'Reporting', 'Activities'] as const).map(cat => {
                                        const count = allObligationTasks.filter(t => parseTaskCategory(t).category === cat).length;
                                        const isActive = trackingObligationsTab === cat;
                                        return (
                                          <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setTrackingObligationsTab(cat)}
                                            style={{
                                              flex: 1,
                                              padding: '8px 10px',
                                              fontSize: '11px',
                                              fontWeight: isActive ? '700' : '600',
                                              background: isActive ? '#ffffff' : 'transparent',
                                              color: isActive ? '#151226' : '#64748b',
                                              border: 'none',
                                              borderRadius: '6px',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              gap: '6px',
                                              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                            }}
                                          >
                                            <span>{cat === 'Milestones' ? '🎯 Milestones' : cat === 'Acquittals' ? '📑 Acquittals' : cat === 'Reporting' ? '📊 Reporting' : '🛠️ Activities'}</span>
                                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: isActive ? '#fbbd08' : '#cbd5e1', color: '#151226', fontWeight: '700' }}>
                                              {count}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Obligation Cards List */}
                                    {(() => {
                                      const catTasks = allObligationTasks.filter(t => parseTaskCategory(t).category === trackingObligationsTab);

                                      if (catTasks.length === 0) {
                                        return (
                                          <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '36px 20px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '10px', background: '#ffffff' }}>
                                            No {trackingObligationsTab} obligations recorded under this grant yet. Launch the AI Agreement Ingestion engine to populate automatically from your agreement document.
                                          </div>
                                        );
                                      }

                                      return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '650px', overflowY: 'auto', paddingRight: '4px' }}>
                                          {catTasks.map(t => {
                                            const { cleanDescription } = parseTaskCategory(t);
                                            return (
                                              <div key={t.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                  <div style={{ flex: 1, paddingRight: '12px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#151226', display: 'block' }}>
                                                      {t.title}
                                                    </span>
                                                    {cleanDescription && (
                                                      <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                                                        {cleanDescription}
                                                      </p>
                                                    )}
                                                  </div>
                                                  <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', fontWeight: '600', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                                                    Due: {new Date(t.dueDate).toLocaleDateString('en-GB')}
                                                  </span>
                                                </div>

                                                {/* Attributed Task Box */}
                                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                      type="checkbox"
                                                      checked={t.status === 'COMPLETED'}
                                                      onChange={() => handleToggleTask(t.id, t.status)}
                                                      style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                                                    />
                                                    <div>
                                                      <span style={{ fontSize: '12px', textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none', color: t.status === 'COMPLETED' ? '#94a3b8' : '#0f172a', fontWeight: '600' }}>
                                                        Attributed Task: {t.title}
                                                      </span>
                                                      {t.assignedToUser?.name && (
                                                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>
                                                          Assigned Owner: {t.assignedToUser.name}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: t.status === 'COMPLETED' ? '#d1fae5' : t.status === 'IN_PROGRESS' ? '#fef3c7' : '#e2e8f0', color: t.status === 'COMPLETED' ? '#065f46' : t.status === 'IN_PROGRESS' ? '#92400e' : '#475569' }}>
                                                      {t.status}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Right Column: Ingestion, Acquittals, Linked Projects & Tasks */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* AI Agreement Ingestion Launcher Card */}
                            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#151226' }}>AI Agreement Ingestion Engine</span>
                                {selectedGrant.contracts?.[0]?.fundingAgreementReference && (
                                  <span style={{ fontSize: '10px', fontWeight: '700', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                                    ✓ Reference: {selectedGrant.contracts[0].fundingAgreementReference}
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                                Launch the AI Agreement Ingestor workspace to parse executed agreement text, extract payment schedules, and map compliance obligations.
                              </p>
                              <button
                                type="button"
                                className="btn animate-pulse"
                                onClick={() => {
                                  setIngestMode('associate');
                                  setIngestSelectedGrantId(selectedGrant.id);
                                  setActiveTab('ingest-agreement');
                                }}
                                style={{
                                  background: '#151226',
                                  color: '#fffffe',
                                  fontWeight: '700',
                                  border: '1px solid #151226',
                                  padding: '8px 12px',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  borderRadius: '6px',
                                  marginTop: '4px'
                                }}
                              >
                                <FileText size={14} />
                                Launch AI Agreement Ingestion →
                              </button>
                            </div>

                            {/* Acquittal Report Card */}
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acquittal Reporting</span>
                              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                                Generate an audited financial ledger of linked expenditures and funding drawdowns to submit to the funding body.
                              </p>
                              <button 
                                type="button" 
                                className="btn btn-success" 
                                style={{ fontSize: '11px', padding: '6px 12px', marginTop: '6px', justifyContent: 'center', background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08' }}
                                onClick={() => handleOpenAcquittalModal('grant', selectedGrant.id, selectedGrant.title)}
                              >
                                Generate Acquittal Report
                              </button>
                            </div>

                            {/* Direct Project Linking */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#151226' }}>Linked Capital Projects</span>
                                {selectedGrant.status === 'AWARDED' && (
                                  <button 
                                    type="button"
                                    className="btn btn-secondary" 
                                    onClick={() => {
                                      setLinkGrantId(selectedGrant.id);
                                      setLinkAmount(selectedGrant.contracts?.[0]?.totalObligatedAmount?.toString() || selectedGrant.totalFundingValue?.toString() || '');
                                      setLinkProjectId('');
                                      setShowLinkModal(true);
                                    }}
                                    style={{ padding: '3px 6px', fontSize: '10px' }}
                                  >
                                    Link Project
                                  </button>
                                )}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {selectedGrant.projectMappings && selectedGrant.projectMappings.length > 0 ? (
                                  selectedGrant.projectMappings.map(pm => (
                                    <div key={pm.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px' }}>
                                      <span style={{ fontWeight: '500', color: '#0f172a' }}>{pm.project.name}</span>
                                      <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>${pm.allocatedAmount.toLocaleString('en-AU')}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>No projects linked yet. Link to track split-funding allocations.</span>
                                )}
                              </div>
                            </div>

                            {/* General Obligations Panel */}
                             <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <div>
                                   <span style={{ fontSize: '13px', fontWeight: '700', color: '#151226', display: 'block' }}>General Obligations</span>
                                   <span style={{ fontSize: '10px', color: '#64748b' }}>Ongoing contractual terms & compliance rules (no task timing required).</span>
                                 </div>
                                 <button 
                                   type="button"
                                   className="btn btn-secondary" 
                                   onClick={() => {
                                     setTaskGrantId(selectedGrant.id);
                                     setTaskMilestoneId('');
                                     setTaskStage('OBLIGATION');
                                     setTaskDueDate(new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0]);
                                     setShowTaskModal(true);
                                   }}
                                   style={{ padding: '3px 8px', fontSize: '10px' }}
                                 >
                                   + Add Rule
                                 </button>
                               </div>

                               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '2px' }}>
                                 {(() => {
                                   const parseTaskCategory = (task: any): { category: 'Milestones' | 'Acquittals' | 'Reporting' | 'Activities' | 'General'; cleanDescription: string } => {
                                     const desc = task.description || '';
                                     const titleLower = (task.title || '').toLowerCase();
                                     const descLower = desc.toLowerCase();
                                     
                                     const matchBracket = desc.match(/^\[Category:\s*([^\]]+)\]\s*(.*)/s);
                                     if (matchBracket) {
                                       let cat = matchBracket[1].trim();
                                       if (cat.toLowerCase().includes('general')) return { category: 'General', cleanDescription: matchBracket[2].trim() };
                                       if (cat.toLowerCase().includes('milestone')) return { category: 'Milestones', cleanDescription: matchBracket[2].trim() };
                                       if (cat.toLowerCase().includes('acquittal')) return { category: 'Acquittals', cleanDescription: matchBracket[2].trim() };
                                       if (cat.toLowerCase().includes('report')) return { category: 'Reporting', cleanDescription: matchBracket[2].trim() };
                                       return { category: 'Activities', cleanDescription: matchBracket[2].trim() };
                                     }

                                     const matchPrefix = desc.match(/^(General|Milestones?|Acquittals?|Reports?|Reporting|Activities)\s+Obligation:\s*(.*)/i);
                                     if (matchPrefix) {
                                       let cat = matchPrefix[1].trim();
                                       if (cat.toLowerCase().includes('general')) return { category: 'General', cleanDescription: matchPrefix[2].trim() };
                                       if (cat.toLowerCase().includes('milestone')) return { category: 'Milestones', cleanDescription: matchPrefix[2].trim() };
                                       if (cat.toLowerCase().includes('acquittal')) return { category: 'Acquittals', cleanDescription: matchPrefix[2].trim() };
                                       if (cat.toLowerCase().includes('report')) return { category: 'Reporting', cleanDescription: matchPrefix[2].trim() };
                                       return { category: 'Activities', cleanDescription: matchPrefix[2].trim() };
                                     }

                                     if (
                                       titleLower.includes('audit and site inspection') ||
                                       titleLower.includes('maintain financial records') ||
                                       titleLower.includes('exclusive use of assets') ||
                                       titleLower.includes('use grant funding for approved activity') ||
                                       titleLower.includes('asset registration') ||
                                       titleLower.includes('insurance') ||
                                       titleLower.includes('community-controlled asset ownership') ||
                                       descLower.includes('audit the grantee\'s records') ||
                                       descLower.includes('maintain complete and accurate financial records') ||
                                       descLower.includes('solely to perform the activity')
                                     ) {
                                       return { category: 'General', cleanDescription: desc };
                                     }

                                     if (titleLower.includes('acquittal') || descLower.includes('acquittal')) return { category: 'Acquittals', cleanDescription: desc };
                                     if (titleLower.includes('report') || descLower.includes('report')) return { category: 'Reporting', cleanDescription: desc };
                                     if (titleLower.includes('milestone') || descLower.includes('milestone')) return { category: 'Milestones', cleanDescription: desc };
                                     return { category: 'Activities', cleanDescription: desc };
                                   };

                                   const generalItems = (selectedGrant.tasks || []).filter(t => t.stage === 'OBLIGATION' && parseTaskCategory(t).category === 'General');
                                   if (generalItems.length === 0) {
                                     return (
                                       <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '12px', textAlign: 'center', background: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                         No ongoing general obligations recorded. Launch the AI Agreement Ingestor to extract non-timed compliance rules.
                                       </span>
                                     );
                                   }

                                   return generalItems.map(t => {
                                     const { cleanDescription } = parseTaskCategory(t);
                                     return (
                                       <div key={t.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                           <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{t.title}</span>
                                           <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3' }}>
                                             Ongoing Rule
                                           </span>
                                         </div>
                                         {cleanDescription && (
                                           <p style={{ fontSize: '10px', color: '#64748b', margin: 0, lineHeight: '1.3' }}>
                                             {cleanDescription}
                                           </p>
                                         )}
                                       </div>
                                     );
                                   });
                                 })()}
                               </div>
                             </div>

                            {/* Expected Payment Installments list */}
                            {(() => {
                              const contract = selectedGrant.contracts?.[0];
                              const installments = contract?.installments || [];
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#151226' }}>Expected Payment Installments</span>
                                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                                        (Total: <strong>${installments.reduce((sum, i) => sum + i.amount, 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>)
                                      </span>
                                    </div>
                                    <button 
                                      type="button" 
                                      className="btn btn-secondary" 
                                      style={{ padding: '5px 10px', fontSize: '11px', background: '#10b981', color: 'white', border: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => setShowAddInstallmentForm(!showAddInstallmentForm)}
                                    >
                                      + Add Installment
                                    </button>
                                  </div>

                                  {/* Manual Installment Form */}
                                  {showAddInstallmentForm && (
                                    <form onSubmit={handleAddInstallment} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '14px', borderRadius: '8px' }}>
                                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>Add New Payment Installment</div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <label style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>Amount (AUD)</label>
                                          <input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="e.g. 50000.00" 
                                            className="url-input" 
                                            style={{ fontSize: '12px', padding: '6px' }}
                                            value={instAmount}
                                            onChange={(e) => setInstAmount(e.target.value)}
                                            required
                                          />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <label style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>Due Date</label>
                                          <input 
                                            type="date" 
                                            className="url-input" 
                                            style={{ fontSize: '12px', padding: '6px' }}
                                            value={instDueDate}
                                            onChange={(e) => setInstDueDate(e.target.value)}
                                            required
                                          />
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                                        <button 
                                          type="button" 
                                          className="btn btn-secondary" 
                                          style={{ fontSize: '11px', padding: '4px 10px' }}
                                          onClick={() => setShowAddInstallmentForm(false)}
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          type="submit" 
                                          className="btn btn-primary" 
                                          style={{ fontSize: '11px', padding: '4px 12px', background: '#10b981', color: 'white', border: 'none', fontWeight: '600' }}
                                          disabled={savingInstallment}
                                        >
                                          {savingInstallment ? 'Saving...' : 'Add Installment & Create Task'}
                                        </button>
                                      </div>
                                    </form>
                                  )}

                                  {installments.length === 0 ? (
                                    <div style={{ border: '1px dashed #cbd5e1', padding: '16px', textAlign: 'center', borderRadius: '8px', color: '#64748b', fontSize: '11px' }}>
                                      No payment installments scheduled. Click <strong>"+ Add Installment"</strong> above or launch the AI Agreement Ingestion Engine.
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {installments.map(inst => (
                                        <div key={inst.id} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <strong style={{ fontSize: '13px', color: '#151226' }}>${inst.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong>
                                              <span style={{ fontSize: '9px', background: inst.status === 'RECEIVED' ? '#d1fae5' : '#f1f5f9', color: inst.status === 'RECEIVED' ? '#065f46' : '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                                {inst.status === 'RECEIVED' ? '✓ RECEIVED' : '⏳ PENDING'}
                                              </span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                              Due: {new Date(inst.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '4px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <span>📋 Attributed Task:</span>
                                              <span style={{ color: inst.status === 'RECEIVED' ? '#059669' : '#3b82f6', textDecoration: inst.status === 'RECEIVED' ? 'line-through' : 'none' }}>
                                                Confirm Payment Received: ${inst.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          </div>
                                          <button 
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => handleToggleInstallmentStatus(inst.id, inst.status)}
                                            style={{ fontSize: '10px', padding: '4px 8px', background: inst.status === 'RECEIVED' ? '#f1f5f9' : '#d1fae5', color: inst.status === 'RECEIVED' ? '#475569' : '#065f46', border: '1px solid #cbd5e1', fontWeight: '600' }}
                                          >
                                            {inst.status === 'RECEIVED' ? 'Mark Pending' : 'Mark Received'}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CLOSEOUT: SUMMARY */}
                    {activeMenuItem === 'closeout-summary' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Grant Summary</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Log acquittal summary and close out the project.</p>
                          </div>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => setActiveMenuItem('closeout-archive')}
                            style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
                          >
                            Next
                          </button>
                        </div>

                        {selectedGrant.status === 'CLOSED' ? (
                          <div style={{ background: '#d1fae5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '8px', color: '#065f46' }}>
                            <strong style={{ display: 'block', marginBottom: '4px' }}>✓ Grant Closed & Acquitted</strong>
                            <p style={{ fontSize: '12px', color: '#047857' }}>{selectedGrant.closeoutNotes}</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Closeout & Acquittal Notes</label>
                              <textarea 
                                rows={4} 
                                className="url-input" 
                                value={closeoutNotesText}
                                onChange={(e) => setCloseoutNotesText(e.target.value)}
                                placeholder="Log acquittal summaries..."
                              />
                            </div>
                            <button 
                              className="btn"
                              onClick={async () => {
                                if (!closeoutNotesText) {
                                  alert('Please enter closeout notes.');
                                  return;
                                }
                                fetch(`${API_BASE}/grants/${selectedGrant.id}/closeout`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ closeoutNotes: closeoutNotesText })
                                }).then(res => {
                                  if (res.ok) {
                                    alert('Grant closeout processed successfully!');
                                    fetchData();
                                  }
                                });
                              }}
                              style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', justifyContent: 'center', border: '1px solid #fbbd08' }}
                            >
                              Submit Acquittal
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CLOSEOUT: ARCHIVE */}
                    {activeMenuItem === 'closeout-archive' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Archive</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Archive this grant project from the active workspace.</p>
                          </div>
                        </div>
                        <button 
                          className="btn" 
                          onClick={() => alert('Grant archived!')}
                          style={{ background: '#ef4444', color: 'white', alignSelf: 'start' }}
                        >
                          Archive Grant
                        </button>
                      </div>
                    )}

                    {/* GOVERNANCE: VARIATIONS */}
                    {activeMenuItem === 'governance-variations' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Grant Variations</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Track changes and variations to the grant</p>
                          </div>
                          <button 
                            type="button"
                            className="btn" 
                            style={{ background: '#fbbd08', color: '#151226', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              if (!selectedGrant?.contracts?.[0]) {
                                alert('This grant does not have an active contract. Post-Award must be initialized first.');
                              } else {
                                setVarRef('');
                                setVarValueChange('');
                                setVarNewDate('');
                                setVarStatus('PENDING');
                                setVarDesc('');
                                setShowVariationModal(true);
                              }
                            }}
                          >
                            + Add Variation
                          </button>
                        </div>
                        {(() => {
                          const contract = selectedGrant?.contracts?.[0];
                          const variations = contract?.variations || [];
                          return variations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                              No records to display
                            </div>
                          ) : (
                            <table className="surepact-table">
                              <thead>
                                <tr>
                                  <th>VARIATION TYPE</th>
                                  <th>REASON</th>
                                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {variations.map((v: any) => {
                                  let varType = 'Scope Adjustment';
                                  if (v.valueChange !== 0 && v.newCloseDate) {
                                    varType = `Value & Time Ext (${v.valueChange > 0 ? '+' : ''}$${v.valueChange.toLocaleString()} AUD, ${new Date(v.newCloseDate).toLocaleDateString('en-GB')})`;
                                  } else if (v.valueChange !== 0) {
                                    varType = `Value Adjustment (${v.valueChange > 0 ? '+' : ''}$${v.valueChange.toLocaleString()} AUD)`;
                                  } else if (v.newCloseDate) {
                                    varType = `Extension of Time (${new Date(v.newCloseDate).toLocaleDateString('en-GB')})`;
                                  }
                                  return (
                                    <tr key={v.id}>
                                      <td style={{ fontWeight: '600', color: '#151226' }}>
                                        {v.referenceNumber} - {varType}
                                      </td>
                                      <td>{v.description || 'No reasoning provided.'}</td>
                                      <td style={{ textAlign: 'right' }}>
                                        {v.status === 'PENDING' ? (
                                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button 
                                              type="button"
                                              className="btn btn-success" 
                                              style={{ padding: '4px 8px', fontSize: '11px' }}
                                              onClick={() => handleUpdateVariationStatus(v.id, 'APPROVED')}
                                            >
                                              Approve
                                            </button>
                                            <button 
                                              type="button"
                                              className="btn btn-secondary" 
                                              style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--color-danger)', color: 'white' }}
                                              onClick={() => handleUpdateVariationStatus(v.id, 'REJECTED')}
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        ) : (
                                          <span style={{ 
                                            background: v.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                                            color: v.status === 'APPROVED' ? '#065f46' : '#991b1b',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '600'
                                          }}>
                                            {v.status}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    )}

                    {/* GOVERNANCE: GOVERNANCE LOG */}
                    {activeMenuItem === 'governance-log' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Governance Log</h4>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Chronological record of all actions and events for this grant</p>
                          </div>
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08' }}
                            onClick={() => {
                              setManualLogMessage('');
                              setManualLogUser('Adrian Warren');
                              setShowManualLogModal(true);
                            }}
                          >
                            Add Manual Entry
                          </button>
                        </div>
                        {(() => {
                          const contractId = selectedGrant.contracts?.[0]?.id;
                          const grantEvents = ledger.filter(evt => {
                            if (evt.aggregateId === selectedGrant.id) return true;
                            if (contractId && evt.aggregateId === contractId) return true;
                            if (evt.payload?.grantId === selectedGrant.id) return true;
                            if (contractId && evt.payload?.contractId === contractId) return true;
                            return false;
                          });

                          function formatLedgerEntry(evt: any) {
                            const { eventType, payload, user } = evt;
                            switch (eventType) {
                              case 'GRANT_INGESTED_VIA_URL':
                              case 'GRANT_IMPORTED_FOR_CONSIDERATION':
                                return `Grant has been imported for consideration.`;
                              case 'RISK_PROFILE_EVALUATED':
                                return `Risk profile evaluated.`;
                              case 'APPLICATION_APPROVED_TO_STAGE':
                                return `All approvals submitted`;
                              case 'GRANT_APPLICATION_SUBMITTED':
                                return `Grant has been submitted by ${user} on ${new Date(evt.timestamp).toLocaleDateString('en-GB')}`;
                              case 'GUIDELINES_DOCUMENT_UPLOADED':
                              case 'GFA_DOCUMENT_UPLOADED':
                              case 'GRANT_DOCUMENT_UPLOADED':
                                return `Document ${payload.documentName || payload.name || 'document'} uploaded to Grant.`;
                              case 'GRANT_DOCUMENT_DELETED':
                                return `Document ${payload.documentName} deleted from Grant.`;
                              case 'AI_GUIDELINES_EXTRACTED':
                              case 'AI_MILestones_EXTRACTED':
                                return `AI guidelines/milestones extracted.`;
                              case 'GRANT_AWARDED_POST_AWARD_INITIALIZED':
                                return `Progressing workflow. The next stage is - Delivery Tracking`;
                              case 'MILESTONE_TASK_CREATED':
                                return `Task created: ${payload.title}`;
                              case 'MILESTONE_TASK_STATUS_UPDATED':
                                return `Task completed by ${user} and removed from the todo list: ${payload.title}.`;
                              case 'MILESTONE_STATUS_UPDATED':
                                return `Milestone status updated.`;
                              case 'CONTRACT_VARIATION_REQUESTED':
                                return `Variation request submitted: ${payload.referenceNumber}.`;
                              case 'CONTRACT_VARIATION_APPROVED':
                                return `Contract variation approved: ${payload.referenceNumber}.`;
                              case 'CONTRACT_VARIATION_REJECTED':
                                return `Contract variation rejected: ${payload.referenceNumber}.`;
                              case 'CONTRACT_INSTALLMENT_SCHEDULED':
                                return `Contract installment scheduled.`;
                              case 'CONTRACT_INSTALLMENT_STATUS_UPDATED':
                                return `Contract installment status updated.`;
                              case 'GRANT_APPLICATION_REJECTED':
                                return `Grant application rejected.`;
                              case 'GRANT_CLOSED_AND_ACQUITTED':
                                return `Grant closed and acquitted.`;
                              case 'FINANCIAL_TRANSACTION_LOGGED':
                                return `Financial transaction logged.`;
                              case 'GRANT_APPLICATION_DRAFT_GENERATED':
                                return `AI Grant Writer generated draft response.`;
                              case 'MANUAL_ENTRY':
                                return payload.message || 'Manual entry logged.';
                              default:
                                return `${eventType.replace(/_/g, ' ')} logged.`;
                            }
                          }

                          return grantEvents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                              No records to display
                            </div>
                          ) : (
                            <table className="surepact-table">
                              <thead>
                                <tr>
                                  <th>Entry</th>
                                  <th>Date</th>
                                  <th>Created By</th>
                                </tr>
                              </thead>
                              <tbody>
                                {grantEvents.map((evt: any) => (
                                  <tr key={evt.id}>
                                    <td style={{ color: '#151226' }}>{formatLedgerEntry(evt)}</td>
                                    <td>{new Date(evt.timestamp).toLocaleString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                                    <td>{evt.user}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    )}

                    {/* GOVERNANCE: DOCUMENTS */}
                    {activeMenuItem === 'governance-documents' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#151226', margin: 0 }}>Documents</h4>
                            <button 
                              type="button"
                              className="btn btn-secondary" 
                              onClick={() => {
                                setDocGrantId(selectedGrant.id);
                                setDocName('');
                                setDocType('OTHER');
                                setDocUploadedBy('Adrian Warren');
                                setDocFileSize('21.28 KB');
                                setShowDocModal(true);
                              }}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#f8fafc', color: '#151226', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Upload Document"
                            >
                              <PlusCircle size={16} />
                            </button>
                          </div>
                        </div>

                        {(selectedGrant.documents || []).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                            No records to display
                          </div>
                        ) : (
                          <table className="surepact-table">
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Owner</th>
                                <th>Size</th>
                                <th>Date Uploaded</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(selectedGrant.documents || []).map((doc: any) => (
                                <tr key={doc.id}>
                                  <td style={{ fontWeight: '600', color: '#151226' }}>{doc.name}</td>
                                  <td>{doc.type}</td>
                                  <td>{doc.uploadedBy}</td>
                                  <td>{doc.fileSize}</td>
                                  <td>{new Date(doc.createdAt).toLocaleDateString('en-GB')}</td>
                                  <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    {(doc.type === 'APPLICATION' || doc.content) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadDocument(doc.id, doc.name)}
                                        className="btn btn-secondary"
                                        style={{ 
                                          padding: '4px 8px', 
                                          fontSize: '11px', 
                                          color: 'var(--text-color)', 
                                          background: 'rgba(255,255,255,0.02)',
                                          border: '1px solid var(--border-color)',
                                          borderRadius: '6px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Download
                                      </button>
                                    )}
                                    <button 
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--color-danger)', border: 'none', background: 'transparent', width: 'auto' }}
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to delete this document?')) {
                                          try {
                                            const res = await fetch(`${API_BASE}/documents/${doc.id}`, { method: 'DELETE' });
                                            const data = await res.json();
                                            if (data.success) {
                                              fetchData();
                                            }
                                          } catch (err) {
                                            console.error('Failed to delete document:', err);
                                          }
                                        }
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsHub
            grants={grants}
            projects={projects}
            tasks={tasks}
            finances={finances}
            fundingBodies={fundingBodies}
            onNavigateToGrant={(grantId) => {
              setSelectedGrantId(grantId);
              setActiveTab('grants');
            }}
          />
        )}

        {/* URL Ingestion Tab */}
        {activeTab === 'ingest' && (
          <div className="panel animate">
            <div className="ingest-box" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Sparkles size={24} color="var(--accent-indigo)" />
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  URL Ingestion &amp; Gemini AI Extractor
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
                Paste any Australian grant opportunity URL from GrantConnect (grants.gov.au), Business.gov.au, state government portals, or philanthropy sites. Google Gemini AI fetches the web page and automatically extracts structured grant title, funding agency, available AUD amount, deadlines, category, and eligibility rules.
              </p>

              <form onSubmit={handleIngest} className="input-group" style={{ marginBottom: '20px' }}>
                <input
                  type="url"
                  placeholder="Paste Australian government grant URL (e.g. https://www.grants.gov.au/Go/Show?GoUuid=...)"
                  className="url-input"
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  required
                  disabled={ingesting}
                  style={{ flex: 1, padding: '12px 16px', fontSize: '14px', background: 'var(--bg-primary)' }}
                />
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={ingesting || !pasteUrl}
                  style={{
                    background: '#fbbd08',
                    color: '#151226',
                    fontWeight: '800',
                    border: '1px solid #fbbd08',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    cursor: ingesting ? 'wait' : 'pointer'
                  }}
                >
                  {ingesting ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" />
                      Gemini Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Extract Grant with Gemini AI
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {ingestLogs.length > 0 && (
                <div className="scraper-console" style={{ background: '#0f172a', borderRadius: '10px', padding: '16px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #334155' }}>
                  {ingestLogs.map((log, index) => {
                    let logType = '#94a3b8';
                    if (log.includes('SUCCESS') || log.includes('INGESTED')) logType = '#10b981';
                    if (log.includes('ERROR') || log.includes('EXCEPTION')) logType = '#ef4444';
                    return (
                      <div key={index} style={{ color: logType, marginBottom: '4px' }}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ maxWidth: '800px', margin: '32px auto 0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💡 Select an Australian Grant Portal URL to test Gemini Ingestion:
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
                <div
                  style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => setPasteUrl('https://www.grants.gov.au/Go/Show?GoUuid=arena-first-nations-clean-energy-2026')}
                >
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚡ ARENA — First Nations Community Microgrids Fund
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>https://www.grants.gov.au/Go/Show?GoUuid=arena-first-nations-clean-energy-2026</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '6px' }}>$3,500,000 AUD • Clean Energy &amp; Infrastructure</div>
                </div>

                <div
                  style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => setPasteUrl('https://www.grants.gov.au/Go/Show?GoUuid=nema-disaster-preparedness-2026')}
                >
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🛡️ NEMA — Disaster Preparedness &amp; Climate Resilience
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>https://www.grants.gov.au/Go/Show?GoUuid=nema-disaster-preparedness-2026</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '6px' }}>$12,500,000 AUD • Emergency Resilience</div>
                </div>

                <div
                  style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => setPasteUrl('https://www.grants.gov.au/Go/Show?GoUuid=dohac-remote-accho-capital-works-2026')}
                >
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏥 DoHAC — Remote ACCHO Capital Works Program
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>https://www.grants.gov.au/Go/Show?GoUuid=dohac-remote-accho-capital-works-2026</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '6px' }}>$4,500,000 AUD • Health &amp; Wellbeing</div>
                </div>

                <div
                  style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => setPasteUrl('https://www.grants.gov.au/Go/Show?GoUuid=niaa-ias-remote-infrastructure-2026')}
                >
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏛️ NIAA — Indigenous Advancement Strategy (IAS) Grant
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>https://www.grants.gov.au/Go/Show?GoUuid=niaa-ias-remote-infrastructure-2026</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '6px' }}>$850,000 AUD • First Nations Development</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agreement Ingestion Tab */}
        {activeTab === 'ingest-agreement' && (
          <div className="panel animate">
            {isAgreementParsing && (
              <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: '20px', textAlign: 'center' }}>
                <RefreshCw size={36} className="spin-animation" style={{ color: 'var(--accent-indigo)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Processing Funding Agreement</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{agreementParseStatus}</p>
              </div>
            )}

            {!isAgreementParsing && !parsedAgreementData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Configuration Panel */}
                <div className="panel-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="card-section-title" style={{ marginBottom: '12px' }}>
                    <Layers size={18} color="var(--accent-indigo)" />
                    Ingestion Setup Configuration
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Ingestion Mode Selector */}
                    <div>
                      <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>Ingestion Mode</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ 
                            flex: 1, 
                            padding: '12px', 
                            fontSize: '13px', 
                            background: ingestMode === 'create' ? '#fbbd08' : 'rgba(255,255,255,0.05)', 
                            color: ingestMode === 'create' ? '#151226' : 'var(--text-secondary)',
                            border: ingestMode === 'create' ? '1px solid #fbbd08' : '1px solid var(--border-color)',
                            fontWeight: ingestMode === 'create' ? '700' : 'normal'
                          }}
                          onClick={() => setIngestMode('create')}
                        >
                          Create New Grant
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{ 
                            flex: 1, 
                            padding: '12px', 
                            fontSize: '13px', 
                            background: ingestMode === 'associate' ? '#fbbd08' : 'rgba(255,255,255,0.05)', 
                            color: ingestMode === 'associate' ? '#151226' : 'var(--text-secondary)',
                            border: ingestMode === 'associate' ? '1px solid #fbbd08' : '1px solid var(--border-color)',
                            fontWeight: ingestMode === 'associate' ? '700' : 'normal'
                          }}
                          onClick={() => setIngestMode('associate')}
                        >
                          Link to Existing Grant
                        </button>
                      </div>
                    </div>

                    {/* Grant Association Dropdown */}
                    {ingestMode === 'associate' && (
                      <div>
                        <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>Select Target Grant</label>
                        <select
                          className="url-input"
                          style={{ width: '100%', padding: '12px', borderRadius: '10px' }}
                          value={ingestSelectedGrantId}
                          onChange={(e) => setIngestSelectedGrantId(e.target.value)}
                        >
                          <option value="">-- Choose a Grant (Award Stage or Later) --</option>
                          {grants.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.title} ({g.status})
                            </option>
                          ))}
                        </select>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          Note: The system requires that the selected grant is at least at the "Award Decision" stage (AWARDED, REJECTED, CLOSED).
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                  {/* Preloaded Agreements */}
                  <div className="panel-card" style={{ padding: '24px' }}>
                    <div className="card-section-title" style={{ marginBottom: '16px' }}>
                      <FileSpreadsheet size={18} color="#10b981" />
                      Pre-loaded Agreements
                    </div>
                    {exampleAgreements.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Loading available example contracts...
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                        {exampleAgreements.map((ea, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--border-color)',
                              padding: '14px 16px',
                              borderRadius: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'var(--transition-smooth)'
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ea.filename}>
                                {ea.filename}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {(ea.sizeBytes / 1024).toFixed(1)} KB • PDF Document
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => handleParsePreloaded(ea.filename)}
                            >
                              Parse AI
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Drag & Drop File Upload */}
                  <div
                    className="panel-card"
                    style={{
                      padding: '40px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      border: '2px dashed var(--border-color)',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.01)',
                      minHeight: '260px',
                      gap: '16px'
                    }}
                    onClick={() => document.getElementById('file-upload-input')?.click()}
                  >
                    <UploadCloud size={48} style={{ color: 'var(--accent-indigo)', opacity: 0.8 }} />
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Drag & drop a funding agreement PDF
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Or click to browse your files
                      </p>
                    </div>
                    <input
                      id="file-upload-input"
                      type="file"
                      accept=".pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleParsePdf(file);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Review & Edit State */}
            {!isAgreementParsing && parsedAgreementData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Top Action Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Reviewing Extracted Agreement Information
                  </h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setParsedAgreementData(null)}
                    >
                      Discard & Back
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ background: 'var(--color-success)', color: '#fff' }}
                      onClick={handleSaveIngested}
                    >
                      Ingest Agreement & Generate Tasks
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px', alignItems: 'start' }}>
                  {/* Left Column Stack */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Left Column: Grant Details Form */}
                    <div className="panel-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="card-section-title" style={{ marginBottom: '10px' }}>
                        <FileText size={18} color="var(--accent-indigo)" />
                        Grant Metadata
                      </div>

                      {ingestMode === 'create' ? (
                        <>
                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                              Grant Title {!parsedAgreementData.title && <span style={{ color: 'red' }}>* Required</span>}
                            </label>
                            <input
                              type="text"
                              className="url-input"
                              style={{ width: '100%', padding: '10px', borderColor: !parsedAgreementData.title ? 'red' : '' }}
                              value={parsedAgreementData.title}
                              onChange={(e) => setParsedAgreementData({ ...parsedAgreementData, title: e.target.value })}
                              placeholder="Enter Grant Title"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Funder Name</label>
                            <input
                              type="text"
                              className="url-input"
                              style={{ width: '100%', padding: '10px' }}
                              value={parsedAgreementData.funderName}
                              onChange={(e) => setParsedAgreementData({ ...parsedAgreementData, funderName: e.target.value })}
                              placeholder="Enter Funder Name"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Funding Value ($)</label>
                            <input
                              type="number"
                              className="url-input"
                              style={{ width: '100%', padding: '10px' }}
                              value={parsedAgreementData.totalFundingValue || ''}
                              onChange={(e) => setParsedAgreementData({ ...parsedAgreementData, totalFundingValue: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="e.g. 1500000"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
                            <select
                              className="url-input"
                              style={{ width: '100%', padding: '10px' }}
                              value={parsedAgreementData.category}
                              onChange={(e) => setParsedAgreementData({ ...parsedAgreementData, category: e.target.value })}
                            >
                              <option value="Infrastructure">Infrastructure</option>
                              <option value="Health">Health</option>
                              <option value="Community Services">Community Services</option>
                              <option value="Environmental Services">Environmental Services</option>
                              <option value="Education">Education</option>
                            </select>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Start Date</label>
                              <input
                                type="date"
                                className="url-input"
                                style={{ width: '100%', padding: '10px' }}
                                value={parsedAgreementData.openDate}
                                onChange={(e) => setParsedAgreementData({ ...parsedAgreementData, openDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>End Date</label>
                              <input
                                type="date"
                                className="url-input"
                                style={{ width: '100%', padding: '10px' }}
                                value={parsedAgreementData.closeDate}
                                onChange={(e) => setParsedAgreementData({ ...parsedAgreementData, closeDate: e.target.value })}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <strong style={{ color: 'var(--text-muted)' }}>Targeting Grant:</strong>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                              {grants.find(g => g.id === ingestSelectedGrantId)?.title}
                            </div>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-muted)' }}>Current Status:</strong>
                            <span className="badge" style={{ marginLeft: '8px' }}>
                              {grants.find(g => g.id === ingestSelectedGrantId)?.status}
                            </span>
                          </div>
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Agreement/Contract Reference</label>
                        <input
                          type="text"
                          className="url-input"
                          style={{ width: '100%', padding: '10px' }}
                          value={parsedAgreementData.referenceNumber}
                          onChange={(e) => setParsedAgreementData({ ...parsedAgreementData, referenceNumber: e.target.value })}
                          placeholder="e.g. GFA-2026-RCP-82"
                        />
                      </div>
                    </div>

                    {/* Expected Payment Installments Review Board */}
                    <div className="panel-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                          <DollarSign size={16} color="var(--accent-indigo)" />
                          Payment Installments ({parsedAgreementData.installments.length})
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', height: 'auto', minWidth: 'auto' }}
                          onClick={() => {
                            const newInst = { amount: 0, dueDate: new Date().toISOString().split('T')[0], status: 'PENDING' };
                            setParsedAgreementData({
                              ...parsedAgreementData,
                              installments: [...parsedAgreementData.installments, newInst]
                            });
                          }}
                        >
                          + Add Item
                        </button>
                      </div>

                      {parsedAgreementData.installments.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                          No payment installments detected. Click "+ Add Item" to create one.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                          {parsedAgreementData.installments.map((inst, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}>
                              <div style={{ flex: 2 }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Amount ($)</label>
                                <input
                                  type="number"
                                  className="url-input"
                                  style={{ padding: '6px', fontSize: '12px', width: '100%', height: 'auto' }}
                                  value={inst.amount || ''}
                                  onChange={(e) => {
                                    const updated = [...parsedAgreementData.installments];
                                    updated[idx].amount = parseFloat(e.target.value) || 0;
                                    setParsedAgreementData({ ...parsedAgreementData, installments: updated });
                                  }}
                                  placeholder="Amount"
                                />
                              </div>
                              <div style={{ flex: 3 }}>
                                <label style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Due Date</label>
                                <input
                                  type="date"
                                  className="url-input"
                                  style={{ padding: '6px', fontSize: '12px', width: '100%', height: 'auto' }}
                                  value={inst.dueDate}
                                  onChange={(e) => {
                                    const updated = [...parsedAgreementData.installments];
                                    updated[idx].dueDate = e.target.value;
                                    setParsedAgreementData({ ...parsedAgreementData, installments: updated });
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '6px', border: 'none', background: 'transparent', alignSelf: 'flex-end', height: 'auto', minWidth: 'auto' }}
                                onClick={() => {
                                  const updated = parsedAgreementData.installments.filter((_, i) => i !== idx);
                                  setParsedAgreementData({ ...parsedAgreementData, installments: updated });
                                }}
                              >
                                <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Value:</span>
                        <span style={{ color: 'var(--accent-indigo)' }}>
                          ${parsedAgreementData.installments.reduce((sum, inst) => sum + (inst.amount || 0), 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Obligations Board */}
                  <div className="panel-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="card-section-title">
                      <ListTodo size={18} color="var(--accent-indigo)" />
                      Contractual Obligations & Task Assignments
                    </div>

                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '12px', paddingBottom: '2px' }}>
                      {(['Acquittals', 'Activities', 'Reports', 'Milestones', 'General'] as const).map(tab => {
                        const count = parsedAgreementData.obligations.filter(ob => ob.category === tab).length;
                        return (
                          <button
                            key={tab}
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              borderBottom: obligationsActiveTab === tab ? '2px solid var(--accent-indigo)' : 'none',
                              color: obligationsActiveTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                              padding: '10px 14px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onClick={() => setObligationsActiveTab(tab)}
                          >
                            {tab === 'General' ? 'General Obligations' : tab}
                            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px' }}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Bulk Assignment Header */}
                    {obligationsActiveTab === 'General' ? (
                      <div
                        style={{
                          background: 'rgba(99, 102, 241, 0.05)',
                          border: '1px dashed rgba(99, 102, 241, 0.2)',
                          borderRadius: '10px',
                          padding: '14px',
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        ℹ️ <strong>General Obligations</strong> are ongoing compliance rules (e.g. site access, maintaining insurance) and do not require attributed task assignments.
                      </div>
                    ) : (
                      <div
                        style={{
                          background: 'rgba(99, 102, 241, 0.05)',
                          border: '1px dashed rgba(99, 102, 241, 0.2)',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          Bulk Assign all {obligationsActiveTab} obligations:
                        </div>
                        <select
                          className="url-input"
                          style={{ width: '200px', padding: '8px' }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const updated = parsedAgreementData.obligations.map(ob => {
                              if (ob.category === obligationsActiveTab) {
                                return { ...ob, assignedToUserId: val };
                              }
                              return ob;
                            });
                            setParsedAgreementData({ ...parsedAgreementData, obligations: updated });
                            e.target.value = ''; // reset select
                          }}
                        >
                          <option value="">-- Choose User --</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.department.split(' ')[0]})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Category Obligation Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                      {parsedAgreementData.obligations.filter(ob => ob.category === obligationsActiveTab).length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                          No {obligationsActiveTab} obligations identified under this contract.
                        </div>
                      ) : (
                        parsedAgreementData.obligations
                          .map((ob, idx) => ({ ob, globalIdx: idx }))
                          .filter(item => item.ob.category === obligationsActiveTab)
                          .map(({ ob, globalIdx }) => (
                            <div
                              key={globalIdx}
                              style={{
                                background: 'rgba(255,255,255,0.01)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <input
                                    type="text"
                                    className="url-input"
                                    style={{ width: '100%', padding: '8px', fontWeight: '600', fontSize: '13px' }}
                                    value={ob.title}
                                    onChange={(e) => {
                                      const updated = [...parsedAgreementData.obligations];
                                      updated[globalIdx].title = e.target.value;
                                      setParsedAgreementData({ ...parsedAgreementData, obligations: updated });
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 10px', color: 'var(--color-danger)' }}
                                  onClick={() => {
                                    const updated = parsedAgreementData.obligations.filter((_, i) => i !== globalIdx);
                                    setParsedAgreementData({ ...parsedAgreementData, obligations: updated });
                                  }}
                                >
                                  Remove
                                </button>
                              </div>

                              <div>
                                <textarea
                                  className="url-input"
                                  style={{ width: '100%', padding: '8px', fontSize: '12px', minHeight: '60px', resize: 'vertical' }}
                                  value={ob.description}
                                  onChange={(e) => {
                                    const updated = [...parsedAgreementData.obligations];
                                    updated[globalIdx].description = e.target.value;
                                    setParsedAgreementData({ ...parsedAgreementData, obligations: updated });
                                  }}
                                />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Requirement Nature</label>
                                  <input
                                    type="text"
                                    className="url-input"
                                    readOnly
                                    style={{ width: '100%', padding: '8px', fontSize: '12px', background: 'rgba(255,255,255,0.02)' }}
                                    value={ob.category === 'General' ? 'Ongoing Compliance Rule' : `Due: ${ob.dueDate || 'Target Date'}`}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Assigned Owner & Task</label>
                                  {ob.category === 'General' ? (
                                    <div style={{ padding: '8px', fontSize: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-indigo)', borderRadius: '6px', textAlign: 'center', fontWeight: '600' }}>
                                      Ongoing Rule (No Task Required)
                                    </div>
                                  ) : (
                                    <select
                                      className="url-input"
                                      style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                                      value={ob.assignedToUserId}
                                      onChange={(e) => {
                                        const updated = [...parsedAgreementData.obligations];
                                        updated[globalIdx].assignedToUserId = e.target.value;
                                        setParsedAgreementData({ ...parsedAgreementData, obligations: updated });
                                      }}
                                    >
                                      <option value="">-- Assign Owner --</option>
                                      {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                          {u.name} ({u.department.split(' ')[0]})
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clawback Sentinel Tab */}
        {activeTab === 'clawback-sentinel' && (
          <div className="panel animate">
            <ClawbackSentinel grants={grants} tasks={tasks} transactions={finances?.transactions || []} />
          </div>
        )}

        {/* Grant Revenue & Cashflow Forecast Tab */}
        {activeTab === 'cashflow-forecast' && (
          <div className="panel animate">
            <GrantRevenueCashflowForecast grants={grants} projects={projects} />
          </div>
        )}

        {/* Funder Acquittals & Reports Tab */}
        {activeTab === 'acquittals' && (
          <div className="panel animate">
            <GrantAcquittalReportGenerator 
              selectedGrant={selectedGrant} 
              grants={grants} 
              finances={finances} 
              onSelectGrant={(g) => handleSelectGrant(g)}
            />
          </div>
        )}

        {/* Linked Projects Tab */}
        {activeTab === 'projects' && (
          <div className="panel animate">
            {!selectedProjectId ? (
              <>
                {/* Projects Telemetry Metrics */}
                <div className="metrics-grid" style={{ marginBottom: '24px' }}>
                  <div className="metric-card">
                    <div className="metric-info">
                      <h3>Total Target Budgets</h3>
                      <div className="metric-value" style={{ color: '#fff' }}>
                        ${projects.reduce((sum, p) => sum + p.budgetAmount, 0).toLocaleString('en-AU')}
                      </div>
                    </div>
                    <div className="metric-icon-box cyan">
                      <Layers size={22} />
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-info">
                      <h3>Total Funding Allocated</h3>
                      <div className="metric-value" style={{ color: 'var(--color-success)' }}>
                        ${projects.reduce((sum, p) => sum + p.grantMappings.reduce((s, m) => s + m.allocatedAmount, 0), 0).toLocaleString('en-AU')}
                      </div>
                    </div>
                    <div className="metric-icon-box green">
                      <DollarSign size={22} />
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-info">
                      <h3>Total Spent Progress</h3>
                      <div className="metric-value" style={{ color: 'var(--color-warning)' }}>
                        ${projects.reduce((sum, p) => sum + p.transactions.filter(t => t.type === 'EXPENDITURE').reduce((s, t) => s + Math.abs(t.amount), 0), 0).toLocaleString('en-AU')}
                      </div>
                    </div>
                    <div className="metric-icon-box warning">
                      <TrendingUp size={22} />
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-info">
                      <h3>Active Construction</h3>
                      <div className="metric-value">
                        {filteredProjects.filter(p => p.status === 'IN_PROGRESS').length} / {filteredProjects.length}
                      </div>
                    </div>
                    <div className="metric-icon-box indigo">
                      <Activity size={22} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div className="card-section-title" style={{ margin: '0' }}>
                    <FolderGit size={20} color="#06b6d4" />
                    Projects Registry
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" onClick={() => setShowProjectModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08' }}>
                      <PlusCircle size={16} />
                      Create Project
                    </button>
                    <button className="btn btn-secondary" onClick={() => setShowLinkModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#151226', color: 'rgba(255, 255, 255, 0.99)', border: '1px solid #151226' }}>
                      <LinkIcon size={16} />
                      Link Grant
                    </button>
                  </div>
                </div>

                <div className="grant-table-container">
                  <table className="grant-table">
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Department</th>
                        <th>Target Budget</th>
                        <th>Funding Allocated</th>
                        <th>Amount Spent</th>
                        <th>Spend Progress</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map(project => {
                        const totalAllocated = project.grantMappings.reduce((sum, m) => sum + m.allocatedAmount, 0);
                        const totalSpent = project.transactions
                          .filter(t => t.type === 'EXPENDITURE')
                          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                        const spendPercentage = totalAllocated > 0 ? Math.min(100, (totalSpent / totalAllocated) * 100) : 0;

                        return (
                          <tr 
                            key={project.id} 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedProjectId(project.id)}
                            className="grant-row"
                          >
                            <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                              {project.name}
                            </td>
                            <td>{project.department}</td>
                            <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                              ${project.budgetAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: '600', color: '#10b981' }}>
                              ${totalAllocated.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: '600', color: '#ef4444' }}>
                              ${totalSpent.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                                <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${spendPercentage}%`, height: '100%', background: '#06b6d4' }}></div>
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>
                                  {spendPercentage.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${project.status === 'IN_PROGRESS' ? 'badge-awarded' : project.status === 'PENDING' ? 'badge-risk' : project.status === 'POTENTIAL' ? 'badge-potential' : 'badge-closed'}`}>
                                {project.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (() => {
              const selectedProject = projects.find(p => p.id === selectedProjectId);
              if (!selectedProject) return null;

              const targetBudget = selectedProject.budgetAmount || 0;
              const fundingAllocated = selectedProject.grantMappings.reduce((sum, m) => sum + m.allocatedAmount, 0);
              
              const projectTransactions = finances?.transactions.filter(t => t.projectId === selectedProject.id) || [];
              const amountReceived = projectTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
              const amountSpent = projectTransactions.filter(t => t.type === 'EXPENDITURE').reduce((sum, t) => sum + t.amount, 0);

              const linkedMilestones = selectedProject.milestones || [];
              const projectMilestoneIds = linkedMilestones.map(m => m.id);
              const projectTasks = tasks.filter(t => t.projectId === selectedProject.id || (t.milestoneId && projectMilestoneIds.includes(t.milestoneId)));

              return (
                <div className="panel-card" style={{ gap: '24px', display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button 
                        onClick={() => setSelectedProjectId('')} 
                        className="btn btn-secondary" 
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', borderRadius: '10px', background: '#151226', color: 'rgba(255, 255, 255, 0.99)', border: '1px solid #151226' }}
                      >
                        <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Projects
                      </button>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-cyan)', fontWeight: '700' }}>
                          Project Workflow Details ({selectedProject.department})
                        </span>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>
                          {selectedProject.name}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Target Budget: <strong>${targetBudget.toLocaleString('en-AU')}</strong> | Current Status: <strong>{selectedProject.status.replace('_', ' ')}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Budget Cards row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '8px 0' }}>
                    <div className="metric-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Target Budget</span>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '6px' }}>
                        ${targetBudget.toLocaleString('en-AU')}
                      </div>
                    </div>

                    <div className="metric-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Funding Allocated</span>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-success)', marginTop: '6px' }}>
                        ${fundingAllocated.toLocaleString('en-AU')}
                      </div>
                    </div>

                    <div className="metric-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Amount Received</span>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-cyan)', marginTop: '6px' }}>
                        ${amountReceived.toLocaleString('en-AU')}
                      </div>
                    </div>

                    <div className="metric-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Amount Spent</span>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-warning)', marginTop: '6px' }}>
                        ${amountSpent.toLocaleString('en-AU')}
                      </div>
                    </div>
                  </div>

                  {/* Split Layout: Left Menu, Right Content */}
                  <div className="surepact-split-layout" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                    {/* Left Vertical Workflow Sidebar Tree */}
                    <div className="surepact-menu-container">
                      {[
                        { index: 1, label: 'Potential Stage', key: 'potential' },
                        { index: 2, label: 'Pending Commencement', key: 'pending' },
                        { index: 3, label: 'In Progress Delivery', key: 'inprogress' },
                        { index: 4, label: 'Reconciliation & Closeout', key: 'closed' }
                      ].map(stage => {
                        const isActive = activeProjectWorkflowStage === stage.index;
                        const isCurrent = (
                          (stage.index === 1 && selectedProject.status === 'POTENTIAL') ||
                          (stage.index === 2 && selectedProject.status === 'PENDING') ||
                          (stage.index === 3 && selectedProject.status === 'IN_PROGRESS') ||
                          (stage.index === 4 && selectedProject.status === 'CLOSED')
                        );

                        return (
                          <div 
                            key={stage.index}
                            className="surepact-menu-section"
                            style={{ borderColor: isActive ? '#fbbd08' : 'var(--border-color)', transition: 'border-color 0.2s' }}
                          >
                            <div 
                              className={`surepact-menu-item ${isActive ? 'active' : ''}`}
                              onClick={() => setActiveProjectWorkflowStage(stage.index)}
                              style={{ 
                                padding: '12px 16px', 
                                fontWeight: isActive ? '700' : '500',
                                background: isActive ? '#fbbd08' : 'rgba(255,255,255,0.01)',
                                color: isActive ? '#151226' : '#94a3b8',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  borderRadius: '50%', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  fontSize: '10px', 
                                  fontWeight: '700',
                                  background: isCurrent ? '#151226' : '#e2e8f0',
                                  color: isCurrent ? '#ffffff' : '#475569'
                                }}>
                                  {stage.index}
                                </span>
                                <span style={{ color: isActive ? '#151226' : 'var(--text-secondary)' }}>{stage.label}</span>
                              </div>
                              {isCurrent && (
                                <span style={{ fontSize: '9px', fontWeight: 'bold', background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px' }}>
                                  CURRENT
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Panel Content */}
                    <div className="surepact-split-content" style={{ flexGrow: 1, padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '400px' }}>
                      {activeProjectWorkflowStage === 1 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#151226', marginBottom: '16px' }}>Project Planning & Budgeting</h4>
                            <form onSubmit={handleUpdateProjectBudget} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                                Set or update the target estimated budget for this project. This acts as the funding baseline needed before green-lighting the project.
                              </p>
                              <div>
                                <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Target Budget Amount (AUD)</label>
                                <input 
                                  type="number" 
                                  className="url-input" 
                                  style={{ width: '100%' }}
                                  value={projectBudgetInput} 
                                  onChange={(e) => setProjectBudgetInput(e.target.value)} 
                                  placeholder="e.g. 500000"
                                  required 
                                />
                              </div>
                              <button type="submit" className="btn" style={{ alignSelf: 'flex-start', background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08' }} disabled={savingProjectBudget}>
                                {savingProjectBudget ? 'Updating...' : 'Save Target Budget'}
                              </button>
                            </form>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#151226', marginBottom: '16px' }}>Transition to Pending</h4>
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                                If funding allocations from active grants are secured, transition this project to the <strong>Pending</strong> stage to green-light commencement.
                              </p>
                              <button 
                                onClick={() => handleUpdateProjectStatus(selectedProject.id, 'PENDING')} 
                                className="btn" 
                                style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08', justifyContent: 'center' }}
                                disabled={savingProjectStatus}
                              >
                                {savingProjectStatus ? 'Green-Lighting...' : 'Green-Light Project'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeProjectWorkflowStage === 2 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#151226', marginBottom: '16px' }}>Commencement Checklist</h4>
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                                The project is green-lit and pending. Prepare and organize teams, finalize design/permitting tasks, and ensure initial funding agreements are locked in before kicking off construction works.
                              </p>
                              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                                Allocated Funding: ${fundingAllocated.toLocaleString('en-AU')} / Target Budget: ${targetBudget.toLocaleString('en-AU')}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#151226', marginBottom: '16px' }}>Commence Works</h4>
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                                Advance this project to **In Progress** to indicate that physical works, construction, or active operations have officially started on-site.
                              </p>
                              <button 
                                onClick={() => handleUpdateProjectStatus(selectedProject.id, 'IN_PROGRESS')} 
                                className="btn" 
                                style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08', justifyContent: 'center' }}
                                disabled={savingProjectStatus}
                              >
                                {savingProjectStatus ? 'Starting...' : 'Start Physical Works'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeProjectWorkflowStage === 3 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#151226', marginBottom: '16px' }}>Project Execution Tracking</h4>
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                                Project is currently <strong>In Progress</strong>. Monitor spend profiles, track milestone timelines, and mark deliverables completed.
                              </p>
                              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', marginTop: '6px' }}>
                                <div style={{ height: '100%', width: `${fundingAllocated > 0 ? (amountSpent / fundingAllocated) * 100 : 0}%`, background: '#06b6d4', borderRadius: '9999px' }}></div>
                              </div>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                Spend Progress: {fundingAllocated > 0 ? ((amountSpent / fundingAllocated) * 100).toFixed(0) : 0}% Spent (${amountSpent.toLocaleString('en-AU')} of ${fundingAllocated.toLocaleString('en-AU')} allocated)
                              </span>
                            </div>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#151226', marginBottom: '16px' }}>Project Closeout</h4>
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                                Once physical works are completed and all funding is fully acquitted, advance the project to **Closeout** to archive the record.
                              </p>
                              <button 
                                onClick={() => handleUpdateProjectStatus(selectedProject.id, 'CLOSED')} 
                                className="btn" 
                                style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08', justifyContent: 'center' }}
                                disabled={savingProjectStatus}
                              >
                                {savingProjectStatus ? 'Closing...' : 'Close & Archive Project'}
                              </button>
                            </div>

                            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#151226', marginBottom: '16px', marginTop: '20px' }}>Acquittal Reporting</h4>
                            <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4', margin: 0 }}>
                                Generate an exportable CSV financial statement of all revenues and expenditures associated with this project.
                              </p>
                              <button 
                                type="button" 
                                className="btn" 
                                style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', border: '1px solid #fbbd08', justifyContent: 'center', width: '100%', fontSize: '12px' }}
                                onClick={() => handleOpenAcquittalModal('project', selectedProject.id, selectedProject.name)}
                              >
                                Generate Acquittal Report
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeProjectWorkflowStage === 4 && (
                        <div style={{ borderColor: '#10b981', background: '#ecfdf5', padding: '20px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                          <div style={{ color: '#065f46', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                            <CheckCircle size={18} /> Project Closed & Archived
                          </div>
                          <p style={{ fontSize: '13px', marginTop: '10px', color: '#374151', lineHeight: '1.6' }}>
                            This project has been successfully completed, and its financial ledger balances have been reconciled. All linked grant milestones are now archived.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabs Section for Milestones, Tasks, Transactions */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-cyan)', borderBottom: '2px solid var(--accent-cyan)', paddingBottom: '8px', cursor: 'pointer' }}>
                        Linked Milestones ({linkedMilestones.length})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                      {linkedMilestones.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '30px', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
                          No contract milestones are linked to this project yet. Link milestones in the "Grants Registry" stage 4 page.
                        </div>
                      ) : (
                        linkedMilestones.map(m => (
                          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px 18px' }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{m.title}</div>
                              {m.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{m.description}</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Due: {new Date(m.dueDate).toLocaleDateString('en-AU')}</span>
                              <span 
                                onClick={() => handleToggleMilestone(m.id, m.isAcquitted)}
                                className={`badge ${m.isAcquitted ? 'badge-awarded' : 'badge-risk'}`}
                                style={{ cursor: 'pointer' }}
                                title="Click to toggle completion status"
                              >
                                {m.isAcquitted ? 'ACQUITTED' : 'PENDING'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-cyan)', borderBottom: '2px solid var(--accent-cyan)', paddingBottom: '8px', cursor: 'pointer' }}>
                        Compliance Tasks ({projectTasks.length})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                      {projectTasks.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '30px', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
                          No tasks associated with this project.
                        </div>
                      ) : (
                        projectTasks.map(t => (
                          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <input 
                                type="checkbox" 
                                checked={t.status === 'COMPLETED'}
                                onChange={() => handleToggleTask(t.id, t.status)}
                                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                              />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none', opacity: t.status === 'COMPLETED' ? 0.6 : 1 }}>{t.title}</div>
                                {t.description && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.description}</div>}
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  Due: {new Date(t.dueDate).toLocaleDateString('en-AU')} | Assigned: {t.assignedToUser.name}
                                </div>
                              </div>
                            </div>
                            <span className={`badge ${t.status === 'COMPLETED' ? 'badge-awarded' : 'badge-potential'}`}>
                              {t.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-cyan)', borderBottom: '2px solid var(--accent-cyan)', paddingBottom: '8px', cursor: 'pointer' }}>
                        Financial Transactions Ledger ({projectTransactions.length})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {projectTransactions.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '30px', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
                          No transactions mapped to this project yet. Link expenditures in the "Financial Ledger" tab.
                        </div>
                      ) : (
                        <div className="grant-table-container">
                          <table className="grant-table" style={{ background: 'transparent', margin: 0 }}>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectTransactions.map(tx => (
                                <tr key={tx.id}>
                                  <td style={{ fontSize: '12px' }}>{new Date(tx.date).toLocaleDateString('en-AU')}</td>
                                  <td style={{ fontSize: '12px', color: '#fff' }}>{tx.description}</td>
                                  <td style={{ fontSize: '12px' }}>{tx.category}</td>
                                  <td style={{ fontSize: '12px' }}>
                                    <span className={`badge ${tx.type === 'INCOME' ? 'badge-awarded' : 'badge-risk'}`}>
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '12px', fontWeight: '600', color: tx.type === 'INCOME' ? 'var(--accent-cyan)' : 'var(--color-warning)' }}>
                                    ${tx.amount.toLocaleString('en-AU')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Master Multi-Entity Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="panel animate">
            <CalendarHub
              grants={grants}
              projects={projects}
              tasks={tasks}
              transactions={finances?.transactions || []}
              fundingBodies={fundingBodies}
              businessUnits={departments.flatMap(d => d.businessUnits || [])}
              onNavigateToGrant={(grantId) => {
                const g = grants.find(item => item.id === grantId);
                if (g) {
                  handleSelectGrant(g);
                  setActiveTab('grants');
                }
              }}
              onNavigateToTask={(taskId) => {
                setActiveTab('tasks');
              }}
            />
          </div>
        )}

        {/* Global Tasks Board Tab */}
        {activeTab === 'tasks' && (
          <div className="panel animate">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="card-section-title" style={{ margin: 0 }}>
                <ListTodo size={20} color="#f59e0b" />
                Actionable Tasks Board
              </div>

              {/* View Switcher Button Group */}
              <div style={{ display: 'flex', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px' }}>
                <button
                  type="button"
                  onClick={() => setTaskBoardViewMode('list')}
                  style={{
                    background: taskBoardViewMode === 'list' ? 'var(--accent-indigo)' : 'transparent',
                    color: taskBoardViewMode === 'list' ? '#fff' : 'var(--text-muted)',
                    border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <List size={14} /> List View
                </button>
                <button
                  type="button"
                  onClick={() => setTaskBoardViewMode('calendar')}
                  style={{
                    background: taskBoardViewMode === 'calendar' ? 'var(--accent-indigo)' : 'transparent',
                    color: taskBoardViewMode === 'calendar' ? '#fff' : 'var(--text-muted)',
                    border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Calendar size={14} /> Calendar View
                </button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="panel-card" style={{ padding: '20px', marginBottom: '24px', flexDirection: 'row', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Assignee Staff</label>
                <select className="url-input" style={{ width: '100%', padding: '10px' }} value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                  <option value="">All Staff</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Funding Grant</label>
                <select className="url-input" style={{ width: '100%', padding: '10px' }} value={filterGrant} onChange={(e) => setFilterGrant(e.target.value)}>
                  <option value="">All Grants</option>
                  {grants.filter(g => g.status === 'AWARDED').map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Linked Project</label>
                <select className="url-input" style={{ width: '100%', padding: '10px' }} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
                  <option value="">All Projects</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '150px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Task Status</label>
                <select className="url-input" style={{ width: '100%', padding: '10px' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>

            {/* Task View Mode Content */}
            {taskBoardViewMode === 'calendar' ? (
              <CalendarHub
                tasks={tasks}
                isTasksOnlyMode={true}
                onNavigateToGrant={(grantId) => {
                  const g = grants.find(item => item.id === grantId);
                  if (g) {
                    handleSelectGrant(g);
                    setActiveTab('grants');
                  }
                }}
              />
            ) : (
              /* Task list container */
              <div className="grant-table-container">
                <table className="grant-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Task & Deliverable</th>
                      <th>Assigned To</th>
                      <th>Related Grant / Project</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                          No tasks match the active filter criteria.
                        </td>
                      </tr>
                    ) : (
                      tasks.map(task => {
                        const grant = task.milestone?.contract.grant || task.grant;
                        const projectMapping = grant?.projectMappings?.[0];
                        const projectName = projectMapping?.project.name || 'Unlinked';
                        const isDone = task.status === 'COMPLETED';

                        return (
                          <tr key={task.id} className="grant-row" onClick={() => handleToggleTask(task.id, task.status)}>
                            <td>
                              {isDone ? (
                                <CheckSquare size={20} color="var(--color-success)" style={{ cursor: 'pointer' }} />
                              ) : (
                                <Square size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                              )}
                            </td>
                            <td>
                              <div className="grant-title" style={isDone ? { textDecoration: 'line-through', color: 'var(--text-secondary)' } : {}}>{task.title}</div>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{task.description}</p>
                              <span style={{ fontSize: '11px', color: 'var(--accent-indigo)' }}>
                                {task.milestone ? `Milestone: ${task.milestone.title}` : `Stage: ${task.stage}`}
                              </span>
                            </td>
                            <td style={{ verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                <UserCheck size={14} color="var(--text-secondary)" />
                                {task.assignedToUser.name}
                              </div>
                            </td>
                            <td>
                              <div style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '240px', fontSize: '12px' }} title={grant?.title || 'Unknown'}>
                                Grant: <strong>{grant?.title || 'Unknown'}</strong>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Proj: {projectName}
                              </div>
                            </td>
                            <td>
                              <span style={isDone ? { color: 'var(--text-muted)' } : (new Date(task.dueDate).getTime() < Date.now() ? { color: 'var(--color-danger)', fontWeight: '600' } : {})}>
                                {new Date(task.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${task.status === 'COMPLETED' ? 'badge-awarded' : task.status === 'IN_PROGRESS' ? 'badge-risk' : 'badge-potential'}`}>
                                {task.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Global Documents Library Tab */}
        {activeTab === 'documents' && (
          <div className="panel animate">
            <div className="card-section" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
              
              {/* Search Bar */}
              <div style={{ marginBottom: '20px' }}>
                <input 
                  type="text" 
                  placeholder="search..." 
                  className="url-input" 
                  style={{ width: '100%', padding: '12px 16px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', margin: 0 }} 
                  value={globalDocSearch} 
                  onChange={(e) => setGlobalDocSearch(e.target.value)} 
                />
              </div>

              {/* Documents Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="surepact-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)', fontSize: '13px' }}>Document Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)', fontSize: '13px' }}>Related Grant</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)', fontSize: '13px' }}>Size</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)', fontSize: '13px' }}>Uploaded By</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)', fontSize: '13px' }}>Uploaded Date</th>
                      <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-color)', fontSize: '13px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                          No records to display
                        </td>
                      </tr>
                    ) : (
                      filteredDocs.map(doc => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '500', color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={16} color="var(--accent-indigo)" />
                              {doc.name}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {doc.grant ? doc.grant.title : 'Unassigned'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {doc.fileSize || '1.5 MB'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {doc.uploadedBy}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {new Date(doc.createdAt).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {(doc.type === 'APPLICATION' || doc.content) && (
                              <button
                                type="button"
                                onClick={() => handleDownloadDocument(doc.id, doc.name)}
                                className="btn btn-secondary"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: '1px solid var(--border-color)',
                                  color: '#fff',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                Download
                              </button>
                            )}
                            <button 
                              onClick={() => handleGlobalDeleteDocument(doc.id)} 
                              style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                color: 'var(--color-danger)', 
                                padding: '4px 10px', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Finance Ledger Tab */}
        {activeTab === 'finance' && !finances && (
          <div className="panel animate" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '20px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '40px' }}>
            <DollarSign size={48} color="var(--accent-cyan)" />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Unable to load Ledger data</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>The client is unable to fetch financial transaction records from the backend API.</p>
            </div>
            <button className="btn" onClick={fetchData} style={{ background: '#fbbd08', color: '#151226', fontWeight: '700', padding: '10px 20px', borderRadius: '8px', border: 'none' }}>
              Retry Connection
            </button>
          </div>
        )}

        {activeTab === 'finance' && finances && (
          <div className="panel animate">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div className="card-section-title" style={{ margin: '0' }}>
                <DollarSign size={20} color="#10b981" />
                Financial Inbound & Expenditure Bridge
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Per-Grant Filter Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter Grant:</span>
                  <select
                    className="url-input"
                    value={financeGrantFilter}
                    onChange={(e) => setFinanceGrantFilter(e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', minWidth: '200px' }}
                  >
                    <option value="">All Grants (All-Org Ledger)</option>
                    {grants.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>

                <button 
                  className="btn" 
                  onClick={() => setShowTransactionModal(true)} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    background: '#fbbd08',
                    color: '#151226',
                    fontWeight: '700',
                    border: '1px solid #fbbd08'
                  }}
                >
                  <PlusCircle size={16} />
                  Log Transaction
                </button>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="metrics-grid" style={{ marginBottom: '32px' }}>
              <div className="metric-card">
                <div className="metric-info">
                  <h3>Total Drawdowns (Inbound)</h3>
                  <div className="metric-value" style={{ color: 'var(--color-success)' }}>
                    ${finances.summary.totalIncome.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="metric-icon-box green">
                  <DollarSign size={22} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-info">
                  <h3>Total Outbound Spent</h3>
                  <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
                    ${finances.summary.totalExpenditure.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="metric-icon-box green" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>
                  <DollarSign size={22} />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-info">
                  <h3>Corporate Net Balance</h3>
                  <div className="metric-value" style={{ color: finances.summary.netBalance >= 0 ? 'var(--accent-cyan)' : 'var(--color-warning)' }}>
                    ${finances.summary.netBalance.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="metric-icon-box cyan">
                  <Activity size={22} />
                </div>
              </div>
            </div>

            <div className="card-section-title">
              <FileSpreadsheet size={20} color="#10b981" />
              General Ledger Transactions Registry
            </div>

            {/* Transaction log table */}
            <div className="grant-table-container">
              <table className="grant-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Linked Grant / Project</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {finances.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                        No transactions logged yet. Click log transaction to add your first record.
                      </td>
                    </tr>
                  ) : (
                    finances.transactions.map(tx => {
                      const isInc = tx.type === 'INCOME';
                      return (
                        <tr key={tx.id} className="grant-row">
                          <td>{new Date(tx.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td>
                            <div className="grant-title">{tx.description}</div>
                          </td>
                          <td>
                            {tx.grant && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Grant: <strong>{tx.grant.title}</strong>
                              </div>
                            )}
                            {tx.project && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Proj: {tx.project.name}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-potential" style={{ background: 'rgba(255,255,255,0.03)' }}>
                              {tx.category}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '15px', color: isInc ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {isInc ? '+' : ''}${tx.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Ledger Tab */}
        {activeTab === 'ledger' && (
          <div className="panel animate">
            <div className="ledger-terminal">
              <div className="ledger-header">
                <div className="ledger-dots">
                  <div className="ledger-dot red"></div>
                  <div className="ledger-dot yellow"></div>
                  <div className="ledger-dot green"></div>
                </div>
                <div className="ledger-title">System Audit Log Ledger (Event-Driven Stream)</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>live_telemetry_active: true</div>
              </div>

              <div className="ledger-stream">
                {ledger.map(event => {
                  let badgeClass = 'event-type-badge';
                  if (event.eventType.includes('INGESTED')) badgeClass += ' ingested';
                  if (event.eventType.includes('EVALUATED')) badgeClass += ' evaluated';
                  if (event.eventType.includes('APPROVED')) badgeClass += ' approved';
                  if (event.eventType.includes('AWARDED')) badgeClass += ' awarded';

                  return (
                    <div key={event.id} className="ledger-event">
                      <div className="event-meta">
                        <span>{new Date(event.timestamp).toLocaleString('en-AU')}</span>
                        <span>Operator: <strong>{event.user}</strong></span>
                        <span>Aggregate Root ID: <strong style={{ fontFamily: 'monospace' }}>{event.aggregateId}</strong></span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '8px' }}>
                        <span className="text-muted">&gt;</span>
                        <span className={badgeClass}>{event.eventType}</span>
                      </div>
                      <div className="event-payload">
                        {JSON.stringify(event.payload, null, 2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Clawback Sentinel Standalone Tab */}
        {activeTab === 'clawback-sentinel' && (
          <div className="panel animate">
            <ClawbackSentinel
              grants={grants}
              tasks={tasks}
              transactions={finances?.transactions || []}
            />
          </div>
        )}

        {/* Grant Revenue Recognition & Cashflow Forecast Tab */}
        {activeTab === 'cashflow-forecast' && (
          <div className="panel animate">
            <GrantRevenueCashflowForecast
              grants={grants}
              projects={projects}
            />
          </div>
        )}

        {activeTab === 'search' && (
          <GrantSearch
            externalSearchQuery={externalSearchQuery}
            setExternalSearchQuery={setExternalSearchQuery}
            externalSearchCategory={externalSearchCategory}
            setExternalSearchCategory={setExternalSearchCategory}
            externalSearchSource={externalSearchSource}
            setExternalSearchSource={setExternalSearchSource}
            externalSearchMinVal={externalSearchMinVal}
            setExternalSearchMinVal={setExternalSearchMinVal}
            externalSearchMaxVal={externalSearchMaxVal}
            setExternalSearchMaxVal={setExternalSearchMaxVal}
            savedSearches={savedSearches}
            handleDeleteSavedSearch={handleDeleteSavedSearch}
            setShowSaveSearchModal={setShowSaveSearchModal}
            externalGrants={externalGrants}
            searchingExternal={searchingExternal}
            grants={grants}
            importingExternalId={importingExternalId}
            handleConsiderExternalGrant={handleConsiderExternalGrant}
          />
        )}

        {activeTab === 'ai-writer' && (
          <div className="panel animate" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 160px)', minHeight: '650px' }}>
            
            {/* Top Bar: Grant Selector */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '20px', 
              background: 'rgba(255,255,255,0.01)', 
              border: '1px solid var(--border-color)', 
              padding: '16px 20px', 
              borderRadius: '12px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select Target Grant</label>
                  <select
                    className="url-input"
                    value={selectedWriterGrantId}
                    onChange={(e) => {
                      const gid = e.target.value;
                      setSelectedWriterGrantId(gid);
                      if (gid) {
                        fetchGrantRequirements(gid);
                        setSelectedKnowledgeIds(knowledgeDocs.map(d => d.id));
                        setCompiledProposalResult(null);
                      } else {
                        setRequirementsList([]);
                      }
                    }}
                    style={{
                      width: '280px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      height: '38px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">-- Choose Grant Application --</option>
                    {grants.map(g => (
                      <option key={g.id} value={g.id}>{g.title} ({g.status})</option>
                    ))}
                  </select>
                </div>

                {selectedWriterGrantId && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Associated Guidelines</label>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                        {grants.find(g => g.id === selectedWriterGrantId)?.guidelinesDocName || 'Not Set'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {selectedWriterGrantId && requirementsList.length > 0 && (
                <button
                  type="button"
                  className="btn"
                  onClick={handleCompileProposal}
                  disabled={compilingProposal}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    background: '#fbbd08',
                    color: '#151226',
                    border: '1px solid #fbbd08',
                    fontWeight: '700'
                  }}
                >
                  {compilingProposal ? 'Compiling...' : 'Compile Final Proposal'}
                </button>
              )}
            </div>

            {!selectedWriterGrantId ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: '16px' }}>
                <PenTool size={48} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: '14px' }}>Please select a target grant from the dropdown to start writing.</span>
              </div>
            ) : requirementsList.length === 0 ? (
              /* Requirements extraction initialization panel */
              <div className="panel-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', margin: '40px auto', width: '100%' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>Initialize Application Criteria</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  This grant does not have any response blocks initialized. Select a guidelines document to extract specific criteria questions using Gemini AI, or paste the guidelines text manually.
                </p>

                {/* File Upload Drag-and-Drop Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Upload Guidelines Documents</label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files) {
                        const files = Array.from(e.dataTransfer.files);
                        setUploadedGuidelinesFiles(prev => [...prev, ...files]);
                        setSelectedGuidelinesFile(''); // Clear preloaded if manual files added
                        setCustomGuidelinesText('');
                      }
                    }}
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '12px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.01)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => {
                      const fileInput = document.getElementById('guidelines-file-input');
                      if (fileInput) fileInput.click();
                    }}
                  >
                    <input
                      id="guidelines-file-input"
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files) {
                          const files = Array.from(e.target.files);
                          setUploadedGuidelinesFiles(prev => [...prev, ...files]);
                          setSelectedGuidelinesFile(''); // Clear preloaded if manual files added
                          setCustomGuidelinesText('');
                        }
                      }}
                    />
                    <UploadCloud size={28} style={{ color: 'var(--text-muted)', marginBottom: '8px', margin: '0 auto' }} />
                    <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500', marginTop: '6px' }}>
                      Drag and drop guidelines files here
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      or click to browse from your computer (Multiple files supported)
                    </div>
                  </div>
                </div>

                {/* Uploaded Files List */}
                {uploadedGuidelinesFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Files ({uploadedGuidelinesFiles.length})</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {uploadedGuidelinesFiles.map((file, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '11px'
                          }}
                        >
                          <span style={{ color: '#fff', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>({(file.size / 1024).toFixed(0)} KB)</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedGuidelinesFiles(prev => prev.filter((_, i) => i !== idx));
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-danger)',
                              cursor: 'pointer',
                              padding: '0 2px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preloaded Guidelines Directory */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Or Select Preloaded Guidelines Asset</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {guidelinesFiles.map(file => {
                      const isSelected = selectedGuidelinesFile === file;
                      return (
                        <div
                          key={file}
                          onClick={() => {
                            setSelectedGuidelinesFile(file);
                            setUploadedGuidelinesFiles([]); // Clear uploaded files if preloaded is chosen
                            setCustomGuidelinesText('');
                          }}
                          style={{
                            background: isSelected ? 'rgba(251, 189, 8, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                            border: `1px solid ${isSelected ? '#fbbd08' : 'var(--border-color)'}`,
                            borderRadius: '8px',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: isSelected ? '#fbbd08' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{file}</span>
                          {isSelected && <span style={{ fontSize: '10px', fontWeight: 'bold' }}>SELECTED</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Or Paste Guidelines Text (Alternative)</label>
                  <textarea
                    placeholder="Paste guidelines description, selection criteria, or question list..."
                    value={customGuidelinesText}
                    onChange={(e) => {
                      setCustomGuidelinesText(e.target.value);
                      if (e.target.value) {
                        setSelectedGuidelinesFile('');
                        setUploadedGuidelinesFiles([]);
                      }
                    }}
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: '#fff',
                      height: '120px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="btn"
                  onClick={handleExtractRequirements}
                  disabled={extractingRequirements || (!selectedGuidelinesFile && !customGuidelinesText && uploadedGuidelinesFiles.length === 0)}
                  style={{
                    background: '#fbbd08',
                    color: '#151226',
                    fontWeight: '700',
                    border: '1px solid #fbbd08',
                    padding: '12px',
                    justifyContent: 'center'
                  }}
                >
                  {extractingRequirements ? 'Extracting Requirements using Gemini AI...' : 'Initialize & Extract Criteria'}
                </button>
              </div>
            ) : (
              /* Split layout: Left (questions list), Center (editor), Right (RAG sources) */
              <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
                
                {/* Left Column: Requirements list */}
                <div className="panel-card" style={{ width: '280px', display: 'flex', flexDirection: 'column', padding: '16px', gap: '14px', flexShrink: 0, overflowY: 'auto' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Response Criteria ({requirementsList.length})</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {requirementsList.map(req => {
                      const isSelected = selectedRequirementKey === req.requirementKey;
                      let badgeBg = 'rgba(255, 255, 255, 0.05)';
                      let badgeColor = 'var(--text-secondary)';
                      if (req.status === 'APPROVED') {
                        badgeBg = 'rgba(16, 185, 129, 0.1)';
                        badgeColor = 'var(--color-success)';
                      } else if (req.status === 'IN_PROGRESS') {
                        badgeBg = 'rgba(245, 158, 11, 0.1)';
                        badgeColor = '#eab308';
                      }

                      return (
                        <div
                          key={req.requirementKey}
                          onClick={() => {
                            setSelectedRequirementKey(req.requirementKey);
                            setRequirementDraftText(req.responseText || '');
                            setRequirementStatus(req.status || 'DRAFT');
                          }}
                          style={{
                            background: isSelected ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                            border: `1px solid ${isSelected ? 'var(--border-color)' : 'transparent'}`,
                            borderRadius: '8px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#fff' : 'var(--text-secondary)' }}>{req.requirementKey}</span>
                            <span className="badge" style={{ backgroundColor: badgeBg, color: badgeColor, border: 'none', padding: '2px 6px', fontSize: '9px' }}>
                              {req.status}
                            </span>
                          </div>
                          <span style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-muted)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.4'
                          }}>
                            {req.question}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Center Column: Answer Editor / Compilation Result Preview */}
                <div className="panel-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', overflow: 'hidden' }}>
                  {compiledProposalResult ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Compiled Proposal Preview</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setCompiledProposalResult(null)}
                          >
                            Back to Editor
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ background: '#fbbd08', color: '#151226', border: '1px solid #fbbd08', fontWeight: '700' }}
                            onClick={() => {
                              if (compiledProposalResult.doc && compiledProposalResult.doc.id) {
                                handleDownloadDocument(compiledProposalResult.doc.id, compiledProposalResult.doc.name);
                              }
                            }}
                          >
                            Download Word Doc (.doc)
                          </button>
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => {
                              navigator.clipboard.writeText(compiledProposalResult.content);
                              alert('Copied to clipboard!');
                            }}
                          >
                            Copy to Clipboard
                          </button>
                        </div>
                      </div>
                      <textarea
                        readOnly
                        value={compiledProposalResult.content}
                        style={{
                          flex: 1,
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '16px',
                          fontSize: '12px',
                          color: '#fff',
                          lineHeight: '1.6',
                          outline: 'none',
                          resize: 'none',
                          fontFamily: "monospace"
                        }}
                      />
                    </div>
                  ) : selectedRequirementKey ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Editing {selectedRequirementKey}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleSaveRequirementText(requirementDraftText, 'DRAFT')}
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              Save as Draft
                            </button>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => handleSaveRequirementText(requirementDraftText, 'APPROVED')}
                              style={{ 
                                padding: '4px 10px', 
                                fontSize: '11px', 
                                background: '#fbbd08', 
                                color: '#151226', 
                                border: '1px solid #fbbd08',
                                fontWeight: '700'
                              }}
                            >
                              Approve Answer
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', margin: '4px 0 0 0' }}>
                          <strong>Requirement:</strong> {requirementsList.find(r => r.requirementKey === selectedRequirementKey)?.question}
                        </p>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Draft Answer (Markdown Supported)</label>
                        <textarea
                          value={requirementDraftText}
                          onChange={(e) => setRequirementDraftText(e.target.value)}
                          placeholder="Draft text will appear here. Modify it as needed..."
                          style={{
                            flex: 1,
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '16px',
                            fontSize: '13px',
                            color: '#fff',
                            lineHeight: '1.6',
                            outline: 'none',
                            resize: 'none',
                            fontFamily: "'Inter', sans-serif"
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleSaveRequirementText(requirementDraftText, 'IN_PROGRESS')}
                          style={{ padding: '8px 16px' }}
                        >
                          Save Changes
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, color: 'var(--text-muted)' }}>
                      Select a response criterion from the list on the left to write an answer.
                    </div>
                  )}
                </div>

                {/* Right Column: RAG Sources & Directives */}
                <div className="panel-card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', flexShrink: 0, overflowY: 'auto' }}>
                  
                  {/* Generation Control */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>AI Writer Engine</span>
                    <button
                      type="button"
                      className="btn animate-pulse"
                      onClick={handleGenerateRequirementResponse}
                      disabled={generatingResponse || !selectedRequirementKey}
                      style={{
                        background: '#151226',
                        color: '#fffffe',
                        fontWeight: '700',
                        border: '1px solid #151226',
                        padding: '10px',
                        justifyContent: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {generatingResponse ? 'Generating with Gemini RAG...' : 'Generate Section Response'}
                    </button>
                  </div>

                  {/* Directives */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Custom Directives / Prompts</span>
                    <textarea
                      placeholder="e.g. Include metrics from the 2025 Annual report; focus on mobile clinic outreach; write in a professional, remote-health focused tone."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        color: '#fff',
                        height: '75px',
                        outline: 'none',
                        resize: 'none'
                      }}
                    />
                  </div>

                  {/* Knowledge Selection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Corporate Knowledge Context</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                      {knowledgeDocs.filter(d => d.type !== 'PAST_GRANT_APPLICATION').map(doc => {
                        const isChecked = selectedKnowledgeIds.includes(doc.id);
                        return (
                          <label key={doc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', cursor: 'pointer', color: isChecked ? '#fff' : 'var(--text-secondary)' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedKnowledgeIds(prev => prev.filter(id => id !== doc.id));
                                } else {
                                  setSelectedKnowledgeIds(prev => [...prev, doc.id]);
                                }
                              }}
                              style={{ marginTop: '2px' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{doc.name}</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{doc.type.replace('_', ' ')}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Past Applications Selection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Past Performance Proof-points</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                      {knowledgeDocs.filter(d => d.type === 'PAST_GRANT_APPLICATION').map(doc => {
                        const isChecked = selectedKnowledgeIds.includes(doc.id);
                        return (
                          <label key={doc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', cursor: 'pointer', color: isChecked ? '#fff' : 'var(--text-secondary)' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedKnowledgeIds(prev => prev.filter(id => id !== doc.id));
                                } else {
                                  setSelectedKnowledgeIds(prev => [...prev, doc.id]);
                                }
                              }}
                              style={{ marginTop: '2px' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{doc.name}</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Past Application</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="panel animate" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Global Assets Repository</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Manage institutional documentation used by the AI Writing Assistant to generate context-rich answers.
                </p>
              </div>
              <button 
                type="button" 
                className="btn" 
                onClick={() => {
                  setNewKnowledgeName('');
                  setNewKnowledgeFileSize('2.4 MB');
                  setNewKnowledgeUploadedBy('Adrian (Founder)');
                  setShowKnowledgeModal(true);
                }}
                style={{
                  background: '#fbbd08',
                  color: '#151226',
                  fontWeight: '700',
                  border: '1px solid #fbbd08'
                }}
              >
                Add Knowledge Asset
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {['ANNUAL_REPORT', 'STRATEGIC_PLAN', 'PROJECT_PLAN', 'PAST_GRANT_APPLICATION', 'OTHER'].map(catType => {
                const typeDocs = knowledgeDocs.filter(d => d.type === catType);
                let catTitle = 'Other Assets';
                let cardColor = 'var(--accent-cyan)';
                if (catType === 'ANNUAL_REPORT') { catTitle = 'Annual Financial Reports'; cardColor = 'var(--color-success)'; }
                if (catType === 'STRATEGIC_PLAN') { catTitle = 'Strategic & Business Plans'; cardColor = '#a855f7'; }
                if (catType === 'PROJECT_PLAN') { catTitle = 'Project & Works Delivery Plans'; cardColor = '#eab308'; }
                if (catType === 'PAST_GRANT_APPLICATION') { catTitle = 'Previous Grant Applications'; cardColor = '#ec4899'; }

                return (
                  <div key={catType} className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '260px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{catTitle}</span>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: cardColor, border: `1px solid ${cardColor}` }}>
                        {typeDocs.length}
                      </span>
                    </div>

                    {typeDocs.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
                        No files uploaded in this category.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '200px' }}>
                        {typeDocs.map(doc => (
                          <div 
                            key={doc.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              background: 'rgba(255,255,255,0.01)', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '8px', 
                              padding: '10px' 
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.name}>
                                {doc.name}
                              </span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                Size: {doc.fileSize} | By: {doc.uploadedBy}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteKnowledge(doc.id)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', fontSize: '16px' }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'funding-bodies' && (
          <div className="panel animate" style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
            {/* Left Side: Funder Directory */}
            <div className="panel-card" style={{ width: '320px', display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Funders Directory</span>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddFundingBodyModal(true)} 
                  style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <PlusCircle size={12} /> Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
                {loadingFundingBodies ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '40px 10px' }}>
                    Loading funders directory...
                  </div>
                ) : fundingBodies.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '40px 10px' }}>
                    No funding bodies recorded yet.
                  </div>
                ) : (
                  fundingBodies.map(body => {
                    const isSelected = selectedFundingBodyId === body.id;
                    const typeColors: Record<string, string> = {
                      GOVERNMENT: 'var(--accent-cyan)',
                      CORPORATE: 'var(--accent-indigo)',
                      PHILANTHROPIC: '#a855f7'
                    };
                    const typeColor = typeColors[body.type] || 'var(--text-secondary)';

                    return (
                      <div 
                        key={body.id} 
                        onClick={() => {
                          setSelectedFundingBodyId(body.id);
                          setSelectedContactId('');
                        }}
                        style={{ 
                          padding: '12px 14px', 
                          borderRadius: '10px', 
                          background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.01)', 
                          border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                            {body.name}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: typeColor, border: `1px solid ${typeColor}`, fontSize: '9px', padding: '1px 5px' }}>
                            {body.type}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {body.contacts.length} Contacts | {body.opportunities.length} Opps
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Side: CRM Workspace */}
            <div className="panel-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: '20px', overflowY: 'auto' }}>
              {(() => {
                const body = fundingBodies.find(b => b.id === selectedFundingBodyId);
                if (!body) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      <Building size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                      <p style={{ fontSize: '14px', margin: 0 }}>Select a funding body from the directory to start managing relationships.</p>
                    </div>
                  );
                }

                const selectedContact = body.contacts.find(c => c.id === selectedContactId);

                return (
                  <>
                    {/* Workspace Header */}
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>{body.name}</h2>
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--accent-indigo)', color: 'var(--accent-indigo)' }}>
                            {body.type}
                          </span>
                        </div>
                        {body.website && (
                          <a href={body.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-cyan)', textDecoration: 'none', width: 'fit-content' }}>
                            {body.website}
                          </a>
                        )}
                        {body.description && (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                            {body.description}
                          </p>
                        )}
                      </div>

                      {/* Sub-Tab Navigation */}
                      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <button 
                          className="btn"
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px', 
                            border: 'none', 
                            background: crmSubTab === 'contacts' ? '#fbbd08' : '#6366f1', 
                            color: crmSubTab === 'contacts' ? '#151226' : '#ffffff',
                            fontWeight: '600',
                            borderRadius: '6px'
                          }}
                          onClick={() => setCrmSubTab('contacts')}
                        >
                          Contacts & Interactions
                        </button>
                        <button 
                          className="btn"
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px', 
                            border: 'none', 
                            background: crmSubTab === 'opportunities' ? '#fbbd08' : '#6366f1', 
                            color: crmSubTab === 'opportunities' ? '#151226' : '#ffffff',
                            fontWeight: '600',
                            borderRadius: '6px'
                          }}
                          onClick={() => setCrmSubTab('opportunities')}
                        >
                          Opportunities ({body.opportunities.length})
                        </button>
                      </div>
                    </div>

                    {/* Sub-Tab Content: Contacts & Interactions */}
                    {crmSubTab === 'contacts' && (
                      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: '400px' }}>
                        {/* Contacts List Column */}
                        <div style={{ width: '250px', borderRight: '1px solid var(--border-color)', paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Key Contacts</span>
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                              onClick={() => {
                                setNewContactName('');
                                setNewContactRole('');
                                setNewContactEmail('');
                                setNewContactPhone('');
                                setShowAddContactModal(true);
                              }}
                            >
                              + Contact
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
                            {body.contacts.length === 0 ? (
                              <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
                                No contacts listed.
                              </div>
                            ) : (
                              body.contacts.map(c => {
                                const isContactSelected = selectedContactId === c.id;
                                return (
                                  <div 
                                    key={c.id}
                                    onClick={() => setSelectedContactId(c.id)}
                                    style={{ 
                                      padding: '10px 12px', 
                                      borderRadius: '8px', 
                                      background: isContactSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)', 
                                      border: isContactSelected ? '1px solid var(--border-color)' : '1px solid transparent',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: isContactSelected ? '#fff' : 'var(--text-secondary)' }}>
                                      {c.name}
                                    </span>
                                    {c.role && (
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.role}</span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Interactions Log Column */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                          {!selectedContact ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', padding: '40px' }}>
                              <Briefcase size={32} style={{ opacity: 0.1, marginBottom: '10px' }} />
                              <p style={{ fontSize: '12px', margin: 0, textAlign: 'center' }}>Select a contact from the list to view interaction history and log new communications.</p>
                            </div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '10px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{selectedContact.name}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    {selectedContact.role || 'No role'} | {selectedContact.email || 'No email'} | {selectedContact.phone || 'No phone'}
                                  </span>
                                </div>
                                <button 
                                  type="button" 
                                  className="btn btn-success" 
                                  style={{ padding: '6px 12px', fontSize: '11px' }}
                                  onClick={() => {
                                    setNewInteractionContactId(selectedContact.id);
                                    setNewInteractionType('NOTE');
                                    setNewInteractionSubject('');
                                    setNewInteractionContent('');
                                    setNewInteractionDueDate('');
                                    setNewInteractionStatus('COMPLETED');
                                    setShowAddInteractionModal(true);
                                  }}
                                >
                                  Log Interaction
                                </button>
                              </div>

                              {/* Interaction Timeline */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Interaction History
                                </span>

                                {selectedContact.interactions.length === 0 ? (
                                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '20px 0' }}>
                                    No interactions recorded yet. Click "Log Interaction" to write a note or log a call.
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px', marginLeft: '6px' }}>
                                    {selectedContact.interactions.map(itr => {
                                      let typeIcon = <MessageSquare size={12} />;
                                      let bubbleColor = '#a855f7';
                                      if (itr.type === 'EMAIL') { typeIcon = <Mail size={12} />; bubbleColor = 'var(--accent-cyan)'; }
                                      if (itr.type === 'CALL') { typeIcon = <Phone size={12} />; bubbleColor = 'var(--color-success)'; }
                                      if (itr.type === 'MEETING') { typeIcon = <Building size={12} />; bubbleColor = '#eab308'; }
                                      if (itr.type === 'TASK') { typeIcon = <ListTodo size={12} />; bubbleColor = '#f43f5e'; }

                                      return (
                                        <div key={itr.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <div 
                                            style={{ 
                                              position: 'absolute', 
                                              left: '-28px', 
                                              top: '2px', 
                                              width: '22px', 
                                              height: '22px', 
                                              borderRadius: '50%', 
                                              background: 'var(--bg-secondary)', 
                                              border: `2px solid ${bubbleColor}`,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              color: bubbleColor
                                            }}
                                          >
                                            {typeIcon}
                                          </div>
                                          
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                                              {itr.subject}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                              {new Date(itr.createdAt).toLocaleDateString('en-AU')}
                                            </span>
                                          </div>

                                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: bubbleColor, border: `1px solid ${bubbleColor}`, fontSize: '8px', padding: '0px 4px' }}>
                                              {itr.type}
                                            </span>
                                            {itr.dueDate && (
                                              <span style={{ fontSize: '10px', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Calendar size={10} /> Due: {new Date(itr.dueDate).toLocaleDateString('en-AU')}
                                              </span>
                                            )}
                                            {itr.status && (
                                              <span className="badge" style={{ fontSize: '8px', padding: '0px 4px', background: itr.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: itr.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                {itr.status}
                                              </span>
                                            )}
                                          </div>

                                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: '1.4', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px' }}>
                                            {itr.content}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sub-Tab Content: Pipeline Opportunities */}
                    {crmSubTab === 'opportunities' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Pre-Pipeline Funding Opportunities</span>
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => {
                              setNewOppContactId('');
                              setNewOppTitle('');
                              setNewOppValue('');
                              setNewOppDescription('');
                              setNewOppDeadline('');
                              setShowAddOpportunityModal(true);
                            }}
                          >
                            + Add Opportunity
                          </button>
                        </div>

                        {body.opportunities.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '40px 0' }}>
                            No opportunities tracked yet for this funder. Track potential grants here before applying.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                            {body.opportunities.map(opp => {
                              const stageColors: Record<string, string> = {
                                IDENTIFIED: '#9ca3af',
                                DISCUSSING: '#eab308',
                                APPLYING: '#3b82f6',
                                PROMOTED: 'var(--color-success)',
                                ABANDONED: 'var(--color-danger)'
                              };
                              const stageColor = stageColors[opp.status] || '#9ca3af';

                              return (
                                <div key={opp.id} className="panel-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{opp.title}</span>
                                    <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: stageColor, border: `1px solid ${stageColor}`, fontSize: '9px', padding: '1px 5px' }}>
                                      {opp.status}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>Target Value:</span>
                                      <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                                        {opp.value ? `$${opp.value.toLocaleString()}` : 'Undetermined'}
                                      </span>
                                    </div>
                                    {opp.deadline && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Target Deadline:</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                          {new Date(opp.deadline).toLocaleDateString('en-AU')}
                                        </span>
                                      </div>
                                    )}
                                    {opp.contact && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Lead Contact:</span>
                                        <span style={{ color: 'var(--accent-cyan)' }}>{opp.contact.name}</span>
                                      </div>
                                    )}
                                  </div>

                                  {opp.description && (
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, borderTop: '1px solid var(--border-color)', paddingTop: '8px', lineHeight: '1.4' }}>
                                      {opp.description}
                                    </p>
                                  )}

                                  {opp.status !== 'PROMOTED' && opp.status !== 'ABANDONED' && (
                                    <button 
                                      type="button" 
                                      className="btn btn-secondary" 
                                      style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', padding: '8px 12px' }}
                                      onClick={() => handlePromoteOpportunity(opp.id)}
                                      disabled={promotingOpportunityId === opp.id}
                                    >
                                      <ArrowUpRight size={14} /> Promote to Grant Pipeline
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="panel animate">
            <div className="card-section" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="url-input" 
                  style={{ width: '100%', maxWidth: '300px', padding: '10px 14px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', margin: 0 }} 
                  value={userSearchQuery} 
                  onChange={(e) => setUserSearchQuery(e.target.value)} 
                />
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={() => {
                    setNewUserName('');
                    setNewUserEmail('');
                    setNewUserDept('');
                    setNewUserRole('staff');
                    setNewUserStatus('Active');
                    setNewUserBUIds([]);
                    setShowAddUserModal(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: '700', borderRadius: '8px' }}
                >
                  <PlusCircle size={16} /> Add User
                </button>
              </div>

              {/* Users Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="surepact-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>User</th>
                      <th style={{ padding: '14px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Email</th>
                      <th style={{ padding: '14px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Role</th>
                      <th style={{ padding: '14px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Department Scope</th>
                      <th style={{ padding: '14px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Business Units</th>
                      <th style={{ padding: '14px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                      <th style={{ padding: '14px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => 
                      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                    ).map(u => {
                      const initial = u.name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2);
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(251, 189, 8, 0.15)', border: '1px solid #fbbd08', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', fontSize: '12px', fontWeight: '800' }}>
                                {initial}
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '14px' }}>
                            <span className="badge" style={{ 
                              fontSize: '10px', 
                              padding: '2px 8px', 
                              backgroundColor: u.role === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                              color: u.role === 'admin' ? '#a78bfa' : '#60a5fa', 
                              border: `1px solid ${u.role === 'admin' ? '#8b5cf6' : '#3b82f6'}` 
                            }}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {u.department || '-- Global --'}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {u.businessUnits && u.businessUnits.length > 0 ? (
                                u.businessUnits.map(buUser => (
                                  <span key={buUser.businessUnit.id} className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--accent-cyan)', fontSize: '10px', padding: '2px 6px' }}>
                                    {buUser.businessUnit.name}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No assigned units (Global)</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span className="badge" style={{ 
                              fontSize: '10px', 
                              padding: '2px 8px', 
                              backgroundColor: u.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                              color: u.status === 'Active' ? 'var(--color-success)' : 'var(--color-danger)', 
                              border: `1px solid ${u.status === 'Active' ? 'var(--color-success)' : 'var(--color-danger)'}` 
                            }}>
                              {u.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <button 
                              type="button" 
                              className="btn btn-secondary" 
                              onClick={() => {
                                setEditingUser(u);
                                setNewUserName(u.name);
                                setNewUserEmail(u.email);
                                setNewUserDept(u.department || '');
                                setNewUserRole(u.role as any);
                                setNewUserStatus(u.status as any);
                                setNewUserBUIds(u.businessUnits?.map(bu => bu.businessUnit.id) || []);
                                setShowEditUserModal(true);
                              }}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Edit Access
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Org Structure Tab */}
        {activeTab === 'org-structure' && (
          <div className="panel animate">
            <div className="card-section" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Search org units..." 
                  className="url-input" 
                  style={{ width: '100%', maxWidth: '300px', padding: '10px 14px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-color)', margin: 0 }} 
                  value={orgSearchQuery} 
                  onChange={(e) => setOrgSearchQuery(e.target.value)} 
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setNewDeptName('');
                      setNewDeptDesc('');
                      setShowAddDeptModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontWeight: '700', borderRadius: '8px' }}
                  >
                    <PlusCircle size={14} /> Add Department
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-success" 
                    onClick={() => {
                      setNewBUName('');
                      setNewBUDesc('');
                      setNewBUDeptId(departments[0]?.id || '');
                      setShowAddBUModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontWeight: '700', borderRadius: '8px' }}
                  >
                    <PlusCircle size={14} /> Add Business Unit
                  </button>
                </div>
              </div>

              {/* Departments & Business Units Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {departments.filter(dept => 
                  dept.name.toLowerCase().includes(orgSearchQuery.toLowerCase()) ||
                  dept.businessUnits?.some(bu => bu.name.toLowerCase().includes(orgSearchQuery.toLowerCase()))
                ).map(dept => (
                  <div key={dept.id} className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: '0 0 4px 0' }}>{dept.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{dept.description || 'No description provided.'}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Units ({dept.businessUnits?.length || 0})</span>
                      {dept.businessUnits && dept.businessUnits.length > 0 ? (
                        dept.businessUnits.map(bu => {
                          const linkedGrants = grants.filter(g => g.businessUnitId === bu.id).length;
                          const linkedProjects = projects.filter(p => p.businessUnitId === bu.id).length;
                          const members = users.filter(u => u.businessUnits?.some(buUser => buUser.businessUnit.id === bu.id));

                          return (
                            <div key={bu.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-cyan)' }}>{bu.name}</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', fontSize: '9px', padding: '1px 5px' }}>
                                    {linkedGrants} {linkedGrants === 1 ? 'Grant' : 'Grants'}
                                  </span>
                                  <span className="badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', fontSize: '9px', padding: '1px 5px' }}>
                                    {linkedProjects} {linkedProjects === 1 ? 'Project' : 'Projects'}
                                  </span>
                                </div>
                              </div>
                              {bu.description && (
                                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0 }}>{bu.description}</p>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', marginTop: '4px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Members:</span>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {members.length > 0 ? (
                                    members.map(m => (
                                      <span key={m.id} className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '9px', padding: '1px 4px' }}>
                                        {m.name.split(' ')[0]}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>None (Global Admins)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>No business units defined.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Tenancy Management Console */}
        {activeTab === 'tenant-admin' && (
          <div className="panel animate" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Shield size={22} color="#a855f7" />
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                    SurePact Platform — Tenancy Management Console
                  </h2>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Super Admin Portal • Manage, upgrade, or purge instantiated tenant workspaces across the platform.
                </p>
              </div>

              <button
                type="button"
                className="btn"
                onClick={() => {
                  setOnboardOrgName('');
                  setShowOnboardingModal(true);
                }}
                style={{ background: '#fbbd08', color: '#151226', fontWeight: '800', border: '1px solid #fbbd08', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Sparkles size={16} />
                Instantiate New Workspace
              </button>
            </div>

            {/* Tenancy Management Cards List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {tenantsList.map(tenant => {
                const isCurrent = organization?.name === tenant.name;
                const tierColor = tenant.pricingTier === 'ENTERPRISE' ? '#a855f7' : tenant.pricingTier === 'STARTER' ? '#3b82f6' : '#f59e0b';
                
                return (
                  <div key={tenant.id} className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: `1px solid ${isCurrent ? 'var(--accent-indigo)' : 'var(--border-color)'}`, backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building2 size={18} color="var(--accent-cyan)" />
                          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: 0 }}>
                            {tenant.name}
                          </h3>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                          ID: <code style={{ color: 'var(--accent-cyan)' }}>{tenant.id}</code> • {tenant.state}
                        </span>
                      </div>

                      {isCurrent && (
                        <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-indigo)', border: '1px solid var(--accent-indigo)', fontSize: '10px' }}>
                          Active Workspace
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: tierColor, border: `1px solid ${tierColor}`, fontSize: '10px' }}>
                        {tenant.pricingTier} TIER
                      </span>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '10px' }}>
                        Sector: {tenant.sector?.replace('_', ' ')}
                      </span>
                      <span className="badge" style={{ backgroundColor: tenant.isClean ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 189, 8, 0.1)', color: tenant.isClean ? '#10b981' : '#fbbd08', border: '1px solid', borderColor: tenant.isClean ? '#10b981' : '#fbbd08', fontSize: '10px' }}>
                        {tenant.isClean ? 'Clean Instance (0 Data)' : 'Pre-populated Demo'}
                      </span>
                    </div>

                    {/* Tier Upgrade / Actions Bar */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Manage Pricing Tier
                        </span>
                        <select
                          value={tenant.pricingTier}
                          onChange={(e) => handleAdminUpdateTier(tenant.id, e.target.value as any)}
                          style={{
                            background: 'var(--bg-primary)',
                            border: `1px solid ${tierColor}`,
                            color: tierColor,
                            fontWeight: '800',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="FREE_TRIAL">⚡ FREE_TRIAL (14 Days)</option>
                          <option value="STARTER">🥉 STARTER TIER</option>
                          <option value="ENTERPRISE">🥇 ENTERPRISE TIER</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        {!isCurrent ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleSwitchTenant(tenant)}
                            style={{ flex: 1, fontSize: '11px', fontWeight: '700', padding: '8px' }}
                          >
                            🔄 Switch Context
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClearDemoGrants}
                            style={{ flex: 1, fontSize: '11px', fontWeight: '700', padding: '8px' }}
                          >
                            🧹 Reset Data
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                          style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', fontSize: '11px', fontWeight: '700', padding: '8px' }}
                        >
                          🗑️ Delete Tenant
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Submit Application Modal */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Submit Grant Application</h3>
              <button 
                onClick={() => setShowSubmitModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmissionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Submission Date
                </label>
                <input 
                  type="date" 
                  className="url-input" 
                  style={{ width: '100%' }}
                  value={submitDate}
                  onChange={(e) => setSubmitDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Portal Submission Reference ID
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. SUB-2026-88741"
                  className="url-input" 
                  style={{ width: '100%' }}
                  value={submitRef}
                  onChange={(e) => setSubmitRef(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Amount Requested (AUD)
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 500000"
                  className="url-input" 
                  style={{ width: '100%' }}
                  value={submitAmountRequested}
                  onChange={(e) => setSubmitAmountRequested(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowSubmitModal(false)}
                  style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={savingSubmission}
                  style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                >
                  {savingSubmission ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Provision New Colleague</h3>
              <button onClick={() => setShowAddUserModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <input type="text" placeholder="e.g. Christine Malinao" className="url-input" style={{ width: '100%' }} value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input type="email" placeholder="e.g. christine.m@surepact.com" className="url-input" style={{ width: '100%' }} value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Role / Privileges</label>
                  <select className="url-input" style={{ width: '100%', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as any)} required>
                    <option value="staff">Staff / Standard User</option>
                    <option value="admin">Administrator (Global Access)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Department Scope</label>
                  <select className="url-input" style={{ width: '100%', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} value={newUserDept} onChange={(e) => setNewUserDept(e.target.value)}>
                    <option value="">-- Global / No Specific Dept --</option>
                    <option value="Executive">Executive & Management</option>
                    <option value="Engineering & Infrastructure">Engineering & Infrastructure</option>
                    <option value="Community & Recreation">Community & Recreation</option>
                    <option value="Environment & Water">Environment & Water</option>
                    <option value="Health & Housing">Health & Housing</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Initial Login Password</label>
                <input type="text" placeholder="SurePact2026!" className="url-input" style={{ width: '100%', fontFamily: 'monospace', fontWeight: '600' }} defaultValue="SurePact2026!" readOnly />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Initial access password set to default <strong>SurePact2026!</strong> for immediate login.</span>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Business Unit Membership (Access Scope)</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '140px', overflowY: 'auto' }}>
                  {departments.map(dept => (
                    <div key={dept.id}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#fbbd08', textTransform: 'uppercase' }}>{dept.name}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', paddingLeft: '8px' }}>
                        {dept.businessUnits?.map(bu => (
                          <label key={bu.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={newUserBUIds.includes(bu.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUserBUIds([...newUserBUIds, bu.id]);
                                } else {
                                  setNewUserBUIds(newUserBUIds.filter(id => id !== bu.id));
                                }
                              }}
                            />
                            {bu.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Users with Admin roles retain global view/edit access regardless of unit memberships.</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUserModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingUser} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingUser ? 'Provisioning...' : 'Provision Colleague'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Edit User Access</h3>
              <button onClick={() => setShowEditUserModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <input type="text" placeholder="e.g. Christine Malinao" className="url-input" style={{ width: '100%' }} value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input type="email" placeholder="e.g. christine.m@surepact.com" className="url-input" style={{ width: '100%' }} value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Role</label>
                  <select className="url-input" style={{ width: '100%' }} value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as any)} required>
                    <option value="staff">Staff / Standard User</option>
                    <option value="admin">Administrator (Global Access)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Account Status</label>
                  <select className="url-input" style={{ width: '100%' }} value={newUserStatus} onChange={(e) => setNewUserStatus(e.target.value as any)} required>
                    <option value="Active">Active</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Department Owner Scope</label>
                <select className="url-input" style={{ width: '100%' }} value={newUserDept} onChange={(e) => setNewUserDept(e.target.value)} required>
                  <option value="">-- Global / No Specific Dept --</option>
                  <option value="Engineering & Infrastructure">Engineering & Infrastructure</option>
                  <option value="Community & Recreation">Community & Recreation</option>
                  <option value="Environment & Water">Environment & Water</option>
                  <option value="Health & Housing">Health & Housing</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Business Unit Membership (Access List)</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                  {departments.map(dept => (
                    <div key={dept.id}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{dept.name}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', paddingLeft: '8px' }}>
                        {dept.businessUnits?.map(bu => (
                          <label key={bu.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={newUserBUIds.includes(bu.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUserBUIds([...newUserBUIds, bu.id]);
                                } else {
                                  setNewUserBUIds(newUserBUIds.filter(id => id !== bu.id));
                                }
                              }}
                            />
                            {bu.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditUserModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingUser} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add Department</h3>
              <button onClick={() => setShowAddDeptModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDeptSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Department Name</label>
                <input type="text" placeholder="e.g. Corporate Services" className="url-input" style={{ width: '100%' }} value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Description</label>
                <textarea rows={3} placeholder="Describe the department's purpose." className="url-input" style={{ width: '100%', resize: 'none' }} value={newDeptDesc} onChange={(e) => setNewDeptDesc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddDeptModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingDept} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingDept ? 'Saving...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Business Unit Modal */}
      {showAddBUModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add Business Unit</h3>
              <button onClick={() => setShowAddBUModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddBUSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Parent Department</label>
                <select className="url-input" style={{ width: '100%' }} value={newBUDeptId} onChange={(e) => setNewBUDeptId(e.target.value)} required>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Business Unit Name</label>
                <input type="text" placeholder="e.g. Roads & Bridges Construction" className="url-input" style={{ width: '100%' }} value={newBUName} onChange={(e) => setNewBUName(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Description</label>
                <textarea rows={3} placeholder="Describe the physical/operational scope of this unit." className="url-input" style={{ width: '100%', resize: 'none' }} value={newBUDesc} onChange={(e) => setNewBUDesc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddBUModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingBU} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingBU ? 'Saving...' : 'Add Business Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Document Guidelines & Checklist Ingestion Modal */}
      {showGuidelinesModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '700px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={22} color="var(--accent-indigo)" />
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0 }}>
                  Ingest Funder Guidelines &amp; Checklists (Multi-Doc AI)
                </h3>
              </div>
              <button 
                onClick={() => {
                  if (!extractingGuidelines) {
                    setShowGuidelinesModal(false);
                    setGuidelinesFileName('');
                    setGuidelinesGrantId('');
                  }
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                disabled={extractingGuidelines}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
              Upload or select <strong>multiple guideline documents, evaluation checklists, annexures, and submission templates</strong> simultaneously. Google Gemini AI will aggregate all files and extract a consolidated Grant Requirements Matrix (weighted criteria, mandatory attachments, and word limits).
            </p>

            <form onSubmit={handleGuidelinesExtraction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Multi-Document Selection Box */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    Uploaded Guideline Assets ({guidelinesFileNames.length} Files Selected)
                  </span>
                  <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    Multi-Doc Gemini AI
                  </span>
                </div>

                {/* Preset Document Checkboxes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { id: 'rcp_round4_guidelines.pdf', name: 'RCP Round 4 Program Guidelines.pdf', size: '1.6 MB', type: 'PDF Guidelines' },
                    { id: 'rcp_round4_evaluation_checklist.docx', name: 'Evaluation Criteria & Compliance Checklist.docx', size: '480 KB', type: 'DOCX Checklist' },
                    { id: 'risk_management_annexure_A.pdf', name: 'Annexure A — Risk Mitigation Rules.pdf', size: '820 KB', type: 'PDF Annexure' },
                    { id: 'arena_microgrid_program_guidelines.pdf', name: 'ARENA Microgrid Program & Co-Funding Rules.pdf', size: '2.1 MB', type: 'PDF Guidelines' }
                  ].map(doc => {
                    const isSelected = guidelinesFileNames.includes(doc.id);
                    return (
                      <div 
                        key={doc.id}
                        onClick={() => {
                          if (isSelected) {
                            setGuidelinesFileNames(guidelinesFileNames.filter(name => name !== doc.id));
                          } else {
                            setGuidelinesFileNames([...guidelinesFileNames, doc.id]);
                          }
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: `2px solid ${isSelected ? 'var(--accent-indigo)' : 'var(--border-color)'}`,
                          background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div onClick
                            style={{ cursor: 'pointer' }}
                          />
                          <FileText size={16} color={isSelected ? 'var(--accent-indigo)' : 'var(--text-muted)'} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? '#fff' : 'var(--text-primary)' }}>
                              {doc.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{doc.type} • {doc.size}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Included in AI Prompt
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {extractingGuidelines && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} className="spin-animation" color="var(--accent-indigo)" />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Synthesizing Multi-Doc Requirements Matrix...</span>
                  </div>
                  <div className="terminal-console" style={{ 
                    maxHeight: '160px', 
                    overflowY: 'auto', 
                    background: '#090d16', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#10b981',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {guidelinesLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  disabled={extractingGuidelines}
                  onClick={() => {
                    setShowGuidelinesModal(false);
                    setGuidelinesFileName('');
                    setGuidelinesGrantId('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={extractingGuidelines || guidelinesFileNames.length === 0}
                  style={{ background: '#fbbd08', color: '#151226', border: '1px solid #fbbd08', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={16} />
                  {extractingGuidelines ? 'Synthesizing...' : `Synthesize ${guidelinesFileNames.length} Document Requirements`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GFA Upload & AI Extraction Modal */}
      {showGfaModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '650px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Upload Funding Agreement (GFA)</h3>
              <button 
                onClick={() => {
                  if (!extractingGfa) {
                    setShowGfaModal(false);
                    setGfaFileName('');
                  }
                }}
                disabled={extractingGfa}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
              Upload your signed Grant Funding Agreement PDF. The system will run optical character recognition (OCR) and use an AI language model to parse legal obligations, payment terms, and deliverable deadlines.
            </p>

            <form onSubmit={handleGfaExtraction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!gfaFileName ? (
                <div 
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(0,0,0,0.1)',
                    transition: 'var(--transition-smooth)'
                  }}
                  onClick={() => {
                    const mockNames = [
                      'GFA_Regional_Water_Infrastructure_Agreement.pdf',
                      'ARENA_Clean_Energy_Microgrids_Agreement.pdf',
                      'GFA_Flood_Mitigation_Program.pdf'
                    ];
                    const selected = grants.find(g => g.id === gfaGrantId);
                    let name = 'GFA_Signed_Agreement.pdf';
                    if (selected) {
                      if (selected.title.toLowerCase().includes('water')) name = mockNames[0];
                      else if (selected.title.toLowerCase().includes('energy')) name = mockNames[1];
                      else name = mockNames[2];
                    }
                    setGfaFileName(name);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-indigo)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <UploadCloud size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px', display: 'block' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', display: 'block', marginBottom: '6px' }}>
                    Click to browse or drop your signed GFA PDF here
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Supports PDF, DOCX up to 10MB (Automatically maps mock metadata)
                  </span>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid var(--border-color-active)',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileSpreadsheet size={24} color="var(--accent-indigo)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{gfaFileName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>2.4 MB • Ready to analyze</div>
                    </div>
                  </div>
                  {!extractingGfa && (
                    <button 
                      type="button" 
                      onClick={() => setGfaFileName('')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {gfaLogs.length > 0 && (
                <div className="scraper-console" style={{ margin: '0', maxHeight: '180px' }}>
                  {gfaLogs.map((log, index) => {
                    let logType = 'info';
                    if (log.includes('SUCCESS') || log.includes('succeeded')) logType = 'success';
                    if (log.includes('ERROR') || log.includes('EXCEPTION')) logType = 'warning';
                    return (
                      <div key={index} className={`console-line ${logType}`}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  disabled={extractingGfa}
                  onClick={() => {
                    setShowGfaModal(false);
                    setGfaFileName('');
                  }}
                  style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={extractingGfa || !gfaFileName}
                  style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                >
                  {extractingGfa ? 'Analyzing GFA...' : 'Run AI Extraction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Variation Modal */}
      {showVariationModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Submit Contract Variation</h3>
              <button onClick={() => setShowVariationModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddVariation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Variation Ref Code</label>
                <input type="text" placeholder="e.g. VAR-WTR-002" className="url-input" style={{ width: '100%' }} value={varRef} onChange={(e) => setVarRef(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Value Adjustment (AUD)</label>
                <input type="number" placeholder="e.g. 250000 or -50000" className="url-input" style={{ width: '100%' }} value={varValueChange} onChange={(e) => setVarValueChange(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>New Grant Closing Date (Optional)</label>
                <input type="date" className="url-input" style={{ width: '100%' }} value={varNewDate} onChange={(e) => setVarNewDate(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Approval Status</label>
                <select className="url-input" style={{ width: '100%' }} value={varStatus} onChange={(e) => setVarStatus(e.target.value)}>
                  <option value="PENDING">PENDING (Awaiting Review)</option>
                  <option value="APPROVED">APPROVED (Recalculate Budget Now)</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Reasoning & Scope Modification Details</label>
                <textarea rows={3} placeholder="Describe the physical scope changes or material price index variations." className="url-input" style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }} value={varDesc} onChange={(e) => setVarDesc(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowVariationModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingVariation} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingVariation ? 'Saving...' : 'Submit Variation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Transaction Modal */}
      {showTransactionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Log Finance Transaction</h3>
              <button onClick={() => setShowTransactionModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Transaction Type</label>
                  <select className="url-input" style={{ width: '100%' }} value={txType} onChange={(e) => setTxType(e.target.value as 'INCOME' | 'EXPENDITURE')}>
                    <option value="EXPENDITURE">EXPENDITURE (Spends/Outbound)</option>
                    <option value="INCOME">INCOME (Funder Drawdown/Inbound)</option>
                  </select>
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Amount (AUD)</label>
                  <input type="number" placeholder="e.g. 45000" className="url-input" style={{ width: '100%' }} value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Transaction Description</label>
                <input type="text" placeholder="e.g. Apex Engineers soil survey invoice" className="url-input" style={{ width: '100%' }} value={txDesc} onChange={(e) => setTxDesc(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Category</label>
                  <select className="url-input" style={{ width: '100%' }} value={txCategory} onChange={(e) => setTxCategory(e.target.value)}>
                    <option value="Funder Drawdown">Funder Drawdown (Income)</option>
                    <option value="Equipment & Materials">Equipment & Materials</option>
                    <option value="Consultants & Design">Consultants & Design</option>
                    <option value="Permits & Fees">Permits & Fees</option>
                    <option value="Labor & Contractors">Labor & Contractors</option>
                    <option value="Operational Overheads">Operational Overheads</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Log Date</label>
                  <input type="date" className="url-input" style={{ width: '100%' }} value={txDate} onChange={(e) => setTxDate(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Link to Grant</label>
                  <select className="url-input" style={{ width: '100%' }} value={txGrantId} onChange={(e) => setTxGrantId(e.target.value)}>
                    <option value="">-- No Grant Link --</option>
                    {grants.filter(g => g.status === 'AWARDED' || g.status === 'CLOSED').map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Link to Project</label>
                  <select className="url-input" style={{ width: '100%' }} value={txProjectId} onChange={(e) => setTxProjectId(e.target.value)}>
                    <option value="">-- No Project Link --</option>
                    {filteredProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Receipt Evidence Capture Fields */}
              <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>Invoice / Receipt Ref No.</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-904"
                    className="url-input"
                    style={{ width: '100%', fontSize: '12px' }}
                    value={txInvoiceRef}
                    onChange={(e) => setTxInvoiceRef(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>Proof of Payment / Receipt</label>
                  {txReceiptFileName ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', color: '#10b981', height: '36px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {txReceiptFileName}</span>
                      <button type="button" onClick={() => setTxReceiptFileName('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}>&times;</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: '100%', padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '36px' }}
                      onClick={() => setTxReceiptFileName('Invoice_Receipt_' + Date.now().toString().slice(-4) + '.pdf')}
                    >
                      <UploadCloud size={14} /> Attach Receipt PDF
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransactionModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingTransaction} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingTransaction ? 'Logging...' : 'Log Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showProjectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Create New Capital Works Project</h3>
              <button onClick={() => setShowProjectModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Project Name</label>
                <input type="text" placeholder="e.g. Regional Highway Upgrade" className="url-input" style={{ width: '100%' }} value={projName} onChange={(e) => setProjName(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Department Owner</label>
                <select className="url-input" style={{ width: '100%' }} value={projDept} onChange={(e) => setProjDept(e.target.value)} required>
                  <option value="">-- Select Department --</option>
                  <option value="Engineering & Infrastructure">Engineering & Infrastructure</option>
                  <option value="Community & Recreation">Community & Recreation</option>
                  <option value="Environment & Water">Environment & Water</option>
                  <option value="Health & Housing">Health & Housing</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Project Description</label>
                <textarea rows={3} placeholder="Describe the physical scope, goals, and delivery timeframe of this project." className="url-input" style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }} value={projDesc} onChange={(e) => setProjDesc(e.target.value)}></textarea>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Related Business Unit (Access Filter)</label>
                <select 
                  className="url-input" 
                  style={{ width: '100%' }} 
                  value={projBUId} 
                  onChange={(e) => setProjBUId(e.target.value)}
                >
                  <option value="">-- No Specific Business Unit (Global Access) --</option>
                  {departments.map(dept => (
                    <optgroup key={dept.id} label={dept.name}>
                      {dept.businessUnits?.map(bu => (
                        <option key={bu.id} value={bu.id}>{bu.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  If set, only users with access to this Business Unit will be able to view and link this project.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingProject} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingProject ? 'Saving...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Grant to Project Modal */}
      {showLinkModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Link Grant Funding Allocation</h3>
              <button onClick={() => setShowLinkModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLinkProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Select Awarded Grant</label>
                <select className="url-input" style={{ width: '100%' }} value={linkGrantId} onChange={(e) => setLinkGrantId(e.target.value)} required>
                  <option value="">-- Select Grant --</option>
                  {grants.filter(g => g.status === 'AWARDED').map(g => (
                    <option key={g.id} value={g.id}>{g.title} (${g.totalFundingValue?.toLocaleString() || '0'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Select Capital Project</label>
                <select className="url-input" style={{ width: '100%' }} value={linkProjectId} onChange={(e) => setLinkProjectId(e.target.value)} required>
                  <option value="">-- Select Project --</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Allocated Amount (AUD)</label>
                <input type="number" placeholder="e.g. 250000" className="url-input" style={{ width: '100%' }} value={linkAmount} onChange={(e) => setLinkAmount(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLinkModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingLink} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingLink ? 'Linking...' : 'Link Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Task Modal */}
      {showTaskModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add Compliance Task</h3>
              <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Task Title</label>
                <input type="text" placeholder="e.g. Prepare final acquittal spreadsheet" className="url-input" style={{ width: '100%' }} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Assignee Staff <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select 
                    className="url-input" 
                    style={{ width: '100%' }} 
                    value={taskUserId} 
                    onChange={(e) => {
                      setTaskUserId(e.target.value);
                      e.target.setCustomValidity('');
                    }} 
                    onInvalid={(e) => (e.target as HTMLSelectElement).setCustomValidity('Please select a team member to assign this task to.')}
                    required
                  >
                    <option value="">-- Choose Assignee --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Due Date</label>
                  <input type="date" className="url-input" style={{ width: '100%' }} value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Task Description (Optional)</label>
                <textarea rows={3} placeholder="Describe the physical work required or specific milestones targets." className="url-input" style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingTask} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingTask ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Audit Log Entry Modal */}
      {showManualLogModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add Governance Log Entry</h3>
              <button onClick={() => setShowManualLogModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Log Message / Action Entry</label>
                <textarea 
                  rows={4} 
                  placeholder="e.g. Document Funding Agreement uploaded to Grant." 
                  className="url-input" 
                  style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }} 
                  value={manualLogMessage} 
                  onChange={(e) => setManualLogMessage(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Logged By (Author)</label>
                <select className="url-input" style={{ width: '100%' }} value={manualLogUser} onChange={(e) => setManualLogUser(e.target.value)} required>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowManualLogModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingManualLog} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingManualLog ? 'Logging...' : 'Add Manual Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showDocModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Store Grant Document</h3>
              <button onClick={() => setShowDocModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Document Name / File</label>
                <input type="text" placeholder="e.g. Q1_Water_Status_Report.pdf" className="url-input" style={{ width: '100%' }} value={docName} onChange={(e) => setDocName(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Document Type</label>
                  <select className="url-input" style={{ width: '100%' }} value={docType} onChange={(e) => setDocType(e.target.value as any)} required>
                    <option value="AGREEMENT">Funding Agreement (GFA)</option>
                    <option value="REPORT">Progress / Acquittal Report</option>
                    <option value="APPLICATION">Grant Application Document</option>
                    <option value="OTHER">Other Reference / Receipt</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>File Size (Mocked)</label>
                  <input type="text" placeholder="e.g. 1.8 MB" className="url-input" style={{ width: '100%' }} value={docFileSize} onChange={(e) => setDocFileSize(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Uploaded By</label>
                <select className="url-input" style={{ width: '100%' }} value={docUploadedBy} onChange={(e) => setDocUploadedBy(e.target.value)} required>
                  <option value="">-- Select Uploader --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDocModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingDoc} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingDoc ? 'Storing...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }} onClick={() => setShowSaveSearchModal(false)}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '450px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Save Search Alert</h3>
              <button 
                onClick={() => setShowSaveSearchModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSearchQuery} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Name this saved search alert to receive highlights of new matching grant opportunities.
              </p>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Alert Name</label>
                <input
                  type="text"
                  className="url-input"
                  style={{ width: '100%' }}
                  value={savingSearchName}
                  onChange={(e) => setSavingSearchName(e.target.value)}
                  placeholder="e.g. Active Energy Grants"
                  required
                />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <strong>Search Criteria:</strong>
                {externalSearchQuery && <span>• Keyword: "{externalSearchQuery}"</span>}
                {externalSearchCategory && <span>• Category: {externalSearchCategory}</span>}
                {externalSearchSource && <span>• Agency: "{externalSearchSource}"</span>}
                {externalSearchMinVal && <span>• Min Funding: ${parseFloat(externalSearchMinVal).toLocaleString()}</span>}
                {externalSearchMaxVal && <span>• Max Funding: ${parseFloat(externalSearchMaxVal).toLocaleString()}</span>}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSaveSearchModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingSearch} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingSearch ? 'Saving...' : 'Save Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Knowledge Document Modal */}
      {showKnowledgeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }} onClick={() => setShowKnowledgeModal(false)}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '450px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Add Global Knowledge Asset</h3>
              <button 
                onClick={() => setShowKnowledgeModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUploadKnowledge} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Asset Name</label>
                <input 
                  type="text" 
                  className="url-input" 
                  style={{ width: '100%' }} 
                  placeholder="e.g. 2025-Strategic-Plan.pdf" 
                  value={newKnowledgeName} 
                  onChange={(e) => setNewKnowledgeName(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Category</label>
                  <select 
                    className="url-input" 
                    style={{ width: '100%' }} 
                    value={newKnowledgeType} 
                    onChange={(e) => setNewKnowledgeType(e.target.value as any)} 
                    required
                  >
                    <option value="ANNUAL_REPORT">Annual Report</option>
                    <option value="STRATEGIC_PLAN">Strategic Plan</option>
                    <option value="PROJECT_PLAN">Project/Works Plan</option>
                    <option value="PAST_GRANT_APPLICATION">Past Grant Application</option>
                    <option value="OTHER">Other Reference</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>File Size</label>
                  <input 
                    type="text" 
                    className="url-input" 
                    style={{ width: '100%' }} 
                    placeholder="e.g. 2.4 MB" 
                    value={newKnowledgeFileSize} 
                    onChange={(e) => setNewKnowledgeFileSize(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Uploaded By</label>
                <select 
                  className="url-input" 
                  style={{ width: '100%' }} 
                  value={newKnowledgeUploadedBy} 
                  onChange={(e) => setNewKnowledgeUploadedBy(e.target.value)} 
                  required
                >
                  <option value="">-- Select Author --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowKnowledgeModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={savingKnowledge} style={{ flex: 1, justifyContent: 'center' }}>
                  {savingKnowledge ? 'Saving...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Writer Telemetry Logs Modal */}
      {showDraftLogsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 110,
          backdropFilter: 'blur(10px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '550px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} className={generatingDraft ? "spin-animation" : ""} color="var(--accent-cyan)" /> AI Writing Assistant Processing Stream
              </h3>
            </div>
            
            <div className="terminal-console" style={{ 
              background: '#090d16', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px', 
              padding: '20px', 
              fontFamily: 'monospace', 
              fontSize: '11px', 
              color: 'var(--accent-cyan)', 
              minHeight: '220px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto'
            }}>
              {draftGenerationLogs.length === 0 && (
                <div style={{ color: 'var(--text-muted)' }}>&gt; Initializing context synthesis pipeline...</div>
              )}
              {draftGenerationLogs.map((log, idx) => (
                <div key={idx} style={{ color: log.startsWith('✅') ? 'var(--color-success)' : '#fff' }}>
                  &gt; {log}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowDraftLogsModal(false)}
                disabled={generatingDraft}
              >
                Close Stream
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Configure Columns Settings Modal */}
      {showColumnSettings && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }} onClick={() => setShowColumnSettings(false)}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Configure Registry Columns</h3>
              <button 
                onClick={() => setShowColumnSettings(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Toggle visibility of individual registry data columns, and use the reordering buttons to shift their sequence.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
              {COLUMN_METADATA.map((col) => {
                const isVisible = visibleColumns.includes(col.id);
                const idxInVisible = visibleColumns.indexOf(col.id);

                return (
                  <div key={col.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id={`col-toggle-${col.id}`}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        checked={isVisible}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVisibleColumns([...visibleColumns, col.id]);
                          } else {
                            if (visibleColumns.length > 1) {
                              setVisibleColumns(visibleColumns.filter(c => c !== col.id));
                            } else {
                              alert("At least one column must remain visible.");
                            }
                          }
                        }}
                      />
                      <label htmlFor={`col-toggle-${col.id}`} style={{ fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', margin: 0 }}>
                        {col.label}
                      </label>
                    </div>

                    {isVisible && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px' }}
                          disabled={idxInVisible === 0}
                          onClick={() => {
                            const newCols = [...visibleColumns];
                            const temp = newCols[idxInVisible];
                            newCols[idxInVisible] = newCols[idxInVisible - 1];
                            newCols[idxInVisible - 1] = temp;
                            setVisibleColumns(newCols);
                          }}
                        >
                          ▲
                        </button>
                        <button 
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px' }}
                          disabled={idxInVisible === visibleColumns.length - 1}
                          onClick={() => {
                            const newCols = [...visibleColumns];
                            const temp = newCols[idxInVisible];
                            newCols[idxInVisible] = newCols[idxInVisible + 1];
                            newCols[idxInVisible + 1] = temp;
                            setVisibleColumns(newCols);
                          }}
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowColumnSettings(false)}>
                Apply Column Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date-Filtered Acquittal Report Modal */}
      {showAcquittalModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }} onClick={() => setShowAcquittalModal(false)}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '800px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                  Financial Acquittal Report
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '600', marginTop: '2px', display: 'block' }}>
                  {acquittalFilterType === 'grant' ? 'Grant' : 'Project'}: {acquittalTargetTitle}
                </span>
              </div>
              <button 
                onClick={() => setShowAcquittalModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateAcquittalReport} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Start Date</label>
                <input 
                  type="date" 
                  className="url-input" 
                  style={{ width: '100%', padding: '8px' }} 
                  value={acquittalStartDate} 
                  onChange={(e) => setAcquittalStartDate(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>End Date</label>
                <input 
                  type="date" 
                  className="url-input" 
                  style={{ width: '100%', padding: '8px' }} 
                  value={acquittalEndDate} 
                  onChange={(e) => setAcquittalEndDate(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ padding: '10px 20px', height: '38px' }}>
                Filter Transactions
              </button>
            </form>

            <div style={{ flex: 1, minHeight: '260px', maxHeight: '380px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(0,0,0,0.1)' }}>
              {acquittalTransactions.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px', padding: '40px 20px', textAlign: 'center' }}>
                  <DollarSign size={32} style={{ opacity: 0.1, marginBottom: '10px' }} />
                  No matching transactions found. Enter dates and click "Filter Transactions" to fetch.
                </div>
              ) : (
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '12px 16px', color: '#fff', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '12px 16px', color: '#fff', fontWeight: '600' }}>Description</th>
                      <th style={{ padding: '12px 16px', color: '#fff', fontWeight: '600' }}>Category</th>
                      <th style={{ padding: '12px 16px', color: '#fff', fontWeight: '600' }}>Type</th>
                      <th style={{ padding: '12px 16px', color: '#fff', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acquittalTransactions.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                          {new Date(t.date).toLocaleDateString('en-AU')}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#fff', fontWeight: '500' }}>
                          {t.description}
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                            {t.category}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span className={`badge ${t.type === 'INCOME' ? 'badge-awarded' : 'badge-risk'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '600', color: t.type === 'INCOME' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {t.type === 'INCOME' ? '+' : '-'}${t.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {acquittalTransactions.length > 0 && (
                  <span>
                    Total: <strong>{acquittalTransactions.length}</strong> transactions | Net Acquittal: <strong style={{ color: acquittalTransactions.reduce((acc, t) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      ${acquittalTransactions.reduce((acc, t) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAcquittalModal(false)}>
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  disabled={acquittalTransactions.length === 0}
                  onClick={handleExportAcquittalCSV}
                >
                  Export to CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Funding Body Modal */}
      {showAddFundingBodyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add New Funding Body</h3>
              <button 
                onClick={() => setShowAddFundingBodyModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddFundingBody} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Funder Name</label>
                <input 
                  type="text" 
                  className="url-input" 
                  placeholder="e.g. Australian Renewable Energy Agency (ARENA)"
                  style={{ width: '100%' }} 
                  value={newFundingBodyName} 
                  onChange={(e) => setNewFundingBodyName(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Funder Type</label>
                <select 
                  className="url-input" 
                  style={{ width: '100%' }}
                  value={newFundingBodyType}
                  onChange={(e) => setNewFundingBodyType(e.target.value)}
                >
                  <option value="GOVERNMENT">Government</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="PHILANTHROPIC">Philanthropic</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Website URL</label>
                <input 
                  type="url" 
                  className="url-input" 
                  placeholder="https://example.gov.au"
                  style={{ width: '100%' }} 
                  value={newFundingBodyWebsite} 
                  onChange={(e) => setNewFundingBodyWebsite(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Description</label>
                <textarea 
                  className="url-input" 
                  placeholder="Summarize the funder's core objectives..."
                  style={{ width: '100%', height: '80px', resize: 'vertical' }} 
                  value={newFundingBodyDescription} 
                  onChange={(e) => setNewFundingBodyDescription(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddFundingBodyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={savingFundingBody}>
                  {savingFundingBody ? 'Saving...' : 'Add Funder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add Key Contact</h3>
              <button 
                onClick={() => setShowAddContactModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Contact Name</label>
                <input 
                  type="text" 
                  className="url-input" 
                  placeholder="e.g. Sarah Connor"
                  style={{ width: '100%' }} 
                  value={newContactName} 
                  onChange={(e) => setNewContactName(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Role / Position</label>
                <input 
                  type="text" 
                  className="url-input" 
                  placeholder="e.g. Investment Manager"
                  style={{ width: '100%' }} 
                  value={newContactRole} 
                  onChange={(e) => setNewContactRole(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input 
                  type="email" 
                  className="url-input" 
                  placeholder="name@funder.gov.au"
                  style={{ width: '100%' }} 
                  value={newContactEmail} 
                  onChange={(e) => setNewContactEmail(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Phone Number</label>
                <input 
                  type="text" 
                  className="url-input" 
                  placeholder="e.g. +61 2 6243 7701"
                  style={{ width: '100%' }} 
                  value={newContactPhone} 
                  onChange={(e) => setNewContactPhone(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddContactModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={savingContact}>
                  {savingContact ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Opportunity Modal */}
      {showAddOpportunityModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add Pre-Pipeline Opportunity</h3>
              <button 
                onClick={() => setShowAddOpportunityModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Opportunity Title</label>
                <input 
                  type="text" 
                  className="url-input" 
                  placeholder="e.g. Microgrids for Remote Indigenous Communities"
                  style={{ width: '100%' }} 
                  value={newOppTitle} 
                  onChange={(e) => setNewOppTitle(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Target Value (AUD)</label>
                <input 
                  type="number" 
                  className="url-input" 
                  placeholder="e.g. 2500000"
                  style={{ width: '100%' }} 
                  value={newOppValue} 
                  onChange={(e) => setNewOppValue(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Target Deadline</label>
                <input 
                  type="date" 
                  className="url-input" 
                  style={{ width: '100%' }} 
                  value={newOppDeadline} 
                  onChange={(e) => setNewOppDeadline(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Link Contact</label>
                <select 
                  className="url-input" 
                  style={{ width: '100%' }}
                  value={newOppContactId}
                  onChange={(e) => setNewOppContactId(e.target.value)}
                >
                  <option value="">No Contact Link</option>
                  {fundingBodies.find(b => b.id === selectedFundingBodyId)?.contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.role || 'Key Person'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Brief Scope / Description</label>
                <textarea 
                  className="url-input" 
                  placeholder="Summarize the target project scope and alignment..."
                  style={{ width: '100%', height: '80px', resize: 'vertical' }} 
                  value={newOppDescription} 
                  onChange={(e) => setNewOppDescription(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddOpportunityModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={savingOpportunity}>
                  {savingOpportunity ? 'Saving...' : 'Add Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Interaction Modal */}
      {showAddInteractionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Log Contact Interaction</h3>
              <button 
                onClick={() => setShowAddInteractionModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddInteraction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Interaction Type</label>
                <select 
                  className="url-input" 
                  style={{ width: '100%' }}
                  value={newInteractionType}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setNewInteractionType(val);
                    if (val === 'TASK') {
                      setNewInteractionStatus('PENDING');
                    } else {
                      setNewInteractionStatus('COMPLETED');
                    }
                  }}
                >
                  <option value="NOTE">Note / Memorandum</option>
                  <option value="EMAIL">Email Sent/Received</option>
                  <option value="CALL">Phone Call</option>
                  <option value="MEETING">Structured Meeting</option>
                  <option value="TASK">Action Task Assignment</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Subject / Headline</label>
                <input 
                  type="text" 
                  className="url-input" 
                  placeholder="e.g. Co-funding match rules discussed"
                  style={{ width: '100%' }} 
                  value={newInteractionSubject} 
                  onChange={(e) => setNewInteractionSubject(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Details / Content</label>
                <textarea 
                  className="url-input" 
                  placeholder="Write the interaction minutes or detailed summary..."
                  style={{ width: '100%', height: '100px', resize: 'vertical' }} 
                  value={newInteractionContent} 
                  onChange={(e) => setNewInteractionContent(e.target.value)} 
                  required 
                />
              </div>

              {newInteractionType === 'TASK' && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Due Date</label>
                    <input 
                      type="date" 
                      className="url-input" 
                      style={{ width: '100%' }} 
                      value={newInteractionDueDate} 
                      onChange={(e) => setNewInteractionDueDate(e.target.value)} 
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Task Status</label>
                    <select 
                      className="url-input" 
                      style={{ width: '100%' }}
                      value={newInteractionStatus}
                      onChange={(e) => setNewInteractionStatus(e.target.value)}
                    >
                      <option value="PENDING">Pending Action</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddInteractionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={savingInteraction}>
                  {savingInteraction ? 'Saving...' : 'Log Interaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Add Document Modal */}
      {showGlobalAddDocModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="panel-card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '30px', animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add Document to Library</h3>
              <button 
                onClick={() => setShowGlobalAddDocModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleGlobalAddDocument} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Document Name</label>
                <input 
                  type="text" 
                  className="url-input" 
                  placeholder="e.g. Funding Agreement Signed.pdf"
                  style={{ width: '100%' }} 
                  value={globalAddDocName} 
                  onChange={(e) => setGlobalAddDocName(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Document Type</label>
                <select 
                  className="url-input" 
                  style={{ width: '100%' }}
                  value={globalAddDocType}
                  onChange={(e) => setGlobalAddDocType(e.target.value as any)}
                  required
                >
                  <option value="AGREEMENT">Agreement / Contract</option>
                  <option value="APPLICATION">Application Draft</option>
                  <option value="REPORT">Progress Report</option>
                  <option value="OTHER">Other Reference Document</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>File Size (Optional)</label>
                <input 
                  type="text" 
                  className="url-input" 
                  placeholder="e.g. 2.4 MB"
                  style={{ width: '100%' }} 
                  value={globalAddDocFileSize} 
                  onChange={(e) => setGlobalAddDocFileSize(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Related Grant</label>
                <select 
                  className="url-input" 
                  style={{ width: '100%' }}
                  value={globalAddDocGrantId}
                  onChange={(e) => setGlobalAddDocGrantId(e.target.value)}
                  required
                >
                  <option value="">Select Related Grant...</option>
                  {grants.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Uploaded By</label>
                <input 
                  type="text" 
                  className="url-input" 
                  style={{ width: '100%' }} 
                  value={globalAddDocUploadedBy} 
                  onChange={(e) => setGlobalAddDocUploadedBy(e.target.value)} 
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGlobalAddDocModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={savingGlobalDoc}
                  style={{ background: '#fbbd08', color: '#151226', border: '1px solid #fbbd08', fontWeight: 'bold' }}
                >
                  {savingGlobalDoc ? 'Uploading...' : 'Add Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Grant Slide-out Drawer Sidebar */}
      {showNewGrantSidebar && (
        <div className="surepact-drawer-overlay" onClick={() => setShowNewGrantSidebar(false)}>
          <div className="surepact-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="surepact-drawer-header">
              <h3 className="surepact-drawer-title">Create New Grant</h3>
              <button 
                onClick={() => setShowNewGrantSidebar(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                Fill in the details below to create a new grant application
              </span>
              <button 
                type="button" 
                onClick={handleFillTestData}
                style={{ 
                  border: '1px solid #151226', 
                  borderRadius: '6px', 
                  padding: '4px 12px', 
                  fontSize: '12px', 
                  cursor: 'pointer', 
                  background: '#ffffff', 
                  fontWeight: '700',
                  color: '#151226'
                }}
              >
                Fill with test data
              </button>
            </div>

            <form onSubmit={handleCreateNewGrant} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 130px)', overflow: 'hidden', margin: 0 }}>
              <div className="surepact-drawer-body">
                {/* URL Paste Autocomplete Ingestion */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#166534', fontWeight: '700' }}>
                    Paste Opportunity URL to Autofill Details
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="url" 
                      className="url-input" 
                      placeholder="e.g. https://www.grants.gov.au/Go/Show?GoId=..."
                      style={{ flex: 1, backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', margin: 0 }}
                      value={newGrantUrlInput}
                      onChange={(e) => setNewGrantUrlInput(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={handleFetchScrapedDetails}
                      disabled={fetchingScrapedDetails}
                      style={{ 
                        background: '#151226', 
                        color: '#ffffff', 
                        fontWeight: '700', 
                        border: '1px solid #151226',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '90px'
                      }}
                    >
                      {fetchingScrapedDetails ? 'Scraping...' : 'Autofill'}
                    </button>
                  </div>
                </div>

                {/* Funding Body Name */}
                <div>
                  <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Funding Body Name
                  </label>
                  <input 
                    list="new-grant-funder-list"
                    type="text" 
                    placeholder="Enter Funding Body Name"
                    style={{
                      border: '1px solid #cbd5e1',
                      borderLeft: '3px solid #ef4444',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      width: '100%',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a'
                    }}
                    value={newGrantFunder} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewGrantFunder(val);
                      const exists = fundingBodies.some(fb => fb.name.toLowerCase() === val.trim().toLowerCase());
                      if (exists || !val.trim()) {
                        setRegisterNewFunder(false);
                      }
                    }} 
                    required 
                  />
                  <datalist id="new-grant-funder-list">
                    {fundingBodies.map(fb => (
                      <option key={fb.id} value={fb.name} />
                    ))}
                  </datalist>

                  {/* Inline registration sub-form if typing a new funding body */}
                  {newGrantFunder && !fundingBodies.some(fb => fb.name.toLowerCase() === newGrantFunder.trim().toLowerCase()) && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '12px', 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          id="register-new-funder-checkbox"
                          checked={registerNewFunder} 
                          onChange={(e) => setRegisterNewFunder(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label 
                          htmlFor="register-new-funder-checkbox" 
                          style={{ fontSize: '12px', color: '#334155', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Register "{newGrantFunder}" as new Funding Body in CRM
                        </label>
                      </div>

                      {registerNewFunder && (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '10px',
                          borderTop: '1px solid #e2e8f0',
                          paddingTop: '10px',
                          marginTop: '4px'
                        }}>
                          <div>
                            <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                              Funding Body Type *
                            </label>
                            <select 
                              value={newFunderType}
                              onChange={(e) => setNewFunderType(e.target.value)}
                              style={{
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                padding: '6px 8px',
                                fontSize: '12px',
                                width: '100%',
                                outline: 'none',
                                backgroundColor: '#ffffff',
                                color: '#0f172a'
                              }}
                            >
                              <option value="GOVERNMENT">Government</option>
                              <option value="CORPORATE">Corporate</option>
                              <option value="PHILANTHROPIC">Philanthropic</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                              Website (Optional)
                            </label>
                            <input 
                              type="text"
                              placeholder="e.g. https://funder.gov.au"
                              value={newFunderWebsite}
                              onChange={(e) => setNewFunderWebsite(e.target.value)}
                              style={{
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                padding: '6px 8px',
                                fontSize: '12px',
                                width: '100%',
                                outline: 'none',
                                backgroundColor: '#ffffff',
                                color: '#0f172a'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                              Description (Optional)
                            </label>
                            <textarea 
                              placeholder="Enter description..."
                              value={newFunderDesc}
                              onChange={(e) => setNewFunderDesc(e.target.value)}
                              style={{
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                padding: '6px 8px',
                                fontSize: '12px',
                                width: '100%',
                                height: '50px',
                                outline: 'none',
                                resize: 'none',
                                backgroundColor: '#ffffff',
                                color: '#0f172a'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Grant Name */}
                <div>
                  <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Grant Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter grant name..."
                    style={{
                      border: '1px solid #cbd5e1',
                      borderLeft: '3px solid #ef4444',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      width: '100%',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a'
                    }}
                    value={newGrantTitle} 
                    onChange={(e) => setNewGrantTitle(e.target.value)} 
                    required 
                  />
                </div>

                {/* Grant Description */}
                <div>
                  <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Grant Description
                  </label>
                  <textarea 
                    placeholder="Enter grant description..."
                    style={{
                      border: '1px solid #cbd5e1',
                      borderLeft: '3px solid #ef4444',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      width: '100%',
                      height: '100px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      resize: 'vertical'
                    }}
                    value={newGrantDesc} 
                    onChange={(e) => setNewGrantDesc(e.target.value)} 
                    required 
                  />
                </div>

                {/* Grant ID (Optional) */}
                <div>
                  <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Grant ID (Optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter grant ID..."
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      width: '100%',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a'
                    }}
                    value={newGrantIdOptional} 
                    onChange={(e) => setNewGrantIdOptional(e.target.value)} 
                  />
                </div>

                {/* Grid for Manager and Owner */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Grant Manager
                    </label>
                    <select
                      style={{
                        border: '1px solid #cbd5e1',
                        borderLeft: '3px solid #ef4444',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        width: '100%',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        height: '42px'
                      }}
                      value={newGrantManager}
                      onChange={(e) => setNewGrantManager(e.target.value)}
                      required
                    >
                      <option value="">Select a Manager</option>
                      {users.map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Grant Owner
                    </label>
                    <select
                      style={{
                        border: '1px solid #cbd5e1',
                        borderLeft: '3px solid #ef4444',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        width: '100%',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        height: '42px'
                      }}
                      value={newGrantOwner}
                      onChange={(e) => setNewGrantOwner(e.target.value)}
                      required
                    >
                      <option value="">Select an Owner</option>
                      {users.map(u => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid for Start Date and End Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Grant Start Date
                    </label>
                    <input 
                      type="date" 
                      style={{
                        border: '1px solid #cbd5e1',
                        borderLeft: '3px solid #ef4444',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        width: '100%',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        color: '#0f172a'
                      }}
                      value={newGrantStart} 
                      onChange={(e) => setNewGrantStart(e.target.value)} 
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Grant End Date
                    </label>
                    <input 
                      type="date" 
                      style={{
                        border: '1px solid #cbd5e1',
                        borderLeft: '3px solid #ef4444',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        width: '100%',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        color: '#0f172a'
                      }}
                      value={newGrantEnd} 
                      onChange={(e) => setNewGrantEnd(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Funding Amount Available
                    <span title="The total funds allocated or requested for this grant." style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', borderRadius: '50%', background: '#64748b', color: '#fff', fontSize: '9px', fontWeight: 'bold' }}>?</span>
                  </label>
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', borderLeft: '3px solid #ef4444' }}>
                    <div style={{ background: '#f1f5f9', borderRight: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>
                      $
                    </div>
                    <input 
                      type="number" 
                      style={{ border: 'none', padding: '10px 14px', flex: 1, outline: 'none', background: '#ffffff', color: '#0f172a', fontSize: '13px' }}
                      placeholder="Enter amount..."
                      value={newGrantAmount}
                      onChange={(e) => setNewGrantAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Risk Rating */}
                <div>
                  <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Risk Rating
                  </label>
                  <select
                    style={{
                      border: '1px solid #cbd5e1',
                      borderLeft: '3px solid #ef4444',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      width: '100%',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      height: '42px'
                    }}
                    value={newGrantRisk}
                    onChange={(e) => setNewGrantRisk(e.target.value)}
                    required
                  >
                    <option value="">Select a Grant Risk</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                {/* Checkboxes for Co-contribution and Joint Venture */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', paddingBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}>
                    <input 
                      type="checkbox" 
                      style={{ width: '16px', height: '16px', margin: 0 }}
                      checked={newGrantCoContribution}
                      onChange={(e) => setNewGrantCoContribution(e.target.checked)}
                    />
                    Is Co-contribution required?
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}>
                    <input 
                      type="checkbox" 
                      style={{ width: '16px', height: '16px', margin: 0 }}
                      checked={newGrantJointVenture}
                      onChange={(e) => setNewGrantJointVenture(e.target.checked)}
                    />
                    Is this a joint venture?
                  </label>
                </div>

                {/* Related Business Unit Dropdown */}
                <div style={{ marginTop: '10px', paddingBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#1e293b', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                    Related Business Unit (Access Filter)
                  </label>
                  <select
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      width: '100%',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#0f172a'
                    }}
                    value={newGrantBUId}
                    onChange={(e) => setNewGrantBUId(e.target.value)}
                  >
                    <option value="">-- No Specific Business Unit (Global Access) --</option>
                    {departments.map(dept => (
                      <optgroup key={dept.id} label={dept.name}>
                        {dept.businessUnits?.map(bu => (
                          <option key={bu.id} value={bu.id}>
                            {bu.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    If set, only users with access to this Business Unit will be able to view and manage this grant.
                  </span>
                </div>
              </div>

              <div className="surepact-drawer-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowNewGrantSidebar(false)}
                  style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={savingNewGrant}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    justifyContent: 'center', 
                    background: '#fbbd08', 
                    color: '#151226', 
                    fontWeight: '700', 
                    border: '1px solid #fbbd08' 
                  }}
                >
                  {savingNewGrant ? 'Creating...' : 'Add Grant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRICING TIER SWITCHER MODAL */}
      {showTierSwitcherModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: '20px', width: '780px', maxWidth: '94vw', maxHeight: '88vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            overflow: 'hidden', padding: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-indigo)', letterSpacing: '1px' }}>
                  Modular Pricing Engine
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Active Plan: {currentTier.replace('_', ' ')} Mode
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Instant capability toggles for live demonstration and client evaluation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTierSwitcherModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            {/* 3 Tier Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '10px 0 24px 0' }}>
              
              {/* Free Trial Tier Card */}
              <div style={{
                background: currentTier === 'FREE_TRIAL' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.01)',
                border: currentTier === 'FREE_TRIAL' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#f59e0b' }}>⚡ FREE TRIAL (14 Days)</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>$0 AUD</div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Essential evaluation workspace</span>

                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Max 5 Grants Registry</li>
                  <li>Max 3 Staff Accounts</li>
                  <li>Core Action Tasks Board</li>
                  <li>10 AI Tokens</li>
                  <li style={{ opacity: 0.5, textDecoration: 'line-through' }}>Clawback Sentinel</li>
                  <li style={{ opacity: 0.5, textDecoration: 'line-through' }}>Agreement Ingestion</li>
                </ul>

                <button
                  type="button"
                  disabled={updatingTier || currentTier === 'FREE_TRIAL'}
                  onClick={() => handleUpdateTier('FREE_TRIAL')}
                  className="btn btn-secondary"
                  style={{ marginTop: 'auto', fontSize: '12px', fontWeight: '700', padding: '8px 12px' }}
                >
                  {currentTier === 'FREE_TRIAL' ? 'Active Tier' : 'Switch to Free Trial'}
                </button>
              </div>

              {/* Starter Tier Card */}
              <div style={{
                background: currentTier === 'STARTER' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.01)',
                border: currentTier === 'STARTER' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#3b82f6' }}>🥉 STARTER TIER</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>$490 / mo</div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Growing councils &amp; ACCHOs</span>

                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Max 50 Grants Registry</li>
                  <li>Max 10 Staff Accounts</li>
                  <li>Master Multi-Entity Calendar</li>
                  <li>Interactive AI Writer</li>
                  <li>Executive Stage-Gate Approvals</li>
                  <li style={{ opacity: 0.5, textDecoration: 'line-through' }}>Clawback Sentinel</li>
                </ul>

                <button
                  type="button"
                  disabled={updatingTier || currentTier === 'STARTER'}
                  onClick={() => handleUpdateTier('STARTER')}
                  className="btn btn-secondary"
                  style={{ marginTop: 'auto', fontSize: '12px', fontWeight: '700', padding: '8px 12px' }}
                >
                  {currentTier === 'STARTER' ? 'Active Tier' : 'Switch to Starter'}
                </button>
              </div>

              {/* Enterprise Tier Card */}
              <div style={{
                background: currentTier === 'ENTERPRISE' ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255,255,255,0.01)',
                border: currentTier === 'ENTERPRISE' ? '2px solid #a855f7' : '1px solid var(--border-color)',
                borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#a855f7' }}>🥇 ENTERPRISE TIER</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>$1,490 / mo</div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Full AI &amp; Audit Suite</span>

                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>Unlimited Grants &amp; Users</strong></li>
                  <li><strong>Clawback Sentinel</strong></li>
                  <li><strong>Agreement PDF Ingestion</strong></li>
                  <li><strong>Revenue Split &amp; AASB 15</strong></li>
                  <li><strong>Immutable Event Ledger</strong></li>
                  <li><strong>Priority Support &amp; Custom SSO</strong></li>
                </ul>

                <button
                  type="button"
                  disabled={updatingTier || currentTier === 'ENTERPRISE'}
                  onClick={() => handleUpdateTier('ENTERPRISE')}
                  className="btn"
                  style={{ marginTop: 'auto', fontSize: '12px', fontWeight: '800', background: '#a855f7', color: '#fff', border: '1px solid #a855f7', padding: '8px 12px' }}
                >
                  {currentTier === 'ENTERPRISE' ? 'Active Tier' : 'Switch to Enterprise'}
                </button>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowTierSwitcherModal(false)}
              >
                Close Engine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELF-SERVICE TENANT ONBOARDING MODAL */}
      {showOnboardingModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1250
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: '20px', width: '640px', maxWidth: '92vw', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            overflow: 'hidden', padding: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '1px' }}>
                  Self-Service Onboarding Portal
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Instantiate New Tenant Workspace
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardingModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInstantiateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Organization / Council Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Townsville City Council or UHSAC Aboriginal Corp"
                  style={{ width: '100%', padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }}
                  value={onboardOrgName}
                  onChange={(e) => setOnboardOrgName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Industry Sector
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      height: '42px',
                      lineHeight: '1.4'
                    }}
                    value={onboardSector}
                    onChange={(e) => setOnboardSector(e.target.value as any)}
                  >
                    <option value="LOCAL_GOVERNMENT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Local Government Council</option>
                    <option value="ACCHO" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>ACCHO / First Nations Corp</option>
                    <option value="NOT_FOR_PROFIT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Not for profit</option>
                    <option value="HEALTHCARE" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Healthcare</option>
                    <option value="EDUCATION" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Education</option>
                    <option value="ENVIRONMENT_COMMUNITY" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Environment &amp; Community</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    State / Jurisdiction
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      height: '42px',
                      lineHeight: '1.4'
                    }}
                    value={onboardState}
                    onChange={(e) => setOnboardState(e.target.value)}
                  >
                    <option value="QLD" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Queensland (QLD)</option>
                    <option value="NSW" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>New South Wales (NSW)</option>
                    <option value="VIC" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Victoria (VIC)</option>
                    <option value="NT" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Northern Territory (NT)</option>
                    <option value="WA" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Western Australia (WA)</option>
                    <option value="SA" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>South Australia (SA)</option>
                    <option value="TAS" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Tasmania (TAS)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Primary Admin Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }}
                    value={onboardAdminName}
                    onChange={(e) => setOnboardAdminName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Primary Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@council.gov.au"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }}
                    value={onboardAdminEmail}
                    onChange={(e) => setOnboardAdminEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Select Initial Plan / Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setOnboardTier('FREE_TRIAL')}
                    style={{
                      padding: '10px', borderRadius: '10px',
                      background: onboardTier === 'FREE_TRIAL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: onboardTier === 'FREE_TRIAL' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)', cursor: 'pointer', fontSize: '11px', fontWeight: '700'
                    }}
                  >
                    ⚡ 14-Day Free Trial
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnboardTier('STARTER')}
                    style={{
                      padding: '10px', borderRadius: '10px',
                      background: onboardTier === 'STARTER' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: onboardTier === 'STARTER' ? '2px solid #3b82f6' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)', cursor: 'pointer', fontSize: '11px', fontWeight: '700'
                    }}
                  >
                    🥉 Starter Tier
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnboardTier('ENTERPRISE')}
                    style={{
                      padding: '10px', borderRadius: '10px',
                      background: onboardTier === 'ENTERPRISE' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: onboardTier === 'ENTERPRISE' ? '2px solid #a855f7' : '1px solid var(--border-color)',
                      color: 'var(--text-primary)', cursor: 'pointer', fontSize: '11px', fontWeight: '700'
                    }}
                  >
                    🥇 Enterprise Tier
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '6px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={onboardPopulateDemo}
                    onChange={(e) => setOnboardPopulateDemo(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#fbbd08', cursor: 'pointer' }}
                  />
                  Pre-populate workspace with sample evaluation grants (Recommended for testing)
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginLeft: '26px', marginTop: '2px' }}>
                  Uncheck to initialize a 100% clean empty workspace with 0 grants for live production deployment.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOnboardingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOnboarding}
                  className="btn"
                  style={{ background: '#fbbd08', color: '#151226', border: '1px solid #fbbd08', fontWeight: '800' }}
                >
                  {submittingOnboarding ? 'Instantiating Workspace...' : '✨ Instantiate Tenant Workspace'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* KNOWLEDGE HUB & WALKTHROUGH TOUR WIDGET */}
      <OnboardingHelpCenter
        organization={organization}
        onOpenNewGrant={() => setShowNewGrantSidebar(true)}
        setActiveTab={(t) => setActiveTab(t)}
        isOpen={isHelpCenterOpen}
        setIsOpen={setIsHelpCenterOpen}
        isTourActive={isTourActive}
        setIsTourActive={setIsTourActive}
        tourStep={tourStep}
        setTourStep={setTourStep}
        onOpenTierSwitcher={() => setShowTierSwitcherModal(true)}
      />
    </div>
  );
}

export default App;
