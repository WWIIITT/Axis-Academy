import type { AgentSpec } from "@/lib/agents/catalog";
import { agentCatalog } from "@/lib/agents/catalog";
import { mcpToolCatalog } from "@/lib/mcp/catalog";
import type { HandoffResult, ReviewResult, ToolCall, WorkflowState } from "@/lib/orchestration/types";

export function getAgentById(agentId: string): AgentSpec | undefined {
  return agentCatalog.find((agent) => agent.id === agentId);
}

export function getWorkflowSeedState(lessonProjectId: string): WorkflowState {
  return {
    lessonProjectId,
    currentAgent: null,
    currentTaskId: null,
    taskStatuses: {},
    recentToolCalls: [],
    latestHandoff: null,
    latestReview: null
  };
}

export function isToolAllowedForAgent(agentId: string, toolId: string): boolean {
  const agent = getAgentById(agentId);

  return agent?.tools.includes(toolId) ?? false;
}

export function getToolContract(toolId: string) {
  return mcpToolCatalog.find((tool) => tool.id === toolId);
}

export function appendToolCall(state: WorkflowState, call: ToolCall): WorkflowState {
  return {
    ...state,
    recentToolCalls: [...state.recentToolCalls.slice(-19), call]
  };
}

export function applyHandoff(state: WorkflowState, handoff: HandoffResult): WorkflowState {
  return {
    ...state,
    currentAgent: handoff.agentName,
    currentTaskId: handoff.taskId,
    latestHandoff: handoff
  };
}

export function applyReview(state: WorkflowState, review: ReviewResult): WorkflowState {
  return {
    ...state,
    latestReview: review
  };
}
