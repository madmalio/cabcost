package store

import (
	"fmt"
	"strings"

	"cabcost/internal/models"
)

// GetHardware returns all hardware ordered by name.
func (s *Store) GetHardware() ([]models.Hardware, error) {
	rows, err := s.db.Query(
		`SELECT id, name, category, unit, unit_cost, is_default, created_at
		 FROM hardware ORDER BY name COLLATE NOCASE`)
	if err != nil {
		return nil, fmt.Errorf("query hardware: %w", err)
	}
	defer rows.Close()

	hardware := []models.Hardware{}
	for rows.Next() {
		var h models.Hardware
		if err := rows.Scan(&h.ID, &h.Name, &h.Category, &h.Unit, &h.UnitCost, &h.IsDefault, &h.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan hardware: %w", err)
		}
		hardware = append(hardware, h)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate hardware: %w", err)
	}
	return hardware, nil
}

// SaveHardware inserts new hardware (id == 0) or updates existing hardware.
func (s *Store) SaveHardware(h models.Hardware) error {
	if strings.TrimSpace(h.Name) == "" {
		return fmt.Errorf("hardware name is required")
	}
	if err := validCategory(h.Category); err != nil {
		return err
	}
	if err := validHardwareUnit(h.Unit); err != nil {
		return err
	}

	if h.ID == 0 {
		_, err := s.db.Exec(
			`INSERT INTO hardware (name, category, unit, unit_cost, is_default) VALUES (?, ?, ?, ?, ?)`,
			strings.TrimSpace(h.Name), h.Category, h.Unit, h.UnitCost, h.IsDefault,
		)
		if err != nil {
			return fmt.Errorf("insert hardware: %w", err)
		}
		return nil
	}

	_, err := s.db.Exec(
		`UPDATE hardware SET name = ?, category = ?, unit = ?, unit_cost = ?, is_default = ? WHERE id = ?`,
		strings.TrimSpace(h.Name), h.Category, h.Unit, h.UnitCost, h.IsDefault, h.ID,
	)
	if err != nil {
		return fmt.Errorf("update hardware: %w", err)
	}
	return nil
}

// DeleteHardware removes hardware by id.
func (s *Store) DeleteHardware(id int64) error {
	if _, err := s.db.Exec(`DELETE FROM hardware WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete hardware: %w", err)
	}
	return nil
}
