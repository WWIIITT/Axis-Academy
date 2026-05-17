import fs from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import { PDFParse } from "pdf-parse";
import JSZip from "jszip";
import { chunkPdfPage, chunkPptSlide, chunkTextDocument } from "@/lib/ingestion/chunking";
import { IngestionInputType, ParsedSourceDocument } from "@/lib/ingestion/types";

function collectTextNodes(node: unknown, output: string[] = []) {
  if (typeof node === "string") {
    const trimmed = node.trim();
    if (trimmed) {
      output.push(trimmed);
    }
    return output;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectTextNodes(item, output);
    }
    return output;
  }

  if (node && typeof node === "object") {
    for (const value of Object.values(node as Record<string, unknown>)) {
      collectTextNodes(value, output);
    }
  }

  return output;
}

async function parsePdf(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const pages = result.text
    .split(/\f/g)
    .map((page) => page.trim())
    .filter(Boolean);

  const warnings: string[] = [];
  const chunks = pages.flatMap((pageText, index) => chunkPdfPage(pageText, index + 1));

  if (!chunks.length) {
    warnings.push("PDF text extraction returned no usable text.");
  }

  return {
    rawText: result.text.trim(),
    chunks,
    warnings
  };
}

async function parsePptx(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((fileName) => /^ppt\/slides\/slide\d+\.xml$/.test(fileName))
    .sort((left, right) => {
      const leftNumber = Number(left.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      const rightNumber = Number(right.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      return leftNumber - rightNumber;
    });

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true
  });

  const slides: string[] = [];
  const warnings: string[] = [];

  for (const fileName of slideFiles) {
    const xml = await zip.file(fileName)?.async("string");
    if (!xml) {
      warnings.push(`Unable to read ${path.basename(fileName)}.`);
      continue;
    }

    const parsed = parser.parse(xml);
    const texts = collectTextNodes(parsed);
    const slideText = texts.join(" ").replace(/\s+/g, " ").trim();
    if (slideText) {
      slides.push(slideText);
    } else {
      warnings.push(`No extractable text found in ${path.basename(fileName)}.`);
    }
  }

  const chunks = slides.flatMap((slideText, index) => chunkPptSlide(slideText, index + 1));

  if (!chunks.length) {
    warnings.push("PPTX text extraction returned no usable text.");
  }

  return {
    rawText: slides.join("\n\n").trim(),
    chunks,
    warnings
  };
}

function extractFallbackText(buffer: Buffer) {
  return buffer.toString("utf8").replace(/\0/g, " ").trim();
}

async function maybeRunOcr() {
  return {
    ocrText: "",
    warnings: [
      "OCR fallback is optional and disabled by default in Milestone 2."
    ]
  };
}

export async function parseSourceInput(inputType: IngestionInputType, rawText: string, fileBuffer?: Buffer) {
  if (inputType === "TEXT") {
    const chunks = chunkTextDocument(rawText);
    const warnings = chunks.length ? [] : ["No usable text found in pasted content."];

    return {
      rawText: rawText.trim(),
      chunks,
      warnings
    } satisfies ParsedSourceDocument;
  }

  if (!fileBuffer) {
    throw new Error("File buffer is required for file-based ingestion.");
  }

  if (inputType === "PDF") {
    try {
      const parsed = await parsePdf(fileBuffer);
      const fallbackText = parsed.rawText || extractFallbackText(fileBuffer);

      return {
        rawText: fallbackText,
        chunks: parsed.chunks.length ? parsed.chunks : chunkTextDocument(fallbackText),
        warnings: parsed.warnings
      } satisfies ParsedSourceDocument;
    } catch (error) {
      const ocr = await maybeRunOcr();
      const fallbackText = ocr.ocrText || extractFallbackText(fileBuffer);

      return {
        rawText: fallbackText,
        chunks: chunkTextDocument(fallbackText),
        warnings: [
          `PDF text extraction failed: ${error instanceof Error ? error.message : "unknown error"}.`,
          ...ocr.warnings
        ]
      } satisfies ParsedSourceDocument;
    }
  }

  if (inputType === "PPTX") {
    try {
      const parsed = await parsePptx(fileBuffer);
      const fallbackText = parsed.rawText || extractFallbackText(fileBuffer);
      return {
        rawText: fallbackText,
        chunks: parsed.chunks.length ? parsed.chunks : chunkTextDocument(fallbackText),
        warnings: parsed.warnings
      } satisfies ParsedSourceDocument;
    } catch (error) {
      return {
        rawText: extractFallbackText(fileBuffer),
        chunks: chunkTextDocument(extractFallbackText(fileBuffer)),
        warnings: [`PPTX text extraction failed: ${error instanceof Error ? error.message : "unknown error"}.`]
      } satisfies ParsedSourceDocument;
    }
  }

  throw new Error(`Unsupported ingestion type: ${inputType}`);
}

export async function readFileBuffer(filePath: string) {
  return fs.readFile(filePath);
}
