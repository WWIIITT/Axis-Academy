export type IngestionInputType = "TEXT" | "PDF" | "PPTX";

export type ParsedChunk = {
  chunkId: string;
  pageNumber: number | null;
  slideNumber: number | null;
  sectionTitle: string | null;
  text: string;
  metadata: Record<string, unknown>;
};

export type ParsedSourceDocument = {
  rawText: string;
  chunks: ParsedChunk[];
  warnings: string[];
};

export type SourceUploadResult = {
  sourceDocumentId: string;
  parseStatus: "PARSED" | "FAILED";
  warnings: string[];
  chunkCount: number;
};
