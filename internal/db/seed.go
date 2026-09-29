package db

import (
	"database/sql"
	"fmt"

	"cabcost/internal/models"
)

type seedMaterial struct {
	name   string
	role   string
	species string
	unit   string
	cost   float64
	waste  float64
}

type seedHardware struct {
	name      string
	category  string
	unit      string
	cost      float64
	isDefault bool
}

var seedMaterials = []seedMaterial{
	{`1/2" Prefinished Birch Plywood`, models.RoleBoxCore, models.SpeciesUniversal, models.UnitSheet4x8, 58.00, 15.0},
	{`5/8" White Melamine`, models.RoleBoxCore, models.SpeciesUniversal, models.UnitSheet4x8, 42.00, 15.0},
	{`3/4" Prefinished Birch Plywood`, models.RoleBoxCore, models.SpeciesUniversal, models.UnitSheet4x8, 75.00, 15.0},
	{`1/4" Prefinished Birch Plywood`, models.RoleBoxBack, models.SpeciesUniversal, models.UnitSheet4x8, 42.00, 10.0},
	{`1/4" White Hardboard / Melamine Back`, models.RoleBoxBack, models.SpeciesUniversal, models.UnitSheet4x8, 24.00, 10.0},
	{`4/4 Select Poplar (Paint-Grade)`, models.RoleFrameLumber, models.SpeciesPaintGrade, models.UnitBoardFoot, 4.00, 20.0},
	{`4/4 Superior Alder`, models.RoleFrameLumber, models.SpeciesAlder, models.UnitBoardFoot, 5.50, 25.0},
	{`4/4 Select Poplar (Door Stock)`, models.RoleDoorFrame, models.SpeciesPaintGrade, models.UnitBoardFoot, 4.25, 20.0},
	{`1/4" MDF (Door Panel)`, models.RoleDoorPanel, models.SpeciesPaintGrade, models.UnitSheet4x8, 32.00, 10.0},
	{`5/8" Prefinished Baltic Birch`, models.RoleDrawerSide, models.SpeciesUniversal, models.UnitSheet4x8, 68.00, 15.0},
	{`1/2" White Melamine`, models.RoleDrawerSide, models.SpeciesUniversal, models.UnitSheet4x8, 36.00, 15.0},
	{`1/2" 5x5 9-Ply Russian Birch`, models.RoleDrawerSide, models.SpeciesUniversal, models.UnitSheet5x5, 38.00, 15.0},
	{`3/4" MDF (Slab)`, models.RoleSlabSheet, models.SpeciesPaintGrade, models.UnitSheet4x8, 48.00, 15.0},
	{`White PVC Edgeband (15/16")`, models.RoleEdgeband, models.SpeciesUniversal, models.UnitLinearFoot, 0.18, 10.0},
	{`Post-Cat Conversion Varnish / Paint`, models.RoleFinishing, models.SpeciesUniversal, models.UnitSqFt, 1.50, 15.0},
}

var seedHardwareItems = []seedHardware{
	{`Blum Soft-Close 110 Hinge + Plate`, models.CategoryHinge, models.HUnitEach, 4.25, true},
	{`Blum 21" Undermount Soft-Close Slides (Pair)`, models.CategorySlide, models.HUnitPair, 28.50, true},
	{`Side-Mount Ball Bearing Slides 22" (Pair)`, models.CategorySlide, models.HUnitPair, 9.50, false},
	{`5mm Metal Shelf Pins`, models.CategoryAccessory, models.HUnitEach, 0.15, true},
}

