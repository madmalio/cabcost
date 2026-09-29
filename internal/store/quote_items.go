package store

import (
	"fmt"
	"slices"
	"strings"

	"cabcost/internal/models"
)

// AddQuoteCabinet inserts a new custom cabinet line item.
func (s *Store) AddQuoteCabinet(item models.QuoteCabinet) error {
	if strings.TrimSpace(item.CabinetSKU) == "" {
		return fmt.Errorf("cabinet SKU is required")
	}
	if item.Quantity < 1 {
		item.Quantity = 1
	}
	if _, err := s.db.Exec(
		`INSERT INTO quote_cabinets (quote_id, cabinet_sku, quantity, custom_width, custom_height, custom_depth, notes)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		item.QuoteID, strings.ToUpper(strings.TrimSpace(item.CabinetSKU)), item.Quantity,
		ptrFloat(item.CustomWidth), ptrFloat(item.CustomHeight), ptrFloat(item.CustomDepth), item.Notes,
	); err != nil {
		return fmt.Errorf("insert quote_cabinet: %w", err)
	}
	return nil
}

// UpdateQuoteCabinet updates an existing custom cabinet line item.
func (s *Store) UpdateQuoteCabinet(item models.QuoteCabinet) error {
	if strings.TrimSpace(item.CabinetSKU) == "" {
		return fmt.Errorf("cabinet SKU is required")
	}
	if item.Quantity < 1 {
		item.Quantity = 1
	}
	if _, err := s.db.Exec(
		`UPDATE quote_cabinets SET cabinet_sku = ?, quantity = ?, custom_width = ?, custom_height = ?, custom_depth = ?, notes = ? WHERE id = ?`,
		strings.ToUpper(strings.TrimSpace(item.CabinetSKU)), item.Quantity,
		ptrFloat(item.CustomWidth), ptrFloat(item.CustomHeight), ptrFloat(item.CustomDepth), item.Notes, item.ID,
	); err != nil {
		return fmt.Errorf("update quote_cabinet: %w", err)
	}
	return nil
}

// DeleteQuoteCabinet removes a cabinet line item by id.
func (s *Store) DeleteQuoteCabinet(id int64) error {
	if _, err := s.db.Exec(`DELETE FROM quote_cabinets WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete quote_cabinet: %w", err)
	}
	return nil
}

// AddQuoteBuyout inserts a new buyout line item.
func (s *Store) AddQuoteBuyout(item models.QuoteBuyout) error {
	if strings.TrimSpace(item.Description) == "" {
		return fmt.Errorf("buyout description is required")
	}
	if !slices.Contains(models.ValidBuyoutCategories, item.Category) {
		return fmt.Errorf("invalid buyout category %q", item.Category)
	}
	if _, err := s.db.Exec(
		`INSERT INTO quote_buyouts (quote_id, category, description, vendor_invoice_cost, margin_percent)
		 VALUES (?, ?, ?, ?, ?)`,
		item.QuoteID, item.Category, strings.TrimSpace(item.Description), item.VendorInvoiceCost, item.MarginPercent,
	); err != nil {
		return fmt.Errorf("insert quote_buyout: %w", err)
	}
	return nil
}

// UpdateQuoteBuyout updates an existing buyout line item.
func (s *Store) UpdateQuoteBuyout(item models.QuoteBuyout) error {
	if strings.TrimSpace(item.Description) == "" {
		return fmt.Errorf("buyout description is required")
	}
	if !slices.Contains(models.ValidBuyoutCategories, item.Category) {
		return fmt.Errorf("invalid buyout category %q", item.Category)
	}
	if _, err := s.db.Exec(
		`UPDATE quote_buyouts SET category = ?, description = ?, vendor_invoice_cost = ?, margin_percent = ? WHERE id = ?`,
		item.Category, strings.TrimSpace(item.Description), item.VendorInvoiceCost, item.MarginPercent, item.ID,
	); err != nil {
		return fmt.Errorf("update quote_buyout: %w", err)
	}
	return nil
}

// DeleteQuoteBuyout removes a buyout line item by id.
func (s *Store) DeleteQuoteBuyout(id int64) error {
	if _, err := s.db.Exec(`DELETE FROM quote_buyouts WHERE id = ?`, id); err != nil {
		return fmt.Errorf("delete quote_buyout: %w", err)
	}
	return nil
}
