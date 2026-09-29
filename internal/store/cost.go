package store

import (
	"database/sql"
	"fmt"
	"math"
	"strings"

	"cabcost/internal/models"
)

// Parametric geometry constants (all linear dimensions in inches).
const (
	sheetSqFt4x8       = 32.0  // usable square feet per 4x8 sheet
	sheetSqFt5x5       = 25.0  // usable square feet per 5x5 sheet
	faceFrameWidthIn   = 1.5   // face frame stile/rail width
	faceFrameLaborHours = 0.3  // pocket-hole / milling labor per box
	drawerBoxHeightIn  = 5.5   // standard drawer box side height
	drawerFrontHeightIn = 6.0  // representative drawer front height
	doorStileWidthIn   = 2.25  // Shaker door stile width
	doorRailWidthIn    = 2.25  // Shaker door rail width
	doorRevealIn       = 1.0   // combined horizontal/vertical reveal
)

const assemblyCols = `id, name, type, construction_style, core_material_id, back_material_id,
	panel_material_id, face_lumber_id, edgeband_id, hardware_id, is_outsourced,
	requires_finish, requires_edgeband, panel_type, frame_joinery, finish_labor_hours,
	prep_labor_hours, panel_prep_labor_hours, build_labor_hours, is_default, created_at`

const materialCols = `id, name, role, unit, unit_cost, waste_percent, created_at`

const hardwareCols = `id, name, category, unit, unit_cost, is_default, created_at`

type rowScanner interface {
	Scan(dest ...any) error
}

func scanAssembly(r rowScanner) (models.Assembly, error) {
	var a models.Assembly
	err := r.Scan(
		&a.ID, &a.Name, &a.Type, &a.ConstructionStyle,
		&a.CoreMaterialID, &a.BackMaterialID, &a.PanelMaterialID, &a.FaceLumberID, &a.EdgebandID, &a.HardwareID,
		&a.IsOutsourced, &a.RequiresFinish, &a.RequiresEdgeband, &a.PanelType, &a.FrameJoinery, &a.FinishLaborHours,
		&a.PrepLaborHours, &a.PanelPrepLaborHours, &a.BuildLaborHours, &a.IsDefault, &a.CreatedAt,
	)
	return a, err
}

func scanMaterial(r rowScanner) (models.Material, error) {
	var m models.Material
	err := r.Scan(&m.ID, &m.Name, &m.Role, &m.Unit, &m.UnitCost, &m.WastePercent, &m.CreatedAt)
	return m, err
}

func scanHardware(r rowScanner) (models.Hardware, error) {
	var h models.Hardware
	err := r.Scan(&h.ID, &h.Name, &h.Category, &h.Unit, &h.UnitCost, &h.IsDefault, &h.CreatedAt)
	return h, err
}

// assemblyByIDOrDefault resolves an assembly by id; id 0 falls back to the
// default (is_default=1) assembly of the given type.
func (s *Store) assemblyByIDOrDefault(id int64, typ string) (models.Assembly, error) {
	if id != 0 {
		a, err := scanAssembly(s.db.QueryRow(`SELECT `+assemblyCols+` FROM construction_assemblies WHERE id = ?`, id))
		if err == sql.ErrNoRows {
			return models.Assembly{}, nil
		}
		return a, err
	}
	a, err := scanAssembly(s.db.QueryRow(
		`SELECT `+assemblyCols+` FROM construction_assemblies WHERE type = ? AND is_default = 1 ORDER BY id LIMIT 1`, typ))
	if err == sql.ErrNoRows {
		return models.Assembly{}, nil
	}
	return a, err
}

func (s *Store) materialByID(id *int64) (models.Material, bool, error) {
	if id == nil || *id == 0 {
		return models.Material{}, false, nil
	}
	m, err := scanMaterial(s.db.QueryRow(`SELECT `+materialCols+` FROM materials WHERE id = ?`, *id))
	if err == sql.ErrNoRows {
		return models.Material{}, false, nil
	}
	if err != nil {
		return models.Material{}, false, err
	}
	return m, true, nil
}

