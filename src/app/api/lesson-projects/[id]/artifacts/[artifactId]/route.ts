import { NextResponse } from "next/server";
import { Prisma, ReviewStatus, WorkflowEventType } from "@prisma/client";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateArtifactSchema } from "@/lib/schemas/teacher-review";

type RouteContext = {
  params: Promise<{
    id: string;
    artifactId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id, artifactId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateArtifactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid artifact update payload." }, { status: 400 });
  }

  try {
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

    const existingArtifact = await prisma.artifact.findFirst({
      where: {
        id: artifactId,
        lessonProjectId: project.id
      }
    });

    if (!existingArtifact) {
      return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
    }

    const artifact = await prisma.artifact.update({
      where: {
        id: artifactId
      },
      data: {
        contentJson: parsed.data.contentJson as Prisma.InputJsonValue,
        reviewStatus: ReviewStatus.NEEDS_REVISION,
        version: {
          increment: 1
        }
      }
    });

    await prisma.workflowEvent.create({
      data: {
        lessonProjectId: project.id,
        eventType: WorkflowEventType.TEACHER_ACTION,
        message: `Teacher edited ${artifact.type}.`,
        teacherVisible: true,
        metadata: {
          artifactId: artifact.id,
          artifactType: artifact.type,
          version: artifact.version,
          note: parsed.data.note ?? null
        }
      }
    });

    return NextResponse.json({ artifact });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
