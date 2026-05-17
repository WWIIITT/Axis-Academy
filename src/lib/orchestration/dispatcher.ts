import { Prisma, AgentTaskStatus, WorkflowEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildHandoff, buildReview, buildToolCall, validateAgentEnvelope, validateToolPermission } from "@/lib/orchestration/runtime";
import { getToolContract } from "@/lib/mcp/catalog";

export type DispatchToolInput = {
  lessonProjectId: string;
  agentTaskId: string;
  agentId: string;
  toolId: string;
  inputJson: Record<string, unknown>;
};

export async function dispatchToolCall(input: DispatchToolInput) {
  const permission = validateToolPermission(input.agentId, input.toolId);

  if (!permission.allowed) {
    throw new Error(permission.error ?? "Tool is not permitted for this agent.");
  }

  const tool = getToolContract(input.toolId);
  if (!tool) {
    throw new Error("Unknown tool.");
  }

  const toolCall = buildToolCall({
    toolId: input.toolId,
    inputJson: input.inputJson,
    outputJson: { ok: true, toolId: input.toolId },
    status: "completed",
    errorMessage: null,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  });

  await prisma.workflowEvent.create({
    data: {
      lessonProjectId: input.lessonProjectId,
      agentTaskId: input.agentTaskId,
      eventType: WorkflowEventType.SYSTEM_INFO,
      message: `Tool executed: ${input.toolId}.`,
      teacherVisible: false,
      metadata: toolCall as Prisma.InputJsonObject
    }
  });

  return toolCall;
}

export async function writeWorkflowEvent(options: {
  lessonProjectId: string;
  agentTaskId?: string;
  eventType: WorkflowEventType;
  message: string;
  teacherVisible?: boolean;
  metadata?: Prisma.InputJsonObject;
}) {
  return prisma.workflowEvent.create({
    data: {
      lessonProjectId: options.lessonProjectId,
      agentTaskId: options.agentTaskId ?? null,
      eventType: options.eventType,
      message: options.message,
      teacherVisible: options.teacherVisible ?? true,
      metadata: options.metadata ?? {}
    }
  });
}

export async function markAgentTaskStatus(agentTaskId: string, status: AgentTaskStatus) {
  return prisma.agentTask.update({
    where: { id: agentTaskId },
    data: {
      status,
      startedAt: status === AgentTaskStatus.RUNNING ? new Date() : undefined,
      completedAt:
        status === AgentTaskStatus.COMPLETED || status === AgentTaskStatus.FAILED || status === AgentTaskStatus.NEEDS_REVISION
          ? new Date()
          : undefined
    }
  });
}

export async function persistValidatedEnvelope(payload: unknown) {
  return validateAgentEnvelope(payload);
}

export function buildValidatedHandoff(payload: unknown) {
  return buildHandoff(payload as Parameters<typeof buildHandoff>[0]);
}

export function buildValidatedReview(payload: unknown) {
  return buildReview(payload as Parameters<typeof buildReview>[0]);
}