func (s *Store) materialByRole(role string) (models.Material, bool, error) {
	m, err := scanMaterial(s.db.QueryRow(`SELECT `+materialCols+` FROM materials WHERE role = ? ORDER BY id LIMIT 1`, role))
	if err == sql.ErrNoRows {
		return models.Material{}, false, nil
	}
	if err != nil {
		return models.Material{}, false, err
	}
	return m, true, nil
}

func (s *Store) hardwareByID(id *int64) (models.Hardware, bool, error) {
	if id == nil || *id == 0 {
		return models.Hardware{}, false, nil
	}
	h, err := scanHardware(s.db.QueryRow(`SELECT `+hardwareCols+` FROM hardware WHERE id = ?`, *id))
	if err == sql.ErrNoRows {
		return models.Hardware{}, false, nil
	}
	if err != nil {
		return models.Hardware{}, false, err
	}
	return h, true, nil
}

// defaultHardware resolves the default hardware for a category (hinge, slide,
// accessory); prefers is_default=1 and falls back to the first match.
func (s *Store) defaultHardware(category string) (models.Hardware, bool, error) {
	h, err := scanHardware(s.db.QueryRow(
		`SELECT `+hardwareCols+` FROM hardware WHERE category = ? AND is_default = 1 ORDER BY id LIMIT 1`, category))
	if err == nil {
		return h, true, nil
	}
	if err != sql.ErrNoRows {
		return models.Hardware{}, false, err
	}
	h, err = scanHardware(s.db.QueryRow(
		`SELECT `+hardwareCols+` FROM hardware WHERE category = ? ORDER BY id LIMIT 1`, category))
	if err == sql.ErrNoRows {
		return models.Hardware{}, false, nil
	}
	if err != nil {
		return models.Hardware{}, false, err
	}
	return h, true, nil
}

