# Axis Academy Orchestration Platform

## Architecture Direction

The MVP uses a Next.js full-stack architecture. The web UI, API routes, workflow orchestration, and provider integration live in one product boundary so the teacher workflow can be built quickly.

Recommended components:

- Next.js App Router
- TypeScript
- API routes as backend entrypoints
- PostgreSQL for projects, sources, tasks, events, and artifacts
- Local ignored uploads for MVP source files
- OpenAI-compatible provider adapter
- Future background job runner for long-running workflows

## Core Data Model

Current primary entities:

- `LessonProject`
- `SourceDocument`
- `SourceMapChunk`
- `AgentTask`
- `WorkflowEvent`
- `Artifact`

`AgentTask` and `WorkflowEvent` are the primary trace sources for Milestone 3.

## API Shape

Current and near-term API routes:

- `POST /api/lesson-projects`
- `GET /api/lesson-projects`
- `GET /api/lesson-projects/:id`
- `POST /api/lesson-projects/:id/sources`
- `POST /api/lesson-projects/:id/events`
- `GET /api/agents/catalog`
- `GET /api/provider/status`
- `POST /api/lesson-projects/:id/workflow/start`
- `POST /api/lesson-projects/:id/workflow/advance`
- `GET /api/lesson-projects/:id/workflow`

Raw prompts, raw provider responses, and API keys should not be exposed to the teacher-facing UI by default.

## Live Workflow Trace UI

The teacher should see understandable progress, not a debug console.

The UI should show:

- Project status
- Agent task list
- Current agent state
- Teacher-facing summaries
- Source-grounding checks
- Review warnings and blocking issues
- Retry or regeneration status

The UI should not show:

- Raw prompts
- Raw provider responses
- API keys
- Token-level traces
- Internal stack traces

## Workflow States

Project-level states:

- `DRAFT`
- `UPLOADED`
- `PROCESSING`
- `NEEDS_TEACHER_REVIEW`
- `APPROVED`
- `EXPORTED`
- `FAILED`

Agent task states:

- `QUEUED`
- `RUNNING`
- `REVIEWING`
- `COMPLETED`
- `NEEDS_REVISION`
- `FAILED`

## Regeneration Flow

Regeneration should preserve version history.

Flow:

1. Teacher selects an artifact or section.
2. UI sends a regeneration request with teacher instructions.
3. Project Manager retrieves relevant source references and context.
4. The responsible specialist agent regenerates only that section.
5. Reviewer checks affected content.
6. A new artifact version is saved.
7. UI shows version differences and warnings.

## Storage and Privacy

The MVP should retain:

- Uploaded source material
- Extracted text
- Source map chunks
- Agent outputs
- Workflow events
- Teacher edits
- Review reports
- Final accepted version

Sensitive data rules:

- API keys only exist in server-side environment variables.
- Raw provider logs are not teacher-visible by default.
- Prompts and responses, if stored later, must be marked as internal telemetry.
- Future school deployments need a data retention policy.

## Observability

The system should record:

- Agent task start and completion time
- Provider request success or failure
- Retry counts
- Structured output validation failures
- Reviewer blocking issues
- Teacher edits and approval actions
