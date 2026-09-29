import { useState } from 'react';
import Modal from './Modal';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './ui';
import { HARDWARE_CATEGORIES, HARDWARE_UNITS } from '../constants';
import type { Hardware } from '../constants';

interface HardwareModalProps {
  hardware: Hardware | null;
  onClose: () => void;
  onSave: (hardware: Hardware) => void;
}

export default function HardwareModal({ hardware, onClose, onSave }: HardwareModalProps) {
  const [name, setName] = useState(hardware?.name ?? '');
  const [category, setCategory] = useState(hardware?.category ?? 'hinge');
  const [unit, setUnit] = useState(hardware?.unit ?? 'each');
  const [unitCost, setUnitCost] = useState(hardware?.unit_cost.toString() ?? '0');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(unitCost);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (Number.isNaN(cost) || cost < 0) {
      setError('Unit cost must be a non-negative number.');
      return;
    }
    onSave({
      id: hardware?.id ?? 0,
      name: name.trim(),
      category,
      unit,
      unit_cost: cost,
      is_default: hardware?.is_default ?? false,
      created_at: hardware?.created_at ?? '',
    });
  };

  return (
    <Modal title={hardware ? 'Edit Hardware' : 'Add Hardware'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="hardware-name">Name</label>
          <input
            id="hardware-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Blum Soft-Close 110 Hinge + Plate"
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="hardware-category">Category</label>
          <select
            id="hardware-category"
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {HARDWARE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="hardware-unit">Unit</label>
            <select
              id="hardware-unit"
              className={inputClass}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {HARDWARE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="hardware-cost">Unit Cost ($)</label>
            <input
              id="hardware-cost"
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass}>
            {hardware ? 'Save Changes' : 'Add Hardware'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
