"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { educationLevels, getEducationLevelLabel } from "@/lib/education-levels";

type LessonProject = {
  id: string;
  title: string;
  subject: string | null;
  gradeLevel: string | null;
  status: string;
  createdAt: string;
};

type WorkflowEvent = {
  id: string;
  eventType: string;
  message: string;
  teacherVisible: boolean;
  metadata?: unknown;
  createdAt: string;
};

type SourceMapChunk = {
  id: string;
  chunkId: string;
  pageNumber: number | null;
  slideNumber: number | null;
  sectionTitle: string | null;
  text: string;
};

type SourceDocument = {
  id: string;
  type: string;
  fileUrl: string | null;
  rawText: string | null;
  parseStatus: string;
  parseWarnings: string[];
  sourceMapChunks: SourceMapChunk[];
};

type Artifact = {
  id: string;
  type: string;
  reviewStatus: string;
  version: number;
  contentJson: unknown;
  sourceReferences: unknown;
  updatedAt: string;
};

type ProjectDetail = LessonProject & {
  sourceDocuments: SourceDocument[];
  workflowEvents: WorkflowEvent[];
  agentTasks: Array<{
    id: string;
    agentName: string;
    status: string;
    warnings: unknown;
    createdAt: string;
    updatedAt: string;
  }>;
  artifacts: Artifact[];
};

type ProviderStatus = {
  configured: boolean;
  baseUrlConfigured: boolean;
  modelConfigured: boolean;
  apiKeyConfigured: boolean;
  modelName: string | null;
  requestTimeoutMs: number;
  maxRetries: number;
  temperature: number;
  maxOutputTokens: number;
};

type AgentCatalog = {
  mcpServerName: string;
  agents: Array<{
    id: string;
    name: string;
    description: string;
    skillIds: string[];
    toolIds: string[];
  }>;
  skills: Array<{ id: string; name: string; description: string; skillPackPath: string }>;
  tools: Array<{ id: string; name: string; description: string }>;
};

type EvaluationMetricKey =
  | "sourceCoverage"
  | "groundedness"
  | "factualConsistency"
  | "exampleQuality"
  | "questionQuality"
  | "slideQuality"
  | "reviewerAccuracy";

type EvaluationScores = Record<EvaluationMetricKey, number>;

type EvaluationReport = {
  runId: string;
  createdAt: string;
  metadata: {
    modelName: string | null;
    providerConfigured: boolean;
    promptVersion: string;
    workflowVersion: string;
    sampleCount: number;
  };
  thresholds: EvaluationScores;
  aggregateScores: EvaluationScores;
  passed: boolean;
  sampleResults: Array<{
    sampleId: string;
    title: string;
    scores: EvaluationScores;
    passed: boolean;
    failures: Array<{
      metric: EvaluationMetricKey;
      score: number;
      threshold: number;
    }>;
    notes: string[];
  }>;
};

const emptyProviderStatus: ProviderStatus = {
  configured: false,
  baseUrlConfigured: false,
  modelConfigured: false,
  apiKeyConfigured: false,
  modelName: null,
  requestTimeoutMs: 60000,
  maxRetries: 2,
  temperature: 0.2,
  maxOutputTokens: 4000
};

