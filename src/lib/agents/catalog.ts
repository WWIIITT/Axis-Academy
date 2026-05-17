import { mcpToolCatalog } from "@/lib/mcp/catalog";

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
  skillPackPath: string;
  skills: string[];
  tools: string[];
};

export const agentSkills: AgentSkill[] = [
  {
    id: "workflow_orchestration",
    name: "Workflow orchestration",
    description: "Plan task order, validate handoffs, and coordinate retry or review decisions."
  },
  {
    id: "document_analysis",
    name: "Document analysis",
    description: "Extract concepts, definitions, objectives, and structure from teacher materials."
  },
  {
    id: "source_grounding",
    name: "Source grounding",
    description: "Link claims and generated content back to source chunks or mark derived content."
  },
  {
    id: "pedagogical_review",
    name: "Pedagogical review",
    description: "Check sequence, difficulty, prerequisites, and likely misconceptions."
  },
  {
    id: "lesson_design",
    name: "Lesson design",
    description: "Turn extracted material into teachable lesson sections and teacher notes."
  },
  {
    id: "example_design",
    name: "Example design",
    description: "Create worked examples with steps, explanations, and common mistakes."
  },
  {
    id: "question_design",
    name: "Question design",
    description: "Create questions with answers, explanations, difficulty, and concept targets."
  },
  {
    id: "slide_design",
    name: "Slide design",
    description: "Create slide-ready content, speaker notes, and visual suggestions."
  },
  {
    id: "quality_review",
    name: "Quality review",
    description: "Review coverage, groundedness, consistency, warnings, and blocking issues."
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
    skillPackPath: ".agents/skills/project-manager/SKILL.md",
    skills: ["workflow_orchestration", "source_grounding", "quality_review"],
    tools: ["structured_output_validator", "artifact_versioner", "workflow_event_writer"]
  },
  {
    id: "document-analyst",
    name: "Document Analyst",
    description: "Extract source structure, concept inventory, definitions, and learning objective candidates.",
    skillPackPath: ".agents/skills/document-analyst/SKILL.md",
    skills: ["document_analysis", "source_grounding"],
    tools: ["document_parser", "text_chunker", "source_citation_lookup", "workflow_event_writer"]
  },
  {
    id: "subject-teacher",
    name: "Subject Teacher",
    description: "Review pedagogy, prerequisites, sequencing, difficulty, and misconceptions.",
    skillPackPath: ".agents/skills/subject-teacher/SKILL.md",
    skills: ["pedagogical_review", "lesson_design"],
    tools: ["source_citation_lookup", "rubric_scorer", "workflow_event_writer"]
  },
  {
    id: "content-designer",
    name: "Content Designer",
    description: "Turn source-grounded concepts into a structured lesson plan and teacher notes.",
    skillPackPath: ".agents/skills/content-designer/SKILL.md",
    skills: ["lesson_design", "source_grounding"],
    tools: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "example-designer",
    name: "Example Designer",
    description: "Create worked examples with teaching purpose, steps, explanations, and common mistakes.",
    skillPackPath: ".agents/skills/example-designer/SKILL.md",
    skills: ["example_design", "source_grounding"],
    tools: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "question-designer",
    name: "Question Designer",
    description: "Create high-quality questions with answers, explanations, difficulty, and concept targets.",
    skillPackPath: ".agents/skills/question-designer/SKILL.md",
    skills: ["question_design", "source_grounding"],
    tools: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "slide-designer",
    name: "Slide Designer",
    description: "Create slide-ready content, outline, speaker notes, and visual suggestions.",
    skillPackPath: ".agents/skills/slide-designer/SKILL.md",
    skills: ["slide_design", "lesson_design", "source_grounding"],
    tools: ["source_citation_lookup", "structured_output_validator", "workflow_event_writer"]
  },
  {
    id: "slide-reviewer",
    name: "Slide Reviewer",
    description: "Review slides for clarity, pacing, coverage, and source-grounded correctness.",
    skillPackPath: ".agents/skills/slide-reviewer/SKILL.md",
    skills: ["slide_design", "quality_review", "source_grounding"],
    tools: ["source_citation_lookup", "rubric_scorer", "workflow_event_writer"]
  },
  {
    id: "quality-reviewer",
    name: "Quality Reviewer",
    description: "Review the full lesson package for coverage, groundedness, consistency, and blocking issues.",
    skillPackPath: ".agents/skills/quality-reviewer/SKILL.md",
    skills: ["quality_review", "source_grounding", "pedagogical_review"],
    tools: ["source_citation_lookup", "rubric_scorer", "workflow_event_writer"]
  }
];
