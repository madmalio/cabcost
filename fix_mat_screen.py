import re

with open("frontend/src/components/MaterialsScreen.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { materialRoleLabel, materialUnitLabel } from '../constants';",
    "import { materialRoleLabel, materialUnitLabel, speciesLabel } from '../constants';"
)

content = content.replace(
    "<th>Role</th>",
    "<th>Role</th>\n              <th>Species</th>"
)

content = content.replace(
    "<td><span className={badgeClass('zinc')}>{materialRoleLabel(m.role)}</span></td>",
    "<td><span className={badgeClass('zinc')}>{materialRoleLabel(m.role)}</span></td>\n                  <td><span className={badgeClass('slate')}>{speciesLabel(m.species)}</span></td>"
)

with open("frontend/src/components/MaterialsScreen.tsx", "w") as f:
    f.write(content)
