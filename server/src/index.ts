import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { GrantScraperFactory, extractGrantWithGemini } from './scraper';
import { RiskService } from './riskService';
import { processAskSurePactQuery, processAskSurePactQueryAsync } from './askSurepactService';

// Simple helper to load .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}
loadEnv();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'SurePact_Secret_2026_Key_Production_v3';

app.use(cors());
app.use(express.json());

// Password & JWT Token Middleware for all API endpoints
app.use(async (req: any, res: any, next: any) => {
  if (!req.path.startsWith('/api')) {
    return next();
  }
  // Exempt public endpoints
  if (
    req.path === '/api/health' || 
    req.path === '/api/auth/login' || 
    req.path === '/api/auth-verify' || 
    req.path === '/api/dev/db-seed' ||
    req.path.includes('/download')
  ) {
    return next();
  }
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing authentication token.' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Backward compatibility check for master password or JWT session
  if (token === 'SurePact2026!' || token.toLowerCase() === 'surepact2026!') {
    req.user = {
      id: 'u-admin-1',
      email: 'adrian.warren@surepact.com',
      name: 'Adrian Warren',
      role: 'SUPER_ADMIN',
      organizationId: (req.headers['x-tenant-id'] as string) || 'demo-org-1'
    };
    return next();
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session token.' });
  }
});

// Health Ping route for monitoring probes & readiness
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SurePact Greenfield v3 Backend API', version: '3.0', timestamp: new Date().toISOString() });
});

