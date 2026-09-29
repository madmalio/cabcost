export namespace models {
	
	export class Assembly {
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
	    panel_type: string;
	    frame_joinery: string;
	    finish_labor_hours: number;
	    prep_labor_hours: number;
	    panel_prep_labor_hours: number;
	    build_labor_hours: number;
	    is_default: boolean;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Assembly(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.construction_style = source["construction_style"];
	        this.core_material_id = source["core_material_id"];
	        this.back_material_id = source["back_material_id"];
	        this.panel_material_id = source["panel_material_id"];
	        this.face_lumber_id = source["face_lumber_id"];
	        this.edgeband_id = source["edgeband_id"];
	        this.hardware_id = source["hardware_id"];
	        this.is_outsourced = source["is_outsourced"];
	        this.requires_finish = source["requires_finish"];
	        this.requires_edgeband = source["requires_edgeband"];
	        this.panel_type = source["panel_type"];
	        this.frame_joinery = source["frame_joinery"];
	        this.finish_labor_hours = source["finish_labor_hours"];
	        this.prep_labor_hours = source["prep_labor_hours"];
	        this.panel_prep_labor_hours = source["panel_prep_labor_hours"];
	        this.build_labor_hours = source["build_labor_hours"];
	        this.is_default = source["is_default"];
	        this.created_at = source["created_at"];
	    }
	}
	export class Cabinet {
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
	
	    static createFrom(source: any = {}) {
	        return new Cabinet(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.sku = source["sku"];
	        this.name = source["name"];
	        this.category = source["category"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.depth = source["depth"];
	        this.doors_count = source["doors_count"];
	        this.drawers_count = source["drawers_count"];
	        this.shelves_count = source["shelves_count"];
	        this.base_assembly_hours = source["base_assembly_hours"];
	        this.created_at = source["created_at"];
	    }
	}
	export class CostLine {
	    label: string;
	    amount: number;
	
	    static createFrom(source: any = {}) {
	        return new CostLine(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.label = source["label"];
	        this.amount = source["amount"];
	    }
	}
	export class CabinetCostBreakdown {
	    sku: string;
	    materials: CostLine[];
	    materials_total: number;
	    labor: CostLine[];
	    labor_hours: number;
	    labor_total: number;
	    total_shop_cost: number;
	    suggested_retail: number;
	    margin_percent: number;
	
	    static createFrom(source: any = {}) {
	        return new CabinetCostBreakdown(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sku = source["sku"];
	        this.materials = this.convertValues(source["materials"], CostLine);
	        this.materials_total = source["materials_total"];
	        this.labor = this.convertValues(source["labor"], CostLine);
	        this.labor_hours = source["labor_hours"];
	        this.labor_total = source["labor_total"];
	        this.total_shop_cost = source["total_shop_cost"];
	        this.suggested_retail = source["suggested_retail"];
	        this.margin_percent = source["margin_percent"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class FinancialSummary {
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
	
	    static createFrom(source: any = {}) {
	        return new FinancialSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.shop_materials_total = source["shop_materials_total"];
	        this.shop_labor_hours = source["shop_labor_hours"];
	        this.shop_labor_total = source["shop_labor_total"];
	        this.custom_cabinets_shop_cost = source["custom_cabinets_shop_cost"];
	        this.custom_cabinets_retail = source["custom_cabinets_retail"];
	        this.buyout_cost_total = source["buyout_cost_total"];
	        this.buyout_retail_total = source["buyout_retail_total"];
	        this.total_job_cost = source["total_job_cost"];
	        this.total_proposal_retail = source["total_proposal_retail"];
	        this.total_profit = source["total_profit"];
	        this.blended_margin_percent = source["blended_margin_percent"];
	    }
	}
	export class Hardware {
	    id: number;
	    name: string;
	    category: string;
	    unit: string;
	    unit_cost: number;
	    is_default: boolean;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Hardware(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.category = source["category"];
	        this.unit = source["unit"];
	        this.unit_cost = source["unit_cost"];
	        this.is_default = source["is_default"];
	        this.created_at = source["created_at"];
	    }
	}
	export class Material {
	    id: number;
	    name: string;
	    role: string;
	    species: string;
	    unit: string;
	    unit_cost: number;
	    waste_percent: number;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Material(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.role = source["role"];
	        this.species = source["species"];
	        this.unit = source["unit"];
	        this.unit_cost = source["unit_cost"];
	        this.waste_percent = source["waste_percent"];
	        this.created_at = source["created_at"];
	    }
	}
	export class Quote {
	    id: number;
	    job_name: string;
	    client_name: string;
	    client_phone: string;
	    status: string;
	    wood_species: string;
	    finish_type: string;
	    box_assembly_id: number;
	    door_assembly_id: number;
	    drawer_front_assembly_id: number;
	    drawer_assembly_id: number;
	    is_finished: boolean;
	    has_edge_detail: boolean;
	    target_margin_percent: number;
	    prefab_margin_percent: number;
	    notes: string;
	    created_at: string;
	    updated_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Quote(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.job_name = source["job_name"];
	        this.client_name = source["client_name"];
	        this.client_phone = source["client_phone"];
	        this.status = source["status"];
	        this.wood_species = source["wood_species"];
	        this.finish_type = source["finish_type"];
	        this.box_assembly_id = source["box_assembly_id"];
	        this.door_assembly_id = source["door_assembly_id"];
	        this.drawer_front_assembly_id = source["drawer_front_assembly_id"];
	        this.drawer_assembly_id = source["drawer_assembly_id"];
	        this.is_finished = source["is_finished"];
	        this.has_edge_detail = source["has_edge_detail"];
	        this.target_margin_percent = source["target_margin_percent"];
	        this.prefab_margin_percent = source["prefab_margin_percent"];
	        this.notes = source["notes"];
	        this.created_at = source["created_at"];
	        this.updated_at = source["updated_at"];
	    }
	}
	export class QuoteBuyout {
	    id: number;
	    quote_id: number;
	    category: string;
	    description: string;
	    vendor_invoice_cost: number;
	    margin_percent: number;
	
	    static createFrom(source: any = {}) {
	        return new QuoteBuyout(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.quote_id = source["quote_id"];
	        this.category = source["category"];
	        this.description = source["description"];
	        this.vendor_invoice_cost = source["vendor_invoice_cost"];
	        this.margin_percent = source["margin_percent"];
	    }
	}
	export class QuoteBuyoutLine {
	    id: number;
	    quote_id: number;
	    category: string;
	    description: string;
	    vendor_invoice_cost: number;
	    margin_percent: number;
	    retail: number;
	
	    static createFrom(source: any = {}) {
	        return new QuoteBuyoutLine(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.quote_id = source["quote_id"];
	        this.category = source["category"];
	        this.description = source["description"];
	        this.vendor_invoice_cost = source["vendor_invoice_cost"];
	        this.margin_percent = source["margin_percent"];
	        this.retail = source["retail"];
	    }
	}
	export class QuoteCabinet {
	    id: number;
	    quote_id: number;
	    cabinet_sku: string;
	    quantity: number;
	    custom_width?: number;
	    custom_height?: number;
	    custom_depth?: number;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new QuoteCabinet(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.quote_id = source["quote_id"];
	        this.cabinet_sku = source["cabinet_sku"];
	        this.quantity = source["quantity"];
	        this.custom_width = source["custom_width"];
	        this.custom_height = source["custom_height"];
	        this.custom_depth = source["custom_depth"];
	        this.notes = source["notes"];
	    }
	}
	export class QuoteCabinetLine {
	    id: number;
	    quote_id: number;
	    cabinet_sku: string;
	    quantity: number;
	    custom_width?: number;
	    custom_height?: number;
	    custom_depth?: number;
	    notes: string;
	    catalog_name: string;
	    unit_shop_cost: number;
	    extended_shop_cost: number;
	    retail: number;
	
	    static createFrom(source: any = {}) {
	        return new QuoteCabinetLine(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.quote_id = source["quote_id"];
	        this.cabinet_sku = source["cabinet_sku"];
	        this.quantity = source["quantity"];
	        this.custom_width = source["custom_width"];
	        this.custom_height = source["custom_height"];
	        this.custom_depth = source["custom_depth"];
	        this.notes = source["notes"];
	        this.catalog_name = source["catalog_name"];
	        this.unit_shop_cost = source["unit_shop_cost"];
	        this.extended_shop_cost = source["extended_shop_cost"];
	        this.retail = source["retail"];
	    }
	}
	export class QuoteDetailResponse {
	    quote: Quote;
	    box_assembly?: Assembly;
	    door_assembly?: Assembly;
	    drawer_front_assembly?: Assembly;
	    drawer_assembly?: Assembly;
	    cabinets: QuoteCabinetLine[];
	    buyouts: QuoteBuyoutLine[];
	    summary: FinancialSummary;
	
	    static createFrom(source: any = {}) {
	        return new QuoteDetailResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.quote = this.convertValues(source["quote"], Quote);
	        this.box_assembly = this.convertValues(source["box_assembly"], Assembly);
	        this.door_assembly = this.convertValues(source["door_assembly"], Assembly);
	        this.drawer_front_assembly = this.convertValues(source["drawer_front_assembly"], Assembly);
	        this.drawer_assembly = this.convertValues(source["drawer_assembly"], Assembly);
	        this.cabinets = this.convertValues(source["cabinets"], QuoteCabinetLine);
	        this.buyouts = this.convertValues(source["buyouts"], QuoteBuyoutLine);
	        this.summary = this.convertValues(source["summary"], FinancialSummary);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class QuoteListItem {
	    id: number;
	    job_name: string;
	    client_name: string;
	    status: string;
	    total_cabinets: number;
	    total_retail_price: number;
	    updated_at: string;
	
	    static createFrom(source: any = {}) {
	        return new QuoteListItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.job_name = source["job_name"];
	        this.client_name = source["client_name"];
	        this.status = source["status"];
	        this.total_cabinets = source["total_cabinets"];
	        this.total_retail_price = source["total_retail_price"];
	        this.updated_at = source["updated_at"];
	    }
	}
	export class ShopSettings {
	    id: number;
	    loaded_labor_rate: number;
	    finishing_labor_rate_sqft: number;
	    manual_edgeband_min_per_ft: number;
	    default_margin_percent: number;
	    shop_supplies_percent: number;
	
	    static createFrom(source: any = {}) {
	        return new ShopSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.loaded_labor_rate = source["loaded_labor_rate"];
	        this.finishing_labor_rate_sqft = source["finishing_labor_rate_sqft"];
	        this.manual_edgeband_min_per_ft = source["manual_edgeband_min_per_ft"];
	        this.default_margin_percent = source["default_margin_percent"];
	        this.shop_supplies_percent = source["shop_supplies_percent"];
	    }
	}

}

