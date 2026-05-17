# Axis Academy MVP Roadmap

## 1. Roadmap 原則

MVP 的目標是先完成一條可用、可審核、可評測的 teacher workflow。所有 milestone 都應服務於這條主線：老師上傳教材，agent 生成 slides/examples/questions，reviewer 檢查正確性，老師完成審批。

不應在第一版投入過多時間到學生端、多租戶、LMS 整合或複雜 provider routing。

## 2. Milestone 1：專案基礎與資料模型

目標：

- 建立 Next.js full-stack 專案。
- 建立 lesson project、source document、source map、agent task、workflow event 和 artifact 的資料模型。
- 建立 server-side provider config。

完成標準：

- 老師可以建立 lesson project。
- 系統可以保存 project 和 source document metadata。
- API key 只在 server-side 使用。
- workflow event 可以被寫入和讀取。

## 3. Milestone 2：Document Ingestion

目標：

- 支援 PDF、PPTX 和 pasted text。
- 將教材解析為 chunks。
- 建立 source map。
- 顯示 parsing warnings。

完成標準：

- 老師可以上傳或貼上教材。
- 系統能取得可處理文本。
- 每個 chunk 有來源位置。
- 解析失敗會顯示可理解錯誤。

## 4. Milestone 3：Agent Pipeline MVP

目標：

- 實作 Manager。
- 實作 Document Analyst、Subject Teacher、Content Designer、Example Designer、Question Designer 和 Slide Designer。
- 所有 agent output 使用 structured schema。
- Manager 能串接完整 pipeline。

完成標準：

- 一份教材能產生 lesson summary、examples、questions 和 slide content。
- 每個 agent task 都會產生 workflow event。
- 生成內容包含 source references 或 derived content 標記。
- Agent output validation 失敗時能重試或標記錯誤。

## 5. Milestone 4：Review 與 Correctness Gate

目標：

- 實作 Slide Reviewer 和 Quality Reviewer。
- 檢查 coverage、groundedness、factual consistency 和 warning。
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
- 計算 coverage、groundedness、example quality、question quality、slide quality 和 reviewer accuracy。

完成標準：

- 能在固定 samples 上重跑 pipeline。
- 能輸出 regression report。
- Report 記錄 model、provider、prompt version 和 workflow version。
- 低於門檻的改動會被標記。

## 8. Milestone 7：Export Preparation

目標：

- 整理 final accepted lesson package。
- 支援匯出為結構化 JSON 或 markdown。
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

推薦實作順序：

1. 建立 Next.js 專案與基礎資料模型。
2. 實作 provider adapter 和 structured output validation。
3. 完成 PDF/PPTX/text ingestion。
4. 實作 Manager 和前三個 agent。
5. 加入 examples、questions 和 slides generation。
6. 加入 reviewer agents。
7. 建立 teacher review UI。
8. 建立 evaluation harness。
9. 加入 export preparation。

這個順序能先建立 end-to-end vertical slice，再逐步提高品質和覆蓋率。
