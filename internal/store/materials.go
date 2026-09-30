package store

import (
	"fmt"
	"strings"

	"cabcost/internal/models"
)

// GetMaterials returns all materials ordered by name.
func (s *Store) GetMaterials() ([]models.Material, error) {
	rows, err := s.db.Query(
		`SELECT id, name, role, species, unit, unit_cost, waste_percent, created_at
		 FROM materials ORDER BY name COLLATE NOCASE`)
	if err != nil {
		return nil, fmt.Errorf("query materials: %w", err)
	}
	defer rows.Close()

	materials := []models.Material{}
	for rows.Next() {
		var m models.Material
		if err := rows.Scan(&m.ID, &m.Name, &m.Role, &m.Species, &m.Unit, &m.UnitCost, &m.WastePercent, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan material: %w", err)
		}
		materials = append(materials, m)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate materials: %w", err)
	}
	return materials, nil
}

// SaveMaterial inserts a new material (id == 0) or updates an existing one.
func (s *Store) SaveMaterial(m models.Material) error {
	if strings.TrimSpace(m.Name) == "" {
		return fmt.Errorf("material name is required")
	}
	if err := validRole(m.Role); err != nil {
		return err
	}
	if err := validMaterialUnit(m.Unit); err != nil {
		return err
	}

	if m.ID == 0 {
		_, err := s.db.Exec(
			`INSERT INTO materials (name, role, unit, unit_cost, waste_percent) VALUES (?, ?, ?, ?, ?)`,
			strings.TrimSpace(m.Name), m.Role, m.Unit, m.UnitCost, m.WastePercent,
		)
		if err != nil {
			return fmt.Errorf("insert material: %w", err)
		}
		return nil
	}

	_, err := s.db.Exec(
		`UPDATE materials SET name = ?, role = ?, unit = ?, unit_cost = ?, waste_percent = ? WHERE id = ?`,
		strings.TrimSpace(m.Name), m.Role, m.Unit, m.UnitCost, m.WastePercent, m.ID,
	)
	if err != nil {
		return fmt.Errorf("update material: %w", err)
	}
	return nil
}

// DeleteMaterial removes a material by id.
func (s *Store) DeleteMaterial(id int64) error {
	if _, err := s.db.Exec(`DELETE FROM materials WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete material: %w", err)
	}
	return nil
}
