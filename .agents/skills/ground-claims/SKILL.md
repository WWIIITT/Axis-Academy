---
name: ground-claims
description: Link lesson claims, examples, questions, and slide content back to source chunks or mark them as derived teaching content. Use when validating factual consistency and source traceability.
---

# Ground Claims

## Purpose
Ensure content can be traced to source material or clearly labeled as derived.

## Procedure
- Identify factual claims in the candidate output.
- Attach source references to claims that come from uploaded materials.
- Mark examples, analogies, teaching transitions, and scaffolding as derived content when they are not direct source facts.
- Flag unsupported claims that look factual but lack source evidence.

## Required Inputs
- Candidate content
- Source map chunks
- Existing source references
- Project subject and level

## Required Outputs
- Grounded claim list
- Unsupported claim warnings
- Derived content labels
- Corrected source references

## Allowed Tools
- `source_citation_lookup`
- `structured_output_validator`
- `workflow_event_writer`

## Quality Gates
- Do not hide unsupported factual claims as derived content.
- Keep references specific to chunk ids whenever possible.
- Preserve original source ids through every handoff.
