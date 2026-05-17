# Axis Academy 多代理系統設計

## 1. 系統原則

Axis Academy 使用 manager-led multi-agent orchestration。Manager 負責拆解任務、分配 agent、檢查輸出格式、處理衝突、觸發重試，並把最終內容整理成老師可讀的 lesson package。

Agent 的設計原則：

- 每個 agent 只負責清楚邊界內的工作。
- 所有輸出必須是 structured output，方便 validation、review 和 UI 呈現。
- 任何生成內容都需要保留 source references 或標記為 derived content。
- Reviewer agent 不應重寫內容，除非 manager 明確要求 regeneration。
- Manager 是唯一負責 final synthesis 的 agent。

## 2. Agent 列表

| Agent | 主要職責 | 主要輸出 |
| --- | --- | --- |
| Manager | 協調流程、品質門檻、衝突處理、最終整合 | Workflow state、final lesson package、teacher review summary |
| Document Analyst | 解析教材、提取概念、定義、結構和 references | Source map、concept inventory、learning objectives |
| Subject Teacher | 檢查教學順序、難度、常見誤解和科目嚴謹度 | Pedagogy review、teaching sequence、misconception notes |
| Content Designer | 將內容轉成可教學 lesson structure | Lesson summary、section plan、concept coverage map |
| Example Designer | 設計 worked examples 和講解 | Examples、steps、explanations、common mistakes |
| Question Designer | 設計題目、答案和解析 | Question bank、answer keys、difficulty labels |
| Slide Designer | 產生 slide-ready content | Slide outline、slide content、speaker notes |
| Slide Reviewer | 審查投影片清晰度、節奏、覆蓋和正確性 | Slide review report、revision requests |
| Quality Reviewer | 檢查整包內容的 groundedness 和一致性 | Quality report、warnings、approval recommendation |

## 3. Agent Handoff Contract

每個 agent 的輸出都需要包含：

- `agent_name`：執行 agent 名稱。
- `task_id`：對應 workflow task。
- `status`：`completed`、`needs_revision` 或 `failed`。
- `summary`：老師可讀摘要。
- `artifacts`：主要結構化輸出。
- `source_references`：引用的教材位置。
- `warnings`：缺漏、低信心、可能錯誤或需要老師注意的地方。
- `next_actions`：建議 manager 進行的下一步。

Manager 只接受符合 schema 的 agent output。格式錯誤、來源缺失或關鍵欄位缺失時，Manager 需要要求 agent 修正，而不是直接進入下一步。

## 4. Agent 詳細職責

### Manager

Manager 是整個 pipeline 的控制器。

職責：

- 建立 lesson project 的 workflow graph。
- 決定各 agent 的執行順序。
- 將原始教材和中間產物傳給合適 agent。
- 執行 structured output validation。
- 根據 reviewer feedback 觸發局部重生。
- 整理 teacher-facing summary。
- 保留 workflow trace 給 UI 使用。

失敗情境：

- Agent 多次輸出格式不合法。
- Reviewer 發現核心內容無法 source-ground。
- 生成內容互相矛盾。
- 老師要求重生但缺少足夠上下文。

品質門檻：

- 不允許沒有 review report 的內容進入 final acceptance。
- 不允許無來源的重要概念默默通過。
- 不允許 reviewer warning 被覆蓋或丟棄。

### Document Analyst

職責：

- 解析教材結構。
- 提取章節、標題、概念、定義、公式、步驟、例子和圖片說明。
- 建立 source map，將內容片段對應到 page/slide/paragraph。
- 標記可能缺失或無法解析的教材區域。

工具：

- Document parsing。
- Text chunking。
- OCR placeholder。
- Source citation lookup。

輸出：

- `source_map`
- `concept_inventory`
- `definitions`
- `learning_objective_candidates`
- `coverage_risks`

### Subject Teacher

職責：

