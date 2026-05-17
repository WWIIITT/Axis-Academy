import {
  AgentTaskStatus,
  ArtifactType,
  Prisma,
  ProjectStatus,
  ReviewStatus,
  WorkflowEventType
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildReview } from "@/lib/orchestration/runtime";
import { dispatchToolCall, writeWorkflowEvent } from "@/lib/orchestration/dispatcher";
import type { ReviewResult, SourceReference } from "@/lib/orchestration/types";

type ReviewArtifact = {
  id: string;
  type: ArtifactType;
  contentJson: Prisma.JsonValue;
  sourceReferences: Prisma.JsonValue;
  reviewStatus: ReviewStatus;
  version: number;
};

type Milestone4ReviewResult = {
  slideReview: ReviewResult;
  qualityReview: ReviewResult;
  reviewReportArtifactId: string;
  projectStatus: ProjectStatus;
};

const requiredPackageArtifacts: ArtifactType[] = [
  ArtifactType.LESSON_SUMMARY,
  ArtifactType.EXAMPLES,
  ArtifactType.QUESTIONS,
  ArtifactType.SLIDE_CONTENT
];

const slideArtifactTypes: ArtifactType[] = [ArtifactType.SLIDE_OUTLINE, ArtifactType.SLIDE_CONTENT];

function asObject(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeSourceReferences(value: Prisma.JsonValue): SourceReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const sourceDocumentId = typeof candidate.sourceDocumentId === "string" ? candidate.sourceDocumentId.trim() : "";
    const chunkId = typeof candidate.chunkId === "string" ? candidate.chunkId.trim() : "";
    const note = typeof candidate.note === "string" ? candidate.note.trim() : undefined;

    if (!sourceDocumentId || !chunkId) {
      return [];
    }

    return [
      {
        sourceDocumentId,
        chunkId,
        ...(note ? { note } : {})
      }
    ];
  });
}

function hasContent(value: Prisma.JsonValue): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return false;
}

function calculateScore(issueCount: number, warningCount: number) {
  return Math.max(0, Math.min(1, 1 - issueCount * 0.2 - warningCount * 0.08));
}

function getReviewStatus(blockingIssues: string[], warnings: string[]): ReviewResult["status"] {
  if (blockingIssues.length > 0) {
    return "blocked";
  }

  if (warnings.length > 0) {
    return "needs_revision";
  }

  return "approved";
}

function collectArtifactIssues(artifacts: ReviewArtifact[]) {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  for (const artifactType of requiredPackageArtifacts) {
    const artifact = artifacts.find((candidate) => candidate.type === artifactType);

    if (!artifact) {
      blockingIssues.push(`Missing required artifact: ${artifactType}.`);
      continue;
    }

    if (!hasContent(artifact.contentJson)) {
      blockingIssues.push(`Artifact has no usable content: ${artifactType}.`);
    }

    if (normalizeSourceReferences(artifact.sourceReferences).length === 0) {
      warnings.push(`Artifact has no source references: ${artifactType}.`);
    }
  }

  return { blockingIssues, warnings };
}

function collectSlideIssues(artifacts: ReviewArtifact[]) {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const slideArtifacts = artifacts.filter((artifact) => slideArtifactTypes.includes(artifact.type));

  if (slideArtifacts.length === 0) {
    blockingIssues.push("No slide artifact is available for review.");
  }

  for (const artifact of slideArtifacts) {
    const content = asObject(artifact.contentJson);
    const references = normalizeSourceReferences(artifact.sourceReferences);

    if (!hasContent(artifact.contentJson)) {
      blockingIssues.push(`Slide artifact has no usable content: ${artifact.type}.`);
    }

    if (references.length === 0) {
      warnings.push(`Slide artifact has no source references: ${artifact.type}.`);
    }

    if (!("slides" in content) && !("outline" in content) && !("items" in content)) {
      warnings.push(`Slide artifact should expose slides, outline, or items: ${artifact.type}.`);
    }
  }

  return { blockingIssues, warnings };
}

function collectSourceReferences(artifacts: ReviewArtifact[]) {
  const seen = new Set<string>();
  const references: SourceReference[] = [];

  for (const artifact of artifacts) {
    for (const reference of normalizeSourceReferences(artifact.sourceReferences)) {
      const key = `${reference.sourceDocumentId}:${reference.chunkId}`;

      if (!seen.has(key)) {
        references.push(reference);
        seen.add(key);
      }
    }
  }

  return references;
}

