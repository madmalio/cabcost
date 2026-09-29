package models

// Wood species values.
const (
	SpeciesPaintGrade = "paint_grade"
	SpeciesAlder      = "alder"
	SpeciesWhiteOak   = "white_oak"
	SpeciesCherry     = "cherry"
	SpeciesMaple      = "maple"
	SpeciesWalnut     = "walnut"
	SpeciesUniversal  = "universal"
)

// ValidSpecies lists every allowed wood species.
var ValidSpecies = []string{
	SpeciesPaintGrade,
	SpeciesAlder,
	SpeciesWhiteOak,
	SpeciesCherry,
	SpeciesMaple,
	SpeciesWalnut,
	SpeciesUniversal,
}

// Finish type values.
const (
	FinishPainted    = "painted"
	FinishStained    = "stained"
	FinishUnfinished = "unfinished"
)

// ValidFinishTypes lists every allowed finish type.
var ValidFinishTypes = []string{
	FinishPainted,
	FinishStained,
	FinishUnfinished,
}

// Material role values.
const (
	RoleBoxCore      = "box_core"
	RoleBoxBack      = "box_back"
	RoleFrameLumber  = "frame_lumber"
	RoleDoorFrame    = "door_frame"
	RoleDoorPanel    = "door_panel"
	RoleSlabSheet    = "slab_sheet"
	RoleDrawerSide   = "drawer_side"
	RoleDrawerBottom = "drawer_bottom"
	RoleEdgeband     = "edgeband"
	RoleFinishing    = "finishing"
)

// ValidRoles lists every allowed material role.
var ValidRoles = []string{
	RoleBoxCore,
	RoleBoxBack,
	RoleFrameLumber,
	RoleDoorFrame,
	RoleDoorPanel,
	RoleSlabSheet,
	RoleDrawerSide,
	RoleDrawerBottom,
	RoleEdgeband,
	RoleFinishing,
}

// Material unit values.
const (
	UnitSheet4x8   = "sheet_4x8"
	UnitSheet5x5   = "sheet_5x5"
	UnitBoardFoot  = "board_foot"
	UnitLinearFoot = "linear_foot"
	UnitSqFt       = "sq_ft"
	UnitEach       = "each"
)

// ValidMaterialUnits lists every allowed material unit.
var ValidMaterialUnits = []string{
	UnitSheet4x8,
	UnitSheet5x5,
	UnitBoardFoot,
	UnitLinearFoot,
	UnitSqFt,
	UnitEach,
}

// Hardware category values.
const (
	CategoryHinge     = "hinge"
	CategorySlide     = "slide"
	CategoryPull      = "pull"
	CategoryAccessory = "accessory"
)

// ValidCategories lists every allowed hardware category.
var ValidCategories = []string{
	CategoryHinge,
	CategorySlide,
	CategoryPull,
	CategoryAccessory,
}

// Hardware unit values.
const (
	HUnitEach = "each"
	HUnitPair = "pair"
)

// ValidHardwareUnits lists every allowed hardware unit.
var ValidHardwareUnits = []string{
	HUnitEach,
	HUnitPair,
}

// Material is a build material (sheet goods, lumber, edgeband, finishing).
type Material struct {
	ID           int64   `json:"id"`
	Name         string  `json:"name"`
	Role         string  `json:"role"`
	Species      string  `json:"species"`
	Unit         string  `json:"unit"`
	UnitCost     float64 `json:"unit_cost"`
	WastePercent float64 `json:"waste_percent"`
	CreatedAt    string  `json:"created_at"`
}

// Hardware is a piece of hardware (hinge, slide, pull, accessory).
type Hardware struct {
	ID        int64   `json:"id"`
	Name      string  `json:"name"`
	Category  string  `json:"category"`
	Unit      string  `json:"unit"`
	UnitCost  float64 `json:"unit_cost"`
	IsDefault bool    `json:"is_default"`
	CreatedAt string  `json:"created_at"`
}

// ShopSettings holds shop-wide rate and overhead defaults.
type ShopSettings struct {
	ID                     int64   `json:"id"`
	LoadedLaborRate        float64 `json:"loaded_labor_rate"`
	FinishingLaborRateSqft float64 `json:"finishing_labor_rate_sqft"`
	ManualEdgebandMinPerFt float64 `json:"manual_edgeband_min_per_ft"`
	DefaultMarginPercent   float64 `json:"default_margin_percent"`
	ShopSuppliesPercent    float64 `json:"shop_supplies_percent"`
}

// Assembly type values.
const (
	AssemblyTypeBox         = "box"
	AssemblyTypeDoor        = "door"
	AssemblyTypeDrawerFront = "drawer_front"
	AssemblyTypeDrawerBox   = "drawer_box"
)

// ValidAssemblyTypes lists every allowed construction assembly type.
var ValidAssemblyTypes = []string{
	AssemblyTypeBox,
	AssemblyTypeDoor,
	AssemblyTypeDrawerFront,
	AssemblyTypeDrawerBox,
}