export function Dashboard() {
  const [projects, setProjects] = useState<LessonProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>(emptyProviderStatus);
  const [catalog, setCatalog] = useState<AgentCatalog>({
    mcpServerName: "",
    agents: [],
    skills: [],
    tools: []
  });
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [workflowStartMessage, setWorkflowStartMessage] = useState("");
  const [workflowAdvanceMessage, setWorkflowAdvanceMessage] = useState("");
  const [workflowReviewMessage, setWorkflowReviewMessage] = useState("");
  const [teacherReviewMessage, setTeacherReviewMessage] = useState("");
  const [editingArtifactId, setEditingArtifactId] = useState<string | null>(null);
  const [artifactDraft, setArtifactDraft] = useState("");
  const [regenerateArtifactId, setRegenerateArtifactId] = useState("");
  const [regenerateSectionLabel, setRegenerateSectionLabel] = useState("");
  const [regenerateReason, setRegenerateReason] = useState("");
  const [finalAcceptanceNote, setFinalAcceptanceNote] = useState("");
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [evaluationMessage, setEvaluationMessage] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceInputType, setSourceInputType] = useState<"TEXT" | "PDF" | "PPTX">("TEXT");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<string | null>(null);

  const selectedProjectLabel = useMemo(() => {
    if (!selectedProject) {
      return "No project selected";
    }

    return `${selectedProject.title} · ${selectedProject.status}`;
  }, [selectedProject]);

  const reviewableArtifacts = useMemo(() => {
    const reviewableTypes = new Set(["LESSON_SUMMARY", "EXAMPLES", "QUESTIONS", "SLIDE_CONTENT", "SLIDE_OUTLINE"]);

    return selectedProject?.artifacts.filter((artifact) => reviewableTypes.has(artifact.type)) ?? [];
  }, [selectedProject]);

  const agentStatusSummary = useMemo(() => {
    const statuses = new Map<string, number>();

    for (const task of selectedProject?.agentTasks ?? []) {
      statuses.set(task.status, (statuses.get(task.status) ?? 0) + 1);
    }

    return Array.from(statuses.entries())
      .map(([status, count]) => `${status}: ${count}`)
      .join(", ") || "No agent tasks";
  }, [selectedProject]);

  const exportReady = useMemo(() => {
    return Boolean(
      selectedProject &&
        (selectedProject.status === "APPROVED" ||
          selectedProject.artifacts.some((artifact) => artifact.type === "FINAL_PACKAGE"))
    );
  }, [selectedProject]);

  async function loadInitialData() {
    setIsLoading(true);
    setError(null);

    try {
      const [projectsResponse, providerResponse, catalogResponse] = await Promise.all([
        fetch("/api/lesson-projects"),
        fetch("/api/provider/status"),
        fetch("/api/agents/catalog")
      ]);

      if (!providerResponse.ok || !catalogResponse.ok) {
        throw new Error("Unable to load dashboard data.");
      }

      const providerPayload = (await providerResponse.json()) as ProviderStatus;
      const catalogPayload = (await catalogResponse.json()) as AgentCatalog;

      setProviderStatus(providerPayload);
      setCatalog(catalogPayload);

      if (projectsResponse.ok) {
        const projectsPayload = (await projectsResponse.json()) as { projects: LessonProject[] };
        setProjects(projectsPayload.projects);
        setDatabaseStatus(null);

        if (projectsPayload.projects.length > 0) {
          setSelectedProjectId((current) => current ?? projectsPayload.projects[0].id);
        }
      } else {
        const payload = (await projectsResponse.json().catch(() => null)) as { message?: string } | null;
        setProjects([]);
        setSelectedProjectId(null);
        setSelectedProject(null);
        setDatabaseStatus(payload?.message ?? "Database is not reachable.");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown dashboard error.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSelectedProject(projectId: string) {
    setError(null);

    try {
      const response = await fetch(`/api/lesson-projects/${projectId}`);

      if (!response.ok) {
        throw new Error("Unable to load the selected project.");
      }

      const payload = (await response.json()) as { project: ProjectDetail };
      setSelectedProject(payload.project);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown project error.");
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch("/api/lesson-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          subject: subject || undefined,
          gradeLevel: gradeLevel || undefined
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to create project.");
      }

      const payload = (await response.json()) as { project: LessonProject };
      setTitle("");
      setSubject("");
      setGradeLevel("");
      setSelectedProjectId(payload.project.id);
      await loadInitialData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown create error.");
    }
  }

  async function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      return;
    }

    setError(null);

    try {
      let response: Response;

      if (sourceInputType === "TEXT") {
        response = await fetch(`/api/lesson-projects/${selectedProjectId}/sources`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "TEXT",
            rawText: sourceText
          })
        });
      } else {
        if (!sourceFile) {
          throw new Error("Please choose a file before uploading.");
        }

        const formData = new FormData();
        formData.append("inputType", sourceInputType);
        formData.append("file", sourceFile);

        response = await fetch(`/api/lesson-projects/${selectedProjectId}/sources`, {
          method: "POST",
          body: formData
        });
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to upload source.");
      }

      setSourceText("");
      setSourceFile(null);
      await loadSelectedProject(selectedProjectId);
      await loadInitialData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown source upload error.");
    }
  }

  async function createWorkflowEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId || !eventMessage.trim()) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/lesson-projects/${selectedProjectId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventType: "SYSTEM_INFO",
          message: eventMessage,
          teacherVisible: true
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to create workflow event.");
      }

      setEventMessage("");
      await loadSelectedProject(selectedProjectId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown event error.");
    }
  }

  async function startWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/lesson-projects/${selectedProjectId}/workflow/start`, {
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to start workflow.");
      }

      setWorkflowStartMessage("Workflow started.");
      await loadSelectedProject(selectedProjectId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown workflow error.");
    }
  }

  async function advanceWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/lesson-projects/${selectedProjectId}/workflow/advance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toolId: "structured_output_validator",
          inputJson: {
            source: "dashboard"
          }
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to advance workflow.");
      }

      setWorkflowAdvanceMessage("Workflow advanced.");
      await loadSelectedProject(selectedProjectId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown workflow advance error.");
    }
  }

  async function runReviewGate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/lesson-projects/${selectedProjectId}/workflow/review`, {
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to run review gate.");
      }

      const payload = (await response.json()) as {
        review: {
          qualityReview: {
            status: string;
            blockingIssues: string[];
            warnings: string[];
          };
        };
      };

      setWorkflowReviewMessage(
        payload.review.qualityReview.status === "approved"
          ? "Review gate passed."
          : `Review gate needs attention: ${payload.review.qualityReview.blockingIssues.length} blocking issue(s), ${payload.review.qualityReview.warnings.length} warning(s).`
      );
      await loadSelectedProject(selectedProjectId);
      await loadInitialData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown review gate error.");
    }
  }

  function beginArtifactEdit(artifact: Artifact) {
    setEditingArtifactId(artifact.id);
    setArtifactDraft(JSON.stringify(artifact.contentJson, null, 2));
    setTeacherReviewMessage("");
  }

  async function saveArtifactEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId || !editingArtifactId) {
      return;
    }

    setError(null);

    try {
      const parsedContent = JSON.parse(artifactDraft) as unknown;
      const response = await fetch(`/api/lesson-projects/${selectedProjectId}/artifacts/${editingArtifactId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contentJson: parsedContent,
          note: "Edited from teacher review UI."
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to save artifact edit.");
      }

      setTeacherReviewMessage("Artifact edit saved.");
      setEditingArtifactId(null);
      setArtifactDraft("");
      await loadSelectedProject(selectedProjectId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown artifact edit error.");
    }
  }

  async function approveArtifact(artifactId: string) {
    if (!selectedProjectId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/lesson-projects/${selectedProjectId}/artifacts/${artifactId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          note: "Approved from teacher review UI."
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to approve artifact.");
      }

      setTeacherReviewMessage("Artifact approved.");
      await loadSelectedProject(selectedProjectId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown artifact approval error.");
    }
  }

  async function requestRegeneration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId || !regenerateSectionLabel.trim() || !regenerateReason.trim()) {
      return;
    }

    setError(null);

    try {
      const selectedArtifact = reviewableArtifacts.find((artifact) => artifact.id === regenerateArtifactId);
      const response = await fetch(`/api/lesson-projects/${selectedProjectId}/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          artifactId: selectedArtifact?.id,
          artifactType: selectedArtifact?.type,
          sectionLabel: regenerateSectionLabel,
          reason: regenerateReason
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to request regeneration.");
      }

      setTeacherReviewMessage("Regeneration request recorded.");
      setRegenerateSectionLabel("");
      setRegenerateReason("");
      await loadSelectedProject(selectedProjectId);
      await loadInitialData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown regeneration request error.");
    }
  }

  async function completeFinalAcceptance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/lesson-projects/${selectedProjectId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          note: finalAcceptanceNote || undefined
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Project is not ready for final acceptance.");
      }

      setTeacherReviewMessage("Final acceptance completed.");
      setFinalAcceptanceNote("");
      await loadSelectedProject(selectedProjectId);
      await loadInitialData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown final acceptance error.");
    }
  }

  async function runEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch("/api/evaluation/run", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Unable to run evaluation harness.");
      }

      const payload = (await response.json()) as { report: EvaluationReport };
      setEvaluationReport(payload.report);
      setEvaluationMessage(payload.report.passed ? "Evaluation passed." : "Evaluation found regressions.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown evaluation error.");
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      void loadSelectedProject(selectedProjectId);
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId]);

  return (
    <main className="min-h-screen bg-[#f3f5f7] px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#5c6775]">
              Axis Academy
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
              Milestone 2 dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d5967]">
              Project metadata, provider readiness, ingestion, source documents, source chunks, and workflow trace foundations.
            </p>
          </div>
          <div className="rounded-md border border-line bg-white px-4 py-3 text-sm text-[#4d5967]">
            {isLoading ? "Loading system state..." : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
          </div>
        </header>

        {error ? (
          <div className="rounded-md border border-[#d77a61] bg-[#fff7f4] px-4 py-3 text-sm text-[#8a321f]">
            {error}
          </div>
        ) : null}

        {databaseStatus ? (
          <div className="rounded-md border border-[#d7aa61] bg-[#fffaf0] px-4 py-3 text-sm text-[#7a4b10]">
            {databaseStatus}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
          <div className="flex flex-col gap-6">
            <form className="rounded-md border border-line bg-white p-5" onSubmit={createProject}>
              <h2 className="text-lg font-semibold text-ink">Create lesson project</h2>
              <div className="mt-5 flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-[#314052]">
                  Title
                  <input
                    className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                    minLength={2}
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Introduction to functions"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-[#314052]">
                  Subject
                  <input
                    className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Mathematics"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-[#314052]">
                  Grade level
                  <select
                    className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                    value={gradeLevel}
                    onChange={(event) => setGradeLevel(event.target.value)}
                  >
                    <option value="">Select HKDSE or HKQF level</option>
                    <optgroup label="HKDSE">
                      {educationLevels
                        .filter((level) => level.framework === "HKDSE")
                        .map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Hong Kong Qualifications Framework">
                      {educationLevels
                        .filter((level) => level.framework === "HKQF")
                        .map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </label>
                <button
                  className="rounded-md bg-[#258c7a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f7668]"
                  type="submit"
                >
                  Create project
                </button>
              </div>
            </form>

            <section className="rounded-md border border-line bg-white p-5">
              <h2 className="text-lg font-semibold text-ink">Provider status</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <StatusRow label="Configured" value={providerStatus.configured ? "Ready" : "Incomplete"} />
                <StatusRow label="Base URL" value={providerStatus.baseUrlConfigured ? "Set" : "Missing"} />
                <StatusRow label="Model" value={providerStatus.modelName ?? "Missing"} />
                <StatusRow label="API key" value={providerStatus.apiKeyConfigured ? "Set" : "Missing"} />
                <StatusRow label="Retries" value={String(providerStatus.maxRetries)} />
              </div>
            </section>

            <section className="rounded-md border border-line bg-white p-5">
              <h2 className="text-lg font-semibold text-ink">Add source</h2>
              <p className="mt-1 text-sm text-[#5c6775]">
                Upload PDF/PPTX or paste text. Maximum file size: 25MB.
              </p>

              <form className="mt-4 flex flex-col gap-4" onSubmit={submitSource}>
                <label className="flex flex-col gap-2 text-sm font-medium text-[#314052]">
                  Source type
                  <select
                    className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                    value={sourceInputType}
                    onChange={(event) => setSourceInputType(event.target.value as "TEXT" | "PDF" | "PPTX")}
                  >
                    <option value="TEXT">Text</option>
                    <option value="PDF">PDF</option>
                    <option value="PPTX">PPTX</option>
                  </select>
                </label>

                {sourceInputType === "TEXT" ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-[#314052]">
                    Paste text
                    <textarea
                      className="min-h-36 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                      value={sourceText}
                      onChange={(event) => setSourceText(event.target.value)}
                      placeholder="Paste teaching material here"
                    />
                  </label>
                ) : (
                  <label className="flex flex-col gap-2 text-sm font-medium text-[#314052]">
                    Upload file
                    <input
                      className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                      type="file"
                      accept={sourceInputType === "PDF" ? ".pdf,application/pdf" : ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"}
                      onChange={(event) => setSourceFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                )}

                <button
                  className="rounded-md bg-[#258c7a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f7668] disabled:cursor-not-allowed disabled:bg-[#9aa4b1]"
                  type="submit"
                  disabled={!selectedProjectId}
                >
                  Save source
                </button>
              </form>
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-md border border-line bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-ink">Lesson projects</h2>
                <select
                  className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                  value={selectedProjectId ?? ""}
                  onChange={(event) => setSelectedProjectId(event.target.value || null)}
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 overflow-hidden rounded-md border border-line">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-panel text-[#4d5967]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Title</th>
                      <th className="px-3 py-2 font-semibold">Subject</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="border-t border-line">
                        <td className="px-3 py-2">{project.title}</td>
                        <td className="px-3 py-2">
                          {project.subject ?? "Not set"}
                          <span className="mt-1 block text-xs text-[#687586]">
                            {getEducationLevelLabel(project.gradeLevel)}
                          </span>
                        </td>
                        <td className="px-3 py-2">{project.status}</td>
                      </tr>
                    ))}
                    {projects.length === 0 ? (
                      <tr>
                        <td className="px-3 py-5 text-[#5c6775]" colSpan={3}>
                          No lesson projects yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-md border border-line bg-white p-5">
              <h2 className="text-lg font-semibold text-ink">Source documents</h2>
              <p className="mt-1 text-sm text-[#5c6775]">{selectedProjectLabel}</p>

              <div className="mt-4 flex flex-col gap-3">
                {selectedProject?.sourceDocuments.map((sourceDocument) => (
                  <div key={sourceDocument.id} className="rounded-md border border-line bg-panel px-4 py-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-ink">{sourceDocument.type}</p>
                      <p className="text-xs text-[#687586]">
                        {sourceDocument.parseStatus} · {sourceDocument.sourceMapChunks.length} chunks
                      </p>
                    </div>
                    {sourceDocument.parseWarnings.length ? (
                      <ul className="mt-2 list-disc pl-5 text-sm text-[#7a4b10]">
                        {sourceDocument.parseWarnings.map((warning, index) => (
                          <li key={`${sourceDocument.id}-warning-${index}`}>{warning}</li>
                        ))}
                      </ul>
                    ) : null}
                    {sourceDocument.sourceMapChunks.length ? (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-[#314052]">
                          Preview chunks
                        </summary>
                        <div className="mt-3 flex flex-col gap-2">
                          {sourceDocument.sourceMapChunks.map((chunk) => (
                            <div key={chunk.id} className="rounded-md border border-line bg-white px-3 py-2">
                              <div className="flex flex-wrap gap-2 text-xs text-[#687586]">
                                <span>{chunk.chunkId}</span>
                                {chunk.pageNumber !== null ? <span>page {chunk.pageNumber}</span> : null}
                                {chunk.slideNumber !== null ? <span>slide {chunk.slideNumber}</span> : null}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-[#314052]">{chunk.text}</p>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                    {sourceDocument.rawText ? <p className="mt-3 text-xs text-[#687586]">Raw text captured.</p> : null}
                  </div>
                ))}
                {selectedProject && selectedProject.sourceDocuments.length === 0 ? (
                  <p className="rounded-md border border-line bg-panel px-4 py-5 text-sm text-[#5c6775]">
                    No source documents have been uploaded for this project.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-md border border-line bg-white p-5">
              <h2 className="text-lg font-semibold text-ink">Workflow trace</h2>

              <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={startWorkflow}>
                <button
                  className="rounded-md bg-[#258c7a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f7668] disabled:cursor-not-allowed disabled:bg-[#9aa4b1]"
                  disabled={!selectedProjectId}
                  type="submit"
                >
                  Start Project Manager
                </button>
                <p className="text-sm text-[#5c6775]">{workflowStartMessage}</p>
              </form>

              <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={advanceWorkflow}>
                <button
                  className="rounded-md bg-[#314052] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#253142] disabled:cursor-not-allowed disabled:bg-[#9aa4b1]"
                  disabled={!selectedProjectId}
                  type="submit"
                >
                  Advance workflow
                </button>
                <p className="text-sm text-[#5c6775]">{workflowAdvanceMessage}</p>
              </form>

              <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={runReviewGate}>
                <button
                  className="rounded-md bg-[#7a4b10] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#623c0d] disabled:cursor-not-allowed disabled:bg-[#9aa4b1]"
                  disabled={!selectedProjectId}
                  type="submit"
                >
                  Run review gate
                </button>
                <p className="text-sm text-[#5c6775]">{workflowReviewMessage}</p>
              </form>

              <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={createWorkflowEvent}>
                <input
                  className="min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                  disabled={!selectedProjectId}
                  value={eventMessage}
                  onChange={(event) => setEventMessage(event.target.value)}
                  placeholder="Add a milestone event"
                />
                <button
                  className="rounded-md bg-[#314052] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#253142] disabled:cursor-not-allowed disabled:bg-[#9aa4b1]"
                  disabled={!selectedProjectId}
                  type="submit"
                >
                  Add event
                </button>
              </form>

              <div className="mt-5 flex flex-col gap-3">
                {selectedProject?.workflowEvents.map((workflowEvent) => (
                  <div key={workflowEvent.id} className="rounded-md border border-line bg-panel px-4 py-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-ink">{workflowEvent.eventType}</p>
                      <time className="text-xs text-[#687586]">
                        {new Date(workflowEvent.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#4d5967]">{workflowEvent.message}</p>
                  </div>
                ))}
                {selectedProject && selectedProject.workflowEvents.length === 0 ? (
                  <p className="rounded-md border border-line bg-panel px-4 py-5 text-sm text-[#5c6775]">
                    No workflow events have been recorded for this project.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-md border border-line bg-white p-5">
              <h2 className="text-lg font-semibold text-ink">Review gate</h2>
              <p className="mt-1 text-sm text-[#5c6775]">
                Slide Reviewer and Quality Reviewer results from Milestone 4.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatusRow label="Artifacts" value={String(selectedProject?.artifacts.length ?? 0)} />
                <StatusRow
                  label="Reviewer tasks"
                  value={String(
                    selectedProject?.agentTasks.filter((task) =>
                      ["slide-reviewer", "quality-reviewer"].includes(task.agentName)
                    ).length ?? 0
                  )}
                />
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {selectedProject?.artifacts
                  .filter((artifact) => artifact.type === "REVIEW_REPORT")
                  .map((artifact) => (
                    <article key={artifact.id} className="rounded-md border border-line bg-panel px-4 py-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-semibold text-ink">Review report v{artifact.version}</h3>
                        <p className="text-xs text-[#687586]">{artifact.reviewStatus}</p>
                      </div>
                      <ReviewReportPreview content={artifact.contentJson} />
                    </article>
                  ))}
                {selectedProject && !selectedProject.artifacts.some((artifact) => artifact.type === "REVIEW_REPORT") ? (
                  <p className="rounded-md border border-line bg-panel px-4 py-5 text-sm text-[#5c6775]">
                    No review report has been generated yet.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-md border border-line bg-white p-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink">Teacher review</h2>
                <p className="text-sm text-[#5c6775]">
                  Review artifacts, edit JSON content, approve sections, request regeneration, and finish acceptance.
                </p>
              </div>

              {teacherReviewMessage ? (
                <div className="mt-4 rounded-md border border-[#8bc5ba] bg-[#f1fbf8] px-4 py-3 text-sm text-[#1f7668]">
                  {teacherReviewMessage}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <StatusRow label="Project" value={selectedProject?.status ?? "No project"} />
                <StatusRow label="Agent tasks" value={agentStatusSummary} />
                <StatusRow
                  label="Approved"
                  value={`${reviewableArtifacts.filter((artifact) => artifact.reviewStatus === "APPROVED").length}/${reviewableArtifacts.length}`}
                />
              </div>

              <div className="mt-5 flex flex-col gap-4">
                {reviewableArtifacts.map((artifact) => (
                  <article key={artifact.id} className="rounded-md border border-line bg-panel px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-ink">
                          {artifact.type} v{artifact.version}
                        </h3>
                        <p className="mt-1 text-xs text-[#687586]">{artifact.reviewStatus}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-[#314052] transition hover:border-[#258c7a]"
                          type="button"
                          onClick={() => beginArtifactEdit(artifact)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md bg-[#258c7a] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f7668]"
                          type="button"
                          onClick={() => void approveArtifact(artifact.id)}
                        >
                          Approve
                        </button>
                      </div>
                    </div>

                    <ArtifactPreview content={artifact.contentJson} />

                    {editingArtifactId === artifact.id ? (
                      <form className="mt-4 flex flex-col gap-3" onSubmit={saveArtifactEdit}>
                        <textarea
                          className="min-h-56 rounded-md border border-line bg-white px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-[#258c7a]"
                          value={artifactDraft}
                          onChange={(event) => setArtifactDraft(event.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-md bg-[#258c7a] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f7668]"
                            type="submit"
                          >
                            Save edit
                          </button>
                          <button
                            className="rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-[#314052] transition hover:border-[#258c7a]"
                            type="button"
                            onClick={() => {
                              setEditingArtifactId(null);
                              setArtifactDraft("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </article>
                ))}
                {selectedProject && reviewableArtifacts.length === 0 ? (
                  <p className="rounded-md border border-line bg-panel px-4 py-5 text-sm text-[#5c6775]">
                    No generated lesson artifacts are ready for teacher review.
                  </p>
                ) : null}
              </div>

              <form className="mt-6 rounded-md border border-line bg-panel px-4 py-3" onSubmit={requestRegeneration}>
                <h3 className="text-sm font-semibold text-ink">Request selected regeneration</h3>
                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
                  <label className="flex flex-col gap-2 text-sm font-medium text-[#314052]">
                    Artifact
                    <select
                      className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                      value={regenerateArtifactId}
                      onChange={(event) => setRegenerateArtifactId(event.target.value)}
                    >
                      <option value="">Whole package or unknown artifact</option>
                      {reviewableArtifacts.map((artifact) => (
                        <option key={artifact.id} value={artifact.id}>
                          {artifact.type} v{artifact.version}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-[#314052]">
                    Section
                    <input
                      className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                      value={regenerateSectionLabel}
                      onChange={(event) => setRegenerateSectionLabel(event.target.value)}
                      placeholder="Slide 3, question 2, examples section"
                    />
                  </label>
                </div>
                <label className="mt-3 flex flex-col gap-2 text-sm font-medium text-[#314052]">
                  Reason
                  <textarea
                    className="min-h-24 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                    value={regenerateReason}
                    onChange={(event) => setRegenerateReason(event.target.value)}
                    placeholder="Explain what should be regenerated and why."
                  />
                </label>
                <button
                  className="mt-3 rounded-md bg-[#314052] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#253142] disabled:cursor-not-allowed disabled:bg-[#9aa4b1]"
                  disabled={!selectedProjectId || !regenerateSectionLabel.trim() || !regenerateReason.trim()}
                  type="submit"
                >
                  Request regeneration
                </button>
              </form>

              <form className="mt-6 rounded-md border border-line bg-panel px-4 py-3" onSubmit={completeFinalAcceptance}>
                <h3 className="text-sm font-semibold text-ink">Final acceptance</h3>
                <label className="mt-3 flex flex-col gap-2 text-sm font-medium text-[#314052]">
                  Acceptance note
                  <textarea
                    className="min-h-20 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-[#258c7a]"
                    value={finalAcceptanceNote}
                    onChange={(event) => setFinalAcceptanceNote(event.target.value)}
                    placeholder="Optional teacher note"
                  />
                </label>
                <button
                  className="mt-3 rounded-md bg-[#258c7a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f7668] disabled:cursor-not-allowed disabled:bg-[#9aa4b1]"
                  disabled={!selectedProjectId || reviewableArtifacts.length === 0}
                  type="submit"
                >
                  Complete final acceptance
                </button>
              </form>
            </section>

            <section className="rounded-md border border-line bg-white p-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink">Export preparation</h2>
                <p className="text-sm text-[#5c6775]">
                  Export the final accepted lesson package as structured JSON or Markdown.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatusRow label="Export ready" value={exportReady ? "Ready" : "Not ready"} />
                <StatusRow
                  label="Final package"
                  value={
                    selectedProject?.artifacts.some((artifact) => artifact.type === "FINAL_PACKAGE")
                      ? "Created"
                      : "Missing"
                  }
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    exportReady
                      ? "bg-[#258c7a] text-white hover:bg-[#1f7668]"
                      : "pointer-events-none bg-[#9aa4b1] text-white"
                  }`}
                  href={selectedProjectId ? `/api/lesson-projects/${selectedProjectId}/export?format=json` : "#"}
                >
                  Export JSON
                </a>
                <a
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    exportReady
                      ? "bg-[#314052] text-white hover:bg-[#253142]"
                      : "pointer-events-none bg-[#9aa4b1] text-white"
                  }`}
                  href={selectedProjectId ? `/api/lesson-projects/${selectedProjectId}/export?format=markdown` : "#"}
                >
                  Export Markdown
                </a>
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-md border border-line bg-white p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-ink">Agent catalog</h2>
            <p className="text-sm text-[#5c6775]">
              Worker profiles are separate from reusable skill packs and MCP tool permissions.
            </p>
          </div>
          <div className="mt-4 rounded-md border border-line bg-panel px-4 py-3 text-sm text-[#4d5967]">
            MCP server: {catalog.mcpServerName}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalog.agents.map((agent) => (
              <article key={agent.id} className="rounded-md border border-line p-4">
                <h3 className="text-base font-semibold text-ink">{agent.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4d5967]">{agent.description}</p>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#687586]">Skill IDs</p>
                  <p className="mt-2 text-sm leading-6 text-[#314052]">{agent.skillIds.join(", ")}</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#687586]">MCP Tool IDs</p>
                  <p className="mt-2 text-sm leading-6 text-[#314052]">{agent.toolIds.join(", ")}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-base font-semibold text-ink">Skill packs</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {catalog.skills.map((skill) => (
                <article key={skill.id} className="rounded-md border border-line bg-panel px-4 py-3">
                  <h4 className="text-sm font-semibold text-ink">{skill.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#4d5967]">{skill.description}</p>
                  <p className="mt-3 break-words text-xs text-[#687586]">{skill.skillPackPath}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-md border border-line bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Evaluation harness</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#5c6775]">
                Deterministic regression checks for source coverage, groundedness, examples, questions, slides, and reviewer accuracy.
              </p>
            </div>
            <form onSubmit={runEvaluation}>
              <button
                className="rounded-md bg-[#314052] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#253142]"
                type="submit"
              >
                Run evaluation
              </button>
            </form>
          </div>

          {evaluationMessage ? (
            <div className="mt-4 rounded-md border border-line bg-panel px-4 py-3 text-sm text-[#4d5967]">
              {evaluationMessage}
            </div>
          ) : null}

          {evaluationReport ? (
            <div className="mt-5 grid gap-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatusRow label="Run" value={evaluationReport.runId} />
                <StatusRow label="Result" value={evaluationReport.passed ? "Passed" : "Failed"} />
                <StatusRow label="Samples" value={String(evaluationReport.metadata.sampleCount)} />
                <StatusRow label="Workflow" value={evaluationReport.metadata.workflowVersion} />
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Object.entries(evaluationReport.aggregateScores).map(([metric, score]) => (
                  <div key={metric} className="rounded-md border border-line bg-panel px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#687586]">{metric}</p>
                    <p className="mt-2 text-xl font-semibold text-ink">{score.toFixed(2)}</p>
                    <p className="mt-1 text-xs text-[#687586]">
                      Threshold {evaluationReport.thresholds[metric as EvaluationMetricKey].toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {evaluationReport.sampleResults.map((sample) => (
                  <article key={sample.sampleId} className="rounded-md border border-line bg-panel px-4 py-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-semibold text-ink">{sample.title}</h3>
                      <p className="text-xs text-[#687586]">{sample.passed ? "Passed" : "Failed"}</p>
                    </div>
                    {sample.notes.length ? (
                      <ul className="mt-3 list-disc pl-5 text-sm leading-6 text-[#7a4b10]">
                        {sample.notes.map((note) => (
                          <li key={`${sample.sampleId}-${note}`}>{note}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-[#4d5967]">No metric failures.</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function ReviewReportPreview({ content }: { content: unknown }) {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return <p className="mt-3 text-sm text-[#5c6775]">Review report content is not available.</p>;
  }

  const report = content as {
    slideReview?: {
      status?: string;
      summary?: string;
      blockingIssues?: string[];
      warnings?: string[];
    };
    qualityReview?: {
      status?: string;
      summary?: string;
      blockingIssues?: string[];
      warnings?: string[];
    };
  };

  return (
    <div className="mt-3 grid gap-3">
      <ReviewResultBlock title="Slide review" review={report.slideReview} />
      <ReviewResultBlock title="Quality review" review={report.qualityReview} />
    </div>
  );
}

function ArtifactPreview({ content }: { content: unknown }) {
  if (typeof content === "string") {
    return <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#314052]">{content}</p>;
  }

  if (Array.isArray(content)) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        {content.slice(0, 5).map((item, index) => (
          <div key={`artifact-array-item-${index}`} className="rounded-md border border-line bg-white px-3 py-2">
            <p className="line-clamp-4 text-sm leading-6 text-[#314052]">{stringifyPreview(item)}</p>
          </div>
        ))}
        {content.length > 5 ? <p className="text-xs text-[#687586]">{content.length - 5} more item(s)</p> : null}
      </div>
    );
  }

  if (content && typeof content === "object") {
    const entries = Object.entries(content as Record<string, unknown>).slice(0, 6);

    return (
      <dl className="mt-3 grid gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-md border border-line bg-white px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#687586]">{key}</dt>
            <dd className="mt-1 line-clamp-4 text-sm leading-6 text-[#314052]">{stringifyPreview(value)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className="mt-3 text-sm text-[#5c6775]">No previewable content.</p>;
}

function stringifyPreview(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function ReviewResultBlock({
  title,
  review
}: {
  title: string;
  review?: {
    status?: string;
    summary?: string;
    blockingIssues?: string[];
    warnings?: string[];
  };
}) {
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-[#687586]">{review?.status ?? "unknown"}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#4d5967]">{review?.summary ?? "No summary."}</p>
      {review?.blockingIssues?.length ? (
        <p className="mt-2 text-xs text-[#8a321f]">Blocking issues: {review.blockingIssues.length}</p>
      ) : null}
      {review?.warnings?.length ? (
        <p className="mt-1 text-xs text-[#7a4b10]">Warnings: {review.warnings.length}</p>
      ) : null}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-b-0 last:pb-0">
      <span className="text-[#5c6775]">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
