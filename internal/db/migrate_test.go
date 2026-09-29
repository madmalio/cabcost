package db

import (
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

// oldSchema recreates the pre-refactor tables (before hardware_id/requires_* and
// before quotes.drawer_front_assembly_id).
const oldSchema = `
CREATE TABLE materials (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	role TEXT NOT NULL,
	unit TEXT NOT NULL,
	unit_cost REAL NOT NULL,
	waste_percent REAL NOT NULL DEFAULT 15.0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE hardware (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	category TEXT NOT NULL,
	unit TEXT NOT NULL,
	unit_cost REAL NOT NULL,
	is_default BOOLEAN DEFAULT 0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE shop_settings (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	loaded_labor_rate REAL NOT NULL DEFAULT 55.00,
	finishing_labor_rate_sqft REAL NOT NULL DEFAULT 4.00,
	manual_edgeband_min_per_ft REAL NOT NULL DEFAULT 1.5,
	default_margin_percent REAL NOT NULL DEFAULT 30.0,
	shop_supplies_percent REAL NOT NULL DEFAULT 3.0
);
CREATE TABLE construction_assemblies (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	type TEXT NOT NULL,
	construction_style TEXT DEFAULT 'face_frame',
	core_material_id INTEGER,
	back_material_id INTEGER,
	panel_material_id INTEGER,
	face_lumber_id INTEGER,
	edgeband_id INTEGER,
	is_outsourced BOOLEAN DEFAULT 0,
	prep_labor_hours REAL DEFAULT 0.0,
	build_labor_hours REAL DEFAULT 0.0,
	is_default BOOLEAN DEFAULT 0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE cabinet_catalog (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	sku TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	category TEXT NOT NULL,
	width REAL NOT NULL,
	height REAL NOT NULL,
	depth REAL NOT NULL,
	doors_count INTEGER DEFAULT 0,
	drawers_count INTEGER DEFAULT 0,
	shelves_count INTEGER DEFAULT 0,
	base_assembly_hours REAL NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE quotes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	job_name TEXT NOT NULL,
	client_name TEXT,
	client_phone TEXT,
	status TEXT DEFAULT 'draft',
	box_assembly_id INTEGER,
	door_assembly_id INTEGER,
	drawer_assembly_id INTEGER,
	is_finished BOOLEAN DEFAULT 1,
	target_margin_percent REAL DEFAULT 30.0,
	prefab_margin_percent REAL DEFAULT 35.0,
	notes TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE quote_cabinets (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	quote_id INTEGER NOT NULL,
	cabinet_sku TEXT NOT NULL,
	quantity INTEGER NOT NULL DEFAULT 1,
	custom_width REAL,
	custom_height REAL,
	custom_depth REAL,
	notes TEXT
);
CREATE TABLE quote_buyouts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	quote_id INTEGER NOT NULL,
	category TEXT NOT NULL,
	description TEXT NOT NULL,
	vendor_invoice_cost REAL NOT NULL,
	margin_percent REAL NOT NULL
);
`

func TestMigrateExistingDB(t *testing.T) {
	path := filepath.Join(t.TempDir(), "old.db")

	raw, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := raw.Exec(oldSchema); err != nil {
		t.Fatal(err)
	}

	// Old seed data (subset sufficient to exercise the migration paths).
	insert := func(q string, args ...any) {
		if _, err := raw.Exec(q, args...); err != nil {
			t.Fatalf("seed %q: %v", q, err)
		}
	}
	insert(`INSERT INTO materials (name, role, unit, unit_cost, waste_percent) VALUES ('4/4 Select Poplar (Door Stock)', 'door_frame', 'board_foot', 4.25, 20.0)`)
	insert(`INSERT INTO materials (name, role, unit, unit_cost, waste_percent) VALUES ('1/4" MDF (Door Panel)', 'door_panel', 'sheet_4x8', 32.00, 10.0)`)
	insert(`INSERT INTO materials (name, role, unit, unit_cost, waste_percent) VALUES ('5/8" White Melamine', 'box_core', 'sheet_4x8', 42.00, 15.0)`)
	insert(`INSERT INTO materials (name, role, unit, unit_cost, waste_percent) VALUES ('1/4" White Hardboard / Melamine Back', 'box_back', 'sheet_4x8', 24.00, 10.0)`)
	insert(`INSERT INTO materials (name, role, unit, unit_cost, waste_percent) VALUES ('1/4" Prefinished Birch Plywood', 'box_back', 'sheet_4x8', 42.00, 10.0)`)
	insert(`INSERT INTO hardware (name, category, unit, unit_cost, is_default) VALUES ('Blum Soft-Close 110 Hinge + Plate', 'hinge', 'each', 4.25, 1)`)
	insert(`INSERT INTO hardware (name, category, unit, unit_cost, is_default) VALUES ('Blum 21" Undermount Soft-Close Slides (Pair)', 'slide', 'pair', 28.50, 1)`)
	insert(`INSERT INTO hardware (name, category, unit, unit_cost, is_default) VALUES ('Side-Mount Ball Bearing Slides 22" (Pair)', 'slide', 'pair', 9.50, 0)`)
	insert(`INSERT INTO hardware (name, category, unit, unit_cost, is_default) VALUES ('5mm Metal Shelf Pins', 'accessory', 'each', 0.15, 1)`)
	// Old door_front + drawer_box profiles.
	insert(`INSERT INTO construction_assemblies (name, type, construction_style, core_material_id, panel_material_id, is_outsourced, build_labor_hours, is_default) VALUES ('Paint-Grade Shaker (Poplar / MDF)', 'door_front', 'face_frame', 1, 2, 0, 0.9, 1)`)
	insert(`INSERT INTO construction_assemblies (name, type, construction_style, is_outsourced, prep_labor_hours, is_default) VALUES ('Outsourced Raw Doors (Prep & Bore Only)', 'door_front', 'face_frame', 1, 0.08, 1)`)
	insert(`INSERT INTO construction_assemblies (name, type, construction_style, core_material_id, back_material_id, is_outsourced, build_labor_hours, is_default) VALUES ('5/8" Dovetail Birch Box', 'drawer_box', 'face_frame', 1, 5, 0, 0.4, 1)`)
	insert(`INSERT INTO construction_assemblies (name, type, construction_style, is_outsourced, prep_labor_hours, is_default) VALUES ('Outsourced / Buyout Drawer Box', 'drawer_box', 'face_frame', 1, 0.08, 0)`)
	insert(`INSERT INTO quotes (job_name, door_assembly_id, drawer_assembly_id) VALUES ('Test Job', 1, 3)`)

	if err := raw.Close(); err != nil {
		t.Fatal(err)
	}

	dbh, err := Open(path)
	if err != nil {
		t.Fatalf("Open migrated DB: %v", err)
	}
	defer dbh.Close()

	assertCount := func(label, q string, want int) {
		t.Helper()
		var n int
		if err := dbh.QueryRow(q).Scan(&n); err != nil {
			t.Fatalf("%s: %v", label, err)
		}
		if n != want {
			t.Errorf("%s: got %d, want %d", label, n, want)
		}
	}

	assertCount("door_front should be gone", `SELECT COUNT(*) FROM construction_assemblies WHERE type='door_front'`, 0)
	assertCount("door profiles", `SELECT COUNT(*) FROM construction_assemblies WHERE type='door'`, 6)
	assertCount("drawer front profiles", `SELECT COUNT(*) FROM construction_assemblies WHERE type='drawer_front'`, 6)
	assertCount("drawer box profiles", `SELECT COUNT(*) FROM construction_assemblies WHERE type='drawer_box'`, 3)
	assertCount("5x5 material", `SELECT COUNT(*) FROM materials WHERE name='1/2" 5x5 9-Ply Russian Birch'`, 1)
	assertCount("slab material", `SELECT COUNT(*) FROM materials WHERE name='3/4" MDF (Slab)'`, 1)
	assertCount("alder material", `SELECT COUNT(*) FROM materials WHERE name='4/4 Superior Alder'`, 1)

	var requiresFinish int
	var hardwareID sql.NullInt64
	if err := dbh.QueryRow(`SELECT requires_finish, hardware_id FROM construction_assemblies WHERE name='5/8" Dovetail Birch (Undermount)'`).Scan(&requiresFinish, &hardwareID); err != nil {
		t.Fatalf("dovetail row: %v", err)
	}
	if requiresFinish != 1 || !hardwareID.Valid {
		t.Errorf("dovetail box: requires_finish=%d hardware_id.Valid=%v", requiresFinish, hardwareID.Valid)
	}

	var frontID sql.NullInt64
	if err := dbh.QueryRow(`SELECT drawer_front_assembly_id FROM quotes WHERE job_name='Test Job'`).Scan(&frontID); err != nil {
		t.Fatalf("quote backfill: %v", err)
	}
	if !frontID.Valid || frontID.Int64 == 0 {
		t.Errorf("quote drawer_front_assembly_id not backfilled: %v", frontID)
	}

	var panelType, frameJoinery string
	var panelPrep float64
	if err := dbh.QueryRow(`SELECT panel_type, frame_joinery, panel_prep_labor_hours FROM construction_assemblies WHERE name='Stained Alder Raised Panel Door'`).Scan(&panelType, &frameJoinery, &panelPrep); err != nil {
		t.Fatalf("raised panel row: %v", err)
	}
	if panelType != "raised_solid" || frameJoinery != "cope_and_stick" || panelPrep != 0.4 {
		t.Errorf("stained alder raised panel: panel_type=%q frame_joinery=%q panel_prep=%v", panelType, frameJoinery, panelPrep)
	}

	var hasEdgeDetail bool
	if err := dbh.QueryRow(`SELECT has_edge_detail FROM quotes WHERE job_name='Test Job'`).Scan(&hasEdgeDetail); err != nil {
		t.Fatalf("quote has_edge_detail: %v", err)
	}
	if hasEdgeDetail {
		t.Errorf("quote has_edge_detail should default to false, got %v", hasEdgeDetail)
	}
}
