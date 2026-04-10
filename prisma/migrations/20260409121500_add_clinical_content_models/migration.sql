-- CreateTable
CREATE TABLE "FeatureLabel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "groupName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FeaturePhrase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "featureLabelId" TEXT NOT NULL,
    CONSTRAINT "FeaturePhrase_featureLabelId_fkey" FOREIGN KEY ("featureLabelId") REFERENCES "FeatureLabel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClinicalTestCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "presentationBlock" TEXT NOT NULL,
    "vignette" TEXT NOT NULL,
    "expectedLeadDiagnosis" TEXT,
    "expectedPresentationBlock" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClinicalTestCaseFeature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "featureLabelId" TEXT NOT NULL,
    CONSTRAINT "ClinicalTestCaseFeature_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "ClinicalTestCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClinicalTestCaseFeature_featureLabelId_fkey" FOREIGN KEY ("featureLabelId") REFERENCES "FeatureLabel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FeatureLabel_slug_key" ON "FeatureLabel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturePhrase_slug_key" ON "FeaturePhrase"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturePhrase_featureLabelId_phrase_key" ON "FeaturePhrase"("featureLabelId", "phrase");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalTestCase_slug_key" ON "ClinicalTestCase"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalTestCaseFeature_testCaseId_featureLabelId_key" ON "ClinicalTestCaseFeature"("testCaseId", "featureLabelId");
