import re

with open("frontend/src/components/MaterialModal.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { MATERIAL_ROLES, MATERIAL_UNITS } from '../constants';",
    "import { MATERIAL_ROLES, MATERIAL_UNITS, WOOD_SPECIES } from '../constants';"
)

content = content.replace(
    "const [role, setRole] = useState(material?.role ?? 'box_core');",
    "const [role, setRole] = useState(material?.role ?? 'box_core');\n  const [species, setSpecies] = useState(material?.species ?? 'paint_grade');"
)

content = content.replace(
    "role,\n      unit,",
    "role,\n      species,\n      unit,"
)

select_html = """          <div>
            <label className={labelClass}>Role</label>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
              {MATERIAL_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Species</label>
            <select className={inputClass} value={species} onChange={(e) => setSpecies(e.target.value)}>
              {WOOD_SPECIES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>"""

content = re.sub(r'<div>\s*<label className=\{labelClass\}>Role</label>[\s\S]*?</select>\s*</div>', select_html, content)

with open("frontend/src/components/MaterialModal.tsx", "w") as f:
    f.write(content)
