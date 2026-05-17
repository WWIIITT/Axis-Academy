import type { EvaluationSample } from "./types";

export const evaluationSamples: EvaluationSample[] = [
  {
    id: "hkdse-functions-core",
    title: "HKDSE Mathematics: Linear Functions",
    subject: "Mathematics",
    gradeLevel: "HKDSE-S4",
    sourceText:
      "A linear function has the form f(x) = ax + b where a is the gradient and b is the y-intercept. Students should identify gradient, y-intercept, graph linear functions, and interpret real-world rate of change.",
    expectedConcepts: ["linear function", "gradient", "y-intercept", "rate of change"],
    expectedObjectives: ["identify gradient", "identify y-intercept", "graph linear functions"],
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
    subject: "Business",
    gradeLevel: "HKQF-3",
    sourceText:
      "Operational risk includes process failure, human error, system outage, and external disruption. Controls should reduce likelihood or impact. A good control has an owner, frequency, evidence, and escalation path.",
    expectedConcepts: ["operational risk", "process failure", "control owner", "evidence", "escalation path"],
    expectedObjectives: ["define operational risk", "identify control features", "evaluate control quality"],
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
          explanation: "A good control should have clear accountability, proof it was performed, a defined frequency, and an escalation path when it fails.",
          difficulty: "easy",
          sourceReferences: ["source-2:chunk-1"]
        }
      ],
      slides: [
        {
          title: "Operational Risk",
          bullets: ["Process failure", "Human error", "System outage", "External disruption", "Controls need control owner, frequency, evidence, and escalation path"],
          sourceReferences: ["source-2:chunk-1"]
        }
      ],
      reviewWarnings: [],
      reviewBlockingIssues: []
    }
  }
];
