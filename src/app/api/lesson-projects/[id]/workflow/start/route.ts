import { NextResponse } from "next/server";
import { AgentTaskStatus, WorkflowEventType } from "@prisma/client";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createInitialWorkflowState } from "@/lib/orchestration/runtime";
import { markAgentTaskStatus, writeWorkflowEvent } from "@/lib/orchestration/dispatcher";

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
        id: true,
        sourceDocuments: {
          select: {
            id: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Lesson project not found." }, { status: 404 });
    }

    const task = await prisma.agentTask.create({
      data: {
        lessonProjectId: project.id,
        agentName: "project-manager",
        status: AgentTaskStatus.QUEUED,
        inputArtifactIds: [],
        outputArtifactIds: [],
        warnings: []
      }
    });

    await writeWorkflowEvent({
      lessonProjectId: project.id,
      agentTaskId: task.id,
      eventType: WorkflowEventType.AGENT_QUEUED,
      message: "Project Manager workflow started.",
      teacherVisible: true,
      metadata: {
        agentId: "project-manager",
        sourceDocumentCount: project.sourceDocuments.length
      }
    });

    await markAgentTaskStatus(task.id, AgentTaskStatus.RUNNING);

    return NextResponse.json(
      {
        workflowState: {
          ...createInitialWorkflowState(project.id),
          currentAgent: "project-manager",
          currentTaskId: task.id,
          taskStatuses: {
            [task.id]: "running"
          }
        },
        taskId: task.id
      },
      { status: 201 }
    );
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
