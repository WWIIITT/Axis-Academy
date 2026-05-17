import { ArtifactType } from "@prisma/client";
import { z } from "zod";

const jsonValueSchema: z.ZodType<
  string | number | boolean | null | Record<string, unknown> | unknown[]
> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema)
  ])
);

export const updateArtifactSchema = z.object({
  contentJson: jsonValueSchema,
  note: z.string().trim().max(500).optional()
});

export const approveArtifactSchema = z.object({
  note: z.string().trim().max(500).optional()
});

export const regenerateRequestSchema = z.object({
  artifactId: z.string().trim().min(1).optional(),
  artifactType: z.nativeEnum(ArtifactType).optional(),
  sectionLabel: z.string().trim().min(1).max(160),
  reason: z.string().trim().min(1).max(1000)
});

export const finalAcceptanceSchema = z.object({
  note: z.string().trim().max(500).optional()
});
