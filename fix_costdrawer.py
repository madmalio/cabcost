import re

with open("frontend/src/components/CostDrawer.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "api.calculateCabinetCost(cabinet.sku, boxId, doorId, frontId, drawerId, isFinished, edgeDetail);",
    "api.calculateCabinetCost(cabinet.sku, 'paint_grade', 'painted', boxId, doorId, frontId, drawerId, isFinished, edgeDetail);"
)

with open("frontend/src/components/CostDrawer.tsx", "w") as f:
    f.write(content)

with open("frontend/src/components/QuoteWorkbench.tsx", "r") as f:
    content = f.read()

content = content.replace(
    """              quote.box_assembly_id,
              quote.door_assembly_id,
              quote.drawer_front_assembly_id,
              quote.drawer_assembly_id,
              quote.is_finished,
              quote.has_edge_detail,""",
    """              quote.wood_species,
              quote.finish_type,
              quote.box_assembly_id,
              quote.door_assembly_id,
              quote.drawer_front_assembly_id,
              quote.drawer_assembly_id,
              quote.is_finished,
              quote.has_edge_detail,"""
)

with open("frontend/src/components/QuoteWorkbench.tsx", "w") as f:
    f.write(content)
