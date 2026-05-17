---
name: design-lesson
description: Convert source-grounded concepts into a teachable lesson structure, section plan, learning flow, and teacher notes. Use when designing the core lesson before examples, questions, or slides.
---

# Design Lesson

## Purpose
Create a coherent lesson structure from source-grounded inputs.

## Procedure
- Start from learning objectives and concept dependencies.
- Group content into teachable sections.
- Add teacher notes for transitions, emphasis, and likely difficulties.
- Preserve source coverage so downstream examples, questions, and slides can trace back to the material.

## Required Inputs
- Concept inventory
- Learning objective candidates
- Source references
- Pedagogy review, when available

## Required Outputs
- Lesson summary
- Section plan
- Coverage map
- Teacher notes
- Downstream task guidance

## Allowed Tools
- `source_citation_lookup`
- `structured_output_validator`
- `workflow_event_writer`

## Quality Gates
- Cover all required source objectives.
- Do not add unsupported factual content.
- Keep the lesson structure usable by example, question, and slide design.
