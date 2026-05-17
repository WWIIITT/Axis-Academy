# Axis Academy Agent System

## 1. System Overview

Axis Academy uses a Project Manager-led multi-agent workflow. The Project Manager decomposes the lesson task, assigns specialist agents, validates structured outputs, resolves conflicts, triggers retries, and consolidates the final teacher-facing package.

Core rules:

- Each agent only handles its own boundary.
- Every output must be structured.
- Every important claim must keep source references or be marked as derived content.
- Reviewer agents do not rewrite content unless the Project Manager explicitly requests regeneration.
- The Project Manager is the only agent responsible for final synthesis.

## 2. Milestone Split

- Milestone 1: static registry for agents, skills, and tools.
- Milestone 2: ingestion tools for PDF, PPTX, and pasted text.
- Milestone 3: executable orchestration, skill packs, tool dispatcher, tool contracts, and agent handoff validation.

## 3. Agent Registry

| Agent | Main role | Main outputs |
| --- | --- | --- |
| Project Manager | Coordinate workflow, quality gates, conflict handling, final synthesis | Workflow state, final lesson package, teacher review summary |
| Document Analyst | Parse materials, extract concepts, definitions, and references | Source map, concept inventory, learning objectives |
| Subject Teacher | Review sequencing, difficulty, prerequisites, and misconceptions | Pedagogy review, teaching sequence, misconception notes |
| Content Designer | Turn grounded content into lesson structure | Lesson summary, section plan, coverage map |
| Example Designer | Design worked examples and explanations | Examples, steps, common mistakes |
| Question Designer | Design formative and summative questions | Question bank, answer keys, difficulty labels |
| Slide Designer | Generate slide-ready content | Slide outline, slide content, speaker notes |
| Slide Reviewer | Check clarity, pacing, coverage, and groundedness | Slide review report, revision requests |
| Quality Reviewer | Check overall groundedness and consistency | Quality report, warnings, approval recommendation |

## 4. Agent Skills

Milestone 1 defines skills as metadata only:

- `workflow_orchestration`
- `document_analysis`
- `source_grounding`
- `pedagogical_review`
- `lesson_design`
- `example_design`
- `question_design`
- `slide_design`
- `quality_review`

Milestone 3 turns each skill into an executable skill pack.

Each skill pack should define:

- Purpose
- Allowed agents
- Allowed tools
- Prompt instructions
- Required inputs
- Required output schema
- Quality gates
- Failure handling

Recommended location: `.agents/skills/<skill-name>/SKILL.md`

## 5. MCP Tools

Milestone 1 defines tools as metadata only:

- `document_parser`
- `text_chunker`
- `source_map_builder`
- `source_citation_lookup`
- `structured_output_validator`
- `rubric_scorer`
- `artifact_versioner`
- `workflow_event_writer`

Milestone 2 implements ingestion-related tools.
Milestone 3 exposes the tool layer through MCP-style tool contracts.

Each tool call should carry:

- `tool_name`
- `agent_task_id`
- `input_json`
- `output_json`
- `status`
- `error_message`
- `started_at`
- `completed_at`

Tool rules:

- An agent can only call tools listed in its catalog entry.
- Input and output must pass schema validation.
- Tool failure must be written into workflow events.
- Tool output must be usable by the Project Manager for the next handoff.

## 6. Handoff Contract

Every agent output should include:

- `agent_name`
- `task_id`
- `status`
- `summary`
- `artifacts`
- `source_references`
- `warnings`
- `tool_calls`
- `next_actions`

The Project Manager only accepts schema-valid output. If the schema is invalid, a source reference is missing, or a required field is absent, the Project Manager should request correction instead of moving forward.

## 7. Orchestration Flow

1. Project Manager creates the workflow.
2. Document Analyst extracts source maps and concept inventory.
3. Subject Teacher checks pedagogy, order, and difficulty.
4. Content Designer builds the lesson structure.
5. Example Designer and Question Designer work from the approved lesson structure.
6. Slide Designer turns the lesson into slide-ready content.
7. Slide Reviewer checks the slide package.
8. Quality Reviewer checks the full package.
9. Project Manager handles revision loops or prepares the teacher review package.
10. Teacher reviews, edits, or requests local regeneration.

## 8. Skill Pack Guidance

- Keep `SKILL.md` short and operational.
- Put long references in `references/`.
- Put reusable deterministic code in `scripts/`.
- Use names that match the agent registry and API catalog.
- Keep trigger descriptions precise enough for skill discovery.