// Construction style values.
const (
	StyleFaceFrame = "face_frame"
	StyleFrameless = "frameless"
)

// ValidConstructionStyles lists every allowed construction style.
var ValidConstructionStyles = []string{
	StyleFaceFrame,
	StyleFrameless,
}

// Panel type values.
const (
	PanelTypeFlat        = "flat"
	PanelTypeRaisedSheet = "raised_sheet"
	PanelTypeRaisedSolid = "raised_solid"
)

// ValidPanelTypes lists every allowed panel type.
var ValidPanelTypes = []string{
	PanelTypeFlat,
	PanelTypeRaisedSheet,
	PanelTypeRaisedSolid,
}

// Frame joinery values.
const (
	FrameJoineryCopeAndStick = "cope_and_stick"
	FrameJoineryMitered      = "mitered"
	FrameJoinerySlab         = "slab"
)

// ValidFrameJoinery lists every allowed frame joinery style.
var ValidFrameJoinery = []string{
	FrameJoineryCopeAndStick,
	FrameJoineryMitered,
	FrameJoinerySlab,
}

// Assembly is a reusable shop build package that links materials by role.
type Assembly struct {
	ID                int64   `json:"id"`
	Name              string  `json:"name"`
	Type              string  `json:"type"`
	ConstructionStyle string  `json:"construction_style"`
	CoreMaterialID    *int64  `json:"core_material_id"`
	BackMaterialID    *int64  `json:"back_material_id"`
	PanelMaterialID   *int64  `json:"panel_material_id"`
	FaceLumberID      *int64  `json:"face_lumber_id"`
	EdgebandID        *int64  `json:"edgeband_id"`
	HardwareID        *int64  `json:"hardware_id"`
	IsOutsourced      bool    `json:"is_outsourced"`
	RequiresFinish    bool    `json:"requires_finish"`
	RequiresEdgeband  bool    `json:"requires_edgeband"`
	PanelType         string  `json:"panel_type"`
	FrameJoinery      string  `json:"frame_joinery"`
	FinishLaborHours  float64 `json:"finish_labor_hours"`
	PrepLaborHours    float64 `json:"prep_labor_hours"`
	PanelPrepLaborHours float64 `json:"panel_prep_labor_hours"`
	BuildLaborHours   float64 `json:"build_labor_hours"`
	IsDefault         bool    `json:"is_default"`
	CreatedAt         string  `json:"created_at"`
}

// Cabinet category values.
const (
	CategoryBase   = "base"
	CategoryWall   = "wall"
	CategoryTall   = "tall"
	CategoryVanity = "vanity"
)

// ValidCabinetCategories lists every allowed cabinet category.
var ValidCabinetCategories = []string{
	CategoryBase,
	CategoryWall,
	CategoryTall,
	CategoryVanity,
}

// Cabinet is a catalog SKU (a standard cabinet size/configuration).
type Cabinet struct {
	ID                int64   `json:"id"`
	SKU               string  `json:"sku"`
	Name              string  `json:"name"`
	Category          string  `json:"category"`
	Width             float64 `json:"width"`
	Height            float64 `json:"height"`
	Depth             float64 `json:"depth"`
	DoorsCount        int     `json:"doors_count"`
	DrawersCount      int     `json:"drawers_count"`
	ShelvesCount      int     `json:"shelves_count"`
	BaseAssemblyHours float64 `json:"base_assembly_hours"`
	CreatedAt         string  `json:"created_at"`
}

// CostLine is a single named line in a cost breakdown.
type CostLine struct {
	Label  string  `json:"label"`
	Amount float64 `json:"amount"`
}

// CabinetCostBreakdown is the itemized result of a parametric cost calculation.
type CabinetCostBreakdown struct {
	SKU             string     `json:"sku"`
	Materials       []CostLine `json:"materials"`
	MaterialsTotal  float64    `json:"materials_total"`
	Labor           []CostLine `json:"labor"`
	LaborHours      float64    `json:"labor_hours"`
	LaborTotal      float64    `json:"labor_total"`
	TotalShopCost   float64    `json:"total_shop_cost"`
	SuggestedRetail float64    `json:"suggested_retail"`
	MarginPercent   float64    `json:"margin_percent"`
}

// Quote status values.
const (
	QuoteStatusDraft     = "draft"
	QuoteStatusSent      = "sent"
	QuoteStatusApproved  = "approved"
	QuoteStatusCompleted = "completed"
	QuoteStatusArchived  = "archived"
)

// ValidQuoteStatuses lists every allowed quote status.
var ValidQuoteStatuses = []string{
	QuoteStatusDraft,
	QuoteStatusSent,
	QuoteStatusApproved,
	QuoteStatusCompleted,
	QuoteStatusArchived,
}

// Buyout category values.
const (
	BuyoutOutsourcedDoors  = "outsourced_doors"
	BuyoutPrefabCabinets   = "prefab_cabinets"
	BuyoutSpecialtyHardware = "specialty_hardware"
	BuyoutFreightOther     = "freight_other"
)

