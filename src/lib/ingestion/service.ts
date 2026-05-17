import { Prisma, ParseStatus, ProjectStatus, SourceType, WorkflowEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseSourceInput } from "@/lib/ingestion/parser";
import { deleteStoredUpload, storeUploadFile } from "@/lib/ingestion/storage";
import { IngestionInputType, SourceUploadResult } from "@/lib/ingestion/types";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);

function toSourceType(inputType: IngestionInputType) {
  if (inputType === "TEXT") {
    return SourceType.TEXT;
  }

  if (inputType === "PDF") {
    return SourceType.PDF;
  }

  return SourceType.PPTX;
}

function getUploadErrorResponse(message: string, status = 400, issues?: unknown) {
  return Response.json(
    {
      error: message,
      issues
    },
    { status }
  );
}

export function validateUploadFile(file: File, inputType: IngestionInputType) {
  if (file.size > MAX_UPLOAD_BYTES) {
    return getUploadErrorResponse("Uploaded file exceeds 25MB limit.", 413);
  }

  if (inputType === "PDF" && file.type !== "application/pdf") {
    return getUploadErrorResponse("Only PDF files are accepted for PDF uploads.");
  }

  if (
    inputType === "PPTX" &&
    file.type !== "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return getUploadErrorResponse("Only .pptx files are accepted for PPTX uploads.");
  }

  if (inputType !== "TEXT" && !ALLOWED_MIME_TYPES.has(file.type)) {
    return getUploadErrorResponse("Unsupported file type.");
  }

  return null;
}

export async function ingestSourceDocument(options: {
  lessonProjectId: string;
  inputType: IngestionInputType;
  rawText?: string;
  file?: File;
}) : Promise<Response | SourceUploadResult> {
  const { lessonProjectId, inputType } = options;

  const project = await prisma.lessonProject.findUnique({
    where: {
      id: lessonProjectId
    },
    select: {
      id: true,
      teacherId: true
    }
  });

  if (!project) {
    return getUploadErrorResponse("Lesson project not found.", 404);
  }

  let storedFile: Awaited<ReturnType<typeof storeUploadFile>> | null = null;
  let fileBuffer: Buffer | undefined;
  let sourceDocumentId: string | null = null;

  try {
    if (inputType !== "TEXT") {
      if (!options.file) {
        return getUploadErrorResponse("File is required for PDF/PPTX uploads.");
      }

      const fileValidationError = validateUploadFile(options.file, inputType);
      if (fileValidationError) {
        return fileValidationError;
      }

      fileBuffer = Buffer.from(await options.file.arrayBuffer());
      storedFile = await storeUploadFile(options.file.name, fileBuffer);
    }

    const sourceDocument = await prisma.sourceDocument.create({
      data: {
        lessonProjectId,
        type: toSourceType(inputType),
        fileUrl: storedFile?.relativePath ?? null,
        rawText: options.rawText?.trim() || null,
        parseStatus: ParseStatus.PENDING,
        parseWarnings: []
      }
    });

    sourceDocumentId = sourceDocument.id;

    await prisma.workflowEvent.create({
      data: {
        lessonProjectId,
        eventType: WorkflowEventType.SOURCE_ADDED,
        message: `Source document ${sourceDocument.id} added.`,
        teacherVisible: true,
        metadata: {
          sourceDocumentId: sourceDocument.id,
          inputType
        } as Prisma.InputJsonObject
      }
    });

    await prisma.workflowEvent.create({
      data: {
        lessonProjectId,
        eventType: WorkflowEventType.SYSTEM_INFO,
        message: "Source parsing started.",
        teacherVisible: true,
        metadata: {
          sourceDocumentId: sourceDocument.id,
          status: "PENDING"
        } as Prisma.InputJsonObject
      }
    });

    const parsed = await parseSourceInput(inputType, options.rawText ?? "", fileBuffer);

    const normalizedWarnings = Array.from(new Set(parsed.warnings));

    const updatedSourceDocument = await prisma.sourceDocument.update({
      where: {
        id: sourceDocument.id
      },
      data: {
        rawText: parsed.rawText,
        parseStatus: parsed.chunks.length ? ParseStatus.PARSED : ParseStatus.FAILED,
        parseWarnings: normalizedWarnings
      }
    });

    await prisma.sourceMapChunk.createMany({
      data: parsed.chunks.map((chunk) => ({
        sourceDocumentId: updatedSourceDocument.id,
        chunkId: chunk.chunkId,
        pageNumber: chunk.pageNumber,
        slideNumber: chunk.slideNumber,
        sectionTitle: chunk.sectionTitle,
        text: chunk.text,
        metadata: chunk.metadata as Prisma.InputJsonObject
      }))
    });

    await prisma.lessonProject.update({
      where: {
        id: lessonProjectId
      },
      data: {
        status: ProjectStatus.UPLOADED
      }
    });

    await prisma.workflowEvent.create({
      data: {
        lessonProjectId,
        eventType: normalizedWarnings.length ? WorkflowEventType.REVIEW_WARNING : WorkflowEventType.AGENT_COMPLETED,
        message: normalizedWarnings.length
          ? "Source parsing completed with warnings."
          : "Source parsing completed.",
        teacherVisible: true,
        metadata: {
          sourceDocumentId: updatedSourceDocument.id,
          chunkCount: parsed.chunks.length,
          warnings: normalizedWarnings
        } as Prisma.InputJsonObject
      }
    });

    return {
      sourceDocumentId: updatedSourceDocument.id,
      parseStatus: parsed.chunks.length ? "PARSED" : "FAILED",
      warnings: normalizedWarnings,
      chunkCount: parsed.chunks.length
    };
  } catch (error) {
    if (sourceDocumentId) {
      await prisma.sourceDocument.update({
        where: { id: sourceDocumentId },
        data: {
          parseStatus: ParseStatus.FAILED,
          parseWarnings: [error instanceof Error ? error.message : "Unknown ingestion error."]
        }
      }).catch(() => undefined);
    }

    if (storedFile) {
      await deleteStoredUpload(storedFile.relativePath).catch(() => undefined);
    }

    await prisma.workflowEvent.create({
      data: {
        lessonProjectId,
        eventType: WorkflowEventType.AGENT_FAILED,
        message: `Source parsing failed: ${error instanceof Error ? error.message : "Unknown error"}.`,
        teacherVisible: true,
        metadata: {
          inputType,
          sourceDocumentId
        } as Prisma.InputJsonObject
      }
    }).catch(() => undefined);

    throw error;
  }
}
