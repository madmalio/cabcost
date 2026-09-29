import re

with open("frontend/src/constants.ts", "r") as f:
    content = f.read()

content = content.replace(
    "role: string;",
    "role: string;\n  species: string;"
)

content = content.replace(
    "status: string;",
    "status: string;\n  wood_species: string;\n  finish_type: string;"
)

content += """
export const WOOD_SPECIES: SelectOption[] = [
  { value: 'paint_grade', label: 'Paint-Grade (MDF/Poplar)' },
  { value: 'alder', label: 'Alder' },
  { value: 'white_oak', label: 'White Oak' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'maple', label: 'Maple' },
  { value: 'walnut', label: 'Walnut' },
  { value: 'universal', label: 'Universal / Core' },
];

export const FINISH_TYPES: SelectOption[] = [
  { value: 'painted', label: 'Painted' },
  { value: 'stained', label: 'Stained' },
  { value: 'unfinished', label: 'Unfinished' },
];

export function speciesLabel(s: string): string {
  return WOOD_SPECIES.find(o => o.value === s)?.label ?? s;
}

export function finishTypeLabel(s: string): string {
  return FINISH_TYPES.find(o => o.value === s)?.label ?? s;
}
"""

with open("frontend/src/constants.ts", "w") as f:
    f.write(content)
