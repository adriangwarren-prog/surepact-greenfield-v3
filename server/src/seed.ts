import { db } from './db';
import * as fs from 'fs';
import * as path from 'path';

const ORG_ID = '99999999-8888-7777-6666-555555555555'; // Demo Multi-tenant Org ID
const ADMIN_USER_ID = '11111111-2222-3333-4444-555555555555'; // Demo Admin User ID

export async function seedDatabase() {
  console.log('Seeding SurePact Enterprise database...');

  // Clean existing data in reverse order of foreign key dependency
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
  await db.contract.deleteMany({});
  await db.grantProjectMapping.deleteMany({});
  await db.project.deleteMany({});
  await db.user.deleteMany({});
  await db.businessUnit.deleteMany({});
  await db.department.deleteMany({});
  await db.riskAssessment.deleteMany({});
  await db.grant.deleteMany({});

  console.log('Cleared existing database tables.');

  // 1. Seed Departments & Business Units
  console.log('Seeding Org Structure...');
  const deptExec = await db.department.create({
    data: { name: 'Executive', description: 'Executive leadership team' }
  });
  const deptFinance = await db.department.create({
    data: { name: 'Finance & Compliance', description: 'Financial management and grant tracking' }
  });
  const deptEngineering = await db.department.create({
    data: { name: 'Infrastructure & Engineering', description: 'Civil engineering and utility works' }
  });
  const deptCommunity = await db.department.create({
    data: { name: 'Community & Environment', description: 'Parks, recreation, and local greening' }
  });

  const buCEO = await db.businessUnit.create({
    data: { name: 'Office of the CEO', departmentId: deptExec.id }
  });
  const buStrategy = await db.businessUnit.create({
    data: { name: 'Strategy & Growth', departmentId: deptExec.id }
  });
  const buFinance = await db.businessUnit.create({
    data: { name: 'Corporate Finance', departmentId: deptFinance.id }
  });
  const buGrants = await db.businessUnit.create({
    data: { name: 'Grants Administration', departmentId: deptFinance.id }
  });
  const buWater = await db.businessUnit.create({
    data: { name: 'Water & Utilities', departmentId: deptEngineering.id }
  });
  const buCivil = await db.businessUnit.create({
    data: { name: 'Civil Works', departmentId: deptEngineering.id }
  });
  const buParks = await db.businessUnit.create({
    data: { name: 'Parks & Recreation', departmentId: deptCommunity.id }
  });
  const buEnv = await db.businessUnit.create({
    data: { name: 'Environmental Services', departmentId: deptCommunity.id }
  });

  // Seed Users
  console.log('Seeding Users...');
  const uAdrian = await db.user.create({
    data: {
      name: 'Adrian Warren',
      email: 'adrian.warren@surepact.com',
      department: 'Executive',
      role: 'staff',
      status: 'Active'
    }
  });

  const uBrett = await db.user.create({
    data: {
      name: 'Brett Hirst',
      email: 'brett.hirst@surepact.com',
      department: 'Executive',
      role: 'admin',
      status: 'Active'
    }
  });

  const uChristine = await db.user.create({
    data: {
      name: 'christine malinao',
      email: 'christine.malinao@surepact.com',
      department: 'Finance & Compliance',
      role: 'staff',
      status: 'Active'
    }
  });

  const uDaniel = await db.user.create({
    data: {
      name: 'Daniel Pritchard',
      email: 'dan.pritchard@surepact.com',
      department: 'Infrastructure & Engineering',
      role: 'staff',
      status: 'Active'
    }
  });

  const uHenry = await db.user.create({
    data: {
      name: 'Henry McNally',
      email: 'henry.mcnally@surepact.com',
      department: 'Community & Environment',
      role: 'staff',
      status: 'Active'
    }
  });

  const uMarcus = await db.user.create({
    data: {
      name: 'Marcus Deluis',
      email: 'marcus.deluis@surepact.com',
      department: 'Community & Environment',
      role: 'staff',
      status: 'Active'
    }
  });

  const uNicole = await db.user.create({
    data: {
      name: 'Nicole Sherwin',
      email: 'nicole.sherwin@surepact.com',
      department: 'Finance & Compliance',
      role: 'staff',
      status: 'Active'
    }
  });

  // Map users to business units
  await db.businessUnitUser.createMany({
    data: [
      { userId: uAdrian.id, businessUnitId: buCEO.id },
      { userId: uAdrian.id, businessUnitId: buStrategy.id },
      { userId: uBrett.id, businessUnitId: buCEO.id },
      { userId: uChristine.id, businessUnitId: buFinance.id },
      { userId: uChristine.id, businessUnitId: buGrants.id },
      { userId: uNicole.id, businessUnitId: buGrants.id },
      { userId: uDaniel.id, businessUnitId: buCivil.id },
      { userId: uDaniel.id, businessUnitId: buWater.id },
      { userId: uHenry.id, businessUnitId: buEnv.id },
      { userId: uMarcus.id, businessUnitId: buParks.id }
    ]
  });

  // Map old variables so rest of seed script remains unchanged and compiles
  const userSarah = uDaniel;
  const userMichael = uHenry;
  const userElena = uMarcus;
  const userDavid = uChristine;
  const userBianca = uNicole;

  console.log(`Seeded users, departments, and business units.`);

  // 2. Seed Projects (Capital works & initiatives)
  console.log('Seeding Projects...');
  const projWater = await db.project.create({
    data: {
      name: 'Regional Water Filtration Plant Upgrade',
      description: 'Upgrading the primary regional water treatment unit, adding secondary microfiltration channels and emergency flood defenses.',
      department: 'Engineering & Works',
      status: 'ACTIVE'
    }
  });

  const projSolar = await db.project.create({
    data: {
      name: 'Community Solar & Microgrid Installation',
      description: 'Installing solar arrays and battery energy storage (BESS) on regional community centers to ensure emergency power resilience.',
      department: 'Community Services',
      status: 'ACTIVE'
    }
  });

  const projPark = await db.project.create({
    data: {
      name: 'Urban Tree Canopy & Parklands Expansion',
      description: 'Greening regional city centers by planting 5,000 native shade trees and expanding local urban parks.',
      department: 'Environmental Services',
      status: 'ACTIVE'
    }
  });

  console.log(`Seeded 3 projects.`);

  // 3. Seed Grants
  console.log('Seeding Grants...');
  
  // Grant 1: Water infrastructure (AWARDED)
  const grantWater = await db.grant.create({
    data: {
      organizationId: ORG_ID,
      title: 'Regional Water Infrastructure and Resilience Grant',
      funderName: 'Department of Infrastructure, Transport, Regional Development, Communications and the Arts',
      sourceUrl: 'https://www.grants.gov.au/Go/Show?GoUuid=7f9b80b0-a541-4770-b183-c20577000e31',
      totalFundingValue: 12500000.00,
      openDate: new Date('2026-01-15'),
      closeDate: new Date('2026-04-30'),
      status: 'AWARDED',
      gfaDocumentName: 'GFA_Regional_Water_Infrastructure_Agreement.pdf',
      gfaExtractedTitle: 'GFA REGIONAL WATER INFRASTRUCTURE AGREEMENT',
      dateSubmitted: new Date('2026-04-10'),
      submissionReference: 'SUB-2026-WTR-998',
      rawScrapedData: JSON.stringify({ source: 'grants.gov.au', method: 'HTTP_DOM' })
    }
  });

  // Grant 2: ARENA Clean Energy (AWARDED)
  const grantEnergy = await db.grant.create({
    data: {
      organizationId: ORG_ID,
      title: 'Clean Energy Community Microgrids Fund',
      funderName: 'Australian Renewable Energy Agency (ARENA)',
      sourceUrl: 'https://www.grants.gov.au/Go/Show?GoUuid=8812bbac-99e0-410a-b280-9993882772ab',
      totalFundingValue: 4200000.00,
      openDate: new Date('2026-02-01'),
      closeDate: new Date('2026-05-15'),
      status: 'AWARDED',
      gfaDocumentName: 'ARENA_Clean_Energy_Microgrids_Agreement.pdf',
      gfaExtractedTitle: 'ARENA CLEAN ENERGY MICROGRIDS AGREEMENT',
      dateSubmitted: new Date('2026-05-05'),
      submissionReference: 'SUB-2026-ARENA-334',
      rawScrapedData: JSON.stringify({ source: 'grants.gov.au', method: 'HTTP_DOM' })
    }
  });

  // Grant 3: Climate Change Urban Greenspaces (APPLICATION_STAGED)
  const grantGreen = await db.grant.create({
    data: {
      organizationId: ORG_ID,
      title: 'Urban Green Spaces Development Fund',
      funderName: 'Department of Climate Change, Energy, the Environment and Water',
      sourceUrl: 'https://www.grants.gov.au/Go/Show?GoUuid=555c44dd-ffdd-222a-88aa-333333333333',
      totalFundingValue: 1500000.00,
      openDate: new Date('2026-05-10'),
      closeDate: new Date('2026-07-31'),
      status: 'APPLICATION_STAGED',
      rawScrapedData: JSON.stringify({ source: 'grants.gov.au', method: 'HTTP_DOM' })
    }
  });

  // Grant 4: Sports/Community Support (POTENTIAL)
  const grantSports = await db.grant.create({
    data: {
      organizationId: ORG_ID,
      title: 'Local Sports Infrastructure Upgrade Fund',
      funderName: 'Department of Health and Aged Care',
      sourceUrl: 'https://www.grants.gov.au/Go/Show?GoUuid=889c22dd-aabb-33cc-88ee-111122223333',
      totalFundingValue: 650000.00,
      openDate: new Date('2026-06-01'),
      closeDate: new Date('2026-08-30'),
      status: 'POTENTIAL',
      rawScrapedData: JSON.stringify({ source: 'grants.gov.au', method: 'MOCK_GENERATED' })
    }
  });

  console.log(`Seeded 4 grants.`);

  // 4. Seed Risk Assessments (for active grants)
  await db.riskAssessment.create({
    data: {
      grantId: grantWater.id,
      assessedByUserId: ADMIN_USER_ID,
      financialRiskScore: 3,
      deliveryCapabilityScore: 2,
      strategicAlignmentScore: 1,
      overallRiskRating: 'LOW',
      justificationNotes: 'Low financial risk. Deliverables align perfectly with regional capital works plans. Engineering team has active bandwidth.',
      isApprovedToApply: true
    }
  });

  await db.riskAssessment.create({
    data: {
      grantId: grantEnergy.id,
      assessedByUserId: ADMIN_USER_ID,
      financialRiskScore: 4,
      deliveryCapabilityScore: 3,
      strategicAlignmentScore: 2,
      overallRiskRating: 'MEDIUM',
      justificationNotes: 'Moderate delivery and financial risk due to lithium battery battery storage supply lead times and required 20% co-funding match.',
      isApprovedToApply: true
    }
  });

  await db.riskAssessment.create({
    data: {
      grantId: grantGreen.id,
      assessedByUserId: ADMIN_USER_ID,
      financialRiskScore: 2,
      deliveryCapabilityScore: 1,
      strategicAlignmentScore: 2,
      overallRiskRating: 'LOW',
      justificationNotes: 'Minimal risk. Staff parks crew is available for executing local tree planting schedules.',
      isApprovedToApply: true
    }
  });

  // 5. Seed Grant-to-Project Allocations (Mappings)
  console.log('Seeding Grant Project Mappings...');
  // Water Grant funds Water Project ($8.5M allocated)
  await db.grantProjectMapping.create({
    data: {
      grantId: grantWater.id,
      projectId: projWater.id,
      allocatedAmount: 8500000.00
    }
  });

  // Energy Grant funds Solar Project ($3.5M allocated)
  await db.grantProjectMapping.create({
    data: {
      grantId: grantEnergy.id,
      projectId: projSolar.id,
      allocatedAmount: 3500000.00
    }
  });

  // Energy Grant also funds Water Project ($700,000 allocated for solar backup on water pumps!)
  await db.grantProjectMapping.create({
    data: {
      grantId: grantEnergy.id,
      projectId: projWater.id,
      allocatedAmount: 700000.00
    }
  });

  console.log(`Seeded 3 allocation mappings (demonstrating many-to-many relationships).`);

  // 6. Seed Contracts for Awarded Grants
  console.log('Seeding Contracts & Milestones...');
  
  // Water Contract
  const contractWater = await db.contract.create({
    data: {
      grantId: grantWater.id,
      fundingAgreementReference: 'GFA-WATERINFRA-2026',
      executionDate: new Date('2026-05-15'),
      totalObligatedAmount: 12500000.00
    }
  });

  // Energy Contract
  const contractEnergy = await db.contract.create({
    data: {
      grantId: grantEnergy.id,
      fundingAgreementReference: 'GFA-ARENARENEW-2026',
      executionDate: new Date('2026-05-20'),
      totalObligatedAmount: 4200000.00
    }
  });

  // Installments for Water Contract
  await db.installment.create({
    data: {
      contractId: contractWater.id,
      amount: 5000000.00,
      dueDate: new Date('2026-08-15'),
      status: 'PENDING'
    }
  });
  await db.installment.create({
    data: {
      contractId: contractWater.id,
      amount: 4500000.00,
      dueDate: new Date('2026-12-10'),
      status: 'PENDING'
    }
  });
  await db.installment.create({
    data: {
      contractId: contractWater.id,
      amount: 3000000.00,
      dueDate: new Date('2026-04-10'),
      status: 'RECEIVED'
    }
  });

  // Installments for Energy Contract
  await db.installment.create({
    data: {
      contractId: contractEnergy.id,
      amount: 2000000.00,
      dueDate: new Date('2026-09-01'),
      status: 'PENDING'
    }
  });
  await db.installment.create({
    data: {
      contractId: contractEnergy.id,
      amount: 2200000.00,
      dueDate: new Date('2026-11-30'),
      status: 'PENDING'
    }
  });

  // 7. Seed Milestones & Sub-tasks
  
  // Water Milestones
  const mWater1 = await db.milestone.create({
    data: {
      contractId: contractWater.id,
      title: 'GFA Clause 4.1: Detailed Civil Site Survey & Engineering Design Approvals',
      description: 'Deliver detailed structural plans for regional water filtration channels. Payment trigger: $150,000.',
      dueDate: new Date('2026-07-15'),
      isAcquitted: true
    }
  });

  const mWater2 = await db.milestone.create({
    data: {
      contractId: contractWater.id,
      title: 'GFA Schedule B: Excavation, Pipework Foundation & Ground Connection',
      description: 'Civil works clearance and main inlet pipeline foundations laid. Payment trigger: $450,000.',
      dueDate: new Date('2026-10-30'),
      isAcquitted: false
    }
  });

  // Energy Milestones
  const mEnergy1 = await db.milestone.create({
    data: {
      contractId: contractEnergy.id,
      title: 'GFA Clause 3.2: Geotechnical Analysis & Solar Array Layout Engineering',
      description: 'Soil test verification and photovoltaic structural calculations submitted to ARENA. Initial draw: 15% value.',
      dueDate: new Date('2026-08-01'),
      isAcquitted: false
    }
  });

  // Seed Milestone Tasks (action items assigned to staff users)
  console.log('Seeding Actionable Milestone Tasks...');
  
  // Tasks for Water Milestone 1 (Acquitted/Completed)
  await db.milestoneTask.create({
    data: {
      milestoneId: mWater1.id,
      title: 'Finalize Geotechnical Survey of Filtration Site',
      description: 'Confirm ground load-bearing capacities for the heavy filtration block.',
      assignedToUserId: userSarah.id,
      status: 'COMPLETED',
      dueDate: new Date('2026-06-15'),
      completedAt: new Date('2026-06-14')
    }
  });

  await db.milestoneTask.create({
    data: {
      milestoneId: mWater1.id,
      title: 'Submit Engineering Drawings for Board Approval',
      description: 'Present the detailed piping designs to the Executive Council board for final sign-off.',
      assignedToUserId: userDavid.id,
      status: 'COMPLETED',
      dueDate: new Date('2026-07-01'),
      completedAt: new Date('2026-06-30')
    }
  });

  // Tasks for Water Milestone 2 (Pending/In-Progress)
  await db.milestoneTask.create({
    data: {
      milestoneId: mWater2.id,
      title: 'Publish Civil Excavation Tender Packages',
      description: 'Publish request for tender (RFT) on local government portal for excavation contractors.',
      assignedToUserId: userSarah.id,
      status: 'IN_PROGRESS',
      dueDate: new Date('2026-08-15')
    }
  });

  await db.milestoneTask.create({
    data: {
      milestoneId: mWater2.id,
      title: 'Prepare Environmental Run-off Mitigation Audit',
      description: 'Draft the erosion control strategy report required by state EPA before earth clearing starts.',
      assignedToUserId: userMichael.id,
      status: 'PENDING',
      dueDate: new Date('2026-09-01')
    }
  });

  // Tasks for Energy Milestone 1
  await db.milestoneTask.create({
    data: {
      milestoneId: mEnergy1.id,
      title: 'Collect Solar Radiation Telemetry Data',
      description: 'Run site sensors for 30 days to verify seasonal solar yields match ARENA spreadsheet forecasts.',
      assignedToUserId: userElena.id,
      status: 'IN_PROGRESS',
      dueDate: new Date('2026-07-15')
    }
  });

  await db.milestoneTask.create({
    data: {
      milestoneId: mEnergy1.id,
      title: 'Review Battery Grid Interconnection Compliance',
      description: 'Submit technical specs of BESS to energy utility for preliminary network connection approval.',
      assignedToUserId: userSarah.id,
      status: 'PENDING',
      dueDate: new Date('2026-07-25')
    }
  });

  await db.milestoneTask.create({
    data: {
      milestoneId: mEnergy1.id,
      title: 'Establish Solar Match-Funding Trust Account',
      description: 'Open a dedicated trust ledger in corporate finance engine to hold our $800k co-investment reserves.',
      assignedToUserId: userDavid.id,
      status: 'COMPLETED',
      dueDate: new Date('2026-06-20'),
      completedAt: new Date('2026-06-18')
    }
  });

  console.log(`Seeded 7 milestone tasks assigned to staff members.`);

  // 8. Seed Contract Variations
  console.log('Seeding Contract Variations...');
  await db.contractVariation.create({
    data: {
      contractId: contractWater.id,
      referenceNumber: 'VAR-WTR-001',
      valueChange: 250000.00,
      newCloseDate: new Date('2027-06-30'), // Extended close date by 10 months
      status: 'APPROVED',
      description: 'Increase funding allocation by $250k due to structural reinforcing steel tariff price shifts. Approved by Federal Commissioner.',
      approvalDate: new Date('2026-06-10')
    }
  });

  await db.contractVariation.create({
    data: {
      contractId: contractEnergy.id,
      referenceNumber: 'VAR-ENERGY-002',
      valueChange: -50000.00,
      status: 'PENDING',
      description: 'Requesting scope reduction of battery storage module at community center due to localized physical spacing constraints. Awaiting ARENA board review.'
    }
  });

  console.log(`Seeded 2 contract variations.`);

  // 9. Seed Financial Ledger Transactions (Income vs Expenditures)
  console.log('Seeding Financial Transactions...');
  
  // Water Grant Income
  await db.transaction.create({
    data: {
      organizationId: ORG_ID,
      grantId: grantWater.id,
      projectId: projWater.id,
      amount: 150000.00, // Positive = Inbound Drawdown
      type: 'INCOME',
      description: 'Milestone 1 Payment: Agreement signing mobilization payout from DCCEEW.',
      category: 'Funder Drawdown',
      date: new Date('2026-05-20')
    }
  });

  // Water Project Expenditures (Spends)
  await db.transaction.create({
    data: {
      organizationId: ORG_ID,
      grantId: grantWater.id,
      projectId: projWater.id,
      amount: -45000.00, // Negative = Expenditure
      type: 'EXPENDITURE',
      description: 'Invoice #CIV-2026-887: Soil testing, core drilling & load test report - Apex Engineers.',
      category: 'Consultants & Design',
      date: new Date('2026-05-28')
    }
  });

  await db.transaction.create({
    data: {
      organizationId: ORG_ID,
      grantId: grantWater.id,
      projectId: projWater.id,
      amount: -12500.00,
      type: 'EXPENDITURE',
      description: 'Invoice #PLA-223: Site zoning survey, structural drawings validation - State Planning Dept.',
      category: 'Permits & Fees',
      date: new Date('2026-06-05')
    }
  });

  // Energy/Solar Project Income
  await db.transaction.create({
    data: {
      organizationId: ORG_ID,
      grantId: grantEnergy.id,
      projectId: projSolar.id,
      amount: 630000.00, // 15% drawdown on $4.2M GFA
      type: 'INCOME',
      description: 'Milestone 1 Payment: Inception draw from ARENA Renewable Trust.',
      category: 'Funder Drawdown',
      date: new Date('2026-06-01')
    }
  });

  // Energy Project Expenditures
  await db.transaction.create({
    data: {
      organizationId: ORG_ID,
      grantId: grantEnergy.id,
      projectId: projSolar.id,
      amount: -185000.00,
      type: 'EXPENDITURE',
      description: 'PO #BESS-001: Initial deposit payment on Lithium Battery containers - Tesla Energy Australia.',
      category: 'Equipment & Materials',
      date: new Date('2026-06-12')
    }
  });

  await db.transaction.create({
    data: {
      organizationId: ORG_ID,
      grantId: grantEnergy.id,
      projectId: projSolar.id,
      amount: -8500.00,
      type: 'EXPENDITURE',
      description: 'Invoice #ENV-998: Vegetation clearing and micro-grid clearing permit analysis.',
      category: 'Permits & Fees',
      date: new Date('2026-06-15')
    }
  });

  console.log(`Seeded 6 financial transactions.`);

  // 9. Seed Mock Documents
  console.log('Seeding Documents...');
  await db.document.create({
    data: {
      grantId: grantWater.id,
      name: 'GFA_Regional_Water_Infrastructure_Agreement.pdf',
      type: 'AGREEMENT',
      fileSize: '3.1 MB',
      uploadedBy: 'David Boyle'
    }
  });

  await db.document.create({
    data: {
      grantId: grantWater.id,
      name: 'Q1_Water_Status_Report.pdf',
      type: 'REPORT',
      fileSize: '1.2 MB',
      uploadedBy: 'Sarah Jenkins'
    }
  });

  await db.document.create({
    data: {
      grantId: grantEnergy.id,
      name: 'ARENA_Clean_Energy_Microgrids_Agreement.pdf',
      type: 'AGREEMENT',
      fileSize: '2.4 MB',
      uploadedBy: 'David Boyle'
    }
  });

  await db.document.create({
    data: {
      grantId: grantEnergy.id,
      name: 'ARENA_Application_V3_Final.pdf',
      type: 'APPLICATION',
      fileSize: '4.8 MB',
      uploadedBy: 'Adrian'
    }
  });

  console.log('Seeded 4 documents.');

  // 10. Seed Funding Bodies, Contacts, and Opportunities
  console.log('Seeding CRM-lite data...');
  const fbArena = await db.fundingBody.create({
    data: {
      name: 'Australian Renewable Energy Agency (ARENA)',
      type: 'GOVERNMENT',
      website: 'https://arena.gov.au',
      description: 'Support the transition to net zero emissions by accelerating the pace of pre-commercial and commercial renewable energy technologies.'
    }
  });

  const fbInfra = await db.fundingBody.create({
    data: {
      name: 'Department of Infrastructure, Transport, Regional Development, Communications and the Arts',
      type: 'GOVERNMENT',
      website: 'https://www.infrastructure.gov.au',
      description: 'Delivering infrastructure, transport, and regional development programs across Australia.'
    }
  });

  const fbMinderoo = await db.fundingBody.create({
    data: {
      name: 'Minderoo Foundation',
      type: 'PHILANTHROPIC',
      website: 'https://www.minderoo.org',
      description: 'Philanthropic organisation supporting environmental resilience, clean oceans, and community initiatives.'
    }
  });

  // Seed Contacts
  const contactSarah = await db.fundingBodyContact.create({
    data: {
      fundingBodyId: fbArena.id,
      name: 'Sarah Connor',
      role: 'Investment Manager',
      email: 'sconnor@arena.gov.au',
      phone: '+61 2 6243 7701'
    }
  });

  const contactRobert = await db.fundingBodyContact.create({
    data: {
      fundingBodyId: fbMinderoo.id,
      name: 'Robert Mercer',
      role: 'Community Grant Coordinator',
      email: 'rmercer@minderoo.org',
      phone: '+61 8 6460 4949'
    }
  });

  // Seed Interactions
  await db.contactInteraction.create({
    data: {
      contactId: contactSarah.id,
      type: 'NOTE',
      subject: 'Microgrid eligibility guidelines',
      content: 'Discussed microgrid eligibility for remote townships. She confirmed that projects with community BESS support are highly prioritized.'
    }
  });

  await db.contactInteraction.create({
    data: {
      contactId: contactSarah.id,
      type: 'CALL',
      subject: 'Co-funding match requirements',
      content: 'Call to confirm co-funding requirement rules. She clarified that regional local governments can count state-funded civil works as co-funding.'
    }
  });

  await db.contactInteraction.create({
    data: {
      contactId: contactRobert.id,
      type: 'MEETING',
      subject: 'Initial meeting Minderoo Perth',
      content: 'Initial meeting at Minderoo Perth office. Indicated interest in supporting parklands expansion under their climate resilience initiative.'
    }
  });

  // Seed Opportunities
  await db.fundingOpportunity.create({
    data: {
      fundingBodyId: fbArena.id,
      contactId: contactSarah.id,
      title: 'Microgrids for Remote Indigenous Communities',
      value: 2500000.00,
      status: 'DISCUSSING',
      description: 'Funding proposal to install smart solar-battery microgrids in three remote communities.',
      deadline: new Date('2026-09-15')
    }
  });

  await db.fundingOpportunity.create({
    data: {
      fundingBodyId: fbMinderoo.id,
      contactId: contactRobert.id,
      title: 'Coastal Habitat Reforestation Project',
      value: 850000.00,
      status: 'IDENTIFIED',
      description: 'Re-vegetation of saline coastal wetlands to protect regional roads from ocean erosion.',
      deadline: new Date('2026-11-01')
    }
  });

  console.log('Seeded CRM-lite data.');

  // Seed Knowledge Documents from directory
  console.log('Seeding Knowledge Documents...');
  let assetsDir = '';
  const searchPaths = [
    path.join(__dirname, '../../knowledge_centre_assets'),
    path.join(__dirname, '../knowledge_centre_assets'),
    path.join(process.cwd(), 'knowledge_centre_assets'),
    path.join(process.cwd(), '../knowledge_centre_assets')
  ];
  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      assetsDir = p;
      break;
    }
  }

  if (assetsDir) {
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(assetsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        let type = 'OTHER';
        if (file.startsWith('past_app_')) {
          type = 'PAST_GRANT_APPLICATION';
        } else if (file.includes('annual_report_')) {
          type = 'ANNUAL_REPORT';
        } else if (file.includes('strategic_plan_')) {
          type = 'STRATEGIC_PLAN';
        } else if (file.includes('project_plan_')) {
          type = 'PROJECT_PLAN';
        }

        const stats = fs.statSync(filePath);
        const fileSize = `${(stats.size / 1024).toFixed(1)} KB`;

        await db.knowledgeDocument.create({
          data: {
            name: file,
            type,
            fileSize,
            uploadedBy: 'Adrian (Founder)',
            content
          }
        });
      }
    }
    console.log(`Seeded ${files.length} knowledge documents from ${assetsDir}.`);
  } else {
    console.warn('Knowledge documents directory not found, skipping knowledge document seeding.');
  }

  console.log('Seeding complete! Database successfully loaded with Enterprise test data.');
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
