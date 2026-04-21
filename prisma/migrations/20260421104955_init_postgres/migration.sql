-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "caseData" TEXT NOT NULL,
    "analysis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureLabel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "groupName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturePhrase" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "featureLabelId" TEXT NOT NULL,

    CONSTRAINT "FeaturePhrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalTestCase" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "presentationBlock" TEXT NOT NULL,
    "vignette" TEXT NOT NULL,
    "expectedLeadDiagnosis" TEXT,
    "expectedLeadDiagnosisSlug" TEXT,
    "expectedPresentationBlock" TEXT,
    "expectedFeatureSlugsJson" TEXT,
    "expectedRedFlagSlugsJson" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "lastRunResultJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalTestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalTestCaseFeature" (
    "id" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "featureLabelId" TEXT NOT NULL,

    CONSTRAINT "ClinicalTestCaseFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturePhrase" ADD CONSTRAINT "FeaturePhrase_featureLabelId_fkey" FOREIGN KEY ("featureLabelId") REFERENCES "FeatureLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTestCaseFeature" ADD CONSTRAINT "ClinicalTestCaseFeature_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "ClinicalTestCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTestCaseFeature" ADD CONSTRAINT "ClinicalTestCaseFeature_featureLabelId_fkey" FOREIGN KEY ("featureLabelId") REFERENCES "FeatureLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
