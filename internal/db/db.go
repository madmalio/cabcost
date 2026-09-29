package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

const schema = `
CREATE TABLE IF NOT EXISTS materials (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	role TEXT NOT NULL,
	species TEXT DEFAULT 'paint_grade',
	unit TEXT NOT NULL,
	unit_cost REAL NOT NULL,
	waste_percent REAL NOT NULL DEFAULT 15.0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hardware (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	category TEXT NOT NULL,
	unit TEXT NOT NULL,
	unit_cost REAL NOT NULL,
	is_default BOOLEAN DEFAULT 0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shop_settings (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	loaded_labor_rate REAL NOT NULL DEFAULT 55.00,
	finishing_labor_rate_sqft REAL NOT NULL DEFAULT 4.00,
	manual_edgeband_min_per_ft REAL NOT NULL DEFAULT 1.5,
	default_margin_percent REAL NOT NULL DEFAULT 30.0,
	shop_supplies_percent REAL NOT NULL DEFAULT 3.0
);

CREATE TABLE IF NOT EXISTS construction_assemblies (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL UNIQUE,
	type TEXT NOT NULL,
	construction_style TEXT DEFAULT 'face_frame',
	core_material_id INTEGER REFERENCES materials(id),
	back_material_id INTEGER REFERENCES materials(id),
	panel_material_id INTEGER REFERENCES materials(id),
	face_lumber_id INTEGER REFERENCES materials(id),
	edgeband_id INTEGER REFERENCES materials(id),
	hardware_id INTEGER REFERENCES hardware(id),
	is_outsourced BOOLEAN DEFAULT 0,
	requires_finish BOOLEAN DEFAULT 0,
	requires_edgeband BOOLEAN DEFAULT 0,
	panel_type TEXT DEFAULT 'flat',
	frame_joinery TEXT DEFAULT 'cope_and_stick',
	finish_labor_hours REAL DEFAULT 0.0,
	prep_labor_hours REAL DEFAULT 0.0,
	panel_prep_labor_hours REAL DEFAULT 0.0,
	build_labor_hours REAL DEFAULT 0.0,
	is_default BOOLEAN DEFAULT 0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cabinet_catalog (
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

CREATE TABLE IF NOT EXISTS quotes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	job_name TEXT NOT NULL,
	client_name TEXT,
	client_phone TEXT,
	status TEXT DEFAULT 'draft',
	wood_species TEXT DEFAULT 'paint_grade',
	finish_type TEXT DEFAULT 'painted',
	box_assembly_id INTEGER REFERENCES construction_assemblies(id),
	door_assembly_id INTEGER REFERENCES construction_assemblies(id),
	drawer_front_assembly_id INTEGER REFERENCES construction_assemblies(id),
	drawer_assembly_id INTEGER REFERENCES construction_assemblies(id),
	is_finished BOOLEAN DEFAULT 1,
	has_edge_detail BOOLEAN DEFAULT 0,
	target_margin_percent REAL DEFAULT 30.0,
	prefab_margin_percent REAL DEFAULT 35.0,
	notes TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_cabinets (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
	cabinet_sku TEXT NOT NULL,
	quantity INTEGER NOT NULL DEFAULT 1,
	custom_width REAL,
	custom_height REAL,
	custom_depth REAL,
	notes TEXT
);

CREATE TABLE IF NOT EXISTS quote_buyouts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
	category TEXT NOT NULL,
	description TEXT NOT NULL,
	vendor_invoice_cost REAL NOT NULL,
	margin_percent REAL NOT NULL
);
`

// DefaultPath returns the recommended location for the SQLite database file,
// scoped to the user's platform config directory so it survives app updates.
func DefaultPath() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("resolve config dir: %w", err)
	}
	dir := filepath.Join(base, "cabcost")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", fmt.Errorf("create config dir: %w", err)
	}
	return filepath.Join(dir, "cabcost.db"), nil
}

