import re

with open("app.go", "r") as f:
    content = f.read()

content = content.replace(
    "func (a *App) CalculateCabinetCost(sku string, boxAssemblyID int64, doorAssemblyID int64, drawerFrontAssemblyID int64, drawerBoxAssemblyID int64, isFinished bool, edgeDetail bool)",
    "func (a *App) CalculateCabinetCost(sku string, woodSpecies string, finishType string, boxAssemblyID int64, doorAssemblyID int64, drawerFrontAssemblyID int64, drawerBoxAssemblyID int64, isFinished bool, edgeDetail bool)"
)

content = content.replace(
    "return s.CalculateCabinetCost(sku, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)",
    "return s.CalculateCabinetCost(sku, woodSpecies, finishType, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)"
)

content = content.replace(
    "func (a *App) CalculateCabinetCostOverride(sku string, width float64, height float64, depth float64, boxAssemblyID int64, doorAssemblyID int64, drawerFrontAssemblyID int64, drawerBoxAssemblyID int64, isFinished bool, edgeDetail bool)",
    "func (a *App) CalculateCabinetCostOverride(sku string, width float64, height float64, depth float64, woodSpecies string, finishType string, boxAssemblyID int64, doorAssemblyID int64, drawerFrontAssemblyID int64, drawerBoxAssemblyID int64, isFinished bool, edgeDetail bool)"
)

content = content.replace(
    "return s.CalculateCabinetCostOverride(sku, width, height, depth, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)",
    "return s.CalculateCabinetCostOverride(sku, width, height, depth, woodSpecies, finishType, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)"
)

with open("app.go", "w") as f:
    f.write(content)
