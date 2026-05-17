import { NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ingestSourceDocument, validateUploadFile } from "@/lib/ingestion/service";
import { createTextSourceSchema, createSourceUploadQuerySchema } from "@/lib/schemas/source-upload";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseInputType(formData: FormData) {
  const rawInputType = String(formData.get("inputType") ?? "").toUpperCase();
  const parsed = createSourceUploadQuerySchema.safeParse({ inputType: rawInputType });
  return parsed.success ? parsed.data.inputType : null;
}

export async function POST(request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id } = await context.params;
  const project = await prisma.lessonProject.findFirst({
    where: {
      id,
      teacherId
    },
    select: {
      id: true
    }
  });

  if (!project) {
    return NextResponse.json({ error: "Lesson project not found." }, { status: 404 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const inputType = parseInputType(formData);
      const file = formData.get("file");

      if (!inputType || inputType === "TEXT" || !(file instanceof File)) {
        return NextResponse.json(
          {
            error: "Invalid file upload payload."
          },
          { status: 400 }
        );
      }

      const validationError = validateUploadFile(file, inputType);
      if (validationError) {
        return validationError;
      }

      const result = await ingestSourceDocument({
        lessonProjectId: id,
        inputType,
        file
      });

      if (result instanceof Response) {
        return result;
      }

      return NextResponse.json({ sourceUpload: result }, { status: 201 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createTextSourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid text source payload.",
          issues: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const result = await ingestSourceDocument({
      lessonProjectId: id,
      inputType: "TEXT",
      rawText: parsed.data.rawText
    });

    if (result instanceof Response) {
      return result;
    }

    return NextResponse.json({ sourceUpload: result }, { status: 201 });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