// resolveJobMaterial resolves the material based on the job's species and finish type.
func (s *Store) resolveJobMaterial(role string, woodSpecies string, finishType string, panelType string) (models.Material, bool, error) {
	var m models.Material
	var err error
	_ = m
	_ = err
	
	queryMaterial := func(targetRole, targetSpecies string) (models.Material, bool, error) {
		mat, e := scanMaterial(s.db.QueryRow(`SELECT `+materialCols+` FROM materials WHERE role = ? AND species = ? ORDER BY id LIMIT 1`, targetRole, targetSpecies))
		if e == sql.ErrNoRows {
			return models.Material{}, false, nil
		}
		if e != nil {
			return models.Material{}, false, e
		}
		return mat, true, nil
	}

	queryFrames := func(targetSpecies string) (models.Material, bool, error) {
		mat, e := scanMaterial(s.db.QueryRow(`SELECT `+materialCols+` FROM materials WHERE (role = ? OR role = ?) AND species = ? ORDER BY id LIMIT 1`, models.RoleDoorFrame, models.RoleFrameLumber, targetSpecies))
		if e == sql.ErrNoRows {
			return models.Material{}, false, nil
		}
		if e != nil {
			return models.Material{}, false, e
		}
		return mat, true, nil
	}

	switch role {
	case models.RoleFrameLumber:
		speciesToUse := woodSpecies
		if finishType == models.FinishPainted {
			speciesToUse = models.SpeciesPaintGrade
		}
		return queryMaterial(models.RoleFrameLumber, speciesToUse)

	case models.RoleDoorFrame:
		return queryFrames(woodSpecies)

	case models.RoleDoorPanel:
		if panelType == models.PanelTypeFlat {
			if finishType == models.FinishPainted {
				return queryMaterial(models.RoleDoorPanel, models.SpeciesPaintGrade)
			}
			return queryMaterial(models.RoleDoorPanel, woodSpecies)
		} else if panelType == models.PanelTypeRaisedSheet {
			return queryMaterial(models.RoleSlabSheet, models.SpeciesPaintGrade)
		} else if panelType == models.PanelTypeRaisedSolid {
			return queryFrames(woodSpecies)
		}
	}
	return models.Material{}, false, nil
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

// sheetCost prices square footage of sheet goods, accounting for sheet size.
func sheetCost(m models.Material, sqFt float64) float64 {
	qty := sqFt
	switch m.Unit {
	case models.UnitSheet4x8:
		qty = sqFt / sheetSqFt4x8
	case models.UnitSheet5x5:
		qty = sqFt / sheetSqFt5x5
	}
	return qty * m.UnitCost * (1 + m.WastePercent/100.0)
}

// materialCost prices a quantity expressed in the material's own unit
// (board feet, linear feet, square feet, each) applying waste.
func materialCost(m models.Material, qty float64) float64 {
	return qty * m.UnitCost * (1 + m.WastePercent/100.0)
}

func frontFrameBoardFeet(w, h float64) float64 {
	stileSqIn := 2 * h * doorStileWidthIn
	railSqIn := 2 * (w - 2*doorStileWidthIn) * doorRailWidthIn
	if railSqIn < 0 {
		railSqIn = 0
	}
	return (stileSqIn + railSqIn) / 144.0
}

func frontPanelSqFt(w, h float64) float64 {
	pw := w - 2*doorStileWidthIn
	ph := h - 2*doorRailWidthIn
	if pw < 0 {
		pw = 0
	}
	if ph < 0 {
		ph = 0
	}
	return (pw * ph) / 144.0
}

// loadCabinet resolves a catalog cabinet by SKU.
func (s *Store) loadCabinet(sku string) (models.Cabinet, error) {
	sku = strings.ToUpper(strings.TrimSpace(sku))

	var c models.Cabinet
	err := s.db.QueryRow(
		`SELECT id, sku, name, category, width, height, depth, doors_count, drawers_count, shelves_count, base_assembly_hours, created_at
		 FROM cabinet_catalog WHERE sku = ?`, sku,
	).Scan(
		&c.ID, &c.SKU, &c.Name, &c.Category, &c.Width, &c.Height, &c.Depth,
		&c.DoorsCount, &c.DrawersCount, &c.ShelvesCount, &c.BaseAssemblyHours, &c.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return c, fmt.Errorf("unknown sku %q", sku)
	}
	if err != nil {
		return c, fmt.Errorf("load cabinet: %w", err)
	}
	return c, nil
}

// CalculateCabinetCost produces a full itemized cost breakdown for a catalog
// SKU given the box, door, drawer front, and drawer box assemblies, finish
// state, and edge-detail flag. Zero assembly IDs resolve to their type default.
func (s *Store) CalculateCabinetCost(sku string, woodSpecies string, finishType string, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID int64, isFinished, edgeDetail bool) (models.CabinetCostBreakdown, error) {
	c, err := s.loadCabinet(sku)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	return s.calculateCabinet(c, woodSpecies, finishType, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)
}

// CalculateCabinetCostOverride is like CalculateCabinetCost but lets width,
// height, and depth override the catalog dimensions (0 means "use catalog").
func (s *Store) CalculateCabinetCostOverride(sku string, width, height, depth float64, woodSpecies string, finishType string, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID int64, isFinished, edgeDetail bool) (models.CabinetCostBreakdown, error) {
	c, err := s.loadCabinet(sku)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	if width > 0 {
		c.Width = width
	}
	if height > 0 {
		c.Height = height
	}
	if depth > 0 {
		c.Depth = depth
	}
	return s.calculateCabinet(c, woodSpecies, finishType, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)
}

// calculateCabinet is the shared core of the parametric cost engine.
func (s *Store) calculateCabinet(c models.Cabinet, woodSpecies string, finishType string, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID int64, isFinished, edgeDetail bool) (models.CabinetCostBreakdown, error) {
	box, err := s.assemblyByIDOrDefault(boxAssemblyID, models.AssemblyTypeBox)
	if err != nil {
		return models.CabinetCostBreakdown{}, fmt.Errorf("resolve box assembly: %w", err)
	}
	door, err := s.assemblyByIDOrDefault(doorAssemblyID, models.AssemblyTypeDoor)
	if err != nil {
		return models.CabinetCostBreakdown{}, fmt.Errorf("resolve door assembly: %w", err)
	}
	drawerFront, err := s.assemblyByIDOrDefault(drawerFrontAssemblyID, models.AssemblyTypeDrawerFront)
	if err != nil {
		return models.CabinetCostBreakdown{}, fmt.Errorf("resolve drawer front assembly: %w", err)
	}
	drawerBox, err := s.assemblyByIDOrDefault(drawerBoxAssemblyID, models.AssemblyTypeDrawerBox)
	if err != nil {
		return models.CabinetCostBreakdown{}, fmt.Errorf("resolve drawer box assembly: %w", err)
	}

	settings, err := s.GetShopSettings()
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}

	coreMat, _, err := s.materialByID(box.CoreMaterialID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	backMat, _, err := s.materialByID(box.BackMaterialID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	faceMat, _, err := s.resolveJobMaterial(models.RoleFrameLumber, woodSpecies, finishType, "")
	if faceMat.ID == 0 {
		faceMat, _, err = s.materialByID(box.FaceLumberID)
	}
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	boxEdgebandMat, _, err := s.materialByID(box.EdgebandID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	doorFrameMat, _, err := s.resolveJobMaterial(models.RoleDoorFrame, woodSpecies, finishType, "")
	if doorFrameMat.ID == 0 {
		doorFrameMat, _, err = s.materialByID(door.CoreMaterialID)
	}
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	doorPanelMat, _, err := s.resolveJobMaterial(models.RoleDoorPanel, woodSpecies, finishType, door.PanelType)
	if doorPanelMat.ID == 0 {
		doorPanelMat, _, err = s.materialByID(door.PanelMaterialID)
	}
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	frontFrameMat, _, err := s.resolveJobMaterial(models.RoleDoorFrame, woodSpecies, finishType, "")
	if frontFrameMat.ID == 0 {
		frontFrameMat, _, err = s.materialByID(drawerFront.CoreMaterialID)
	}
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	frontPanelMat, _, err := s.resolveJobMaterial(models.RoleDoorPanel, woodSpecies, finishType, drawerFront.PanelType)
	if frontPanelMat.ID == 0 {
		frontPanelMat, _, err = s.materialByID(drawerFront.PanelMaterialID)
	}
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	drawerSideMat, _, err := s.materialByID(drawerBox.CoreMaterialID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	drawerBottomMat, _, err := s.materialByID(drawerBox.BackMaterialID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	finishMat, _, err := s.materialByRole(models.RoleFinishing)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	edgebandMat, _, err := s.materialByRole(models.RoleEdgeband)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}

	hinge, hasHinge, err := s.hardwareByID(door.HardwareID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	if !hasHinge {
		hinge, hasHinge, err = s.defaultHardware(models.CategoryHinge)
		if err != nil {
			return models.CabinetCostBreakdown{}, err
		}
	}
	slide, hasSlide, err := s.hardwareByID(drawerBox.HardwareID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	pin, hasPin, err := s.defaultHardware(models.CategoryAccessory)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}

	w, h, d := c.Width, c.Height, c.Depth

	var materials []models.CostLine
	var labor []models.CostLine
	var laborHours float64

	addMaterial := func(label string, amt float64) {
		materials = append(materials, models.CostLine{Label: label, Amount: round2(amt)})
	}
	addLabor := func(label string, hours float64) {
		labor = append(labor, models.CostLine{Label: label, Amount: round2(hours * settings.LoadedLaborRate)})
		laborHours += hours
	}

	// 1. Carcass & shelving.
	sidesSqIn := 2 * h * d
	var decksSqIn float64
	switch c.Category {
	case models.CategoryBase, models.CategoryVanity:
		decksSqIn = w*d + 2*(w*4.0) // bottom deck + 2 stretchers (4" deep)
	default: // wall, tall
		decksSqIn = 2 * w * d // top + bottom decks
	}
	shelvesSqIn := float64(c.ShelvesCount) * w * (d - 1)
	if shelvesSqIn < 0 {
		shelvesSqIn = 0
	}
	coreSqFt := (sidesSqIn + decksSqIn + shelvesSqIn) / 144.0
	if coreMat.ID != 0 {
		addMaterial("Carcass & Shelving", sheetCost(coreMat, coreSqFt))
	}

	// 2. Backing.
	if backMat.ID != 0 {
		addMaterial("Backing", sheetCost(backMat, (w*h)/144.0))
	}

	// 3. Face frame vs. edgebanding.
	if box.ConstructionStyle == models.StyleFrameless {
		if boxEdgebandMat.ID != 0 {
			linFt := (2*h + w + float64(c.ShelvesCount)*w) / 12.0
			addMaterial("Edgeband", materialCost(boxEdgebandMat, linFt))
			edgebandHours := linFt * settings.ManualEdgebandMinPerFt / 60.0
			addLabor("Edgebanding", edgebandHours)
		}
	} else {
		if faceMat.ID != 0 {
			linIn := 2*h + 2*(w-3)
			boardFeet := (linIn * faceFrameWidthIn) / 144.0
			addMaterial("Face Frame Lumber", materialCost(faceMat, boardFeet))
		}
		addLabor("Face Frame", faceFrameLaborHours)
	}

	// 4. Doors.
	if c.DoorsCount > 0 {
		doorW := (w - doorRevealIn) / float64(c.DoorsCount)
		doorH := h - doorRevealIn
		if door.IsOutsourced {
			addLabor("Doors (Prep & Bore)", door.PrepLaborHours*float64(c.DoorsCount))
		} else if doorFrameMat.Role == models.RoleSlabSheet {
			slabSqFt := float64(c.DoorsCount) * (doorW * doorH) / 144.0
			addMaterial("Doors (Slab)", sheetCost(doorFrameMat, slabSqFt))
			if edgebandMat.ID != 0 {
				linFt := float64(c.DoorsCount) * (2*doorW + 2*doorH) / 12.0
				addMaterial("Door Edgeband", materialCost(edgebandMat, linFt))
			}
			addLabor("Doors", door.BuildLaborHours*float64(c.DoorsCount))
		} else {
			frameBF := float64(c.DoorsCount) * frontFrameBoardFeet(doorW, doorH)
			panelSqFt := float64(c.DoorsCount) * frontPanelSqFt(doorW, doorH)
			if doorFrameMat.ID != 0 {
				addMaterial("Door Frame Lumber", materialCost(doorFrameMat, frameBF))
			}
			switch door.PanelType {
			case models.PanelTypeRaisedSolid:
				if doorPanelMat.ID != 0 {
					addMaterial("Door Panels (Solid)", materialCost(doorPanelMat, panelSqFt))
				}
				if door.PanelPrepLaborHours > 0 {
					addLabor("Panel Glue & Clamp", door.PanelPrepLaborHours*float64(c.DoorsCount))
				}
			case models.PanelTypeRaisedSheet:
				if doorPanelMat.ID != 0 {
					addMaterial("Door Panels (Raised)", sheetCost(doorPanelMat, panelSqFt))
				}
			default:
				if doorPanelMat.ID != 0 {
					addMaterial("Door Panels", sheetCost(doorPanelMat, panelSqFt))
				}
			}
			addLabor("Doors", door.BuildLaborHours*float64(c.DoorsCount))
		}
	}

	// 5. Drawer fronts.
	if c.DrawersCount > 0 {
		frontW := w - doorRevealIn
		frontH := drawerFrontHeightIn
		if drawerFront.IsOutsourced {
			addLabor("Drawer Fronts (Prep)", drawerFront.PrepLaborHours*float64(c.DrawersCount))
		} else if frontFrameMat.Role == models.RoleSlabSheet {
			slabSqFt := float64(c.DrawersCount) * (frontW * frontH) / 144.0
			addMaterial("Drawer Fronts (Slab)", sheetCost(frontFrameMat, slabSqFt))
			if edgebandMat.ID != 0 {
				linFt := float64(c.DrawersCount) * (2*frontW + 2*frontH) / 12.0
				addMaterial("Drawer Front Edgeband", materialCost(edgebandMat, linFt))
			}
			addLabor("Drawer Fronts", drawerFront.BuildLaborHours*float64(c.DrawersCount))
		} else {
			frameBF := float64(c.DrawersCount) * frontFrameBoardFeet(frontW, frontH)
			panelSqFt := float64(c.DrawersCount) * frontPanelSqFt(frontW, frontH)
			if frontFrameMat.ID != 0 {
				addMaterial("Drawer Front Frame Lumber", materialCost(frontFrameMat, frameBF))
			}
			switch drawerFront.PanelType {
			case models.PanelTypeRaisedSolid:
				if frontPanelMat.ID != 0 {
					addMaterial("Drawer Front Panels (Solid)", materialCost(frontPanelMat, panelSqFt))
				}
				if drawerFront.PanelPrepLaborHours > 0 {
					addLabor("Panel Glue & Clamp", drawerFront.PanelPrepLaborHours*float64(c.DrawersCount))
				}
			case models.PanelTypeRaisedSheet:
				if frontPanelMat.ID != 0 {
					addMaterial("Drawer Front Panels (Raised)", sheetCost(frontPanelMat, panelSqFt))
				}
			default:
				if frontPanelMat.ID != 0 {
					addMaterial("Drawer Front Panels", sheetCost(frontPanelMat, panelSqFt))
				}
			}
			addLabor("Drawer Fronts", drawerFront.BuildLaborHours*float64(c.DrawersCount))
		}
	}

	// 5b. Project-wide edge detail: perimeter routing + profile hand-sanding
	// across all doors and drawer fronts.
	if edgeDetail && (c.DoorsCount > 0 || c.DrawersCount > 0) {
		addLabor("Door Edge Detail", 0.15*float64(c.DoorsCount+c.DrawersCount))
	}

	// 6. Drawer boxes.
	if c.DrawersCount > 0 {
		if drawerBox.IsOutsourced {
			addLabor("Drawer Boxes (Clip Mount)", drawerBox.PrepLaborHours*float64(c.DrawersCount))
		} else {
			boxW := w - 2
			boxD := d - 2
			if boxW < 0 {
				boxW = 0
			}
			if boxD < 0 {
				boxD = 0
			}
			sidesSqIn := 2 * boxD * drawerBoxHeightIn
			frontBackSqIn := 2 * boxW * drawerBoxHeightIn
			perBoxCoreSqFt := (sidesSqIn + frontBackSqIn) / 144.0
			perBoxBottomSqFt := (boxW * boxD) / 144.0
			if drawerSideMat.ID != 0 {
				addMaterial("Drawer Boxes", sheetCost(drawerSideMat, perBoxCoreSqFt*float64(c.DrawersCount)))
			}
			if drawerBottomMat.ID != 0 {
				addMaterial("Drawer Bottoms", sheetCost(drawerBottomMat, perBoxBottomSqFt*float64(c.DrawersCount)))
			}
			addLabor("Drawer Boxes", drawerBox.BuildLaborHours*float64(c.DrawersCount))

			if drawerBox.RequiresEdgeband && edgebandMat.ID != 0 {
				linFt := float64(c.DrawersCount) * (2*boxW + 2*boxD) / 12.0
				addMaterial("Drawer Box Edgeband", materialCost(edgebandMat, linFt))
				addLabor("Drawer Box Edgebanding", linFt*settings.ManualEdgebandMinPerFt/60.0)
			}
			if drawerBox.RequiresFinish && finishMat.ID != 0 {
				areaSqIn := 2*(boxW*boxD) + 2*(boxW*drawerBoxHeightIn) + 2*(boxD*drawerBoxHeightIn)
				areaSqFt := float64(c.DrawersCount) * areaSqIn / 144.0
				addMaterial("Drawer Box Finish", materialCost(finishMat, areaSqFt))
				addLabor("Drawer Box Finishing", drawerBox.FinishLaborHours*float64(c.DrawersCount))
			}
		}
	}

	// 7. Hardware.
	if hasHinge && c.DoorsCount > 0 {
		addMaterial("Hinges", float64(c.DoorsCount*2)*hinge.UnitCost)
	}
	if hasSlide && c.DrawersCount > 0 {
		addMaterial("Drawer Slides", float64(c.DrawersCount)*slide.UnitCost)
	}
	if hasPin && c.ShelvesCount > 0 {
		addMaterial("Shelf Pins", float64(c.ShelvesCount*4)*pin.UnitCost)
	}

	// 8. Exterior finishing.
	if isFinished && finishMat.ID != 0 {
		frontSqFt := (w * h) / 144.0
		var faceSqFt float64
		if c.DoorsCount > 0 {
			doorW := (w - doorRevealIn) / float64(c.DoorsCount)
			doorH := h - doorRevealIn
			faceSqFt += float64(c.DoorsCount) * (doorW * doorH) / 144.0
		}
		if c.DrawersCount > 0 {
			faceSqFt += float64(c.DrawersCount) * ((w - doorRevealIn) * drawerFrontHeightIn) / 144.0
		}
		finishSqFt := frontSqFt + faceSqFt
		addMaterial("Finishing Supplies", materialCost(finishMat, finishSqFt))
		labor = append(labor, models.CostLine{
			Label:  "Finishing",
			Amount: round2(finishSqFt * settings.FinishingLaborRateSqft),
		})
	}

	// 9. Rollup.
	var materialsSubtotal float64
	for _, m := range materials {
		materialsSubtotal += m.Amount
	}
	miscSupplies := materialsSubtotal * settings.ShopSuppliesPercent / 100.0
	if miscSupplies != 0 {
		addMaterial("Misc Supplies", miscSupplies)
	}

	var materialsTotal float64
	for _, m := range materials {
		materialsTotal += m.Amount
	}

	var laborTotal float64
	for _, l := range labor {
		laborTotal += l.Amount
	}
	assemblyLabor := c.BaseAssemblyHours * settings.LoadedLaborRate
	laborTotal += assemblyLabor
	if assemblyLabor != 0 {
		labor = append(labor, models.CostLine{Label: "Assembly", Amount: round2(assemblyLabor)})
		laborHours += c.BaseAssemblyHours
	}

	totalShopCost := materialsTotal + laborTotal
	marginPercent := settings.DefaultMarginPercent
	var suggestedRetail float64
	if marginPercent < 100 {
		suggestedRetail = totalShopCost / (1 - marginPercent/100.0)
	} else {
		suggestedRetail = totalShopCost
	}

	return models.CabinetCostBreakdown{
		SKU:             c.SKU,
		Materials:       materials,
		MaterialsTotal:  round2(materialsTotal),
		Labor:           labor,
		LaborHours:      round2(laborHours),
		LaborTotal:      round2(laborTotal),
		TotalShopCost:   round2(totalShopCost),
		SuggestedRetail: round2(suggestedRetail),
		MarginPercent:   round2(marginPercent),
	}, nil
}
