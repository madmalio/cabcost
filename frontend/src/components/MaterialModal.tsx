import { useState } from 'react';
import Modal from './Modal';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './ui';
import { MATERIAL_ROLES, MATERIAL_UNITS, WOOD_SPECIES } from '../constants';
import type { Material } from '../constants';

interface MaterialModalProps {
  material: Material | null;
  onClose: () => void;
  onSave: (material: Material) => void;
}

export default function MaterialModal({ material, onClose, onSave }: MaterialModalProps) {
  const [name, setName] = useState(material?.name ?? '');
  const [role, setRole] = useState(material?.role ?? 'box_core');
  const [species, setSpecies] = useState(material?.species ?? 'paint_grade');
  const [unit, setUnit] = useState(material?.unit ?? 'sheet_4x8');
  const [unitCost, setUnitCost] = useState(material?.unit_cost.toString() ?? '0');
  const [waste, setWaste] = useState(material?.waste_percent.toString() ?? '15');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(unitCost);
    const wastePct = parseFloat(waste);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (Number.isNaN(cost) || cost < 0) {
      setError('Unit cost must be a non-negative number.');
      return;
    }
    if (Number.isNaN(wastePct) || wastePct < 0) {
      setError('Waste % must be a non-negative number.');
      return;
    }
    onSave({
      id: material?.id ?? 0,
      name: name.trim(),
      role,
      species,
      unit,
      unit_cost: cost,
      waste_percent: wastePct,
      created_at: material?.created_at ?? '',
    });
  };

  return (
    <Modal title={material ? 'Edit Material' : 'Add Material'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="material-name">Name</label>
          <input
            id="material-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. 3/4" Prefinished Birch Plywood'
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="material-role">Role</label>
          <select
            id="material-role"
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {MATERIAL_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="material-unit">Unit</label>
            <select
              id="material-unit"
              className={inputClass}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {MATERIAL_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="material-cost">Unit Cost ($)</label>
            <input
              id="material-cost"
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="material-waste">Waste %</label>
          <input
            id="material-waste"
            type="number"
            min="0"
            step="0.1"
            className={inputClass}
            value={waste}
            onChange={(e) => setWaste(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass}>
            {material ? 'Save Changes' : 'Add Material'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
