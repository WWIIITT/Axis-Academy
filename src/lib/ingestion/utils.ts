export function getUploadMaxSizeLabel() {
  return "25MB";
}

export function inferIngestionTypeFromFile(file: File) {
  if (file.type === "application/pdf") {
    return "PDF" as const;
  }

  if (file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
    return "PPTX" as const;
  }

  return null;
}
