---
name: review-quality
description: Review lesson package coverage, groundedness, consistency, artifact readiness, warnings, and blocking issues. Use when validating outputs before teacher review or export.
---

# Review Quality

## Purpose
Decide whether the current lesson package is ready for teacher review.

## Procedure
- Check source coverage across lesson, examples, questions, and slides.
- Check factual consistency, answer correctness, difficulty labels, and warning severity.
- Score outputs against the current rubric.
- Return actionable revision requests to the Project Manager.

## Required Inputs
- Current artifacts
- Source references
- Workflow events and warnings
- Rubric criteria

## Required Outputs
- Quality review report
- Blocking issue list
- Revision requests
- Approval recommendation

## Allowed Tools
- `source_citation_lookup`
- `rubric_scorer`
- `structured_output_validator`
- `workflow_event_writer`

## Quality Gates
- Do not approve packages with unsupported factual claims.
- Treat answer correctness as blocking.
- Preserve all unresolved warnings for teacher visibility.
