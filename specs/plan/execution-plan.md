# Execution Plan

> **進度（2026-11-10 暫停）**：Phase 01 Discovery、Phase 02 Entity Modeling、Phase 03 BDD Analysis 已完成；Phase 04 不適用（靜態網站）。
> 下一步 Phase 05-08 實作，**待使用者決定技術棧**（框架、3D 函式庫、feature 測試工具）。
> 未決小項：Esc 鍵目前規格為「不關閉卡夾」（Q7 未選），待使用者確認是否保留；feature 檔尚未經 Gherkin 解析器驗證。

Phase 01 Discovery（Greenfield）產出。範圍：2026 臺北市長（全市選區，6 人）與臺北市議員（第 1～8 選舉區，98 人）候選人資訊平台。

## 關鍵決策（Clarify Loop）

| # | 決策 |
|---|------|
| Q1 | 範圍包含市長與市議員；地圖選區對應市議員選舉區 |
| Q2/Q4 | 上方「市長｜市議員」切換，首頁預設市長；市長模式下地圖不分區，hover 整市亮起、點擊開啟市長卡夾 |
| Q3 | 首頁即分區頁 |
| Q5 | 靜態網站：大頭照、3D 模型、政見由專案擁有者以檔案放入 repo 後重新部署；無後台、無內容維護者 |
| Q6/Q7 | 全螢幕頁返回 → 回原卡夾；卡夾以 × 或點擊遮罩關閉 → 回地圖 |
| Q8/Q9 | 地圖以選舉區分塊，不顯示行政區界線；第 1～6 區邊界依中選會公告製作（實作時查證）；第 7、8 區在地圖旁另外顯示 |
| Q10/Q11 | 卡片只列政見標題；依來源順序排列，公告抽籤號次後改依號次 |
| Q12/Q15 | 缺大頭照／3D 模型用中性剪影佔位，缺政見或空選區顯示提示文字 |
| Q13/Q14 | 觸控裝置點一下直接開卡夾；WebGL 不支援時只顯示提示 |

## 概覽

| 類型 | 數量 |
|------|------|
| Create | 3 features + 1 activity + 1 actor（Phase 01 已完成）；後續 Phase 皆為 create |
| Modify | 0 |
| Delete | 0 |

## Phase 02: Entity Modeling

靜態資料模型（JSON 或等價格式），來源為 `docs/2026_臺北市_市長與市議員候選人登記資料.xlsx` 加上專案擁有者提供的素材。

| 操作 | 目標 | 說明 |
|------|------|------|
| create | 選舉類別 | 市長、市議員 |
| create | 選區 | 臺北市（市長）；臺北市第 1～8 選舉區（市議員）；是否畫在地圖上（第 7、8 區否） |
| create | 候選人 | 姓名、推薦之政黨（無黨籍為「無」）、所屬選區、來源順序、抽籤號次（尚未公告，可空） |
| create | 政見 | 標題、內文；可為空 |
| create | 候選人素材 | 卡通 2D 大頭照、3D 模型；可為空（使用佔位） |
| create | 選區地圖物件 | 第 1～6 選舉區在 3D 地圖模型（glTF）中各為獨立物件，以物件名稱對應選區（邊界依中選會公告） |

**狀態：已完成**，見 `specs/entity/erm.dbml`。

## Phase 03: BDD Analysis

| 操作 | 目標 | 說明 |
|------|------|------|
| create | features/district/瀏覽選區地圖.feature | 補 Examples |
| create | features/candidate/查詢選區候選人.feature | 補 Examples |
| create | features/candidate/查詢候選人詳情.feature | 補 Examples |

**狀態：已完成**。選區、名單、排序、政黨的 Example 使用 xlsx 真實資料；牽涉政見、大頭照、3D 模型的 Example 使用虛構測試候選人。

## Phase 04: API Contract

| 操作 | 目標 | 說明 |
|------|------|------|
| n/a | — | Q5 確認為靜態網站，無後端 API。三個 @query feature 對應讀取靜態資料檔，資料檔結構由 Phase 02 定義 |

## Phase 05-08: Implementation

| 操作 | 目標 | 說明 |
|------|------|------|
| red-green-refactor | features/**/*.feature | 三個 feature 的 TDD |

## 實作前需準備的資料與素材

- 台北市 3D 地圖模型（glTF）：第 1～6 選舉區各切成獨立物件，邊界依中選會公告的選舉區劃分並查證
- 候選人卡通 2D 大頭照、3D 模型、政見（標題＋內文）：由專案擁有者提供
- 提示文字措辭（缺政見、空選區、WebGL 不支援）：尚未指定
- 視覺風格參考：https://puma.taipei/heart-island
