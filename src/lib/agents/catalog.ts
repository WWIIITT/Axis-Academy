export type AgentSkill = {
  id: string;
  name: string;
  description: string;
};

export type AgentTool = {
  id: string;
  name: string;
  description: string;
};

export type AgentSpec = {
  id: string;
  name: string;
  description: string;
  skills: string[];
  tools: string[];
};

export const agentSkills: AgentSkill[] = [
  {
    id: "workflow_orchestration",
    name: "Workflow orchestration",
    description: "Plans task order, validates handoffs, and coordinates retry or review decisions."
  },
  {
    id: "document_analysis",
    name: "Document analysis",
    description: "Extracts concepts, definitions, objectives, and structure from teacher materials."
  },
  {
    id: "source_grounding",
    name: "Source grounding",
    description: "Links claims and generated content back to source chunks or marks derived content."
  },
  {
    id: "pedagogical_review",
    name: "Pedagogical review",
    description: "Checks sequence, difficulty, prerequisites, and likely misconceptions."
  },
  {
    id: "lesson_design",
    name: "Lesson design",
    description: "Turns extracted material into teachable lesson sections and teacher notes."
  },
  {
    id: "example_design",
    name: "Example design",
    description: "Creates worked examples with steps, explanations, and common mistakes."
  },
  {
    id: "question_design",
    name: "Question design",
    description: "Creates questions with answers, explanations, difficulty, and concept targets."
  },
  {
    id: "slide_design",
    name: "Slide design",
    description: "Creates slide-ready content, speaker notes, and visual suggestions."
  },
  {
    id: "quality_review",
    name: "Quality review",
    description: "Reviews coverage, groundedness, consistency, warnings, and blocking issues."
  }
];

export const agentTools: AgentTool[] = [
  {
    id: "document_parser",
    name: "Document parser",
    description: "Extracts text and structure from PDF, PPTX, or pasted text inputs."
  },
  {
    id: "text_chunker",
    name: "Text chunker",
    description: "Splits source content into traceable chunks by section, page, slide, or semantics."
  },
  {
    id: "source_citation_lookup",
    name: "Source citation lookup",
    description: "Finds source references that support generated claims and teaching assets."
  },
  {
    id: "structured_output_validator",
    name: "Structured output validator",
    description: "Validates agent outputs against required schemas before accepting handoffs."
  },
  {
    id: "rubric_scorer",
    name: "Rubric scorer",
    description: "Scores artifacts against coverage, groundedness, example, question, and slide rubrics."
  },
  {
    id: "artifact_versioner",
    name: "Artifact versioner",
    description: "Creates versioned artifacts when content is edited or regenerated."
  },
  {
    id: "workflow_event_writer",
    name: "Workflow event writer",
    description: "Writes teacher-visible and internal workflow events for traceability."
  }
];

export const agentCatalog: AgentSpec[] = [
  {
    id: "manager",
    name: "Manager",
    description: "Coordinates the workflow, validates handoffs, resolves conflicts, and prepares teacher-facing output.",
    skills: ["workflow_orchestration", "source_grounding", "quality_review"],
    tools: ["structured_output_validator", "artifact_versioner", "workflow_event_writer"]
  },
  {
    id: "document_analyst",
    name: "Document Analyst",
    description: "Extracts source structure, concept inventory, definitions, and learning objective candidates.",
    skills: ["document_analysis", "source_grounding"],
    tools: ["document_parser", "text_chunker", "source_citation_lookup", "workflow_event_writer"]
  },
  {
    id: "subject_teacher",
    name: "Subject Teacher",
    description: "Reviews pedagogy, prerequisites, sequencing, difficulty, and misconceptions.",
    skills: ["pedagogical_review", "lesson_design"],
    tools: ["source_citation_lookup", "rubric_scorer", "workflow_event_writer"]
  },
  {
    id: "content_designer",
    name: "Content Designer",
    description: "Turns source-grounded concepts into a structured lesson plan and teacher notes.",
    skills: ["lesson_design", "source_grounding"],
    tools: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "example_designer",
    name: "Example Designer",
    description: "Creates worked examples with teaching purpose, steps, explanations, and common mistakes.",
    skills: ["example_design", "source_grounding"],
    tools: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "question_designer",
    name: "Question Designer",
    description: "Creates high-quality questions with answers, explanations, difficulty, and concept targets.",
    skills: ["question_design", "source_grounding"],
    tools: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "slide_designer",
    name: "Slide Designer",
    description: "Creates slide-ready content, outline, speaker notes, and visual suggestions.",
    skills: ["slide_design", "lesson_design", "source_grounding"],
    tools: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "slide_reviewer",
    name: "Slide Reviewer",
    description: "Reviews slides for clarity, pacing, coverage, and source-grounded correctness.",
    skills: ["slide_design", "quality_review", "source_grounding"],
    tools: ["source_citation_lookup", "rubric_scorer", "workflow_event_writer"]
  },
  {
    id: "quality_reviewer",
    name: "Quality Reviewer",
    description: "Reviews the full lesson package for coverage, groundedness, consistency, and blocking issues.",
    skills: ["quality_review", "source_grounding", "pedagogical_review"],
    tools: ["source_citation_lookup", "rubric_scorer", "workflow_event_writer"]
  }
];
