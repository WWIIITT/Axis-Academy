# Axis Academy Product Blueprint

## Product Positioning

Axis Academy is a teacher-facing AI lesson production platform. Teachers upload or paste teaching materials, and a multi-agent workflow turns those materials into source-grounded lesson assets such as summaries, examples, questions, slides, and review reports.

The MVP does not replace teachers. It reduces repetitive preparation work while keeping teachers responsible for review, editing, and final acceptance.

## MVP Goals

- Support PDF, PPTX, and pasted text inputs.
- Extract usable source text and build traceable source chunks.
- Generate lesson summaries, examples, questions, and slide-ready content.
- Keep generated content source-grounded or explicitly marked as derived.
- Show a teacher-readable workflow trace.
- Let teachers approve, edit, regenerate selected sections, and complete final acceptance.

## Primary User

The first MVP user is a teacher.

Teacher needs:

- Convert existing materials into a clear lesson quickly.
- Get higher-quality worked examples.
- Get questions with answers, explanations, difficulty, and concept coverage.
- Check whether AI missed or distorted important source content.
- Keep final approval control.

## Core Workflow

1. Teacher creates a lesson project.
2. Teacher uploads PDF/PPTX or pastes text.
3. System parses materials and creates a source map.
4. Document Analyst extracts concepts, definitions, structure, and references.
5. Subject Teacher reviews sequence, difficulty, prerequisites, and misconceptions.
6. Content Designer creates lesson structure and summary.
7. Example Designer creates worked examples.
8. Question Designer creates questions, answers, explanations, and difficulty labels.
9. Slide Designer creates slide-ready content.
10. Slide Reviewer and Quality Reviewer check clarity, coverage, correctness, and source grounding.
11. Project Manager consolidates results and flags teacher attention points.
12. Teacher reviews, edits, regenerates selected sections, or accepts the final package.

## MVP Outputs

Each lesson project should produce:

- Lesson summary
- Slide outline
- Slide content
- Worked examples
- Questions
- Review report
- Final package

## Correctness Strategy

The first correctness strategy is source-grounded review plus teacher approval.

Rules:

- Important concepts, definitions, examples, and answers need source support.
- Derived content must be marked with a derived-content reason.
- Unsupported content must be surfaced as a warning.
- Agents must not add external facts unless a future external fact-checking workflow is explicitly added.
- Final correctness remains teacher-approved, but the system must complete automatic checks first.

## Non-Goals

The MVP does not include:

- Student practice portal.
- LMS publishing.
- Multi-tenant school administration.
- Video or audio material processing.
- External web fact-checking.
- Full PowerPoint export engine.
- Per-agent model routing or provider fallback.

## Success Criteria

The MVP is successful when:

- A teacher can create a lesson project from PDF, PPTX, or text.
- The system can produce slides, examples, and questions.
- Workflow trace shows agent state and review outcomes clearly.
- Generated content shows source support or warnings.
- The teacher can approve, edit, regenerate, and accept final content.
- Evaluation harness can compare prompts, models, or orchestration versions on fixed materials.
