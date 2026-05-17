import { getProviderStatus } from "@/lib/provider-config";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionRequest = {
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
};

export type ChatCompletionResponse = {
  content: string;
  modelName: string;
};

export async function callProvider(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const status = getProviderStatus();

  if (!status.configured) {
    throw new Error("Provider is not configured.");
  }

  const response = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL_NAME,
      messages: request.messages,
      temperature: request.temperature ?? status.temperature,
      max_tokens: request.maxOutputTokens ?? status.maxOutputTokens
    })
  });

  if (!response.ok) {
    throw new Error(`Provider request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "";

  return {
    content,
    modelName: process.env.AI_MODEL_NAME ?? "unknown"
  };
}
