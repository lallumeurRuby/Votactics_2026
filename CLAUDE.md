# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Votactics_2026 is a candidate and policy-platform site for Taiwan's 2026 local elections (九合一選舉, 中華民國地方公職人員選舉). The content and data are in Traditional Chinese (zh-TW).

So far the repo has no application code, build tooling or tests. It only holds reference material in `docs/`. When a stack is chosen, add its build, lint and test commands here.

## Reference material (`docs/`)

### `civic-teal-color-tokens.json`: the design system
- Uses the W3C Design Tokens Community Group format. It contains:
  - `palette.*`: raw color scales (teal, slate, green, blue, amber, red, neutral).
  - `semantic.light` and `semantic.dark`: role tokens (brand, background, surface, text, border, status, button, input, navigation, card, table, chart). Their values point into the palette with `{palette.<color>.<step>}` references.
- UI code should use semantic tokens, not raw hex values or palette steps. Light is the default theme.
- `legacyCivicTealAnchors` is an older flat palette. Keep it only for compatibility.

### `2026_臺北市_市長與市議員候選人登記資料.xlsx`: Taipei candidate registration data
- Sheets:
  - `資料說明與統計`: provenance and summary statistics.
  - `臺北市長候選人`: mayoral candidates.
  - `臺北市議員候選人`: city council candidates.
  - `臺北市全部候選人`: all candidates combined.
- Candidate sheet columns: `選舉類別, 選舉區, 候選人姓名, 推薦之政黨, 登記日期（民國）, 登記日期（西元）, 備註, 來源 PDF 頁碼`.
- `登記日期（西元）` is stored as an Excel date serial number (e.g. `46265`). `登記日期（民國）` is a ROC-calendar string (`115/08/31`; ROC year + 1911 = CE year).
- An independent candidate's party (`推薦之政黨`) is the literal string `無`.
- Strings are stored inline, so `sharedStrings.xml` is empty. Parsers that rely on shared strings will read blank cells.
- The data is a **registration summary as of 2026-09-07**. It is not the final certified candidate list, it has no ballot numbers and it has no results. The UI should label it that way.

## Political neutrality (hard requirement from the design tokens)
- Brand, status and chart colors must never imply a party. Show party affiliation only as an explicit text label or logo.
- `warning` and `error` status colors mean UI state only. Never use them as political judgments.
- Categorical chart colors stand for data series only. Never use them as unlabeled party identities.
- Check every real foreground/background pair against WCAG AA: 4.5:1 for body text, 3:1 for large text and essential UI graphics.
