# Axis Academy Provider Config

## Purpose

Axis Academy uses an OpenAI-compatible provider contract. The system should not depend on one provider-specific SDK in agent code. All model calls should go through a server-side provider adapter.

## Environment Variables

Required:

```env
AI_API_KEY=
AI_BASE_URL=
AI_MODEL_NAME=
```

Optional:

```env
AI_REQUEST_TIMEOUT_MS=60000
AI_MAX_RETRIES=2
AI_TEMPERATURE=0.2
AI_MAX_OUTPUT_TOKENS=4000
```

Rules:

- `AI_API_KEY` is server-side only.
- `AI_BASE_URL` points to the OpenAI-compatible base URL.
- `AI_MODEL_NAME` is the default model for MVP agents.
- Browser code must never receive the API key.

## Request Contract

The MVP uses chat completions format.

Requests should include:

- `model`
- `messages`
- `temperature`
- structured output instructions
- `max_tokens`

All agent calls go through the provider adapter, not directly from individual agent logic.

## Provider Adapter Responsibilities

The provider adapter should:

- Read environment config.
- Build OpenAI-compatible requests.
- Apply timeout and retry policy.
- Parse provider responses.
- Normalize provider errors.
- Return model metadata for workflow events.

Normalized error types:

- `authentication_error`
- `rate_limit_error`
- `timeout_error`
- `invalid_request_error`
- `provider_unavailable`
- `invalid_response_format`
- `unknown_provider_error`

## Agent Model Policy

The MVP uses one `AI_MODEL_NAME`.

Reasons:

- Lower configuration complexity.
- Easier evaluation baseline.
- Fewer differences caused by per-agent model changes.

Future versions can add:

- `AI_PROJECT_MANAGER_MODEL_NAME`
- `AI_REVIEWER_MODEL_NAME`
- `AI_DESIGNER_MODEL_NAME`
- provider fallback
- per-project model selection

## Prompt and Structured Output

Every agent prompt should include:

- Agent role
- Task objective
- Input artifacts
- Required output schema
- Source-grounding rules
- Warning rules
- Teacher-facing summary requirement

Structured output rules:

- Prefer JSON-compatible output.
- Important artifacts must include `source_references` or `derived_content_reason`.
- Reviewer output must separate `blocking_issues` and `non_blocking_warnings`.
- Provider response must pass schema validation before entering workflow state.

## Retry Policy

MVP retry policy:

- Provider timeout: retry up to `AI_MAX_RETRIES`.
- Rate limit: short backoff then retry.
- Invalid JSON: ask the same agent to repair format once.
- Missing source references: return to the same agent for correction; if still unresolved, mark warning.
- Factual inconsistency: Project Manager triggers the relevant specialist agent regeneration.

Retry events must be written to workflow events so the UI can show teacher-readable progress.

## Security and Privacy

Provider calls may include teacher-provided material. The system must:

- Send only task-relevant context.
- Avoid sending the entire raw source to every agent when chunks are enough.
- Avoid client-side logging of provider requests.
- Avoid showing API keys or raw request headers in workflow trace.
- Revisit source transmission policy before adding external fact-checking.

## Portability Requirements

To preserve provider portability:

- Agent logic must not depend on provider-specific SDKs.
- Provider adapter wraps request and response differences.
- Evaluation harness records provider, base URL label, model name, prompt version, and workflow version.
- MVP should not depend on provider-specific capabilities without fallback.
