package store

import (
	"fmt"

	"cabcost/internal/models"
)

// GetShopSettings returns the single shop settings row. Default row is returned
// when the table is empty.
func (s *Store) GetShopSettings() (models.ShopSettings, error) {
	var settings models.ShopSettings
	if err := s.db.QueryRow(`SELECT id, loaded_labor_rate, finishing_labor_rate_sqft, manual_edgeband_min_per_ft, default_margin_percent, shop_supplies_percent FROM shop_settings ORDER BY id LIMIT 1`).
		Scan(&settings.ID, &settings.LoadedLaborRate, &settings.FinishingLaborRateSqft,
			&settings.ManualEdgebandMinPerFt, &settings.DefaultMarginPercent, &settings.ShopSuppliesPercent); err != nil {
		return settings, fmt.Errorf("scan shop_settings: %w", err)
	}
	return settings, nil
}

// SaveShopSettings updates the single shop settings row (id=1).
func (s *Store) SaveShopSettings(settings models.ShopSettings) error {
	if settings.ID == 0 {
		settings.ID = 1
	}
	_, err := s.db.Exec(
		`INSERT INTO shop_settings (id, loaded_labor_rate, finishing_labor_rate_sqft, manual_edgeband_min_per_ft, default_margin_percent, shop_supplies_percent)
		 VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
		   loaded_labor_rate = excluded.loaded_labor_rate,
		   finishing_labor_rate_sqft = excluded.finishing_labor_rate_sqft,
		   manual_edgeband_min_per_ft = excluded.manual_edgeband_min_per_ft,
		   default_margin_percent = excluded.default_margin_percent,
		   shop_supplies_percent = excluded.shop_supplies_percent`,
		settings.ID,
		settings.LoadedLaborRate,
		settings.FinishingLaborRateSqft,
		settings.ManualEdgebandMinPerFt,
		settings.DefaultMarginPercent,
		settings.ShopSuppliesPercent,
	)
	if err != nil {
		return fmt.Errorf("save shop_settings: %w", err)
	}
	return nil
}
