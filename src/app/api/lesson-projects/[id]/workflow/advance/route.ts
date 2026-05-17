import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { AgentTaskStatus, WorkflowEventType } from "@prisma/client";
import { databaseUnavailableResponse } from "@/lib/api-errors";
import { getCurrentTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dispatchToolCall, markAgentTaskStatus, persistValidatedEnvelope, writeWorkflowEvent } from "@/lib/orchestration/dispatcher";
import { buildValidatedHandoff } from "@/lib/orchestration/dispatcher";
import { callProvider } from "@/lib/orchestration/provider";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const teacherId = getCurrentTeacherId();
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

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

    const latestTask = await prisma.agentTask.findFirst({
      where: {
        lessonProjectId: project.id,
        agentName: "project-manager"
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!latestTask) {
      return NextResponse.json({ error: "Project Manager has not been started." }, { status: 409 });
    }

    const toolId = String(body?.toolId ?? "");
    const inputJson = (body?.inputJson ?? {}) as Record<string, unknown>;

    const toolCall = await dispatchToolCall({
      lessonProjectId: project.id,
      agentTaskId: latestTask.id,
      agentId: "project-manager",
      toolId,
      inputJson
    });

    const providerResult = await callProvider({
      messages: [
        {
          role: "system",
          content: "You are Project Manager. Return concise JSON only."
        },
        {
          role: "user",
          content: JSON.stringify({
            projectId: project.id,
            agentTaskId: latestTask.id,
            toolCall
          })
        }
      ]
    });

    const envelope = await persistValidatedEnvelope({
      agentName: "project-manager",
      taskId: latestTask.id,
      handoff: {
        agentName: "project-manager",
        taskId: latestTask.id,
        status: "completed",
        summary: providerResult.content.trim() || "Project Manager advanced one step.",
        artifacts: [],
        sourceReferences: [],
        warnings: [],
        toolCalls: [toolCall],
        nextActions: []
      }
    });

    const handoff = buildValidatedHandoff(
      envelope.handoff ?? {
        agentName: "project-manager",
        taskId: latestTask.id,
        status: "completed",
        summary: "Project Manager advanced one step.",
        artifacts: [],
        sourceReferences: [],
        warnings: [],
        toolCalls: [toolCall],
        nextActions: []
      }
    );

    await markAgentTaskStatus(latestTask.id, AgentTaskStatus.COMPLETED);

    await writeWorkflowEvent({
      lessonProjectId: project.id,
      agentTaskId: latestTask.id,
      eventType: WorkflowEventType.AGENT_COMPLETED,
      message: handoff.summary,
      teacherVisible: true,
      metadata: {
        handoff: JSON.parse(JSON.stringify(handoff)) as Prisma.InputJsonObject,
        toolCall: JSON.parse(JSON.stringify(toolCall)) as Prisma.InputJsonObject,
        providerResult: JSON.parse(JSON.stringify(providerResult)) as Prisma.InputJsonObject
      } as Prisma.InputJsonObject
    });

    return NextResponse.json({
      handoff,
      toolCall
    });
  } catch (error) {
    return databaseUnavailableResponse(error);
  }
}
