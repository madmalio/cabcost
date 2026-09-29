package main

import (
	"context"
	"fmt"
	"log"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"cabcost/internal/db"
	"cabcost/internal/store"

	"cabcost/internal/models"
)

// App struct
type App struct {
	ctx   context.Context
	store *store.Store
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	path, err := db.DefaultPath()
	if err != nil {
		log.Printf("cabcost: resolve database path: %v", err)
		return
	}
	database, err := db.Open(path)
	if err != nil {
		log.Printf("cabcost: open database: %v", err)
		return
	}
	a.store = store.New(database)
}

func (a *App) requireStore() (*store.Store, error) {
	if a.store == nil {
		return nil, fmt.Errorf("database is not initialised")
	}
	return a.store, nil
}

// GetMaterials returns all materials.
func (a *App) GetMaterials() ([]models.Material, error) {
	s, err := a.requireStore()
	if err != nil {
		return nil, err
	}
	return s.GetMaterials()
}

// SaveMaterial inserts or updates a material.
func (a *App) SaveMaterial(m models.Material) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.SaveMaterial(m)
}

// DeleteMaterial removes a material by id.
func (a *App) DeleteMaterial(id int64) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.DeleteMaterial(id)
}

// GetHardware returns all hardware.
func (a *App) GetHardware() ([]models.Hardware, error) {
	s, err := a.requireStore()
	if err != nil {
		return nil, err
	}
	return s.GetHardware()
}

// SaveHardware inserts or updates a piece of hardware.
func (a *App) SaveHardware(h models.Hardware) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.SaveHardware(h)
}

// DeleteHardware removes hardware by id.
func (a *App) DeleteHardware(id int64) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.DeleteHardware(id)
}

// GetShopSettings returns the current shop settings.
func (a *App) GetShopSettings() (models.ShopSettings, error) {
	s, err := a.requireStore()
	if err != nil {
		return models.ShopSettings{}, err
	}
	return s.GetShopSettings()
}

// SaveShopSettings persists the shop settings.
func (a *App) SaveShopSettings(settings models.ShopSettings) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.SaveShopSettings(settings)
}

// GetAssemblies returns all construction assemblies, optionally filtered by
// assembly type. Pass an empty string to retrieve all assemblies.
func (a *App) GetAssemblies(assemblyType string) ([]models.Assembly, error) {
	s, err := a.requireStore()
	if err != nil {
		return nil, err
	}
	return s.GetAssemblies(assemblyType)
}

// SaveAssembly inserts or updates a construction assembly.
func (a *App) SaveAssembly(assembly models.Assembly) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.SaveAssembly(assembly)
}

// DeleteAssembly removes a construction assembly by id.
func (a *App) DeleteAssembly(id int64) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.DeleteAssembly(id)
}

// GetCabinetCatalog returns all cabinet SKUs.
func (a *App) GetCabinetCatalog() ([]models.Cabinet, error) {
	s, err := a.requireStore()
	if err != nil {
		return nil, err
	}
	return s.GetCabinetCatalog()
}

// SaveCabinet inserts or updates a cabinet SKU.
func (a *App) SaveCabinet(c models.Cabinet) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.SaveCabinet(c)
}

// DeleteCabinet removes a cabinet SKU by id.
func (a *App) DeleteCabinet(id int64) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.DeleteCabinet(id)
}

// CalculateCabinetCost returns a full itemized cost breakdown for a cabinet
// SKU given the selected box, door, drawer front, and drawer box assemblies,
// finish state, and edge-detail flag.
func (a *App) CalculateCabinetCost(sku string, woodSpecies string, finishType string, boxAssemblyID int64, doorAssemblyID int64, drawerFrontAssemblyID int64, drawerBoxAssemblyID int64, isFinished bool, edgeDetail bool) (models.CabinetCostBreakdown, error) {
	s, err := a.requireStore()
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	return s.CalculateCabinetCost(sku, woodSpecies, finishType, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)
}

// CalculateCabinetCostOverride is like CalculateCabinetCost but accepts width,
// height, and depth overrides (0 means "use catalog dimension").
func (a *App) CalculateCabinetCostOverride(sku string, width float64, height float64, depth float64, woodSpecies string, finishType string, boxAssemblyID int64, doorAssemblyID int64, drawerFrontAssemblyID int64, drawerBoxAssemblyID int64, isFinished bool, edgeDetail bool) (models.CabinetCostBreakdown, error) {
	s, err := a.requireStore()
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	return s.CalculateCabinetCostOverride(sku, width, height, depth, woodSpecies, finishType, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)
}

// GetQuotes returns the quote list.
func (a *App) GetQuotes() ([]models.QuoteListItem, error) {
	s, err := a.requireStore()
	if err != nil {
		return nil, err
	}
	return s.GetQuotes()
}

// GetQuoteDetail returns the full workbench payload for a quote.
func (a *App) GetQuoteDetail(quoteID int64) (models.QuoteDetailResponse, error) {
	s, err := a.requireStore()
	if err != nil {
		return models.QuoteDetailResponse{}, err
	}
	return s.GetQuoteDetail(quoteID)
}

// SaveQuote inserts or updates a quote and returns its id.
func (a *App) SaveQuote(q models.Quote) (int64, error) {
	s, err := a.requireStore()
	if err != nil {
		return 0, err
	}
	return s.SaveQuote(q)
}

// UpdateQuoteStatus changes a quote's status.
func (a *App) UpdateQuoteStatus(quoteID int64, status string) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.UpdateQuoteStatus(quoteID, status)
}

// DeleteQuote removes a quote.
func (a *App) DeleteQuote(quoteID int64) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.DeleteQuote(quoteID)
}

// DuplicateQuote deep-copies a quote into a new draft and returns its id.
func (a *App) DuplicateQuote(quoteID int64) (int64, error) {
	s, err := a.requireStore()
	if err != nil {
		return 0, err
	}
	return s.DuplicateQuote(quoteID)
}

// AddQuoteCabinet inserts a custom cabinet line item.
func (a *App) AddQuoteCabinet(item models.QuoteCabinet) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.AddQuoteCabinet(item)
}

// UpdateQuoteCabinet updates a custom cabinet line item.
func (a *App) UpdateQuoteCabinet(item models.QuoteCabinet) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.UpdateQuoteCabinet(item)
}

// DeleteQuoteCabinet removes a cabinet line item.
func (a *App) DeleteQuoteCabinet(id int64) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.DeleteQuoteCabinet(id)
}

// AddQuoteBuyout inserts a buyout line item.
func (a *App) AddQuoteBuyout(item models.QuoteBuyout) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.AddQuoteBuyout(item)
}

// UpdateQuoteBuyout updates a buyout line item.
func (a *App) UpdateQuoteBuyout(item models.QuoteBuyout) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.UpdateQuoteBuyout(item)
}

// DeleteQuoteBuyout removes a buyout line item.
func (a *App) DeleteQuoteBuyout(id int64) error {
	s, err := a.requireStore()
	if err != nil {
		return err
	}
	return s.DeleteQuoteBuyout(id)
}

// PrintQuote opens the native print dialog for the current webview.
func (a *App) PrintQuote() {
	if a.ctx == nil {
		return
	}
	runtime.WindowPrint(a.ctx)
}
