# Stack Setup（Step 2-3）

## 目錄
1. 推薦預設與理由
2. 版本確認
3. Scaffold 到非空 repo
4. Static export 設定
5. 套件安裝
6. 測試設定（Vitest + playwright-bdd）
7. npm scripts
8. 目錄結構

---

## 1. 推薦預設與理由

| 決策 | 預設 | 為什麼 | 何時換 |
|------|------|--------|--------|
| 輸出 | `output: 'export'` | 規格確認為靜態網站、無後台；靜態檔可放 GitHub Pages / Cloudflare Pages / Vercel | 規格出現需要伺服器的行為（表單送出、登入）→ 回 discovery |
| Router | App Router | Next 現行主線；`generateStaticParams` 可把每位候選人頁面預先產出 | — |
| 3D | three + @react-three/fiber + @react-three/drei | React 宣告式場景、事件系統（hover/click 對 mesh）內建、drei 有 `useGLTF`、`Bounds`、`Html` 等現成工具 | 只需要一個非互動模型 → 可考慮 `<model-viewer>`，但本專案需要選區互動 |
| 樣式 | Tailwind v4 + token CSS 變數 | v4 的 `@theme inline` 可直接吃 CSS 變數，元件寫 `bg-surface-default` 之類 class 而不碰 hex | 團隊偏好 CSS Modules 也可，token CSS 照用 |
| 動態 | `motion` | Dialog / 卡夾 / 頁面轉場的 layout 動畫、`useReducedMotion` | — |
| 單元/元件測試 | Vitest + @testing-library/react + jsdom | 快；資料轉換與排序規則（例如號次排序）在這層測最划算 | — |
| e2e / BDD | Playwright + playwright-bdd | 直接執行 discovery 產出的 `.feature`，規格就是測試；Chromium headless 有 WebGL（SwiftShader） | — |

## 2. 版本確認

不要憑記憶下版本或旗標，先查：

```bash
node -v && npm -v
npm view next version
npm view @react-three/fiber version peerDependencies
npm view @react-three/drei version peerDependencies
npx create-next-app@latest --help
```

注意 R3F 主版本與 React 主版本要對齊（R3F v9 ↔ React 19）。若 peerDependencies 不相容，選相容組合並記錄在 `tech-stack.md`。

## 3. Scaffold 到非空 repo

`create-next-app` 只接受幾乎是空的目錄。repo 已有 `docs/ specs/ CLAUDE.md README.md .claude/ .vscode/`，所以：

```bash
TMP="<scratchpad>/next-scaffold"
npx create-next-app@latest "$TMP" --ts --eslint --app --src-dir --tailwind \
  --import-alias "@/*" --use-npm --yes   # 旗標以 --help 輸出為準
```

搬移規則：
- 移入 repo 根目錄：`package.json`、`package-lock.json`、`tsconfig.json`、`next.config.*`、`eslint.config.*`、`postcss.config.*`、`next-env.d.ts`、`src/`、`public/`
- **合併**：`.gitignore`（保留 repo 原有條目，加上 Next 的）、`README.md`（保留原內容，追加開發指令段落）
- 不搬：`node_modules/`（在 repo 內重新 `npm install`）、scaffold 自帶的 `.git`
- 搬完在 repo 根目錄 `npm install`，然後 `npm run build` 驗證

## 4. Static export 設定

```ts
// next.config.ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },  // static export 沒有 image optimizer
  trailingSlash: true,            // 靜態主機對 /path/ 比較友善
  // 部署在子路徑（例如 GitHub Pages /repo）時再加 basePath
};
export default nextConfig;
```

Static export 的限制，寫元件時要記得：
- 動態 route（`/candidates/[id]`）必須有 `generateStaticParams`，資料來自 build 時的 JSON
- 不能用 Server Actions、`cookies()`、`headers()`、route handlers 的動態行為
- `useSearchParams()` 的 client component 要包在 `<Suspense>` 裡，否則 build 會失敗
- `.glb`、圖片放 `public/`，路徑用 `/models/...`；有 basePath 時要一起加前綴

## 5. 套件安裝

```bash
npm i three @react-three/fiber @react-three/drei motion
npm i -D @types/three
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
npm i -D @playwright/test playwright-bdd serve
npx playwright install chromium
```

資料轉換（xlsx → JSON）如需 Node 端解析：`npm i -D exceljs`（或用 Python openpyxl）。本專案 xlsx 用 inline strings、`sharedStrings.xml` 為空，選的解析器要能讀 inline string；西元日期欄是 Excel serial number，要轉換。

## 6. 測試設定

`vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], include: ["src/**/*.test.{ts,tsx}"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

`playwright.config.ts`（以 playwright-bdd 當前文件的 API 為準，先 `npm view playwright-bdd version` 並看 README）：

```ts
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "specs/features/**/*.feature",
  steps: "e2e/steps/**/*.ts",
  tags: "not @ignore",          // 尚未實作的 feature 保留 @ignore 即被略過
});

export default defineConfig({
  testDir,
  webServer: { command: "npm run build && npx serve out -l 4173", url: "http://localhost:4173", reuseExistingServer: true, timeout: 180_000 },
  use: { baseURL: "http://localhost:4173", locale: "zh-TW" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },   // 觸控裝置規則（hasTouch）
  ],
});
```

測靜態 build（`out/`）而不是 dev server，這樣 static export 的問題會在測試中暴露。開發時可暫時改成 `npm run dev` 加速。

`.vscode/settings.json` 已設定 `gherkin-behave.featuresPath: specs/features`，feature 路徑不要搬動。

## 7. npm scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "serve out",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "bddgen && playwright test",
  "tokens": "node .claude/skills/aibdd-next3d-frontend/scripts/tokens-to-css.mjs docs/civic-teal-color-tokens.json src/styles/tokens.css",
  "data": "node scripts/build-data.mjs"
}
```

## 8. 目錄結構

```
src/
├── app/                     # routes（page.tsx 盡量是 server component，負責讀資料）
│   ├── layout.tsx           # 字體、lang、theme
│   ├── page.tsx             # 首頁
│   └── candidates/[id]/page.tsx
├── components/
│   ├── ui/                  # primitives，只用 token
│   ├── scene/               # 3D（全部 "use client"）
│   └── <domain>/            # 組合元件（district/、candidate/）
├── content/copy.ts          # 所有使用者看得到的文案；GAP 在這裡集中標記
├── data/                    # build-data 產生的 JSON（不手改）
├── lib/                     # 資料讀取、排序、型別
└── styles/tokens.css        # 由 tokens-to-css 產生
public/models/  public/avatars/
scripts/build-data.mjs        # 來源資料 → src/data
e2e/steps/                    # playwright-bdd step definitions
```
