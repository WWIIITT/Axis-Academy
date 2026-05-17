# Axis Academy 多代理系統設計

## 1. 系統原則

Axis Academy 使用 manager-led multi-agent orchestration。Manager 負責拆解任務、分配 agent、檢查輸出格式、處理衝突、觸發重試，並把最終內容整理成老師可讀的 lesson package。

Agent 的設計原則：

- 每個 agent 只負責清楚邊界內的工作。
- 所有輸出必須是 structured output，方便 validation、review 和 UI 呈現。
- 任何生成內容都需要保留 source references 或標記為 derived content。
- Reviewer agent 不應重寫內容，除非 Manager 明確要求 regeneration。
- Manager 是唯一負責 final synthesis 的 agent。

## 2. Milestone 分界

Agent skills 和 tool calls 分三個階段實作：

- Milestone 1：只建立 static registry，定義 agents、skills 和 tools metadata；不執行 agent，不呼叫 tools。
- Milestone 2：實作 ingestion-related tools，例如 document parser、text chunker 和 source map builder，讓教材能被轉成 traceable source chunks。
- Milestone 3：把 registry 轉成 executable orchestration，實作 agent prompts、tool dispatcher、tool call schema、agent output schema 和 Manager handoff。

因此，完整的 agent skills 和 tool call 行為應在 Milestone 3 設計和實作；Milestone 1 只保留穩定命名和能力邊界。

## 3. Agent 列表

| Agent | 主要職責 | 主要輸出 |
| --- | --- | --- |
| Project Manager | 協調流程、品質門檻、衝突處理、最終整合 | Workflow state、final lesson package、teacher review summary |
| Document Analyst | 解析教材、提取概念、定義、結構和 references | Source map、concept inventory、learning objectives |
| Subject Teacher | 檢查教學順序、難度、常見誤解和科目嚴謹度 | Pedagogy review、teaching sequence、misconception notes |
| Content Designer | 將內容轉成可教學 lesson structure | Lesson summary、section plan、concept coverage map |
| Example Designer | 設計 worked examples 和講解 | Examples、steps、explanations、common mistakes |
| Question Designer | 設計題目、答案和解析 | Question bank、answer keys、difficulty labels |
| Slide Designer | 產生 slide-ready content | Slide outline、slide content、speaker notes |
| Slide Reviewer | 審查投影片清晰度、節奏、覆蓋和正確性 | Slide review report、revision requests |
| Quality Reviewer | 檢查整包內容的 groundedness 和一致性 | Quality report、warnings、approval recommendation |

## 4. Agent Handoff Contract

每個 agent 的輸出都需要包含：

- `agent_name`：執行 agent 名稱。
- `task_id`：對應 workflow task。
- `status`：`completed`、`needs_revision` 或 `failed`。
- `summary`：老師可讀摘要。
- `artifacts`：主要結構化輸出。
- `source_references`：引用的教材位置。
- `warnings`：缺漏、低信心、可能錯誤或需要老師注意的地方。
- `tool_calls`：agent 執行期間呼叫過的 tools。
- `next_actions`：建議 Manager 進行的下一步。

Manager 只接受符合 schema 的 agent output。格式錯誤、來源缺失或關鍵欄位缺失時，Manager 需要要求 agent 修正，而不是直接進入下一步。

## 5. Agent Skills

Milestone 1 已定義以下 skills metadata：

- `workflow_orchestration`
- `document_analysis`
- `source_grounding`
- `pedagogical_review`
- `lesson_design`
- `example_design`
- `question_design`
- `slide_design`
- `quality_review`

Milestone 3 需要把 skill 轉成可執行能力。每個 executable skill 需要定義：

- 使用目的。
- 可使用的 agents。
- 可使用的 tools。
- Prompt instructions。
- Required input artifacts。
- Required output schema。
- Quality gates。
- Failure handling。

## 6. Tool Call 設計

Milestone 1 已定義以下 tools metadata：

- `document_parser`
- `text_chunker`
- `source_citation_lookup`
- `structured_output_validator`
- `rubric_scorer`
- `artifact_versioner`
- `workflow_event_writer`

Milestone 2 會先實作 ingestion tools：

- `document_parser`
- `text_chunker`
- source map creation。

Milestone 3 需要加入 tool dispatcher。每次 tool call 應包含：

- `tool_name`
- `agent_task_id`
- `input_json`
- `output_json`
- `status`
- `error_message`
- `started_at`
- `completed_at`

