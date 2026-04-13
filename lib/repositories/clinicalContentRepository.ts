import { Prisma } from "@prisma/client"
import { prisma } from "../prisma"

type ContentStatus = "DRAFT" | "PUBLISHED"

type FeatureLabelInput = {
  slug: string
  label: string
  description?: string
  groupName?: string
  status: ContentStatus
}

type FeaturePhraseInput = {
  slug: string
  phrase: string
  notes?: string
  status: ContentStatus
  featureLabelId: string
}

type TestCaseInput = {
  slug: string
  title: string
  presentationBlock: string
  vignette: string
  expectedLeadDiagnosis?: string
  expectedLeadDiagnosisSlug?: string
  expectedPresentationBlock?: string
  expectedRedFlagSlugs: string[]
  notes?: string
  status: ContentStatus
  expectedFeatureSlugs: string[]
}

type ClinicalTestCaseRunStatus = "PASS" | "PARTIAL" | "FAIL"

type ClinicalTestCaseRunResult = {
  status: ClinicalTestCaseRunStatus
  actualLeadDiagnosis: string | null
  actualTop3: string[]
  detectedFeatures: string[]
  detectedRedFlags: string[]
  missingExpectedFeatures: string[]
  missingExpectedRedFlags: string[]
  leadDiagnosisMatched: boolean
}

type RepositoryValidationError = Error & {
  statusCode?: number
  details?: unknown
}

function createValidationError(message: string, details?: unknown, statusCode = 400): RepositoryValidationError {
  const error = new Error(message) as RepositoryValidationError
  error.statusCode = statusCode
  error.details = details
  return error
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeFeatureToken(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
}

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeStatus(status?: string) {
  return status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"
}

async function ensureUniqueSlug(
  model: "featureLabel" | "featurePhrase" | "clinicalTestCase",
  slug: string,
  excludeId?: string,
) {
  const where = {
    slug,
    ...(excludeId ? { id: { not: excludeId } } : {}),
  }

  const existing =
    model === "featureLabel"
      ? await prisma.featureLabel.findFirst({ where, select: { id: true } })
      : model === "featurePhrase"
        ? await prisma.featurePhrase.findFirst({ where, select: { id: true } })
        : await prisma.clinicalTestCase.findFirst({ where, select: { id: true } })

  if (existing) {
    throw createValidationError(`Slug "${slug}" is already in use.`)
  }
}

async function ensureFeatureLabelExists(featureLabelId: string) {
  const label = await prisma.featureLabel.findUnique({
    where: { id: featureLabelId },
    select: { id: true },
  })

  if (!label) {
    throw createValidationError("Referenced feature label does not exist.")
  }
}

async function resolveExpectedFeatures(expectedFeatureSlugs: string[]) {
  const normalizedSlugs = Array.from(
    new Set(expectedFeatureSlugs.map((slug) => normalizeSlug(slug)).filter(Boolean)),
  )

  if (normalizedSlugs.length === 0) {
    return []
  }

  const labels = await prisma.featureLabel.findMany({
    where: { slug: { in: normalizedSlugs } },
    select: { id: true, slug: true },
  })

  const found = new Set(labels.map((label: { slug: string }) => label.slug))
  const missing = normalizedSlugs.filter((slug) => !found.has(slug))

  if (missing.length > 0) {
    throw createValidationError("One or more expected feature labels do not exist.", {
      missingFeatureSlugs: missing,
    })
  }

  return labels
}

function normalizeSlugList(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeSlug(value)).filter(Boolean)))
}

const featureLabelInclude = {
  _count: {
    select: {
      phrases: true,
      expectedBy: true,
    },
  },
}

const featurePhraseInclude = {
  featureLabel: {
    select: {
      id: true,
      slug: true,
      label: true,
    },
  },
}

const testCaseInclude = {
  expectedFeatures: {
    include: {
      featureLabel: {
        select: {
          id: true,
          slug: true,
          label: true,
        },
      },
    },
    orderBy: { createdAt: Prisma.SortOrder.asc },
  },
}

export async function listFeatureLabels() {
  return prisma.featureLabel.findMany({
    include: featureLabelInclude,
    orderBy: [{ status: "asc" }, { slug: "asc" }],
  })
}

export async function createFeatureLabel(input: FeatureLabelInput) {
  const slug = normalizeSlug(input.slug)
  await ensureUniqueSlug("featureLabel", slug)

  return prisma.featureLabel.create({
    data: {
      slug,
      label: input.label.trim(),
      description: normalizeOptionalText(input.description),
      groupName: normalizeOptionalText(input.groupName),
      status: normalizeStatus(input.status),
    },
    include: featureLabelInclude,
  })
}

export async function updateFeatureLabel(id: string, input: FeatureLabelInput) {
  const slug = normalizeSlug(input.slug)
  await ensureUniqueSlug("featureLabel", slug, id)

  return prisma.featureLabel.update({
    where: { id },
    data: {
      slug,
      label: input.label.trim(),
      description: normalizeOptionalText(input.description),
      groupName: normalizeOptionalText(input.groupName),
      status: normalizeStatus(input.status),
    },
    include: featureLabelInclude,
  })
}

export async function deleteFeatureLabel(id: string) {
  return prisma.featureLabel.delete({ where: { id } })
}

export async function listFeaturePhrases() {
  return prisma.featurePhrase.findMany({
    include: featurePhraseInclude,
    orderBy: [{ status: "asc" }, { slug: "asc" }],
  })
}

