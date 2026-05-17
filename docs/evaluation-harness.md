# Axis Academy Evaluation Harness

## Purpose

The evaluation harness is the engineering quality gate for agent workflow changes. It is not a replacement for teacher approval. It gives the team a repeatable way to compare prompt, model, provider, rubric, and orchestration changes before they affect the product workflow.

## Milestone 6 Scope

Milestone 6 implements a deterministic MVP harness:

- Fixed teaching material samples in code.
- Expected concepts, objectives, required coverage, misconceptions, and expected reviewer findings.
- Scoring for source coverage, groundedness, factual consistency, example quality, question quality, slide quality, and reviewer accuracy.
- Aggregate regression report.
- API route: `GET/POST /api/evaluation/run`.
- Dashboard panel for running the harness and inspecting failures.
- CLI helper: `npm run eval`, which calls the local Next.js API and writes `evaluation-reports/latest.json`.

The CLI expects the local dev server to be running because it exercises the same API route as the dashboard.

## Metrics

| Metric | Purpose | MVP threshold |
| --- | --- | --- |
| `sourceCoverage` | Checks whether required source concepts appear in generated output. | 0.85 |
| `groundedness` | Checks whether examples, questions, and slides carry source references. | 0.90 |
| `factualConsistency` | Checks whether expected concepts are retained and known misconceptions are avoided. | 1.00 |
| `exampleQuality` | Checks whether examples have explanation and source references. | 0.80 |
| `questionQuality` | Checks prompt, answer, explanation, difficulty, and source references. | 0.85 |
| `slideQuality` | Checks slide title, bullet count, and source references. | 0.80 |
| `reviewerAccuracy` | Checks whether expected blocking issues are caught by reviewer output. | 0.80 |

## Report Contents

Each report includes:

- Run id and timestamp.
- Model/provider metadata from server-side provider config.
- Prompt version and workflow version.
- Sample count.
- Thresholds.
- Aggregate scores.
- Per-sample scores.
- Per-sample failures and notes.

## Future Expansion

After the deterministic MVP is stable, the harness should evolve to:

- Run the full agent pipeline on fixed samples.
- Persist historical reports for trend comparison.
- Compare providers and per-agent model choices.
- Add subject-specific rubrics.
- Add fault injection for reviewer recall.
- Add human expert adjudication for ambiguous failures.
