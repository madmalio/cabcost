# AGENTS.md

Guidance for AI coding agents (and future maintainers) working on **CabCost**.

## What this is

CabCost is a Windows desktop app for cabinet-shop cost estimation. It prices
cabinet "Hero SKUs" against user-defined **materials**, **hardware**,
**construction assemblies** (boxes, doors, drawer fronts, drawer boxes), and
**shop settings**, then rolls them into **job quotes** with a gross-margin
retail price.

## Strict Agent Tooling Rules

- **NO helper scripts:** DO NOT write or execute throwaway scripts (`.py`, `.ps1`, `.sh`, `.bat`, etc.) to modify files. Inspect and edit the source files directly using native read/write/replace file tools.
- **NO background delegated sub-agents:** Perform work directly in the active session unless absolutely necessary for unrelated research.

## Stack

- **Go** `1.26` (see `go.mod`) — backend + parametric cost engine
- **Wails v2** `v2.11.0` — desktop shell / JS bridge
- **React 18 + TypeScript** + **Vite 3** + **Tailwind CSS v3** (PostCSS) + **lucide-react**
- **modernc.org/sqlite** (pure-Go, **no CGO**). Always build with `CGO_ENABLED=0`.
- Zinc dark theme (`zinc-950` bg), custom lightweight components (no UI kit).

## Commands

Run from the repo root unless noted.

| Task | Command |
|------|---------|
| Dev mode (hot reload) | `wails dev` |
| Production build | `CGO_ENABLED=0 wails build` → `build/bin/cabcost.exe` |
| Regenerate Wails bindings | `wails generate module` (writes `frontend/wailsjs/`) |
| Backend build | `go build ./...` |
| Backend vet | `go vet ./...` |
| Backend tests | `go test ./...` (migration test only) |
| Frontend typecheck | `npx tsc --noEmit` (in `frontend/`) |
| Frontend build | `npx vite build` (in `frontend/`) |

There is **no linter configured** and no `npm run lint`. `go vet` + `tsc --noEmit`
are the correctness gates. Run `go build ./...`, `go vet ./...`, `npx tsc --noEmit`,
and `wails build` after any change.

## Layout

```
main.go                     Wails entry; embeds frontend/dist; binds *App
app.go                      *App struct + all Wails bindings (thin; delegate to store)
internal/models/models.go   All structs, JSON tags, and enum constants
internal/db/db.go           schema (CREATE TABLE IF NOT EXISTS), Open(), migrate()
internal/db/migrate.go      addColumnIfMissing + versioned data migration (user_version)
internal/db/seed.go         idempotent seed (runs only when tables are empty)
internal/db/migrate_test.go migration test (simulates a pre-refactor DB)
internal/store/             *Store over *sql.DB; CRUD + cost engine
  cost.go                   parametric engine: CalculateCabinetCost(..., isFinished, edgeDetail)
  quotes.go / quote_finance.go / quote_items.go
  assemblies.go / materials.go / hardware.go / settings.go / catalog.go
frontend/src/
  constants.ts              TS interfaces + label/badge/format helpers
  api.ts                    typed wrappers over generated wailsjs bindings
  components/*.tsx          screens + modals (Zinc dark theme)
    QuotePrintView.tsx      print-only customer estimate (hidden on screen; shown under @media print)
  wailsjs/                  GENERATED — do not edit by hand
```

## Data model (SQLite)

Tables: `materials`, `hardware`, `shop_settings`, `construction_assemblies`,
`cabinet_catalog`, `quotes`, `quote_cabinets`, `quote_buyouts`.

- Material **roles**: `box_core`, `box_back`, `lumber`,
  `door_panel`, `slab_sheet`, `drawer_side`, `drawer_bottom`, `edgeband`, `finishing`.
- Material **units**: `sheet_4x8` (32 sq ft), `sheet_5x5` (25 sq ft), `board_foot`,
  `linear_foot`, `sq_ft`, `each`. `sheetCost()` in `cost.go` handles the ÷32/÷25 split.
- Assembly **types**: `box`, `door`, `drawer_front`, `drawer_box`.
  Assemblies carry nullable material FKs plus `hardware_id` (slide on drawer_box,
  hinge on door), `requires_finish`, `requires_edgeband`, `finish_labor_hours`,
  `prep_labor_hours`, `build_labor_hours`, `is_default`.
- Door/front **panel_type**: `flat` (1/4" sheet), `raised_sheet` (3/4" MDF),
  `raised_solid` (glued solid lumber, priced by board foot). Door/front
  **frame_joinery**: `cope_and_stick`, `mitered`, `slab`. Mitered frames carry
  extra `build_labor_hours`; raised-solid panels add `panel_prep_labor_hours`
  (jointing/glue-up/clamping/wide-belt). The panel material's role follows the
  panel type (`door_panel` / `slab_sheet` / `lumber`).
- Quote header references `box_assembly_id`, `door_assembly_id`,
  `drawer_front_assembly_id`, `drawer_assembly_id`, and `has_edge_detail` (adds
  project-wide perimeter routing + detail-sanding labor to all doors/fronts).
  Quotes also specify **`wood_species`** and **`finish_type`** project-wide, which dynamically resolve the `lumber` materials used in doors/fronts during cost calculation.

## Database location & migrations

- DB file: `os.UserConfigDir()/cabcost/cabcost.db` (Windows: `%APPDATA%\cabcost\cabcost.db`).
- Opened WAL + `foreign_keys=ON`.
- Schema changes must be **additive** and handled in `migrate()`:
  1. `addColumnIfMissing(...)` for new columns (idempotent, runs every startup).
  2. Version-gated data migration keyed on `PRAGMA user_version` (currently `4`).
     Bump the version and add a new `migrateDataN(...)` for future data transforms.
  Data migrations run **only once**; don't reset user-editable fields on every launch.

## Critical gotchas

- **`SetMaxOpenConns(1)` → never nest queries under an open `rows` cursor.**
  Iterating `rows` holds the single connection; issuing another query inside that
  loop deadlocks forever. Always fully consume + `Close()` the cursor, then loop
  over the collected slice. (This bug previously hung the Job Quotes list in
  `GetQuotes` — see the fix there.)
- **modernc/sqlite is pure Go**; `CGO_ENABLED=1` builds are unnecessary and the
  toolchain has been bumped to `go 1.26`. Don't reintroduce a CGO driver.
- **Generated bindings**: after changing any `*App` method signature, run
  `wails generate module` so `frontend/wailsjs/` stays in sync. `tsc` will fail
  otherwise.
- **Nullable columns**: scan into `sql.NullInt64`/`sql.NullFloat64`, and pass
  dereferenced values (via `ptrFloat`) on write — database/sql doesn't accept
  `*float64` as a driver arg.
- Frontend uses `esModuleInterop: false` + `"type": "module"` — PostCSS/Tailwind
  config files are `.cjs` (not `.js`) for that reason.

## Conventions

- Go: doc comments on exported symbols; error wrapping with `%w`; SQL column
  lists as shared `const` (e.g. `quoteCols`, `assemblyCols`).
- Frontend: shared UI class strings live in `components/ui.ts`; badge colors are
  static Tailwind literals in `constants.ts` so the JIT picks them up.
- All money formatting via `Intl.NumberFormat('en-US', {style:'currency'})`.
- Don't invent new dependencies; lucide-react + Tailwind cover UI needs.
