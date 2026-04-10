import { z } from "zod"

export const contentStatusSchema = z.enum(["DRAFT", "PUBLISHED"])

export const featureLabelSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  groupName: z.string().optional(),
  status: contentStatusSchema.default("DRAFT"),
})

export const featurePhraseSchema = z.object({
  slug: z.string().min(1),
  phrase: z.string().min(1),
  notes: z.string().optional(),
  status: contentStatusSchema.default("DRAFT"),
  featureLabelId: z.string().min(1),
})

export const clinicalTestCaseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  presentationBlock: z.string().min(1),
  vignette: z.string().min(1),
  expectedLeadDiagnosis: z.string().optional(),
  expectedPresentationBlock: z.string().optional(),
  notes: z.string().optional(),
  status: contentStatusSchema.default("DRAFT"),
  expectedFeatureSlugs: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((value) => {
      if (Array.isArray(value)) {
        return value
      }

      if (!value) {
        return []
      }

      return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    }),
})