// ValidBuyoutCategories lists every allowed buyout category.
var ValidBuyoutCategories = []string{
	BuyoutOutsourcedDoors,
	BuyoutPrefabCabinets,
	BuyoutSpecialtyHardware,
	BuyoutFreightOther,
}

// Quote is a project quoting workbench header.
type Quote struct {
	ID                   int64   `json:"id"`
	JobName              string  `json:"job_name"`
	ClientName           string  `json:"client_name"`
	ClientPhone          string  `json:"client_phone"`
	Status               string  `json:"status"`
	WoodSpecies          string  `json:"wood_species"`
	FinishType           string  `json:"finish_type"`
	BoxAssemblyID        int64   `json:"box_assembly_id"`
	DoorAssemblyID       int64   `json:"door_assembly_id"`
	DrawerFrontAssemblyID int64  `json:"drawer_front_assembly_id"`
	DrawerAssemblyID     int64   `json:"drawer_assembly_id"`
	IsFinished           bool    `json:"is_finished"`
	HasEdgeDetail        bool    `json:"has_edge_detail"`
	TargetMarginPercent  float64 `json:"target_margin_percent"`
	PrefabMarginPercent  float64 `json:"prefab_margin_percent"`
	Notes                string  `json:"notes"`
	CreatedAt            string  `json:"created_at"`
	UpdatedAt            string  `json:"updated_at"`
}

// QuoteListItem is a summary row for the quotes list view.
type QuoteListItem struct {
	ID              int64   `json:"id"`
	JobName         string  `json:"job_name"`
	ClientName      string  `json:"client_name"`
	Status          string  `json:"status"`
	TotalCabinets   int     `json:"total_cabinets"`
	TotalRetailPrice float64 `json:"total_retail_price"`
	UpdatedAt       string  `json:"updated_at"`
}

// QuoteCabinet is a custom shop-built line item on a quote.
type QuoteCabinet struct {
	ID           int64    `json:"id"`
	QuoteID      int64    `json:"quote_id"`
	CabinetSKU   string   `json:"cabinet_sku"`
	Quantity     int      `json:"quantity"`
	CustomWidth  *float64 `json:"custom_width"`
	CustomHeight *float64 `json:"custom_height"`
	CustomDepth  *float64 `json:"custom_depth"`
	Notes        string   `json:"notes"`
}

// QuoteBuyout is a prefab / vendor buyout line item on a quote.
type QuoteBuyout struct {
	ID                int64   `json:"id"`
	QuoteID           int64   `json:"quote_id"`
	Category          string  `json:"category"`
	Description       string  `json:"description"`
	VendorInvoiceCost float64 `json:"vendor_invoice_cost"`
	MarginPercent     float64 `json:"margin_percent"`
}

// QuoteCabinetLine is a QuoteCabinet enriched with computed costs.
type QuoteCabinetLine struct {
	QuoteCabinet
	CatalogName   string  `json:"catalog_name"`
	UnitShopCost  float64 `json:"unit_shop_cost"`
	ExtendedShopCost float64 `json:"extended_shop_cost"`
	Retail        float64 `json:"retail"`
}

// QuoteBuyoutLine is a QuoteBuyout enriched with computed retail.
type QuoteBuyoutLine struct {
	QuoteBuyout
	Retail float64 `json:"retail"`
}

// FinancialSummary is the rollup for a quote.
type FinancialSummary struct {
	ShopMaterialsTotal     float64 `json:"shop_materials_total"`
	ShopLaborHours         float64 `json:"shop_labor_hours"`
	ShopLaborTotal         float64 `json:"shop_labor_total"`
	CustomCabinetsShopCost float64 `json:"custom_cabinets_shop_cost"`
	CustomCabinetsRetail   float64 `json:"custom_cabinets_retail"`
	BuyoutCostTotal        float64 `json:"buyout_cost_total"`
	BuyoutRetailTotal      float64 `json:"buyout_retail_total"`
	TotalJobCost           float64 `json:"total_job_cost"`
	TotalProposalRetail    float64 `json:"total_proposal_retail"`
	TotalProfit            float64 `json:"total_profit"`
	BlendedMarginPercent   float64 `json:"blended_margin_percent"`
}

// QuoteDetailResponse is the full workbench payload for a quote.
type QuoteDetailResponse struct {
	Quote             Quote              `json:"quote"`
	BoxAssembly       *Assembly          `json:"box_assembly"`
	DoorAssembly      *Assembly          `json:"door_assembly"`
	DrawerFrontAssembly *Assembly        `json:"drawer_front_assembly"`
	DrawerAssembly    *Assembly          `json:"drawer_assembly"`
	Cabinets          []QuoteCabinetLine `json:"cabinets"`
	Buyouts           []QuoteBuyoutLine  `json:"buyouts"`
	Summary           FinancialSummary   `json:"summary"`
}
