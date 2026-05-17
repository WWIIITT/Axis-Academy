import { NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startProjectManagerWorkflow } from "@/lib/orchestration/runtime";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id } = await context.params;

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

    const result = await startProjectManagerWorkflow(project.id);

    return NextResponse.json(
      {
        workflowState: result.workflowState,
        workflowEventIds: result.workflowEventIds,
        taskId: result.taskId
      },
      { status: 201 }
    );
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
