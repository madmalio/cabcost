import { useState } from 'react';
import Modal from './Modal';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './ui';
import { CABINET_CATEGORIES } from '../constants';
import type { Cabinet } from '../constants';

interface SkuModalProps {
  cabinet: Cabinet | null;
  onClose: () => void;
  onSave: (cabinet: Cabinet) => void;
}

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

export default function SkuModal({ cabinet, onClose, onSave }: SkuModalProps) {
  const [sku, setSku] = useState(cabinet?.sku ?? '');
  const [name, setName] = useState(cabinet?.name ?? '');
  const [category, setCategory] = useState(cabinet?.category ?? 'base');
  const [width, setWidth] = useState(cabinet?.width.toString() ?? '');
  const [height, setHeight] = useState(cabinet?.height.toString() ?? '');
  const [depth, setDepth] = useState(cabinet?.depth.toString() ?? '');
  const [doors, setDoors] = useState(cabinet?.doors_count.toString() ?? '0');
  const [drawers, setDrawers] = useState(cabinet?.drawers_count.toString() ?? '0');
  const [shelves, setShelves] = useState(cabinet?.shelves_count.toString() ?? '0');
  const [hours, setHours] = useState(cabinet?.base_assembly_hours.toString() ?? '0');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) {
      setError('SKU is required.');
      return;
    }
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (num(width) <= 0 || num(height) <= 0 || num(depth) <= 0) {
      setError('Width, height, and depth must be positive.');
      return;
    }
    onSave({
      id: cabinet?.id ?? 0,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      width: num(width),
      height: num(height),
      depth: num(depth),
      doors_count: Math.max(0, Math.round(num(doors))),
      drawers_count: Math.max(0, Math.round(num(drawers))),
      shelves_count: Math.max(0, Math.round(num(shelves))),
      base_assembly_hours: Math.max(0, num(hours)),
      created_at: cabinet?.created_at ?? '',
    });
  };

  return (
    <Modal title={cabinet ? 'Edit SKU' : 'Add SKU'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="sku-sku">SKU</label>
            <input
              id="sku-sku"
              className={inputClass}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="B36"
              autoFocus
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="sku-category">Category</label>
            <select
              id="sku-category"
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CABINET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="sku-name">Name</label>
          <input
            id="sku-name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. 36" Base Cabinet'
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="sku-width">Width (in)</label>
            <input id="sku-width" type="number" min="0" step="0.5" className={inputClass} value={width} onChange={(e) => setWidth(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="sku-height">Height (in)</label>
            <input id="sku-height" type="number" min="0" step="0.5" className={inputClass} value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="sku-depth">Depth (in)</label>
            <input id="sku-depth" type="number" min="0" step="0.5" className={inputClass} value={depth} onChange={(e) => setDepth(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass} htmlFor="sku-doors">Doors</label>
            <input id="sku-doors" type="number" min="0" step="1" className={inputClass} value={doors} onChange={(e) => setDoors(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="sku-drawers">Drawers</label>
            <input id="sku-drawers" type="number" min="0" step="1" className={inputClass} value={drawers} onChange={(e) => setDrawers(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="sku-shelves">Shelves</label>
            <input id="sku-shelves" type="number" min="0" step="1" className={inputClass} value={shelves} onChange={(e) => setShelves(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="sku-hours">Base Assembly Hours</label>
          <input id="sku-hours" type="number" min="0" step="0.1" className={inputClass} value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass}>
            {cabinet ? 'Save Changes' : 'Add SKU'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
