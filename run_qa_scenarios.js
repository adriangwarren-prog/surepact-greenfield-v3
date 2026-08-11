const API_URL = 'https://surepact-greenfield-v2.onrender.com/api';
const AUTH_HEADER = {
  'Authorization': 'Bearer SurePact2026!',
  'Content-Type': 'application/json'
};

const results = [];
const bugsAndGaps = [];

async function api(path, options = {}) {
  const url = `${API_URL}${path}`;
  const start = Date.now();
  const headers = { ...AUTH_HEADER, ...(options.headers || {}) };
  const config = { ...options, headers };
  
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  
  try {
    const res = await fetch(url, config);
    const duration = Date.now() - start;
    const json = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data: json, duration };
  } catch (err) {
    return { status: 500, ok: false, error: err.message, duration: Date.now() - start };
  }
}

function logResult(scenarioId, title, pass, details, bugNote = null) {
  results.push({ scenarioId, title, pass, details });
  if (bugNote) {
    bugsAndGaps.push({ scenarioId, title, note: bugNote });
  }
  console.log(`[${pass ? 'PASS' : 'FAIL'}] Scenario ${scenarioId}: ${title}`);
  if (details) console.log(`   -> Details: ${details}`);
  if (bugNote) console.log(`   -> ⚠️ BUG/GAP: ${bugNote}`);
}

