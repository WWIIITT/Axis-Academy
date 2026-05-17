import { ArtifactType, Prisma, ProjectStatus, ReviewStatus } from "@prisma/client";

type ExportArtifact = {
  id: string;
  type: ArtifactType;
  contentJson: Prisma.JsonValue;
  sourceReferences: Prisma.JsonValue;
  reviewStatus: ReviewStatus;
  version: number;
  updatedAt: Date;
};

type ExportProject = {
  id: string;
  title: string;
  subject: string | null;
  gradeLevel: string | null;
  status: ProjectStatus;
  artifacts: ExportArtifact[];
};

type ReviewSummary = {
  artifactId: string;
  version: number;
  reviewStatus: ReviewStatus;
  slideReview?: unknown;
  qualityReview?: unknown;
};

export type StructuredLessonPackage = {
  schemaVersion: "axis-academy.lesson-package.v1";
  exportedAt: string;
  project: {
    id: string;
    title: string;
    subject: string | null;
    gradeLevel: string | null;
    status: ProjectStatus;
  };
  packageMetadata: {
    finalPackageArtifactId: string | null;
    acceptedArtifactIds: string[];
    readyForPptxExport: boolean;
  };
  lessonSummary: unknown | null;
  slideOutline: unknown | null;
  slideContent: unknown | null;
  examples: unknown | null;
  questions: unknown | null;
  reviewReports: ReviewSummary[];
  sourceReferences: unknown[];
};

const exportArtifactTypes = [
  ArtifactType.LESSON_SUMMARY,
  ArtifactType.SLIDE_OUTLINE,
  ArtifactType.SLIDE_CONTENT,
  ArtifactType.EXAMPLES,
  ArtifactType.QUESTIONS,
  ArtifactType.REVIEW_REPORT,
  ArtifactType.FINAL_PACKAGE
];

function latestArtifact(artifacts: ExportArtifact[], type: ArtifactType) {
  return artifacts
    .filter((artifact) => artifact.type === type)
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0] ?? null;
}

function collectSourceReferences(artifacts: ExportArtifact[]) {
  const seen = new Set<string>();
  const references: unknown[] = [];

  for (const artifact of artifacts) {
    if (!Array.isArray(artifact.sourceReferences)) {
      continue;
    }

    for (const reference of artifact.sourceReferences) {
      const key = JSON.stringify(reference);

      if (!seen.has(key)) {
        references.push(reference);
        seen.add(key);
      }
    }
  }

  return references;
}

function getAcceptedArtifactIds(finalPackage: ExportArtifact | null): string[] {
  if (!finalPackage || !finalPackage.contentJson || typeof finalPackage.contentJson !== "object" || Array.isArray(finalPackage.contentJson)) {
    return [];
  }

  const content = finalPackage.contentJson as Record<string, unknown>;

  return Array.isArray(content.acceptedArtifactIds)
    ? content.acceptedArtifactIds.filter((id): id is string => typeof id === "string")
    : [];
}

function sanitizeReviewReport(artifact: ExportArtifact): ReviewSummary {
  const content =
    artifact.contentJson && typeof artifact.contentJson === "object" && !Array.isArray(artifact.contentJson)
      ? (artifact.contentJson as Record<string, unknown>)
      : {};

  return {
    artifactId: artifact.id,
    version: artifact.version,
    reviewStatus: artifact.reviewStatus,
    slideReview: content.slideReview ?? null,
    qualityReview: content.qualityReview ?? null
  };
}

export function buildStructuredLessonPackage(project: ExportProject): StructuredLessonPackage {
  const artifacts = project.artifacts.filter((artifact) => exportArtifactTypes.includes(artifact.type));
  const finalPackage = latestArtifact(artifacts, ArtifactType.FINAL_PACKAGE);
  const lessonSummary = latestArtifact(artifacts, ArtifactType.LESSON_SUMMARY);
  const slideOutline = latestArtifact(artifacts, ArtifactType.SLIDE_OUTLINE);
  const slideContent = latestArtifact(artifacts, ArtifactType.SLIDE_CONTENT);
  const examples = latestArtifact(artifacts, ArtifactType.EXAMPLES);
  const questions = latestArtifact(artifacts, ArtifactType.QUESTIONS);
  const reviewReports = artifacts
    .filter((artifact) => artifact.type === ArtifactType.REVIEW_REPORT)
    .map((artifact) => sanitizeReviewReport(artifact));

  return {
    schemaVersion: "axis-academy.lesson-package.v1",
    exportedAt: new Date().toISOString(),
    project: {
      id: project.id,
      title: project.title,
      subject: project.subject,
      gradeLevel: project.gradeLevel,
      status: project.status
    },
    packageMetadata: {
      finalPackageArtifactId: finalPackage?.id ?? null,
      acceptedArtifactIds: getAcceptedArtifactIds(finalPackage),
      readyForPptxExport: Boolean(slideOutline || slideContent)
    },
    lessonSummary: lessonSummary?.contentJson ?? null,
    slideOutline: slideOutline?.contentJson ?? null,
    slideContent: slideContent?.contentJson ?? null,
    examples: examples?.contentJson ?? null,
    questions: questions?.contentJson ?? null,
    reviewReports,
    sourceReferences: collectSourceReferences(artifacts)
  };
}

function stringifyMarkdownValue(value: unknown) {
  if (value === null || value === undefined) {
    return "_Not available._";
  }

  if (typeof value === "string") {
    return value;
  }

  return `\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

export function buildMarkdownLessonPackage(lessonPackage: StructuredLessonPackage) {
  const reviewSummary = lessonPackage.reviewReports.length
    ? lessonPackage.reviewReports
        .map(
          (report) =>
            `- Review report ${report.artifactId} v${report.version}: ${report.reviewStatus}`
        )
        .join("\n")
    : "_No review reports._";

  return [
    `# ${lessonPackage.project.title}`,
    "",
    `- Subject: ${lessonPackage.project.subject ?? "Not set"}`,
    `- Level: ${lessonPackage.project.gradeLevel ?? "Not set"}`,
    `- Status: ${lessonPackage.project.status}`,
    `- Exported at: ${lessonPackage.exportedAt}`,
    `- Schema: ${lessonPackage.schemaVersion}`,
    "",
    "## Lesson Summary",
    stringifyMarkdownValue(lessonPackage.lessonSummary),
    "",
    "## Slide Outline",
    stringifyMarkdownValue(lessonPackage.slideOutline),
    "",
    "## Slide Content",
    stringifyMarkdownValue(lessonPackage.slideContent),
    "",
    "## Examples",
    stringifyMarkdownValue(lessonPackage.examples),
    "",
    "## Questions",
    stringifyMarkdownValue(lessonPackage.questions),
    "",
    "## Review Metadata",
    reviewSummary,
    "",
    "## Source References",
    stringifyMarkdownValue(lessonPackage.sourceReferences)
  ].join("\n");
}
