-- CreateTable
CREATE TABLE "grants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "funderName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "totalFundingValue" REAL,
    "openDate" DATETIME,
    "closeDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'POTENTIAL',
    "rawScrapedData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT NOT NULL,
    "assessedByUserId" TEXT NOT NULL,
    "financialRiskScore" INTEGER NOT NULL,
    "deliveryCapabilityScore" INTEGER NOT NULL,
    "strategicAlignmentScore" INTEGER NOT NULL,
    "overallRiskRating" TEXT NOT NULL,
    "justificationNotes" TEXT,
    "isApprovedToApply" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_assessments_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grantId" TEXT NOT NULL,
    "fundingAgreementReference" TEXT,
    "executionDate" DATETIME,
    "totalObligatedAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contracts_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "isAcquitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "milestones_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "grants_sourceUrl_key" ON "grants"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "risk_assessments_grantId_key" ON "risk_assessments"("grantId");
