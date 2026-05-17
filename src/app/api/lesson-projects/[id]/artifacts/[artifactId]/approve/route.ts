import { NextResponse } from "next/server";
import { ReviewStatus, WorkflowEventType } from "@prisma/client";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { approveArtifactSchema } from "@/lib/schemas/teacher-review";

type RouteContext = {
  params: Promise<{
    id: string;
    artifactId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id, artifactId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = approveArtifactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid artifact approval payload." }, { status: 400 });
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
        reviewStatus: ReviewStatus.APPROVED
      }
    });

    await prisma.workflowEvent.create({
      data: {
        lessonProjectId: project.id,
        eventType: WorkflowEventType.TEACHER_ACTION,
        message: `Teacher approved ${artifact.type}.`,
        teacherVisible: true,
        metadata: {
          artifactId: artifact.id,
          artifactType: artifact.type,
          note: parsed.data.note ?? null
        }
      }
    });

    return NextResponse.json({ artifact });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
