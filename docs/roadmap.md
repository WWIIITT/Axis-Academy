# Axis Academy MVP Roadmap

## 1. Roadmap Overview

The MVP goal is to complete a usable teacher workflow: create a lesson project, add source materials, parse them into traceable chunks, generate lesson assets, review correctness, and let the teacher approve the final package.

The first release does not include student features, LMS integration, multi-tenant school accounts, provider routing, or external fact-checking. Those will come later after the core teacher workflow is stable.

## 2. Milestone 1: Foundation and Data Model

Goals:

- Build the Next.js full-stack project.
- Build the lesson project, source document, source map, agent task, workflow event, and artifact data model.
- Build server-side provider config.
- Build the development teacher stub.
- Build the agent catalog, skills catalog, and tools catalog.

Done when:

- A teacher can create a lesson project.
- The system can save project metadata.
- API keys are only used server-side.
- Workflow events can be written and read.
- `/api/agents/catalog` returns agent, skills, and tools metadata.

Not done:

- No agent execution.
- No LLM calls.
- No tool calls.
- No PDF/PPTX parsing.
- No teaching content generation.

Milestone 1 keeps agent skills and tools as registry metadata only.

## 3. Milestone 2: Document Ingestion

Goals:

- Support PDF, PPTX, and pasted text.
- Extract text from teaching materials.
- Split text into traceable chunks.
- Build source maps.
- Show parsing warnings.

Done when:

- A teacher can upload or paste teaching material.
- The system can extract usable text.
- Each chunk keeps page, slide, section, or paragraph references.
- Parsing failures are shown clearly.
- Document parsing and text chunking can later be called by Milestone 3 agents through a tool interface.

Not done:

- No full agent prompts.
- No multi-agent workflow.
- No generated slides, examples, or questions.

Milestone 2 makes ingestion tools reusable for Milestone 3.

## 4. Milestone 3: Agent Pipeline MVP

Goals:

- Implement Project Manager orchestration.
- Implement Document Analyst, Subject Teacher, Content Designer, Example Designer, Question Designer, and Slide Designer.
- Turn the Milestone 1 registry into executable skill packs and tool contracts.
- Define agent prompt contracts, tool call contracts, and structured output schemas.
- Let the Project Manager run a complete pipeline.

Done when:

- One teaching material can produce lesson summary, examples, questions, and slide content.
- Every agent task emits workflow events.
- Every agent output uses a structured schema.
- Every tool call has input and output schema, retry handling, and validation.
- Generated content includes source references or derived-content markers.
- Output validation can trigger retry or regeneration.

Milestone 3 requires:

- Executable skills: how each skill affects prompt, tool access, output schema, and quality gate.
- Tool dispatcher: run tools centrally and record tool call results.
- Tool permissions: each agent can only call authorized tools.
- Handoff rules: how agent output enters the next agent.
- Provider adapter usage: agent calls use OpenAI-compatible API through the provider adapter.

## 5. Milestone 4: Review and Correctness Gate

Goals:

- Implement Slide Reviewer and Quality Reviewer.
- Check coverage, groundedness, factual consistency, and warnings.
- Let the Project Manager react to blocking reviewer issues.

Done when:

- Reviewer reports can point out missing references, weak coverage, or contradictions.
- Blocking issues stop final acceptance.
- Non-blocking warnings are shown to the teacher.
- The teacher review package includes a clean summary.

## 6. Milestone 5: Teacher Review UI

Goals:

- Build live workflow trace UI.
- Show agent status, progress, review warnings, and teacher-facing summaries.
- Support approve, edit, regenerate selected section, and final acceptance.

Done when:

- The teacher can see each agent state.
- The teacher can review generated slides, examples, and questions.
- The teacher can edit content.
- The teacher can request local regeneration.
- The teacher can finish final acceptance.

## 7. Milestone 6: Evaluation Harness

Goals:

- Build fixed teaching material samples.
- Define sample rubrics.
- Run the agent workflow repeatedly.
- Score coverage, groundedness, example quality, question quality, slide quality, and reviewer accuracy.

Done when:

- The pipeline can be rerun on fixed samples.
- A regression report can be generated.
- Reports record model, provider, prompt version, and workflow version.
- Changes below threshold are flagged.

## 8. Milestone 7: Export Preparation

Goals:

- Organize the final accepted lesson package.
- Support structured JSON and Markdown export.
- Keep the data structure ready for later PPTX export.

Done when:

- Final acceptance can produce a complete lesson package.
- The export includes lesson summary, slides, examples, questions, and review metadata.
- Export does not include API keys, raw provider responses, or internal debug data.

## 9. Later Versions

Possible future additions after the MVP:

- Student practice portal.
- LMS integration.
- PPTX export.
- External fact-checking.
- Multi-provider fallback.
- Per-agent model routing.
- Subject-specific rubrics.
- School-level account management.
- Advanced analytics.

## 10. Near-Term Order

Recommended implementation order:

1. Finish Next.js foundation and data model.
2. Finish provider adapter and structured output validation.
3. Finish PDF/PPTX/text ingestion.
4. Connect ingestion tools to agent tool calls.
5. Implement Project Manager and the first three specialist agents.
6. Add examples, questions, and slides generation.
7. Add reviewer agents.
8. Build teacher review UI.
9. Build evaluation harness.
10. Add export preparation.

Core boundaries:

- Milestone 1: agent/skill/tool metadata.
- Milestone 2: ingestion tools.
- Milestone 3: executable agents, skills, and tool calls.