Tool call 原則：

- Agent 只能呼叫 catalog 中授權的 tools。
- Tool input/output 必須經 schema validation。
- Tool failure 必須寫入 workflow event。
- Tool result 必須能被 Manager 用於下一個 handoff。

## 7. Agent 詳細職責

### Manager

職責：

- 建立 lesson project 的 workflow graph。
- 決定各 agent 的執行順序。
- 將原始教材和中間產物傳給合適 agent。
- 執行 structured output validation。
- 根據 reviewer feedback 觸發局部重生。
- 整理 teacher-facing summary。
- 保留 workflow trace 給 UI 使用。

Milestone 3 需要新增：

- Tool dispatcher integration。
- Agent task lifecycle control。
- Provider adapter calls。
- Retry policy。
- Handoff validation。

### Document Analyst

職責：

- 解析教材結構。
- 提取章節、標題、概念、定義、公式、步驟、例子和圖片說明。
- 建立 source map，將內容片段對應到 page/slide/paragraph。
- 標記可能缺失或無法解析的教材區域。

主要 tools：

- `document_parser`
- `text_chunker`
- `source_citation_lookup`

### Subject Teacher

職責：

- 根據科目和年級語境檢查教學順序。
- 判斷概念難度和先備知識。
- 指出常見誤解。
- 建議合適的講解順序和例子類型。

主要 tools：

- `source_citation_lookup`
- `rubric_scorer`

### Content Designer

職責：

- 把 extracted content 轉成 lesson structure。
- 提煉課程精華。
- 確保每個核心概念都有教學位置。
- 將 lesson 分成 opening、concept explanation、guided examples、practice、review。

主要 tools：

- `source_citation_lookup`
- `structured_output_validator`

### Example Designer

職責：

- 設計高品質 worked examples。
- 每個例子需要明確教學目的。
- 例子需要包含步驟、講解、常見錯誤和 source references。
- 覆蓋核心概念和常見邊界情境。

主要 tools：

- `source_citation_lookup`
- `structured_output_validator`

### Question Designer

職責：

- 設計 formative 和 summative questions。
- 題目需要覆蓋不同概念和難度。
- 每題包含答案、解析、難度、題型和來源。
- 避免只測記憶，應包含理解、應用和推理。

主要 tools：

- `source_citation_lookup`
- `structured_output_validator`

### Slide Designer

職責：

- 將 lesson structure 轉成投影片內容。
- 每頁 slide 必須有單一清楚教學目的。
- 控制文字密度。
- 提供 speaker notes 和 visual suggestions。

主要 tools：

- `source_citation_lookup`
- `structured_output_validator`

### Slide Reviewer

職責：

- 檢查投影片是否清晰、順暢、完整。
- 檢查 slide 是否過密、跳步或缺少例子。
- 檢查每頁是否有 source references 或 derived content 標記。

主要 tools：

- `source_citation_lookup`
- `rubric_scorer`

### Quality Reviewer

職責：

- 檢查整份 lesson package 的 source coverage。
- 檢查 hallucination risk。
- 檢查 examples、questions 和 slides 是否互相一致。
- 檢查 reviewer warnings 是否已處理。

主要 tools：

- `source_citation_lookup`
- `rubric_scorer`

## 8. Orchestration Flow

1. Project Manager 建立 workflow。
2. Document Analyst 使用 ingestion tools 產生 source map 和 concept inventory。
3. Subject Teacher 產生 pedagogy review。
4. Content Designer 產生 lesson structure。
5. Example Designer 和 Question Designer 可在 lesson structure 完成後並行執行。
6. Slide Designer 依 lesson structure、examples 和 questions 生成投影片。
7. Slide Reviewer 審查 slides。
8. Quality Reviewer 審查整包輸出。
9. Manager 根據 review 結果觸發局部重生或產生 teacher review package。
10. 老師審批、編輯或要求局部重生。

## 9. 品質門檻

- 每個核心概念至少要出現在 lesson summary 或 slide content 中。
- 每個核心概念應至少被一個 example 或 question 覆蓋，除非 reviewer 明確標記為不適合。
- 每個 question 必須包含答案和解析。
- 每個 worked example 必須包含教學目的、步驟和講解。
- 每個重要生成內容必須有 source reference 或 derived content 標記。
- Reviewer 的 blocking issue 必須先處理，才可進入 final acceptance。