func seed(database *sql.DB) error {
	var count int
	if err := database.QueryRow(`SELECT COUNT(*) FROM materials`).Scan(&count); err != nil {
		return fmt.Errorf("count materials: %w", err)
	}
	if count == 0 {
		for _, m := range seedMaterials {
			if _, err := database.Exec(
				`INSERT INTO materials (name, role, species, unit, unit_cost, waste_percent) VALUES (?, ?, ?, ?, ?, ?)`,
				m.name, m.role, m.species, m.unit, m.cost, m.waste,
			); err != nil {
				return fmt.Errorf("seed material %q: %w", m.name, err)
			}
		}
	}

	if err := database.QueryRow(`SELECT COUNT(*) FROM hardware`).Scan(&count); err != nil {
		return fmt.Errorf("count hardware: %w", err)
	}
	if count == 0 {
		for _, h := range seedHardwareItems {
			if _, err := database.Exec(
				`INSERT INTO hardware (name, category, unit, unit_cost, is_default) VALUES (?, ?, ?, ?, ?)`,
				h.name, h.category, h.unit, h.cost, h.isDefault,
			); err != nil {
				return fmt.Errorf("seed hardware %q: %w", h.name, err)
			}
		}
	}

	if err := database.QueryRow(`SELECT COUNT(*) FROM shop_settings`).Scan(&count); err != nil {
		return fmt.Errorf("count shop_settings: %w", err)
	}
	if count == 0 {
		if _, err := database.Exec(
			`INSERT INTO shop_settings (loaded_labor_rate, finishing_labor_rate_sqft, manual_edgeband_min_per_ft, default_margin_percent, shop_supplies_percent)
			 VALUES (55.00, 4.00, 1.5, 30.0, 3.0)`,
		); err != nil {
			return fmt.Errorf("seed shop_settings: %w", err)
		}
	}

	if err := seedAssemblies(database); err != nil {
		return fmt.Errorf("seed construction_assemblies: %w", err)
	}

	if err := seedCabinetCatalog(database); err != nil {
		return fmt.Errorf("seed cabinet_catalog: %w", err)
	}

	return nil
}

type seedAssembly struct {
	name            string
	assemblyType    string
	style           string
	core            string
	back            string
	panel           string
	faceLumber      string
	edgeband        string
	hardware        string
	isOutsourced    bool
	requiresFinish  bool
	requiresEdgeband bool
	panelType       string
	frameJoinery    string
	finishLabor     float64
	prepLabor       float64
	panelPrepLabor  float64
	buildLabor      float64
	isDefault       bool
}

