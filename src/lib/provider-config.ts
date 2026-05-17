function readNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getProviderStatus() {
  const baseUrl = process.env.AI_BASE_URL;
  const modelName = process.env.AI_MODEL_NAME;
  const apiKey = process.env.AI_API_KEY;

  const baseUrlConfigured = Boolean(baseUrl);
  const modelConfigured = Boolean(modelName);
  const apiKeyConfigured = Boolean(apiKey);

  return {
    configured: baseUrlConfigured && modelConfigured && apiKeyConfigured,
    baseUrlConfigured,
    modelConfigured,
    apiKeyConfigured,
    modelName: modelName || null,
    requestTimeoutMs: readNumber(process.env.AI_REQUEST_TIMEOUT_MS, 60000),
    maxRetries: readNumber(process.env.AI_MAX_RETRIES, 2),
    temperature: readNumber(process.env.AI_TEMPERATURE, 0.2),
    maxOutputTokens: readNumber(process.env.AI_MAX_OUTPUT_TOKENS, 4000)
  };
}
