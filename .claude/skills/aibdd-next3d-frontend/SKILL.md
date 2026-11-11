---
name: aibdd-next3d-frontend
description: >
  Discovery 之後的前端實作主流程（Phase 05-08）：把 aibdd-discovery / clarify loop 確認過的規格
  （activities、features、erm.dbml、execution-plan、design tokens）落地成 React + Next.js 靜態網站，
  含 3D（React Three Fiber）。統一 8 步：Spec Intake → Stack Lock → Scaffold → Design Foundation
  → Visual Direction → Spec→UI Map → Build Loop（BDD red-green-refactor）→ Visual QA & Handoff。
  只要使用者提到「初始化 Next 專案」「建前端」「做 UI／元件／頁面」「3D 地圖／3D 模型／three.js／R3F」
  「把規格做成網站」「開始實作 Phase 05」，或 discovery 完成後要進入實作，就使用這個 skill，
  即使使用者沒有明講 Next.js 或 skill 名稱。
user-invocable: true
---

## I/O

| 方向 | 內容 |
|------|------|
| Input | `specs/plan/execution-plan.md`、`specs/activities/*`、`specs/features/**/*.feature`、`specs/entity/erm.dbml`、`specs/specs/actors/*.md`、`docs/*-color-tokens.json`、`CLAUDE.md` |
| Output | 可 `next build` 靜態匯出（`out/`）的 Next.js 專案、token CSS、元件庫、資料檔、BDD 測試、`specs/plan/ui-map.md`、`specs/plan/visual-direction.md`、更新後的 `CLAUDE.md` 指令與 execution plan 狀態 |

# 角色

前端工程師 + 介面設計師。你要同時對兩件事負責：**行為跟規格一致**（每條 Rule 都有測試、都通過），以及**介面有美感**（有明確的視覺方向，不是預設樣板）。這兩件事互相支撐：規格決定「做什麼」，視覺方向決定「長什麼樣、怎麼動」。

## 承接 Discovery 的原則

Discovery 用「絕對不腦補」把需求問清楚了；實作階段沿用同一套語言，因為實作時才冒出的空白一樣不能自己編：

- 規格寫明的 → 直接實作
- 規格沒寫、但屬於純視覺／工程細節（間距、動畫曲線、元件拆分）→ 你決定，記在 `visual-direction.md` 或程式註解
- 規格沒寫、但**會改變使用者看到的內容或行為**（提示文字措辭、錯誤情境、未定義的互動）→ 標記 `GAP`，集中到 `src/content/copy.ts` 或 ui-map 的待決清單，**批次問使用者**，不要自己定案
- 發現規格互相矛盾或行不通 → 停下，回報並建議回到 `/aibdd-discovery` 更新規格，而不是在程式裡默默改行為

## References 導覽

| 檔案 | 何時載入 |
|------|---------|
| `references/stack-setup.md` | Step 2-3：版本確認、scaffold 指令、static export 設定、測試工具安裝 |
| `references/design-foundation.md` | Step 4-5：token → CSS、字體、動態、視覺方向 brief 模板、中立性與無障礙 |
| `references/r3f-patterns.md` | Step 6-7 有 3D 時：Canvas 只在 client、glTF 載入、hover/觸控、WebGL fallback、效能、可測試性 |
| `references/spec-to-ui.md` | Step 6-7：Activity/Feature → route/元件/測試的對應方法，含 Votactics 範例 |

## Scripts

| 腳本 | 用途 |
|------|------|
| `scripts/tokens-to-css.mjs <tokens.json> <out.css>` | 把 W3C DTCG token 的 `semantic.light/dark` 解析成 CSS 變數（light 預設、dark 走 `prefers-color-scheme` + `data-theme`），並輸出 Tailwind v4 `@theme inline` 對應 |
| `scripts/check-contrast.mjs <tokens.json> [pairs.json]` | 對前景/背景 token 配對做 WCAG AA 對比檢查，light 與 dark 都檢查；失敗時 exit 1 |

腳本只用 Node 內建模組，`node <skill-dir>/scripts/...` 直接跑。

---

# 連續執行與進度控管

開始時用 TodoWrite 建立下列 8 個里程碑，依序執行、一次只有一個 `in_progress`。需要使用者決定的地方（Step 2、Step 5、GAP 批次提問、Step 8 審查）是工作互動，不算中斷。Compaction 後讀 To-Do List 找第一個未完成的任務繼續。

```
TodoWrite([
  { content: "Step 1 — Spec Intake（讀規格、檢查 discovery 已收斂）", status: "pending" },
  { content: "Step 2 — Stack Lock（確認技術棧決策並記錄）",           status: "pending" },
  { content: "Step 3 — Scaffold（Next.js 靜態匯出專案初始化）",        status: "pending" },
  { content: "Step 4 — Design Foundation（token CSS、字體、基礎元件）", status: "pending" },
  { content: "Step 5 — Visual Direction（視覺方向 brief，使用者選定）", status: "pending" },
  { content: "Step 6 — Spec→UI Map（規格對應 route/元件/測試）",       status: "pending" },
  { content: "Step 7 — Build Loop（逐 feature red-green-refactor）",   status: "pending" },
  { content: "Step 8 — Visual QA & Handoff（截圖審查、build、文件）",  status: "pending" },
])
```

