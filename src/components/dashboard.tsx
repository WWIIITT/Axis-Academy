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
  createdAt: string;
};

type ProjectDetail = LessonProject & {
  workflowEvents: WorkflowEvent[];
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
  agents: Array<{
    id: string;
    name: string;
    description: string;
    skills: string[];
    tools: string[];
  }>;
  skills: Array<{ id: string; name: string; description: string }>;
  tools: Array<{ id: string; name: string; description: string }>;
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
  const [catalog, setCatalog] = useState<AgentCatalog>({ agents: [], skills: [], tools: [] });
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<string | null>(null);

  const selectedProjectLabel = useMemo(() => {
    if (!selectedProject) {
      return "No project selected";
    }

    return `${selectedProject.title} · ${selectedProject.status}`;
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
              Milestone 1 dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d5967]">
              Project metadata, provider readiness, agent skills, agent tools, and workflow trace foundations.
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

        <section className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
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
              <h2 className="text-lg font-semibold text-ink">Workflow trace</h2>
              <p className="mt-1 text-sm text-[#5c6775]">{selectedProjectLabel}</p>

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
          </div>
        </section>

        <section className="rounded-md border border-line bg-white p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-ink">Agent catalog</h2>
            <p className="text-sm text-[#5c6775]">
              Static registry for Milestone 1. Agent execution starts in a later milestone.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalog.agents.map((agent) => (
              <article key={agent.id} className="rounded-md border border-line p-4">
                <h3 className="text-base font-semibold text-ink">{agent.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4d5967]">{agent.description}</p>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#687586]">Skills</p>
                  <p className="mt-2 text-sm leading-6 text-[#314052]">{agent.skills.join(", ")}</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#687586]">Tools</p>
                  <p className="mt-2 text-sm leading-6 text-[#314052]">{agent.tools.join(", ")}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
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
