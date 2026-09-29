import re

with open("internal/store/cost.go", "r") as f:
    content = f.read()

# Update CalculateCabinetCost
content = content.replace(
    "func (s *Store) CalculateCabinetCost(sku string, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID int64, isFinished, edgeDetail bool)",
    "func (s *Store) CalculateCabinetCost(sku string, woodSpecies string, finishType string, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID int64, isFinished, edgeDetail bool)"
)
content = content.replace(
    "return s.calculateCabinet(c, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)",
    "return s.calculateCabinet(c, woodSpecies, finishType, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID, isFinished, edgeDetail)"
)

# Update CalculateCabinetCostOverride
content = content.replace(
    "func (s *Store) CalculateCabinetCostOverride(sku string, width, height, depth float64, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID int64, isFinished, edgeDetail bool)",
    "func (s *Store) CalculateCabinetCostOverride(sku string, width, height, depth float64, woodSpecies string, finishType string, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID int64, isFinished, edgeDetail bool)"
)

# Update calculateCabinet
content = content.replace(
    "func (s *Store) calculateCabinet(c models.Cabinet, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID int64, isFinished, edgeDetail bool)",
    "func (s *Store) calculateCabinet(c models.Cabinet, woodSpecies string, finishType string, boxAssemblyID, doorAssemblyID, drawerFrontAssemblyID, drawerBoxAssemblyID int64, isFinished, edgeDetail bool)"
)

# Replace the material fetching for the specific roles in calculateCabinet
# We need to change:
# faceMat, _, err := s.materialByID(box.FaceLumberID)
# doorFrameMat, _, err := s.materialByID(door.CoreMaterialID)
# doorPanelMat, _, err := s.materialByID(door.PanelMaterialID)
# frontFrameMat, _, err := s.materialByID(drawerFront.CoreMaterialID)
# frontPanelMat, _, err := s.materialByID(drawerFront.PanelMaterialID)

replacement = ""	faceMat, _, err := s.resolveJobMaterial(models.RoleFrameLumber, woodSpecies, finishType, "")
	if faceMat.ID == 0 { faceMat, _, err = s.materialByID(box.FaceLumberID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }

	doorFrameMat, _, err := s.resolveJobMaterial(models.RoleDoorFrame, woodSpecies, finishType, "")
	if doorFrameMat.ID == 0 { doorFrameMat, _, err = s.materialByID(door.CoreMaterialID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }

	doorPanelMat, _, err := s.resolveJobMaterial(models.RoleDoorPanel, woodSpecies, finishType, door.PanelType)
	if doorPanelMat.ID == 0 { doorPanelMat, _, err = s.materialByID(door.PanelMaterialID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }

	frontFrameMat, _, err := s.resolveJobMaterial(models.RoleDoorFrame, woodSpecies, finishType, "")
	if frontFrameMat.ID == 0 { frontFrameMat, _, err = s.materialByID(drawerFront.CoreMaterialID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }

	frontPanelMat, _, err := s.resolveJobMaterial(models.RoleDoorPanel, woodSpecies, finishType, drawerFront.PanelType)
	if frontPanelMat.ID == 0 { frontPanelMat, _, err = s.materialByID(drawerFront.PanelMaterialID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }""

original_mats = ""	faceMat, _, err := s.materialByID(box.FaceLumberID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	boxEdgebandMat, _, err := s.materialByID(box.EdgebandID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	doorFrameMat, _, err := s.materialByID(door.CoreMaterialID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	doorPanelMat, _, err := s.materialByID(door.PanelMaterialID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	frontFrameMat, _, err := s.materialByID(drawerFront.CoreMaterialID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}
	frontPanelMat, _, err := s.materialByID(drawerFront.PanelMaterialID)
	if err != nil {
		return models.CabinetCostBreakdown{}, err
	}""

new_mats = ""	faceMat, _, err := s.resolveJobMaterial(models.RoleFrameLumber, woodSpecies, finishType, "")
	if faceMat.ID == 0 { faceMat, _, _ = s.materialByID(box.FaceLumberID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }

	boxEdgebandMat, _, err := s.materialByID(box.EdgebandID)
	if err != nil { return models.CabinetCostBreakdown{}, err }

	doorFrameMat, _, err := s.resolveJobMaterial(models.RoleDoorFrame, woodSpecies, finishType, "")
	if doorFrameMat.ID == 0 { doorFrameMat, _, _ = s.materialByID(door.CoreMaterialID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }

	doorPanelMat, _, err := s.resolveJobMaterial(models.RoleDoorPanel, woodSpecies, finishType, door.PanelType)
	if doorPanelMat.ID == 0 { doorPanelMat, _, _ = s.materialByID(door.PanelMaterialID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }

	frontFrameMat, _, err := s.resolveJobMaterial(models.RoleDoorFrame, woodSpecies, finishType, "")
	if frontFrameMat.ID == 0 { frontFrameMat, _, _ = s.materialByID(drawerFront.CoreMaterialID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }

	frontPanelMat, _, err := s.resolveJobMaterial(models.RoleDoorPanel, woodSpecies, finishType, drawerFront.PanelType)
	if frontPanelMat.ID == 0 { frontPanelMat, _, _ = s.materialByID(drawerFront.PanelMaterialID) }
	if err != nil { return models.CabinetCostBreakdown{}, err }""

content = content.replace(original_mats, new_mats)

with open("internal/store/cost.go", "w") as f:
    f.write(content)
