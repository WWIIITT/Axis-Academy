const metricKeys = [
  "sourceCoverage",
  "groundedness",
  "factualConsistency",
  "exampleQuality",
  "questionQuality",
  "slideQuality",
  "reviewerAccuracy"
];

const thresholds = {
  sourceCoverage: 0.85,
  groundedness: 0.9,
  factualConsistency: 1,
  exampleQuality: 0.8,
  questionQuality: 0.85,
  slideQuality: 0.8,
  reviewerAccuracy: 0.8
};

const samples = [
  {
    id: "hkdse-functions-core",
    title: "HKDSE Mathematics: Linear Functions",
    expectedConcepts: ["linear function", "gradient", "y-intercept", "rate of change"],
    requiredCoverage: ["form f(x) = ax + b", "gradient", "y-intercept", "real-world rate of change"],
    knownMisconceptions: ["confusing x-intercept with y-intercept", "treating gradient as a fixed y value"],
    expectedBlockingIssues: [],
    candidateOutput: {
      lessonSummary:
        "Students learn that a linear function has form f(x) = ax + b, where a controls gradient and b is the y-intercept. The lesson connects graphing with real-world rate of change.",
      examples: [
        {
          title: "Find gradient and y-intercept",
          explanation:
            "For f(x) = 2x + 3, the gradient is 2 and the y-intercept is 3. This shows how the graph rises by 2 for each increase of 1 in x.",
          sourceReferences: ["source-1:chunk-1"]
        }
      ],
      questions: [
        {
          prompt: "For f(x) = -3x + 5, identify the gradient and y-intercept.",
          answer: "Gradient = -3, y-intercept = 5.",
          explanation: "Compare the function with f(x) = ax + b.",
          difficulty: "easy",
          sourceReferences: ["source-1:chunk-1"]
        },
        {
          prompt: "Explain what the gradient means in a taxi fare model?",
          answer: "It represents the rate at which fare changes per unit distance.",
          explanation: "The gradient is a real-world rate of change.",
          difficulty: "medium",
          sourceReferences: ["source-1:chunk-1"]
        }
      ],
      slides: [
        {
          title: "Linear Functions",
          bullets: ["f(x) = ax + b", "a is gradient", "b is y-intercept"],
          sourceReferences: ["source-1:chunk-1"]
        },
        {
          title: "Interpreting Gradient",
          bullets: ["Gradient describes real-world rate of change", "Use real-world examples"],
          sourceReferences: ["source-1:chunk-1"]
        }
      ],
      reviewWarnings: [],
      reviewBlockingIssues: []
    }
  },
  {
    id: "hkqf-business-risk",
    title: "HKQF Business: Risk Controls",
    expectedConcepts: ["operational risk", "process failure", "control owner", "evidence", "escalation path"],
    requiredCoverage: ["likelihood", "impact", "owner", "frequency", "evidence", "escalation path"],
    knownMisconceptions: ["assuming all controls remove risk completely", "confusing control evidence with control owner"],
    expectedBlockingIssues: [],
    candidateOutput: {
      lessonSummary:
        "Operational risk can come from process failure, human error, system outage, or external disruption. Controls reduce likelihood or impact and should have a control owner, frequency, evidence, and escalation path.",
      examples: [
        {
          title: "System outage control",
          explanation:
            "A daily backup control has a control owner, frequency, backup logs as evidence, and an escalation path to IT support. It reduces impact when systems fail.",
          sourceReferences: ["source-2:chunk-1"]
        }
      ],
      questions: [
        {
          prompt: "Name two features of a good control.",
          answer: "Control owner and evidence. Other valid features include frequency and escalation path.",
          explanation:
            "A good control should have clear accountability, proof it was performed, a defined frequency, and an escalation path when it fails.",
          difficulty: "easy",
          sourceReferences: ["source-2:chunk-1"]
        }
      ],
      slides: [
        {
          title: "Operational Risk",
          bullets: [
            "Process failure",
            "Human error",
            "System outage",
            "External disruption",
            "Controls need control owner, frequency, evidence, and escalation path"
          ],
          sourceReferences: ["source-2:chunk-1"]
        }
      ],
      reviewWarnings: [],
      reviewBlockingIssues: []
    }
  }
];

