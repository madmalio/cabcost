package store

import (
	"fmt"
	"slices"
	"strings"

	"cabcost/internal/models"
)

const quoteCols = `id, job_name, client_name, client_phone, status, box_assembly_id, door_assembly_id,
	drawer_front_assembly_id, drawer_assembly_id, is_finished, has_edge_detail, target_margin_percent, prefab_margin_percent, notes, created_at, updated_at`

func scanQuote(r rowScanner) (models.Quote, error) {
	var q models.Quote
	err := r.Scan(
		&q.ID, &q.JobName, &q.ClientName, &q.ClientPhone, &q.Status,
		&q.BoxAssemblyID, &q.DoorAssemblyID, &q.DrawerFrontAssemblyID, &q.DrawerAssemblyID, &q.IsFinished,
		&q.HasEdgeDetail, &q.TargetMarginPercent, &q.PrefabMarginPercent, &q.Notes, &q.CreatedAt, &q.UpdatedAt,
	)
	return q, err
}

func (s *Store) getQuote(id int64) (models.Quote, error) {
	q, err := scanQuote(s.db.QueryRow(`SELECT `+quoteCols+` FROM quotes WHERE id = ?`, id))
	if err != nil {
		return q, fmt.Errorf("load quote: %w", err)
	}
	return q, nil
}

// GetQuotes returns list view rows with computed cabinet counts and totals.
func (s *Store) GetQuotes() ([]models.QuoteListItem, error) {
	rows, err := s.db.Query(`SELECT ` + quoteCols + ` FROM quotes ORDER BY updated_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("query quotes: %w", err)
	}

	quotes := []models.Quote{}
	for rows.Next() {
		q, err := scanQuote(rows)
		if err != nil {
			rows.Close()
			return nil, fmt.Errorf("scan quote: %w", err)
		}
		quotes = append(quotes, q)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate quotes: %w", err)
	}

	items := make([]models.QuoteListItem, 0, len(quotes))
	for _, q := range quotes {
		var cabinetCount int
		if err := s.db.QueryRow(`SELECT COALESCE(SUM(quantity), 0) FROM quote_cabinets WHERE quote_id = ?`, q.ID).Scan(&cabinetCount); err != nil {
			return nil, fmt.Errorf("count cabinets: %w", err)
		}

		var retail float64
		if summary, err := s.quoteFinancialSummary(q); err == nil {
			retail = summary.TotalProposalRetail
		}

		items = append(items, models.QuoteListItem{
			ID:               q.ID,
			JobName:          q.JobName,
			ClientName:       q.ClientName,
			Status:           q.Status,
			TotalCabinets:    cabinetCount,
			TotalRetailPrice: round2(retail),
			UpdatedAt:        q.UpdatedAt,
		})
	}
	return items, nil
}

func (s *Store) assemblyPtr(id int64, typ string) *models.Assembly {
	a, err := s.assemblyByIDOrDefault(id, typ)
	if err != nil || a.ID == 0 {
		return nil
	}
	return &a
}

// GetQuoteDetail returns the full workbench payload for a quote.
func (s *Store) GetQuoteDetail(quoteID int64) (models.QuoteDetailResponse, error) {
	q, err := s.getQuote(quoteID)
	if err != nil {
		return models.QuoteDetailResponse{}, err
	}
	cabinets, err := s.buildCabinetLines(q)
	if err != nil {
		return models.QuoteDetailResponse{}, err
	}
	buyouts, err := s.buildBuyoutLines(q)
	if err != nil {
		return models.QuoteDetailResponse{}, err
	}
	summary, err := s.quoteFinancialSummary(q)
	if err != nil {
		return models.QuoteDetailResponse{}, err
	}

	return models.QuoteDetailResponse{
		Quote:              q,
		BoxAssembly:        s.assemblyPtr(q.BoxAssemblyID, models.AssemblyTypeBox),
		DoorAssembly:       s.assemblyPtr(q.DoorAssemblyID, models.AssemblyTypeDoor),
		DrawerFrontAssembly: s.assemblyPtr(q.DrawerFrontAssemblyID, models.AssemblyTypeDrawerFront),
		DrawerAssembly:     s.assemblyPtr(q.DrawerAssemblyID, models.AssemblyTypeDrawerBox),
		Cabinets:           cabinets,
		Buyouts:            buyouts,
		Summary:            summary,
	}, nil
}

// SaveQuote inserts a new quote (id == 0) or updates an existing one,
// returning the quote id.
func (s *Store) SaveQuote(q models.Quote) (int64, error) {
	if strings.TrimSpace(q.JobName) == "" {
		return 0, fmt.Errorf("job name is required")
	}
	if q.Status == "" {
		q.Status = models.QuoteStatusDraft
	}
	if !slices.Contains(models.ValidQuoteStatuses, q.Status) {
		return 0, fmt.Errorf("invalid quote status %q", q.Status)
	}

	if q.ID == 0 {
		res, err := s.db.Exec(
			`INSERT INTO quotes
			 (job_name, client_name, client_phone, status, box_assembly_id, door_assembly_id, drawer_front_assembly_id, drawer_assembly_id, is_finished, has_edge_detail, target_margin_percent, prefab_margin_percent, notes)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			strings.TrimSpace(q.JobName), strings.TrimSpace(q.ClientName), strings.TrimSpace(q.ClientPhone), q.Status,
			q.BoxAssemblyID, q.DoorAssemblyID, q.DrawerFrontAssemblyID, q.DrawerAssemblyID, q.IsFinished,
			q.HasEdgeDetail, q.TargetMarginPercent, q.PrefabMarginPercent, q.Notes,
		)
		if err != nil {
			return 0, fmt.Errorf("insert quote: %w", err)
		}
		id, err := res.LastInsertId()
		if err != nil {
			return 0, fmt.Errorf("quote id: %w", err)
		}
		return id, nil
	}

	_, err := s.db.Exec(
		`UPDATE quotes SET
		   job_name = ?, client_name = ?, client_phone = ?, status = ?,
		   box_assembly_id = ?, door_assembly_id = ?, drawer_front_assembly_id = ?, drawer_assembly_id = ?, is_finished = ?,
		   has_edge_detail = ?, target_margin_percent = ?, prefab_margin_percent = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`,
		strings.TrimSpace(q.JobName), strings.TrimSpace(q.ClientName), strings.TrimSpace(q.ClientPhone), q.Status,
		q.BoxAssemblyID, q.DoorAssemblyID, q.DrawerFrontAssemblyID, q.DrawerAssemblyID, q.IsFinished,
		q.HasEdgeDetail, q.TargetMarginPercent, q.PrefabMarginPercent, q.Notes, q.ID,
	)
	if err != nil {
		return 0, fmt.Errorf("update quote: %w", err)
	}
	return q.ID, nil
}

