# React Three Fiber Patterns（Step 6-7）

## 目錄
1. Canvas 只在 client
2. glTF 載入與命名物件對應
3. Hover / Click / 觸控
4. 讀 token 色給材質
5. WebGL 不支援與載入失敗
6. 效能預算
7. 可測試性掛鉤
8. 候選人 3D 模型與佔位

---

## 1. Canvas 只在 client

Static export 會在 build 時 prerender 頁面，three.js 需要 `window`/WebGL，所以場景元件要跳過 SSR：

```tsx
// src/components/scene/MapScene.client.tsx
"use client";
import dynamic from "next/dynamic";
export const MapScene = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => <MapSkeleton />,   // 跟最終畫面同尺寸，避免版面跳動
});
```

`page.tsx` 保持 server component，讀 JSON 資料後以 props 傳給 client 元件。

## 2. glTF 載入與命名物件對應

```tsx
import { useGLTF } from "@react-three/drei";
const { nodes } = useGLTF("/models/taipei.glb");
// 依 erm.dbml 的 district_map_object.object_name 對應：
const meshes = districtMapObjects.map(o => ({ districtId: o.district_id, mesh: nodes[o.object_name] as THREE.Mesh }));
useGLTF.preload("/models/taipei.glb");
```

- 找不到某個 object_name 時在 dev console 警告並列出模型內實際的節點名稱——模型與資料不同步是最常見的錯誤。
- 模型壓縮：`npx gltf-transform optimize in.glb out.glb --compress meshopt`（或 draco），drei 的 `useGLTF` 支援解壓。
- 素材還沒到時，用簡單幾何（擠出的平面方塊）當 placeholder 模型，讓互動與測試先能做，素材到了換檔即可。

## 3. Hover / Click / 觸控

```tsx
<mesh
  onPointerOver={(e) => { e.stopPropagation(); if (canHover) setHovered(id); }}
  onPointerOut={() => canHover && setHovered(null)}
  onClick={(e) => { e.stopPropagation(); onSelect(id); }}
/>
```

- `canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches`；觸控裝置不做 hover 預覽，點一下直接選。
- hover 時 `document.body.style.cursor = "pointer"`，離開時還原。
- 亮起效果優先用 `emissive` / `emissiveIntensity` 或輕微抬升（`position.y`），用 `useFrame` 內 lerp 做平滑；不要每次 hover 重建材質（每個 mesh clone 一次材質後只改參數）。
- 拖曳旋轉（OrbitControls）與點擊衝突時，用 `onClick` 的 `e.delta`（移動距離）> 閾值就忽略點擊。
- 限制相機（`minPolarAngle`、`maxDistance`），避免使用者把地圖轉到看不見。

## 4. 讀 token 色給材質

```ts
function cssColor(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
const highlight = new THREE.Color(cssColor("--color-interaction-selected"));
```

監聽 `prefers-color-scheme` 變化與 `data-theme` 變更（MutationObserver），主題切換時更新材質色。three.js 預設 sRGB 輸出，token hex 直接用 `new THREE.Color(hex)` 即可。

## 5. WebGL 不支援與載入失敗

兩種情況都要處理：
- 進場前偵測：`!!document.createElement("canvas").getContext("webgl2") || ...getContext("webgl")`，不支援就不 mount Canvas，直接顯示提示。
- 載入失敗：Canvas 外包 ErrorBoundary（`useGLTF` 失敗會 throw），fallback 顯示同一個提示元件。

提示文字來自 `src/content/copy.ts`；規格未定措辭時標 `GAP` 並使用明顯的暫定文案。

## 6. 效能預算

| 項目 | 目標 |
|------|------|
| 地圖 glb（壓縮後） | ≤ 2 MB |
| 每位候選人模型 | ≤ 1.5 MB，進入詳情頁才載入 |
| `dpr` | `[1, 2]`，低階裝置用 drei `PerformanceMonitor` 降到 1 |
| `frameloop` | 靜態場景用 `"demand"`，hover/動畫時 `invalidate()` |
| 首頁 JS | 3D 相關以 dynamic import 拆分，不進首屏 server HTML |

後處理（bloom 等）只在 visual direction 明確要求且手機測過才加。

## 7. 可測試性掛鉤

e2e 不該靠像素座標點 canvas。提供兩種掛鉤：

1. **狀態外顯在 DOM**：hover/選取狀態同步寫到容器的 `data-hovered-district`、`data-election-type`，並在 URL 反映選取（`?district=council-3`）。測試斷言讀這些屬性。
2. **測試 API**（只在 `process.env.NEXT_PUBLIC_E2E === "1"` 時掛上）：

```ts
window.__map = {
  districts: () => meshes.map(m => m.districtId),
  hover: (id: string) => setHovered(id),
  click: (id: string) => onSelect(id),
  screenPoint: (id: string) => /* 把 mesh 中心投影成螢幕座標，給真實滑鼠事件測試用 */,
};
```

至少一個 e2e 用 `screenPoint` + `page.mouse.move/click` 走真實事件路徑，確保 raycasting 真的有效；其他 Example 用 API 加速。觸控規則在 Playwright 的 `hasTouch` project 用 `page.touchscreen.tap`。

## 8. 候選人 3D 模型與佔位

- 詳情頁左側 Canvas：drei `<Bounds fit clip observe>` 自動把不同尺寸模型框好；`<Environment preset=...>` 或簡單三點光。
- 無模型（`model_3d` 為空）時顯示中性剪影：可以是 2D SVG 或一個中性幾何人形，所有候選人共用同一個，顏色用 neutral/slate token，不帶任何政黨暗示。
- 同一頁不要同時存在兩個 Canvas（地圖 + 候選人）；從卡夾進詳情頁時卸載地圖或使用 drei `View` 共用一個 Canvas。
