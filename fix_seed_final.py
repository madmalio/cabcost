
import re

with open("internal/db/seed.go", "r") as f:
    content = f.read()

# Update seedMaterial struct
content = content.replace(
    "type seedMaterial struct {\n\tname   string\n\trole   string",
    "type seedMaterial struct {\n\tname   string\n\trole   string\n\tspecies string"
)

# Update seedMaterials array values
old_materials = """var seedMaterials = []seedMaterial{
	{`1/2" Prefinished Birch Plywood`, models.RoleBoxCore, models.UnitSheet4x8, 58.00, 15.0},
	{`5/8" White Melamine`, models.RoleBoxCore, models.UnitSheet4x8, 42.00, 15.0},
	{`3/4" Prefinished Birch Plywood`, models.RoleBoxCore, models.UnitSheet4x8, 75.00, 15.0},
	{`1/4" Prefinished Birch Plywood`, models.RoleBoxBack, models.UnitSheet4x8, 42.00, 10.0},
	{`1/4" White Hardboard / Melamine Back`, models.RoleBoxBack, models.UnitSheet4x8, 24.00, 10.0},
	{`4/4 Select Poplar (Paint-Grade)`, models.RoleFrameLumber, models.UnitBoardFoot, 4.00, 20.0},
	{`4/4 Superior Alder`, models.RoleFrameLumber, models.UnitBoardFoot, 5.50, 25.0},
	{`4/4 Select Poplar (Door Stock)`, models.RoleDoorFrame, models.UnitBoardFoot, 4.25, 20.0},
	{`1/4" MDF (Door Panel)`, models.RoleDoorPanel, models.UnitSheet4x8, 32.00, 10.0},
	{`5/8" Prefinished Baltic Birch`, models.RoleDrawerSide, models.UnitSheet4x8, 68.00, 15.0},
	{`1/2" White Melamine`, models.RoleDrawerSide, models.UnitSheet4x8, 36.00, 15.0},
	{`1/2" 5x5 9-Ply Russian Birch`, models.RoleDrawerSide, models.UnitSheet5x5, 38.00, 15.0},
	{`3/4" MDF (Slab)`, models.RoleSlabSheet, models.UnitSheet4x8, 48.00, 15.0},
	{`White PVC Edgeband (15/16")`, models.RoleEdgeband, models.UnitLinearFoot, 0.18, 10.0},
	{`Post-Cat Conversion Varnish / Paint`, models.RoleFinishing, models.UnitSqFt, 1.50, 15.0},
}"""

new_materials = """var seedMaterials = []seedMaterial{
	{`1/2" Prefinished Birch Plywood`, models.RoleBoxCore, models.SpeciesUniversal, models.UnitSheet4x8, 58.00, 15.0},
	{`5/8" White Melamine`, models.RoleBoxCore, models.SpeciesUniversal, models.UnitSheet4x8, 42.00, 15.0},
	{`3/4" Prefinished Birch Plywood`, models.RoleBoxCore, models.SpeciesUniversal, models.UnitSheet4x8, 75.00, 15.0},
	{`1/4" Prefinished Birch Plywood`, models.RoleBoxBack, models.SpeciesUniversal, models.UnitSheet4x8, 42.00, 10.0},
	{`1/4" White Hardboard / Melamine Back`, models.RoleBoxBack, models.SpeciesUniversal, models.UnitSheet4x8, 24.00, 10.0},
	{`4/4 Select Poplar (Paint-Grade)`, models.RoleFrameLumber, models.SpeciesPaintGrade, models.UnitBoardFoot, 4.00, 20.0},
	{`4/4 Superior Alder`, models.RoleFrameLumber, models.SpeciesAlder, models.UnitBoardFoot, 5.50, 25.0},
	{`4/4 Select Poplar (Door Stock)`, models.RoleDoorFrame, models.SpeciesPaintGrade, models.UnitBoardFoot, 4.25, 20.0},
	{`1/4" MDF (Door Panel)`, models.RoleDoorPanel, models.SpeciesPaintGrade, models.UnitSheet4x8, 32.00, 10.0},
	{`5/8" Prefinished Baltic Birch`, models.RoleDrawerSide, models.SpeciesUniversal, models.UnitSheet4x8, 68.00, 15.0},
	{`1/2" White Melamine`, models.RoleDrawerSide, models.SpeciesUniversal, models.UnitSheet4x8, 36.00, 15.0},
	{`1/2" 5x5 9-Ply Russian Birch`, models.RoleDrawerSide, models.SpeciesUniversal, models.UnitSheet5x5, 38.00, 15.0},
	{`3/4" MDF (Slab)`, models.RoleSlabSheet, models.SpeciesPaintGrade, models.UnitSheet4x8, 48.00, 15.0},
	{`White PVC Edgeband (15/16")`, models.RoleEdgeband, models.SpeciesUniversal, models.UnitLinearFoot, 0.18, 10.0},
	{`Post-Cat Conversion Varnish / Paint`, models.RoleFinishing, models.SpeciesUniversal, models.UnitSqFt, 1.50, 15.0},
}"""

content = content.replace(old_materials, new_materials)

# Also update the INSERT statement
content = content.replace(
    "`INSERT INTO materials (name, role, unit, unit_cost, waste_percent) VALUES (?, ?, ?, ?, ?)`,\n\t\t\t\tm.name, m.role, m.unit, m.cost, m.waste,",
    "`INSERT INTO materials (name, role, species, unit, unit_cost, waste_percent) VALUES (?, ?, ?, ?, ?, ?)`,\n\t\t\t\tm.name, m.role, m.species, m.unit, m.cost, m.waste,"
)

