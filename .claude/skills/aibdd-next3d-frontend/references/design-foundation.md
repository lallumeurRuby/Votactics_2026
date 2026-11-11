# Design Foundation & Visual Direction（Step 4-5）

## 目錄
1. Token → CSS → Tailwind
2. 對比檢查
3. 中文字體
4. 動態原則
5. Visual Direction brief 模板
6. 中立性底線（選舉資訊網站特有）
7. 無障礙底線

---

## 1. Token → CSS → Tailwind

`scripts/tokens-to-css.mjs` 產生三段：

```css
:root { --color-brand-primary: #137C83; ... }                         /* semantic.light，預設 */
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ...dark } }
:root[data-theme="dark"] { ...dark }                                   /* 手動切換 */
@theme inline { --color-brand-primary: var(--color-brand-primary); ... }   /* Tailwind v4 */
```

變數命名：semantic 路徑用 `-` 串接、camelCase 轉 kebab，例如 `semantic.light.status.info.onSolid` → `--color-status-info-on-solid`，Tailwind class 即 `bg-status-info-solid`、`text-text-primary`。

規則：
- 元件只用 semantic token。palette 只在 token 檔內被引用，不進元件。
- 需要新角色（例如「3D 地圖選區亮起色」）時，先在 ui-map 記錄，從現有 semantic token 挑（如 `brand.accent`、`interaction.selected`）；真的沒有才提議在 token 檔新增 semantic 角色，並告知使用者。
- three.js 材質讀不到 CSS 變數：在 client 端用 `getComputedStyle(document.documentElement).getPropertyValue("--color-...")` 取值，主題切換時更新（見 r3f-patterns.md）。

## 2. 對比檢查

`node scripts/check-contrast.mjs <tokens.json> [pairs.json]`。沒有 pairs.json 時使用內建的常見配對（text/* on background/*、onPrimary on brand.primary、status onSolid/text 等）。專案出現新的實際配對（例如卡片上的政黨標籤）就加進 `specs/plan/contrast-pairs.json`：

```json
[{ "fg": "text.secondary", "bg": "card.background", "min": 4.5, "note": "卡片政黨文字" }]
```

`min`：內文 4.5、大字（≥24px 或 ≥18.66px 粗體）3、必要圖形與 focus ring 3。

## 3. 中文字體

- 用 `next/font/google` 自架字體（不會連外部 CDN），例如 `Noto_Sans_TC`。CJK 字體沒有 `subsets` 可選，設 `preload: false`，並明確指定需要的 `weight`（例如 400/500/700），避免載入整個家族。
- 標題可配一個有個性的字體（例如 Noto Serif TC 或 LXGW WenKai TC），但內文保持無襯線、行高 1.6-1.8、`text-wrap: pretty`。
- 中文不要用 `letter-spacing` 負值；標題可微加 0.02-0.05em。
- 姓名含原住民族語名（如「孔垂崢 Haisul Islituan」）時，卡片要允許換行，不可截斷。

## 4. 動態原則

- 動態是為了**交代空間關係**：卡夾從被點的選區方向展開、詳情頁從卡片放大進入、返回時反向。不是裝飾。
- 時長：微互動 120-180ms，Dialog/卡夾 240-320ms，頁面轉場 ≤ 400ms；ease-out 進場、ease-in 出場。
- `useReducedMotion()` 為真時：關閉位移/縮放，只留淡入；3D 相機不做自動旋轉。
- 3D hover 亮起要即時（≤ 100ms），否則像延遲。

## 5. Visual Direction brief 模板

每個方向都填這張表，然後附一張 ASCII 草圖（放在 AskUserQuestion 的 preview）：

```markdown
### 方向 A：<名字>
- 一句話：<這個網站給人的感覺>
- 構圖：<3D 地圖佔比、位置；切換器、側欄、卡夾的位置>
- 字體：<標題 / 內文>
- 色彩比例：<例：canvas 70% / surface 20% / brand 8% / accent 2%>，只用 semantic token
- 3D 場景語言：<相機角度、光（環境光/方向光/HDR）、材質（霧面/陶土/低多邊形）、選區亮起方式（emissive/抬升/描邊）>
- 卡夾語言：<遊戲卡夾的哪個特質：卡牌比例、翻面、堆疊、收藏感>
- 動態：<進出場、hover 回饋>
- 風險：<效能、可讀性、與中立性的衝突>
```

提出方向時，讓它們**真的不同**（例如「明亮紙模型」vs「夜間資訊儀表」vs「溫暖插畫島嶼」），而不是同一個設計換顏色。參考網站只取感覺，不複製其品牌、插畫或程式。

選定後寫進 `specs/plan/visual-direction.md`，並補上「Do / Don't」各 3-5 條，作為 Step 7 美感 pass 的檢查表。

## 6. 中立性底線

CLAUDE.md 的政治中立是硬性要求，任何視覺方向都不能違反：
- brand、status、chart 色不可對應政黨；政黨只以文字標籤（或官方標誌，若使用者提供）呈現。
- 選區亮起色在所有選區一致，不能因該區候選人政黨不同而不同。
- 卡片排序只依規格（來源順序 / 號次），不依政黨。
- `warning`、`error` 只表示 UI 狀態，不用來標示候選人或政見。
- 資料標示為「登記資料（截至 2026-09-07），非最終公告名單、無號次、無結果」。

## 7. 無障礙底線

- `<html lang="zh-Hant-TW">`；Dialog 用 `role="dialog" aria-modal="true"`、開啟時焦點移入、關閉時回到觸發元素。
- 所有互動元素有可見 focus ring（`border.focus` token）。
- 3D canvas 不是唯一入口時才算可及；若規格不提供替代瀏覽方式（例如 WebGL 失敗只顯示提示），把「螢幕閱讀器/鍵盤使用者如何選選區」列為 GAP 問使用者，不要自行加功能或忽略。
- 觸控目標 ≥ 44×44px；手機寬度無橫向捲動。
