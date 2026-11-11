# Spec → UI Map（Step 6-7）

## 方法

規格有三個視圖，各自對應實作的一個面向：

| 規格 | 回答的問題 | 對應到 |
|------|-----------|--------|
| Activity（`.mmd`） | 使用者依序經過哪些狀態？ | route + URL 狀態 + 轉場 |
| Feature Rule | 每個狀態下必須成立什麼？ | 元件責任 + 測試 |
| Entity（`erm.dbml`） | 資料長什麼樣？ | `src/data/*.json` + TS 型別 + 產生腳本 |

做法：
1. 把 activity 的每個 `[STEP:n]` 和 BRANCH 列成狀態表，決定每個狀態的 URL（能放 URL 的狀態就放：返回鍵、重新整理、分享、e2e 都免費成立）。
2. 把每條 Rule 指派給**一個**負責元件，並決定測試層級：
   - 使用者可見的流程（點、看到、返回）→ e2e BDD（feature Example 本身）
   - 純資料規則（排序、空值、對應）→ 也有 e2e，另加 Vitest 單元測試讓失敗時更好定位
   - 純視覺（佔滿視窗、左右配置）→ e2e 斷言可量測的屬性（bounding box、可見性），不要做像素比對
3. 每個 entity 寫型別與產生方式。資料一律由腳本從來源產生，腳本可重跑。
4. 列出元件樹與 client/server 邊界。
5. 列出 GAP。

## `ui-map.md` 模板

```markdown
# UI Map

## 狀態表（Activity → Route）
| STEP | 狀態 | URL | 負責元件 | 轉場 |
|------|------|-----|---------|------|

## Rule 責任表（Feature → 元件 → 測試）
| Feature | Rule | 元件 | 測試層級 | 備註 |
|---------|------|------|---------|------|

## 資料（Entity → 檔案）
| Entity | 檔案 | 型別 | 來源 / 產生方式 |
|--------|------|------|----------------|

## 元件樹

## 待決（GAP）
| # | 位置 | 問題 | 暫定做法 | 狀態 |
|---|------|------|---------|------|
```

## Votactics 範例（依目前 specs/ 推導，實作前以最新規格為準）

### 狀態表

| STEP | 狀態 | URL | 負責元件 |
|------|------|-----|---------|
| 1 | 首頁、3D 地圖、預設市長 | `/` | `HomePage` → `MapStage` |
| 2 | 切換類別 | `/?type=council` | `ElectionTypeSwitch`（SegmentedControl） |
| 3 / 3' | hover 亮起 | 無 URL 變化，`data-hovered-district` | `TaipeiMap`（scene） |
| 4 / 4' | 卡夾開啟 | `/?type=council&district=council-3`；市長 `/?district=taipei` | `DistrictBinder`（Dialog） |
| 5 | 候選人全螢幕頁 | `/candidates/<id>/?from=council-3` | `CandidateDetail` |
| 6 | 返回原卡夾 | 回到 `/?type=council&district=council-3` | `BackButton`（讀 `from`，無 `from` 時回首頁） |
| 7 | 關閉卡夾 | 移除 `district` 參數 | `DistrictBinder` 的 × / 遮罩 |

`?type` 預設 mayor 時可省略。`useSearchParams` 要包 Suspense。

### Rule 責任表（節錄）

| Feature | Rule | 元件 | 測試 |
|---------|------|------|------|
| 瀏覽選區地圖 | 預設市長 | `ElectionTypeSwitch` | e2e |
| 瀏覽選區地圖 | 市議員時 1-6 區在地圖 | `TaipeiMap` | e2e（`__map.districts()`） |
| 瀏覽選區地圖 | 7、8 區在地圖旁 | `OffMapDistricts` | e2e |
| 瀏覽選區地圖 | 觸控點一下直接開卡夾 | `TaipeiMap` | e2e（mobile project） |
| 瀏覽選區地圖 | WebGL 失敗只顯示提示 | `MapStage` + ErrorBoundary | e2e（以 init script 讓 getContext 回 null） |
| 查詢選區候選人 | 依來源順序 / 號次排序 | `lib/sortCandidates` | Vitest + e2e |
| 查詢選區候選人 | Esc 不關閉 | `DistrictBinder` | e2e（注意：一般 Dialog 預設 Esc 會關，要刻意覆寫） |
| 查詢候選人詳情 | 返回原卡夾 | `BackButton` | e2e |

### 資料

| Entity | 檔案 | 來源 |
|--------|------|------|
| district | `src/data/districts.json` | 規格的 9 個選區（Background 表）+ xlsx 選舉區 |
| district_map_object | `src/data/district-map-objects.json` | 對應 glb 內物件名稱，模型到位後確認 |
| candidate | `src/data/candidates.json` | xlsx「臺北市全部候選人」；`source_order` 依列順序；`avatar_2d`/`model_3d` 依 `public/` 檔案是否存在 |
| policy | `src/data/policies.json` 或 `content/policies/<candidate-id>.md` | 專案擁有者提供；不存在即為空 |

測試用的虛構候選人（測試候選人甲／乙、測試選區、測試黨）只放在 e2e fixture，**不能**出現在正式資料檔。e2e 用 `NEXT_PUBLIC_E2E` 或獨立的 fixture data 目錄注入，並在 ui-map 寫清楚注入方式。

### 已知 GAP（規格標註「措辭未指定」）

- 缺政見、空選區、WebGL 失敗的提示文字
- 鍵盤／螢幕閱讀器如何選選區（規格未提）
- 卡夾在手機上的版型（全螢幕 sheet 或置中卡片）——屬視覺決策，可在 Step 5 一併決定
