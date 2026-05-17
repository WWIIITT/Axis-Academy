import { mcpToolCatalog } from "@/lib/mcp/catalog";

export type AgentSkill = {
  id: string;
  name: string;
  description: string;
  skillPackPath: string;
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
  skillIds: string[];
  toolIds: string[];
};

export const agentSkills: AgentSkill[] = [
  {
    id: "orchestrate-workflow",
    name: "Orchestrate workflow",
    description: "Plan task order, validate handoffs, and coordinate retry or review decisions.",
    skillPackPath: ".agents/skills/orchestrate-workflow/SKILL.md"
  },
  {
    id: "analyze-source-material",
    name: "Analyze source material",
    description: "Extract concepts, definitions, objectives, and structure from teacher materials.",
    skillPackPath: ".agents/skills/analyze-source-material/SKILL.md"
  },
  {
    id: "ground-claims",
    name: "Ground claims",
    description: "Link claims and generated content back to source chunks or mark derived content.",
    skillPackPath: ".agents/skills/ground-claims/SKILL.md"
  },
  {
    id: "review-pedagogy",
    name: "Review pedagogy",
    description: "Check sequence, difficulty, prerequisites, and likely misconceptions.",
    skillPackPath: ".agents/skills/review-pedagogy/SKILL.md"
  },
  {
    id: "design-lesson",
    name: "Design lesson",
    description: "Turn extracted material into teachable lesson sections and teacher notes.",
    skillPackPath: ".agents/skills/design-lesson/SKILL.md"
  },
  {
    id: "design-examples",
    name: "Design examples",
    description: "Create worked examples with steps, explanations, and common mistakes.",
    skillPackPath: ".agents/skills/design-examples/SKILL.md"
  },
  {
    id: "design-questions",
    name: "Design questions",
    description: "Create questions with answers, explanations, difficulty, and concept targets.",
    skillPackPath: ".agents/skills/design-questions/SKILL.md"
  },
  {
    id: "design-slides",
    name: "Design slides",
    description: "Create slide-ready content, speaker notes, and visual suggestions.",
    skillPackPath: ".agents/skills/design-slides/SKILL.md"
  },
  {
    id: "review-quality",
    name: "Review quality",
    description: "Review coverage, groundedness, consistency, warnings, and blocking issues.",
    skillPackPath: ".agents/skills/review-quality/SKILL.md"
  }
];

export const agentTools: AgentTool[] = mcpToolCatalog.map((tool) => ({
  id: tool.id,
  name: tool.name,
  description: tool.description
}));

export const agentCatalog: AgentSpec[] = [
  {
    id: "project-manager",
    name: "Project Manager",
    description: "Coordinate the workflow, validate handoffs, resolve conflicts, and prepare teacher-facing output.",
    skillIds: ["orchestrate-workflow", "ground-claims", "review-quality"],
    toolIds: ["structured_output_validator", "artifact_versioner", "workflow_event_writer"]
  },
  {
    id: "document-analyst",
    name: "Document Analyst",
    description: "Extract source structure, concept inventory, definitions, and learning objective candidates.",
    skillIds: ["analyze-source-material", "ground-claims"],
    toolIds: ["document_parser", "text_chunker", "source_citation_lookup", "workflow_event_writer"]
  },
  {
    id: "subject-teacher",
    name: "Subject Teacher",
    description: "Review pedagogy, prerequisites, sequencing, difficulty, and misconceptions.",
    skillIds: ["review-pedagogy", "design-lesson"],
    toolIds: ["source_citation_lookup", "rubric_scorer", "workflow_event_writer"]
  },
  {
    id: "content-designer",
    name: "Content Designer",
    description: "Turn source-grounded concepts into a structured lesson plan and teacher notes.",
    skillIds: ["design-lesson", "ground-claims"],
    toolIds: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "example-designer",
    name: "Example Designer",
    description: "Create worked examples with teaching purpose, steps, explanations, and common mistakes.",
    skillIds: ["design-examples", "ground-claims"],
    toolIds: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "question-designer",
    name: "Question Designer",
    description: "Create high-quality questions with answers, explanations, difficulty, and concept targets.",
    skillIds: ["design-questions", "ground-claims"],
    toolIds: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "slide-designer",
    name: "Slide Designer",
    description: "Create slide-ready content, outline, speaker notes, and visual suggestions.",
    skillIds: ["design-slides", "design-lesson", "ground-claims"],
    toolIds: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "slide-reviewer",
    name: "Slide Reviewer",
    description: "Review slides for clarity, pacing, coverage, and source-grounded correctness.",
    skillIds: ["design-slides", "review-quality", "ground-claims"],
    toolIds: ["source_citation_lookup", "rubric_scorer", "workflow_event_writer"]
  },
  {
    id: "quality-reviewer",
    name: "Quality Reviewer",
    description: "Review the full lesson package for coverage, groundedness, consistency, and blocking issues.",
    skillIds: ["review-quality", "ground-claims", "review-pedagogy"],
    toolIds: ["source_citation_lookup", "rubric_scorer", "workflow_event_writer"]
  }
];