export async function createFeaturePhrase(input: FeaturePhraseInput) {
  const slug = normalizeSlug(input.slug)
  await ensureUniqueSlug("featurePhrase", slug)
  await ensureFeatureLabelExists(input.featureLabelId)

  return prisma.featurePhrase.create({
    data: {
      slug,
      phrase: input.phrase.trim(),
      notes: normalizeOptionalText(input.notes),
      status: normalizeStatus(input.status),
      featureLabelId: input.featureLabelId,
    },
    include: featurePhraseInclude,
  })
}

export async function updateFeaturePhrase(id: string, input: FeaturePhraseInput) {
  const slug = normalizeSlug(input.slug)
  await ensureUniqueSlug("featurePhrase", slug, id)
  await ensureFeatureLabelExists(input.featureLabelId)

  return prisma.featurePhrase.update({
    where: { id },
    data: {
      slug,
      phrase: input.phrase.trim(),
      notes: normalizeOptionalText(input.notes),
      status: normalizeStatus(input.status),
      featureLabelId: input.featureLabelId,
    },
    include: featurePhraseInclude,
  })
}

export async function deleteFeaturePhrase(id: string) {
  return prisma.featurePhrase.delete({ where: { id } })
}

export async function listClinicalTestCases() {
  return prisma.clinicalTestCase.findMany({
    include: testCaseInclude,
    orderBy: [{ status: "asc" }, { slug: "asc" }],
  })
}

export async function createClinicalTestCase(input: TestCaseInput) {
  const slug = normalizeSlug(input.slug)
  await ensureUniqueSlug("clinicalTestCase", slug)

  const expectedFeatures = await resolveExpectedFeatures(input.expectedFeatureSlugs)

  return prisma.clinicalTestCase.create({
    data: {
      slug,
      title: input.title.trim(),
      presentationBlock: input.presentationBlock.trim(),
      vignette: input.vignette.trim(),
      expectedLeadDiagnosis: normalizeOptionalText(input.expectedLeadDiagnosis),
      expectedLeadDiagnosisSlug: normalizeOptionalText(input.expectedLeadDiagnosisSlug)
        ? normalizeSlug(input.expectedLeadDiagnosisSlug as string)
        : undefined,
      expectedPresentationBlock: normalizeOptionalText(input.expectedPresentationBlock),
      expectedFeatureSlugsJson: JSON.stringify(
        Array.from(new Set(input.expectedFeatureSlugs.map((value) => normalizeFeatureToken(value)).filter(Boolean))),
      ),
      expectedRedFlagSlugsJson: JSON.stringify(normalizeSlugList(input.expectedRedFlagSlugs)),
      notes: normalizeOptionalText(input.notes),
      status: normalizeStatus(input.status),
      expectedFeatures: {
        create: expectedFeatures.map((featureLabel: { id: string }) => ({
          featureLabelId: featureLabel.id,
        })),
      },
    },
    include: testCaseInclude,
  })
}

export async function updateClinicalTestCase(id: string, input: TestCaseInput) {
  const slug = normalizeSlug(input.slug)
  await ensureUniqueSlug("clinicalTestCase", slug, id)
  const expectedFeatures = await resolveExpectedFeatures(input.expectedFeatureSlugs)

  return prisma.clinicalTestCase.update({
    where: { id },
    data: {
      slug,
      title: input.title.trim(),
      presentationBlock: input.presentationBlock.trim(),
      vignette: input.vignette.trim(),
      expectedLeadDiagnosis: normalizeOptionalText(input.expectedLeadDiagnosis),
      expectedLeadDiagnosisSlug: normalizeOptionalText(input.expectedLeadDiagnosisSlug)
        ? normalizeSlug(input.expectedLeadDiagnosisSlug as string)
        : undefined,
      expectedPresentationBlock: normalizeOptionalText(input.expectedPresentationBlock),
      expectedFeatureSlugsJson: JSON.stringify(
        Array.from(new Set(input.expectedFeatureSlugs.map((value) => normalizeFeatureToken(value)).filter(Boolean))),
      ),
      expectedRedFlagSlugsJson: JSON.stringify(normalizeSlugList(input.expectedRedFlagSlugs)),
      notes: normalizeOptionalText(input.notes),
      status: normalizeStatus(input.status),
      expectedFeatures: {
        deleteMany: {},
        create: expectedFeatures.map((featureLabel: { id: string }) => ({
          featureLabelId: featureLabel.id,
        })),
      },
    },
    include: testCaseInclude,
  })
}

export async function deleteClinicalTestCase(id: string) {
  return prisma.clinicalTestCase.delete({ where: { id } })
}

export async function getClinicalTestCaseForRun(id: string) {
  return prisma.clinicalTestCase.findUnique({
    where: { id },
    include: testCaseInclude,
  })
}

export async function saveClinicalTestCaseRunResult(
  id: string,
  runResult: ClinicalTestCaseRunResult,
) {
  return prisma.clinicalTestCase.update({
    where: { id },
    data: {
      lastRunAt: new Date(),
      lastRunStatus: runResult.status,
      lastRunResultJson: JSON.stringify(runResult),
    },
    include: testCaseInclude,
  })
}

export function getRepositoryErrorPayload(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { status: 400, body: { error: "Duplicate value violates a unique constraint." } }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return { status: 404, body: { error: "Record not found." } }
  }

  if (error instanceof Error && "statusCode" in error) {
    const typedError = error as RepositoryValidationError
    return {
      status: typedError.statusCode ?? 400,
      body: {
        error: typedError.message,
        details: typedError.details,
      },
    }
  }

  return { status: 500, body: { error: "Internal server error." } }
}
