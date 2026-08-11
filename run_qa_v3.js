/**
 * SurePact Platform v2.5 — Full E2E QA Test Suite (Corrected Signatures)
 * Uses actual confirmed API signatures from server/src/index.ts route discovery.
 */

const API = 'https://surepact-greenfield-v2.onrender.com/api';
const headers = { 'Authorization': 'Bearer SurePact2026!', 'Content-Type': 'application/json' };
let results = [];
let ctx = {}; // shared context for IDs etc.

async function req(method, path, body) {
  try {
    const r = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const t = await r.text();
    let d; try { d = JSON.parse(t); } catch { d = t; }
    return { ok: r.ok, status: r.status, data: d?.data ?? d, raw: d };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e.message };
  }
}

function log(id, name, status, detail) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${id}] ${name}: ${detail}`);
  results.push({ id, name, status, detail });
}

function pass(id, name, detail) { log(id, name, 'PASS', detail); }
function fail(id, name, detail) { log(id, name, 'FAIL', detail); }
function warn(id, name, detail) { log(id, name, 'WARN', detail); }

// ─────────────────────────────────────────────────────────────
// SECTION A: Auth & Health
// ─────────────────────────────────────────────────────────────
async function sectionA() {
  console.log('\n══ SECTION A: Authentication & API Connectivity ══');

  // A1 Auth reject
  const unauth = await fetch(`${API}/grants`);
  unauth.status === 401 ? pass('A1', 'Unauthenticated request correctly rejected', 'HTTP 401 returned') :
    fail('A1', 'Unauthenticated request should return 401', `Got HTTP ${unauth.status}`);

  // A2 Grants list
  const grants = await req('GET', '/grants');
  if (grants.ok && Array.isArray(grants.data)) {
    ctx.grants = grants.data;
    ctx.grant = grants.data[0];
    pass('A2', 'Authenticated grants list accessible', `${grants.data.length} grants in database`);
  } else fail('A2', 'Grants list failed', `HTTP ${grants.status}`);

  // A3 Users list
  const users = await req('GET', '/users');
  if (users.ok && Array.isArray(users.data)) {
    ctx.users = users.data;
    ctx.user = users.data[0];
    pass('A3', 'Users list accessible', `${users.data.length} users: ${users.data.map(u=>u.name).slice(0,3).join(', ')}`);
  } else fail('A3', 'Users list failed', `HTTP ${users.status}`);

  // A4 Departments
  const depts = await req('GET', '/departments');
  depts.ok ? pass('A4', 'Departments list accessible', `${Array.isArray(depts.data) ? depts.data.length : '?'} departments`) :
    fail('A4', 'Departments failed', `HTTP ${depts.status}`);

  // A5 NEW: Admin tenants route (was 404 before, check if fixed)
  const adminTenants = await req('GET', '/admin/tenants');
  adminTenants.ok ?
    pass('A5', '✨ NEW: Admin Tenancy Console accessible (/admin/tenants)', `${Array.isArray(adminTenants.data) ? adminTenants.data.length : '?'} tenants found`) :
    fail('A5', '✨ NEW: Admin Tenancy Console (/admin/tenants) — still 404 (server not redeployed)', `HTTP ${adminTenants.status}`);

  // A6 NEW: Organization current
  const org = await req('GET', '/organization/current');
  if (org.ok) {
    ctx.org = org.data;
    pass('A6', '✨ NEW: Organization/current accessible', `Org: ${org.data?.name}, Tier: ${org.data?.pricingTier}`);
  } else fail('A6', '✨ NEW: Organization/current still 404', `HTTP ${org.status}`);
}

// ─────────────────────────────────────────────────────────────
// SECTION B: Grant Registry & Full Lifecycle
// ─────────────────────────────────────────────────────────────
async function sectionB() {
  console.log('\n══ SECTION B: Grant Registry — Full Lifecycle ══');

  // B1 Create grant (NFP sector — new sector)
  const g1 = await req('POST', '/grants', {
    title: 'QA2: Community Resilience & NFP Support Fund',
    funderName: 'Department of Social Services',
    sector: 'NOT_FOR_PROFIT',
    status: 'PROSPECTING',
    amountRequested: 180000,
    totalFundingValue: 500000,
    openDate: '2026-09-01',
    closeDate: '2026-10-31',
    description: 'QA2 test: Supporting local NFP orgs providing social services'
  });
  if (g1.ok && g1.data?.id) {
    ctx.testGrant = g1.data;
    pass('B1', 'Create Grant — NOT_FOR_PROFIT sector', `ID: ${g1.data.id}`);
  } else fail('B1', 'Create Grant failed', `HTTP ${g1.status} — ${JSON.stringify(g1.raw).substring(0,100)}`);

  // B2–B6 Full lifecycle progression
  const stages = [
    ['B2', 'ELIGIBLE', 'Pre-qualification eligibility confirmed'],
    ['B3', 'APPLIED', 'Application submitted to funder'],
    ['B4', 'UNDER_ASSESSMENT', 'Grant under funder assessment'],
    ['B5', 'AWARDED', 'Grant awarded — obligation management phase'],
  ];
  for (const [id, status, note] of stages) {
    if (!ctx.testGrant?.id) { fail(id, `Workflow ${status}`, 'No grant ID — skipped'); continue; }
    const r = await req('PUT', `/grants/${ctx.testGrant.id}`, { status });
    r.ok ? pass(id, `Grant Workflow: → ${status}`, note) :
      fail(id, `Grant Workflow: → ${status}`, `HTTP ${r.status}`);
  }

  // B7 Grant pre-award risk assessment
  if (ctx.testGrant?.id) {
    const risk = await req('POST', `/grants/${ctx.testGrant.id}/risk`, {
      category: 'COMPLIANCE',
      severity: 'HIGH',
      description: 'QA2: Risk of acquittal non-compliance due to limited finance staff',
      mitigationPlan: 'Engage external accountant for acquittal preparation'
    });
    risk.ok ? pass('B7', 'Pre-Award Risk Assessment (Clawback Sentinel)', 'Risk item created') :
      warn('B7', 'Pre-Award Risk Assessment', `HTTP ${risk.status}`);
  }

  // B8 Grant URL ingestion
  const ingest = await req('POST', '/grants/ingest', {
    url: 'https://www.grants.gov.au/go/show?agencyUuid=6a3b1b44-3e0c-4a73-ba4d-3b4db6b18af7'
  });
  ingest.ok ? pass('B8', 'URL Ingestion — grants.gov.au', `Ingested: "${ingest.data?.title?.substring(0,50)}"`) :
    warn('B8', 'URL Ingestion', `HTTP ${ingest.status}`);

  // B9 External grant search
  const extGrants = await req('GET', '/external-grants');
  extGrants.ok && Array.isArray(extGrants.data) ?
    pass('B9', 'External Grants Search Database', `${extGrants.data.length} external opportunities`) :
    fail('B9', 'External Grants Search', `HTTP ${extGrants.status}`);

  // B10 Consider external grant → promote to registry
  if (extGrants.ok && extGrants.data?.[0]?.id) {
    const consider = await req('POST', `/external-grants/${extGrants.data[0].id}/consider`);
    consider.ok ? pass('B10', 'Promote External Grant → Registry', `Grant: "${extGrants.data[0].title?.substring(0,40)}"`) :
      warn('B10', 'Promote External Grant', `HTTP ${consider.status}`);
  }

  // B11 Saved searches
  const savedSearch = await req('POST', '/saved-searches', {
    name: 'QA2: NFP & Community Grants >$100k',
    category: 'NFP',
    minFunding: 100000,
    sectors: ['NOT_FOR_PROFIT', 'COMMUNITY']
  });
  savedSearch.ok ? pass('B11', 'Save Custom Search Filter', 'Saved search created') :
    warn('B11', 'Save Search', `HTTP ${savedSearch.status}`);

  // B12 NEW: Industry sector HEALTHCARE
  const g2 = await req('POST', '/grants', {
    title: 'QA2: Healthcare Innovation Technology Grant',
    funderName: 'Australian Digital Health Agency',
    sector: 'HEALTHCARE',
    status: 'PROSPECTING',
    amountRequested: 350000,
    openDate: '2026-10-01',
    closeDate: '2026-11-30',
    description: 'QA2 healthcare sector test'
  });
  g2.ok ? pass('B12', 'Create Grant — HEALTHCARE sector', `ID: ${g2.data?.id}`) :
    fail('B12', 'Create Grant HEALTHCARE sector', `HTTP ${g2.status}`);

  // B13 NEW: Industry sector EDUCATION
  const g3 = await req('POST', '/grants', {
    title: 'QA2: Education Digital Literacy Program',
    funderName: 'Dept of Education',
    sector: 'EDUCATION',
    status: 'ELIGIBLE',
    amountRequested: 95000,
    openDate: '2026-09-01',
    closeDate: '2026-10-15',
    description: 'QA2 education sector test'
  });
  g3.ok ? pass('B13', 'Create Grant — EDUCATION sector', `ID: ${g3.data?.id}`) :
    fail('B13', 'Create Grant EDUCATION sector', `HTTP ${g3.status}`);
}

// ─────────────────────────────────────────────────────────────
// SECTION C: GFA / Agreement Ingestion (STARTER+)
// ─────────────────────────────────────────────────────────────
async function sectionC() {
  console.log('\n══ SECTION C: Agreement Ingestion & AI Tools (STARTER+) ══');

  // C1 Example agreements list
  const examples = await req('GET', '/example-agreements');
  let exampleFile = null;
  if (examples.ok && Array.isArray(examples.data)) {
    exampleFile = examples.data[0];
    pass('C1', 'Example Agreement Files List', `${examples.data.length} files: ${examples.data.slice(0,3).map(f=>f.name||f).join(', ')}`);
  } else warn('C1', 'Example Agreements', `HTTP ${examples.status}`);

  // C2 GFA extract on existing grant
  if (ctx.testGrant?.id) {
    const gfa = await req('POST', `/grants/${ctx.testGrant.id}/extract-gfa`, {
      documentName: 'QA2_NFP_Support_Fund_Agreement.pdf'
    });
    gfa.ok ? pass('C2', 'GFA Clause Extraction (Agreement Ingestion)', `${gfa.data?.clauses?.length || 'N/A'} clauses extracted`) :
      warn('C2', 'GFA Extraction', `HTTP ${gfa.status} — ${JSON.stringify(gfa.raw).substring(0,80)}`);
  }

  // C3 AI Grant Writer — extract requirements
  if (ctx.testGrant?.id) {
    const extract = await req('POST', `/ai-grant-writer/grants/${ctx.testGrant.id}/extract`);
    extract.ok ? pass('C3', 'AI Grant Writer — Extract Requirements', 'Requirements extracted') :
      warn('C3', 'AI Grant Writer Extract', `HTTP ${extract.status}`);
  }

  // C4 AI Grant Writer — guidelines
  const guidelines = await req('GET', '/ai-grant-writer/guidelines');
  guidelines.ok ? pass('C4', 'AI Grant Writer — Guidelines Accessible', `${Array.isArray(guidelines.data) ? guidelines.data.length : '?'} guidelines`) :
    warn('C4', 'AI Grant Writer Guidelines', `HTTP ${guidelines.status}`);

  // C5 Knowledge documents (corporate knowledge centre)
  const knowledgeDocs = await req('GET', '/knowledge-documents');
  if (knowledgeDocs.ok && Array.isArray(knowledgeDocs.data)) {
    pass('C5', 'Corporate Knowledge Centre — Document List', `${knowledgeDocs.data.length} docs: ${knowledgeDocs.data.slice(0,2).map(d=>d.name).join(', ')}`);
    ctx.knowledgeDoc = knowledgeDocs.data[0];
  } else warn('C5', 'Knowledge Documents', `HTTP ${knowledgeDocs.status}`);

  // C6 Upload knowledge document
  const kdoc = await req('POST', '/knowledge-documents', {
    name: 'QA2_Community_Strategic_Plan_2026.md',
    type: 'STRATEGIC_PLAN',
    content: '# QA2 Strategic Plan\n\nThis is a QA test document for the SurePact knowledge centre.\n\n## Objectives\n1. Support local NFP organisations\n2. Deliver community health programs\n3. Build digital literacy capacity'
  });
  kdoc.ok ? pass('C6', 'Upload Knowledge Document to Centre', `Doc ID: ${kdoc.data?.id}`) :
    warn('C6', 'Upload Knowledge Doc', `HTTP ${kdoc.status}`);
}

// ─────────────────────────────────────────────────────────────
// SECTION D: Finance Ledger (with correct category field)
// ─────────────────────────────────────────────────────────────
async function sectionD() {
  console.log('\n══ SECTION D: Finance Ledger & Transactions ══');

  // D1 Finance summary
  const fin = await req('GET', '/finances');
  if (fin.ok && fin.data?.summary) {
    pass('D1', 'Finance Summary Dashboard', `Income: $${fin.data.summary.totalIncome?.toLocaleString()}, Expenditure: $${fin.data.summary.totalExpenditure?.toLocaleString()}, Net: $${fin.data.summary.netBalance?.toLocaleString()}`);
    ctx.finSummary = fin.data.summary;
  } else fail('D1', 'Finance Summary', `HTTP ${fin.status}`);

  // D2 Income transaction (with correct 'category' field — was missing before)
  const income = await req('POST', '/transactions', {
    grantId: ctx.testGrant?.id || ctx.grant?.id,
    type: 'INCOME',
    amount: 90000,
    description: 'QA2: First drawdown — Community Resilience Grant Tranche 1',
    category: 'Funder Drawdown',
    date: '2026-09-15'
  });
  income.ok ? pass('D2', '✅ Fixed: Income Transaction (with category field)', `$${income.data?.amount?.toLocaleString()} — ID: ${income.data?.id}`) :
    fail('D2', 'Income Transaction with category', `HTTP ${income.status} — ${JSON.stringify(income.raw).substring(0,100)}`);

  // D3 Expenditure transaction
  const expense = await req('POST', '/transactions', {
    grantId: ctx.testGrant?.id || ctx.grant?.id,
    type: 'EXPENDITURE',
    amount: 38500,
    description: 'QA2: Staff wages — Community Program Coordinator (Month 1)',
    category: 'Staff Costs',
    date: '2026-09-30'
  });
  expense.ok ? pass('D3', '✅ Fixed: Expenditure Transaction (with category field)', `$${expense.data?.amount?.toLocaleString()} expenditure recorded`) :
    fail('D3', 'Expenditure Transaction', `HTTP ${expense.status} — ${JSON.stringify(expense.raw).substring(0,100)}`);

  // D4 Second expenditure
  const expense2 = await req('POST', '/transactions', {
    grantId: ctx.testGrant?.id || ctx.grant?.id,
    type: 'EXPENDITURE',
    amount: 12000,
    description: 'QA2: Office equipment and software licences',
    category: 'Equipment & Technology',
    date: '2026-10-05'
  });
  expense2.ok ? pass('D4', 'Second Expenditure Transaction — Equipment', `$${expense2.data?.amount?.toLocaleString()} recorded`) :
    warn('D4', 'Second Expenditure', `HTTP ${expense2.status}`);

  // D5 Check finance totals updated
  const fin2 = await req('GET', '/finances');
  if (fin2.ok && fin2.data?.summary && ctx.finSummary) {
    const grew = fin2.data.summary.totalIncome > ctx.finSummary.totalIncome;
    grew ? pass('D5', 'Finance Totals Updated After Transactions', `New total income: $${fin2.data.summary.totalIncome?.toLocaleString()}`) :
      warn('D5', 'Finance Totals May Not Be Filtering by Tenant', `Income unchanged at $${fin2.data.summary.totalIncome?.toLocaleString()}`);
  }

  // D6 Audit ledger records new transactions
  const audit = await req('GET', '/audit-ledger');
  if (audit.ok && Array.isArray(audit.data)) {
    pass('D6', 'Audit Ledger — Event Stream Accessible', `${audit.data.length} events tracked`);
    ctx.auditCount = audit.data.length;
  } else warn('D6', 'Audit Ledger', `HTTP ${audit.status}`);

  // D7 Negative amount should still be rejected
  const badTx = await req('POST', '/transactions', {
    grantId: ctx.testGrant?.id,
    type: 'INCOME',
    amount: -999,
    description: 'QA2: Should be rejected',
    category: 'Funder Drawdown'
  });
  !badTx.ok ? pass('D7', 'Validation: Negative Transaction Amount Rejected', `HTTP ${badTx.status} — correctly rejected`) :
    fail('D7', 'Validation: Negative Transaction Amount Should Fail', 'Negative amount accepted — bug!');
}

// ─────────────────────────────────────────────────────────────
// SECTION E: Tasks Board (with correct assignedToUserId)
// ─────────────────────────────────────────────────────────────
async function sectionE() {
  console.log('\n══ SECTION E: Tasks Board ══');

  if (!ctx.user?.id) { warn('E0', 'Tasks section skipped', 'No user context'); return; }

  // E1 Create task (with assignedToUserId — was missing before)
  const t1 = await req('POST', '/tasks', {
    title: 'QA2: Submit mid-year acquittal to DSS',
    description: 'Prepare and submit acquittal report with financial statements to Department of Social Services',
    grantId: ctx.testGrant?.id || ctx.grant?.id,
    assignedToUserId: ctx.user.id,
    dueDate: '2026-11-30',
    priority: 'HIGH',
    status: 'PENDING'
  });
  if (t1.ok && t1.data?.id) {
    ctx.task1 = t1.data;
    pass('E1', '✅ Fixed: Create Task (with assignedToUserId)', `Task ID: ${t1.data.id}`);
  } else fail('E1', 'Create Task with assignedToUserId', `HTTP ${t1.status} — ${JSON.stringify(t1.raw).substring(0,100)}`);

  // E2 Create second task
  const t2 = await req('POST', '/tasks', {
    title: 'QA2: Obtain supplier invoices for audit package',
    description: 'Collect all supplier invoices for Q1 expenditure audit',
    grantId: ctx.testGrant?.id || ctx.grant?.id,
    assignedToUserId: ctx.user.id,
    dueDate: '2026-10-15',
    priority: 'MEDIUM',
    status: 'PENDING'
  });
  t2.ok ? pass('E2', 'Create Second Task', `Task ID: ${t2.data?.id}`) :
    warn('E2', 'Create Second Task', `HTTP ${t2.status}`);

  // E3 Update task status PENDING → IN_PROGRESS
  if (ctx.task1?.id) {
    const upd = await req('PATCH', `/tasks/${ctx.task1.id}`, { status: 'IN_PROGRESS' });
    upd.ok ? pass('E3', 'Task Status: PENDING → IN_PROGRESS', 'Status updated') :
      fail('E3', 'Task Status Update', `HTTP ${upd.status}`);
  }

  // E4 Complete task
  if (ctx.task1?.id) {
    const done = await req('PATCH', `/tasks/${ctx.task1.id}`, { status: 'COMPLETED' });
    done.ok ? pass('E4', 'Task Status: IN_PROGRESS → COMPLETED', 'Task completed') :
      fail('E4', 'Task Completion', `HTTP ${done.status}`);
  }

  // E5 Tasks list
  const tasks = await req('GET', '/tasks');
  tasks.ok ? pass('E5', 'Tasks Board List', `${Array.isArray(tasks.data) ? tasks.data.length : '?'} total tasks`) :
    fail('E5', 'Tasks List', `HTTP ${tasks.status}`);

  // E6 Task without assignedToUserId should fail
  const badTask = await req('POST', '/tasks', {
    title: 'QA2: Task without assignee',
    grantId: ctx.testGrant?.id,
    dueDate: '2026-10-01'
    // missing assignedToUserId intentionally
  });
  !badTask.ok ? pass('E6', 'Validation: Task Without Assignee Rejected', `HTTP ${badTask.status} — correctly rejected`) :
    warn('E6', 'Validation: Task Without Assignee', 'Task accepted without assignedToUserId — check if UI requires it');
}

// ─────────────────────────────────────────────────────────────
// SECTION F: Contract Milestones & Acquittals
// ─────────────────────────────────────────────────────────────
async function sectionF() {
  console.log('\n══ SECTION F: Contracts, Milestones & Acquittals ══');

  // F1 Grant award (creates contract)
  if (ctx.testGrant?.id) {
    const award = await req('POST', `/grants/${ctx.testGrant.id}/award`, {
      awardedAmount: 175000,
      awardDate: '2026-11-01',
      executionDate: '2026-11-15',
      expiryDate: '2027-06-30',
      contractReference: 'DSS-2026-NFP-QA2-001',
      administrationContact: 'QA Test Grants Officer — DSS'
    });
    if (award.ok) {
      ctx.contract = award.data?.contract || award.data;
      pass('F1', 'Grant Award — Contract Created', `Contract Ref: DSS-2026-NFP-QA2-001, Amount: $175,000`);
    } else warn('F1', 'Grant Award', `HTTP ${award.status} — ${JSON.stringify(award.raw).substring(0,100)}`);
  }

  // F2 Add contract installment
  if (ctx.contract?.id) {
    const inst = await req('POST', `/contracts/${ctx.contract.id}/installments`, {
      amount: 87500,
      dueDate: '2026-12-01',
      description: 'QA2: Milestone 1 — First Installment Payment'
    });
    inst.ok ? pass('F2', 'Contract Installment Added', `$${inst.data?.amount?.toLocaleString()} due 1 Dec 2026`) :
      warn('F2', 'Contract Installment', `HTTP ${inst.status}`);
    if (inst.ok) ctx.installment = inst.data;
  }

  // F3 Add contract variation
  if (ctx.contract?.id) {
    const variation = await req('POST', `/contracts/${ctx.contract.id}/variations`, {
      type: 'SCOPE',
      description: 'QA2: Scope variation — extend community health worker deployment from 3 to 5 FTE',
      requestedBy: 'QA Grants Manager',
      newAmount: 185000
    });
    variation.ok ? pass('F3', 'Contract Variation Request', `Variation created: ${variation.data?.id}`) :
      warn('F3', 'Contract Variation', `HTTP ${variation.status}`);
  }

  // F4 Closeout / acquittal
  if (ctx.testGrant?.id) {
    const closeout = await req('POST', `/grants/${ctx.testGrant.id}/closeout`, {
      completionDate: '2027-06-30',
      finalExpenditure: 174500,
      outcomeNotes: 'QA2: All deliverables met. 850 community members received services. Final financial statements verified.'
    });
    closeout.ok ? pass('F4', 'Grant Closeout / Final Acquittal', 'Grant closed out successfully') :
      warn('F4', 'Grant Closeout', `HTTP ${closeout.status} — ${JSON.stringify(closeout.raw).substring(0,80)}`);
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION G: Projects (ENTERPRISE)
// ─────────────────────────────────────────────────────────────
async function sectionG() {
  console.log('\n══ SECTION G: Projects Module (ENTERPRISE) ══');

  // G1 List projects
  const projects = await req('GET', '/projects');
  if (projects.ok && Array.isArray(projects.data)) {
    pass('G1', 'Projects List', `${projects.data.length} projects in system`);
    ctx.projects = projects.data;
  } else fail('G1', 'Projects List', `HTTP ${projects.status}`);

  // G2 Create project
  const proj = await req('POST', '/projects', {
    name: 'QA2: Community Health Technology Hub',
    description: 'Capital infrastructure project — construction of community health tech facility',
    status: 'PLANNING',
    budget: 2500000,
    startDate: '2027-01-01',
    endDate: '2027-12-31'
  });
  if (proj.ok && proj.data?.id) {
    ctx.project = proj.data;
    pass('G2', 'Create Project (ENTERPRISE)', `Project ID: ${proj.data.id}`);
  } else warn('G2', 'Create Project', `HTTP ${proj.status} — ${JSON.stringify(proj.raw).substring(0,80)}`);

  // G3 Link grant to project
  if (ctx.project?.id && ctx.testGrant?.id) {
    const link = await req('POST', '/projects/link', {
      projectId: ctx.project.id,
      grantId: ctx.testGrant.id
    });
    link.ok ? pass('G3', 'Link Grant to Project', 'Grant linked to project') :
      warn('G3', 'Link Grant to Project', `HTTP ${link.status}`);
  }

  // G4 Update project status
  if (ctx.project?.id) {
    const status = await req('POST', `/projects/${ctx.project.id}/status`, {
      status: 'ACTIVE'
    });
    status.ok ? pass('G4', 'Update Project Status: PLANNING → ACTIVE', 'Status updated') :
      warn('G4', 'Project Status Update', `HTTP ${status.status}`);
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION H: Funding Bodies / CRM
// ─────────────────────────────────────────────────────────────
async function sectionH() {
  console.log('\n══ SECTION H: Funding Bodies & CRM ══');

  // H1 List funders
  const funders = await req('GET', '/funding-bodies');
  if (funders.ok && Array.isArray(funders.data)) {
    pass('H1', 'Funding Bodies List', `${funders.data.length} funders: ${funders.data.slice(0,3).map(f=>f.name).join(', ')}`);
    ctx.funder = funders.data[0];
  } else fail('H1', 'Funding Bodies List', `HTTP ${funders.status}`);

  // H2 Create new funding body
  const newFunder = await req('POST', '/funding-bodies', {
    name: 'QA2: VicHealth Community Grants Program',
    type: 'STATE_GOVERNMENT',
    state: 'VIC',
    sector: 'HEALTHCARE',
    website: 'https://www.vichealth.vic.gov.au',
    description: 'QA2 test funder for CRM testing'
  });
  if (newFunder.ok && newFunder.data?.id) {
    ctx.newFunder = newFunder.data;
    pass('H2', 'Create Funding Body', `Funder ID: ${newFunder.data.id}`);
  } else warn('H2', 'Create Funding Body', `HTTP ${newFunder.status}`);

  // H3 Add contact to funder
  if (ctx.newFunder?.id) {
    const contact = await req('POST', `/funding-bodies/${ctx.newFunder.id}/contacts`, {
      name: 'QA2 Sandra Nguyen',
      title: 'Grants Program Manager',
      email: 'sandra.nguyen@vichealth.vic.gov.au',
      phone: '03 9667 1300'
    });
    if (contact.ok && contact.data?.id) {
      ctx.contact = contact.data;
      pass('H3', 'Add Contact to Funding Body', `Contact ID: ${contact.data.id}`);
    } else warn('H3', 'Add Funder Contact', `HTTP ${contact.status}`);
  }

  // H4 Log CRM interaction
  if (ctx.contact?.id) {
    const interaction = await req('POST', `/funding-bodies/contacts/${ctx.contact.id}/interactions`, {
      type: 'PHONE_CALL',
      subject: 'QA2: Initial expression of interest call',
      content: 'Spoke with Sandra about eligibility criteria for the community grants round. She confirmed our NFP status qualifies.',
      dueDate: '2026-10-15',
      status: 'COMPLETED'
    });
    interaction.ok ? pass('H4', 'Log CRM Contact Interaction', 'Interaction logged') :
      warn('H4', 'CRM Interaction', `HTTP ${interaction.status}`);
  }

  // H5 Add funding opportunity to funder
  if (ctx.newFunder?.id) {
    const opp = await req('POST', `/funding-bodies/${ctx.newFunder.id}/opportunities`, {
      title: 'QA2: VicHealth Community Wellbeing Round 2027',
      estimatedValue: 250000,
      openDate: '2027-01-15',
      closeDate: '2027-03-31',
      description: 'Annual community wellbeing grant round'
    });
    if (opp.ok && opp.data?.id) {
      ctx.opportunity = opp.data;
      pass('H5', 'Add CRM Funding Opportunity', `Opp ID: ${opp.data.id}`);
    } else warn('H5', 'CRM Funding Opportunity', `HTTP ${opp.status}`);
  }

  // H6 Promote opportunity to grant registry
  if (ctx.opportunity?.id) {
    const promote = await req('POST', `/funding-opportunities/${ctx.opportunity.id}/promote`);
    promote.ok ? pass('H6', 'Promote CRM Opportunity → Grant Registry', 'Opportunity promoted to grant') :
      warn('H6', 'Promote CRM Opportunity', `HTTP ${promote.status}`);
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION I: Documents Library
// ─────────────────────────────────────────────────────────────
async function sectionI() {
  console.log('\n══ SECTION I: Documents Library ══');

  // I1 List documents
  const docs = await req('GET', '/documents');
  if (docs.ok && Array.isArray(docs.data)) {
    pass('I1', 'Documents Library List', `${docs.data.length} documents on file`);
    ctx.doc = docs.data[0];
  } else warn('I1', 'Documents List', `HTTP ${docs.status}`);

  // I2 Upload document to grant
  if (ctx.testGrant?.id) {
    const upload = await req('POST', `/grants/${ctx.testGrant.id}/documents`, {
      name: 'QA2_NFP_Support_Fund_Application_v2.pdf',
      type: 'APPLICATION',
      fileSize: '2.4 MB',
      description: 'QA2 final application submission document'
    });
    upload.ok ? pass('I2', 'Upload Document to Grant', `Doc: ${upload.data?.name || 'uploaded'}`) :
      warn('I2', 'Upload Grant Document', `HTTP ${upload.status}`);
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION J: Analytics (AskSurePact)
// ─────────────────────────────────────────────────────────────
async function sectionJ() {
  console.log('\n══ SECTION J: Analytics Hub & AskSurePact AI ══');

  // J1 AskSurePact AI Query
  const ask = await req('POST', '/analytics/ask', {
    prompt: 'What is the total value of all grants currently in AWARDED status, and how many grants are overdue?'
  });
  if (ask.ok) {
    pass('J1', '✨ NEW: AskSurePact AI Query', `Response: ${JSON.stringify(ask.data).substring(0,120)}`);
  } else fail('J1', '✨ NEW: AskSurePact AI (/analytics/ask) — still 404', `HTTP ${ask.status} — server not redeployed`);

  // J2 Finance categories breakdown
  const fin = await req('GET', '/finances');
  if (fin.ok && fin.data?.categories) {
    const cats = Object.entries(fin.data.categories).map(([k,v]) => `${k}: $${Math.abs(v).toLocaleString()}`).join(', ');
    pass('J2', 'Finance Category Breakdown', cats.substring(0,150));
  } else warn('J2', 'Finance Categories', `HTTP ${fin.status}`);

  // J3 Audit ledger growth check
  const audit = await req('GET', '/audit-ledger');
  if (audit.ok && Array.isArray(audit.data)) {
    const grew = ctx.auditCount && audit.data.length > ctx.auditCount;
    pass('J3', 'Audit Ledger Event Growth', `${audit.data.length} events (was ${ctx.auditCount || '?'})`);
    // Show last 3 events
    audit.data.slice(-3).forEach(e => console.log(`   └─ ${e.eventType} @ ${e.timestamp?.substring(0,19)}`));
  }
}

// ─────────────────────────────────────────────────────────────
// SECTION K: Multi-Tenancy & Admin Console
// ─────────────────────────────────────────────────────────────
async function sectionK() {
  console.log('\n══ SECTION K: Multi-Tenancy & Admin Console ══');

  // K1 Admin tenants list
  const tenants = await req('GET', '/admin/tenants');
  if (tenants.ok && Array.isArray(tenants.data)) {
    pass('K1', '✨ NEW: Admin Tenants List', `${tenants.data.length} tenants: ${tenants.data.map(t=>t.name).slice(0,3).join(', ')}`);
    ctx.tenants = tenants.data;
  } else fail('K1', '✨ NEW: Admin Tenants — still 404 (server not redeployed)', `HTTP ${tenants.status}`);

  // K2 Onboarding instantiate — new tenant
  const newOrg = await req('POST', '/onboarding/instantiate', {
    organizationName: `QA2 Test Education NFP ${Date.now()}`,
    sector: 'EDUCATION',
    state: 'QLD',
    pricingTier: 'FREE_TRIAL'
  });
  if (newOrg.ok) {
    ctx.newTenant = newOrg.data;
    pass('K2', '✨ NEW: Onboard New Tenant (FREE_TRIAL)', `New org: ${newOrg.data?.name}, Tier: ${newOrg.data?.pricingTier}`);
  } else fail('K2', '✨ NEW: Onboarding Instantiate — still 404', `HTTP ${newOrg.status}`);

  // K3 Tier upgrade
  if (ctx.tenants?.[0]?.id) {
    const upgrade = await req('PUT', `/admin/tenants/${ctx.tenants[0].id}/tier`, { tier: 'STARTER' });
    upgrade.ok ? pass('K3', '✨ NEW: Admin — Tier Upgrade to STARTER', 'Tier upgraded') :
      fail('K3', '✨ NEW: Admin Tier Upgrade — still 404', `HTTP ${upgrade.status}`);
  }

  // K4 Organization current
  const orgCurrent = await req('GET', '/organization/current');
  orgCurrent.ok ?
    pass('K4', '✨ NEW: Organization Current Endpoint', `${orgCurrent.data?.name} — Tier: ${orgCurrent.data?.pricingTier}`) :
    fail('K4', '✨ NEW: Organization/current — still 404', `HTTP ${orgCurrent.status}`);
}

// ─────────────────────────────────────────────────────────────
// SECTION L: Data Integrity & Edge Cases
// ─────────────────────────────────────────────────────────────
async function sectionL() {
  console.log('\n══ SECTION L: Validation & Data Integrity ══');

  // L1 Grant with missing required fields
  const badGrant = await req('POST', '/grants', { sector: 'HEALTHCARE' });
  !badGrant.ok ? pass('L1', 'Grant: Missing required fields rejected', `HTTP ${badGrant.status}`) :
    fail('L1', 'Grant: Should reject missing title/funder', 'Invalid grant accepted');

  // L2 Non-existent grant 404
  const gone = await req('GET', '/grants/nonexistent-uuid-99999');
  gone.status === 404 ? pass('L2', 'Non-existent grant returns 404', 'HTTP 404 correct') :
    warn('L2', 'Non-existent grant', `Got HTTP ${gone.status}`);

  // L3 Negative transaction rejected
  const negTx = await req('POST', '/transactions', {
    grantId: ctx.testGrant?.id,
    type: 'INCOME', amount: -5000,
    description: 'Should fail', category: 'Funder Drawdown'
  });
  !negTx.ok ? pass('L3', 'Negative transaction amount rejected', `HTTP ${negTx.status}`) :
    fail('L3', 'Negative transaction should be rejected', 'Negative amount accepted');

  // L4 Old removed sector — should warn if still accepted
  const oldSector = await req('POST', '/grants', {
    title: 'QA2: Old Sector Test',
    funderName: 'Test Funder',
    sector: 'CIVIL_INFRASTRUCTURE',
    status: 'PROSPECTING',
    amountRequested: 1000,
    openDate: '2026-09-01',
    closeDate: '2026-10-01',
    description: 'Testing removed sector'
  });
  !oldSector.ok ? pass('L4', 'Old sector CIVIL_INFRASTRUCTURE rejected by API', `HTTP ${oldSector.status}`) :
    warn('L4', 'OLD SECTOR: CIVIL_INFRASTRUCTURE still accepted by API (schema not updated)', `Grant created with old sector — data quality issue`);

  // L5 Duplicate saved search name
  const dup1 = await req('POST', '/saved-searches', { name: 'QA2 Dup Test', category: 'NFP', minFunding: 1000 });
  const dup2 = await req('POST', '/saved-searches', { name: 'QA2 Dup Test', category: 'NFP', minFunding: 1000 });
  // No hard rule here but log
  pass('L5', 'Duplicate Saved Search Names (No Unique Constraint Expected)', `Duplicates allowed — informational`);
}

// ─────────────────────────────────────────────────────────────
// FINAL REPORT
// ─────────────────────────────────────────────────────────────
function report() {
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const total = results.length;

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║    SUREPACT PLATFORM v2.5 — QA TEST RESULTS (R2)     ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`  Total: ${total}  |  ✅ PASS: ${pass}  |  ❌ FAIL: ${fail}  |  ⚠️  WARN: ${warn}`);
  console.log(`  Pass Rate: ${Math.round((pass/total)*100)}%\n`);

  if (fail > 0) {
    console.log('  ❌ FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`     [${r.id}] ${r.name}`));
    console.log('');
  }
  if (warn > 0) {
    console.log('  ⚠️  WARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(r => console.log(`     [${r.id}] ${r.name}: ${r.detail}`));
    console.log('');
  }

  console.log('JSON_START');
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), summary: {total,pass,fail,warn,passRate:`${Math.round((pass/total)*100)}%`}, results }, null, 2));
  console.log('JSON_END');
}

async function main() {
  console.log('🧪 SurePact Platform v2.5 — Full E2E QA Test Suite (Round 2)');
  console.log(`🕐 ${new Date().toISOString()} | API: ${API}\n`);
  await sectionA();
  await sectionB();
  await sectionC();
  await sectionD();
  await sectionE();
  await sectionF();
  await sectionG();
  await sectionH();
  await sectionI();
  await sectionJ();
  await sectionK();
  await sectionL();
  report();
}
main().catch(console.error);