async function createReviewerTask(lessonProjectId: string, reviewerName: string) {
  const task = await prisma.agentTask.create({
    data: {
      lessonProjectId,
      agentName: reviewerName,
      status: AgentTaskStatus.RUNNING,
      inputArtifactIds: [],
      outputArtifactIds: [],
      warnings: [],
      startedAt: new Date()
    }
  });

  await writeWorkflowEvent({
    lessonProjectId,
    agentTaskId: task.id,
    eventType: WorkflowEventType.AGENT_STARTED,
    message: `${reviewerName} started correctness review.`,
    teacherVisible: true,
    metadata: {
      agentId: reviewerName
    }
  });

  return task;
}

async function persistReviewTask(options: {
  lessonProjectId: string;
  taskId: string;
  review: ReviewResult;
  outputArtifactIds?: string[];
}) {
  const nextStatus =
    options.review.status === "approved"
      ? AgentTaskStatus.COMPLETED
      : options.review.status === "needs_revision"
        ? AgentTaskStatus.NEEDS_REVISION
        : AgentTaskStatus.FAILED;

  await prisma.agentTask.update({
    where: {
      id: options.taskId
    },
    data: {
      status: nextStatus,
      warnings: options.review.warnings,
      outputArtifactIds: options.outputArtifactIds ?? [],
      completedAt: new Date()
    }
  });

  if (options.review.blockingIssues.length > 0) {
    await writeWorkflowEvent({
      lessonProjectId: options.lessonProjectId,
      agentTaskId: options.taskId,
      eventType: WorkflowEventType.REVIEW_BLOCKED,
      message: options.review.summary,
      teacherVisible: true,
      metadata: JSON.parse(JSON.stringify(options.review)) as Prisma.InputJsonObject
    });
    return;
  }

  if (options.review.warnings.length > 0) {
    await writeWorkflowEvent({
      lessonProjectId: options.lessonProjectId,
      agentTaskId: options.taskId,
      eventType: WorkflowEventType.REVIEW_WARNING,
      message: options.review.summary,
      teacherVisible: true,
      metadata: JSON.parse(JSON.stringify(options.review)) as Prisma.InputJsonObject
    });
    return;
  }

  await writeWorkflowEvent({
    lessonProjectId: options.lessonProjectId,
    agentTaskId: options.taskId,
    eventType: WorkflowEventType.AGENT_COMPLETED,
    message: options.review.summary,
    teacherVisible: true,
    metadata: JSON.parse(JSON.stringify(options.review)) as Prisma.InputJsonObject
  });
}

