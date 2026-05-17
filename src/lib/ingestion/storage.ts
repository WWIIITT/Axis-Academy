import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const uploadsRoot = path.join(process.cwd(), "uploads");

export async function ensureUploadsRoot() {
  await fs.mkdir(uploadsRoot, { recursive: true });
}

export async function storeUploadFile(originalName: string, buffer: Buffer) {
  await ensureUploadsRoot();

  const safeBaseName = originalName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const fileName = `${Date.now()}-${randomUUID()}-${safeBaseName}`;
  const filePath = path.join(uploadsRoot, fileName);

  await fs.writeFile(filePath, buffer);

  return {
    fileName,
    filePath,
    relativePath: path.posix.join("uploads", fileName)
  };
}

export async function deleteStoredUpload(relativePath: string) {
  const absolutePath = path.join(process.cwd(), relativePath);
  await fs.unlink(absolutePath).catch(() => undefined);
}
