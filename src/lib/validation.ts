import { WorkflowEventType } from "@prisma/client";
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

export const createLessonProjectSchema = z.object({
  title: z.string().trim().min(2).max(160),
  subject: z.string().trim().max(80).optional(),
  gradeLevel: z.string().trim().max(80).optional()
});

export const createWorkflowEventSchema = z.object({
  eventType: z.nativeEnum(WorkflowEventType).default(WorkflowEventType.SYSTEM_INFO),
  message: z.string().trim().min(1).max(500),
  teacherVisible: z.boolean().default(true),
  metadata: z.record(jsonValueSchema).default({})
});
