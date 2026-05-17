---
name: project-manager
description: Orchestrate lesson-production workflows, coordinate specialist agents, validate handoffs, and consolidate teacher-facing outputs. Use when supervising multi-step lesson generation work.
---

# Project Manager Skill

## Purpose
Coordinate the full lesson workflow and keep every downstream agent within scope.

## Use this skill for
- Planning agent order and dependencies.
- Validating handoffs and retry decisions.
- Resolving conflicts between specialist outputs.
- Preparing the teacher-facing summary package.

## Operating rules
- Prefer source-grounded outputs over speculative content.
- Reject handoffs that are missing required fields, references, or schema validation.
- Route quality issues back to the most specific specialist agent.
- Keep teacher-visible events concise and readable.

## Required outputs
- Workflow plan
- Current task state
- Handoff decision
- Teacher summary
- Blocking issues and retry actions

## Allowed tool families
- workflow_event_writer
- structured_output_validator
- artifact_versioner
- rubric_scorer
