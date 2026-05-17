import { ParsedChunk } from "@/lib/ingestion/types";

function normalizeWhitespace(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function splitParagraphs(text: string) {
  return normalizeWhitespace(text)
    .split(/\n\s*\n+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function chunkTextDocument(text: string) {
  const paragraphs = splitParagraphs(text);

  return paragraphs.map<ParsedChunk>((paragraph, index) => ({
    chunkId: `text-para-${index + 1}`,
    pageNumber: null,
    slideNumber: null,
    sectionTitle: null,
    text: paragraph,
    metadata: {
      paragraphIndex: index + 1,
      sourceType: "TEXT"
    }
  }));
}

export function chunkPdfPage(pageText: string, pageNumber: number) {
  const paragraphs = splitParagraphs(pageText);

  return paragraphs.map<ParsedChunk>((paragraph, index) => ({
    chunkId: `page-${pageNumber}-para-${index + 1}`,
    pageNumber,
    slideNumber: null,
    sectionTitle: null,
    text: paragraph,
    metadata: {
      paragraphIndex: index + 1,
      sourceType: "PDF"
    }
  }));
}

export function chunkPptSlide(slideText: string, slideNumber: number, sectionTitle?: string | null) {
  const paragraphs = splitParagraphs(slideText);

  return paragraphs.map<ParsedChunk>((paragraph, index) => ({
    chunkId: `slide-${slideNumber}-block-${index + 1}`,
    pageNumber: null,
    slideNumber,
    sectionTitle: sectionTitle ?? null,
    text: paragraph,
    metadata: {
      paragraphIndex: index + 1,
      sourceType: "PPTX"
    }
  }));
}
