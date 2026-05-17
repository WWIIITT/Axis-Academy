import { NextResponse } from "next/server";
import { ArtifactType, ProjectStatus, ReviewStatus, WorkflowEventType } from "@prisma/client";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { finalAcceptanceSchema } from "@/lib/schemas/teacher-review";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const teacherReviewArtifactTypes: ArtifactType[] = [
  ArtifactType.LESSON_SUMMARY,
  ArtifactType.EXAMPLES,
  ArtifactType.QUESTIONS,
  ArtifactType.SLIDE_CONTENT
];

export async function POST(request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = finalAcceptanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid final acceptance payload." }, { status: 400 });
  }

  try {
    const project = await prisma.lessonProject.findFirst({
      where: {
        id,
        teacherId
      },
      include: {
        artifacts: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Lesson project not found." }, { status: 404 });
    }

    const missingTypes = teacherReviewArtifactTypes.filter(
      (artifactType) => !project.artifacts.some((artifact) => artifact.type === artifactType)
    );

    const unapprovedArtifacts = project.artifacts.filter(
      (artifact) =>
        teacherReviewArtifactTypes.includes(artifact.type) && artifact.reviewStatus !== ReviewStatus.APPROVED
    );

    const blockedReviewReports = project.artifacts.filter(
      (artifact) => artifact.type === ArtifactType.REVIEW_REPORT && artifact.reviewStatus === ReviewStatus.BLOCKED
    );

    if (missingTypes.length > 0 || unapprovedArtifacts.length > 0 || blockedReviewReports.length > 0) {
      return NextResponse.json(
        {
          error: "Project is not ready for final acceptance.",
          missingTypes,
          unapprovedArtifactIds: unapprovedArtifacts.map((artifact) => artifact.id),
          blockedReviewReportIds: blockedReviewReports.map((artifact) => artifact.id)
        },
        { status: 409 }
      );
    }

    const finalPackage = await prisma.artifact.create({
      data: {
        lessonProjectId: project.id,
        type: ArtifactType.FINAL_PACKAGE,
        contentJson: {
          acceptedArtifactIds: project.artifacts
            .filter((artifact) => teacherReviewArtifactTypes.includes(artifact.type))
            .map((artifact) => artifact.id),
          note: parsed.data.note ?? null
        },
        sourceReferences: [],
        reviewStatus: ReviewStatus.APPROVED,
        version: 1
      }
    });

    const updatedProject = await prisma.lessonProject.update({
      where: {
        id: project.id
      },
      data: {
        status: ProjectStatus.APPROVED
      }
    });

    await prisma.workflowEvent.create({
      data: {
        lessonProjectId: project.id,
        eventType: WorkflowEventType.TEACHER_ACTION,
        message: "Teacher completed final acceptance.",
        teacherVisible: true,
        metadata: {
          finalPackageArtifactId: finalPackage.id,
          note: parsed.data.note ?? null
        }
      }
    });

    return NextResponse.json({
      project: updatedProject,
      finalPackage
    });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
