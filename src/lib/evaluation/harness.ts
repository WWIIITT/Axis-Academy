import { getProviderStatus } from "../provider-config";
import { evaluationSamples } from "./samples";
import type {
  EvaluationMetricKey,
  EvaluationReport,
  EvaluationSample,
  EvaluationSampleResult,
  EvaluationThresholds
} from "./types";

const metricKeys: EvaluationMetricKey[] = [
  "sourceCoverage",
  "groundedness",
  "factualConsistency",
  "exampleQuality",
  "questionQuality",
  "slideQuality",
  "reviewerAccuracy"
];

export const defaultEvaluationThresholds: EvaluationThresholds = {
  sourceCoverage: 0.85,
  groundedness: 0.9,
  factualConsistency: 1,
  exampleQuality: 0.8,
  questionQuality: 0.85,
  slideQuality: 0.8,
  reviewerAccuracy: 0.8
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function countCoveredTerms(terms: string[], text: string) {
  const normalizedText = normalizeText(text);

  return terms.filter((term) => normalizedText.includes(normalizeText(term))).length;
}

function ratio(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 1;
  }

  return Math.max(0, Math.min(1, numerator / denominator));
}

function collectOutputText(sample: EvaluationSample) {
  const { candidateOutput } = sample;

  return [
    candidateOutput.lessonSummary,
    ...candidateOutput.examples.flatMap((example) => [example.title, example.explanation]),
    ...candidateOutput.questions.flatMap((question) => [
      question.prompt,
      question.answer,
      question.explanation,
      question.difficulty
    ]),
    ...candidateOutput.slides.flatMap((slide) => [slide.title, ...slide.bullets])
  ].join(" ");
}

function scoreGroundedness(sample: EvaluationSample) {
  const outputsWithReferences = [
    ...sample.candidateOutput.examples.map((example) => example.sourceReferences),
    ...sample.candidateOutput.questions.map((question) => question.sourceReferences),
    ...sample.candidateOutput.slides.map((slide) => slide.sourceReferences)
  ];

  return ratio(outputsWithReferences.filter((references) => references.length > 0).length, outputsWithReferences.length);
}

function scoreFactualConsistency(sample: EvaluationSample, outputText: string) {
  const coveredConcepts = countCoveredTerms(sample.expectedConcepts, outputText);
  const hallucinationRisk = sample.knownMisconceptions.filter((misconception) =>
    normalizeText(outputText).includes(normalizeText(misconception))
  ).length;

  if (hallucinationRisk > 0) {
    return 0.7;
  }

  return ratio(coveredConcepts, sample.expectedConcepts.length);
}

function scoreExampleQuality(sample: EvaluationSample) {
  const examples = sample.candidateOutput.examples;

  if (examples.length === 0) {
    return 0;
  }

  const usefulExamples = examples.filter(
    (example) => example.title.trim() && example.explanation.split(" ").length >= 10 && example.sourceReferences.length > 0
  );

  return ratio(usefulExamples.length, Math.max(1, sample.expectedConcepts.length >= 3 ? 1 : examples.length));
}

function scoreQuestionQuality(sample: EvaluationSample) {
  const questions = sample.candidateOutput.questions;

  if (questions.length === 0) {
    return 0;
  }

  const validQuestions = questions.filter(
    (question) =>
      /[?.]$/.test(question.prompt.trim()) &&
      question.answer.trim().length > 0 &&
      question.explanation.trim().length > 0 &&
      question.sourceReferences.length > 0
  );
  const difficultySpread = new Set(questions.map((question) => question.difficulty)).size;

  return Math.min(1, ratio(validQuestions.length, questions.length) * 0.8 + Math.min(0.2, difficultySpread * 0.1));
}

function scoreSlideQuality(sample: EvaluationSample) {
  const slides = sample.candidateOutput.slides;

  if (slides.length === 0) {
    return 0;
  }

  const validSlides = slides.filter(
    (slide) =>
      slide.title.trim().length > 0 &&
      slide.bullets.length > 0 &&
      slide.bullets.length <= 5 &&
      slide.sourceReferences.length > 0
  );

  return ratio(validSlides.length, slides.length);
}

function scoreReviewerAccuracy(sample: EvaluationSample) {
  const expected = new Set(sample.expectedBlockingIssues.map(normalizeText));
  const actualBlocking = new Set(sample.candidateOutput.reviewBlockingIssues.map(normalizeText));
  const actualWarnings = new Set(sample.candidateOutput.reviewWarnings.map(normalizeText));

  if (expected.size === 0) {
    return actualBlocking.size === 0 ? 1 : 0;
  }

  let matched = 0;
  for (const issue of expected) {
    if (actualBlocking.has(issue) || actualWarnings.has(issue)) {
      matched += 1;
    }
  }

  return ratio(matched, expected.size);
}

function evaluateSample(sample: EvaluationSample, thresholds: EvaluationThresholds): EvaluationSampleResult {
  const outputText = collectOutputText(sample);
  const scores: EvaluationThresholds = {
    sourceCoverage: ratio(countCoveredTerms(sample.requiredCoverage, outputText), sample.requiredCoverage.length),
    groundedness: scoreGroundedness(sample),
    factualConsistency: scoreFactualConsistency(sample, outputText),
    exampleQuality: scoreExampleQuality(sample),
    questionQuality: scoreQuestionQuality(sample),
    slideQuality: scoreSlideQuality(sample),
    reviewerAccuracy: scoreReviewerAccuracy(sample)
  };
  const failures = metricKeys.flatMap((metric) =>
    scores[metric] < thresholds[metric]
      ? [
          {
            metric,
            score: scores[metric],
            threshold: thresholds[metric]
          }
        ]
      : []
  );

  return {
    sampleId: sample.id,
    title: sample.title,
    scores,
    passed: failures.length === 0,
    failures,
    notes: failures.map(
      (failure) => `${failure.metric} scored ${failure.score.toFixed(2)} below ${failure.threshold.toFixed(2)}.`
    )
  };
}

function averageScores(results: EvaluationSampleResult[]): EvaluationThresholds {
  const totals = Object.fromEntries(metricKeys.map((key) => [key, 0])) as EvaluationThresholds;

  for (const result of results) {
    for (const key of metricKeys) {
      totals[key] += result.scores[key];
    }
  }

  return Object.fromEntries(
    metricKeys.map((key) => [key, results.length > 0 ? totals[key] / results.length : 0])
  ) as EvaluationThresholds;
}

export function runEvaluationHarness(thresholds: EvaluationThresholds = defaultEvaluationThresholds): EvaluationReport {
  const providerStatus = getProviderStatus();
  const sampleResults = evaluationSamples.map((sample) => evaluateSample(sample, thresholds));
  const aggregateScores = averageScores(sampleResults);
  const aggregateFailures = metricKeys.filter((metric) => aggregateScores[metric] < thresholds[metric]);

  return {
    runId: `eval-${Date.now()}`,
    createdAt: new Date().toISOString(),
    metadata: {
      modelName: providerStatus.modelName,
      providerConfigured: providerStatus.configured,
      promptVersion: "mvp-deterministic-v1",
      workflowVersion: "milestone-6",
      sampleCount: evaluationSamples.length
    },
    thresholds,
    aggregateScores,
    passed: aggregateFailures.length === 0 && sampleResults.every((result) => result.passed),
    sampleResults
  };
}