var seedAssemblyItems = []seedAssembly{
	{
		name:         `Face Frame Box`,
		assemblyType: models.AssemblyTypeBox,
		style:        models.StyleFaceFrame,
		core:         `1/2" Prefinished Birch Plywood`,
		back:         `1/4" Prefinished Birch Plywood`,
		faceLumber:   `4/4 Select Poplar (Paint-Grade)`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		buildLabor:   0.0,
		isDefault:    true,
	},
	{
		name:         `Frameless Melamine Box`,
		assemblyType: models.AssemblyTypeBox,
		style:        models.StyleFrameless,
		core:         `5/8" White Melamine`,
		back:         `1/4" White Hardboard / Melamine Back`,
		edgeband:     `White PVC Edgeband (15/16")`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		buildLabor:   0.0,
		isDefault:    false,
	},
	{
		name:         `5-Piece Shaker Door`,
		assemblyType: models.AssemblyTypeDoor,
		style:        models.StyleFaceFrame,
		core:         `4/4 Select Poplar (Door Stock)`,
		panel:        `1/4" MDF (Door Panel)`,
		hardware:     `Blum Soft-Close 110 Hinge + Plate`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: false,
		buildLabor:   0.9,
		isDefault:    true,
	},
	{
		name:           `Solid Raised Panel Door`,
		assemblyType:   models.AssemblyTypeDoor,
		style:          models.StyleFaceFrame,
		core:           `4/4 Superior Alder`,
		panel:          `4/4 Superior Alder`,
		hardware:       `Blum Soft-Close 110 Hinge + Plate`,
		panelType:      models.PanelTypeRaisedSolid,
		frameJoinery:   models.FrameJoineryCopeAndStick,
		isOutsourced:   false,
		panelPrepLabor: 0.4,
		buildLabor:     1.1,
		isDefault:      false,
	},
	{
		name:         `MDF Raised Panel Door`,
		assemblyType: models.AssemblyTypeDoor,
		style:        models.StyleFaceFrame,
		core:         `4/4 Select Poplar (Door Stock)`,
		panel:        `3/4" MDF (Slab)`,
		hardware:     `Blum Soft-Close 110 Hinge + Plate`,
		panelType:    models.PanelTypeRaisedSheet,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: false,
		buildLabor:   1.1,
		isDefault:    false,
	},
	{
		name:         `Slab Door`,
		assemblyType: models.AssemblyTypeDoor,
		style:        models.StyleFaceFrame,
		core:         `3/4" MDF (Slab)`,
		hardware:     `Blum Soft-Close 110 Hinge + Plate`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoinerySlab,
		isOutsourced: false,
		buildLabor:   0.3,
		isDefault:    false,
	},
	{
		name:         `Outsourced Raw Door`,
		assemblyType: models.AssemblyTypeDoor,
		style:        models.StyleFaceFrame,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: true,
		prepLabor:    0.08,
		isDefault:    false,
	},
	{
		name:         `Matching 5-Piece Shaker Front`,
		assemblyType: models.AssemblyTypeDrawerFront,
		style:        models.StyleFaceFrame,
		core:         `4/4 Select Poplar (Door Stock)`,
		panel:        `1/4" MDF (Door Panel)`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: false,
		buildLabor:   0.7,
		isDefault:    true,
	},
	{
		name:         `Solid Slab Front`,
		assemblyType: models.AssemblyTypeDrawerFront,
		style:        models.StyleFaceFrame,
		core:         `3/4" MDF (Slab)`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoinerySlab,
		isOutsourced: false,
		buildLabor:   0.25,
		isDefault:    false,
	},
	{
		name:         `Outsourced Raw Front`,
		assemblyType: models.AssemblyTypeDrawerFront,
		style:        models.StyleFaceFrame,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: true,
		prepLabor:    0.05,
		isDefault:    false,
	},
	{
		name:             `5/8" Dovetail Birch (Undermount)`,
		assemblyType:     models.AssemblyTypeDrawerBox,
		style:            models.StyleFaceFrame,
		core:             `1/2" 5x5 9-Ply Russian Birch`,
		back:             `1/4" Prefinished Birch Plywood`,
		hardware:         `Blum 21" Undermount Soft-Close Slides (Pair)`,
		isOutsourced:     false,
		requiresFinish:   true,
		requiresEdgeband: false,
		panelType:        models.PanelTypeFlat,
		frameJoinery:     models.FrameJoineryCopeAndStick,
		finishLabor:      0.1,
		buildLabor:       0.4,
		isDefault:        true,
	},
	{
		name:             `Standard Stapled Melamine (Side-Mount)`,
		assemblyType:     models.AssemblyTypeDrawerBox,
		style:            models.StyleFaceFrame,
		core:             `5/8" White Melamine`,
		back:             `1/4" White Hardboard / Melamine Back`,
		hardware:         `Side-Mount Ball Bearing Slides 22" (Pair)`,
		isOutsourced:     false,
		requiresFinish:   false,
		requiresEdgeband: true,
		panelType:        models.PanelTypeFlat,
		frameJoinery:     models.FrameJoineryCopeAndStick,
		finishLabor:      0.0,
		buildLabor:       0.25,
		isDefault:        false,
	},
	{
		name:         `Outsourced / Buyout Drawer Box`,
		assemblyType: models.AssemblyTypeDrawerBox,
		style:        models.StyleFaceFrame,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: true,
		prepLabor:    0.08,
		isDefault:    false,
	},
}

// materialIDByName resolves a material's id by exact name match, or nil.
func materialIDByName(database *sql.DB, name string) (*int64, error) {
	if name == "" {
		return nil, nil
	}
	var id int64
	err := database.QueryRow(`SELECT id FROM materials WHERE name = ?`, name).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &id, nil
}

// hardwareIDByName resolves a hardware item's id by exact name match, or nil.
func hardwareIDByName(database *sql.DB, name string) (*int64, error) {
	if name == "" {
		return nil, nil
	}
	var id int64
	err := database.QueryRow(`SELECT id FROM hardware WHERE name = ?`, name).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &id, nil
}

