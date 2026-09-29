import re

with open("frontend/src/api.ts", "r") as f:
    content = f.read()

content = content.replace(
    "CalculateCabinetCost(sku, boxAssemblyId, doorAssemblyId, drawerFrontAssemblyId, drawerBoxAssemblyId, isFinished, edgeDetail),",
    "CalculateCabinetCost(sku, woodSpecies, finishType, boxAssemblyId, doorAssemblyId, drawerFrontAssemblyId, drawerBoxAssemblyId, isFinished, edgeDetail),"
)
content = content.replace(
    """  calculateCabinetCost: (
    sku: string,
    boxAssemblyId: number,""",
    """  calculateCabinetCost: (
    sku: string,
    woodSpecies: string,
    finishType: string,
    boxAssemblyId: number,"""
)


content = content.replace(
    "CalculateCabinetCostOverride(sku, width, height, depth, boxAssemblyId, doorAssemblyId, drawerFrontAssemblyId, drawerBoxAssemblyId, isFinished, edgeDetail),",
    "CalculateCabinetCostOverride(sku, width, height, depth, woodSpecies, finishType, boxAssemblyId, doorAssemblyId, drawerFrontAssemblyId, drawerBoxAssemblyId, isFinished, edgeDetail),"
)
content = content.replace(
    """  calculateCabinetCostOverride: (
    sku: string,
    width: number,
    height: number,
    depth: number,
    boxAssemblyId: number,""",
    """  calculateCabinetCostOverride: (
    sku: string,
    width: number,
    height: number,
    depth: number,
    woodSpecies: string,
    finishType: string,
    boxAssemblyId: number,"""
)

with open("frontend/src/api.ts", "w") as f:
    f.write(content)
