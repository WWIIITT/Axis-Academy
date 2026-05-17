export type EvaluationMetricKey =
  | "sourceCoverage"
  | "groundedness"
  | "factualConsistency"
  | "exampleQuality"
  | "questionQuality"
  | "slideQuality"
  | "reviewerAccuracy";

export type EvaluationThresholds = Record<EvaluationMetricKey, number>;

export type EvaluationSample = {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  sourceText: string;
  expectedConcepts: string[];
  expectedObjectives: string[];
  requiredCoverage: string[];
  knownMisconceptions: string[];
  expectedBlockingIssues: string[];
  candidateOutput: {
    lessonSummary: string;
    examples: Array<{
      title: string;
      explanation: string;
      sourceReferences: string[];
    }>;
    questions: Array<{
      prompt: string;
      answer: string;
      explanation: string;
      difficulty: "easy" | "medium" | "hard";
      sourceReferences: string[];
    }>;
    slides: Array<{
      title: string;
      bullets: string[];
      sourceReferences: string[];
    }>;
    reviewWarnings: string[];
    reviewBlockingIssues: string[];
  };
};

export type EvaluationSampleResult = {
  sampleId: string;
  title: string;
  scores: EvaluationThresholds;
  passed: boolean;
  failures: Array<{
    metric: EvaluationMetricKey;
    score: number;
    threshold: number;
  }>;
  notes: string[];
};

export type EvaluationReport = {
  runId: string;
  createdAt: string;
  metadata: {
    modelName: string | null;
    providerConfigured: boolean;
    promptVersion: string;
    workflowVersion: string;
    sampleCount: number;
  };
  thresholds: EvaluationThresholds;
  aggregateScores: EvaluationThresholds;
  passed: boolean;
  sampleResults: EvaluationSampleResult[];
};
