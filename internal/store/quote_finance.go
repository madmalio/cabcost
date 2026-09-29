package store

import (
	"database/sql"
	"fmt"

	"cabcost/internal/models"
)

func ptrFloat(p *float64) any {
	if p == nil {
		return nil
	}
	return *p
}

func retailFromCost(cost, marginPercent float64) float64 {
	if marginPercent >= 100 {
		return cost
	}
	return cost / (1 - marginPercent/100.0)
}

// loadQuoteCabinets returns all custom cabinet line items for a quote.
func (s *Store) loadQuoteCabinets(quoteID int64) ([]models.QuoteCabinet, error) {
	rows, err := s.db.Query(
		`SELECT id, quote_id, cabinet_sku, quantity, custom_width, custom_height, custom_depth, notes
		 FROM quote_cabinets WHERE quote_id = ? ORDER BY id`, quoteID)
	if err != nil {
		return nil, fmt.Errorf("query quote_cabinets: %w", err)
	}
	defer rows.Close()

	items := []models.QuoteCabinet{}
	for rows.Next() {
		var item models.QuoteCabinet
		var cw, ch, cd sql.NullFloat64
		if err := rows.Scan(&item.ID, &item.QuoteID, &item.CabinetSKU, &item.Quantity, &cw, &ch, &cd, &item.Notes); err != nil {
			return nil, fmt.Errorf("scan quote_cabinet: %w", err)
		}
		if cw.Valid {
			item.CustomWidth = &cw.Float64
		}
		if ch.Valid {
			item.CustomHeight = &ch.Float64
		}
		if cd.Valid {
			item.CustomDepth = &cd.Float64
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate quote_cabinets: %w", err)
	}
	return items, nil
}

// loadQuoteBuyouts returns all buyout line items for a quote.
func (s *Store) loadQuoteBuyouts(quoteID int64) ([]models.QuoteBuyout, error) {
	rows, err := s.db.Query(
		`SELECT id, quote_id, category, description, vendor_invoice_cost, margin_percent
		 FROM quote_buyouts WHERE quote_id = ? ORDER BY id`, quoteID)
	if err != nil {
		return nil, fmt.Errorf("query quote_buyouts: %w", err)
	}
	defer rows.Close()

	items := []models.QuoteBuyout{}
	for rows.Next() {
		var b models.QuoteBuyout
		if err := rows.Scan(&b.ID, &b.QuoteID, &b.Category, &b.Description, &b.VendorInvoiceCost, &b.MarginPercent); err != nil {
			return nil, fmt.Errorf("scan quote_buyout: %w", err)
		}
		items = append(items, b)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate quote_buyouts: %w", err)
	}
	return items, nil
}

// quoteFinancialSummary computes the full rollup for a quote using its saved
// assembly selections, margins, cabinet line items, and buyouts.
func (s *Store) quoteFinancialSummary(q models.Quote) (models.FinancialSummary, error) {
	cabinets, err := s.loadQuoteCabinets(q.ID)
	if err != nil {
		return models.FinancialSummary{}, err
	}
	buyouts, err := s.loadQuoteBuyouts(q.ID)
	if err != nil {
		return models.FinancialSummary{}, err
	}

	var sum models.FinancialSummary

	for _, item := range cabinets {
		c, err := s.loadCabinet(item.CabinetSKU)
		if err != nil {
			return models.FinancialSummary{}, err
		}
		if item.CustomWidth != nil {
			c.Width = *item.CustomWidth
		}
		if item.CustomHeight != nil {
			c.Height = *item.CustomHeight
		}
		if item.CustomDepth != nil {
			c.Depth = *item.CustomDepth
		}
		b, err := s.calculateCabinet(c, q.BoxAssemblyID, q.DoorAssemblyID, q.DrawerFrontAssemblyID, q.DrawerAssemblyID, q.IsFinished)
		if err != nil {
			return models.FinancialSummary{}, err
		}
		qty := float64(item.Quantity)
		sum.ShopMaterialsTotal += b.MaterialsTotal * qty
		sum.ShopLaborHours += b.LaborHours * qty
		sum.ShopLaborTotal += b.LaborTotal * qty
		sum.CustomCabinetsShopCost += b.TotalShopCost * qty
	}
	sum.CustomCabinetsRetail = retailFromCost(sum.CustomCabinetsShopCost, q.TargetMarginPercent)

	for _, b := range buyouts {
		sum.BuyoutCostTotal += b.VendorInvoiceCost
		sum.BuyoutRetailTotal += retailFromCost(b.VendorInvoiceCost, b.MarginPercent)
	}

	sum.TotalJobCost = sum.CustomCabinetsShopCost + sum.BuyoutCostTotal
	sum.TotalProposalRetail = sum.CustomCabinetsRetail + sum.BuyoutRetailTotal
	sum.TotalProfit = sum.TotalProposalRetail - sum.TotalJobCost
	if sum.TotalProposalRetail != 0 {
		sum.BlendedMarginPercent = sum.TotalProfit / sum.TotalProposalRetail * 100.0
	}

	return sum, nil
}

func (s *Store) buildCabinetLines(q models.Quote) ([]models.QuoteCabinetLine, error) {
	cabinets, err := s.loadQuoteCabinets(q.ID)
	if err != nil {
		return nil, err
	}

	lines := make([]models.QuoteCabinetLine, 0, len(cabinets))
	for _, item := range cabinets {
		c, err := s.loadCabinet(item.CabinetSKU)
		if err != nil {
			return nil, err
		}
		line := models.QuoteCabinetLine{
			QuoteCabinet: item,
			CatalogName:  c.Name,
		}
		if item.CustomWidth != nil {
			c.Width = *item.CustomWidth
		}
		if item.CustomHeight != nil {
			c.Height = *item.CustomHeight
		}
		if item.CustomDepth != nil {
			c.Depth = *item.CustomDepth
		}
		b, err := s.calculateCabinet(c, q.BoxAssemblyID, q.DoorAssemblyID, q.DrawerFrontAssemblyID, q.DrawerAssemblyID, q.IsFinished)
		if err != nil {
			return nil, err
		}
		line.UnitShopCost = round2(b.TotalShopCost)
		line.ExtendedShopCost = round2(b.TotalShopCost * float64(item.Quantity))
		line.Retail = round2(retailFromCost(b.TotalShopCost*float64(item.Quantity), q.TargetMarginPercent))
		lines = append(lines, line)
	}
	return lines, nil
}

func (s *Store) buildBuyoutLines(q models.Quote) ([]models.QuoteBuyoutLine, error) {
	buyouts, err := s.loadQuoteBuyouts(q.ID)
	if err != nil {
		return nil, err
	}
	lines := make([]models.QuoteBuyoutLine, 0, len(buyouts))
	for _, b := range buyouts {
		lines = append(lines, models.QuoteBuyoutLine{
			QuoteBuyout: b,
			Retail:      round2(retailFromCost(b.VendorInvoiceCost, b.MarginPercent)),
		})
	}
	return lines, nil
}
