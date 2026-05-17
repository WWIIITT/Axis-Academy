# Axis Academy Orchestration Platform 設計

## 1. 架構方向

MVP 採用 Next.js full-stack 架構，將老師使用的網站介面、API routes、workflow orchestration 和 provider integration 放在同一個產品邊界內。這讓第一版可以快速建立可用的 teacher workflow 和 live workflow trace，同時保留日後拆分 backend worker 的空間。

建議技術方向：

- Next.js App Router。
- TypeScript。
- API routes 或 server actions 作為 backend entrypoints。
- PostgreSQL 或等價關聯式資料庫儲存 projects、artifacts、workflow events 和 review states。
- Object storage 儲存原始教材和導出檔案。
- Background job runner 處理長時間 agent workflow。
- OpenAI-compatible provider adapter 呼叫模型。

## 2. 核心資料模型

### Lesson Project

代表老師的一次教材轉換任務。

欄位：

- `id`
- `teacher_id`
- `title`
- `subject`
- `grade_level`
- `status`
- `created_at`
- `updated_at`

狀態：

- `draft`
- `uploaded`
- `processing`
- `needs_teacher_review`
- `approved`
- `exported`
- `failed`

### Source Document

代表老師上傳或貼上的教材。

欄位：

- `id`
- `lesson_project_id`
- `type`：`pdf`、`pptx` 或 `text`
- `file_url`
- `raw_text`
- `parse_status`
- `parse_warnings`

### Source Map

將教材內容片段和來源位置連接起來。

欄位：

- `id`
- `source_document_id`
- `chunk_id`
- `page_number`
- `slide_number`
- `section_title`
- `text`
- `metadata`

### Agent Task

代表一次 agent 執行。

欄位：

- `id`
- `lesson_project_id`
- `agent_name`
- `status`
- `input_artifact_ids`
- `output_artifact_ids`
- `warnings`
- `started_at`
- `completed_at`

### Workflow Event

支援 live workflow trace 的事件流。

欄位：

- `id`
- `lesson_project_id`
- `agent_task_id`
- `event_type`
- `message`
- `teacher_visible`
- `created_at`

### Artifact

保存 agent 產物。

欄位：

- `id`
- `lesson_project_id`
- `type`
- `content_json`
- `source_references`
- `review_status`
- `version`

## 3. API 形態

MVP API 可採用以下路由形態：

- `POST /api/lesson-projects`：建立 lesson project。
- `POST /api/lesson-projects/:id/sources`：上傳 PDF/PPTX 或貼上文字。
- `POST /api/lesson-projects/:id/run`：啟動 agent workflow。
- `GET /api/lesson-projects/:id`：取得 project 狀態和 artifacts。
- `GET /api/lesson-projects/:id/events`：取得 workflow trace events。
- `POST /api/artifacts/:id/edit`：老師修改 artifact。
- `POST /api/artifacts/:id/approve`：老師批准 artifact。
- `POST /api/artifacts/:id/regenerate`：局部重生 artifact。
- `POST /api/lesson-projects/:id/final-acceptance`：老師確認最終版本。

所有 API 回應需要包含可呈現於 UI 的狀態摘要。內部錯誤、provider raw response 和完整 debug prompt 不預設暴露給老師。

## 4. Live Workflow Trace UI

老師應能看到 agent workflow 的可理解進度，而不是工程 debug console。

UI 需要顯示：

- Project-level status。
- Agent task list。
- 每個 agent 的 current state：queued、running、reviewing、completed、needs_revision、failed。
- 每個 agent 的老師可讀摘要。
- Source-grounding 檢查結果。
- Review warnings 和 blocking issues。
- 可重試或可局部重生的內容。

UI 不應預設顯示：

- Raw prompts。
- Raw provider responses。
- API keys。
- Token-level traces。
- Debug-only stack traces。

這些資料可在未來加入 admin/debug mode，但不屬於老師 MVP 介面。

## 5. Workflow 狀態轉換

標準流程：

1. `draft`：老師建立 project。
2. `uploaded`：教材已上傳或貼上。
3. `processing`：agent workflow 執行中。
4. `needs_teacher_review`：agent 完成並等待老師審核。
5. `approved`：老師完成 final acceptance。
6. `exported`：內容已導出。

失敗流程：

- 如果 parsing 失敗，project 保持 `uploaded`，source document 標記 `parse_status = failed`。
- 如果 agent task 失敗，project 保持 `processing` 或改為 `failed`，視是否可重試。
- 如果 reviewer 發現 blocking issue，project 進入 `needs_teacher_review`，但 artifact 標記不可 final accept，直到 issue 被處理。

## 6. Regeneration Flow

局部重生需要保留版本歷史。

流程：

1. 老師選擇 artifact 或 artifact section。
2. UI 傳入 regenerate request，包含老師指示。
3. Manager 取得該 section 的 source references 和相關上下文。
4. 對應 agent 只重生該 section。
5. Reviewer 只審查受影響內容和依賴內容。
6. 新 artifact 以新 version 保存。
7. UI 顯示新舊版本差異和 reviewer warnings。

## 7. 儲存與隱私

MVP 應保留：

- 原始教材。
- 解析後文本。
- Source map。
- Agent outputs。
- Workflow events。
- 老師 edits。
- Review reports。
- Final accepted version。

敏感資料原則：

- API key 只存在 server-side environment。
- Raw provider logs 不應暴露給老師。
- 若儲存 prompts 和 responses，需標記為 internal telemetry。
- 未來如支援學校或機構部署，需加入 data retention policy。

## 8. 可觀測性

MVP 至少需要記錄：

- 每個 agent task 的開始和完成時間。
- Provider request 是否成功。
- Retry 次數。
- Structured output validation 失敗原因。
- Reviewer blocking issues。
- Teacher edit 和 approval actions。

這些資料同時支援 workflow UI、debugging 和 evaluation harness。
