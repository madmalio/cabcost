# HANDOFF.md

Project state and architecture snapshot for **CabCost** — a Windows cabinet-shop
cost estimating app. Written as of the completion of the raised-panel / mitered
door modeling work plus the dedicated quote print view and Job Quotes list quick
actions. See `AGENTS.md` for the build/run commands and conventions; this file
describes *what exists, why, and what's next*.

## What the app does

CabCost models a shop's materials, hardware, and reusable build packages
("construction assemblies"), attaches them to a catalog of standard cabinet SKUs,
and produces per-cabinet parametric cost breakdowns that roll up into job quotes
with a gross-margin retail price.

## Current feature set (all working)

1. **Materials & Hardware** — role-based materials (10 roles) and hardware
   (hinge/slide/pull/accessory), with unit-aware costing and waste %.
2. **Construction Profiles** — four assembly types: `box`, `door`,
   `drawer_front`, `drawer_box`. Drawer boxes link slide hardware and carry
   `requires_finish` / `requires_edgeband` flags + finish labor. Doors link hinge
   hardware. Door/front profiles also carry `panel_type` (`flat` / `raised_sheet`
   / `raised_solid`) and `frame_joinery` (`cope_and_stick` / `mitered`; slab via
   core role), plus `panel_prep_labor_hours` for solid raised panels. Profiles
   support in-house vs outsourced (buyout) variants.
3. **Cabinet Catalog** — seeded Hero SKUs (B36, DB18-4, SB36, W3030, U2484) with
   a live cost-preview drawer (which includes the Outside Edge Detail toggle).
4. **Job Quotes** — quote header with per-job assembly selections, a project-wide
   Outside Edge Detail toggle, custom cabinet line items (qty + W/H/D overrides),
   prefab/vendor buyout lines, financial rollup, duplicate/delete quick actions,
   inline status change, and a dedicated print-only customer estimate.
5. **Shop Settings** — labor rates, edgebanding time, margin, supplies %.

## Architecture

- **Backend (Go)** under `internal/`: `models` (structs + enum consts), `db`
  (schema, migration, seed), `store` (CRUD + the cost engine). `app.go` exposes
  thin Wails bindings that delegate to `*store.Store`.
- **Cost engine** (`internal/store/cost.go`): `CalculateCabinetCost(sku, boxID,
  doorID, drawerFrontID, drawerBoxID, isFinished, edgeDetail)` and
  `...Override(...)` for dimension overrides (0 = catalog default). It computes
  carcass/shelving, backing, face-frame-vs-edgeband, doors, drawer fronts,
  drawer boxes (slides from the linked hardware), hardware, finishing, raised
  panel materials/labor, project-wide edge-detail labor, and the rollup.
- **Frontend (React + TS + Vite + Tailwind)** under `frontend/src/`: a
  `Sidebar` + five screens (`MaterialsScreen`, `ProfilesScreen`, `CatalogScreen`,
  `QuotesScreen`/`QuoteWorkbench`, `ShopSettingsScreen`). `constants.ts` holds the
  types and label/badge helpers; `api.ts` wraps the generated `wailsjs` bindings.
- **Data**: SQLite via `modernc.org/sqlite` (pure Go, no CGO), stored at
  `%APPDATA%\cabcost\cabcost.db`, WAL mode, `SetMaxOpenConns(1)`.

## Key decisions made along the way

- **SQLite driver**: `modernc.org/sqlite` (pure Go) so builds stay `CGO_ENABLED=0`.
- **DB location**: user config dir (`os.UserConfigDir()/cabcost`).
- **Sheet sizes**: `sheet_4x8` = 32 sq ft, `sheet_5x5` = 25 sq ft.
- **Door/front separation**: originally doors and drawer fronts were a single
  `door_front` assembly; they were split into distinct `door` and `drawer_front`
  types. Quotes now carry both `door_assembly_id` and `drawer_front_assembly_id`.
- **Slide pairing**: drawer slides come from the drawer-box assembly's
  `hardware_id` (not a global default), so slide hardware tracks construction
  style (undermount for dovetail, side-mount for melamine).
- **Finishing/edgebanding on drawer boxes**: `requires_finish` (clear coat +
  `finish_labor_hours`) and `requires_edgeband` (tape + banding labor).
- **Slab doors/fronts**: keyed on the core material's `slab_sheet` role (vs
  `door_frame` for 5-piece); slabs cost sheet area + perimeter edgeband.
- **Raised panels**: `panel_type` selects the panel material logic — `flat`
  (1/4" sheet), `raised_sheet` (3/4" sheet), or `raised_solid` (solid lumber
  priced by board foot, `frontPanelSqFt` × 1 BF/ft², plus `panel_prep_labor_hours`
  glue/clamp/sanding labor). The panel picker's allowed roles follow the type
  (`door_panel` / `slab_sheet` / `frame_lumber`+`door_frame`).
- **Mitered joinery**: `frame_joinery` is stored metadata; the extra bench labor
  is expressed through the profile's `build_labor_hours` (no dedicated math).
- **Outside Edge Detail**: `quotes.has_edge_detail` adds `0.15 hrs × (doors +
  fronts)` of perimeter routing / detail-sanding labor to a quote.
- **Quote print**: a hidden `QuotePrintView` (printed under `@media print`) is the
  only visible content when printing; `runtime.WindowPrint` is unchanged.
- **Migration**: additive columns via `addColumnIfMissing` + one-time versioned
  data migrations (`PRAGMA user_version` → currently `4`); `migrateDataV4` adds
  the six raised-panel/mitered profiles.

## Notable bugs fixed

- **Job Quotes list deadlock**: `GetQuotes` iterated a `rows` cursor while
  calling `quoteFinancialSummary` (nested queries) under `SetMaxOpenConns(1)`,
  deadlocking forever. Fixed by collecting all quote rows and closing the cursor
  before computing per-quote totals.
- **Modal not closing** (earlier): `AssemblyModal` was rendered unconditionally;
  fixed with a proper open/editing state guard.

## Known quirks / non-issues

- `Unsolicited response received on idle HTTP channel ... 400 Bad Request` in the
  Go log is benign HTTP/2 connection-teardown noise from Wails' WebView2 asset
  server (golang/go#19895). Ignore it.
- `frontend/package.json.md5` is a Wails cache file and is **gitignored**.

## Git

- Repo initialized on branch `main`; identity is repo-local
  (`madmalio <madmalio82@gmail.com>`).
- Initial commit `fc8ac08`; `6ad0a33` ignores the md5 cache file; `f419117` adds
  raised-panel/mitered modeling, the quote print view, and list quick actions.
- `AGENTS.md` and `HANDOFF.md` are currently **untracked** (not yet committed).

## Suggested next steps

- Add unit tests for the cost engine (currently only `internal/db` has a test).
- Consider a `go test` for `CalculateCabinetCost` against a known SKU to lock the
  geometry/rollup numbers, including a raised-solid panel and the edge-detail line.
- Print polish: the dedicated `QuotePrintView` estimate exists; a selectable
  Estimate vs. internal Cost Sheet variant and shop-branding header fields could
  follow.
- No undo, search, or import/export of quotes yet.