function normalizeText(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function countCoveredTerms(terms, text) {
  const normalizedText = normalizeText(text);
  return terms.filter((term) => normalizedText.includes(normalizeText(term))).length;
}

function ratio(numerator, denominator) {
  return denominator === 0 ? 1 : Math.max(0, Math.min(1, numerator / denominator));
}

function collectOutputText(sample) {
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

function scoreSample(sample) {
  const outputText = collectOutputText(sample);
  const outputsWithReferences = [
    ...sample.candidateOutput.examples.map((example) => example.sourceReferences),
    ...sample.candidateOutput.questions.map((question) => question.sourceReferences),
    ...sample.candidateOutput.slides.map((slide) => slide.sourceReferences)
  ];
  const questions = sample.candidateOutput.questions;
  const slides = sample.candidateOutput.slides;
  const expectedBlocking = new Set(sample.expectedBlockingIssues.map(normalizeText));
  const actualBlocking = new Set(sample.candidateOutput.reviewBlockingIssues.map(normalizeText));
  const actualWarnings = new Set(sample.candidateOutput.reviewWarnings.map(normalizeText));
  let matchedBlocking = 0;

  for (const issue of expectedBlocking) {
    if (actualBlocking.has(issue) || actualWarnings.has(issue)) {
      matchedBlocking += 1;
    }
  }

  return {
    sourceCoverage: ratio(countCoveredTerms(sample.requiredCoverage, outputText), sample.requiredCoverage.length),
    groundedness: ratio(outputsWithReferences.filter((references) => references.length > 0).length, outputsWithReferences.length),
    factualConsistency:
      sample.knownMisconceptions.some((misconception) => normalizeText(outputText).includes(normalizeText(misconception)))
        ? 0.7
        : ratio(countCoveredTerms(sample.expectedConcepts, outputText), sample.expectedConcepts.length),
    exampleQuality: ratio(
      sample.candidateOutput.examples.filter(
        (example) => example.title.trim() && example.explanation.split(" ").length >= 10 && example.sourceReferences.length > 0
      ).length,
      Math.max(1, sample.expectedConcepts.length >= 3 ? 1 : sample.candidateOutput.examples.length)
    ),
    questionQuality: Math.min(
      1,
      ratio(
        questions.filter(
          (question) =>
            /[?.]$/.test(question.prompt.trim()) &&
            question.answer.trim().length > 0 &&
            question.explanation.trim().length > 0 &&
            question.sourceReferences.length > 0
        ).length,
        questions.length
      ) *
        0.8 +
        Math.min(0.2, new Set(questions.map((question) => question.difficulty)).size * 0.1)
    ),
    slideQuality: ratio(
      slides.filter(
        (slide) =>
          slide.title.trim().length > 0 &&
          slide.bullets.length > 0 &&
          slide.bullets.length <= 5 &&
          slide.sourceReferences.length > 0
      ).length,
      slides.length
    ),
    reviewerAccuracy: expectedBlocking.size === 0 ? (actualBlocking.size === 0 ? 1 : 0) : ratio(matchedBlocking, expectedBlocking.size)
  };
}

export function runEvaluationHarnessForCli() {
  const sampleResults = samples.map((sample) => {
    const scores = scoreSample(sample);
    const failures = metricKeys.flatMap((metric) =>
      scores[metric] < thresholds[metric] ? [{ metric, score: scores[metric], threshold: thresholds[metric] }] : []
    );

    return {
      sampleId: sample.id,
      title: sample.title,
      scores,
      passed: failures.length === 0,
      failures,
      notes: failures.map((failure) => `${failure.metric} scored ${failure.score.toFixed(2)} below ${failure.threshold.toFixed(2)}.`)
    };
  });
  const aggregateScores = Object.fromEntries(
    metricKeys.map((metric) => [
      metric,
      sampleResults.reduce((total, result) => total + result.scores[metric], 0) / sampleResults.length
    ])
  );

  return {
    runId: `eval-${Date.now()}`,
    createdAt: new Date().toISOString(),
    metadata: {
      modelName: process.env.AI_MODEL_NAME || null,
      providerConfigured: Boolean(process.env.AI_API_KEY && process.env.AI_BASE_URL && process.env.AI_MODEL_NAME),
      promptVersion: "mvp-deterministic-v1",
      workflowVersion: "milestone-6",
      sampleCount: samples.length
    },
    thresholds,
    aggregateScores,
    passed:
      metricKeys.every((metric) => aggregateScores[metric] >= thresholds[metric]) &&
      sampleResults.every((result) => result.passed),
    sampleResults
  };
}
