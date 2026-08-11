-- AlterTable
ALTER TABLE "grants" ADD COLUMN "dateSubmitted" DATETIME;
ALTER TABLE "grants" ADD COLUMN "gfaDocumentName" TEXT;
ALTER TABLE "grants" ADD COLUMN "gfaExtractedTitle" TEXT;
ALTER TABLE "grants" ADD COLUMN "submissionReference" TEXT;
