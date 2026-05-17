# Axis Academy Evaluation Harness 設計

## 1. 目的

Evaluation harness 用於穩定評估 agent pipeline 的內容品質。它不是一般 unit test 的替代品，而是針對 AI 內容生成的工程品質門檻。

當 prompt、model、provider、agent workflow 或 review rubric 改變時，harness 需要能回答：

- 內容是否仍然完整覆蓋教材？
- 生成內容是否仍然 source-grounded？
- Examples 是否仍然有教學價值？
- Questions 是否仍然正確、清晰並覆蓋不同難度？
- Reviewer 是否能抓到錯誤和缺漏？

## 2. 測試資料集

MVP 需要建立固定教材樣本集。

每個 sample 應包含：

- 原始教材：PDF、PPTX 或 text。
- 人工標註的核心概念。
- 預期學習目標。
- 必須覆蓋的內容。
- 可接受的 derived content 範圍。
- 已知常見誤解。
- 評分 rubric。

建議第一批樣本：

- 一份概念型教材。
- 一份步驟型教材。
- 一份包含圖表或表格的教材。
- 一份容易產生誤解的教材。
- 一份內容較短但需要高品質題目的教材。

## 3. 評分維度

### Source Coverage

衡量生成內容是否覆蓋教材重點。

指標：

- 核心概念覆蓋率。
- 學習目標覆蓋率。
- 必須提及內容覆蓋率。
- 被忽略的重要教材片段。

### Groundedness

衡量生成內容是否能回鏈原始教材。

指標：

- 有 source references 的重要 claims 比例。
- 無來源的重要 claims 數量。
- Derived content 是否正確標記。
- Reviewer 是否抓到 unsupported claims。

### Factual Consistency

衡量生成內容是否與教材一致。

指標：

- 定義是否被改寫到失真。
- 公式、步驟或因果關係是否錯誤。
- Examples 和 questions 是否違反教材內容。
- 答案是否和題目一致。

### Example Quality

衡量例子是否有教學價值。

指標：

- 是否有明確教學目的。
- 是否包含步驟和講解。
- 是否覆蓋核心概念。
- 是否包含常見錯誤或提醒。
- 是否難度合適。

### Question Quality

衡量題目是否高品質。

指標：

- 題目是否清楚。
- 答案是否正確。
- 解析是否能教會學生。
- 難度標籤是否合理。
- 題型是否多樣。
- 是否覆蓋不同概念。

### Slide Quality

衡量投影片是否適合授課。

指標：

- 每頁是否有清楚教學目的。
- 順序是否自然。
- 文字密度是否可接受。
- 是否有講解提示。
- 是否包含 examples 或 practice moments。

### Reviewer Accuracy

衡量 reviewer agent 是否能正確判斷問題。

指標：

- 是否抓到人工標註的 blocking issues。
- 是否避免過多 false positives。
- 是否給出可執行 revision request。
- 是否保留低信心警告。

## 4. Harness 流程

1. 載入固定 sample 教材。
2. 執行完整 agent workflow。
3. 保存所有 agent outputs、workflow events 和 review reports。
4. 將輸出和 sample rubric 比對。
5. 計算各項分數。
6. 產生 regression report。
7. 若低於門檻，阻止 prompt/model/orchestration 改動合併。

## 5. 評分門檻

MVP 建議預設門檻：

- Source coverage 不低於 85%。
- Groundedness 不低於 90%。
- 重大 factual inconsistency 必須為 0。
- Question answer correctness 必須為 100%。
- Reviewer blocking issue recall 不低於 80%。
- Slide quality 不低於人工 rubric 的可接受等級。

門檻可以按科目調整，但任何調整都需要記錄原因。

## 6. Regression Report

每次 harness run 應產生 report，包含：

- Run metadata：model、provider、prompt version、workflow version。
- 每份 sample 的分數。
- 與上一個 baseline 的差異。
- 新增 failures。
- 改善項目。
- Reviewer missed issues。
- 需要人工審查的輸出片段。

## 7. 與產品流程的關係

Evaluation harness 不會取代老師審批。它的角色是讓工程團隊在修改 agent pipeline 前，有一個可重複、可比較的品質基準。

產品內的 teacher review 是單次 lesson project 的品質控制；harness 是整個系統長期演進的品質控制。

## 8. 後續擴展

後續版本可以加入：

- Prompt regression dashboard。
- Per-agent A/B tests。
- Provider comparison。
- Subject-specific rubric。
- Human expert review queue。
- Synthetic fault injection，用於測試 reviewer 是否能抓錯。
