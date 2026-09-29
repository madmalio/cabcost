import re

with open("frontend/src/components/CostDrawer.tsx", "r") as f:
    content = f.read()

content = content.replace(
    """api.calculateCabinetCost(
        sku.sku,
        settings.box_assembly_id,
        settings.door_assembly_id,
        settings.drawer_front_assembly_id,
        settings.drawer_assembly_id,
        settings.is_finished,
        settings.has_edge_detail
      )""",
    """api.calculateCabinetCost(
        sku.sku,
        'paint_grade',
        'painted',
        settings.box_assembly_id,
        settings.door_assembly_id,
        settings.drawer_front_assembly_id,
        settings.drawer_assembly_id,
        settings.is_finished,
        settings.has_edge_detail
      )"""
)

with open("frontend/src/components/CostDrawer.tsx", "w") as f:
    f.write(content)

with open("frontend/src/components/QuotesScreen.tsx", "r") as f:
    content = f.read()

content = content.replace(
    """status: 'draft',""",
    """status: 'draft',
      wood_species: 'paint_grade',
      finish_type: 'painted',"""
)

with open("frontend/src/components/QuotesScreen.tsx", "w") as f:
    f.write(content)

with open("frontend/src/components/QuoteWorkbench.tsx", "r") as f:
    content = f.read()

content = content.replace(
    """            api.calculateCabinetCostOverride(
              c.cabinet_sku,
              c.custom_width ?? 0,
              c.custom_height ?? 0,
              c.custom_depth ?? 0,
              quote.box_assembly_id,
              quote.door_assembly_id,
              quote.drawer_front_assembly_id,
              quote.drawer_assembly_id,
              quote.is_finished,
              quote.has_edge_detail
            )""",
    """            api.calculateCabinetCostOverride(
              c.cabinet_sku,
              c.custom_width ?? 0,
              c.custom_height ?? 0,
              c.custom_depth ?? 0,
              quote.wood_species,
              quote.finish_type,
              quote.box_assembly_id,
              quote.door_assembly_id,
              quote.drawer_front_assembly_id,
              quote.drawer_assembly_id,
              quote.is_finished,
              quote.has_edge_detail
            )"""
)

with open("frontend/src/components/QuoteWorkbench.tsx", "w") as f:
    f.write(content)
