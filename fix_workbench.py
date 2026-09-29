import re

with open("frontend/src/components/QuoteWorkbench.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { quoteStatusLabel, QUOTE_STATUSES } from '../constants';",
    "import { quoteStatusLabel, QUOTE_STATUSES, WOOD_SPECIES, FINISH_TYPES } from '../constants';"
)

content = content.replace(
    "quote?.is_finished, quote?.has_edge_detail, quote?.target_margin_percent, cabinets, buyouts]);",
    "quote?.wood_species, quote?.finish_type, quote?.is_finished, quote?.has_edge_detail, quote?.target_margin_percent, cabinets, buyouts]);"
)

content = content.replace(
    """            api.calculateCabinetCostOverride(
              c.cabinet_sku,
              c.custom_width ?? 0,
              c.custom_height ?? 0,
              c.custom_depth ?? 0,
              quote.box_assembly_id,""",
    """            api.calculateCabinetCostOverride(
              c.cabinet_sku,
              c.custom_width ?? 0,
              c.custom_height ?? 0,
              c.custom_depth ?? 0,
              quote.wood_species,
              quote.finish_type,
              quote.box_assembly_id,"""
)

dropdowns = """                  </div>
                  <div>
                    <label className={labelClass}>Wood Species</label>
                    <select className={inputClass} value={quote.wood_species} onChange={(e) => patchQuote({ wood_species: e.target.value })}>
                      {WOOD_SPECIES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Finish Type</label>
                    <select className={inputClass} value={quote.finish_type} onChange={(e) => patchQuote({ finish_type: e.target.value })}>
                      {FINISH_TYPES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Box Assembly</label>"""

content = content.replace(
    """                  </div>
                  <div>
                    <label className={labelClass}>Box Assembly</label>""",
    dropdowns
)

with open("frontend/src/components/QuoteWorkbench.tsx", "w") as f:
    f.write(content)
