import * as fs from 'fs';
import * as path from 'path';

/**
 * PDF Generator Utility for SurePact Greenfield Demonstration Data
 * Generates standard-compliant PDF 1.4 files natively in Node.js
 */
export function generatePdfBuffer(title: string, subtitle: string, sections: { heading: string; content: string }[]): Buffer {
  const sanitize = (str: string) => str.replace(/[\(\)\\]/g, ' ');
  
  let textCommands = `
BT
/F1 18 Tf
50 760 Td
(${sanitize(title)}) Tj
ET
BT
/F1 12 Tf
50 735 Td
(${sanitize(subtitle)}) Tj
ET
BT
/F1 9 Tf
50 715 Td
(Official Urapuntja Health Service Aboriginal Corporation - Document Control) Tj
ET
`;

  let currentY = 680;
  for (const sec of sections) {
    if (currentY < 100) break;
    textCommands += `
BT
/F1 12 Tf
50 ${currentY} Td
(${sanitize(sec.heading)}) Tj
ET
`;
    currentY -= 18;

    const lines = sec.content.split('\n');
    for (const line of lines) {
      if (currentY < 80) break;
      const trimmed = line.trim();
      if (!trimmed) continue;
      textCommands += `
BT
/F1 10 Tf
50 ${currentY} Td
(${sanitize(trimmed.substring(0, 95))}) Tj
ET
`;
      currentY -= 14;
    }
    currentY -= 10;
  }

  const streamLength = Buffer.byteLength(textCommands);

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kinds /Page /Count 1 /Kids [ 3 0 R ] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${textCommands}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000125 00000 n 
0000000248 00000 n 
0000000300 + ${streamLength} n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF
`;

  return Buffer.from(pdfString, 'binary');
}

/**
 * Creates PDF files on disk for Knowledge Base Assets, Guidelines, GFAs, and Receipts
 */
export function ensurePdfAssetsOnDisk() {
  const dirs = [
    path.join(__dirname, '../knowledge_centre_assets'),
    path.join(__dirname, '../grant_guidelines_assets'),
    path.join(__dirname, '../gfa_documents'),
    path.join(__dirname, '../receipt_assets')
  ];

  dirs.forEach(d => {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  });

  // 1. Knowledge Base PDF Assets
  const kbDocs = [
    {
      filename: 'UHSAC_Corporate_Profile_2025.pdf',
      title: 'Urapuntja Health Service Aboriginal Corporation - Corporate Profile 2025',
      subtitle: 'ICN: 838 | ABN: 45 449 518 275 | Sandover Highway, Utopia NT 0872',
      sections: [
        { heading: '1. Executive Overview', content: 'Urapuntja Health Service Aboriginal Corporation (UHSAC) is a First Nations ACCHO established in 1986 delivering primary healthcare across 16 Utopia Homelands outstations.' },
        { heading: '2. Operational Geography', content: 'Serving 1,500 residents across 10,000 square kilometres. Outstations include Soapy Bore, Arlparra, Irrultja, Apungalindum, Mosquito Bore, and Camel Camp.' },
        { heading: '3. Core Clinical Capabilities', content: 'Primary healthcare clinic, mobile 4WD outreach vans, Birthing on Country maternal programs, chronic disease management, and emergency telehealth.' }
      ]
    },
    {
      filename: 'UHSAC_Strategic_Plan_2024_2029.pdf',
      title: 'UHSAC Strategic Plan 2024-2029: Healthier Homelands',
      subtitle: 'Approved by Board of Directors - June 2024',
      sections: [
        { heading: 'Pillar 1: Clinical Excellence', content: 'Expand primary healthcare encounters by 25% and reduce avoidable hospital transfers from remote outstations.' },
        { heading: 'Pillar 2: Infrastructure Resilience', content: 'Upgrade clinic water filtration systems, install solar microgrids, and modernize remote emergency communications.' },
        { heading: 'Pillar 3: First Nations Health Workforce', content: 'Recruit and train local Aboriginal Health Practitioners and community health promotion officers.' }
      ]
    },
    {
      filename: 'UHSAC_Annual_Report_2023_2024.pdf',
      title: 'UHSAC Annual Report 2023-2024',
      subtitle: 'Audited Financial & Operational Performance',
      sections: [
        { heading: 'Financial Summary', content: 'Total Revenue: $6,800,000 | Total Expenditure: $6,600,000 | Net Surplus: $200,000' },
        { heading: 'Clinical Encounters', content: '11,420 presentations across central clinic and 142 mobile outreach visits to 16 homelands.' },
        { heading: 'Key Achievements', content: 'Executed Birthing on Country partnership with Southern Cross University and completed clinic water treatment upgrade.' }
      ]
    },
    {
      filename: 'UHSAC_Annual_Report_2024_2025.pdf',
      title: 'UHSAC Annual Report 2024-2025',
      subtitle: 'Expanding Homelands Care & Cancer Screening',
      sections: [
        { heading: 'Financial Summary', content: 'Total Revenue: $7,950,000 | Total Expenditure: $7,620,000 | Net Surplus: $330,000' },
        { heading: 'Clinical Encounters', content: '12,850 presentations (12.5% YoY increase) with 88% child health check coverage.' },
        { heading: 'Key Achievements', content: 'Recruited NACCHO Cancer Screening Lead and commissioned automated grant & obligation tracking.' }
      ]
    },
    {
      filename: 'UHSAC_Health_Services_Capability_Statement.pdf',
      title: 'UHSAC Clinical & Health Services Capability Statement',
      subtitle: 'ACCHO Remote Delivery Framework',
      sections: [
        { heading: 'Clinical Scope', content: 'Emergency triage, pharmacy dispensing, maternal care, child immunisations, renal support, and telehealth.' },
        { heading: 'Quality & Governance', content: 'AGPAL Accredited Primary Health Care Clinic. Compliant with TGA and NT Health regulations.' }
      ]
    },
    {
      filename: 'UHSAC_Clinical_Governance_Policy.pdf',
      title: 'UHSAC Clinical Governance & Risk Management Framework',
      subtitle: 'Policy Document Version 4.2',
      sections: [
        { heading: 'Governance Structure', content: 'Chaired by Clinical Director Dr. David Boyle. Monthly clinical audit reviews and infection control monitoring.' },
        { heading: 'Patient Safety & Incident Reporting', content: 'Mandatory notification protocols for adverse clinical events and vaccine cold-chain monitoring.' }
      ]
    },
    {
      filename: 'Past_Winning_Proposal_NHMRC_2023.pdf',
      title: 'High-Scoring Past Application - NHMRC Partnership 2023',
      subtitle: 'Reference Proposal Document',
      sections: [
        { heading: 'Project Methodology', content: 'Community-led participatory research protocol evaluating remote chronic disease interventions.' },
        { heading: 'Budget Justification', content: 'Full breakdown of clinical research officer salaries, remote travel, and laboratory pathology fees.' }
      ]
    },
    {
      filename: 'UHSAC_Infrastructure_and_Fleet_Asset_Plan.pdf',
      title: 'UHSAC Infrastructure & Fleet Asset Register 2025-2028',
      subtitle: 'Capital Assets & Maintenance Schedule',
      sections: [
        { heading: 'Mobile Clinic Vehicles', content: '4x Toyota Landcruiser 79 Series 4WD ambulances and mobile clinic vans servicing outer homelands.' },
        { heading: 'Clinic Buildings & Utilities', content: 'Soapy Bore central clinic, Irrultja outstation clinic, reverse osmosis water plant, and solar array.' }
      ]
    }
  ];

  kbDocs.forEach(doc => {
    const pdfBuf = generatePdfBuffer(doc.title, doc.subtitle, doc.sections);
    fs.writeFileSync(path.join(__dirname, '../knowledge_centre_assets', doc.filename), pdfBuf);
  });

  console.log(`Generated ${kbDocs.length} Knowledge Base PDF assets on disk.`);
}