每次回應末尾附一行狀態：

```
> Phase 05-08: Frontend（Step N/8 — <任務名>）— <目前 feature / 待決 GAP 數>
```

---

## Step 1: Spec Intake

目的：確認規格夠穩定可以開工，並把規格讀進腦中。

1. 讀 `CLAUDE.md`、`specs/plan/execution-plan.md`、所有 activity、feature、`erm.dbml`、actors、design tokens。
2. **收斂檢查**：Grep `CiC\(` 於 `specs/activities` 與 `specs/features`。有未解便條紙 → 告訴使用者規格尚未收斂，建議先回 `/aibdd-discovery` Step 6；使用者堅持開工則把那些區域標為「暫緩」，不實作。
3. 列出 execution plan 裡的「未決小項」「實作前需準備的素材」，分成：
   - **阻擋實作**（例如沒有它就無法定義行為）→ Step 2 一起問
   - **不阻擋**（例如素材晚點才給）→ 用佔位實作，記到 ui-map 待決清單
4. 產出一段簡短摘要給使用者：頁面數、feature 數、Rule 數、3D 需求、缺的素材。

## Step 2: Stack Lock

使用者已決定 React + Next.js + 3D。剩下的細項用**有推薦預設**的方式一次確認（AskUserQuestion，最多 4 題），不要逐項開放式提問。推薦預設與理由見 `references/stack-setup.md`，摘要：

| 決策 | 推薦預設 |
|------|---------|
| Router / 輸出 | App Router + `output: 'export'`（純靜態，可放任何靜態主機） |
| 語言 | TypeScript strict |
| 3D | `three` + `@react-three/fiber` + `@react-three/drei` |
| 樣式 | Tailwind CSS v4，顏色只走 token CSS 變數 |
| 動態 | `motion`（Framer Motion 的新套件名），支援 reduced motion |
| 測試 | Vitest + Testing Library（元件/資料邏輯）、Playwright + `playwright-bdd`（直接跑 `specs/features/*.feature`） |
| 套件管理 | npm |

已在 execution plan / CLAUDE.md 記錄過的決策直接沿用，不重問。確認後寫入 `specs/plan/tech-stack.md`（決策 + 理由 + 版本），並在 execution plan 進度註記中更新「技術棧已決定」。

## Step 3: Scaffold

照 `references/stack-setup.md` 執行。重點：

- **先查版本再下指令**：`npm view next version`、`npx create-next-app@latest --help`。CLI 旗標會隨版本變，不要憑記憶硬打。
- repo 根目錄已有 `docs/`、`specs/`、`CLAUDE.md`、`README.md`，`create-next-app` 會拒絕非空目錄。做法：scaffold 到 scratchpad 暫存目錄，再把產物搬進 repo 根目錄；**遇到同名檔（README.md、.gitignore）合併，不覆蓋**。
- 設定 `next.config.ts`：`output: 'export'`、`images.unoptimized: true`、`trailingSlash: true`。
- 安裝 3D、動態、測試套件；建立 `npm run` 指令：`dev`、`build`、`lint`、`typecheck`、`test`（Vitest）、`test:e2e`（bddgen + playwright）、`tokens`。
- 驗證：`npm run build` 成功產出 `out/`，`npm run lint`、`npm run typecheck` 通過。失敗就修到過，再進下一步。
- 把指令寫進 `CLAUDE.md`（CLAUDE.md 寫著「選定技術棧後在此加入 build/lint/test 指令」）。
- 建議在此時做一次 commit（先問使用者；若在 main，先開分支）。

## Step 4: Design Foundation

照 `references/design-foundation.md`。這一步建立「之後所有元件只能用它」的地基：

1. `node <skill>/scripts/tokens-to-css.mjs docs/civic-teal-color-tokens.json src/styles/tokens.css`，在 `globals.css` 匯入；加 `npm run tokens` 讓 token 更新後可重生。
2. `node <skill>/scripts/check-contrast.mjs docs/civic-teal-color-tokens.json`，處理任何 FAIL（優先換成另一個 semantic token，而不是寫死 hex）。
3. 字體：`next/font` 載入中文字體（見 reference 的 CJK 注意事項），設定 `lang="zh-Hant-TW"`。
4. 基礎元件（`src/components/ui/`）：只做規格真的會用到的 primitive，例如 Button、IconButton、SegmentedControl、Dialog（focus trap、`aria-modal`）、Card、Placeholder（中性剪影）、Notice（提示訊息）。每個元件只引用 semantic token。
5. 建一個 `/dev/ui` 預覽頁（只在 dev 顯示）列出所有 primitive 的 light/dark 狀態，方便 Step 5 與 Step 8 審查。

## Step 5: Visual Direction

美感要在寫畫面前就說清楚，否則會收斂到「預設 Tailwind 樣子」。用 `references/design-foundation.md` 的 brief 模板：

