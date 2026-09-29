package store

import (
	"database/sql"
	"fmt"
	"slices"

	"cabcost/internal/models"
)

// Store wraps the SQLite handle and exposes typed CRUD for the app.
type Store struct {
	db *sql.DB
}

// New returns a Store backed by the given database handle.
func New(db *sql.DB) *Store {
	return &Store{db: db}
}

func validRole(role string) error {
	if slices.Contains(models.ValidRoles, role) {
		return nil
	}
	return fmt.Errorf("invalid material role %q", role)
}

func validMaterialUnit(unit string) error {
	if slices.Contains(models.ValidMaterialUnits, unit) {
		return nil
	}
	return fmt.Errorf("invalid material unit %q", unit)
}

func validCategory(category string) error {
	if slices.Contains(models.ValidCategories, category) {
		return nil
	}
	return fmt.Errorf("invalid hardware category %q", category)
}

func validHardwareUnit(unit string) error {
	if slices.Contains(models.ValidHardwareUnits, unit) {
		return nil
	}
	return fmt.Errorf("invalid hardware unit %q", unit)
}
