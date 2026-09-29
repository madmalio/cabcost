package db

import (
	"database/sql"
	"fmt"

	"cabcost/internal/models"
)

// addColumnIfMissing adds a column to a table if it does not already exist.
func addColumnIfMissing(database *sql.DB, table, column, definition string) error {
	exists, err := columnExists(database, table, column)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	if _, err := database.Exec(`ALTER TABLE ` + table + ` ADD COLUMN ` + column + ` ` + definition); err != nil {
		return fmt.Errorf("add %s.%s: %w", table, column, err)
	}
	return nil
}

func userVersion(database *sql.DB) (int, error) {
	var v int
	if err := database.QueryRow(`PRAGMA user_version`).Scan(&v); err != nil {
		return 0, fmt.Errorf("read user_version: %w", err)
	}
	return v, nil
}

func setUserVersion(database *sql.DB, v int) error {
	if _, err := database.Exec(fmt.Sprintf(`PRAGMA user_version = %d`, v)); err != nil {
		return fmt.Errorf("set user_version: %w", err)
	}
	return nil
}

func ensureMaterial(database *sql.DB, name, role, unit string, cost, waste float64) error {
	if _, err := database.Exec(
		`INSERT INTO materials (name, role, unit, unit_cost, waste_percent)
		 SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM materials WHERE name = ?)`,
		name, role, unit, cost, waste, name,
	); err != nil {
		return fmt.Errorf("ensure material %q: %w", name, err)
	}
	return nil
}

func ensureAssembly(database *sql.DB, name, typ, style string, core, back, panel, faceLumber, edgeband, hardware *int64,
	isOutsourced, requiresFinish, requiresEdgeband bool, finishLabor, prepLabor, buildLabor float64, isDefault bool, panelType, frameJoinery string, panelPrepLabor float64) error {
	if _, err := database.Exec(
		`INSERT INTO construction_assemblies
		   (name, type, construction_style, core_material_id, back_material_id, panel_material_id, face_lumber_id, edgeband_id, hardware_id, is_outsourced, requires_finish, requires_edgeband, panel_type, frame_joinery, finish_labor_hours, prep_labor_hours, panel_prep_labor_hours, build_labor_hours, is_default)
		 SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
		 WHERE NOT EXISTS (SELECT 1 FROM construction_assemblies WHERE name = ?)`,
		name, typ, style, core, back, panel, faceLumber, edgeband, hardware,
		isOutsourced, requiresFinish, requiresEdgeband, panelType, frameJoinery, finishLabor, prepLabor, panelPrepLabor, buildLabor, isDefault, name,
	); err != nil {
		return fmt.Errorf("ensure assembly %q: %w", name, err)
	}
	return nil
}

