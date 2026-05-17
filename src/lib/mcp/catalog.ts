export type McpToolAccess = "read" | "write" | "review";

export type McpToolSpec = {
  id: string;
  name: string;
  description: string;
  serverName: string;
  access: McpToolAccess;
  inputContract: string;
  outputContract: string;
  retryable: boolean;
};

export const mcpServerName = "axis-academy-local";

export const mcpToolCatalog: McpToolSpec[] = [
  {
    id: "document_parser",
    name: "Document parser",
    description: "Extract text and structure from PDF, PPTX, or pasted text inputs.",
    serverName: mcpServerName,
    access: "read",
    inputContract: "source document metadata plus file or text payload",
    outputContract: "parsed text, structure hints, and extraction warnings",
    retryable: true
  },
  {
    id: "text_chunker",
    name: "Text chunker",
    description: "Split parsed content into traceable chunks by page, slide, paragraph, or section.",
    serverName: mcpServerName,
    access: "write",
    inputContract: "parsed text plus source metadata",
    outputContract: "stable chunk ids and chunk metadata",
    retryable: true
  },
  {
    id: "source_map_builder",
    name: "Source map builder",
    description: "Persist chunk-to-source mappings for traceable lesson generation.",
    serverName: mcpServerName,
    access: "write",
    inputContract: "source document id and chunk payloads",
    outputContract: "source map records ready for persistence",
    retryable: false
  },
  {
    id: "source_citation_lookup",
    name: "Source citation lookup",
    description: "Resolve claims and generated content back to source chunks or supporting references.",
    serverName: mcpServerName,
    access: "read",
    inputContract: "claim or content fragment plus source map context",
    outputContract: "matching citations and support confidence",
    retryable: true
  },
  {
    id: "structured_output_validator",
    name: "Structured output validator",
    description: "Validate agent outputs against their required schemas before handoff.",
    serverName: mcpServerName,
    access: "review",
    inputContract: "candidate JSON payload plus schema name",
    outputContract: "validation result and error list when invalid",
    retryable: true
  },
  {
    id: "rubric_scorer",
    name: "Rubric scorer",
    description: "Score lesson artifacts for coverage, groundedness, clarity, and task-specific quality.",
    serverName: mcpServerName,
    access: "review",
    inputContract: "artifact payload plus rubric definition",
    outputContract: "scores, rubric notes, and blocking issues",
    retryable: false
  },
  {
    id: "artifact_versioner",
    name: "Artifact versioner",
    description: "Create a versioned artifact record when content changes or is regenerated.",
    serverName: mcpServerName,
    access: "write",
    inputContract: "artifact id, version metadata, and updated content",
    outputContract: "versioned artifact reference",
    retryable: false
  },
  {
    id: "workflow_event_writer",
    name: "Workflow event writer",
    description: "Write workflow trace events for agent actions, warnings, and teacher-visible updates.",
    serverName: mcpServerName,
    access: "write",
    inputContract: "workflow event payload with project and task ids",
    outputContract: "persisted workflow event reference",
    retryable: false
  }
];

export function getMcpToolById(toolId: string): McpToolSpec | undefined {
  return mcpToolCatalog.find((tool) => tool.id === toolId);
}