export async function runMilestone4ReviewGate(lessonProjectId: string): Promise<Milestone4ReviewResult> {
  const project = await prisma.lessonProject.findUnique({
    where: {
      id: lessonProjectId
    },
    include: {
      artifacts: {
        orderBy: {
          updatedAt: "desc"
        }
      }
    }
  });

  if (!project) {
    throw new Error("Lesson project not found.");
  }

  const artifacts = project.artifacts as ReviewArtifact[];
  const sourceReferences = collectSourceReferences(artifacts);

  const slideTask = await createReviewerTask(lessonProjectId, "slide-reviewer");
  const slideToolCall = await dispatchToolCall({
    lessonProjectId,
    agentTaskId: slideTask.id,
    agentId: "slide-reviewer",
    toolId: "rubric_scorer",
    inputJson: {
      rubric: "slide_clarity_pacing_coverage_groundedness",
      artifactTypes: slideArtifactTypes
    }
  });

  const slideIssues = collectSlideIssues(artifacts);
  const slideReview = buildReview({
    reviewerName: "slide-reviewer",
    status: getReviewStatus(slideIssues.blockingIssues, slideIssues.warnings),
    summary:
      slideIssues.blockingIssues.length > 0
        ? "Slide review found blocking issues that must be fixed before teacher acceptance."
        : slideIssues.warnings.length > 0
          ? "Slide review found warnings that should be resolved before final acceptance."
          : "Slide review passed clarity, pacing, coverage, and grounding checks.",
    blockingIssues: slideIssues.blockingIssues,
    warnings: slideIssues.warnings,
    rubricScores: {
      clarity: calculateScore(slideIssues.blockingIssues.length, slideIssues.warnings.length),
      pacing: calculateScore(slideIssues.blockingIssues.length, Math.max(0, slideIssues.warnings.length - 1)),
      coverage: calculateScore(slideIssues.blockingIssues.length, slideIssues.warnings.length),
      groundedness: calculateScore(0, slideIssues.warnings.filter((warning) => warning.includes("source references")).length)
    },
    sourceReferences,
    nextActions:
      slideIssues.blockingIssues.length > 0 || slideIssues.warnings.length > 0
        ? ["Return slide package to Slide Designer for targeted revision."]
        : ["Allow Quality Reviewer to evaluate the full package."]
  });

  await persistReviewTask({
    lessonProjectId,
    taskId: slideTask.id,
    review: slideReview
  });

  const qualityTask = await createReviewerTask(lessonProjectId, "quality-reviewer");
  const validationToolCall = await dispatchToolCall({
    lessonProjectId,
    agentTaskId: qualityTask.id,
    agentId: "quality-reviewer",
    toolId: "structured_output_validator",
    inputJson: {
      schemaName: "milestone4_review_package",
      artifactCount: artifacts.length
    }
  });
  const rubricToolCall = await dispatchToolCall({
    lessonProjectId,
    agentTaskId: qualityTask.id,
    agentId: "quality-reviewer",
    toolId: "rubric_scorer",
    inputJson: {
      rubric: "coverage_groundedness_consistency_teacher_readiness",
      artifactTypes: requiredPackageArtifacts
    }
  });

  const packageIssues = collectArtifactIssues(artifacts);
  const combinedBlockingIssues = [...packageIssues.blockingIssues, ...slideReview.blockingIssues];
  const combinedWarnings = [...packageIssues.warnings, ...slideReview.warnings];
  const qualityReview = buildReview({
    reviewerName: "quality-reviewer",
    status: getReviewStatus(combinedBlockingIssues, combinedWarnings),
    summary:
      combinedBlockingIssues.length > 0
        ? "Quality review blocked final acceptance because required content or grounding is incomplete."
        : combinedWarnings.length > 0
          ? "Quality review found non-blocking warnings. Teacher review can continue after targeted revision."
          : "Quality review passed coverage, groundedness, consistency, and teacher-readiness checks.",
    blockingIssues: combinedBlockingIssues,
    warnings: combinedWarnings,
    rubricScores: {
      sourceCoverage: calculateScore(packageIssues.blockingIssues.length, packageIssues.warnings.length),
      groundedness: calculateScore(
        combinedBlockingIssues.filter((issue) => issue.includes("source")).length,
        combinedWarnings.filter((warning) => warning.includes("source references")).length
      ),
      consistency: calculateScore(slideReview.blockingIssues.length, slideReview.warnings.length),
      teacherReadiness: calculateScore(combinedBlockingIssues.length, combinedWarnings.length)
    },
    sourceReferences,
    nextActions:
      combinedBlockingIssues.length > 0 || combinedWarnings.length > 0
        ? ["Project Manager should request targeted regeneration before final acceptance."]
        : ["Project Manager can prepare the teacher review package."]
  });

  const reviewReportArtifact = await prisma.artifact.create({
    data: {
      lessonProjectId,
      type: ArtifactType.REVIEW_REPORT,
      contentJson: {
        slideReview,
        qualityReview,
        toolCalls: [slideToolCall, validationToolCall, rubricToolCall]
      } as Prisma.InputJsonObject,
      sourceReferences: JSON.parse(JSON.stringify(sourceReferences)) as Prisma.InputJsonArray,
      reviewStatus:
        qualityReview.status === "approved"
          ? ReviewStatus.APPROVED
          : qualityReview.status === "needs_revision"
            ? ReviewStatus.NEEDS_REVISION
            : ReviewStatus.BLOCKED,
      version: 1
    }
  });

  await persistReviewTask({
    lessonProjectId,
    taskId: qualityTask.id,
    review: qualityReview,
    outputArtifactIds: [reviewReportArtifact.id]
  });

  const projectStatus =
    qualityReview.status === "approved" ? ProjectStatus.NEEDS_TEACHER_REVIEW : ProjectStatus.PROCESSING;

  await prisma.lessonProject.update({
    where: {
      id: lessonProjectId
    },
    data: {
      status: projectStatus
    }
  });

  await writeWorkflowEvent({
    lessonProjectId,
    agentTaskId: qualityTask.id,
    eventType:
      qualityReview.status === "approved"
        ? WorkflowEventType.AGENT_COMPLETED
        : qualityReview.status === "blocked"
          ? WorkflowEventType.REVIEW_BLOCKED
          : WorkflowEventType.REVIEW_WARNING,
    message:
      qualityReview.status === "approved"
        ? "Milestone 4 correctness gate passed. The package is ready for teacher review."
        : "Milestone 4 correctness gate requires revision before teacher acceptance.",
    teacherVisible: true,
    metadata: {
      reviewReportArtifactId: reviewReportArtifact.id,
      projectStatus
    }
  });

  return {
    slideReview,
    qualityReview,
    reviewReportArtifactId: reviewReportArtifact.id,
    projectStatus
  };
}