// migrateDataV3 repairs databases created before the drawer/door-front refactor:
// it converts the legacy 'door_front' type to 'door', relinks hardware on seed
// profiles, inserts the new profiles and materials, and backfills the new quote
// column. It runs exactly once (guarded by user_version).
func migrateDataV3(database *sql.DB) error {
	if err := ensureMaterial(database, `1/2" 5x5 9-Ply Russian Birch`, models.RoleDrawerSide, models.UnitSheet5x5, 38.00, 15.0); err != nil {
		return err
	}
	if err := ensureMaterial(database, `3/4" MDF (Slab)`, models.RoleSlabSheet, models.UnitSheet4x8, 48.00, 15.0); err != nil {
		return err
	}

	if _, err := database.Exec(`UPDATE construction_assemblies SET type = 'door' WHERE type = 'door_front'`); err != nil {
		return fmt.Errorf("rename door_front type: %w", err)
	}

	hinge, err := hardwareIDByName(database, `Blum Soft-Close 110 Hinge + Plate`)
	if err != nil {
		return err
	}
	undermount, err := hardwareIDByName(database, `Blum 21" Undermount Soft-Close Slides (Pair)`)
	if err != nil {
		return err
	}
	sideMount, err := hardwareIDByName(database, `Side-Mount Ball Bearing Slides 22" (Pair)`)
	if err != nil {
		return err
	}
	birch5x5, err := materialIDByName(database, `1/2" 5x5 9-Ply Russian Birch`)
	if err != nil {
		return err
	}
	melamineCore, err := materialIDByName(database, `5/8" White Melamine`)
	if err != nil {
		return err
	}
	melamineBack, err := materialIDByName(database, `1/4" White Hardboard / Melamine Back`)
	if err != nil {
		return err
	}
	poplar, err := materialIDByName(database, `4/4 Select Poplar (Door Stock)`)
	if err != nil {
		return err
	}
	mdfPanel, err := materialIDByName(database, `1/4" MDF (Door Panel)`)
	if err != nil {
		return err
	}
	mdfSlab, err := materialIDByName(database, `3/4" MDF (Slab)`)
	if err != nil {
		return err
	}

	// Repair renamed seed rows (idempotent — old names only exist pre-migration).
	if _, err := database.Exec(
		`UPDATE construction_assemblies SET name = 'Paint-Grade Shaker Door', hardware_id = ? WHERE name = 'Paint-Grade Shaker (Poplar / MDF)'`,
		hinge,
	); err != nil {
		return fmt.Errorf("repair paint-grade door: %w", err)
	}
	if _, err := database.Exec(
		`UPDATE construction_assemblies SET name = 'Outsourced Raw Door' WHERE name = 'Outsourced Raw Doors (Prep & Bore Only)'`,
	); err != nil {
		return fmt.Errorf("repair outsourced door: %w", err)
	}
	if _, err := database.Exec(
		`UPDATE construction_assemblies SET name = '5/8" Dovetail Birch (Undermount)', hardware_id = ?, requires_finish = 1, finish_labor_hours = 0.1, core_material_id = ? WHERE name = '5/8" Dovetail Birch Box'`,
		undermount, birch5x5,
	); err != nil {
		return fmt.Errorf("repair dovetail box: %w", err)
	}

	// Reset per-type defaults, then set the canonical default for each type.
	if _, err := database.Exec(
		`UPDATE construction_assemblies SET is_default = 0 WHERE type IN ('door', 'drawer_front', 'drawer_box')`,
	); err != nil {
		return fmt.Errorf("reset defaults: %w", err)
	}
	if _, err := database.Exec(`UPDATE construction_assemblies SET is_default = 1 WHERE name = 'Paint-Grade Shaker Door'`); err != nil {
		return fmt.Errorf("set door default: %w", err)
	}

	// Insert the profiles that didn't exist before the refactor.
	if err := ensureAssembly(database, `Slab Door`, models.AssemblyTypeDoor, models.StyleFaceFrame, mdfSlab, nil, nil, nil, nil, hinge, false, false, false, 0, 0, 0.3, false, models.PanelTypeFlat, models.FrameJoinerySlab, 0.0); err != nil {
		return err
	}
	if err := ensureAssembly(database, `Matching 5-Piece Shaker Front`, models.AssemblyTypeDrawerFront, models.StyleFaceFrame, poplar, nil, mdfPanel, nil, nil, nil, false, false, false, 0, 0, 0.7, true, models.PanelTypeFlat, models.FrameJoineryCopeAndStick, 0.0); err != nil {
		return err
	}
	if err := ensureAssembly(database, `Solid Slab Front`, models.AssemblyTypeDrawerFront, models.StyleFaceFrame, mdfSlab, nil, nil, nil, nil, nil, false, false, false, 0, 0, 0.25, false, models.PanelTypeFlat, models.FrameJoinerySlab, 0.0); err != nil {
		return err
	}
	if err := ensureAssembly(database, `Outsourced Raw Front`, models.AssemblyTypeDrawerFront, models.StyleFaceFrame, nil, nil, nil, nil, nil, nil, true, false, false, 0, 0.05, 0, false, models.PanelTypeFlat, models.FrameJoineryCopeAndStick, 0.0); err != nil {
		return err
	}
	if err := ensureAssembly(database, `Standard Stapled Melamine (Side-Mount)`, models.AssemblyTypeDrawerBox, models.StyleFaceFrame, melamineCore, melamineBack, nil, nil, nil, sideMount, false, false, true, 0, 0, 0.25, false, models.PanelTypeFlat, models.FrameJoineryCopeAndStick, 0.0); err != nil {
		return err
	}

	// Backfill quotes.drawer_front_assembly_id to the default drawer front.
	if _, err := database.Exec(
		`UPDATE quotes SET drawer_front_assembly_id =
		   (SELECT id FROM construction_assemblies WHERE type = 'drawer_front' AND is_default = 1 ORDER BY id LIMIT 1)
		 WHERE drawer_front_assembly_id IS NULL OR drawer_front_assembly_id = 0`,
	); err != nil {
		return fmt.Errorf("backfill drawer_front_assembly_id: %w", err)
	}

	return nil
}

