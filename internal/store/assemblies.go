package store

import (
	"fmt"
	"slices"
	"strings"

	"cabcost/internal/models"
)

// GetAssemblies returns all construction assemblies, optionally filtered by
// assembly type (empty string returns all).
func (s *Store) GetAssemblies(assemblyType string) ([]models.Assembly, error) {
	query := `SELECT id, name, type, construction_style, core_material_id, back_material_id,
		panel_material_id, face_lumber_id, edgeband_id, hardware_id, is_outsourced,
		requires_finish, requires_edgeband, panel_type, frame_joinery, finish_labor_hours,
		prep_labor_hours, panel_prep_labor_hours, build_labor_hours, is_default, created_at
		FROM construction_assemblies`
	args := []any{}

	if assemblyType != "" {
		query += ` WHERE type = ?`
		args = append(args, assemblyType)
	}
	query += ` ORDER BY is_default DESC, name COLLATE NOCASE`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("query construction_assemblies: %w", err)
	}
	defer rows.Close()

	assemblies := []models.Assembly{}
	for rows.Next() {
		var a models.Assembly
		if err := rows.Scan(
			&a.ID, &a.Name, &a.Type, &a.ConstructionStyle,
			&a.CoreMaterialID, &a.BackMaterialID, &a.PanelMaterialID, &a.FaceLumberID, &a.EdgebandID, &a.HardwareID,
			&a.IsOutsourced, &a.RequiresFinish, &a.RequiresEdgeband, &a.PanelType, &a.FrameJoinery, &a.FinishLaborHours,
			&a.PrepLaborHours, &a.PanelPrepLaborHours, &a.BuildLaborHours, &a.IsDefault, &a.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan assembly: %w", err)
		}
		assemblies = append(assemblies, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate assemblies: %w", err)
	}
	return assemblies, nil
}

// SaveAssembly inserts a new assembly (id == 0) or updates an existing one.
func (s *Store) SaveAssembly(a models.Assembly) error {
	if strings.TrimSpace(a.Name) == "" {
		return fmt.Errorf("assembly name is required")
	}
	if !slices.Contains(models.ValidAssemblyTypes, a.Type) {
		return fmt.Errorf("invalid assembly type %q", a.Type)
	}
	if !slices.Contains(models.ValidConstructionStyles, a.ConstructionStyle) {
		return fmt.Errorf("invalid construction style %q", a.ConstructionStyle)
	}
	if !slices.Contains(models.ValidPanelTypes, a.PanelType) {
		return fmt.Errorf("invalid panel type %q", a.PanelType)
	}
	if !slices.Contains(models.ValidFrameJoinery, a.FrameJoinery) {
		return fmt.Errorf("invalid frame joinery %q", a.FrameJoinery)
	}
	if a.PrepLaborHours < 0 || a.BuildLaborHours < 0 || a.PanelPrepLaborHours < 0 {
		return fmt.Errorf("labor hours cannot be negative")
	}

	if a.ID == 0 {
		_, err := s.db.Exec(
			`INSERT INTO construction_assemblies
			 (name, type, construction_style, core_material_id, back_material_id, panel_material_id, face_lumber_id, edgeband_id, hardware_id, is_outsourced, requires_finish, requires_edgeband, panel_type, frame_joinery, finish_labor_hours, prep_labor_hours, panel_prep_labor_hours, build_labor_hours, is_default)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			strings.TrimSpace(a.Name), a.Type, a.ConstructionStyle,
			a.CoreMaterialID, a.BackMaterialID, a.PanelMaterialID, a.FaceLumberID, a.EdgebandID, a.HardwareID,
			a.IsOutsourced, a.RequiresFinish, a.RequiresEdgeband, a.PanelType, a.FrameJoinery, a.FinishLaborHours, a.PrepLaborHours, a.PanelPrepLaborHours, a.BuildLaborHours, a.IsDefault,
		)
		if err != nil {
			return fmt.Errorf("insert assembly: %w", err)
		}
		return nil
	}

	_, err := s.db.Exec(
		`UPDATE construction_assemblies SET
		   name = ?, type = ?, construction_style = ?, core_material_id = ?, back_material_id = ?,
		   panel_material_id = ?, face_lumber_id = ?, edgeband_id = ?, hardware_id = ?, is_outsourced = ?,
		   requires_finish = ?, requires_edgeband = ?, panel_type = ?, frame_joinery = ?, finish_labor_hours = ?,
		   prep_labor_hours = ?, panel_prep_labor_hours = ?, build_labor_hours = ?, is_default = ?
		 WHERE id = ?`,
		strings.TrimSpace(a.Name), a.Type, a.ConstructionStyle,
		a.CoreMaterialID, a.BackMaterialID, a.PanelMaterialID, a.FaceLumberID, a.EdgebandID, a.HardwareID,
		a.IsOutsourced, a.RequiresFinish, a.RequiresEdgeband, a.PanelType, a.FrameJoinery, a.FinishLaborHours, a.PrepLaborHours, a.PanelPrepLaborHours, a.BuildLaborHours, a.IsDefault, a.ID,
	)
	if err != nil {
		return fmt.Errorf("update assembly: %w", err)
	}
	return nil
}

// DeleteAssembly removes an assembly by id.
func (s *Store) DeleteAssembly(id int64) error {
	if _, err := s.db.Exec(`DELETE FROM construction_assemblies WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete assembly: %w", err)
	}
	return nil
}
