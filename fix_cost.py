import re

with open("internal/store/cost.go", "r") as f:
    content = f.read()

helper = ""
// resolveJobMaterial resolves the material based on the job's species and finish type.
func (s *Store) resolveJobMaterial(role string, woodSpecies string, finishType string, panelType string) (models.Material, bool, error) {
	var m models.Material
	var err error
	_ = m
	_ = err
	
	queryMaterial := func(targetRole, targetSpecies string) (models.Material, bool, error) {
		mat, e := scanMaterial(s.db.QueryRow("SELECT "+materialCols+" FROM materials WHERE role = ? AND species = ? ORDER BY id LIMIT 1", targetRole, targetSpecies))
		if e == sql.ErrNoRows {
			return models.Material{}, false, nil
		}
		if e != nil {
			return models.Material{}, false, e
		}
		return mat, true, nil
	}

	queryFrames := func(targetSpecies string) (models.Material, bool, error) {
		mat, e := scanMaterial(s.db.QueryRow("SELECT "+materialCols+" FROM materials WHERE (role = ? OR role = ?) AND species = ? ORDER BY id LIMIT 1", models.RoleDoorFrame, models.RoleFrameLumber, targetSpecies))
		if e == sql.ErrNoRows {
			return models.Material{}, false, nil
		}
		if e != nil {
			return models.Material{}, false, e
		}
		return mat, true, nil
	}

	switch role {
	case models.RoleFrameLumber:
		speciesToUse := woodSpecies
		if finishType == models.FinishPainted {
			speciesToUse = models.SpeciesPaintGrade
		}
		return queryMaterial(models.RoleFrameLumber, speciesToUse)

	case models.RoleDoorFrame:
		return queryFrames(woodSpecies)

	case models.RoleDoorPanel:
		if panelType == models.PanelTypeFlat {
			if finishType == models.FinishPainted {
				return queryMaterial(models.RoleDoorPanel, models.SpeciesPaintGrade)
			}
			return queryMaterial(models.RoleDoorPanel, woodSpecies)
		} else if panelType == models.PanelTypeRaisedSheet {
			return queryMaterial(models.RoleSlabSheet, models.SpeciesPaintGrade)
		} else if panelType == models.PanelTypeRaisedSolid {
			return queryFrames(woodSpecies)
		}
	}
	return models.Material{}, false, nil
}
""

if "resolveJobMaterial" not in content:
    content = content.replace("func round2(v float64) float64 {", helper + "\nfunc round2(v float64) float64 {")

with open("internal/store/cost.go", "w") as f:
    f.write(content)
