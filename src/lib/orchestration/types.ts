export type AgentTaskStatus = "queued" | "running" | "reviewing" | "needs_revision" | "completed" | "failed";

export type ToolCallStatus = "queued" | "running" | "completed" | "failed";

export type ToolCall = {
  id: string;
  agentTaskId: string;
  toolId: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown> | null;
  status: ToolCallStatus;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type HandoffResult = {
  agentName: string;
  taskId: string;
  status: "completed" | "needs_revision" | "failed";
  summary: string;
  artifacts: string[];
  sourceReferences: string[];
  warnings: string[];
  toolCallIds: string[];
  nextActions: string[];
};

export type ReviewResult = {
  reviewerName: string;
  status: "approved" | "needs_revision" | "blocked";
  summary: string;
  blockingIssues: string[];
  warnings: string[];
  rubricScores: Record<string, number>;
};

export type WorkflowState = {
  lessonProjectId: string;
  currentAgent: string | null;
  currentTaskId: string | null;
  taskStatuses: Record<string, AgentTaskStatus>;
  recentToolCalls: ToolCall[];
  latestHandoff: HandoffResult | null;
  latestReview: ReviewResult | null;
};