new_assemblies = """var seedAssemblyItems = []seedAssembly{
	{
		name:         `Face Frame Box`,
		assemblyType: models.AssemblyTypeBox,
		style:        models.StyleFaceFrame,
		core:         `1/2" Prefinished Birch Plywood`,
		back:         `1/4" Prefinished Birch Plywood`,
		faceLumber:   `4/4 Select Poplar (Paint-Grade)`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		buildLabor:   0.0,
		isDefault:    true,
	},
	{
		name:         `Frameless Melamine Box`,
		assemblyType: models.AssemblyTypeBox,
		style:        models.StyleFrameless,
		core:         `5/8" White Melamine`,
		back:         `1/4" White Hardboard / Melamine Back`,
		edgeband:     `White PVC Edgeband (15/16")`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		buildLabor:   0.0,
		isDefault:    false,
	},
	{
		name:         `5-Piece Shaker Door`,
		assemblyType: models.AssemblyTypeDoor,
		style:        models.StyleFaceFrame,
		core:         `4/4 Select Poplar (Door Stock)`,
		panel:        `1/4" MDF (Door Panel)`,
		hardware:     `Blum Soft-Close 110 Hinge + Plate`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: false,
		buildLabor:   0.9,
		isDefault:    true,
	},
	{
		name:           `Solid Raised Panel Door`,
		assemblyType:   models.AssemblyTypeDoor,
		style:          models.StyleFaceFrame,
		core:           `4/4 Superior Alder`,
		panel:          `4/4 Superior Alder`,
		hardware:       `Blum Soft-Close 110 Hinge + Plate`,
		panelType:      models.PanelTypeRaisedSolid,
		frameJoinery:   models.FrameJoineryCopeAndStick,
		isOutsourced:   false,
		panelPrepLabor: 0.4,
		buildLabor:     1.1,
		isDefault:      false,
	},
	{
		name:         `MDF Raised Panel Door`,
		assemblyType: models.AssemblyTypeDoor,
		style:        models.StyleFaceFrame,
		core:         `4/4 Select Poplar (Door Stock)`,
		panel:        `3/4" MDF (Slab)`,
		hardware:     `Blum Soft-Close 110 Hinge + Plate`,
		panelType:    models.PanelTypeRaisedSheet,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: false,
		buildLabor:   1.1,
		isDefault:    false,
	},
	{
		name:         `Slab Door`,
		assemblyType: models.AssemblyTypeDoor,
		style:        models.StyleFaceFrame,
		core:         `3/4" MDF (Slab)`,
		hardware:     `Blum Soft-Close 110 Hinge + Plate`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoinerySlab,
		isOutsourced: false,
		buildLabor:   0.3,
		isDefault:    false,
	},
	{
		name:         `Outsourced Raw Door`,
		assemblyType: models.AssemblyTypeDoor,
		style:        models.StyleFaceFrame,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: true,
		prepLabor:    0.08,
		isDefault:    false,
	},
	{
		name:         `Matching 5-Piece Shaker Front`,
		assemblyType: models.AssemblyTypeDrawerFront,
		style:        models.StyleFaceFrame,
		core:         `4/4 Select Poplar (Door Stock)`,
		panel:        `1/4" MDF (Door Panel)`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: false,
		buildLabor:   0.7,
		isDefault:    true,
	},
	{
		name:         `Solid Slab Front`,
		assemblyType: models.AssemblyTypeDrawerFront,
		style:        models.StyleFaceFrame,
		core:         `3/4" MDF (Slab)`,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoinerySlab,
		isOutsourced: false,
		buildLabor:   0.25,
		isDefault:    false,
	},
	{
		name:         `Outsourced Raw Front`,
		assemblyType: models.AssemblyTypeDrawerFront,
		style:        models.StyleFaceFrame,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: true,
		prepLabor:    0.05,
		isDefault:    false,
	},
	{
		name:             `5/8" Dovetail Birch (Undermount)`,
		assemblyType:     models.AssemblyTypeDrawerBox,
		style:            models.StyleFaceFrame,
		core:             `1/2" 5x5 9-Ply Russian Birch`,
		back:             `1/4" Prefinished Birch Plywood`,
		hardware:         `Blum 21" Undermount Soft-Close Slides (Pair)`,
		isOutsourced:     false,
		requiresFinish:   true,
		requiresEdgeband: false,
		panelType:        models.PanelTypeFlat,
		frameJoinery:     models.FrameJoineryCopeAndStick,
		finishLabor:      0.1,
		buildLabor:       0.4,
		isDefault:        true,
	},
	{
		name:             `Standard Stapled Melamine (Side-Mount)`,
		assemblyType:     models.AssemblyTypeDrawerBox,
		style:            models.StyleFaceFrame,
		core:             `5/8" White Melamine`,
		back:             `1/4" White Hardboard / Melamine Back`,
		hardware:         `Side-Mount Ball Bearing Slides 22" (Pair)`,
		isOutsourced:     false,
		requiresFinish:   false,
		requiresEdgeband: true,
		panelType:        models.PanelTypeFlat,
		frameJoinery:     models.FrameJoineryCopeAndStick,
		finishLabor:      0.0,
		buildLabor:       0.25,
		isDefault:        false,
	},
	{
		name:         `Outsourced / Buyout Drawer Box`,
		assemblyType: models.AssemblyTypeDrawerBox,
		style:        models.StyleFaceFrame,
		panelType:    models.PanelTypeFlat,
		frameJoinery: models.FrameJoineryCopeAndStick,
		isOutsourced: true,
		prepLabor:    0.08,
		isDefault:    false,
	},
}"""

content = re.sub(r"var seedAssemblyItems = \[\]seedAssembly\{[\s\S]*?\n\}", new_assemblies, content)

with open("internal/db/seed.go", "w") as f:
    f.write(content)

