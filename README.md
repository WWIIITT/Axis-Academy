# Axis Academy

Axis Academy is a teacher-facing AI lesson production platform. Teachers upload or paste teaching materials, and a multi-agent workflow prepares source-grounded lesson assets such as summaries, slides, examples, and questions.

This repository currently implements Milestone 1: the Next.js application foundation, Prisma data model, provider configuration, development teacher stub, workflow event foundation, and a static agent skills/tools catalog.

## Current Status

Implemented:

- Next.js App Router with TypeScript.
- Tailwind CSS and ESLint.
- Prisma schema for PostgreSQL.
- Server-side OpenAI-compatible provider configuration.
- Development teacher stub using `dev-teacher`.
- Agent catalog API with skills and tools.
- Lesson project APIs.
- Workflow event API.
- Developer-facing dashboard.

Not implemented yet:

- PDF/PPTX/text ingestion.
- Actual LLM calls.
- Agent execution.
- Teacher authentication.
- File upload.
- Content review/edit/export workflow.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Zod
- npm

## Environment Setup

Create a local environment file:

```powershell
Copy-Item .env.example .env
```

Required variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/axis_academy?schema=public"
AI_API_KEY=""
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL_NAME=""
```

Optional variables:

```env
AI_REQUEST_TIMEOUT_MS="60000"
AI_MAX_RETRIES="2"
AI_TEMPERATURE="0.2"
AI_MAX_OUTPUT_TOKENS="4000"
```

Do not commit `.env`.

## Install Dependencies

```powershell
npm install
```

## Prisma

Generate the Prisma client:

```powershell
npm run prisma:generate
```

Prisma also requires PostgreSQL to be running before the app can read or write lesson projects. The default local connection is:

```text
localhost:5432
```

If the dashboard shows that the database is unavailable, start PostgreSQL and confirm `DATABASE_URL` in `.env`.

### PostgreSQL with Docker

The recommended local setup is Docker:

```powershell
docker run --name axis-academy-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=axis_academy `
  -p 5432:5432 `
  -d postgres:16
```

If the container already exists but is stopped:

```powershell
docker start axis-academy-postgres
```

Check that PostgreSQL is running:

```powershell
docker ps --filter "name=axis-academy-postgres"
```

On Windows, stop the Next.js development server before running Prisma commands. A running dev server can keep Prisma's query engine DLL open and cause an `EPERM: operation not permitted, rename ... query_engine-windows.dll.node` error.

To check for repository-related Node processes:

```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -in @('node.exe','cmd.exe') -and $_.CommandLine -like '*Axis-Academy*' } |
  Select-Object ProcessId,Name,CommandLine
```

Stop only the matching Axis Academy processes before rerunning Prisma:

```powershell
Stop-Process -Id <PROCESS_ID> -Force
npm run prisma:generate
```

Run migrations after PostgreSQL is available and `DATABASE_URL` is valid:

```powershell
npm run prisma:migrate
```

For the first migration, Prisma will ask:

```text
Enter a name for the new migration:
```

Use:

```text
init
```

After the migration completes, start the development server:

```powershell
npm run dev
```

## Development

Start the Next.js development server:

```powershell
npm run dev
```

Open the local URL shown by Next.js, usually:

```text
http://localhost:3000
```

If port `3000` is already in use, Next.js will choose another port.

## Validation

Use this clean validation order:

```powershell
npm run prisma:generate
npm run lint
npm run build
```

Start `npm run dev` only after those commands pass.

Run lint:

```powershell
npm run lint
```

Run production build:

```powershell
npm run build
```

## API Overview

- `GET /api/provider/status`
- `GET /api/agents/catalog`
- `GET /api/lesson-projects`
- `POST /api/lesson-projects`
- `GET /api/lesson-projects/:id`
- `POST /api/lesson-projects/:id/events`

The provider status endpoint does not return the API key.

## Documentation

Project planning documents are in `docs/`:

- `docs/product-blueprint.md`
- `docs/agent-system.md`
- `docs/orchestration-platform.md`
- `docs/evaluation-harness.md`
- `docs/provider-config.md`
- `docs/roadmap.md`
- `docs/future-work.md`

## Python Virtual Environment

A local Python virtual environment can be created for future scripts, evaluation harness tooling, or document processing utilities. The current local environment is `.venv/`.

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```
