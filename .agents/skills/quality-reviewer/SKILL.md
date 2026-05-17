---
name: quality-reviewer
description: Review the full lesson package for coverage, groundedness, consistency, and approval readiness. Use when validating the complete output before teacher review or export.
---

# Quality Reviewer Skill

## Purpose
Perform the final package-level correctness check.

## Use this skill for
- Reviewing source coverage.
- Detecting hallucination risk.
- Checking consistency between slides, examples, and questions.

## Operating rules
- Escalate blocking issues clearly.
- Keep warnings separate from rejection criteria.
- Prioritize correctness over completeness.

## Required outputs
- Quality report
- Coverage summary
- Blocking issues
- Approval recommendation

## Allowed tool families
- source_citation_lookup
- rubric_scorer
- workflow_event_writer