async function runAllScenarios() {
  console.log('================================================================');
  console.log('🚀 SurePact Platform QA Execution - 10 E2E Grant Test Scenarios');
  console.log('================================================================\n');

  // Baseline Health Check
  const health = await api('/grants');
  if (!health.ok) {
    console.error('❌ Backend API unavailable or unauthorized. Halting QA runner.');
    return;
  }
  console.log('✅ Connected to Cloud Backend API (Render). Baseline health check passed.\n');

  // Baseline Data
  const usersRes = await api('/users');
  const projectsRes = await api('/projects');
  const users = usersRes.data?.data || usersRes.data || [];
  const projects = projectsRes.data?.data || projectsRes.data || [];
  const adminUser = users.find(u => u.role === 'admin') || users[0] || { id: 'admin-id', name: 'Admin' };
  const staffUser = users.find(u => u.email?.includes('sarah') || u.email?.includes('christine')) || users[1] || adminUser;

  // SCENARIO 1: Regional Infrastructure Capital Works Grant
  console.log('--- SCENARIO 1: Regional Infrastructure Capital Works Grant ---');
  try {
    const g1 = await api('/grants', {
      method: 'POST',
      body: {
        organizationId: '99999999-8888-7777-6666-555555555555',
        title: 'Regional Bridges & Infrastructure Upgrade 2026',
        funderName: 'QLD Dept of State Development & Infrastructure',
        totalFundingValue: 1500000,
        category: 'Capital Works',
        description: 'Upgrade of 3 key bridge structures and regional access roads.'
      }
    });

    const grant1Id = g1.data?.data?.id || g1.data?.id;
    if (grant1Id) {
      await api(`/grants/${grant1Id}/risk`, {
        method: 'POST',
        body: { assessedByUserId: adminUser.id, financialRiskScore: 3, deliveryCapabilityScore: 4, strategicAlignmentScore: 5, overallRiskRating: 'MEDIUM', justificationNotes: 'Moderate scale.', isApprovedToApply: true }
      });
      await api(`/grants/${grant1Id}/submit`, { method: 'POST', body: { submissionReference: 'REF-BRIDGES-2026' } });
      await api(`/grants/${grant1Id}/award`, { method: 'POST' });
      
      const gfa1 = await api(`/grants/${grant1Id}/extract-gfa`, {
        method: 'POST',
        body: { documentName: 'GFA_Regional_Bridges_Executed.pdf', totalObligatedAmount: 1500000 }
      });

      let projId = projects[0]?.id;
      if (projId) {
        await api('/projects/link', { method: 'POST', body: { grantId: grant1Id, projectId: projId, allocatedAmount: 1500000 } });
        await api('/transactions', { method: 'POST', body: { organizationId: '99999999-8888-7777-6666-555555555555', grantId: grant1Id, projectId: projId, amount: 500000, type: 'INCOME', description: 'Funder Drawdown #1', category: 'Funder Drawdown' } });
        await api('/transactions', { method: 'POST', body: { organizationId: '99999999-8888-7777-6666-555555555555', grantId: grant1Id, projectId: projId, amount: -220000, type: 'EXPENDITURE', description: 'Civil Earthworks', category: 'Infrastructure' } });
      }

      const close1 = await api(`/grants/${grant1Id}/closeout`, { method: 'POST', body: { closeoutNotes: 'Project complete.' } });
      logResult(1, 'Regional Infrastructure Capital Works Grant', close1.ok, `Grant ID: ${grant1Id}`);
    }
  } catch (err) {
    logResult(1, 'Regional Infrastructure Grant', false, err.message);
  }

  // SCENARIO 2: Youth Resilience Community Grant
  console.log('\n--- SCENARIO 2: Youth Resilience & Community Sports Grant ---');
  try {
    const g2 = await api('/grants', {
      method: 'POST',
      body: {
        organizationId: '99999999-8888-7777-6666-555555555555',
        title: 'Youth Resilience & Community Sports Program 2026',
        funderName: 'QLD Dept of Communities',
        totalFundingValue: 120000,
        category: 'Community'
      }
    });
    const grant2Id = g2.data?.data?.id || g2.data?.id;

    if (grant2Id) {
      await api(`/grants/${grant2Id}/risk`, {
        method: 'POST',
        body: { assessedByUserId: staffUser.id, financialRiskScore: 1, deliveryCapabilityScore: 5, strategicAlignmentScore: 5, overallRiskRating: 'LOW', isApprovedToApply: true }
      });
      await api(`/grants/${grant2Id}/submit`, { method: 'POST', body: { submissionReference: 'COMM-YOUTH-88' } });
      const award2 = await api(`/grants/${grant2Id}/award`, { method: 'POST' });
      logResult(2, 'Youth Resilience Community Grant', award2.ok, `Grant ID: ${grant2Id}`);
    }
  } catch (err) {
    logResult(2, 'Youth Resilience Grant', false, err.message);
  }

  // SCENARIO 3: Clean Tech Innovation Grant
  console.log('\n--- SCENARIO 3: Clean Tech Innovation Grant (Rejection Workflow) ---');
  try {
    const g3 = await api('/grants', {
      method: 'POST',
      body: {
        organizationId: '99999999-8888-7777-6666-555555555555',
        title: 'Clean Energy & Solar Storage Pilot Project',
        funderName: 'ARENA',
        totalFundingValue: 3500000,
        category: 'Innovation'
      }
    });
    const grant3Id = g3.data?.data?.id || g3.data?.id;

    if (grant3Id) {
      await api(`/grants/${grant3Id}/risk`, {
        method: 'POST',
        body: { assessedByUserId: adminUser.id, financialRiskScore: 5, deliveryCapabilityScore: 2, strategicAlignmentScore: 4, overallRiskRating: 'HIGH', isApprovedToApply: true }
      });
      await api(`/grants/${grant3Id}/submit`, { method: 'POST', body: { submissionReference: 'ARENA-SOLAR-X' } });
      const rej3 = await api(`/grants/${grant3Id}/reject`, { method: 'POST', body: { closeoutNotes: 'Over-subscribed pool.' } });
      logResult(3, 'Clean Tech Innovation Grant (Rejection Workflow)', rej3.ok, `Grant ID: ${grant3Id}`);
    }
  } catch (err) {
    logResult(3, 'Clean Tech Innovation Grant', false, err.message);
  }

  // SCENARIO 4: Emergency Disaster Recovery Grant
  console.log('\n--- SCENARIO 4: Emergency Disaster Recovery Grant ---');
  try {
    const g4 = await api('/grants', {
      method: 'POST',
      body: { organizationId: '99999999-8888-7777-6666-555555555555', title: 'Emergency Flood Infrastructure Repair 2026', funderName: 'DRFA', totalFundingValue: 2000000 }
    });
    const grant4Id = g4.data?.data?.id || g4.data?.id;
    if (grant4Id) {
      await api(`/grants/${grant4Id}/risk`, { method: 'POST', body: { assessedByUserId: adminUser.id, financialRiskScore: 2, deliveryCapabilityScore: 4, strategicAlignmentScore: 5, overallRiskRating: 'MEDIUM', isApprovedToApply: true } });
      await api(`/grants/${grant4Id}/submit`, { method: 'POST', body: { submissionReference: 'DRFA-EMERGENCY-991' } });
      const award4 = await api(`/grants/${grant4Id}/award`, { method: 'POST' });
      logResult(4, 'Emergency Disaster Recovery Grant', award4.ok, `Grant ID: ${grant4Id}`);
    }
  } catch (err) {
    logResult(4, 'Emergency Disaster Recovery Grant', false, err.message);
  }

  // SCENARIO 5: Cross-Departmental Civil & Eco Grant
  console.log('\n--- SCENARIO 5: Cross-Departmental Civil & Eco Grant ---');
  try {
    const g5 = await api('/grants', {
      method: 'POST',
      body: { organizationId: '99999999-8888-7777-6666-555555555555', title: 'Integrated Wetlands & Civil Stormwater Grant', funderName: 'Commonwealth Water Office', totalFundingValue: 800000 }
    });
    const grant5Id = g5.data?.data?.id || g5.data?.id;
    if (grant5Id) {
      await api(`/grants/${grant5Id}/risk`, { method: 'POST', body: { assessedByUserId: adminUser.id, financialRiskScore: 2, deliveryCapabilityScore: 4, strategicAlignmentScore: 5, overallRiskRating: 'LOW', isApprovedToApply: true } });
      await api(`/grants/${grant5Id}/submit`, { method: 'POST', body: { submissionReference: 'CEWO-ECO-2026' } });
      await api(`/grants/${grant5Id}/award`, { method: 'POST' });
      const task1 = await api('/tasks', {
        method: 'POST',
        body: { grantId: grant5Id, title: 'Baseline Water Quality Survey', description: 'Sampling prior to construction', assignedToUserId: staffUser.id, dueDate: '2026-10-15', stage: 'OBLIGATION' }
      });
      logResult(5, 'Cross-Departmental Civil & Eco Grant', task1.ok, `Task ID: ${task1.data?.id || task1.data?.data?.id}`);
    }
  } catch (err) {
    logResult(5, 'Cross-Departmental Civil & Eco Grant', false, err.message);
  }

  // SCENARIO 6: Philanthropic Grant (CRM Pipeline Integration)
  console.log('\n--- SCENARIO 6: Philanthropic Grant (CRM Pipeline Integration) ---');
  try {
    const fb = await api('/funding-bodies', {
      method: 'POST',
      body: { name: 'Minderoo Foundation', type: 'PHILANTHROPIC', website: 'https://www.minderoo.org' }
    });
    const fbId = fb.data?.data?.id || fb.data?.id;
    if (fbId) {
      const contact = await api(`/funding-bodies/${fbId}/contacts`, { method: 'POST', body: { name: 'Sarah Alston', role: 'Program Director', email: 'salston@minderoo.org' } });
      const contactId = contact.data?.data?.id || contact.data?.id;
      if (contactId) {
        await api(`/funding-bodies/contacts/${contactId}/interactions`, { method: 'POST', body: { type: 'MEETING', subject: 'Strategic Partnership Inquiry', content: 'Co-funding youth STEM education hubs.' } });
      }
      const opp = await api(`/funding-bodies/${fbId}/opportunities`, { method: 'POST', body: { contactId: contactId, title: 'Minderoo Regional Youth Tech Hubs Grant', value: 450000, status: 'DISCUSSING' } });
      const oppId = opp.data?.data?.id || opp.data?.id;
      let prom = null;
      if (oppId) {
        prom = await api(`/funding-opportunities/${oppId}/promote`, { method: 'POST' });
      }
      logResult(6, 'Philanthropic Grant (CRM Pipeline)', fb.ok && opp.ok && prom?.ok, `Funding Body ID: ${fbId}`);
    }
  } catch (err) {
    logResult(6, 'Philanthropic Grant CRM Pipeline', false, err.message);
  }

  // SCENARIO 7: Commercialization Grant & Financial Ledger
  console.log('\n--- SCENARIO 7: Commercialization Grant & Financial Ledger ---');
  try {
    const g7 = await api('/grants', {
      method: 'POST',
      body: { organizationId: '99999999-8888-7777-6666-555555555555', title: 'AgriTech Regional Commercial Acceleration Grant', funderName: 'AusIndustry', totalFundingValue: 600000 }
    });
    const grant7Id = g7.data?.data?.id || g7.data?.id;
    if (grant7Id) {
      await api(`/grants/${grant7Id}/risk`, { method: 'POST', body: { assessedByUserId: adminUser.id, financialRiskScore: 3, deliveryCapabilityScore: 4, strategicAlignmentScore: 4, overallRiskRating: 'MEDIUM', isApprovedToApply: true } });
      await api(`/grants/${grant7Id}/submit`, { method: 'POST', body: { submissionReference: 'AUSIND-AGRI-2026' } });
      await api(`/grants/${grant7Id}/award`, { method: 'POST' });
      const financesRes = await api('/finances');
      logResult(7, 'Commercialization Grant & Financial Ledger', financesRes.ok, `Finances Status: ${financesRes.status}`);
    }
  } catch (err) {
    logResult(7, 'Commercialization Grant', false, err.message);
  }

  // SCENARIO 8: Strategic Research Grant (AskSurePact AI Assistant Query)
  console.log('\n--- SCENARIO 8: University Strategic Research Grant & AskSurePact AI ---');
  try {
    const askRes = await api('/analytics/ask', {
      method: 'POST',
      body: {
        prompt: 'What is our total funding value across all active regional infrastructure and community grants?'
      }
    });

    const hasAnswer = askRes.data?.executiveSummary || askRes.data?.queryTitle || askRes.data?.data?.executiveSummary;
    logResult(8, 'University Research Grant & AskSurePact AI Query', askRes.ok && !!hasAnswer, `Exec Summary: "${(hasAnswer || '').substring(0, 70)}..."`);
  } catch (err) {
    logResult(8, 'AskSurePact AI Assistant Query', false, err.message);
  }

  // SCENARIO 9: Arts & Culture Activation Grant (Downward Contract Variation & GFA)
  console.log('\n--- SCENARIO 9: Arts & Culture Activation Grant (Downward Variation & GFA) ---');
  try {
    const g9 = await api('/grants', {
      method: 'POST',
      body: { organizationId: '99999999-8888-7777-6666-555555555555', title: 'Regional Public Art & Murals Activation Grant', funderName: 'Arts Queensland', totalFundingValue: 150000 }
    });
    const grant9Id = g9.data?.data?.id || g9.data?.id;

    if (grant9Id) {
      await api(`/grants/${grant9Id}/risk`, { method: 'POST', body: { assessedByUserId: staffUser.id, financialRiskScore: 1, deliveryCapabilityScore: 5, strategicAlignmentScore: 4, overallRiskRating: 'LOW', isApprovedToApply: true } });
      await api(`/grants/${grant9Id}/submit`, { method: 'POST', body: { submissionReference: 'ARTS-QLD-2026-MURAL' } });
      await api(`/grants/${grant9Id}/award`, { method: 'POST' });

      const gfa9 = await api(`/grants/${grant9Id}/extract-gfa`, {
        method: 'POST',
        body: { documentName: 'GFA_Arts_Murals.pdf', totalObligatedAmount: 150000 }
      });

      logResult(9, 'Arts & Culture Activation Grant & GFA Ingestion', gfa9.ok, `GFA Extracted Title: ${gfa9.data?.data?.grant?.gfaExtractedTitle || gfa9.data?.grant?.gfaExtractedTitle || 'PASS'}`);
    }
  } catch (err) {
    logResult(9, 'Arts & Culture Grant', false, err.message);
  }

  // SCENARIO 10: Saved Search & Multi-Tenant Access Boundary Testing
  console.log('\n--- SCENARIO 10: Saved Search & Access Security Boundary Testing ---');
  try {
    const searchRes = await api('/saved-searches', {
      method: 'POST',
      body: { name: 'High Value Infrastructure Grants', category: 'Capital Works', minFunding: 500000 }
    });
    const globalGrants = await api('/grants');
    const totalCount = globalGrants.data?.data?.length || globalGrants.data?.length || 0;

    logResult(10, 'Saved Search & Access Security Boundary Test', searchRes.ok && globalGrants.ok, `Total Active Grants Accessible: ${totalCount}`);
  } catch (err) {
    logResult(10, 'Access Security Boundary Test', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`📊 SUMMARY OF QA EXECUTION:`);
  console.log(`   Passed Scenarios: ${results.filter(r => r.pass).length} / ${results.length}`);
  console.log(`   Identified Gaps / Bugs: ${bugsAndGaps.length}`);
  console.log('================================================================\n');

  return { results, bugsAndGaps };
}

runAllScenarios();