// migrateDataV4 adds the raised-panel and mitered door/front profiles introduced
// with panel_type / frame_joinery / panel_prep_labor_hours. It runs exactly once
// (guarded by user_version). Existing rows already receive the new columns'
// defaults (flat / cope_and_stick / 0.0) via ALTER TABLE ADD COLUMN.
func migrateDataV4(database *sql.DB) error {
	if err := ensureMaterial(database, `4/4 Superior Alder`, models.RoleFrameLumber, models.UnitBoardFoot, 5.50, 25.0); err != nil {
		return err
	}

	hinge, err := hardwareIDByName(database, `Blum Soft-Close 110 Hinge + Plate`)
	if err != nil {
		return err
	}
	poplar, err := materialIDByName(database, `4/4 Select Poplar (Door Stock)`)
	if err != nil {
		return err
	}
	alder, err := materialIDByName(database, `4/4 Superior Alder`)
	if err != nil {
		return err
	}
	mdfSlab, err := materialIDByName(database, `3/4" MDF (Slab)`)
	if err != nil {
		return err
	}
	mdfPanel, err := materialIDByName(database, `1/4" MDF (Door Panel)`)
	if err != nil {
		return err
	}

	// Door profiles.
	if err := ensureAssembly(database, `Paint-Grade Raised Panel Door`, models.AssemblyTypeDoor, models.StyleFaceFrame, poplar, nil, mdfSlab, nil, nil, hinge, false, false, false, 0, 0, 1.1, false, models.PanelTypeRaisedSheet, models.FrameJoineryCopeAndStick, 0.0); err != nil {
		return err
	}
	if err := ensureAssembly(database, `Stained Alder Raised Panel Door`, models.AssemblyTypeDoor, models.StyleFaceFrame, alder, nil, alder, nil, nil, hinge, false, false, false, 0, 0, 1.1, false, models.PanelTypeRaisedSolid, models.FrameJoineryCopeAndStick, 0.4); err != nil {
		return err
	}
	if err := ensureAssembly(database, `In-House Mitered Shaker Door`, models.AssemblyTypeDoor, models.StyleFaceFrame, poplar, nil, mdfPanel, nil, nil, hinge, false, false, false, 0, 0, 1.5, false, models.PanelTypeFlat, models.FrameJoineryMitered, 0.0); err != nil {
		return err
	}

	// Drawer front profiles.
	if err := ensureAssembly(database, `Matching Raised Panel Front (Paint-Grade)`, models.AssemblyTypeDrawerFront, models.StyleFaceFrame, poplar, nil, mdfSlab, nil, nil, nil, false, false, false, 0, 0, 0.8, false, models.PanelTypeRaisedSheet, models.FrameJoineryCopeAndStick, 0.0); err != nil {
		return err
	}
	if err := ensureAssembly(database, `Matching Raised Panel Front (Stained Solid)`, models.AssemblyTypeDrawerFront, models.StyleFaceFrame, alder, nil, alder, nil, nil, nil, false, false, false, 0, 0, 0.8, false, models.PanelTypeRaisedSolid, models.FrameJoineryCopeAndStick, 0.4); err != nil {
		return err
	}
	if err := ensureAssembly(database, `In-House Mitered Shaker Front`, models.AssemblyTypeDrawerFront, models.StyleFaceFrame, poplar, nil, mdfPanel, nil, nil, nil, false, false, false, 0, 0, 0.9, false, models.PanelTypeFlat, models.FrameJoineryMitered, 0.0); err != nil {
		return err
	}

	return nil
}
