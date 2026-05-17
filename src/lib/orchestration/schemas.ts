import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const sourceReferenceSchema = z.object({
  sourceDocumentId: nonEmptyString,
  chunkId: nonEmptyString,
  note: z.string().trim().optional()
});

export const toolCallSchema = z.object({
  toolId: nonEmptyString,
  inputJson: z.record(z.unknown()),
  outputJson: z.record(z.unknown()).nullable(),
  status: z.enum(["queued", "running", "completed", "failed"]),
  errorMessage: z.string().trim().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable()
});

export const handoffSchema = z.object({
  agentName: nonEmptyString,
  taskId: nonEmptyString,
  status: z.enum(["completed", "needs_revision", "failed"]),
  summary: nonEmptyString,
  artifacts: z.array(nonEmptyString),
  sourceReferences: z.array(sourceReferenceSchema),
  warnings: z.array(nonEmptyString),
  toolCalls: z.array(toolCallSchema),
  nextActions: z.array(nonEmptyString)
});

export const reviewResultSchema = z.object({
  reviewerName: nonEmptyString,
  status: z.enum(["approved", "needs_revision", "blocked"]),
  summary: nonEmptyString,
  blockingIssues: z.array(nonEmptyString),
  warnings: z.array(nonEmptyString),
  rubricScores: z.record(z.number())
});

export const agentOutputEnvelopeSchema = z.object({
  agentName: nonEmptyString,
  taskId: nonEmptyString,
  handoff: handoffSchema.optional(),
  review: reviewResultSchema.optional()
});