1. 讀 execution plan 裡的視覺參考（例如 URL）。能開就開來看（WebFetch 或瀏覽器工具），擷取它的**感覺**（構圖、節奏、材質、動態），不是複製它的品牌或素材。
2. 提出 **2-3 個方向**，每個包含：一句話定位、版面構圖、字體搭配、色彩使用比例（在 token 範圍內）、3D 場景語言（相機、光線、材質、hover 回饋）、動態原則、一張 ASCII 版面草圖。用 AskUserQuestion 的 preview 呈現讓使用者選。
3. 選定後寫入 `specs/plan/visual-direction.md`，之後所有畫面決策都回頭對照它。
4. 不論哪個方向，下列底線不變：不讓顏色暗示政黨、政黨只用文字標示、status 色只表示 UI 狀態、對比通過 WCAG AA、尊重 `prefers-reduced-motion`。

## Step 6: Spec→UI Map

照 `references/spec-to-ui.md`，產出 `specs/plan/ui-map.md`：

- **Activity STEP → 畫面狀態**：每個 `[STEP:n]` 對應哪個 route、哪個 UI 狀態（例如 `?type=council&district=council-3`）、哪個元件負責。狀態盡量放 URL，這樣返回鍵、分享連結、測試都自然成立。
- **Feature Rule → 元件 + 測試層級**：每條 Rule 寫明由哪個元件實現、用哪層測試驗證（e2e BDD / 元件測試 / 資料單元測試）。
- **Entity → 資料檔**：`erm.dbml` 的每個 table 對應 `src/data/*.json` 與 TS 型別；資料由腳本從來源（例如 xlsx）產生，不手打。
- **元件樹**：page → section → composite → primitive，標出哪些是 client component（3D、互動）。
- **GAP 清單**：所有實作時發現的未定項目，批次問一次（AskUserQuestion），答案回寫到 ui-map；影響行為的答案同時回寫 feature 檔並告知使用者。

給使用者看 ui-map 摘要後進入 Step 7。

## Step 7: Build Loop

以 feature 為單位做 red-green-refactor，順序依 activity 的主流程（先能看到首頁，再往下點）。每個 feature：

1. **Red**：移除該 feature 的 `@ignore`（或在 playwright-bdd 設定以 tag 篩選），`npx bddgen` 產生測試，寫 step definitions，跑 `npm run test:e2e` 確認失敗原因是「功能還沒做」而不是測試寫錯。
2. **Green**：依 ui-map 實作元件與資料讀取，直到該 feature 全部 Example 通過。3D 部分照 `references/r3f-patterns.md`，特別是可測試性掛鉤（不要讓 e2e 去猜 canvas 像素）。
3. **Refactor + 美感 pass**：測試綠了之後，對照 `visual-direction.md` 做一輪視覺打磨——間距節奏、層次、過場動畫、hover/focus 回饋、空狀態與佔位的質感。打磨不能改行為；測試必須維持綠燈。
4. 跑 `npm run lint && npm run typecheck && npm test && npm run test:e2e`，全綠才算該 feature 完成。
5. 用一句話回報該 feature 完成狀態與新發現的 GAP，然後下一個 feature。

不屬於任何 Rule 的「好像應該有」的功能（搜尋、分享按鈕、篩選）不要做；可以在 Step 8 列成建議。

## Step 8: Visual QA & Handoff

1. `npm run build` → 以靜態伺服器跑 `out/`（例如 `npx serve out`），確認 static export 下一切正常（直接開深層連結、重新整理、返回鍵）。
2. Playwright 截圖：桌機 1440×900、手機 390×844，light 與 dark，主流程每個狀態一張，存 scratchpad。自己先看一遍挑出明顯問題（溢出、對比、裁切、3D 沒出現）並修掉。
3. 檢查清單：鍵盤可操作（Tab 順序、Dialog 焦點）、`prefers-reduced-motion`、WebGL 關閉時的提示、無橫向捲動、3D 首次載入時間與 bundle 大小（`next build` 輸出）。
4. 把截圖與檢查結果整理給使用者審查（適合時發布成 Artifact 頁面讓使用者瀏覽），收集回饋 → 回到 Step 7 修正 → 再審，直到使用者滿意。
5. 收尾：更新 `CLAUDE.md`（指令、目錄結構、資料產生方式）、execution plan 的 Phase 05-08 狀態、ui-map 的待決清單；問使用者是否 commit / 開 PR。

---

# 完成條件

- `npm run build` 產出可運作的 `out/`；lint、typecheck、單元測試、BDD e2e 全綠
- 每個 feature 的每條 Rule 都有對應測試且通過，`@ignore` 已移除
- 元件中沒有寫死的 hex 色碼（Grep `#[0-9A-Fa-f]{6}` 於 `src/components`、`src/app` 應只出現在 3D 材質且有註解說明來源 token），對比檢查無 FAIL
- `visual-direction.md`、`ui-map.md`、`tech-stack.md` 存在且與實作一致
- GAP 清單全部有答案，或明確標記為使用者同意延後
- 使用者已審查過截圖並同意
