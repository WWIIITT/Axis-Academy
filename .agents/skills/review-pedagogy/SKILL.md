---
name: review-pedagogy
description: Review lesson sequence, prerequisites, difficulty, misconceptions, cognitive load, and learner readiness. Use when checking whether source-grounded content is teachable for the target education level.
---

# Review Pedagogy

## Purpose
Check whether the lesson can be taught clearly to the target learners.

## Procedure
- Review prerequisite assumptions before sequencing content.
- Identify likely misconceptions and boundary cases.
- Check whether difficulty matches HKDSE or HKQF level metadata when available.
- Recommend sequencing changes without rewriting unrelated content.

## Required Inputs
- Concept inventory or lesson structure
- Project subject and education level
- Source references
- Existing warnings

## Required Outputs
- Pedagogy review
- Sequencing recommendations
- Misconception notes
- Difficulty warnings

## Allowed Tools
- `source_citation_lookup`
- `rubric_scorer`
- `workflow_event_writer`

## Quality Gates
- Keep recommendations tied to the target level.
- Separate pedagogy concerns from factual correctness concerns.
- Return blocking issues to the Project Manager.
