# HANDOFF.md

Project state and architecture snapshot for **CabCost** — a Windows cabinet-shop
cost estimating app. Written as of the completion of the wood species decoupling
refactor and subsequent SQLite schema bugfixes. See `AGENTS.md` for the build/run
commands and strict conventions; this file describes *what exists, why, and what's next*.

## What the app does

CabCost models a shop's materials, hardware, and reusable build packages
("construction assemblies"), attaches them to a catalog of standard cabinet SKUs,
and produces per-cabinet parametric cost breakdowns that roll up into job quotes
with a gross-margin retail price.

## Current feature set (all working)

1. **Materials & Hardware** — role-based materials (9 roles) and hardware
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
4. **Job Quotes** — quote header with per-job assembly selections, project-wide
   Wood Species, Finish Type, and Outside Edge Detail toggles, custom cabinet
   line items (qty + W/H/D overrides), prefab/vendor buyout lines, financial rollup,
   duplicate/delete quick actions, inline status change, and a dedicated print-only
   customer estimate.
5. **Shop Settings** — labor rates, edgebanding time, margin, supplies %.

## Architecture

- **Backend (Go)** under `internal/`: `models` (structs + enum consts), `db`
  (schema, migration, seed), `store` (CRUD + the cost engine). `app.go` exposes
  thin Wails bindings that delegate to `*store.Store`.
- **Cost engine** (`internal/store/cost.go`): `CalculateCabinetCost(...)` and
  `...Override(...)` for dimension overrides. It dynamically resolves the correct
  lumber/panel materials based on the quote's selected Wood Species and Finish Type.
  It computes carcass/shelving, backing, face-frame-vs-edgeband, doors, drawer fronts,
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
- **Wood Species Decoupling**: Wood species is no longer hardcoded into construction
  profiles. `frame_lumber` and `door_frame` were consolidated into a single `lumber`
  role. The Quote selects the species (e.g., Alder, White Oak, Paint-Grade) and finish
  type (Stained, Painted), and `getLumber` / `materialByRoleAndSpecies` dynamically
  looks up the correct lumber item (and falls back to MDF/Paint-Grade for painted finishes).
- **Sheet sizes**: `sheet_4x8` = 32 sq ft, `sheet_5x5` = 25 sq ft.
- **Door/front separation**: originally doors and drawer fronts were a single
  `door_front` assembly; they were split into distinct `door` and `drawer_front`
  types. Quotes now carry both `door_assembly_id` and `drawer_front_assembly_id`.
- **Slide pairing**: drawer slides come from the drawer-box assembly's
  `hardware_id` (not a global default).
- **Finishing/edgebanding on drawer boxes**: `requires_finish` and `requires_edgeband`.
- **Slab doors/fronts**: keyed on the core material's `slab_sheet` role.
- **Raised panels**: `panel_type` selects the panel material logic — `flat`
  (1/4" sheet), `raised_sheet` (3/4" sheet), or `raised_solid` (solid lumber).
- **Mitered joinery**: `frame_joinery` is stored metadata; the extra bench labor
  is expressed through the profile's `build_labor_hours`.
- **Outside Edge Detail**: `quotes.has_edge_detail` adds `0.15 hrs × (doors +
  fronts)` of perimeter routing / detail-sanding labor to a quote.
- **Migration**: additive columns via `addColumnIfMissing` + one-time versioned
  data migrations (`PRAGMA user_version` → currently `5`); `migrateDataV5` deletes
  legacy assembly seeds and recreates the cleanly decoupled profiles.

## Notable bugs fixed

- **Job Quotes list deadlock**: Fixed by collecting all quote rows and closing the cursor
  before computing per-quote totals (`SetMaxOpenConns(1)` safety).
- **SQLite logic error on catalog**: Fixed missing `species` column by moving
  `addColumnIfMissing` directly to the unconditional top-level of `migrate()`.
- **Assembly Unique Constraint**: Removed `UNIQUE` from `name` in `construction_assemblies`
  so that Drawer Fronts and Doors can share identical descriptive names without crashing.

## Suggested next steps

- Add unit tests for the cost engine (currently only `internal/db` has a test).
- Consider a `go test` for `CalculateCabinetCost` against a known SKU to lock the
  geometry/rollup numbers, including a raised-solid panel and the edge-detail line.
- Print polish: a selectable Estimate vs. internal Cost Sheet variant and shop-branding
  header fields could follow.
- No undo, search, or import/export of quotes yet.