// Open opens (creating if necessary) the SQLite database at path, applies the
// schema, and seeds default data when the tables are empty.
func Open(path string) (*sql.DB, error) {
	database, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	// SQLite is used from a single desktop process; serialise access to avoid
	// "database is locked" errors from concurrent bindings.
	database.SetMaxOpenConns(1)

	if _, err := database.Exec(`PRAGMA journal_mode = WAL;`); err != nil {
		_ = database.Close()
		return nil, fmt.Errorf("enable WAL: %w", err)
	}
	if _, err := database.Exec(`PRAGMA foreign_keys = ON;`); err != nil {
		_ = database.Close()
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}

	if _, err := database.Exec(schema); err != nil {
		_ = database.Close()
		return nil, fmt.Errorf("apply schema: %w", err)
	}

	if err := migrate(database); err != nil {
		_ = database.Close()
		return nil, fmt.Errorf("migrate database: %w", err)
	}

	if err := seed(database); err != nil {
		_ = database.Close()
		return nil, fmt.Errorf("seed database: %w", err)
	}

	return database, nil
}

// migrate applies lightweight, additive migrations for databases created
// before a column existed. Each step is guarded so it is idempotent.
func migrate(database *sql.DB) error {
	if err := addColumnIfMissing(database, "hardware", "is_default", "BOOLEAN DEFAULT 0"); err != nil {
		return err
	}
	if err := addColumnIfMissing(database, "construction_assemblies", "hardware_id", "INTEGER REFERENCES hardware(id)"); err != nil {
		return err
	}
	if err := addColumnIfMissing(database, "construction_assemblies", "requires_finish", "BOOLEAN DEFAULT 0"); err != nil {
		return err
	}
	if err := addColumnIfMissing(database, "construction_assemblies", "requires_edgeband", "BOOLEAN DEFAULT 0"); err != nil {
		return err
	}
	if err := addColumnIfMissing(database, "construction_assemblies", "finish_labor_hours", "REAL DEFAULT 0.0"); err != nil {
		return err
	}
	if err := addColumnIfMissing(database, "construction_assemblies", "panel_type", "TEXT DEFAULT 'flat'"); err != nil {
		return err
	}
	if err := addColumnIfMissing(database, "construction_assemblies", "frame_joinery", "TEXT DEFAULT 'cope_and_stick'"); err != nil {
		return err
	}
	if err := addColumnIfMissing(database, "construction_assemblies", "panel_prep_labor_hours", "REAL DEFAULT 0.0"); err != nil {
		return err
	}
	if err := addColumnIfMissing(database, "quotes", "drawer_front_assembly_id", "INTEGER REFERENCES construction_assemblies(id)"); err != nil {
		return err
	}
	if err := addColumnIfMissing(database, "quotes", "has_edge_detail", "BOOLEAN DEFAULT 0"); err != nil {
		return err
	}

	version, err := userVersion(database)
	if err != nil {
		return err
	}
	if version < 3 {
		var count int
		if err := database.QueryRow(`SELECT COUNT(*) FROM construction_assemblies`).Scan(&count); err != nil {
			return fmt.Errorf("count assemblies for migration: %w", err)
		}
		if count > 0 {
			if err := migrateDataV3(database); err != nil {
				return err
			}
		}
		if err := setUserVersion(database, 3); err != nil {
			return err
		}
	}
	if version < 4 {
		if err := migrateDataV4(database); err != nil {
			return err
		}
		if err := setUserVersion(database, 4); err != nil {
			return err
		}
	}
	return nil
}

func columnExists(database *sql.DB, table, column string) (bool, error) {
	rows, err := database.Query(`PRAGMA table_info(` + table + `)`)
	if err != nil {
		return false, fmt.Errorf("inspect %s: %w", table, err)
	}
	defer rows.Close()

	for rows.Next() {
		var (
			cid       int
			name      string
			ctype     string
			notnull   int
			dfltValue any
			pk        int
		)
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dfltValue, &pk); err != nil {
			return false, fmt.Errorf("scan %s pragma: %w", table, err)
		}
		if name == column {
			return true, nil
		}
	}
	return false, rows.Err()
}
