# Axis Academy MVP Roadmap

## 1. Roadmap 原則

MVP 的目標是先完成一條可用、可審核、可評測的 teacher workflow：老師建立 lesson project、上傳或貼上教材，系統解析內容，agent pipeline 生成 slides/examples/questions，reviewer 檢查正確性，最後由老師審批。

第一版不應優先投入學生端、多租戶、LMS 整合、複雜 provider routing 或外部 fact-checking。這些功能應在核心 teacher workflow 穩定後再加入。

## 2. Milestone 1：專案基礎與資料模型

目標：

- 建立 Next.js full-stack 專案。
- 建立 lesson project、source document、source map、agent task、workflow event 和 artifact 資料模型。
- 建立 server-side provider config。
- 建立 development teacher stub。
- 建立 agent catalog、skills catalog 和 tools catalog。

完成標準：

- 老師可以建立 lesson project。
- 系統可以保存 project metadata。
- API key 只在 server-side 使用。
- workflow event 可以被寫入和讀取。
- `/api/agents/catalog` 可以回傳 agent、skills、tools metadata。

明確不做：

- 不執行 agent。
- 不呼叫 LLM。
- 不執行 tool calls。
- 不做 PDF/PPTX parsing。
- 不生成教學內容。

Milestone 1 的 agent skills/tools 只是 registry，用來讓 UI 和後續 orchestration 有穩定定義。

## 3. Milestone 2：Document Ingestion

目標：

- 支援 PDF、PPTX 和 pasted text。
- 將教材解析成可處理 text。
- 將 text 切成 traceable chunks。
- 建立 source map。
- 顯示 parsing warnings。

完成標準：

- 老師可以上傳或貼上教材。
- 系統能取得可處理文本。
- 每個 chunk 有來源位置，例如 page、slide、section 或 paragraph。
- 解析失敗會顯示可理解錯誤。
- Document parsing 和 text chunking tools 具備可被 Milestone 3 agent 呼叫的介面。

明確不做：

- 不設計完整 agent prompt。
- 不執行 multi-agent workflow。
- 不生成 slides/examples/questions。

Milestone 2 的重點是把 ingestion tools 做成可重用能力，讓 Milestone 3 可以由 agents 透過 tool calls 使用。

## 4. Milestone 3：Agent Pipeline MVP

目標：

- 實作 Manager orchestration。
- 實作 Document Analyst、Subject Teacher、Content Designer、Example Designer、Question Designer 和 Slide Designer。
- 將 Milestone 1 的 agent skills/tools registry 轉成可執行設計。
- 定義 agent prompt contract、tool call contract 和 structured output schemas。
- 讓 Manager 能串接完整 pipeline。

完成標準：

- 一份教材能產生 lesson summary、examples、questions 和 slide content。
- 每個 agent task 都會產生 workflow event。
- 每個 agent output 使用 structured schema。
- 每個 tool call 都有 input/output schema、執行狀態和錯誤處理。
- 生成內容包含 source references 或 derived content 標記。
- Agent output validation 失敗時能重試或標記錯誤。

Milestone 3 必須設計和實作：

- Executable agent skills：每個 skill 如何影響 prompt、tool access、output schema 和 quality gate。
- Tool dispatcher：統一執行 tools，記錄 tool call result。
- Tool permissions：每個 agent 只能呼叫被授權的 tools。
- Manager handoff：agent output 如何進入下一個 agent。
- Provider adapter usage：agent 透過 provider adapter 呼叫 OpenAI-compatible API。

## 5. Milestone 4：Review 與 Correctness Gate

目標：

- 實作 Slide Reviewer 和 Quality Reviewer。
- 檢查 coverage、groundedness、factual consistency 和 warnings。
- Manager 根據 reviewer 結果標記 blocking issues。

完成標準：

- Reviewer report 能指出缺少來源、覆蓋不足或內容矛盾。
- Blocking issue 會阻止 final acceptance。
- Non-blocking warning 會顯示給老師。
- Teacher review package 包含清楚摘要。

## 6. Milestone 5：Teacher Review UI

目標：

- 建立 live workflow trace UI。
- 顯示 agent 狀態、進度、review warnings 和 teacher-facing summaries。
- 支援 approve、edit、regenerate selected section 和 final acceptance。

完成標準：

- 老師能看到每個 agent 的狀態。
- 老師能查看生成的 slides/examples/questions。
- 老師能修改內容。
- 老師能局部重生指定 section。
- 老師能完成 final acceptance。

## 7. Milestone 6：Evaluation Harness

目標：

- 建立固定教材樣本。
- 定義 sample rubrics。
- 自動執行 agent workflow。
- 評估 coverage、groundedness、example quality、question quality、slide quality 和 reviewer accuracy。

完成標準：

- 能在固定 samples 上重跑 pipeline。
- 能輸出 regression report。
- Report 記錄 model、provider、prompt version 和 workflow version。
- 低於門檻的改動會被標記。

## 8. Milestone 7：Export Preparation

目標：

- 整理 final accepted lesson package。
- 支援匯出為 structured JSON 或 Markdown。
- 為後續 PPTX export 保留資料結構。

完成標準：

- 老師 final acceptance 後能取得完整 lesson package。
- Export 包含 lesson summary、slides、examples、questions 和 review metadata。
- Export 不包含 API key、raw provider response 或 internal debug data。

## 9. MVP 後續版本

可在 MVP 穩定後加入：

- 學生端練習和答題。
- LMS 整合。
- PPTX export。
- External fact-checking。
- Multi-provider fallback。
- Per-agent model routing。
- Subject-specific rubrics。
- School-level account management。
- Advanced analytics。

## 10. 近期實作順序

推薦順序：

1. 完成 Next.js 專案與基礎資料模型。
2. 完成 provider adapter 和 structured output validation。
3. 完成 PDF/PPTX/text ingestion。
4. 將 ingestion tools 接成可被 agent 呼叫的 tool interface。
5. 實作 Manager 和前三個 agent。
6. 加入 examples、questions 和 slides generation。
7. 加入 reviewer agents。
8. 建立 teacher review UI。
9. 建立 evaluation harness。
10. 加入 export preparation。

核心分界：

- Milestone 1：定義 agent/skill/tool metadata。
- Milestone 2：實作 ingestion tools。
- Milestone 3：實作可執行 agents、skills 和 tool calls。
