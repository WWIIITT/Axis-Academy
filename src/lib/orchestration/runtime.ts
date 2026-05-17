import { AgentTaskStatus, WorkflowEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAgentById, getWorkflowSeedState, isToolAllowedForAgent } from "@/lib/orchestration/catalog";
import { agentOutputEnvelopeSchema, handoffSchema, reviewResultSchema, toolCallSchema } from "@/lib/orchestration/schemas";
import type { HandoffResult, ReviewResult, ToolCall, WorkflowState } from "@/lib/orchestration/types";

export type WorkflowStartResult = {
  workflowState: WorkflowState;
  workflowEventIds: string[];
  taskId: string;
};

export type ToolExecutionContext = {
  lessonProjectId: string;
  agentTaskId: string;
  agentId: string;
};

export function createInitialWorkflowState(lessonProjectId: string) {
  return getWorkflowSeedState(lessonProjectId);
}

export async function startProjectManagerWorkflow(lessonProjectId: string): Promise<WorkflowStartResult> {
  const project = await prisma.lessonProject.findUnique({
    where: { id: lessonProjectId },
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
    throw new Error("Lesson project not found.");
  }

  const task = await prisma.agentTask.create({
    data: {
      lessonProjectId,
      agentName: "project-manager",
      status: AgentTaskStatus.QUEUED
    }
  });

  const workflowEvent = await prisma.workflowEvent.create({
    data: {
      lessonProjectId,
      agentTaskId: task.id,
      eventType: WorkflowEventType.AGENT_QUEUED,
      message: "Project Manager workflow started.",
      teacherVisible: true,
      metadata: {
        agentId: "project-manager",
        sourceDocumentCount: project.sourceDocuments.length
      } satisfies Prisma.InputJsonObject
    }
  });

  return {
    workflowState: {
      ...createInitialWorkflowState(lessonProjectId),
      currentAgent: "project-manager",
      currentTaskId: task.id,
      taskStatuses: {
        [task.id]: "queued"
      }
    },
    workflowEventIds: [workflowEvent.id],
    taskId: task.id
  };
}

export function validateToolPermission(agentId: string, toolId: string) {
  if (!getAgentById(agentId)) {
    return { allowed: false, error: "Unknown agent." };
  }

  if (!isToolAllowedForAgent(agentId, toolId)) {
    return { allowed: false, error: "Tool is not permitted for this agent." };
  }

  return { allowed: true, error: null };
}

export function buildToolCall(toolCall: ToolCall) {
  return toolCallSchema.parse(toolCall);
}

export function buildHandoff(handoff: HandoffResult) {
  return handoffSchema.parse(handoff);
}

export function buildReview(review: ReviewResult) {
  return reviewResultSchema.parse(review);
}

export function validateAgentEnvelope(payload: unknown) {
  return agentOutputEnvelopeSchema.parse(payload);
}
