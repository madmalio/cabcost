import re

with open("internal/store/quote_finance.go", "r") as f:
    content = f.read()

content = content.replace(
    "s.calculateCabinet(c, q.BoxAssemblyID, q.DoorAssemblyID, q.DrawerFrontAssemblyID, q.DrawerAssemblyID, q.IsFinished, q.HasEdgeDetail)",
    "s.calculateCabinet(c, q.WoodSpecies, q.FinishType, q.BoxAssemblyID, q.DoorAssemblyID, q.DrawerFrontAssemblyID, q.DrawerAssemblyID, q.IsFinished, q.HasEdgeDetail)"
)

with open("internal/store/quote_finance.go", "w") as f:
    f.write(content)