func seedAssemblies(database *sql.DB) error {
	var count int
	if err := database.QueryRow(`SELECT COUNT(*) FROM construction_assemblies`).Scan(&count); err != nil {
		return fmt.Errorf("count construction_assemblies: %w", err)
	}
	if count > 0 {
		return nil
	}

	for _, a := range seedAssemblyItems {
		core, err := materialIDByName(database, a.core)
		if err != nil {
			return fmt.Errorf("resolve core material for %q: %w", a.name, err)
		}
		back, err := materialIDByName(database, a.back)
		if err != nil {
			return fmt.Errorf("resolve back material for %q: %w", a.name, err)
		}
		panel, err := materialIDByName(database, a.panel)
		if err != nil {
			return fmt.Errorf("resolve panel material for %q: %w", a.name, err)
		}
		faceLumber, err := materialIDByName(database, a.faceLumber)
		if err != nil {
			return fmt.Errorf("resolve face lumber for %q: %w", a.name, err)
		}
		edgeband, err := materialIDByName(database, a.edgeband)
		if err != nil {
			return fmt.Errorf("resolve edgeband for %q: %w", a.name, err)
		}
		hardware, err := hardwareIDByName(database, a.hardware)
		if err != nil {
			return fmt.Errorf("resolve hardware for %q: %w", a.name, err)
		}

		if _, err := database.Exec(
			`INSERT INTO construction_assemblies
			 (name, type, construction_style, core_material_id, back_material_id, panel_material_id, face_lumber_id, edgeband_id, hardware_id, is_outsourced, requires_finish, requires_edgeband, panel_type, frame_joinery, finish_labor_hours, prep_labor_hours, panel_prep_labor_hours, build_labor_hours, is_default)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			a.name, a.assemblyType, a.style, core, back, panel, faceLumber, edgeband, hardware,
			a.isOutsourced, a.requiresFinish, a.requiresEdgeband, a.panelType, a.frameJoinery, a.finishLabor, a.prepLabor, a.panelPrepLabor, a.buildLabor, a.isDefault,
		); err != nil {
			return fmt.Errorf("seed assembly %q: %w", a.name, err)
		}
	}
	return nil
}

type seedCabinet struct {
	sku               string
	name              string
	category          string
	width             float64
	height            float64
	depth             float64
	doors             int
	drawers           int
	shelves           int
	baseAssemblyHours float64
}

var seedCabinets = []seedCabinet{
	{`B36`, `36" Base Cabinet`, models.CategoryBase, 36.0, 34.5, 24.0, 2, 1, 1, 2.2},
	{`DB18-4`, `18" Four-Drawer Base`, models.CategoryBase, 18.0, 34.5, 24.0, 0, 4, 0, 3.2},
	{`SB36`, `36" Sink Base Cabinet`, models.CategoryBase, 36.0, 34.5, 24.0, 2, 0, 0, 1.8},
	{`W3030`, `30" Wall Cabinet`, models.CategoryWall, 30.0, 30.0, 12.0, 2, 0, 2, 1.5},
	{`U2484`, `24" Utility Tall Cabinet`, models.CategoryTall, 24.0, 84.0, 24.0, 2, 0, 4, 3.5},
}

func seedCabinetCatalog(database *sql.DB) error {
	var count int
	if err := database.QueryRow(`SELECT COUNT(*) FROM cabinet_catalog`).Scan(&count); err != nil {
		return fmt.Errorf("count cabinet_catalog: %w", err)
	}
	if count > 0 {
		return nil
	}

	for _, c := range seedCabinets {
		if _, err := database.Exec(
			`INSERT INTO cabinet_catalog
			 (sku, name, category, width, height, depth, doors_count, drawers_count, shelves_count, base_assembly_hours)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			c.sku, c.name, c.category, c.width, c.height, c.depth, c.doors, c.drawers, c.shelves, c.baseAssemblyHours,
		); err != nil {
			return fmt.Errorf("seed cabinet %q: %w", c.sku, err)
		}
	}
	return nil
}
