import { z } from "zod";
import { educationLevelValues } from "@/lib/education-levels";

export const createLessonProjectSchema = z.object({
  title: z.string().trim().min(2).max(160),
  subject: z.string().trim().max(80).optional(),
  gradeLevel: z.enum([educationLevelValues[0], ...educationLevelValues.slice(1)]).optional()
});

export const createTextSourceSchema = z.object({
  type: z.literal("TEXT"),
  rawText: z.string().trim().min(1, "Text content is required.")
});

export const createSourceUploadQuerySchema = z.object({
  inputType: z.enum(["TEXT", "PDF", "PPTX"])
});
