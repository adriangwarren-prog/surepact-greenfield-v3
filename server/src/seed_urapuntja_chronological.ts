import { db } from './db';
import { ensurePdfAssetsOnDisk, generatePdfBuffer } from './generate_pdf_assets';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

export async function seedChronologicalUrapuntjaDemo() {
  console.log('================================================================');
  console.log('🚀 Starting Deep Chronological Multi-Tenant Seeding...');
  console.log('================================================================');

  // 1. Ensure PDF assets exist on disk
  ensurePdfAssetsOnDisk();

  // 2. Wipe database in strict reverse foreign-key dependency order ONCE
  console.log('🧹 Purging all legacy database tables in strict dependency order...');
  await db.auditLog.deleteMany({});
  await db.knowledgeDocument.deleteMany({});
  await db.businessUnitUser.deleteMany({});
  await db.contactInteraction.deleteMany({});
  await db.fundingOpportunity.deleteMany({});
  await db.fundingBodyContact.deleteMany({});
  await db.document.deleteMany({});
  await db.transaction.deleteMany({});
  await db.contractVariation.deleteMany({});
  await db.milestoneTask.deleteMany({});
  await db.milestone.deleteMany({});
  await db.installment.deleteMany({});
  await db.contract.deleteMany({});
  await db.grantProjectMapping.deleteMany({});
  await db.grantRequirementResponse.deleteMany({});
  await db.riskAssessment.deleteMany({});
  await db.grant.deleteMany({});
  await db.project.deleteMany({});
  await db.businessUnit.deleteMany({});
  await db.department.deleteMany({});
  await db.user.deleteMany({});
  await db.fundingBody.deleteMany({});

  console.log('✅ Database completely purged cleanly.');

  // 3. Seed Org Structure (Departments & Business Units ONCE)
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

  // 4. Seed Staff Users ONCE
  console.log('👥 Seeding Staff & Grants Managers...');
  const defaultPassHash = await bcrypt.hash('SurePact2026!', 10);
  const getOrCreateUser = async (data: any) => {
    const existing = await db.user.findFirst({ where: { email: data.email } });
    if (existing) {
      return await db.user.update({ where: { id: existing.id }, data });
    }
    return await db.user.create({ data });
  };

  const uAdrian = await getOrCreateUser({ name: 'Adrian Warren', email: 'adrian.warren@surepact.com', department: 'Finance & Grant Compliance', role: 'admin', status: 'Active', passwordHash: defaultPassHash });
  const uMelissa = await getOrCreateUser({ name: 'Melissa Hinson', email: 'melissa.hinson@urapuntja.org.au', department: 'Executive & Governance', role: 'admin', status: 'Active', passwordHash: defaultPassHash });
  const uBoyle = await getOrCreateUser({ name: 'Dr. David Boyle', email: 'david.boyle@urapuntja.org.au', department: 'Health & Clinical Services', role: 'staff', status: 'Active', passwordHash: defaultPassHash });
  const uJenkins = await getOrCreateUser({ name: 'Sarah Jenkins', email: 'sarah.jenkins@urapuntja.org.au', department: 'Health & Clinical Services', role: 'staff', status: 'Active', passwordHash: defaultPassHash });
  const uDeluis = await getOrCreateUser({ name: 'Marcus Deluis', email: 'marcus.deluis@urapuntja.org.au', department: 'Homelands & Infrastructure', role: 'staff', status: 'Active', passwordHash: defaultPassHash });
  const uChristine = await getOrCreateUser({ name: 'Christine Malinao', email: 'christine.malinao@urapuntja.org.au', department: 'Finance & Grant Compliance', role: 'staff', status: 'Active', passwordHash: defaultPassHash });
  const uNicole = await getOrCreateUser({ name: 'Nicole Sherwin', email: 'nicole.sherwin@urapuntja.org.au', department: 'Finance & Grant Compliance', role: 'staff', status: 'Active', passwordHash: defaultPassHash });

  const buUserMappings = [
    { userId: uAdrian.id, businessUnitId: buGrants.id },
    { userId: uAdrian.id, businessUnitId: buCEO.id },
    { userId: uMelissa.id, businessUnitId: buCEO.id },
    { userId: uBoyle.id, businessUnitId: buPrimary.id },
    { userId: uJenkins.id, businessUnitId: buMaternal.id },
    { userId: uDeluis.id, businessUnitId: buInfra.id },
    { userId: uDeluis.id, businessUnitId: buFleet.id },
    { userId: uChristine.id, businessUnitId: buGrants.id },
    { userId: uNicole.id, businessUnitId: buGrants.id }
  ];
  for (const m of buUserMappings) {
    try {
      await db.businessUnitUser.create({ data: m });
    } catch (e) {
      console.warn('Skipping duplicate or invalid buUser mapping:', m);
    }
  }

  // 5. Seed Funding Bodies ONCE
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
    const dir = path.join(__dirname, '../receipt_assets');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const receiptPath = path.join(dir, receiptName);
    fs.writeFileSync(receiptPath, pdfBuf);
    return receiptName;
  };

  const createGfaPdf = (gfaName: string, grantTitle: string, funder: string) => {
    const pdfBuf = generatePdfBuffer(`GRANT FUNDING AGREEMENT`, `Funder: ${funder} | Recipient: UHSAC`, [
      { heading: 'Schedule 1: Execution Details', content: `Agreement Reference: GFA-${Math.floor(Math.random()*8999+1000)}\nGrant Program: ${grantTitle}` },
      { heading: 'Schedule 2: Performance Milestones', content: 'Clause 4.1 Setup Report\nClause 7.2 Progress Report\nClause 12.4 Final Acquittal' }
    ]);
    const dir = path.join(__dirname, '../gfa_documents');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const gfaPath = path.join(dir, gfaName);
    fs.writeFileSync(gfaPath, pdfBuf);
    return gfaName;
  };

  const seedPreAwardHistory = async (grantId: string, grantTitle: string, orgId: string) => {
    await db.grantRequirementResponse.create({ data: { grantId, requirementKey: 'Criteria 1: Organizational Capability & Governance', question: 'Demonstrate your organization capacity and clinical governance framework to deliver primary health services across remote Aboriginal homelands.', responseText: 'Urapuntja Health Service Aboriginal Corporation (ICN: 838) has operated primary healthcare clinics across 16 Utopia Homelands for over 35 years.', status: 'APPROVED' } });
    await db.grantRequirementResponse.create({ data: { grantId, requirementKey: 'Criteria 2: Project Design & Community Engagement', question: 'Detail the proposed service delivery model, community consultation process, and measurable outcomes for homeland residents.', responseText: 'The project utilizes a hybrid care delivery model combining central primary clinic facilities at Soapy Bore with mobile 4WD clinical outreach vans.', status: 'APPROVED' } });
    await db.grantRequirementResponse.create({ data: { grantId, requirementKey: 'Criteria 3: Financial Management & Value for Money', question: 'Provide a detailed budget breakdown, co-contribution sources, and demonstrate value for money.', responseText: 'Total project budget is backed by independent CPA financial auditing. Direct clinical service delivery accounts for 82% of budget allocation.', status: 'APPROVED' } });

    await db.milestoneTask.create({ data: { organizationId: orgId, grantId, title: 'Draft Section 1: Organizational Profile & Clinical Capability', description: 'Compile historical clinical metrics and board governance structure.', assignedToUserId: uAdrian.id, dueDate: new Date('2024-10-15'), status: 'COMPLETED', stage: 'APPLICATION', completedAt: new Date('2024-10-14') } });
    await db.milestoneTask.create({ data: { organizationId: orgId, grantId, title: 'Extract Guidelines Requirements & Mandatory Checklist', description: 'Review funder guidelines PDF and extract selection criteria.', assignedToUserId: uAdrian.id, dueDate: new Date('2024-10-18'), status: 'COMPLETED', stage: 'APPLICATION', completedAt: new Date('2024-10-17') } });
    await db.milestoneTask.create({ data: { organizationId: orgId, grantId, title: 'Compile Audited Financial Statements & Budget Costing', description: 'Attach CPA financial audit and cost item schedule.', assignedToUserId: uChristine.id, dueDate: new Date('2024-10-25'), status: 'COMPLETED', stage: 'APPLICATION', completedAt: new Date('2024-10-24') } });
    await db.milestoneTask.create({ data: { organizationId: orgId, grantId, title: 'Board Approval Sign-Off & Application Submission', description: 'Final CEO sign-off and electronic submission to funder portal.', assignedToUserId: uMelissa.id, dueDate: new Date('2024-11-01'), status: 'COMPLETED', stage: 'APPLICATION', completedAt: new Date('2024-11-01') } });

    await db.document.create({
      data: {
        grantId,
        name: `Application_Proposal_${grantTitle.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        type: 'APPLICATION',
        fileSize: '3.2 MB',
        uploadedBy: 'Adrian Warren (Grants Manager)',
        content: `FULL SUBMITTED PROPOSAL DOCUMENT for ${grantTitle}.`
      }
    });
  };

  const TARGET_ORGS = ['demo-org-1', 'demo-org-2', 'demo-org-3', 'demo-org-4'];

  for (const ORG_ID of TARGET_ORGS) {
    console.log(`📦 Seeding tenancy ${ORG_ID}...`);

    // 6. Knowledge Base Documents
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

    // 7. Seed 12 Projects per tenancy
    const pClinicOps = await db.project.create({ data: { organizationId: ORG_ID, name: 'Soapy Bore Central Primary Clinic Operations 2024-2026', description: 'Core primary care, pharmacy dispensing, emergency triage, and telehealth services.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 1850000 } });
    const pMobileVans = await db.project.create({ data: { organizationId: ORG_ID, name: 'Utopia Homelands Mobile 4WD Clinic Van Expansion', description: 'Procurement and weekly clinical operations of 4WD mobile health vans across 16 homelands.', department: 'Homelands & Infrastructure', status: 'IN_PROGRESS', budgetAmount: 615000 } });
    const pBirthing = await db.project.create({ data: { organizationId: ORG_ID, name: 'Birthing on Country Maternal & Child Health Initiative', description: 'Culturally safe maternal care, local midwifery training, and antenatal/postnatal visits.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 1720000 } });
    const pWaterSolar = await db.project.create({ data: { organizationId: ORG_ID, name: 'Outstation Emergency Water & Solar Microgrid Upgrade', description: 'Reverse osmosis water filtration plants and solar battery storage across outer homelands.', department: 'Homelands & Infrastructure', status: 'IN_PROGRESS', budgetAmount: 945000 } });
    const pTelehealth = await db.project.create({ data: { organizationId: ORG_ID, name: 'Chronic Disease Telehealth & Digital Health Hub', description: 'Digital ECGs, portable ultrasound units, and satellite connection for remote consultations.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 1290000 } });
    const pYouth = await db.project.create({ data: { organizationId: ORG_ID, name: 'Utopia Homelands Youth Well-being & Recreation Spaces', description: 'Youth sports equipment, mental health workshops, and community gathering spaces.', department: 'Homelands & Infrastructure', status: 'CLOSED', budgetAmount: 510000 } });
    const pCancer = await db.project.create({ data: { organizationId: ORG_ID, name: 'First Nations Cancer Screening & Community Support Unit', description: 'Mobile cancer screening outreach, education campaigns, and patient navigation.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 1130000 } });
    const pHousing = await db.project.create({ data: { organizationId: ORG_ID, name: 'Remote Healthcare Staff Housing & Retention Program', description: 'Staff housing maintenance, retention allowances, and clinical worker professional development.', department: 'Executive & Governance', status: 'IN_PROGRESS', budgetAmount: 1240000 } });
    const pArlparra = await db.project.create({ data: { organizationId: ORG_ID, name: 'Arlparra Regional Health Hub Infrastructure Expansion', description: 'Constructing consultation rooms, storage sheds, and emergency generator housing at Arlparra.', department: 'Homelands & Infrastructure', status: 'CLOSED', budgetAmount: 1350000 } });
    const pEyeHearing = await db.project.create({ data: { organizationId: ORG_ID, name: 'First Nations Eye & Hearing Remote Screening Program', description: 'Audiology and ophthalmology screening for children and Elders across 16 homelands.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 335000 } });
    const pFloodResilience = await db.project.create({ data: { organizationId: ORG_ID, name: 'Utopia Homelands Emergency Flood Resilience & Power Grid', description: 'Emergency food stores, satellite backup power, and flood relief access pathways.', department: 'Homelands & Infrastructure', status: 'IN_PROGRESS', budgetAmount: 750000 } });
    const pAOD = await db.project.create({ data: { organizationId: ORG_ID, name: 'Alcohol & Other Drugs Prevention & Outreach Service', description: 'Community counseling, harm reduction education, and social emotional well-being support.', department: 'Health & Clinical Services', status: 'IN_PROGRESS', budgetAmount: 520000 } });

    // 8. CATEGORY A: 10 CLOSED GRANTS
    const closedGrantsData = [
      { title: 'DoHAC Primary Health Care Support Grant 2022-24', funder: 'Department of Health and Aged Care (DoHAC)', value: 1250000, open: '2022-01-15', close: '2024-06-30', submitted: '2022-03-10', projects: [{ project: pClinicOps, amount: 850000 }, { project: pMobileVans, amount: 400000 }] },
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
          gfaDocumentName: gfaFile,
          gfaExtractedTitle: `EXECUTED GRANT FUNDING AGREEMENT - ${data.title.toUpperCase()}`,
          submissionReference: `SUB-CLOSED-00${i + 1}`,
          status: 'CLOSED',
          category: 'Primary Care',
          guidelinesDocName: `GUIDELINES_${data.title.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          guidelinesExtractedTitle: `PROGRAM GUIDELINES - ${data.title.toUpperCase()}`,
          requiredDocuments: JSON.stringify(['Audited Financial Statements', 'Project Delivery Plan', 'Risk Assessment Matrix']),
          costItems: JSON.stringify([{ item: 'Clinical Operations', cost: data.value * 0.7 }, { item: 'Equipment & Logistics', cost: data.value * 0.3 }]),
          closeoutNotes: 'All project deliverables met on schedule. Financial acquittal approved by funder.'
        }
      });

      for (const projMapping of data.projects) {
        await db.grantProjectMapping.create({ data: { grantId: grant.id, projectId: projMapping.project.id, allocatedAmount: projMapping.amount } });
      }

      await seedPreAwardHistory(grant.id, data.title, ORG_ID);
    }

    // 9. CATEGORY B: 15 LIVE GRANTS
    const liveGrantsData = [
      { title: 'DoHAC National Aboriginal & Torres Strait Islander Health Plan 2024-26', funder: 'Department of Health and Aged Care (DoHAC)', value: 2400000, open: '2024-01-01', close: '2026-12-31', submitted: '2024-02-15', projects: [{ project: pClinicOps, amount: 1600000 }, { project: pMobileVans, amount: 800000 }] },
      { title: 'NT Health Core Remote Primary Health Care Agreement 2024-27', funder: 'NT Department of Health (NT Health)', value: 3100000, open: '2024-03-01', close: '2027-02-28', submitted: '2024-04-10', projects: [{ project: pClinicOps, amount: 3100000 }] },
      { title: 'NIAA Safety & Wellbeing Homelands Infrastructure Fund 2024', funder: 'National Indigenous Australians Agency (NIAA)', value: 890000, open: '2024-02-15', close: '2026-06-30', submitted: '2024-03-25', projects: [{ project: pWaterSolar, amount: 890000 }] },
      { title: 'DoHAC Birthing on Country Exemplar Program 2024-26', funder: 'Department of Health and Aged Care (DoHAC)', value: 1400000, open: '2024-04-01', close: '2026-09-30', submitted: '2024-05-15', projects: [{ project: pBirthing, amount: 1400000 }] },
      { title: 'MRFF Primary Health Care Digital Telehealth Trial 2024-26', funder: 'Medical Research Future Fund (MRFF)', value: 1100000, open: '2024-05-01', close: '2026-11-30', submitted: '2024-06-20', projects: [{ project: pTelehealth, amount: 1100000 }] },
      { title: 'NACCHO Remote First Nations Cancer Outreach Program 2024', funder: 'NACCHO Australia', value: 850000, open: '2024-06-01', close: '2026-08-31', submitted: '2024-07-10', projects: [{ project: pCancer, amount: 850000 }] },
      { title: 'NT Health Eye & Ear Health Remote Outreach Grant 2024', funder: 'NT Department of Health (NT Health)', value: 335000, open: '2024-03-15', close: '2025-12-31', submitted: '2024-04-20', projects: [{ project: pEyeHearing, amount: 335000 }] },
      { title: 'NIAA Homeland Water Filtration & Microgrid Capital Fund', funder: 'National Indigenous Australians Agency (NIAA)', value: 945000, open: '2024-07-01', close: '2026-12-31', submitted: '2024-08-15', projects: [{ project: pWaterSolar, amount: 945000 }] },
      { title: 'DoHAC Remote Health Workforce Retention & Housing Incentive', funder: 'Department of Health and Aged Care (DoHAC)', value: 1100000, open: '2024-01-10', close: '2026-06-30', submitted: '2024-02-28', projects: [{ project: pHousing, amount: 1100000 }] },
      { title: 'National Emergency Management Agency (NEMA) Flood Resilience 2024', funder: 'National Emergency Management Agency (NEMA)', value: 750000, open: '2024-05-15', close: '2026-05-14', submitted: '2024-06-30', projects: [{ project: pFloodResilience, amount: 750000 }] },
      { title: 'Fred Hollows Foundation Indigenous Eye Care Mobile Van Fund', funder: 'Fred Hollows Foundation', value: 290000, open: '2024-04-10', close: '2025-10-31', submitted: '2024-05-20', projects: [{ project: pEyeHearing, amount: 290000 }] },
      { title: 'DoHAC Remote Chronic Disease Management Program 2025-27', funder: 'Department of Health and Aged Care (DoHAC)', value: 1850000, open: '2024-08-01', close: '2027-07-31', submitted: '2024-09-15', projects: [{ project: pClinicOps, amount: 1850000 }] },
      { title: 'NT PHN Alcohol & Other Drugs Outreach Grant 2024', funder: 'NT Primary Health Network (NT PHN)', value: 310000, open: '2024-06-15', close: '2026-03-31', submitted: '2024-07-25', projects: [{ project: pAOD, amount: 310000 }] },
      { title: 'Indigenous Allied Health Australia (IAHA) Traineeship Grant', funder: 'Indigenous Allied Health Australia', value: 195000, open: '2024-02-01', close: '2025-11-30', submitted: '2024-03-10', projects: [{ project: pHousing, amount: 195000 }] },
      { title: 'Perpetual Philanthropic First Nations Health Innovation 2024', funder: 'Perpetual Trustees Foundation', value: 420000, open: '2024-07-15', close: '2026-07-14', submitted: '2024-08-30', projects: [{ project: pTelehealth, amount: 420000 }] }
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
          gfaDocumentName: gfaFile,
          gfaExtractedTitle: `EXECUTED GRANT FUNDING AGREEMENT - ${data.title.toUpperCase()}`,
          submissionReference: `SUB-LIVE-00${i + 1}`,
          status: 'ACTIVE_AWARDED',
          category: 'Primary Health Care',
          guidelinesDocName: `GUIDELINES_${data.title.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          guidelinesExtractedTitle: `PROGRAM GUIDELINES - ${data.title.toUpperCase()}`,
          requiredDocuments: JSON.stringify(['Audited Financial Statements', 'Clinical Protocol', 'Risk Management Plan']),
          costItems: JSON.stringify([{ item: 'Clinical Personnel & Travel', cost: data.value * 0.75 }, { item: 'Medical Supplies & Equipment', cost: data.value * 0.25 }])
        }
      });

      for (const projMapping of data.projects) {
        await db.grantProjectMapping.create({ data: { grantId: grant.id, projectId: projMapping.project.id, allocatedAmount: projMapping.amount } });
      }

      await seedPreAwardHistory(grant.id, data.title, ORG_ID);

      const contract = await db.contract.create({
        data: {
          grantId: grant.id,
          fundingAgreementReference: gfaFile,
          executionDate: new Date(data.open),
          totalObligatedAmount: data.value
        }
      });

      const m1 = await db.milestone.create({ data: { contractId: contract.id, title: 'Milestone 1: Execution & Initial Tranche Drawdown', dueDate: new Date(data.open) } });
      const m2 = await db.milestone.create({ data: { contractId: contract.id, title: 'Milestone 2: Mid-Term Clinical Progress Report & Financial Acquittal', dueDate: new Date('2025-09-30') } });
      const m3 = await db.milestone.create({ data: { contractId: contract.id, title: 'Milestone 3: Final Closeout Evaluation & Comprehensive Audit', dueDate: new Date(data.close) } });

      await db.milestoneTask.create({ data: { organizationId: ORG_ID, milestoneId: m1.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Milestones] Verify Advance Tranche Deposit & Open Ledger', description: 'Confirm receipt of 40% advance funding tranche.', assignedToUserId: uAdrian.id, dueDate: new Date(data.open), status: 'COMPLETED', stage: 'OBLIGATION', completedAt: new Date(data.open) } });
      await db.milestoneTask.create({ data: { organizationId: ORG_ID, milestoneId: m2.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Acquittals] Prepare Mid-Term Obligation Acquittal & Financial Report', description: 'Compile expenditure receipts and patient encounter counts.', assignedToUserId: uAdrian.id, dueDate: new Date('2025-09-15'), status: 'IN_PROGRESS', stage: 'OBLIGATION' } });
      await db.milestoneTask.create({ data: { organizationId: ORG_ID, milestoneId: m2.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Reporting] Submit 6-Month Clinical Progress Report to Funder Portal', description: 'Review outstation outreach logs with Dr. Boyle.', assignedToUserId: uBoyle.id, dueDate: new Date('2025-09-20'), status: 'PENDING', stage: 'OBLIGATION' } });
      await db.milestoneTask.create({ data: { organizationId: ORG_ID, milestoneId: m3.id, grantId: grant.id, projectId: data.projects[0].project.id, title: '[Category: Activities] Final Closeout Ledger Reconciliation & Audit Sign-Off', description: 'Prepare closeout notes.', assignedToUserId: uNicole.id, dueDate: new Date(data.close), status: 'PENDING', stage: 'OBLIGATION' } });

      const recName = createReceiptPdf(`RECEIPT_LIVE_${i + 1}.pdf`, data.value * 0.3, 'NT Remote Medical Logistics');
      await db.transaction.create({ data: { organizationId: ORG_ID, grantId: grant.id, projectId: data.projects[0].project.id, amount: data.value * 0.4, type: 'INCOME', description: `Initial Grant Drawdown - ${data.title}`, category: 'Funder Drawdown', date: new Date(data.open) } });
      await db.transaction.create({ data: { organizationId: ORG_ID, grantId: grant.id, projectId: data.projects[0].project.id, amount: -(data.value * 0.3), type: 'EXPENDITURE', description: `Clinical Equipment & Operations (Receipt: ${recName})`, category: 'Equipment & Materials', date: new Date('2025-02-10') } });
    }

    // 10. CATEGORY C: 4 REJECTED GRANTS
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
          closeoutNotes: `Application submitted on ${data.submitted}. Funder notified outcome as unsuccessful.`
        }
      });

      await seedPreAwardHistory(grant.id, data.title, ORG_ID);
    }

    // 11. CATEGORY D: 6 PENDING GRANTS
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
          costItems: JSON.stringify([{ item: 'Operational Service Delivery', cost: data.value }])
        }
      });

      await seedPreAwardHistory(grant.id, data.title, ORG_ID);
    }
  }

  console.log('================================================================');
  console.log('🎉 MULTI-TENANT DEEP SEEDING COMPLETE! All 4 Tenancies Seeded with 35 Grants Each.');
  console.log('================================================================');
}

if (require.main === module) {
  seedChronologicalUrapuntjaDemo()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding Error:', err);
      process.exit(1);
    });
}
