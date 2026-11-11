#!/usr/bin/env node
// WCAG contrast check for semantic token pairs, in both light and dark themes.
// Usage: node check-contrast.mjs <tokens.json> [pairs.json]
// pairs.json: [{ "fg": "text.primary", "bg": "background.base", "min": 4.5, "note": "..." }]
// Paths are relative to semantic.<theme>. Exit code 1 if any pair fails.
import { readFileSync, existsSync } from "node:fs";

const [input, pairsFile] = process.argv.slice(2);
if (!input) {
  console.error("Usage: node check-contrast.mjs <tokens.json> [pairs.json]");
  process.exit(2);
}
const tokens = JSON.parse(readFileSync(input, "utf8"));
const lookup = (path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), tokens);

function resolve(value, depth = 0) {
  if (depth > 20) throw new Error("Reference depth exceeded");
  if (value && typeof value === "object" && "$value" in value) value = value.$value;
  if (typeof value !== "string") return undefined;
  const m = value.match(/^\{([^}]+)\}$/);
  return m ? resolve(lookup(m[1]), depth + 1) : value;
}

function parseHex(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 || h.length === 4 ? [...h].map((c) => c + c).join("") : h;
  const n = (i) => parseInt(full.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) : 1 };
}
const blend = (fg, bg) => ({
  r: fg.r * fg.a + bg.r * (1 - fg.a),
  g: fg.g * fg.a + bg.g * (1 - fg.a),
  b: fg.b * fg.a + bg.b * (1 - fg.a),
  a: 1,
});
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
function ratio(fgHex, bgHex) {
  const bg = parseHex(bgHex);
  const fg = blend(parseHex(fgHex), bg.a < 1 ? { ...bg, a: 1 } : bg);
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

const DEFAULT_PAIRS = [
  ["text.primary", "background.base", 4.5],
  ["text.primary", "background.canvas", 4.5],
  ["text.primary", "surface.default", 4.5],
  ["text.secondary", "surface.default", 4.5],
  ["text.secondary", "background.canvas", 4.5],
  ["text.tertiary", "surface.default", 4.5],
  ["text.muted", "surface.default", 4.5],
  ["text.link", "surface.default", 4.5],
  ["text.inverse", "background.inverse", 4.5],
  ["text.onBrand", "brand.primary", 4.5],
  ["brand.onPrimary", "brand.primary", 4.5],
  ["brand.onPrimary", "brand.primaryHover", 4.5],
  ["text.primary", "surface.hover", 4.5],
  ["text.primary", "surface.selected", 4.5],
  ["border.focus", "surface.default", 3],
  ["border.strong", "surface.default", 3],
  ...["info", "success", "warning", "error"].flatMap((s) => [
    [`status.${s}.onSolid`, `status.${s}.solid`, 4.5],
    [`status.${s}.text`, `status.${s}.subtle`, 4.5],
  ]),
].map(([fg, bg, min]) => ({ fg, bg, min }));

let pairs = DEFAULT_PAIRS;
if (pairsFile) {
  if (!existsSync(pairsFile)) {
    console.error(`pairs file not found: ${pairsFile}`);
    process.exit(2);
  }
  pairs = [...DEFAULT_PAIRS, ...JSON.parse(readFileSync(pairsFile, "utf8"))];
}

let failed = 0;
let skipped = 0;
for (const theme of Object.keys(tokens.semantic ?? {})) {
  console.log(`\n== ${theme} ==`);
  for (const { fg, bg, min = 4.5, note } of pairs) {
    const fgv = resolve(lookup(`semantic.${theme}.${fg}`));
    const bgv = resolve(lookup(`semantic.${theme}.${bg}`));
    if (!fgv || !bgv || !fgv.startsWith("#") || !bgv.startsWith("#")) {
      skipped++;
      continue;
    }
    const r = ratio(fgv, bgv);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1 (min ${min})  ${fg} ${fgv} on ${bg} ${bgv}${note ? `  — ${note}` : ""}`);
  }
}
console.log(`\n${failed} failing pair(s), ${skipped} skipped (token not found or non-hex).`);
process.exit(failed ? 1 : 0);