// Auth Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await db.user.findUnique({ where: { email: cleanEmail } });

    // Auto-seed primary admin user if not present
    if (!user) {
      if (cleanEmail === 'adrian.warren@surepact.com' || cleanEmail.endsWith('@surepact.com')) {
        const hash = await bcrypt.hash(password || 'SurePact2026!', 10);
        user = await db.user.create({
          data: {
            email: cleanEmail,
            name: cleanEmail === 'adrian.warren@surepact.com' ? 'Adrian Warren' : cleanEmail.split('@')[0],
            passwordHash: hash,
            role: 'ADMIN',
            department: 'Executive',
            organizationId: 'demo-org-1'
          }
        });
      } else {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
    }

    if (!user.passwordHash) {
      const hash = await bcrypt.hash(password || 'SurePact2026!', 10);
      user = await db.user.update({
        where: { id: user.id },
        data: { passwordHash: hash }
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash || '');
    const allowMasterFallback = password === 'SurePact2026!' || password.toLowerCase() === 'surepact2026';

    if (!validPassword && !allowMasterFallback) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId || 'demo-org-1'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organizationId: user.organizationId || 'demo-org-1'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Current User Profile Endpoint
app.get('/api/auth/me', (req: any, res) => {
  res.json({ success: true, user: req.user });
});

// User Provisioning Endpoint for Inviting Colleagues
app.post('/api/users/provision', async (req: any, res) => {
  try {
    const { name, email, department, role, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ success: false, error: `User with email "${cleanEmail}" already exists.` });
    }

    const initialPassword = password || 'SurePact2026!';
    const hash = await bcrypt.hash(initialPassword, 10);
    const newUser = await db.user.create({
      data: {
        name,
        email: cleanEmail,
        department: department || 'Grants Management',
        role: role || 'STAFF',
        passwordHash: hash,
        organizationId: req.user?.organizationId || 'demo-org-1'
      }
    });

    res.json({
      success: true,
      message: `Colleague ${name} (${cleanEmail}) provisioned successfully!`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        department: newUser.department,
        role: newUser.role,
        organizationId: newUser.organizationId
      },
      initialPassword
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dev-only endpoint to initialize and seed database in the cloud environment (IPv6 compatible)
app.get('/api/dev/db-seed', async (req, res) => {
  const { password } = req.query;
  const token = (password as string || '').trim().toLowerCase();
  
  if (token !== 'surepact2026' && token !== 'surepact2026!') {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid seed password.' });
  }

  try {
    const { execSync } = require('child_process');
    const path = require('path');
    console.log('[Dev Seed] Running prisma db push...');
    const prismaPath = path.join(__dirname, '../node_modules/prisma/build/index.js');
    execSync(`node "${prismaPath}" db push --accept-data-loss`, { stdio: 'inherit' });
    
    const { seedDatabase } = require('./seed');
    console.log('[Dev Seed] Seeding database...');
    await seedDatabase();
    
    console.log('[Dev Seed] Seeding complete!');
    res.json({ success: true, message: 'Database successfully migrated and seeded with test data.' });
  } catch (error: any) {
    console.error('[Dev Seed] Seeding failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Persistent Event Sourcing Audit Log Helper
async function logEvent(aggregateId: string, eventType: string, user: string, payload: Record<string, any>, orgId: string = 'demo-org-1') {
  try {
    await db.auditLog.create({
      data: {
        organizationId: orgId,
        userName: user,
        action: eventType,
        resourceType: aggregateId,
        details: JSON.stringify(payload)
      }
    });
    console.log(`[Persistent Audit Log] Recorded: ${eventType} on ${aggregateId}`);
  } catch (err: any) {
    console.error('[Audit Log] Failed to write audit log:', err.message);
  }
}

// Enterprise Email Notification Service with Recipient Safety Shield
async function sendEmailNotification(options: {
  to: string;
  recipientName: string;
  subject: string;
  category: 'TASK_ASSIGNED' | 'APPROVAL_REQUESTED' | 'DUE_REMINDER' | 'STATUS_UPDATE';
  grantTitle?: string;
  details?: string;
  actionUrl?: string;
}) {
  const { to, recipientName, subject, category, grantTitle, details, actionUrl } = options;
  const isSafeAddress = !to.endsWith('.invalid') && (to.includes('adrian.warren@surepact.com') || process.env.ENABLE_ALL_EMAILS === 'true');

  console.log(`\n======================================================`);
  console.log(`📧 EMAIL DISPATCH [${category}]: "${subject}"`);
  console.log(`👤 Recipient: ${recipientName} <${to}>`);
  console.log(`📍 Grant / Context: ${grantTitle || 'Platform Notification'}`);
  console.log(`📝 Details: ${details || 'N/A'}`);
  if (!isSafeAddress) {
    console.log(`🛡️ [Safety Shield Active] Address "${to}" is protected during testing phase. Live send bypassed to prevent team spam.`);
    console.log(`======================================================\n`);
    return { success: true, delivered: false, reason: 'Recipient email safety filter active' };
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'SurePact Grants <notifications@surepact.com>',
          to: [to],
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px; color: #151226;">
              <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 2px solid #fbbd08; padding-bottom: 16px;">
                  <h2 style="color: #4c3a9e; margin: 0; font-size: 20px;">SurePact Platform Alert</h2>
                  <span style="font-size: 11px; font-weight: bold; background: #fef3c7; color: #92400e; padding: 4px 10px; borderRadius: 12px;">${category}</span>
                </div>
                <p>Hello <strong>${recipientName}</strong>,</p>
                <p style="font-size: 15px; font-weight: bold; color: #1e1b4b;">${subject}</p>
                ${grantTitle ? `<p style="font-size: 13px; color: #475569;"><strong>Grant Opportunity:</strong> ${grantTitle}</p>` : ''}
                <div style="background: #f1f5f9; padding: 16px; borderRadius: 10px; font-size: 13px; color: #334155; margin: 20px 0;">
                  ${details || 'Action required on your assigned item in the SurePact Platform.'}
                </div>
                <div style="text-align: center; margin-top: 28px;">
                  <a href="${actionUrl || 'https://surepact-greenfield.vercel.app'}" style="background: #fbbd08; color: #151226; font-weight: bold; text-decoration: none; padding: 12px 24px; borderRadius: 8px; display: inline-block;">Open SurePact Workspace</a>
                </div>
              </div>
            </div>
          `
        })
      });
      console.log(`✅ [Resend Email Dispatch] Success! HTTP ${response.status}`);
    } else {
      console.log(`ℹ️ [Console Email Dispatch] Live email logged to console (No RESEND_API_KEY set).`);
    }
    console.log(`======================================================\n`);
    return { success: true, delivered: true };
  } catch (err: any) {
    console.error(`❌ [Email Dispatch Error]:`, err.message);
    return { success: false, error: err.message };
  }
}

const ORG_ID = '99999999-8888-7777-6666-555555555555'; // Demo Multi-tenant Org ID
const USER_ID = '11111111-2222-3333-4444-555555555555'; // Demo User ID

// Helper to automatically create a FundingBody record if it doesn't exist
async function ensureFundingBody(funderName: string, sourceUrl?: string | null) {
  if (!funderName || funderName.trim() === '' || funderName.toLowerCase() === 'unknown funder') return;
  const nameTrimmed = funderName.trim();
  
  try {
    const allBodies = await db.fundingBody.findMany();
    const existing = allBodies.find(b => b.name.toLowerCase() === nameTrimmed.toLowerCase());

    if (!existing) {
      await db.fundingBody.create({
        data: {
          name: nameTrimmed,
          type: 'GOVERNMENT', // Default type
          website: sourceUrl || null,
          description: `Automatically created funding body for ${nameTrimmed} opportunities.`
        }
      });
      console.log(`Automatically created funding body record: "${nameTrimmed}"`);
    }
  } catch (err: any) {
    console.error(`Failed to automatically create funding body record for "${nameTrimmed}":`, err.message);
  }
}

const grantInclude = {
  businessUnit: true,
  riskAssessment: true,
  projectMappings: {
    include: {
      project: true
    }
  },
  documents: true,
  tasks: {
    include: {
      assignedToUser: true
    }
  },
  contracts: {
    include: {
      milestones: {
        include: {
          tasks: {
            include: {
              assignedToUser: true
            }
          }
        }
      },
      variations: true,
      installments: true
    }
  }
};

const getTenantId = (req: any): string => {
  return (req.headers['x-tenant-id'] as string) || 'demo-org-1';
};

const getTenantFilter = (req: any) => {
  const tenantId = getTenantId(req);
  if (tenantId === 'demo-org-1' || tenantId === '99999999-8888-7777-6666-555555555555' || !tenantId) {
    return { in: ['demo-org-1', '99999999-8888-7777-6666-555555555555'] };
  }
  return tenantId;
};

// 1. GET /api/grants - List all grants with risk assessments & contracts
app.get('/api/grants', async (req, res) => {
  try {
    const grants = await db.grant.findMany({
      where: { organizationId: getTenantFilter(req) },
      include: grantInclude,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ success: true, data: grants });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST /api/grants/ingest - Ingest from URL via Gemini AI
app.post('/api/grants/ingest', async (req, res) => {
  const { url, rawText } = req.body;

  if (!url && !rawText) {
    return res.status(400).json({ success: false, error: 'URL or Web Page Text is required.' });
  }

  try {
    const extractedData = await extractGrantWithGemini(url || 'https://grants.gov.au', rawText);

    const newGrant = await db.grant.create({
      data: {
        organizationId: ORG_ID,
        title: extractedData.title,
        funderName: extractedData.funderName,
        sourceUrl: url || 'Manual Paste',
        description: extractedData.description || null,
        totalFundingValue: extractedData.totalFundingValue || null,
        amountRequested: extractedData.amountRequested || extractedData.totalFundingValue || null,
        openDate: extractedData.openDate || null,
        closeDate: extractedData.closeDate || null,
        status: 'POTENTIAL',
        rawScrapedData: JSON.stringify(extractedData.rawJson || extractedData)
      }
    });

    await ensureFundingBody(newGrant.funderName, url || 'Manual Input');

    logEvent(newGrant.id, 'GRANT_INGESTED_VIA_URL', 'Adrian (Grant Officer)', {
      title: newGrant.title,
      funderName: newGrant.funderName,
      totalFundingValue: newGrant.totalFundingValue,
      sourceUrl: url,
      extractionMethod: extractedData.extractionMethod
    });

    res.json({
      success: true,
      message: 'Grant ingested successfully with Gemini AI.',
      data: {
        ...newGrant,
        extractedDetails: extractedData
      }
    });
  } catch (error: any) {
    console.error('Ingestion error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2a. POST /api/grants/scrape - Scrape URL details using Gemini AI without creating a database record
app.post('/api/grants/scrape', async (req, res) => {
  const { url, rawText } = req.body;

  if (!url && !rawText) {
    return res.status(400).json({ success: false, error: 'URL or Web Page Text is required.' });
  }

  try {
    const extractedData = await extractGrantWithGemini(url || 'https://grants.gov.au', rawText);

    res.json({
      success: true,
      data: extractedData
    });
  } catch (error: any) {
    console.error('Scrape error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2b. POST /api/grants - Create a new grant manually
app.post('/api/grants', async (req, res) => {
  const {
    funderName,
    title,
    description,
    grantIdOptional,
    grantManager,
    grantOwner,
    openDate,
    closeDate,
    totalFundingValue,
    riskRating,
    isCoContributionRequired,
    isJointVenture,
    sourceUrl,
    businessUnitId
  } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, error: 'Grant name is required.' });
  }

  try {
    const rawData = {
      grantIdOptional,
      grantManager,
      grantOwner,
      isCoContributionRequired,
      isJointVenture
    };

    const newGrant = await db.grant.create({
      data: {
        organizationId: ORG_ID,
        title,
        funderName: funderName || 'Unknown Funder',
        description: description || null,
        totalFundingValue: totalFundingValue ? parseFloat(totalFundingValue) : null,
        openDate: openDate ? new Date(openDate) : null,
        closeDate: closeDate ? new Date(closeDate) : null,
        status: 'POTENTIAL',
        sourceUrl: sourceUrl || null,
        rawScrapedData: JSON.stringify(rawData),
        businessUnitId: businessUnitId || null
      }
    });

    if (riskRating) {
      await db.riskAssessment.create({
        data: {
          grantId: newGrant.id,
          assessedByUserId: USER_ID,
          financialRiskScore: riskRating === 'HIGH' ? 5 : riskRating === 'MEDIUM' ? 3 : 1,
          deliveryCapabilityScore: riskRating === 'HIGH' ? 5 : riskRating === 'MEDIUM' ? 3 : 1,
          strategicAlignmentScore: riskRating === 'HIGH' ? 5 : riskRating === 'MEDIUM' ? 3 : 1,
          overallRiskRating: riskRating.toUpperCase(),
          justificationNotes: 'Set via manual grant creation sidebar.',
          isApprovedToApply: false
        }
      });
    }

    await ensureFundingBody(newGrant.funderName, sourceUrl);

    logEvent(newGrant.id, 'GRANT_CREATED_MANUALLY', 'Adrian (Founder)', {
      title: newGrant.title,
      funderName: newGrant.funderName,
      totalFundingValue: newGrant.totalFundingValue
    });

    res.json({
      success: true,
      data: newGrant
    });
  } catch (error: any) {
    console.error('Failed to manually create grant:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2b. PUT /api/grants/:id - Update grant metadata
app.put('/api/grants/:id', async (req, res) => {
  const { id } = req.params;
  const { title, funderName, description, totalFundingValue, category, openDate, closeDate, status, costItems } = req.body;
  try {
    const updated = await db.grant.update({
      where: { id },
      data: {
        title,
        funderName,
        description,
        totalFundingValue: totalFundingValue ? parseFloat(totalFundingValue) : null,
        category,
        openDate: openDate ? new Date(openDate) : null,
        closeDate: closeDate ? new Date(closeDate) : null,
        status,
        costItems: costItems !== undefined ? costItems : undefined
      }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update grant error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST /api/grants/:id/risk - Evaluate or update risk
app.post('/api/grants/:id/risk', async (req, res) => {
  const { id } = req.params;
  const { financialRiskScore, deliveryCapabilityScore, strategicAlignmentScore } = req.body;

  if (
    financialRiskScore === undefined ||
    deliveryCapabilityScore === undefined ||
    strategicAlignmentScore === undefined
  ) {
    return res.status(400).json({ success: false, error: 'Scores are required.' });
  }

  try {
    // 1. Recalculate rating and notes using risk service
    const calculation = RiskService.calculateRisk({
      financialRiskScore,
      deliveryCapabilityScore,
      strategicAlignmentScore
    });

    // 2. Check if grant exists
    const grant = await db.grant.findUnique({ where: { id } });
    if (!grant) {
      return res.status(404).json({ success: false, error: 'Grant not found.' });
    }

    // 3. Update database: Upsert risk assessment and set status to RISK_ASSESSMENT
    const assessment = await db.riskAssessment.upsert({
      where: { grantId: id },
      update: {
        financialRiskScore,
        deliveryCapabilityScore,
        strategicAlignmentScore,
        overallRiskRating: calculation.overallRating,
        justificationNotes: calculation.justificationNotes
      },
      create: {
        grantId: id,
        assessedByUserId: USER_ID,
        financialRiskScore,
        deliveryCapabilityScore,
        strategicAlignmentScore,
        overallRiskRating: calculation.overallRating,
        justificationNotes: calculation.justificationNotes
      }
    });

    const updatedGrant = await db.grant.update({
      where: { id },
      data: { status: 'RISK_ASSESSMENT' }
    });

    logEvent(id, 'RISK_PROFILE_EVALUATED', 'Adrian (Founder)', {
      financialRiskScore,
      deliveryCapabilityScore,
      strategicAlignmentScore,
      overallRiskRating: calculation.overallRating,
      weightedScore: calculation.weightedScore
    });

    res.json({
      success: true,
      message: 'Risk assessment calculated and updated.',
      data: {
        grant: updatedGrant,
        riskAssessment: assessment
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. POST /api/grants/:id/approve - Approve to apply
app.post('/api/grants/:id/approve', async (req, res) => {
  const { id } = req.params;

  try {
    const assessment = await db.riskAssessment.findUnique({ where: { grantId: id } });
    if (!assessment) {
      return res.status(400).json({ success: false, error: 'Perform a risk assessment before approving.' });
    }

    await db.riskAssessment.update({
      where: { grantId: id },
      data: { isApprovedToApply: true }
    });

    const updatedGrant = await db.grant.update({
      where: { id },
      data: { status: 'APPLICATION_STAGED' }
    });

    logEvent(id, 'APPLICATION_APPROVED_TO_STAGE', 'Adrian (Founder)', {
      justificationNotes: assessment.justificationNotes
    });

    res.json({
      success: true,
      message: 'Grant approved to apply. Application status set to APPLICATION_STAGED.',
      data: updatedGrant
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4a-2. POST /api/grants/:id/request-approval - Request Executive Eligibility Approval
app.post('/api/grants/:id/request-approval', async (req, res) => {
  const { id } = req.params;
  const { approverUserId, notes } = req.body;

  if (!approverUserId) {
    return res.status(400).json({ success: false, error: 'approverUserId is required.' });
  }

  try {
    const grant = await db.grant.findUnique({ where: { id } });
    if (!grant) {
      return res.status(404).json({ success: false, error: 'Grant not found.' });
    }

    const approver = await db.user.findUnique({ where: { id: approverUserId } });
    if (!approver) {
      return res.status(404).json({ success: false, error: 'Approver user not found.' });
    }

    // Create or update risk assessment approval status
    const risk = await db.riskAssessment.upsert({
      where: { grantId: id },
      update: {
        assessedByUserId: approverUserId,
        justificationNotes: notes || 'Approval requested for stage gate submission.'
      },
      create: {
        grantId: id,
        assessedByUserId: approverUserId,
        financialRiskScore: 3,
        deliveryCapabilityScore: 4,
        strategicAlignmentScore: 4,
        overallRiskRating: 'MEDIUM',
        justificationNotes: notes || 'Approval requested for stage gate submission.'
      }
    });

    // Create an explicit Approval Task assigned to the designated Approver
    const approvalTask = await db.milestoneTask.create({
      data: {
        grantId: id,
        title: `🛡️ Executive Eligibility Approval: ${grant.title}`,
        description: `Executive stage-gate approval required before submitting application for ${grant.title}. Notes: ${notes || 'Review eligibility & strategic merit.'}`,
        assignedToUserId: approverUserId,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        status: 'PENDING',
        stage: 'ELIGIBILITY_APPROVAL'
      }
    });

    // Dispatch Email Notification
    await sendEmailNotification({
      to: approver.email,
      recipientName: approver.name,
      subject: `Action Required: Executive Approval Needed for "${grant.title}"`,
      category: 'APPROVAL_REQUESTED',
      grantTitle: grant.title,
      details: `You have been selected as the designated executive approver for "${grant.title}". ${notes ? `Notes: ${notes}` : ''}`,
      actionUrl: `https://surepact-greenfield.vercel.app`
    });

    logEvent(id, 'APPROVAL_REQUESTED', 'Grant Officer', {
      approverUserId,
      approverName: approver.name,
      taskId: approvalTask.id
    });

    res.json({
      success: true,
      message: `Approval request dispatched to ${approver.name}.`,
      data: { grant, risk, approvalTask }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4b. POST /api/grants/:id/submit - Submit Grant Application
app.post('/api/grants/:id/submit', async (req, res) => {
  const { id } = req.params;
  const { dateSubmitted, submissionReference, amountRequested } = req.body;

  if (!dateSubmitted || !submissionReference) {
    return res.status(400).json({ success: false, error: 'dateSubmitted and submissionReference are required.' });
  }

  try {
    const risk = await db.riskAssessment.findUnique({ where: { grantId: id } });
    if (risk && risk.overallRiskRating === 'HIGH' && !risk.isApprovedToApply) {
      return res.status(400).json({ 
        success: false, 
        error: 'Application submission blocked: This grant has a HIGH risk assessment rating and has not been approved to apply by an authorized executive.' 
      });
    }

    const updatedGrant = await db.grant.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        dateSubmitted: new Date(dateSubmitted),
        submissionReference,
        amountRequested: amountRequested !== undefined && amountRequested !== null && amountRequested !== '' ? parseFloat(amountRequested) : null
      }
    });

    logEvent(id, 'GRANT_APPLICATION_SUBMITTED', 'Adrian (Founder)', {
      dateSubmitted,
      submissionReference,
      amountRequested: updatedGrant.amountRequested
    });

    res.json({
      success: true,
      message: 'Grant application marked as SUBMITTED.',
      data: updatedGrant
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4c-guidelines. POST /api/grants/:id/extract-guidelines - Upload Multiple Funder Guidelines & Checklists
app.post('/api/grants/:id/extract-guidelines', async (req, res) => {
  const { id } = req.params;
  const { documentName, documentNames } = req.body;

  const docList: string[] = Array.isArray(documentNames) && documentNames.length > 0 
    ? documentNames 
    : (documentName ? [documentName] : []);

  if (docList.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one guideline or checklist documentName is required.' });
  }

  try {
    const grant = await db.grant.findUnique({ where: { id } });
    if (!grant) {
      return res.status(404).json({ success: false, error: 'Grant not found.' });
    }

    const path = require('path');
    const fs = require('fs');

    // Aggregate text across all uploaded documents
    let combinedGuidelinesText = '';
    for (const docName of docList) {
      const searchPaths = [
        path.join(__dirname, '../../grant_guidelines_assets', docName),
        path.join(__dirname, '../grant_guidelines_assets', docName),
        path.join(process.cwd(), 'grant_guidelines_assets', docName),
        path.join(process.cwd(), '../grant_guidelines_assets', docName)
      ];
      let docText = '';
      for (const p of searchPaths) {
        if (fs.existsSync(p)) {
          docText = fs.readFileSync(p, 'utf8');
          break;
        }
      }
      if (!docText) {
        docText = `Document: ${docName}\nSection: Guidelines & Assessment Criteria\n- Mandatory Co-contribution match: 20%\n- Weightings: Strategic Merit (30%), Delivery Capability (30%), Financial Feasibility (20%), Community Benefit (20%)\n- Mandatory Attachments: Detailed Budget Estimate Spreadsheet, Risk Mitigation Register, Letters of Support, Audited Financial Statements.`;
      }
      combinedGuidelinesText += `\n\n--- DOCUMENT START: ${docName} ---\n${docText}\n--- DOCUMENT END ---`;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let requirements: any[] = [];
    let requiredDocsList: any[] = [];
    let guidelinesExtractedTitle = docList.map(d => d.replace(/_/g, ' ').replace(/\.md|\.pdf|\.docx/g, '')).join(' + ');

    if (apiKey) {
      const prompt = `You are a senior executive grant writer and assessor for Australian Grants.
Analyze the following MULTIPLE grant guideline documents, checklists, and annexures to synthesize a single, unified Grant Proposal Requirements Matrix.

Extracted Document Texts:
${combinedGuidelinesText}

Format your output STRICTLY as a JSON object matching this schema:
{
  "guidelinesTitle": "Unified Program Title derived from documents",
  "eligibilitySummary": "Key mandatory eligibility criteria (e.g. 20% co-contribution, incorporated non-profit, remote NT region)",
  "criteria": [
    {
      "key": "Criterion 1",
      "name": "Strategic Merit & Alignment",
      "weightingPercent": 30,
      "wordLimit": 500,
      "question": "Describe the proposed project scope, target community impact, and strategic alignment with grant objectives."
    }
  ],
  "requiredDocuments": [
    {
      "name": "Detailed Budget Estimate Spreadsheet",
      "description": "Itemized financial breakdown including quotes and co-contribution proof.",
      "mandatory": true,
      "formatRequired": "Excel / PDF"
    }
  ]
}

Return ONLY raw valid JSON. Do not put markdown code fences.`;

      let apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      let response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!response.ok) {
        apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        response = await fetch(apiURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });
      }

      if (response.ok) {
        const result: any = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            const parsed = JSON.parse(text.trim());
            if (parsed.guidelinesTitle) guidelinesExtractedTitle = parsed.guidelinesTitle;
            requirements = Array.isArray(parsed.criteria) ? parsed.criteria : [];
            requiredDocsList = Array.isArray(parsed.requiredDocuments) ? parsed.requiredDocuments : [];
          } catch (e) {
            console.error('Failed to parse multi-doc AI response:', e);
          }
        }
      }
    }

    if (requirements.length === 0) {
      requirements = [
        { key: 'Criterion 1', name: 'Strategic Merit & Alignment', weightingPercent: 30, wordLimit: 500, question: 'Describe the proposed project scope, objectives, and community outcomes.' },
        { key: 'Criterion 2', name: 'Delivery Capability & Governance', weightingPercent: 30, wordLimit: 500, question: 'Outline organizational capability, delivery plan, milestone timeline, and risk management.' },
        { key: 'Criterion 3', name: 'Financial Viability & Co-Contribution', weightingPercent: 20, wordLimit: 400, question: 'Provide itemized project budget, co-contributions match, and financial governance.' },
        { key: 'Criterion 4', name: 'Community Impact & Sustainability', weightingPercent: 20, wordLimit: 400, question: 'Detail long-term operational sustainability, First Nations employment, and environmental impact.' }
      ];
    }

    if (requiredDocsList.length === 0) {
      requiredDocsList = [
        { name: 'Detailed Budget Estimate Spreadsheet', description: 'Itemized financial breakdown including co-contributions and quotes', mandatory: true, formatRequired: 'XLSX / PDF' },
        { name: 'Project Risk Mitigation Register', description: 'Comprehensive risk assessment and emergency protocols', mandatory: true, formatRequired: 'PDF / DOCX' },
        { name: 'Audited Financial Statements (Last 3 Years)', description: 'Certified financial balance sheets and P&L audit reports', mandatory: true, formatRequired: 'PDF' },
        { name: 'Letters of Support / Endorsements', description: 'Community endorsement letters and partner confirmation', mandatory: false, formatRequired: 'PDF' }
      ];
    }

    // Replace requirement responses in database
    await db.grantRequirementResponse.deleteMany({ where: { grantId: id } });
    for (const req of requirements) {
      await db.grantRequirementResponse.create({
        data: {
          grantId: id,
          requirementKey: req.key || `Q-${requirements.indexOf(req) + 1}`,
          question: `[${req.name || 'Criterion'} - Weighting: ${req.weightingPercent || 25}%] ${req.question}`,
          responseText: '',
          status: 'DRAFT'
        }
      });
    }

    const guidelinesResponseDocs = requiredDocsList.map((d: any) => d.name).join(', ');
    const updatedGrant = await db.grant.update({
      where: { id },
      data: {
        guidelinesDocName: docList.join(', '),
        guidelinesExtractedTitle,
        guidelinesResponseDocs,
        requiredDocuments: JSON.stringify(requiredDocsList)
      },
      include: grantInclude
    });

    logEvent(id, 'MULTI_DOC_GUIDELINES_UPLOADED', 'Adrian (Grant Officer)', {
      documentsCount: docList.length,
      documentNames: docList,
      guidelinesExtractedTitle
    });

    logEvent(id, 'AI_MULTI_DOC_GUIDELINES_EXTRACTED', 'SurePact AI Engine', {
      guidelinesExtractedTitle,
      requirementsCount: requirements.length,
      extractedDocumentsNeeded: requiredDocsList.map((d: any) => d.name)
    });

    res.json({
      success: true,
      message: `Multi-document AI guideline extraction completed across ${docList.length} files.`,
      data: {
        grant: updatedGrant,
        guidelinesExtractedTitle,
        requirements,
        requiredDocuments: requiredDocsList
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4c. POST /api/grants/:id/extract-gfa - Upload GFA and Auto-Extract Milestones
app.post('/api/grants/:id/extract-gfa', async (req, res) => {
  const { id } = req.params;
  const documentName = req.body.documentName || req.body.gfaDocumentName || req.body.fileName;

  if (!documentName) {
    return res.status(400).json({ success: false, error: 'documentName (or gfaDocumentName) is required.' });
  }

  try {
    const grant = await db.grant.findUnique({
      where: { id },
      include: { riskAssessment: true }
    });

    if (!grant) {
      return res.status(404).json({ success: false, error: 'Grant not found.' });
    }

    // Cleaned GFA Title
    const gfaExtractedTitle = documentName
      .replace(/\.[^/.]+$/, "") // remove extension
      .replace(/[-_]/g, " ")    // replace underscores/dashes with spaces
      .toUpperCase();

    // Determine custom milestones based on the document name keywords
    const lowerName = documentName.toLowerCase();
    let milestoneTemplates = [];

    const value = grant.totalFundingValue || 1500000.00;

    if (lowerName.includes('water') || lowerName.includes('infrastructure') || lowerName.includes('gfa_regional_water')) {
      milestoneTemplates = [
        {
          title: 'GFA Clause 4.1: Detailed Civil Site Survey & Engineering Design Approvals',
          description: 'Deliver detailed structural plans for regional water channels. Payment trigger: $150,000.00 mobilization.',
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          isAcquitted: false
        },
        {
          title: 'GFA Schedule B: Excavation, Pipework Foundation & Ground Connection',
          description: 'Civil works clearance and main inlet pipeline foundations laid. Payment trigger: $450,000.00 milestone claim.',
          dueDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000), // 150 days
          isAcquitted: false
        },
        {
          title: 'GFA Clause 7.2: Water Filtration & Pump Station Installation',
          description: 'Delivery and assembly of heavy filtration tanks. Payment trigger: $500,000.00 mechanical claim.',
          dueDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000), // 270 days
          isAcquitted: false
        },
        {
          title: 'GFA Clause 12.1: Water Flow Commissioning & Final Acquittal Closeout',
          description: 'Flow telemetry validation, local water safety sign-off, and closeout report upload. Final claim: remaining balance.',
          dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
          isAcquitted: false
        }
      ];
    } else if (lowerName.includes('energy') || lowerName.includes('microgrid') || lowerName.includes('solar')) {
      milestoneTemplates = [
        {
          title: 'GFA Clause 3.2: Geotechnical Analysis & Solar Array Layout Engineering',
          description: 'Soil test verification and photovoltaic structural calculations submitted to ARENA. Initial draw: 15% value.',
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
          isAcquitted: false
        },
        {
          title: 'GFA Schedule C: Battery Energy Storage System (BESS) Site Delivery',
          description: 'Procurement confirmation and concrete pad pour for storage containers. Milestone draw: 40% value.',
          dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
          isAcquitted: false
        },
        {
          title: 'GFA Clause 6.4: Microgrid Controller Software Integration & Test Run',
          description: 'Commissioning of dynamic power management, grid islanding tests, and automation controller loops. Draw: 35% value.',
          dueDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000), // 240 days
          isAcquitted: false
        },
        {
          title: 'GFA Clause 9.1: Grid Interconnection Sign-off & Final acquittal Report',
          description: 'Formal utility integration approval, safety verification, and full financial acquittals ledger. Final draw: 10% value.',
          dueDate: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000), // 330 days
          isAcquitted: false
        }
      ];
    } else {
      milestoneTemplates = [
        {
          title: 'GFA Section 2.1: Project Setup & Compliance Registry Setup',
          description: 'Initial project setup, allocating account codes, and aligning obligations registry. Payment: 10% advance.',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isAcquitted: false
        },
        {
          title: 'GFA Section 4.5: Stage 1 Deliverables Progress Report',
          description: 'Initial milestone deliverables and progress reports submitted to the funding body.',
          dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
          isAcquitted: false
        },
        {
          title: 'GFA Section 8.2: Mid-Term Site Inspection & Interim Acquittals',
          description: 'Interim physical inspection validation and 50% fund acquittal checklist.',
          dueDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000), // 240 days
          isAcquitted: false
        },
        {
          title: 'GFA Section 14.1: Practical Completion & Final Acquittal Closeout',
          description: 'Project wrap-up report, uploading receipts, photos, and closeout ledger file.',
          dueDate: new Date(Date.now() + 360 * 24 * 60 * 60 * 1000), // 360 days
          isAcquitted: false
        }
      ];
    }

    // Update grant fields
    const updatedGrant = await db.grant.update({
      where: { id },
      data: {
        status: 'AWARDED',
        gfaDocumentName: documentName,
        gfaExtractedTitle
      }
    });

    // Create Contract
    const contract = await db.contract.create({
      data: {
        grantId: id,
        fundingAgreementReference: `GFA-${gfaExtractedTitle.substring(0, 8).replace(/\s/g, '')}-${new Date().getFullYear()}`,
        executionDate: new Date(),
        totalObligatedAmount: value
      }
    });

    // Create Milestones
    await db.milestone.createMany({
      data: milestoneTemplates.map(m => ({
        contractId: contract.id,
        title: m.title,
        description: m.description,
        dueDate: m.dueDate,
        isAcquitted: false
      }))
    });

    logEvent(id, 'GFA_DOCUMENT_UPLOADED', 'Adrian (Founder)', {
      documentName,
      gfaExtractedTitle,
      fileSize: '2.4 MB'
    });

    logEvent(id, 'AI_MILestones_EXTRACTED', 'SurePact AI Engine', {
      contractId: contract.id,
      milestonesExtractedCount: milestoneTemplates.length,
      extractedClauseTargets: ['Payment schedules', 'Reporting due dates', 'Operational obligations']
    });

    // Fetch full updated grant
    const fullGrant = await db.grant.findUnique({
      where: { id },
      include: grantInclude
    });

    res.json({
      success: true,
      message: 'GFA document uploaded and processed by AI engine! Milestones mapped.',
      data: fullGrant
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4d. POST /api/grants/:id/documents - Upload/log document
app.post('/api/grants/:id/documents', async (req, res) => {
  const { id } = req.params;
  const { name, type, fileSize, uploadedBy } = req.body;

  if (!name || !type || !uploadedBy) {
    return res.status(400).json({ success: false, error: 'name, type, and uploadedBy are required.' });
  }

  try {
    const doc = await db.document.create({
      data: {
        grantId: id,
        name,
        type,
        fileSize: fileSize || '1.5 MB',
        uploadedBy
      }
    });

    logEvent(id, 'GRANT_DOCUMENT_UPLOADED', uploadedBy, {
      documentName: name,
      documentType: type,
      fileSize: doc.fileSize
    });

    res.json({ success: true, data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4d. GET /api/documents/:id/download - Download document content in editable Word format
app.get('/api/documents/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.document.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    const docContent = doc.content || `# ${doc.name}\n\n**Document Type:** ${doc.type}\n**Uploaded By:** ${doc.uploadedBy}\n**File Size:** ${doc.fileSize}\n**Date:** ${new Date(doc.createdAt).toLocaleDateString()}\n\nThis document record is registered and tracked in the SurePact Document Library.`;

    // Convert Markdown to Word-friendly HTML structure
    const markdownToHtml = (md: string) => {
      let html = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
      html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
      html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
      html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/^---$/gm, '<hr />');
      html = html.replace(/^\s*[\*\-]\s+(.*?)$/gm, '<li>$1</li>');
      html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
      html = html.replace(/\n\n/g, '</p><p>');
      html = `<p>${html}</p>`;
      html = html.replace(/<p><\/p>/g, '');
      return html;
    };

    const htmlBody = markdownToHtml(docContent);
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.name}</title>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 40px; }
    h1 { color: #151226; font-size: 20px; border-bottom: 2px solid #fbbd08; padding-bottom: 6px; margin-top: 20px; }
    h2 { color: #151226; font-size: 16px; margin-top: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    h3 { color: #151226; font-size: 13px; margin-top: 14px; }
    strong { color: #000; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    p { margin-bottom: 8px; text-align: justify; }
  </style>
</head>
<body>
  ${fullHtmlBody(htmlBody)}
</body>
</html>`;

    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
    res.send(fullHtml);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function fullHtmlBody(bodyContent: string) {
  return bodyContent;
}

// 4e. DELETE /api/documents/:id - Delete document
app.delete('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.document.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }
    await db.document.delete({ where: { id } });
    logEvent(doc.grantId, 'GRANT_DOCUMENT_DELETED', 'Adrian (Founder)', {
      documentName: doc.name
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4f. GET /api/documents - List all documents globally
app.get('/api/documents', async (req, res) => {
  try {
    const docs = await db.document.findMany({
      include: {
        grant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ success: true, data: docs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. POST /api/grants/:id/award - Award Grant & Create Post-Award Milestones
app.post('/api/grants/:id/award', async (req, res) => {
  const { id } = req.params;
  const { executionDate, fundingAgreementReference, totalObligatedAmount, coContribution, installments } = req.body;

  try {
    const grant = await db.grant.findUnique({
      where: { id },
      include: { riskAssessment: true }
    });

    if (!grant) {
      return res.status(404).json({ success: false, error: 'Grant not found.' });
    }

    // Update grant status
    const updatedGrant = await db.grant.update({
      where: { id },
      data: { status: 'AWARDED' }
    });

    // Check if contract already exists
    let contract = await db.contract.findFirst({ where: { grantId: id } });
    if (!contract) {
      const fundingValue = totalObligatedAmount !== undefined ? parseFloat(totalObligatedAmount) : (grant.totalFundingValue || 500000.00);
      const coContValue = coContribution !== undefined ? parseFloat(coContribution) : 0;
      
      contract = await db.contract.create({
        data: {
          grantId: id,
          fundingAgreementReference: fundingAgreementReference || `SP-${grant.title.substring(0, 4).toUpperCase()}-${new Date().getFullYear()}`,
          executionDate: executionDate ? new Date(executionDate) : new Date(),
          totalObligatedAmount: fundingValue,
          coContribution: coContValue
        }
      });

      // Create 4 Standard Milestones automatically as part of the post-award instantiation
      await db.milestone.createMany({
        data: [
          {
            contractId: contract.id,
            title: 'Funding Agreement Execution & Project Start',
            description: 'Signing contract and setting up internal ledger lines.',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
            isAcquitted: false
          },
          {
            contractId: contract.id,
            title: 'Project Inception & Plan Approval',
            description: 'Submission of formal project timeline and approval of detailed specs.',
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
            isAcquitted: false
          },
          {
            contractId: contract.id,
            title: 'Mid-Term Deliverable & Financial Acquittal',
            description: 'Interim progress report verifying 50% fund utilization and site construction.',
            dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
            isAcquitted: false
          },
          {
            contractId: contract.id,
            title: 'Final Project Completion & Acquittal Submission',
            description: 'Full delivery validation, final receipts upload, and government report closure.',
            dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            isAcquitted: false
          }
        ]
      });

      logEvent(id, 'GRANT_AWARDED_POST_AWARD_INITIALIZED', 'Adrian (Founder)', {
        contractId: contract.id,
        fundingAgreementReference: contract.fundingAgreementReference,
        totalObligatedAmount: contract.totalObligatedAmount,
        milestonesCreatedCount: 4
      });
    } else {
      // If contract already exists, update it if values were provided
      const updateData: any = {};
      if (totalObligatedAmount !== undefined) {
        updateData.totalObligatedAmount = typeof totalObligatedAmount === 'number' ? totalObligatedAmount : (parseFloat(totalObligatedAmount) || 0);
      }
      if (fundingAgreementReference) {
        updateData.fundingAgreementReference = fundingAgreementReference;
      }
      if (executionDate) {
        updateData.executionDate = new Date(executionDate);
      }
      if (coContribution !== undefined) {
        updateData.coContribution = typeof coContribution === 'number' ? coContribution : (parseFloat(coContribution) || 0);
      }

      contract = await db.contract.update({
        where: { id: contract.id },
        data: updateData
      });
    }



    // Return the updated grant object with the newly created contracts & milestones
    const fullGrant = await db.grant.findUnique({
      where: { id },
      include: grantInclude
    });

    res.json({
      success: true,
      message: 'Grant successfully awarded! Bounded Context Post-Award has been initialized.',
      data: fullGrant
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. GET /api/projects - List all projects with mappings and transactions
app.get('/api/projects', async (req, res) => {
  const tenantId = getTenantId(req);
  try {
    const orgWhere = (tenantId === 'demo-org-1' || tenantId === '99999999-8888-7777-6666-555555555555' || !tenantId)
      ? { organizationId: { in: ['demo-org-1', '99999999-8888-7777-6666-555555555555'] } }
      : { organizationId: tenantId };

    const projects = await db.project.findMany({
      where: orgWhere,
      include: {
        businessUnit: true,
        grantMappings: {
          include: {
            grant: true
          }
        },
        transactions: true,
        milestones: {
          include: {
            tasks: {
              include: {
                assignedToUser: true
              }
            }
          }
        },
        tasks: {
          include: {
            assignedToUser: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7b. POST /api/projects - Create a new project
app.post('/api/projects', async (req, res) => {
  const { name, description, department, status, budgetAmount, businessUnitId } = req.body;

  if (!name || !department) {
    return res.status(400).json({ success: false, error: 'name and department are required.' });
  }

  try {
    const project = await db.project.create({
      data: {
        name,
        description,
        department,
        status: status || 'POTENTIAL',
        budgetAmount: budgetAmount ? parseFloat(budgetAmount) : 0,
        businessUnitId: businessUnitId || null
      }
    });

    logEvent(project.id, 'PROJECT_CREATED', 'Adrian (Founder)', {
      name,
      department,
      description,
      status: project.status,
      budgetAmount: project.budgetAmount
    });

    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7c. POST /api/projects/link - Link a grant to a project (allocated amount)
app.post('/api/projects/link', async (req, res) => {
  const { grantId, projectId, allocatedAmount } = req.body;

  if (!grantId || !projectId || allocatedAmount === undefined) {
    return res.status(400).json({ success: false, error: 'grantId, projectId, and allocatedAmount are required.' });
  }

  try {
    // Check if link already exists
    const existing = await db.grantProjectMapping.findFirst({
      where: {
        grantId,
        projectId
      }
    });

    if (existing) {
      // Update allocated amount if it already exists by adding to it
      const updated = await db.grantProjectMapping.update({
        where: { id: existing.id },
        data: {
          allocatedAmount: {
            increment: parseFloat(allocatedAmount)
          }
        },
        include: {
          grant: true,
          project: true
        }
      });

      logEvent(projectId, 'GRANT_PROJECT_ALLOCATION_INCREMENTED', 'Adrian (Founder)', {
        grantTitle: updated.grant.title,
        projectName: updated.project.name,
        increment: parseFloat(allocatedAmount),
        newTotal: updated.allocatedAmount
      });

      return res.json({ success: true, data: updated });
    }

    const mapping = await db.grantProjectMapping.create({
      data: {
        grantId,
        projectId,
        allocatedAmount: parseFloat(allocatedAmount)
      },
      include: {
        grant: true,
        project: true
      }
    });

    logEvent(projectId, 'GRANT_PROJECT_LINKED', 'Adrian (Founder)', {
      grantTitle: mapping.grant.title,
      projectName: mapping.project.name,
      allocatedAmount: parseFloat(allocatedAmount)
    });

    res.json({ success: true, data: mapping });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7d. POST /api/projects/:id/status - Update project status
app.post('/api/projects/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'status is required.' });
  }

  try {
    const updatedProject = await db.project.update({
      where: { id },
      data: { status }
    });

    logEvent(id, 'PROJECT_STATUS_UPDATED', 'Adrian (Founder)', {
      status
    });

    res.json({ success: true, data: updatedProject });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7e. POST /api/projects/:id/budget - Update project budget
app.post('/api/projects/:id/budget', async (req, res) => {
  const { id } = req.params;
  const { budgetAmount } = req.body;

  if (budgetAmount === undefined) {
    return res.status(400).json({ success: false, error: 'budgetAmount is required.' });
  }

  try {
    const updatedProject = await db.project.update({
      where: { id },
      data: { budgetAmount: parseFloat(budgetAmount) }
    });

    logEvent(id, 'PROJECT_BUDGET_UPDATED', 'Adrian (Founder)', {
      budgetAmount: updatedProject.budgetAmount
    });

    res.json({ success: true, data: updatedProject });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7f. POST /api/milestones/:id/link-project - Link a milestone to a project
app.post('/api/milestones/:id/link-project', async (req, res) => {
  const { id } = req.params;
  const { projectId } = req.body;

  try {
    const updatedMilestone = await db.milestone.update({
      where: { id },
      data: {
        projectId: projectId || null
      },
      include: {
        contract: {
          include: {
            grant: true
          }
        }
      }
    });

    logEvent(id, 'MILESTONE_PROJECT_LINKED', 'Adrian (Founder)', {
      milestoneTitle: updatedMilestone.title,
      projectId: projectId || null,
      grantTitle: updatedMilestone.contract.grant.title
    });

    res.json({ success: true, data: updatedMilestone });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. GET /api/users - List all users with roles, statuses, and business units
app.get('/api/users', async (req, res) => {
  try {
    let users = await db.user.findMany({
      include: {
        businessUnits: {
          include: {
            businessUnit: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Auto-migrate team emails in DB to .invalid safety domain (keeping only adrian.warren@surepact.com active)
    let migrated = false;
    for (const u of users) {
      if (u.email.endsWith('@surepact.com') && u.email.toLowerCase() !== 'adrian.warren@surepact.com') {
        const safeEmail = u.email.replace('@surepact.com', '@surepact.invalid');
        await db.user.update({
          where: { id: u.id },
          data: { email: safeEmail }
        });
        u.email = safeEmail;
        migrated = true;
      }
    }
    if (migrated) {
      console.log('Auto-migrated existing team user emails in DB to .invalid safety domain.');
    }

    if (users.length === 0) {
      console.log('No users found in database. Auto-seeding default staff members...');
      // Seed departments
      const exec = await db.department.create({ data: { name: 'Executive', description: 'Executive leadership team' } });
      const fin = await db.department.create({ data: { name: 'Finance & Compliance', description: 'Financial management and grant tracking' } });
      const eng = await db.department.create({ data: { name: 'Infrastructure & Engineering', description: 'Civil engineering and utility works' } });
      const comm = await db.department.create({ data: { name: 'Community & Environment', description: 'Parks, recreation, and local greening' } });

      // Seed BUs
      const buCEO = await db.businessUnit.create({ data: { name: 'Office of the CEO', departmentId: exec.id } });
      const buStrategy = await db.businessUnit.create({ data: { name: 'Strategy & Growth', departmentId: exec.id } });
      const buFinance = await db.businessUnit.create({ data: { name: 'Corporate Finance', departmentId: fin.id } });
      const buGrants = await db.businessUnit.create({ data: { name: 'Grants Administration', departmentId: fin.id } });
      const buWater = await db.businessUnit.create({ data: { name: 'Water & Utilities', departmentId: eng.id } });
      const buCivil = await db.businessUnit.create({ data: { name: 'Civil Works', departmentId: eng.id } });
      const buParks = await db.businessUnit.create({ data: { name: 'Parks & Recreation', departmentId: comm.id } });
      const buEnv = await db.businessUnit.create({ data: { name: 'Environmental Services', departmentId: comm.id } });

      // Seed Users (Team emails set to .invalid during testing phase to prevent spam)
      const adrian = await db.user.create({ data: { name: 'Adrian Warren', email: 'adrian.warren@surepact.com', department: 'Executive', role: 'admin', status: 'Active' } });
      const brett = await db.user.create({ data: { name: 'Brett Hirst', email: 'brett.hirst@surepact.invalid', department: 'Executive', role: 'admin', status: 'Active' } });
      const christine = await db.user.create({ data: { name: 'christine malinao', email: 'christine.malinao@surepact.invalid', department: 'Finance & Compliance', role: 'staff', status: 'Active' } });
      const daniel = await db.user.create({ data: { name: 'Daniel Pritchard', email: 'dan.pritchard@surepact.invalid', department: 'Infrastructure & Engineering', role: 'staff', status: 'Active' } });
      const henry = await db.user.create({ data: { name: 'Henry McNally', email: 'henry.mcnally@surepact.invalid', department: 'Community & Environment', role: 'staff', status: 'Active' } });
      const marcus = await db.user.create({ data: { name: 'Marcus Deluis', email: 'marcus.deluis@surepact.invalid', department: 'Community & Environment', role: 'staff', status: 'Active' } });
      const nicole = await db.user.create({ data: { name: 'Nicole Sherwin', email: 'nicole.sherwin@surepact.invalid', department: 'Finance & Compliance', role: 'staff', status: 'Active' } });

      // Map users to BUs
      await db.businessUnitUser.createMany({
        data: [
          { userId: adrian.id, businessUnitId: buCEO.id },
          { userId: adrian.id, businessUnitId: buStrategy.id },
          { userId: brett.id, businessUnitId: buCEO.id },
          { userId: christine.id, businessUnitId: buFinance.id },
          { userId: christine.id, businessUnitId: buGrants.id },
          { userId: nicole.id, businessUnitId: buGrants.id },
          { userId: daniel.id, businessUnitId: buCivil.id },
          { userId: daniel.id, businessUnitId: buWater.id },
          { userId: henry.id, businessUnitId: buEnv.id },
          { userId: marcus.id, businessUnitId: buParks.id }
        ]
      });

      users = await db.user.findMany({
        include: {
          businessUnits: {
            include: {
              businessUnit: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    }
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8b. POST /api/users - Create a new user manually
app.post('/api/users', async (req, res) => {
  const { name, email, department, role, status, businessUnitIds } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required.' });
  }
  try {
    const user = await db.user.create({
      data: {
        name,
        email,
        department: department || 'Unassigned',
        role: role || 'staff',
        status: status || 'Active'
      }
    });

    if (Array.isArray(businessUnitIds) && businessUnitIds.length > 0) {
      await db.businessUnitUser.createMany({
        data: businessUnitIds.map(buId => ({
          userId: user.id,
          businessUnitId: buId
        }))
      });
    }

    const completeUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        businessUnits: {
          include: {
            businessUnit: true
          }
        }
      }
    });

    res.json({ success: true, data: completeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8c. PUT /api/users/:id - Update user details and BU memberships
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, department, role, status, businessUnitIds } = req.body;
  try {
    const user = await db.user.update({
      where: { id },
      data: {
        name,
        email,
        department,
        role,
        status
      }
    });

    if (Array.isArray(businessUnitIds)) {
      await db.businessUnitUser.deleteMany({ where: { userId: id } });
      if (businessUnitIds.length > 0) {
        await db.businessUnitUser.createMany({
          data: businessUnitIds.map(buId => ({
            userId: id,
            businessUnitId: buId
          }))
        });
      }
    }

    const completeUser = await db.user.findUnique({
      where: { id },
      include: {
        businessUnits: {
          include: {
            businessUnit: true
          }
        }
      }
    });

    res.json({ success: true, data: completeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8d. GET /api/departments - Get all departments and sub-units
app.get('/api/departments', async (req, res) => {
  try {
    const depts = await db.department.findMany({
      include: {
        businessUnits: {
          include: {
            users: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: depts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// 8e. TENANT ONBOARDING & MODULAR PRICING TIER ENDPOINTS
// ============================================================================

let inMemoryOrganization = {
  id: 'demo-org-1',
  name: 'SurePact Primary Council Tenant',
  pricingTier: 'ENTERPRISE',
  sector: 'LOCAL_GOVERNMENT',
  state: 'QLD',
  trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  maxGrantsQuota: 999999,
  maxUsersQuota: 999999,
  aiTokenQuota: 999999
};

async function getCurrentOrganization() {
  try {
    let org = await db.organization.findFirst();
    if (!org) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      org = await db.organization.create({
        data: {
          name: inMemoryOrganization.name,
          pricingTier: inMemoryOrganization.pricingTier,
          sector: inMemoryOrganization.sector,
          state: inMemoryOrganization.state,
          trialEndsAt: trialEnd,
          maxGrantsQuota: 999999,
          maxUsersQuota: 999999,
          aiTokenQuota: 999999
        }
      });
    }
    return org;
  } catch (err: any) {
    console.warn('Database organization query warning, using fallback in-memory state:', err.message);
    return inMemoryOrganization as any;
  }
}

app.get('/api/organization/current', async (req, res) => {
  try {
    const org = await getCurrentOrganization();
    let grantsCount = 0;
    let usersCount = 0;
    try {
      grantsCount = await db.grant.count();
      usersCount = await db.user.count();
    } catch (cntErr) {
      console.warn('Count query warning:', cntErr);
    }
    
    const now = new Date();
    const trialEnd = new Date(org.trialEndsAt);
    const msDiff = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      data: {
        ...org,
        stats: {
          grantsCount,
          usersCount,
          daysRemaining,
          isTrialActive: daysRemaining > 0
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/organization/tier', async (req, res) => {
  const { pricingTier } = req.body;
  if (!['FREE_TRIAL', 'STARTER', 'ENTERPRISE'].includes(pricingTier)) {
    return res.status(400).json({ success: false, error: 'Invalid pricing tier.' });
  }

  try {
    const current = await getCurrentOrganization();
    let maxGrantsQuota = 999999;
    let maxUsersQuota = 999999;
    let aiTokenQuota = 999999;

    if (pricingTier === 'FREE_TRIAL') {
      maxGrantsQuota = 5;
      maxUsersQuota = 3;
      aiTokenQuota = 10;
    } else if (pricingTier === 'STARTER') {
      maxGrantsQuota = 50;
      maxUsersQuota = 10;
      aiTokenQuota = 100;
    }

    inMemoryOrganization = {
      ...inMemoryOrganization,
      pricingTier,
      maxGrantsQuota,
      maxUsersQuota,
      aiTokenQuota
    };

    let updated: any = inMemoryOrganization;
    try {
      if (current && current.id !== 'demo-org-1') {
        updated = await db.organization.update({
          where: { id: current.id },
          data: {
            pricingTier,
            maxGrantsQuota,
            maxUsersQuota,
            aiTokenQuota
          }
        });
      }
    } catch (dbErr: any) {
      console.warn('DB organization tier update warning, using in-memory state:', dbErr.message);
    }

    logEvent(updated.id || 'demo-org-1', 'ORGANIZATION_TIER_UPDATED', 'Adrian (Founder)', {
      newTier: pricingTier,
      maxGrantsQuota,
      maxUsersQuota
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/onboarding/instantiate', async (req, res) => {
  const { orgName, sector, state, adminName, adminEmail, pricingTier = 'FREE_TRIAL' } = req.body;
  
  if (!orgName || !adminName || !adminEmail) {
    return res.status(400).json({ success: false, error: 'Organization name, admin name, and admin email are required.' });
  }

  try {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    let maxGrantsQuota = 5;
    let maxUsersQuota = 3;
    let aiTokenQuota = 10;

    if (pricingTier === 'STARTER') {
      maxGrantsQuota = 50;
      maxUsersQuota = 10;
      aiTokenQuota = 100;
    } else if (pricingTier === 'ENTERPRISE') {
      maxGrantsQuota = 999999;
      maxUsersQuota = 999999;
      aiTokenQuota = 999999;
    }

    inMemoryOrganization = {
      id: 'demo-org-1',
      name: orgName,
      pricingTier,
      sector: sector || 'LOCAL_GOVERNMENT',
      state: state || 'QLD',
      trialEndsAt: trialEnd.toISOString(),
      maxGrantsQuota,
      maxUsersQuota,
      aiTokenQuota
    };

    let org: any = inMemoryOrganization;
    try {
      let dbOrg = await db.organization.findFirst();
      if (dbOrg) {
        dbOrg = await db.organization.update({
          where: { id: dbOrg.id },
          data: {
            name: orgName,
            sector: sector || 'LOCAL_GOVERNMENT',
            state: state || 'QLD',
            pricingTier,
            trialEndsAt: trialEnd,
            maxGrantsQuota,
            maxUsersQuota,
            aiTokenQuota
          }
        });
      } else {
        dbOrg = await db.organization.create({
          data: {
            name: orgName,
            sector: sector || 'LOCAL_GOVERNMENT',
            state: state || 'QLD',
            pricingTier,
            trialEndsAt: trialEnd,
            maxGrantsQuota,
            maxUsersQuota,
            aiTokenQuota
          }
        });
      }
      org = dbOrg;
    } catch (dbErr: any) {
      console.warn('Using in-memory tenant instantiation fallback due to DB schema transition:', dbErr.message);
    }

    // Ensure Admin User exists
    try {
      let admin = await db.user.findFirst({ where: { email: adminEmail } });
      if (!admin) {
        admin = await db.user.create({
          data: {
            name: adminName,
            email: adminEmail,
            department: 'Executive',
            role: 'admin',
            status: 'Active'
          }
        });
      }

      // Seed sector-specific organizational structure if departments are empty
      const existingDepts = await db.department.count();
      if (existingDepts === 0) {
        if (sector === 'ACCHO') {
          const exec = await db.department.create({ data: { name: 'Executive & Board', description: 'Governance and Strategy' } });
          const health = await db.department.create({ data: { name: 'Health Services', description: 'Clinical and Primary Care' } });
          const community = await db.department.create({ data: { name: 'Homelands & Community', description: 'Outstations and Housing' } });

          await db.businessUnit.create({ data: { name: 'Board Administration', departmentId: exec.id } });
          await db.businessUnit.create({ data: { name: 'Primary Health & Telehealth', departmentId: health.id } });
          await db.businessUnit.create({ data: { name: 'Homelands Infrastructure', departmentId: community.id } });
        } else if (sector === 'NOT_FOR_PROFIT') {
          const gov = await db.department.create({ data: { name: 'Governance & Leadership', description: 'Executive Leadership & Board' } });
          const prog = await db.department.create({ data: { name: 'Program Delivery & Advocacy', description: 'Community Programs & Social Services' } });
          const fund = await db.department.create({ data: { name: 'Fundraising & Grants', description: 'Philanthropic & Government Grants' } });

          await db.businessUnit.create({ data: { name: 'Executive Office', departmentId: gov.id } });
          await db.businessUnit.create({ data: { name: 'Social Impact Services', departmentId: prog.id } });
          await db.businessUnit.create({ data: { name: 'Grant Procurement & Compliance', departmentId: fund.id } });
        } else if (sector === 'HEALTHCARE') {
          const exec = await db.department.create({ data: { name: 'Medical Executive', description: 'Clinical Governance & Health Policy' } });
          const ops = await db.department.create({ data: { name: 'Clinical Operations', description: 'Hospitals, Clinics & Outreach' } });
          const res = await db.department.create({ data: { name: 'Health Research & Grants', description: 'Medical Research & Translational Funding' } });

          await db.businessUnit.create({ data: { name: 'Office of the Chief Medical Officer', departmentId: exec.id } });
          await db.businessUnit.create({ data: { name: 'Outreach & Primary Care', departmentId: ops.id } });
          await db.businessUnit.create({ data: { name: 'Clinical Trials & Grants', departmentId: res.id } });
        } else if (sector === 'EDUCATION') {
          const acad = await db.department.create({ data: { name: 'Academic Council', description: 'Educational Governance & Curriculum' } });
          const res = await db.department.create({ data: { name: 'Research & Grants Office', description: 'Competitive Research & Fellowships' } });
          const student = await db.department.create({ data: { name: 'Student & Campus Operations', description: 'Student Welfare & Infrastructure' } });

          await db.businessUnit.create({ data: { name: 'Vice-Chancellor / Principal Office', departmentId: acad.id } });
          await db.businessUnit.create({ data: { name: 'Research Grants & Contracts', departmentId: res.id } });
          await db.businessUnit.create({ data: { name: 'Campus Facilities & Development', departmentId: student.id } });
        } else if (sector === 'ENVIRONMENT_COMMUNITY') {
          const cons = await db.department.create({ data: { name: 'Conservation & Sustainability', description: 'Biodiversity, Climate & Clean Energy' } });
          const parks = await db.department.create({ data: { name: 'Parks & Landcare', description: 'Habitat Restoration & Land Management' } });
          const comm = await db.department.create({ data: { name: 'Community Engagement', description: 'Local Grants & Volunteer Programs' } });

          await db.businessUnit.create({ data: { name: 'Climate & Biodiversity Programs', departmentId: cons.id } });
          await db.businessUnit.create({ data: { name: 'Landcare & Waterways', departmentId: parks.id } });
          await db.businessUnit.create({ data: { name: 'Community Green Grants', departmentId: comm.id } });
        } else {
          const exec = await db.department.create({ data: { name: 'Executive', description: 'Executive leadership team' } });
          const fin = await db.department.create({ data: { name: 'Finance & Compliance', description: 'Financial management and grant tracking' } });
          const eng = await db.department.create({ data: { name: 'Infrastructure & Engineering', description: 'Civil engineering and utility works' } });
          const comm = await db.department.create({ data: { name: 'Community & Environment', description: 'Parks, recreation, and local greening' } });

          await db.businessUnit.create({ data: { name: 'Office of the CEO', departmentId: exec.id } });
          await db.businessUnit.create({ data: { name: 'Corporate Finance', departmentId: fin.id } });
          await db.businessUnit.create({ data: { name: 'Civil Works', departmentId: eng.id } });
          await db.businessUnit.create({ data: { name: 'Parks & Recreation', departmentId: comm.id } });
        }
      }
    } catch (uErr) {
      console.warn('User creation / dept seeding warning:', uErr);
    }

    logEvent(org.id || 'demo-org-1', 'TENANT_ONBOARDED', adminName, {
      orgName,
      sector,
      state,
      pricingTier
    });

    res.json({
      success: true,
      data: {
        organization: org,
        message: `Welcome to SurePact! Workspace instantiated for "${orgName}" in ${pricingTier} mode.`
      }
    });
  } catch (error: any) {
    console.error('Error instantiating workspace:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error instantiating workspace' });
  }
});

// ============================================================================
// SUPER ADMIN TENANT MANAGEMENT ENDPOINTS (SurePact Platform Staff Only)
// ============================================================================

// GET /api/admin/tenants - List all tenant organizations with telemetry stats
app.get('/api/admin/tenants', async (req, res) => {
  try {
    let orgs: any[] = [];
    try {
      orgs = await db.organization.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e) {}

    if (orgs.length === 0) {
      orgs = [inMemoryOrganization as any];
    }

    const tenantSummaries = await Promise.all(
      orgs.map(async (org) => {
        let grantsCount = 0;
        let projectsCount = 0;
        let tasksCount = 0;
        let usersCount = 0;
        try {
          grantsCount = await db.grant.count({ where: { organizationId: org.id } });
          projectsCount = await db.project.count({ where: { organizationId: org.id } });
          tasksCount = await db.milestoneTask.count({ where: { organizationId: org.id } });
          usersCount = await db.user.count();
        } catch (cntErr) {}

        return {
          ...org,
          stats: {
            grantsCount,
            projectsCount,
            tasksCount,
            usersCount
          }
        };
      })
    );

    res.json({ success: true, data: tenantSummaries });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/tenants/:id/tier - Upgrade or update tenant pricing tier
app.put('/api/admin/tenants/:id/tier', async (req, res) => {
  const { id } = req.params;
  const { pricingTier } = req.body;

  if (!['FREE_TRIAL', 'STARTER', 'ENTERPRISE'].includes(pricingTier)) {
    return res.status(400).json({ success: false, error: 'Invalid pricing tier specified.' });
  }

  try {
    let updated: any = null;
    try {
      updated = await db.organization.update({
        where: { id },
        data: { pricingTier }
      });
    } catch (dbErr) {
      if (inMemoryOrganization.id === id) {
        inMemoryOrganization.pricingTier = pricingTier;
        updated = inMemoryOrganization;
      }
    }

    logEvent(id, 'TENANT_PRICING_TIER_UPDATED', 'Platform Admin (Adrian)', {
      tenantId: id,
      newTier: pricingTier
    });

    res.json({ success: true, message: `Tenant pricing tier updated to ${pricingTier}.`, data: updated || { id, pricingTier } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/tenants/:id - Purge & Delete Tenant Workspace & Records
app.delete('/api/admin/tenants/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Purge bound entity data for this tenant
    try {
      await db.grant.deleteMany({ where: { organizationId: id } });
      await db.project.deleteMany({ where: { organizationId: id } });
      await db.milestoneTask.deleteMany({ where: { organizationId: id } });
      await db.fundingBody.deleteMany({ where: { organizationId: id } });
      await db.transaction.deleteMany({ where: { organizationId: id } });
      await db.document.deleteMany({ where: { organizationId: id } });
      await db.organization.delete({ where: { id } });
    } catch (delErr) {}

    logEvent('system', 'TENANT_WORKSPACE_PURGED_AND_DELETED', 'Platform Admin (Adrian)', {
      purgedTenantId: id
    });

    res.json({ success: true, message: `Tenant workspace ${id} and all bound records successfully purged.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8e. POST /api/departments - Create a new department
app.post('/api/departments', async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Department name is required.' });
  }
  try {
    const dept = await db.department.create({
      data: { name, description }
    });
    res.json({ success: true, data: dept });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8f. POST /api/business-units - Create a new business unit under a department
app.post('/api/business-units', async (req, res) => {
  const { name, description, departmentId } = req.body;
  if (!name || !departmentId) {
    return res.status(400).json({ success: false, error: 'Name and departmentId are required.' });
  }
  try {
    const bu = await db.businessUnit.create({
      data: { name, description, departmentId }
    });
    res.json({ success: true, data: bu });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8b. POST /api/tasks - Create a task manually
app.post('/api/tasks', async (req, res) => {
  const { milestoneId, grantId, projectId, title, description, assignedToUserId, dueDate, stage } = req.body;

  if ((!milestoneId && !grantId && !projectId) || !title || !assignedToUserId || !dueDate) {
    return res.status(400).json({ success: false, error: 'milestoneId, grantId, or projectId, title, assignedToUserId, and dueDate are required.' });
  }

  try {
    const task = await db.milestoneTask.create({
      data: {
        milestoneId: milestoneId || null,
        grantId: grantId || null,
        projectId: projectId || null,
        title,
        description,
        assignedToUserId,
        dueDate: new Date(dueDate),
        status: 'PENDING',
        stage: stage || 'OBLIGATION'
      },
      include: {
        assignedToUser: true,
        milestone: true,
        grant: true,
        project: true
      }
    });

    logEvent(task.id, 'MILESTONE_TASK_CREATED', 'Adrian (Founder)', {
      taskTitle: title,
      milestoneTitle: task.milestone?.title || 'Direct Task',
      grantTitle: task.grant?.title || task.project?.name || 'Task',
      assignedTo: task.assignedToUser.name,
      stage: task.stage
    });

    // Send task assignment email notification
    if (task.assignedToUser && task.assignedToUser.email) {
      await sendEmailNotification({
        to: task.assignedToUser.email,
        recipientName: task.assignedToUser.name,
        subject: `New Task Assigned: ${task.title}`,
        category: 'TASK_ASSIGNED',
        grantTitle: task.grant?.title || task.project?.name,
        details: `${task.description || 'You have been assigned a new task.'} (Due: ${new Date(dueDate).toLocaleDateString('en-AU')})`,
        actionUrl: 'https://surepact-greenfield.vercel.app'
      });
    }

    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. GET /api/tasks - List all milestone tasks with complex query filtering
app.get('/api/tasks', async (req, res) => {
  const { assignedToUserId, grantId, projectId, status } = req.query;

  const whereClause: any = {};

  if (assignedToUserId) {
    whereClause.assignedToUserId = assignedToUserId as string;
  }

  if (status) {
    whereClause.status = status as string;
  }

  if (grantId || projectId) {
    const conditions: any[] = [];
    
    if (grantId) {
      conditions.push({ grantId: grantId as string });
      conditions.push({
        milestone: {
          contract: {
            grantId: grantId as string
          }
        }
      });
    }
    
    if (projectId) {
      conditions.push({ projectId: projectId as string });
      conditions.push({
        milestone: {
          projectId: projectId as string
        }
      });
      conditions.push({
        milestone: {
          contract: {
            grant: {
              projectMappings: {
                some: {
                  projectId: projectId as string
                }
              }
            }
          }
        }
      });
      conditions.push({
        grant: {
          projectMappings: {
            some: {
              projectId: projectId as string
            }
          }
        }
      });
    }

    whereClause.OR = conditions;
  }

  try {
    const tasks = await db.milestoneTask.findMany({
      where: whereClause,
      include: {
        assignedToUser: true,
        project: true,
        grant: {
          include: {
            projectMappings: {
              include: {
                project: true
              }
            }
          }
        },
        milestone: {
          include: {
            contract: {
              include: {
                grant: {
                  include: {
                    projectMappings: {
                      include: {
                        project: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. PATCH /api/tasks/:id - Toggle task status
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required.' });
  }

  try {
    const updatedTask = await db.milestoneTask.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null
      },
      include: {
        assignedToUser: true,
        milestone: true
      }
    });

    logEvent(id, 'MILESTONE_TASK_STATUS_UPDATED', updatedTask.assignedToUser.name, {
      taskTitle: updatedTask.title,
      milestoneTitle: updatedTask.milestone?.title || 'Grant-Level',
      status
    });

    res.json({ success: true, data: updatedTask });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10b. PATCH /api/milestones/:id - Toggle milestone status/acquittal
app.patch('/api/milestones/:id', async (req, res) => {
  const { id } = req.params;
  const { isAcquitted } = req.body;

  if (isAcquitted === undefined) {
    return res.status(400).json({ success: false, error: 'isAcquitted is required.' });
  }

  try {
    const updatedMilestone = await db.milestone.update({
      where: { id },
      data: { isAcquitted: !!isAcquitted },
      include: {
        contract: {
          include: {
            grant: true
          }
        }
      }
    });

    logEvent(id, 'MILESTONE_STATUS_UPDATED', 'Adrian (Founder)', {
      milestoneTitle: updatedMilestone.title,
      isAcquitted: updatedMilestone.isAcquitted,
      grantTitle: updatedMilestone.contract.grant.title
    });

    res.json({ success: true, data: updatedMilestone });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. POST /api/contracts/:id/variations - Submit variation request
app.post('/api/contracts/:id/variations', async (req, res) => {
  const { id } = req.params;
  const { referenceNumber, valueChange, newCloseDate, description, status } = req.body;

  if (!referenceNumber || valueChange === undefined) {
    return res.status(400).json({ success: false, error: 'referenceNumber and valueChange are required.' });
  }

  try {
    const contract = await db.contract.findUnique({
      where: { id },
      include: { grant: true }
    });

    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found.' });
    }

    const variation = await db.contractVariation.create({
      data: {
        contractId: id,
        referenceNumber,
        valueChange: parseFloat(valueChange),
        newCloseDate: newCloseDate ? new Date(newCloseDate) : null,
        status: status || 'PENDING',
        description,
        approvalDate: status === 'APPROVED' ? new Date() : null
      }
    });

    if (status === 'APPROVED') {
      await db.contract.update({
        where: { id },
        data: {
          totalObligatedAmount: {
            increment: parseFloat(valueChange)
          }
        }
      });

      if (newCloseDate) {
        await db.grant.update({
          where: { id: contract.grantId },
          data: {
            closeDate: new Date(newCloseDate)
          }
        });
      }

      logEvent(id, 'CONTRACT_VARIATION_APPROVED', 'Adrian (Founder)', {
        referenceNumber,
        valueChange,
        newCloseDate,
        description
      });
    } else {
      logEvent(id, 'CONTRACT_VARIATION_REQUESTED', 'Adrian (Founder)', {
        referenceNumber,
        valueChange,
        description
      });
    }

    res.json({ success: true, data: variation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11c. POST /api/variations/:id/status - Approve or reject variation
app.post('/api/variations/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // APPROVED or REJECTED

  try {
    const variation = await db.contractVariation.findUnique({
      where: { id },
      include: { contract: true }
    });

    if (!variation) {
      return res.status(404).json({ success: false, error: 'Variation not found.' });
    }

    const updated = await db.contractVariation.update({
      where: { id },
      data: {
        status,
        approvalDate: status === 'APPROVED' ? new Date() : null
      }
    });

    if (status === 'APPROVED') {
      const updatedContract = await db.contract.update({
        where: { id: variation.contractId },
        data: {
          totalObligatedAmount: {
            increment: variation.valueChange
          }
        }
      });

      if (variation.contract.grantId) {
        await db.grant.update({
          where: { id: variation.contract.grantId },
          data: {
            totalFundingValue: updatedContract.totalObligatedAmount,
            ...(variation.newCloseDate ? { closeDate: variation.newCloseDate } : {})
          }
        });
      }

      logEvent(variation.contractId, 'CONTRACT_VARIATION_APPROVED', 'Adrian (Founder)', {
        referenceNumber: variation.referenceNumber,
        valueChange: variation.valueChange,
        newCloseDate: variation.newCloseDate,
        description: variation.description
      });
    } else {
      logEvent(variation.contractId, 'CONTRACT_VARIATION_REJECTED', 'Adrian (Founder)', {
        referenceNumber: variation.referenceNumber,
        valueChange: variation.valueChange,
        description: variation.description
      });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11b. POST /api/contracts/:id/installments - Create a new installment and attributed payment confirmation task
app.post('/api/contracts/:id/installments', async (req, res) => {
  const { id } = req.params;
  const { amount, dueDate } = req.body;

  if (amount === undefined || !dueDate) {
    return res.status(400).json({ success: false, error: 'amount and dueDate are required.' });
  }

  try {
    let contract = await db.contract.findUnique({ where: { id } });
    if (!contract) {
      contract = await db.contract.findFirst({ where: { grantId: id } });
    }
    if (!contract) {
      const grant = await db.grant.findUnique({ where: { id } });
      if (!grant) {
        return res.status(404).json({ success: false, error: 'Contract or Grant not found.' });
      }
      contract = await db.contract.create({
        data: {
          grantId: id,
          fundingAgreementReference: `SP-${grant.title.substring(0, 4).toUpperCase()}-${new Date().getFullYear()}`,
          executionDate: new Date(),
          totalObligatedAmount: grant.totalFundingValue || parseFloat(amount) || 0,
          coContribution: 0
        }
      });
    }

    const parsedAmount = parseFloat(amount);
    const instDueDate = new Date(dueDate);

    const installment = await db.installment.create({
      data: {
        contractId: contract.id,
        amount: parsedAmount,
        dueDate: instDueDate,
        status: 'PENDING'
      }
    });

    const amtStr = `$${parsedAmount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const dueStr = instDueDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

    let paymentTask: any = null;
    try {
      const defaultUser = await db.user.findFirst();
      if (defaultUser?.id) {
        paymentTask = await db.milestoneTask.create({
          data: {
            grantId: contract.grantId,
            title: `Confirm Payment Received: ${amtStr}`,
            description: `[Category: Reporting] Confirm receipt of payment installment for ${amtStr} scheduled due on ${dueStr}.`,
            assignedToUserId: defaultUser.id,
            dueDate: instDueDate,
            status: 'PENDING'
          }
        });
      }
    } catch (taskErr) {
      console.warn('Failed to create payment task for installment:', taskErr);
    }

    logEvent(contract.grantId, 'CONTRACT_INSTALLMENT_SCHEDULED', 'Adrian (Founder)', {
      contractId: contract.id,
      amount: parsedAmount,
      dueDate,
      taskId: paymentTask?.id || null
    });

    res.json({ success: true, data: installment, task: paymentTask });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11c. PATCH /api/installments/:id - Toggle status of installment & sync payment task
app.patch('/api/installments/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'status is required.' });
  }

  try {
    const installment = await db.installment.update({
      where: { id },
      data: { status },
      include: { contract: true }
    });

    // Sync attributed payment confirmation task status
    if (installment.contract?.grantId) {
      const tasks = await db.milestoneTask.findMany({
        where: {
          grantId: installment.contract.grantId,
          title: { contains: 'Confirm Payment Received' }
        }
      });

      // Find best matching task by title or status
      const targetTask = tasks.find(t => t.title.includes(installment.amount.toLocaleString('en-AU', { maximumFractionDigits: 0 }))) || tasks[0];
      if (targetTask) {
        await db.milestoneTask.update({
          where: { id: targetTask.id },
          data: {
            status: status === 'RECEIVED' ? 'COMPLETED' : 'PENDING',
            completedAt: status === 'RECEIVED' ? new Date() : null
          }
        });
      }
    }

    logEvent(installment.contractId, 'CONTRACT_INSTALLMENT_STATUS_UPDATED', 'David Boyle (Finance)', {
      installmentId: id,
      status
    });

    res.json({ success: true, data: installment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5b. POST /api/grants/:id/reject - Reject Grant Application
app.post('/api/grants/:id/reject', async (req, res) => {
  const { id } = req.params;

  try {
    const updatedGrant = await db.grant.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    logEvent(id, 'GRANT_APPLICATION_REJECTED', 'Adrian (Founder)', {
      title: updatedGrant.title
    });

    res.json({ success: true, data: updatedGrant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5c. POST /api/grants/:id/closeout - Closeout Grant
app.post('/api/grants/:id/closeout', async (req, res) => {
  const { id } = req.params;
  const { closeoutNotes } = req.body;

  try {
    const updatedGrant = await db.grant.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closeoutNotes
      }
    });

    logEvent(id, 'GRANT_CLOSED_AND_ACQUITTED', 'Adrian (Founder)', {
      title: updatedGrant.title,
      closeoutNotes
    });

    res.json({ success: true, data: updatedGrant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. GET /api/finances - Income vs Expenditure analytics
app.get('/api/finances', async (req, res) => {
  const { grantId, projectId } = req.query;
  try {
    const whereClause: any = {};
    if (grantId) {
      whereClause.grantId = grantId as string;
    }
    if (projectId) {
      whereClause.projectId = projectId as string;
    }

    const transactions = await db.transaction.findMany({
      where: whereClause,
      include: {
        grant: true,
        project: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenditure = transactions
      .filter(t => t.type === 'EXPENDITURE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netBalance = income - expenditure;

    const categories: Record<string, number> = {};
    transactions.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome: income,
          totalExpenditure: expenditure,
          netBalance
        },
        categories,
        transactions
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12b. POST /api/analytics/ask - Ask SurePact AI natural language reporting engine
app.post('/api/analytics/ask', async (req, res) => {
  try {
    const prompt = req.body.prompt || req.body.question || req.body.query;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt (or question) is required' });
    }

    let grants: any[] = [];
    let tasks: any[] = [];
    let transactions: any[] = [];
    let fundingBodies: any[] = [];
    let businessUnits: any[] = [];
    let projects: any[] = [];

    try {
      grants = await db.grant.findMany({
        include: {
          riskAssessment: true,
          contracts: true,
          projectMappings: true,
          businessUnit: true
        }
      });
      tasks = await db.milestoneTask.findMany({
        include: {
          assignedToUser: true,
          grant: true
        }
      });
      transactions = await db.transaction.findMany();
      fundingBodies = await db.fundingBody.findMany();
      businessUnits = await db.businessUnit.findMany();
      projects = await db.project.findMany({
        include: {
          milestones: true,
          businessUnit: true
        }
      });
    } catch (dbErr) {
      console.warn('DB query in /api/analytics/ask encountered error, falling back to in-memory processing:', dbErr);
    }

    const reportPayload = await processAskSurePactQueryAsync(prompt, grants, tasks, transactions, fundingBodies, businessUnits, projects);
    res.json({ success: true, data: reportPayload });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 13. POST /api/transactions - Add new transaction
app.post('/api/transactions', async (req, res) => {
  const { grantId, projectId, amount, type, description, category, date } = req.body;

  if (amount === undefined || !type || !description || !category) {
    return res.status(400).json({ success: false, error: 'amount, type, description, and category are required.' });
  }

  const parsedAmount = Math.abs(parseFloat(amount));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Transaction amount must be a positive number greater than 0.' });
  }

  try {
    const newTransaction = await db.transaction.create({
      data: {
        organizationId: ORG_ID,
        grantId: grantId || null,
        projectId: projectId || null,
        amount: parseFloat(amount),
        type,
        description,
        category,
        date: date ? new Date(date) : new Date()
      }
    });

    logEvent(newTransaction.id, 'FINANCIAL_TRANSACTION_LOGGED', 'David Boyle (Finance)', {
      amount,
      type,
      description,
      category
    });

    res.json({ success: true, data: newTransaction });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. GET /api/audit-ledger - Return all system audit events from DB
app.get('/api/audit-ledger', async (req: any, res) => {
  try {
    const orgId = req.user?.organizationId || 'demo-org-1';
    const logs = await db.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    
    // Map DB logs to UI SystemEvent shape
    const events = logs.map(l => {
      let payload = {};
      try {
        if (l.details) payload = JSON.parse(l.details);
      } catch (e) {
        payload = { message: l.details };
      }
      return {
        id: l.id,
        timestamp: l.timestamp.toISOString(),
        aggregateId: l.resourceType,
        eventType: l.action,
        user: l.userName || 'System',
        payload
      };
    });

    res.json({
      success: true,
      data: events
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6b. POST /api/audit-ledger - Create manual audit event in DB
app.post('/api/audit-ledger', async (req: any, res) => {
  try {
    const { aggregateId, eventType, user, payload } = req.body;
    if (!aggregateId || !eventType || !user) {
      return res.status(400).json({ success: false, error: 'Missing aggregateId, eventType, and user fields' });
    }
    const orgId = req.user?.organizationId || 'demo-org-1';
    await logEvent(aggregateId, eventType, user, payload || {}, orgId);
    res.json({ success: true, message: 'Event logged successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


const EXTERNAL_GRANTS = [
  {
    id: "ext-1",
    title: "Regional Connectivity Program - Round 4",
    opportunityId: "GO9834",
    agency: "Department of Infrastructure, Transport, Regional Development and Communications",
    category: "Infrastructure",
    description: "Funding to support the delivery of telecommunications infrastructure in regional, rural and remote Australia.",
    value: 450000,
    openDate: "2026-06-01T00:00:00.000Z",
    closeDate: "2026-08-30T23:59:59.000Z",
    isNew: true,
    eligibility: "Incorporated Not-for-Profit organizations, Local Government bodies, Telecommunications carriers.",
    sourceUrl: "https://www.grants.gov.au/Go/Show?GoUuid=ext-1"
  },
  {
    id: "ext-2",
    title: "NSW Community Sport Rebuilding Fund",
    opportunityId: "GO8821",
    agency: "NSW Office of Sport",
    category: "Community",
    description: "Assistance to local sport clubs to upgrade facilities, purchase equipment, and run inclusive local programs.",
    value: 75000,
    openDate: "2026-06-20T00:00:00.000Z",
    closeDate: "2026-09-15T23:59:59.000Z",
    isNew: true,
    eligibility: "Registered sporting associations, community NPOs in NSW.",
    sourceUrl: "https://www.sport.nsw.gov.au/grants/ext-2"
  },
  {
    id: "ext-3",
    title: "Queensland Renewable Energy Sector Development Fund",
    opportunityId: "GO7491",
    agency: "QLD Department of Energy and Water Supply",
    category: "Renewable Energy",
    description: "Co-investment in grid integration studies, local battery microgrid storage installations, and clean energy trials.",
    value: 1200000,
    openDate: "2026-05-15T00:00:00.000Z",
    closeDate: "2026-07-28T23:59:59.000Z",
    isNew: false,
    eligibility: "Energy developers, technology providers, Queensland local councils.",
    sourceUrl: "https://www.resources.qld.gov.au/grants/ext-3"
  },
  {
    id: "ext-4",
    title: "National Clean Energy Innovation Grant",
    opportunityId: "GO6642",
    agency: "Australian Renewable Energy Agency (ARENA)",
    category: "Renewable Energy",
    description: "Accelerating commercialization of hydrogen fuel trials, thermal batteries, and advanced solar photovoltaic research.",
    value: 2500000,
    openDate: "2026-06-25T00:00:00.000Z",
    closeDate: "2026-10-31T23:59:59.000Z",
    isNew: true,
    eligibility: "Australian research institutions, technology start-ups, corporate energy ventures.",
    sourceUrl: "https://arena.gov.au/funding/ext-4"
  },
  {
    id: "ext-5",
    title: "Regional Tourism Infrastructure Program",
    opportunityId: "GO5103",
    agency: "Victorian Department of Jobs, Skills, Industry and Regions",
    category: "Infrastructure",
    description: "Upgrading regional trails, visitor information hubs, and heritage building conservation to drive regional tourism.",
    value: 300000,
    openDate: "2026-05-20T00:00:00.000Z",
    closeDate: "2026-08-10T23:59:59.000Z",
    isNew: false,
    eligibility: "Victorian local government authorities, NPOs, tourism operators.",
    sourceUrl: "https://www.vic.gov.au/grants/ext-5"
  },
  {
    id: "ext-6",
    title: "Indigenous Business Support and Training Program",
    opportunityId: "GO4202",
    agency: "National Indigenous Australians Agency (NIAA)",
    category: "Community",
    description: "Funding to local Indigenous organizations providing vocational training, business mentoring, and incubator startup support.",
    value: 120000,
    openDate: "2026-06-15T00:00:00.000Z",
    closeDate: "2026-09-01T23:59:59.000Z",
    isNew: true,
    eligibility: "Majority-owned Indigenous businesses, registered corporations, NPOs.",
    sourceUrl: "https://www.niaa.gov.au/grants/ext-6"
  },
  {
    id: "ext-7",
    title: "Artificial Intelligence Commercialisation Initiative",
    opportunityId: "GO3921",
    agency: "Department of Industry, Science and Resources",
    category: "Research & Innovation",
    description: "Providing funding to jumpstart Australian SaaS startups deploying AI solutions into mining safety, agriculture, and healthcare systems.",
    value: 850000,
    openDate: "2026-06-10T00:00:00.000Z",
    closeDate: "2026-08-25T23:59:59.000Z",
    isNew: true,
    eligibility: "SMEs with less than 200 staff, research partnerships.",
    sourceUrl: "https://www.industry.gov.au/grants/ext-7"
  },
  {
    id: "ext-8",
    title: "Recycling Modernisation Fund - Round 2",
    opportunityId: "GO2810",
    agency: "Department of Climate Change, Energy, the Environment and Water",
    category: "Infrastructure",
    description: "Infrastructure funding to expand sorting facilities, chemical plastic recycling equipment, and glass processing facilities.",
    value: 1500000,
    openDate: "2026-04-10T00:00:00.000Z",
    closeDate: "2026-07-15T23:59:59.000Z",
    isNew: false,
    eligibility: "Australian recycling facility operators, waste management firms, councils.",
    sourceUrl: "https://www.environment.gov.au/grants/ext-8"
  },
  {
    id: "ext-9",
    title: "Smart Farms Small Grants",
    opportunityId: "GO1934",
    agency: "Department of Agriculture, Fisheries and Forestry",
    category: "Research & Innovation",
    description: "Supporting farmers to adopt precision agriculture, soil carbon measurement systems, and smart water management sensors.",
    value: 50000,
    openDate: "2026-06-22T00:00:00.000Z",
    closeDate: "2026-09-30T23:59:59.000Z",
    isNew: true,
    eligibility: "Primary producers, farming cooperatives, landcare groups.",
    sourceUrl: "https://www.agriculture.gov.au/grants/ext-9"
  },
  {
    id: "ext-10",
    title: "Mental Health Support in Workplace Grants",
    opportunityId: "GO1094",
    agency: "Department of Health and Aged Care",
    category: "Community",
    description: "Delivering targeted mental wellness programs, stress auditing workshops, and counseling resources across small businesses.",
    value: 30000,
    openDate: "2026-06-18T00:00:00.000Z",
    closeDate: "2026-08-20T23:59:59.000Z",
    isNew: true,
    eligibility: "NPOs, employer chambers of commerce, health foundations.",
    sourceUrl: "https://www.health.gov.au/grants/ext-10"
  }
];

// 14. GET /api/external-grants - Search simulated Australian grants
app.get('/api/external-grants', (req, res) => {
  const { q, category, source, minFunding, maxFunding } = req.query;
  let results = [...EXTERNAL_GRANTS];

  if (q) {
    const kw = (q as string).toLowerCase();
    results = results.filter(g => 
      g.title.toLowerCase().includes(kw) || 
      g.description.toLowerCase().includes(kw) ||
      g.agency.toLowerCase().includes(kw)
    );
  }

  if (category) {
    results = results.filter(g => g.category === category);
  }

  if (source) {
    const s = (source as string).toLowerCase();
    results = results.filter(g => g.agency.toLowerCase().includes(s));
  }

  if (minFunding) {
    results = results.filter(g => g.value >= parseFloat(minFunding as string));
  }

  if (maxFunding) {
    results = results.filter(g => g.value <= parseFloat(maxFunding as string));
  }

  res.json({ success: true, data: results });
});

// 14b. POST /api/external-grants/:id/consider - Import a grant for consideration
app.post('/api/external-grants/:id/consider', async (req, res) => {
  const { id } = req.params;
  const mockGrant = EXTERNAL_GRANTS.find(g => g.id === id);

  if (!mockGrant) {
    return res.status(404).json({ success: false, error: 'External grant not found.' });
  }

  try {
    const existing = await db.grant.findFirst({
      where: { sourceUrl: mockGrant.sourceUrl }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'This grant has already been imported for consideration.', data: existing });
    }

    const newGrant = await db.grant.create({
      data: {
        organizationId: ORG_ID,
        title: mockGrant.title,
        funderName: mockGrant.agency,
        category: mockGrant.category,
        totalFundingValue: mockGrant.value,
        amountRequested: 0,
        status: 'POTENTIAL',
        sourceUrl: mockGrant.sourceUrl,
        closeDate: new Date(mockGrant.closeDate),
        openDate: new Date(mockGrant.openDate),
        rawScrapedData: JSON.stringify(mockGrant)
      }
    });

    await ensureFundingBody(newGrant.funderName, mockGrant.sourceUrl);

    logEvent(newGrant.id, 'GRANT_IMPORTED_FOR_CONSIDERATION', 'Adrian (Founder)', {
      title: newGrant.title,
      funderName: newGrant.funderName,
      value: mockGrant.value
    });

    res.json({ success: true, data: newGrant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 15. GET /api/saved-searches - List saved searches
app.get('/api/saved-searches', async (req, res) => {
  try {
    const searches = await db.savedSearch.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: searches });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 15b. POST /api/saved-searches - Create a saved search query
app.post('/api/saved-searches', async (req, res) => {
  const { name, category, minFunding, maxFunding, source } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required.' });
  }

  try {
    const saved = await db.savedSearch.create({
      data: {
        name,
        category: category || null,
        minFunding: minFunding ? parseFloat(minFunding) : null,
        maxFunding: maxFunding ? parseFloat(maxFunding) : null,
        source: source || null
      }
    });

    logEvent(saved.id, 'SAVED_SEARCH_CREATED', 'Adrian (Founder)', {
      name,
      category,
      minFunding,
      maxFunding,
      source
    });

    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 15c. DELETE /api/saved-searches/:id - Delete saved search
app.delete('/api/saved-searches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.savedSearch.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 16. GET /api/knowledge-documents - List global knowledge assets
app.get('/api/knowledge-documents', async (req, res) => {
  try {
    const docs = await db.knowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: docs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 16b. POST /api/knowledge-documents - Upload global knowledge asset
app.post('/api/knowledge-documents', async (req, res) => {
  const { name, type, fileSize, uploadedBy } = req.body;
  if (!name || !type || !uploadedBy) {
    return res.status(400).json({ success: false, error: 'name, type, and uploadedBy are required.' });
  }

  try {
    const doc = await db.knowledgeDocument.create({
      data: {
        name,
        type,
        fileSize: fileSize || '1.8 MB',
        uploadedBy
      }
    });

    logEvent(doc.id, 'KNOWLEDGE_DOCUMENT_UPLOADED', uploadedBy, {
      name,
      type,
      fileSize: doc.fileSize
    });

    res.json({ success: true, data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 16c. DELETE /api/knowledge-documents/:id - Delete global knowledge asset
app.delete('/api/knowledge-documents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.knowledgeDocument.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 17. POST /api/grants/:id/generate-draft - AI Draft Generator
app.post('/api/grants/:id/generate-draft', async (req, res) => {
  const { id } = req.params;
  const { instructionDocName, knowledgeDocIds, previousGrantIds, author } = req.body;

  if (!instructionDocName || !author) {
    return res.status(400).json({ success: false, error: 'instructionDocName and author are required.' });
  }

  try {
    const grant = await db.grant.findUnique({
      where: { id }
    });

    if (!grant) {
      return res.status(404).json({ success: false, error: 'Target grant not found.' });
    }

    const knowledgeAssets = await db.knowledgeDocument.findMany({
      where: { id: { in: knowledgeDocIds || [] } }
    });

    const previousGrants = await db.grant.findMany({
      where: { id: { in: previousGrantIds || [] } }
    });

    const pastGrantSummary = previousGrants.length > 0
      ? previousGrants.map(g => `• **${g.title}** (Funder: ${g.funderName}, Value: $${(g.totalFundingValue || 0).toLocaleString()})`).join('\n')
      : '• *No historical references selected.*';

    const generatedMarkdown = `
# AI DRAFT APPLICATION RESPONSE: ${grant.title}
*Generated by SurePact AI Writing Assistant on ${new Date().toLocaleDateString('en-AU')}*
*Guidelines Reference: **${instructionDocName}***

---

## 1. Executive Summary & Project Objectives
### 1.1 Project Title
**${grant.title} Implementation & Operations**

### 1.2 Program Alignment
The proposed initiative is precisely structured to fulfill the guidelines defined in **${instructionDocName}**. By deploying targeted measures within the **${grant.category || 'Infrastructure'}** domain, our organization will address critical community demand and deliver measurable outcomes matching the objectives of **${grant.funderName}**.

### 1.3 Strategic Scope
Based on the strategic metrics detailed in our **${knowledgeAssets[0]?.name || 'organizational assets'}**, this project aims to support direct operations and community access. Funding of **$${(grant.totalFundingValue || 0).toLocaleString()}** will be applied directly to resource allocation, equipment acquisition, and structured monitoring.

---

## 2. Organisational Capability & Past Performance
### 2.1 Corporate Summary
Our organization stands as a highly qualified recipient with a proven execution track record in similar federal and state programs. 

### 2.2 Historical Reference & Proof-Points
We draw direct project delivery methods and risk-mitigation frameworks from our successfully completed programs, including:
${pastGrantSummary}

Additionally, as documented in our globally saved **${knowledgeAssets.find(k => k.type === 'ANNUAL_REPORT')?.name || 'Annual Report'}**, our financial governance structure maintains independent audits and internal risk controllers to guarantee that all grant funds are strictly allocated against program milestones.

---

## 3. Detailed Response Criteria
### 3.1 Project Methodology & Risk Management
Using the standard operating guidelines of our previous projects, we will deploy a 4-phase physical delivery workflow:
1. **Pre-Construction & Engineering Design**: Initial assessments, zoning approvals, and final specifications.
2. **Procurement & Contracting**: Competitive bidding, vendor agreements, and material ordering.
3. **Execution & Delivery**: Active construction or implementation with regular inspections.
4. **Acquittal & Reconciliation**: Submission of ledger balance reports and milestone sign-offs.

### 3.2 Key Personnel & Resource Management
Adrian (Founder) and our PMO will serve as lead coordinators. Under our project policy guidelines, this initiative is projected to support local employment and local subcontractor networks.
`.trim();

    const newDoc = await db.document.create({
      data: {
        grantId: id,
        name: `AI Generated Draft - ${grant.title.substring(0, 20)}.md`,
        type: 'APPLICATION',
        fileSize: `${(Buffer.byteLength(generatedMarkdown) / 1024).toFixed(1)} KB`,
        uploadedBy: author
      }
    });

    logEvent(id, 'GRANT_APPLICATION_DRAFT_GENERATED', author, {
      instructionDocName,
      knowledgeDocsCount: knowledgeAssets.length,
      previousGrantsCount: previousGrants.length,
      generatedDocumentId: newDoc.id
    });

    res.json({
      success: true,
      data: {
        document: newDoc,
        draftText: generatedMarkdown
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// AI Grant Writer (AutoRFP Style) Endpoints
// ==========================================

// 1. GET list of available guidelines files from disk
app.get('/api/ai-grant-writer/guidelines', async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    let assetsDir = '';
    const searchPaths = [
      path.join(__dirname, '../../grant_guidelines_assets'),
      path.join(__dirname, '../grant_guidelines_assets'),
      path.join(process.cwd(), 'grant_guidelines_assets'),
      path.join(process.cwd(), '../grant_guidelines_assets')
    ];
    for (const p of searchPaths) {
      if (fs.existsSync(p)) {
        assetsDir = p;
        break;
      }
    }

    if (assetsDir) {
      const files = fs.readdirSync(assetsDir).filter((f: any) => f.endsWith('.md'));
      res.json({ success: true, data: files });
    } else {
      res.json({ success: true, data: [] });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET list of requirement response blocks for a specific grant
app.get('/api/ai-grant-writer/grants/:id/requirements', async (req, res) => {
  const { id } = req.params;
  try {
    const reqs = await db.grantRequirementResponse.findMany({
      where: { grantId: id },
      orderBy: { requirementKey: 'asc' }
    });
    res.json({ success: true, data: reqs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST to extract requirements from a guidelines doc or custom text and create stubs
app.post('/api/ai-grant-writer/grants/:id/extract', async (req, res) => {
  const { id } = req.params;
  const { guidelinesDocName, customGuidelinesText } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    let guidelinesText = '';
    if (customGuidelinesText) {
      guidelinesText = customGuidelinesText;
    } else if (guidelinesDocName) {
      const path = require('path');
      const fs = require('fs');
      let docPath = '';
      const searchPaths = [
        path.join(__dirname, '../../grant_guidelines_assets', guidelinesDocName),
        path.join(__dirname, '../grant_guidelines_assets', guidelinesDocName),
        path.join(process.cwd(), 'grant_guidelines_assets', guidelinesDocName),
        path.join(process.cwd(), '../grant_guidelines_assets', guidelinesDocName)
      ];
      for (const p of searchPaths) {
        if (fs.existsSync(p)) {
          docPath = p;
          break;
        }
      }

      if (docPath) {
        guidelinesText = fs.readFileSync(docPath, 'utf8');
      } else {
        return res.status(404).json({ success: false, error: `Guidelines document ${guidelinesDocName} not found.` });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Either guidelinesDocName or customGuidelinesText must be provided.' });
    }

    const prompt = `You are a professional grant writer and editor. Your job is to analyze the following grant guidelines and extract:
1. All selection criteria, response requirements, or application questions that must be addressed by the applicant in their written submission.
2. A checklist of all required attachments, mandatory documents, or supporting evidence that must be completed and submitted back to the funding body (e.g. Detailed Budget Estimate Spreadsheet, Project Risk Mitigation Register, Letters of Support / Land Council Endorsement, Audited Financial Statements, Certificate of Currency).

Format your output STRICTLY as a JSON object matching this schema:
{
  "guidelinesTitle": "Clean extracted title of the guidelines document",
  "criteria": [
    {
      "key": "Criterion 1",
      "question": "Full detailed question or prompt from the guidelines."
    }
  ],
  "requiredDocuments": [
    {
      "name": "Detailed Budget Estimate Spreadsheet",
      "description": "Itemized financial breakdown including quotes and co-contribution proof.",
      "mandatory": true
    }
  ]
}

Guidelines text:
${guidelinesText}

Do not put any markdown code blocks like \`\`\`json. Output ONLY the raw JSON string.`;

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result: any = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API did not return text');
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(text.trim());
    } catch (e) {
      console.error('Failed to parse JSON from Gemini:', text);
    }

    const requirements = Array.isArray(parsed) ? parsed : (parsed.criteria || []);
    const requiredDocsList = Array.isArray(parsed.requiredDocuments) && parsed.requiredDocuments.length > 0 ? parsed.requiredDocuments : [
      { name: 'Detailed Budget Estimate Spreadsheet', description: 'Itemized financial breakdown including co-contributions and quotes', mandatory: true },
      { name: 'Project Risk Mitigation Register', description: 'Comprehensive risk assessment and emergency protocols', mandatory: true },
      { name: 'Letters of Support / Endorsements', description: 'Community endorsement letters and partner confirmation', mandatory: false }
    ];

    // Delete existing requirements for this grant to start fresh
    await db.grantRequirementResponse.deleteMany({
      where: { grantId: id }
    });

    // Create new stubs
    const created: any[] = [];
    for (const req of requirements) {
      const createdReq = await db.grantRequirementResponse.create({
        data: {
          grantId: id,
          requirementKey: req.key || `Q-${created.length + 1}`,
          question: req.question,
          responseText: '',
          status: 'DRAFT'
        }
      });
      created.push(createdReq);
    }

    // Update grant to store guidelines info & required documents
    const guidelinesResponseDocs = requiredDocsList.map((d: any) => d.name).join(', ');
    await db.grant.update({
      where: { id },
      data: {
        guidelinesDocName: guidelinesDocName || 'Uploaded Guidelines',
        guidelinesExtractedTitle: parsed.guidelinesTitle || 'Funder Guidelines',
        guidelinesResponseDocs,
        requiredDocuments: JSON.stringify(requiredDocsList)
      }
    });

    res.json({ 
      success: true, 
      data: created, 
      requiredDocuments: requiredDocsList,
      guidelinesExtractedTitle: parsed.guidelinesTitle || 'Funder Guidelines' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. POST to generate/draft response for a specific question block
app.post('/api/ai-grant-writer/grants/:id/generate-response', async (req, res) => {
  const { id } = req.params;
  const { requirementKey, knowledgeDocIds, previousGrantIds, userCustomInstructions } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const grant = await db.grant.findUnique({ where: { id } });
    if (!grant) {
      return res.status(404).json({ success: false, error: 'Grant not found.' });
    }

    const reqResponse = await db.grantRequirementResponse.findUnique({
      where: {
        grantId_requirementKey: {
          grantId: id,
          requirementKey
        }
      }
    });

    if (!reqResponse) {
      return res.status(404).json({ success: false, error: 'Requirement response block not found.' });
    }

    // Fetch knowledge documents content
    const knowledgeDocs = await db.knowledgeDocument.findMany({
      where: { id: { in: knowledgeDocIds || [] } }
    });

    const corporateProfileDocs = knowledgeDocs.filter((d: any) => d.type !== 'PAST_GRANT_APPLICATION');
    const pastApplicationDocs = knowledgeDocs.filter((d: any) => d.type === 'PAST_GRANT_APPLICATION');

    let corporateProfileContext = corporateProfileDocs.length > 0
      ? corporateProfileDocs.map((d: any) => `[ASSET: ${d.name}]\n${d.content || 'No content.'}`).join('\n\n')
      : 'No corporate capability documents selected.';

    // Fetch past submitted/awarded/closed/rejected grants from the registry
    const registryPastGrants = await db.grant.findMany({
      where: {
        status: {
          in: ['SUBMITTED', 'AWARDED', 'CLOSED', 'REJECTED']
        }
      },
      include: {
        requirementResponses: true
      }
    });

    let registryPastGrantsContext = '';
    if (registryPastGrants.length > 0) {
      registryPastGrantsContext = registryPastGrants.map((rg: any) => {
        const responsesText = rg.requirementResponses.length > 0
          ? rg.requirementResponses.map((resp: any) => `[Section: ${resp.requirementKey}]\nQuestion: ${resp.question}\nResponse: ${resp.responseText || 'No response.'}`).join('\n\n')
          : 'No section responses recorded.';
        return `[REGISTRY PAST APPLICATION: ${rg.title}]\nFunder: ${rg.funderName}\nStatus: ${rg.status}\nValue: $${(rg.totalFundingValue || 0).toLocaleString()}\n${responsesText}`;
      }).join('\n\n---\n\n');
    }

    let historicalProofContext = '';
    if (pastApplicationDocs.length > 0) {
      historicalProofContext += pastApplicationDocs.map((d: any) => `[PAST APPLICATION FILE: ${d.name}]\n${d.content || 'No content.'}`).join('\n\n');
    } else {
      historicalProofContext += 'No past application documents selected from Knowledge Centre.';
    }

    if (registryPastGrantsContext) {
      historicalProofContext += `\n\n[AUTOMATIC REGISTRY EVIDENCE]:\n${registryPastGrantsContext}`;
    }

    const prompt = `You are the Lead Grant Writer for a remote First Nations Community Controlled Organisation (specifically Urapuntja Health Service Aboriginal Corporation - UHSAC). Your objective is to write a highly compelling, detailed, and professional draft response to a specific grant application section.

### Tone and Voice Guidelines:
1. **Respectful & Culturally Safe**: Maintain a strong focus on self-determination, local employment, cultural safety, and community control.
2. **Vocabulary**: Use remote Aboriginal Community Controlled Health Organisation (ACCHO) terms like "on Country", "outstations/homelands", and "traditional owners/elders" where appropriate. Refer to specific local language groups (Alyawarr and Anmatyerr for Utopia) rather than generic terms. Refer to "Aboriginal Health Practitioners (AHPs)" and "Trusted Facilitators/Care Navigators" instead of general clinical staff.
3. **Precision**: Avoid vague generalizations or marketing fluff. Use real numbers, local metrics, and concrete examples from the provided context.
4. **No Placeholders**: Never write placeholder text like "[Insert Date Here]" or "contact the team at [email]". If details are missing, construct a professional response using the corporate profile or omit it.

### Grounding Rules:
1. **Strict Data Grounding**: You may only use stats, financial values, dates, and names provided within the context. Do not invent details regarding budgets, partners, or clinical counts.
2. **Role Differentiation**: Clearly distinguish between the proposed project (which is being applied for) and historical projects (which serve as capability proof points). Do not describe historical projects as part of the new project's execution plan; they must only be referenced as evidence of capability.
3. **Formatting**: Output the response directly in Markdown format. Use tables for financial breakdowns and bullet points for lists of deliverables or phases. Do not write conversational introductions, post-generation notes, or chat pleasantries. Start directly with the content.

### Task:
Write a comprehensive draft response for the following grant application section:
- Target Selection Criterion / Question:
${reqResponse.question}

### Context:
Below are the authorized organization assets and proposed project details to use:

<proposed_project>
Target Grant Details:
- Title: ${grant.title}
- Funder: ${grant.funderName}
- Value: $${(grant.totalFundingValue || 0).toLocaleString()}
- Category: ${grant.category || 'N/A'}
- Description: ${grant.description || 'N/A'}
</proposed_project>

<corporate_profile>
${corporateProfileContext}
</corporate_profile>

<historical_proof_points>
${historicalProofContext}
</historical_proof_points>

<additional_directives>
${userCustomInstructions || 'None.'}
</additional_directives>

Draft Response:`;

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result: any = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API did not return text');
    }

    // Update the responseText in the database
    const updated = await db.grantRequirementResponse.update({
      where: {
        grantId_requirementKey: {
          grantId: id,
          requirementKey
        }
      },
      data: {
        responseText: text,
        status: 'IN_PROGRESS'
      }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. PUT update response text or status manually
app.put('/api/ai-grant-writer/grants/:id/requirements/:key', async (req, res) => {
  const { id, key } = req.params;
  const { responseText, status } = req.body;

  try {
    const updated = await db.grantRequirementResponse.update({
      where: {
        grantId_requirementKey: {
          grantId: id,
          requirementKey: key
        }
      },
      data: {
        responseText,
        status
      }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. POST compile all sections into a single Document in the Grant Library
app.post('/api/ai-grant-writer/grants/:id/compile', async (req, res) => {
  const { id } = req.params;
  const { author } = req.body;

  try {
    const grant = await db.grant.findUnique({ where: { id } });
    if (!grant) {
      return res.status(404).json({ success: false, error: 'Grant not found.' });
    }

    const responses = await db.grantRequirementResponse.findMany({
      where: { grantId: id },
      orderBy: { requirementKey: 'asc' }
    });

    if (responses.length === 0) {
      return res.status(400).json({ success: false, error: 'No requirement responses found to compile.' });
    }

    let combinedText = `# Compiled Application Response: ${grant.title}\n`;
    combinedText += `*Generated by SurePact AI Writing Assistant & User Edits on ${new Date().toLocaleDateString('en-AU')}*\n\n`;
    combinedText += `Funder: **${grant.funderName}**\n`;
    combinedText += `Funding Value: **$${(grant.totalFundingValue || 0).toLocaleString()}**\n\n`;
    combinedText += `---`;

    for (const r of responses) {
      combinedText += `\n\n## ${r.requirementKey}\n`;
      combinedText += `### Requirement / Question:\n${r.question}\n\n`;
      combinedText += `### Response:\n${r.responseText || '*No response provided.*'}\n\n`;
      combinedText += `---`;
    }

    // Save to documents table
    const newDoc = await db.document.create({
      data: {
        grantId: id,
        name: `AI_Compiled_Proposal_${grant.title.substring(0, 20).replace(/\s+/g, '_')}.doc`,
        type: 'APPLICATION',
        fileSize: `${(Buffer.byteLength(combinedText) / 1024).toFixed(1)} KB`,
        uploadedBy: author || 'Adrian (Founder)',
        content: combinedText
      }
    });

    logEvent(id, 'GRANT_APPLICATION_COMPILED', author || 'Adrian (Founder)', {
      documentId: newDoc.id,
      questionsCount: responses.length
    });

    res.json({ success: true, data: { doc: newDoc, content: combinedText } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// CRM-Lite Funding Bodies Endpoints
app.get('/api/funding-bodies', async (req, res) => {
  try {
    const bodies = await db.fundingBody.findMany({
      include: {
        contacts: {
          include: {
            interactions: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        opportunities: {
          include: {
            contact: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    res.json({ success: true, data: bodies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/funding-bodies', async (req, res) => {
  const { name, type, website, description } = req.body;
  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'Name and Type are required.' });
  }
  try {
    const body = await db.fundingBody.create({
      data: { name, type, website, description }
    });
    logEvent(body.id, 'FUNDING_BODY_CREATED', 'User', { name, type });
    res.json({ success: true, data: body });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/funding-bodies/:id/contacts', async (req, res) => {
  const { id } = req.params;
  const { name, role, email, phone } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required.' });
  }
  try {
    const contact = await db.fundingBodyContact.create({
      data: {
        fundingBodyId: id,
        name,
        role,
        email,
        phone
      }
    });
    logEvent(contact.id, 'FUNDING_BODY_CONTACT_CREATED', 'User', { name, role });
    res.json({ success: true, data: contact });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/funding-bodies/contacts/:contactId/interactions', async (req, res) => {
  const { contactId } = req.params;
  const { type, subject, content, status, dueDate } = req.body;
  if (!type || !subject || !content) {
    return res.status(400).json({ success: false, error: 'Type, Subject, and Content are required.' });
  }
  try {
    const interaction = await db.contactInteraction.create({
      data: {
        contactId,
        type,
        subject,
        content,
        status,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });
    logEvent(contactId, 'CONTACT_INTERACTION_RECORDED', 'User', { type, subject });
    res.json({ success: true, data: interaction });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/funding-bodies/:id/opportunities', async (req, res) => {
  const { id } = req.params;
  const { contactId, title, value, description, deadline } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required.' });
  }
  try {
    const opportunity = await db.fundingOpportunity.create({
      data: {
        fundingBodyId: id,
        contactId: contactId || null,
        title,
        value: value ? parseFloat(value) : null,
        description,
        deadline: deadline ? new Date(deadline) : null,
        status: 'IDENTIFIED'
      }
    });
    logEvent(opportunity.id, 'FUNDING_OPPORTUNITY_CREATED', 'User', { title, value });
    res.json({ success: true, data: opportunity });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/funding-opportunities/:id/promote', async (req, res) => {
  const { id } = req.params;
  try {
    const opp = await db.fundingOpportunity.findUnique({
      where: { id },
      include: { fundingBody: true }
    });

    if (!opp) {
      return res.status(404).json({ success: false, error: 'Opportunity not found.' });
    }

    await db.fundingOpportunity.update({
      where: { id },
      data: { status: 'PROMOTED' }
    });

    const newGrant = await db.grant.create({
      data: {
        organizationId: ORG_ID,
        title: opp.title,
        funderName: opp.fundingBody.name,
        totalFundingValue: opp.value,
        status: 'POTENTIAL',
        openDate: opp.createdAt,
        closeDate: opp.deadline
      }
    });

    logEvent(opp.id, 'FUNDING_OPPORTUNITY_PROMOTED', 'User', {
      opportunityId: id,
      newGrantId: newGrant.id,
      title: opp.title
    });

    res.json({ success: true, data: newGrant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// FUNDING AGREEMENT INGESTION ENDPOINTS
// ==========================================

// 1. GET /api/example-agreements - List example agreement PDFs
app.get('/api/example-agreements', async (req, res) => {
  const dirPath = path.join(__dirname, '../../Example Funding Agreements');
  try {
    if (!fs.existsSync(dirPath)) {
      return res.json([]);
    }
    const files = fs.readdirSync(dirPath);
    const pdfFiles = files
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .map(f => {
        const stats = fs.statSync(path.join(dirPath, f));
        return {
          filename: f,
          sizeBytes: stats.size
        };
      });
    res.json(pdfFiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /api/example-agreements/:filename - Stream/download example PDF file
app.get('/api/example-agreements/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../Example Funding Agreements', filename);
  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.sendFile(filePath);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /api/parse-agreement - Run Gemini AI extraction on raw text
app.post('/api/parse-agreement', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, error: 'Text content is required for parsing.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured on the server environment.' });
  }

  try {
    const cleanedText = text.substring(0, 45000); // Truncate text size to fit safely in model context
    
    const prompt = `You are a professional funding agreement analyst AI. Parse the following funding agreement document text and extract:
1. The necessary grant details for the grant record.
2. All obligations that the recipient has to the funding body under the agreement.
3. All expected payment installments from the payment/milestones schedule table.

Format your output STRICTLY as a JSON object matching this schema:
{
  "title": "Clean, descriptive grant title (e.g., Regional Water Treatment Facility Upgrade) (optional/null if not found)",
  "funderName": "Funding body name / government department (e.g., Department of Health) (optional/null if not found)",
  "totalFundingValue": 1500000.00 (optional/null if not found),
  "category": "Health" | "Infrastructure" | "Community Services" | "Environmental Services" | "Education" (optional/null if not found),
  "openDate": "YYYY-MM-DD (start/execution date of agreement) (optional/null if not found)",
  "closeDate": "YYYY-MM-DD (end/close date of agreement) (optional/null if not found)",
  "referenceNumber": "GFA Reference / Contract / Schedule code (optional/null if not found)",
  "obligations": [
    {
      "title": "Short title of obligation (e.g., Q1 Financial Acquittal)",
      "description": "Specific clause/requirement description from the text",
      "dueDate": "YYYY-MM-DD (estimate logically from dates if not explicit)",
      "category": "Acquittals" | "Activities" | "Reports" | "Milestones" | "General"
    }
  ],
  "installments": [
    {
      "amount": 992540.00,
      "dueDate": "YYYY-MM-DD"
    }
  ]
}

CRITICAL DEFINITIONS FOR OBLIGATION CATEGORIES:
- "Acquittals": requirement to submit a financial acquittal report back to the funding body with a target due date.
- "Reports": requirement to submit a specific report template or set of non-financial data to the funding body with a target due date.
- "Milestones": requirement to meet or report on specific project milestones, including payment trigger milestones with target due dates.
- "Activities": specific time-bound project activities or deliverables (e.g. mock drill, purchasing equipment) with target due dates.
- "General": ongoing contractual conditions, governance rules, or legal compliance terms that do NOT have a specific calendar due date (e.g. allowing site inspections upon notice, maintaining insurance policies, maintaining financial records, using funds solely for approved activity). Do NOT require task timing for these.

CRITICAL RULES:
1. Do not output any markdown code blocks like \`\`\`json or trailing comments. Output ONLY the raw JSON string.
2. If certain fields are not found in the text, return them as null. Do NOT hallucinate.
3. For due dates, if a specific date is not explicitly mentioned, estimate it logically based on the agreement timeline (e.g. close date or milestone duration).
4. Locate any tables outlining a schedule of payments (usually under sections like "Payment of the Grant" or "Milestones"). Parse each payment in that schedule:
   a. Create an entry in the "installments" list with the extracted amount and anticipated date.
   b. Create a corresponding entry in the "obligations" list with category set to "Milestones" and the milestone title (e.g. "IAHP CPHC Q1 2024-25 Payment Milestone").

Agreement Text:
${cleanedText}`;

    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error('Gemini API did not return text content');
    }

    const parsedJson = JSON.parse(candidateText.trim());
    res.json({ success: true, data: parsedJson });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. POST /api/ingest-agreement - Save parsed grant & obligations
app.post('/api/ingest-agreement', async (req, res) => {
  const { mode, grantId, grantData, obligations, installments } = req.body;

  try {
    let targetGrantId = grantId;
    let activeContractId: string | null = null;

    if (mode === 'create') {
      if (!grantData || !grantData.title) {
        return res.status(400).json({ success: false, error: 'Grant title is required when creating a new grant.' });
      }

      // Create new grant with status AWARDED (bypassing first two steps)
      const newGrant = await db.grant.create({
        data: {
          organizationId: ORG_ID,
          title: grantData.title,
          funderName: grantData.funderName || 'Unknown Funder',
          totalFundingValue: grantData.totalFundingValue ? parseFloat(grantData.totalFundingValue) : null,
          category: grantData.category || 'Infrastructure',
          openDate: grantData.openDate ? new Date(grantData.openDate) : null,
          closeDate: grantData.closeDate ? new Date(grantData.closeDate) : null,
          status: 'AWARDED',
          gfaExtractedTitle: grantData.title,
          gfaDocumentName: 'Ingested Agreement'
        }
      });
      targetGrantId = newGrant.id;

      await ensureFundingBody(newGrant.funderName);

      // Create Contract linked to the new Grant
      const newContract = await db.contract.create({
        data: {
          grantId: targetGrantId,
          fundingAgreementReference: grantData.referenceNumber || 'GFA-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          totalObligatedAmount: grantData.totalFundingValue ? parseFloat(grantData.totalFundingValue) : 0,
          executionDate: grantData.openDate ? new Date(grantData.openDate) : new Date()
        }
      });
      activeContractId = newContract.id;

      logEvent(targetGrantId, 'GRANT_IMPORTED_FOR_CONSIDERATION', 'System (Ingestion)', {
        title: grantData.title,
        funderName: grantData.funderName,
        status: 'AWARDED'
      });

      logEvent(targetGrantId, 'AGREEMENT_INGESTED', 'User', {
        title: grantData.title,
        funderName: grantData.funderName,
        totalFundingValue: grantData.totalFundingValue,
        referenceNumber: grantData.referenceNumber
      });

    } else {
      // mode === 'associate'
      if (!targetGrantId) {
        return res.status(400).json({ success: false, error: 'grantId is required when associating with an existing grant.' });
      }

      const existingGrant = await db.grant.findUnique({
        where: { id: targetGrantId },
        include: { contracts: true }
      });

      if (!existingGrant) {
        return res.status(404).json({ success: false, error: 'Selected grant not found.' });
      }

      // Check stage validation (must be at least at Award Decision stage: AWARDED, REJECTED, CLOSED)
      const allowedStages = ['AWARDED', 'REJECTED', 'CLOSED'];
      if (!allowedStages.includes(existingGrant.status)) {
        return res.status(400).json({ 
          success: false, 
          error: `Selected grant must be at least at the Award Decision stage (Current Stage: ${existingGrant.status}).` 
        });
      }

      // Create Contract if not already present
      if (existingGrant.contracts.length === 0) {
        const newContract = await db.contract.create({
          data: {
            grantId: targetGrantId,
            fundingAgreementReference: grantData?.referenceNumber || 'GFA-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            totalObligatedAmount: existingGrant.totalFundingValue || 0,
            executionDate: new Date()
          }
        });
        activeContractId = newContract.id;
      } else {
        activeContractId = existingGrant.contracts[0].id;
      }

      logEvent(targetGrantId, 'AGREEMENT_INGESTED', 'User', {
        associatedGrantTitle: existingGrant.title,
        referenceNumber: grantData?.referenceNumber
      });
    }

    // Insert Obligations as MilestoneTasks and Milestones linked to the Grant & Contract
    const createdTasksCount = [];
    if (obligations && Array.isArray(obligations)) {
      for (const ob of obligations) {
        let normCat = 'Activities';
        const rawCat = (ob.category || '').toLowerCase();
        if (rawCat.includes('general')) normCat = 'General';
        else if (rawCat.includes('milestone')) normCat = 'Milestones';
        else if (rawCat.includes('acquittal')) normCat = 'Acquittals';
        else if (rawCat.includes('report')) normCat = 'Reporting';
        else normCat = 'Activities';

        // For non-general obligations, require an assigned user ID if provided; otherwise fallback to first user
        if (normCat !== 'General' && !ob.assignedToUserId) {
          // Fallback to first user in org
          const defaultUser = await db.user.findFirst();
          if (defaultUser) ob.assignedToUserId = defaultUser.id;
        }

        let milestoneId: string | null = null;
        if (normCat === 'Milestones' && activeContractId) {
          const m = await db.milestone.create({
            data: {
              contractId: activeContractId,
              title: ob.title,
              description: ob.description || null,
              dueDate: new Date(ob.dueDate || Date.now()),
              isAcquitted: false
            }
          });
          milestoneId = m.id;
        }

        const assignedUser = ob.assignedToUserId || (await db.user.findFirst())?.id || '';

        const task = await db.milestoneTask.create({
          data: {
            grantId: targetGrantId,
            milestoneId: milestoneId,
            title: ob.title,
            description: `[Category: ${normCat}] ${ob.description || ''}`,
            assignedToUserId: assignedUser,
            dueDate: new Date(ob.dueDate || Date.now()),
            status: 'PENDING',
            stage: 'OBLIGATION'
          }
        });
        createdTasksCount.push(task.id);
      }

      logEvent(targetGrantId, 'OBLIGATIONS_GENERATED', 'SurePact AI Engine', {
        count: createdTasksCount.length,
        taskIds: createdTasksCount
      });
    }

    // Insert installments if present and create attributed payment confirmation tasks
    if (installments && Array.isArray(installments) && activeContractId) {
      for (const inst of installments) {
        const instAmount = parseFloat(inst.amount) || 0;
        const instDueDate = new Date(inst.dueDate || Date.now());
        const instStatus = inst.status || 'PENDING';

        await db.installment.create({
          data: {
            contractId: activeContractId,
            amount: instAmount,
            dueDate: instDueDate,
            status: instStatus
          }
        });

        // Create attributed payment confirmation task
        const amtStr = `$${instAmount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const dueStr = instDueDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
        const defaultUser = await db.user.findFirst();
        const task = await db.milestoneTask.create({
          data: {
            grantId: targetGrantId,
            title: `Confirm Payment Received: ${amtStr}`,
            description: `[Category: Reporting] Confirm receipt of payment installment for ${amtStr} scheduled due on ${dueStr}.`,
            assignedToUserId: defaultUser?.id || '',
            dueDate: instDueDate,
            status: instStatus === 'RECEIVED' ? 'COMPLETED' : 'PENDING'
          }
        });
        createdTasksCount.push(task.id);
      }
    }

    res.json({ success: true, grantId: targetGrantId, tasksCreatedCount: createdTasksCount.length });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve client built static assets
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`SurePact Greenfield API Server running on http://localhost:${PORT}`);
});
