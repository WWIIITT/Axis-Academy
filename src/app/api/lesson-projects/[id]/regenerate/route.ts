import { NextResponse } from "next/server";
import { AgentTaskStatus, ProjectStatus, WorkflowEventType } from "@prisma/client";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { regenerateRequestSchema } from "@/lib/schemas/teacher-review";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = regenerateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid regeneration request payload." }, { status: 400 });
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

    if (parsed.data.artifactId) {
      const artifact = await prisma.artifact.findFirst({
        where: {
          id: parsed.data.artifactId,
          lessonProjectId: project.id
        },
        select: {
          id: true
        }
      });

      if (!artifact) {
        return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
      }
    }

    const task = await prisma.agentTask.create({
      data: {
        lessonProjectId: project.id,
        agentName: "project-manager",
        status: AgentTaskStatus.NEEDS_REVISION,
        inputArtifactIds: parsed.data.artifactId ? [parsed.data.artifactId] : [],
        outputArtifactIds: [],
        warnings: [parsed.data.reason]
      }
    });

    await prisma.lessonProject.update({
      where: {
        id: project.id
      },
      data: {
        status: ProjectStatus.PROCESSING
      }
    });

    await prisma.workflowEvent.create({
      data: {
        lessonProjectId: project.id,
        agentTaskId: task.id,
        eventType: WorkflowEventType.TEACHER_ACTION,
        message: `Teacher requested regeneration for ${parsed.data.sectionLabel}.`,
        teacherVisible: true,
        metadata: {
          artifactId: parsed.data.artifactId ?? null,
          artifactType: parsed.data.artifactType ?? null,
          sectionLabel: parsed.data.sectionLabel,
          reason: parsed.data.reason
        }
      }
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