// UpdateQuoteStatus changes a quote's status and bumps updated_at.
func (s *Store) UpdateQuoteStatus(quoteID int64, status string) error {
	if !slices.Contains(models.ValidQuoteStatuses, status) {
		return fmt.Errorf("invalid quote status %q", status)
	}
	if _, err := s.db.Exec(
		`UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		status, quoteID,
	); err != nil {
		return fmt.Errorf("update quote status: %w", err)
	}
	return nil
}

// DeleteQuote removes a quote and (via cascade) its line items.
func (s *Store) DeleteQuote(quoteID int64) error {
	if _, err := s.db.Exec(`DELETE FROM quotes WHERE id = ?`, quoteID); err != nil {
		return fmt.Errorf("delete quote: %w", err)
	}
	return nil
}

// DuplicateQuote deep-copies a quote (header + line items + buyouts) into a
// new draft, returning the new quote id.
func (s *Store) DuplicateQuote(quoteID int64) (int64, error) {
	q, err := s.getQuote(quoteID)
	if err != nil {
		return 0, err
	}
	q.ID = 0
	q.JobName = strings.TrimSpace(q.JobName) + " (Copy)"
	q.Status = models.QuoteStatusDraft
	newID, err := s.SaveQuote(q)
	if err != nil {
		return 0, err
	}

	cabinets, err := s.loadQuoteCabinets(quoteID)
	if err != nil {
		return 0, err
	}
	for _, c := range cabinets {
		if _, err := s.db.Exec(
			`INSERT INTO quote_cabinets (quote_id, cabinet_sku, quantity, custom_width, custom_height, custom_depth, notes)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			newID, c.CabinetSKU, c.Quantity, ptrFloat(c.CustomWidth), ptrFloat(c.CustomHeight), ptrFloat(c.CustomDepth), c.Notes,
		); err != nil {
			return 0, fmt.Errorf("duplicate cabinet: %w", err)
		}
	}

	buyouts, err := s.loadQuoteBuyouts(quoteID)
	if err != nil {
		return 0, err
	}
	for _, b := range buyouts {
		if _, err := s.db.Exec(
			`INSERT INTO quote_buyouts (quote_id, category, description, vendor_invoice_cost, margin_percent)
			 VALUES (?, ?, ?, ?, ?)`,
			newID, b.Category, b.Description, b.VendorInvoiceCost, b.MarginPercent,
		); err != nil {
			return 0, fmt.Errorf("duplicate buyout: %w", err)
		}
	}

	return newID, nil
}