- 根據科目和年級語境檢查教學順序。
- 判斷概念難度和先備知識。
- 指出常見誤解。
- 建議合適的講解順序和例子類型。

輸出：

- `teaching_sequence`
- `prerequisites`
- `misconceptions`
- `difficulty_notes`
- `pedagogical_warnings`

### Content Designer

職責：

- 把 extracted content 轉成 lesson structure。
- 提煉課程精華。
- 確保每個核心概念都有教學位置。
- 將 lesson 分成 opening、concept explanation、guided examples、practice、review。

輸出：

- `lesson_summary`
- `section_plan`
- `concept_coverage_map`
- `teacher_notes`

### Example Designer

職責：

- 設計高品質 worked examples。
- 每個例子需要明確教學目的。
- 例子需要包含步驟、講解、常見錯誤和 source references。
- 必須覆蓋核心概念和常見邊界情境。

輸出：

- `examples`
- `example_steps`
- `explanations`
- `common_mistakes`
- `source_references`

### Question Designer

職責：

- 設計 formative 和 summative questions。
- 題目需要覆蓋不同概念和難度。
- 每題包含答案、解析、難度、題型和來源。
- 避免只測記憶，應包含理解、應用和推理。

輸出：

- `questions`
- `answer_keys`
- `explanations`
- `difficulty`
- `question_type`
- `concept_targets`
- `source_references`

### Slide Designer

職責：

- 將 lesson structure 轉成投影片內容。
- 每頁 slide 必須有單一清楚教學目的。
- 控制文字密度。
- 提供 speaker notes 和 visual suggestions。

輸出：

- `slide_outline`
- `slides`
- `speaker_notes`
- `visual_suggestions`

### Slide Reviewer

職責：

- 檢查投影片是否清晰、順暢、完整。
- 檢查 slide 是否過密、跳步或缺少例子。
- 檢查每頁是否有 source references 或 derived content 標記。

輸出：

- `slide_review_report`
- `revision_requests`
- `approval_recommendation`

### Quality Reviewer

職責：

- 檢查整份 lesson package 的 source coverage。
- 檢查 hallucination risk。
- 檢查 examples、questions 和 slides 是否互相一致。
- 檢查 reviewer warnings 是否已處理。

輸出：

- `quality_report`
- `groundedness_score`
- `coverage_score`
- `blocking_issues`
- `non_blocking_warnings`

## 5. 工具設計

MVP 需要以下工具能力：

- Document parsing：從 PDF/PPTX/text 取得可處理文本。
- Chunking：按章節、頁面、slide 或語義片段分割內容。
- Source citation lookup：將生成內容連回原始 source map。
- Structured JSON validation：檢查 agent output schema。
- Rubric scoring：按品質維度評分。
- Retry/regeneration：針對 section、slide、example 或 question 局部重生。
- Export preparation：整理成可導出的 lesson package 結構。

## 6. Orchestration Flow

1. Manager 建立 workflow。
2. Document Analyst 產生 source map 和 concept inventory。
3. Subject Teacher 產生 pedagogy review。
4. Content Designer 產生 lesson structure。
5. Example Designer 和 Question Designer 可在 lesson structure 完成後並行執行。
6. Slide Designer 依 lesson structure、examples 和 questions 生成投影片。
7. Slide Reviewer 審查 slides。
8. Quality Reviewer 審查整包輸出。
9. Manager 根據 review 結果觸發局部重生或產生 teacher review package。
10. 老師審批、編輯或要求局部重生。

## 7. 品質門檻

- 每個核心概念至少要出現在 lesson summary 或 slide content 中。
- 每個核心概念應至少被一個 example 或 question 覆蓋，除非 reviewer 明確標記為不適合。
- 每個 question 必須包含答案和解析。
- 每個 worked example 必須包含教學目的、步驟和講解。
- 每個重要生成內容必須有 source reference 或 derived content 標記。
- Reviewer 的 blocking issue 必須先處理，才可進入 final acceptance。
