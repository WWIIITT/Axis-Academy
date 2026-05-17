# Future Work

This document lists work that should be done later, but should not be implemented in the current Milestone 1 scope.

## Milestone 2: Document Ingestion

- Add PDF, PPTX, and pasted text ingestion.
- Store uploaded source metadata.
- Extract raw text from supported source types.
- Split extracted text into traceable source chunks.
- Create source maps with page, slide, section, and paragraph references.
- Surface parsing warnings in the dashboard.
- Add basic file validation for type, size, and empty content.

## Milestone 3: Agent Pipeline MVP

- Implement the Manager orchestration service.
- Implement agent execution boundaries for Document Analyst, Subject Teacher, Content Designer, Example Designer, Question Designer, and Slide Designer.
- Add structured output schemas for every agent.
- Add output validation before accepting handoffs.
- Add retry handling for invalid JSON, missing source references, and recoverable provider failures.
- Persist agent task state transitions and workflow events.
- Keep all generated content source-grounded or explicitly marked as derived content.

## Milestone 4: Review and Correctness Gates

- Implement Slide Reviewer and Quality Reviewer.
- Add coverage checks for core concepts and learning objectives.
- Add groundedness checks for important claims, examples, questions, and slides.
- Add blocking issue and non-blocking warning handling.
- Prevent final acceptance while blocking issues remain unresolved.
- Add reviewer reports to the teacher-facing workflow trace.

## Milestone 5: Teacher Review UI

- Add source upload UI.
- Add generated lesson package views for summaries, slides, examples, and questions.
- Add artifact editing.
- Add approve and final acceptance actions.
- Add selected-section regeneration.
- Add version comparison for regenerated artifacts.
- Add clearer workflow trace filtering for teacher-visible events.

## Milestone 6: Evaluation Harness

- Add fixed sample teaching materials.
- Add human-authored rubrics for each sample.
- Build repeatable evaluation runs for agent workflows.
- Score source coverage, groundedness, factual consistency, example quality, question quality, slide quality, and reviewer accuracy.
- Store model, provider, prompt version, workflow version, and score metadata.
- Produce regression reports before prompt, model, or orchestration changes are accepted.

## Milestone 7: Export Preparation

- Export final accepted lesson packages as structured JSON.
- Export final accepted lesson packages as Markdown.
- Preserve a structure that can later support PPTX export.
- Exclude raw provider responses, API keys, internal prompts, and debug-only telemetry from teacher exports.

## Authentication and Authorization

- Replace the development teacher stub with real authentication.
- Add teacher accounts.
- Add ownership checks on every project, source, task, event, and artifact.
- Add role boundaries if school or organization accounts are introduced.

## Provider and Model Layer

- Add a provider adapter around OpenAI-compatible chat completions.
- Add provider request timeout and retry handling.
- Add provider error normalization.
- Add per-agent model overrides after the baseline pipeline is stable.
- Add provider fallback only after evaluation harness coverage exists.

## Storage and Operations

- Add object storage for uploaded source files.
- Add data retention policy for source documents and generated artifacts.
- Add operational logs for provider calls, validation failures, retries, and workflow failures.
- Add monitoring for long-running workflows.
- Add background job processing for agent orchestration.

## Security and Privacy

- Keep all provider keys server-side only.
- Do not expose raw prompts or raw provider responses to teachers by default.
- Add file scanning and upload constraints before accepting production uploads.
- Add project-level data deletion.
- Add audit logs for teacher edits, approvals, and regenerations.

## Not Now

The following should remain out of scope until the core teacher workflow is stable:

- Student practice portal.
- LMS integration.
- Multi-tenant school administration.
- Advanced analytics.
- External web fact-checking.
- Full PPTX export.
- Multi-provider routing.
- Per-agent model marketplace.
