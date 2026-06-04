-- Generalize Submission for all content types
ALTER TABLE "Submission" ADD COLUMN     "contentType" TEXT NOT NULL DEFAULT 'timeline';
ALTER TABLE "Submission" ADD COLUMN     "payload" JSONB;
ALTER TABLE "Submission" ADD COLUMN     "emailHash" TEXT;

-- CreateTable
CREATE TABLE "Contributor" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "displayName" TEXT,
    "redactedEmail" TEXT,
    "consentStoreEmail" BOOLEAN NOT NULL DEFAULT false,
    "consentListPublicly" BOOLEAN NOT NULL DEFAULT false,
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contributor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contributor_emailHash_key" ON "Contributor"("emailHash");
