-- AlterTable
ALTER TABLE "grants" ADD COLUMN "amountRequested" REAL;
ALTER TABLE "grants" ADD COLUMN "category" TEXT;
ALTER TABLE "grants" ADD COLUMN "closeoutNotes" TEXT;
ALTER TABLE "grants" ADD COLUMN "guidelinesDocName" TEXT;
ALTER TABLE "grants" ADD COLUMN "guidelinesExtractedTitle" TEXT;
ALTER TABLE "grants" ADD COLUMN "guidelinesResponseDocs" TEXT;

-- CreateTable
CREATE TABLE "installments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "installments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "minFunding" REAL,
    "maxFunding" REAL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "funding_bodies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "funding_body_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fundingBodyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "funding_body_contacts_fundingBodyId_fkey" FOREIGN KEY ("fundingBodyId") REFERENCES "funding_bodies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contact_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contact_interactions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "funding_body_contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "funding_opportunities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fundingBodyId" TEXT NOT NULL,
    "contactId" TEXT,
    "title" TEXT NOT NULL,
    "value" REAL,
    "status" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "description" TEXT,
    "deadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "funding_opportunities_fundingBodyId_fkey" FOREIGN KEY ("fundingBodyId") REFERENCES "funding_bodies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "funding_opportunities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "funding_body_contacts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_milestone_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "milestoneId" TEXT,
    "grantId" TEXT,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedToUserId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stage" TEXT NOT NULL DEFAULT 'OBLIGATION',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "milestone_tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "milestone_tasks_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "milestone_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "milestone_tasks_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_milestone_tasks" ("assignedToUserId", "completedAt", "createdAt", "description", "dueDate", "id", "milestoneId", "status", "title") SELECT "assignedToUserId", "completedAt", "createdAt", "description", "dueDate", "id", "milestoneId", "status", "title" FROM "milestone_tasks";
DROP TABLE "milestone_tasks";
ALTER TABLE "new_milestone_tasks" RENAME TO "milestone_tasks";
CREATE TABLE "new_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME NOT NULL,
    "isAcquitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT,
    CONSTRAINT "milestones_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_milestones" ("contractId", "createdAt", "description", "dueDate", "id", "isAcquitted", "title") SELECT "contractId", "createdAt", "description", "dueDate", "id", "isAcquitted", "title" FROM "milestones";
DROP TABLE "milestones";
ALTER TABLE "new_milestones" RENAME TO "milestones";
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'POTENTIAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "budgetAmount" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_projects" ("createdAt", "department", "description", "id", "name", "status") SELECT "createdAt", "department", "description", "id", "name", "status" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
