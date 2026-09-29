package store

import (
	"fmt"
	"slices"
	"strings"

	"cabcost/internal/models"
)

// GetCabinetCatalog returns all cabinet SKUs ordered by SKU.
func (s *Store) GetCabinetCatalog() ([]models.Cabinet, error) {
	rows, err := s.db.Query(
		`SELECT id, sku, name, category, width, height, depth, doors_count, drawers_count, shelves_count, base_assembly_hours, created_at
		 FROM cabinet_catalog ORDER BY sku COLLATE NOCASE`)
	if err != nil {
		return nil, fmt.Errorf("query cabinet_catalog: %w", err)
	}
	defer rows.Close()

	cabinets := []models.Cabinet{}
	for rows.Next() {
		var c models.Cabinet
		if err := rows.Scan(
			&c.ID, &c.SKU, &c.Name, &c.Category, &c.Width, &c.Height, &c.Depth,
			&c.DoorsCount, &c.DrawersCount, &c.ShelvesCount, &c.BaseAssemblyHours, &c.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan cabinet: %w", err)
		}
		cabinets = append(cabinets, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate cabinets: %w", err)
	}
	return cabinets, nil
}

// SaveCabinet inserts a new cabinet (id == 0) or updates an existing one.
func (s *Store) SaveCabinet(c models.Cabinet) error {
	if strings.TrimSpace(c.SKU) == "" {
		return fmt.Errorf("sku is required")
	}
	if strings.TrimSpace(c.Name) == "" {
		return fmt.Errorf("name is required")
	}
	if !slices.Contains(models.ValidCabinetCategories, c.Category) {
		return fmt.Errorf("invalid cabinet category %q", c.Category)
	}
	if c.Width <= 0 || c.Height <= 0 || c.Depth <= 0 {
		return fmt.Errorf("width, height, and depth must be positive")
	}

	if c.ID == 0 {
		_, err := s.db.Exec(
			`INSERT INTO cabinet_catalog (sku, name, category, width, height, depth, doors_count, drawers_count, shelves_count, base_assembly_hours)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			strings.ToUpper(strings.TrimSpace(c.SKU)), strings.TrimSpace(c.Name), c.Category,
			c.Width, c.Height, c.Depth, c.DoorsCount, c.DrawersCount, c.ShelvesCount, c.BaseAssemblyHours,
		)
		if err != nil {
			return fmt.Errorf("insert cabinet: %w", err)
		}
		return nil
	}

	_, err := s.db.Exec(
		`UPDATE cabinet_catalog SET
		   sku = ?, name = ?, category = ?, width = ?, height = ?, depth = ?,
		   doors_count = ?, drawers_count = ?, shelves_count = ?, base_assembly_hours = ?
		 WHERE id = ?`,
		strings.ToUpper(strings.TrimSpace(c.SKU)), strings.TrimSpace(c.Name), c.Category,
		c.Width, c.Height, c.Depth, c.DoorsCount, c.DrawersCount, c.ShelvesCount, c.BaseAssemblyHours, c.ID,
	)
	if err != nil {
		return fmt.Errorf("update cabinet: %w", err)
	}
	return nil
}

// DeleteCabinet removes a cabinet by id.
func (s *Store) DeleteCabinet(id int64) error {
	if _, err := s.db.Exec(`DELETE FROM cabinet_catalog WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete cabinet: %w", err)
	}
	return nil
}
