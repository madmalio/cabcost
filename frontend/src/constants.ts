export interface Material {
  id: number;
  name: string;
  role: string;
  unit: string;
  unit_cost: number;
  waste_percent: number;
  created_at: string;
}

export interface Hardware {
  id: number;
  name: string;
  category: string;
  unit: string;
  unit_cost: number;
  is_default: boolean;
  created_at: string;
}

export interface ShopSettings {
  id: number;
  loaded_labor_rate: number;
  finishing_labor_rate_sqft: number;
  manual_edgeband_min_per_ft: number;
  default_margin_percent: number;
  shop_supplies_percent: number;
}

export interface RoleOption {
  value: string;
  label: string;
  badge: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export const MATERIAL_ROLES: RoleOption[] = [
  { value: 'box_core', label: 'Box Core', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  { value: 'box_back', label: 'Backing', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  { value: 'frame_lumber', label: 'Frame Lumber', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'door_frame', label: 'Door Frame', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  { value: 'door_panel', label: 'Door Panel', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  { value: 'slab_sheet', label: 'Slab Door', badge: 'bg-lime-500/15 text-lime-300 border-lime-500/30' },
  { value: 'drawer_side', label: 'Drawer Side', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { value: 'drawer_bottom', label: 'Drawer Bottom', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
  { value: 'edgeband', label: 'Edgeband', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  { value: 'finishing', label: 'Finishing', badge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' },
];

export const MATERIAL_UNITS: SelectOption[] = [
  { value: 'sheet_4x8', label: '4x8 Sheet' },
  { value: 'sheet_5x5', label: '5x5 Sheet' },
  { value: 'board_foot', label: 'Board Foot' },
  { value: 'linear_foot', label: 'Linear Foot' },
  { value: 'sq_ft', label: 'Sq Ft' },
  { value: 'each', label: 'Each' },
];

export const HARDWARE_CATEGORIES: RoleOption[] = [
  { value: 'hinge', label: 'Hinge', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { value: 'slide', label: 'Slide', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { value: 'pull', label: 'Pull', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  { value: 'accessory', label: 'Accessory', badge: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' },
];

export const HARDWARE_UNITS: SelectOption[] = [
  { value: 'each', label: 'Each' },
  { value: 'pair', label: 'Pair' },
];

export interface FilterOption {
  key: string;
  label: string;
}

export const FILTERS: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'box_core', label: 'Box Core' },
  { key: 'box_back', label: 'Backing' },
  { key: 'frame_lumber', label: 'Frame Lumber' },
  { key: 'door_frame', label: 'Door Frame' },
  { key: 'door_panel', label: 'Door Panel' },
  { key: 'drawer_side', label: 'Drawer Sides' },
  { key: 'edgeband', label: 'Edgeband' },
  { key: 'finishing', label: 'Finishing' },
  { key: 'hardware', label: 'Hardware' },
];

export function roleLabel(role: string): string {
  return MATERIAL_ROLES.find((r) => r.value === role)?.label ?? role;
}

export function roleBadge(role: string): string {
  return MATERIAL_ROLES.find((r) => r.value === role)?.badge ?? 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
}

export function categoryLabel(category: string): string {
  return HARDWARE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function categoryBadge(category: string): string {
  return HARDWARE_CATEGORIES.find((c) => c.value === category)?.badge ?? 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
}

export interface Assembly {
  id: number;
  name: string;
  type: string;
  construction_style: string;
  core_material_id?: number;
  back_material_id?: number;
  panel_material_id?: number;
  face_lumber_id?: number;
  edgeband_id?: number;
  hardware_id?: number;
  is_outsourced: boolean;
  requires_finish: boolean;
  requires_edgeband: boolean;
  finish_labor_hours: number;
  prep_labor_hours: number;
  build_labor_hours: number;
  is_default: boolean;
  created_at: string;
}

export interface Cabinet {
  id: number;
  sku: string;
  name: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  doors_count: number;
  drawers_count: number;
  shelves_count: number;
  base_assembly_hours: number;
  created_at: string;
}

export interface CostLine {
  label: string;
  amount: number;
}

export interface CabinetCostBreakdown {
  sku: string;
  materials: CostLine[];
  materials_total: number;
  labor: CostLine[];
  labor_hours: number;
  labor_total: number;
  total_shop_cost: number;
  suggested_retail: number;
  margin_percent: number;
}

export const CABINET_CATEGORIES: SelectOption[] = [
  { value: 'base', label: 'Base' },
  { value: 'wall', label: 'Wall' },
  { value: 'tall', label: 'Tall' },
  { value: 'vanity', label: 'Vanity' },
];

export function cabinetCategoryLabel(category: string): string {
  return CABINET_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}


export function assemblyTypeLabel(t: string): string {
  switch (t) {
    case 'box': return 'Box';
    case 'door': return 'Door';
    case 'drawer_front': return 'Drawer Front';
    case 'drawer_box': return 'Drawer Box';
    default: return t;
  }
}

export function constructionStyleLabel(s: string): string {
  switch (s) {
    case 'face_frame': return 'Face Frame';
    case 'frameless': return 'Frameless';
    default: return s;
  }
}

export function unitLabel(unit: string): string {
  const match = [...MATERIAL_UNITS, ...HARDWARE_UNITS].find((u) => u.value === unit);
  return match?.label ?? unit;
}

export interface Quote {
  id: number;
  job_name: string;
  client_name: string;
  client_phone: string;
  status: string;
  box_assembly_id: number;
  door_assembly_id: number;
  drawer_front_assembly_id: number;
  drawer_assembly_id: number;
  is_finished: boolean;
  target_margin_percent: number;
  prefab_margin_percent: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteListItem {
  id: number;
  job_name: string;
  client_name: string;
  status: string;
  total_cabinets: number;
  total_retail_price: number;
  updated_at: string;
}

export interface QuoteCabinet {
  id: number;
  quote_id: number;
  cabinet_sku: string;
  quantity: number;
  custom_width?: number;
  custom_height?: number;
  custom_depth?: number;
  notes: string;
}

export interface QuoteBuyout {
  id: number;
  quote_id: number;
  category: string;
  description: string;
  vendor_invoice_cost: number;
  margin_percent: number;
}

export interface QuoteCabinetLine extends QuoteCabinet {
  catalog_name: string;
  unit_shop_cost: number;
  extended_shop_cost: number;
  retail: number;
}

export interface QuoteBuyoutLine extends QuoteBuyout {
  retail: number;
}

export interface FinancialSummary {
  shop_materials_total: number;
  shop_labor_hours: number;
  shop_labor_total: number;
  custom_cabinets_shop_cost: number;
  custom_cabinets_retail: number;
  buyout_cost_total: number;
  buyout_retail_total: number;
  total_job_cost: number;
  total_proposal_retail: number;
  total_profit: number;
  blended_margin_percent: number;
}

export interface QuoteDetailResponse {
  quote: Quote;
  box_assembly?: Assembly;
  door_assembly?: Assembly;
  drawer_front_assembly?: Assembly;
  drawer_assembly?: Assembly;
  cabinets: QuoteCabinetLine[];
  buyouts: QuoteBuyoutLine[];
  summary: FinancialSummary;
}

export const QUOTE_STATUSES: SelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export function quoteStatusLabel(status: string): string {
  return QUOTE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function quoteStatusBadge(status: string): string {
  switch (status) {
    case 'sent': return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    case 'approved': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'completed': return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    case 'archived': return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    default: return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
  }
}

export const BUYOUT_CATEGORIES: SelectOption[] = [
  { value: 'outsourced_doors', label: 'Outsourced Doors' },
  { value: 'prefab_cabinets', label: 'Prefab Cabinets' },
  { value: 'specialty_hardware', label: 'Specialty Hardware' },
  { value: 'freight_other', label: 'Freight / Other' },
];

export function buyoutCategoryLabel(category: string): string {
  return BUYOUT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function buyoutCategoryBadge(category: string): string {
  switch (category) {
    case 'outsourced_doors': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'prefab_cabinets': return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
    case 'specialty_hardware': return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    case 'freight_other': return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    default: return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
  }
}

export function retailFromCost(cost: number, marginPercent: number): number {
  if (marginPercent >= 100) return cost;
  return cost / (1 - marginPercent / 100);
}
