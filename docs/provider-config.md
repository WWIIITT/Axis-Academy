# Axis Academy Provider Config 設計

## 1. 目標

Axis Academy MVP 使用 OpenAI-compatible API provider contract。系統不綁定單一模型供應商，而是透過標準化設定接入支援 OpenAI chat completions 格式的 provider。

MVP 不需要實作 provider registry、per-agent model routing 或 automatic fallback，但需要保留後續擴展空間。

## 2. 環境變數

必填設定：

```env
AI_API_KEY=
AI_BASE_URL=
AI_MODEL_NAME=
```

建議可選設定：

```env
AI_REQUEST_TIMEOUT_MS=60000
AI_MAX_RETRIES=2
AI_TEMPERATURE=0.2
AI_MAX_OUTPUT_TOKENS=4000
```

設定原則：

- `AI_API_KEY` 只可在 server-side 使用。
- `AI_BASE_URL` 指向 provider 的 OpenAI-compatible endpoint base。
- `AI_MODEL_NAME` 是 MVP 所有 agent 的預設模型。
- 前端不得接收或顯示 API key。

## 3. Request Contract

MVP 以 chat completions 風格作為抽象基準。

標準 request 需要包含：

- `model`
- `messages`
- `temperature`
- `response_format` 或 structured output instruction
- `max_tokens` 或 provider 等價設定

所有 agent calls 都應經過同一個 provider adapter，而不是在各 agent 內直接呼叫 provider。

## 4. Provider Adapter 職責

Provider adapter 需要負責：

- 讀取環境變數。
- 建立 OpenAI-compatible request。
- 套用 timeout。
- 處理 retry。
- 解析 provider response。
- 將錯誤標準化。
- 回傳 model metadata 給 workflow event。

標準化錯誤類型：

- `authentication_error`
- `rate_limit_error`
- `timeout_error`
- `invalid_request_error`
- `provider_unavailable`
- `invalid_response_format`
- `unknown_provider_error`

## 5. Agent Model Policy

MVP 使用單一 `AI_MODEL_NAME`。

理由：

- 降低配置複雜度。
- 方便 evaluation harness 建立 baseline。
- 減少不同 agent 使用不同模型造成的不可預期差異。

後續版本可加入：

- `AI_MANAGER_MODEL_NAME`
- `AI_REVIEWER_MODEL_NAME`
- `AI_DESIGNER_MODEL_NAME`
- Provider fallback。
- Per-project model selection。

這些不屬於 MVP 必要範圍。

## 6. Prompt 與 Structured Output

所有 agent prompt 需要包含：

- Agent role。
- Task objective。
- Input artifacts。
- Required output schema。
- Source-grounding rules。
- Refusal or warning rules。
- Teacher-facing summary requirement。

Structured output 原則：

- 優先要求 JSON-compatible output。
- 每個 artifact 必須包含 `source_references` 或 `derived_content_reason`。
- Reviewer output 必須區分 `blocking_issues` 和 `non_blocking_warnings`。
- Provider response 需要經 schema validation 後才可進入 workflow state。

## 7. Retry Policy

MVP retry policy：

- Provider timeout：最多重試 `AI_MAX_RETRIES` 次。
- Rate limit：使用短暫 backoff 後重試。
- Invalid JSON：要求同一 agent 修正格式，最多一次。
- Missing source references：交回原 agent 修正，若仍失敗則標記 warning。
- Factual inconsistency：交由 Manager 觸發 relevant agent regeneration。

Retry 必須寫入 workflow events，讓 UI 能顯示「正在修正格式」、「正在重新檢查來源」等老師可理解狀態。

## 8. 安全與資料邊界

Provider calls 會接收老師上傳的教材內容，因此需要遵守：

- 只傳送完成任務所需的上下文。
- 避免把整份原始教材無限制傳入每個 agent。
- 不在 client-side log provider request。
- 不在 workflow trace UI 顯示 API key 或 raw request headers。
- 若未來加入外部 fact-checking，需要重新定義資料傳輸與來源政策。

## 9. 可攜性要求

為保持 provider portability：

- Agent 不直接依賴 provider-specific SDK。
- Provider adapter 封裝 request/response 差異。
- Evaluation harness report 必須記錄 provider、base URL label、model name 和 prompt version。
- 不使用只有單一 provider 支援且無 fallback 的核心功能作為 MVP 依賴。
