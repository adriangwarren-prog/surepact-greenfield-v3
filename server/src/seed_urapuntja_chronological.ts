import { db } from './db';
import { ensurePdfAssetsOnDisk, generatePdfBuffer } from './generate_pdf_assets';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

// Multi-tenant ORG_ID passed dynamically


export async function seedChronologicalUrapuntjaDemoForOrg(ORG_ID = 'demo-org-1') {

  console.log('================================================================');
  console.log('🚀 Starting Deep Chronological Seeding for Urapuntja Health Service');
  console.log('================================================================');

  // 1. Ensure PDF assets exist on disk
  ensurePdfAssetsOnDisk();

  // 2. Wipe database in reverse foreign-key order
  console.log('🧹 Purging all legacy test data...');
  await db.auditLog.deleteMany({});
  await db.knowledgeDocument.deleteMany({});
  await db.businessUnitUser.deleteMany({});
  await db.contactInteraction.deleteMany({});
  await db.fundingOpportunity.deleteMany({});
  await db.fundingBodyContact.deleteMany({});
  await db.fundingBody.deleteMany({});
  await db.document.deleteMany({});
  await db.transaction.deleteMany({});
  await db.contractVariation.deleteMany({});
  await db.milestoneTask.deleteMany({});
  await db.milestone.deleteMany({});
  await db.installment.deleteMany({});
  await db.contract.deleteMany({});
  await db.grantProjectMapping.deleteMany({});
  await db.project.deleteMany({});
  await db.riskAssessment.deleteMany({});
  await db.grantRequirementResponse.deleteMany({});
  await db.grant.deleteMany({});
  await db.businessUnit.deleteMany({});
  await db.department.deleteMany({});
  await db.user.deleteMany({});

  console.log('✅ Database completely purged.');

  // 3. Seed Departments & Business Units
  console.log('🏢 Seeding Urapuntja Health Service Org Structure...');
  const deptExec = await db.department.create({ data: { name: 'Executive & Governance', description: 'Board of Directors & Office of the CEO' } });
  const deptClinical = await db.department.create({ data: { name: 'Health & Clinical Services', description: 'Primary health clinics, mobile outreach, maternal & child health' } });
  const deptInfra = await db.department.create({ data: { name: 'Homelands & Infrastructure', description: 'Outstations water, solar, transport fleet & capital works' } });
  const deptFinance = await db.department.create({ data: { name: 'Finance & Grant Compliance', description: 'Grant procurement, obligation tracking, and acquittals' } });

  const buCEO = await db.businessUnit.create({ data: { name: 'Office of the CEO', departmentId: deptExec.id } });
  const buPrimary = await db.businessUnit.create({ data: { name: 'Primary Healthcare & Telehealth', departmentId: deptClinical.id } });
  const buMaternal = await db.businessUnit.create({ data: { name: 'Maternal & Child Health (Birthing on Country)', departmentId: deptClinical.id } });
  const buInfra = await db.businessUnit.create({ data: { name: 'Outstations Water & Solar Infrastructure', departmentId: deptInfra.id } });
  const buFleet = await db.businessUnit.create({ data: { name: 'Mobile Clinic Fleet & Logistics', departmentId: deptInfra.id } });
  const buGrants = await db.businessUnit.create({ data: { name: 'Grants & Acquittals Compliance', departmentId: deptFinance.id } });

  // 4. Seed Staff Users (Adrian Warren as Grants Manager)
  console.log('👥 Seeding Staff & Grants Managers...');
  const defaultPassHash = await bcrypt.hash('SurePact2026!', 10);
  const uAdrian = await db.user.create({
    data: { name: 'Adrian Warren', email: 'adrian.warren@surepact.com', department: 'Finance & Grant Compliance', role: 'admin', status: 'Active', passwordHash: defaultPassHash }
  });
  const uMelissa = await db.user.create({
    data: { name: 'Melissa Hinson', email: 'melissa.hinson@urapuntja.org.au', department: 'Executive & Governance', role: 'admin', status: 'Active', passwordHash: defaultPassHash }
  });
  const uBoyle = await db.user.create({
    data: { name: 'Dr. David Boyle', email: 'david.boyle@urapuntja.org.au', department: 'Health & Clinical Services', role: 'staff', status: 'Active', passwordHash: defaultPassHash }
  });
  const uJenkins = await db.user.create({
    data: { name: 'Sarah Jenkins', email: 'sarah.jenkins@urapuntja.org.au', department: 'Health & Clinical Services', role: 'staff', status: 'Active', passwordHash: defaultPassHash }
  });
  const uDeluis = await db.user.create({
    data: { name: 'Marcus Deluis', email: 'marcus.deluis@urapuntja.org.au', department: 'Homelands & Infrastructure', role: 'staff', status: 'Active', passwordHash: defaultPassHash }
  });
  const uChristine = await db.user.create({
    data: { name: 'Christine Malinao', email: 'christine.malinao@urapuntja.org.au', department: 'Finance & Grant Compliance', role: 'staff', status: 'Active', passwordHash: defaultPassHash }
  });
  const uNicole = await db.user.create({
    data: { name: 'Nicole Sherwin', email: 'nicole.sherwin@urapuntja.org.au', department: 'Finance & Grant Compliance', role: 'staff', status: 'Active', passwordHash: defaultPassHash }
  });

  await db.businessUnitUser.createMany({
    data: [
      { userId: uAdrian.id, businessUnitId: buGrants.id },
      { userId: uAdrian.id, businessUnitId: buCEO.id },
      { userId: uMelissa.id, businessUnitId: buCEO.id },
      { userId: uBoyle.id, businessUnitId: buPrimary.id },
      { userId: uJenkins.id, businessUnitId: buMaternal.id },
      { userId: uDeluis.id, businessUnitId: buInfra.id },
      { userId: uDeluis.id, businessUnitId: buFleet.id },
      { userId: uChristine.id, businessUnitId: buGrants.id },
      { userId: uNicole.id, businessUnitId: buGrants.id }
    ]
  });

  // 5. Seed Knowledge Base Documents (Downloadable PDF Assets)
  console.log('📚 Seeding Knowledge Base PDF Assets...');
  const kbFiles = [
    { name: 'UHSAC_Corporate_Profile_2025.pdf', type: 'STRATEGIC_PLAN', size: '2.4 MB' },
    { name: 'UHSAC_Strategic_Plan_2024_2029.pdf', type: 'STRATEGIC_PLAN', size: '3.1 MB' },
    { name: 'UHSAC_Annual_Report_2023_2024.pdf', type: 'ANNUAL_REPORT', size: '4.8 MB' },
    { name: 'UHSAC_Annual_Report_2024_2025.pdf', type: 'ANNUAL_REPORT', size: '5.2 MB' },
    { name: 'UHSAC_Health_Services_Capability_Statement.pdf', type: 'OTHER', size: '1.9 MB' },
    { name: 'UHSAC_Clinical_Governance_Policy.pdf', type: 'OTHER', size: '2.1 MB' },
    { name: 'Past_Winning_Proposal_NHMRC_2023.pdf', type: 'PROJECT_PLAN', size: '3.5 MB' },
    { name: 'UHSAC_Infrastructure_and_Fleet_Asset_Plan.pdf', type: 'PROJECT_PLAN', size: '2.7 MB' }
  ];

  for (const f of kbFiles) {
    await db.knowledgeDocument.create({
      data: {
        organizationId: ORG_ID,
        name: f.name,
        type: f.type,
        fileSize: f.size,
        uploadedBy: 'Adrian Warren (Grants Manager)',
        content: `PDF Asset Document: ${f.name}. Stored in Knowledge Base repository.`
      }
    });
  }

  // 6. Seed 12 Projects
  console.log('🏗️ Seeding 12 Projects...');
  const pClinicOps = await db.project.create({ data: { name: 'Soapy Bore Central Primary Clinic Operations 2024-2026', description: 'Core primary care, pharmacy dispensing, emergency triage, and telehealth services.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 1850000, businessUnitId: buPrimary.id } });
  const pMobileVans = await db.project.create({ data: { name: 'Utopia Homelands Mobile 4WD Clinic Van Expansion', description: 'Procurement and weekly clinical operations of 4WD mobile health vans across 16 homelands.', department: 'Homelands & Infrastructure', status: 'IN_PROGRESS', budgetAmount: 615000, businessUnitId: buFleet.id } });
  const pBirthing = await db.project.create({ data: { name: 'Birthing on Country Maternal & Child Health Initiative', description: 'Culturally safe maternal care, local midwifery training, and antenatal/postnatal visits.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 1720000, businessUnitId: buMaternal.id } });
  const pWaterSolar = await db.project.create({ data: { name: 'Outstation Emergency Water & Solar Microgrid Upgrade', description: 'Reverse osmosis water filtration plants and solar battery storage across outer homelands.', department: 'Homelands & Infrastructure', status: 'IN_PROGRESS', budgetAmount: 945000, businessUnitId: buInfra.id } });
  const pTelehealth = await db.project.create({ data: { name: 'Chronic Disease Telehealth & Digital Health Hub', description: 'Digital ECGs, portable ultrasound units, and satellite connection for remote consultations.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 1290000, businessUnitId: buPrimary.id } });
  const pYouth = await db.project.create({ data: { name: 'Utopia Homelands Youth Well-being & Recreation Spaces', description: 'Youth sports equipment, mental health workshops, and community gathering spaces.', department: 'Homelands & Infrastructure', status: 'CLOSED', budgetAmount: 510000, businessUnitId: buInfra.id } });
  const pCancer = await db.project.create({ data: { name: 'First Nations Cancer Screening & Community Support Unit', description: 'Mobile cancer screening outreach, education campaigns, and patient navigation.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 1130000, businessUnitId: buPrimary.id } });
  const pHousing = await db.project.create({ data: { name: 'Remote Healthcare Staff Housing & Retention Program', description: 'Staff housing maintenance, retention allowances, and clinical worker professional development.', department: 'Executive & Governance', status: 'IN_PROGRESS', budgetAmount: 1240000, businessUnitId: buCEO.id } });
  const pArlparra = await db.project.create({ data: { name: 'Arlparra Regional Health Hub Infrastructure Expansion', description: 'Constructing consultation rooms, storage sheds, and emergency generator housing at Arlparra.', department: 'Homelands & Infrastructure', status: 'CLOSED', budgetAmount: 1350000, businessUnitId: buInfra.id } });
  const pEyeHearing = await db.project.create({ data: { name: 'First Nations Eye & Hearing Remote Screening Program', description: 'Audiology and ophthalmology screening for children and Elders across 16 homelands.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 335000, businessUnitId: buPrimary.id } });
  const pFloodResilience = await db.project.create({ data: { name: 'Utopia Homelands Emergency Flood Resilience & Power Grid', description: 'Emergency food stores, satellite backup power, and flood relief access pathways.', department: 'Homelands & Infrastructure', status: 'IN_PROGRESS', budgetAmount: 750000, businessUnitId: buInfra.id } });
  const pAOD = await db.project.create({ data: { name: 'Alcohol & Other Drugs Prevention & Outreach Service', description: 'Community counseling, harm reduction education, and social emotional well-being support.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 520000, businessUnitId: buPrimary.id } });

  // 7. Seed Funding Bodies
  console.log('🏛️ Seeding Funding Bodies...');
  await db.fundingBody.create({ data: { name: 'Department of Health and Aged Care (DoHAC)', type: 'GOVERNMENT', website: 'https://www.health.gov.au' } });
  await db.fundingBody.create({ data: { name: 'NT Department of Health (NT Health)', type: 'GOVERNMENT', website: 'https://health.nt.gov.au' } });
  await db.fundingBody.create({ data: { name: 'National Indigenous Australians Agency (NIAA)', type: 'GOVERNMENT', website: 'https://www.niaa.gov.au' } });
  await db.fundingBody.create({ data: { name: 'Medical Research Future Fund (MRFF)', type: 'GOVERNMENT', website: 'https://www.mrff.gov.au' } });
  await db.fundingBody.create({ data: { name: 'NACCHO Australia', type: 'GOVERNMENT', website: 'https://www.naccho.org.au' } });

  // Receipt & GFA Helpers
  const createReceiptPdf = (receiptName: string, amount: number, vendor: string) => {
    const pdfBuf = generatePdfBuffer(`Receipt: ${receiptName}`, `Vendor: ${vendor} | Amount: $${amount.toLocaleString()}`, [
      { heading: 'Payment Confirmation', content: `Amount Paid: $${amount.toLocaleString()}\nStatus: SETTLED & VERIFIED\nAudit Code: REC-${Math.floor(Math.random()*899999+100000)}` }
    ]);
    const receiptPath = path.join(__dirname, '../receipt_assets', receiptName);
    fs.writeFileSync(receiptPath, pdfBuf);
    return receiptName;
  };

  const createGfaPdf = (gfaName: string, grantTitle: string, funder: string) => {
    const pdfBuf = generatePdfBuffer(`GRANT FUNDING AGREEMENT`, `Funder: ${funder} | Recipient: UHSAC`, [
      { heading: 'Schedule 1: Execution Details', content: `Agreement Reference: GFA-${Math.floor(Math.random()*8999+1000)}\nGrant Program: ${grantTitle}` },
      { heading: 'Schedule 2: Performance Milestones', content: 'Clause 4.1 Setup Report\nClause 7.2 Progress Report\nClause 12.4 Final Acquittal' }
    ]);
    const gfaPath = path.join(__dirname, '../gfa_documents', gfaName);
    fs.writeFileSync(gfaPath, pdfBuf);
    return gfaName;
  };

  // Pre-Award Helper to populate Stage 1-3 Criteria Responses, Application Tasks & Checklist
  const seedPreAwardHistory = async (grantId: string, grantTitle: string) => {
    // 1. Requirement Responses (Criteria)
    await db.grantRequirementResponse.createMany({
      data: [
        {
          grantId,
          requirementKey: 'Criteria 1: Organizational Capability & Governance',
          question: 'Demonstrate your organization capacity and clinical governance framework to deliver primary health services across remote Aboriginal homelands.',
          responseText: 'Urapuntja Health Service Aboriginal Corporation (ICN: 838) has operated primary healthcare clinics across 16 Utopia Homelands for over 35 years. Our clinical governance framework is overseen by a 100% Aboriginal Board of Directors and senior medical staff, ensuring cultural safety and clinical excellence.',
          status: 'APPROVED'
        },
        {
          grantId,
          requirementKey: 'Criteria 2: Project Design & Community Engagement',
          question: 'Detail the proposed service delivery model, community consultation process, and measurable outcomes for homeland residents.',
          responseText: 'The project utilizes a hybrid care delivery model combining central primary clinic facilities at Soapy Bore with mobile 4WD clinical outreach vans equipped with satellite telehealth units. Community consultations were held across all 16 homeland family groups in 2024.',
          status: 'APPROVED'
        },
        {
          grantId,
          requirementKey: 'Criteria 3: Financial Management & Value for Money',
          question: 'Provide a detailed budget breakdown, co-contribution sources, and demonstrate value for money.',
          responseText: 'Total project budget is backed by independent CPA financial auditing. Direct clinical service delivery accounts for 82% of budget allocation, with minimal administrative overhead (8%). Co-contributions are secured from DoHAC and NT Health.',
          status: 'APPROVED'
        }
      ]
    });

    // 2. Application Tasks assigned to Adrian Warren and staff
    await db.milestoneTask.createMany({
      data: [
        { grantId, title: 'Draft Section 1: Organizational Profile & Clinical Capability', description: 'Compile historical clinical metrics and board governance structure.', assignedToUserId: uAdrian.id, dueDate: new Date('2024-10-15'), status: 'COMPLETED', stage: 'APPLICATION', completedAt: new Date('2024-10-14') },
        { grantId, title: 'Extract Guidelines Requirements & Mandatory Checklist', description: 'Review funder guidelines PDF and extract selection criteria.', assignedToUserId: uAdrian.id, dueDate: new Date('2024-10-18'), status: 'COMPLETED', stage: 'APPLICATION', completedAt: new Date('2024-10-17') },
        { grantId, title: 'Compile Audited Financial Statements & Budget Costing', description: 'Attach CPA financial audit and cost item schedule.', assignedToUserId: uChristine.id, dueDate: new Date('2024-10-25'), status: 'COMPLETED', stage: 'APPLICATION', completedAt: new Date('2024-10-24') },
        { grantId, title: 'Board Approval Sign-Off & Application Submission', description: 'Final CEO sign-off and electronic submission to funder portal.', assignedToUserId: uMelissa.id, dueDate: new Date('2024-11-01'), status: 'COMPLETED', stage: 'APPLICATION', completedAt: new Date('2024-11-01') }
      ]
    });

    // 3. Stored Application Proposal Document
    await db.document.create({
      data: {
        grantId,
        name: `Application_Proposal_${grantTitle.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        type: 'APPLICATION',
        fileSize: '3.2 MB',
        uploadedBy: 'Adrian Warren (Grants Manager)',
        content: `FULL SUBMITTED PROPOSAL DOCUMENT for ${grantTitle}.\n\nSection 1: Executive Summary\nSection 2: Response to Selection Criteria\nSection 3: Financial Budget Breakdown\nSection 4: Letters of Community Support.`
      }
    });
  };

  // ============================================================================
  // 8. CHRONOLOGICAL SEEDING OF ALL 35 GRANTS
  // ============================================================================
  console.log('📋 Seeding 35 Grants with Pre-Award Criteria, Payment Tranches & Categorized Obligations...');

  // ----------------------------------------------------------------------------
  // CATEGORY A: 10 CLOSED GRANTS (Fully Acquitted, Payment Tranches, Variations, Receipts)
  // ----------------------------------------------------------------------------
  const closedGrantsData = [
    { title: 'DoHAC Primary Health Care Support Grant 2022-24', funder: 'Department of Health and Aged Care (DoHAC)', value: 1250000, open: '2022-01-15', close: '2024-06-30', submitted: '2022-03-10', projects: [{ project: pClinicOps, amount: 850000 }, { project: pMobileVans, amount: 400000 }], variation: { ref: 'VAR-DOHAC-2023-01', val: 50000, desc: 'Approved $50K variation for remote diesel generator and 6-month extension.' } },
    { title: 'NT Health Remote Vehicle Fleet Upgrade 2023', funder: 'NT Department of Health (NT Health)', value: 180000, open: '2023-02-01', close: '2024-03-31', submitted: '2023-03-15', projects: [{ project: pMobileVans, amount: 180000 }] },
    { title: 'Southern Cross University Birthing on Country Partnership 2023', funder: 'Southern Cross University / NHMRC', value: 320000, open: '2023-04-01', close: '2024-08-31', submitted: '2023-05-12', projects: [{ project: pBirthing, amount: 320000 }] },
    { title: 'NIAA Indigenous Community Infrastructure Refurbishment 2022', funder: 'National Indigenous Australians Agency (NIAA)', value: 450000, open: '2022-06-01', close: '2024-02-28', submitted: '2022-07-20', projects: [{ project: pArlparra, amount: 450000 }] },
    { title: 'Foundation for Rural & Regional Renewal (FRRR) Water Security Grant', funder: 'Foundation for Rural & Regional Renewal', value: 75000, open: '2023-01-10', close: '2023-12-31', submitted: '2023-02-20', projects: [{ project: pClinicOps, amount: 75000 }] },
    { title: 'NT PHN Mental Health Outreach Expansion 2023', funder: 'NT Primary Health Network (NT PHN)', value: 210000, open: '2023-03-01', close: '2024-05-31', submitted: '2023-04-10', projects: [{ project: pAOD, amount: 210000 }] },
    { title: 'Lotterywest Remote Community Equipment Grant 2023', funder: 'Lotterywest Philanthropic Foundation', value: 95000, open: '2023-05-01', close: '2024-01-31', submitted: '2023-06-15', projects: [{ project: pMobileVans, amount: 95000 }] },
    { title: 'Cancer Australia First Nations Screening Trial 2023-24', funder: 'Cancer Australia', value: 280000, open: '2023-07-01', close: '2024-11-30', submitted: '2023-08-22', projects: [{ project: pCancer, amount: 280000 }] },
    { title: 'Abstudy/AIATSIS Cultural Health & Heritage Preservation Grant 2022', funder: 'AIATSIS Cultural Grants', value: 60000, open: '2022-04-01', close: '2023-06-30', submitted: '2022-05-15', projects: [{ project: pYouth, amount: 60000 }] },
    { title: 'SuniTAFE / VET Remote Health Worker Training Grant 2023', funder: 'Department of Employment and Workplace Relations', value: 140000, open: '2023-02-15', close: '2024-04-30', submitted: '2023-03-28', projects: [{ project: pHousing, amount: 140000 }] }
  ];

  for (let i = 0; i < closedGrantsData.length; i++) {
    const data = closedGrantsData[i];
    const gfaFile = createGfaPdf(`GFA_CLOSED_${i + 1}.pdf`, data.title, data.funder);

    const grant = await db.grant.create({
      data: {
        organizationId: ORG_ID,
        title: data.title,
        funderName: data.funder,
        totalFundingValue: data.value,
        amountRequested: data.value,
        openDate: new Date(data.open),
        closeDate: new Date(data.close),
        dateSubmitted: new Date(data.submitted),
        submissionReference: `SUB-UHSAC-${2022 + (i % 2)}-00${i + 1}`,
        status: 'CLOSED',
        category: 'Healthcare',
        guidelinesDocName: `GUIDELINES_${data.title.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        guidelinesExtractedTitle: `FUNDER PROGRAM GUIDELINES - ${data.title.toUpperCase()}`,
        gfaDocumentName: gfaFile,
        gfaExtractedTitle: `EXECUTED AGREEMENT - ${data.title.toUpperCase()}`,
        requiredDocuments: JSON.stringify(['Audited Financial Statements', 'Clinical Governance Plan', 'Board Resolution', 'Letters of Community Support']),
        costItems: JSON.stringify([{ item: 'Clinical Staffing', cost: data.value * 0.6 }, { item: 'Outreach Vehicle Fuel & Maintenance', cost: data.value * 0.25 }, { item: 'Medical Supplies', cost: data.value * 0.15 }]),
        closeoutNotes: `Grant project completed successfully. All ${data.value.toLocaleString()} funds acquitted and audited by independent CPA. Final report lodged.`,
        businessUnitId: buGrants.id
      }
    });

    // Seed Pre-Award Criteria & Application Tasks
    await seedPreAwardHistory(grant.id, data.title);

    // Risk Assessment
    await db.riskAssessment.create({
      data: { grantId: grant.id, assessedByUserId: uAdrian.id, financialRiskScore: 1, deliveryCapabilityScore: 1, strategicAlignmentScore: 1, overallRiskRating: 'LOW', justificationNotes: 'Verified low risk execution history.', isApprovedToApply: true }
    });

    // Project Mappings
    for (const pm of data.projects) {
      await db.grantProjectMapping.create({ data: { grantId: grant.id, projectId: pm.project.id, allocatedAmount: pm.amount } });
    }

    // Contract & Payment Installments
    const contract = await db.contract.create({
      data: { grantId: grant.id, fundingAgreementReference: `GFA-CLOSED-00${i + 1}`, executionDate: new Date(data.open), totalObligatedAmount: data.value }
    });

    // Scheduled Payment Tranches (All Received)
    await db.installment.createMany({
      data: [
        { contractId: contract.id, amount: data.value * 0.5, dueDate: new Date(data.open), status: 'RECEIVED' },
        { contractId: contract.id, amount: data.value * 0.3, dueDate: new Date(data.submitted), status: 'RECEIVED' },
        { contractId: contract.id, amount: data.value * 0.2, dueDate: new Date(data.close), status: 'RECEIVED' }
      ]
    });

    if (data.variation) {
      await db.contractVariation.create({ data: { contractId: contract.id, referenceNumber: data.variation.ref, valueChange: data.variation.val, status: 'APPROVED', description: data.variation.desc, approvalDate: new Date('2023-11-15') } });
    }

    // Grant-Derived Contract Milestones linked directly to Project
    const m1 = await db.milestone.create({ data: { contractId: contract.id, title: 'Milestone 1: Project Setup & Execution Plan', dueDate: new Date(data.open), isAcquitted: true, projectId: data.projects[0].project.id } });
    const m2 = await db.milestone.create({ data: { contractId: contract.id, title: 'Milestone 2: Mid-Term Performance Deliverables', dueDate: new Date(data.submitted), isAcquitted: true, projectId: data.projects[0].project.id } });
    const m3 = await db.milestone.create({ data: { contractId: contract.id, title: 'Milestone 3: Final Completion & Financial Acquittal', dueDate: new Date(data.close), isAcquitted: true, projectId: data.projects[0].project.id } });

    // Categorized Post-Award Obligation Tasks
    await db.milestoneTask.createMany({
      data: [
        { milestoneId: m1.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Milestones] Complete Milestone 1 Setup Deliverables', description: 'Complete site setup and equipment commissioning.', assignedToUserId: uAdrian.id, dueDate: new Date(data.open), status: 'COMPLETED', stage: 'OBLIGATION', completedAt: new Date(data.open) },
        { milestoneId: m2.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Reporting] Submit Mid-Term Clinical Encounter Metric Report', description: 'Log patient encounter metrics with NT Health.', assignedToUserId: uBoyle.id, dueDate: new Date(data.submitted), status: 'COMPLETED', stage: 'OBLIGATION', completedAt: new Date(data.submitted) },
        { milestoneId: m3.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Acquittals] Prepare Final Financial Acquittal & Audit Sign-Off', description: 'Upload CPA audited financial statements and receipts.', assignedToUserId: uAdrian.id, dueDate: new Date(data.close), status: 'COMPLETED', stage: 'OBLIGATION', completedAt: new Date(data.close) },
        { milestoneId: m1.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Activities] Conduct Quarterly Homelands Outreach Visit', description: 'Deploy mobile healthcare team across Utopia homelands.', assignedToUserId: uJenkins.id, dueDate: new Date(data.open), status: 'COMPLETED', stage: 'OBLIGATION', completedAt: new Date(data.open) }
      ]
    });

    // Transactions with PDF Receipt references
    const recName = createReceiptPdf(`RECEIPT_CLOSED_${i + 1}.pdf`, data.value * 0.4, 'Central Medical Suppliers NT');
    await db.transaction.create({ data: { organizationId: ORG_ID, grantId: grant.id, projectId: data.projects[0].project.id, amount: data.value, type: 'INCOME', description: `Full Funder Drawdown - ${data.title}`, category: 'Funder Drawdown', date: new Date(data.open) } });
    await db.transaction.create({ data: { organizationId: ORG_ID, grantId: grant.id, projectId: data.projects[0].project.id, amount: -(data.value * 0.4), type: 'EXPENDITURE', description: `Medical Equipment Purchase (Receipt: ${recName})`, category: 'Equipment & Materials', date: new Date(data.submitted) } });
  }

  console.log('✅ Seeded 10 Closed Grants with complete pre/post award history and payment tranches.');

  // ----------------------------------------------------------------------------
  // CATEGORY B: 15 LIVE GRANTS (Active Post-Award Obligations, Tranches, Tasks for Adrian Warren)
  // ----------------------------------------------------------------------------
  const liveGrantsData = [
    { title: 'MRFF Clinical Trials Activity Grant 2025-27', funder: 'Medical Research Future Fund (MRFF)', value: 2400000, open: '2024-09-01', close: '2027-06-30', submitted: '2024-11-15', projects: [{ project: pBirthing, amount: 1400000 }, { project: pTelehealth, amount: 1000000 }] },
    { title: 'NACCHO First Nations Cancer Screening & Support Grant', funder: 'NACCHO Australia', value: 850000, open: '2024-10-01', close: '2026-12-31', submitted: '2024-11-28', projects: [{ project: pCancer, amount: 850000 }] },
    { title: 'DoHAC Remote Health Workforce Retention Initiative 2025', funder: 'Department of Health and Aged Care (DoHAC)', value: 1100000, open: '2024-11-01', close: '2026-06-30', submitted: '2024-12-10', projects: [{ project: pHousing, amount: 1100000 }] },
    { title: 'NT Health Emergency Response & Flood Resilience Fund 2025', funder: 'NT Department of Health (NT Health)', value: 620000, open: '2024-12-01', close: '2026-04-30', submitted: '2025-01-15', projects: [{ project: pFloodResilience, amount: 620000 }] },
    { title: 'ABA Homelands Infrastructure Grant 2025', funder: 'National Indigenous Australians Agency (NIAA)', value: 950000, open: '2024-08-15', close: '2026-09-30', submitted: '2024-10-01', projects: [{ project: pWaterSolar, amount: 550000 }, { project: pArlparra, amount: 400000 }] },
    { title: 'Digital Health Agency Telehealth Expansion Grant 2025', funder: 'Australian Digital Health Agency', value: 290000, open: '2025-01-10', close: '2026-05-31', submitted: '2025-02-15', projects: [{ project: pTelehealth, amount: 290000 }] },
    { title: 'Fred Hollows Foundation Indigenous Eye Health Outreach 2025', funder: 'Fred Hollows Foundation', value: 175000, open: '2024-11-15', close: '2025-11-30', submitted: '2024-12-20', projects: [{ project: pEyeHearing, amount: 175000 }] },
    { title: 'NT PHN Chronic Disease Integrated Care Fund 2025', funder: 'NT Primary Health Network (NT PHN)', value: 410000, open: '2024-10-15', close: '2026-03-31', submitted: '2024-11-20', projects: [{ project: pTelehealth, amount: 410000 }] },
    { title: 'Clean Energy Finance Corp Community Solar & Storage Grant', funder: 'Clean Energy Finance Corporation', value: 540000, open: '2024-09-15', close: '2026-08-31', submitted: '2024-10-30', projects: [{ project: pWaterSolar, amount: 395000 }, { project: pClinicOps, amount: 145000 }] },
    { title: 'DoHAC Maternal & Child Health Care Expansion 2025', funder: 'Department of Health and Aged Care (DoHAC)', value: 780000, open: '2024-12-01', close: '2026-11-30', submitted: '2025-01-20', projects: [{ project: pBirthing, amount: 780000 }] },
    { title: 'Red Cross Emergency Relief & Food Security Support 2025', funder: 'Australian Red Cross', value: 130000, open: '2025-01-05', close: '2025-12-31', submitted: '2025-02-01', projects: [{ project: pFloodResilience, amount: 130000 }] },
    { title: 'Hearing Australia Remote Child Hearing Screening 2025', funder: 'Hearing Australia', value: 160000, open: '2024-11-01', close: '2025-10-31', submitted: '2024-12-05', projects: [{ project: pEyeHearing, amount: 160000 }] },
    { title: 'NT Government Alcohol & Other Drugs Prevention Grant 2025', funder: 'NT Department of Health', value: 310000, open: '2024-10-01', close: '2026-04-30', submitted: '2024-11-10', projects: [{ project: pAOD, amount: 310000 }] },
    { title: 'Heart Foundation First Nations Cardiovascular Health Grant 2025', funder: 'National Heart Foundation', value: 220000, open: '2024-09-01', close: '2026-01-31', submitted: '2024-10-15', projects: [{ project: pClinicOps, amount: 220000 }] },
    { title: 'NIAA Remote Youth Well-being & Sport Infrastructure 2025', funder: 'National Indigenous Australians Agency (NIAA)', value: 380000, open: '2024-11-10', close: '2026-07-31', submitted: '2024-12-15', projects: [{ project: pYouth, amount: 380000 }] }
  ];

  for (let i = 0; i < liveGrantsData.length; i++) {
    const data = liveGrantsData[i];
    const gfaFile = createGfaPdf(`GFA_LIVE_${i + 1}.pdf`, data.title, data.funder);

    const grant = await db.grant.create({
      data: {
        organizationId: ORG_ID,
        title: data.title,
        funderName: data.funder,
        totalFundingValue: data.value,
        amountRequested: data.value,
        openDate: new Date(data.open),
        closeDate: new Date(data.close),
        dateSubmitted: new Date(data.submitted),
        submissionReference: `SUB-LIVE-2025-00${i + 1}`,
        status: 'AWARDED',
        category: 'Healthcare',
        guidelinesDocName: `GUIDELINES_${data.title.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        guidelinesExtractedTitle: `FUNDER PROGRAM GUIDELINES - ${data.title.toUpperCase()}`,
        gfaDocumentName: gfaFile,
        gfaExtractedTitle: `EXECUTED GFA - ${data.title.toUpperCase()}`,
        requiredDocuments: JSON.stringify(['Audited Financial Statements', 'Clinical Governance Plan', 'Board Resolution', 'Letters of Community Support']),
        costItems: JSON.stringify([{ item: 'Clinical Staffing', cost: data.value * 0.6 }, { item: 'Outreach Equipment', cost: data.value * 0.4 }]),
        businessUnitId: buGrants.id
      }
    });

    // Seed Pre-Award Criteria & Application Tasks
    await seedPreAwardHistory(grant.id, data.title);

    // Risk Assessment
    await db.riskAssessment.create({
      data: { grantId: grant.id, assessedByUserId: uAdrian.id, financialRiskScore: 2, deliveryCapabilityScore: 1, strategicAlignmentScore: 1, overallRiskRating: 'LOW', justificationNotes: 'Approved to apply; clinical risk mitigated.', isApprovedToApply: true }
    });

    // Project Mappings
    for (const pm of data.projects) {
      await db.grantProjectMapping.create({ data: { grantId: grant.id, projectId: pm.project.id, allocatedAmount: pm.amount } });
    }

    // Contract & Scheduled Payment Tranches
    const contract = await db.contract.create({
      data: { grantId: grant.id, fundingAgreementReference: `GFA-LIVE-2025-00${i + 1}`, executionDate: new Date(data.open), totalObligatedAmount: data.value }
    });

    await db.installment.createMany({
      data: [
        { contractId: contract.id, amount: data.value * 0.4, dueDate: new Date(data.open), status: 'RECEIVED' },
        { contractId: contract.id, amount: data.value * 0.4, dueDate: new Date('2025-09-30'), status: 'PENDING' },
        { contractId: contract.id, amount: data.value * 0.2, dueDate: new Date(data.close), status: 'PENDING' }
      ]
    });

    // Grant-Derived Contract Milestones linked directly to Project
    const m1 = await db.milestone.create({ data: { contractId: contract.id, title: 'Milestone 1: Project Setup & Clinical Baseline', dueDate: new Date(data.open), isAcquitted: true, projectId: data.projects[0].project.id } });
    const m2 = await db.milestone.create({ data: { contractId: contract.id, title: 'Milestone 2: Mid-Term Performance Deliverables & Progress Report', dueDate: new Date('2025-09-30'), isAcquitted: false, projectId: data.projects[0].project.id } });
    const m3 = await db.milestone.create({ data: { contractId: contract.id, title: 'Milestone 3: Final Completion & Project Acquittal Submission', dueDate: new Date(data.close), isAcquitted: false, projectId: data.projects[0].project.id } });

    // Categorized Post-Award Obligation Tasks (Assigned to Adrian Warren and staff)
    await db.milestoneTask.createMany({
      data: [
        { milestoneId: m1.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Milestones] Verify Advance Tranche Deposit & Open Ledger', description: 'Confirm receipt of 40% advance funding tranche.', assignedToUserId: uAdrian.id, dueDate: new Date(data.open), status: 'COMPLETED', stage: 'OBLIGATION', completedAt: new Date(data.open) },
        { milestoneId: m2.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Acquittals] Prepare Mid-Term Obligation Acquittal & Financial Report', description: 'Compile expenditure receipts and patient encounter counts.', assignedToUserId: uAdrian.id, dueDate: new Date('2025-09-15'), status: 'IN_PROGRESS', stage: 'OBLIGATION' },
        { milestoneId: m2.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Reporting] Submit 6-Month Clinical Progress Report to Funder Portal', description: 'Review outstation outreach logs with Dr. Boyle.', assignedToUserId: uBoyle.id, dueDate: new Date('2025-09-20'), status: 'PENDING', stage: 'OBLIGATION' },
        { milestoneId: m3.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Activities] Final Closeout Ledger Reconciliation & Audit Sign-Off', description: 'Prepare closeout notes.', assignedToUserId: uNicole.id, dueDate: new Date(data.close), status: 'PENDING', stage: 'OBLIGATION' }
      ]
    });

    // Transactions with PDF Receipts
    const recName = createReceiptPdf(`RECEIPT_LIVE_${i + 1}.pdf`, data.value * 0.3, 'NT Remote Medical Logistics');
    await db.transaction.create({ data: { organizationId: ORG_ID, grantId: grant.id, projectId: data.projects[0].project.id, amount: data.value * 0.4, type: 'INCOME', description: `Initial Grant Drawdown - ${data.title}`, category: 'Funder Drawdown', date: new Date(data.open) } });
    await db.transaction.create({ data: { organizationId: ORG_ID, grantId: grant.id, projectId: data.projects[0].project.id, amount: -(data.value * 0.3), type: 'EXPENDITURE', description: `Clinical Equipment & Operations (Receipt: ${recName})`, category: 'Equipment & Materials', date: new Date('2025-02-10') } });
  }

  console.log('✅ Seeded 15 Live Grants with payment tranches & categorized obligations.');

  // ----------------------------------------------------------------------------
  // CATEGORY C: 4 REJECTED GRANTS (Applied For & Not Awarded)
  // ----------------------------------------------------------------------------
  const rejectedGrantsData = [
    { title: 'ARC Special Research Initiative for Remote Indigenous Health', funder: 'Australian Research Council (ARC)', value: 920000, open: '2023-05-01', close: '2023-08-31', submitted: '2023-08-15' },
    { title: 'Paul Ramsay Foundation Place-Based Remote Innovation Grant', funder: 'Paul Ramsay Foundation', value: 1150000, open: '2024-02-01', close: '2024-05-31', submitted: '2024-05-10' },
    { title: 'NT Government Regional Airport Access Grant 2023', funder: 'NT Department of Infrastructure', value: 350000, open: '2023-03-01', close: '2023-06-30', submitted: '2023-06-12' },
    { title: 'BHP Foundation Indigenous Community Resilience Award 2024', funder: 'BHP Foundation', value: 500000, open: '2024-01-15', close: '2024-04-30', submitted: '2024-04-10' }
  ];

  for (let i = 0; i < rejectedGrantsData.length; i++) {
    const data = rejectedGrantsData[i];
    const grant = await db.grant.create({
      data: {
        organizationId: ORG_ID,
        title: data.title,
        funderName: data.funder,
        totalFundingValue: data.value,
        amountRequested: data.value,
        openDate: new Date(data.open),
        closeDate: new Date(data.close),
        dateSubmitted: new Date(data.submitted),
        submissionReference: `SUB-REJ-00${i + 1}`,
        status: 'REJECTED',
        category: 'Research',
        guidelinesDocName: `GUIDELINES_${data.title.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        guidelinesExtractedTitle: `PROGRAM GUIDELINES - ${data.title.toUpperCase()}`,
        requiredDocuments: JSON.stringify(['Audited Financial Statements', 'Research Protocol', 'Ethics Approval']),
        costItems: JSON.stringify([{ item: 'Research Personnel', cost: data.value * 0.7 }, { item: 'Travel & Operations', cost: data.value * 0.3 }]),
        closeoutNotes: `Application submitted on ${data.submitted}. Funder notified outcome as unsuccessful. Debrief feedback noted high competition across research applicants.`,
        businessUnitId: buGrants.id
      }
    });

    await seedPreAwardHistory(grant.id, data.title);
  }

  console.log('✅ Seeded 4 Rejected Grants with pre-award history and debrief notes.');

  // ----------------------------------------------------------------------------
  // CATEGORY D: 6 PENDING / PIPELINE GRANTS
  // ----------------------------------------------------------------------------
  const pendingGrantsData = [
    { title: 'NHMRC Partnership Projects 2026 Round 1', funder: 'NHMRC Australia', value: 1500000, status: 'SUBMITTED', open: '2025-05-01', close: '2025-09-30', submitted: '2025-08-01' },
    { title: 'MRFF Frontier Health & Medical Research 2026', funder: 'Medical Research Future Fund (MRFF)', value: 3000000, status: 'APPLICATION_STAGED', open: '2025-06-01', close: '2025-11-30' },
    { title: 'NT Government Community Climate Adaptation Fund', funder: 'NT Department of Environment', value: 400000, status: 'RISK_ASSESSMENT', open: '2025-07-01', close: '2025-10-31' },
    { title: 'Telstra Foundation Remote Digital Connectivity Grant', funder: 'Telstra Foundation', value: 250000, status: 'POTENTIAL', open: '2025-08-01', close: '2025-12-15' },
    { title: 'Philanthropy Australia First Nations Health Leadership Fund', funder: 'Philanthropy Australia', value: 180000, status: 'POTENTIAL', open: '2025-08-15', close: '2025-11-15' },
    { title: 'Commonwealth Remote Dental & Oral Health Fund 2026', funder: 'Department of Health and Aged Care', value: 450000, status: 'SUBMITTED', open: '2025-04-01', close: '2025-09-15', submitted: '2025-07-28' }
  ];

  for (let i = 0; i < pendingGrantsData.length; i++) {
    const data = pendingGrantsData[i];
    const grant = await db.grant.create({
      data: {
        organizationId: ORG_ID,
        title: data.title,
        funderName: data.funder,
        totalFundingValue: data.value,
        amountRequested: data.value,
        openDate: new Date(data.open),
        closeDate: new Date(data.close),
        dateSubmitted: data.submitted ? new Date(data.submitted) : null,
        submissionReference: data.submitted ? `SUB-PEND-00${i + 1}` : null,
        status: data.status,
        category: 'Healthcare',
        guidelinesDocName: `GUIDELINES_${data.title.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        guidelinesExtractedTitle: `FUNDER GUIDELINES - ${data.title.toUpperCase()}`,
        requiredDocuments: JSON.stringify(['Application Proposal', 'Financial Budget', 'Risk Assessment']),
        costItems: JSON.stringify([{ item: 'Operational Service Delivery', cost: data.value }]),
        businessUnitId: buGrants.id
      }
    });

    await seedPreAwardHistory(grant.id, data.title);
  }

  console.log('✅ Seeded 6 Pending Pipeline Grants with pre-award criteria and preparation tasks.');
  console.log('================================================================');
  console.log('🎉 DEEP CHRONOLOGICAL SEEDING COMPLETE! All 35 Grants Reseeded with Full History.');
  console.log('================================================================');
}


export async function seedChronologicalUrapuntjaDemo() {
  console.log('================================================================');
  console.log('🚀 Starting Deep Chronological Multi-Tenant Seeding...');
  console.log('================================================================');

  // Purge legacy data once
  await db.auditLog.deleteMany({});
  await db.knowledgeDocument.deleteMany({});
  await db.businessUnitUser.deleteMany({});
  await db.contactInteraction.deleteMany({});
  await db.fundingOpportunity.deleteMany({});
  await db.fundingBodyContact.deleteMany({});
  await db.fundingBody.deleteMany({});
  await db.document.deleteMany({});
  await db.transaction.deleteMany({});
  await db.contractVariation.deleteMany({});
  await db.milestoneTask.deleteMany({});
  await db.milestone.deleteMany({});
  await db.installment.deleteMany({});
  await db.contract.deleteMany({});
  await db.grantProjectMapping.deleteMany({});
  await db.project.deleteMany({});
  await db.riskAssessment.deleteMany({});
  await db.grantRequirementResponse.deleteMany({});
  await db.grant.deleteMany({});
  await db.businessUnit.deleteMany({});
  await db.department.deleteMany({});
  await db.user.deleteMany({});

  const TARGET_ORGS = ['demo-org-1', 'demo-org-2', 'demo-org-3', 'demo-org-4'];
  for (const orgId of TARGET_ORGS) {
    console.log(`📦 Seeding full Urapuntja dataset for tenancy ${orgId}...`);
    await seedChronologicalUrapuntjaDemoForOrg(orgId);
  }
  console.log('================================================================');
  console.log('🎉 ALL TENANCIES SEEDED SUCCESSFULLY WITH DEEP URAPUNTJA DEMO DATA!');
  console.log('================================================================');
}

// Run directly if CLI
if (require.main === module) {
  seedChronologicalUrapuntjaDemo()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding Error:', err);
      process.exit(1);
    });
}
