---
name: analyze-source-material
description: Extract structure, concepts, definitions, learning objectives, prerequisites, and source references from uploaded teaching material. Use when an agent must turn source documents into traceable lesson inputs.
---

# Analyze Source Material

## Purpose
Turn raw teacher materials into structured, source-grounded understanding.

## Procedure
- Inspect source documents and available chunks before drawing conclusions.
- Extract concepts, definitions, formulas, examples, learning objectives, and prerequisite hints.
- Keep source facts separate from teaching recommendations.
- Record warnings for missing text, weak extraction, duplicate sections, or ambiguous references.

## Required Inputs
- Source document metadata
- Source map chunks
- Parse status and parse warnings
- Project subject and level, when available

## Required Outputs
- Concept inventory
- Definition list
- Learning objective candidates
- Source reference map
- Extraction warnings

## Allowed Tools
- `document_parser`
- `text_chunker`
- `source_citation_lookup`
- `workflow_event_writer`

## Quality Gates
- Every extracted fact must cite source chunks.
- Do not invent missing content.
- Mark OCR or parsing gaps as warnings.
