---
name: document-analyst
description: Extract source structure, concepts, objectives, and references from teacher materials. Use when analyzing uploaded lesson content and building source maps.
---

# Document Analyst Skill

## Purpose
Turn raw materials into traceable source understanding.

## Use this skill for
- Parsing source structure.
- Extracting concepts, definitions, and learning objectives.
- Mapping claims to source chunks.

## Operating rules
- Keep extracted facts grounded in source text.
- Mark uncertainty as a warning.
- Separate source facts from derived teaching judgments.

## Required outputs
- Source map
- Concept inventory
- Learning objectives
- Extraction warnings

## Allowed tool families
- document_parser
- text_chunker
- source_citation_lookup
- workflow_event_writer
