import { useState } from 'react';
import Modal from './Modal';
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from './ui';
import { BUYOUT_CATEGORIES } from '../constants';
import type { QuoteBuyout } from '../constants';

interface BuyoutModalProps {
  buyout: QuoteBuyout | null;
  defaultMargin: number;
  onClose: () => void;
  onSave: (buyout: QuoteBuyout) => void;
}

export default function BuyoutModal({ buyout, defaultMargin, onClose, onSave }: BuyoutModalProps) {
  const [description, setDescription] = useState(buyout?.description ?? '');
  const [category, setCategory] = useState(buyout?.category ?? 'outsourced_doors');
  const [cost, setCost] = useState(buyout?.vendor_invoice_cost.toString() ?? '');
  const [margin, setMargin] = useState((buyout?.margin_percent ?? defaultMargin).toString());
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(cost);
    const m = parseFloat(margin);
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (Number.isNaN(c) || c < 0) {
      setError('Invoice cost must be a non-negative number.');
      return;
    }
    if (Number.isNaN(m) || m < 0) {
      setError('Margin % must be a non-negative number.');
      return;
    }
    onSave({
      id: buyout?.id ?? 0,
      quote_id: buyout?.quote_id ?? 0,
      description: description.trim(),
      category,
      vendor_invoice_cost: c,
      margin_percent: m,
    });
  };

  return (
    <Modal title={buyout ? 'Edit Buyout Line' : 'Add Buyout Line'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="buyout-desc">Description</label>
          <input
            id="buyout-desc"
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Vendor Door Invoice (24 Shaker doors)"
            autoFocus
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="buyout-category">Category</label>
          <select
            id="buyout-category"
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {BUYOUT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="buyout-cost">Vendor Invoice Cost ($)</label>
            <input
              id="buyout-cost"
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="buyout-margin">Margin %</label>
            <input
              id="buyout-margin"
              type="number"
              min="0"
              step="0.1"
              className={inputClass}
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass}>
            {buyout ? 'Save Changes' : 'Add Buyout'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
