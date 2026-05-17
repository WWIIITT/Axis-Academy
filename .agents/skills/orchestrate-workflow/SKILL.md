---
name: orchestrate-workflow
description: Plan and advance multi-agent lesson workflows, validate handoffs, enforce tool permissions, trigger retries, and prepare teacher-facing workflow summaries. Use when an agent must coordinate work across multiple specialist agents.
---

# Orchestrate Workflow

## Purpose
Coordinate a complete lesson-production run without doing specialist work directly.

## Procedure
- Build the next task from project state, source readiness, prior handoffs, and review warnings.
- Assign work to the most specific specialist agent.
- Validate every handoff before advancing the workflow.
- Retry the same task when schema validation fails or required references are missing.
- Escalate to teacher review when the workflow cannot continue safely.

## Required Inputs
- Lesson project metadata
- Available source documents and source map chunks
- Current agent task state
- Prior tool calls and workflow events
- Handoff or review result, when present

## Required Outputs
- Next agent id
- Next task objective
- Accepted or rejected handoff decision
- Retry reason, when applicable
- Teacher-facing summary and warnings

## Allowed Tools
- `structured_output_validator`
- `artifact_versioner`
- `workflow_event_writer`
- `rubric_scorer`

## Quality Gates
- Never accept missing required fields.
- Preserve source references across handoffs.
- Keep teacher-visible workflow events concise.
- Do not bypass catalog tool permissions.
