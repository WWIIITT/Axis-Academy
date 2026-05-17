# Axis Academy 產品藍圖

## 1. 產品定位

Axis Academy 是一個面向老師的 AI 教學內容製作平台。老師上傳想教授的教材後，系統會由多個 AI agent 協作，將原始內容整理成可教、可審核、可輸出的教學資產。

MVP 的核心目標不是取代老師，而是把繁重的教材整理、例子設計、題目設計和初步審查流程自動化，讓老師把時間集中在教學判斷、內容修訂和最終把關。

## 2. MVP 目標

- 支援老師上傳 `PDF`、`PPTX` 或貼上文字內容。
- 從原始教材提煉課程重點、概念結構、先備知識和學習目標。
- 生成可用於授課的投影片內容、教學例子和題目。
- 所有生成內容都需要能追溯到原始教材來源。
- 老師可以審核、編輯、局部重生和最終確認輸出。
- 網站介面顯示 live workflow trace，讓老師知道每個 agent 正在做什麼、完成了什麼、有哪些風險或審查警告。

## 3. 主要使用者

第一版主要使用者是老師。

老師的典型需求：

- 快速把已有教材轉成一堂結構清晰的課。
- 取得更好的 worked examples，而不是只得到摘要。
- 取得能覆蓋重點、難度分層、附答案與解析的問題。
- 確認 AI 沒有脫離教材、曲解概念或漏掉重要內容。
- 保留修改權與最終審批權。

## 4. 核心工作流

1. 老師建立 lesson project。
2. 老師上傳 PDF/PPTX 或貼上文字。
3. 系統解析教材並建立 source map。
4. Document Analyst 提取概念、定義、結構和來源 references。
5. Subject Teacher 檢查教學順序、難度、常見誤解和科目嚴謹度。
6. Content Designer 建立 lesson structure 和重點摘要。
7. Example Designer 設計高品質例子與講解。
8. Question Designer 設計題目、答案、解析、難度和來源覆蓋。
9. Slide Designer 生成 slide-ready content。
10. Slide Reviewer 和 Quality Reviewer 檢查覆蓋率、正確性、清晰度和 source grounding。
11. Manager 整合結果並標記需要老師注意的地方。
12. 老師審核、編輯、局部重生或最終接受。

## 5. MVP 產出

每個 lesson project 會產生以下內容：

- Lesson summary：課程精華、核心概念、學習目標和先備知識。
- Slide outline：投影片順序、每頁教學目的、關鍵內容和講解提示。
- Slide content：可直接轉成投影片的標題、重點、例子、圖表建議和 speaker notes。
- Examples：高品質 worked examples，包含步驟、講解、常見錯誤和來源 references。
- Questions：題目、答案、解析、難度、題型、覆蓋概念和來源 references。
- Review report：覆蓋率、groundedness、潛在錯誤、缺漏和建議修改。

## 6. 老師控制權

MVP 需要支援四種老師操作：

- Approve：接受某個 section 或整份輸出。
- Edit：直接修改摘要、投影片、例子或題目。
- Regenerate selected section：只重生指定內容，例如某一題、某一頁 slide 或某組例子。
- Final acceptance：確認整份 lesson package 可用於導出或後續發布。

系統不得把未經老師確認的內容視為最終版本。

## 7. 正確性原則

Axis Academy 的第一版正確性策略是 source-grounded review 加老師審批。

系統需要遵守以下原則：

- 所有重要概念、定義、例子和答案都需要連回原始教材 evidence。
- 如果內容是 agent 基於教材延伸設計，必須標記為 derived content。
- 如果某項內容缺少來源支持，review report 必須列為 warning。
- Agent 不應自動加入外部事實，除非未來版本明確加入外部 fact-checking 流程。
- 最終正確性由老師審批，但 agent 必須先完成可解釋的自動審查。

## 8. 非目標

MVP 不包含以下範圍：

- 學生端練習平台。
- 自動發布到 LMS。
- 多租戶學校管理。
- 影片和音訊教材處理。
- 外部網路 fact-checking。
- 完整 PowerPoint 匯出引擎。
- per-agent model routing 和 provider fallback。

這些可以在後續版本加入，但不應阻塞第一版文件和 MVP 架構。

## 9. 成功標準

MVP 可被視為成功，如果能做到：

- 老師能從一份 PDF/PPTX/text 建立 lesson project。
- 系統能生成完整的 slides、examples 和 questions。
- Workflow trace 能清楚顯示 agent 狀態與審查結果。
- 每個生成內容都能看到來源或 warning。
- 老師能完成 approve/edit/regenerate/final acceptance。
- Evaluation harness 能用固定教材樣本比較不同 prompt、model 或 orchestration 版本的品質。
