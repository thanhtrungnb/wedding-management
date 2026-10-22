# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Vietnamese-language wedding planning app ("Sổ tay cưới"). Pure static frontend: vanilla ES modules, no framework, no build step, no package manager, no tests. All UI text is Vietnamese — keep it that way.

## Running

Serve the directory over HTTP (ES modules don't work from `file://`):

```
npx serve .
```

Then open the served URL. Data persists in `localStorage` under key `wm:data:v1`.

## Architecture

Strict layered data flow — dependencies point one direction only:

```
features/ (views, DOM)
  → services/ (business logic, pure: mutate `data` object, no DOM, no storage)
    → models/ (schema validation, domain rules)
      → utils/
features/ also → core/store.js (single shared state)
  → repositories/appRepository.js (load/save/reset contract — swap this file for a backend)
    → storage/localStore.js (lowest layer; ONLY repository may call it)
```

Key mechanics that span multiple files:

- **State**: `core/store.js` holds the single app data object. Views never mutate directly — they call `commit(mutator, { undoable })`, which clones state, runs a service function as the mutator, rolls back on `{ ok: false }`, persists, and notifies subscribers. `onChange(fn, signal)` re-renders; subscriptions auto-cleanup on route change.
- **Routing**: `core/router.js` is hash-based (`#/tong-quan`, `#/viec`, `#/cai-dat`). Each view module exports `mount(el, signal)`. Every route gets a fresh `AbortController` signal — all event listeners must pass `{ signal }` so they're cleaned up on navigation.
- **Validation**: `models/schema.js` `validateAppData()` is the single gate for all inbound data (localStorage load AND JSON import). It returns `{ ok, errors, data }` — normalized data even when invalid. Corrupt localStorage data is quarantined under `wm:corrupt:*` rather than silently dropped.
- **Task domain rules** (enforced in `services/taskService.js` / `models/task.js`):
  - Max 2 levels: a task with children can't become a child; a child can't be a parent.
  - Parent `done` is derived — `syncParents` sets it when all children are done; parents with children can't be toggled directly.
  - Child tasks inherit `categoryId` from their parent.
  - Progress counts only leaf tasks (`progressUnits` in `services/dashboard.js`).
- **View pattern**: views render HTML template strings into `innerHTML`, then bind delegated listeners on the container with `{ signal }`. Re-render = replace innerHTML + restore focus via a key selector (see `checklistView.js` `keyOf`). XSS: user content must go through `esc()` from `utils/format.js`.

## Conventions

- Code comments are Vietnamese and explain *why* (domain rules, layer contracts), not what. Preserve them.
- Services are pure functions taking `(data, ...)` and returning `{ ok, ... }` result objects — never touch DOM or localStorage there.
- IDs: `newId('t')` prefix scheme from `utils/id.js`.
- CSS lives in `assets/css/` with design tokens in `tokens.css`; no CSS-in-JS.
- Planned-but-unbuilt routes (Ngân sách, Lịch trình) use `data-soon` buttons; budget logic already exists in `services/dashboard.js` (`budgetSummary`).
